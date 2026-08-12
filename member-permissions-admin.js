(()=>{
  const SUPABASE_URL='https://eqpiuszmgrwituwprgdc.supabase.co';
  const SUPABASE_KEY='sb_publishable_SN2iYw3cBqstKGIS3NdoTw_5ghetwqQ';
  if(!window.supabase)return;
  const sbp=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  const style=document.createElement('style');
  style.textContent=`
    .perm-card{margin-top:20px;background:#fff;border:1px solid #d8e4ea;border-radius:18px;box-shadow:0 8px 24px rgba(7,54,82,.07);overflow:hidden}
    .perm-head{padding:18px 20px;border-bottom:1px solid #e5edf1;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
    .perm-head h2{margin:0;font-size:18px}.perm-head p{margin:5px 0 0;color:#687d8b;font-size:12px}
    .perm-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.perm-controls select{padding:9px 11px;border:1px solid #cadbe4;border-radius:9px;background:#fff;min-width:260px}
    .perm-btn{border:0;border-radius:9px;padding:9px 12px;font-weight:850;cursor:pointer}.all-on{background:#e5f6f2;color:#087b64}.all-off{background:#fdeced;color:#b63f49}
    .perm-table{overflow:auto}.perm-table table{width:100%;border-collapse:collapse;min-width:680px}.perm-table th,.perm-table td{padding:11px 13px;border-bottom:1px solid #e8eef2;font-size:12px}.perm-table th{background:#f7fafb;color:#526c7b;text-align:left}.perm-toggle{width:18px;height:18px;accent-color:#0c9488}.perm-status{font-weight:900}.perm-status.on{color:#087b64}.perm-status.off{color:#b63f49}.perm-msg{padding:18px;text-align:center;color:#667d8b}
  `;document.head.appendChild(style);

  const card=document.createElement('section');card.className='perm-card';
  card.innerHTML=`<div class="perm-head"><div><h2>회원별 메뉴 사용 권한</h2><p>회원이 사용할 수 있는 홈페이지 메뉴를 개별 설정합니다. 별도 설정이 없는 메뉴는 기본적으로 사용 가능입니다.</p></div><div class="perm-controls"><select id="permMember"><option value="">회원을 선택하세요</option></select><button class="perm-btn all-on" id="permAllOn">전체 허용</button><button class="perm-btn all-off" id="permAllOff">전체 차단</button></div></div><div class="perm-table"><table><thead><tr><th>메뉴명</th><th>페이지</th><th>사용 여부</th><th>상태</th></tr></thead><tbody id="permRows"><tr><td colspan="4" class="perm-msg">회원을 선택하면 메뉴 권한이 표시됩니다.</td></tr></tbody></table></div>`;
  const main=document.querySelector('main.wrap')||document.body;main.appendChild(card);

  const memberSel=document.getElementById('permMember'),permRows=document.getElementById('permRows');
  let menus=[],meUser=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  async function loadMenus(){
    const html=await fetch('index.html',{cache:'no-store'}).then(r=>r.text());
    const doc=new DOMParser().parseFromString(html,'text/html');
    menus=[...doc.querySelectorAll('a.tool[href]')].map(a=>({page:new URL(a.getAttribute('href'),location.href).pathname.split('/VibeCoding/').pop(),name:(a.querySelector('h3')?.textContent||a.textContent||'').trim()})).filter(x=>x.page&&x.page.endsWith('.html'));
  }
  async function loadMembers(){
    const {data,error}=await sbp.from('vibecoding_members').select('user_id,email,display_name,institution,role,status').order('display_name',{ascending:true});
    if(error)throw error;
    memberSel.innerHTML='<option value="">회원을 선택하세요</option>'+data.filter(m=>m.role!=='admin').map(m=>`<option value="${m.user_id}">${esc(m.display_name||'-')} · ${esc(m.institution||'-')} · ${esc(m.email)} · ${m.status==='approved'?'승인':m.status==='pending'?'대기':'차단'}</option>`).join('');
  }
  async function render(){
    const uid=memberSel.value;if(!uid){permRows.innerHTML='<tr><td colspan="4" class="perm-msg">회원을 선택하면 메뉴 권한이 표시됩니다.</td></tr>';return;}
    const {data,error}=await sbp.from('vibecoding_member_permissions').select('page_name,allowed').eq('user_id',uid);if(error){permRows.innerHTML=`<tr><td colspan="4" class="perm-msg">${esc(error.message)}</td></tr>`;return;}
    const map=new Map((data||[]).map(p=>[p.page_name,p.allowed]));
    permRows.innerHTML=menus.map((m,i)=>{const allowed=!map.has(m.page)||map.get(m.page)!==false;return `<tr><td>${esc(m.name)}</td><td>${esc(m.page)}</td><td><input class="perm-toggle" type="checkbox" data-page="${esc(m.page)}" ${allowed?'checked':''}></td><td><span class="perm-status ${allowed?'on':'off'}">${allowed?'사용 가능':'사용 불가'}</span></td></tr>`}).join('');
    permRows.querySelectorAll('.perm-toggle').forEach(ch=>ch.addEventListener('change',()=>saveOne(ch)));
  }
  async function saveOne(ch){
    const uid=memberSel.value;if(!uid)return;ch.disabled=true;const allowed=ch.checked;const {error}=await sbp.from('vibecoding_member_permissions').upsert({user_id:uid,page_name:ch.dataset.page,allowed,updated_at:new Date().toISOString(),updated_by:meUser.id},{onConflict:'user_id,page_name'});ch.disabled=false;if(error){alert(error.message);ch.checked=!allowed;return;}const s=ch.closest('tr').querySelector('.perm-status');s.textContent=allowed?'사용 가능':'사용 불가';s.className='perm-status '+(allowed?'on':'off');
  }
  async function setAll(allowed){
    const uid=memberSel.value;if(!uid)return alert('회원을 먼저 선택해 주세요.');
    const payload=menus.map(m=>({user_id:uid,page_name:m.page,allowed,updated_at:new Date().toISOString(),updated_by:meUser.id}));
    const {error}=await sbp.from('vibecoding_member_permissions').upsert(payload,{onConflict:'user_id,page_name'});if(error)return alert(error.message);render();
  }
  memberSel.addEventListener('change',render);document.getElementById('permAllOn').onclick=()=>setAll(true);document.getElementById('permAllOff').onclick=()=>setAll(false);
  (async()=>{const {data:{user}}=await sbp.auth.getUser();meUser=user;if(!user)return;await loadMenus();await loadMembers();})().catch(e=>{console.error(e);permRows.innerHTML=`<tr><td colspan="4" class="perm-msg">권한 관리 화면을 불러오지 못했습니다: ${esc(e.message)}</td></tr>`});
})();
