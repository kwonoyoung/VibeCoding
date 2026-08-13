(function () {
  'use strict';

  var ENDPOINT = 'https://eqpiuszmgrwituwprgdc.supabase.co/functions/v1/epeople-qna';
  var rows = [];

  function byId(id) { return document.getElementById(id); }
  function value(id) { var el = byId(id); return el ? el.value : ''; }
  function clean(input) {
    return String(input == null ? '' : input)
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();
  }
  function esc(input) {
    return String(input == null ? '' : input).replace(/[&<>"']/g, function (m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }
  function date8(v) { return v ? String(v).split('-').join('') : ''; }
  function todayLocal() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function fmt(v) {
    var s = String(v || '');
    return /^\d{8}/.test(s) ? s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8) : s;
  }
  function sourceUrl(faqNo) {
    return faqNo
      ? 'https://www.epeople.go.kr/nep/pttn/gnrlPttn/pttnSmlrCaseDetail.npaid?dutySctnNm=tqapttn&epUnionSn=' + encodeURIComponent(faqNo)
      : 'https://www.epeople.go.kr/nep/pttn/gnrlPttn/pttnSmlrCaseList.npaid';
  }
  function setStatus(message, isError) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'status' + (message ? ' show' : '') + (isError ? ' error' : '');
  }
  function render(emptyMessage) {
    var box = byId('results');
    var stats = byId('stats');
    var xlsx = byId('xlsx');
    stats.innerHTML = rows.length
      ? '<span class="badge">정리 결과 ' + rows.length + '건</span><span class="badge">중복 제거 완료</span>'
      : '';
    xlsx.disabled = !rows.length;
    if (!rows.length) {
      box.innerHTML = '<div class="empty">' + esc(emptyMessage || '검색 결과가 없습니다.') + '</div>';
      return;
    }
    box.innerHTML = rows.map(function (r, i) {
      var url = sourceUrl(r.faqNo);
      return '<article class="result"><h2><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" title="국민신문고 답변원문 새 창에서 보기">' +
        (i + 1) + '. ' + esc(r.title || '제목 없음') +
        '</a></h2><div class="meta">FAQ ' + esc(r.faqNo || '-') + ' · ' +
        esc(r.ancName || '처리기관 미표시') + ' · ' + esc(fmt(r.regDate) || '등록일 미표시') +
        '</div><a class="source-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">국민신문고 답변원문 보기 ↗</a></article>';
    }).join('');
  }
  async function searchQna() {
    var searchButton = byId('search');
    var keyword = value('keyword').trim();
    if (!keyword) { alert('검색어를 입력해 주세요.'); byId('keyword').focus(); return; }

    var fromValue = value('from');
    var toValue = value('to');
    if (fromValue && !toValue) {
      toValue = todayLocal();
      byId('to').value = toValue;
    }
    if (fromValue && toValue && fromValue > toValue) {
      alert('등록일 시작은 종료일보다 늦을 수 없습니다.');
      return;
    }

    searchButton.disabled = true;
    byId('loading').classList.add('show');
    setStatus('국민신문고 자료를 검색하고 있습니다.', false);
    try {
      var response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          keyword: keyword,
          regFrom: date8(fromValue),
          regTo: date8(toValue),
          limit: 100
        })
      });
      var text = await response.text();
      var data;
      try { data = JSON.parse(text); }
      catch (parseError) { throw new Error('서버 응답을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.'); }
      if (!response.ok) throw new Error(data.error || '조회에 실패했습니다.');
      rows = Array.isArray(data.items) ? data.items : [];
      render('검색 결과가 없습니다.');
      setStatus(rows.length ? rows.length + '건을 검색했습니다.' : '검색 결과가 없습니다.', false);
    } catch (error) {
      rows = [];
      render('조회 중 오류가 발생했습니다.');
      setStatus(error && error.message ? error.message : '조회 중 오류가 발생했습니다.', true);
    } finally {
      byId('loading').classList.remove('show');
      searchButton.disabled = false;
    }
  }
  function clearResults() {
    rows = [];
    byId('keyword').value = '';
    byId('from').value = '';
    byId('to').value = '';
    render('검색어를 입력하고 검색 버튼을 눌러주세요.');
    setStatus('검색 조건과 결과를 지웠습니다.', false);
    byId('keyword').focus();
  }
  function downloadXlsx() {
    if (!rows.length) { alert('먼저 질의응답을 검색해 주세요.'); return; }
    if (typeof window.XLSX === 'undefined') {
      alert('엑셀 다운로드 모듈을 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해 주세요.');
      return;
    }
    try {
      var data = rows.map(function (r, i) {
        return {'번호':i+1,'FAQ번호':r.faqNo,'제목':r.title,'처리기관':r.ancName,'등록일':fmt(r.regDate),'국민신문고 원문 링크':sourceUrl(r.faqNo)};
      });
      var ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:7},{wch:14},{wch:36},{wch:20},{wch:13},{wch:80}];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '질의응답');
      XLSX.writeFile(wb, '공무원보수_질의응답_' + value('keyword').trim() + '.xlsx');
      setStatus('XLSX 파일 다운로드를 시작했습니다.', false);
    } catch (error) {
      setStatus('XLSX 파일을 만들지 못했습니다.', true);
      alert('XLSX 다운로드 중 오류가 발생했습니다.');
    }
  }
  function init() {
    var search = byId('search'), clear = byId('clear'), xlsx = byId('xlsx'), keyword = byId('keyword');
    if (!search || !clear || !xlsx || !keyword) return;
    search.addEventListener('click', searchQna);
    clear.addEventListener('click', clearResults);
    xlsx.addEventListener('click', downloadXlsx);
    keyword.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); searchQna(); }
    });
    setStatus('검색 준비가 완료되었습니다.', false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
