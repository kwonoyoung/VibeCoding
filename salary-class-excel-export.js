(()=>{
  'use strict';

  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const text=(el)=>String(el?.textContent||'').trim();
  const value=(el)=>String(el?.value||'').trim();
  const selectedText=(el)=>el?.options?.[el.selectedIndex]?.text?.trim()||'';
  const first=(selectors,root=document)=>{
    for(const s of selectors){const el=$(s,root);if(el)return el}
    return null;
  };

  function injectBasicFields(){
    if($('#salaryOrg')||$('#salaryName'))return;
    const formGrid=$('.form-grid');
    if(!formGrid)return;
    const org=document.createElement('div');
    org.className='field salary-excel-field';
    org.innerHTML='<label for="salaryOrg">소속</label><input id="salaryOrg" type="text" placeholder="예: ○○중학교" autocomplete="organization"><div class="help hint">엑셀 호봉획정표 기본정보에만 사용됩니다.</div>';
    const name=document.createElement('div');
    name.className='field salary-excel-field';
    name.innerHTML='<label for="salaryName">성명</label><input id="salaryName" type="text" placeholder="예: 홍길동" autocomplete="name"><div class="help hint">입력값은 브라우저에서 엑셀 파일 생성에만 사용됩니다.</div>';
    formGrid.insertBefore(name,formGrid.firstChild);
    formGrid.insertBefore(org,formGrid.firstChild);
  }

  function injectExcelButton(){
    if($('#downloadSalaryExcel'))return;
    const actions=first(['.btnline','.actions']);
    if(!actions)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='downloadSalaryExcel';
    btn.className='btn secondary';
    btn.innerHTML='⬇ 호봉획정표 엑셀 다운로드';
    btn.addEventListener('click',downloadExcel);
    const reset=first(['#reset'],actions);
    if(reset)actions.insertBefore(btn,reset); else actions.appendChild(btn);
  }

  async function ensureXLSX(){
    if(window.XLSX)return window.XLSX;
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload=resolve;
      script.onerror=()=>reject(new Error('엑셀 생성 라이브러리를 불러오지 못했습니다.'));
      document.head.appendChild(script);
    });
    return window.XLSX;
  }

  function getBasicInfo(){
    const qual=first(['#qualification','#qual']);
    const edu=first(['#education','#edu']);
    const special=$('#specialAdd');
    const calcDate=$('#calcDate');
    const eduAdjust=text($('#eduAdjust'));
    const specialAdjust=text($('#specialAdjust'));
    return {
      org:value($('#salaryOrg')),
      name:value($('#salaryName')),
      qualification:selectedText(qual)||value(qual),
      education:[selectedText(edu)||value(edu),eduAdjust].filter(Boolean).join(' / '),
      special:special?.checked?`특수 가산 +1년${specialAdjust?` / ${specialAdjust}`:''}`:'없음',
      calcDate:value(calcDate)
    };
  }

  function getCareerRows(){
    const tbody=$('#careerBody');
    if(!tbody)return [];
    return $$('tr',tbody).map((tr,i)=>{
      const note=first(['.career-note','.note'],tr);
      const start=first(['.career-start','.start'],tr);
      const end=first(['.career-end','.end'],tr);
      const rate=first(['.career-rate','.rate'],tr);
      const rule=first(['.end-rule','.rule'],tr);
      const raw=first(['.raw-period','.raw'],tr);
      const converted=first(['.converted-period','.converted'],tr);
      const startValue=value(start), endValue=value(end);
      if(!startValue&&!endValue&&!value(note))return null;
      return {
        no:i+1,
        start:startValue,
        end:endValue,
        note:value(note),
        rate:value(rate)?`${value(rate)}%`:'',
        period:text(raw),
        converted:text(converted),
        remark:selectedText(rule)||value(rule)
      };
    }).filter(Boolean);
  }

  function getTotals(){
    const base=first(['#baseStep','#baseClass']);
    const final=first(['#finalStep','#finalClass']);
    let finalText=text(final);
    if(final && final.id==='finalClass' && finalText && !finalText.includes('호봉')) finalText += '호봉';
    return {
      careerTotal:text($('#careerTotal')),
      remainder:text($('#remainder')),
      base:text(base),
      final:finalText
    };
  }

  function safeName(s){
    return String(s||'').replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,' ').trim();
  }

  async function downloadExcel(){
    try{
      const calcBtn=$('#calculate');
      if(calcBtn)calcBtn.click();

      const XLSX=await ensureXLSX();
      const info=getBasicInfo();
      const careers=getCareerRows();
      const totals=getTotals();

      const rows=[];
      rows.push(['호 봉 획 정 표','','','','','','','']);
      rows.push([]);
      rows.push(['기본정보','','','','','','','']);
      rows.push(['소속',info.org,'성명',info.name,'호봉획정일',info.calcDate,'','']);
      rows.push(['자격',info.qualification,'학령',info.education,'가산',info.special,'','']);
      rows.push([]);
      rows.push(['경력 목록','','','','','','','']);
      rows.push(['연번','부터','까지','내용','환산율','기간','환산연수','비고']);
      if(careers.length){
        careers.forEach(r=>rows.push([r.no,r.start,r.end,r.note,r.rate,r.period,r.converted,r.remark]));
      }else{
        rows.push(['','','','','','','','입력된 경력 없음']);
      }
      rows.push([]);
      rows.push(['합계','','','','','','','']);
      rows.push(['환산 총 경력연수',totals.careerTotal,'잔여기간',totals.remainder,'기산호봉',totals.base,'사정호봉',totals.final]);
      rows.push([]);
      rows.push(['※ 본 파일은 기간제교원 호봉획정 계산기의 업무 검산 결과입니다. 최종 호봉은 최신 법령·지침 및 증빙자료를 확인하여 결정하시기 바랍니다.','','','','','','','']);

      const ws=XLSX.utils.aoa_to_sheet(rows);
      const lastCareerRow=careers.length ? 8+careers.length : 9;
      ws['!merges']=[
        XLSX.utils.decode_range('A1:H1'),
        XLSX.utils.decode_range('A3:H3'),
        XLSX.utils.decode_range('A7:H7'),
        XLSX.utils.decode_range(`A${lastCareerRow+2}:H${lastCareerRow+2}`),
        XLSX.utils.decode_range(`A${lastCareerRow+5}:H${lastCareerRow+5}`)
      ];
      ws['!cols']=[
        {wch:8},{wch:14},{wch:14},{wch:28},{wch:11},{wch:17},{wch:17},{wch:24}
      ];
      ws['!rows']=[{hpt:28},{hpt:8},{hpt:21},{hpt:20},{hpt:20},{hpt:8},{hpt:21},{hpt:22}];
      ws['!autofilter']={ref:`A8:H${lastCareerRow}`};

      for(let r=9;r<=lastCareerRow;r++){
        const no=ws[`A${r}`]; if(no){no.t='n';no.v=Number(no.v)||0}
      }

      const wb=XLSX.utils.book_new();
      wb.Props={
        Title:'기간제교원 호봉획정표',
        Subject:'기간제교원 호봉획정 검산 결과',
        Author:'VibeCoding',
        CreatedDate:new Date()
      };
      XLSX.utils.book_append_sheet(wb,ws,'호봉획정표');

      const fileBase=['호봉획정표',safeName(info.name),safeName(info.calcDate)].filter(Boolean).join('_');
      XLSX.writeFile(wb,`${fileBase||'호봉획정표'}.xlsx`,{compression:true});
    }catch(err){
      console.error(err);
      alert('엑셀 파일을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.\n'+(err?.message||''));
    }
  }

  function init(){
    injectBasicFields();
    injectExcelButton();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
