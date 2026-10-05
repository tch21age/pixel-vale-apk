'use strict';
/* =====================================================================
   ART FARM (v11): แปลงผัก · พืช 3 ชนิด × 4 ระยะ · ป้าย
   - ใช้ GFX pipeline เดียวกับกลุ่ม 2–4 (layer → shade 3 โทน → outline → frame) · bake ครั้งเดียวแล้ว drawImage
   - ไม่แตะ logic: ใช้ข้อมูล plots/state/stage/crop/watered เดิม · ทับเฉพาะ drawPlots / drawCrop / drawObj('sign')
   - ช่องดิน 16x16 logic = 32x32 art px · ต้นพืชยึดจุดยืนกลางช่อง (x+8, y+15) และยื่นขึ้นไปเหนือช่องได้เล็กน้อย
   ===================================================================== */
const FARM_PAL={
  soil:{
    raw:['#9a7a50','#8a6a44','#7a5c3a'],rawL:'#b08e60',rawD:'#6a4e32',
    dry:['#6f4d2c','#654525','#79562f'],dryRidge:'#85603a',dryRidgeL:'#9a7448',dryTrough:'#4b3119',
    wet:['#4a3220','#40291a','#523824'],wetRidge:'#5a4029',wetRidgeL:'#6c4f34',wetTrough:'#2c1c10',wetGlint:'#7fb0d8'
  },
  tuft:'#6f9a45',tuftL:'#9cc464',tuftD:'#4e7a2e',pebble:['#a98250','#c9a470','#7a5a38'],
  leaf:{base:'#4f9a46',hi:'#86d070',lo:'#2f6a34',dk:'#1f4a28'},
  seed:'#d6bf80',
  turnip:{top:'#a860d8',topL:'#d49cf0',body:'#f4ecff',bodyD:'#c6b8e0',root:'#d6c8f0'},
  tomato:{fruit:'#e0414f',fruitL:'#ff9aa4',fruitD:'#a02535',stake:'#a07040',stakeD:'#6a4626'},
  pumpkin:{body:'#f59a2a',bodyL:'#ffc060',bodyD:'#c06a12',groove:'#a85a0e',stem:'#6a8a3a',stemD:'#3f5a22'}
};
(function(){
  const P_=FARM_PAL,cache={};
  const hash=(a,b,c)=>{let h=(a*73856093)^(b*19349663)^(c*83492791);h=(h^(h>>>13))*1274126177;return((h^(h>>>16))>>>0)/4294967296};

  /* ---------- ดิน ---------- */
  // kind: 0 = ดินยังไม่ไถ · 1 = ไถแล้ว (แห้ง) · 2 = ไถแล้ว (เปียก) · v = 0..2 ความต่างต่อช่อง
  function soilFrame(kind,v){
    const key='s'+kind+'_'+v;if(cache[key])return cache[key];
    const rnd=mulberry(9000+kind*31+v*7),L=GFX.layer(32,32,0,0),S=P_.soil;
    const px=(x,y,w,h,c)=>L.px(x,y,w,h,c);
    if(kind===0){
      px(0,0,32,32,S.raw[v%3]);
      for(let i=0;i<46;i++){const x=Math.floor(rnd()*30),y=Math.floor(rnd()*30);px(x,y,2,1,rnd()<.5?S.raw[(v+1)%3]:S.raw[(v+2)%3])}
      for(let i=0;i<8;i++){const x=1+Math.floor(rnd()*28),y=1+Math.floor(rnd()*28);px(x,y,2,1,S.rawL);px(x,y+1,2,1,S.rawD)}
      // กระจุกหญ้าและก้อนกรวดเล็ก ๆ ให้รู้ว่ายังเป็นดินรก
      const tuft=(x,y)=>{px(x,y,1,3,P_.tuftD);px(x+2,y+1,1,2,P_.tuftD);px(x+1,y-1,1,4,P_.tuft);px(x+1,y-1,1,1,P_.tuftL)};
      tuft(4+Math.floor(rnd()*6),5+Math.floor(rnd()*6));tuft(18+Math.floor(rnd()*8),17+Math.floor(rnd()*8));
      if(rnd()<.7)tuft(8+Math.floor(rnd()*14),24+Math.floor(rnd()*4));
      const pc=P_.pebble;for(let i=0;i<2;i++){const x=3+Math.floor(rnd()*24),y=3+Math.floor(rnd()*24);px(x,y,3,2,pc[2]);px(x,y,3,1,pc[1]);px(x,y,1,1,pc[0])}
    }else{
      const wet=kind===2,B=wet?S.wet:S.dry,rid=wet?S.wetRidge:S.dryRidge,ridL=wet?S.wetRidgeL:S.dryRidgeL,tr=wet?S.wetTrough:S.dryTrough;
      px(0,0,32,32,B[v%3]);
      // ร่องไถ 3 แถว (สันดินนูน + ร่องมืด)
      for(let k=0;k<3;k++){
        const y=3+k*10;
        px(1,y+4,30,3,tr);                 // ร่อง
        px(1,y,30,4,rid);                  // สัน
        px(1,y,30,1,ridL);                 // ขอบสว่างบนสัน
        px(1,y+3,30,1,B[(v+1)%3]);
        for(let i=0;i<7;i++){const x=1+Math.floor(rnd()*28);px(x,y+1,2,1,B[(v+2)%3]);if(rnd()<.5)px(x+3,y+2,1,1,ridL)}
      }
      if(wet){                             // ประกายน้ำและเงาเปียก
        for(let i=0;i<6;i++){const x=2+Math.floor(rnd()*26),y=2+Math.floor(rnd()*26);px(x,y,2,1,S.wetGlint);px(x+1,y+1,1,1,'rgba(127,176,216,.45)')}
      }else{
        for(let i=0;i<5;i++){const x=2+Math.floor(rnd()*26),y=2+Math.floor(rnd()*26);px(x,y,1,1,'#a8825a')}
      }
    }
    L.shade(1,.22,.30);                    // ขอบบน/ซ้ายสว่าง ล่าง/ขวาเข้ม = เห็นเป็นกระเบื้องนูนเล็กน้อย
    return cache[key]=GFX.frame(L);
  }

  /* ---------- พืช: layer 40x46, จุดยืน (20,38) ---------- */
  const CW=40,CH_=46,CAX=20,CAY=38;
  function cropLayer(){return GFX.layer(CW,CH_,CAX,CAY)}
  function finish(L,key){L.shade(1,.26,.32).outline(.72);return cache[key]=GFX.frame(L)}
  const leaf=(L,x,y,w,h,flip)=>{          // ใบรี: ตัวใบ + สันสว่าง + ปลายเข้ม
    const lf=P_.leaf;L.ell(x,y,w,h,lf.base);L.px(x-w+1,y-h,w,1,lf.hi);L.px(x,y+h,Math.max(1,w-1),1,lf.lo);
    L.px(flip?x+w-2:x-w+1,y,w,1,lf.lo)};
  function sprout(L){
    const lf=P_.leaf;
    L.px(-1,-8,2,8,lf.lo);L.px(0,-8,1,8,lf.base);
    L.ell(-4,-9,3,2,lf.base);L.px(-6,-11,3,1,lf.hi);
    L.ell(4,-11,3,2,lf.base);L.px(2,-13,3,1,lf.hi);
  }
  function mound(L,seedOnly){
    L.ell(0,-1,7,2,'#7d5a36');L.ell(0,-2,5,2,'#8f6a40');L.px(-3,-4,4,1,'#a47c4c');
    if(seedOnly){L.px(-1,-4,3,2,P_.seed);L.px(-1,-4,1,1,'#f4e6b0')}
  }
  // ระยะ 2: ใบกว้างตามชนิด
  function growing(L,crop){
    const lf=P_.leaf;
    if(crop==='tomato'){
      L.px(-1,-24,2,24,lf.lo);L.px(0,-24,1,24,lf.base);
      L.px(5,-26,2,26,P_.tomato.stake);L.px(5,-26,1,26,'#c89558');           // หลักไม้ค้ำ
      leaf(L,-6,-8,5,3);leaf(L,6,-13,5,3,true);leaf(L,-6,-17,5,3);leaf(L,5,-21,4,3,true);leaf(L,-2,-26,4,3);
      L.px(2,-10,3,1,lf.lo);L.px(-4,-14,4,1,lf.lo);
    }else if(crop==='pumpkin'){
      L.px(-1,-10,2,10,lf.lo);L.px(0,-10,1,10,lf.base);
      leaf(L,-8,-6,8,4);leaf(L,9,-5,7,4,true);leaf(L,0,-15,7,5);leaf(L,-10,-12,4,3);
      L.px(-8,-6,14,1,lf.lo);L.px(2,-5,12,1,lf.lo);
      L.px(-2,-15,1,9,lf.lo);L.px(7,-16,5,1,lf.hi);
      L.line(7,-4,13,-8,P_.pumpkin.stem,1);L.px(13,-9,2,2,P_.pumpkin.stem);          // เถาเลื้อย
    }else{ // turnip: ใบกุหลาบแตกปลายหยัก
      L.px(-1,-14,2,14,lf.lo);L.px(0,-14,1,14,lf.base);
      leaf(L,-7,-12,6,3);leaf(L,7,-12,6,3,true);leaf(L,-4,-18,5,4);leaf(L,5,-19,5,4,true);leaf(L,0,-24,3,5);
      L.px(-12,-13,2,1,lf.hi);L.px(10,-13,2,1,lf.hi);L.px(-1,-28,1,2,lf.hi);
    }
  }
  // ระยะ 3: สุก
  function ripe(L,crop){
    const lf=P_.leaf;
    if(crop==='turnip'){
      const T=P_.turnip;
      // ใบเขียวยาวพุ่งขึ้น (ก้านกลาง + ใบข้าง)
      L.px(-8,-27,4,10,lf.lo);L.px(-7,-30,3,4,lf.base);L.px(-8,-31,2,2,lf.hi);
      L.px(-1,-31,4,14,lf.base);L.px(-1,-33,3,3,lf.hi);L.px(2,-30,1,13,lf.lo);
      L.px(5,-27,4,10,lf.lo);L.px(5,-30,3,4,lf.base);L.px(7,-31,2,2,lf.hi);
      L.px(-9,-24,2,5,lf.base);L.px(8,-24,2,5,lf.base);
      // หัวผักกาด: ส่วนบนม่วง ส่วนล่างขาว มีรากหาง
      L.ell(0,-9,10,9,T.body);L.ell(0,-14,10,5,T.top);L.px(-7,-18,7,2,T.topL);L.px(-9,-12,2,3,T.topL);
      L.px(0,-12,10,2,'#8a3fb8');L.px(-8,-7,5,3,'#fff');L.px(5,-4,5,3,T.bodyD);L.px(-5,-1,10,1,T.bodyD);
      L.px(-1,1,3,3,T.root);L.px(0,4,1,2,T.root);
      // ประกายรอยต่อสี
      L.px(-10,-12,20,1,'#7a3aa6');
    }else if(crop==='tomato'){
      const T=P_.tomato;
      L.px(5,-34,2,34,T.stake);L.px(5,-34,1,34,'#c89558');
      L.ell(0,-18,11,13,lf.lo);L.ell(-1,-20,10,11,lf.base);
      L.px(-9,-27,8,2,lf.hi);L.px(1,-31,8,2,lf.hi);L.px(-4,-22,7,1,lf.hi);
      const tom=(x,y,s)=>{L.ell(x,y,s,s,T.fruit);L.px(x-s+1,y-s+1,2,2,T.fruitL);L.px(x+s-2,y+s-1,2,1,T.fruitD);L.px(x-s+2,y+s-1,s*2-3,1,T.fruitD);L.px(x-1,y-s,3,1,lf.lo)};
      tom(-7,-12,4);tom(6,-17,4);tom(-3,-6,3);tom(8,-8,3);tom(-6,-23,3);tom(2,-13,3);
    }else{
      const T=P_.pumpkin;
      L.px(-12,-22,6,2,lf.lo);leaf(L,-12,-8,6,4);leaf(L,12,-6,5,4,true);L.line(10,-10,16,-16,T.stem,1);
      L.ell(0,-10,15,10,T.body);
      L.ell(-8,-10,8,10,T.body);L.ell(8,-10,8,10,T.body);                              // กลีบข้าง
      L.px(-16,-8,5,3,T.bodyD);L.px(11,-8,5,3,T.bodyD);
      L.px(-1,-20,2,20,T.groove);L.px(-9,-18,2,16,T.groove);L.px(7,-18,2,16,T.groove);  // ร่องฟัก
      L.px(-14,-14,5,2,T.bodyL);L.px(-6,-18,4,2,T.bodyL);L.px(2,-18,4,2,T.bodyL);L.px(-12,-16,2,3,T.bodyL);
      L.px(-12,-1,24,1,T.bodyD);L.px(-8,0,16,1,'#a85a0e');
      // ขั้ว
      L.px(-2,-24,4,5,T.stem);L.px(-3,-24,2,5,T.stemD);L.px(1,-26,4,3,T.stem);L.px(3,-28,2,2,T.stem);
    }
  }
  function cropFrame(crop,stage){
    const key='c'+crop+stage;if(cache[key])return cache[key];
    const L=cropLayer();
    if(stage===0)mound(L,true);
    else if(stage===1){mound(L,false);sprout(L)}
    else if(stage===2){mound(L,false);growing(L,crop)}
    else{mound(L,false);ripe(L,crop)}
    return finish(L,key);
  }

  /* ---------- hook: drawPlots / drawCrop ---------- */
  window.drawCrop=drawCrop=function(x,y,p){
    const f=cropFrame(p.crop||'turnip',p.stage);
    const sway=(p.stage>=2&&typeof S!=='undefined')?Math.sin(S.t*1.6+x*.31+y*.17)*.0:0;   // ปิดโยก (ภาพนิ่งคมกว่าบนจอเล็ก)
    GFX.drawShadow(ctx,x+8+sway,y+14,p.stage>=3&&p.crop==='pumpkin'?13:8,3);
    GFX.draw(ctx,f,x+8,y+15,false,null);
    if(p.stage===3&&Math.floor(S.t*3)%2===0){                                // ประกายสุก: ดาว 4 แฉก
      const sx=(x+12)*RS,sy=(y+2)*RS;
      GFX.ar(ctx,sx,sy-2,1,5,'#fff2a0');GFX.ar(ctx,sx-2,sy,5,1,'#fff2a0');GFX.ar(ctx,sx,sy,1,1,'#ffffff');
    }
  };
  window.drawPlots=drawPlots=function(){
    for(const k in plots){
      const p=plots[k],c=k.indexOf(','),tx=+k.slice(0,c),ty=+k.slice(c+1),x=tx*T,y=ty*T;
      const wet=p.state===2&&p.watered&&p.stage<3;
      const kind=p.state===0?0:(wet?2:1),v=Math.floor(hash(tx,ty,kind)*3);
      GFX.draw(ctx,soilFrame(kind,v),x,y,false,null);
      if(p.state===2)drawCrop(x,y,p);
    }
  };

  /* ---------- ป้าย: layer 44x56 จุดยืนที่โคนเสา ---------- */
  function signFrame(){
    if(cache.sign)return cache.sign;
    const L=GFX.layer(44,56,22,50),W=['#c89558','#a8743f','#7a5230','#5e3b20'];
    // เสา
    L.px(-2,-30,5,30,W[2]);L.px(-2,-30,1,30,W[1]);L.px(2,-30,1,30,W[3]);
    // ก้อนดิน/หญ้าที่โคนเสา
    L.ell(0,0,7,2,'#7a5a38');L.px(-6,-3,2,3,'#5b8a3c');L.px(-5,-5,1,3,'#7ab050');L.px(5,-2,2,2,'#5b8a3c');L.px(4,-4,1,3,'#7ab050');
    // แผ่นป้าย (ไม้กระดานต่อกัน 2 แผ่น) ปลายขวาเป็นหัวลูกศรชี้ไป
    L.px(-15,-44,29,16,W[1]);L.px(-15,-44,29,1,W[0]);L.px(-15,-37,29,1,W[3]);L.px(-15,-29,29,1,W[3]);
    L.px(14,-42,2,12,W[1]);L.px(16,-40,2,8,W[1]);L.px(18,-38,2,4,W[1]);L.px(14,-43,2,1,W[0]);
    L.px(-15,-43,1,14,W[0]);
    // ตะปู
    L.px(-13,-42,1,1,'#3a2616');L.px(-13,-31,1,1,'#3a2616');L.px(11,-42,1,1,'#3a2616');L.px(11,-31,1,1,'#3a2616');
    // ลายแกะสลักคล้ายตัวอักษร (ไม่ใช้ข้อความจริงเพื่อไม่ผูกกับภาษา)
    const ink='#f1e9d2',inkD='#d6c8a0';
    L.px(-10,-41,6,2,ink);L.px(-10,-41,2,6,ink);L.px(-10,-36,6,1,ink);L.px(-6,-39,1,4,ink);
    L.px(-2,-41,1,7,ink);L.px(-2,-41,4,1,ink);L.px(1,-41,1,3,ink);L.px(-2,-38,4,1,ink);
    L.px(5,-41,5,1,ink);L.px(5,-38,5,1,ink);L.px(5,-35,5,1,ink);L.px(5,-41,1,7,ink);
    L.px(-10,-34,19,1,inkD);
    // เส้นเสี้ยนไม้
    L.px(-8,-33,5,1,W[2]);L.px(3,-43,6,1,W[2]);
    L.shade(1,.28,.34).outline(.72);
    return cache.sign=GFX.frame(L);
  }
  const _do=drawObj;
  window.drawObj=drawObj=function(o){
    if(o.k==='sign'){
      const cx=o.x+8;
      if(typeof envShadow==='function')envShadow(ctx,cx,o.b-1,10,3);else GFX.drawShadow(ctx,cx,o.b-1,10,3);
      GFX.draw(ctx,signFrame(),cx,o.b,false,null);return;
    }
    return _do(o);
  };

  window.FARM_ART={soilFrame,cropFrame,signFrame};
  // bake ล่วงหน้าตอนว่าง (ไม่แย่งเฟรมเกม)
  setTimeout(()=>{
    for(let k=0;k<3;k++)for(let v=0;v<3;v++)GFX.later(()=>GFX.touch(soilFrame(k,v)));
    for(const c of ['turnip','tomato','pumpkin'])for(let s=0;s<4;s++)GFX.later(()=>GFX.touch(cropFrame(c,s)));
    GFX.later(()=>GFX.touch(signFrame()));
  },80);
})();
