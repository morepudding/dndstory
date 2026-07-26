const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { SCHEMA_VERSION } = require('../src/server/state-schema');
const { tempStore } = require('./helpers');

function service(store) {
  return new ConversationService({
    store,
    gateway: {},
    diagnostics: new DevelopmentDiagnostics(),
    storyRepository: new StoryRepository(),
  });
}

test('Magie spontanée façonne un sort une fois et traverse migration, sauvegarde et reprise', () => {
  const context = tempStore();
  const first = service(context.store);
  first.startStory();
  first.chooseStoryOption('ancrage-etincelle');
  first.chooseStoryOption('examiner-talus');

  const legacy = context.store.read();
  legacy.schemaVersion = 15;
  delete legacy.story.activeRun.combat.player.spontaneousMagicAvailable;
  fs.writeFileSync(context.file, JSON.stringify(legacy));

  const migratedStore = new CharacterStore(context.file);
  const migrated = migratedStore.read();
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.equal(
    migrated.story.activeRun.combat.player.spontaneousMagicAvailable,
    true,
  );

  const resumed = service(migratedStore);
  const before = resumed.readStory().combat;
  const source = before.cards.find((card) => card.id === 'baton-de-voyage');
  const target = before.spontaneousMagicOptions.find(
    (card) => card.id === 'eclat-arcanique',
  );
  assert.ok(source);
  assert.equal(target?.available, true);

  resumed.shapeCombatSpell(source.instanceId, target.id);
  const persisted = new CharacterStore(context.file).read().story.activeRun.combat;
  assert.equal(persisted.player.spontaneousMagicAvailable, false);
  assert.equal(persisted.player.spellUses, before.player.spellUses - 1);
  assert.equal(persisted.player.actionsPlayed, before.player.actionsPlayed + 1);
  assert.equal(persisted.enemy.hp, before.enemy.hp - 5);
  assert.ok(persisted.discardPile.some(
    (instance) => instance.instanceId === source.instanceId,
  ));
  assert.ok(persisted.log.some(
    (entry) => (
      entry.type === 'spontaneous_magic'
      && entry.sourceCardId === 'baton-de-voyage'
      && entry.targetCardId === 'eclat-arcanique'
    ),
  ));

  const unchanged = structuredClone(persisted);
  const secondSource = resumed.readStory().combat.hand[0];
  assert.throws(
    () => resumed.shapeCombatSpell(secondSource.instanceId, 'orbe-suspendu'),
    (error) => error.code === 'SPONTANEOUS_MAGIC_SPENT',
  );
  assert.deepEqual(
    new CharacterStore(context.file).read().story.activeRun.combat,
    unchanged,
  );
});
