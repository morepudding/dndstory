const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { createDefaultState, SCHEMA_VERSION } = require('../src/server/state-schema');
const { tempStore } = require('./helpers');

function service(store) {
  return new ConversationService({
    store,
    gateway: {},
    diagnostics: new DevelopmentDiagnostics(),
    storyRepository: new StoryRepository(),
  });
}

test('l’histoire générale démarre sans confirmation adulte', () => {
  const { store } = tempStore();
  const started = service(store).startStory();
  assert.equal(started.requiresAdultConfirmation, false);
  assert.equal(started.active, true);
  assert.equal(started.hero.className, 'Sorcier');
  assert.ok(store.read().story.activeRun);
});

test('la migration v8 vers le schéma courant conserve le profil mais retire un ancien combat', () => {
  const { dir } = tempStore();
  const file = path.join(dir, 'v8.json');
  const state = createDefaultState();
  state.schemaVersion = 8;
  state.character.identity.name = 'Sorcier test';
  state.story.activeRun = { id: 'old-combat' };
  state.conversation.messages = [
    { role: 'user', content: 'Avant', at: '2026-01-01T00:00:00.000Z' },
    {
      role: 'assistant',
      content: 'Ancien combat',
      at: '2026-01-01T00:01:00.000Z',
      runId: 'old-combat',
    },
  ];
  fs.writeFileSync(file, JSON.stringify(state));
  const migrated = new CharacterStore(file).read();
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrated.character.identity.name, 'Sorcier test');
  assert.equal(migrated.story.activeRun, null);
  assert.equal(migrated.conversation.messages.length, 1);
  assert.equal(migrated.recoveryEvents.at(-1).type, 'branching_book_engine_reset');
  assert.equal(migrated.character.progression.level, 1);
  assert.equal(migrated.character.progression.gold, 0);
});

test('la migration v9 ajoute la progression sans retirer la partie active', () => {
  const { dir } = tempStore();
  const file = path.join(dir, 'v9.json');
  const state = createDefaultState();
  state.schemaVersion = 9;
  delete state.character.progression;
  state.story.activeRun = null;
  fs.writeFileSync(file, JSON.stringify(state));
  const migrated = new CharacterStore(file).read();
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrated.character.progression.level, 1);
  assert.deepEqual(migrated.character.progression.stats, {
    strength: 1,
    constitution: 2,
    agility: 2,
    wisdom: 3,
    intelligence: 2,
  });
});

test('une sauvegarde de combat conserve main, pioche, défausse et économie d’actions', () => {
  const { file, store } = tempStore();
  const svc = service(store);
  svc.startStory();
  svc.chooseStoryOption('ancrage-etincelle');
  svc.chooseStoryOption('examiner-talus');
  svc.playCombatCard('braise-occulte:1');
  const reopened = new CharacterStore(file).read().story.activeRun.combat;
  assert.equal(reopened.player.actionsPlayed, 1);
  assert.equal(reopened.hand.length, 2);
  assert.equal(reopened.drawPile.length, 7);
  assert.equal(reopened.discardPile.length, 1);
  assert.equal(reopened.player.stats.wisdom, 3);
  assert.equal(reopened.enemy.drawPile.length, 8);
  assert.deepEqual(reopened.enemy.statuses, []);
});

test('la migration v12 ajoute les états de tempo sans perdre le combat actif', () => {
  const { file, store } = tempStore();
  const svc = service(store);
  svc.startStory();
  svc.chooseStoryOption('ancrage-etincelle');
  svc.chooseStoryOption('examiner-talus');
  const legacy = store.read();
  legacy.schemaVersion = 12;
  delete legacy.story.activeRun.combat.player.statuses;
  fs.writeFileSync(file, JSON.stringify(legacy));

  const migrated = new CharacterStore(file).read();
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrated.story.activeRun.combat.nodeId, 'pillard');
  assert.deepEqual(migrated.story.activeRun.combat.player.statuses, []);
});

test('la migration v14 ajoute l’issue du troisième palier sans perdre la partie', () => {
  const { file, store } = tempStore();
  const legacy = store.read();
  legacy.schemaVersion = 14;
  delete legacy.story.thirdLevelOutcome;
  fs.writeFileSync(file, JSON.stringify(legacy));

  const migrated = new CharacterStore(file).read();
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrated.story.activeRun, null);
  assert.equal(migrated.story.thirdLevelOutcome, null);
});

test('les écritures persistantes restent atomiques et récupérables', () => {
  const { file, store } = tempStore();
  store.transaction((draft) => {
    draft.character.scene.mood = 'serein';
    return draft;
  });
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, 'utf8')));
  assert.equal(fs.existsSync(`${file}.bak`), true);
});
