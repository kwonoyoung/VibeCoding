const BASE = '/VibeCoding/';
const HOME = BASE + 'index.html';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const HOME_UI = `
<style id="vibecoding-home-style">
  #vibecoding-home-btn{
    position:fixed;right:18px;bottom:18px;z-index:2147483647;
    display:inline-flex;align-items:center;justify-content:center;gap:7px;
    min-width:82px;height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.42);
    border-radius:999px;background:rgba(9,52,78,.94);color:#fff!important;
    box-shadow:0 10px 28px rgba(0,0,0,.20);backdrop-filter:blur(10px);
    -webkit-backdrop-filter:blur(10px);text-decoration:none!important;
    font:800 14px/1.2 "Malgun Gothic","Apple SD Gothic Neo",sans-serif!important;
    letter-spacing:-.02em;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;
  }
  #vibecoding-home-btn:hover{transform:translateY(-2px);background:#0a6a75;box-shadow:0 14px 32px rgba(0,0,0,.24)}
  #vibecoding-home-btn:focus-visible{outline:3px solid #ffd43b;outline-offset:3px}
  @media(max-width:640px){#vibecoding-home-btn{right:12px;bottom:12px;height:42px;min-width:76px;padding:0 14px;font-size:13px}}
  @media print{#vibecoding-home-btn{display:none!important}}
</style>
<a id="vibecoding-home-btn" href="${HOME}" aria-label="업무지원 서비스 홈으로 이동">⌂ 홈</a>`;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode !== 'navigate') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (url.pathname === BASE || url.pathname === HOME) return;
  if (!url.pathname.toLowerCase().endsWith('.html')) return;

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.includes('text/html')) return res;

      let html = await res.text();
      if (!html.includes('id="vibecoding-home-btn"')) {
        html = /<\/body\s*>/i.test(html)
          ? html.replace(/<\/body\s*>/i, HOME_UI + '\n</body>')
          : html + HOME_UI;
      }

      const headers = new Headers(res.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.set('cache-control', 'no-cache');

      return new Response(html, {
        status: res.status,
        statusText: res.statusText,
        headers
      });
    } catch (err) {
      return fetch(req);
    }
  })());
});
