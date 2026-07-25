const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CombatEngine } = require('../src/server/combat-engine');
const { normalizeStory } = require('../src/server/story-format');

const story = normalizeStory(JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'content', 'chapters', 'la-cage-du-treuil.json'),
  'utf8',
)));
const node = story.nodes.find((candidate) => candidate.id === 'combat-varek');

function engineWithEnemyDeck(deck, drawCount = 1) {
  const config = structuredClone(node.combat);
  config.player.deck = [
    'elan-arcanique',
    'voile-azur',
    'entrave-de-givre',
    'braise-occulte',
    'baton-de-voyage',
    'eclat-arcanique',
  ];
  config.enemy.deck = deck;
  config.enemy.drawCount = drawCount;
  return new CombatEngine(config, story.hero);
}

test('Élan arcanique rend la prochaine carte Action gratuite puis disparaît', () => {
  const engine = engineWithEnemyDeck([
    'lanterne-brisee',
    'pique-de-convoi',
    'coup-de-hampe',
  ]);
  let combat = engine.start(node.id);
  combat = engine.endTurn(combat).combat;

  const elan = engine.cardsFor(combat).find((card) => card.id === 'elan-arcanique');
  assert.ok(elan?.available);
  combat = engine.playCard(combat, elan.instanceId).combat;

  assert.equal(combat.phase, 'player');
  assert.deepEqual(combat.player.statuses.map((status) => status.id), ['advantage']);
  const action = engine.cardsFor(combat).find(
    (card) => card.timing === 'action' && card.id !== 'orbe-suspendu',
  );
  assert.equal(action.actionCost, 0);

  combat = engine.playCard(combat, action.instanceId).combat;
  assert.equal(combat.player.actionsPlayed, 0);
  assert.deepEqual(combat.player.statuses, []);
});

test('Coup de hampe impose deux Actions même si ses dégâts sont bloqués', () => {
  const engine = engineWithEnemyDeck([
    'coup-de-hampe',
    'pique-de-convoi',
    'lanterne-brisee',
  ]);
  let combat = engine.start(node.id);
  combat = engine.endTurn(combat).combat;

  const voile = engine.cardsFor(combat).find((card) => card.id === 'voile-azur');
  assert.ok(voile?.available);
  combat = engine.playCard(combat, voile.instanceId).combat;

  assert.equal(combat.player.hp, combat.player.maxHp);
  assert.equal(combat.phase, 'player');
  assert.deepEqual(combat.player.statuses.map((status) => status.id), ['disadvantage']);
  const action = engine.cardsFor(combat).find(
    (card) => card.timing === 'action' && card.id !== 'orbe-suspendu',
  );
  assert.equal(action.actionCost, 2);

  combat = engine.playCard(combat, action.instanceId).combat;
  assert.equal(combat.player.actionsPlayed, 2);
  assert.deepEqual(combat.player.statuses, []);
});

test('Avantage et Désavantage s’annulent sans se cumuler', () => {
  const engine = engineWithEnemyDeck([
    'coup-de-hampe',
    'pique-de-convoi',
    'lanterne-brisee',
  ]);
  let combat = engine.start(node.id);
  combat = engine.endTurn(combat).combat;

  const elan = engine.cardsFor(combat).find((card) => card.id === 'elan-arcanique');
  combat = engine.playCard(combat, elan.instanceId).combat;

  assert.deepEqual(combat.player.statuses, []);
  assert.ok(combat.log.some(
    (entry) => entry.type === 'status_neutralized'
      && entry.text === 'Avantage et Désavantage s’annulent.',
  ));
});
