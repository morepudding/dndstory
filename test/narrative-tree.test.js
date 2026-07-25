const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validateNarrativeTree } = require('../src/server/narrative-tree');
const { normalizeStory } = require('../src/server/story-format');

const tree = normalizeStory(JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'content', 'chapters', 'la-route-des-ronces.json'),
  'utf8',
)));
const clone = () => structuredClone(tree);

test('La Route des Ronces possède un acte, un combat et ses deux types de mort', () => {
  const report = validateNarrativeTree(tree);
  assert.equal(report.accepted, true, JSON.stringify(report.errors));
  assert.deepEqual(report.warnings, []);
  assert.equal(report.metrics.nodeCount, 6);
  assert.equal(report.metrics.combatNodeCount, 1);
  assert.equal(report.metrics.routeCount, 7);
  assert.equal(report.metrics.successPathCount, 3);
  assert.equal(report.metrics.failurePathCount, 4);
  assert.equal(report.metrics.failureEndingCount, 2);
});

test('le héros possède exactement cinq statistiques bornées de 1 à 3', () => {
  assert.deepEqual(Object.keys(tree.hero.stats).sort(), [
    'agility', 'constitution', 'intelligence', 'strength', 'wisdom',
  ]);
  const bad = clone();
  bad.hero.stats.agility = 4;
  assert.ok(validateNarrativeTree(bad).errors.some((error) => error.code === 'hero_stat'));
});

test('les conditions narratives sont validées et un nœud sans choix accessible est refusé', () => {
  const badRequirement = clone();
  badRequirement.nodes.find((node) => node.id === 'charrette').choices[0].requirements[0] = {
    stat: 'charisme',
    min: 9,
  };
  assert.ok(validateNarrativeTree(badRequirement).errors.some((error) => error.code === 'choice_requirement'));

  const softlock = clone();
  const choices = softlock.nodes.find((node) => node.id === 'charrette').choices;
  for (const choice of choices) choice.requirements = [{ stat: 'strength', min: 3 }];
  assert.ok(validateNarrativeTree(softlock).errors.some((error) => error.code === 'choice_softlock'));
});

test('le deck refuse une carte inconnue et conserve au moins un sort mineur gratuit', () => {
  const unknown = clone();
  unknown.nodes.find((node) => node.kind === 'combat').combat.player.deck[0] = 'carte-inconnue';
  assert.ok(validateNarrativeTree(unknown).errors.some((error) => error.code === 'combat_deck'));

  const wrongSize = clone();
  wrongSize.nodes.find((node) => node.kind === 'combat').combat.player.deck.pop();
  assert.ok(validateNarrativeTree(wrongSize).errors.some((error) => error.code === 'combat_deck'));

  const paidCantrip = clone();
  paidCantrip.nodes.find((node) => node.kind === 'combat').combat.player.cards
    .find((card) => card.family === 'cantrip').chargeCost = 1;
  const errors = validateNarrativeTree(paidCantrip).errors.map((error) => error.code);
  assert.ok(errors.includes('cantrip_cost'));
  assert.ok(errors.includes('free_action'));
});

test('la pioche ennemie et Ralentissement utilisent uniquement des contrats validés', () => {
  const unknownEnemyCard = clone();
  unknownEnemyCard.nodes.find((node) => node.kind === 'combat').combat.enemy.deck[0] = 'attaque-inconnue';
  assert.ok(
    validateNarrativeTree(unknownEnemyCard).errors.some((error) => error.code === 'enemy_deck'),
  );

  const invalidStatus = clone();
  invalidStatus.nodes.find((node) => node.kind === 'combat').combat.player.cards
    .find((card) => card.id === 'entrave-de-givre').effect.status.id = 'gel-total';
  assert.ok(
    validateNarrativeTree(invalidStatus).errors.some((error) => error.code === 'status_effect'),
  );
});

test('les états et effets cachés restent exclus du format', () => {
  const bad = clone();
  bad.worldState = { secret: true };
  bad.nodes[0].choices[0].localEffects = { wisdom: 1 };
  const report = validateNarrativeTree(bad);
  assert.equal(report.accepted, false);
  assert.equal(report.errors.filter((error) => error.code === 'unknown_field').length, 2);
});

test('les cibles inconnues, nœuds inaccessibles et boucles sont bloquants', () => {
  const bad = clone();
  bad.nodes[0].choices[0].targetNodeId = 'noeud-absent';
  bad.nodes.push({
    id: 'fin-detachee',
    actId: 'acte-1',
    kind: 'failure',
    title: 'Fin détachée',
    text: 'Cette fin ne peut jamais être atteinte.',
    choices: [],
    terminal: {
      endingId: 'detached',
      reason: 'Nœud de test inaccessible.',
      outcomeSummary: 'Test.',
      retryActId: 'acte-1',
    },
  });
  const report = validateNarrativeTree(bad);
  assert.ok(report.errors.some((error) => error.code === 'unknown_target'));
  assert.ok(report.errors.some((error) => error.code === 'unreachable'));

  const cyclic = clone();
  cyclic.nodes.find((node) => node.id === 'charrette').choices[0].targetNodeId = 'depart';
  assert.ok(validateNarrativeTree(cyclic).errors.some((error) => error.code === 'cycle'));
});
