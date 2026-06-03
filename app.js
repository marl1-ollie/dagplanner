
const YEAR=2026,MONTHS=[4,5,6];
const DAYS_NL=['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MONTHS_NL=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const CATS=[
  {key:'locatie',label:'Overleg op locatie',short:'Locatie',color:'#1C829E'},
  {key:'extern', label:'Overleg extern',    short:'Extern', color:'#EB6334'},
  {key:'online', label:'Online overleg',    short:'Online', color:'#008972'},
  {key:'admin',  label:'Administratieve taak',short:'Admin',color:'#d4a000'},
  {key:'telefoon',label:'Telefonisch contact',short:'Tel.', color:'#8B5CF6'},
  {key:'reistijd',label:'Reistijd',           short:'Reis', color:'#E07B39'},
  {key:'pauze',  label:'Pauze',               short:'Pauze',color:'#8fa8b8'},
];
const WL={1:'Schoonhoven (WZ)',2:'Schoonhoven (WZ)',3:'Utrecht - BiOND',4:'Schoonhoven (WZ)',5:'Schoonhoven (WZ, vm)'};
const SCHOOL_FREE = {
  '2026-05-25': {label:'Pinksterdag', color:'#e8f5e9', type:'feestdag'},
  '2026-07-13': {label:'Roostervrij', color:'#fff8e1', type:'roostervrij'},
  '2026-07-14': {label:'Roostervrij', color:'#fff8e1', type:'roostervrij'},
  '2026-07-15': {label:'Roostervrij', color:'#fff8e1', type:'roostervrij'},
  '2026-07-16': {label:'Roostervrij', color:'#fff8e1', type:'roostervrij'},
  '2026-07-20': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-21': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-22': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-23': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-24': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-25': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-26': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-27': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-28': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-29': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-30': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
  '2026-07-31': {label:'Zomervakantie', color:'#e3f2fd', type:'vakantie'},
};
const SAVED_LOCS=[
  {label:'Kapper - Dam 7, Schoonhoven',      val:'Dam 7, 2871 CS Schoonhoven',               fiets:true,  cat:'extern'},
  {label:'Thuis - Jan Lutmastraat 13',        val:'Jan Lutmastraat 13, Schoonhoven',           fiets:true,  cat:'extern'},
  {label:'BiOND - Mariaplaats Utrecht',       val:'Mariaplaats, Utrecht',                      fiets:false, cat:'extern'},
  {label:'The Hague Conf. Centre, Den Haag',  val:'Anna van Buerenplein 48, Den Haag',         fiets:false, cat:'extern'},
  {label:'Hondendagopvang Matties - Lopik',   val:'Lekdijk West 44, 3411 MX Lopik',            fiets:false, cat:'extern'},
  {label:'Werkkamer Marleen',                 val:'Werkkamer Marleen, CSG Willem de Zwijger',   fiets:null,  cat:'locatie'},
  {label:'Werkkamer Andre',                   val:'Werkkamer Andre, CSG Willem de Zwijger',     fiets:null,  cat:'locatie'},
  {label:'Vergaderruimte A66',                val:'Vergaderruimte A66, CSG Willem de Zwijger',  fiets:null,  cat:'locatie'},
  {label:'CSG Willem de Zwijger (algemeen)',  val:'CSG Willem de Zwijger, Schoonhoven',         fiets:true,  cat:'locatie'},
];
const SYNC_URL='https://script.google.com/macros/s/AKfycbyGn6SLIl5HSlIPEbXLz9nUwSdYRhfeDlkrLF4qH9h1LxnocBy05RQ2gd0u-2bCipPe/exec';
let curDate=null,curMonth=4;
const sk=d=>'dp26_'+d;
const toISO=(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const isoToday=()=>{const t=new Date();return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;};
const t2m=t=>{if(!t)return 0;const[h,m]=t.split(':').map(Number);return h*60+m;};
const m2s=m=>{if(m<=0)return'0u';const h=Math.floor(m/60),r=m%60;return r?`${h}u ${r}m`:`${h}u`;};
function buildGrid(){
  const g=document.getElementById('tGrid');g.innerHTML='';
  for(let h=7;h<=21;h++){
    for(let m=(h===7?30:0);m<=45;m+=15){
      const lbl=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const row=document.createElement('div');
      row.className='time-block'+(m===0?' hour-start':'');
      row.dataset.time=lbl;
      const tl=document.createElement('span');tl.className='t-lbl';tl.textContent=lbl;tl.title='Klik voor type';
      tl.onclick=e=>{e.stopPropagation();openPicker(row);};
      const ct=document.createElement('span');ct.className='cat-tag';
      ct.onclick=e=>{e.stopPropagation();openPicker(row);};
      const wd=document.createElement('div');wd.className='w-dot';wd.title='Markeer als gewerkt';
      wd.onclick=e=>{e.stopPropagation();row.classList.toggle('worked');autoSave();updateHours();};
      const ta=document.createElement('textarea');ta.className='t-inp';ta.rows=1;
      ta.id='sl-'+lbl.replace(':','');ta.dataset.time=lbl;
      ta.oninput=function(){this.style.height='auto';this.style.height=Math.max(22,this.scrollHeight)+'px';autoSave();};
      row.append(tl,ct,wd,ta,makePicker(row,ct));
      g.appendChild(row);
    }
  }
}
function makePicker(row,ct){
  const p=document.createElement('div');p.className='picker';
  p.onclick=e=>e.stopPropagation();
  const h1=document.createElement('div');h1.className='p-hdr';h1.textContent='Activiteitstype';p.appendChild(h1);
  CATS.forEach(c=>{
    const o=document.createElement('div');o.className='p-opt';
    const dot=document.createElement('div');dot.className='p-dot';dot.style.background=c.color;
    const lbl=document.createElement('span');lbl.textContent=c.label;
    o.append(dot,lbl);
    o.onclick=()=>{setCat(row,ct,c.key);p.classList.remove('open');};
    p.appendChild(o);
  });
  const clr=document.createElement('div');clr.className='p-opt clr';
  clr.innerHTML='<div class="p-dot"></div><span>Geen categorie</span>';
  clr.onclick=()=>{setCat(row,ct,'');clearET(row);p.classList.remove('open');};
  p.appendChild(clr);
  const dl=document.createElement('div');dl.className='p-div';p.appendChild(dl);
  const hl=document.createElement('div');hl.className='p-hdr';hl.textContent='Locatie';p.appendChild(hl);
  const locRow=document.createElement('div');locRow.className='loc-row';
  const locInp=document.createElement('input');locInp.type='text';locInp.className='loc-inp';locInp.placeholder='Adres of plaatsnaam...';
  const locSug=document.createElement('div');locSug.className='loc-suggestions';
  function renderSug(filter){
    locSug.innerHTML='';
    const ac=row.dataset.cat||'';
    SAVED_LOCS
      .filter(sl=>!ac||(ac==='extern'?sl.cat==='extern':ac==='locatie'?sl.cat==='locatie':true))
      .filter(sl=>!filter||sl.label.toLowerCase().includes(filter))
      .forEach(sl=>{
        const s=document.createElement('div');s.className='loc-sug-item';
        const ic=document.createElement('span');ic.style.cssText='font-size:10px;flex-shrink:0;width:40px';
        ic.textContent=sl.fiets===null?'[school]':sl.fiets?'[fiets]':'[auto]';
        const nm=document.createElement('span');nm.textContent=sl.label;
        s.append(ic,nm);
        s.onclick=e=>{e.stopPropagation();locInp.value=sl.val;locInp.dataset.fiets=sl.fiets===null?'null':sl.fiets?'1':'0';locSug.style.display='none';};
        locSug.appendChild(s);
      });
    locSug.style.display=locSug.children.length?'block':'none';
  }
  locInp.onfocus=()=>renderSug('');
  locInp.oninput=()=>{
    renderSug(locInp.value.toLowerCase());
    const isSch=/schoonhoven|2871|jan lut|dam 7|wz|willem|werkkamer|a66/i.test(locInp.value);
    locInp.dataset.fiets=isSch?'1':'0';
  };
  const locApply=document.createElement('button');locApply.className='loc-apply-btn';locApply.textContent='Opslaan + reistijd';
  locApply.onclick=e=>{
    e.stopPropagation();
    const loc=locInp.value.trim();if(!loc)return;
    row.dataset.location=loc;
    let lb=row.querySelector('.loc-badge');
    if(!lb){lb=document.createElement('span');lb.className='loc-badge';row.appendChild(lb);}
    lb.textContent=loc;
    const isFiets=locInp.dataset.fiets;
    if(isFiets!=='null')planReistijd(row,loc,isFiets==='1');
    locSug.style.display='none';p.classList.remove('open');autoSave();
  };
  locRow.append(locInp,locSug,locApply);p.appendChild(locRow);
  const d1=document.createElement('div');d1.className='p-div';p.appendChild(d1);
  const h2=document.createElement('div');h2.className='p-hdr';h2.textContent='Eindtijd blok';p.appendChild(h2);
  const er=document.createElement('div');er.className='et-row';
  const es=document.createElement('select');es.className='et-sel';
  const etApply=document.createElement('button');etApply.className='et-apply-btn';etApply.textContent='OK';
  etApply.onclick=e=>{e.stopPropagation();if(es.value)applyET(row,es.value);else clearET(row);p.classList.remove('open');};
  const ecb=document.createElement('button');ecb.className='et-clr-btn';ecb.textContent='X';
  ecb.onclick=e=>{e.stopPropagation();clearET(row);es.value='';p.classList.remove('open');};
  er.append(es,etApply,ecb);p.appendChild(er);
  const d2=document.createElement('div');d2.className='p-div';p.appendChild(d2);
  const h3=document.createElement('div');h3.className='p-hdr';h3.textContent='Herhaling (Outlook)';p.appendChild(h3);
  const rw=document.createElement('div');rw.className='rr-wrap';
  const rf=document.createElement('select');rf.className='rr-fs';
  [['','geen herhaling'],['DAILY','Dagelijks'],['WEEKLY','Wekelijks'],['BIWEEKLY','Tweewekelijks'],['MONTHLY','Maandelijks']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;rf.appendChild(o);});
  const rend=document.createElement('div');rend.className='rr-end';rend.style.display='none';
  const ret=document.createElement('select');ret.className='rr-ets';
  [['count','Aantal keer'],['until','Tot datum']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;ret.appendChild(o);});
  const rcnt=document.createElement('input');rcnt.type='number';rcnt.className='rr-cnt';rcnt.min=2;rcnt.max=104;rcnt.value=10;
  const runtil=document.createElement('input');runtil.type='date';runtil.className='rr-until';runtil.style.display='none';
  ret.onchange=()=>{const u=ret.value==='until';rcnt.style.display=u?'none':'';runtil.style.display=u?'':'none';};
  rf.onchange=()=>{rend.style.display=rf.value?'flex':'none';};
  rend.append(ret,rcnt,runtil);
  const rap=document.createElement('button');rap.className='rr-apply';rap.textContent='Toepassen';
  rap.onclick=e=>{
    e.stopPropagation();
    const f=rf.value;
    if(f){row.dataset.rrfreq=f;row.dataset.rrendtype=ret.value;row.dataset.rrcount=rcnt.value;row.dataset.rruntil=runtil.value;}
    else{delete row.dataset.rrfreq;}
    rrBadge(row,f);autoSave();p.classList.remove('open');
  };
  rw.append(rf,rend,rap);p.appendChild(rw);
  p.addEventListener('picker-open',()=>{
    locInp.value=row.dataset.location||'';
    if(row.dataset.location){locInp.dataset.fiets=/schoonhoven|2871|jan lut|dam 7|wz|willem|werkkamer|a66/i.test(row.dataset.location)?'1':'0';}
    renderSug('');locSug.style.display='none';
    const all=Array.from(document.querySelectorAll('.time-block[data-time]')).map(b=>b.dataset.time);
    const idx=all.indexOf(row.dataset.time);const cur=es.value;
    es.innerHTML='<option value="">kies eindtijd</option>';
    all.slice(idx+1).forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;es.appendChild(o);});
    es.value=cur||row.dataset.endtime||'';
    rf.value=row.dataset.rrfreq||'';rend.style.display=rf.value?'flex':'none';
    ret.value=row.dataset.rrendtype||'count';rcnt.value=row.dataset.rrcount||10;runtil.value=row.dataset.rruntil||'';
    const u=ret.value==='until';rcnt.style.display=u?'none':'';runtil.style.display=u?'':'none';
  });
  return p;
}

function applyS(time,val,cat){
  const b=document.querySelector(`.time-block[data-time="${time}"]`);if(!b)return;
  const ta=b.querySelector('.t-inp'),ct=b.querySelector('.cat-tag');
  if(ta&&!ta.value.trim()){ta.value=val;ta.style.height='auto';ta.style.height=Math.max(22,ta.scrollHeight)+'px';}
  if(!b.dataset.cat&&cat)setCatS(b,ct,cat);
}
function applyFixed(dateStr){
  const d=pd(dateStr),dow=d.getDay(),mo=d.getMonth();
  document.getElementById('hLoc').textContent=WL[dow]?'Locatie: '+WL[dow]:'';
  const sf=SCHOOL_FREE[dateStr];
  if(sf){
    const bannerEl=document.getElementById('dayBannerInp');
    if(bannerEl&&!bannerEl.value){
      bannerEl.value=sf.label;
    }
    const typeMap={vakantie:'vakantie',feestdag:'vrij',roostervrij:'vrij'};
    const chipType=typeMap[sf.type]||'vrij';
    const chip=document.querySelector(`.day-chip[data-type="${chipType}"]`);
    if(chip&&!document.querySelector('.day-chip.active')) chip.classList.add('active');
    const page=document.querySelector('.page');
    if(page) page.style.background=sf.color;
  } else {
    const page=document.querySelector('.page');
    if(page) page.style.background='white';
  }
  if([1,2,4,5].includes(dow)){
    applyS('10:30','Pauze (20 min.)','pauze');applyS('10:45','','pauze');
    applyS('12:10','Pauze (30 min.)','pauze');applyS('12:15','','pauze');applyS('12:25','','pauze');applyS('12:30','','pauze');
    applyS('14:00','Pauze (10 min.)','pauze');
  }
  if(dow===2){['09:15','09:30','09:45','10:00','10:15'].forEach(t=>applyS(t,'IZO - intern zorgoverleg','locatie'));}
  if(dow===5){['11:00','11:15','11:30','11:45'].forEach(t=>applyS(t,'Weekplanning maken','admin'));}
  if(dow===3){
    applyS('07:30','Reistijd - Schoonhoven naar Utrecht Mariaplaats (BiOND, 45 min)','reistijd');
    applyS('07:45','Reistijd - onderweg naar Utrecht','reistijd');
    applyS('08:00','Reistijd - onderweg naar Utrecht','reistijd');
    applyS('08:15','Aankomst BiOND - Mariaplaats Utrecht','reistijd');
    applyS('17:00','Reistijd - Utrecht Mariaplaats naar Schoonhoven (45 min)','reistijd');
    applyS('17:15','Reistijd - onderweg terug','reistijd');
    applyS('17:30','Reistijd - onderweg terug','reistijd');
    applyS('17:45','Aankomst Schoonhoven','reistijd');
    const na=document.getElementById('notesArea');
    if(!na.value)na.value='BiOND - Mariaplaats, Utrecht\nRijroute: Schoonhoven > A12 > Utrecht Centrum > Mariaplaats';
  }
  if(dow===3&&(mo===5||mo===6)&&d.getFullYear()===YEAR){
    applyS('07:15','Auto naar Hondendagopvang Matties, Lopik (15 min)','reistijd');
    applyS('07:30','Hond brengen - Hondendagopvang Matties, Lekdijk West 44, Lopik','reistijd');
    applyS('07:45','Auto terug naar Schoonhoven (15 min)','reistijd');
    applyS('16:45','Auto naar Hondendagopvang Matties, Lopik (ophalen, 15 min)','reistijd');
    applyS('17:00','Hond ophalen - Hondendagopvang Matties, Lekdijk West 44, Lopik','reistijd');
    applyS('17:15','Auto terug naar Schoonhoven (15 min)','reistijd');
    const na=document.getElementById('notesArea');
    if(!na.value)na.value='Hondendagopvang Matties\nLekdijk West 44, 3411 MX Lopik\nBrengen 07:30 - Ophalen 17:00\nRoute: N210 richting Lopik > Lekdijk West (15 min)';
  }
}
function loadDay(dateStr){
  clearUI();
  const raw=localStorage.getItem(sk(dateStr));
  if(raw){
    try{
      const d=JSON.parse(raw);
      if(d.intent)document.getElementById('intentInp').value=d.intent;
      if(d.notes)document.getElementById('notesArea').value=d.notes;
      if(d.wStart)document.getElementById('wStart').value=d.wStart;
      if(d.wEnd)document.getElementById('wEnd').value=d.wEnd;
      if(d.slots)Object.entries(d.slots).forEach(([time,s])=>{
        if(!s)return;
        const b=document.querySelector(`.time-block[data-time="${time}"]`);if(!b)return;
        const ta=b.querySelector('.t-inp'),ct=b.querySelector('.cat-tag');
        if(s.val&&ta){ta.value=s.val;ta.style.height='auto';ta.style.height=Math.max(22,ta.scrollHeight)+'px';}
        if(s.cat)setCatS(b,ct,s.cat);
        if(s.worked)b.classList.add('worked');
        if(s.continuationOf)b.dataset.continuationOf=s.continuationOf;
        if(s.endtime){b.dataset.endtime=s.endtime;let eb=b.querySelector('.et-badge');if(!eb){eb=document.createElement('span');eb.className='et-badge';b.appendChild(eb);}eb.textContent='-> '+s.endtime;}
        if(s.rrfreq){b.dataset.rrfreq=s.rrfreq;b.dataset.rrendtype=s.rrendtype||'count';b.dataset.rrcount=s.rrcount||'10';b.dataset.rruntil=s.rruntil||'';rrBadge(b,s.rrfreq);}
        if(s.location){b.dataset.location=s.location;let lb=b.querySelector('.loc-badge');if(!lb){lb=document.createElement('span');lb.className='loc-badge';b.appendChild(lb);}lb.textContent=s.location;}
      });
      const ll=(items,fn,id,min)=>{(items||[]).forEach(it=>fn(id,it.text,it.done));for(let i=(items||[]).length;i<min;i++)fn(id,'');};
      if(d.tasks)['hoog','midden','laag'].forEach(p=>ll(d.tasks[p],addTask,p,2));
      else['hoog','midden','laag'].forEach(p=>{for(let i=0;i<2;i++)addTask(p,'');});
      if(d.comms)['bellen','mailen','bespreken'].forEach(t=>ll(d.comms[t],addComm,t,2));
      else['bellen','mailen','bespreken'].forEach(t=>{for(let i=0;i<2;i++)addComm(t,'');});
      if(d.mood)document.querySelectorAll('.mood-btn').forEach(b=>{if(b.textContent===d.mood)b.classList.add('on');});
      if(d.banner)setBannerData(d.banner);
    }catch(e){console.error('loadDay:',e);}
  } else {
    ['hoog','midden','laag'].forEach(p=>{for(let i=0;i<2;i++)addTask(p,'');});
    ['bellen','mailen','bespreken'].forEach(t=>{for(let i=0;i<2;i++)addComm(t,'');});
  }
  applyFixed(dateStr);
  updateHours();
}
function selectDay(dateStr){
  try{
    if(curDate)saveDay();
    curDate=dateStr;
    const d=pd(dateStr);curMonth=d.getMonth();
    document.getElementById('dayLabel').textContent=`${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
    document.getElementById('hDate').textContent=`${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
    document.getElementById('hDay').textContent=DAYS_NL[d.getDay()];
    document.querySelectorAll('.month-tab').forEach((t,i)=>t.classList.toggle('active',MONTHS[i]===d.getMonth()));
    loadDay(dateStr);renderCal();
  }catch(e){console.error('selectDay:',e);}
}
function shiftDay(n){
  try{
    const d=pd(curDate);d.setDate(d.getDate()+n);
    const iso=toISO(d.getFullYear(),d.getMonth(),d.getDate());
    if(MONTHS.includes(d.getMonth()))selectDay(iso);
  }catch(e){console.error('shiftDay:',e);}
}
function gotoMonth(m){
  try{
    curMonth=m;
    const today=isoToday();
    const td=pd(today);
    const start=(td.getFullYear()===YEAR&&td.getMonth()===m)?today:toISO(YEAR,m,1);
    document.querySelectorAll('.month-tab').forEach((t,i)=>t.classList.toggle('active',MONTHS[i]===m));
    selectDay(start);
  }catch(e){console.error('gotoMonth:',e);}
}
function renderCal(){
  const cal=document.getElementById('mCal');cal.innerHTML='';
  document.getElementById('mTitle').textContent=MONTHS_NL[curMonth].charAt(0).toUpperCase()+MONTHS_NL[curMonth].slice(1)+' '+YEAR;
  ['ma','di','wo','do','vr','za','zo'].forEach(d=>{const h=document.createElement('div');h.className='cal-hdr';h.textContent=d;cal.appendChild(h);});
  const fjs=new Date(YEAR,curMonth,1).getDay(),fmon=(fjs===0)?6:fjs-1;
  const total=new Date(YEAR,curMonth+1,0).getDate(),today=isoToday();
  for(let i=0;i<fmon;i++){const e=document.createElement('div');e.className='cal-day empty';cal.appendChild(e);}
  let mo=0;
  for(let d=1;d<=total;d++){
    const iso=toISO(YEAR,curMonth,d),jsDay=new Date(YEAR,curMonth,d).getDay();
    const el=document.createElement('div');
    el.className='cal-day'+(jsDay===0||jsDay===6?' weekend':'');
    const sf=SCHOOL_FREE[iso];
    if(sf) el.style.background=sf.color;
    if(iso===today)el.classList.add('today');
    if(iso===curDate)el.classList.add('sel');
    const num=document.createElement('div');num.className='cal-num';num.textContent=d;el.appendChild(num);
    const mins=iso===curDate?workedMins():storedMins(iso);mo+=mins;
    if(mins>0){const h=document.createElement('div');h.className='cal-hours';h.textContent=m2s(mins);el.appendChild(h);}
    const bannerRaw=iso===curDate?null:localStorage.getItem(sk(iso));
    if(bannerRaw){
      try{
        const bd=JSON.parse(bannerRaw);
        if(bd.banner&&(bd.banner.type||bd.banner.text)){
          const bt=bd.banner.type||'';
          const label=bt?{vrij:'Vrij',vakantie:'Vakantie',studiedag:'Studie',ziek:'Ziek',verjaardag:'Verjaardag'}[bt]||bt:bd.banner.text;
          const color=CHIP_COLORS[bt]||'#9aabb5';
          const bl=document.createElement('div');bl.style.cssText=`font-size:7px;font-weight:700;background:${color};color:white;border-radius:2px;padding:1px 2px;margin-top:1px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;bl.textContent=label;el.appendChild(bl);
        }
      }catch{}
    }
    if(iso===curDate){
      const cb=getBannerData();
      if(cb.type||cb.text){
        const label=cb.type?{vrij:'Vrij',vakantie:'Vakantie',studiedag:'Studie',ziek:'Ziek',verjaardag:'Verjaardag'}[cb.type]||cb.type:cb.text;
        const color=CHIP_COLORS[cb.type]||'#9aabb5';
        const bl=document.createElement('div');bl.style.cssText=`font-size:7px;font-weight:700;background:${color};color:white;border-radius:2px;padding:1px 2px;margin-top:1px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;bl.textContent=label;el.appendChild(bl);
      }
    }
    el.onclick=()=>selectDay(iso);cal.appendChild(el);
  }
  document.getElementById('mTotal').textContent='Totaal: '+m2s(mo);
}
function clearCurDay(){if(!confirm('Dag wissen?'))return;if(curDate)localStorage.removeItem(sk(curDate));loadDay(curDate);renderCal();}
function fullReset(){if(!confirm('Alle data wissen?'))return;Object.keys(localStorage).filter(k=>k.startsWith('dp26_')).forEach(k=>localStorage.removeItem(k));window.location.reload();}
function restorePreviousVersion(){
  const hk=sk(curDate)+'_history';
  let hist=[];try{hist=JSON.parse(localStorage.getItem(hk))||[];}catch{}
  if(!hist.length){alert('Geen eerdere versie beschikbaar.');return;}
  if(!confirm('Vorige versie terugzetten?'))return;
  localStorage.setItem(sk(curDate),hist[0]);loadDay(curDate);updateHours();
  showTip('Hersteld','Vorige versie is teruggezet.','#006077');
}
function exportData(){
  const backup={version:'dp26-v1',exported:new Date().toISOString(),data:{}};
  Object.keys(localStorage).forEach(k=>{if(k.startsWith('dp26_'))backup.data[k]=localStorage.getItem(k);});
  const count=Object.keys(backup.data).length;
  if(!count){alert('Geen data om te exporteren.');return;}
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`dagplanner-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
  showTip('Geexporteerd',`${count} dag(en) opgeslagen. Mail het bestand en importeer op het andere apparaat.`,'#5573a0');
}
function importData(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const backup=JSON.parse(e.target.result);
      if(!backup.version||!backup.data)throw new Error('Ongeldig bestand');
      const count=Object.keys(backup.data).length;
      if(!confirm(`${count} dag(en) importeren?`)){input.value='';return;}
      Object.entries(backup.data).forEach(([k,v])=>localStorage.setItem(k,v));
      if(curDate)loadDay(curDate);updateHours();input.value='';
      showTip('Geimporteerd',`${count} dag(en) ingeladen.`,'#008972');
    }catch(err){alert('Fout: '+err.message);input.value='';}
  };
  reader.readAsText(file);
}

function importICS(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const text=e.target.result;
      const events=parseICS(text);
      if(!events.length){alert('Geen afspraken gevonden in dit bestand.');input.value='';return;}
      const relevant=events.filter(ev=>MONTHS.includes(ev.date.getMonth())&&ev.date.getFullYear()===YEAR);
      if(!relevant.length){alert('Geen afspraken gevonden voor mei t/m juli 2026.');input.value='';return;}
      if(!confirm(`${relevant.length} afspraak/afspraken gevonden voor mei-juli 2026.\nInladen in de planner?`)){input.value='';return;}
      const perDay={};
      relevant.forEach(ev=>{
        const iso=toISO(ev.date.getFullYear(),ev.date.getMonth(),ev.date.getDate());
        if(!perDay[iso])perDay[iso]=[];
        perDay[iso].push(ev);
      });
      let imported=0;
      Object.entries(perDay).forEach(([iso,evs])=>{
        const raw=localStorage.getItem(sk(iso));
        let dayData={slots:{},tasks:{hoog:[],midden:[],laag:[]},comms:{bellen:[],mailen:[],bespreken:[]},intent:'',notes:'',wStart:'08:00',wEnd:'16:30',mood:'',updatedAt:Date.now()};
        if(raw){try{dayData=JSON.parse(raw);}catch(ex){}}
        evs.forEach(ev=>{
          const slots=getTimeSlots(ev.startTime,ev.endTime);
          const cat=guessCat(ev.summary,ev.location);
          slots.forEach((t,i)=>{
            if(!dayData.slots[t])dayData.slots[t]={val:'',cat:'',worked:false,endtime:'',continuationOf:'',rrfreq:'',rrendtype:'',rrcount:'',rruntil:'',location:''};
            if(!dayData.slots[t].val){
              dayData.slots[t].val=i===0?ev.summary:'';
              dayData.slots[t].cat=cat;
              if(ev.location&&i===0)dayData.slots[t].location=ev.location;
              if(i===0&&slots.length>1)dayData.slots[t].endtime=slots[slots.length-1];
              if(i>0)dayData.slots[t].continuationOf=slots[0];
            }
          });
          imported++;
        });
        dayData.updatedAt=Date.now();
        localStorage.setItem(sk(iso),JSON.stringify(dayData));
        syncToCloud(sk(iso),JSON.stringify(dayData));
      });
      if(curDate&&perDay[curDate]){loadDay(curDate);updateHours();}
      input.value='';
      showTip('Outlook geimporteerd',`${imported} afspraak/afspraken ingeladen voor ${Object.keys(perDay).length} dag(en). Navigeer naar de dagen om ze te bekijken.`,'#217346');
    }catch(err){
      console.error(err);
      alert('Fout bij inlezen: '+err.message);
      input.value='';
    }
  };
  reader.readAsText(file,'utf-8');
}
function parseICS(text){
  const events=[];
  const lines=text.replace(/\r\n /g,'').replace(/\r\n\t/g,'').split(/\r\n|\n|\r/);
  let current=null;
  lines.forEach(line=>{
    if(line==='BEGIN:VEVENT'){current={summary:'',location:'',startTime:'',endTime:'',date:null};}
    else if(line==='END:VEVENT'&&current){
      if(current.date)events.push(current);
      current=null;
    } else if(current){
      if(line.startsWith('SUMMARY:'))current.summary=line.slice(8).trim();
      else if(line.startsWith('LOCATION:'))current.location=line.slice(9).trim();
      else if(line.startsWith('DTSTART')){
        const val=line.split(':').pop().trim();
        const parsed=parseICSDate(val);
        if(parsed){current.date=parsed.date;current.startTime=parsed.time;}
      }
      else if(line.startsWith('DTEND')){
        const val=line.split(':').pop().trim();
        const parsed=parseICSDate(val);
        if(parsed)current.endTime=parsed.time;
      }
    }
  });
  return events;
}
function parseICSDate(val){
  const m=val.replace('Z','').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if(!m)return null;
  const date=new Date(parseInt(m[1]),parseInt(m[2])-1,parseInt(m[3]));
  const h=parseInt(m[4]),min=parseInt(m[5]);
  const time=`${String(h).padStart(2,'0')}:${String(Math.round(min/15)*15).padStart(2,'0')}`;
  return{date,time};
}
function getTimeSlots(start,end){
  if(!start)return[];
  const slots=[];
  let [h,m]=start.split(':').map(Number);
  m=Math.round(m/15)*15;if(m===60){h++;m=0;}
  const endH=end?parseInt(end.split(':')[0]):h;
  const endM=end?Math.round(parseInt(end.split(':')[1])/15)*15:m+15;
  let cur=h*60+m;
  const fin=endH*60+endM;
  while(cur<fin&&cur<=21*60+45){
    const hh=Math.floor(cur/60),mm=cur%60;
    if(hh>7||(hh===7&&mm>=30)){
      slots.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    }
    cur+=15;
  }
  return slots;
}
function guessCat(summary,location){
  const s=(summary+' '+(location||'')).toLowerCase();
  if(/teams|zoom|meet|online|videovergadering|video/i.test(s))return'online';
  if(/tel|bel|gesprek|call/i.test(s)&&!/overleg|vergader/i.test(s))return'telefoon';
  if(/vergader|overleg|meeting|beraad/i.test(s)){
    if(/extern|buiten|locatie|mariaplaats|den haag|gouda|utrecht|lopik/i.test(s))return'extern';
    return'locatie';
  }
  if(/admin|verslag|notulen|mail|rapport/i.test(s))return'admin';
  if(/reis|reizen|trein|bus|auto/i.test(s))return'reistijd';
 return'locatie';
}
function showTip(title,html,color){
  const old=document.getElementById('syncTip');if(old)old.remove();
  const tip=document.createElement('div');tip.id='syncTip';tip.className='sync-tip';
  const inner=document.createElement('div');inner.className='sync-tip-inner';inner.style.borderTopColor=color;
  const ttl=document.createElement('div');ttl.className='sync-tip-title';ttl.style.color=color;ttl.textContent=title;
  const bod=document.createElement('div');bod.className='sync-tip-body';bod.innerHTML=html;
  const btn=document.createElement('button');btn.textContent='Sluiten';btn.onclick=()=>tip.remove();
  inner.append(ttl,bod,btn);tip.appendChild(inner);
  document.body.appendChild(tip);
  setTimeout(()=>{const t=document.getElementById('syncTip');if(t)t.remove();},12000);
}
function exportICS(){
  if(!curDate){alert('Selecteer eerst een dag.');return;}
  const all=Array.from(document.querySelectorAll('.time-block[data-time]'));
  const events=[];let i=0;
  while(i<all.length){
    const b=all[i];const ta=b.querySelector('.t-inp');const val=ta?ta.value.trim():'';
    if(val&&!b.dataset.continuationOf&&b.dataset.cat!=='pauze'){
      const st=b.dataset.time;let et;
      if(b.dataset.endtime){et=b.dataset.endtime;const ei=all.findIndex(x=>x.dataset.time===et);i=Math.max(i+1,ei+1);}
      else{let j=i+1;while(j<all.length){const nv=(all[j].querySelector('.t-inp') && all[j].querySelector('.t-inp').value).trim()||'';if(nv===val&&!all[j].dataset.continuationOf)j++;else break;}et=all[j]?all[j].dataset.time:amins(st,15);i=j;}
      events.push({title:val,start:st,end:et,cat:b.dataset.cat||'',location:b.dataset.location||'',rr:buildRR(b)});
    }else i++;
  }
  if(!events.length){alert('Geen afspraken gevonden.');return;}
  const CL={locatie:'Overleg op locatie',extern:'Overleg extern',online:'Online overleg',admin:'Administratieve taak',telefoon:'Telefonisch contact',reistijd:'Reistijd'};
  const now=new Date().toISOString().replace(/[-:.]/g,'').slice(0,15)+'Z';
  const vtz=[
'BEGIN:VTIMEZONE',
'TZID:Europe/Amsterdam',
'BEGIN:STANDARD',
'TZNAME:CET','DTSTART:19701025T030000','TZOFFSETFROM:+0200','TZOFFSETTO:+0100','RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10','END:STANDARD',
'BEGIN:DAYLIGHT','TZNAME:CEST','DTSTART:19700329T020000','TZOFFSETFROM:+0100','TZOFFSETTO:+0200','RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3','END:DAYLIGHT',
'END:VTIMEZONE'].join('\r\n');
  let ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Dagplanner WZ//NL\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n'+vtz+'\r\n';
  events.forEach((ev,idx)=>{
    const d=curDate.replace(/-/g,''),ds=`${d}T${ev.start.replace(':','')}00`,de=`${d}T${ev.end.replace(':','')}00`;
    const cl=CL[ev.cat]||'',desc=cl?`Categorie: ${cl}${ev.location?'\\nLocatie: '+ev.location:''}`:ev.location||'';
    ics+=`BEGIN:VEVENT\r\nUID:dp-${curDate}-${idx}-${Date.now()}@wz\r\nDTSTAMP:${now}\r\n`;
    ics+=`DTSTART;TZID=Europe/Amsterdam:${ds}\r\nDTEND;TZID=Europe/Amsterdam:${de}\r\n`;
    ics+=`SUMMARY:${esc(ev.title)}\r\n`;
    if(ev.location)ics+=`LOCATION:${esc(ev.location)}\r\n`;
    if(desc)ics+=`DESCRIPTION:${esc(desc)}\r\n`;
    if(cl)ics+=`CATEGORIES:${esc(cl)}\r\n`;
    if(ev.rr)ics+=`RRULE:${ev.rr}\r\n`;
    ics+='BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\nDESCRIPTION:Herinnering\r\nEND:VALARM\r\nEND:VEVENT\r\n';
  });
  ics+='END:VCALENDAR';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
  a.download=`dagplanner-${curDate}.ics`;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
  showTip('Importeer in Outlook','1. Open Outlook<br>2. Bestand > Openen > Agenda importeren<br>3. Kies het .ics bestand<br>4. Klik Importeren','#1C829E');
}
function amins(t,n){const[h,m]=t.split(':').map(Number),tot=h*60+m+n;return`${String(Math.floor(tot/60)).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`;}
function esc(s){return s.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
function buildRR(b){
  const f=b.dataset.rrfreq;
  if(!f)return null;
  let freq=f,int=1;if(f==='BIWEEKLY'){freq='WEEKLY';int=2;}let r=`FREQ=${freq}`;if(int>1)r+=`;INTERVAL=${int}`;if(b.dataset.rrendtype==='until'&&b.dataset.rruntil)r+=`;UNTIL=${b.dataset.rruntil.replace(/-/g,'')}T000000Z`;else r+=`;COUNT=${b.dataset.rrcount||10}`;return r;}
function mks(a){const s={};a.forEach(af=>af.tijden.forEach(t=>{s[t]={val:af.label,cat:af.cat,worked:false,endtime:'',continuationOf:'',rrfreq:'',rrendtype:'',rrcount:'',rruntil:''};}));return s;}
function seedIfNew(d,data){if(!localStorage.getItem(sk(d)))localStorage.setItem(sk(d),JSON.stringify(data));}
function seedAll(){}

let _clk;
function startClock(){
  clearInterval(_clk);
  _clk=setInterval(()=>{
    if(curDate===isoToday()){
      const w=workedMins(),el=document.getElementById('hToday');
      if(w>0){el.textContent=m2s(w);el.style.color='';}
      else{const s=document.getElementById('wStart').value;if(s){const n=new Date(),nm=n.getHours()*60+n.getMinutes(),diff=nm-t2m(s);if(diff>0){el.textContent=m2s(diff);el.style.color='#9aabb5';}}}
    }
  },60000);
}
document.addEventListener('DOMContentLoaded',()=>{
  buildGrid();
  document.getElementById('btnPrev').addEventListener('click',()=>shiftDay(-1));
  document.getElementById('btnNext').addEventListener('click',()=>shiftDay(1));
  document.querySelectorAll('.month-tab[data-month]').forEach(btn=>{
    btn.addEventListener('click',()=>gotoMonth(parseInt(btn.dataset.month)));
  });
  document.getElementById('btnPrint').addEventListener('click',()=>window.print());
  document.getElementById('btnOutlook').addEventListener('click',()=>exportICS());
  document.getElementById('btnExport').addEventListener('click',()=>exportData());
  document.getElementById('btnImport').addEventListener('click',()=>document.getElementById('importFile').click());
  document.getElementById('btnIcs').addEventListener('click',()=>document.getElementById('icsFile').click());
  document.getElementById('btnSync').addEventListener('click',()=>manualSync());
  document.getElementById('btnClear').addEventListener('click',()=>clearCurDay());
  document.getElementById('btnReset').addEventListener('click',()=>fullReset());
  document.querySelectorAll('.day-chip').forEach(btn=>{
    btn.addEventListener('click',()=>toggleChip(btn));
  });
  document.querySelectorAll('.mood-btn').forEach(btn=>{
    btn.addEventListener('click',()=>setMood(btn));
  });
  document.getElementById('intentInp').addEventListener('input',autoSave);
  document.getElementById('notesArea').addEventListener('input',autoSave);
  seedAll();
  const today=isoToday();
  const td=pd(today);
  const todayMonth=td.getMonth();
  const todayYear=td.getFullYear();
  const inRange=todayYear===YEAR&&MONTHS.includes(todayMonth);
  const start=inRange?today:toISO(YEAR,4,1);
  curMonth=pd(start).getMonth();
  document.querySelectorAll('.month-tab').forEach((t,i)=>{
    t.classList.toggle('active',MONTHS[i]===curMonth);
  });
  selectDay(start);
  startClock();
  setTimeout(async()=>{
    const count=await syncAllFromCloud();
    if(count>0&&curDate){loadDay(curDate);updateHours();}
    startAutoSync();
  },1500);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(regs=>{
      regs.forEach(r=>r.unregister());
    });
  }
  let dp=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;const b=document.getElementById('installBanner');if(b)b.style.display='flex';});
  window.addEventListener('appinstalled',()=>{dp=null;const b=document.getElementById('installBanner');if(b)b.style.display='none';});
  const ib=document.getElementById('installBtn');
  if(ib){
    ib.addEventListener('click',async function(){
      if(!dp)return;
      dp.prompt();
      var choice=await dp.userChoice;
      if(choice.outcome==='accepted'){
        var bn=document.getElementById('installBanner');
        if(bn)bn.style.display='none';
      }
      dp=null;
    });
  }
  const ic=document.getElementById('installClose');
  if(ic){
    ic.addEventListener('click',function(){
      var bn=document.getElementById('installBanner');
      if(bn)bn.style.display='none';
    });
  }
});
var _done=1;
var _done2=2;
var _done3=3;
var _done4=4;
var _done5=5;
var _done6=6;
var _done7=7;
var _done8=8;
