const route = require('../../content/chapters/la-route-des-ronces.json');
const brumepont = require('../../content/chapters/la-nuit-a-brumepont.json');
const cage = require('../../content/chapters/la-cage-du-treuil.json');
const thirdLevel = require('../../content/chapters/le-troisieme-palier.json');
const { StoryCatalog } = require('../server/story-catalog');
const { StoryGameService } = require('../server/story-game-service');
const { BrowserCharacterStore } = require('./browser-store');

async function createBrowserApi() {
  const store = await BrowserCharacterStore.create();
  const service = new StoryGameService({
    store,
    storyRepository: new StoryCatalog([route, brumepont, cage, thirdLevel]),
  });

  async function call(method, ...args) {
    const result = service[method](...args);
    await store.flush();
    return result;
  }

  return Object.freeze({
    readCharacter: () => callStore(store, 'read'),
    updateCharacterProfile: (profile) => callStore(store, 'updateProfile', profile),
    status: async () => ({ connected: false, mode: 'pwa', offlineReady: true }),
    send: async () => {
      throw new Error('Le narrateur libre reste disponible dans l’application PC.');
    },
    readStory: () => call('readStory'),
    startStory: (storyId = null, options = {}) => call('startStory', storyId, options),
    restartStory: () => call('restartStory'),
    chooseStoryOption: (choiceId) => call('chooseStoryOption', choiceId),
    playCombatCard: (cardId) => call('playCombatCard', cardId),
    passCombatReaction: () => call('passCombatReaction'),
    endCombatTurn: () => call('endCombatTurn'),
    useCombatItem: (itemId) => call('useCombatItem', itemId),
    retryStoryAct: () => call('retryStoryAct'),
    continueAfterSuccess: () => call('continueAfterSuccess'),
    allocateProgressionStat: (stat) => call('allocateProgressionStat', stat),
    confirmAdultAccess: () => call('confirmAdultAccess'),
    revokeAdultAccess: () => call('revokeAdultAccess'),
    quitStory: () => call('quitStory'),
    onEvent: () => () => {},
  });
}

async function callStore(store, method, ...args) {
  const result = store[method](...args);
  await store.flush();
  return result;
}

module.exports = { createBrowserApi };
