class DevelopmentDiagnostics {
  constructor({ enabled = false } = {}) {
    this.enabled = enabled;
    this.snapshot = this.empty();
  }
  empty() {
    return { assembledContext:null, selectedMemories:[], conversationThreadId:null, recoveryEvents:[], firstDeltaMs:null, visibleTurnDurationMs:null, modelCallCount:0, playerMessageCount:0, storyEvents:[], lastStoryEvent:null };
  }
  update(patch) { if (this.enabled) this.snapshot = { ...this.snapshot, ...structuredClone(patch) }; }
  read() { return this.enabled ? structuredClone(this.snapshot) : null; }
}

module.exports = { DevelopmentDiagnostics };
