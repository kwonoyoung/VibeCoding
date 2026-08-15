(()=>{
  const SUPABASE_URL='https://eqpiuszmgrwituwprgdc.supabase.co';
  const SUPABASE_KEY='sb_publishable_SN2iYw3cBqstKGIS3NdoTw_5ghetwqQ';
  if(!window.supabase)return;
  const sbp=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  const style=document.createElement('style');
  style.textContent=`
    .perm-card{margin-top:20px;background:#fff;border:1px solid #d8e4ea;border-radius:18px;box-shadow:0 8px 24px rgba(7,54,82,.07);overflow:hidden}
    .perm-head{padding:18px 20px;border-bottom:1px solid #e5edf1;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
    .perm-head h2{margin:0;font-size:18px}.perm-head p{margin:5px 0 0;color:#687d8b;font-size:12px}
    .perm-search-area{display:flex;flex-direction:column;gap:7px;min-width:min(100%,470px)}
    .perm-search-line{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.perm-search-line input{flex:1;min-width:190px;padding:9px 11px;border:1px solid #cadbe4;border-radius:9px;background:#fff;font:inherit;font-size:13px}.perm-search-btn{background:#0e5d7f;color:#fff}.perm-clear-btn{background:#edf3f6;color:#345366}.perm-result{min-height:16px;color:#667d8b;font-size:11px;font-weight:800}
    .perm-controls{padding:14px 20px;border-bottom:1px solid #e5edf1;display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#fbfdfe}.perm-controls select{padding:9px 11px;border:1px solid #cadbe4;border-radius:9px;background:#fff;min-width:min(100%,390px);max-width:100%}
    .perm-btn{border:0;border-radius:9px;padding:9px 12px;font-weight:850;cursor:pointer}.all-on{background:#e5f6f2;color:#087b64}.all-off{background:#fdeced;color:#b63f49}
    .usage-summary{padding:14px 20px;background:#f8fbfc;border-bottom:1px solid #e5edf1;display:flex;gap:10px;flex-wrap:wrap;align-items:center}.usage-chip{padding:7px 10px;border-radius:999px;background:#eef5f7;color:#385a69;font-size:12px;font-weight:850}.usage-chip strong{color:#0b6f67}.selected-member{background:#e9f5fb;color:#155775}
    .perm-table{overflow:auto}.perm-table table{width:100%;border-collapse:collapse;min-width:900px}.perm-table th,.perm-table td{padding:11px 13px;border-bottom:1px solid #e8eef2;font-size:12px}.perm-table th{background:#f7fafb;color:#526c7b;text-align:left}.perm-toggle{width:18px;height:18px;accent-color:#0c9488}.perm-status{font-weight:900}.perm-status.on{color:#087b64}.perm-status.off{color:#b63f49}.usage-count{font-weight:900;color:#0e5d7f}.perm-msg{padding:18px;text-align:center;color:#667d8b}
    @media(max-width:700px){.perm-head{display:block}.perm-search-area{margin-top:14px;width:100%;min-width:0}.perm-controls{align-items:stretch}.perm-controls select{width:100%;min-width:0}.perm-controls .perm-btn{flex:1}}
  `;document.head.appendChild(style);

  const card=document.createElement('section');card.className='perm-card';
  card.innerHTML=`<div class="perm-head"><div><h2>회원별 메뉴 사용 권한 · 사용량</h2><p>회원 성명으로 검색한 뒤 해당 회원의 메뉴 허용 여부와 실제 사용횟수, 최초·최근 사용일시를 확인합니다.</p></div><div class="perm-search-area"><div class="perm-search-line"><input id="permMemberSearch" type="search" placeholder="회원 성명 입력 (예: 홍길동)" autocomplete="off"><button class="perm-btn perm-search-btn" id="permSearchBtn" type="button">성명 조회</button><button class="perm-btn perm-clear-btn" id="permClearBtn" type="button">초기화</button></div><div class="perm-result" id="permSearchResult">성명을 입력하고 조회해 주세요.</div></div></div><div class="perm-controls"><select id="permMember"><option value="">회원을 선택하세요</option></select><button class="perm-btn all-on" id="permAllOn">전체 허용</button><button class="perm-btn all-off" id="permAllOff">전체 차단</button></div><div class="usage-summary" id="usageSummary"><span class="usage-chip">회원을 선택하면 사용량이 표시됩니다.</span></div><div class="perm-table"><table><thead><tr><th>메뉴명</th><th>페이지</th><th>사용 여부</th><th>상태</th><th>사용횟수</th><th>최초 사용</th><th>최근 사용</th></tr></thead><tbody id="permRows"><tr><td colspan="7" class="perm-msg">회원 성명을 검색하거나 회원을 선택하면 메뉴 권한과 사용량이 표시됩니다.</td></tr></tbody></table></div>`;
  const main=document.querySelector('main.wrap')||document.body;main.appendChild(card);

  const memberSel=document.getElementById('permMember'),memberSearch=document.getElementById('permMemberSearch'),searchResult=document.getElementById('permSearchResult'),permRows=document.getElementById('permRows'),usageSummary=document.getElementById('usageSummary');
  let menus=[],meUser=null,members=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt=d=>d?new Date(d).toLocaleString('ko-KR'):'-';
  const statusLabel=s=>s==='approved'?'승인':s==='pending'?'대기':s==='blocked'?'차단':s||'-';
  function memberText(m){return `${m.display_name||'-'} · ${m.institution||'-'} · ${m.email||'-'} · ${statusLabel(m.status)}`}
  async function loadMenus(){
    const html=await fetch('index.html',{cache:'no-store'}).then(r=>r.text());
    const doc=new DOMParser().parseFromString(html,'text/html');
    menus=[...doc.querySelectorAll('a.tool[href]')].map(a=>({page:new URL(a.getAttribute('href'),location.href).pathname.split('/VibeCoding/').pop(),name:(a.querySelector('h3')?.textContent||a.textContent||'').trim()})).filter(x=>x.page&&x.page.endsWith('.html'));
    if(!menus.some(m=>m.page==='note.html'))menus.push({page:'note.html',name:'오춘기노트'});
    const seen=new Set();menus=menus.filter(m=>!seen.has(m.page)&&seen.add(m.page));
  }
  async function loadMembers(){
    const {data,error}=await sbp.from('vibecoding_members').select('user_id,email,display_name,institution,role,status').order('display_name',{ascending:true});
    if(error)throw error;members=(data||[]).filter(m=>m.role!=='admin');fillMemberOptions(members);
  }
  function fillMemberOptions(list){
    const current=memberSel.value;
    memberSel.innerHTML='<option value="">회원을 선택하세요</option>'+list.map(m=>`<option value="${esc(m.user_id)}">${esc(memberText(m))}</option>`).join('');
    if(list.some(m=>m.user_id===current))memberSel.value=current;
  }
  function searchByName(){
    const q=memberSearch.value.trim().toLowerCase();
    if(!q){fillMemberOptions(members);searchResult.textContent='성명을 입력하고 조회해 주세요.';memberSel.value='';render();return;}
    const found=members.filter(m=>String(m.display_name||'').trim().toLowerCase().includes(q));fillMemberOptions(found);
    if(found.length===0){searchResult.textContent='검색된 회원이 없습니다.';memberSel.value='';render();return;}
    if(found.length===1){memberSel.value=found[0].user_id;searchResult.textContent=`${found[0].display_name||'-'} 회원을 찾았습니다.`;render();return;}
    const exact=found.filter(m=>String(m.display_name||'').trim().toLowerCase()===q);
    if(exact.length===1){memberSel.value=exact[0].user_id;searchResult.textContent=`${exact[0].display_name||'-'} 회원을 찾았습니다.`;render();return;}
    memberSel.value='';searchResult.textContent=`${found.length}명이 검색되었습니다. 아래 목록에서 회원을 선택해 주세요.`;render();
  }
  async function render(){
    const uid=memberSel.value;if(!uid){permRows.innerHTML='<tr><td colspan="7" class="perm-msg">회원 성명을 검색하거나 회원을 선택하면 메뉴 권한과 사용량이 표시됩니다.</td></tr>';usageSummary.innerHTML='<span class="usage-chip">회원을 선택하면 사용량이 표시됩니다.</span>';return;}
    const selected=members.find(m=>m.user_id===uid);
    const [{data:perms,error:permError},{data:usage,error:usageError}]=await Promise.all([
      sbp.from('vibecoding_member_permissions').select('page_name,allowed').eq('user_id',uid),
      sbp.from('vibecoding_menu_usage').select('page_name,use_count,first_used_at,last_used_at').eq('user_id',uid)
    ]);
    if(permError||usageError){const msg=permError?.message||usageError?.message||'조회 오류';permRows.innerHTML=`<tr><td colspan="7" class="perm-msg">${esc(msg)}</td></tr>`;return;}
    const pmap=new Map((perms||[]).map(p=>[p.page_name,p.allowed]));
    const umap=new Map((usage||[]).map(u=>[u.page_name,u]));
    const total=(usage||[]).reduce((s,u)=>s+(Number(u.use_count)||0),0);
    const last=(usage||[]).map(u=>u.last_used_at).filter(Boolean).sort().pop()||null;
    const usedMenus=(usage||[]).filter(u=>(Number(u.use_count)||0)>0).length;
    usageSummary.innerHTML=`${selected?`<span class="usage-chip selected-member">조회 회원 <strong>${esc(selected.display_name||'-')}</strong> · ${esc(selected.institution||'-')}</span>`:''}<span class="usage-chip">총 사용횟수 <strong>${total.toLocaleString()}회</strong></span><span class="usage-chip">사용한 메뉴 <strong>${usedMenus}개</strong></span><span class="usage-chip">최근 사용 <strong>${esc(fmt(last))}</strong></span>`;
    permRows.innerHTML=menus.map(m=>{const allowed=!pmap.has(m.page)||pmap.get(m.page)!==false;const u=umap.get(m.page)||{};const count=Number(u.use_count)||0;return `<tr><td>${esc(m.name)}</td><td>${esc(m.page)}</td><td><input class="perm-toggle" type="checkbox" data-page="${esc(m.page)}" ${allowed?'checked':''}></td><td><span class="perm-status ${allowed?'on':'off'}">${allowed?'사용 가능':'사용 불가'}</span></td><td><span class="usage-count">${count.toLocaleString()}회</span></td><td>${esc(fmt(u.first_used_at))}</td><td>${esc(fmt(u.last_used_at))}</td></tr>`}).join('');
    permRows.querySelectorAll('.perm-toggle').forEach(ch=>ch.addEventListener('change',()=>saveOne(ch)));
  }
  async function saveOne(ch){
    const uid=memberSel.value;if(!uid)return;ch.disabled=true;const allowed=ch.checked;const {error}=await sbp.from('vibecoding_member_permissions').upsert({user_id:uid,page_name:ch.dataset.page,allowed,updated_at:new Date().toISOString(),updated_by:meUser.id},{onConflict:'user_id,page_name'});ch.disabled=false;if(error){alert(error.message);ch.checked=!allowed;return;}const s=ch.closest('tr').querySelector('.perm-status');s.textContent=allowed?'사용 가능':'사용 불가';s.className='perm-status '+(allowed?'on':'off');
  }
  async function setAll(allowed){
    const uid=memberSel.value;if(!uid)return alert('회원을 먼저 검색하거나 선택해 주세요.');
    const payload=menus.map(m=>({user_id:uid,page_name:m.page,allowed,updated_at:new Date().toISOString(),updated_by:meUser.id}));
    const {error}=await sbp.from('vibecoding_member_permissions').upsert(payload,{onConflict:'user_id,page_name'});if(error)return alert(error.message);render();
  }
  memberSel.addEventListener('change',()=>{const m=members.find(x=>x.user_id===memberSel.value);if(m)searchResult.textContent=`${m.display_name||'-'} 회원을 조회합니다.`;render()});
  memberSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchByName()}});
  document.getElementById('permSearchBtn').onclick=searchByName;
  document.getElementById('permClearBtn').onclick=()=>{memberSearch.value='';fillMemberOptions(members);memberSel.value='';searchResult.textContent='성명을 입력하고 조회해 주세요.';render()};
  document.getElementById('permAllOn').onclick=()=>setAll(true);document.getElementById('permAllOff').onclick=()=>setAll(false);
  (async()=>{const {data:{user}}=await sbp.auth.getUser();meUser=user;if(!user)return;await loadMenus();await loadMembers();})().catch(e=>{console.error(e);permRows.innerHTML=`<tr><td colspan="7" class="perm-msg">권한·사용량 관리 화면을 불러오지 못했습니다: ${esc(e.message)}</td></tr>`});
})();