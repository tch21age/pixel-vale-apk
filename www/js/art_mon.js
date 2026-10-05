'use strict';
/* =====================================================================
   ART: มอนสเตอร์ — slime goblin wolf boar bat skel golem king
   สร้างจากเลเยอร์ + primitives → shade → outline → cache ทีละเฟรม (bake ตอนใช้ครั้งแรก)
   - ตัวที่เป็นมนุษย์ (goblin / skel / golem) มี 3 มุมมอง: หน้า(d) ข้าง(s) หลัง(u) · ตัวอื่นเป็นมุมข้าง (พลิกซ้าย-ขวาตาม m.face)
   - ท่า: walk (2–4 เฟรม) และ wind (ท่าง้างก่อนโจมตี) · flash/ขาววาบ ใช้ GFX.draw(tint) cache ไว้
   - ทับ drawMon ของเดิมโดยไม่แตะ MON/สถานะ/ความสูง h ที่ logic ใช้
   ===================================================================== */
const MON_PAL={
  slime:'#58b8ee',slimeD:'#3a97d4',
  gskin:'#6fae4a',gskinD:'#4d8a3a',vest:'#7a5230',horn:'#d2c39e',club:'#8a5a34',dark:'#2a1a14',
  wolf:'#8a8f9c',wolfL:'#d9dce3',wolfD:'#5d6270',boar:'#6b4a35',boarD:'#3b281c',snout:'#c99a86',tusk:'#f1e9d2',
  bat:'#3a2a4a',batW:'#54386e',batWD:'#3f2a55',batEye:'#ff8a8a',
  bone:'#e8e2cc',boneD:'#8c8672',steel:'#9aa3b3',
  rock:'#7a7f96',rockL:'#9096ae',rockD:'#5b5f73',crys:'#3fcfff',crysL:'#c8f4ff',eyeY:'#ffd93a',red:'#ff4a4a',gold:'#e0b84a'};
(function(){
  const M=MON_PAL, mk=(w=72,h=84,ax=36,ay=78)=>GFX.layer(w,h,ax,ay);
  const comp=(parts,w,h,ax,ay)=>{const F=mk(w,h,ax,ay);parts.forEach(p=>F.blit(p));F.outline(.8);return GFX.frame(F)};
  function tri(L,x0,y0,x1,y1,x2,y2,col){
    const mn=Math.min(y0,y1,y2),mx=Math.max(y0,y1,y2);
    for(let y=mn;y<=mx;y++){const xs=[];
      [[x0,y0,x1,y1],[x1,y1,x2,y2],[x2,y2,x0,y0]].forEach(([ax,ay,bx,by])=>{if(y>=Math.min(ay,by)&&y<=Math.max(ay,by)){if(ay===by)xs.push(ax,bx);else xs.push(ax+(bx-ax)*(y-ay)/(by-ay))}});
      if(xs.length){const a=Math.round(Math.min(...xs)),b=Math.round(Math.max(...xs));L.px(a,y,b-a+1,1,col)}}
  }
  const thick=(L,x0,y0,x1,y1,col,t)=>L.line(x0,y0,x1,y1,col,t);

  /* ---------------- สไลม์ / ราชาสไลม์ ---------------- */
  function slime(k,wind,big){
    const sq=[0,.7,0,-.7][k%4],s=big?1.65:1;
    const rx=Math.round((13-sq*2+(wind?3:0))*s),ry=Math.round((9+sq*1.5-(wind?3:0))*s);
    const L=mk(64,64,32,60);
    L.ell(0,-ry,rx,ry,M.slimeD);L.ell(0,-ry-2,rx-2,ry-2,M.slime);
    L.ell(-Math.round(rx*.4),-Math.round(ry*1.55),Math.max(2,Math.round(rx*.2)),2,'#c8efff');L.px(-Math.round(rx*.55),-Math.round(ry*1.1),2,2,'#c8efff');
    L.shade(1);
    const ey=-ry-Math.round(2*s),ex=Math.round(5*s);
    L.px(-ex-1,ey,3,5,'#1a1220');L.px(ex-1,ey,3,5,'#1a1220');L.px(-ex-1,ey,1,2,'#ffffff');L.px(ex-1,ey,1,2,'#ffffff');
    L.px(-1,ey+Math.round(6*s),Math.round(3*s),1,'#2b72b0');
    if(big){const t=-2*ry+1;L.px(-9,t-2,18,4,M.gold);[-9,-2,5].forEach(x=>tri(L,x,t-2,x+2,t-2,x+1,t-7,M.gold));L.px(-1,t-1,2,2,'#e0414f')}
    L.outline();return GFX.frame(L);
  }

  /* ---------------- ก็อบลิน ---------------- */
  function goblin(view,pose,k){
    const wind=pose==='wind',sd=view==='s',b=(pose==='walk'&&k)?-1:0,out=[];
    const lg=mk();
    if(sd){const lo=k?3:-3;lg.px(-3-lo,-9,4,6,M.gskinD);lg.px(-4-lo,-3,6,3,M.gskinD);lg.px(-1+lo,-9,4,6,M.gskin);lg.px(-1+lo,-3,7,3,M.gskin)}
    else{const a=k?2:0,c=k?0:2;lg.px(-6,-9-a,5,6,M.gskinD);lg.px(1,-9-c,5,6,M.gskinD);lg.px(-7,-3-a,6,3,M.gskin);lg.px(1,-3-c,6,3,M.gskin)}
    lg.shade(1).outline();
    const tr=mk(),w=sd?10:14;
    tr.px(-w/2,-22+b,w,13,M.vest);tr.px(-w/2-1,-12+b,w+2,3,M.vest);if(view==='d')tr.px(-3,-19+b,6,6,M.gskin);
    tr.px(-w/2,-13+b,w,2,'#3b2a1a');if(view==='d')tr.px(-1,-13+b,3,2,M.gold);tr.shade(1).outline();
    // กระบอง (มือขวา) — งัดขึ้นตอนง้าง
    const ang=wind?-2.1:(sd?-1.2:-1.5),hx=sd?5:9,hy=-14+b-(wind?4:0);
    const cl=mk(),ca=Math.cos(ang),sa=Math.sin(ang),len=20;
    thick(cl,hx,hy,Math.round(hx+ca*len),Math.round(hy+sa*len),M.club,3);
    const cx=Math.round(hx+ca*len),cy=Math.round(hy+sa*len);cl.ell(cx,cy,4,4,M.club);cl.px(cx-1,cy-1,2,2,'#7d8294');cl.shade(1).outline();
    const arR=mk();thick(arR,sd?2:8,-19+b,hx,hy,M.gskin,4);arR.px(hx-1,hy-1,4,4,M.gskinD);arR.shade(1).outline();
    const arL=mk();if(sd)thick(arL,-1,-19+b,-2,-11+b,M.gskinD,4);else{thick(arL,-8,-19+b,-10,-11+b-(k?1:0),M.gskin,4);arL.px(-11,-12+b,4,4,M.gskinD)}arL.shade(1).outline();
    // หัว
    const hd=mk(),cxh=sd?1:0;
    hd.ell(cxh,-31+b,sd?9:10,7,M.gskin);
    if(view==='u'){hd.px(-3,-30+b,6,1,M.gskinD)}
    if(sd){hd.px(-9,-34+b,5,3,M.gskin);hd.px(-12,-35+b,3,2,M.gskin);hd.px(9,-31+b,4,3,M.gskin)}
    else{hd.px(-15,-34+b,6,3,M.gskin);hd.px(-17,-35+b,3,2,M.gskin);hd.px(9,-34+b,6,3,M.gskin);hd.px(14,-35+b,3,2,M.gskin);hd.px(-14,-33+b,3,1,M.gskinD);hd.px(11,-33+b,3,1,M.gskinD)}
    hd.px(-6+cxh,-44+b,2,6,M.horn);hd.px(4+cxh,-44+b,2,6,M.horn);hd.px(-7+cxh,-41+b,1,3,M.horn);hd.px(6+cxh,-41+b,1,3,M.horn);
    hd.shade(1).outline();
    const fc=mk();
    if(view!=='u'){
      if(sd){fc.px(2,-35+b,6,1,M.dark);fc.px(3,-33+b,3,3,M.eyeY);fc.px(5,-33+b,1,3,M.dark);fc.px(8,-29+b,3,2,M.gskinD);
        if(wind){fc.px(-1,-26+b,10,3,M.dark);fc.px(1,-27+b,1,2,'#ffffff');fc.px(6,-27+b,1,2,'#ffffff')}else{fc.px(1,-26+b,8,1,M.dark);fc.px(7,-27+b,1,2,'#ffffff')}}
      else{fc.px(-7,-35+b,5,1,M.dark);fc.px(2,-35+b,5,1,M.dark);fc.px(-6,-33+b,4,3,M.eyeY);fc.px(2,-33+b,4,3,M.eyeY);fc.px(-4,-33+b,1,3,M.dark);fc.px(3,-33+b,1,3,M.dark);
        fc.px(-1,-30+b,2,2,M.gskinD);
        if(wind){fc.px(-5,-27+b,10,4,M.dark);fc.px(-4,-27+b,2,2,'#ffffff');fc.px(2,-27+b,2,2,'#ffffff');fc.px(-2,-24+b,4,1,'#c0392b')}else{fc.px(-5,-26+b,10,1,M.dark);fc.px(-4,-27+b,1,2,'#ffffff');fc.px(3,-27+b,1,2,'#ffffff')}}
    }
    if(wind){fc.px(sd?3:-6,-33+b,sd?3:4,1,M.red);if(!sd)fc.px(2,-33+b,4,1,M.red)}
    if(view==='d')out.push(lg,tr,arL,hd,fc,arR,cl);else if(view==='u')out.push(cl,lg,tr,arL,arR,hd,fc);else out.push(arL,lg,tr,hd,fc,arR,cl);
    return comp(out,72,84,36,78);
  }

  /* ---------------- หมาป่า (มุมข้าง) ---------------- */
  function wolf(k,wind){
    const out=[],b=wind?1:0;
    const lg=mk(72,60,34,56);
    [[-11,0],[-7,.5],[6,.25],[10,.75]].forEach(([x,ph],i)=>{const s=Math.sin((k/4+ph)*6.283),lift=Math.cos((k/4+ph)*6.283)>.3?2:0;
      const col=i%2?M.wolf:M.wolfD;thick(lg,x,-12,x+Math.round(s*3),-3-lift,col,3);lg.px(x+Math.round(s*3)-1,-3-lift,4,3,col)});
    lg.shade(1).outline();
    const tl=mk(72,60,34,56);thick(tl,-13,-19,-21,-26+(k%2),M.wolfD,4);tl.ell(-22,-27+(k%2),3,3,M.wolfL);tl.shade(1).outline();
    const bd=mk(72,60,34,56);
    bd.ell(-1,-17+b,15,7,M.wolf);bd.ell(-1,-14+b,12,4,M.wolfL);bd.ell(-5,-21+b,8,3,'#aab0bd');bd.shade(1);bd.outline();
    const hd=mk(72,60,34,56);
    hd.ell(14,-22+b,7,6,M.wolf);hd.px(18,-22+b,9,5,'#9aa0ad');hd.px(26,-22+b,3,3,'#111111');
    tri(hd,10,-27+b,12,-35+b,15,-27+b,M.wolfD);tri(hd,15,-27+b,18,-34+b,20,-26+b,M.wolf);
    if(wind){hd.px(19,-18+b,8,3,'#8a2a2a');hd.px(20,-19+b,1,2,'#ffffff');hd.px(25,-19+b,1,2,'#ffffff')}else hd.px(19,-18+b,7,1,'#3a1a1a');
    hd.shade(1).outline();
    const ey=mk(72,60,34,56);ey.px(16,-25+b,3,2,wind?M.red:M.eyeY);ey.px(18,-25+b,1,1,'#111111');
    out.push(tl,lg,bd,hd,ey);return comp(out,72,60,34,56);
  }
  /* ---------------- หมูป่า ---------------- */
  function boar(k,wind){
    const out=[],b=wind?1:0;
    const lg=mk(72,60,34,56);
    [[-11,0],[-6,.5],[7,.25],[12,.75]].forEach(([x,ph],i)=>{const s=Math.sin((k/4+ph)*6.283),lift=Math.cos((k/4+ph)*6.283)>.3?2:0;
      const col=i%2?'#4a3224':M.boarD;thick(lg,x,-11,x+Math.round(s*2),-3-lift,col,4);lg.px(x+Math.round(s*2)-1,-3-lift,5,3,col)});
    lg.shade(1).outline();
    const bd=mk(72,60,34,56);
    bd.ell(-1,-17+b,16,9,M.boar);bd.ell(-1,-23+b,13,3,M.boarD);for(let i=-9;i<=7;i+=4)bd.px(i,-27+b,2,3,M.boarD);bd.ell(1,-12+b,12,3,'#7a5640');bd.shade(1).outline();
    const tl=mk(72,60,34,56);thick(tl,-16,-20,-19,-25,'#4a3224',2);tl.px(-20,-26,2,2,'#4a3224');tl.outline();
    const hd=mk(72,60,34,56);
    hd.ell(15,-16+b,8,7,'#7a5640');hd.ell(23,-13+b,4,4,M.snout);hd.px(25,-14+b,1,2,'#3a1a1a');
    tri(hd,10,-22+b,12,-28+b,15,-22+b,'#4a3224');
    hd.shade(1).outline();
    const tu=mk(72,60,34,56);tu.px(20,-11+b,6,2,M.tusk);tu.px(25,-14+b,2,4,M.tusk);if(wind){tu.px(19,-9+b,8,2,M.tusk);tu.px(26,-15+b,2,6,M.tusk)}tu.outline();
    const ey=mk(72,60,34,56);ey.px(16,-18+b,3,2,wind?M.red:M.eyeY);ey.px(17,-18+b,1,1,'#111111');
    out.push(tl,lg,bd,hd,tu,ey);return comp(out,72,60,34,56);
  }
  /* ---------------- ค้างคาว (ตัวลอยที่ y≈-20 art) ---------------- */
  function bat(k,wind){
    const out=[],y0=-20,wy=[-12,-3,6][k%3];
    const wg=mk(72,64,36,60);
    for(const sgn of [-1,1]){
      const sx=sgn*4,tipx=sgn*(wind?24:22),tipy=y0+wy;
      tri(wg,sx,y0-3,tipx,tipy,sx,y0+5,M.batW);tri(wg,sx,y0-3,sgn*14,tipy+(k===1?-1:-6)+3,tipx,tipy,M.batWD);
      thick(wg,sx,y0-3,tipx,tipy,M.batWD,1);
    }
    wg.shade(1).outline();
    const bd=mk(72,64,36,60);
    bd.ell(0,y0,5,6,M.bat);tri(bd,-5,y0-4,-4,y0-12,-1,y0-6,M.bat);tri(bd,5,y0-4,4,y0-12,1,y0-6,M.bat);
    bd.shade(1).outline();
    const f=mk(72,64,36,60);
    f.px(-4,y0-3,3,3,wind?M.red:M.batEye);f.px(1,y0-3,3,3,wind?M.red:M.batEye);f.px(-3,y0-2,1,1,'#111111');f.px(2,y0-2,1,1,'#111111');
    f.px(-2,y0+3,1,2,'#ffffff');f.px(1,y0+3,1,2,'#ffffff');if(wind)f.px(-3,y0+2,6,1,'#8a2a2a');
    out.push(wg,bd,f);return comp(out,72,64,36,60);
  }
  /* ---------------- โครงกระดูก ---------------- */
  function skel(view,pose,k){
    const wind=pose==='wind',sd=view==='s',b=(pose==='walk'&&k)?-1:0,out=[];
    const lg=mk(72,90,36,84);
    if(sd){const lo=k?3:-3;thick(lg,-1-lo,-16,-1-lo,-4,M.boneD,2);lg.px(-3-lo,-3,5,3,M.boneD);thick(lg,1+lo,-16,1+lo,-4,M.bone,2);lg.px(0+lo,-3,6,3,M.bone)}
    else{const a=k?2:0,c=k?0:2;lg.px(-5,-16-a,2,13,M.bone);lg.px(3,-16-c,2,13,M.bone);lg.px(-6,-3-a,5,3,M.bone);lg.px(2,-3-c,5,3,M.bone)}
    lg.shade(1).outline();
    const tr=mk(72,90,36,84);
    tr.px(-1,-32+b,2,16,M.boneD);
    if(sd){for(let i=0;i<4;i++)tr.px(-4,-30+b+i*3,8,2,i%2?M.boneD:M.bone);tr.px(-4,-17+b,8,3,M.bone)}
    else{for(let i=0;i<4;i++){tr.px(-7,-30+b+i*3,14,2,i%2?M.boneD:M.bone)}tr.px(-5,-17+b,10,3,M.bone);tr.px(-8,-31+b,16,2,M.bone)}
    tr.shade(1).outline();
    const hd=mk(72,90,36,84),cx=sd?1:0;
    hd.ell(cx,-41+b,8,7,M.bone);hd.px(-5+cx,-34+b,10,4,M.bone);hd.shade(1).outline();
    const fc=mk(72,90,36,84);
    if(view!=='u'){
      if(sd){fc.px(3,-43+b,4,4,'#1a1220');fc.px(5,-42+b,1,2,M.red);fc.px(7,-38+b,2,2,M.boneD);fc.px(2,-34+b,7,1,'#1a1220');if(wind)fc.px(2,-33+b,7,2,'#1a1220')}
      else{fc.px(-6,-43+b,4,5,'#1a1220');fc.px(2,-43+b,4,5,'#1a1220');fc.px(-5,-42+b,2,2,M.red);fc.px(3,-42+b,2,2,M.red);fc.px(-1,-38+b,2,2,M.boneD);
        fc.px(-4,-34+b,8,1,'#1a1220');fc.px(-2,-35+b,1,3,'#1a1220');fc.px(1,-35+b,1,3,'#1a1220');if(wind)fc.px(-4,-33+b,8,2,'#1a1220')}
    }
    const sw=mk(72,90,36,84),ang=wind?-2.0:(sd?-1.15:-1.45),hx=sd?5:9,hy=-18+b-(wind?5:0);
    thick(sw,sd?2:7,-30+b,hx,hy,M.bone,2);sw.px(hx,hy,3,3,M.bone);
    const ca=Math.cos(ang),sa=Math.sin(ang);thick(sw,hx,hy,Math.round(hx+ca*22),Math.round(hy+sa*22),M.steel,3);
    for(let q=-3;q<=3;q++)sw.px(Math.round(hx+ca*2-sa*q),Math.round(hy+sa*2+ca*q),1,1,M.club);
    sw.shade(1).outline();
    const al=mk(72,90,36,84);if(sd){thick(al,-1,-30+b,-2,-18+b,M.boneD,2)}else{thick(al,-8,-30+b,-10,-18+b-(k?1:0),M.bone,2);al.px(-11,-18+b,3,3,M.bone)}al.shade(1).outline();
    if(view==='d')out.push(lg,tr,al,hd,fc,sw);else if(view==='u')out.push(sw,lg,tr,al,hd);else out.push(al,lg,tr,hd,fc,sw);
    return comp(out,72,90,36,84);
  }
  /* ---------------- โกเลมคริสตัล ---------------- */
  function golem(view,pose,k){
    const wind=pose==='wind',sd=view==='s',b=(pose==='walk'&&k)?-1:0,out=[];
    const AXg=48,AYg=100,mkg=()=>mk(96,112,AXg,AYg);
    const lg=mkg();
    if(sd){const lo=k?3:-3;lg.px(-7-lo,-18,9,18,M.rockD);lg.px(-2+lo,-18,10,18,M.rock)}
    else{const a=k?2:0,c=k?0:2;lg.px(-11,-18-a,9,18+a,M.rockD);lg.px(2,-18-c,9,18+c,M.rockD)}
    lg.shade(2).outline();
    const tr=mkg(),w=sd?24:30;
    tr.px(-w/2,-48+b,w,32,M.rock);tr.px(-w/2+2,-50+b,w-4,3,M.rock);tr.px(-w/2,-20+b,w,4,M.rockD);
    for(const [x,y] of [[-6,-42],[5,-30],[-9,-26]])tr.px(x,y+b,4,1,M.rockD);
    tr.shade(2).outline();
    const cr=mkg();
    if(view==='d'){tri(cr,-4,-30+b,0,-44+b,4,-30+b,M.crys);tri(cr,-4,-30+b,0,-20+b,4,-30+b,'#2a9fd0');cr.px(-1,-38+b,2,6,M.crysL)}
    else if(view==='u'){for(const x of [-8,0,7]){tri(cr,x-3,-30+b,x,-48+b-Math.abs(x)/2,x+3,-30+b,M.crys);cr.px(x,-42+b,1,8,M.crysL)}}
    else{tri(cr,-2,-34+b,2,-48+b,6,-34+b,M.crys);cr.px(2,-44+b,1,6,M.crysL)}
    cr.shade(1).outline();
    const arm=(sx)=>{const L=mkg(),up=wind?-12:0;
      L.px(sx-4,-48+b+up,9,24,M.rock);L.px(sx-6,-26+b+up,13,10,M.rockD);L.px(sx-5,-27+b+up,3,3,M.rockL);L.shade(2).outline();return L};
    const sh=mkg();
    if(sd){sh.px(-3,-54+b,10,10,M.rockL);tri(sh,-1,-54+b,2,-64+b,5,-54+b,M.crys)}
    else{sh.px(-19,-54+b,11,10,M.rockL);sh.px(8,-54+b,11,10,M.rockL);tri(sh,-17,-54+b,-14,-64+b,-11,-54+b,M.crys);tri(sh,10,-54+b,13,-65+b,16,-54+b,M.crys)}
    sh.shade(2).outline();
    const hd=mkg(),hx=sd?3:0;
    hd.px(-7+hx,-66+b,14,12,M.rock);hd.px(-6+hx,-67+b,12,2,M.rockL);hd.shade(1).outline();
    const fc=mkg();
    if(view!=='u'){if(sd){fc.px(3,-62+b,4,3,M.crys);fc.px(4,-62+b,2,1,'#ffffff')}else{fc.px(-5,-62+b,4,3,M.crys);fc.px(1,-62+b,4,3,M.crys);fc.px(-4,-62+b,2,1,'#ffffff');fc.px(2,-62+b,2,1,'#ffffff')}}
    if(wind)fc.px(-3,-58+b,6,1,M.crys);
    if(view==='d')out.push(lg,tr,cr,arm(-19),arm(19),sh,hd,fc);else if(view==='u')out.push(lg,arm(-19),arm(19),tr,cr,sh,hd);else out.push(arm(-3),lg,tr,cr,sh,hd,fc,arm(8));
    return comp(out,96,112,AXg,AYg);
  }

  /* ---------------- cache + เลือกเฟรมตอนวาด ---------------- */
  const cache={};
  const HUM={goblin:goblin,skel:skel,golem:golem};
  function get(type,view,pose,k){
    const key=type+view+pose+k;if(cache[key])return cache[key];
    let f;
    if(type==='slime')f=slime(k,pose==='wind',false);else if(type==='king')f=slime(k,pose==='wind',true);
    else if(HUM[type])f=HUM[type](view,pose,k);
    else f={wolf,boar,bat}[type](k,pose==='wind');
    return cache[key]=f;
  }
  const WALKN={slime:4,king:4,wolf:4,boar:4,bat:3,goblin:2,skel:2,golem:2};
  const SHADOW={slime:[14,3],king:[26,4],goblin:[16,3],wolf:[20,3],boar:[22,4],bat:[14,3],skel:[12,3],golem:[26,4]};
  const monView=m=>{
    if(!HUM[m.type])return 's';
    const chase=m.state==='chase'||m.state==='windup',vx=chase?P.x-m.x:(m.vx||0),vy=chase?(P.y-6)-m.y:(m.vy||0);
    if(Math.abs(vx)+Math.abs(vy)>.2)m._v=(Math.abs(vy)>Math.abs(vx)*1.25)?(vy>0?'d':'u'):'s';
    return m._v||'s';
  };
  drawMon=function(m){
    const d=MON[m.type],x=Math.round(m.x),y=Math.round(m.y),sh=SHADOW[m.type]||[16,3];
    GFX.drawShadow(ctx,x,y,sh[0],sh[1]);
    const wind=m.state==='windup',v=monView(m),moving=m.state!=='wander'||m.vx||m.vy;
    const k=wind?0:(moving?Math.floor(m.anim*(m.type==='bat'?9:5))%WALKN[m.type]:0);
    const f=get(m.type,v,wind?'wind':'walk',k);
    const tint=m.fz>0?'rgba(140,210,255,.6)':m.hurtT>0?'rgba(255,255,255,.75)':(wind&&Math.floor(S.t*16)%2?'rgba(255,60,60,.4)':null);
    const bob=m.type==='bat'?Math.round(Math.sin(m.anim*4)*2):0;
    GFX.draw(ctx,f,x,y+bob,v==='s'&&m.face<0,tint);
    if(wind)pixText('!',x,y-d.h-12,'#ff5a4a',2,true);
    const mh=m.mhp||d.hp;if(m.hp<mh){const w=14;r(x-w/2-1,y-d.h-7,w+2,4,'#000');r(x-w/2,y-d.h-6,w,2,'#5a1a22');r(x-w/2,y-d.h-6,Math.max(1,Math.round(w*m.hp/mh)),2,'#e0414f')}
  };
  window.MON_ART={get,WALKN};
  window.__monSheet=function(){
    const types=Object.keys(WALKN),Z=3,cw=100,ch=112,cv=document.createElement('canvas');
    cv.width=cw*Z*9;cv.height=types.length*ch*Z;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#4f7a3c';g.fillRect(0,0,cv.width,cv.height);
    types.forEach((t,r)=>{let c=0;const put=f=>{g.drawImage(f.c,0,0,f.w,f.h,c*cw*Z+(cw-f.w)/2*Z,r*ch*Z+(ch-f.h)/2*Z,f.w*Z,f.h*Z);c++};
      const views=HUM[t]?['d','s','u']:['s'];
      for(const v of views){for(let k=0;k<WALKN[t];k++)put(get(t,v,'walk',k));put(get(t,v,'wind',0))}});
    return cv.toDataURL();
  };
})();
