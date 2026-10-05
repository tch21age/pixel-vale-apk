'use strict';
/* =====================================================================
   ART FX (กลุ่ม 4): เอฟเฟกต์สกิล 6 อย่าง + ฟันธรรมดา + ระเบิด + เลเวลอัป
   ชาย:  ลูกไฟ (K) · ฟันหมุน (L) · พุ่มฟัน (I)      หญิง: ลูกน้ำแข็ง (K) · ฟื้นฟู (L) · สายฟ้า (I)
   - ทุกเอฟเฟกต์ bake เป็นสไปรต์ที่ 2 เท่า (art px) ครั้งเดียวแล้ว cache → ในลูปมีแค่ drawImage
     (สายฟ้า/ลายพุ่งฟัน bake ตอนกดสกิลครั้งละ 1 ภาพ) ไม่มี shadowBlur / filter
   - ไม่แก้ logic: ทับ drawProj/drawFx (ภาพล้วน) และ wrap tryFire/trySpin/trySk3 เพื่อ "เพิ่ม" fx
     ตรวจว่าร่ายสำเร็จจาก MP ที่ลดลง (ไม่แตะค่าสถานะ/เซฟ)
   ===================================================================== */
(function(){
  const PI=Math.PI,cache={};
  const mem=(k,f)=>cache[k]||(cache[k]=f());
  const mkF=(w,h,ax,ay,fn,ol)=>{const L=GFX.layer(w,h,ax,ay);fn(L);if(ol)L.outline(.5,ol);return GFX.frame(L)};
  function drawRot(f,x,y,ang,alpha,sc){
    ctx.save();ctx.translate(Math.round(x*RS)/RS,Math.round(y*RS)/RS);if(ang)ctx.rotate(ang);if(sc&&sc!==1)ctx.scale(sc,sc);
    if(alpha!==undefined)ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
    ctx.drawImage(f.b||f.c,-f.ax/RS,-f.ay/RS,f.w/RS,f.h/RS);ctx.restore();ctx.globalAlpha=1;
  }

  /* ---------- ฟันธรรมดา: เสี้ยวพระจันทร์ (8 ทิศ×6 ขั้น) ---------- */
  function slashFrame(a,s,step){
    return mem('sl'+Math.round(a*100)+'_'+s+'_'+step,()=>mkF(96,96,48,48,L=>{
      const p=(step+.5)/6,a0=a+s*(-1.25),span=2.5*Math.min(1,p*1.6+.3),tmax=span/2.5;
      for(let k=0;k<=70;k++){const t=k/70;if(t>tmax)break;const u=t/tmax,ang=a0+s*t*2.5,tp=Math.sin(PI*Math.min(1,u*.9+.05));
        const rOut=42,rIn=Math.round(42-3-tp*12);
        for(let rad=rIn;rad<=rOut;rad++){const q=(rad-rIn)/Math.max(1,rOut-rIn);
          L.px(Math.round(Math.cos(ang)*rad),Math.round(Math.sin(ang)*rad),2,2,q>.7?'#ffffff':q>.3?'#cfeeff':'#7fb8ee')}}
    }));
  }

  /* ---------- ลูกไฟ + ระเบิด ---------- */
  function fireFrame(f){return mem('fb'+f,()=>mkF(72,40,52,20,L=>{
    const w=Math.sin(f*PI/2)*2;
    [['#7a2a2a',6,5],['#c0392b',5,4],['#e0602a',4,3]].forEach(([c,rx,ry],i)=>{const n=5-i;for(let k=n;k>=1;k--)L.ell(-9-k*6+i,Math.round(w*(k%2?1:-1)),Math.max(1,rx-k+2),Math.max(1,ry-Math.floor(k/2)),c)});
    L.ell(0,0,9,9,'#c0392b');L.ell(0,0,7,7,'#f0702a');L.ell(0,0,5,5,'#ffc23a');L.ell(0,0,3,3,'#fff4c0');L.px(-1,-1,2,2,'#ffffff');
  }))}
  function iceFrame(){return mem('ice',()=>mkF(44,24,24,12,L=>{
    L.px(-14,-1,8,2,'#3f8cff');L.ell(0,0,11,4,'#3f8cff');L.ell(1,0,9,3,'#9be0ff');L.px(-3,0,11,1,'#ffffff');L.px(11,0,3,1,'#ffffff');
  },'#1b3a7a'))}
  function boomFrame(st){return mem('bm'+st,()=>mkF(112,112,56,56,L=>{
    const r=8+st*8;
    if(st>=3)L.ell(0,-2,r+2,r,'rgba(70,40,40,.55)');
    L.ell(0,0,r,r,'#c0392b');L.ell(0,0,Math.round(r*.8),Math.round(r*.8),'#f0702a');L.ell(0,0,Math.round(r*.55),Math.round(r*.55),'#ffc23a');
    if(st<4)L.ell(0,0,Math.round(r*.3),Math.round(r*.3),'#fff4c0');
    for(let i=0;i<8;i++){const a=i/8*PI*2+st*.3,d=r+3+st*2;L.px(Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d),3,3,i%2?'#ffd23f':'#ff8a3a')}
  }))}

  /* ---------- ฟันหมุน (วงใบมีด) / คลื่นกระแทก / รูนฟื้นฟู / ดาว ---------- */
  function whirlFrame(){return mem('wh',()=>mkF(160,160,80,80,L=>{
    for(let b=0;b<3;b++){const base=b*PI*2/3;
      for(let k=0;k<=40;k++){const t=k/40,ang=base+t*1.5,tp=Math.sin(PI*t);
        for(let rad=Math.round(60-tp*6);rad<=64;rad++){const q=(rad-(60-tp*6))/Math.max(1,(64-(60-tp*6)));
          L.px(Math.round(Math.cos(ang)*rad),Math.round(Math.sin(ang)*rad),2,2,q>.6?'#ffffff':'#bfeaff')}}}
    for(let k=0;k<64;k++){const a=k/64*PI*2;if(k%3)L.px(Math.round(Math.cos(a)*50),Math.round(Math.sin(a)*50),1,1,'#7fb8ee')}
  }))}
  function shockFrame(){return mem('sk',()=>mkF(120,70,60,35,L=>{
    for(let k=0;k<90;k++){const a=k/90*PI*2;L.px(Math.round(Math.cos(a)*52),Math.round(Math.sin(a)*26),2,2,'#ffffff');L.px(Math.round(Math.cos(a)*46),Math.round(Math.sin(a)*22),2,1,'#9be0ff')}
  }))}
  function runeFrame(gold){return mem('ru'+gold,()=>mkF(120,70,60,35,L=>{
    const c1=gold?'#ffd23f':'#7dff9b',c2=gold?'#fff2a0':'#caffd8',c3=gold?'#c08a1e':'#2f9a5a';
    for(let k=0;k<100;k++){const a=k/100*PI*2;L.px(Math.round(Math.cos(a)*54),Math.round(Math.sin(a)*27),2,2,c1);L.px(Math.round(Math.cos(a)*40),Math.round(Math.sin(a)*20),1,1,c3)}
    for(let k=0;k<6;k++){const a=k/6*PI*2+.3;L.px(Math.round(Math.cos(a)*47)-1,Math.round(Math.sin(a)*23)-1,3,3,c2)}
  }))}
  function plusFrame(gold){return mem('pl'+gold,()=>mkF(16,16,8,8,L=>{
    const c=gold?'#ffe066':'#7dff9b';L.px(-1,-4,3,9,c);L.px(-4,-1,9,3,c);L.px(0,-1,1,1,'#ffffff');
  },gold?'#8a5a10':'#1f6a3a'))}
  function frostFrame(){return mem('fr',()=>mkF(56,56,28,28,L=>{
    for(let i=0;i<6;i++){const a=i*PI/3,x=Math.round(Math.cos(a)*22),y=Math.round(Math.sin(a)*22);L.line(0,0,x,y,'#9be0ff',2);
      L.px(Math.round(Math.cos(a)*14)-1,Math.round(Math.sin(a)*14)-1,3,3,'#ffffff')}
    L.ell(0,0,5,5,'#ffffff');L.ell(0,0,3,3,'#3f8cff');
  }))}
  function starFrame(){return mem('st',()=>mkF(64,64,32,32,L=>{
    for(let k=0;k<4;k++){const a=k*PI/2;L.line(0,0,Math.round(Math.cos(a)*22),Math.round(Math.sin(a)*22),'#ffffff',2)}
    L.ell(0,0,7,7,'#fff2a0');L.ell(0,0,4,4,'#ffffff');
  }))}

  /* ---------- bake ตอนร่าย: กรอบจาก path (หน่วย logic) ---------- */
  function pathFrame(pts,pad,fn){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)});
    const w=Math.ceil((x1-x0)*RS)+pad*2,h=Math.ceil((y1-y0)*RS)+pad*2,L=GFX.layer(w,h,pad,pad);
    fn(L,p=>[Math.round((p.x-x0)*RS),Math.round((p.y-y0)*RS)]);
    return {f:GFX.frame(L),x:x0,y:y0};
  }
  function boltFx(ox,oy,targets){
    if(window.SKILL_FX&&SKILL_FX.bolt(ox,oy,targets))return;   // v18: สายฟ้าตามระดับสกิล
    const pts=[{x:ox,y:oy}].concat(targets.map(t=>({x:t.x,y:t.y})));
    const pf=pathFrame(pts,14,(L,m)=>{
      const rand=Math.random,seg=[];
      for(let i=0;i<pts.length-1;i++){const A=m(pts[i]),B=m(pts[i+1]),n=Math.max(3,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/12)),dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
        let prev=A;for(let k=1;k<=n;k++){const t=k/n,j=k===n?0:(rand()-.5)*14,q=[Math.round(A[0]+dx*t+nx*j),Math.round(A[1]+dy*t+ny*j)];seg.push([prev,q]);prev=q}}
      seg.forEach(([a,b])=>L.line(a[0],a[1],b[0],b[1],'#5a8ef0',5));
      seg.forEach(([a,b])=>L.line(a[0],a[1],b[0],b[1],'#bfe0ff',3));
      seg.forEach(([a,b])=>L.line(a[0]+1,a[1]+1,b[0]+1,b[1]+1,'#ffffff',1));
      pts.slice(1).forEach(p=>{const q=m(p);L.ell(q[0],q[1],8,8,'#9bc4ff');L.ell(q[0],q[1],5,5,'#ffffff')});
    });
    fx.push({k:'bolt',x:0,y:0,t:0,life:.32,pf});
  }
  function dashFx(x0,y0,x1,y1){
    if(window.SKILL_FX&&SKILL_FX.dash(x0,y0,x1,y1))return;   // v18: พุ่งฟันตามระดับสกิล
    const pf=pathFrame([{x:x0,y:y0},{x:x1,y:y1}],14,(L,m)=>{
      const A=m({x:x0,y:y0}),B=m({x:x1,y:y1}),dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
      for(let o=-6;o<=6;o+=3){const sh=(Math.abs(o)<4?1:.6),sx=A[0]+nx*o+dx*(1-sh)*.5,sy=A[1]+ny*o+dy*(1-sh)*.5;
        L.line(Math.round(sx),Math.round(sy),Math.round(B[0]+nx*o),Math.round(B[1]+ny*o),Math.abs(o)<4?'#ffffff':'#9be0ff',Math.abs(o)<4?2:1)}
      L.ell(A[0],A[1],7,5,'#d8d2c0');L.ell(A[0]-3,A[1]+2,5,4,'#bdb7a4');L.ell(A[0]+4,A[1]-2,4,3,'#e8e2d0');
    });
    fx.push({k:'dash',x:0,y:0,t:0,life:.3,pf});
  }

  /* ---------- วาดจริง (แทน drawProj / drawFx) ---------- */
  window.drawProj=drawProj=function(){
    for(const p of proj){
      const ang=Math.atan2(p.vy,p.vx);
      if(window.SKILL_FX&&SKILL_FX.proj(p,ang))continue;   // v18: ลูกไฟตามระดับสกิล
      if(p.ice)drawRot(iceFrame(),p.x,p.y,ang);
      else drawRot(fireFrame(Math.floor(S.t*16)%4),p.x,p.y,ang);
    }
  };
  window.drawFx=drawFx=function(){
    for(const e of fx){
      if(e.t<0)continue;
      const p=e.t/e.life,x=e.x,y=e.y;
      if(window.SKILL_FX&&SKILL_FX.fx(e,p,x,y))continue;   // v18: เอฟเฟกต์สกิลตามระดับ (ลูกไฟ/ฟันหมุน/พุ่งฟัน/ลูกน้ำแข็ง/ฟื้นฟู)
      if(e.k==='slash'&&window.SWORD_FX&&SWORD_FX.slash(e,p,x,y)){/* v16: ท่าฟันตามระดับดาบ +1..+10 วาดโดย art_sword.js */}
      else if(e.k==='slash'){const a=Math.atan2(DIRS[P.dir].y,DIRS[P.dir].x);GFX.draw(ctx,slashFrame(e.a,e.s,Math.min(5,Math.floor(p*6))),x,y,false,null,1-p*.9)}
      else if(e.k==='boom'){GFX.draw(ctx,boomFrame(Math.min(4,Math.floor(p*5))),x,y,false,null,1-Math.max(0,p-.5))}
      else if(e.k==='ring'){
        const L=e.life;
        if(e.gold&&L>.55)GFX.draw(ctx,runeFrame(1),x,y+9,false,null,1-p),drawRot(starFrame(),x,y-4-p*10,p*1.5,1-p,.5+p*.6);          // เลเวลอัป
        else if(e.gold){drawRot(runeFrame(0),x,y+9,0,1-p*.8,.5+p*.9)}                                                                // ฟื้นฟู
        else if(L>.33)drawRot(whirlFrame(),x,y,p*PI*3.2,1-p*.7,.45+p*.55);                                                           // ฟันหมุน
        else drawRot(shockFrame(),x,y+4,0,1-p,.4+p*.9);                                                                              // พุ่มฟัน
      }
      else if(e.k==='mote'){const yy=y-p*22,xx=x+Math.sin(p*7+e.ph)*3;GFX.draw(ctx,plusFrame(e.gold),xx,yy,false,null,p<.15?p/.15:1-Math.max(0,(p-.6)/.4))}
      else if(e.k==='ice'){
        const k=Math.min(1,p*2.4),dx=e.x2-e.x1,dy=e.y2-e.y1,ang=Math.atan2(dy,dx);
        if(k<1)for(let g=0;g<5;g++){const kk=Math.max(0,k-g*.07);drawRot(iceFrame(),e.x1+dx*kk,e.y1+dy*kk,ang,(1-g/5)*.55*(1-p))}
        if(k<1)drawRot(iceFrame(),e.x1+dx*k,e.y1+dy*k,ang,1);
        else drawRot(frostFrame(),e.x2,e.y2,0,1-(p-.42)/.58,.6+(p-.42)*1.4);
      }
      else if(e.k==='bolt'||e.k==='dash'){const f=e.pf;GFX.draw(ctx,f.f,f.x,f.y,false,null,(Math.floor(e.t*34)%2?1:.65)*(1-p*p))}
    }
  };

  /* ---------- wrap สกิล: เพิ่ม fx เมื่อร่ายสำเร็จ (ดูจาก MP ที่ลดลง) ---------- */
  const _f=tryFire,_s=trySpin,_k=trySk3;
  tryFire=function(){
    if(P.g!=='f')return _f();
    const ox=P.x,oy=P.y-8,d=DIRS[P.dir];let hit=null,bd=130;
    for(const m of foes()){const vx=m.x-ox,vy=cy(m)-oy,al=vx*d.x+vy*d.y,pp=Math.abs(vx*d.y-vy*d.x);if(al>0&&al<bd&&pp<13){bd=al;hit=m}}
    const mp=P.mp;_f();
    if(P.mp<mp){const L=hit?bd:130;fx.push({k:'ice',x:0,y:0,t:0,life:.4,x1:ox+d.x*8,y1:oy+d.y*8,x2:ox+d.x*L,y2:oy+d.y*L})}
  };
  trySpin=function(){
    const mp=P.mp;_s();
    if(P.g==='f'&&P.mp<mp)for(let i=0;i<6;i++)fx.push({k:'mote',x:P.x+(i-2.5)*4,y:P.y-2,t:-i*.07,life:.8,ph:i*1.7,gold:i%2});
  };
  trySk3=function(){
    const ox=P.x,oy=P.y-8,mp=P.mp;let tg=null;
    if(P.g==='f')tg=foes().filter(m=>Math.hypot(m.x-ox,cy(m)-oy)<90).sort((a,b)=>Math.hypot(a.x-ox,cy(a)-oy)-Math.hypot(b.x-ox,cy(b)-oy)).slice(0,4).map(m=>({x:m.x,y:cy(m)}));
    _k();
    if(P.mp>=mp)return;
    if(P.g==='f'){if(tg&&tg.length)boltFx(ox,oy,tg)}
    else if(Math.hypot(P.x-ox,P.y-8-oy)>2)dashFx(ox,oy,P.x,P.y-8);
  };
  /* v8: bake เอฟเฟกต์ที่ใช้ซ้ำทั้งหมดล่วงหน้า (ฟันธรรมดามีแค่ 4 ทิศ × 6 ขั้น) — เรียกครั้งเดียวตอนเริ่มเกม */
  let warmed=false;
  function warm(){
    if(warmed)return;warmed=true;const q=f=>GFX.later(()=>GFX.touch(f()));
    [[0,1],[PI/2,1],[PI,-1],[-PI/2,1]].forEach(([a,s])=>{for(let st=0;st<6;st++)q(()=>slashFrame(a,s,st))});
    for(let f=0;f<4;f++)q(()=>fireFrame(f));
    q(iceFrame);for(let st=0;st<5;st++)q(()=>boomFrame(st));
    q(whirlFrame);q(shockFrame);q(()=>runeFrame(0));q(()=>runeFrame(1));
    q(()=>plusFrame(0));q(()=>plusFrame(1));q(frostFrame);q(starFrame);
  }
  window.FX_ART={boltFx,dashFx,slashFrame,fireFrame,boomFrame,whirlFrame,runeFrame,frostFrame,warm};
})();
