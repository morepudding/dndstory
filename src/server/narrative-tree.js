const NODE_KINDS = new Set(['choice', 'combat', 'success', 'failure']);
const TREE_FIELDS = new Set([
  'schemaVersion', 'format', 'status', 'id', 'title', 'globalPremise',
  'chapterSummary', 'showChapterSummary', 'rating', 'participantsAllAdults',
  'contentWarnings', 'designRules', 'hero', 'entryNodeId', 'sourceEntryNodeIds',
  'usesArcaneChargePool',
  'continueLabel', 'acts', 'nodes',
]);
const HERO_FIELDS = new Set(['className', 'level', 'stats']);
const STAT_KEYS = ['strength', 'constitution', 'agility', 'wisdom', 'intelligence'];
const STATS_FIELDS = new Set(STAT_KEYS);
const ACT_FIELDS = new Set(['id', 'index', 'title', 'entryNodeId', 'summary']);
const NODE_FIELDS = new Set([
  'id', 'actId', 'kind', 'title', 'text', 'role', 'humanStake',
  'relationalMovement', 'choices', 'terminal', 'combat',
  'victoryTargetNodeId', 'defeatTargetNodeId', 'sourceVariants',
]);
const CHOICE_FIELDS = new Set([
  'id', 'role', 'label', 'playerText', 'targetNodeId', 'sourceTargetNodeIds',
  'requirements', 'transaction', 'arcaneChargeCost',
]);
const REQUIREMENT_FIELDS = new Set(['stat', 'min', 'gold', 'arcaneCharges']);
const SOURCE_VARIANT_FIELDS = new Set(['title', 'text']);
const TRANSACTION_FIELDS = new Set(['id', 'title', 'gold', 'item']);
const ITEM_GRANT_FIELDS = new Set(['id', 'quantity']);
const TERMINAL_FIELDS = new Set(['endingId', 'reason', 'outcomeSummary', 'retryActId', 'reward']);
const REWARD_FIELDS = new Set(['id', 'title', 'level', 'statPoints', 'gold']);
const COMBAT_FIELDS = new Set(['player', 'enemy']);
const PLAYER_FIELDS = new Set(['name', 'portrait', 'cards', 'deck']);
const ENEMY_FIELDS = new Set(['name', 'portrait', 'maxHp', 'drawCount', 'cards', 'deck']);
const ENEMY_CARD_FIELDS = new Set(['id', 'name', 'damage', 'description', 'effect']);
const CARD_FIELDS = new Set([
  'id', 'name', 'timing', 'family', 'role', 'chargeCost', 'description', 'art', 'effect',
]);
const EFFECT_FIELDS = new Set(['damage', 'block', 'status', 'concentration']);
const STATUS_EFFECT_FIELDS = new Set(['id', 'target', 'stacks']);
const CONCENTRATION_EFFECT_FIELDS = new Set(['damage']);

function validateNarrativeTree(tree, { publish = false } = {}) {
  const errors = [];
  const warnings = [];
  const fail = (code, message, location = null) => errors.push({ code, message, location });
  const warn = (code, message, location = null) => warnings.push({ code, message, location });

  if (!tree || typeof tree !== 'object' || Array.isArray(tree)) {
    return {
      accepted: false,
      errors: [{ code: 'tree_type', message: 'Le brouillon doit être un objet.', location: null }],
      warnings,
      metrics: emptyMetrics(),
    };
  }

  if (tree.schemaVersion !== 4) fail('schema_version', 'schemaVersion doit valoir 4.', 'schemaVersion');
  if (tree.format !== 'branching-book') fail('format', 'Le format doit être branching-book.', 'format');
  rejectUnknownFields(tree, TREE_FIELDS, fail, 'tree');
  for (const key of ['id', 'title', 'globalPremise', 'chapterSummary', 'entryNodeId']) {
    if (!nonEmpty(tree[key])) fail('tree_field', `${key} est obligatoire.`, key);
  }
  if (!['draft', 'approved'].includes(tree.status)) fail('status', 'Le statut doit être draft ou approved.', 'status');
  if (!['general', '18+'].includes(tree.rating)) fail('rating', 'La classification doit être general ou 18+.', 'rating');
  if (tree.rating === '18+' && tree.participantsAllAdults !== true) {
    fail('adult_cast', 'Tous les participants d’un scénario 18+ doivent être majeurs.', 'participantsAllAdults');
  }
  if (!Array.isArray(tree.contentWarnings)) fail('content_warnings', 'contentWarnings doit être un tableau.', 'contentWarnings');
  if (!Array.isArray(tree.designRules) || !tree.designRules.every(nonEmpty)) {
    fail('design_rules', 'designRules doit contenir les règles éditoriales du brouillon.', 'designRules');
  }
  if (tree.usesArcaneChargePool != null && typeof tree.usesArcaneChargePool !== 'boolean') {
    fail('arcane_charge_pool', 'usesArcaneChargePool doit être booléen.', 'usesArcaneChargePool');
  }
  if (tree.continueLabel != null && !nonEmpty(tree.continueLabel)) {
    fail('continue_label', 'continueLabel doit être un texte non vide.', 'continueLabel');
  }
  validateHero(tree.hero, fail);

  const acts = Array.isArray(tree.acts) ? tree.acts : [];
  const actIds = new Set();
  const actById = new Map();
  for (const [index, act] of acts.entries()) {
    rejectUnknownFields(act, ACT_FIELDS, fail, `acts.${index}`);
    if (
      !nonEmpty(act?.id)
      || !Number.isInteger(act?.index)
      || !nonEmpty(act?.title)
      || !nonEmpty(act?.entryNodeId)
      || !nonEmpty(act?.summary)
    ) {
      fail('act', 'Chaque acte exige id, index, title, entryNodeId et summary.', `acts.${index}`);
    }
    if (actIds.has(act?.id)) fail('duplicate_act', `Acte dupliqué : ${act?.id}`, `acts.${index}`);
    actIds.add(act?.id);
    actById.set(act?.id, act);
  }
  if (acts.length < 1) fail('act_count', 'Le livre-jeu doit contenir au moins un acte.', 'acts');
  [...acts].sort((a, b) => a.index - b.index).forEach((act, index) => {
    if (act.index !== index + 1) fail('act_index', 'Les actes doivent être numérotés sans interruption.', act.id);
  });

  const nodes = Array.isArray(tree.nodes) ? tree.nodes : [];
  const nodeById = new Map();
  const choiceIds = new Set();
  const anchoringNodes = [];
  for (const [nodeIndex, node] of nodes.entries()) {
    const location = `nodes.${nodeIndex}`;
    rejectUnknownFields(node, NODE_FIELDS, fail, location);
    if (!nonEmpty(node?.id) || !nonEmpty(node?.actId) || !nonEmpty(node?.title) || !nonEmpty(node?.text)) {
      fail('node', 'Chaque nœud exige id, actId, title et text.', location);
    }
    if (!NODE_KINDS.has(node?.kind)) fail('node_kind', `Type de nœud invalide : ${node?.kind}`, location);
    if (node?.role != null && !['anchoring', 'strategic'].includes(node.role)) {
      fail('node_role', `Rôle de nœud invalide : ${node?.role}`, location);
    }
    if (nodeById.has(node?.id)) fail('duplicate_node', `Nœud dupliqué : ${node?.id}`, location);
    nodeById.set(node?.id, node);
    if (!actIds.has(node?.actId)) fail('node_act', `Acte inconnu : ${node?.actId}`, location);

    const choices = Array.isArray(node?.choices) ? node.choices : [];
    if (node?.kind === 'choice' && (choices.length < 2 || choices.length > 4)) {
      fail('choice_count', `${node?.id} doit proposer entre 2 et 4 choix.`, location);
    }
    if (node?.kind !== 'choice' && choices.length) {
      fail('non_choice_choices', `${node?.id} ne doit pas proposer de choix narratifs.`, location);
    }
    if (['success', 'failure'].includes(node?.kind)) validateTerminal(node, actIds, fail, location);
    if (node?.kind === 'combat') validateCombatNode(node, fail, location);
    if (node?.kind !== 'combat' && (node?.combat || node?.victoryTargetNodeId || node?.defeatTargetNodeId)) {
      fail('combat_fields', `${node?.id} n’est pas un combat.`, location);
    }
    if (!['success', 'failure'].includes(node?.kind) && node?.terminal) {
      fail('terminal_fields', `${node?.id} n’est pas une fin.`, location);
    }
    validateSourceVariants(node?.sourceVariants, fail, location);

    const localLabels = new Set();
    const localTargets = new Set();
    for (const [choiceIndex, choice] of choices.entries()) {
      const choiceLocation = `${location}.choices.${choiceIndex}`;
      rejectUnknownFields(choice, CHOICE_FIELDS, fail, choiceLocation);
      for (const key of ['id', 'label', 'playerText', 'targetNodeId']) {
        if (!nonEmpty(choice?.[key])) fail('choice_field', `${key} est obligatoire.`, choiceLocation);
      }
      if (choice?.role != null && !['anchoring', 'strategic'].includes(choice.role)) {
        fail('choice_role', `Rôle de choix invalide : ${choice?.role}`, choiceLocation);
      }
      validateSourceTargetNodeIds(choice?.sourceTargetNodeIds, fail, choiceLocation);
      if (choiceIds.has(choice?.id)) fail('duplicate_choice', `Choix dupliqué : ${choice?.id}`, choiceLocation);
      choiceIds.add(choice?.id);
      validateRequirements(choice?.requirements, fail, choiceLocation);
      validateTransaction(choice?.transaction, fail, choiceLocation);
      if (choice?.arcaneChargeCost != null) {
        const chargeRequirement = (choice.requirements || []).find((requirement) => requirement.arcaneCharges != null);
        if (
          !tree.usesArcaneChargePool
          || !positiveInteger(choice.arcaneChargeCost)
          || !chargeRequirement
          || chargeRequirement.arcaneCharges < choice.arcaneChargeCost
        ) {
          fail('arcane_charge_cost', 'Le coût arcanique exige une réserve active et une condition de charge correspondante.', choiceLocation);
        }
      }
      if (String(choice?.label || '').length > 78) {
        warn('long_choice', `Le bouton « ${choice?.label} » dépasse 78 caractères.`, choiceLocation);
      }
      const label = normalize(choice?.label);
      if (localLabels.has(label)) warn('similar_choices', `Deux choix de ${node?.id} ont le même libellé.`, location);
      const targetSignature = `${choice?.targetNodeId}:${JSON.stringify(choice?.sourceTargetNodeIds || {})}:${JSON.stringify(choice?.requirements || [])}:${JSON.stringify(choice?.transaction || null)}`;
      if (node?.role !== 'anchoring' && localTargets.has(targetSignature)) {
        warn('same_target', `Deux choix de ${node?.id} mènent directement au même nœud.`, location);
      }
      localLabels.add(label);
      localTargets.add(targetSignature);
    }
    if (
      node?.kind === 'choice'
      && tree.hero?.stats
      && !choices.some((choice) => meetsChoiceRequirements(choice, tree.hero.stats))
    ) {
      fail('choice_softlock', `${node.id} ne laisse aucun choix accessible aux statistiques du héros.`, location);
    }

    if (node?.role === 'anchoring') {
      anchoringNodes.push(node);
      if (node.kind !== 'choice' || choices.some((choice) => choice.role !== 'anchoring')) {
        fail('anchoring_role', `${node.id} doit contenir uniquement des choix d’ancrage.`, location);
      }
      if (new Set(choices.map((choice) => JSON.stringify({
        targetNodeId: choice.targetNodeId,
        sourceTargetNodeIds: choice.sourceTargetNodeIds || {},
      }))).size !== 1) {
        fail('anchoring_target', `${node.id} doit faire converger tous ses choix.`, location);
      }
    }
  }
  if (anchoringNodes.length !== 1) {
    fail('anchoring_count', 'Le chapitre doit contenir exactement un nœud d’ancrage.', 'nodes');
  }

  if (!nodeById.has(tree.entryNodeId)) fail('entry_node', `Nœud d’entrée inconnu : ${tree.entryNodeId}`, 'entryNodeId');
  if (
    tree.sourceEntryNodeIds != null
    && (
      typeof tree.sourceEntryNodeIds !== 'object'
      || Array.isArray(tree.sourceEntryNodeIds)
    )
  ) {
    fail('source_entry_nodes', 'sourceEntryNodeIds doit être un objet.', 'sourceEntryNodeIds');
  } else {
    for (const [sourceEndingId, entryNodeId] of Object.entries(tree.sourceEntryNodeIds || {})) {
      if (!nonEmpty(sourceEndingId) || !nonEmpty(entryNodeId)) {
        fail(
          'source_entry_node',
          'Chaque entrée héritée exige une provenance et un nœud non vides.',
          `sourceEntryNodeIds.${sourceEndingId}`,
        );
        continue;
      }
      if (!nodeById.has(entryNodeId)) {
        fail(
          'source_entry_node',
          `Nœud d’entrée hérité inconnu : ${entryNodeId}`,
          `sourceEntryNodeIds.${sourceEndingId}`,
        );
      }
    }
  }
  for (const act of acts) {
    const entry = nodeById.get(act.entryNodeId);
    if (!entry) fail('act_entry', `Entrée inconnue pour ${act.id}.`, act.id);
    else if (entry.actId !== act.id) fail('act_entry_scope', `L’entrée de ${act.id} appartient à ${entry.actId}.`, act.id);
  }

  for (const node of nodes) {
    for (const edge of outgoingEdges(node)) {
      const target = nodeById.get(edge.targetNodeId);
      if (!target) {
        fail('unknown_target', `Cible inconnue : ${edge.targetNodeId}`, `${node.id}.${edge.id}`);
        continue;
      }
      const fromAct = actById.get(node.actId)?.index;
      const toAct = actById.get(target.actId)?.index;
      if (toAct < fromAct || toAct > fromAct + 1) {
        fail('act_direction', `${node.id} ne peut cibler ${target.id}.`, `${node.id}.${edge.id}`);
      }
    }
  }

  const analysis = analyzeNarrativeTree(tree, nodeById);
  errors.push(...analysis.errors);
  warnings.push(...analysis.warnings);
  if (analysis.metrics.successPathCount < 1) fail('success_path_count', 'Le brouillon doit avoir au moins une route gagnante.', 'nodes');
  if (analysis.metrics.failureEndingCount < 1) fail('failure_ending_count', 'Le brouillon doit avoir au moins une fin d’échec.', 'nodes');
  if (publish && tree.status !== 'approved') {
    fail('draft_not_approved', 'Le brouillon doit être approuvé avant publication.', 'status');
  }
  return { accepted: errors.length === 0, errors, warnings, metrics: analysis.metrics };
}

function analyzeNarrativeTree(tree, suppliedNodeById = null) {
  const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
  const nodeById = suppliedNodeById || new Map(nodes.map((node) => [node.id, node]));
  const errors = [];
  const warnings = [];
  const state = new Map();
  const reachable = new Set();
  let cyclic = false;

  function visit(id) {
    if (state.get(id) === 1) {
      cyclic = true;
      return;
    }
    if (state.get(id) === 2) return;
    const node = nodeById.get(id);
    if (!node) return;
    state.set(id, 1);
    reachable.add(id);
    for (const edge of outgoingEdges(node)) visit(edge.targetNodeId);
    state.set(id, 2);
  }

  visit(tree.entryNodeId);
  if (cyclic) errors.push({ code: 'cycle', message: 'Le brouillon contient au moins une boucle.', location: 'nodes' });
  for (const node of nodes) {
    if (!reachable.has(node.id)) {
      errors.push({ code: 'unreachable', message: `Nœud inaccessible : ${node.id}`, location: node.id });
    }
  }

  const paths = [];
  if (!cyclic && nodeById.has(tree.entryNodeId)) enumerate(tree.entryNodeId, [], [], new Set());

  function enumerate(nodeId, decisionPath, nodePath, guard) {
    if (guard.has(nodeId) || paths.length > 100000) return;
    const node = nodeById.get(nodeId);
    if (!node) return;
    const nextGuard = new Set(guard);
    nextGuard.add(nodeId);
    const nextNodes = [...nodePath, nodeId];
    if (node.kind === 'success' || node.kind === 'failure') {
      paths.push({
        outcome: node.kind,
        endingId: node.terminal?.endingId || node.id,
        choices: decisionPath,
        nodes: nextNodes,
        length: decisionPath.length,
      });
      return;
    }
    const edges = outgoingEdges(node);
    if (!edges.length) {
      errors.push({ code: 'dead_end', message: `${node.id} ne mène à aucune fin.`, location: node.id });
      return;
    }
    if (node.role === 'anchoring') {
      for (const targetNodeId of new Set(edges.map((edge) => edge.targetNodeId))) {
        enumerate(targetNodeId, decisionPath, nextNodes, new Set(nextGuard));
      }
      return;
    }
    for (const edge of edges) {
      enumerate(edge.targetNodeId, [...decisionPath, edge.id], nextNodes, nextGuard);
    }
  }

  if (paths.length > 100000) {
    errors.push({ code: 'route_limit', message: 'Le brouillon dépasse 100 000 routes.', location: 'nodes' });
  }
  const successPaths = paths.filter((path) => path.outcome === 'success');
  const failurePaths = paths.filter((path) => path.outcome === 'failure');
  const lengths = paths.map((path) => path.length);
  const failureDepths = failurePaths.map((path) => path.length);
  return {
    errors,
    warnings,
    metrics: {
      nodeCount: nodes.length,
      combatNodeCount: nodes.filter((node) => node.kind === 'combat').length,
      routeCount: paths.length,
      successPathCount: successPaths.length,
      failurePathCount: failurePaths.length,
      failureEndingCount: new Set(failurePaths.map((path) => path.endingId)).size,
      minPathLength: lengths.length ? Math.min(...lengths) : 0,
      maxPathLength: lengths.length ? Math.max(...lengths) : 0,
      averageFailureDepth: failureDepths.length
        ? Number((failureDepths.reduce((sum, depth) => sum + depth, 0) / failureDepths.length).toFixed(2))
        : 0,
      winningPaths: successPaths.map((path) => ({
        endingId: path.endingId,
        length: path.length,
        choices: path.choices,
        nodes: path.nodes,
      })),
      paths,
    },
  };
}

function validateCombatNode(node, fail, location) {
  if (!nonEmpty(node.victoryTargetNodeId) || !nonEmpty(node.defeatTargetNodeId)) {
    fail('combat_targets', 'Un combat exige une cible de victoire et une cible de défaite.', location);
  }
  const combat = node.combat;
  if (!combat || typeof combat !== 'object' || Array.isArray(combat)) {
    fail('combat', 'La configuration de combat est obligatoire.', location);
    return;
  }
  rejectUnknownFields(combat, COMBAT_FIELDS, fail, `${location}.combat`);
  rejectUnknownFields(combat.player, PLAYER_FIELDS, fail, `${location}.combat.player`);
  rejectUnknownFields(combat.enemy, ENEMY_FIELDS, fail, `${location}.combat.enemy`);
  if (
    !nonEmpty(combat.player?.name)
  ) {
    fail('combat_player', 'Le combattant exige un nom.', `${location}.combat.player`);
  }
  if (combat.player?.portrait != null && !nonEmpty(combat.player.portrait)) {
    fail('combat_player_portrait', 'Le portrait du combattant doit être un chemin non vide.', `${location}.combat.player.portrait`);
  }
  if (
    !nonEmpty(combat.enemy?.name)
    || !positiveInteger(combat.enemy?.maxHp)
    || !positiveInteger(combat.enemy?.drawCount)
  ) {
    fail('combat_enemy', 'L’adversaire exige un nom, des PV et une pioche par round valide.', `${location}.combat.enemy`);
  }
  if (combat.enemy?.portrait != null && !nonEmpty(combat.enemy.portrait)) {
    fail('combat_enemy_portrait', 'Le portrait de l’adversaire doit être un chemin non vide.', `${location}.combat.enemy.portrait`);
  }

  const cards = Array.isArray(combat.player?.cards) ? combat.player.cards : [];
  if (cards.length < 2) fail('combat_cards', 'Le deck doit contenir au moins deux cartes.', `${location}.combat.player.cards`);
  const cardIds = new Set();
  for (const [index, card] of cards.entries()) {
    const cardLocation = `${location}.combat.player.cards.${index}`;
    rejectUnknownFields(card, CARD_FIELDS, fail, cardLocation);
    rejectUnknownFields(card?.effect, EFFECT_FIELDS, fail, `${cardLocation}.effect`);
    if (card?.effect?.status != null) {
      rejectUnknownFields(card.effect.status, STATUS_EFFECT_FIELDS, fail, `${cardLocation}.effect.status`);
    }
    if (card?.effect?.concentration != null) {
      rejectUnknownFields(
        card.effect.concentration,
        CONCENTRATION_EFFECT_FIELDS,
        fail,
        `${cardLocation}.effect.concentration`,
      );
    }
    if (
      !nonEmpty(card?.id)
      || !nonEmpty(card?.name)
      || !['action', 'reaction'].includes(card?.timing)
      || !['weapon', 'cantrip', 'spell'].includes(card?.family)
      || !['attack', 'protection', 'control', 'preparation'].includes(card?.role)
      || !nonNegativeInteger(card?.chargeCost)
      || !nonEmpty(card?.description)
    ) {
      fail(
        'combat_card',
        'Chaque carte exige id, nom, moment, famille, rôle, coût en charges et description.',
        cardLocation,
      );
    }
    if (card?.art != null && !nonEmpty(card.art)) {
      fail('combat_card_art', 'L’illustration d’une carte doit être un chemin non vide.', `${cardLocation}.art`);
    }
    if (cardIds.has(card?.id)) fail('duplicate_card', `Carte dupliquée : ${card?.id}`, cardLocation);
    cardIds.add(card?.id);
    const damage = card?.effect?.damage;
    const block = card?.effect?.block;
    const status = card?.effect?.status;
    const concentration = card?.effect?.concentration;
    if (!(positiveInteger(damage) || positiveInteger(block) || status) || (damage != null && block != null)) {
      fail('card_effect', 'Une carte doit infliger des dégâts, bloquer des dégâts ou appliquer un état.', `${cardLocation}.effect`);
    }
    if (
      card?.timing === 'action'
      && (
        !positiveInteger(damage)
        || status
        || (
          concentration != null
          && !positiveInteger(concentration.damage)
        )
      )
    ) {
      fail('action_effect', 'Une carte Action doit infliger des dégâts.', `${cardLocation}.effect`);
    }
    if (concentration != null && (card?.timing !== 'action' || card?.family !== 'spell')) {
      fail(
        'concentration_effect',
        'La Concentration exige une carte Action de type sort.',
        `${cardLocation}.effect.concentration`,
      );
    }
    if (card?.timing === 'reaction' && (!positiveInteger(block) && !status)) {
      fail('reaction_effect', 'Une carte Réaction doit bloquer des dégâts ou appliquer un état.', `${cardLocation}.effect`);
    }
    const validPlayerStatus = status
      && (
        (status.id === 'slowed' && status.target === 'enemy')
        || (status.id === 'advantage' && status.target === 'player')
      )
      && positiveInteger(status.stacks);
    if (status && !validPlayerStatus) {
      fail(
        'status_effect',
        'Une carte du Sorcier peut appliquer slowed à enemy ou advantage à player.',
        `${cardLocation}.effect.status`,
      );
    }
    const validRole = (
      (card?.role === 'attack' && positiveInteger(damage) && concentration == null)
      || (card?.role === 'protection' && card?.timing === 'reaction' && positiveInteger(block) && !status)
      || (card?.role === 'control' && status?.target === 'enemy')
      || (
        card?.role === 'preparation'
        && (concentration != null || (status?.id === 'advantage' && status?.target === 'player'))
      )
    );
    if (!validRole) {
      fail('card_role', 'Le rôle doit correspondre à l’effet réel de la carte.', cardLocation);
    }
    if (card?.family === 'cantrip' && card?.chargeCost !== 0) {
      fail('cantrip_cost', 'Un sort mineur doit être gratuit.', cardLocation);
    }
    if (
      card?.family === 'weapon'
      && (card?.chargeCost !== 0 || card?.timing !== 'action')
    ) {
      fail('weapon_card', 'Une carte Arme doit être une Action gratuite.', cardLocation);
    }
  }
  if (!cards.some(
    (card) => (
      card.timing === 'action'
      && card.family === 'cantrip'
      && card.chargeCost === 0
    ),
  )) {
    fail('free_action', 'Le deck exige au moins une Action gratuite.', `${location}.combat.player.cards`);
  }
  const deck = Array.isArray(combat.player?.deck) ? combat.player.deck : [];
  if (deck.length < 10 || deck.some((cardId) => !nonEmpty(cardId) || !cardIds.has(cardId))) {
    fail('combat_deck', 'Le deck du Sorcier doit contenir au moins dix références de cartes valides.', `${location}.combat.player.deck`);
  }

  const enemyCards = Array.isArray(combat.enemy?.cards) ? combat.enemy.cards : [];
  if (enemyCards.length < 2) {
    fail('enemy_cards', 'L’adversaire doit posséder au moins deux cartes.', `${location}.combat.enemy.cards`);
  }
  const enemyCardIds = new Set();
  for (const [index, card] of enemyCards.entries()) {
    const cardLocation = `${location}.combat.enemy.cards.${index}`;
    rejectUnknownFields(card, ENEMY_CARD_FIELDS, fail, cardLocation);
    if (card?.effect != null) {
      rejectUnknownFields(card.effect, EFFECT_FIELDS, fail, `${cardLocation}.effect`);
      rejectUnknownFields(card.effect.status, STATUS_EFFECT_FIELDS, fail, `${cardLocation}.effect.status`);
      const status = card.effect.status;
      if (
        !status
        || status.id !== 'disadvantage'
        || status.target !== 'player'
        || !positiveInteger(status.stacks)
      ) {
        fail(
          'enemy_status_effect',
          'Une carte ennemie peut appliquer disadvantage à player avec un nombre positif de charges.',
          `${cardLocation}.effect.status`,
        );
      }
    }
    if (
      !nonEmpty(card?.id)
      || !nonEmpty(card?.name)
      || !positiveInteger(card?.damage)
      || !nonEmpty(card?.description)
    ) {
      fail('enemy_card', 'Chaque carte ennemie exige id, nom, dégâts et description.', cardLocation);
    }
    if (enemyCardIds.has(card?.id)) {
      fail('duplicate_enemy_card', `Carte ennemie dupliquée : ${card?.id}`, cardLocation);
    }
    enemyCardIds.add(card?.id);
  }
  const enemyDeck = Array.isArray(combat.enemy?.deck) ? combat.enemy.deck : [];
  if (
    enemyDeck.length < combat.enemy?.drawCount
    || enemyDeck.some((cardId) => !nonEmpty(cardId) || !enemyCardIds.has(cardId))
  ) {
    fail(
      'enemy_deck',
      'La pioche ennemie doit contenir assez de références de cartes valides pour un round.',
      `${location}.combat.enemy.deck`,
    );
  }
}

function validateHero(hero, fail) {
  rejectUnknownFields(hero, HERO_FIELDS, fail, 'hero');
  rejectUnknownFields(hero?.stats, STATS_FIELDS, fail, 'hero.stats');
  if (!nonEmpty(hero?.className) || !positiveInteger(hero?.level)) {
    fail('hero', 'Le héros exige une classe et un niveau.', 'hero');
  }
  for (const stat of STAT_KEYS) {
    if (!Number.isInteger(hero?.stats?.[stat]) || hero.stats[stat] < 1 || hero.stats[stat] > 3) {
      fail('hero_stat', `${stat} doit être compris entre 1 et 3.`, `hero.stats.${stat}`);
    }
  }
}

function validateRequirements(requirements, fail, location) {
  if (requirements == null) return;
  if (!Array.isArray(requirements) || requirements.length === 0) {
    fail('choice_requirements', 'requirements doit être un tableau non vide.', `${location}.requirements`);
    return;
  }
  const used = new Set();
  for (const [index, requirement] of requirements.entries()) {
    const requirementLocation = `${location}.requirements.${index}`;
    rejectUnknownFields(requirement, REQUIREMENT_FIELDS, fail, requirementLocation);
    const isStat = STAT_KEYS.includes(requirement?.stat)
      && Number.isInteger(requirement?.min)
      && requirement.min >= 1
      && requirement.min <= 3
      && requirement.gold == null
      && requirement.arcaneCharges == null;
    const isGold = positiveInteger(requirement?.gold)
      && requirement.stat == null
      && requirement.min == null
      && requirement.arcaneCharges == null;
    const isArcaneCharge = positiveInteger(requirement?.arcaneCharges)
      && requirement.stat == null
      && requirement.min == null
      && requirement.gold == null;
    if (!isStat && !isGold && !isArcaneCharge) {
      fail('choice_requirement', 'Une condition exige une statistique, de l’or ou un nombre positif de charges arcaniques.', requirementLocation);
    }
    const key = isGold ? 'gold' : isArcaneCharge ? 'arcaneCharges' : requirement?.stat;
    if (used.has(key)) fail('duplicate_requirement', `Condition dupliquée : ${key}`, requirementLocation);
    used.add(key);
  }
}

function validateTransaction(transaction, fail, location) {
  if (transaction == null) return;
  const transactionLocation = `${location}.transaction`;
  rejectUnknownFields(transaction, TRANSACTION_FIELDS, fail, transactionLocation);
  if (!nonEmpty(transaction?.id) || !nonEmpty(transaction?.title) || !positiveInteger(transaction?.gold)) {
    fail('choice_transaction', 'Une transaction exige un identifiant, un titre et un prix positif.', transactionLocation);
  }
  if (transaction.item != null) {
    rejectUnknownFields(transaction.item, ITEM_GRANT_FIELDS, fail, `${transactionLocation}.item`);
    if (!nonEmpty(transaction.item?.id) || !positiveInteger(transaction.item?.quantity)) {
      fail('choice_transaction_item', 'L’objet acheté exige un identifiant et une quantité positive.', `${transactionLocation}.item`);
    }
  }
}

function meetsChoiceRequirements(choice, stats, progression = {}, resources = {}) {
  return (choice?.requirements || []).every((requirement) => {
    if (requirement.gold != null) return progression.gold >= requirement.gold;
    if (requirement.arcaneCharges != null) return resources.arcaneCharges >= requirement.arcaneCharges;
    return stats?.[requirement.stat] >= requirement.min;
  });
}

function validateSourceVariants(variants, fail, location) {
  if (variants == null) return;
  if (!variants || typeof variants !== 'object' || Array.isArray(variants) || Object.keys(variants).length === 0) {
    fail('source_variants', 'sourceVariants doit contenir au moins une provenance.', `${location}.sourceVariants`);
    return;
  }
  for (const [sourceEndingId, variant] of Object.entries(variants)) {
    const variantLocation = `${location}.sourceVariants.${sourceEndingId}`;
    if (!nonEmpty(sourceEndingId)) fail('source_variant_id', 'Une provenance doit avoir un identifiant.', variantLocation);
    rejectUnknownFields(variant, SOURCE_VARIANT_FIELDS, fail, variantLocation);
    if (!nonEmpty(variant?.title) || !nonEmpty(variant?.text)) {
      fail('source_variant', 'Chaque provenance exige un titre et un texte.', variantLocation);
    }
  }
}

function validateSourceTargetNodeIds(targets, fail, location) {
  if (targets == null) return;
  if (!targets || typeof targets !== 'object' || Array.isArray(targets) || Object.keys(targets).length === 0) {
    fail(
      'source_target_nodes',
      'sourceTargetNodeIds doit associer au moins une provenance à un nœud.',
      `${location}.sourceTargetNodeIds`,
    );
    return;
  }
  for (const [sourceEndingId, targetNodeId] of Object.entries(targets)) {
    if (!nonEmpty(sourceEndingId) || !nonEmpty(targetNodeId)) {
      fail(
        'source_target_node',
        'Chaque cible conditionnelle exige une provenance et un nœud non vides.',
        `${location}.sourceTargetNodeIds.${sourceEndingId}`,
      );
    }
  }
}

function validateTerminal(node, actIds, fail, location) {
  const terminal = node?.terminal;
  if (
    !terminal
    || !nonEmpty(terminal.endingId)
    || !nonEmpty(terminal.reason)
    || !nonEmpty(terminal.outcomeSummary)
  ) {
    fail('terminal', 'Une fin exige endingId, reason et outcomeSummary.', location);
    return;
  }
  rejectUnknownFields(terminal, TERMINAL_FIELDS, fail, `${location}.terminal`);
  if (terminal.reward != null) {
    rejectUnknownFields(terminal.reward, REWARD_FIELDS, fail, `${location}.terminal.reward`);
    if (
      node.kind !== 'success'
      || !nonEmpty(terminal.reward?.id)
      || !nonEmpty(terminal.reward?.title)
      || !positiveInteger(terminal.reward?.level)
      || !nonNegativeInteger(terminal.reward?.statPoints)
      || !nonNegativeInteger(terminal.reward?.gold)
      || (terminal.reward.statPoints === 0 && terminal.reward.gold === 0)
    ) {
      fail('terminal_reward', 'Une récompense de réussite exige un identifiant, un titre, un niveau et un gain positif.', location);
    }
  }
  if (node.kind === 'failure' && (!nonEmpty(terminal.retryActId) || !actIds.has(terminal.retryActId))) {
    fail('retry_act', `Acte de reprise invalide pour ${node.id}.`, location);
  }
  if (node.kind === 'success' && terminal.retryActId != null) {
    fail('success_retry', 'Une réussite ne doit pas définir retryActId.', location);
  }
}

function outgoingEdges(node) {
  if (node?.kind === 'choice') {
    return (node.choices || []).flatMap((choice) => {
      const targets = new Map([[choice.targetNodeId, choice.id]]);
      for (const [sourceEndingId, targetNodeId] of Object.entries(choice.sourceTargetNodeIds || {})) {
        if (!targets.has(targetNodeId)) targets.set(targetNodeId, `${choice.id}@${sourceEndingId}`);
      }
      return [...targets].map(([targetNodeId, id]) => ({ id, targetNodeId }));
    });
  }
  if (node?.kind === 'combat') {
    return [
      { id: `combat:${node.id}:victory`, targetNodeId: node.victoryTargetNodeId },
      { id: `combat:${node.id}:defeat`, targetNodeId: node.defeatTargetNodeId },
    ];
  }
  return [];
}

function emptyMetrics() {
  return {
    nodeCount: 0,
    combatNodeCount: 0,
    routeCount: 0,
    successPathCount: 0,
    failurePathCount: 0,
    failureEndingCount: 0,
    minPathLength: 0,
    maxPathLength: 0,
    averageFailureDepth: 0,
    winningPaths: [],
    paths: [],
  };
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rejectUnknownFields(value, allowed, fail, location) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      fail('unknown_field', `Le champ ${key} n’appartient pas au format livre-jeu.`, `${location}.${key}`);
    }
  }
}

module.exports = {
  STAT_KEYS,
  analyzeNarrativeTree,
  meetsChoiceRequirements,
  outgoingEdges,
  validateNarrativeTree,
};
