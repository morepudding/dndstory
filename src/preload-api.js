function createPreloadApi({ invoke, subscribe, development = false }) {
  const api = Object.freeze({
    readCharacter: () => invoke('character:read'),
    updateCharacterProfile: (profile) => invoke('character:profile:update', profile),
    status: () => invoke('chat:status'),
    send: (text) => invoke('chat:send', text),
    readStory: () => invoke('story:read'),
    startStory: () => invoke('story:start'),
    restartStory: () => invoke('story:restart'),
    chooseStoryOption: (choiceId) => invoke('story:choose', choiceId),
    playCombatCard: (cardId) => invoke('combat:card:play', cardId),
    passCombatReaction: () => invoke('combat:reaction:pass'),
    endCombatTurn: () => invoke('combat:turn:end'),
    useCombatItem: (itemId) => invoke('combat:item:use', itemId),
    retryStoryAct: () => invoke('story:act:retry'),
    continueAfterSuccess: () => invoke('story:continue'),
    allocateProgressionStat: (stat) => invoke('progression:stat:allocate', stat),
    confirmAdultAccess: () => invoke('story:adult:confirm'),
    revokeAdultAccess: () => invoke('story:adult:revoke'),
    quitStory: () => invoke('story:quit'),
    onEvent: (callback) => subscribe('chat:event', callback),
    ...(development ? { readDiagnostics: () => invoke('development:diagnostics:read'), openNarrativeStudio: () => invoke('development:studio:open') } : {}),
  });
  return api;
}

module.exports = { createPreloadApi };
