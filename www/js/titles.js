'use strict';
/* ระบบฉายา (v13) — ฉายาเปลี่ยนตามเลเวล แสดงที่ HUD / เหนือหัว / ช่องเซฟ · กดที่ฉายาใน HUD เพื่อดูรายการทั้งหมด
   ไม่แตะ logic/เซฟเดิม: คำนวณจาก P.lv ล้วน ๆ (ไม่ต้องเก็บอะไรเพิ่มในเซฟ) */
(function(){
  /* [เลเวลเริ่ม, ชื่อฉายา, สี, ระดับความหายาก 0-4] */
  const TITLES=[
    [1,'มือใหม่แห่งป่า','#b8c0cc',0],
    [3,'ชาวสวนฝึกหัด','#9be07a',0],
    [5,'นักล่าหน้าใหม่','#7fd8ff',0],
    [8,'ผู้พิทักษ์หมู่บ้าน','#6fe3b0',1],
    [11,'อัศวินเดนป่า','#5fb4ff',1],
    [14,'จอมล่าสไลม์','#74f0d8',1],
    [18,'ผู้พิชิตถ้ำคริสตัล','#b49bff',2],
    [23,'เจ้าแห่งทุ่งรวงทอง','#ffd23f',2],
    [28,'ยอดนักรบผู้เกรียงไกร','#ff9a5a',2],
    [34,'ปรมาจารย์สายฟ้า','#ffe86a',2],
    [41,'ราชันไร้พ่าย','#ff6a8a',3],
    [49,'วีรบุรุษในตำนาน','#ff7ad9',3],
    [58,'จอมยุทธ์เหนือฟ้า','#8affc1',3],
    [70,'เทพเจ้าแห่งพงไพร','#7af7ff',4],
    [85,'ผู้พิชิตสวรรค์','#ffb347',4],
    [99,'จักรพรรดิป่าสวนบ่าวค๊อป','#ff5ad0',4]
  ];
  const RAR=['ธรรมดา','หายาก','เลิศล้ำ','ตำนาน','เหนือตำนาน'];
  function idx(lv){let i=0;for(let k=0;k<TITLES.length;k++)if(lv>=TITLES[k][0])i=k;return i}
  function info(lv){const i=idx(lv===undefined?P.lv:lv),t=TITLES[i];return{i,lv:t[0],name:t[1],color:t[2],rar:t[3]}}
  window.TITLES={list:TITLES,info,idx};

  /* ---------- HUD ---------- */
  const row=document.querySelector('#status .row');
  const el=document.createElement('button');el.id='ptitle';el.type='button';el.className='th';
  row.after(el);
  let lastI=-1;
  function paintHud(){const t=info();if(t.i===lastI)return;lastI=t.i;
    el.textContent='« '+t.name+' »';el.style.setProperty('--tc',t.color);el.dataset.r=t.rar}

  /* ---------- หน้ารายการฉายา ---------- */
  const m=document.createElement('div');m.id='titles';m.className='modal hidden';
  m.innerHTML='<div class="win panel"><div class="wt"><span>ฉายาของฉัน</span><button class="mini" id="titlesclose">X</button></div><div id="tcur"></div><div id="tlist"></div><div class="hint">ฉายาปลดล็อกอัตโนมัติเมื่อเลเวลถึง · แตะพื้นที่ว่างเพื่อปิด</div></div>';
  document.body.appendChild(m);
  const esc=s=>String(s).replace(/</g,'&lt;');
  function openTitles(){const c=info();
    document.getElementById('tcur').innerHTML='<div class="tc" data-r="'+c.rar+'" style="--tc:'+c.color+'"><small>ฉายาปัจจุบัน · '+RAR[c.rar]+'</small><b>'+esc(c.name)+'</b></div>';
    const nx=TITLES[c.i+1];
    document.getElementById('tlist').innerHTML=TITLES.map((t,k)=>{const got=P.lv>=t[0],cur=k===c.i;
      return '<div class="ti'+(got?'':' lock')+(cur?' cur':'')+'" data-r="'+t[3]+'" style="--tc:'+t[2]+'"><span class="lv">Lv.'+t[0]+'</span><span class="nm">'+(got?esc(t[1]):'???')+'</span><small>'+RAR[t[3]]+'</small></div>'}).join('')
      +(nx?'':'');
    m.classList.remove('hidden');const cu=m.querySelector('.ti.cur');if(cu)cu.scrollIntoView({block:'center'})}
  const close=()=>m.classList.add('hidden');
  el.addEventListener('click',openTitles);
  document.getElementById('titlesclose').addEventListener('click',close);
  m.addEventListener('click',e=>{if(e.target===m)close()});
  addEventListener('keydown',e=>{if(e.code==='Escape'&&!m.classList.contains('hidden'))close()});

  /* ---------- เลเวลอัปแล้วได้ฉายาใหม่ ---------- */
  const _gx=gainExp;
  gainExp=function(n,x,y){const before=idx(P.lv);_gx(n,x,y);const t=info();
    if(t.i>before){setTimeout(()=>{toast('ได้ฉายาใหม่! « '+t.name+' »',3200);
      ftext(P.x,P.y-58,t.name,t.color,2,2);
      try{burst(P.x,P.y-10,36,[t.color,'#fff','#ffd23f'],95,1.1,-10,2);fx.push({k:'ring',x:P.x,y:P.y-8,t:0,life:.8,gold:true})}catch(_){}
      if(m.classList.contains('hidden')===false)openTitles()},700)}};

  /* ชื่อเหนือหัว: ทำตอน load (หลัง world.js/art_ui.js ห่อ EXTRA_DRAW เสร็จ) */
  addEventListener('load',()=>{
  const _ex=window.EXTRA_DRAW;
  window.EXTRA_DRAW=function(list){
    if(_ex)_ex(list);
    if(!running||P.dead)return;
    const t=info();
    list.push({b:P.y+.51,f:()=>pixText(t.name,P.x,P.y-46+(P.wl>=2&&P.g==='f'?-5:0),t.color,.8,true)});
  };

  });

  /* ---------- ช่องเซฟ: โชว์ฉายาข้างเลเวล ---------- */
  const _rs=renderSlots;
  renderSlots=function(){_rs();const box=document.getElementById('slots');if(!box)return;
    box.querySelectorAll('.slotcard').forEach((c,i)=>{const d=readSlot(i+1);if(!d)return;const t=info(d.lv||1),s=c.querySelector('small');
      if(s)s.insertAdjacentHTML('afterend','<br><span class="stt" style="color:'+t.color+'">« '+t.name+' »</span>')})};
  if(document.getElementById('slots'))renderSlots();

  const _h=hud;hud=function(){_h();paintHud()};
  window.addEventListener('load',()=>{lastI=-1;paintHud()});
})();
