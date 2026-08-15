(()=>{
  function addSupportButton(){
    if(document.querySelector('.support-float-btn'))return;
    const style=document.createElement('style');
    style.textContent=`
      .support-float-btn{position:fixed;left:22px;bottom:22px;z-index:99998;display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1px solid #f0d98b;border-radius:999px;background:linear-gradient(135deg,#fff9d8,#ffe98b);color:#654d00!important;text-decoration:none;font-size:12px;font-weight:950;box-shadow:0 10px 28px rgba(77,62,13,.20);transition:.16s;pointer-events:auto!important}
      .support-float-btn:hover{transform:translateY(-2px);background:linear-gradient(135deg,#fff4b8,#ffdf62)}
      @media(max-width:700px){.support-float-btn{left:12px;bottom:12px;padding:9px 12px;font-size:11px}}
    `;
    document.head.appendChild(style);
    const a=document.createElement('a');
    a.className='support-float-btn';
    a.href='support.html';
    a.setAttribute('aria-label','구독료 후원');
    a.innerHTML='<span aria-hidden="true">💛</span><span>구독료 후원</span>';
    document.body.appendChild(a);
  }

  function findSupportSection(){
    const sections=[...document.querySelectorAll('.section')];
    return sections.find(s=>s.querySelector('.section-title h2')?.textContent.trim()==='공문서·업무지원');
  }

  function updateSectionCount(section){
    const grid=section?.querySelector('.grid');
    const count=section?.querySelector('.section-count');
    if(grid&&count)count.textContent=grid.querySelectorAll('a.tool').length+'개 도구';
  }

  function addNoteMenu(){
    if(document.querySelector('a.tool[href="note.html"]'))return;
    const section=findSupportSection();
    if(!section)return;
    const grid=section.querySelector('.grid');
    if(!grid)return;
    const a=document.createElement('a');
    a.className='tool doc';
    a.href='note.html';
    a.innerHTML='<div class="tool-top"><div class="tool-icon">📒</div><div class="arrow">→</div></div><h3>오춘기노트</h3><p>교육행정 실무 노트를 분류·검색해서 빠르게 확인합니다.</p>';
    grid.appendChild(a);
    updateSectionCount(section);
  }

  function addSchoolBudgetMenu(){
    if(document.querySelector('a.tool[href="school_budget.html"]'))return;
    const section=findSupportSection();
    if(!section)return;
    const grid=section.querySelector('.grid');
    if(!grid)return;
    const a=document.createElement('a');
    a.className='tool doc';
    a.href='school_budget.html';
    a.innerHTML='<div class="tool-top"><div class="tool-icon">₩</div><div class="arrow">→</div></div><h3>학교회계 예산 업무 도구</h3><p>학교회계 예산 업무를 빠르게 확인하고 처리하는 도구입니다.</p>';
    grid.appendChild(a);
    updateSectionCount(section);
  }

  addSupportButton();
  addNoteMenu();
  addSchoolBudgetMenu();

  const SUPABASE_URL='https://eqpiuszmgrwituwprgdc.supabase.co';
  const SUPABASE_KEY='sb_publishable_SN2iYw3cBqstKGIS3NdoTw_5ghetwqQ';
  if(!window.supabase)return;
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const tools=[...document.querySelectorAll('a.tool[href]')];
  if(!tools.length)return;

  const style=document.createElement('style');
  style.textContent=`
    .permission-badge{position:absolute;right:14px;bottom:12px;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:-.02em;border:1px solid transparent;z-index:3}
    .permission-ok{background:#e8f7ef;color:#167346;border-color:#c9ead8}
    .permission-no{background:#fff0f1;color:#b33f4b;border-color:#f2cfd3}
    .permission-wait{background:#fff7e6;color:#9a6811;border-color:#f0dfb8}
    .permission-login{background:#eef3f6;color:#5b7280;border-color:#dae5eb}
    .tool.permission-denied{opacity:.58;filter:saturate(.72)}
    .tool.permission-denied .arrow{background:#fff0f1;color:#b33f4b}
  `;
  document.head.appendChild(style);

  function pageName(a){
    try{
      const u=new URL(a.href,location.href);
      const marker='/VibeCoding/';
      const i=u.pathname.indexOf(marker);
      return decodeURIComponent((i>=0?u.pathname.slice(i+marker.length):u.pathname.replace(/^\/+/,''))||'');
    }catch{return ''}
  }
  function setBadge(a,text,kind){
    let b=a.querySelector('.permission-badge');
    if(!b){b=document.createElement('span');b.className='permission-badge';a.appendChild(b)}
    b.textContent=text;b.className='permission-badge '+kind;
  }
  function deny(a,msg='이 메뉴는 현재 사용 권한이 없습니다.'){
    a.classList.add('permission-denied');
    a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();alert(msg)},true);
  }

  (async()=>{
    const {data:{session}}=await sb.auth.getSession();
    if(!session){tools.forEach(a=>setBadge(a,'로그인 후 확인','permission-login'));return;}
    const {data:member}=await sb.from('vibecoding_members').select('role,status').eq('user_id',session.user.id).maybeSingle();
    if(!member){tools.forEach(a=>{setBadge(a,'회원정보 없음','permission-no');deny(a,'회원 정보를 확인할 수 없습니다.')});return;}
    if(member.status!=='approved'){
      const label=member.status==='pending'?'승인 대기':'사용 차단';
      const cls=member.status==='pending'?'permission-wait':'permission-no';
      tools.forEach(a=>{setBadge(a,label,cls);deny(a,member.status==='pending'?'관리자 승인 후 이용할 수 있습니다.':'현재 차단된 회원입니다.')});return;
    }

    const {data:usage,error:usageError}=await sb.from('vibecoding_menu_usage').select('page_name,use_count').eq('user_id',session.user.id);
    const usageMap=new Map((usage||[]).map(u=>[u.page_name,Number(u.use_count)||0]));
    if(usageError)console.error('사용량 조회 오류:',usageError);

    if(member.role==='admin'){
      tools.forEach(a=>{const page=pageName(a),count=usageMap.get(page)||0;setBadge(a,`사용 가능 · ${count}회`,'permission-ok')});
      return;
    }
    const {data:perms,error}=await sb.from('vibecoding_member_permissions').select('page_name,allowed').eq('user_id',session.user.id);
    if(error){console.error(error);tools.forEach(a=>setBadge(a,'권한 확인 오류','permission-wait'));return;}
    const map=new Map((perms||[]).map(p=>[p.page_name,p.allowed]));
    tools.forEach(a=>{
      const page=pageName(a);
      const count=usageMap.get(page)||0;
      const allowed=!map.has(page)||map.get(page)!==false;
      if(allowed)setBadge(a,`사용 가능 · ${count}회`,'permission-ok');
      else{setBadge(a,`사용 불가 · ${count}회`,'permission-no');deny(a);}
    });
  })().catch(console.error);
})();