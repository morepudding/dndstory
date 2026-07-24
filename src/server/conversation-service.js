const { ContextComposer } = require('./context-composer');
const { cleanVisibleResponse } = require('./codex-client');
const { BookSessionService } = require('./book-session-service');
const { meetsChoiceRequirements } = require('./narrative-tree');
const { ProgressionService } = require('./progression-service');

class ConversationService {
  constructor({ store, gateway, diagnostics, storyRepository, composer = null, clock = () => Date.now() }) {
    Object.assign(this, { store, gateway, diagnostics, storyRepository, clock });
    this.composer = composer || new ContextComposer();
    this.book = new BookSessionService({ store, storyRepository, diagnostics });
    this.progression = new ProgressionService({ store });
    this.inFlight = false;
    this.playerMessageCount = 0;
  }

  readStory() {
    const progression = this.progression.read();
    const view = this.book.read();
    const story = view
      ? this.storyRepository.get(view.id)
      : this.storyRepository.select(progression);
    if (!view) {
      return {
        active: false,
        status: 'idle',
        storyId: story.id,
        title: story.title,
        chapterSummary: story.showChapterSummary === false ? '' : story.chapterSummary,
        hero: heroFromProgression(story.hero, progression),
        progression,
        choices: [],
        requiresAdultConfirmation: false,
      };
    }
    const nextStory = view.status === 'success'
      ? this.storyRepository.next(view.id, progression)
      : null;
    return {
      active: true,
      storyId: view.id,
      title: view.title,
      chapterSummary: view.chapterSummary,
      rating: view.rating,
      hero: structuredClone(view.hero),
      progression,
      arcaneCharges: view.arcaneCharges,
      sourceEndingId: this.store.read().story.activeRun?.sourceEndingId || null,
      cageOutcome: this.store.read().story.cageOutcome,
      act: { id: view.act.id, index: view.act.index, title: view.act.title },
      node: { id: view.node.id, kind: view.node.kind, title: view.node.title, text: view.node.text },
      status: view.status,
      terminal: view.terminal,
      inCombat: view.inCombat,
      combat: structuredClone(view.combat),
      ending: structuredClone(view.ending),
      choices: view.status === 'active' && view.node.kind === 'choice'
        ? view.node.choices.map((choice, index) => ({
          id: choice.id,
          number: index + 1,
          label: choice.label,
          playerText: choice.playerText,
          requirements: structuredClone(choice.requirements || []),
          transaction: structuredClone(choice.transaction || null),
          arcaneChargeCost: choice.arcaneChargeCost || 0,
          available: meetsChoiceRequirements(choice, view.hero.stats, progression, view),
        }))
        : [],
      combatItems: combatItemsFor(view, progression),
      canRetryAct: view.status === 'failure',
      canRestart: true,
      canContinueAdventure: Boolean(nextStory),
      canContinueFreeChat: Boolean(
        view.status === 'success'
        && progression.unspentStatPoints === 0
        && !nextStory,
      ),
      continueLabel: nextStory?.continueLabel || 'Revenir à l’accueil',
      canResolveLevelUp: progression.unspentStatPoints > 0,
      pathLength: view.historyLength,
      requiresAdultConfirmation: false,
    };
  }

  startStory(storyId = null, { sourceEndingId = null } = {}) {
    const progression = this.progression.read();
    const story = storyId
      ? this.storyRepository.get(storyId)
      : this.storyRepository.select(progression);
    if (story.rating === '18+' && !this.store.read().contentConsent.adultConfirmedAt) {
      return {
        active: false,
        status: 'age-gate',
        storyId: story.id,
        title: story.title,
        choices: [],
        requiresAdultConfirmation: true,
        rating: story.rating,
        warnings: story.contentWarnings,
        participantsAllAdults: story.participantsAllAdults,
      };
    }
    const transition = this.book.start(story.id, { sourceEndingId });
    return { ...this.readStory(), opening: transition.opening };
  }

  restartStory() {
    this.assertProgressionResolved();
    return this.startStory(this.store.read().story.activeRun?.storyId || null);
  }

  allocateProgressionStat(stat) {
    const progression = this.progression.allocateStat(stat);
    return { progression, story: this.readStory() };
  }

  chooseStoryOption(choiceId) {
    const transition = this.book.choose(choiceId);
    return {
      playerText: transition.choice.playerText,
      text: transition.view.node.text,
      story: this.readStory(),
    };
  }

  playCombatCard(cardId) {
    const transition = this.book.playCard(cardId);
    return { outcome: transition.outcome, story: this.readStory() };
  }

  passCombatReaction() {
    const transition = this.book.passReaction();
    return { outcome: transition.outcome, story: this.readStory() };
  }

  endCombatTurn() {
    const transition = this.book.endCombatTurn();
    return { outcome: null, story: this.readStory() };
  }

  useCombatItem(itemId) {
    const transition = this.book.useCombatItem(itemId);
    return { outcome: transition.outcome, healed: transition.healed, story: this.readStory() };
  }

  retryStoryAct() {
    const transition = this.book.retryAct();
    return { ...this.readStory(), opening: transition.view.node.text };
  }

  confirmAdultAccess() {
    this.store.transaction((draft) => {
      draft.contentConsent.adultConfirmedAt = new Date().toISOString();
      return draft;
    });
    return { confirmed: true };
  }

  revokeAdultAccess() {
    this.store.transaction((draft) => {
      draft.contentConsent.adultConfirmedAt = null;
      draft.story.activeRun = null;
      return draft;
    });
    return { confirmed: false };
  }

  quitStory() {
    this.assertProgressionResolved();
    this.book.quit();
    return this.readStory();
  }

  continueAfterSuccess() {
    const run = this.store.read().story.activeRun;
    if (!run || run.status !== 'success') throw codedError('STORY_CONTINUE_UNAVAILABLE', 'La conversation libre se rouvre après une réussite.');
    this.assertProgressionResolved();
    const nextStory = this.storyRepository.next(run.storyId, this.progression.read());
    if (nextStory) {
      const sourceEndingId = run.ending.endingId;
      this.book.quit();
      return this.startStory(nextStory.id, { sourceEndingId });
    }
    return this.quitStory();
  }

  assertProgressionResolved() {
    if (this.progression.read().unspentStatPoints > 0) {
      throw codedError('PROGRESSION_CHOICE_REQUIRED', 'Attribue ton point de statistique avant de poursuivre.');
    }
  }

  async send(text, onEvent = () => {}) {
    if (this.inFlight) throw new Error('Le narrateur répond déjà.');
    const rawText = text && typeof text === 'object' ? text.text : text;
    if (typeof rawText !== 'string' || !rawText.trim()) throw new Error('Le message est vide.');
    const run = this.store.read().story.activeRun;
    if (run?.status === 'active') throw codedError('STORY_CHOICE_REQUIRED', 'Choisis l’une des réponses proposées pour poursuivre l’histoire.');
    if (run) throw codedError('STORY_TERMINAL_ACTION_REQUIRED', 'Choisis de reprendre, recommencer ou quitter l’histoire.');
    this.inFlight = true;
    const userMessage = rawText.trim(); const started = this.clock(); let firstDeltaAt = null;
    try {
      let state = this.store.read();
      const thread = await this.gateway.ensureConversationThread(state.conversation.threadId);
      if (thread.threadId !== state.conversation.threadId || thread.recovery) state = this.store.transaction((draft) => {
        draft.conversation.threadId = thread.threadId;
        if (thread.recovery) draft.recoveryEvents.push(thread.recovery);
        return draft;
      });
      const composed = this.composer.compose(state, userMessage);
      this.playerMessageCount += 1;
      const old = this.diagnostics?.read?.() || {};
      this.diagnostics?.update?.({ assembledContext: composed.context, selectedMemories: composed.selectedMemories, conversationThreadId: thread.threadId, modelCallCount: (old.modelCallCount || 0) + 1, playerMessageCount: this.playerMessageCount });
      const stream = new GuardedVisibleStream((event) => {
        if (event.type === 'delta' && firstDeltaAt === null) firstDeltaAt = this.clock();
        onEvent(event);
      });
      const result = await this.gateway.runConversationTurn({ threadId: thread.threadId, input: composed.context, onDelta: (delta) => stream.push(delta) });
      const visible = cleanVisibleResponse(result.text);
      if (visible.valid) stream.flush(); else onEvent({ type: 'replace', text: visible.text });
      const at = new Date().toISOString();
      this.store.transaction((draft) => {
        draft.conversation.threadId = thread.threadId;
        draft.conversation.messages.push({ role: 'user', content: userMessage, at }, { role: 'assistant', content: visible.text, at });
        draft.conversation.messages = draft.conversation.messages.slice(-160);
        return draft;
      });
      this.diagnostics?.update?.({ firstDeltaMs: firstDeltaAt === null ? null : firstDeltaAt - started, visibleTurnDurationMs: this.clock() - started });
      return { text: visible.text, threadId: thread.threadId, story: this.readStory() };
    } finally {
      this.inFlight = false;
    }
  }
}

function heroFromProgression(hero, progression) {
  return {
    ...structuredClone(hero),
    level: progression.level,
    stats: structuredClone(progression.stats),
  };
}

function combatItemsFor(view, progression) {
  if (!view.inCombat || !view.combat) return [];
  const count = progression.inventory?.['healing-potion'] || 0;
  const combat = view.combat;
  return [{
    id: 'healing-potion',
    name: 'Potion de soin',
    count,
    heal: 5,
    actionCost: 1,
    available: count > 0
      && combat.phase === 'player'
      && combat.player.hp < combat.player.maxHp
      && combat.player.actionsPlayed < combat.player.actionLimit,
  }];
}

class GuardedVisibleStream {
  constructor(onEvent, window = 64) { this.onEvent = onEvent; this.window = window; this.pending = ''; this.raw = ''; this.blocked = false; }
  push(delta) { this.raw += delta; this.pending += delta; if (!cleanVisibleResponse(this.raw).valid) { this.blocked = true; return; } if (this.pending.length > this.window) { const safe = this.pending.slice(0, -this.window); this.pending = this.pending.slice(-this.window); if (safe) this.onEvent({ type: 'delta', text: safe }); } }
  flush() { if (!this.blocked && this.pending) this.onEvent({ type: 'delta', text: this.pending }); this.pending = ''; }
}

function codedError(code, text) { const error = new Error(text); error.code = code; return error; }

module.exports = { ConversationService, GuardedVisibleStream };
