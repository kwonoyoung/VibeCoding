// resource.html parser correction for 2026.10.1 personnel appointment PDF and compatible layouts.
// Loaded after latest-home-nav.js so this parser is the final override.
(() => {
  if (!/\/resource\.html$/i.test(window.location.pathname)) return;
  if (typeof pdfjsLib === 'undefined' || typeof parsePDF !== 'function' ||
      typeof compact !== 'function' || typeof sectionInfo !== 'function' ||
      typeof repair !== 'function' || typeof enrich !== 'function' ||
      typeof detectYear !== 'function' || typeof resolveDates !== 'function' ||
      typeof normalizeDate !== 'function' || typeof rank !== 'function' ||
      typeof norm !== 'function' || typeof dateText !== 'function') return;

  const FALLBACK_2025 = {
    s: 0.0782, n: 0.1393, ag: 0.2356, at: 0.3247,
    a: 0.5126, cg: 0.6089, ct: 0.6980, c: 0.8820, d: 0.9580
  };
  const FALLBACK_2026_JAN = {
    s: 0.07239, n: 0.13548, ag: 0.23012, at: 0.32264,
    a: 0.51645, cg: 0.61109, ct: 0.70360, c: 0.89741, d: 0.96454
  };
  const FALLBACK_2026_SEP = {
    s: 0.07228, n: 0.13942, ag: 0.24852, at: 0.33627,
    a: 0.52078, cg: 0.62986, ct: 0.71761, c: 0.90212, d: 0.96159
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

  const centerX = item => Number(item.x) + Math.abs(Number(item.width || 0)) / 2;

  function fallbackBounds(base, width) {
    const firstGrade = base.filter(x => compact(x.text) === '직급')
      .sort((a, b) => a.y - b.y || a.x - b.x)[0];
    const ratio = firstGrade ? firstGrade.x / width : 0;
    const profile = ratio > 0.178 ? FALLBACK_2026_SEP
      : ratio > 0 && ratio < 0.172 ? FALLBACK_2026_JAN : FALLBACK_2025;
    return Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, width * v]));
  }

  function pageBounds(base, width) {
    const grades = base.filter(x => compact(x.text) === '직급').sort((a, b) => a.y - b.y || a.x - b.x);
    const titles = base.filter(x => compact(x.text) === '직위').sort((a, b) => a.y - b.y || a.x - b.x);
    const depts = base.filter(x => compact(x.text) === '부서').sort((a, b) => a.y - b.y || a.x - b.x);
    let row = null;
    for (const seed of grades) {
      const gs = grades.filter(x => Math.abs(x.y - seed.y) <= 3.2).sort((a, b) => a.x - b.x);
      const ts = titles.filter(x => Math.abs(x.y - seed.y) <= 3.2).sort((a, b) => a.x - b.x);
      const ds = depts.filter(x => Math.abs(x.y - seed.y) <= 3.2).sort((a, b) => a.x - b.x);
      if (gs.length >= 2 && ts.length >= 2 && ds.length >= 2) {
        row = { y: seed.y, gs: gs.slice(0, 2), ts: ts.slice(0, 2), ds: ds.slice(0, 2) };
        break;
      }
    }
    if (!row) return fallbackBounds(base, width);

    const [g1, g2] = row.gs.map(centerX);
    const [t1, t2] = row.ts.map(centerX);
    const [d1, d2] = row.ds.map(centerX);
    const A = t1 - g1, B = d1 - t1, C = g2 - d1;
    const gradeW = A - B + C;
    const titleW = A + B - C;
    const deptW = -A + B + C;
    if (!(gradeW > 45 && gradeW < 75 && titleW > 40 && titleW < 70 && deptW > 90 && deptW < 135)) {
      return fallbackBounds(base, width);
    }

    const n = g1 - gradeW / 2;
    const ag = n + gradeW;
    const at = ag + titleW;
    const a = at + deptW;
    const cg = a + gradeW;
    const ct = cg + titleW;
    const c = ct + deptW;
    const nearby = label => base.filter(x => compact(x.text) === label && Math.abs(x.y - row.y) <= 24)
      .sort((x, y) => Math.abs(x.y - row.y) - Math.abs(y.y - row.y) || x.x - y.x)[0];
    const nameHead = nearby('성명');
    const remarkHead = nearby('비고');
    const s = nameHead ? 2 * centerX(nameHead) - n : n - width * 0.062;
    const d = remarkHead ? 2 * centerX(remarkHead) - c : width * 0.965;
    const b = { s, n, ag, at, a, cg, ct, c, d };
    const seq = [b.s, b.n, b.ag, b.at, b.a, b.cg, b.ct, b.c, b.d];
    if (seq.some(x => !Number.isFinite(x)) || seq.some((x, i) => i && x <= seq[i - 1]) ||
        b.s < width * 0.055 || b.d > width * 0.99) return fallbackBounds(base, width);
    return b;
  }

  function sectionInfoStrict(lineText, minX, b) {
    if (!(minX < b.s + 4)) return null;
    const direct = sectionInfo(lineText);
    if (direct) return direct;
    const x = compact(lineText).replace(/^❏/, '');
    if (/^(파견복귀|전입|전출)/.test(x)) return { type: '인사발령', date: '' };
    if (/^정년퇴직/.test(x)) return { type: '퇴직', date: '' };
    return null;
  }

  function normalizeGeneralRecord(r) {
    const oldMarker = compact([r.oldGrade, r.oldTitle, r.oldDept].join(''));
    if (oldMarker === '신규') {
      r.oldGrade = '';
      r.oldTitle = '';
      r.oldDept = '';
      r.oldStatus = '';
      r.type = '전보';
      r.subtype = '신규임용';
      r.changes = ['신규임용'];
      return r;
    }

    r.changes = [];
    if (isPromotion(r.oldGrade,r.newGrade)) r.changes.push('승진');
    else if (r.oldGrade && r.newGrade && compact(r.oldGrade) !== compact(r.newGrade)) r.changes.push('직급변경');
    if (norm(r.oldTitle) !== norm(r.newTitle) && (r.oldTitle || r.newTitle)) r.changes.push('직위변경');
    if (norm(r.oldDept) !== norm(r.newDept) && (r.oldDept || r.newDept)) r.changes.push('전보');
    r.type = r.changes.includes('승진') ? '승진' : '전보';
    r.subtype = r.changes.join(' + ') || '전보';
    return r;
  }

  function normalizeSpecialRecord(r) {
    if (r.type === '전보' || r.type === '인사발령') return normalizeGeneralRecord(r);
    if (r.type === '명예퇴직') {
      const m = compact(r.rawAppointment).match(/(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?/);
      if (m) r.appointmentDate = dateText(m[1], m[2], m[3]);
      r.newGrade = ''; r.newTitle = ''; r.newDept = '';
      r.subtype = '명예퇴직';
      r.changes = /특별승진/.test(compact(r.rawAppointment)) ? ['특별승진', '명예퇴직'] : ['명예퇴직'];
    } else if (r.type === '의원면직') {
      r.newGrade = ''; r.newTitle = ''; r.newDept = '';
      r.subtype = '의원면직';
      r.changes = ['의원면직'];
    }
    return r;
  }

  parsePDF = async function(file) {
    fileYear = detectYear(file.name) || fileYear;
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
      const b = pageBounds(base, vp.width);

      const lines = [];
      for (const x of base.slice().sort((a, z) => a.y - z.y || a.x - z.x)) {
        let g = lines.find(q => Math.abs(q.y - x.y) <= 2.8);
        if (!g) { g = { y: x.y, it: [] }; lines.push(g); }
        g.it.push(x);
      }

      const heads = [];
      for (const g of lines) {
        const sorted = g.it.slice().sort((a, z) => a.x - z.x);
        const s = compact(sorted.map(x => x.text).join(''));
        const minX = Math.min(...sorted.map(x => x.x));
        const si = sectionInfoStrict(s, minX, b);
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
        for (let j = i - 1; j >= 0; j--) if (ev[j].y < e.y - 1) { py = ev[j].y; break; }
        for (let j = i + 1; j < ev.length; j++) if (ev[j].y > e.y + 1) { ny = ev[j].y; break; }
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

        const remark = joinCell(C.remark);
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
          appointmentDate: normalizeDate(remark) || sectionDate,
          rawAppointment: joinCell(C.app),
          remark,
          page: p
        });

        const n = repair(r.newGrade, r.newTitle, r.newDept);
        const o = repair(r.oldGrade, r.oldTitle, r.oldDept);
        r.newGrade = n.grade; r.newTitle = n.title; r.newDept = n.dept;
        r.oldGrade = o.grade; r.oldTitle = o.title; r.oldDept = o.dept;
        if (section === '인사발령' || section === '복직') {
          r.rawAppointment = [r.newGrade, r.newTitle, r.newDept].filter(Boolean).join(' / ');
        }
        if (r.name && r.name !== '성명') out.push(normalizeSpecialRecord(enrich(r)));
      }
    }

    fileYear = detectYear(file.name, all) || fileYear;
    resolveDates(out);
    return out;
  };

  const originalSetup = setup;
  setup = function() {
    originalSetup();
    const fresh = records.filter(r => r.subtype === '신규임용').length;
    if (fresh) $('metricCards').insertAdjacentHTML('beforeend', `<div class="metric"><span>신규임용</span><b>${fresh}명</b></div>`);
  };
})();
