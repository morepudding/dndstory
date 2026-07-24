const { createBrowserApi } = require('./browser-api');

async function start() {
  document.documentElement.classList.add('pwa');
  window.candy = await createBrowserApi();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
  require('../renderer/app');
  window.CANDY_PWA_READY = true;
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
