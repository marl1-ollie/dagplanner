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
-e 


// end
