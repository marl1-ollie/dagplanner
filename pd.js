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
  const vtz=['BEGIN:VTIMEZONE','TZID:Europe/Amsterdam','BEGIN:STANDARD','TZNAME:CET','DTSTART:19701025T030000','TZOFFSETFROM:+0200','TZOFFSETTO:+0100','RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10','END:STANDARD','BEGIN:DAYLIGHT','TZNAME:CEST','DTSTART:19700329T020000','TZOFFSETFROM:+0100','TZOFFSETTO:+0200','RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3','END:DAYLIGHT','END:VTIMEZONE'].join('\r\n');
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
function buildRR(b){const f=b.dataset.rrfreq;if(!f)return null;let freq=f,int=1;if(f==='BIWEEKLY'){freq='WEEKLY';int=2;}let r=`FREQ=${freq}`;if(int>1)r+=`;INTERVAL=${int}`;if(b.dataset.rrendtype==='until'&&b.dataset.rruntil)r+=`;UNTIL=${b.dataset.rruntil.replace(/-/g,'')}T000000Z`;else r+=`;COUNT=${b.dataset.rrcount||10}`;return r;}
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
