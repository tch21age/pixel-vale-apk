'use strict';
/* =====================================================================
   ART SKILL (v18 ส่วน 5): เอฟเฟกต์สกิลเปลี่ยนตามระดับสกิล 0..10 — ภาพล้วน ไม่แตะ logic/ดาเมจ/เซฟ
   ชาย:  ลูกไฟ (K) · ฟันหมุน (L) · พุ่งฟัน (I)      หญิง: ลูกน้ำแข็ง (K) · ฟื้นฟู (L) · สายฟ้า (I)
   - ระดับสกิล → "สเตจภาพ" 0..5 (Lv.1-2=1, 3-4=2, 5-6=3, 7-8=4, 9-10=5) · สเตจ 0 = ใช้ภาพเดิมของ art_fx.js ทุกอย่าง
     สเตจเปลี่ยนสี/รูปทรง/องค์ประกอบใหม่ · ส่วน "ขนาด/ความหนา" ขยายต่อเนื่องตามระดับ (เช่น ลูกไฟ +2.5%/ระดับ)
   - art_fx.js เรียก SKILL_FX.proj/fx/bolt/dash ก่อนวาดของเดิม (คืน true = วาดเองแล้ว) · ปิดชั่วคราวเพื่อดีบัก: ?skfx=0
   - สไปรต์ทุกอย่าง bake ครั้งเดียวต่อสเตจ (คิวตอนว่าง GFX.later) · ในลูปมีแค่ drawImage
     สายฟ้า/ลายพุ่งฟัน bake ตอนกดสกิลครั้งละ 1 ภาพเหมือนเดิม · โหมดคุณภาพต่ำ (Q<4) ลดจำนวนอนุภาค
   - ปรับตัวเลข/สีที่ตาราง FIRE / WHP / DASHP / ICEP / HLP / BOLTP ด้านล่าง
   ===================================================================== */
(function(){
  const PI=Math.PI,mix=GFX.mix,HEX=GFX.hex,OFF=/[?&]skfx=0/.test(location.search);
  const mem={},M=(k,f)=>mem[k]||(mem[k]=f());
  const mkF=(w,h,ax,ay,fn,ol)=>{const L=GFX.layer(w,h,ax,ay);fn(L);if(ol)L.outline(.5,ol);return GFX.frame(L)};
  const rgba=(h,a)=>{const c=HEX(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'};
  const hsh=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};
  const lite=()=>{try{return Q<4}catch(e){return false}};
  const lvOf=i=>{try{return skLv(i)}catch(e){return 0}};
  const stOf=lv=>lv<=0?0:Math.min(5,Math.ceil(lv/2));
  const stI=i=>stOf(lvOf(i));
  const rd=Math.round,sn=Math.sin,cs=Math.cos;
  function dr(f,x,y,ang,alpha,sc){
    ctx.save();ctx.translate(rd(x*RS)/RS,rd(y*RS)/RS);if(ang)ctx.rotate(ang);if(sc&&sc!==1)ctx.scale(sc,sc);
    ctx.globalAlpha=Math.max(0,Math.min(1,alpha===undefined?1:alpha));ctx.drawImage(f.b||f.c,-f.ax/RS,-f.ay/RS,f.w/RS,f.h/RS);ctx.restore();ctx.globalAlpha=1;
  }

  /* ---------- สี/ตารางต่อสเตจ (index 0 ไม่ใช้ = ภาพเดิม) ---------- */
  const FIRE=[null,['#c0392b','#ff7a2a','#ffd23a','#fffbd0'],['#d0301e','#ff9a2a','#ffe35a','#ffffff'],['#8a1f3a','#ff5a2a','#ffd23a','#ffffff'],['#5a2a8a','#ff6a3a','#ffe9a0','#cfefff'],['#1f4fc0','#4aa0ff','#bfe8ff','#ffffff']];
  const WHP=[null,['#ffffff','#bfeaff','#5aa0e8'],['#ffffff','#c8ffd8','#4fd0a0'],['#fff6c8','#ffe9a0','#ffc23a'],['#fff0e0','#ffc0a0','#ff6a3a'],['#ffffff','#ffe9a0','#b48aff']];
  const WHN=[0,3,4,4,5,6];                                                       // จำนวนใบมีด
  const DASHP=[null,['#ffffff','#9be0ff','#5aa0e8'],['#ffffff','#9bffd8','#4fd0a0'],['#fff6c8','#ffd23f','#c08a1e'],['#ffe0d0','#ff7a3a','#a02a1a'],['#ffffff','#ffe9a0','#b48aff']];
  const ICEP=[null,['#3f8cff','#9be0ff','#ffffff','#1b3a7a'],['#3f8cff','#9be0ff','#ffffff','#1b3a7a'],['#2fa8ff','#bfeeff','#ffffff','#14407a'],['#2fd0e0','#d8fbff','#ffffff','#0f4a6a'],['#6fe0ff','#e8fbff','#ffffff','#5a3aa0']];
  const HLP=[null,['#7dff9b','#caffd8','#2f9a5a'],['#8dffa8','#e0ffe8','#2f9a5a'],['#5fffd0','#d8fff4','#1f9a8a'],['#c8ff7a','#fffbc0','#7aa02a'],['#ffe066','#fff6c8','#c08a1e']];
  const BOLTP=[null,['#5a8ef0','#bfe0ff','#ffffff'],['#6a5af0','#cfc0ff','#ffffff'],['#8a5aff','#e0d0ff','#ffffff'],['#ffb020','#fff0a0','#ffffff'],['#a06aff','#ffe9a0','#ffffff']];
  const PCOL={m:[FIRE.map(c=>c&&c[2]),WHP.map(c=>c&&c[1]),DASHP.map(c=>c&&c[1])],f:[ICEP.map(c=>c&&c[1]),HLP.map(c=>c&&c[0]),BOLTP.map(c=>c&&c[1])]};
  const DESC={
    m:[['ลูกไฟธรรมดา','ลูกไฟร้อนแรงขึ้น หางยาว มีประกายไฟ','ไส้ในขาวร้อน หางยาวขึ้น · ระเบิดมีคลื่นกระแทกบนพื้น','ลูกไฟแดงเลือดหมู+ทอง มีรัศมีเรืองรอบลูก · ระเบิดคลื่นสองชั้น','ไฟม่วงแกนร้อน มีแฉกประกาย · ระเบิดมีประกายไฟพุ่งขึ้น','ไฟสีฟ้าขาว! ดวงไฟโคจรรอบลูก · ระเบิดเป็นเสาไฟ'],
       ['ฟันหมุนใบมีดสามเล่ม','ใบมีดสีฟ้าเข้มขึ้น หมุนเร็วขึ้น','ใบมีดสีเขียวมรกต 4 เล่ม','ใบมีดทอง วงในหมุนสวนทาง · มีคลื่นพื้น','ใบมีดส้มแดง 5 เล่ม · วงลมเรืองรอบนอก','ใบมีดขาวทอง 6 เล่ม ขอบม่วง · วงลมหมุนรอบ'],
       ['พุ่งฟันลายสีขาวฟ้า','เส้นความเร็วหนาขึ้น กว้างขึ้น','สีเขียวมรกต · มีลูกศรตามทางพุ่ง','เส้นสีทอง · รอยฟันกากบาทที่ปลายทาง · คลื่นกระแทกสองชั้น','สีส้มแดง ลูกศรใหญ่ขึ้น','ขาวทองขอบม่วง · ประกายกระจายตลอดทาง']],
    f:[['ลูกน้ำแข็งธรรมดา','เสี้ยนน้ำแข็งยาวขึ้น หางเรืองฟ้า','มีหนามน้ำแข็งด้านหลัง','ผลึกฟ้าสด · ละอองหิมะตามทาง · มีรอยน้ำแข็งบนพื้นตรงจุดโดน','ผลึกหนามแหลม 3 เสี้ยน (กระสุนข้างๆ ตามมา) · ไอเย็นเขียวมรกต','ผลึกฟ้าขาว ขอบม่วงออโรรา · คลื่นแช่แข็งตอนโดน'],
       ['ฟื้นฟู วงรูนสีเขียว','วงรูนและประกายลอยมากขึ้น','วงรูนซ้อนสองชั้น หมุนสวนทางกัน','เสาแสงสีเขียวมิ้นต์ · วงรูนแปดดวง','เกลียวประกายพันขึ้นฟ้า · สีเขียวทอง','วงรัศมีทองลอยเหนือหัว · เสาแสงสีทอง'],
       ['สายฟ้าสีฟ้า','สายฟ้าหนาขึ้น','สีม่วงคราม · มีกิ่งสายฟ้าแตก','จุดโดนเป็นประกายแฉก · มีคลื่นกระแทกพื้น','สายฟ้าคู่สีทองส้ม · ประกายกระเด็น','สายฟ้าทองขอบม่วง · ประกายกระจายตลอดทาง']]
  };

  /* ---------- สไปรต์ทั่วไป ---------- */
  const sparkF=col=>M('sp'+col,()=>mkF(11,11,5,5,L=>{L.px(-1,-4,3,9,col);L.px(-4,-1,9,3,col);L.px(0,-2,1,5,'#ffffff');L.px(-2,0,5,1,'#ffffff')}));
  const flatRing=(key,c0,c1,c2)=>M('fr'+key,()=>mkF(140,84,70,42,L=>{
    for(let k=0;k<90;k++){const a=k/90*PI*2;L.px(rd(cs(a)*52),rd(sn(a)*26),2,2,c0);L.px(rd(cs(a)*46),rd(sn(a)*22),2,1,c1)}
    for(let k=0;k<110;k++){const a=k/110*PI*2;L.px(rd(cs(a)*58),rd(sn(a)*29),1,1,c2)}
  }));

  /* ================= 1) ลูกไฟ (ชาย K) ================= */
  function fireF(f,st){return M('fb'+st+'_'+f,()=>{const c=FIRE[st],r=9+(st>=3?2:0)+(st>=5?1:0);
    return mkF(120,60,88,30,L=>{
      const w=Math.sin(f*PI/2)*2;
      if(st>=3){L.ell(0,0,r+8,r+8,rgba(c[1],.16));L.ell(0,0,r+5,r+5,rgba(c[1],.2))}
      [[c[0],6,5],[c[1],5,4],[c[2],4,3]].forEach(([col,rx,ry],i)=>{const n=5+st-i;
        for(let k=n;k>=1;k--)L.ell(-r-k*6+i,rd(w*(k%2?1:-1)),Math.max(1,rx+(st>=2?1:0)-k+2),Math.max(1,ry+(st>=2?1:0)-Math.floor(k/2)),col)});
      for(let i=0;i<2+st;i++)L.px(-r-6-Math.floor(hsh(f,i)*40),Math.floor((hsh(i,f+3)-.5)*18),2,2,i%2?c[2]:c[1]);
      L.ell(0,0,r,r,c[0]);L.ell(0,0,r-2,r-2,c[1]);L.ell(0,0,r-4,r-4,c[2]);L.ell(0,0,r-6,r-6,c[3]);L.px(-1,-1,2,2,'#ffffff');
      if(st>=4){L.px(-1,-r-6,3,5,c[2]);L.px(-1,r+2,3,5,c[2]);L.px(r+2,-1,5,3,c[2]);L.px(-r-6,-1,5,3,c[2])}
      if(st>=5)for(let i=0;i<3;i++){const a=f*.8+i*2.09;L.px(rd(cs(a)*(r+6))-1,rd(sn(a)*(r+6))-1,3,3,'#ffffff')}
    })})}
  function boomF(st,step){return M('bm'+st+'_'+step,()=>{const c=FIRE[st],r=8+step*8+st*2;
    return mkF(150,150,75,75,L=>{
      if(step>=3)L.ell(0,-2,r+2,r,st>=5?'rgba(30,40,80,.5)':'rgba(70,40,40,.55)');
      if(st>=2){const rx=r+10,ry=rd(rx*.55);for(let k=0;k<90;k++){const a=k/90*PI*2;L.px(rd(cs(a)*rx),rd(sn(a)*ry)+4,2,2,rgba(c[3],.8))}}
      if(st>=3){const rx=r+18,ry=rd(rx*.55);for(let k=0;k<110;k++){const a=k/110*PI*2;L.px(rd(cs(a)*rx),rd(sn(a)*ry)+4,2,1,rgba(c[2],.6))}}
      L.ell(0,0,r,r,c[0]);L.ell(0,0,rd(r*.8),rd(r*.8),c[1]);L.ell(0,0,rd(r*.55),rd(r*.55),c[2]);
      if(step<4)L.ell(0,0,rd(r*.3),rd(r*.3),c[3]);
      for(let i=0;i<8;i++){const a=i/8*PI*2+step*.3,d=r+3+step*2;L.px(rd(cs(a)*d),rd(sn(a)*d),3,3,i%2?c[2]:c[1])}
      if(st>=4&&step>=1)for(let i=0;i<8;i++)L.px(rd((hsh(i,1)-.5)*r*1.6),rd(-r*.6-hsh(i,2)*r*.9-step*3),2,2,i%2?c[2]:c[3]);
      if(st>=5&&step>=1)for(let j=0;j<4;j++)L.ell(0,-rd(r*.3+j*r*.25),Math.max(2,rd(r*.45-j*3)),Math.max(2,rd(r*.3)),j%2?c[1]:c[2]);
    })})}
  function drawFireProj(p,ang,st,lv){
    const f=Math.floor(S.t*16)%4,sc=1+.025*lv;
    dr(fireF(f,st),p.x,p.y,ang,1,sc);
    if(st>=2&&!lite()){const ux=cs(ang),uy=sn(ang),nx=-uy,ny=ux,n=st>=4?3:2;
      for(let i=0;i<n;i++){const k=(S.t*3+i/n)%1,b=10+k*26,o=(hsh(i,4)-.5)*8;dr(sparkF(FIRE[st][2]),p.x-ux*b+nx*o,p.y-uy*b+ny*o,0,1-k,.5+.4*(1-k))}}
  }
  function drawBoom(e,p,x,y,st,lv){
    dr(boomF(st,Math.min(4,Math.floor(p*5))),x,y,0,1-Math.max(0,p-.5),1+.025*lv);
  }

  /* ================= 2) ฟันหมุน (ชาย L) ================= */
  function whirlF(st){return M('wh'+st,()=>mkF(176,176,88,88,L=>{
    const c=WHP[st],nb=WHN[st],sweep=Math.min(1.5,4.2/nb);
    for(let b=0;b<nb;b++){const base=b*PI*2/nb;
      for(let k=0;k<=40;k++){const t=k/40,ang=base+t*sweep,tp=sn(PI*t),r0=rd(60-tp*6);
        for(let rad=r0;rad<=64;rad++){const q=(rad-r0)/Math.max(1,64-r0);L.px(rd(cs(ang)*rad),rd(sn(ang)*rad),2,2,q>.6?c[0]:q>.25?c[1]:c[2])}}}
    for(let k=0;k<64;k++){const a=k/64*PI*2;if(k%3)L.px(rd(cs(a)*50),rd(sn(a)*50),1,1,c[2])}
    if(st>=4)for(let k=0;k<120;k++){const a=k/120*PI*2;L.px(rd(cs(a)*68),rd(sn(a)*68),1,1,rgba(c[1],.55))}
    if(st>=5)for(let k=0;k<84;k+=6){const a=k/84*PI*2;L.px(rd(cs(a)*76)-1,rd(sn(a)*76)-1,3,3,c[0])}
  }))}
  function whirlInF(st){return M('whi'+st,()=>mkF(120,120,60,60,L=>{
    const c=WHP[st];
    for(let b=0;b<3;b++){const base=b*PI*2/3;
      for(let k=0;k<=30;k++){const t=k/30,ang=base+t*1.2,tp=sn(PI*t),r0=rd(34-tp*4);
        for(let rad=r0;rad<=38;rad++){const q=(rad-r0)/Math.max(1,38-r0);L.px(rd(cs(ang)*rad),rd(sn(ang)*rad),2,2,q>.5?c[0]:c[1])}}}
  }))}
  const shockF=st=>flatRing('dk'+st,DASHP[st][0],DASHP[st][1],DASHP[st][2]);
  function drawWhirl(e,p,x,y,st,lv){
    const sc=.45+p*.55,rot=p*PI*(3.2+.12*lv),al=1-p*.7;
    dr(whirlF(st),x,y,rot,al,sc);
    if(st>=3)dr(whirlInF(st),x,y,-rot*1.3,al,sc);
    if(st>=3&&p>.3)dr(shockF(st),x,y+8,0,(1-p)*.6,.5+p*.7);
  }
  function drawDashShock(e,p,x,y,st){
    dr(shockF(st),x,y+4,0,1-p,.4+p*(.9+.04*st));
    if(st>=3&&p>.2)dr(shockF(st),x,y+4,0,(1-p)*.7,.3+(p-.2)*1.3);
  }

  /* ================= 3) พุ่งฟัน (ชาย I) — bake ตอนกด ================= */
  function pathFrame(pts,pad,fn){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)});
    const w=Math.ceil((x1-x0)*RS)+pad*2,h=Math.ceil((y1-y0)*RS)+pad*2,L=GFX.layer(w,h,pad,pad);
    fn(L,p=>[rd((p.x-x0)*RS),rd((p.y-y0)*RS)]);
    return {f:GFX.frame(L),x:x0,y:y0};
  }
  function dashPF(x0,y0,x1,y1,st){
    const c=DASHP[st];
    return pathFrame([{x:x0,y:y0},{x:x1,y:y1}],28,(L,m)=>{
      const A=m({x:x0,y:y0}),B=m({x:x1,y:y1}),dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux,sp=6+st;
      for(let o=-sp;o<=sp;o+=3){const ctr=Math.abs(o)<4,sh=ctr?1:.6,sx=A[0]+nx*o+dx*(1-sh)*.5,sy=A[1]+ny*o+dy*(1-sh)*.5;
        L.line(rd(sx),rd(sy),rd(B[0]+nx*o),rd(B[1]+ny*o),ctr?c[0]:c[1],ctr?2+(st>=3?1:0):1)}
      if(st>=2){const n=Math.min(6,Math.floor(len/16)),s=5+st;
        for(let i=1;i<=n;i++){const t=i/(n+1),cx=A[0]+dx*t,cy=A[1]+dy*t;
          L.line(rd(cx-ux*s+nx*s),rd(cy-uy*s+ny*s),rd(cx),rd(cy),c[1],2);L.line(rd(cx-ux*s-nx*s),rd(cy-uy*s-ny*s),rd(cx),rd(cy),c[1],2)}}
      L.ell(A[0],A[1],7,5,'#d8d2c0');L.ell(A[0]-3,A[1]+2,5,4,'#bdb7a4');L.ell(A[0]+4,A[1]-2,4,3,'#e8e2d0');
      if(st>=3){const s=8+st*2;L.line(B[0]-s,B[1]-s,B[0]+s,B[1]+s,c[0],2);L.line(B[0]-s,B[1]+s,B[0]+s,B[1]-s,c[0],2);L.ell(B[0],B[1],3,3,c[1])}
      if(st>=5)for(let i=0;i<10;i++){const t=hsh(i,1);L.px(rd(A[0]+dx*t+nx*(hsh(i,2)-.5)*30),rd(A[1]+dy*t+ny*(hsh(i,2)-.5)*30),2,2,i%2?'#ffffff':c[2])}
    });
  }
  function dash(x0,y0,x1,y1){
    if(OFF||P.g!=='m')return false;const st=stI(2);if(!st)return false;
    fx.push({k:'dash',x:0,y:0,t:0,life:.3+.02*st,pf:dashPF(x0,y0,x1,y1,st)});return true;
  }

  /* ================= 4) ลูกน้ำแข็ง (หญิง K) ================= */
  function iceF(st){return M('ic'+st,()=>{const c=ICEP[st],len=11+st,hh=4+(st>=2?1:0)+(st>=4?1:0);
    return mkF(76,40,44,20,L=>{
      L.px(-14-st*2,-1,8+st*2,2,c[0]);
      if(st>=2){L.px(-8,-hh,6,1,c[1]);L.px(-8,hh-1,6,1,c[1])}
      if(st>=3){L.px(-14,-hh-1,6,1,c[0]);L.px(-14,hh,6,1,c[0])}
      if(st>=5)L.px(-22,-1,8,1,'#b48aff');
      L.ell(0,0,len,hh,c[0]);L.ell(1,0,len-2,hh-1,c[1]);L.px(-3,0,len,1,c[2]);L.px(len,0,3,1,c[2]);
      if(st>=4){L.px(len,-3,5,1,c[2]);L.px(len,2,5,1,c[2])}
    },c[3])})}
  function frostF(st){return M('fr_'+st,()=>{const c=ICEP[st],len=22+st*2;
    return mkF(84,84,42,42,L=>{
      const arm=(a,l,w)=>{const x=rd(cs(a)*l),y=rd(sn(a)*l);L.line(0,0,x,y,c[1],w);
        if(st>=2&&w>1){const bx=rd(cs(a)*l*.65),by=rd(sn(a)*l*.65);L.line(bx,by,bx+rd(cs(a+.6)*6),by+rd(sn(a+.6)*6),c[2],1);L.line(bx,by,bx+rd(cs(a-.6)*6),by+rd(sn(a-.6)*6),c[2],1)}};
      for(let i=0;i<6;i++){const a=i*PI/3;arm(a,len,2);L.px(rd(cs(a)*14)-1,rd(sn(a)*14)-1,3,3,'#ffffff')}
      if(st>=5)for(let i=0;i<6;i++)arm(i*PI/3+PI/6,len*.6,1);
      L.ell(0,0,5,5,'#ffffff');L.ell(0,0,3,3,c[0]);
    })})}
  const groundF=st=>M('ig'+st,()=>{const c=ICEP[st];return mkF(100,56,50,28,L=>{
    L.ell(0,0,40,18,rgba('#bfeeff',.25));L.ell(0,0,28,12,rgba('#ffffff',.2));
    for(let i=0;i<10;i++)L.px(rd((hsh(i,1)-.5)*70),rd((hsh(i,2)-.5)*28),2,2,i%2?'#ffffff':c[1])})});
  function drawIce(e,p,st,lv){
    const k=Math.min(1,p*2.4),dx=e.x2-e.x1,dy=e.y2-e.y1,ang=Math.atan2(dy,dx),sc=1+.02*lv,nx=-sn(ang),ny=cs(ang),lt=lite();
    if(!e.sd)e.sd=Math.random()*50;
    if(k<1){
      const ng=Math.min(8,5+st);
      for(let g=0;g<ng;g++){const kk=Math.max(0,k-g*.07);dr(iceF(st),e.x1+dx*kk,e.y1+dy*kk,ang,(1-g/ng)*.55*(1-p),sc)}
      if(st>=4&&!lt)[-1,1].forEach(sd=>{for(let g=0;g<3;g++){const kk=Math.max(0,k-g*.08),off=sd*8*sn(PI*kk);
        dr(iceF(st),e.x1+dx*kk+nx*off,e.y1+dy*kk+ny*off,ang,(1-g/3)*.8*(1-p),sc*.65)}});
      if(st>=3&&!lt)for(let i=0;i<5;i++){const t=Math.max(0,k-i*.05-.03),o=(hsh(i,e.sd)-.5)*10;
        dr(sparkF(i%2?'#ffffff':ICEP[st][1]),e.x1+dx*t+nx*o,e.y1+dy*t+ny*o,0,(1-p)*.9,.5+.4*hsh(i,2))}
      dr(iceF(st),e.x1+dx*k,e.y1+dy*k,ang,1,sc);
    }else{
      const q=(p-.42)/.58;
      if(st>=3)dr(groundF(st),e.x2,e.y2+5,0,(1-q)*.8,.5+q*.6);
      dr(frostF(st),e.x2,e.y2,0,1-q,.6+q*.81*(1+.04*st));
      if(st>=5)dr(flatRing('ic5',ICEP[5][2],ICEP[5][1],'#b48aff'),e.x2,e.y2+3,0,(1-q)*.8,.3+q*1.1);
    }
  }

  /* ================= 5) ฟื้นฟู (หญิง L) ================= */
  function runeF(st,ph){return M('hr'+st+'_'+ph,()=>{const c=HLP[st],n=6+(st>=3?2:0);
    return mkF(120,70,60,35,L=>{
      for(let k=0;k<100;k++){const a=k/100*PI*2;L.px(rd(cs(a)*54),rd(sn(a)*27),2,2,c[0]);L.px(rd(cs(a)*40),rd(sn(a)*20),1,1,c[2])}
      for(let k=0;k<n;k++){const a=k/n*PI*2+.3+ph*.25*(PI*2/n);L.px(rd(cs(a)*47)-1,rd(sn(a)*23)-1,3,3,c[1])}
      if(st>=2){for(let k=0;k<70;k++){const a=k/70*PI*2;L.px(rd(cs(a)*30),rd(sn(a)*15),1,1,c[1])}
        for(let k=0;k<5;k++){const a=-k/5*PI*2+.8-ph*.25*(PI*2/5);L.px(rd(cs(a)*30)-1,rd(sn(a)*15)-1,3,3,c[0])}}
    })})}
  const pillarF=st=>M('hp'+st,()=>{const c=HLP[st];return mkF(40,110,20,104,L=>{
    for(let j=0;j<100;j++){const a=.3*(1-j/100),s=Math.floor(j/12);L.px(-14+s,-j,28-2*s,1,rgba(c[1],a));L.px(-14+s,-j,2,1,rgba(c[0],Math.min(1,a*2)));L.px(12-s,-j,2,1,rgba(c[0],Math.min(1,a*2)))}})});
  const haloF=()=>M('hh5',()=>mkF(72,28,36,14,L=>{
    for(let k=0;k<90;k++){const a=k/90*PI*2;L.px(rd(cs(a)*28),rd(sn(a)*8),2,2,'#ffe066');L.px(rd(cs(a)*24),rd(sn(a)*6),1,1,'#fff6c8')}
    for(let k=0;k<4;k++){const a=k*PI/2+.4;L.px(rd(cs(a)*28)-1,rd(sn(a)*8)-1,3,3,'#ffffff')}}));
  function drawHeal(e,p,x,y,st,lv){
    const c=HLP[st],lt=lite();
    dr(runeF(st,Math.floor(e.t*10)%4),x,y+9,0,1-p*.8,.5+p*.9);
    if(st>=3)dr(pillarF(st),x,y+9,0,sn(PI*p)*.55,1);
    const n=lt?3+st:4+st*2;
    for(let i=0;i<n;i++){const k=(p*1.2+hsh(i,5))%1,xx=x+sn(k*6+i*2)*(8+hsh(i,3)*10),yy=y+8-k*(28+st*4);
      dr(sparkF(i%2?c[1]:c[0]),xx,yy,0,sn(PI*k)*(1-p*.5),.6+.5*(1-k))}
    if(st>=4&&!lt)for(let h=0;h<2;h++)for(let i=0;i<5;i++){const t=i/5,a=p*8+t*5+h*PI;
      dr(sparkF('#ffffff'),x+cs(a)*10*(1-t*.4),y+8-t*34-p*6,0,(1-p)*.9,.5)}
    if(st>=5)dr(haloF(),x,y-24-p*8,0,sn(PI*Math.min(1,p*1.3))*.9,1);
  }

  /* ================= 6) สายฟ้า (หญิง I) — bake ตอนกด ================= */
  function boltPF(ox,oy,targets,st){
    const pts=[{x:ox,y:oy}].concat(targets.map(t=>({x:t.x,y:t.y})));
    return pathFrame(pts,30,(L,m)=>{
      const c=BOLTP[st],jit=14+(st>=3?4:0),tw=[5,6,6,7,8,9][st],mw=[3,3,4,4,5,5][st],rand=Math.random;
      const build=jt=>{const seg=[];
        for(let i=0;i<pts.length-1;i++){const A=m(pts[i]),B=m(pts[i+1]),n=Math.max(3,rd(Math.hypot(B[0]-A[0],B[1]-A[1])/12)),dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
          let prev=A;for(let k=1;k<=n;k++){const t=k/n,j=k===n?0:(rand()-.5)*jt,q=[rd(A[0]+dx*t+nx*j),rd(A[1]+dy*t+ny*j)];seg.push([prev,q]);prev=q}}
        return seg};
      const paint=(seg,wo,wm,wc,co,cm,cc)=>{
        seg.forEach(([a,b])=>L.line(a[0],a[1],b[0],b[1],co,wo));
        seg.forEach(([a,b])=>L.line(a[0],a[1],b[0],b[1],cm,wm));
        seg.forEach(([a,b])=>L.line(a[0]+1,a[1]+1,b[0]+1,b[1]+1,cc,wc))};
      if(st>=4)paint(build(jit+4),Math.max(2,tw-3),Math.max(1,mw-2),1,rgba(c[0],.75),c[1],c[2]);
      const main=build(jit);
      if(st>=2){const nb=Math.min(10,Math.floor(main.length/3)+1);
        for(let i=0;i<nb;i++){const s=main[Math.floor(rand()*main.length)],o=s[0],ang=rand()*PI*2,l1=8+rand()*8,l2=6+rand()*8,
          p1=[rd(o[0]+cs(ang)*l1),rd(o[1]+sn(ang)*l1)],p2=[rd(p1[0]+cs(ang+.7*(rand()-.5)*2)*l2),rd(p1[1]+sn(ang+.7*(rand()-.5)*2)*l2)];
          L.line(o[0],o[1],p1[0],p1[1],c[1],2);L.line(p1[0],p1[1],p2[0],p2[1],c[1],1);L.px(o[0],o[1],1,1,c[2])}}
      paint(main,tw,mw,1+(st>=3?1:0),c[0],c[1],c[2]);
      pts.slice(1).forEach(p=>{const q=m(p),r=8+st*2;L.ell(q[0],q[1],r,r,mix(c[1],c[0],.4));L.ell(q[0],q[1],rd(r*.6),rd(r*.6),c[2]);
        if(st>=3){const s=12+st*2;L.px(q[0]-s,q[1]-1,s*2+1,2,c[1]);L.px(q[0]-1,q[1]-s,2,s*2+1,c[1]);L.px(q[0]-3,q[1]-3,7,7,c[2])}});
      if(st>=5)for(let i=0;i<14;i++){const s=main[Math.floor(rand()*main.length)];L.px(rd(s[0][0]+(rand()-.5)*24),rd(s[0][1]+(rand()-.5)*24),2,2,i%2?'#ffffff':c[1])}
    });
  }
  function bolt(ox,oy,targets){
    if(OFF||P.g!=='f')return false;const st=stI(2);if(!st)return false;
    fx.push({k:'bolt',x:0,y:0,t:0,life:.32+.03*st,pf:boltPF(ox,oy,targets,st)});
    if(st>=3)targets.slice(0,4).forEach(t=>fx.push({k:'skimp',x:t.x,y:t.y,t:0,life:.4,st}));
    return true;
  }
  function drawImpact(e,p,x,y){
    const st=e.st,c=BOLTP[st];
    dr(flatRing('bt'+st,c[0],c[1],c[2]),x,y+4,0,(1-p)*.9,.3+p*.9);
    if(st>=4)for(let i=0;i<4;i++){const a=i*PI/2+PI/4;dr(sparkF(c[1]),x+cs(a)*p*14,y+sn(a)*p*10,0,1-p,.8)}
  }

  /* ================= hook เข้า art_fx.js ================= */
  function proj(p,ang){
    if(OFF||P.g!=='m'||p.ice)return false;const st=stI(0);if(!st)return false;
    drawFireProj(p,ang,st,lvOf(0));return true;
  }
  function fxHook(e,p,x,y){
    if(OFF)return false;
    if(e.k==='skimp'){drawImpact(e,p,x,y);return true}
    if(e.k==='boom'){if(P.g!=='m')return false;const st=stI(0);if(!st)return false;drawBoom(e,p,x,y,st,lvOf(0));return true}
    if(e.k==='ice'){if(P.g!=='f')return false;const st=stI(0);if(!st)return false;drawIce(e,p,st,lvOf(0));return true}
    if(e.k==='ring'){
      if(e.sk==='whirl'){const st=stI(1);if(!st)return false;drawWhirl(e,p,x,y,st,lvOf(1));return true}
      if(e.sk==='dash'){const st=stI(2);if(!st)return false;drawDashShock(e,p,x,y,st);return true}
      if(e.sk==='heal'){const st=stI(1);if(!st)return false;drawHeal(e,p,x,y,st,lvOf(1));return true}
    }
    return false;
  }

  /* ---------- ติดแท็กวงแหวนของสกิล (ให้แยกจากวงแหวนเลเวลอัป/ฉายา) ---------- */
  function tagRing(life,gold,tag,extra){
    for(let i=fx.length-1;i>=0&&i>=fx.length-8;i--){const e=fx[i];
      if(e.k==='ring'&&!e.sk&&!!e.gold===gold&&Math.abs(e.life-life)<.001){e.sk=tag;if(extra)e.life+=extra;return}}
  }
  const _spin=trySpin,_sk3=trySk3;
  trySpin=function(){
    const mp=P.mp;_spin();if(OFF||!(P.mp<mp))return;
    if(P.g==='m'){if(stI(1))tagRing(.36,false,'whirl')}
    else{const st=stI(1);if(st)tagRing(.5,true,'heal',.06*st)}
  };
  trySk3=function(){
    const mp=P.mp;_sk3();if(OFF||!(P.mp<mp))return;
    if(P.g==='m'&&stI(2))tagRing(.3,false,'dash');
  };

  /* ---------- bake ล่วงหน้า + แจ้งเตือนตอนตีบวกสกิลสำเร็จ ---------- */
  function warm(g,i,st){
    if(OFF||!st)return;const q=f=>GFX.later(()=>GFX.touch(f()));
    if(g==='m'){
      if(i===0){for(let f=0;f<4;f++)q(()=>fireF(f,st));for(let s=0;s<5;s++)q(()=>boomF(st,s));q(()=>sparkF(FIRE[st][2]))}
      else if(i===1){q(()=>whirlF(st));if(st>=3)q(()=>whirlInF(st));q(()=>shockF(st))}
      else q(()=>shockF(st));
    }else{
      if(i===0){q(()=>iceF(st));q(()=>frostF(st));if(st>=3)q(()=>groundF(st));if(st>=5)q(()=>flatRing('ic5',ICEP[5][2],ICEP[5][1],'#b48aff'));q(()=>sparkF('#ffffff'));q(()=>sparkF(ICEP[st][1]))}
      else if(i===1){for(let p=0;p<4;p++)q(()=>runeF(st,p));if(st>=3)q(()=>pillarF(st));if(st>=5)q(()=>haloF());q(()=>sparkF(HLP[st][0]));q(()=>sparkF(HLP[st][1]));q(()=>sparkF('#ffffff'))}
      else{if(st>=3)q(()=>flatRing('bt'+st,BOLTP[st][0],BOLTP[st][1],BOLTP[st][2]));q(()=>sparkF(BOLTP[st][1]))}
    }
  }
  const last=[0,0,0],warmed={};let lastKey='';
  const slotKey=()=>{try{return X.slot+'|'+P.g}catch(e){return''}};
  function onUp(i,lv,newStage){
    const st=stOf(lv),col=PCOL[P.g][i][st]||'#ffffff',nm=SK[P.g][i].n;
    ftext(P.x,P.y-52,nm+' Lv.'+lv,col,2,1.4);
    burst(P.x,P.y-12,14+st*3,['#ffffff',col,'#ffe99a'],80,.8,-20,2);
    if(newStage&&DESC[P.g][i][st])setTimeout(()=>toast(nm+': '+DESC[P.g][i][st],3400),900);
  }
  if(!OFF)setInterval(()=>{
    const run=typeof running!=='undefined'&&running,key=slotKey();
    if(!run||key!==lastKey){for(let i=0;i<3;i++)last[i]=lvOf(i);lastKey=key;if(!run)return}
    for(let i=0;i<3;i++){const lv=lvOf(i);
      if(lv>last[i])onUp(i,lv,stOf(lv)>stOf(last[i]));
      last[i]=lv;
      const st=stOf(lv),wk=P.g+i+'_'+st;if(st&&!warmed[wk]){warmed[wk]=1;warm(P.g,i,st)}}
  },100);

  /* ---------- ร้านค้า: บอกว่าระดับถัดไปจะได้เอฟเฟกต์อะไร ---------- */
  const _sh=skHTML;
  skHTML=function(){
    let h=_sh(),x='';
    for(let i=0;i<3;i++){const n=lvOf(i);if(n>=SKL_MAX)continue;const nm=SK[P.g][i].n,sn0=stOf(n),sn1=stOf(n+1);
      x+=sn1>sn0?`<div class="hint">✨ ${nm} Lv.${n+1}: ${DESC[P.g][i][sn1]}</div>`:`<div class="hint">${nm} Lv.${n+1}: เอฟเฟกต์ใหญ่ขึ้นอีกนิด${sn0>=5?' (ลุคสูงสุดแล้ว)':' (ลุคใหม่ที่ Lv.'+(n+2)+')'}</div>`}
    return h+x;
  };

  window.SKILL_FX={proj,fx:fxHook,bolt,dash,warm,DESC,stOf,PAL:{FIRE,WHP,DASHP,ICEP,HLP,BOLTP},frames:{fireF,boomF,whirlF,whirlInF,iceF,frostF,runeF,pillarF,haloF,dashPF,boltPF}};
})();
