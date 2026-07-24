const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CombatEngine } = require('../src/server/combat-engine');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { tempStore } = require('./helpers');

const story = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'content', 'chapters', 'la-cage-du-treuil.json'),
  'utf8',
));
const node = story.nodes.find((candidate) => candidate.id === 'combat-varek');

function engineFor({
  playerDeck = [
    'orbe-suspendu',
    'orbe-suspendu',
    'voile-azur',
    'braise-occulte',
  ],
  enemyDeck = ['coup-de-hampe', 'pique-de-convoi'],
  enemyDrawCount = 1,
  enemyMaxHp = node.combat.enemy.maxHp,
} = {}) {
  const config = structuredClone(node.combat);
  config.player.deck = playerDeck;
  config.enemy.deck = enemyDeck;
  config.enemy.drawCount = enemyDrawCount;
  config.enemy.maxHp = enemyMaxHp;
  return new CombatEngine(config, story.hero);
}

function card(engine, combat, id) {
  return engine.cardsFor(combat).find((candidate) => candidate.id === id);
}

test('Orbe suspendu inflige 2 dégâts et crée une unique Concentration', () => {
  const engine = engineFor();
  let combat = engine.start(node.id);

  const orbe = card(engine, combat, 'orbe-suspendu');
  assert.ok(orbe?.available);
  combat = engine.playCard(combat, orbe.instanceId).combat;

  assert.equal(combat.enemy.hp, combat.enemy.maxHp - 2);
  assert.equal(combat.player.spellUses, 2);
  assert.equal(combat.player.actionsPlayed, 1);
  assert.deepEqual(
    combat.player.statuses.map((status) => status.id),
    ['concentration'],
  );
  assert.equal(
    card(engine, combat, 'orbe-suspendu')?.available,
    false,
    'un second Orbe ne peut pas remplacer celui qui est déjà suspendu',
  );
});

test('un blocage total conserve la Concentration puis déclenche les dégâts avant la pioche', () => {
  const engine = engineFor();
  let combat = engine.start(node.id);
  combat = engine.playCard(combat, card(engine, combat, 'orbe-suspendu').instanceId).combat;
  combat = engine.endTurn(combat).combat;

  const voile = card(engine, combat, 'voile-azur');
  const resolution = engine.playCard(combat, voile.instanceId);
  combat = resolution.combat;

  assert.equal(resolution.outcome, null);
  assert.equal(combat.player.hp, combat.player.maxHp);
  assert.equal(combat.enemy.hp, combat.enemy.maxHp - 7);
  assert.deepEqual(
    combat.player.statuses.map((status) => status.id),
    ['disadvantage'],
    'Coup de hampe impose toujours Désavantage après avoir été bloqué',
  );
  const triggerIndex = combat.log.findIndex((entry) => entry.type === 'concentration_triggered');
  const drawIndex = combat.log.findIndex(
    (entry) => entry.round === 2 && entry.type === 'cards_drawn',
  );
  assert.ok(triggerIndex >= 0);
  assert.ok(drawIndex > triggerIndex);
});

test('le premier dégât non bloqué brise la Concentration sans dégâts différés', () => {
  const engine = engineFor();
  let combat = engine.start(node.id);
  combat = engine.playCard(combat, card(engine, combat, 'orbe-suspendu').instanceId).combat;
  combat = engine.endTurn(combat).combat;
  combat = engine.passReaction(combat).combat;

  assert.equal(combat.player.hp, combat.player.maxHp - 1);
  assert.equal(combat.enemy.hp, combat.enemy.maxHp - 2);
  assert.ok(!combat.player.statuses.some((status) => status.id === 'concentration'));
  assert.ok(combat.log.some((entry) => entry.type === 'concentration_broken'));
  assert.ok(!combat.log.some((entry) => entry.type === 'concentration_triggered'));
});

test('Avantage rend Orbe gratuit en Actions sans modifier sa réserve de charges', () => {
  const engine = engineFor();
  let combat = engine.start(node.id);
  combat.player.statuses.push({
    id: 'advantage',
    name: 'Avantage',
    stacks: 1,
    description: 'La prochaine carte Action coûte 0 Action.',
  });

  const orbe = card(engine, combat, 'orbe-suspendu');
  assert.equal(orbe.actionCost, 0);
  combat = engine.playCard(combat, orbe.instanceId).combat;

  assert.equal(combat.player.actionsPlayed, 0);
  assert.equal(combat.player.spellUses, 2);
  assert.deepEqual(combat.player.statuses.map((status) => status.id), ['concentration']);
});

test('Désavantage refuse Orbe sans mutation lorsqu’il ne reste qu’une Action', () => {
  const engine = engineFor();
  const combat = engine.start(node.id);
  combat.player.actionsPlayed = 1;
  combat.player.statuses.push({
    id: 'disadvantage',
    name: 'Désavantage',
    stacks: 1,
    description: 'La prochaine carte Action coûte 2 Actions.',
  });
  const before = structuredClone(combat);
  const orbe = card(engine, combat, 'orbe-suspendu');

  assert.equal(orbe.actionCost, 2);
  assert.equal(orbe.available, false);
  assert.throws(
    () => engine.playCard(combat, orbe.instanceId),
    (error) => error.code === 'ACTION_LIMIT_REACHED',
  );
  assert.deepEqual(combat, before);
});

test('les dégâts différés peuvent terminer le combat au début du tour suivant', () => {
  const engine = engineFor({ enemyMaxHp: 7 });
  let combat = engine.start(node.id);
  combat = engine.playCard(combat, card(engine, combat, 'orbe-suspendu').instanceId).combat;
  combat = engine.endTurn(combat).combat;

  const resolution = engine.playCard(
    combat,
    card(engine, combat, 'voile-azur').instanceId,
  );

  assert.equal(resolution.outcome, 'victory');
  assert.equal(resolution.combat.enemy.hp, 0);
  assert.ok(!resolution.combat.player.statuses.some(
    (status) => status.id === 'concentration',
  ));
  assert.ok(!resolution.combat.log.some(
    (entry) => entry.round === 2 && entry.type === 'cards_drawn',
  ));
});

test('une relance complète conserve l’Orbe suspendu et ses dégâts différés', () => {
  const context = tempStore();
  context.store.transaction((draft) => {
    draft.character.progression.level = 2;
    draft.character.progression.gold = 12;
    return draft;
  });
  const service = new ConversationService({
    store: context.store,
    gateway: {},
    diagnostics: new DevelopmentDiagnostics({ enabled: true }),
    storyRepository: new StoryRepository(),
  });
  service.startStory('la-cage-du-treuil', {
    sourceEndingId: 'carriere-par-la-route',
  });
  service.chooseStoryOption('ancrage-treuil');
  service.chooseStoryOption('poursuivre-varek');
  const orbe = service.readStory().combat.cards.find(
    (candidate) => candidate.id === 'orbe-suspendu',
  );
  assert.ok(orbe?.available);
  service.playCombatCard(orbe.instanceId);

  const expected = context.store.read().story.activeRun.combat;
  const reopened = new CharacterStore(context.file).read().story.activeRun.combat;

  assert.deepEqual(reopened, expected);
  assert.equal(reopened.player.statuses.find(
    (status) => status.id === 'concentration',
  )?.damage, 5);
});
