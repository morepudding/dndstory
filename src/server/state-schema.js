const SCHEMA_VERSION = 16;
const RELATION_KEYS = ['trust', 'attraction', 'irritation', 'curiosity', 'vulnerability'];
const PROGRESSION_STAT_KEYS = ['strength', 'constitution', 'agility', 'wisdom', 'intelligence'];

function nowIso() { return new Date().toISOString(); }
function createStoryState() {
  return { activeRun: null, cageOutcome: null, thirdLevelOutcome: null };
}
function createDefaultProgression() {
  return {
    level: 1,
    stats: {
      strength: 1,
      constitution: 2,
      agility: 2,
      wisdom: 3,
      intelligence: 2,
    },
    unspentStatPoints: 0,
    gold: 0,
    inventory: { 'healing-potion': 0 },
    transactionHistory: [],
    claimedRewardIds: [],
    rewardHistory: [],
  };
}

function createDefaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    updatedAt: nowIso(),
    contentConsent: { adultConfirmedAt: null },
    character: {
      identity: { name: 'Sorcier', age: 20, occupation: 'aventurier arcanique' },
      personality: {
        traits: ['curieux', 'prudent', 'déterminé'],
        speakingStyle: ['français naturel', 'réponses brèves', 'ton de fantasy accessible'],
        permanentInstructions: ['Rester dans l’univers de fantasy.', 'Ne jamais décider à la place du joueur.'],
      },
      relationship: { trust: 0, attraction: 0, irritation: 0, curiosity: 50, vulnerability: 0, status: 'première aventure' },
      scene: { location: 'route de Brumepont', time: 'fin d’après-midi', outfit: 'manteau de voyage', mood: 'vigilant' },
      progression: createDefaultProgression(),
      memories: [],
      relationshipEvents: [],
    },
    conversation: { threadId: null, messages: [] },
    story: createStoryState(),
    recoveryEvents: [],
  };
}

function migrateState(input) {
  if (!input || typeof input !== 'object') return createDefaultState();
  if (input.schemaVersion === SCHEMA_VERSION) return input;
  if ([12, 13, 14, 15].includes(input.schemaVersion)) {
    const next = structuredClone(input);
    next.schemaVersion = SCHEMA_VERSION;
    next.story = { ...createStoryState(), ...(next.story || {}) };
    ensureCombatPlayerState(next);
    return next;
  }
  if (input.schemaVersion === 11) {
    const next = structuredClone(input);
    next.schemaVersion = SCHEMA_VERSION;
    next.story = { ...createStoryState(), ...(next.story || {}) };
    ensureCombatPlayerState(next);
    return next;
  }
  if (input.schemaVersion === 10) {
    const next = structuredClone(input);
    next.schemaVersion = SCHEMA_VERSION;
    next.character.progression.inventory = { 'healing-potion': 0 };
    next.character.progression.transactionHistory = [];
    next.story = { ...createStoryState(), ...(next.story || {}) };
    ensureCombatPlayerState(next);
    return next;
  }
  if (input.schemaVersion === 9) {
    const next = structuredClone(input);
    next.schemaVersion = SCHEMA_VERSION;
    next.character.progression = createDefaultProgression();
    next.story = { ...createStoryState(), ...(next.story || {}) };
    ensureCombatPlayerState(next);
    return next;
  }
  if ([2, 3, 4, 5, 6, 7, 8].includes(input.schemaVersion)) {
    const next = structuredClone(input);
    const hadRun = Boolean(next.narrative?.activeRun || next.story?.activeRun);
    next.schemaVersion = SCHEMA_VERSION;
    next.contentConsent = next.contentConsent || { adultConfirmedAt: null };
    next.story = createStoryState();
    delete next.narrative;
    next.character.progression = createDefaultProgression();
    if (hadRun) next.conversation.messages = (next.conversation.messages || []).filter((message) => !message.runId);
    next.recoveryEvents = Array.isArray(next.recoveryEvents) ? next.recoveryEvents : [];
    if (hadRun) next.recoveryEvents.push({ type: 'branching_book_engine_reset', at: nowIso(), reason: 'L’ancienne partie a été retirée lors de l’ajout de la pioche ennemie et des états de combat.' });
    return next;
  }
  if (input.version === 1 && input.character) {
    const base = createDefaultState();
    const old = input.character;
    base.character.identity = { name: old.name || 'Sorcier', age: old.identity?.age ?? 20, occupation: old.identity?.occupation || base.character.identity.occupation };
    base.character.relationship = { ...base.character.relationship, trust: old.relationship?.trust ?? 34, attraction: old.relationship?.attraction ?? 48, status: `niveau historique ${old.relationship?.level ?? 1}` };
    base.character.scene = { ...base.character.scene, ...(old.scene || {}) };
    base.character.memories = (old.memories_about_user || []).map((content, index) => ({ id: `migrated-${index + 1}`, content: String(content), normalizedContent: normalizeText(content), createdAt: nowIso(), updatedAt: nowIso(), source: { userMessage: 'Migration depuis Candy v1', assistantResponse: null } }));
    base.conversation.threadId = input.codexThreadId || null;
    base.conversation.messages = Array.isArray(input.messages) ? input.messages.slice(-120) : [];
    return base;
  }
  throw new Error('Version de données Fantasy Story non prise en charge.');
}

function validateCanonicalState(state) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!state || typeof state !== 'object' || Array.isArray(state)) fail('state doit être un objet');
  if (state?.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion doit valoir ${SCHEMA_VERSION}`);
  if (!Number.isInteger(state?.revision) || state.revision < 0) fail('revision invalide');
  if (!isIsoDate(state?.updatedAt)) fail('updatedAt invalide');
  if (!(state?.contentConsent?.adultConfirmedAt === null || isIsoDate(state?.contentConsent?.adultConfirmedAt))) fail('contentConsent invalide');
  const c = state?.character;
  if (!nonEmpty(c?.identity?.name) || !Number.isInteger(c?.identity?.age) || !nonEmpty(c?.identity?.occupation)) fail('identity invalide');
  if (!Array.isArray(c?.personality?.traits) || !Array.isArray(c?.personality?.speakingStyle) || !Array.isArray(c?.personality?.permanentInstructions)) fail('personality invalide');
  for (const dimension of RELATION_KEYS) if (!boundedNumber(c?.relationship?.[dimension], 0, 100)) fail(`relationship.${dimension} invalide`);
  if (!nonEmpty(c?.relationship?.status)) fail('relationship.status invalide');
  for (const key of ['location', 'time', 'outfit', 'mood']) if (!nonEmpty(c?.scene?.[key])) fail(`scene.${key} invalide`);
  validateProgression(c?.progression, fail);
  if (!Array.isArray(c?.memories) || !Array.isArray(c?.relationshipEvents)) fail('mémoire personnage invalide');
  if (!state?.conversation || !Array.isArray(state.conversation.messages) || !(state.conversation.threadId === null || nonEmpty(state.conversation.threadId))) fail('conversation invalide');
  else state.conversation.messages.forEach((message, index) => { if (!['user', 'assistant'].includes(message?.role) || !nonEmpty(message?.content) || !isIsoDate(message?.at)) fail(`message ${index} invalide`); });
  validateStory(state?.story, fail);
  if (!Array.isArray(state?.recoveryEvents)) fail('recoveryEvents doit être un tableau');
  if (errors.length) throw new Error(`État canonique invalide: ${errors.join('; ')}`);
  return state;
}

function ensureCombatPlayerState(state) {
  const player = state.story?.activeRun?.combat?.player;
  if (!player) return;
  if (!Array.isArray(player.statuses)) player.statuses = [];
  if (typeof player.spontaneousMagicAvailable !== 'boolean') {
    player.spontaneousMagicAvailable = true;
  }
}

function validateProgression(progression, fail) {
  if (
    !progression
    || !Number.isInteger(progression.level)
    || progression.level < 1
    || !Number.isInteger(progression.unspentStatPoints)
    || progression.unspentStatPoints < 0
    || !Number.isInteger(progression.gold)
    || progression.gold < 0
  ) {
    fail('character.progression invalide');
    return;
  }
  if (
    !progression.inventory
    || Object.keys(progression.inventory).some((id) => id !== 'healing-potion')
    || !Number.isInteger(progression.inventory['healing-potion'])
    || progression.inventory['healing-potion'] < 0
  ) {
    fail('character.progression.inventory invalide');
  }
  if (!Array.isArray(progression.transactionHistory)) {
    fail('character.progression.transactionHistory invalide');
  } else {
    const transactionIds = new Set();
    progression.transactionHistory.forEach((transaction, index) => {
      if (
        ![transaction?.id, transaction?.offerId, transaction?.title, transaction?.storyId, transaction?.choiceId].every(nonEmpty)
        || !positiveInteger(transaction?.gold)
        || !isIsoDate(transaction?.purchasedAt)
        || !(transaction.itemId == null || nonEmpty(transaction.itemId))
        || !(transaction.quantity == null || positiveInteger(transaction.quantity))
        || transactionIds.has(transaction.id)
      ) {
        fail(`character.progression.transactionHistory.${index} invalide`);
      }
      transactionIds.add(transaction?.id);
    });
  }
  for (const stat of PROGRESSION_STAT_KEYS) {
    if (!Number.isInteger(progression.stats?.[stat]) || progression.stats[stat] < 1 || progression.stats[stat] > 3) {
      fail(`character.progression.stats.${stat} invalide`);
    }
  }
  if (
    !Array.isArray(progression.claimedRewardIds)
    || progression.claimedRewardIds.some((id) => !nonEmpty(id))
    || new Set(progression.claimedRewardIds).size !== progression.claimedRewardIds.length
  ) {
    fail('character.progression.claimedRewardIds invalide');
  }
  if (!Array.isArray(progression.rewardHistory)) {
    fail('character.progression.rewardHistory invalide');
    return;
  }
  progression.rewardHistory.forEach((reward, index) => {
    if (
      ![reward?.id, reward?.title, reward?.storyId, reward?.endingId].every(nonEmpty)
      || !Number.isInteger(reward?.previousLevel)
      || !Number.isInteger(reward?.level)
      || !Number.isInteger(reward?.statPoints)
      || !Number.isInteger(reward?.gold)
      || reward.previousLevel < 1
      || reward.level < reward.previousLevel
      || reward.statPoints < 0
      || reward.gold < 0
      || !isIsoDate(reward.claimedAt)
    ) {
      fail(`character.progression.rewardHistory.${index} invalide`);
    }
  });
}

function validateStory(story, fail) {
  if (!story || !Object.prototype.hasOwnProperty.call(story, 'activeRun')) return fail('story invalide');
  if (![null, 'captive-sauvee', 'ordres-recuperes'].includes(story.cageOutcome)) {
    fail('story.cageOutcome invalide');
  }
  if (![null, 'passage-condamne', 'passage-maintenu'].includes(story.thirdLevelOutcome)) {
    fail('story.thirdLevelOutcome invalide');
  }
  if (story.activeRun === null) return;
  const run = story.activeRun;
  if (![run.id, run.storyId, run.activeNodeId, run.status, run.startedAt].every(nonEmpty)) fail('story.activeRun invalide');
  if (!(run.sourceEndingId == null || nonEmpty(run.sourceEndingId))) fail('story.activeRun.sourceEndingId invalide');
  if (!(run.arcaneCharges == null || (Number.isInteger(run.arcaneCharges) && run.arcaneCharges >= 0 && run.arcaneCharges <= 3))) {
    fail('story.activeRun.arcaneCharges invalide');
  }
  if (!['active', 'success', 'failure'].includes(run.status)) fail('story.activeRun.status invalide');
  if (!Array.isArray(run.history)) fail('story.activeRun.history invalide');
  for (const [index, item] of (run.history || []).entries()) {
    if (item?.kind === 'choice') {
      if (![item.nodeId, item.choiceId, item.targetNodeId, item.playerText, item.chosenAt].every(nonEmpty)) {
        fail(`story.activeRun.history.${index} invalide`);
      }
      if (!isIsoDate(item.chosenAt)) fail(`story.activeRun.history.${index}.chosenAt invalide`);
    } else if (item?.kind === 'combat') {
      if (
        ![item.nodeId, item.outcome, item.targetNodeId, item.completedAt].every(nonEmpty)
        || !['victory', 'defeat'].includes(item.outcome)
        || !Number.isInteger(item.rounds)
        || !Number.isFinite(item.playerHp)
        || !Number.isFinite(item.enemyHp)
        || !Number.isInteger(item.spellUses)
      ) {
        fail(`story.activeRun.history.${index} invalide`);
      }
      if (!isIsoDate(item.completedAt)) fail(`story.activeRun.history.${index}.completedAt invalide`);
    } else {
      fail(`story.activeRun.history.${index}.kind invalide`);
    }
  }
  validateCombat(run.combat, fail);
  if (!isIsoDate(run.startedAt)) fail('story.activeRun.startedAt invalide');
  if (!(run.completedAt === null || isIsoDate(run.completedAt))) fail('story.activeRun.completedAt invalide');
  if (run.status === 'active' && (run.completedAt !== null || run.ending !== null)) fail('story active terminée de façon incohérente');
  if (run.status !== 'active' && (!run.ending || !nonEmpty(run.ending.endingId) || !nonEmpty(run.ending.reason) || !nonEmpty(run.ending.outcomeSummary))) fail('story ending invalide');
}

function validateCombat(combat, fail) {
  if (combat === null) return;
  if (
    !combat
    || !nonEmpty(combat.nodeId)
    || !Number.isInteger(combat.round)
    || combat.round < 1
    || !['player', 'reaction'].includes(combat.phase)
  ) {
    fail('story.activeRun.combat invalide');
    return;
  }
  for (const fighter of [combat.player, combat.enemy]) {
    if (
      !nonEmpty(fighter?.name)
      || !Number.isFinite(fighter?.hp)
      || !Number.isFinite(fighter?.maxHp)
      || fighter.hp < 0
      || fighter.hp > fighter.maxHp
    ) {
      fail('story.activeRun.combat combattant invalide');
    }
  }
  if (
    !Number.isInteger(combat.player?.spellUses)
    || !Number.isInteger(combat.player?.maxSpellUses)
    || combat.player.spellUses < 0
    || combat.player.spellUses > combat.player.maxSpellUses
  ) {
    fail('story.activeRun.combat charges invalides');
  }
  if (typeof combat.player?.spontaneousMagicAvailable !== 'boolean') {
    fail('story.activeRun.combat Magie spontanée invalide');
  }
  for (const stat of ['strength', 'constitution', 'agility', 'wisdom', 'intelligence']) {
    if (!Number.isInteger(combat.player?.stats?.[stat]) || combat.player.stats[stat] < 1 || combat.player.stats[stat] > 3) {
      fail(`story.activeRun.combat ${stat} invalide`);
    }
  }
  if (
    !Number.isInteger(combat.player?.actionLimit)
    || !Number.isInteger(combat.player?.actionsPlayed)
    || !Number.isInteger(combat.player?.drawCount)
    || combat.player.actionLimit !== combat.player.stats?.agility
    || combat.player.drawCount !== combat.player.stats?.wisdom
    || combat.player.actionsPlayed < 0
    || combat.player.actionsPlayed > combat.player.actionLimit
  ) {
    fail('story.activeRun.combat économie d’actions invalide');
  }
  if (!Number.isInteger(combat.enemy?.drawCount) || combat.enemy.drawCount < 1) {
    fail('story.activeRun.combat pioche ennemie invalide');
  }
  for (const [name, pile] of [
    ['drawPile', combat.drawPile],
    ['hand', combat.hand],
    ['discardPile', combat.discardPile],
    ['enemy.drawPile', combat.enemy?.drawPile],
    ['enemy.hand', combat.enemy?.hand],
    ['enemy.discardPile', combat.enemy?.discardPile],
  ]) {
    if (
      !Array.isArray(pile)
      || pile.some((card) => !nonEmpty(card?.instanceId) || !nonEmpty(card?.cardId))
    ) {
      fail(`story.activeRun.combat ${name} invalide`);
    }
  }
  const playerStatuses = combat.player?.statuses;
  const playerStatusIds = Array.isArray(playerStatuses)
    ? playerStatuses.map((status) => status?.id)
    : [];
  const tempoStatusCount = playerStatusIds.filter(
    (id) => ['advantage', 'disadvantage'].includes(id),
  ).length;
  if (
    !Array.isArray(playerStatuses)
    || playerStatuses.length > 2
    || new Set(playerStatusIds).size !== playerStatusIds.length
    || tempoStatusCount > 1
    || playerStatuses.some((status) => {
      if (
        !nonEmpty(status?.name)
        || status?.stacks !== 1
        || !nonEmpty(status?.description)
      ) return true;
      if (['advantage', 'disadvantage'].includes(status.id)) return false;
      return (
        status.id !== 'concentration'
        || !nonEmpty(status.sourceCardId)
        || !nonEmpty(status.sourceCardName)
        || !Number.isInteger(status.damage)
        || status.damage < 1
      );
    })
  ) {
    fail('story.activeRun.combat états du Sorcier invalides');
  }
  if (
    !Array.isArray(combat.enemy?.statuses)
    || combat.enemy.statuses.some(
      (status) => (
        status?.id !== 'slowed'
        || !nonEmpty(status?.name)
        || !Number.isInteger(status?.stacks)
        || status.stacks < 1
        || !nonEmpty(status?.description)
      ),
    )
  ) {
    fail('story.activeRun.combat états ennemis invalides');
  }
  if (!Array.isArray(combat.log) || combat.log.some((entry) => !Number.isInteger(entry?.round) || !nonEmpty(entry?.type) || !nonEmpty(entry?.text))) {
    fail('story.activeRun.combat journal invalide');
  }
  if (combat.phase === 'reaction') {
    if (
      !nonEmpty(combat.pendingAttack?.instanceId)
      || !nonEmpty(combat.pendingAttack?.cardId)
      || !nonEmpty(combat.pendingAttack?.name)
      || !Number.isInteger(combat.pendingAttack?.damage)
      || (
        combat.pendingAttack.effect != null
        && !validPendingAttackEffect(combat.pendingAttack.effect)
      )
    ) {
      fail('story.activeRun.combat attaque invalide');
    }
  } else if (combat.pendingAttack !== null) {
    fail('story.activeRun.combat attaque inattendue');
  }
}

function validPendingAttackEffect(effect) {
  const status = effect?.status;
  return (
    effect
    && typeof effect === 'object'
    && Object.keys(effect).length === 1
    && status?.id === 'disadvantage'
    && status?.target === 'player'
    && status?.stacks === 1
  );
}

function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function boundedNumber(value, min, max) { return Number.isFinite(value) && value >= min && value <= max; }
function positiveInteger(value) { return Number.isInteger(value) && value > 0; }
function isIsoDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function normalizeText(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }

module.exports = {
  PROGRESSION_STAT_KEYS,
  RELATION_KEYS,
  SCHEMA_VERSION,
  createDefaultProgression,
  createDefaultState,
  createStoryState,
  migrateState,
  normalizeText,
  validateCanonicalState,
};
