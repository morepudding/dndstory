const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { simulateCombat } = require('../tools/simulate-combat');

test('l’exploration exhaustive conserve des victoires avec et sans Entrave de givre', () => {
  const report = simulateCombat();
  assert.equal(report.truncated, false);
  assert.ok(report.exploredStates > 0);
  assert.ok(report.victories.withFrost > 0);
  assert.ok(report.victories.withoutFrost > 0);
  assert.ok(report.defeats.total > 0);
  assert.ok(report.victories.shortest);
});

test('le Guetteur reste battable sans potion et la potion ouvre des victoires où elle est réellement bue', () => {
  const storyPath = path.join(__dirname, '..', 'content', 'chapters', 'la-nuit-a-brumepont.json');
  const levelTwoAgility = {
    strength: 1,
    constitution: 2,
    agility: 3,
    wisdom: 3,
    intelligence: 2,
  };
  const levelTwoStrength = {
    strength: 2,
    constitution: 2,
    agility: 2,
    wisdom: 3,
    intelligence: 2,
  };
  const withoutPotion = simulateCombat({ storyPath, heroStats: levelTwoAgility });
  const withPotion = simulateCombat({
    storyPath,
    heroStats: levelTwoStrength,
    initialPotions: 1,
  });
  assert.equal(withoutPotion.truncated, false);
  assert.equal(withPotion.truncated, false);
  assert.ok(withoutPotion.victories.total > 0);
  assert.ok(withPotion.victories.withPotion > 0);
  assert.ok(withPotion.victories.withoutPotion > 0);
});

test('Varek reste battable avec et sans Élan arcanique', () => {
  const storyPath = path.join(__dirname, '..', 'content', 'chapters', 'la-cage-du-treuil.json');
  const report = simulateCombat({ storyPath });
  assert.equal(report.truncated, false);
  assert.ok(report.victories.withElan > 0);
  assert.ok(report.victories.withoutElan > 0);
  assert.ok(report.victories.bestWithElan);
  assert.ok(report.victories.bestWithoutElan);
});

test('Varek reste battable avec un Orbe déclenché et sans jouer Orbe', () => {
  const storyPath = path.join(__dirname, '..', 'content', 'chapters', 'la-cage-du-treuil.json');
  const report = simulateCombat({ storyPath });
  assert.equal(report.truncated, false);
  assert.ok(report.victories.withTriggeredConcentration > 0);
  assert.ok(report.victories.withoutConcentration > 0);
  assert.ok(report.victories.bestWithTriggeredConcentration);
  assert.ok(report.victories.bestWithoutConcentration);
});
