const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { CombatEngine } = require('../src/server/combat-engine');
const { BranchingBookEngine, BranchingBookRuntime } = require('../src/server/branching-book-runtime');
const { loadBook } = require('../tools/play-branching-book');

const file = path.join(__dirname, '..', 'content', 'chapters', 'la-route-des-ronces.json');
const tree = JSON.parse(fs.readFileSync(file, 'utf8'));

function enterCombat(runtime) {
  runtime.choose('ancrage-etincelle');
  runtime.choose('examiner-talus');
  return runtime.read();
}

test('le moteur narratif ne mute pas la session reçue et bloque un choix sans Force', () => {
  const engine = new BranchingBookEngine(tree);
  const session = engine.start({ runId: 'run-1', at: '2026-07-23T12:00:00.000Z' });
  const result = engine.choose(session, 'ancrage-etincelle', '2026-07-23T12:01:00.000Z');
  assert.equal(session.activeNodeId, 'depart');
  assert.equal(session.history.length, 0);
  assert.equal(result.session.activeNodeId, 'charrette');
  const before = structuredClone(result.session);
  assert.throws(
    () => engine.choose(result.session, 'deplacer-charrette', '2026-07-23T12:02:00.000Z'),
    (error) => error.code === 'CHOICE_REQUIREMENT_NOT_MET',
  );
  assert.deepEqual(result.session, before);
});

test('les cinq statistiques initialisent directement les ressources du combat', () => {
  const runtime = new BranchingBookRuntime(tree);
  const view = enterCombat(runtime);
  assert.deepEqual(view.hero.stats, {
    strength: 1,
    constitution: 2,
    agility: 2,
    wisdom: 3,
    intelligence: 2,
  });
  assert.equal(view.combat.player.maxHp, 10);
  assert.equal(view.combat.player.actionLimit, 2);
  assert.equal(view.combat.player.drawCount, 3);
  assert.equal(view.combat.player.maxSpellUses, 2);
  assert.equal(view.combat.hand.length, 3);
  assert.equal(view.combat.drawPile.length, 9);
  assert.equal(view.combat.enemy.drawCount, 2);
  assert.equal(view.combat.enemy.drawPile.length, 8);
});

test('Force multiplie uniquement les dégâts de la carte Arme', () => {
  const config = structuredClone(tree.nodes.find((node) => node.id === 'pillard').combat);
  config.player.deck = ['baton-de-voyage', 'braise-occulte', 'voile-azur'];
  const hero = structuredClone(tree.hero);
  hero.stats.strength = 3;
  hero.stats.wisdom = 1;
  const engine = new CombatEngine(config, hero);
  const combat = engine.start('test');
  const result = engine.playCard(combat, 'baton-de-voyage:1');
  assert.equal(result.combat.enemy.hp, 14);
  assert.match(result.combat.log.at(-1).text, /2 × Force 3/);
});

test('Agilité autorise deux Actions puis ouvre une pioche ennemie de deux cartes', () => {
  const runtime = new BranchingBookRuntime(tree);
  enterCombat(runtime);
  let view = runtime.playCard('braise-occulte:1');
  assert.equal(view.combat.phase, 'player');
  assert.equal(view.combat.player.actionsPlayed, 1);
  view = runtime.endCombatTurn();
  assert.equal(view.combat.phase, 'reaction');
  assert.equal(view.combat.enemy.hand.length, 2);
  runtime.passReaction();
  view = runtime.passReaction();
  assert.equal(view.combat.round, 2);
  view = runtime.playCard('eclat-arcanique:4');
  view = runtime.playCard('baton-de-voyage:5');
  assert.equal(view.combat.phase, 'reaction');
  assert.equal(view.combat.player.actionsPlayed, 2);
  assert.equal(view.combat.enemy.hp, 10);
  assert.equal(view.combat.enemy.hand.length, 2);
  view = runtime.playCard('voile-azur:6');
  assert.equal(view.combat.phase, 'reaction');
  assert.equal(view.combat.enemy.hand.length, 1);
  view = runtime.passReaction();
  assert.equal(view.combat.round, 3);
  assert.equal(view.combat.player.hp, 6);
  assert.equal(view.combat.player.spellUses, 0);
  assert.equal(view.combat.hand.length, 3);
});

test('Entrave de givre ralentit uniquement la prochaine pioche ennemie', () => {
  const runtime = new BranchingBookRuntime(tree);
  enterCombat(runtime);
  runtime.playCard('braise-occulte:1');
  runtime.endCombatTurn();
  let view = runtime.playCard('entrave-de-givre:3');
  assert.equal(view.combat.phase, 'reaction');
  assert.equal(view.combat.player.hp, 9);
  assert.deepEqual(view.combat.enemy.statuses.map((status) => status.id), ['slowed']);
  view = runtime.passReaction();
  assert.equal(view.combat.round, 2);
  assert.equal(view.combat.player.hp, 8);
  runtime.playCard('eclat-arcanique:4');
  view = runtime.playCard('baton-de-voyage:5');
  assert.equal(view.combat.phase, 'reaction');
  assert.equal(view.combat.enemy.hand.length, 1);
  assert.equal(view.combat.enemy.statuses.length, 0);
  assert.match(
    view.combat.log.find((entry) => entry.type === 'status_consumed')?.text || '',
    /de 2 à 1 carte/,
  );
});

test('une route prudente et l’usage d’un sort permettent de gagner', () => {
  const runtime = new BranchingBookRuntime(tree);
  enterCombat(runtime);
  for (let guard = 0; guard < 20 && runtime.read().status === 'active'; guard += 1) {
    const view = runtime.read();
    if (!view.inCombat) break;
    if (view.combat.phase === 'reaction') {
      const slowed = view.combat.enemy.statuses.some((status) => status.id === 'slowed');
      const reaction = view.combat.cards.find(
        (card) => card.available && card.effect.status?.id === 'slowed' && !slowed,
      );
      if (reaction) runtime.playCard(reaction.instanceId);
      else runtime.passReaction();
      continue;
    }
    const spell = view.combat.cards.find((card) => card.available && card.kind === 'spell');
    const action = spell || view.combat.cards.find((card) => card.available);
    if (action) runtime.playCard(action.instanceId);
    else runtime.endCombatTurn();
  }
  assert.equal(runtime.read().status, 'success');
  assert.equal(runtime.read().node.id, 'fin-victoire');
});

test('la fin narrative et la reprise de l’acte restent indépendantes du combat', () => {
  const runtime = new BranchingBookRuntime(tree);
  runtime.choose('ancrage-silence');
  runtime.choose('foncer-ronces');
  assert.equal(runtime.read().status, 'failure');
  assert.equal(runtime.read().node.id, 'fin-collet');
  const retried = runtime.retryAct();
  assert.equal(retried.node.id, 'depart');
  assert.equal(retried.historyLength, 0);
});

test('le CLI charge le livre canonique avec ses statistiques', () => {
  const loaded = loadBook();
  const runtime = new BranchingBookRuntime(loaded.tree, { validate: loaded.validate });
  assert.equal(loaded.tree.id, 'la-route-des-ronces');
  assert.equal(runtime.read().hero.className, 'Sorcier');
});
