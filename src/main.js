const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { CharacterStore } = require('./server/character-store');
const { CodexClient } = require('./server/codex-client');
const { ConversationService } = require('./server/conversation-service');
const { DevelopmentDiagnostics } = require('./server/diagnostics');
const { StoryRepository } = require('./server/story-repository');
const { NarrativeStudio } = require('./server/narrative-studio');

let window;
let store;
let codex;
let conversation;
let studio;
let studioWindow;

app.setName('Fantasy Story');

function createWindow(development) {
  window = new BrowserWindow({
    width: 1200, height: 820, minWidth: 880, minHeight: 620,
    backgroundColor: '#111111', titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: development ? ['--candy-development'] : [],
    },
  });
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function openStudioWindow() {
  if (studioWindow && !studioWindow.isDestroyed()) { studioWindow.focus(); return; }
  studioWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700,
    backgroundColor: '#151515', title: 'Atelier narratif — Fantasy Story',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, additionalArguments: ['--candy-development', '--candy-studio'] },
  });
  studioWindow.loadFile(path.join(__dirname, 'renderer', 'studio.html'));
  studioWindow.on('closed', () => { studioWindow = null; });
}

function sanitizeProfileInput(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Profil invalide.');
  const allowed = ['name', 'occupation', 'traits', 'location', 'time', 'outfit', 'mood'];
  if (Object.keys(profile).some((key) => !allowed.includes(key))) throw new Error('Champ de profil non autorisé.');
  return profile;
}

app.whenReady().then(() => {
  const development = !app.isPackaged || process.env.CANDY_DEV_DIAGNOSTICS === '1';
  if (development) process.env.CANDY_DEV_DIAGNOSTICS = '1';
  const dataDir = app.getPath('userData');
  const runtimeDir = path.join(dataDir, 'isolated-runtime');
  fs.mkdirSync(runtimeDir, { recursive: true });
  store = new CharacterStore(path.join(dataDir, 'fantasy-story-state.json'));
  codex = new CodexClient({ cwd: runtimeDir });
  const diagnostics = new DevelopmentDiagnostics({ enabled: development });
  const storyRepository = new StoryRepository();
  conversation = new ConversationService({ store, gateway: codex, diagnostics, storyRepository });
  if (development) studio = new NarrativeStudio({ dataDir, storyRepository, store, codex });

  ipcMain.handle('character:read', () => store.read());
  ipcMain.handle('character:profile:update', (_event, profile) => store.updateProfile(sanitizeProfileInput(profile)));
  ipcMain.handle('chat:status', () => codex.status());
  ipcMain.handle('chat:send', (event, text) => conversation.send(text, (payload) => event.sender.send('chat:event', payload)));
  ipcMain.handle('story:read', () => conversation.readStory());
  ipcMain.handle('story:start', () => conversation.startStory());
  ipcMain.handle('story:restart', () => conversation.restartStory());
  ipcMain.handle('story:choose', (_event, choiceId) => conversation.chooseStoryOption(choiceId));
  ipcMain.handle('combat:card:play', (_event, cardId) => conversation.playCombatCard(cardId));
  ipcMain.handle('combat:reaction:pass', () => conversation.passCombatReaction());
  ipcMain.handle('combat:turn:end', () => conversation.endCombatTurn());
  ipcMain.handle('combat:item:use', (_event, itemId) => conversation.useCombatItem(itemId));
  ipcMain.handle('story:act:retry', () => conversation.retryStoryAct());
  ipcMain.handle('story:continue', () => conversation.continueAfterSuccess());
  ipcMain.handle('progression:stat:allocate', (_event, stat) => conversation.allocateProgressionStat(stat));
  ipcMain.handle('story:adult:confirm', () => conversation.confirmAdultAccess());
  ipcMain.handle('story:adult:revoke', () => conversation.revokeAdultAccess());
  ipcMain.handle('story:quit', () => conversation.quitStory());
  if (development) {
    ipcMain.handle('development:diagnostics:read', () => diagnostics.read());
    ipcMain.handle('development:studio:open', () => { openStudioWindow(); return true; });
    ipcMain.handle('development:studio:read', () => studio.read());
    ipcMain.handle('development:studio:save', (_event, graph) => studio.save(graph));
    ipcMain.handle('development:studio:analyze', (_event, graph) => studio.analyze(graph));
    ipcMain.handle('development:studio:preview', (_event, payload) => studio.preview(payload));
    ipcMain.handle('development:studio:publish', (_event, options) => studio.publish(options));
    ipcMain.handle('development:studio:assist', (_event, payload) => studio.assist(payload));
  }

  createWindow(development);
  codex.connect().then(() => window?.webContents.send('chat:event', { type: 'status', state: 'connected' }))
    .catch((error) => window?.webContents.send('chat:event', { type: 'status', state: 'error', message: error.message }));
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => codex?.close());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(!app.isPackaged); });
