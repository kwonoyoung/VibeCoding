(()=>{
  const IS_ADMIN=!!window.__PERSON_IS_ADMIN__;
  const DB='person-directory-cache';
  const STORE='directory';
  const KEY='latest';
  const CANONICAL_KEY='person-directory-canonical-v1';
  let rows=[];

  const clean=v=>String(v??'').trim();
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const normalizeRows=list=>Array.isArray(list)?list.map(r=>({institution:clean(r.institution),person:clean(r.person),contact