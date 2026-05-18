/* ══ Dagplanner Service Worker v3 ══ */
const CACHE = 'dagplanner-v3';

// Bij installatie: geen pre-caching, altijd netwerk-first
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Activeren: verwijder ALLE oude caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first voor HTML, cache-first voor fonts
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;

  // HTML altijd vers ophalen van netwerk
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const c = r.clone();
          caches.open(CACHE).then(ca => ca.put(e.request, c));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Fonts en overige: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        const c = r.clone();
        caches.open(CACHE).then(ca => ca.put(e.request, c));
        return r;
      });
    })
  );
});
