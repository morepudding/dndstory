const test = require('node:test');
const assert = require('node:assert/strict');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { tempStore } = require('./helpers');
const { simulateCombat } = require('../tools/simulate-combat');
const path = require('path');

function setup() {
  const base = tempStore();
  base.store.transaction((draft) => {
    draft.character.progression.level = 2;
    draft.character.progression.gold = 12;
    draft.character.progression.claimedRewardIds.push('route-des-ronces-premiere-victoire');
    return draft;
  });
  const service = new ConversationService({
    store: base.store,
    gateway: {},
    diagnostics: new DevelopmentDiagnostics({ enabled: true }),
    storyRepository: new StoryRepository(),
  });
  return { ...base, service };
}

function winCombat(service, storyName) {
  const report = simulateCombat({
    storyPath: path.join(__dirname, '..', 'content', 'chapters', storyName),
    heroStats: service.readStory().hero.stats,
  });
  assert.ok(report.victories.shortest, 'le simulateur doit fournir une route gagnante');
  for (const step of report.victories.shortest.steps) {
    const story = service.readStory();
    const combat = story.combat;
    if (step === 'réaction:aucune') service.passCombatReaction();
    else if (step === 'action:terminer') service.endCombatTurn();
    else {
      const cardId = step.slice(step.indexOf(':') + 1);
      const card = combat.cards.find((candidate) => candidate.id === cardId && candidate.available);
      assert.ok(card, 'carte simulée disponible : ' + cardId);
      service.playCombatCard(card.instanceId);
    }
  }
  return service.readStory();
}

function startCage(service, sourceEndingId = 'carriere-par-passage') {
  service.startStory('la-cage-du-treuil', { sourceEndingId });
  return service.chooseStoryOption('ancrage-treuil').story;
}

test('les deux fins de Brumepont reprennent la provenance correcte à la cage', () => {
  const guided = setup();
  guided.service.startStory();
  guided.service.chooseStoryOption('ancrage-carrier');
  guided.service.chooseStoryOption('payer-guide');
  const fromPassage = guided.service.continueAfterSuccess();
  assert.equal(fromPassage.storyId, 'la-cage-du-treuil');
  assert.equal(fromPassage.node.title, 'Sous les roues mortes');
  assert.equal(guided.store.read().story.activeRun.sourceEndingId, 'carriere-par-passage');

  const road = setup();
  road.service.startStory();
  road.service.chooseStoryOption('ancrage-carrier');
  road.service.chooseStoryOption('garder-bourse');
  assert.equal(winCombat(road.service, 'la-nuit-a-brumepont.json').ending.endingId, 'carriere-par-la-route');
  const fromRoad = road.service.continueAfterSuccess();
  assert.equal(fromRoad.node.title, 'Les gradins alertés');
  assert.equal(road.store.read().story.activeRun.sourceEndingId, 'carriere-par-la-route');
});

test('sauver Mira débite exactement une charge avant de persister une issue exclusive', () => {
  const context = setup();
  startCage(context.service);
  const result = context.service.chooseStoryOption('sauver-mira').story;
  const saved = context.store.read();
  assert.equal(result.status, 'success');
  assert.equal(saved.story.activeRun.arcaneCharges, 1);
  assert.equal(saved.story.activeRun.ending.endingId, 'captive-sauvee');
  assert.equal(saved.story.cageOutcome, 'captive-sauvee');
  assert.equal(saved.story.cageOutcome === 'ordres-recuperes', false);
});

test('sans charge, le sauvetage est refusé sans mutation partielle', () => {
  const context = setup();
  startCage(context.service);
  context.store.transaction((draft) => {
    draft.story.activeRun.arcaneCharges = 0;
    return draft;
  });
  const before = context.store.read();
  assert.equal(context.service.readStory().choices.find((choice) => choice.id === 'sauver-mira').available, false);
  assert.throws(
    () => context.service.chooseStoryOption('sauver-mira'),
    (error) => error.code === 'CHOICE_REQUIREMENT_NOT_MET',
  );
  assert.deepEqual(context.store.read(), before);
});

test('poursuivre Varek démarre le combat avec la réserve intacte et persiste les ordres', () => {
  const context = setup();
  startCage(context.service, 'carriere-par-la-route');
  const pursuit = context.service.chooseStoryOption('poursuivre-varek').story;
  assert.equal(pursuit.inCombat, true);
  assert.equal(pursuit.combat.player.spellUses, 2);
  assert.equal(pursuit.combat.player.maxSpellUses, 2);
  assert.equal(pursuit.arcaneCharges, 2);
  const outcome = winCombat(context.service, 'la-cage-du-treuil.json');
  assert.equal(outcome.status, 'success');
  assert.equal(context.store.read().story.cageOutcome, 'ordres-recuperes');
  assert.equal(context.store.read().story.cageOutcome === 'captive-sauvee', false);
});
