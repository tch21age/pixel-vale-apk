'use strict';
/* =====================================================================
   ART TITLE (กลุ่ม 6): หน้าเริ่มเกม — ไม่แตะ logic/เซฟ/id เดิม
   - #titleBg: ฉากพิกเซลตอนพลบค่ำ (ท้องฟ้าไล่สีแบบ dither · ดาวกะพริบ · ดาวตก · พระจันทร์ · เมฆลอย ·
     เทือกเขา 2 ชั้น · เนินเขา+ต้นสน · บ้านมีควัน · หิ่งห้อย) + ฮีโร่ที่เลือกยืนบนเนิน (เฟรมจริงจาก HERO_ART)
     กดเลือกตัวละคร → ฮีโร่เปลี่ยนพร้อมท่าฟัน/ร่าย + ประกาย
   - #emblem: ตราสัญลักษณ์ดาบ+ต้นอ่อน 32x32 (GFX pipeline เดียวกับสไปรต์อื่น)
   - ปุ่ม "วิธีเล่น" สลับกับรายการสล็อต
   ประสิทธิภาพ: วาด ~30 fps เฉพาะตอนหน้านี้แสดงอยู่ (หยุดเมื่อ #title.hidden หรือแท็บถูกซ่อน)
   canvas ความละเอียดต่ำ (สูง ≈ 180 หน่วย) ขยายด้วย image-rendering:pixelated
   ===================================================================== */
(function(){
  const T=document.getElementById('title'),cv=document.getElementById('titleBg'),emb=document.getElementById('emblem');
  if(!T||!cv)return;
  const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const PI=Math.PI;

  /* ---------- ตัวช่วย ---------- */
  const mk=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const h2r=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const r2h=(r,gg,b)=>'#'+[r,gg,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  const lerp=(a,b,t)=>{const A=h2r(a),B=h2r(b);return r2h(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)};
  const cnv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;return [c,x]};
  function ell(x,cx,cy,rx,ry,col){x.fillStyle=col;const R=ry+.5;for(let y=-ry;y<=ry;y++){const hw=Math.floor(rx*Math.sqrt(Math.max(0,1-y*y/(R*R)))+.5);x.fillRect(cx-hw,cy+y,hw*2+1,1)}}

  /* ---------- ตราสัญลักษณ์ ---------- */
  function drawEmblem(){
    if(!emb||typeof GFX==='undefined')return;
    const L=GFX.layer(32,32,16,16),gold='#e0b84a';
    L.ell(0,0,14,14,gold);L.ell(0,0,12,12,'#2a1a4a');L.ell(0,1,11,10,'#3b2a6b');
    L.px(-1,-12,3,1,'#eef3ff');L.px(-2,-11,5,15,'#cfd8ee');L.px(0,-11,1,15,'#8fa0c8');       // ใบดาบ
    L.px(-8,4,17,2,gold);L.px(-8,4,17,1,'#ffe48a');L.px(-1,6,3,5,'#6b4423');L.px(-3,11,7,2,gold);  // การ์ด ด้าม หัวดาบ
    L.ell(-7,8,3,2,'#6fbf5a');L.ell(7,8,3,2,'#6fbf5a');L.px(-5,8,3,1,'#9be07a');L.px(3,8,3,1,'#9be07a');   // ต้นอ่อน 2 ใบ
    L.px(-9,-8,1,1,'#fff3c4');L.px(8,-6,1,1,'#fff3c4');L.px(-7,-3,1,1,'#bfe9ff');L.px(6,-10,1,1,'#bfe9ff');
    L.shade(1,.28,.3).outline(.74);
    const f=GFX.frame(L),k=emb.getContext('2d');k.imageSmoothingEnabled=false;k.clearRect(0,0,32,32);k.drawImage(f.c,0,0);
  }

  /* ---------- สถานะฉาก ---------- */
  let W=0,H=0,s=2,pt=0,hz=0,sky=null,land=null,fg=null,hx=0,hy=0,clouds=[],stars=[],flies=[],house=null;
  const parts=[];let shoot=null,nextShoot=3;
  let selG='m',selT=-9,smokeT=0;

  const SKY=['#14102e','#1d1a45','#2c2358','#432f6a','#65407a','#8f4f78','#c2646c','#ee8f62','#ffc27a'];
  const crestMid=x=>hz-16+Math.round(4*Math.sin(x*.035+1)+2*Math.sin(x*.09));
  const crestFront=x=>pt-3+Math.round(2*Math.sin(x*.05)+Math.sin(x*.13));

  function bakeSky(){
    const [c,x]=cnv(W,H);const N=SKY.length;
    for(let y=0;y<H;y++){
      const t=Math.min(1,y/hz)*(N-1),b=Math.min(N-2,Math.floor(t)),f=t-b;
      x.fillStyle=SKY[b];x.fillRect(0,y,W,1);
      if(f>.8){x.fillStyle=SKY[b+1];for(let i=(y&1);i<W;i+=2)x.fillRect(i,y,1,1)}     // dither ตรงรอยต่อแถบสี
    }
    // พระจันทร์ + แสงเรือง
    const mx=Math.round(W>260?W*.9:W*.8),my=Math.max(14,Math.min(28,Math.round(hz*.3)));
    x.globalAlpha=.07;ell(x,mx,my,21,21,'#fff3c4');x.globalAlpha=.1;ell(x,mx,my,16,16,'#fff3c4');x.globalAlpha=1;
    ell(x,mx,my,11,11,'#fff3c4');ell(x,mx,my,10,10,'#fffbe6');
    x.fillStyle='#e6d8ae';x.fillRect(mx-5,my-3,3,2);x.fillRect(mx+2,my+2,4,3);x.fillRect(mx-2,my+5,2,2);x.fillRect(mx+3,my-6,2,2);
    return c;
  }
  function ridge(x,seed,base,amp,col,rim,p){
    const r=mk(seed),p1=r()*6,p2=r()*6;
    for(let i=0;i<W;i++){
      const h=amp*(.62*(1-Math.abs(Math.sin(i*p+p1)))+.3*(1-Math.abs(Math.sin(i*p*2.6+p2)))+.08*r());
      const top=Math.round(base-h);x.fillStyle=col;x.fillRect(i,top,1,H-top);
      x.fillStyle=rim;x.fillRect(i,top,1,1);
    }
  }
  function pine(x,cx,by,h,col,hi){
    for(let i=0;i<h;i++){const w=1+Math.floor(i*.7);x.fillStyle=(i%4===1)?hi:col;x.fillRect(cx-(w>>1),by-h+i,w,1)}
    x.fillStyle='#2a1c18';x.fillRect(cx,by,1,2);
  }
  function bakeLand(){
    const [c,x]=cnv(W,H);const r=mk(11);
    const mtH=Math.min(60,Math.max(24,Math.round(hz*.62)));
    ridge(x,3,hz-6,mtH,'#5a3f7e','#9a6a90',.021);        // เทือกเขาไกล (เจือสีฟ้าพลบ)
    ridge(x,9,hz-2,mtH*.7,'#352a62','#5c4a8c',.034);      // เทือกเขาใกล้
    // เนินกลาง + ต้นสน + บ้าน
    for(let i=0;i<W;i++){const y=crestMid(i);x.fillStyle='#27493f';x.fillRect(i,y,1,H-y);x.fillStyle='#4a7a58';x.fillRect(i,y,1,1)}
    for(let i=4;i<W-4;i+=5+Math.floor(r()*7)){if(r()<.2)continue;pine(x,i,crestMid(i)+1,6+Math.floor(r()*5),'#183a32','#245044')}
    const hxm=Math.round(W>260?W*.78:W*.66),hym=crestMid(hxm)+1;
    x.fillStyle='#1a1428';x.fillRect(hxm-6,hym-9,12,9);x.fillStyle='#2a1c18';
    for(let i=0;i<7;i++){x.fillStyle=i%2?'#6b3a2a':'#8a4a34';x.fillRect(hxm-8+i,hym-9-i+(i>3?(i-3)*2:0),16-i*2,1)}   // หลังคา
    x.fillStyle='#ffd77a';x.fillRect(hxm-4,hym-6,2,2);x.fillRect(hxm+2,hym-6,2,2);x.fillStyle='#ff9a4a';x.fillRect(hxm-4,hym-5,2,1);x.fillRect(hxm+2,hym-5,2,1);
    x.fillStyle='#3a2420';x.fillRect(hxm+4,hym-14,2,4);                                                                   // ปล่องไฟ
    house={x:hxm+5,y:hym-15};
    // เนินหน้า (ฮีโร่ยืน)
    for(let i=0;i<W;i++){
      const y=crestFront(i);x.fillStyle='#3d6b46';x.fillRect(i,y,1,H-y);
      x.fillStyle='#b0c468';x.fillRect(i,y,1,1);x.fillStyle='#6fa05a';x.fillRect(i,y+1,1,1);
      x.fillStyle='#2f5a3c';x.fillRect(i,y+5,1,H-y-5);x.fillStyle='#23462f';x.fillRect(i,y+14,1,H-y-14);
    }
    // ดอกไม้เล็ก ๆ
    for(let n=0;n<Math.round(W/9);n++){const fx=Math.floor(r()*W),fy=crestFront(fx)+2+Math.floor(r()*5);x.fillStyle=['#fff3c4','#ff9ad5','#ffd35a','#bfe9ff'][n%4];x.fillRect(fx,fy,1,1)}
    return c;
  }
  function bakeFg(){
    const [c,x]=cnv(W,H);const r=mk(5);
    for(let i=0;i<W;i+=2+Math.floor(r()*3)){const y=crestFront(i)+1,h=2+Math.floor(r()*3);x.fillStyle='#8ab85a';x.fillRect(i,y-h,1,h);x.fillStyle='#b0c468';x.fillRect(i+1,y-h+1,1,h-1)}
    return c;
  }
  function bakeCloud(w,h,seed){
    const [c,x]=cnv(w,h);const r=mk(seed);
    for(let i=0;i<5;i++){const rx=5+Math.floor(r()*7),ry=2+Math.floor(r()*3);ell(x,Math.round(6+i*(w-12)/4),h-4-Math.floor(r()*3)-ry+1,rx,ry,'#b58ac0')}
    x.fillRect(0,0,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='#f2a58a';x.fillRect(0,Math.round(h*.58),w,h);
    x.fillStyle='#ffd2a0';x.fillRect(0,Math.round(h*.78),w,h);
    return c;
  }

  function bake(){
    const cw=T.clientWidth,ch=T.clientHeight;if(!cw||!ch)return false;
    const win=T.querySelector('.win').getBoundingClientRect(),tr=T.getBoundingClientRect();
    s=Math.min(3,Math.max(1.6,Math.min(cw,ch)/180));
    W=Math.ceil(cw/s);H=Math.ceil(ch/s);cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;
    pt=Math.max(40,Math.round((win.top-tr.top)/s));hz=Math.min(H-10,pt+12);
    sky=bakeSky();land=bakeLand();fg=bakeFg();
    hx=Math.round(W*.17);hy=crestFront(hx);
    const r=mk(21);
    clouds=[0,1,2,3].map(i=>({c:bakeCloud(46+i*6,15,30+i),x:r()*W,y:6+r()*Math.max(8,hz*.45),v:1.5+r()*3}));
    stars=[];for(let i=0;i<Math.round(W*hz/330);i++)stars.push({x:Math.floor(r()*W),y:Math.floor(r()*hz*.62),ph:r()*6,sp:1+r()*2,big:r()<.12,c:['#fff3c4','#ffffff','#bfe9ff'][i%3]});
    flies=[];for(let i=0;i<14;i++)flies.push({x:r()*W,y:pt*.5+r()*(pt*.5+8),ax:3+r()*8,ay:2+r()*5,ph:r()*6,sp:.4+r()*.8});
    return true;
  }

  /* ---------- ฮีโร่บนเนิน ---------- */
  function heroFrame(t){
    if(typeof HERO_ART==='undefined')return null;
    const e=t-selT;
    try{
      if(e<.46){
        if(selG==='m')return HERO_ART.getFrame('m',0,'atk','d',Math.min(3,Math.floor(e/.115)));
        return HERO_ART.getFrame('f',0,'cast','d',0);
      }
      return HERO_ART.getFrame(selG,0,'walk','d',0);
    }catch(err){return null}
  }
  function spark(n){
    for(let i=0;i<n;i++)parts.push({x:hx+(Math.random()-.5)*14,y:hy-16-Math.random()*20,vx:(Math.random()-.5)*20,vy:-10-Math.random()*22,life:.5+Math.random()*.4,t:0,c:['#fff3c4','#ffd35a','#bfe9ff','#ffffff'][i%4]});
  }
  function select(gn,first){
    if(gn===selG&&!first)return;selG=gn;selT=performance.now()/1000;if(!first)spark(14);
  }

  /* ---------- วาดต่อเฟรม ---------- */
  let last=0,tPrev=0;
  function draw(t){
    const dt=Math.min(.1,t-tPrev);tPrev=t;
    g.drawImage(sky,0,0);
    for(const st of stars){const a=.45+.55*Math.sin(t*st.sp+st.ph);if(a<.25)continue;g.globalAlpha=a;g.fillStyle=st.c;g.fillRect(st.x,st.y,1,1);if(st.big&&a>.8){g.fillRect(st.x-1,st.y,3,1);g.fillRect(st.x,st.y-1,1,3)}}
    g.globalAlpha=1;
    // ดาวตก
    nextShoot-=dt;
    if(!shoot&&nextShoot<=0){shoot={x:W*(.2+Math.random()*.5),y:4+Math.random()*hz*.22,t:0};nextShoot=6+Math.random()*7}
    if(shoot){shoot.t+=dt;const k=shoot.t/.55,px=shoot.x-k*46,py=shoot.y+k*20;
      for(let i=0;i<7;i++){g.globalAlpha=Math.max(0,(1-k)*(1-i/7));g.fillStyle='#fff3c4';g.fillRect(Math.round(px+i*2.2),Math.round(py-i),1,1)}
      g.globalAlpha=1;if(k>=1)shoot=null}
    // เมฆ
    for(const c of clouds){c.x+=c.v*dt;if(c.x>W+4)c.x=-c.c.width-4;g.globalAlpha=.9;g.drawImage(c.c,Math.round(c.x),Math.round(c.y));}
    g.globalAlpha=1;
    g.drawImage(land,0,0);
    // ควันจากปล่องไฟ
    if(house){smokeT-=dt;if(smokeT<=0){smokeT=.55;parts.push({x:house.x,y:house.y,vx:3,vy:-6,life:2.2,t:0,c:'#b9a9c4',smoke:1})}}
    // เงา + ฮีโร่
    const f=heroFrame(t);
    if(f){
      g.globalAlpha=.32;for(let y=-2;y<=2;y++){const hw=Math.round(9*Math.sqrt(1-y*y/6.25));g.fillStyle='#0a0518';g.fillRect(hx-hw,hy+y,hw*2+1,1)}g.globalAlpha=1;
      const bob=(t-selT>.5&&Math.floor(t*1.6)%2)?-1:0;
      g.drawImage(f.b||f.c,Math.round(hx-f.ax),Math.round(hy-f.ay+bob));
    }
    g.drawImage(fg,0,0);
    // หิ่งห้อย
    for(const fl of flies){
      const x=fl.x+Math.sin(t*fl.sp+fl.ph)*fl.ax,y=fl.y+Math.cos(t*fl.sp*1.3+fl.ph)*fl.ay,a=.5+.5*Math.sin(t*2.2+fl.ph*3);
      g.globalAlpha=.18*a;g.fillStyle='#e8ff8a';g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);
      g.globalAlpha=.4+.6*a;g.fillRect(Math.round(x),Math.round(y),1,1);
    }
    g.globalAlpha=1;
    // อนุภาค (ประกาย/ควัน)
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i];p.t+=dt;if(p.t>=p.life){parts.splice(i,1);continue}
      p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.smoke)p.vy+=22*dt;
      const k=1-p.t/p.life;g.globalAlpha=p.smoke?.5*k:k;g.fillStyle=p.c;
      const sz=p.smoke?1+Math.floor((1-k)*2):1;g.fillRect(Math.round(p.x),Math.round(p.y),sz,sz);
      if(!p.smoke&&k>.6){g.fillRect(Math.round(p.x)-1,Math.round(p.y),3,1);g.fillRect(Math.round(p.x),Math.round(p.y)-1,1,3)}
    }
    g.globalAlpha=1;
  }
  function loop(ts){
    if(T.classList.contains('hidden')||document.hidden){setTimeout(()=>requestAnimationFrame(loop),300);return}
    if(!sky&&!bake()){requestAnimationFrame(loop);return}
    if(ts-last>=33){last=ts;draw(ts/1000)}
    requestAnimationFrame(loop);
  }

  /* ---------- เชื่อมกับ UI ---------- */
  let rt=0;const rebake=()=>{clearTimeout(rt);rt=setTimeout(()=>{sky=null},120)};      // bake ใหม่เมื่อขนาด/เลย์เอาต์เปลี่ยน
  addEventListener('resize',rebake);addEventListener('orientationchange',rebake);
  if(window.ResizeObserver){const w=T.querySelector('.win');if(w)new ResizeObserver(rebake).observe(w)}
  document.querySelectorAll('.gcard').forEach(b=>b.addEventListener('click',()=>select(b.dataset.g)));
  const on=document.querySelector('.gcard.on');selG=on?on.dataset.g:'m';select(selG,true);
  const hb=document.getElementById('howBtn');
  if(hb)hb.addEventListener('click',()=>{const o=T.classList.toggle('showhow');hb.textContent=o?'กลับ':'วิธีเล่น';rebake()});
  try{drawEmblem()}catch(e){}
  requestAnimationFrame(loop);
})();
