const { createBrowserApi } = require('./browser-api');

async function start() {
  document.documentElement.classList.add('pwa');
  window.candy = await createBrowserApi();
  refreshInstalledPwa();
  require('../renderer/app');
  window.CANDY_PWA_READY = true;
}

function refreshInstalledPwa() {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  navigator.serviceWorker
    .register('./service-worker.js', { updateViaCache: 'none' })
    .then((registration) => registration.update())
    .catch(() => {});
}

start().catch((error) => {
  document.body.innerHTML = `<main class="pwa-boot-error"><h1>Fantasy Story</h1><p>${escapeHtml(error.message)}</p><button type="button" onclick="location.reload()">Réessayer</button></main>`;
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}
