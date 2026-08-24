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

// resource.html PDF parser hotfix (2026-08-25)
// PDF.js can return one text item spanning two adjacent table cells. Split each
// run into character-level positions and choose the table-grid profile from the
// actual header position. This supports both the 2025 and 2026 personnel forms.
(() => {
  if (!/\/resource\.html$/i.test(window.location.pathname)) return;
  if (typeof pdfjsLib === 'undefined' || typeof parsePDF !== 'function' ||
      typeof compact !== 'function' || typeof sectionInfo !== 'function' ||
      typeof repair !== 'function' || typeof enrich !== 'function' ||
      typeof detectYear !== 'function' || typeof resolveDates !== 'function') return;

  const RATIOS_2025 = {
    s: 0.0782, n: 0.1393, ag: 0.2356, at: 0.3247,
    a: 0.5126, cg: 0.6089, ct: 0.6980, c: 0.8820, d: 0.9580
  };
  // 2026 공개용 인사발령 서식의 실제 세로선 위치를 기준으로 보정.
  // 특히 직급/직위 경계가 기존 값보다 오른쪽에 있어 '주사·주사보·서기보'의
  // 마지막 글자가 직위 칸으로 넘어가던 문제를 방지한다.
  const RATIOS_2026 = {
    s: 0.072278, n: 0.139415, ag: 0.248522, at: 0.336274,
    a: 0.520783, cg: 0.629856, ct: 0.717608, c: 0.902117, d: 0.961593
  };

  const joinCell = items => compact(items.slice().sort((a, b) =>
    Math.abs(a.y - b.y) > 2 ? a.y - b.y : a.x - b.x
  ).map(x => x.text).join(''));

  function explodeItems(items, viewport) {
    const out = [];
    for (const item of items) {
      const text = String(item.str ?? '');
      if (!compact(text)) continue;
      const chars = Array.from(text);
      const x0 = Number(item.transform?.[4] ?? 0);
      const y = viewport.height - Number(item.transform?.[5] ?? 0);
      const width = Number(item.width ?? 0);

      if (chars.length === 1 || !Number.isFinite(width) || Math.abs(width) < 0.01) {
        out.push({ x: x0 + (Number.isFinite(width) ? width / 2 : 0), y, text });
        continue;
      }

      const step = width / chars.length;
      chars.forEach((ch, index) => {
        if (!compact(ch)) return;
        out.push({ x: x0 + step * (index + 0.5), y, text: ch });
      });
    }
    return out;
  }

  function guardRow(r) {
    let name = compact(r.name);
    let grade = compact(r.newGrade);
    if (name.endsWith('지') && grade.startsWith('방')) {
      name = name.slice(0, -1);
      grade = '지' + grade;
    }
    r.name = name;
    r.newGrade = grade;
    return r;
  }

  function pageRatios(base, width) {
    // 2026 서식은 현임 '부서' 열이 2025 서식보다 넓다. '비고' 헤더의
    // 실제 시작 위치로 서식을 구분해 현임 부서의 마지막 글자가 비고로
    // 잘려 나가는 문제를 방지한다.
    const remark = base
      .filter(x => compact(x.text) === '비고')
      .sort((a, b) => a.y - b.y)[0];
    return remark && remark.x / width > 0.912 ? RATIOS_2026 : RATIOS_2025;
  }

  parsePDF = async function(file) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = [];
    let section = '인사발령', sectionDate = '', all = '';

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const base = tc.items.filter(x => compact(x.str)).map(x => ({
        x: Number(x.transform[4]),
        y: vp.height - Number(x.transform[5]),
        text: x.str,
        width: Number(x.width || 0)
      }));
      const chars = explodeItems(tc.items, vp);
      all += ' ' + base.map(x => x.text).join(' ');

      const W = vp.width;
      const ratios = pageRatios(base, W);
      const b = Object.fromEntries(Object.entries(ratios).map(([k, v]) => [k, W * v]));

      const lines = [];
      for (const x of base.slice().sort((a, z) => a.y - z.y || a.x - z.x)) {
        let g = lines.find(q => Math.abs(q.y - x.y) <= 2.8);
        if (!g) {
          g = { y: x.y, it: [] };
          lines.push(g);
        }
        g.it.push(x);
      }

      const heads = [];
      for (const g of lines) {
        const s = compact(g.it.sort((a, z) => a.x - z.x).map(x => x.text).join(''));
        const si = sectionInfo(s);
        if (si) heads.push({ y: g.y, ...si });
      }

      const serials = base.filter(x => x.x < b.s && /^\d{1,4}$/.test(compact(x.text)))
        .sort((a, z) => a.y - z.y);
      const gaps = serials.slice(1).map((x, i) => x.y - serials[i].y)
        .filter(x => x > 17 && x < 90).sort((a, z) => a - z);
      const gap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 34;
      const ev = [
        ...heads.map(x => ({ ...x, k: 'h' })),
        ...serials.map(x => ({ y: x.y, k: 's', item: x }))
      ].sort((a, z) => a.y - z.y);

      for (let i = 0; i < ev.length; i++) {
        const e = ev[i];
        if (e.k === 'h') {
          section = e.type;
          if (e.date) sectionDate = e.date;
          continue;
        }

        let py = e.y - gap, ny = e.y + gap;
        for (let j = i - 1; j >= 0; j--) {
          if (ev[j].y < e.y - 1) { py = ev[j].y; break; }
        }
        for (let j = i + 1; j < ev.length; j++) {
          if (ev[j].y > e.y + 1) { ny = ev[j].y; break; }
        }

        const start = Math.max((py + e.y) / 2, e.y - gap * 0.46);
        const end = (e.y + ny) / 2;
        const row = chars.filter(x => x.y >= start && x.y < end);
        const C = { name: [], ag: [], at: [], ad: [], cg: [], ct: [], cd: [], remark: [], app: [] };

        for (const x of row) {
          const q = x.x;
          if (q >= b.s && q < b.n) C.name.push(x);
          else if (q >= b.n && q < b.ag) { C.ag.push(x); C.app.push(x); }
          else if (q >= b.ag && q < b.at) { C.at.push(x); C.app.push(x); }
          else if (q >= b.at && q < b.a) { C.ad.push(x); C.app.push(x); }
          else if (q >= b.a && q < b.cg) C.cg.push(x);
          else if (q >= b.cg && q < b.ct) C.ct.push(x);
          else if (q >= b.ct && q < b.c) C.cd.push(x);
          else if (q >= b.c && q < b.d) C.remark.push(x);
        }

        let r = guardRow({
          type: section,
          serial: compact(e.item.text),
          name: joinCell(C.name),
          newGrade: joinCell(C.ag),
          newTitle: joinCell(C.at),
          newDept: joinCell(C.ad),
          oldGrade: joinCell(C.cg),
          oldTitle: joinCell(C.ct),
          oldDept: joinCell(C.cd),
          appointmentDate: sectionDate,
          rawAppointment: joinCell(C.app),
          remark: joinCell(C.remark),
          page: p
        });

        const n = repair(r.newGrade, r.newTitle, r.newDept);
        const o = repair(r.oldGrade, r.oldTitle, r.oldDept);
        r.newGrade = n.grade;
        r.newTitle = n.title;
        r.newDept = n.dept;
        r.oldGrade = o.grade;
        r.oldTitle = o.title;
        r.oldDept = o.dept;

        if (section === '인사발령' || section === '복직') {
          r.rawAppointment = [r.newGrade, r.newTitle, r.newDept].filter(Boolean).join(' / ');
        }
        if (r.name && r.name !== '성명') out.push(enrich(r));
      }
    }

    fileYear = detectYear(file.name, all);
    resolveDates(out);
    return out;
  };
})();
