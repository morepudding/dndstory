const test = require('node:test');
const assert = require('node:assert/strict');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { StoryRepository } = require('../src/server/story-repository');
const { tempStore } = require('./helpers');

function setup(existing = null) {
  const base = existing || tempStore();
  const service = new ConversationService({
    store: base.store,
    gateway: {},
    diagnostics: new DevelopmentDiagnostics({ enabled: true }),
    storyRepository: new StoryRepository(),
  });
  return { ...base, service };
}

function enterCombat(service) {
  service.startStory('la-route-des-ronces');
  service.chooseStoryOption('ancrage-etincelle');
  service.chooseStoryOption('examiner-talus');
}

function enterBrumepontCombat(service) {
  service.chooseStoryOption('ancrage-pieces');
  service.chooseStoryOption('garder-bourse');
}

function winCombat(service) {
  for (let guard = 0; guard < 30 && service.readStory().status === 'active'; guard += 1) {
    const combat = service.readStory().combat;
    if (combat.phase === 'reaction') {
      const slowed = combat.enemy.statuses.some((status) => status.id === 'slowed');
      const reaction = combat.cards.find(
        (card) => card.available && card.effect.status?.id === 'slowed' && !slowed,
      );
      if (reaction) service.playCombatCard(reaction.instanceId);
      else service.passCombatReaction();
      continue;
    }
    const spell = combat.cards.find((card) => card.available && card.family === 'spell');
    const action = spell || combat.cards.find((card) => card.available);
    if (action) service.playCombatCard(action.instanceId);
    else service.endCombatTurn();
  }
  return service.readStory();
}

test('la première victoire attribue niveau, point et or une seule fois', () => {
  const context = setup();
  enterCombat(context.service);
  const result = winCombat(context.service);
  const progression = context.store.read().character.progression;

  assert.equal(result.status, 'success');
  assert.equal(result.canResolveLevelUp, true);
  assert.equal(result.canContinueFreeChat, false);
  assert.equal(progression.level, 2);
  assert.equal(progression.unspentStatPoints, 1);
  assert.equal(progression.gold, 12);
  assert.deepEqual(progression.claimedRewardIds, ['route-des-ronces-premiere-victoire']);
  assert.equal(progression.rewardHistory.length, 1);
  assert.throws(
    () => context.service.continueAfterSuccess(),
    (error) => error.code === 'PROGRESSION_CHOICE_REQUIRED',
  );

  const beforeInvalidChoice = context.store.read();
  assert.throws(
    () => context.service.allocateProgressionStat('wisdom'),
    (error) => error.code === 'PROGRESSION_STAT_MAX',
  );
  assert.deepEqual(context.store.read(), beforeInvalidChoice);

  context.service.allocateProgressionStat('strength');
  assert.equal(context.store.read().character.progression.stats.strength, 2);
  assert.equal(context.store.read().character.progression.unspentStatPoints, 0);
  context.service.continueAfterSuccess();

  enterCombat(context.service);
  winCombat(context.service);
  const afterReplay = context.store.read().character.progression;
  assert.equal(afterReplay.level, 2);
  assert.equal(afterReplay.gold, 12);
  assert.equal(afterReplay.unspentStatPoints, 0);
  assert.equal(afterReplay.rewardHistory.length, 1);
});

test('le point choisi survit à une relance et modifie le combat suivant', () => {
  const first = setup();
  enterCombat(first.service);
  winCombat(first.service);
  first.service.allocateProgressionStat('constitution');

  const reopened = setup({
    dir: first.dir,
    file: first.file,
    store: new CharacterStore(first.file),
  });
  assert.equal(reopened.service.readStory().hero.level, 2);
  assert.equal(reopened.service.readStory().hero.stats.constitution, 3);
  const next = reopened.service.continueAfterSuccess();
  assert.equal(next.storyId, 'la-nuit-a-brumepont');
  enterBrumepontCombat(reopened.service);
  assert.equal(reopened.service.readStory().combat.player.maxHp, 15);
});
