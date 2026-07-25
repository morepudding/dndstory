const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { simulateCombat } = require('../tools/simulate-combat');
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

function winVarek(service) {
  const report = simulateCombat({
    storyPath: path.join(__dirname, '..', 'content', 'chapters', 'la-cage-du-treuil.json'),
    heroStats: service.readStory().hero.stats,
  });
  assert.ok(report.victories.shortest);
  for (const step of report.victories.shortest.steps) {
    if (step === 'réaction:aucune') service.passCombatReaction();
    else if (step === 'action:terminer') service.endCombatTurn();
    else {
      const cardId = step.slice(step.indexOf(':') + 1);
      const card = service.readStory().combat.cards.find(
        (candidate) => candidate.id === cardId && candidate.available,
      );
      assert.ok(card, `carte disponible : ${cardId}`);
      service.playCombatCard(card.instanceId);
    }
  }
}

function startThirdLevel(context, sourceEndingId) {
  context.store.transaction((draft) => {
    draft.story.cageOutcome = sourceEndingId;
    return draft;
  });
  return context.service.startStory('le-troisieme-palier', { sourceEndingId });
}

test('les deux issues de la cage continuent vers leur propre descente', () => {
  const saved = setup();
  saved.service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-passage' });
  saved.service.chooseStoryOption('ancrage-treuil');
  saved.service.chooseStoryOption('sauver-mira');
  const fromMira = saved.service.continueAfterSuccess();
  assert.equal(fromMira.storyId, 'le-troisieme-palier');
  assert.equal(fromMira.node.title, 'Le conduit du ravin');
  assert.equal(saved.service.chooseStoryOption('ancrage-acces').story.node.id, 'conduit-du-ravin');

  const orders = setup();
  orders.service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-la-route' });
  orders.service.chooseStoryOption('ancrage-activite');
  orders.service.chooseStoryOption('poursuivre-varek');
  winVarek(orders.service);
  const fromOrders = orders.service.continueAfterSuccess();
  assert.equal(fromOrders.storyId, 'le-troisieme-palier');
  assert.equal(fromOrders.node.title, 'La cage de service');
  assert.equal(orders.service.chooseStoryOption('ancrage-ecoute').story.node.id, 'cage-de-service');
});

test('les erreurs d’exploration échouent causalement puis reprennent la bonne provenance', () => {
  const mira = setup();
  startThirdLevel(mira, 'captive-sauvee');
  mira.service.chooseStoryOption('ancrage-acces');
  assert.equal(mira.service.chooseStoryOption('couper-sous-etai').story.ending.endingId, 'echec-etai-fendu');
  assert.equal(mira.service.retryStoryAct().node.title, 'Le conduit du ravin');

  const orders = setup();
  startThirdLevel(orders, 'ordres-recuperes');
  orders.service.chooseStoryOption('ancrage-ecoute');
  assert.equal(
    orders.service.chooseStoryOption('descendre-sans-attendre').story.ending.endingId,
    'echec-cage-interceptee',
  );
  assert.equal(orders.service.retryStoryAct().node.title, 'La cage de service');
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
    context.service.chooseStoryOption('ancrage-acces');
    assert.equal(context.service.chooseStoryOption(approachId).story.node.id, 'passage-ancien');
    const ending = context.service.chooseStoryOption(finalChoiceId).story;
    assert.equal(ending.ending.endingId, endingId);

    const reopened = new CharacterStore(context.file).read();
    assert.equal(reopened.story.cageOutcome, sourceEndingId);
    assert.equal(reopened.story.thirdLevelOutcome, endingId);
    assert.equal(reopened.story.activeRun.sourceEndingId, sourceEndingId);
  }
});

test('recommencer la boucle retire seulement son ancienne issue persistante', () => {
  const context = setup();
  startThirdLevel(context, 'captive-sauvee');
  context.service.chooseStoryOption('ancrage-acces');
  context.service.chooseStoryOption('suivre-air-froid');
  context.service.chooseStoryOption('condamner-passage');
  assert.equal(context.store.read().story.thirdLevelOutcome, 'passage-condamne');

  context.service.restartStory();
  const restarted = context.store.read().story;
  assert.equal(restarted.cageOutcome, 'captive-sauvee');
  assert.equal(restarted.thirdLevelOutcome, null);
  assert.equal(restarted.activeRun.sourceEndingId, 'captive-sauvee');
});
