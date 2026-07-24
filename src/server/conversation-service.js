const { ContextComposer } = require('./context-composer');
const { cleanVisibleResponse } = require('./codex-client');
const { StoryGameService } = require('./story-game-service');

class ConversationService extends StoryGameService {
  constructor({ store, gateway, diagnostics, storyRepository, composer = null, clock = () => Date.now() }) {
    super({ store, storyRepository, diagnostics });
    Object.assign(this, { store, gateway, diagnostics, storyRepository, clock });
    this.composer = composer || new ContextComposer();
    this.inFlight = false;
    this.playerMessageCount = 0;
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

class GuardedVisibleStream {
  constructor(onEvent, window = 64) { this.onEvent = onEvent; this.window = window; this.pending = ''; this.raw = ''; this.blocked = false; }
  push(delta) { this.raw += delta; this.pending += delta; if (!cleanVisibleResponse(this.raw).valid) { this.blocked = true; return; } if (this.pending.length > this.window) { const safe = this.pending.slice(0, -this.window); this.pending = this.pending.slice(-this.window); if (safe) this.onEvent({ type: 'delta', text: safe }); } }
  flush() { if (!this.blocked && this.pending) this.onEvent({ type: 'delta', text: this.pending }); this.pending = ''; }
}

function codedError(code, text) { const error = new Error(text); error.code = code; return error; }

module.exports = { ConversationService, GuardedVisibleStream };
