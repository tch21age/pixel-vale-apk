'use strict';
/* =====================================================================
   ART: ฮีโร่ชาย/หญิง — เลเยอร์ (ตัว/ขา/แขน/หัว/ผม/หมวก/อาวุธ/โล่) → shade → outline → atlas
   สูงราว 44 art px (= 22 logic px) หัวราว 1/3 ตา = จุดเข้ม ขอบเข้มบาง แรเงา 3 โทน
   อุปกรณ์เปลี่ยนตามระดับดาบ P.wl (+0..+5 ตาม tier · v16 ส่วน 4: +6..+10 = ลุคฮีโร่ มีไหล่เกราะ/ปีกหมวก/อัญมณีสีตามดาบ และดาบ/คทาละเอียดขึ้นทุกระดับ) · ท่า: เดิน 4 เฟรม × 3 ทิศ (ซ้าย = พลิกจากขวา) · โจมตี 4 เฟรม · ร่าย · ล้ม
   โหลดหลัง world.js: ทับ heroSprite / drawPlayer / applyLook โดยไม่แตะ logic หรือระบบเซฟ
   ===================================================================== */
const HERO_PAL={skin:'#f4c29c',pant:'#5d5a72',boot:'#5a3a22',belt:'#6b4423',gold:'#e0b84a',eye:'#1d1420',blush:'#f09a8c',mouth:'#b8605a',
  steel:'#aeb6c8',steelD:'#7d869c',plume:'#d63a4a',leather:'#8a5a34',pink:'#ff7ab8'};
(function(){
  const HW=64,HH=80,HAX=32,HAY=70, mkL=()=>GFX.layer(HW,HH,HAX,HAY);
  const PI=Math.PI, TIERS=6;
  function pal(g,wl){const Lk=LOOK[g];return Object.assign({},HERO_PAL,{hair:Lk.hair,hairH:Lk.hairH,tun:Lk.tun,tunD:Lk.tunD,scarf:Lk.scarf,scarfD:Lk.scarfD,cape:Lk.cape,capeD:Lk.capeD,blade:BLADE[wl||0],g,tier:Math.min(wl||0,TIERS-1),wl:wl||0,hero:(wl||0)>=6,acc:BLADE[wl||0]},
    (wl||0)>=6?{scarf:GFX.mix(Lk.scarf,BLADE[wl],.35),scarfD:GFX.mix(Lk.scarfD,BLADE[wl],.35),cape:GFX.mix(Lk.cape,BLADE[wl],.18),capeD:GFX.mix(Lk.capeD,BLADE[wl],.18)}:null)}

  /* ---------- อาวุธ: ดาบ (ชาย) / คทา (หญิง) วาดตามมุม ---------- */
  function weapon(c,hx,hy,ang,len){
    const L=mkL(),ca=Math.cos(ang),sa=Math.sin(ang),P=(i,w,col)=>L.px(Math.round(hx+ca*i),Math.round(hy+sa*i),w,w,col);
    const wl=c.wl;
    if(c.g==='m'){
      const gl=3+(wl>=3?1:0)+(wl>=6?1:0),bw=wl>=7?3:2;
      for(let i=-3;i<=0;i++)P(i,2,c.belt);                       // ด้าม
      if(wl>=3)P(-4,2,2,c.acc);                                  // อัญมณีท้ายด้าม
      for(let k=-gl;k<=gl;k+=1)L.px(Math.round(hx+ca*1-sa*k),Math.round(hy+sa*1+ca*k),2,2,wl>=9&&Math.abs(k)>=gl-1?c.acc:c.gold);   // การ์ด (กว้างขึ้นตามระดับ)
      for(let i=3;i<=len;i++)P(i,bw,i>len-2?'#ffffff':c.blade);   // ใบ
      if(wl>=4)for(let i=5;i<len-2;i++)L.px(Math.round(hx+ca*i),Math.round(hy+sa*i),1,1,GFX.mix(c.blade,'#ffffff',.65));   // ร่องกลางใบ
      if(wl>=9){P(len+1,2,'#ffffff');P(len+3,1,c.acc)}           // ปลายดาบเรืองแสง
    }else{
      for(let i=-4;i<=len-2;i++)P(i,2,c.leather);                // คทา
      const tx=Math.round(hx+ca*len),ty=Math.round(hy+sa*len),gr=wl>=7?5:wl>=3?4:3;
      if(wl>=4){L.px(tx-gr-1,ty-2,1,4,c.gold);L.px(tx+gr,ty-2,1,4,c.gold)}      // ง่ามทองรอบอัญมณี
      if(wl>=6)L.px(tx,ty-gr-2,1,2,c.gold);
      L.ell(tx,ty,gr,gr,c.gold);L.ell(tx,ty,gr-1,gr-1,c.blade);L.px(tx-1,ty-1,1,1,'#ffffff');
    }
    return L.shade(1).outline();
  }
  /* แขน = เส้นหนาจากไหล่ไปมือ + มือสีผิว */
  function arm(c,sx,sy,hx,hy,sleeve){const L=mkL();L.line(sx,sy,hx,hy,sleeve,3);L.px(hx,hy,3,3,c.skin);return L.shade(1).outline()}

  /* ---------- ส่วนประกอบหัว ---------- */
  function hat(c,view,b){
    const L=mkL(),t=c.tier,m=c.g==='m',sd=view==='s',cx=sd?1:0;
    if(m){
      if(t===0){L.px(-9+cx,-35+b,18,2,'#c8283a');if(view!=='d')L.px(-13+cx,-34+b,4,5,'#c8283a');if(view==='d')L.px(7,-34+b,3,5,'#c8283a')}
      else if(t===1){L.ell(cx,-40+b,9,5,c.leather);L.px(-10+cx,-35+b,20,2,c.belt);L.px(-4+cx,-43+b,3,1,'#b07a48')}
      else{
        const gold=t>=5,hc=gold?c.gold:c.steelD;
        L.ell(cx,-40+b,9,6,c.steel);L.px(-10+cx,-35+b,20,2,hc);L.px(-1+cx,-50+b,2,6,gold?c.gold:'#d8dff0');
        if(view==='d')L.px(-1,-34+b,2,5,hc);
        if(t>=3){L.px(-1+cx,-54+b,2,4,c.plume);L.px(0+cx,-57+b,3,4,c.plume);L.px(2+cx,-59+b,3,3,c.plume)}
      }
    }else{
      if(t===0){const x=sd?3:5;L.ell(x,-41+b,3,2,c.pink);L.ell(x+6,-43+b,3,2,c.pink);L.px(x+2,-42+b,3,3,'#ffd6ea')}
      else{
        const col=t>=2?c.tun:'#5a3a9a',h=t>=2?18:9,top=-40-h;
        L.ell(cx,-39+b,t>=5?13:12,2,t>=5?c.gold:col);                     // ปีกหมวก
        for(let i=0;i<h;i++){const hw=Math.max(1,Math.round(8*(1-i/h)));L.px(-hw+cx+(i>h*.6?Math.floor((i-h*.6)/2):0),-40-i+b,hw*2+1,1,col)}
        L.px(-8+cx,-41+b,17,2,c.gold);
        if(t>=3)L.px(-1+cx,-42+b,3,3,c.blade);
        if(t>=4)L.px(2+cx+(h>12?4:2),top+b+1,3,3,c.gold);
      }
    }
    if(c.hero)heroHat(L,c,view,b,cx);
    return L.shade(1).outline();
  }
  /* ลุคฮีโร่ (+6..+10): ปีก/อัญมณีที่หมวก — ขนาดโตตามระดับ */
  function heroHat(L,c,view,b,cx){
    const A=c.acc,wl=c.wl;
    if(c.g==='m'){
      const n=wl>=8?4:wl>=7?3:2;
      if(view==='s')for(let i=0;i<n;i++)L.px(-12-i*3+cx,-39-i*2+b,3,2,A);
      else for(const sx of [-1,1])for(let i=0;i<n;i++)L.px(sx*(10+i*3)-(sx<0?2:0)+cx,-39-i*2+b,3,2,A);
      if(view==='d'){L.px(-1,-41+b,3,3,A);L.px(0,-41+b,1,1,'#ffffff')}
      if(wl>=9){L.px(-6+cx,-47+b,2,3,c.gold);L.px(5+cx,-47+b,2,3,c.gold)}
    }else{
      L.px(-9+cx,-44+b,19,1,A);
      if(wl>=7){L.ell(-13+cx,-39+b,2,2,A);L.ell(13+cx,-39+b,2,2,A)}
      if(wl>=8)L.ell(cx,-39+b,16,3,c.gold);
      if(wl>=9){L.px(cx+2,-64+b,3,1,A);L.px(cx+3,-65+b,1,3,A)}
    }
  }
  function head(c,view,b){
    const out=[],g=c.g,sd=view==='s',cx=sd?1:0;
    const back=mkL();
    back.ell(sd?-2:0,-32+b,9,9,c.hair);
    if(g==='f'){if(view==='d'){back.px(-10,-33+b,3,15,c.hair);back.px(7,-33+b,3,15,c.hair)}else if(view==='u')back.px(-9,-33+b,18,17,c.hair);else back.px(-11,-34+b,6,18,c.hair)}
    back.shade(2).outline();out.push(back);
    if(view==='u'){      // มองจากด้านหลัง: ผมเต็มหัว
      const hh=mkL();hh.ell(0,-34+b,9,8,c.hair);hh.px(-1,-26+b,2,3,c.hairH);hh.px(-4,-44+b,3,4,c.hairH);hh.px(1,-43+b,4,3,c.hairH);hh.shade(2).outline();out.push(hh);return out}
    const face=mkL();face.ell(cx,-28+b,sd?7:8,7,c.skin);face.shade(1).outline(.6);out.push(face);
    const ft=mkL();
    if(sd){ft.px(4,-29+b,2,3,c.eye);ft.px(4,-29+b,1,1,'#ffffff');ft.px(9,-27+b,1,1,'#d89a7a');ft.px(6,-24+b,2,1,c.mouth);ft.px(2,-25+b,2,1,c.blush)}
    else{ft.px(-5,-29+b,2,3,c.eye);ft.px(3,-29+b,2,3,c.eye);ft.px(-5,-29+b,1,1,'#ffffff');ft.px(3,-29+b,1,1,'#ffffff');ft.px(-1,-24+b,2,1,c.mouth);ft.px(-7,-25+b,2,1,c.blush);ft.px(5,-25+b,2,1,c.blush)}
    out.push(ft);
    const fr=mkL();                  // ผมหน้า
    if(sd){fr.ell(1,-37+b,8,5,c.hair);fr.px(-3,-33+b,3,7,c.hair);fr.px(6,-33+b,3,2,c.hair)}
    else{fr.ell(0,-37+b,9,5,c.hair);fr.px(-9,-34+b,3,8,c.hair);fr.px(6,-34+b,3,8,c.hair);fr.px(-2,-32+b,3,2,c.hair)}
    fr.px(-4+cx,-44+b,3,4,c.hairH);fr.px(1+cx,-43+b,4,3,c.hairH);
    fr.shade(2).outline();out.push(fr);
    out.push(hat(c,view,b));
    return out;
  }
  /* ---------- ขา ---------- */
  function legs(c,view,step){
    const L=mkL(),lift=[0,1,0,-1][step];
    if(view==='s'){const lo=[0,3,0,-3][step];
      L.px(-3-lo,-9,4,5,'#4a4860');L.px(-3-lo,-4,6,4,'#47301b');            // ขาไกล
      L.px(-1+lo,-9,4,5,c.pant);L.px(-1+lo,-4,6,4,c.boot);                     // ขาใกล้
    }else{const ll=lift>0?2:0,rl=lift<0?2:0;
      L.px(-5,-9-ll,4,5,c.pant);L.px(1,-9-rl,4,5,c.pant);L.px(-6,-4-ll,5,4,c.boot);L.px(1,-4-rl,5,4,c.boot)}
    return L.shade(1).outline();
  }
  function cape(c,view,b,step){
    const L=mkL(),wv=step%2;
    if(view==='s'){L.px(-10-wv,-22+b,7,15,c.cape);L.px(-11-wv,-10+b,3,4,c.cape);L.px(-9-wv,-7+b,5,1,c.capeD);L.px(-10-wv,-21+b,1,13,c.capeD);if(c.hero)L.px(-10-wv,-9+b,7,1,c.gold)}
    else if(view==='d'){L.px(-8,-21+b,16,14,c.cape);L.px(-8,-9+b,3,2,c.cape);L.px(5,-9+b,3,2,c.cape);if(c.hero){L.px(-8,-9+b,3,1,c.gold);L.px(5,-9+b,3,1,c.gold)}}
    else{L.px(-8,-23+b,16,18,c.cape);L.px(-1,-22+b,2,15,c.hero&&c.wl>=8?c.acc:c.capeD);L.px(-8,-6+b,4,2,c.capeD);L.px(4,-6+b,4,2,c.capeD);if(c.hero){L.px(-8,-7+b,16,1,c.gold)}}
    return L.shade(1).outline();
  }
  function torso(c,view,b){
    const L=mkL();
    if(view==='s'){L.px(-4,-20+b,9,11,c.tun);L.px(-5,-10+b,11,2,c.tun);L.px(-4,-13+b,9,2,c.belt);L.px(2,-13+b,2,2,c.gold);if(c.hero&&c.wl>=7)L.px(2,-18+b,2,3,c.acc)}
    else{L.px(-5,-20+b,10,1,c.tun);L.px(-6,-19+b,12,9,c.tun);L.px(-7,-10+b,14,2,c.tun);L.px(-6,-13+b,12,2,c.belt);if(view==='d')L.px(-1,-13+b,2,2,c.gold);if(view==='u')L.px(5,-13+b,3,6,c.tunD);
      if(view==='d'&&c.hero&&c.wl>=7){L.px(-2,-18+b,4,4,c.gold);L.px(-1,-17+b,2,2,c.acc)}}
    return L.shade(1).outline();
  }
  function scarf(c,view,b,step){
    const L=mkL(),wv=step%2;
    if(view==='s'){L.px(-5,-22+b,10,3,c.scarf);L.px(-11-wv,-22+b,6,3,c.scarfD)}
    else{L.px(-7,-22+b,14,3,c.scarf);if(view==='d')L.px(2,-19+b,3,6,c.scarfD)}
    return L.shade(1).outline();
  }
  function pauldron(c,view,b){            // ไหล่เกราะ/ไหล่คลุม (ลุคฮีโร่ +6 ขึ้นไป)
    if(!c.hero)return null;
    const L=mkL(),m=c.g==='m',base=m?c.steel:c.tun,big=c.wl>=8,rx=big?5:4,ry=big?4:3,y=-20+b;
    if(view==='s'){L.ell(1,y,rx,ry,base);L.px(1-rx,y+ry-1,rx*2+1,1,c.gold);if(c.wl>=7)L.px(0,y-1,3,2,c.acc);if(big&&m)L.px(0,y-ry-3,2,3,c.gold)}
    else for(const sx of [-1,1]){const cx=sx*8;L.ell(cx,y,rx,ry,base);L.px(cx-rx,y+ry-1,rx*2+1,1,c.gold);if(c.wl>=7)L.px(cx-1,y-1,3,2,c.acc);if(big&&m)L.px(cx-1,y-ry-3,2,3,c.gold)}
    return L.shade(1).outline();
  }
  function shield(c,view,b){
    if(!(c.g==='m'&&c.tier>=4))return null;
    const L=mkL(),gold=c.tier>=5;
    if(view==='d'){L.ell(-11,-14+b,5,6,c.steel);L.ell(-11,-14+b,2,3,gold?c.gold:c.plume)}
    else if(view==='u'){L.ell(-10,-16+b,4,6,c.steelD)}
    else{L.px(-2,-19+b,3,10,c.steelD);L.px(-2,-19+b,1,10,gold?c.gold:c.steel)}
    return L.shade(1).outline();
  }

  /* ---------- ประกอบเฟรม ---------- */
  function build(c,view,pose,k){
    const step=pose==='walk'?k:0,lift=[0,1,0,-1][step],b=(pose==='walk'&&(step===1||step===3))?-1:0;
    const sd=view==='s';
    // จุดไหล่ + ตำแหน่งมือ + มุมอาวุธ ตามท่า
    const base={d:PI/2,s:0,u:-PI/2}[view],shoulderW=sd?[1,-19+b]:[7,-18+b],shoulderF=sd?[1,-19+b]:[-7,-18+b];
    let hand,wang,wlen=c.g==='m'?15+[0,0,0,0,1,1,1,1,2,2,2][c.wl]:17,farHand,drawWeaponFirst=false;
    if(pose==='atk'){const a=base+(k*2-1)*1.25;wang=a;hand=[Math.round(shoulderW[0]+Math.cos(a)*6),Math.round(shoulderW[1]+Math.sin(a)*6)];drawWeaponFirst=view==='u'}
    else{ // ท่าพัก/เดิน/ร่าย: ถืออาวุธชี้ขึ้น เอียงออกนอกตัวเล็กน้อย
      wang=sd?-1.15:-1.4;hand=sd?[4,-11+b]:[7,-10+b-(lift<0?1:0)];
      if(pose==='cast'){hand=sd?[3,-9+b]:[7,-9+b]}
    }
    farHand=sd?[-1+(lift>0?2:lift<0?-2:0),-11+b]:[-7,-10+b-(lift>0?1:0)];
    if(pose==='cast'){const e={d:[-4,-6+b],u:[-6,-31+b],s:[11,-19+b]}[view];farHand=e}
    const parts=[];
    const wp=weapon(c,hand[0]+1,hand[1]+1,wang,wlen);
    const aW=arm(c,shoulderW[0],shoulderW[1],hand[0],hand[1],c.tun);
    const aF=arm(c,shoulderF[0],shoulderF[1],farHand[0],farHand[1],sd?c.tunD:c.tun);
    const sh=shield(c,view,b),pd=pauldron(c,view,b);
    if(view==='d'){parts.push(cape(c,view,b,step),legs(c,view,step));if(sh)parts.push(sh);parts.push(torso(c,view,b),scarf(c,view,b,step),aF,aW);if(pd)parts.push(pd);parts.push(wp,...head(c,view,b))}
    else if(view==='u'){if(drawWeaponFirst)parts.push(wp);parts.push(legs(c,view,step),cape(c,view,b,step));if(sh)parts.push(sh);parts.push(aF,aW);if(pd)parts.push(pd);if(!drawWeaponFirst)parts.push(wp);parts.push(scarf(c,view,b,step),...head(c,view,b))}
    else{parts.push(aF,cape(c,view,b,step),legs(c,view,step));if(sh)parts.push(sh);parts.push(torso(c,view,b),scarf(c,view,b,step),aW);if(pd)parts.push(pd);parts.push(wp,...head(c,view,b))}
    const F=mkL();parts.forEach(p=>F.blit(p));F.outline(.8);
    return GFX.frame(F);
  }
  function buildDead(c){
    const L=mkL();
    L.px(-12,-6,22,6,c.tun);L.px(-13,-1,3,2,c.boot);L.px(9,-6,6,5,c.boot);L.px(-3,-5,12,2,c.belt);L.px(-6,-8,12,2,c.cape);
    L.ell(-14,-6,6,5,c.skin);L.ell(-15,-8,6,4,c.hair);L.px(-16,-5,2,1,c.eye);L.px(-21,-5,3,5,c.hair);
    L.shade(1).outline();return GFX.frame(L);
  }
  const ATK_P=[.12,.38,.62,.88], fc={};
  /* bake ทีละเฟรมตอนใช้ (≈4 ms/เฟรม) → ไม่กระตุกตอนเริ่มเกมหรือตอนตีบวกดาบ */
  function getFrame(g,wl,pose,v,k){
    const key=g+(wl||0)+pose+v+k;if(fc[key])return fc[key];
    const c=pal(g,wl);
    return fc[key]=pose==='dead'?buildDead(c):build(c,v,pose,pose==='atk'?ATK_P[k]:k);
  }
  function getSet(g,wl){       // ใช้ดีบัก/contact sheet: ดึงทุกเฟรม
    const S={walk:{},atk:{},cast:{},dead:getFrame(g,wl,'dead','d',0)};
    for(const v of ['d','s','u']){S.walk[v]=[0,1,2,3].map(k=>getFrame(g,wl,'walk',v,k));S.atk[v]=[0,1,2,3].map(k=>getFrame(g,wl,'atk',v,k));S.cast[v]=getFrame(g,wl,'cast',v,0)}
    return S;
  }
  window.HERO_ART={getFrame,getSet,pal,ATK_P};

  /* ---------- วาดในเกม ---------- */
  const VIEW=['d','s','s','u'];    // dir: 0 down, 1 left(flip), 2 right, 3 up
  function drawHero(x,y,tint,alpha){
    let dir=P.dir;if(P.spinT>0)dir=[0,2,3,1][Math.floor((1-P.spinT/.36)*8)%4];
    if(P.atkT>0){const p=1-P.atkT/ATK_T,l=Math.round(Math.sin(p*Math.PI)*2);x+=DIRS[dir].x*l;y+=DIRS[dir].y*l}
    const v=VIEW[dir],flip=dir===1;
    let f;
    if(P.atkT>0){const p=1-P.atkT/ATK_T;f=getFrame(P.g,P.wl,'atk',v,Math.min(3,Math.floor(p*4)))}
    else if(P.castT>0)f=getFrame(P.g,P.wl,'cast',v,0);
    else f=getFrame(P.g,P.wl,'walk',v,P.moving?P.step:0);
    GFX.draw(ctx,f,x,y,flip,tint,alpha);
    if(P.castT>0){     // ประกายที่มือตอนร่าย (เล็ก ใช้ art px)
      const d=DIRS[dir],ox=Math.round((x+d.x*8)*RS),oy=Math.round((y-9+d.y*6)*RS);
      GFX.ar(ctx,ox-3,oy-3,7,7,'rgba(155,224,255,.55)');GFX.ar(ctx,ox-2,oy-2,5,5,'#3f8cff');GFX.ar(ctx,ox-1,oy-1,3,3,'#ffffff')}
  }
  drawPlayer=function(){
    const x=Math.round(P.x),y=Math.round(P.y);
    GFX.drawShadow(ctx,x,y,P.dead?11:8,3);
    if(P.dead){GFX.draw(ctx,getFrame(P.g,P.wl,'dead','d',0),x,y,false,null);return}
    const flick=P.invul>0&&Math.floor(S.t*22)%2===0;
    drawHero(x,y,P.hurtT>0?'rgba(255,255,255,.7)':null,flick?.45:1);
  };
  /* ล้างแคชเมื่อสีผม/ลุคเปลี่ยน — ใช้ g+wl เป็นคีย์อยู่แล้ว ไม่ต้องทำอะไรเมื่อตีบวกดาบ */
})();
