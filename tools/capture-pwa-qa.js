const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'artifacts', 'qa');
const port = 4317;
const origin = `http://127.0.0.1:${port}`;
let server;

app.commandLine.appendSwitch('disable-http-cache');

app.whenReady().then(async () => {
  fs.mkdirSync(output, { recursive: true });
  server = spawn(process.execPath, [path.join(__dirname, 'serve-pwa.js'), String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  await waitForServer(server);

  const player = new BrowserWindow({
    width: 390,
    height: 844,
    useContentSize: true,
    show: false,
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: `pwa-qa-${Date.now()}`,
    },
  });
  await player.loadURL(origin);
  await waitForReady(player);

  const initial = await inspect(player);
  assertMobileLayout(initial, 'accueil');
  await click(player, '#chapter-action');
  await waitFor(player, "document.querySelector('#adult-gate')?.open || document.querySelectorAll('#story-options button').length > 0");
  const ageGateOpen = await player.webContents.executeJavaScript("document.querySelector('#adult-gate')?.open");
  if (ageGateOpen) {
    await player.webContents.executeJavaScript("document.querySelector('#adult-confirm').click()");
    await click(player, '#adult-start');
  }
  await waitFor(player, "document.querySelectorAll('#story-options button').length === 2");
  await forceRepaint(player);
  fs.writeFileSync(path.join(output, 'pwa-route-390x844.png'), (await player.capturePage()).toPNG());

  await click(player, '#story-options button:nth-child(1)');
  await waitFor(player, "document.querySelectorAll('#story-options button').length === 4");
  await click(player, '#story-options button:nth-child(1)');
  await waitFor(player, "!document.querySelector('#combat-panel').hidden && document.querySelector('#combat-phase').textContent.includes('agir')");
  await forceRepaint(player);
  const combat = await inspect(player);
  assertMobileLayout(combat, 'combat');
  if (combat.cardCount < 1 || combat.minTouchTarget < 44 || combat.storyNode !== 'pillard') {
    throw new Error(`Interaction tactile invalide : ${JSON.stringify(combat)}`);
  }
  fs.writeFileSync(path.join(output, 'pwa-combat-390x844.png'), (await player.capturePage()).toPNG());

  player.setContentSize(844, 390);
  await delay(120);
  await forceRepaint(player, 844, 390);
  const landscape = await inspect(player);
  assertLandscapeLayout(landscape);
  fs.writeFileSync(path.join(output, 'pwa-combat-landscape-844x390.png'), (await player.capturePage()).toPNG());
  player.setContentSize(390, 844);
  await forceRepaint(player);

  const before = await player.webContents.executeJavaScript(`(async () => {
    const button = [...document.querySelectorAll('.combat-card')].find((item) => !item.disabled);
    if (!button) throw new Error('Aucune carte jouable');
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const state = await window.candy.readCharacter();
    return {
      revision: state.revision,
      activeNodeId: state.story.activeRun.activeNodeId,
      combat: state.story.activeRun.combat,
    };
  })()`);
  await player.reload();
  await waitForReady(player);
  const after = await player.webContents.executeJavaScript(`(async () => {
    const state = await window.candy.readCharacter();
    return {
      revision: state.revision,
      activeNodeId: state.story.activeRun.activeNodeId,
      combat: state.story.activeRun.combat,
      registration: Boolean(await navigator.serviceWorker.getRegistration()),
      manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
    };
  })()`);
  if (
    after.revision !== before.revision
    || after.activeNodeId !== before.activeNodeId
    || JSON.stringify(after.combat) !== JSON.stringify(before.combat)
  ) {
    throw new Error(`La reprise IndexedDB diverge : ${JSON.stringify({ before, after })}`);
  }
  if (!after.registration || after.manifest !== 'manifest.webmanifest') {
    throw new Error(`Installation PWA incomplète : ${JSON.stringify(after)}`);
  }

  await player.webContents.executeJavaScript('navigator.serviceWorker.ready');
  server.kill();
  server = null;
  await delay(250);
  await player.reload();
  await waitForReady(player);
  const offline = await inspect(player);
  assertMobileLayout(offline, 'hors ligne');
  const offlineState = await player.webContents.executeJavaScript('window.candy.readCharacter()');
  if (offlineState.revision !== before.revision || offlineState.story.activeRun.activeNodeId !== before.activeNodeId) {
    throw new Error('La reprise hors ligne ne conserve pas la partie.');
  }

  console.log(JSON.stringify({
    origin,
    initial,
    combat,
    landscape,
    persistedRevision: after.revision,
    serviceWorker: after.registration,
    offlineReady: true,
    screenshots: [
      'artifacts/qa/pwa-route-390x844.png',
      'artifacts/qa/pwa-combat-390x844.png',
      'artifacts/qa/pwa-combat-landscape-844x390.png',
    ],
  }, null, 2));
  player.destroy();
  app.quit();
}).catch((error) => {
  console.error(error);
  if (server) server.kill();
  app.exit(1);
});

function inspect(window) {
  return window.webContents.executeJavaScript(`(() => {
    const touchTargets = [...document.querySelectorAll('button:not([hidden]), summary:not([hidden])')]
      .filter((item) => {
        const style = getComputedStyle(item);
        const rect = item.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map((item) => Math.min(item.getBoundingClientRect().width, item.getBoundingClientRect().height));
    return {
      viewport: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      sceneVisible: !document.querySelector('#scene-visual').hidden,
      combatVisible: !document.querySelector('#combat-panel').hidden,
      cardCount: document.querySelectorAll('.combat-card').length,
      minTouchTarget: touchTargets.length ? Math.min(...touchTargets) : 0,
      maxTouchTarget: touchTargets.length ? Math.max(...touchTargets) : 0,
      navVisible: getComputedStyle(document.querySelector('.nav-rail')).display !== 'none',
      profileVisible: getComputedStyle(document.querySelector('.profile-panel')).display !== 'none',
      chatHeaderVisible: getComputedStyle(document.querySelector('.chat-header')).display !== 'none',
      narrativeBarVisible: getComputedStyle(document.querySelector('.narrative-bar')).display !== 'none',
      sceneTop: Math.round(document.querySelector('#scene-visual').getBoundingClientRect().top),
      sceneWidth: Math.round(document.querySelector('#scene-visual').getBoundingClientRect().width),
      sceneHeight: Math.round(document.querySelector('#scene-visual').getBoundingClientRect().height),
      combatTop: Math.round(document.querySelector('#combat-panel').getBoundingClientRect().top),
      combatVisibleHeight: Math.round(Math.max(
        0,
        Math.min(innerHeight, document.querySelector('#combat-panel').getBoundingClientRect().bottom)
          - Math.max(0, document.querySelector('#combat-panel').getBoundingClientRect().top),
      )),
      ready: window.CANDY_PWA_READY === true,
    };
  })()`).then(async (layout) => ({
    ...layout,
    storyNode: (await window.webContents.executeJavaScript('window.candy.readCharacter()')).story.activeRun?.activeNodeId || null,
  }));
}

function assertMobileLayout(layout, label) {
  if (!layout.ready || layout.viewport !== 390 || layout.scrollWidth > layout.viewport + 1) {
    throw new Error(`Vue mobile ${label} invalide : ${JSON.stringify(layout)}`);
  }
}

function assertLandscapeLayout(layout) {
  if (
    !layout.ready
    || layout.viewport !== 844
    || layout.height !== 390
    || layout.scrollWidth > layout.viewport + 1
    || layout.navVisible
    || layout.profileVisible
    || layout.chatHeaderVisible
    || layout.narrativeBarVisible
    || layout.sceneTop !== 0
    || layout.sceneWidth !== layout.viewport
    || layout.sceneHeight !== layout.height
    || layout.combatTop > 8
    || layout.combatVisibleHeight < 380
    || layout.minTouchTarget < 44
  ) {
    throw new Error(`Vue mobile paysage invalide : ${JSON.stringify(layout)}`);
  }
}

function click(window, selector) {
  return window.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(selector)}).click()`);
}

async function waitFor(window, expression, attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    if (await window.webContents.executeJavaScript(`Boolean(${expression})`)) return;
    await delay(50);
  }
  throw new Error(`Condition PWA non atteinte : ${expression}`);
}

async function waitForReady(window) {
  await waitFor(window, 'window.CANDY_PWA_READY === true', 120);
  await delay(180);
}

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Le serveur PWA ne répond pas.')), 5000);
    child.stdout.on('data', (chunk) => {
      if (!String(chunk).includes('Fantasy Story PWA')) return;
      clearTimeout(timeout);
      resolve();
    });
    child.stderr.on('data', (chunk) => {
      clearTimeout(timeout);
      reject(new Error(String(chunk)));
    });
    child.once('exit', (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Le serveur PWA s’est arrêté avec le code ${code}.`));
      }
    });
  });
}

async function forceRepaint(window, width = 390, height = 844) {
  window.setContentSize(width - 1, height);
  await delay(40);
  window.setContentSize(width, height);
  await window.webContents.executeJavaScript('document.body.offsetHeight');
  await delay(480);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
