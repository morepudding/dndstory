const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { CombatEngine } = require('../src/server/combat-engine');
const { normalizeStory } = require('../src/server/story-format');

const tree = normalizeStory(JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'content', 'chapters', 'la-route-des-ronces.json'),
  'utf8',
)));

test('les dix cartes traversent pioche, main et défausse puis reforment la pioche', () => {
  const node = tree.nodes.find((candidate) => candidate.kind === 'combat');
  const config = structuredClone(node.combat);
  config.enemy.drawCount = 1;
  config.enemy.cards.forEach((card) => { card.damage = 1; });
  const engine = new CombatEngine(config, tree.hero);
  let combat = engine.start(node.id);

  assert.equal(engine.deckCardsFor(combat).length, 10);
  assert.deepEqual(
    countZones(engine.deckCardsFor(combat)),
    { draw: 7, hand: 3, discard: 0 },
  );
  assert.deepEqual(
    new Set(engine.deckCardsFor(combat).map((card) => card.family)),
    new Set(['weapon', 'cantrip', 'spell']),
  );

  for (let round = 1; round <= 3; round += 1) {
    engine.cardsFor(combat)
      .filter((card) => card.available && card.timing === 'action')
      .slice(0, 1)
      .forEach((card) => { combat = engine.playCard(combat, card.instanceId).combat; });
    const enemyTurn = engine.endTurn(combat);
    combat = enemyTurn.combat;
    while (combat.phase === 'reaction') {
      combat = engine.passReaction(combat).combat;
    }
  }

  assert.equal(combat.round, 4);
  assert.equal(combat.log.filter((entry) => entry.type === 'deck_recycled').length, 1);
  assert.deepEqual(
    countZones(engine.deckCardsFor(combat)),
    { draw: 7, hand: 3, discard: 0 },
  );
  assert.equal(new Set(engine.deckCardsFor(combat).map((card) => card.instanceId)).size, 10);
});

function countZones(cards) {
  return cards.reduce((counts, card) => {
    counts[card.zone] += 1;
    return counts;
  }, { draw: 0, hand: 0, discard: 0 });
}
