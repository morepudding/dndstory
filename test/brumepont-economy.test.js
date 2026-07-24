const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { StoryRepository } = require('../src/server/story-repository');
const { simulateCombat } = require('../tools/simulate-combat');
const { tempStore } = require('./helpers');

function setup(existing = null, { gold = 12 } = {}) {
  const base = existing || tempStore();
  if (!existing) {
    base.store.transaction((draft) => {
      const progression = draft.character.progression;
      progression.level = 2;
      progression.gold = gold;
      progression.claimedRewardIds = ['route-des-ronces-premiere-victoire'];
      progression.unspentStatPoints = 0;
      progression.stats.strength = 2;
      return draft;
    });
  }
  const service = new ConversationService({
    store: base.store,
    gateway: {},
    diagnostics: new DevelopmentDiagnostics({ enabled: true }),
    storyRepository: new StoryRepository(),
  });
  return { ...base, service };
}

function playSteps(service, steps) {
  for (const step of steps) {
    const combat = service.readStory().combat;
    if (!combat) break;
    if (step === 'action:terminer') service.endCombatTurn();
    else if (step === 'réaction:aucune') service.passCombatReaction();
    else if (step === 'objet:potion-de-soin') service.useCombatItem('healing-potion');
    else {
      const [, cardId] = step.split(':');
      const card = combat.cards.find((candidate) => candidate.id === cardId && candidate.available);
      assert.ok(card, `La carte ${cardId} doit être jouable pour reproduire la simulation.`);
      service.playCombatCard(card.instanceId);
    }
  }
  return service.readStory();
}

function reachOffers(service) {
  const started = service.startStory();
  assert.equal(started.storyId, 'la-nuit-a-brumepont');
  service.chooseStoryOption('ancrage-pieces');
  return service.readStory();
}

function sufferTwoEnemyTurns(service) {
  for (let turn = 0; turn < 2; turn += 1) {
    service.endCombatTurn();
    while (service.readStory().combat?.phase === 'reaction') service.passCombatReaction();
  }
}

test('le relais transforme les douze pièces en choix incompatibles et persistants', () => {
  const context = setup();
  const offers = reachOffers(context.service);
  assert.deepEqual(
    offers.choices.map((choice) => [choice.id, choice.available]),
    [
      ['acheter-potion', true],
      ['payer-guide', true],
      ['prendre-repas', true],
      ['garder-bourse', true],
    ],
  );

  const bought = context.service.chooseStoryOption('acheter-potion').story;
  assert.equal(bought.inCombat, true);
  let progression = context.store.read().character.progression;
  assert.equal(progression.gold, 4);
  assert.equal(progression.inventory['healing-potion'], 1);
  assert.equal(progression.transactionHistory.length, 1);
  assert.equal(progression.transactionHistory[0].offerId, 'relais-potion-soin');

  const reopened = setup({
    dir: context.dir,
    file: context.file,
    store: new CharacterStore(context.file),
  });
  progression = reopened.store.read().character.progression;
  assert.equal(progression.gold, 4);
  assert.equal(progression.inventory['healing-potion'], 1);
  assert.equal(reopened.service.readStory().storyId, 'la-nuit-a-brumepont');
  assert.equal(reopened.service.readStory().inCombat, true);
});

test('la potion soigne en combat, coûte une Action et disparaît seulement après usage', () => {
  const context = setup();
  reachOffers(context.service);
  context.service.chooseStoryOption('acheter-potion');
  const beforeFullHealth = context.store.read();
  assert.throws(
    () => context.service.useCombatItem('healing-potion'),
    (error) => error.code === 'COMBAT_HEALING_NOT_NEEDED',
  );
  assert.deepEqual(context.store.read(), beforeFullHealth);

  sufferTwoEnemyTurns(context.service);
  const before = context.service.readStory().combat;
  assert.equal(before.player.hp, 2);
  const result = context.service.useCombatItem('healing-potion');
  assert.equal(result.healed, 5);
  assert.equal(result.story.combat.player.hp, 7);
  assert.equal(result.story.combat.player.actionsPlayed, 1);
  assert.equal(context.store.read().character.progression.inventory['healing-potion'], 0);
  assert.equal(result.story.combatItems[0].count, 0);
});

test('guide, repas et épargne produisent trois conséquences économiques distinctes', () => {
  const guide = setup();
  reachOffers(guide.service);
  const guided = guide.service.chooseStoryOption('payer-guide').story;
  assert.equal(guided.status, 'success');
  assert.equal(guided.inCombat, false);
  assert.equal(guide.store.read().character.progression.gold, 6);

  const meal = setup();
  reachOffers(meal.service);
  const fed = meal.service.chooseStoryOption('prendre-repas').story;
  assert.equal(fed.inCombat, true);
  assert.equal(meal.store.read().character.progression.gold, 10);
  assert.equal(meal.store.read().character.progression.inventory['healing-potion'], 0);

  const saver = setup();
  reachOffers(saver.service);
  const road = saver.service.chooseStoryOption('garder-bourse').story;
  assert.equal(road.inCombat, true);
  assert.equal(saver.store.read().character.progression.gold, 12);
  assert.equal(saver.store.read().character.progression.transactionHistory.length, 0);
});

test('une offre trop chère reste visible mais ne peut produire aucune mutation', () => {
  const context = setup(null, { gold: 5 });
  const offers = reachOffers(context.service);
  assert.equal(offers.choices.find((choice) => choice.id === 'acheter-potion').available, false);
  assert.equal(offers.choices.find((choice) => choice.id === 'payer-guide').available, false);
  const before = context.store.read();
  assert.throws(
    () => context.service.chooseStoryOption('acheter-potion'),
    (error) => error.code === 'CHOICE_REQUIREMENT_NOT_MET',
  );
  assert.deepEqual(context.store.read(), before);
});

test('vaincre le Guetteur rapporte quatre pièces une seule fois', () => {
  const context = setup();
  const storyPath = path.join(__dirname, '..', 'content', 'chapters', 'la-nuit-a-brumepont.json');
  const simulated = simulateCombat({
    storyPath,
    heroStats: context.store.read().character.progression.stats,
  });
  assert.ok(simulated.victories.shortest);

  reachOffers(context.service);
  context.service.chooseStoryOption('garder-bourse');
  let ending = playSteps(context.service, simulated.victories.shortest.steps);
  assert.equal(ending.status, 'success');
  assert.equal(context.store.read().character.progression.gold, 16);
  assert.ok(context.store.read().character.progression.claimedRewardIds.includes('brumepont-guetteur-vaincu'));

  context.service.restartStory();
  context.service.chooseStoryOption('ancrage-pieces');
  context.service.chooseStoryOption('garder-bourse');
  ending = playSteps(context.service, simulated.victories.shortest.steps);
  assert.equal(ending.status, 'success');
  assert.equal(context.store.read().character.progression.gold, 16);
});
