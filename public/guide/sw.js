const CACHE_PREFIX = 'moodle-guide-';
const CACHE_NAME = `${CACHE_PREFIX}v5-cover-css-path`;
const NAVIGATION_FRESHNESS_MS = 1200;

const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const siteBase = scopePath.endsWith('/guide') ? scopePath.slice(0, -'/guide'.length) : '';
const withBase = (path) => `${siteBase}${path}`;

const GUIDE_SHELL = [
  `${scopePath}/`,
  withBase('/guide/guide-visual-isolation.css'),
  withBase('/guide/jerusalem-math-logo.webp'),
  withBase('/guide/screenshots/01-login.avif'),
  withBase('/guide/screenshots/02-my-courses-home.avif'),
];

async function putIfUsable(cache, key, response) {
  if (response && response.ok) await cache.put(key, response.clone());
  return response;
}

function timeoutAfter(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), milliseconds);
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(
        GUIDE_SHELL.map(async (url) => {
          const response = await fetch(url, { cache: 'reload' });
          await putIfUsable(cache, url, response);
        })
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === `${scopePath}/release.json`) return;

  const isGuideNavigation =
    request.mode === 'navigate' &&
    (url.pathname === scopePath || url.pathname.startsWith(`${scopePath}/`));

  if (isGuideNavigation) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = `${scopePath}/`;
      const cached = await cache.match(cacheKey);
      const networkPromise = fetch(request, { cache: 'no-store' })
        .then((response) => putIfUsable(cache, cacheKey, response))
        .catch(() => null);

      if (!cached) {
        const network = await networkPromise;
        return network || Response.error();
      }

      event.waitUntil(networkPromise);
      const fresh = await Promise.race([networkPromise, timeoutAfter(NAVIGATION_FRESHNESS_MS)]);
      return fresh || cached;
    })());
    return;
  }

  const isGuideAsset =
    url.pathname === withBase('/guide/guide-visual-isolation.css') ||
    url.pathname.startsWith(`${scopePath}/`) ||
    url.pathname.startsWith(withBase('/assets/'));

  if (!isGuideAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    const network = await fetch(request, { cache: 'no-store' })
      .then((response) => putIfUsable(cache, request, response))
      .catch(() => null);

    // putIfUsable hands back whatever arrived, including a 404 or a 502. Those must
    // never beat a good cached copy, or one bad deploy blanks the Guide for readers
    // who already have it.
    if (network && network.ok) return network;
    return cached || network || Response.error();
  })());
});
