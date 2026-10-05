'use strict';
/* =====================================================================
   ART WARM (v8): แก้อาการกระตุกตอนฟัน/ใช้สกิล — ไม่แตะ logic
   สาเหตุเดิม: เฟรมท่าฟัน/ร่าย (≈28 เฟรม/ลุค) เอฟเฟกต์ และภาพขาววาบตอนโดนตี ถูก bake ครั้งแรกกลางการเล่น
   (getImageData ต่อเลเยอร์) + ข้อความชื่อ/ตัวเลขดาเมจใช้ strokeText ทุกเฟรม
   วิธีแก้:
   1) ตอนเริ่มเกมและทุกครั้งที่ลุคเปลี่ยน (ตีบวกดาบ) → ใส่คิว bake ฮีโร่ทุกเฟรม + ภาพขาววาบ ทำตอนว่างทีละชิ้น
   2) bake มอนสเตอร์ทุกตัว + ภาพขาววาบ/น้ำแข็ง/ง้างโจมตี ล่วงหน้าเช่นกัน
   3) bake เอฟเฟกต์สกิลที่ใช้ซ้ำทั้งหมด (FX_ART.warm)
   4) pixText: bake ข้อความเป็นสไปรต์แล้ว drawImage (แคชตามข้อความ/สี/ขนาด)
   ===================================================================== */
(function(){
  const VIEW=['d','s','s','u'];
  const HERO_TINT='rgba(255,255,255,.7)';
  const MON_TINTS=['rgba(255,255,255,.75)','rgba(140,210,255,.6)'],WIND_TINT='rgba(255,60,60,.4)';
  const HUMAN={goblin:1,skel:1,golem:1};
  const heroDone={};let monDone=false,fxDone=false,pixDone=false;

  function warmHeroFor(g,wl){
    if(typeof HERO_ART==='undefined')return;
    const key=g+wl;if(heroDone[key])return;heroDone[key]=1;
    const cur=VIEW[P.dir]||'d',views=[cur].concat(['d','s','u'].filter(v=>v!==cur));
    const jobs=[];
    const job=(pose,v,k)=>jobs.push(()=>{const f=HERO_ART.getFrame(g,wl,pose,v,k);GFX.touch(f);GFX.tinted(f,HERO_TINT)});
    for(const v of views){for(let k=0;k<4;k++)job('atk',v,k);job('cast',v,0)}   // ท่าที่กระตุกก่อน: ฟัน/ร่าย
    for(const v of views)for(let k=0;k<4;k++)job('walk',v,k);
    jobs.push(()=>{const f=HERO_ART.getFrame(g,wl,'dead','d',0);GFX.touch(f);GFX.tinted(f,HERO_TINT)});
    for(let i=jobs.length-1;i>=0;i--)GFX.later(jobs[i],true);
  }
  function warmMon(){
    if(monDone||typeof MON_ART==='undefined')return;monDone=true;
    const tintAll=(f,wind)=>{GFX.touch(f);MON_TINTS.forEach(t=>GFX.tinted(f,t));if(wind)GFX.tinted(f,WIND_TINT)};
    for(const type in MON_ART.WALKN){
      const n=MON_ART.WALKN[type],views=HUMAN[type]?['s','d','u']:['s'];
      for(const v of views){
        for(let k=0;k<n;k++)GFX.later(()=>tintAll(MON_ART.get(type,v,'walk',k)));
        GFX.later(()=>tintAll(MON_ART.get(type,v,'wind',0),true));
      }
    }
  }
  function warmFx(){if(fxDone||typeof FX_ART==='undefined'||!FX_ART.warm)return;fxDone=true;FX_ART.warm()}

  /* warm ตั้งแต่หน้าเริ่มเกม: ฮีโร่ทั้งสองเพศที่ดาบ +0 · มอนสเตอร์ · เอฟเฟกต์ · ข้อความ
     ระหว่างอยู่หน้าเริ่มเกมคิวใช้งบเต็ม (ไม่มีเฟรมให้กระตุก) · เริ่มเล่นแล้วค่อยคิวเฟรมของลุคปัจจุบัน (เช่นหลังตีบวกดาบ) */
  let warmedBoot=false;
  function boot(){
    if(warmedBoot)return;warmedBoot=true;
    ['m','f'].forEach(g=>warmHeroFor(g,P.wl||0));
    warmFx();warmMon();if(!pixDone){pixDone=true;pixWarm()}
  }
  setTimeout(boot,50);
  let wasRunning=false;
  setInterval(()=>{
    const run=typeof running!=='undefined'&&running;
    if(run&&!wasRunning)GFX.loadFor(2500);   // เพิ่งเริ่ม/โหลดเซฟ: bake ลุคปัจจุบันด้วยงบเต็มก่อน
    wasRunning=run;
    if(!run)return;
    warmHeroFor(P.g,P.wl||0);boot();
  },100);

  /* ---------- pixText แบบแคชเป็นสไปรต์ ----------
     - ข้อความ ASCII (ตัวเลขดาเมจ, +G, !, EXP ...) ประกอบจากสไปรต์ทีละตัวอักษร → ไม่ต้อง bake ใหม่เมื่อเลขเปลี่ยน
     - ข้อความไทย (ชื่อมอนสเตอร์/ชื่อผู้เล่น/ป้ายลอย) ใช้แคชทั้งสตริง (สระ/วรรณยุกต์ซ้อนกัน ห้ามแยกตัว)
     - ทั้งสองแบบ bake ล่วงหน้าตอนว่างสำหรับของที่ใช้บ่อย */
  let pixWarm=()=>{};
  window.pixTextFlush=()=>{};
  if(typeof pixText==='function'&&typeof Q!=='undefined'){
    const orig=pixText,whole=new Map(),glyphs=new Map(),ASCII=/^[\x20-\x7e]+$/;
    const FS=sc=>Math.max(1,Math.round(7*sc)),LW=sc=>Math.max(2,sc*1.6);
    function bakeBox(w,h){const c=document.createElement('canvas');c.width=w*Q;c.height=h*Q;const g=c.getContext('2d');g.setTransform(Q,0,0,Q,0,0);return [c,g]}
    function bake(s,col,sc,center,out){
      const k=Q,fs=FS(sc),lw=LW(sc),pad=Math.ceil(lw)+3;
      const m=document.createElement('canvas').getContext('2d');
      m.font='700 '+(fs*k)+'px Sarabun,sans-serif';
      const tw=m.measureText(s).width/k;let w=Math.ceil(tw)+pad*2;if(w%2)w++;const h=Math.ceil(fs*1.7)+pad*2;
      const [c,g]=bakeBox(w,h);
      g.font='700 '+fs+'px Sarabun,sans-serif';g.textAlign=center?'center':'left';g.textBaseline='top';
      g.lineJoin='round';g.lineWidth=lw;g.strokeStyle=out;g.fillStyle=col;
      const ox=center?w/2:pad;
      g.strokeText(s,ox,pad);g.fillText(s,ox,pad);
      return {c,w,h,ox,oy:pad};
    }
    function glyph(ch,col,sc,out){
      const key=ch+'|'+col+'|'+sc+'|'+out;let e=glyphs.get(key);if(e)return e;
      const k=Q,fs=FS(sc),lw=LW(sc),pad=Math.ceil(lw)+3;
      const m=document.createElement('canvas').getContext('2d');m.font='700 '+(fs*k)+'px Sarabun,sans-serif';
      const adv=m.measureText(ch).width/k,w=Math.ceil(adv)+pad*2,h=Math.ceil(fs*1.7)+pad*2;
      const [c,g]=bakeBox(w,h);
      g.font='700 '+fs+'px Sarabun,sans-serif';g.textAlign='left';g.textBaseline='top';
      g.lineJoin='round';g.lineWidth=lw;g.strokeStyle=out;g.fillStyle=col;
      g.strokeText(ch,pad,pad);g.fillText(ch,pad,pad);
      e={c,w,h,pad,adv};if(glyphs.size>600)glyphs.clear();glyphs.set(key,e);return e;
    }
    function drawAscii(s,x,y,col,sc,center,out){
      const gs=[];let total=0;
      for(const ch of s){const e=glyph(ch,col,sc,out);gs.push(e);total+=e.adv}
      let pen=center?x-total/2:x;
      for(const e of gs){ctx.drawImage(e.c,Math.round((pen-e.pad)*Q)/Q,y-e.pad,e.w,e.h);pen+=e.adv}
    }
    pixText=function(s,x,y,col,sc=1,center=false,out='#0b0b12'){
      try{
        s=String(s);x=Math.round(x);y=Math.round(y);
        if(ASCII.test(s))return drawAscii(s,x,y,col,sc,center,out);
        const key=s+'|'+col+'|'+sc+'|'+center+'|'+out;
        let e=whole.get(key);
        if(!e){e=bake(s,col,sc,center,out);if(whole.size>400)whole.clear();whole.set(key,e)}
        ctx.drawImage(e.c,x-e.ox,y-e.oy,e.w,e.h);
      }catch(err){orig(s,x,y,col,sc,center,out)}
    };
    /* bake ล่วงหน้า: ตัวเลข/สัญลักษณ์ในสีที่เกมใช้ + ชื่อมอนสเตอร์ + ชื่อผู้เล่น */
    pixWarm=function(){
      const O='#0b0b12',chars='0123456789+-!GEXPHM %';
      [['#ffffff',1],['#ffd23f',1],['#ffd23f',2],['#ff5a66',1],['#8ee05a',1],['#ff7a86',1],['#7fb6ff',1],['#9be0ff',1],['#ff5a4a',2]]
        .forEach(([c,sc])=>GFX.later(()=>{for(const ch of chars)glyph(ch,c,sc,O)}));
      if(typeof MON!=='undefined')for(const t in MON){const n=MON[t]&&MON[t].name;if(n)GFX.later(()=>{
        const key=n+'|#ffd7a8|0.75|true|'+O;if(!whole.has(key))whole.set(key,bake(n,'#ffd7a8',.75,true,O))})}
      GFX.later(()=>{const n=P.name||'',key=n+'|#ffffff|0.85|true|'+O;if(n&&!ASCII.test(n)&&!whole.has(key))whole.set(key,bake(n,'#ffffff',.85,true,O))});
    };
    if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{whole.clear();glyphs.clear()});
    window.pixTextFlush=()=>{whole.clear();glyphs.clear()};     // แคชข้อความ bake ตาม Q → ต้องล้างเมื่อ Q เปลี่ยน
  }

  /* ---------- เสียง ----------
     noise() เดิมสร้าง AudioBuffer ใหม่และวน Math.random() 5,000–15,000 รอบ ทุกครั้งที่ฟัน/ใช้สกิล (บล็อก main thread บนมือถือ)
     → สร้าง buffer เสียงรบกวนครั้งเดียวต่อ AudioContext แล้วใช้ซ้ำ (เสียงจางหายด้วย gain ramp แทนการจางใน buffer) */
  if(typeof noise==='function'&&typeof tone==='function'){
    let nbuf=null,nrate=0;
    function getNoise(){
      if(nbuf&&nrate===AC.sampleRate)return nbuf;
      nrate=AC.sampleRate;const n=Math.floor(nrate*.5);nbuf=AC.createBuffer(1,n,nrate);
      const a=nbuf.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;return nbuf;
    }
    let lastSfx=[];
    noise=function(d,v=.05,delay=0){
      if(!AC||muted)return;
      try{
        const t=AC.currentTime+delay,s=AC.createBufferSource(),g=AC.createGain();
        s.buffer=getNoise();g.gain.setValueAtTime(v,t);g.gain.linearRampToValueAtTime(.0001,t+d);
        s.connect(g);g.connect(AC.destination);s.start(t,Math.random()*.2,d+.02);
      }catch(e){}
    };
    /* เสียงชนิดเดียวกันซ้ำถี่ (ฟันรัว) ไม่ต้องสร้างโหนดทุกครั้ง: จำกัด 1 ครั้งต่อ 45 ms */
    const origS=SFX;
    ['slash','hit','spin','fire'].forEach(k=>{
      const f=origS[k];if(typeof f!=='function')return;let last=0;
      origS[k]=function(){const t=performance.now();if(t-last<45)return;last=t;return f.apply(this,arguments)};
    });
  }

  /* ---------- วัดผลบนเครื่องจริง: เปิดด้วย index.html?perf=1 ----------
     แสดง ms ต่อเฟรมล่าสุด/เฉลี่ย/สูงสุด และ "เฟรมช้า" (>24 ms) พร้อมสิ่งที่ผู้เล่นเพิ่งกด เพื่อไล่หาสาเหตุ */
  if(/[?&]perf=1/.test(location.search)){
    const box=document.createElement('div');
    box.style.cssText='position:fixed;left:4px;bottom:4px;z-index:99;background:rgba(0,0,0,.75);color:#9f9;font:10px monospace;padding:3px 5px;pointer-events:none;white-space:pre;max-width:60vw';
    document.body.appendChild(box);
    const log=[];let last=performance.now(),acc=[],worst=0,evt='';
    ['tryAttack','tryFire','trySpin','trySk3'].forEach(n=>{const o=window[n];if(typeof o==='function')window[n]=function(){evt=n+'@'+(performance.now()|0);return o.apply(this,arguments)}});
    (function tick(t){
      const dt=t-last;last=t;acc.push(dt);if(acc.length>60)acc.shift();if(dt>worst)worst=dt;
      if(dt>24){log.push(Math.round(dt)+'ms '+evt);if(log.length>5)log.shift()}
      const avg=acc.reduce((a,b)=>a+b,0)/acc.length;
      box.textContent='Q='+Q+' dt '+dt.toFixed(0)+' avg '+avg.toFixed(1)+' max '+worst.toFixed(0)+'\n'+log.join('\n');
      requestAnimationFrame(tick);
    })(last);
    setInterval(()=>{worst=0},5000);
  }
})();
