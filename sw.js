/* TGAT1 English Studio v48.21.0 offline service worker.
   หลักการ: (1) ไฟล์แกน (CORE) ต้องแคชครบ ไม่งั้นไม่ติดตั้ง — กันแอปขึ้นไปแล้วออฟไลน์ใช้ไม่ได้
           (2) ไฟล์ประกอบ (ไอคอน, chunk เสริม) แคชแบบ best-effort ไม่ล้มทั้งการติดตั้ง
           (3) เปิดหน้าเว็บ: ใช้เน็ตก่อน แต่ถ้าเน็ตช้าเกิน NAV_TIMEOUT หรือล่ม ให้ใช้แคชทันที */
'use strict';
const CACHE_NAME = 'tgat1-studio-v48.21.0';
const APP_SHELL = [
  './', './index.html', './app.css', './app.js', './data.js',
  './learning-hub.css', './premium.css', './quality.js', './premium.js', './learning-hub.js', './learning-hub-curriculum.js', './learning-hub-data.js', './learning-path-data.js', './speaking-idioms.js', './reading-extended.js', './structure-extra.js', './sight-context.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png'
];
/* ไฟล์ที่ถ้าขาดแล้วแอปใช้งานไม่ได้ — ต้องแคชสำเร็จทุกไฟล์ก่อนติดตั้ง */
const CORE = [
  './', './index.html', './app.css', './app.js', './data.js',
  './learning-hub.css', './premium.css', './quality.js', './premium.js', './learning-hub.js', './learning-hub-curriculum.js', './learning-hub-data.js', './learning-path-data.js', './speaking-idioms.js', './reading-extended.js', './structure-extra.js', './sight-context.js',
  './manifest.webmanifest'
];
const LAZY_CHUNKS = ['./data-vault.js', './data-senses.js'];
/* เปิดช่องให้เทสต์กำหนดเวลาได้ (self.__TGAT1_NAV_TIMEOUT_MS) ค่าใช้งานจริงคือ 3500 ms */
const NAV_TIMEOUT = (self.__TGAT1_NAV_TIMEOUT_MS | 0) || 3500;

const cleanUrl = url => { const u = new URL(url, self.location.href); u.search = ''; u.hash = ''; return u.href; };
const isAppEntry = url => { const scope = new URL(self.registration.scope); return url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html'; };
function fresh(url) { return new Request(url, { cache: 'reload' }); }

/* คืนค่า promise ที่ resolve เป็น value หรือ null เมื่อเกินเวลา (ไม่ reject) */
function withTimeout(promise, ms) {
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => { if (settled) return; settled = true; resolve(null); }, ms);
    Promise.resolve(promise).then(value => {
      if (settled) return; settled = true; clearTimeout(timer); resolve(value);
    }, () => {
      if (settled) return; settled = true; clearTimeout(timer); resolve(null);
    });
  });
}

/* แคชไฟล์เดียว: คืน 'ok' | 'rejected' และไม่ทำให้ทั้งชุดล้ม */
function cacheOne(cache, url) {
  return fetch(fresh(url)).then(response => {
    if (!response || !response.ok) throw new Error('HTTP ' + (response ? response.status : '0') + ' ' + url);
    return cache.put(url, response);
  }).then(() => 'ok', () => 'rejected');
}

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE_NAME).then(cache =>
    Promise.all(APP_SHELL.map(url => cacheOne(cache, url))).then(states => {
      const failed = APP_SHELL.filter((url, i) => states[i] !== 'ok');
      const missingCore = CORE.filter(url => failed.indexOf(url) >= 0);
      if (missingCore.length) throw new Error('core asset missing: ' + missingCore.join(', '));
      if (failed.length) console.warn('[sw] optional asset skipped: ' + failed.join(', '));
      return Promise.allSettled(LAZY_CHUNKS.map(url => fetch(fresh(url)).then(
        response => (response && response.ok ? cache.put(url, response) : undefined),
        () => undefined
      )));
    })
  )
));

self.addEventListener('message', event => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('tgat1-studio-') && k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html');
      const network = await withTimeout(fetch(req), NAV_TIMEOUT);
      if (network && network.ok) {
        if (isAppEntry(url)) {
          const copy = network.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {});
        }
        return network;
      }
      if (cached) return cached;
      if (network) return network;
      return new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<body style="font-family:system-ui;padding:24px;line-height:1.6"><h1>ออฟไลน์อยู่</h1>' +
        '<p>ยังไม่มีข้อมูลแอปในเครื่องนี้ การเปิดครั้งแรกต้องต่ออินเทอร์เน็ตหนึ่งครั้ง หลังจากนั้นใช้แบบออฟไลน์ได้</p></body>',
        { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    })());
    return;
  }

  const key = cleanUrl(req.url);
  event.respondWith(caches.match(req).then(cached => cached || caches.match(key).then(qcached => qcached || fetch(req).then(response => {
    if (response && response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(key, copy)).catch(() => {}); }
    return response;
  })).catch(() => caches.match(key))));
});
