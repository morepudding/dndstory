const crypto = require('crypto');
const { BranchingBookEngine } = require('./branching-book-runtime');
const {
  applyChoiceTransaction,
  applyProgressionReward,
  consumeInventoryItem,
} = require('./progression-service');

class BookSessionService {
  constructor({ store, storyRepository, diagnostics = null, clock = () => new Date() }) {
    Object.assign(this, { store, storyRepository, diagnostics, clock });
  }

  read() {
    const session = this.store.read().story.activeRun;
    if (!session) return null;
    let engine;
    try {
      engine = this.engine(session.storyId);
    } catch {
      this.store.transaction((draft) => {
        const previousRunId = draft.story.activeRun?.id;
        draft.story.activeRun = null;
        draft.conversation.threadId = null;
        draft.conversation.messages = draft.conversation.messages.filter((message) => message.runId !== previousRunId);
        draft.recoveryEvents.push({ type: 'story_source_changed', at: new Date().toISOString(), previousStoryId: session.storyId });
        return draft;
      });
      return null;
    }
    return engine.read(session);
  }

  start(storyId = null, { sourceEndingId = null } = {}) {
    const engine = this.engine(storyId);
    const at = this.clock().toISOString();
    const session = engine.start({ runId: crypto.randomUUID(), at, sourceEndingId });
    this.store.transaction((draft) => {
      const previousRun = draft.story.activeRun;
      removeRunOutcome(draft, previousRun, { clearCageOutcome: previousRun?.storyId === session.storyId });
      draft.story.activeRun = session;
      draft.conversation.threadId = null;
      draft.conversation.messages = engine.messages(session);
      return draft;
    });
    this.record({ type: 'story_started', storyId: session.storyId, nodeId: session.activeNodeId });
    return { view: engine.read(session), opening: engine.nodes.get(session.activeNodeId).text };
  }

  choose(choiceId) {
    const before = this.store.read().story.activeRun;
    if (!before || before.status !== 'active') throw codedError('STORY_NOT_ACTIVE', 'Aucune décision n’est attendue.');
    const engine = this.engine(before.storyId);
    const chosenAt = this.clock().toISOString();
    const transition = engine.choose(before, choiceId, chosenAt);
    this.store.transaction((draft) => {
      const current = draft.story.activeRun;
      if (!current || current.id !== before.id || current.activeNodeId !== before.activeNodeId) {
        throw codedError('STORY_STATE_CHANGED', 'La partie a changé avant l’application du choix.');
      }
      applyChoiceTransaction(draft, transition.choice.transaction, {
        storyId: before.storyId,
        choiceId,
        purchasedAt: chosenAt,
      });
      draft.story.activeRun = transition.session;
      draft.conversation.messages = engine.messages(transition.session);
      if (transition.session.status !== 'active') persistOutcome(draft, transition.session);
      return draft;
    });
    this.record({
      type: 'story_choice',
      storyId: before.storyId,
      sourceNodeId: before.activeNodeId,
      choiceId,
      targetNodeId: transition.session.activeNodeId,
      transactionId: transition.choice.transaction?.id || null,
    });
    return transition;
  }

  playCard(cardId) {
    const before = this.store.read().story.activeRun;
    if (!before || before.status !== 'active') {
      throw codedError('STORY_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const engine = this.engine(before.storyId);
    const transition = engine.playCard(before, cardId, this.clock().toISOString());
    this.persistCombatTransition(before, transition);
    this.record({
      type: 'combat_card_played',
      storyId: before.storyId,
      nodeId: before.activeNodeId,
      cardId,
      round: before.combat?.round,
      outcome: transition.outcome,
    });
    return transition;
  }

  passReaction() {
    const before = this.store.read().story.activeRun;
    if (!before || before.status !== 'active') {
      throw codedError('STORY_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const engine = this.engine(before.storyId);
    const transition = engine.passReaction(before, this.clock().toISOString());
    this.persistCombatTransition(before, transition);
    this.record({
      type: 'combat_reaction_passed',
      storyId: before.storyId,
      nodeId: before.activeNodeId,
      round: before.combat?.round,
      outcome: transition.outcome,
    });
    return transition;
  }

  endCombatTurn() {
    const before = this.store.read().story.activeRun;
    if (!before || before.status !== 'active') {
      throw codedError('STORY_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const engine = this.engine(before.storyId);
    const transition = engine.endCombatTurn(before, this.clock().toISOString());
    this.persistCombatTransition(before, transition);
    this.record({
      type: 'combat_turn_ended',
      storyId: before.storyId,
      nodeId: before.activeNodeId,
      round: before.combat?.round,
      outcome: transition.outcome,
    });
    return transition;
  }

  useCombatItem(itemId) {
    const before = this.store.read().story.activeRun;
    if (!before || before.status !== 'active') {
      throw codedError('STORY_NOT_ACTIVE', 'Aucun combat n’est en cours.');
    }
    const engine = this.engine(before.storyId);
    const transition = engine.useItem(before, itemId, this.clock().toISOString());
    this.persistCombatTransition(before, transition, (draft) => consumeInventoryItem(draft, itemId));
    this.record({
      type: 'combat_item_used',
      storyId: before.storyId,
      nodeId: before.activeNodeId,
      itemId,
      healed: transition.healed,
      round: before.combat?.round,
      outcome: transition.outcome,
    });
    return transition;
  }

  retryAct() {
    const before = this.store.read().story.activeRun;
    if (!before) throw codedError('STORY_NOT_ACTIVE', 'Aucune partie à reprendre.');
    const engine = this.engine(before.storyId);
    const transition = engine.retryAct(before);
    this.store.transaction((draft) => {
      removeRunOutcome(draft, draft.story.activeRun);
      draft.story.activeRun = transition.session;
      draft.conversation.threadId = null;
      draft.conversation.messages = engine.messages(transition.session);
      return draft;
    });
    this.record({ type: 'story_act_retried', storyId: before.storyId, nodeId: transition.session.activeNodeId });
    return transition;
  }

  quit() {
    this.store.transaction((draft) => {
      draft.story.activeRun = null;
      draft.conversation.threadId = null;
      return draft;
    });
  }

  engine(storyId = null) {
    const state = this.store.read();
    const progression = state.character.progression;
    const selectedStoryId = storyId
      || state.story.activeRun?.storyId
      || this.storyRepository.select(progression).id;
    const tree = this.storyRepository.get(selectedStoryId);
    tree.hero = {
      ...tree.hero,
      level: progression.level,
      stats: structuredClone(progression.stats),
    };
    return new BranchingBookEngine(tree, { context: { progression } });
  }

  persistCombatTransition(before, transition, mutateDraft = null) {
    const engine = this.engine(before.storyId);
    this.store.transaction((draft) => {
      const current = draft.story.activeRun;
      if (
        !current
        || current.id !== before.id
        || current.activeNodeId !== before.activeNodeId
        || current.combat?.round !== before.combat?.round
        || current.combat?.phase !== before.combat?.phase
        || current.combat?.player?.actionsPlayed !== before.combat?.player?.actionsPlayed
        || current.combat?.player?.hp !== before.combat?.player?.hp
        || current.combat?.enemy?.hp !== before.combat?.enemy?.hp
        || JSON.stringify(current.combat?.hand) !== JSON.stringify(before.combat?.hand)
      ) {
        throw codedError('STORY_STATE_CHANGED', 'Le combat a changé avant l’application de la carte.');
      }
      if (mutateDraft) mutateDraft(draft);
      draft.story.activeRun = transition.session;
      draft.conversation.messages = engine.messages(transition.session);
      if (transition.session.status !== 'active') persistOutcome(draft, transition.session);
      return draft;
    });
  }

  record(event) {
    if (!this.diagnostics?.update) return;
    const previous = this.diagnostics.read?.() || {};
    this.diagnostics.update({ lastStoryEvent: event, storyEvents: [...(previous.storyEvents || []).slice(-49), event] });
  }
}

function persistOutcome(draft, session) {
  const eventId = crypto.randomUUID();
  session.ending.relationshipEventId = eventId;
  draft.character.relationshipEvents.push({
    id: eventId,
    type: `story_${session.status}`,
    description: session.ending.outcomeSummary,
    endingId: session.ending.endingId,
    storyId: session.storyId,
    createdAt: session.completedAt,
    source: {
      userMessage: `Route ${session.history.map((item) => (
        item.kind === 'choice' ? item.choiceId : `combat:${item.outcome}`
      )).join(' > ')}`,
      assistantResponse: draft.conversation.messages.at(-1)?.content || null,
    },
  });
  applyProgressionReward(draft, session);
  if (session.storyId === 'la-cage-du-treuil' && ['captive-sauvee', 'ordres-recuperes'].includes(session.ending.endingId)) {
    draft.story.cageOutcome = session.ending.endingId;
  }
}

function removeRunOutcome(draft, session, { clearCageOutcome = false } = {}) {
  const eventId = session?.ending?.relationshipEventId;
  if (eventId) draft.character.relationshipEvents = draft.character.relationshipEvents.filter((event) => event.id !== eventId);
  if (clearCageOutcome && session?.storyId === 'la-cage-du-treuil') draft.story.cageOutcome = null;
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

module.exports = { BookSessionService };
