const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { CharacterStore } = require('../src/server/character-store');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { NarrativeStudio } = require('../src/server/narrative-studio');
const { simulateCombat } = require('./simulate-combat');

const outputDir = path.join(__dirname, '..', 'artifacts', 'qa');
const temporaryData = fs.mkdtempSync(path.join(os.tmpdir(), 'fantasy-story-qa-'));
fs.mkdirSync(outputDir, { recursive: true });

app.whenReady().then(async () => {
  const store = new CharacterStore(path.join(temporaryData, 'state.json'));
  const storyRepository = new StoryRepository();
  const diagnostics = new DevelopmentDiagnostics({ enabled: true });
  const service = new ConversationService({ store, gateway: { status: () => ({ connected: true }) }, diagnostics, storyRepository });
  service.startStory();
  const studio = new NarrativeStudio({ dataDir: temporaryData, storyRepository, store, codex: {} });

  ipcMain.handle('character:read', () => store.read());
  ipcMain.handle('chat:status', () => ({ connected: true }));
  ipcMain.handle('story:read', () => service.readStory());
  ipcMain.handle('story:start', () => service.startStory());
  ipcMain.handle('story:restart', () => service.restartStory());
  ipcMain.handle('story:choose', (_event, choiceId) => service.chooseStoryOption(choiceId));
  ipcMain.handle('combat:card:play', (_event, cardId) => service.playCombatCard(cardId));
  ipcMain.handle('combat:reaction:pass', () => service.passCombatReaction());
  ipcMain.handle('combat:turn:end', () => service.endCombatTurn());
  ipcMain.handle('combat:item:use', (_event, itemId) => service.useCombatItem(itemId));
  ipcMain.handle('story:act:retry', () => service.retryStoryAct());
  ipcMain.handle('story:continue', () => service.continueAfterSuccess());
  ipcMain.handle('progression:stat:allocate', (_event, stat) => service.allocateProgressionStat(stat));
  ipcMain.handle('story:adult:confirm', () => service.confirmAdultAccess());
  ipcMain.handle('story:adult:revoke', () => service.revokeAdultAccess());
  ipcMain.handle('story:quit', () => service.quitStory());
  ipcMain.handle('development:diagnostics:read', () => diagnostics.read());
  ipcMain.handle('development:studio:open', () => true);
  ipcMain.handle('development:studio:read', () => studio.read());
  ipcMain.handle('development:studio:save', (_event, graph) => studio.save(graph));
  ipcMain.handle('development:studio:analyze', (_event, graph) => studio.analyze(graph));
  ipcMain.handle('development:studio:preview', (_event, payload) => studio.preview(payload));
  ipcMain.handle('development:studio:publish', (_event, options) => studio.publish(options));
  ipcMain.handle('development:studio:assist', () => Promise.reject(new Error('Assistant désactivé pendant la capture.')));

  const player = new BrowserWindow({
    width: 1200, height: 820, show: false, titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      backgroundThrottling: false, additionalArguments: ['--candy-development'],
    },
  });
  await player.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'index.html'));
  await freezeAnimations(player);
  await delay(350);
  const initial = await player.webContents.executeJavaScript("({title:document.querySelector('#chapter-title').textContent,scene:document.querySelector('#scene-title').textContent,choices:document.querySelectorAll('#story-options button').length})");
  if (!initial.title.includes('La Route des Ronces') || initial.choices < 2) throw new Error(`Écran initial invalide : ${JSON.stringify(initial)}`);
  fs.writeFileSync(path.join(outputDir, 'story-start-1200x820.png'), (await player.capturePage()).toPNG());

  await player.webContents.executeJavaScript("document.querySelector('#story-options button').click()");
  await delay(200);
  const second = await player.webContents.executeJavaScript("({scene:document.querySelector('#scene-title').textContent,choices:document.querySelectorAll('#story-options button').length})");
  if (second.choices < 2) throw new Error(`Transition Electron invalide : ${JSON.stringify(second)}`);
  fs.writeFileSync(path.join(outputDir, 'story-second-node-1200x820.png'), (await player.capturePage()).toPNG());

  service.restartStory();
  service.chooseStoryOption('ancrage-etincelle');
  service.chooseStoryOption('examiner-talus');
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  const combat = await player.webContents.executeJavaScript("({round:document.querySelector('#combat-round').textContent,cards:document.querySelectorAll('#combat-cards button').length})");
  if (combat.round !== 'Round 1' || combat.cards !== 3) throw new Error(`Combat Electron invalide : ${JSON.stringify(combat)}`);
  fs.writeFileSync(path.join(outputDir, 'story-combat-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Braise occulte')).click()");
  await delay(220);
  await player.webContents.executeJavaScript("document.querySelector('#combat-end-turn').click()");
  await delay(220);
  const reaction = await player.webContents.executeJavaScript("({phase:document.querySelector('#combat-phase').textContent,passVisible:!document.querySelector('#combat-pass').hidden,enemyHp:document.querySelector('#combat-enemy-hp').textContent,enemyHand:document.querySelector('#combat-enemy-hand-count').textContent})");
  if (!reaction.phase.includes('2 actions ennemies') || !reaction.passVisible || !reaction.enemyHp.startsWith('17 / 20') || !reaction.enemyHand.includes('2 cartes')) throw new Error(`Réaction Electron invalide : ${JSON.stringify(reaction)}`);
  fs.writeFileSync(path.join(outputDir, 'story-combat-reaction-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Entrave de givre')).click()");
  await delay(220);
  const slowed = await player.webContents.executeJavaScript("({status:document.querySelector('#combat-enemy-statuses').textContent,enemyHand:document.querySelector('#combat-enemy-hand-count').textContent,playerHp:document.querySelector('#combat-player-hp').textContent})");
  if (!slowed.status.includes('Ralentissement 1') || !slowed.status.includes('prochaine pioche −1') || !slowed.enemyHand.includes('1 carte') || !slowed.playerHp.startsWith('9 / 10')) throw new Error(`Ralentissement Electron invalide : ${JSON.stringify(slowed)}`);
  fs.writeFileSync(path.join(outputDir, 'story-combat-slowed-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("document.querySelector('#combat-pass').click()");
  await delay(220);
  fs.writeFileSync(path.join(outputDir, 'story-combat-slow-pending-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Éclat arcanique')).click()");
  await delay(220);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Bâton de voyage')).click()");
  await delay(220);
  const slowConsumed = await player.webContents.executeJavaScript("({phase:document.querySelector('#combat-phase').textContent,status:document.querySelector('#combat-enemy-statuses').textContent,enemyHand:document.querySelector('#combat-enemy-hand-count').textContent,log:document.querySelector('#combat-log').textContent})");
  if (!slowConsumed.phase.includes('1 action ennemie') || slowConsumed.status.trim() || !slowConsumed.enemyHand.includes('1 carte') || !slowConsumed.log.includes('de 2 à 1 carte')) throw new Error(`Dissipation du ralentissement Electron invalide : ${JSON.stringify(slowConsumed)}`);
  await delay(300);
  fs.writeFileSync(path.join(outputDir, 'story-combat-slow-consumed-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("document.querySelector('#combat-pass').click()");
  await delay(220);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Braise occulte')).click()");
  await delay(220);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Bâton de voyage')).click()");
  await delay(220);
  await player.webContents.executeJavaScript("document.querySelector('#combat-pass').click()");
  await delay(220);
  await player.webContents.executeJavaScript("document.querySelector('#combat-pass').click()");
  await delay(220);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Braise occulte')).click()");
  await delay(220);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button) => button.textContent.includes('Bâton de voyage')).click()");
  await delay(300);
  const ending = await player.webContents.executeJavaScript("({scene:document.querySelector('#scene-title').textContent,continueVisible:!document.querySelector('#chapter-continue').hidden,levelVisible:!document.querySelector('#level-up-panel').hidden,options:document.querySelectorAll('#level-stat-options button').length,gold:document.querySelector('#hero-gold').textContent})");
  if (!ending.scene.includes('Niveau 2') || ending.continueVisible || !ending.levelVisible || ending.options !== 5 || ending.gold !== '12 or') throw new Error(`Conclusion Electron invalide : ${JSON.stringify(ending)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'story-level-up-1200x820.png'), (await player.capturePage()).toPNG());
  player.setSize(760, 900);
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  fs.writeFileSync(path.join(outputDir, 'story-level-up-narrow-760x900.png'), (await player.capturePage()).toPNG());
  player.setSize(1200, 820);
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#level-stat-options button')].find((button) => button.textContent.includes('Constitution')).click()");
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'story-level-up-selected-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("document.querySelector('#level-confirm').click()");
  await delay(300);
  await forceRepaint(player);
  const levelConfirmed = await player.webContents.executeJavaScript("({level:document.querySelector('#relation-mood').textContent,constitution:document.querySelector('#stat-constitution').textContent,continueVisible:!document.querySelector('#chapter-continue').hidden,levelVisible:!document.querySelector('#level-up-panel').hidden})");
  if (levelConfirmed.level !== 'Niveau 2' || levelConfirmed.constitution !== '3' || !levelConfirmed.continueVisible || levelConfirmed.levelVisible) throw new Error(`Niveau confirmé invalide : ${JSON.stringify(levelConfirmed)}`);
  fs.writeFileSync(path.join(outputDir, 'story-level-up-confirmed-1200x820.png'), (await player.capturePage()).toPNG());

  await player.webContents.executeJavaScript("document.querySelector('#chapter-continue').click()");
  await delay(350);
  const brumepontArrival = await player.webContents.executeJavaScript("({title:document.querySelector('#chapter-title').textContent,label:document.querySelector('#scene-visual-label').textContent,image:document.querySelector('#scene-art').getAttribute('src'),choices:document.querySelectorAll('#story-options button').length})");
  if (!brumepontArrival.title.includes('Brumepont') || !brumepontArrival.label.includes('Relais') || !brumepontArrival.image?.includes('relais-nuit') || brumepontArrival.choices !== 3) throw new Error(`Arrivée à Brumepont invalide : ${JSON.stringify(brumepontArrival)}`);
  fs.writeFileSync(path.join(outputDir, 'brumepont-arrival-1200x820.png'), (await player.capturePage()).toPNG());

  await player.webContents.executeJavaScript("document.querySelector('#story-options button').click()");
  await delay(250);
  const brumepontOffers = await player.webContents.executeJavaScript("({choices:[...document.querySelectorAll('#story-options button')].map((button)=>button.textContent),gold:document.querySelector('#hero-gold').textContent})");
  if (brumepontOffers.choices.length !== 4 || !brumepontOffers.choices.some((text) => text.toLowerCase().includes('potion')) || !brumepontOffers.choices.some((text) => text.includes('passage oublié')) || brumepontOffers.gold !== '12 or') throw new Error(`Offres de Brumepont invalides : ${JSON.stringify(brumepontOffers)}`);
  fs.writeFileSync(path.join(outputDir, 'brumepont-offers-1200x820.png'), (await player.capturePage()).toPNG());
  player.setSize(760, 900);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'brumepont-offers-narrow-760x900.png'), (await player.capturePage()).toPNG());
  player.setSize(1200, 820);
  await forceRepaint(player);

  await player.webContents.executeJavaScript("[...document.querySelectorAll('#story-options button')].find((button)=>button.textContent.toLowerCase().includes('potion')).click()");
  await delay(300);
  const brumepontCombat = await player.webContents.executeJavaScript("({enemy:document.querySelector('#combat-enemy-name').textContent,potionVisible:!document.querySelector('#combat-potion').hidden,potionDisabled:document.querySelector('#combat-potion').disabled,gold:document.querySelector('#hero-gold').textContent,art:document.querySelector('#scene-art').getAttribute('src')})");
  if (brumepontCombat.enemy !== 'Guetteur des Carrières' || !brumepontCombat.potionVisible || !brumepontCombat.potionDisabled || brumepontCombat.gold !== '4 or' || !brumepontCombat.art?.includes('route-carrieres')) throw new Error(`Combat de Brumepont invalide : ${JSON.stringify(brumepontCombat)}`);
  fs.writeFileSync(path.join(outputDir, 'brumepont-combat-potion-full-1200x820.png'), (await player.capturePage()).toPNG());

  for (let enemyTurn = 0; enemyTurn < 2; enemyTurn += 1) {
    await player.webContents.executeJavaScript("document.querySelector('#combat-end-turn').click()");
    await delay(180);
    for (let reactionIndex = 0; reactionIndex < 3 && await player.webContents.executeJavaScript("!document.querySelector('#combat-pass').hidden"); reactionIndex += 1) {
      await player.webContents.executeJavaScript("document.querySelector('#combat-pass').click()");
      await delay(180);
    }
  }
  const potionReady = await player.webContents.executeJavaScript("({hp:document.querySelector('#combat-player-hp').textContent,disabled:document.querySelector('#combat-potion').disabled,count:document.querySelector('#combat-potion > b').textContent})");
  if (potionReady.hp !== '7 / 15 PV' || potionReady.disabled || potionReady.count !== '×1') throw new Error(`Potion non disponible après blessure : ${JSON.stringify(potionReady)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'brumepont-combat-potion-ready-1200x820.png'), (await player.capturePage()).toPNG());
  await player.webContents.executeJavaScript("document.querySelector('#combat-potion').click()");
  await delay(280);
  const potionUsed = await player.webContents.executeJavaScript("({hp:document.querySelector('#combat-player-hp').textContent,actions:document.querySelector('#combat-actions').textContent,potionVisible:getComputedStyle(document.querySelector('#combat-potion')).display!=='none',profilePotionVisible:getComputedStyle(document.querySelector('#hero-potions')).display!=='none',log:document.querySelector('#combat-log').textContent})");
  if (potionUsed.hp !== '12 / 15 PV' || potionUsed.actions !== '1 disponible' || potionUsed.potionVisible || potionUsed.profilePotionVisible || !potionUsed.log.includes('récupère 5 PV')) throw new Error(`Usage de potion invalide : ${JSON.stringify(potionUsed)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'brumepont-combat-potion-used-1200x820.png'), (await player.capturePage()).toPNG());

  service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-passage' });
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  const cagePassage = await player.webContents.executeJavaScript("({origin:document.querySelector('#scene-state').textContent,art:document.querySelector('#scene-art').getAttribute('src'),choices:document.querySelectorAll('#story-options button').length})");
  if (!cagePassage.origin.includes('Passage oublié') || !cagePassage.art?.includes('treuil-et-puits') || cagePassage.choices !== 2) throw new Error(`Arrivée par passage de la cage invalide : ${JSON.stringify(cagePassage)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-passage-1200x820.png'), (await player.capturePage()).toPNG());
  await captureNarrow(player, 'cage-passage-760x900.png');

  await player.webContents.executeJavaScript("[...document.querySelectorAll('#story-options button')].find((button)=>button.textContent.includes('Examiner le treuil')).click()");
  await delay(180);
  await player.webContents.executeJavaScript("[...document.querySelectorAll('#story-options button')].find((button)=>button.textContent.includes('Stabiliser')).click()");
  await delay(250);
  const cageSaved = await player.webContents.executeJavaScript("({state:document.querySelector('#scene-state').textContent,art:document.querySelector('#scene-art').getAttribute('src'),scene:document.querySelector('#scene-title').textContent})");
  if (!cageSaved.state.includes('Mira sauvée') || !cageSaved.art?.includes('ravin-evasion') || cageSaved.scene !== 'Victoire') throw new Error(`Issue Mira sauvée invalide : ${JSON.stringify(cageSaved)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-mira-sauvee-1200x820.png'), (await player.capturePage()).toPNG());
  await captureNarrow(player, 'cage-mira-sauvee-760x900.png');

  service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-la-route' });
  service.chooseStoryOption('ancrage-activite');
  service.chooseStoryOption('poursuivre-varek');
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  const cagePursuit = await player.webContents.executeJavaScript("({origin:document.querySelector('#scene-state').textContent,art:document.querySelector('#scene-art').getAttribute('src'),charges:document.querySelector('#combat-charges').textContent,tempo:document.querySelector('#combat-tempo-state').textContent,cards:[...document.querySelectorAll('#combat-cards button')].map((button)=>button.textContent),board:getComputedStyle(document.querySelector('.combat-board')).display})");
  if (!cagePursuit.origin.includes('Route surveillée') || !cagePursuit.art?.includes('treuil-et-puits') || !cagePursuit.charges.includes('2 / 2') || cagePursuit.tempo !== 'Neutre' || !cagePursuit.cards.some((text) => text.includes('Orbe suspendu')) || cagePursuit.board !== 'grid') throw new Error(`Poursuite de Varek invalide : ${JSON.stringify(cagePursuit)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-poursuite-1200x820.png'), (await player.capturePage()).toPNG());
  await captureNarrow(player, 'cage-poursuite-760x900.png');

  await player.webContents.executeJavaScript("[...document.querySelectorAll('#combat-cards button')].find((button)=>button.textContent.includes('Orbe suspendu')).click()");
  await delay(220);
  const concentrationActive = await player.webContents.executeJavaScript("({visible:!document.querySelector('#combat-concentration').hidden,state:document.querySelector('#combat-concentration').className,text:document.querySelector('#combat-concentration').textContent,status:document.querySelector('#combat-player-statuses').textContent,charges:document.querySelector('#combat-charges').textContent,enemyHp:document.querySelector('#combat-enemy-hp').textContent})");
  if (!concentrationActive.visible || !concentrationActive.state.includes('active') || !concentrationActive.text.includes('Orbe suspendu') || !concentrationActive.text.includes('5 dégâts au début du prochain tour') || !concentrationActive.status.includes('5 dégâts différés') || !concentrationActive.charges.includes('2 / 2') || concentrationActive.enemyHp !== '13 / 15 PV') throw new Error(`Concentration active invalide : ${JSON.stringify(concentrationActive)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-varek-concentration-active-1200x820.png'), (await player.capturePage()).toPNG());
  await captureNarrow(player, 'cage-varek-concentration-active-760x900.png');

  service.endCombatTurn();
  let protectedReaction = service.readStory().combat.cards.find((card) => card.id === 'voile-azur');
  if (!protectedReaction?.available) throw new Error('Voile indisponible pour protéger la Concentration.');
  service.playCombatCard(protectedReaction.instanceId);
  protectedReaction = service.readStory().combat.cards.find((card) => card.id === 'entrave-de-givre');
  if (!protectedReaction?.available) throw new Error('Entrave indisponible contre Coup de hampe.');
  service.playCombatCard(protectedReaction.instanceId);
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  const concentrationTriggered = await player.webContents.executeJavaScript("({visible:!document.querySelector('#combat-concentration').hidden,state:document.querySelector('#combat-concentration').className,text:document.querySelector('#combat-concentration').textContent,enemyHp:document.querySelector('#combat-enemy-hp').textContent,playerHp:document.querySelector('#combat-player-hp').textContent,tempo:document.querySelector('#combat-tempo-state').textContent,log:document.querySelector('#combat-log').textContent})");
  if (!concentrationTriggered.visible || !concentrationTriggered.state.includes('triggered') || !concentrationTriggered.text.includes('5 dégâts infligés avant la pioche') || concentrationTriggered.enemyHp !== '8 / 15 PV' || concentrationTriggered.playerHp !== '15 / 15 PV' || concentrationTriggered.tempo !== 'Désavantage' || !concentrationTriggered.log.includes('Orbe suspendu éclate')) throw new Error(`Concentration déclenchée invalide : ${JSON.stringify(concentrationTriggered)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-varek-concentration-declenchee-1200x820.png'), (await player.capturePage()).toPNG());

  service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-la-route' });
  service.chooseStoryOption('ancrage-activite');
  service.chooseStoryOption('poursuivre-varek');
  const brokenOrbe = service.readStory().combat.cards.find((card) => card.id === 'orbe-suspendu');
  service.playCombatCard(brokenOrbe.instanceId);
  service.endCombatTurn();
  service.passCombatReaction();
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  const concentrationBroken = await player.webContents.executeJavaScript("({visible:!document.querySelector('#combat-concentration').hidden,state:document.querySelector('#combat-concentration').className,text:document.querySelector('#combat-concentration').textContent,enemyHp:document.querySelector('#combat-enemy-hp').textContent,playerHp:document.querySelector('#combat-player-hp').textContent,log:document.querySelector('#combat-log').textContent})");
  if (!concentrationBroken.visible || !concentrationBroken.state.includes('broken') || !concentrationBroken.text.includes('Les dégâts différés sont perdus') || concentrationBroken.enemyHp !== '13 / 15 PV' || concentrationBroken.playerHp !== '13 / 15 PV' || !concentrationBroken.log.includes('se brise au premier dégât')) throw new Error(`Concentration brisée invalide : ${JSON.stringify(concentrationBroken)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-varek-concentration-brisee-1200x820.png'), (await player.capturePage()).toPNG());
  await captureNarrow(player, 'cage-varek-concentration-brisee-760x900.png');

  service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-la-route' });
  service.chooseStoryOption('ancrage-activite');
  service.chooseStoryOption('poursuivre-varek');
  service.endCombatTurn();
  service.passCombatReaction();
  service.passCombatReaction();
  service.playCombatCard(service.readStory().combat.cards.find((card) => card.id === 'eclat-arcanique').instanceId);
  service.passCombatReaction();
  service.passCombatReaction();
  service.playCombatCard(service.readStory().combat.cards.find((card) => card.id === 'braise-occulte').instanceId);
  service.playCombatCard(service.readStory().combat.cards.find((card) => card.id === 'baton-de-voyage').instanceId);
  service.playCombatCard(service.readStory().combat.cards.find((card) => card.id === 'elan-arcanique').instanceId);
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(220);
  const advantagePending = await player.webContents.executeJavaScript("({tempo:document.querySelector('#combat-tempo-state').textContent,cost:document.querySelector('#combat-tempo-cost').textContent,status:document.querySelector('#combat-player-statuses').textContent,intent:document.querySelector('#combat-intent-title').textContent,hp:document.querySelector('#combat-player-hp').textContent})");
  if (advantagePending.tempo !== 'Avantage' || !advantagePending.cost.includes('coût 0') || !advantagePending.status.includes('Action 0') || advantagePending.intent !== 'Lanterne brisée' || advantagePending.hp !== '6 / 15 PV') throw new Error(`Avantage en attente invalide : ${JSON.stringify(advantagePending)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-varek-avantage-1200x820.png'), (await player.capturePage()).toPNG());
  service.passCombatReaction();
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(220);
  const advantageReady = await player.webContents.executeJavaScript("({phase:document.querySelector('#combat-phase').textContent,tempo:document.querySelector('#combat-tempo-state').textContent,actions:document.querySelector('#combat-actions').textContent,costs:[...document.querySelectorAll('.card-action-cost:not([hidden])')].map((item)=>item.textContent)})");
  if (advantageReady.phase !== 'À vous d’agir' || advantageReady.tempo !== 'Avantage' || advantageReady.actions !== '2 disponibles' || advantageReady.costs.length !== 3 || advantageReady.costs.some((cost) => cost !== '0 Action')) throw new Error(`Avantage prêt invalide : ${JSON.stringify(advantageReady)}`);
  service.playCombatCard(service.readStory().combat.cards.find((card) => card.id === 'braise-occulte').instanceId);
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(220);
  const advantageConsumed = await player.webContents.executeJavaScript("({tempo:document.querySelector('#combat-tempo-state').textContent,actions:document.querySelector('#combat-actions').textContent,status:document.querySelector('#combat-player-statuses').textContent,costs:[...document.querySelectorAll('.card-action-cost:not([hidden])')].map((item)=>item.textContent),log:document.querySelector('#combat-log').textContent})");
  if (advantageConsumed.tempo !== 'Neutre' || advantageConsumed.actions !== '2 disponibles' || advantageConsumed.status.trim() || advantageConsumed.costs.some((cost) => cost !== '1 Action') || !advantageConsumed.log.includes('Avantage est consommé')) throw new Error(`Consommation d’Avantage invalide : ${JSON.stringify(advantageConsumed)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-varek-avantage-consomme-1200x820.png'), (await player.capturePage()).toPNG());

  service.startStory('la-cage-du-treuil', { sourceEndingId: 'carriere-par-la-route' });
  service.chooseStoryOption('ancrage-activite');
  service.chooseStoryOption('poursuivre-varek');
  winSimulatedCombat(service, 'la-cage-du-treuil.json');
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  const cageOrders = await player.webContents.executeJavaScript("({state:document.querySelector('#scene-state').textContent,art:document.querySelector('#scene-art').getAttribute('src'),scene:document.querySelector('#scene-title').textContent})");
  if (!cageOrders.state.includes('Ordres récupérés') || !cageOrders.art?.includes('registre-et-puits') || cageOrders.scene !== 'Victoire') throw new Error(`Issue ordres récupérés invalide : ${JSON.stringify(cageOrders)}`);
  await forceRepaint(player);
  fs.writeFileSync(path.join(outputDir, 'cage-ordres-recuperes-1200x820.png'), (await player.capturePage()).toPNG());
  await captureNarrow(player, 'cage-ordres-recuperes-760x900.png');

  service.startStory('la-route-des-ronces');
  service.chooseStoryOption('ancrage-etincelle');
  service.chooseStoryOption('foncer-ronces');
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  fs.writeFileSync(path.join(outputDir, 'story-failure-1200x820.png'), (await player.capturePage()).toPNG());

  service.startStory('la-route-des-ronces');
  player.setSize(760, 900);
  await reloadWindow(player);
  await freezeAnimations(player);
  await delay(250);
  fs.writeFileSync(path.join(outputDir, 'story-narrow-760x900.png'), (await player.capturePage()).toPNG());

  const workshop = new BrowserWindow({
    width: 1440, height: 900, show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      additionalArguments: ['--candy-development', '--candy-studio'],
    },
  });
  await workshop.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'studio.html'));
  await delay(600);
  fs.writeFileSync(path.join(outputDir, 'studio-1440x900.png'), (await workshop.capturePage()).toPNG());
  workshop.destroy();
  player.destroy();
  console.log(JSON.stringify({
    outputDir,
    initial,
    second,
    combat,
    reaction,
    slowed,
    slowConsumed,
    ending,
    levelConfirmed,
    brumepontArrival,
    brumepontOffers,
    brumepontCombat,
    potionReady,
    potionUsed,
    cagePassage,
    cageSaved,
    cagePursuit,
    concentrationActive,
    concentrationTriggered,
    concentrationBroken,
    cageOrders,
  }, null, 2));
  app.quit();
}).catch((error) => { console.error(error); app.exit(1); });

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function reloadWindow(window) { return new Promise((resolve) => { window.webContents.once('did-finish-load', resolve); window.reload(); }); }
async function captureNarrow(window, filename) {
  const [width, height] = window.getSize();
  window.setSize(760, 900);
  await forceRepaint(window);
  const layout = await window.webContents.executeJavaScript("({ viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, sceneVisible: !document.querySelector('#scene-visual').hidden, art: document.querySelector('#scene-art').getAttribute('src'), markers: document.querySelector('#scene-state').textContent.trim() })");
  if (layout.scrollWidth > layout.viewport + 1 || !layout.sceneVisible || !layout.art || !layout.markers) throw new Error(`Vue étroite invalide pour ${filename} : ${JSON.stringify(layout)}`);
  fs.writeFileSync(path.join(outputDir, filename), (await window.capturePage()).toPNG());
  window.setSize(width, height);
  await forceRepaint(window);
}

async function forceRepaint(window) {
  const [width, height] = window.getSize();
  window.setSize(width - 1, height);
  await delay(40);
  window.setSize(width, height);
  await delay(120);
}
async function freezeAnimations(window) {
  await window.webContents.insertCSS('*{animation:none!important;transition:none!important}.message{opacity:1!important;transform:none!important}');
  await window.webContents.executeJavaScript("document.getAnimations().forEach((animation) => { try { animation.finish(); } catch {} }); document.body.offsetHeight;");
}

function winSimulatedCombat(service, storyName) {
  const report = simulateCombat({
    storyPath: path.join(__dirname, '..', 'content', 'chapters', storyName),
    heroStats: service.readStory().hero.stats,
  });
  if (!report.victories.shortest) throw new Error('Aucune victoire simulée pour la capture de la cage.');
  for (const step of report.victories.shortest.steps) {
    const story = service.readStory();
    const combat = story.combat;
    if (step === 'réaction:aucune') service.passCombatReaction();
    else if (step === 'action:terminer') service.endCombatTurn();
    else {
      const cardId = step.slice(step.indexOf(':') + 1);
      const card = combat.cards.find((candidate) => candidate.id === cardId && candidate.available);
      if (!card) throw new Error(`Carte simulée indisponible : ${cardId}`);
      service.playCombatCard(card.instanceId);
    }
  }
  return service.readStory();
}
