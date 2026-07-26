const test = require('node:test');
const assert = require('node:assert/strict');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { tempStore } = require('./helpers');

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

function startThirdLevel(context, sourceEndingId) {
  context.store.transaction((draft) => {
    draft.story.cageOutcome = sourceEndingId;
    return draft;
  });
  return context.service.startStory('le-troisieme-palier', { sourceEndingId });
}

test('les deux issues de la cage ouvrent directement leur propre descente', () => {
  const saved = setup();
  const fromMira = startThirdLevel(saved, 'captive-sauvee');
  assert.equal(fromMira.storyId, 'le-troisieme-palier');
  assert.equal(fromMira.node.id, 'conduit-du-ravin');
  assert.match(fromMira.node.text, /schiste donné par Mira/);

  const orders = setup();
  const fromOrders = startThirdLevel(orders, 'ordres-recuperes');
  assert.equal(fromOrders.storyId, 'le-troisieme-palier');
  assert.equal(fromOrders.node.id, 'cage-de-service');
  assert.match(fromOrders.node.text, /deuxième cloche/);
});

test('les erreurs d’exploration échouent causalement puis reprennent la bonne provenance', () => {
  const mira = setup();
  startThirdLevel(mira, 'captive-sauvee');
  assert.equal(mira.service.chooseStoryOption('couper-sous-etai').story.ending.endingId, 'echec-etai-fendu');
  assert.equal(mira.service.retryStoryAct().node.id, 'conduit-du-ravin');

  const orders = setup();
  startThirdLevel(orders, 'ordres-recuperes');
  assert.equal(
    orders.service.chooseStoryOption('descendre-sans-attendre').story.ending.endingId,
    'echec-cage-interceptee',
  );
  assert.equal(orders.service.retryStoryAct().node.id, 'cage-de-service');
});

test('les quatre combinaisons gagnantes persistent sans effacer l’issue de la cage', () => {
  const routes = [
    ['captive-sauvee', 'suivre-air-froid', 'condamner-passage', 'passage-condamne'],
    ['captive-sauvee', 'suivre-air-froid', 'maintenir-passage', 'passage-maintenu'],
    ['ordres-recuperes', 'attendre-seconde-cloche', 'condamner-passage', 'passage-condamne'],
    ['ordres-recuperes', 'attendre-seconde-cloche', 'maintenir-passage', 'passage-maintenu'],
  ];

  for (const [sourceEndingId, approachId, finalChoiceId, endingId] of routes) {
    const context = setup();
    startThirdLevel(context, sourceEndingId);
    assert.equal(context.service.chooseStoryOption(approachId).story.node.id, 'passage-ancien');
    const ending = context.service.chooseStoryOption(finalChoiceId).story;
    assert.equal(ending.ending.endingId, endingId);

    const reopened = new CharacterStore(context.file).read();
    assert.equal(reopened.story.cageOutcome, sourceEndingId);
    assert.equal(reopened.story.thirdLevelOutcome, endingId);
    assert.equal(reopened.story.activeRun.sourceEndingId, sourceEndingId);
  }
});

test('recommencer l’aventure restaure une campagne neuve et préserve le profil', () => {
  const context = setup();
  context.store.transaction((draft) => {
    draft.character.identity.name = 'Nerys';
    draft.character.scene.mood = 'méfiant';
    return draft;
  });
  startThirdLevel(context, 'captive-sauvee');
  context.service.chooseStoryOption('suivre-air-froid');
  context.service.chooseStoryOption('condamner-passage');
  assert.equal(context.store.read().story.thirdLevelOutcome, 'passage-condamne');

  const restarted = context.service.restartStory();
  const persisted = new CharacterStore(context.file).read();
  assert.equal(restarted.storyId, 'la-route-des-ronces');
  assert.equal(restarted.node.id, 'depart');
  assert.equal(persisted.story.activeRun.storyId, 'la-route-des-ronces');
  assert.equal(persisted.story.activeRun.activeNodeId, 'depart');
  assert.equal(persisted.story.activeRun.sourceEndingId, null);
  assert.equal(persisted.story.cageOutcome, null);
  assert.equal(persisted.story.thirdLevelOutcome, null);
  assert.equal(persisted.character.progression.level, 1);
  assert.equal(persisted.character.progression.gold, 0);
  assert.deepEqual(persisted.character.progression.claimedRewardIds, []);
  assert.deepEqual(persisted.character.relationshipEvents, []);
  assert.equal(persisted.character.identity.name, 'Nerys');
  assert.equal(persisted.character.scene.mood, 'méfiant');
});
