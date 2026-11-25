// A small service worker, so the site opens on a slow or spotty connection and a page seen once can be read offline.
//
// - Pages: the network first, so a visitor always gets the latest version. If it hasn't answered in 4 seconds,
//   or there is no connection, the copy saved on the last visit is shown instead.
// - Fonts, images and other files from this site: the saved copy at once, refreshed in the background for next time.
// - Anything from another site (the visit counter, the calendar) is left alone.
//
// To clear every visitor's saved copies, change VERSION. Pages register this file with a plain
// navigator.serviceWorker.register('/sw.js'); a browser without service workers simply skips it.

const VERSION = "v1";
const CACHE = `site-${VERSION}`;
const WAIT = 4000;

// the pages and the font are saved as soon as the worker is installed, so a second page opens offline too
const SHELL = ["/", "/consulting/", "/portfolio/", "/assets/fonts/martian-mono-latin.woff2"];

self.addEventListener("install", (e) => {
  // a page that can't be saved now (a dropped connection) is saved when it is next visited instead
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  // drop the saved copies of older versions
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("site-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// keep a good response for next time
const save = (req, res) => {
  if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const net = fetch(req).then((res) => save(req, res));
      const slow = new Promise((done) => setTimeout(done, WAIT));
      // whichever comes first: the network, or the saved copy once the network is slow
      const first = await Promise.race([net.catch(() => null), slow.then(() => caches.match(req, { ignoreSearch: true }))]);
      if (first) return first;
      // the network failed or was slow with nothing saved: wait for it, else fall back to any saved copy
      try { return await net; } catch (err) { return (await caches.match(req, { ignoreSearch: true })) || (await caches.match("/")) || Response.error(); }
    })());
    return;
  }

  // a range request (a video seeking) goes straight to the network
  if (req.headers.has("range")) return;
  e.respondWith(caches.match(req).then((hit) => {
    const fresh = fetch(req).then((res) => save(req, res));
    if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  }));
});
