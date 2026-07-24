const { contextBridge, ipcRenderer } = require('electron');

const development = process.argv.includes('--candy-development');
const api = Object.freeze({
  readCharacter: () => ipcRenderer.invoke('character:read'),
  updateCharacterProfile: (profile) => ipcRenderer.invoke('character:profile:update', profile),
  status: () => ipcRenderer.invoke('chat:status'),
  send: (text) => ipcRenderer.invoke('chat:send', text),
  readStory: () => ipcRenderer.invoke('story:read'),
  startStory: () => ipcRenderer.invoke('story:start'),
  restartStory: () => ipcRenderer.invoke('story:restart'),
  chooseStoryOption: (choiceId) => ipcRenderer.invoke('story:choose', choiceId),
  playCombatCard: (cardId) => ipcRenderer.invoke('combat:card:play', cardId),
  passCombatReaction: () => ipcRenderer.invoke('combat:reaction:pass'),
  endCombatTurn: () => ipcRenderer.invoke('combat:turn:end'),
  useCombatItem: (itemId) => ipcRenderer.invoke('combat:item:use', itemId),
  retryStoryAct: () => ipcRenderer.invoke('story:act:retry'),
  continueAfterSuccess: () => ipcRenderer.invoke('story:continue'),
  allocateProgressionStat: (stat) => ipcRenderer.invoke('progression:stat:allocate', stat),
  confirmAdultAccess: () => ipcRenderer.invoke('story:adult:confirm'),
  revokeAdultAccess: () => ipcRenderer.invoke('story:adult:revoke'),
  quitStory: () => ipcRenderer.invoke('story:quit'),
  onEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('chat:event', listener);
    return () => ipcRenderer.removeListener('chat:event', listener);
  },
  ...(development ? {
    readDiagnostics: () => ipcRenderer.invoke('development:diagnostics:read'),
    openNarrativeStudio: () => ipcRenderer.invoke('development:studio:open'),
  } : {}),
});

contextBridge.exposeInMainWorld('candy', api);
if (development && process.argv.includes('--candy-studio')) contextBridge.exposeInMainWorld('candyStudio', Object.freeze({
  read: () => ipcRenderer.invoke('development:studio:read'),
  save: (graph) => ipcRenderer.invoke('development:studio:save', graph),
  analyze: (graph) => ipcRenderer.invoke('development:studio:analyze', graph),
  preview: (payload) => ipcRenderer.invoke('development:studio:preview', payload),
  publish: (options) => ipcRenderer.invoke('development:studio:publish', options),
  assist: (payload) => ipcRenderer.invoke('development:studio:assist', payload),
}));
