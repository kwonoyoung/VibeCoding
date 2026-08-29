(()=>{
  function addSupportButton(){
    if(document.querySelector('.support-float-btn'))return;
    const style=document.createElement('style');
    style.textContent=`.support-float-btn{position:fixed;left:22px;bottom:22px;z-index:99998;display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1px solid #f0d98b;border-radius:999px;background:linear-gradient(135deg,#fff9d8,#ffe98b);color:#654d00!important;text-decoration:none;font-size:12px;font-weight:950;box-shadow:0 10px 28px rgba(77,62,13,.20);transition:.16s;pointer-events:auto!important}.support-float-btn:hover{transform:translateY(-2px);background:linear-gradient(135deg,#fff4b8,#ffdf62)}@media(max-width:700px){.support-float-btn{left:12px;bottom:12px;padding:9px 12px;font-size:11px}}`;
    document.head.appendChild(style);
    const a=document.createElement('a');a.className='support-float-btn';a.href='support.html';a.setAttribute('aria-label','구독료 후원');a.innerHTML='<span aria-hidden="true">💛</span><span>구독료 후원</span>';document.body.appendChild(a);
  }
  function findSection(title){return[...document.querySelectorAll('.section')].find(s=>s.querySelector('.section-title h2')?.textContent.trim()===title)}
  function updateSectionCount(section){const grid=section?.querySelector('.grid'),count=section?.querySelector('.section-count');if(grid&&count)count.textContent=grid.querySelectorAll('a.tool').length+'개 도구'}
  function addMenu({sectionTitle,href,cls='doc',icon,title,desc}){
    if(document.querySelector(`a.tool[href="${href}"]`))return;
    const section=findSection(sectionTitle),grid=section?.querySelector('.grid');if(!grid)return;
    const a=document.createElement('a');a.className='tool '+cls;a.href=href;a.innerHTML=`<div class="tool-top"><div class="tool-icon">${icon}</div><div class="arrow">→</div></div><h3>${title}</h3><p>${desc}</p>`;grid.appendChild(a);updateSectionCount(section);
  }
  function renameStaticMenus(){
    const parental=document.querySelector('a.tool[href="parental-leave-calculator.html"] h3');
    if(parental)parental.textContent='2025년 이후 공무원 육아휴직수당 계산기';
  }
  function reorderParentalMenus(){
    const section=findSection('급여·수당'),grid=section?.querySelector('.grid');if(!grid)return;
    const marker=grid.querySelector('a.tool[href="family1.html"]');
    ['parental2022.html','parental2024.html','parental-leave-calculator.html','parental.html'].forEach(href=>{
      const a=grid.querySelector(`a.tool[href="${href}"]`);if(!a)return;
      if(marker)grid.insertBefore(a,marker);else grid.appendChild(a);
    });
    updateSectionCount(section);
  }
  function addToolSearch(){
    if(document.getElementById('toolSearchBtn'))return;
    const quick=document.querySelector('.quick'),state=document.getElementById('memberState');if(!quick||!state)return;
    const style=document.createElement('style');style.textContent=`.quick-actions{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap}.tool-search-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border:1px solid #c7dbe5;border-radius:11px;background:#0e5d7f;color:#fff;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 5px 14px rgba(14,93,127,.14);transition:.16s}.tool-search-btn:hover{transform:translateY(-1px);background:#0b4e6b}.tool-search-modal{position:fixed;inset:0;z-index:100000;display:none;place-items:start center;padding:90px 18px 30px;background:rgba(7,31,47,.50);backdrop-filter:blur(4px)}.tool-search-modal.show{display:grid}.tool-search-box{width:min(680px,100%);max-height:min(720px,calc(100vh - 120px));display:flex;flex-direction:column;overflow:hidden;border:1px solid #d5e2e8;border-radius:21px;background:#fff;box-shadow:0 28px 80px rgba(0,0,0,.26)}.tool-search-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid #e4edf1}.tool-search-head h3{margin:0;font-size:18px}.tool-search-close{border:0;border-radius:9px;padding:8px 10px;background:#edf3f6;color:#405b6a;font-weight:900;cursor:pointer}.tool-search-input-wrap{padding:15px 20px;border-bottom:1px solid #edf2f4}.tool-search-input{width:100%;height:46px;padding:0 14px;border:1px solid #cbdce4;border-radius:12px;background:#fff;color:#173042;font:inherit;font-size:14px;outline:none}.tool-search-input:focus{border-color:#0c9488;box-shadow:0 0 0 3px rgba(12,148,136,.12)}.tool-search-count{padding:10px 20px;color:#6d818e;font-size:11px;font-weight:850;background:#f8fbfc;border-bottom:1px solid #edf2f4}.tool-search-results{overflow:auto;padding:8px}.tool-search-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 14px;border:0;border-bottom:1px solid #edf2f4;background:#fff;text-align:left;cursor:pointer}.tool-search-item:hover{background:#f4fafb}.tool-search-item strong{display:block;color:#214c64;font-size:13px}.tool-search-item span{display:block;margin-top:4px;color:#718591;font-size:11px;line-height:1.45}.tool-search-arrow{flex:none;color:#0b7e76;font-size:18px;font-weight:900}.tool-search-empty{padding:34px 18px;text-align:center;color:#718591;font-size:13px}@media(max-width:700px){.quick{align-items:flex-start}.quick-actions{width:100%;margin-left:0;justify-content:space-between}.tool-search-btn{padding:8px 11px;font-size:11px}.tool-search-modal{padding:68px 12px 20px}.tool-search-box{max-height:calc(100vh - 88px)}}`;document.head.appendChild(style);
    const actions=document.createElement('div');actions.className='quick-actions';state.parentNode.insertBefore(actions,state);actions.appendChild(state);const btn=document.createElement('button');btn.id='toolSearchBtn';btn.type='button';btn.className='tool-search-btn';btn.innerHTML='<span aria-hidden="true">🔎</span><span>업무도구검색</span>';actions.appendChild(btn);
    const modal=document.createElement('div');modal.className='tool-search-modal';modal.id='toolSearchModal';modal.innerHTML='<section class="tool-search-box" role="dialog" aria-modal="true" aria-labelledby="toolSearchTitle"><div class="tool-search-head"><h3 id="toolSearchTitle">업무도구검색</h3><button class="tool-search-close" id="toolSearchClose" type="button">닫기</button></div><div class="tool-search-input-wrap"><input class="tool-search-input" id="toolSearchInput" type="search" placeholder="업무도구 이름을 입력하세요" autocomplete="off"></div><div class="tool-search-count" id="toolSearchCount"></div><div class="tool-search-results" id="toolSearchResults"></div></section>';document.body.appendChild(modal);
    const input=modal.querySelector('#toolSearchInput'),box=modal.querySelector('#toolSearchResults'),count=modal.querySelector('#toolSearchCount');
    const safe=s=>String(s||'').replace(/[&<>]/g,'');function getTools(){return[...document.querySelectorAll('a.tool[href]')].filter(a=>getComputedStyle(a).display!=='none')}function render(){const q=input.value.trim().toLowerCase(),rows=getTools().filter(a=>!q||((a.querySelector('h3')?.textContent||'')+' '+(a.querySelector('p')?.textContent||'')).toLowerCase().includes(q));count.textContent=q?`검색 결과 ${rows.length}개`:`전체 업무도구 ${rows.length}개`;box.innerHTML=rows.length?rows.map((a,i)=>`<button class="tool-search-item" type="button" data-i="${i}"><div><strong>${safe(a.querySelector('h3')?.textContent||'업무도구')}</strong><span>${safe(a.querySelector('p')?.textContent||'')}</span></div><div class="tool-search-arrow">→</div></button>`).join(''):'<div class="tool-search-empty">검색 조건에 맞는 업무도구가 없습니다.</div>';box.querySelectorAll('.tool-search-item').forEach(b=>b.addEventListener('click',()=>{const target=rows[Number(b.dataset.i)];modal.classList.remove('show');if(target)target.click()}))}function open(){modal.classList.add('show');input.value='';render();setTimeout(()=>input.focus(),30)}function close(){modal.classList.remove('show')}btn.addEventListener('click',open);modal.querySelector('#toolSearchClose').addEventListener('click',close);input.addEventListener('input',render);input.addEventListener('keydown',e=>{if(e.key==='Escape')close()});modal.addEventListener('click',e=>{if(e.target===modal)close()});
  }
  function addPublicStatsMenu(){
    if(document.querySelector('a.tool[href="public.html"]')||document.querySelector('a.tool[href="pay2027.html"]'))return;
    const main=document.querySelector('main.wrap');if(!main)return;
    const style=document.createElement('style');style.textContent=`.public-data-icon{background:linear-gradient(135deg,#e6faf7,#eaf1ff)!important;color:#087b74!important}.public-pay-icon{background:linear-gradient(135deg,#fff5df,#eaf4ff)!important;color:#9a6518!important}.public-menu-badge{position:absolute;right:14px;bottom:12px;padding:5px 9px;border:1px solid #bce6dc;border-radius:999px;background:#e8f8f3;color:#087c65;font-size:10px;font-weight:900}.public-data-card{--accent:#087d75;--accent-soft:#e8f8f4}.public-pay-card{--accent:#a36518;--accent-soft:#fff5e4}`;document.head.appendChild(style);
    const section=document.createElement('section');section.className='section';section.innerHTML='<div class="section-head"><div class="section-title"><div class="icon">▥</div><div><h2>공직 데이터</h2><p>공무원 보수·인력·채용·교육 통계와 예상 봉급표</p></div></div><div class="section-count">2개 페이지</div></div><div class="grid"><a class="tool people public-data-card" href="public.html"><div class="tool-top"><div class="tool-icon public-data-icon">↗</div><div class="arrow">→</div></div><h3>2008년 이후 공무원 관련 동향</h3><p>보수 인상률, 물가·최저임금, 공무원 인력, 5·7·9급 경쟁률, 교원 정원을 동적으로 비교합니다.</p><span class="public-menu-badge">공개</span></a><a class="tool pay public-pay-card" href="pay2027.html"><div class="tool-top"><div class="tool-icon public-pay-icon">₩</div><div class="arrow">→</div></div><h3>2027년 일반직 공무원 예상 봉급표</h3><p>2026년 공무원보수규정 별표 3을 기준으로 3.4~3.9% 예상 인상률을 적용해 계급·호봉별 봉급을 확인합니다.</p><span class="public-menu-badge">공개</span></a></div>';
    main.appendChild(section);
  }

  addSupportButton();
  renameStaticMenus();
  addMenu({sectionTitle:'급여·수당',href:'family1.html',cls:'pay',icon:'家',title:'공무원 가족수당 연혁 계산기',desc:'연도별 가족수당 단가와 가족별 개월수를 반영해 금액을 계산합니다.'});
  addMenu({sectionTitle:'급여·수당',href:'family2.html',cls:'pay',icon:'月',title:'가족수당 자녀 지급 만료월 계산기',desc:'자녀의 생년월일과 기준일을 기준으로 만나이·해당여부·지급만료월을 계산합니다.'});
  addMenu({sectionTitle:'급여·수당',href:'age.html',cls:'pay',icon:'年',title:'만나이 계산기',desc:'생년월일과 만나이 기준일을 입력해 기준일 현재의 만나이를 계산합니다.'});
  addMenu({sectionTitle:'급여·수당',href:'parental.html',cls:'leave',icon:'育',title:'2022년 2024년 2025년 통합 공무원 육아휴직수당 계산기',desc:'휴직 지급연월에 따라 2022·2024·2025년 이후 개정 기준을 자동 적용합니다.'});
  addMenu({sectionTitle:'급여·수당',href:'parental2022.html',cls:'leave',icon:'22',title:'2022년 공무원 육아휴직수당 월중 계산기',desc:'2022년 기준의 역월·월중 일할계산과 복직합산금을 계산합니다.'});
  addMenu({sectionTitle:'급여·수당',href:'parental2024.html',cls:'leave',icon:'24',title:'2024년 공무원 육아휴직수당 월중 계산기',desc:'2024년 기준의 역월·월중 일할계산과 복직합산금을 계산합니다.'});
  reorderParentalMenus();
  addMenu({sectionTitle:'공문서·업무지원',href:'school_budget.html',cls:'doc',icon:'₩',title:'학교 예산 현황 분석',desc:'학교회계 예산 업무를 빠르게 확인하고 처리하는 도구입니다.'});
  addMenu({sectionTitle:'공문서·업무지원',href:'organization.html',cls:'doc',icon:'組',title:'학교현장지원 강화를 위한 조직개편안',desc:'학교 현장 업무 경감을 위한 6급 인력 재배치와 54명 전문지원체계 제안입니다.'});
  addMenu({sectionTitle:'공문서·업무지원',href:'organization2.html',cls:'doc',icon:'組',title:'학교현장지원 강화를 위한 조직개편안(발표)',desc:'호봉정정 사례로 보는 인사·복무·보수 통합 전문지원팀 제안입니다.'});
  addMenu({sectionTitle:'공문서·업무지원',href:'reorganization-presentation.html',cls:'doc',icon:'▶',title:'학교현장지원 강화를 위한 조직개편(발표)',desc:'조직개편 연혁·본청 인력 추이·적정인력 판단과 T/F 핵심질문을 발표 화면으로 확인합니다.'});
  addMenu({sectionTitle:'복무·인사',href:'resource.html',cls:'people',icon:'👥',title:'인사발령 자료 분석',desc:'학교·기관별, 지역별, 직렬·직군·과목별 전입·전출 명단을 집계합니다.'});
  addMenu({sectionTitle:'복무·인사',href:'vctn.html',cls:'people',icon:'休',title:'연차개수 계산기',desc:'입사일·퇴직일을 기준으로 연차 유급휴가 발생 일수를 계산합니다.'});
  addToolSearch();

  const SUPABASE_URL='https://eqpiuszmgrwituwprgdc.supabase.co';
  const SUPABASE_KEY='sb_publishable_SN2iYw3cBqstKGIS3NdoTw_5ghetwqQ';
  if(!window.supabase){setTimeout(addPublicStatsMenu,0);return}
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY),tools=[...document.querySelectorAll('a.tool[href]')];
  const style=document.createElement('style');style.textContent=`.permission-badge{position:absolute;right:14px;bottom:12px;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:-.02em;border:1px solid transparent;z-index:3}.permission-ok{background:#e8f7ef;color:#167346;border-color:#c9ead8}.permission-no{background:#fff0f1;color:#b33f4b;border-color:#f2cfd3}.permission-wait{background:#fff7e6;color:#9a6811;border-color:#f0dfb8}.permission-login{background:#eef3f6;color:#5b7280;border-color:#dae5eb}.tool.permission-denied{opacity:.58;filter:saturate(.72)}.tool.permission-denied .arrow{background:#fff0f1;color:#b33f4b}`;document.head.appendChild(style);
  function pageName(a){try{const u=new URL(a.href,location.href),marker='/VibeCoding/',i=u.pathname.indexOf(marker);return decodeURIComponent((i>=0?u.pathname.slice(i+marker.length):u.pathname.replace(/^\/+/,''))||'')}catch{return''}}
  function setBadge(a,text,kind){let b=a.querySelector('.permission-badge');if(!b){b=document.createElement('span');b.className='permission-badge';a.appendChild(b)}b.textContent=text;b.className='permission-badge '+kind}
  function deny(a,msg='이 메뉴는 현재 사용 권한이 없습니다.'){a.classList.add('permission-denied');a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();alert(msg)},true)}
  if(tools.length)(async()=>{
    const {data:{session}}=await sb.auth.getSession();
    if(!session){tools.forEach(a=>setBadge(a,'로그인 후 확인','permission-login'));return}
    const {data:member}=await sb.from('vibecoding_members').select('role,status').eq('user_id',session.user.id).maybeSingle();
    if(!member){tools.forEach(a=>{setBadge(a,'회원정보 없음','permission-no');deny(a,'회원 정보를 확인할 수 없습니다.')});return}
    if(member.status!=='approved'){const label=member.status==='pending'?'승인 대기':'사용 차단',cls=member.status==='pending'?'permission-wait':'permission-no';tools.forEach(a=>{setBadge(a,label,cls);deny(a,member.status==='pending'?'관리자 승인 후 이용할 수 있습니다.':'현재 차단된 회원입니다.')});return}
    const {data:usage,error:usageError}=await sb.from('vibecoding_menu_usage').select('page_name,use_count').eq('user_id',session.user.id),usageMap=new Map((usage||[]).map(u=>[u.page_name,Number(u.use_count)||0]));if(usageError)console.error('사용량 조회 오류:',usageError);
    if(member.role==='admin'){tools.forEach(a=>{const page=pageName(a),count=usageMap.get(page)||0;setBadge(a,`사용 가능 · ${count}회`,'permission-ok')});return}
    const {data:perms,error}=await sb.from('vibecoding_member_permissions').select('page_name,allowed').eq('user_id',session.user.id);if(error){console.error(error);tools.forEach(a=>setBadge(a,'권한 확인 오류','permission-wait'));return}
    const map=new Map((perms||[]).map(p=>[p.page_name,p.allowed]));tools.forEach(a=>{const page=pageName(a),count=usageMap.get(page)||0,allowed=!map.has(page)||map.get(page)!==false;if(allowed)setBadge(a,`사용 가능 · ${count}회`,'permission-ok');else{setBadge(a,`사용 불가 · ${count}회`,'permission-no');deny(a)}})
  })().catch(console.error);
  setTimeout(addPublicStatsMenu,0);
})();