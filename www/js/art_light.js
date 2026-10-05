'use strict';
/* =====================================================================
   ART LIGHT (กลุ่ม 3): เงา แสง บรรยากาศตามเวลา + บ้าน ร้านค้า สัตว์ฟาร์ม หมา
   - ENV_LIGHT(ctx,minutes,isHunt,zone): แทนบล็อก ambient เดิมใน render() (game.js เรียกถ้ามี)
     ใช้ fillRect สีเดียว + vignette ที่ cache แล้ว + แอ่งแสงรอบตัวละครตอนกลางคืน (drawImage) — ไม่มี shadowBlur/filter
   - ENV_SUN: เงามีทิศตามเวลา (เช้าเงาชี้ซ้าย เย็นชี้ขวา เที่ยงสั้น กลางคืนจาง)
   - ทับ drawHouse / drawShop / drawAni / drawDog ด้วยสไปรต์ bake จาก GFX (ไม่แตะ logic)
   ===================================================================== */
(function(){
  const hexOf=GFX.hex;
  /* ---------- keyframes สีบรรยากาศ: [ชั่วโมง, r,g,b, alpha] ---------- */
  const KF=[[0,20,28,84,.44],[4.5,20,28,84,.42],[6,150,90,130,.20],[7.5,255,190,140,.09],[9,255,240,210,0],
            [16,255,240,210,0],[17.5,255,160,70,.13],[19,150,70,110,.24],[20.5,20,28,84,.40],[24,20,28,84,.44]];
  function tint(h){
    for(let i=0;i<KF.length-1;i++){const a=KF[i],b=KF[i+1];if(h>=a[0]&&h<=b[0]){const t=(h-a[0])/(b[0]-a[0]);
      return a.slice(1).map((v,k)=>v+(b[k+1]-v)*t)}}
    return [0,0,0,0];
  }
  const nightK=h=>h>=20.5||h<4.5?1:h>=19?(h-19)/1.5:h<6?1-(h-4.5)/1.5:0;   // 0..1 ความมืด
  window.ENV_SUN={
    night:()=>nightK(S.minutes/60),
    /* ออฟเซ็ตเงา (หน่วย logic) และความจาง */
    off(){const h=Math.max(6,Math.min(18,S.minutes/60));return {dx:(h-12)*1.1,a:1-nightK(S.minutes/60)*.75,len:1+Math.abs(h-12)/6*.5}}
  };
  /* เงาวงรีมีทิศ: ใช้แทน GFX.drawShadow ในวัตถุถาวร */
  window.envShadow=function(g,x,y,rx,ry){
    const s=ENV_SUN.off();
    GFX.draw(g,GFX.shadow(Math.round(rx*s.len),ry),x+s.dx,y,false,null,s.a);
  };

  /* ---------- vignette + แอ่งแสง cache ---------- */
  let vig=null,pool=null;
  function mkVig(){const [c,g]=mkCanvas(VW,VH);
    const gr=g.createRadialGradient(VW/2,VH/2,VH*.38,VW/2,VH/2,VW*.62);
    gr.addColorStop(0,'rgba(8,6,20,0)');gr.addColorStop(1,'rgba(8,6,20,1)');g.fillStyle=gr;g.fillRect(0,0,VW,VH);return c}
  function mkPool(){const R=56,[c,g]=mkCanvas(R*2,R*2);
    const gr=g.createRadialGradient(R,R,2,R,R,R);
    gr.addColorStop(0,'rgba(255,200,110,.55)');gr.addColorStop(.5,'rgba(255,170,80,.22)');gr.addColorStop(1,'rgba(255,150,60,0)');
    g.fillStyle=gr;g.fillRect(0,0,R*2,R*2);return c}
  window.ENV_LIGHT=function(ctx,minutes,hz,zn){
    const h=minutes/60,t=tint(h),n=nightK(h);
    if(t[3]>0.002){ctx.fillStyle='rgba('+(t[0]|0)+','+(t[1]|0)+','+(t[2]|0)+','+t[3].toFixed(3)+')';ctx.fillRect(0,0,VW,CH)}
    if(!vig){vig=mkVig();pool=mkPool()}
    const dark=zn==='cave'?.5:hz?.3:0;
    const va=Math.min(.6,.16+n*.3+dark);
    ctx.globalAlpha=va;ctx.drawImage(vig,0,0,VW,CH>VH?VH:CH);ctx.globalAlpha=1;
    if(hz){ctx.fillStyle=zn==='cave'?'rgba(20,10,50,.18)':'rgba(20,10,40,.10)';ctx.fillRect(0,0,VW,CH)}
    // แอ่งแสงอุ่นรอบผู้เล่น (กลางคืน/ถ้ำ)
    const pl=Math.max(n,zn==='cave'?.8:0);
    if(pl>.05){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=pl*.9;
      ctx.drawImage(pool,Math.round(P.x-56),Math.round(P.y-camY-44));ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
  };

  /* ---------- helper bake ---------- */
  const cache={};
  function bake(key,w,h,ax,ay,fn,sh){
    if(cache[key])return cache[key];
    const L=GFX.layer(w,h,ax,ay);fn(L);if(sh!==false)L.shade(1,.26,.30);L.outline(.72);
    return cache[key]=GFX.frame(L);
  }
  const rect=(L,x,y,w,h,c)=>L.px(x,y,w,h,c);

  /* ---------- บ้าน ---------- */
  function houseFrame(night){
    return bake('house'+night,176,150,88,142,L=>{
      const wall='#e2d0a2',wallD='#cdb98a',wood='#7a5230',woodD='#5a3a20',stone='#8a8794';
      rect(L,24,-120,18,50,'#8d5c4c');rect(L,24,-120,18,4,'#6a4234');rect(L,26,-116,4,40,'#a87262');       // ปล่องไฟ
      rect(L,-60,-60,120,60,wall);rect(L,-60,-60,120,4,wood);                                                // ผนัง
      for(let i=0;i<4;i++)rect(L,-60+i*40,-56,4,52,wood);rect(L,-60,-24,120,3,wallD);                       // โครงไม้
      rect(L,-62,-10,124,10,stone);for(let i=0;i<8;i++)rect(L,-60+i*16,-8,2,8,'#6a6774');rect(L,-62,-10,124,2,'#b0adba'); // ฐานหิน
      for(let i=0;i<9;i++){const w=136-i*12,y=-62-i*6;rect(L,-w/2,y,w,6,i%2?'#b2502e':'#9c4226');            // หลังคากระเบื้อง
        for(let k=-w/2+4;k<w/2-4;k+=10)rect(L,k,y+2,5,2,i%2?'#c8683f':'#b2502e');}
      rect(L,-10,-116,20,4,'#6a2e1c');rect(L,-70,-60,140,4,'#6a2e1c');                                      // สันหลังคา/ชายคา
      // ประตูโค้ง
      rect(L,-13,-44,26,44,woodD);rect(L,-11,-42,22,42,wood);rect(L,-1,-42,2,42,woodD);L.ell(0,-42,11,5,wood);rect(L,6,-20,3,3,'#e0b84a');
      rect(L,-16,-2,32,3,'#a8a4b4');                                                                         // ขั้นบันได
      // หน้าต่าง
      [-46,26].forEach(wx=>{rect(L,wx,-48,22,22,woodD);rect(L,wx+2,-46,18,18,night?'#ffd070':'#8fd0ff');
        rect(L,wx+10,-46,2,18,woodD);rect(L,wx+2,-38,18,2,woodD);rect(L,wx+3,-45,6,4,night?'#fff0b0':'#d8f2ff');rect(L,wx-2,-26,26,3,wood)});
    });
  }
  const _dh=drawHouse;
  window.drawHouse=drawHouse=function(){
    const night=ENV_SUN.night()>.45?1:0;
    envShadow(ctx,48,63,40,6);
    GFX.draw(ctx,houseFrame(night),48,64,false,null);
  };

  /* ---------- ร้านค้า ---------- */
  function shopFrame(){
    return bake('shop',176,140,88,132,L=>{
      rect(L,-60,-70,120,70,'#6b4528');for(let i=0;i<4;i++)rect(L,-58,-62+i*14,116,2,'#533420');      // ผนังหลัง + ชั้นวาง
      rect(L,-64,-76,8,76,'#5a3a20');rect(L,56,-76,8,76,'#5a3a20');rect(L,-64,-76,2,76,'#7a5230');     // เสา
      // พ่อค้า
      L.ell(0,-46,7,7,'#f4c29c');rect(L,-8,-58,16,6,'#2f6fb0');rect(L,-8,-53,16,2,'#1f4f88');rect(L,-3,-46,2,2,'#1d1420');rect(L,3,-46,2,2,'#1d1420');
      rect(L,-8,-38,16,10,'#d9a13f');rect(L,-8,-38,16,2,'#e8bd62');
      // เคาน์เตอร์ + ของ
      rect(L,-60,-30,120,30,'#a07040');rect(L,-64,-36,128,7,'#c8955a');rect(L,-60,-4,120,4,'#7a5230');
      rect(L,-48,-48,8,12,'#e0414f');rect(L,-46,-52,4,4,'#f0f0f0');rect(L,-30,-48,8,12,'#3f8cff');rect(L,-28,-52,4,4,'#f0f0f0');
      rect(L,22,-44,14,8,'#f59a2a');rect(L,40,-44,12,8,'#9a5fd0');
      // กันสาดลายทาง ขอบหยัก
      for(let i=0;i<8;i++){const x=-64+i*16,c=i%2?'#efe4c8':'#c8453f';rect(L,x,-92,16,28,c);L.ell(x+8,-64,8,6,c)}
      rect(L,-66,-96,132,6,'#8f2a28');rect(L,-66,-96,132,2,'#b84a44');
      // ป้าย
      rect(L,-38,-124,76,26,'#5a3a20');rect(L,-36,-122,72,22,'#7a5230');rect(L,-36,-122,72,2,'#9a6a40');
    });
  }
  window.drawShop=drawShop=function(){
    envShadow(ctx,320,63,40,6);
    GFX.draw(ctx,shopFrame(),320,64,false,null);
    pixText('ร้านค้า',320,64-58,K.gold,1.4,true);
  };

  /* ---------- สัตว์ฟาร์ม ---------- */
  function chickenFrame(s){
    return bake('chk'+s,36,40,18,34,L=>{
      L.px(-3,-5,2,5+s,'#e0a02a');L.px(3,-5,2,5,'#e0a02a');                       // ขา
      L.ell(0,-12,9,7,'#f6f2e8');L.ell(-1,-10,6,4,'#e2dcc8');L.px(-11,-18,5,8,'#ece6d4');L.px(-12,-20,3,4,'#e2dcc8');   // ตัว + หาง
      L.ell(8,-20,5,5,'#f6f2e8');L.px(7,-28,3,4,'#d9413f');L.px(10,-27,2,3,'#d9413f');L.px(13,-20,4,3,'#f0a020');L.px(9,-22,2,2,'#1d1420');L.px(11,-16,3,3,'#d9413f');
    });
  }
  function cowFrame(s){
    return bake('cow'+s,64,56,32,50,L=>{
      L.px(-16,-9,5,9,'#3a2a22');L.px(-9+s,-9,5,9,'#f1ede2');L.px(5-s,-9,5,9,'#3a2a22');L.px(12,-9,5,9,'#f1ede2');   // ขา
      L.ell(-1,-20,20,11,'#f1ede2');L.ell(-1,-17,18,6,'#e4dfd2');
      L.ell(-9,-23,6,5,'#3a2a22');L.ell(5,-19,5,4,'#3a2a22');L.px(0,-12,8,4,'#e8a8a0');                                 // ลาย + เต้า
      L.px(-22,-24,3,12,'#3a2a22');L.px(-24,-14,4,4,'#3a2a22');                                                         // หาง
      L.ell(17,-27,7,7,'#f1ede2');L.px(20,-24,8,6,'#e8a8a0');L.px(22,-22,2,2,'#c0786f');L.px(14,-30,2,2,'#1d1420');L.px(10,-37,3,5,'#d2c39e');L.px(18,-37,3,5,'#d2c39e');L.px(11,-34,3,4,'#3a2a22');
    });
  }
  const _da=drawAni;
  window.drawAni=drawAni=function(a){
    const x=Math.round(a.x),y=Math.round(a.y),s=Math.sin(a.anim*8)>0?1:0,ready=a.prod>=AT[a.t].t,ch=a.t==='chicken';
    envShadow(ctx,x,y-1,ch?9:15,ch?3:5);
    GFX.draw(ctx,ch?chickenFrame(s):cowFrame(s),x,y,a.face<0,null);
    if(ready)pixText('!',x,y-(ch?21:28),'#ffd23f',1.6,true);
  };
  function dogFrame(s){
    return bake('dog'+s,48,44,24,38,L=>{
      L.px(-14,-14,6,3,'#8a5a34');L.px(-17,-18+s,4,5,'#8a5a34');                                                        // หาง
      L.px(-10,-8,4,8,'#a8743f');L.px(-3+s*2,-8,4,8,'#8a5a34');L.px(5-s*2,-8,4,8,'#8a5a34');L.px(10,-8,4,8,'#a8743f');
      L.ell(-1,-14,14,7,'#c8914f');L.px(-6,-8,14,3,'#f1e0b8');L.ell(-1,-19,12,3,'#e0b070');
      L.ell(13,-20,6,6,'#d6a05a');L.px(17,-17,6,5,'#f1e0b8');L.px(21,-17,2,2,'#1d1420');L.px(14,-23,2,2,'#1d1420');
      L.px(9,-28,4,7,'#7a4e2c');L.px(15,-28,4,7,'#7a4e2c');
    });
  }
  window.drawDog=drawDog=function(){
    const x=Math.round(DOG.x),y=Math.round(DOG.y),s=Math.sin(DOG.anim*12)>0?1:0;
    envShadow(ctx,x,y-1,10,3);
    GFX.draw(ctx,dogFrame(s),x,y,DOG.face<0,null);
  };

  /* ---------- ให้ต้นไม้/หิน (art_env) ใช้เงามีทิศ ---------- */
  const _t=drawTree;
  window.drawTree=drawTree=function(x,b,dead,id,v){
    envShadow(ctx,x+8,b-1,16,6);
    GFX.draw(ctx,ENV_ART.treeFrame(id,v,dead),x+8,b-1,false,null);
  };
  const _o=drawObj;
  window.drawObj=drawObj=function(o){
    if(o.k==='rock'){const cave=zone==='cave',v=((o.x/T)*7+(o.b/T)*3)%2;
      envShadow(ctx,o.x+8,o.b-1,15,5);GFX.draw(ctx,ENV_ART.rockFrame(cave,v),o.x+8,o.b-1,false,null);return}
    if(o.k==='tree')return drawTree(o.x,o.b,o.dead,o.id,o.v);
    if(o.k==='house')return drawHouse();
    if(o.k==='shop')return drawShop();
    return _o(o);
  };
})();
