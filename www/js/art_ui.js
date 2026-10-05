'use strict';
/* =====================================================================
   ART UI (กลุ่ม 5): ใบหน้า HUD ละเอียด 32x32 · มินิแมพ · ชื่อเหนือหัว
   - ทับ faceTo/drawFace (ภาพล้วน) — เปลี่ยนความละเอียด canvas #face และการ์ดเลือกตัวละครเป็น 32x32 (id เดิม)
   - มินิแมพ: <canvas id="minimap"> ใหม่ bake พื้นแมพต่อโซนครั้งเดียว วาดเฉพาะจุดเคลื่อนไหวทุก ~120ms
   - ชื่อผู้เล่น/มอนสเตอร์: เพิ่มเข้า EXTRA_DRAW (ตัวอักษรขาวขอบเข้ม)
   ===================================================================== */
(function(){
  const HP=HERO_PAL,cache={};
  /* ---------- ใบหน้า ---------- */
  function portrait(g,wl){
    const key=g+wl;if(cache[key])return cache[key];
    const Lk=LOOK[g],L=GFX.layer(32,32,16,17),hair=Lk.hair,hh=Lk.hairH,sk=HP.skin;
    // เสื้อ/ไหล่
    L.px(-10,11,20,6,Lk.tun);L.px(-10,11,20,1,Lk.tunD);L.px(-3,9,6,3,sk);
    // ผมด้านหลัง
    if(g==='f'){L.px(-13,-6,5,22,hair);L.px(8,-6,5,22,hair);L.ell(0,-2,12,11,hair)}
    else L.ell(0,-2,12,10,hair);
    // หน้า
    L.ell(0,1,10,9,sk);L.px(-12,1,2,4,sk);L.px(10,1,2,4,sk);L.px(-8,8,16,1,'#e4a67e');
    // ผมหน้า
    L.px(-11,-9,22,5,hair);L.px(-11,-5,4,7,hair);L.px(7,-5,4,7,hair);L.px(-3,-5,8,2,hair);
    L.px(-6,-11,5,3,hh);L.px(2,-11,5,3,hh);L.px(-9,-9,3,1,hh);
    // ตา = จุดเข้ม · แก้ม · ปาก
    L.px(-5,1,2,3,HP.eye);L.px(3,1,2,3,HP.eye);L.px(-5,1,1,1,'#ffffff');L.px(3,1,1,1,'#ffffff');
    L.px(-8,5,3,2,HP.blush);L.px(5,5,3,2,HP.blush);L.px(-1,6,3,1,HP.mouth);
    // อุปกรณ์ตามระดับดาบ
    if(g==='m'){
      if(wl>=2){L.ell(0,-8,12,6,HP.steel);L.px(-12,-8,24,2,HP.steelD);L.px(-1,-6,3,8,HP.steelD);
        if(wl>=3)L.px(-1,-18,4,8,HP.plume);if(wl>=5){L.px(-12,-5,24,1,HP.gold)}}
      else if(wl===1){L.ell(0,-8,12,5,HP.leather);L.px(-12,-6,24,2,'#5e3b20')}
      else{L.px(-12,-7,24,3,Lk.scarf);L.px(-12,-5,24,1,Lk.scarfD);L.px(10,-6,5,3,Lk.scarf)}
    }else{
      if(wl>=1){const hc='#4a3a8a',hl='#6a58b8',tall=wl>=2;
        L.ell(0,-8,16,3,hc);
        for(let i=0;i<(tall?12:6);i++){const w=Math.max(2,14-i*(tall?1:2));L.px(-w/2|0,-10-i,w,1,i%3?hc:hl)}
        L.px(-12,-9,24,2,wl>=5?HP.gold:'#2e2460');if(wl>=3)L.px(-1,-9,3,2,'#6fd6ff');if(wl>=4&&tall)L.px(-1,-24,3,3,'#ffe066')}
      else{L.px(5,-12,6,5,HP.pink);L.px(11,-11,3,3,HP.pink);L.px(8,-10,2,2,'#d0508a')}
    }
    if(wl>=6){const ac=BLADE[wl],gd=wl>=10?'#ffd23f':ac;      // v16: ลุคฮีโร่ — อัญมณี/ปีกสีตามดาบ
      if(g==='m'){L.px(-15,-12,4,2,gd);L.px(-17,-14,3,2,gd);L.px(11,-12,4,2,gd);L.px(14,-14,3,2,gd);L.px(-1,-7,3,3,gd);L.px(0,-7,1,1,'#ffffff')}
      else{L.px(-12,-11,24,1,gd);L.px(-1,-26,3,3,gd);if(wl>=8)L.px(-13,-9,3,3,gd),L.px(10,-9,3,3,gd)}}
    L.shade(1,.28,.3).outline(.74);
    return cache[key]=GFX.frame(L);
  }
  window.faceTo=faceTo=function(c,g){
    c.width=32;c.height=32;const k=c.getContext('2d');k.imageSmoothingEnabled=false;k.clearRect(0,0,32,32);
    k.drawImage(portrait(g,g===P.g?(P.wl||0):0).c,0,0);
  };
  window.drawFace=drawFace=()=>faceTo($('face'),P.g);
  document.querySelectorAll('.gcard').forEach(b=>faceTo(b.querySelector('canvas'),b.dataset.g));
  try{drawFace()}catch(e){}

  /* ---------- มินิแมพ ---------- */
  const mm=document.getElementById('minimap'),mg=mm.getContext('2d'),MS=4,bg={};
  mm.width=W*MS;mm.height=H*MS;mg.imageSmoothingEnabled=false;
  function mapBg(id){
    if(bg[id])return bg[id];
    const z=Z(),[c,g]=mkCanvas(W*MS,H*MS);
    const col={g:id==='cave'?'#3c3856':id==='farm'?'#6a8a3a':'#4c6c36',p:id==='cave'?'#5c5675':'#a98458',w:'#3d6fa8'};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){g.fillStyle=col[z.t[y][x]]||col.g;g.fillRect(x*MS,y*MS,MS,MS)}
    const objs=new Set();
    z.objs.forEach(o=>{if(o.k==='tree'||o.k==='rock'){const x=o.x/T,y=o.b/T-1;objs.add(x+','+y);
      g.fillStyle=o.k==='rock'?'#8e8c9a':o.dead?'#5a4a3a':id==='cave'?'#46425e':'#2f5a2c';g.fillRect(x*MS,y*MS,MS,MS)}});
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(z.solid[y][x]&&z.t[y][x]!=='w'&&!objs.has(x+','+y)){
      g.fillStyle=z.inter[y][x]==='shop'?'#c8453f':'#9c4226';g.fillRect(x*MS,y*MS,MS,MS)}}
    g.fillStyle='rgba(8,6,20,.55)';g.fillRect(0,0,W*MS,1);g.fillRect(0,H*MS-1,W*MS,1);g.fillRect(0,0,1,H*MS);g.fillRect(W*MS-1,0,1,H*MS);
    return bg[id]=c;
  }
  const dot=(x,y,s,c)=>{mg.fillStyle='#0b0b12';mg.fillRect(Math.round(x/T*MS-s/2)-1,Math.round(y/T*MS-s/2)-1,s+2,s+2);mg.fillStyle=c;mg.fillRect(Math.round(x/T*MS-s/2),Math.round(y/T*MS-s/2),s,s)};
  let lastT=0;
  function paintMini(){
    const now=performance.now();if(now-lastT<120)return;lastT=now;
    mm.style.display=running?'block':'none';if(!running)return;
    mg.clearRect(0,0,mm.width,mm.height);mg.drawImage(mapBg(zone),0,0);
    mg.strokeStyle='rgba(255,255,255,.55)';mg.lineWidth=1;mg.strokeRect(.5,camY/T*MS+.5,W*MS-1,CH/T*MS-1);
    if(zone==='farm')ANI.forEach(a=>dot(a.x,a.y-4,3,'#f0e6c8'));
    if(HZ())mons.forEach(m=>{if(!m.dead)dot(m.x,m.y-4,3,'#ff5a66')});
    dot(P.x,P.y-4,4,'#ffe066');
  }
  const _hud=hud;hud=function(){_hud();paintMini()};

  /* ---------- ชื่อเหนือหัว ---------- */
  const _ex=window.EXTRA_DRAW;
  window.EXTRA_DRAW=function(list){
    if(_ex)_ex(list);
    if(!running||P.dead)return;
    list.push({b:P.y+.5,f:()=>pixText(P.name||'',P.x,P.y-38+(P.wl>=2&&P.g==='f'?-5:0),'#ffffff',.85,true)});
    if(HZ())for(const m of mons){if(m.dead)continue;if(Math.hypot(m.x-P.x,m.y-P.y)>78)continue;
      const d=MON[m.type];if(d)list.push({b:m.y+.5,f:()=>{pixText(d.name,m.x,m.y-d.h-9,'#ffd7a8',.75,true);
        if(m.lv){const df=m.lv-P.lv;pixText('Lv.'+m.lv,m.x,m.y-d.h-16,df>=3?'#ff8a8a':df>=1?'#ffd23f':'#b9e8a0',.7,true)}}})}
  };
})();
