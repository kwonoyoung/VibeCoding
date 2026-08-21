(()=>{
  const IS_ADMIN=!!window.__PERSON_IS_ADMIN__;
  const DB='person-directory-cache';
  const STORE='directory';
  const KEY='latest';
  const CANONICAL_KEY='person-directory-canonical-v1';
  let rows=[];

  const clean=v=>String(v??'').trim();
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const normalizeRows=list=>Array.isArray(list)?list.map(r=>({
    institution:clean(r.institution),
    person:clean(r.person),
    contact:clean(r.contact),
    ssnMasked:clean(r.ssnMasked)
  })).filter(r=>r.institution||r.person||r.contact):[];

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB 미지원'));return;}
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('저장소 오류'));
    });
  }

  async function loadIndexed(){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const req=db.transaction(STORE,'readonly').objectStore(STORE).get(KEY);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
    } finally { db.close(); }
  }

  async function saveIndexed(payload){
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put(payload,KEY);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    } finally { db.close(); }
  }

  function loadCanonical(){
    try{
      const raw=localStorage.getItem(CANONICAL_KEY);
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      return parsed&&Array.isArray(parsed.rows)?parsed:null;
    }catch(e){console.error('canonical load error',e);return null;}
  }

  function saveCanonical(){
    const payload={rows:normalizeRows(rows),savedAt:new Date().toISOString(),version:4};
    localStorage.setItem(CANONICAL_KEY,JSON.stringify(payload));
    return payload;
  }

  function renderOutput(){
    const body=document.getElementById('resultBody');
    if(!body)return;
    const search=document.getElementById('searchInput');
    const term=clean(search?.value).toLowerCase();
    const filtered=term?rows.filter(r=>clean(r.institution).toLowerCase().includes(term)):rows.slice();
    const count=document.getElementById('resultCount');
    if(count)count.textContent='결과 '+filtered.length+'건';
    body.innerHTML=filtered.length
      ? filtered.map(r=>`<tr><td>${esc(r.institution)}</td><td>${esc(r.person)}</td><td>${esc(r.contact)}</td></tr>`).join('')
      : '<tr class="empty-row"><td colspan="3">검색 결과가 없습니다.</td></tr>';
  }

  function renderCrud(){
    if(!IS_ADMIN)return;
    const body=document.getElementById('personCrudBody');
    if(!body)return;
    body.innerHTML=rows.length
      ? rows.map((r,i)=>`<tr data-i="${i}"><td>${esc(r.institution)}</td><td>${esc(r.person)}</td><td>${esc(r.contact)}</td><td class="actions"><button type="button" class="crud-edit">수정</button><button type="button" class="crud-delete">삭제</button></td></tr>`).join('')
      : '<tr><td colspan="4" class="crud-empty">등록된 담당자 정보가 없습니다.</td></tr>';
  }

  function crudMsg(text,ok=true){
    const el=document.getElementById('personCrudMsg');
    if(!el)return;
    el.style.color=ok?'#187455':'#b43d46';
    el.textContent=text;
  }

  async function persistAll(message){
    const payload=saveCanonical();
    try{await saveIndexed({rows:payload.rows,fileName:'담당자 직접관리 명단',savedAt:payload.savedAt,version:4});}catch(e){console.error('indexed sync error',e);}
    rows=payload.rows;
    renderCrud();
    renderOutput();
    crudMsg(message,true);
  }

  function installCrudPanel(){
    if(!IS_ADMIN||document.getElementById('personCrudPanel'))return;
    const output=document.getElementById('resultTable')?.closest('section.card');
    if(!output)return;
    const panel=document.createElement('section');
    panel.id='personCrudPanel';
    panel.innerHTML=`<h2>담당자 명단 직접 관리</h2><p class="crud-help">등록·수정·삭제한 내용은 저장 후 새로고침해도 유지되며 출력 결과에 즉시 반영됩니다.</p><div class="crud-form"><label>기관명<input id="personCrudInstitution" type="text" placeholder="기관명"></label><label>담당자명<input id="personCrudPerson" type="text" placeholder="담당자명"></label><label>연락처<input id="personCrudContact" type="text" placeholder="연락처"></label><button id="personCrudAdd" type="button">등록</button></div><div class="crud-table-wrap"><table><thead><tr><th>기관명</th><th>담당자명</th><th>연락처</th><th>관리</th></tr></thead><tbody id="personCrudBody"></tbody></table></div><div id="personCrudMsg"></div>`;
    output.insertAdjacentElement('afterend',panel);

    document.getElementById('personCrudAdd').addEventListener('click',async()=>{
      const institution=clean(document.getElementById('personCrudInstitution').value);
      const person=clean(document.getElementById('personCrudPerson').value);
      const contact=clean(document.getElementById('personCrudContact').value);
      if(!institution||!person||!contact){crudMsg('기관명, 담당자명, 연락처를 모두 입력해 주세요.',false);return;}
      rows.push({institution,person,contact,ssnMasked:''});
      await persistAll('등록했습니다. 새로고침 후에도 유지됩니다.');
      document.getElementById('personCrudInstitution').value='';
      document.getElementById('personCrudPerson').value='';
      document.getElementById('personCrudContact').value='';
    });

    document.getElementById('personCrudBody').addEventListener('click',async e=>{
      const tr=e.target.closest('tr[data-i]');
      if(!tr)return;
      const i=Number(tr.dataset.i);
      if(e.target.classList.contains('crud-delete')){
        if(!confirm('이 담당자 정보를 삭제하시겠습니까?'))return;
        rows.splice(i,1);
        await persistAll('삭제했습니다. 새로고침 후에도 유지됩니다.');
      } else if(e.target.classList.contains('crud-edit')){
        const r=rows[i];
        tr.innerHTML=`<td><input class="e-inst" value="${esc(r.institution)}"></td><td><input class="e-person" value="${esc(r.person)}"></td><td><input class="e-contact" value="${esc(r.contact)}"></td><td class="actions"><button type="button" class="crud-save">저장</button><button type="button" class="crud-cancel">취소</button></td>`;
      } else if(e.target.classList.contains('crud-cancel')){
        renderCrud();
      } else if(e.target.classList.contains('crud-save')){
        const institution=clean(tr.querySelector('.e-inst')?.value);
        const person=clean(tr.querySelector('.e-person')?.value);
        const contact=clean(tr.querySelector('.e-contact')?.value);
        if(!institution||!person||!contact){crudMsg('기관명, 담당자명, 연락처를 모두 입력해 주세요.',false);return;}
        rows[i]={...rows[i],institution,person,contact};
        await persistAll('수정했습니다. 새로고침 후에도 유지됩니다.');
      }
    });
  }

  function wireSearch(){
    const old=document.getElementById('searchInput');
    if(old){
      const input=old.cloneNode(true);
      input.disabled=false;
      old.replaceWith(input);
      input.addEventListener('input',renderOutput);
    }
    const btn=document.getElementById('btnOutput');
    if(btn){
      const clone=btn.cloneNode(true);
      clone.disabled=false;
      btn.replaceWith(clone);
      clone.addEventListener('click',renderOutput);
    }
  }

  function applyMemberView(){
    if(IS_ADMIN)return;
    document.querySelectorAll('section.card').forEach(sec=>{if(!sec.querySelector('#resultTable'))sec.style.display='none';});
    document.getElementById('personCrudPanel')?.remove();
    const output=document.getElementById('resultTable')?.closest('section.card');
    if(output)output.style.display='block';
  }

  async function init(){
    let indexed=null;
    try{indexed=await loadIndexed();}catch(e){console.error('indexed load error',e);}
    const canonical=loadCanonical();
    if(canonical&&Array.isArray(canonical.rows)){
      rows=normalizeRows(canonical.rows);
      try{await saveIndexed({rows,fileName:'담당자 직접관리 명단',savedAt:canonical.savedAt||new Date().toISOString(),version:4});}catch(e){console.error('canonical sync error',e);}
    }else{
      rows=normalizeRows(indexed?.rows||[]);
      if(rows.length)saveCanonical();
    }
    installCrudPanel();
    wireSearch();
    applyMemberView();
    renderCrud();
    renderOutput();
    setTimeout(()=>{renderOutput();renderCrud();},700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();