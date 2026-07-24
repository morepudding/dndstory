const CACHE_NAME = self.__FANTASY_STORY_CACHE__ || 'fantasy-story-dev';
const APP_SHELL = self.__FANTASY_STORY_ASSETS__ || [];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(async (keys) => {
        const staleCaches = keys.filter(
          (key) => key.startsWith('fantasy-story-') && key !== CACHE_NAME,
        );
        await Promise.all(staleCaches.map((key) => caches.delete(key)));
        await self.clients.claim();
        if (staleCaches.length === 0) return;
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        await Promise.all(windows.map((client) => client.navigate(client.url)));
      }),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html'))),
  );
});
