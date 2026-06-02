
/* COMM */
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

/* DAGBANNER */
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

/* HOURS */
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

/* SYNC */
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
      // Altijd overschrijven als cloud nieuwer is OF lokaal geen timestamp heeft
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

// Auto-sync elke 5 minuten
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

/* SAVE/LOAD */
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
    v:2, // versienummer zodat sync weet dat dit nieuwe data is
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

function applyS(time,val,cat){
  const b=document.querySelector(`.time-block[data-time="${time}"]`);if(!b)return;
  const ta=b.querySelector('.t-inp'),ct=b.querySelector('.cat-tag');
  if(ta&&!ta.value.trim()){ta.value=val;ta.style.height='auto';ta.style.height=Math.max(22,ta.scrollHeight)+'px';}
  if(!b.dataset.cat&&cat)setCatS(b,ct,cat);
}

function applyFixed(dateStr){
  const d=pd(dateStr),dow=d.getDay(),mo=d.getMonth();
  document.getElementById('hLoc').textContent=WL[dow]?'Locatie: '+WL[dow]:'';

  // Schoolvakantie / vrije dag banner automatisch
  const sf=SCHOOL_FREE[dateStr];
  if(sf){
    const bannerEl=document.getElementById('dayBannerInp');
    if(bannerEl&&!bannerEl.value){
      bannerEl.value=sf.label;
    }
    // Zet de juiste chip actief
    const typeMap={vakantie:'vakantie',feestdag:'vrij',roostervrij:'vrij'};
    const chipType=typeMap[sf.type]||'vrij';
    const chip=document.querySelector(`.day-chip[data-type="${chipType}"]`);
    if(chip&&!document.querySelector('.day-chip.active')) chip.classList.add('active');
    // Lichte achtergrond op de pagina
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

/* NAVIGATION */
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
