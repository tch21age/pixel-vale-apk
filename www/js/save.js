'use strict';
/* ระบบบันทึกตัวละคร 3 ช่อง (localStorage) — โหลดต่อจาก game.js */
const X={slot:1,stats:{},done:{},play:0,rain:0,rainT:60};
const fmtT=s=>{s=Math.floor(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+' ชม. '+m+' น.':m+' นาที'};
const SLOTKEY=i=>'pv_slot'+i;
const readSlot=i=>{try{return JSON.parse(localStorage.getItem(SLOTKEY(i)))}catch(e){return null}};
save=function(){if(!running)return;try{localStorage.setItem(SLOTKEY(X.slot),JSON.stringify({v:2,name:P.name,lv:P.lv,exp:P.exp,gold:P.gold,hp:P.hp,mp:P.mp,inv:P.inv,plots,minutes:S.minutes,day:S.day,sel:S.sel,stats:X.stats,done:X.done,play:X.play,at:Date.now()}))}catch(e){}};
load=function(){const d=readSlot(X.slot);if(!d)return false;
  P.name=d.name||'ฮีโร่';P.lv=d.lv||1;P.exp=d.exp||0;P.gold=d.gold||0;recalc();
  P.hp=Math.min(d.hp||P.maxHp,P.maxHp);P.mp=Math.min(d.mp||P.maxMp,P.maxMp);Object.assign(P.inv,d.inv||{});
  for(const k in d.plots||{})if(plots[k])Object.assign(plots[k],d.plots[k]);
  S.minutes=d.minutes||480;S.day=d.day||1;S.sel=d.sel||0;X.stats=d.stats||{};X.done=d.done||{};X.play=d.play||0;return true};
function renderSlots(){const box=document.getElementById('slots');if(!box)return;box.innerHTML='';
  for(let i=1;i<=3;i++){const d=readSlot(i),el=document.createElement('div');el.className='slotcard';
    el.innerHTML=d?`<div><b>${String(d.name).replace(/</g,'&lt;')}</b> <small>Lv.${d.lv}</small><br><span>${d.gold} G · วันที่ ${d.day} · เล่น ${fmtT(d.play)} · ภารกิจ ${Object.keys(d.done||{}).length}</span></div><button class="mini del">ลบ</button>`
      :`<div><b>ช่องที่ ${i}</b><br><span>ว่าง — แตะเพื่อสร้างตัวละครใหม่</span></div>`;
    el.onclick=e=>{if(e.target.classList.contains('del')){const b=e.target;if(b.dataset.s){try{localStorage.removeItem(SLOTKEY(i))}catch(_){}renderSlots()}else{b.dataset.s=1;b.textContent='แน่ใจ?';setTimeout(()=>{b.dataset.s='';b.textContent='ลบ'},2500)}return}X.slot=i;startGame(!!d)};
    box.appendChild(el)}}
addEventListener('load',()=>{const r=document.querySelector('#title .btnrow');r.style.display='none';
  const b=document.createElement('div');b.id='slots';r.before(b);
  document.getElementById('nameIn').insertAdjacentHTML('beforebegin','<div class="th" style="font-size:12px;color:#9aa3b8">ชื่อตัวละคร (ใช้กับช่องว่าง)</div>');renderSlots()});
addEventListener('pagehide',()=>save());
