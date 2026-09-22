// resource.html display helper recovery (2026-09-22)
// Restores the missing formatDept() used by result tables, detail modal and Excel export.
(() => {
  if (!/\/resource\.html$/i.test(window.location.pathname)) return;
  if (typeof window.formatDept === 'function') return;

  window.formatDept = function formatDept(dept) {
    const raw = String(dept ?? '').trim();
    if (!raw) return '';

    const clean = (typeof pretty === 'function')
      ? pretty(typeof compact === 'function' ? compact(raw) : raw)
      : raw;

    let hq = [];
    try {
      if (typeof HQEDU !== 'undefined' && Array.isArray(HQEDU)) hq = HQEDU;
    } catch (_) {}

    const normalize = value => (typeof compact === 'function')
      ? compact(value)
      : String(value ?? '').replace(/\s+/g, '');

    const key = normalize(clean).replace(/^본청/, '');
    const isHeadOffice = hq.some(name => normalize(name) === key);

    return isHeadOffice && !/^본청\s*/.test(clean)
      ? `본청 ${clean}`
      : clean;
  };
})();
