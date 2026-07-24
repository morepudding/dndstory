const fs = require('fs');
const path = require('path');
const { CombatEngine } = require('../src/server/combat-engine');

const DEFAULT_STORY_PATH = path.join(
  __dirname,
  '..',
  'content',
  'chapters',
  'la-route-des-ronces.json',
);

function simulateCombat({
  storyPath = DEFAULT_STORY_PATH,
  maxRound = 10,
  maxStates = 50000,
  initialPotions = 0,
  heroStats = null,
  enemyMaxHp = null,
} = {}) {
  const tree = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
  if (heroStats) tree.hero.stats = { ...tree.hero.stats, ...heroStats };
  const node = tree.nodes.find((candidate) => candidate.kind === 'combat');
  if (!node) throw new Error('Aucun combat à simuler.');
  if (enemyMaxHp !== null) node.combat.enemy.maxHp = enemyMaxHp;
  const engine = new CombatEngine(node.combat, tree.hero);
  const queue = [{
    combat: engine.start(node.id),
    steps: [],
    usedFrost: false,
    usedElan: false,
    usedConcentration: false,
    usedPotion: false,
    potions: initialPotions,
  }];
  const seen = new Set();
  const victories = [];
  const defeats = [];
  let exploredStates = 0;
  let truncated = false;

  while (queue.length > 0) {
    if (exploredStates >= maxStates) {
      truncated = true;
      break;
    }
    const current = queue.shift();
    if (current.combat.round > maxRound) continue;
    const signature = stateSignature(
      current.combat,
      current.usedFrost,
      current.usedElan,
      current.usedConcentration,
      current.usedPotion,
      current.potions,
    );
    if (seen.has(signature)) continue;
    seen.add(signature);
    exploredStates += 1;

    for (const action of legalActions(engine, current.combat, current.potions)) {
      const { resolution, potions } = resolveAction(engine, current.combat, action, current.potions);
      const usedFrost = current.usedFrost || action.cardId === 'entrave-de-givre';
      const usedElan = current.usedElan || action.cardId === 'elan-arcanique';
      const usedConcentration = current.usedConcentration
        || action.cardId === 'orbe-suspendu';
      const usedPotion = current.usedPotion || action.kind === 'item';
      const steps = [...current.steps, action.label];
      if (resolution.outcome) {
        const triggeredConcentration = resolution.combat.log.some(
          (entry) => entry.type === 'concentration_triggered',
        );
        const result = {
          outcome: resolution.outcome,
          rounds: resolution.combat.round,
          playerHp: resolution.combat.player.hp,
          enemyHp: resolution.combat.enemy.hp,
          spellUses: resolution.combat.player.spellUses,
          usedFrost,
          usedElan,
          usedConcentration,
          triggeredConcentration,
          usedPotion,
          steps,
        };
        if (resolution.outcome === 'victory') victories.push(result);
        else defeats.push(result);
        continue;
      }
      queue.push({
        combat: resolution.combat,
        steps,
        usedFrost,
        usedElan,
        usedConcentration,
        usedPotion,
        potions,
      });
    }
  }

  const shortestVictory = [...victories].sort(
    (a, b) => a.steps.length - b.steps.length || b.playerHp - a.playerHp,
  )[0] || null;
  const safestVictory = [...victories].sort(
    (a, b) => b.playerHp - a.playerHp || a.steps.length - b.steps.length,
  )[0] || null;
  const bestWithFrost = bestVictory(victories.filter((result) => result.usedFrost));
  const bestWithoutFrost = bestVictory(victories.filter((result) => !result.usedFrost));
  const bestWithElan = bestVictory(victories.filter((result) => result.usedElan));
  const bestWithoutElan = bestVictory(victories.filter((result) => !result.usedElan));
  const bestWithConcentration = bestVictory(
    victories.filter((result) => result.usedConcentration),
  );
  const bestWithoutConcentration = bestVictory(
    victories.filter((result) => !result.usedConcentration),
  );
  const bestWithTriggeredConcentration = bestVictory(
    victories.filter((result) => result.triggeredConcentration),
  );
  return {
    exploredStates,
    truncated,
    maxRound,
    initialPotions,
    victories: {
      total: victories.length,
      withFrost: victories.filter((result) => result.usedFrost).length,
      withoutFrost: victories.filter((result) => !result.usedFrost).length,
      withElan: victories.filter((result) => result.usedElan).length,
      withoutElan: victories.filter((result) => !result.usedElan).length,
      withConcentration: victories.filter((result) => result.usedConcentration).length,
      withoutConcentration: victories.filter((result) => !result.usedConcentration).length,
      withTriggeredConcentration: victories.filter(
        (result) => result.triggeredConcentration,
      ).length,
      withoutTriggeredConcentration: victories.filter(
        (result) => !result.triggeredConcentration,
      ).length,
      withPotion: victories.filter((result) => result.usedPotion).length,
      withoutPotion: victories.filter((result) => !result.usedPotion).length,
      shortest: shortestVictory,
      safest: safestVictory,
      bestWithFrost,
      bestWithoutFrost,
      bestWithElan,
      bestWithoutElan,
      bestWithConcentration,
      bestWithoutConcentration,
      bestWithTriggeredConcentration,
    },
    defeats: {
      total: defeats.length,
      withFrost: defeats.filter((result) => result.usedFrost).length,
      withoutFrost: defeats.filter((result) => !result.usedFrost).length,
      withElan: defeats.filter((result) => result.usedElan).length,
      withoutElan: defeats.filter((result) => !result.usedElan).length,
      withConcentration: defeats.filter((result) => result.usedConcentration).length,
      withoutConcentration: defeats.filter((result) => !result.usedConcentration).length,
      withTriggeredConcentration: defeats.filter(
        (result) => result.triggeredConcentration,
      ).length,
      withoutTriggeredConcentration: defeats.filter(
        (result) => !result.triggeredConcentration,
      ).length,
    },
  };
}

function bestVictory(results) {
  return [...results].sort(
    (a, b) => a.rounds - b.rounds || b.playerHp - a.playerHp || a.steps.length - b.steps.length,
  )[0] || null;
}

function legalActions(engine, combat, potions = 0) {
  const cards = engine.cardsFor(combat).filter((card) => card.available);
  if (combat.phase === 'reaction') {
    return [
      ...cards.map((card) => ({
        kind: 'card',
        instanceId: card.instanceId,
        cardId: card.id,
        label: `réaction:${card.id}`,
      })),
      { kind: 'pass', cardId: null, label: 'réaction:aucune' },
    ];
  }
  return [
    ...cards.map((card) => ({
      kind: 'card',
      instanceId: card.instanceId,
      cardId: card.id,
      label: `action:${card.id}`,
    })),
    ...(potions > 0
      && combat.player.hp < combat.player.maxHp
      && combat.player.actionsPlayed < combat.player.actionLimit
      ? [{ kind: 'item', cardId: null, label: 'objet:potion-de-soin' }]
      : []),
    { kind: 'end', cardId: null, label: 'action:terminer' },
  ];
}

function resolveAction(engine, combat, action, potions) {
  if (action.kind === 'card') return { resolution: engine.playCard(combat, action.instanceId), potions };
  if (action.kind === 'pass') return { resolution: engine.passReaction(combat), potions };
  if (action.kind === 'item') return { resolution: engine.useItem(combat, 'healing-potion'), potions: potions - 1 };
  return { resolution: engine.endTurn(combat), potions };
}

function stateSignature(
  combat,
  usedFrost,
  usedElan,
  usedConcentration,
  usedPotion,
  potions,
) {
  const state = structuredClone(combat);
  delete state.log;
  return JSON.stringify({
    usedFrost,
    usedElan,
    usedConcentration,
    usedPotion,
    potions,
    state,
  });
}

if (require.main === module) {
  const reports = {
    routeDesRonces: simulateCombat(),
    brumepontSansPotion: simulateCombat({
      storyPath: path.join(__dirname, '..', 'content', 'chapters', 'la-nuit-a-brumepont.json'),
    }),
    brumepontAvecPotion: simulateCombat({
      storyPath: path.join(__dirname, '..', 'content', 'chapters', 'la-nuit-a-brumepont.json'),
      initialPotions: 1,
    }),
    cageDuTreuil: simulateCombat({
      storyPath: path.join(__dirname, '..', 'content', 'chapters', 'la-cage-du-treuil.json'),
    }),
  };
  console.log(JSON.stringify(reports, null, 2));
  if (Object.values(reports).some((report) => report.truncated || report.victories.total === 0)) process.exitCode = 1;
}

module.exports = { simulateCombat };
