
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
function openPicker(row){closePickers();const p=row.querySelector('.picker');p.classList.add('open');p.dispatchEvent(new Event('picker-open'));}
function closePickers(){document.querySelectorAll('.picker.open').forEach(p=>p.classList.remove('open'));}
document.addEventListener('click',closePickers);
function planReistijd(row,loc,isFiets){
  const all=Array.from(document.querySelectorAll('.time-block[data-time]'));
  const si=all.findIndex(b=>b.dataset.time===row.dataset.time);
  const et=row.dataset.endtime||row.dataset.time;
  const ei=all.findIndex(b=>b.dataset.time===et);
  let heen=1,terug=1;
  if(!isFiets){const ver=/den haag|haag|amsterdam|rotterdam|utrecht/i.test(loc);heen=ver?3:2;terug=heen;}
  const vv=isFiets?'Fiets':'Auto/OV';
  const kort=loc.split(',')[0];
  for(let i=1;i<=heen;i++){
    const b=all[si-heen+(i-1)];if(!b)continue;
    const ta=b.querySelector('.t-inp'),ct=b.querySelector('.cat-tag');
    if(ta&&!ta.value.trim()){ta.value=i===1?`${vv} naar ${kort}`:'Reistijd';ta.style.height='auto';ta.style.height=Math.max(22,ta.scrollHeight)+'px';setCatS(b,ct,'reistijd');}
  }
  for(let i=0;i<terug;i++){
    const b=all[ei+1+i];if(!b)continue;
    const ta=b.querySelector('.t-inp'),ct=b.querySelector('.cat-tag');
    if(ta&&!ta.value.trim()){ta.value=i===0?`${vv} terug naar Schoonhoven`:'Reistijd';ta.style.height='auto';ta.style.height=Math.max(22,ta.scrollHeight)+'px';setCatS(b,ct,'reistijd');}
  }
  autoSave();
}
function setCat(row,ct,key){if(key){row.dataset.cat=key;const c=CATS.find(x=>x.key===key);if(ct)ct.textContent=c?c.short:key;}else{delete row.dataset.cat;if(ct)ct.textContent='';}autoSave();}
function setCatS(row,ct,key){if(key){row.dataset.cat=key;const c=CATS.find(x=>x.key===key);if(ct)ct.textContent=c?c.short:key;}else{delete row.dataset.cat;if(ct)ct.textContent='';}}
function applyET(sr,et){
  sr.dataset.endtime=et;
  let b=sr.querySelector('.et-badge');if(!b){b=document.createElement('span');b.className='et-badge';sr.appendChild(b);}
  b.textContent='-> '+et;
  const cat=sr.dataset.cat||'',all=Array.from(document.querySelectorAll('.time-block[data-time]'));
  const si=all.findIndex(x=>x.dataset.time===sr.dataset.time),ei=all.findIndex(x=>x.dataset.time===et);
  all.forEach(b=>{if(b.dataset.continuationOf===sr.dataset.time){delete b.dataset.continuationOf;b.classList.remove('cont');setCatS(b,b.querySelector('.cat-tag'),'');}});
  for(let i=si+1;i<=ei&&i<all.length;i++){const b=all[i];b.dataset.continuationOf=sr.dataset.time;b.classList.add('cont');if(cat)setCatS(b,b.querySelector('.cat-tag'),cat);}
  autoSave();
}
function clearET(row){
  const st=row.dataset.time;delete row.dataset.endtime;
  const b=row.querySelector('.et-badge');if(b)b.remove();
  document.querySelectorAll(`.time-block[data-continuation-of="${st}"]`).forEach(b=>{delete b.dataset.continuationOf;b.classList.remove('cont');setCatS(b,b.querySelector('.cat-tag'),'');});
  autoSave();
}
function rrBadge(row,freq){
  let b=row.querySelector('.rr-badge');if(b)b.remove();
  if(freq){b=document.createElement('span');b.className='rr-badge';const L={DAILY:'Dagelijks',WEEKLY:'Wekelijks',BIWEEKLY:'2-wekelijks',MONTHLY:'Maandelijks'};b.textContent='herhaal: '+(L[freq]||freq);row.appendChild(b);}
}
function addTask(prio,text='',done=false){
  const list=document.getElementById('tl-'+prio);
  const item=document.createElement('div');item.className='task-item';
  const cb=document.createElement('input');cb.type='checkbox';cb.className='t-cb';cb.checked=done;
  const ta=document.createElement('textarea');ta.className='t-txt'+(done?' done':'');ta.rows=1;ta.value=text;ta.placeholder='Taak...';
  cb.onchange=()=>{ta.classList.toggle('done',cb.checked);autoSave();};
  ta.oninput=function(){this.style.height='auto';this.style.height=Math.max(18,this.scrollHeight)+'px';autoSave();};
  ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addTask(prio);setTimeout(()=>{const its=list.querySelectorAll('.t-txt');its[its.length-1].focus();},50);}};
  item.append(cb,ta);list.appendChild(item);
  if(!text)setTimeout(()=>ta.focus(),50);
  autoSave();
}
function addComm(type,text='',done=false){
  const list=document.getElementById('cl-'+type);
  const item=document.createElement('div');item.className='comm-item';
  const cb=document.createElement('input');cb.type='checkbox';cb.className='c-cb';cb.checked=done;
  const ta=document.createElement('textarea');ta.className='c-txt'+(done?' done':'');ta.rows=1;ta.value=text;
  const ph={bellen:'Naam / nummer...',mailen:'Naam / onderwerp...',bespreken:'Wie / onderwerp...'};ta.placeholder=ph[type]||'...';
  cb.onchange=()=>{ta.classList.toggle('done',cb.checked);autoSave();};
  ta.oninput=function(){this.style.height='auto';this.style.height=Math.max(16,this.scrollHeight)+'px';autoSave();};
  ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addComm(type);setTimeout(()=>{const its=list.querySelectorAll('.c-txt');its[its.length-1].focus();},50);}};
  item.append(cb,ta);list.appendChild(item);
  if(!text)setTimeout(()=>ta.focus(),50);
  autoSave();
}
function setMood(btn){document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');autoSave();}
const CHIP_COLORS={vrij:'#008972',vakantie:'#1C829E',studiedag:'#d4a000',ziek:'#EB6334',verjaardag:'#8B5CF6'};
function toggleChip(btn){
  const wasActive=btn.classList.contains('active');
  document.querySelectorAll('.day-chip').forEach(b=>b.classList.remove('active'));
  if(!wasActive) btn.classList.add('active');
  autoSave();
}
function getBannerData(){
  const chip=document.querySelector('.day-chip.active');
  const inp=document.getElementById('dayBannerInp').value.trim();
  return{type:chip?chip.dataset.type:'', text:inp};
}
function setBannerData(data){
  document.querySelectorAll('.day-chip').forEach(b=>b.classList.remove('active'));
  if(data&&data.type){
    const chip=document.querySelector(`.day-chip[data-type="${data.type}"]`);
    if(chip)chip.classList.add('active');
  }
  document.getElementById('dayBannerInp').value=(data&&data.text)||'';
}
function workedMins(){return document.querySelectorAll('.time-block.worked').length*15;}
function storedMins(dateStr){
  const raw=localStorage.getItem(sk(dateStr));if(!raw)return 0;
  try{const d=JSON.parse(raw);let c=0;if(d.slots)Object.values(d.slots).forEach(s=>{if(s&&s.worked)c++;});return c>0?c*15:Math.max(0,t2m(d.wEnd)-t2m(d.wStart));}catch(e){return 0;}
}
function updateHours(){
  document.getElementById('hToday').textContent=m2s(workedMins());
  if(!curDate)return;
  const d=pd(curDate),dow=d.getDay();
  const mon=new Date(d);mon.setDate(d.getDate()-(dow===0?6:dow-1));
  let wk=workedMins();
  for(let i=0;i<7;i++){const wd=new Date(mon);wd.setDate(mon.getDate()+i);const iso=toISO(wd.getFullYear(),wd.getMonth(),wd.getDate());if(iso!==curDate)wk+=storedMins(iso);}
  document.getElementById('hWeek').textContent=m2s(wk);
  const days=new Date(YEAR,d.getMonth()+1,0).getDate();let mo=0;
  for(let i=1;i<=days;i++){const iso=toISO(YEAR,d.getMonth(),i);mo+=iso===curDate?workedMins():storedMins(iso);}
  document.getElementById('hMonth').textContent=m2s(mo);
}
function setSyncStatus(s){
  const el=document.getElementById('syncStatus');if(!el)return;
  const map={idle:'',syncing:'Bezig...',ok:'Gesynchroniseerd',error:'Sync mislukt'};
  const col={idle:'rgba(255,255,255,.5)',syncing:'#FDCE43',ok:'#008972',error:'#EB6334'};
  el.textContent=map[s]||'';el.style.color=col[s]||'';
}
async function syncToCloud(key,value,retry=2){
  try{
    setSyncStatus('syncing');
    const res=await fetch(SYNC_URL,{
      method:'POST',
      body:JSON.stringify({key,value}),
      headers:{'Content-Type':'application/json'},
      mode:'no-cors'
    });
    setSyncStatus('ok');
    setTimeout(()=>setSyncStatus('idle'),3000);
  }catch(e){
    if(retry>0){
      setTimeout(()=>syncToCloud(key,value,retry-1),3000);
    }else{
      setSyncStatus('error');
      setTimeout(()=>setSyncStatus('idle'),5000);
    }
  }
}
async function syncAllFromCloud(){
  try{
    setSyncStatus('syncing');
    const res=await fetch(SYNC_URL+'?t='+Date.now());
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    let count=0;
    Object.entries(data).forEach(([k,v])=>{
      if(!k.startsWith('dp26_')||!v)return;
      let cd,ld;
      try{cd=JSON.parse(v);}catch{return;}
      try{ld=JSON.parse(localStorage.getItem(k));}catch{ld=null;}
      const ct=cd && cd.updatedAt||1;
      const lt=ld && ld.updatedAt||0;
      if(ct>lt){
        localStorage.setItem(k,v);
        count++;
      }
    });
    setSyncStatus('ok');
    setTimeout(()=>setSyncStatus('idle'),3000);
    return count;
  }catch(e){
    console.warn('Sync fout:',e.message);
    setSyncStatus('error');
    setTimeout(()=>setSyncStatus('idle'),5000);
    return 0;
  }
}
let _autoSyncInterval=null;
function startAutoSync(){
  if(_autoSyncInterval)clearInterval(_autoSyncInterval);
  _autoSyncInterval=setInterval(async()=>{
    const count=await syncAllFromCloud();
    if(count>0&&curDate){loadDay(curDate);updateHours();}
  },5*60*1000);
}
async function manualSync(){
  showTip('Synchroniseren...','Data wordt opgehaald. Even geduld.','#006077');
  const count=await syncAllFromCloud();
  if(count>0){if(curDate){loadDay(curDate);updateHours();}showTip('Gesynchroniseerd',`${count} dag(en) opgehaald.`,'#008972');}
  else showTip('Niets gevonden','Geen nieuwe data of geen verbinding.','#EB6334');
}
function saveDay(){
  if(!curDate)return;
  const slots={},tasks={},comms={};
  document.querySelectorAll('.time-block[data-time]').forEach(b=>{
    const ta=b.querySelector('.t-inp');
    slots[b.dataset.time]={val:ta?ta.value:'',cat:b.dataset.cat||'',worked:b.classList.contains('worked'),endtime:b.dataset.endtime||'',continuationOf:b.dataset.continuationOf||'',rrfreq:b.dataset.rrfreq||'',rrendtype:b.dataset.rrendtype||'',rrcount:b.dataset.rrcount||'',rruntil:b.dataset.rruntil||'',location:b.dataset.location||''};
  });
  ['hoog','midden','laag'].forEach(p=>{tasks[p]=[];document.querySelectorAll('#tl-'+p+' .task-item').forEach(it=>{tasks[p].push({text:it.querySelector('.t-txt').value,done:it.querySelector('.t-cb').checked});});});
  ['bellen','mailen','bespreken'].forEach(t=>{comms[t]=[];document.querySelectorAll('#cl-'+t+' .comm-item').forEach(it=>{comms[t].push({text:it.querySelector('.c-txt').value,done:it.querySelector('.c-cb').checked});});});
  const am=document.querySelector('.mood-btn.on');
  const banner=getBannerData();
  const obj={
    updatedAt:Date.now(),
    v:2, 
    intent:document.getElementById('intentInp').value,
    notes:document.getElementById('notesArea').value,
    mood:am?am.textContent:'',
    wStart:document.getElementById('wStart').value,
    wEnd:document.getElementById('wEnd').value,
    banner,slots,tasks,comms
  };
  const payload=JSON.stringify(obj);
  const hk=sk(curDate)+'_history';
  let hist=[];try{hist=JSON.parse(localStorage.getItem(hk))||[];}catch{}
  const old=localStorage.getItem(sk(curDate));if(old)hist.unshift(old);
  localStorage.setItem(hk,JSON.stringify(hist.slice(0,10)));
  localStorage.setItem(sk(curDate),payload);
  const hasContent=JSON.stringify(slots).length>50||document.getElementById('notesArea').value.trim();
  if(hasContent)syncToCloud(sk(curDate),payload);
}
let _st;function autoSave(){clearTimeout(_st);_st=setTimeout(saveDay,800);}
function clearUI(){
  document.querySelectorAll('.time-block').forEach(b=>{
    const ta=b.querySelector('.t-inp');if(ta){ta.value='';ta.style.height='';}
    const ct=b.querySelector('.cat-tag');if(ct)ct.textContent='';
    delete b.dataset.cat;delete b.dataset.endtime;delete b.dataset.continuationOf;
    delete b.dataset.rrfreq;delete b.dataset.rrendtype;delete b.dataset.rrcount;delete b.dataset.rruntil;delete b.dataset.location;
    b.classList.remove('worked','cont');
    ['et-badge','rr-badge','loc-badge'].forEach(cls=>{const el=b.querySelector('.'+cls);if(el)el.remove();});
  });
  ['hoog','midden','laag'].forEach(p=>document.getElementById('tl-'+p).innerHTML='');
  ['bellen','mailen','bespreken'].forEach(t=>document.getElementById('cl-'+t).innerHTML='');
  document.getElementById('intentInp').value='';
  document.getElementById('notesArea').value='';
  document.getElementById('wStart').value='08:00';
  document.getElementById('wEnd').value='16:30';
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById('hLoc').textContent='';
  setBannerData(null);
  const page=document.querySelector('.page');if(page)page.style.background='white';
}
var _x=1;var _y=2;var _z=3;var _w=4;var _v=5;
