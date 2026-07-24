const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { NarrativeStudio } = require('../src/server/narrative-studio');
const { StoryRepository } = require('../src/server/story-repository');
const { ConversationService } = require('../src/server/conversation-service');
const { createPreloadApi } = require('../src/preload-api');
const { parseLastJsonObject } = require('../src/server/codex-client');
const { tempStore } = require('./helpers');

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fantasy-story-studio-'));
  const content = path.join(root, 'content');
  fs.mkdirSync(content);
  fs.copyFileSync(
    path.join(__dirname, '..', 'content', 'chapters', 'la-route-des-ronces.json'),
    path.join(content, 'la-route-des-ronces.json'),
  );
  const storyRepository = new StoryRepository({ contentRoot: content });
  const { store } = tempStore();
  const studio = new NarrativeStudio({
    dataDir: root,
    storyRepository,
    store,
    codex: {},
  });
  return { root, storyRepository, store, studio };
}

test('le brouillon reste atomique et indépendant du livre canonique', () => {
  const context = setup();
  const { graph } = context.studio.read();
  graph.title = 'Brouillon';
  const saved = context.studio.save(graph);
  assert.equal(saved.report.accepted, true);
  assert.equal(context.storyRepository.get().title, 'La Route des Ronces');
  assert.deepEqual(
    fs.readdirSync(path.join(context.root, 'narrative-studio', 'drafts'))
      .filter((name) => name.endsWith('.tmp')),
    [],
  );
});

test('la publication approuve le brouillon, sauvegarde le canon et invalide le cache', () => {
  const context = setup();
  const { graph } = context.studio.read();
  graph.title = 'Version atelier';
  graph.status = 'draft';
  context.studio.save(graph);
  const result = context.studio.publish({ warningsAccepted: true });
  assert.ok(fs.existsSync(result.backup));
  assert.equal(context.storyRepository.get().title, 'Version atelier');
  assert.equal(context.storyRepository.get().status, 'approved');
});

test('le playtest Atelier utilise choix, statistiques et moteur de cartes réels', () => {
  const context = setup();
  const graph = context.studio.read().graph;
  let result = context.studio.preview({ graph, command: 'start', nodeId: graph.entryNodeId });
  result = context.studio.preview({
    graph,
    session: result.session,
    command: 'choose',
    choiceId: 'ancrage-etincelle',
  });
  assert.throws(
    () => context.studio.preview({
      graph,
      session: result.session,
      command: 'choose',
      choiceId: 'deplacer-charrette',
    }),
    (error) => error.code === 'CHOICE_REQUIREMENT_NOT_MET',
  );
  result = context.studio.preview({
    graph,
    session: result.session,
    command: 'choose',
    choiceId: 'examiner-talus',
  });
  assert.equal(result.view.inCombat, true);
  const instanceId = result.view.combat.cards.find((card) => card.available).instanceId;
  result = context.studio.preview({
    graph,
    session: result.session,
    command: 'play_card',
    cardId: instanceId,
  });
  assert.equal(result.view.combat.player.actionsPlayed, 1);
});

test('une erreur, un avertissement non accepté ou une histoire jouée bloquent la publication', () => {
  const invalid = setup();
  const broken = invalid.studio.read().graph;
  broken.nodes[0].choices = [];
  invalid.studio.save(broken);
  assert.throws(
    () => invalid.studio.publish({ warningsAccepted: true }),
    (error) => error.code === 'PUBLISH_BLOCKED',
  );

  const warned = setup();
  const long = warned.studio.read().graph;
  long.nodes[0].choices[0].label = 'Une formulation volontairement beaucoup trop longue pour tenir correctement dans le bouton de choix';
  warned.studio.save(long);
  assert.throws(
    () => warned.studio.publish(),
    (error) => error.code === 'WARNINGS_NOT_ACCEPTED',
  );

  const active = setup();
  new ConversationService({
    store: active.store,
    gateway: {},
    diagnostics: null,
    storyRepository: active.storyRepository,
  }).startStory();
  assert.throws(
    () => active.studio.publish({ warningsAccepted: true }),
    (error) => error.code === 'STORY_IN_USE',
  );
});

test('l’API Electron expose les commandes narratives et de combat en production', () => {
  const api = createPreloadApi({ invoke: () => {}, subscribe: () => {}, development: false });
  assert.equal(api.openNarrativeStudio, undefined);
  assert.equal(typeof api.readStory, 'function');
  assert.equal(typeof api.chooseStoryOption, 'function');
  assert.equal(typeof api.playCombatCard, 'function');
  assert.equal(typeof api.endCombatTurn, 'function');
  assert.equal(typeof api.passCombatReaction, 'function');
  assert.equal(typeof api.useCombatItem, 'function');
  assert.equal(typeof api.allocateProgressionStat, 'function');
});

test('l’API de développement expose seulement l’ouverture de l’Atelier côté jeu', () => {
  const api = createPreloadApi({ invoke: () => {}, subscribe: () => {}, development: true });
  assert.equal(typeof api.openNarrativeStudio, 'function');
  assert.equal(api.save, undefined);
});

test('l’assistant conserve la dernière proposition structurée après un préambule', () => {
  const value = parseLastJsonObject(
    '{"summary":"préambule"}{"summary":"final","rationale":"raison","risks":[],"proposedChanges":[]}',
    ['summary', 'rationale', 'risks', 'proposedChanges'],
  );
  assert.equal(value.summary, 'final');
});
