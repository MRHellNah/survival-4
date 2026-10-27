const CACHE_NAME = 'mathwar-v5';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './audio/battle-march.mp3',
  './survival.js',
  './assets/bg.jpg',
  './assets/survival/battle-bg.jpg',
  './assets/slash.png',
  './assets/playerIdle.png', './assets/playerAttack.png', './assets/playerHurt.png', './assets/playerDead.png',
  './assets/enemyIdle.png', './assets/enemyAttack.png', './assets/enemyHurt.png', './assets/enemyDead.png',
  './assets/sfxAtkPlayer.mp3', './assets/sfxAtkEnemy.mp3', './assets/sfxHit.mp3',
  './assets/sfxVictory.mp3', './assets/sfxGameOver.mp3',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // satu per satu: kalau ada 1 file gagal, yang lain tetap ter-cache & SW tetap terpasang
      .then((cache) => Promise.all(PRECACHE_URLS.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Permintaan Range (streaming audio/video di Safari & Chrome) tidak boleh dijawab dengan
  // respons 200 penuh dari cache -> biarkan browser mengurusnya langsung. Ini penyebab audio bisu.
  if (req.headers.has('range')) return;

  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if (isPage) {
    // Halaman: utamakan versi terbaru dari jaringan, cache hanya untuk offline
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
