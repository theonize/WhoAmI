/* Service worker for "Who Am I?" PWA.
 * Bump VERSION whenever you change cached assets (CSS/JS/content/icons)
 * so returning visitors get the update. */
const VERSION = "1.0.0";
const CACHE = `whoami-${VERSION}`;

/* Core app shell — paths are relative to this file (the site root).
 * When you add a chapter module, add it here too. */
const PRECACHE = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/js/store.js",
  "./content/book.js",
  "./content/chapters/01-what-is-a-human.js",
  "./content/chapters/02-apart-from-god.js",
  "./content/chapters/03-child-of-god.js",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // allSettled so a single missing asset can't abort the whole install.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Only remove this app's own outdated caches. The origin can be shared
      // with other GitHub Pages project sites, so never touch their caches.
      await Promise.all(
        keys.filter((k) => k.startsWith("whoami-") && k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin (e.g. Bible Gateway)

  // Navigations: network-first, fall back to cached shell, then offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // Only refresh the shell on a successful response — never cache a
          // 404/error page (fetch resolves for HTTP errors too) as the shell.
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put("./index.html", fresh.clone());
          }
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match("./index.html")) || (await cache.match("./offline.html"));
        }
      })()
    );
    return;
  }

  // Other same-origin assets: cache-first, revalidate in the background.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});

// Allow the page to trigger an immediate activation if desired.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
