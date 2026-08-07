(() => {
  const HOME = '/VibeCoding/index.html?home=latest-20260807-2341';

  // Remove the old service-worker navigation and caches that may serve an old home page.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(reg => reg.unregister())))
      .catch(() => {});
  }
  if ('caches' in window) {
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .catch(() => {});
  }

  function isHomeLink(a) {
    if (!a) return false;
    if (a.id === 'vibecoding-home-btn') return true;
    if (a.getAttribute('data-vibecoding-home') === 'persistent') return true;
    const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
    const href = a.getAttribute('href') || '';
    return /(?:⌂\s*홈|VibeCoding.*🏠|홈으로)/i.test(text) &&
      /^(?:\.\/?|index\.html|\/VibeCoding\/?|\/VibeCoding\/index\.html)/i.test(href);
  }

  function fixHomeLinks() {
    document.querySelectorAll('a').forEach(a => {
      if (isHomeLink(a)) a.setAttribute('href', HOME);
    });
  }

  fixHomeLinks();
  document.addEventListener('DOMContentLoaded', fixHomeLinks, { once: true });
  document.addEventListener('click', event => {
    const a = event.target.closest && event.target.closest('a');
    if (!isHomeLink(a)) return;
    event.preventDefault();
    window.location.href = HOME;
  }, true);
})();
