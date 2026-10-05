'use strict';
/* =====================================================================
   FLOW (v20): อนิเมชั่นตอนกดเข้าเกม + เมนูเกม (กลับไปหน้าเลือกเซฟ)
   - ห่อ startGame ชั้นนอกสุด: ม่านดำปิด → เริ่มเกมจริงหลังม่านปิด (เกมหยุดด้วย modal=true) → การ์ดชื่อ/เลเวล/ฉายา/โซน
     + แถบโหลด + เคล็ดลับ → ม่านเปิดออก → ปล่อยเกมเล่นต่อ · แตะจอเพื่อข้ามได้
   - ปุ่ม "เมนู" ใน HUD (และ ESC / ปุ่ม Back ของ Android) → เล่นต่อ / บันทึก / กลับหน้าเลือกเซฟ
   - กลับหน้าเลือกเซฟ = บันทึก แล้วรีโหลดหน้า (รีเซ็ตสถานะทุกโมดูลสะอาด ไม่ต้องไล่ล้างทีละไฟล์)
   - ไม่แตะ logic/เซฟเดิม (pv_slot*, pv_x*) · โหลดหลังสุด
   ===================================================================== */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/</g,'&lt;');
  const TIPS=[
    'หันหน้าเข้าแปลงดินแล้วกด E เพื่อไถ → ปลูก → รดน้ำ → เก็บเกี่ยว',
    'ตกปลาได้ที่บ่อน้ำ — เห็น ! เมื่อไรรีบกด E',
    'ขวาสุดของฟาร์มคือป่าล่าสัตว์ ขวาสุดอีกครั้งคือถ้ำคริสตัล',
    'ตีบวกดาบและสกิลได้ที่ร้านค้า ใช้วัตถุดิบจากมอนสเตอร์',
    'เกมบันทึกอัตโนมัติทุก 8 วินาที — กดเมนูเพื่อกลับหน้าเลือกเซฟได้ทุกเมื่อ',
    'ยาฟื้น HP / MP อยู่ที่แถบไอเท็มปุ่ม 4 และ 5',
    'ล้มในสนามรบจะเสียทอง 15% — พกยาไว้เสมอ'
  ];

  /* ---------- สร้าง DOM ---------- */
  const intro=document.createElement('div');intro.id='intro';
  intro.innerHTML='<div class="cur t"></div><div class="cur b"></div>'
    +'<canvas class="stars" width="192" height="108"></canvas>'
    +'<div class="card th"><div class="ph"><canvas width="32" height="32"></canvas></div><div class="nm"></div><div class="tt"></div><div class="zn"></div><div class="ld"><i></i></div><div class="tip"></div></div>'
    +'<div class="skip th">แตะเพื่อข้าม</div>';
  document.body.appendChild(intro);

  const menu=$('gmenu');

  const bye=document.createElement('div');bye.id='byeFade';document.body.appendChild(bye);

  /* ---------- ฉากดาวพื้นหลังของอนิเมชั่น ---------- */
  const sc=intro.querySelector('.stars'),sg=sc.getContext('2d');
  const stars=Array.from({length:46},()=>({x:Math.random()*192|0,y:Math.random()*108|0,p:Math.random()*6.28,s:.6+Math.random()*1.6}));
  const flies=Array.from({length:10},()=>({x:Math.random()*192,y:60+Math.random()*60,v:4+Math.random()*8,p:Math.random()*6.28}));
  let raf=0,t0=0;
  function drawStars(ts){
    raf=requestAnimationFrame(drawStars);
    const t=(ts-t0)/1000;sg.clearRect(0,0,192,108);
    for(const s of stars){const a=.35+.65*Math.max(0,Math.sin(t*s.s*2+s.p));sg.fillStyle='rgba(255,243,196,'+a.toFixed(2)+')';sg.fillRect(s.x,s.y,1,1);if(a>.9)sg.fillRect(s.x-1,s.y,3,1),sg.fillRect(s.x,s.y-1,1,3)}
    for(const f of flies){f.y-=f.v/60;f.x+=Math.sin(t*2+f.p)*.25;if(f.y<-3){f.y=112;f.x=Math.random()*192}
      const a=.4+.6*Math.abs(Math.sin(t*3+f.p));sg.fillStyle='rgba(255,226,110,'+a.toFixed(2)+')';sg.fillRect(f.x|0,f.y|0,2,2)}
  }

  /* ---------- อนิเมชั่นเข้าเกม ---------- */
  let busy=false,timers=[],canSkip=false;
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);timers.push(id);return id};

  function fillCard(){
    let ti={name:'',color:'#ffd35a'};try{ti=TITLES.info()}catch(e){}
    intro.querySelector('.nm').textContent=P.name;
    const t=intro.querySelector('.tt');t.textContent='Lv.'+P.lv+(ti.name?'  « '+ti.name+' »':'');t.style.color=ti.color||'#ffd35a';
    intro.querySelector('.zn').textContent='ฟาร์ม · วันที่ '+S.day;
    intro.querySelector('.tip').textContent=TIPS[Math.random()*TIPS.length|0];
    const c=intro.querySelector('.ph canvas'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,32,32);
    try{const f=$('face');if(f&&f.width)g.drawImage(f,0,0,32,32)}catch(e){}
  }

  function endIntro(){
    timers.forEach(clearTimeout);timers=[];canSkip=false;
    cancelAnimationFrame(raf);
    intro.className='';busy=false;
    modal=false;held.clear();pressQ.length=0;S.fade=.6;
    try{history.pushState({pv:1},'')}catch(e){}
  }
  function openCurtain(){
    if(!canSkip)return;canSkip=false;
    timers.forEach(clearTimeout);timers=[];
    try{[523,784].forEach((f,i)=>tone(f,f,.1,'square',.04,i*.08))}catch(e){}
    intro.classList.add('open');
    later(endIntro,650);
  }
  intro.addEventListener('pointerdown',e=>{e.preventDefault();openCurtain()});

  const _sg=startGame;
  startGame=function(cont){
    if(busy)return;busy=true;
    try{audioInit();const de=document.documentElement;de.requestFullscreen&&de.requestFullscreen().catch(()=>{});screen.orientation&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}
    intro.className='on';void intro.offsetWidth;intro.classList.add('cover');
    t0=performance.now();raf=requestAnimationFrame(drawStars);
    try{[392,523,659,784].forEach((f,i)=>tone(f,f,.12,'square',.04,i*.09))}catch(e){}
    later(()=>{
      try{_sg(cont)}catch(err){console.error(err);endIntro();return}
      modal=true;held.clear();            // เกมหยุดระหว่างอนิเมชั่น
      fillCard();intro.classList.add('rdy');
      later(()=>{canSkip=true},500);                    // แตะข้ามได้หลังผ่านไปครึ่งวินาที
      later(()=>{canSkip=true;openCurtain()},1500);     // ครบเวลา → ม่านเปิดเอง
    },460);
  };

  /* ---------- เมนูเกม ---------- */
  const mb=$('menubtn');

  const menuOpen=()=>!menu.classList.contains('hidden');
  const titlesOpen=()=>{const t=$('titles');return t&&!t.classList.contains('hidden')};
  function openMenu(){
    if(!running||modal||busy||titlesOpen()||menuOpen())return false;
    modal=true;held.clear();pressQ.length=0;
    try{save()}catch(e){}
    const slot=(typeof X!=='undefined'&&X.slot)||1;
    let ti={name:'',color:'#ffd35a'};try{ti=TITLES.info()}catch(e){}
    $('gmWho').innerHTML='<b class="nm">'+esc(P.name)+'</b><span class="lv">Lv.'+P.lv+'</span><em style="color:'+ti.color+'">« '+esc(ti.name)+' »</em><small>ช่องเซฟ '+slot+' · '+P.gold+' G · วันที่ '+S.day+'</small>';
    try{const c=$('gmFace'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,32,32);g.drawImage($('face'),0,0,32,32)}catch(e){}
    try{window.syncSet&&syncSet()}catch(e){}
    $('gmHowBox').hidden=true;
    menu.classList.remove('hidden');
    try{SFX.click()}catch(e){}
    return true;
  }
  function closeMenu(){
    if(!menuOpen())return;
    menu.classList.add('hidden');modal=false;held.clear();pressQ.length=0;
    try{SFX.click()}catch(e){}
  }
  mb.addEventListener('click',()=>{audioInit();openMenu()});
  $('gmResume').addEventListener('click',closeMenu);
  $('gmClose').addEventListener('click',closeMenu);
  $('gmQuest').addEventListener('click',closeMenu);
  $('gmTitles').addEventListener('click',()=>{closeMenu();const p=$('ptitle');if(p)p.click()});
  const hb=$('gmHowBox'),src=document.querySelector('#title .how');if(src)hb.innerHTML=src.innerHTML;
  $('gmHow').addEventListener('click',()=>{hb.hidden=!hb.hidden;try{SFX.click()}catch(e){}if(!hb.hidden)hb.scrollIntoView({block:'nearest'})});
  menu.addEventListener('click',e=>{if(e.target===menu)closeMenu()});
  $('gmSave').addEventListener('click',()=>{try{save();toast('บันทึกเกมแล้ว',1600);SFX.coin()}catch(e){}});
  $('gmExit').addEventListener('click',()=>{
    try{save()}catch(e){}
    running=false;                                  // กัน popstate/pagehide ทำงานซ้ำ
    $('gmExit').disabled=true;bye.classList.add('on');
    try{[523,392,330].forEach((f,i)=>tone(f,f,.12,'square',.04,i*.08))}catch(e){}
    setTimeout(()=>{
      try{if(history.state&&history.state.pv)history.back()}catch(e){}
      setTimeout(()=>location.reload(),60);
    },420);
  });

  /* ESC สลับเปิด/ปิดเมนู (ดักก่อน handler เดิมที่ปิดร้านค้า) */
  addEventListener('keydown',e=>{
    if(e.code!=='Escape'||e.repeat)return;
    if(document.activeElement&&document.activeElement.tagName==='INPUT')return;
    if(menuOpen()){closeMenu();e.stopImmediatePropagation();e.preventDefault();return}
    if(openMenu()){e.stopImmediatePropagation();e.preventDefault()}
  },true);

  /* ปุ่ม Back ของ Android (WebView ย้อนประวัติ) → เปิด/ปิดเมนู แทนการปิดแอป */
  try{
    if(history.state&&history.state.pv)history.back();   // รีโหลดมาแล้วมี entry ค้าง: เก็บกวาด
    addEventListener('popstate',()=>{
      if(!running)return;
      try{history.pushState({pv:1},'')}catch(e){}
      if(menuOpen())closeMenu();else openMenu();
    });
  }catch(e){}
})();

/* v21: หน้าเปิดแอป (#boot) — แตะเพื่อข้าม แล้วลบทิ้งเมื่ออนิเมชั่นจบ */
(function(){
  const b=document.getElementById('boot');if(!b)return;
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.classList.add('skip')});
  b.addEventListener('animationend',e=>{if(e.animationName==='bootout')b.remove()});
  setTimeout(()=>{if(b.isConnected)b.remove()},4500);   // กันค้าง
})();
