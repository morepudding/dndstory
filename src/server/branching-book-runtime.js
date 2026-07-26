const { CombatEngine } = require('./combat-engine');
const { meetsChoiceRequirements, validateNarrativeTree } = require('./narrative-tree');

class BranchingBookEngine {
  constructor(tree, { validate = true, context = {} } = {}) {
    if (validate) {
      const report = validateNarrativeTree(tree);
      if (!report.accepted) {
        throw new Error(`Arbre narratif invalide : ${report.errors.map((error) => error.message).join(' ')}`);
      }
    }
    this.tree = structuredClone(tree);
    this.context = structuredClone(context);
    this.nodes = new Map(this.tree.nodes.map((node) => [node.id, node]));
    this.acts = new Map(this.tree.acts.map((act) => [act.id, act]));
  }

  start({ runId, at, sourceEndingId = null }) {
    if (!runId || !at) throw new Error('Le démarrage exige un identifiant et une date.');
    const entryNodeId = this.entryNodeIdFor(sourceEndingId);
    const session = {
      id: runId,
      storyId: this.tree.id,
      activeNodeId: entryNodeId,
      status: 'active',
      startedAt: at,
      completedAt: null,
      history: [],
      ending: null,
      combat: null,
      sourceEndingId,
      arcaneCharges: this.tree.usesArcaneChargePool ? this.tree.hero.stats.intelligence : null,
    };
    this.activateNode(session, this.nodes.get(entryNodeId), at);
    return session;
  }

  read(session) {
    this.assertSession(session);
    const node = this.nodeForSession(session, this.nodes.get(session.activeNodeId));
    const combatEngine = node.kind === 'combat' ? new CombatEngine(node.combat, this.tree.hero) : null;
    return structuredClone({
      id: this.tree.id,
      title: this.tree.title,
      chapterSummary: this.tree.chapterSummary,
      rating: this.tree.rating,
      contentWarnings: this.tree.contentWarnings,
      participantsAllAdults: this.tree.participantsAllAdults,
      hero: this.tree.hero,
      arcaneCharges: session.arcaneCharges,
      node,
      act: this.acts.get(node.actId),
      terminal: node.kind === 'success' || node.kind === 'failure',
      inCombat: node.kind === 'combat',
      combat: combatEngine && session.combat
        ? {
          ...session.combat,
          cards: combatEngine.cardsFor(session.combat),
          spontaneousMagicOptions: combatEngine.spontaneousMagicOptionsFor(session.combat),
          deckCards: combatEngine.deckCardsFor(session.combat),
        }
        : null,
      historyLength: session.history.length,
      status: session.status,
      ending: session.ending,
    });
  }

  choose(session, choiceReference, at) {
    this.assertActiveSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'choice') throw codedError('CHOICE_UNAVAILABLE', 'Aucun choix narratif n’est attendu.');
    const choice = Number.isInteger(choiceReference)
      ? node.choices[choiceReference]
      : node.choices.find((item) => item.id === choiceReference);
    if (!choice) throw codedError('CHOICE_UNAVAILABLE', 'Ce choix n’est pas disponible.');
    if (!meetsChoiceRequirements(choice, this.tree.hero.stats, this.context.progression, session)) {
      throw codedError('CHOICE_REQUIREMENT_NOT_MET', 'Les statistiques du Sorcier ne permettent pas ce choix.');
    }
    const targetNodeId = choice.sourceTargetNodeIds?.[session.sourceEndingId] || choice.targetNodeId;
    const target = this.nodes.get(targetNodeId);
    const next = structuredClone(session);
    next.history.push({
      kind: 'choice',
      nodeId: node.id,
      choiceId: choice.id,
      playerText: choice.playerText,
      targetNodeId,
      chosenAt: at,
    });
    if (choice.arcaneChargeCost) next.arcaneCharges -= choice.arcaneChargeCost;
    this.activateNode(next, target, at);
    return {
      session: next,
      choice: { ...structuredClone(choice), targetNodeId },
      view: this.read(next),
    };
  }

  playCard(session, cardId, at) {
    this.assertActiveSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'combat' || !session.combat) {
      throw codedError('COMBAT_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const combatEngine = new CombatEngine(node.combat, this.tree.hero);
    const resolution = combatEngine.playCard(session.combat, cardId);
    const next = structuredClone(session);
    next.combat = resolution.combat;
    this.syncArcaneCharges(next);
    if (resolution.outcome) this.completeCombat(next, node, resolution.outcome, at);
    return {
      session: next,
      outcome: resolution.outcome,
      view: this.read(next),
    };
  }

  shapeSpell(session, instanceId, targetCardId, at) {
    this.assertActiveSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'combat' || !session.combat) {
      throw codedError('COMBAT_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const combatEngine = new CombatEngine(node.combat, this.tree.hero);
    const resolution = combatEngine.shapeSpell(
      session.combat,
      instanceId,
      targetCardId,
    );
    const next = structuredClone(session);
    next.combat = resolution.combat;
    this.syncArcaneCharges(next);
    if (resolution.outcome) this.completeCombat(next, node, resolution.outcome, at);
    return {
      session: next,
      outcome: resolution.outcome,
      view: this.read(next),
    };
  }

  passReaction(session, at) {
    this.assertActiveSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'combat' || !session.combat) {
      throw codedError('COMBAT_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const combatEngine = new CombatEngine(node.combat, this.tree.hero);
    const resolution = combatEngine.passReaction(session.combat);
    const next = structuredClone(session);
    next.combat = resolution.combat;
    this.syncArcaneCharges(next);
    if (resolution.outcome) this.completeCombat(next, node, resolution.outcome, at);
    return {
      session: next,
      outcome: resolution.outcome,
      view: this.read(next),
    };
  }

  endCombatTurn(session, at) {
    this.assertActiveSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'combat' || !session.combat) {
      throw codedError('COMBAT_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const combatEngine = new CombatEngine(node.combat, this.tree.hero);
    const resolution = combatEngine.endTurn(session.combat);
    const next = structuredClone(session);
    next.combat = resolution.combat;
    this.syncArcaneCharges(next);
    if (resolution.outcome) this.completeCombat(next, node, resolution.outcome, at);
    return {
      session: next,
      outcome: resolution.outcome,
      view: this.read(next),
    };
  }

  useItem(session, itemId, at) {
    this.assertActiveSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'combat' || !session.combat) {
      throw codedError('COMBAT_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const combatEngine = new CombatEngine(node.combat, this.tree.hero);
    const resolution = combatEngine.useItem(session.combat, itemId);
    const next = structuredClone(session);
    next.combat = resolution.combat;
    this.syncArcaneCharges(next);
    if (resolution.outcome) this.completeCombat(next, node, resolution.outcome, at);
    return {
      session: next,
      outcome: resolution.outcome,
      healed: resolution.healed,
      view: this.read(next),
      at,
    };
  }

  retryAct(session) {
    this.assertSession(session);
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind !== 'failure') {
      throw codedError('RETRY_UNAVAILABLE', 'La reprise est disponible uniquement après une fin d’échec.');
    }
    const retryActId = node.terminal.retryActId;
    const act = this.acts.get(retryActId);
    if (!act) throw new Error('Le point de reprise de cet acte est introuvable.');
    const firstEntryInAct = session.history.findIndex(
      (entry) => this.nodes.get(entry.nodeId)?.actId === retryActId,
    );
    const next = structuredClone(session);
    next.history = firstEntryInAct === -1 ? [] : next.history.slice(0, firstEntryInAct);
    next.status = 'active';
    next.completedAt = null;
    next.ending = null;
    next.combat = null;
    if (this.tree.usesArcaneChargePool) next.arcaneCharges = this.tree.hero.stats.intelligence;
    const retryNodeId = act.entryNodeId === this.tree.entryNodeId
      ? this.entryNodeIdFor(session.sourceEndingId)
      : act.entryNodeId;
    this.activateNode(next, this.nodes.get(retryNodeId), session.startedAt);
    return { session: next, view: this.read(next) };
  }

  messages(session, atFallback = session.startedAt) {
    this.assertSession(session);
    const messages = [];
    const entryNodeId = session.history[0]?.nodeId || session.activeNodeId;
    const entry = this.nodeForSession(session, this.nodes.get(entryNodeId));
    messages.push(storyMessage('assistant', entry.text, session.startedAt, session, entry));
    for (const item of session.history) {
      if (item.kind === 'choice') {
        const source = this.nodeForSession(session, this.nodes.get(item.nodeId));
        const choice = source.choices.find((candidate) => candidate.id === item.choiceId);
        const target = this.nodeForSession(session, this.nodes.get(item.targetNodeId));
        messages.push(storyMessage(
          'user',
          choice.playerText,
          item.chosenAt || atFallback,
          session,
          source,
          choice.id,
        ));
        messages.push(storyMessage(
          'assistant',
          target.text,
          item.chosenAt || atFallback,
          session,
          target,
        ));
      } else if (item.kind === 'combat') {
        const target = this.nodeForSession(session, this.nodes.get(item.targetNodeId));
        messages.push(storyMessage(
          'assistant',
          target.text,
          item.completedAt || atFallback,
          session,
          target,
        ));
      }
    }
    return messages;
  }

  activateNode(session, node, at) {
    session.activeNodeId = node.id;
    session.combat = null;
    if (node.kind === 'combat') {
      session.combat = new CombatEngine(node.combat, this.tree.hero).start(node.id, {
        spellUses: session.arcaneCharges == null ? undefined : session.arcaneCharges,
      });
      return;
    }
    if (node.kind === 'success' || node.kind === 'failure') {
      session.status = node.kind;
      session.completedAt = at;
      session.ending = structuredClone(node.terminal);
    }
  }

  completeCombat(session, node, outcome, at) {
    const targetNodeId = outcome === 'victory' ? node.victoryTargetNodeId : node.defeatTargetNodeId;
    const summary = {
      kind: 'combat',
      nodeId: node.id,
      outcome,
      targetNodeId,
      rounds: session.combat.round,
      playerHp: session.combat.player.hp,
      enemyHp: session.combat.enemy.hp,
      spellUses: session.combat.player.spellUses,
      completedAt: at,
    };
    session.history.push(summary);
    this.activateNode(session, this.nodes.get(targetNodeId), at);
  }

  syncArcaneCharges(session) {
    if (this.tree.usesArcaneChargePool && session.combat) {
      session.arcaneCharges = session.combat.player.spellUses;
    }
  }

  nodeForSession(session, node) {
    const variant = node?.sourceVariants?.[session.sourceEndingId];
    return variant ? { ...node, ...variant } : node;
  }

  entryNodeIdFor(sourceEndingId) {
    return this.tree.sourceEntryNodeIds?.[sourceEndingId] || this.tree.entryNodeId;
  }

  assertActiveSession(session) {
    this.assertSession(session);
    if (session.status !== 'active') throw codedError('STORY_NOT_ACTIVE', 'Cette route est terminée.');
  }

  assertSession(session) {
    if (
      !session
      || session.storyId !== this.tree.id
      || !this.nodes.has(session.activeNodeId)
      || !Array.isArray(session.history)
    ) {
      throw codedError('STORY_SESSION_INVALID', 'Session de livre-jeu invalide.');
    }
    const node = this.nodes.get(session.activeNodeId);
    if (node.kind === 'combat' && (!session.combat || session.combat.nodeId !== node.id)) {
      throw codedError('COMBAT_STATE_INVALID', 'Le combat actif ne correspond pas à la scène.');
    }
  }
}

class BranchingBookRuntime {
  constructor(tree, options = {}) {
    this.engine = new BranchingBookEngine(tree, options);
    this.tree = this.engine.tree;
    this.start();
  }

  start() {
    this.session = this.engine.start({ runId: 'preview', at: new Date().toISOString() });
    return this.read();
  }

  read() {
    return this.engine.read(this.session);
  }

  choose(choiceReference) {
    const transition = this.engine.choose(this.session, choiceReference, new Date().toISOString());
    this.session = transition.session;
    return { choice: transition.choice, ...transition.view };
  }

  playCard(cardId) {
    const transition = this.engine.playCard(this.session, cardId, new Date().toISOString());
    this.session = transition.session;
    return transition.view;
  }

  shapeSpell(instanceId, targetCardId) {
    const transition = this.engine.shapeSpell(
      this.session,
      instanceId,
      targetCardId,
      new Date().toISOString(),
    );
    this.session = transition.session;
    return transition.view;
  }

  passReaction() {
    const transition = this.engine.passReaction(this.session, new Date().toISOString());
    this.session = transition.session;
    return transition.view;
  }

  endCombatTurn() {
    const transition = this.engine.endCombatTurn(this.session, new Date().toISOString());
    this.session = transition.session;
    return transition.view;
  }

  useItem(itemId) {
    const transition = this.engine.useItem(this.session, itemId, new Date().toISOString());
    this.session = transition.session;
    return transition.view;
  }

  retryAct() {
    const transition = this.engine.retryAct(this.session);
    this.session = transition.session;
    return transition.view;
  }
}

function storyMessage(role, content, at, session, node, choiceId = null) {
  return {
    role,
    content,
    at,
    runId: session.id,
    storyId: session.storyId,
    nodeId: node.id,
    actId: node.actId,
    ...(choiceId ? { choiceId } : {}),
  };
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

module.exports = { BranchingBookEngine, BranchingBookRuntime };
