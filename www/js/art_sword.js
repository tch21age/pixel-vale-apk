'use strict';
/* =====================================================================
   ART SWORD (v16 ส่วน 4): เอฟเฟกต์ดาบเปลี่ยนตามระดับ +0..+10 — ภาพล้วน ไม่แตะ logic/เซฟ
   1) ท่าฟัน (slash) ตามระดับ: สีตามใบดาบ · เสี้ยวหนาขึ้น · +3 เสี้ยวคู่ · +5 ประกายกระเด็น · +7 ดาวที่ปลาย · +9 เงาตาม · +10 ขอบทอง
      (ระยะโจมตีจริงไม่เปลี่ยน) — art_fx.js เรียก SWORD_FX.slash() ก่อน ถ้า +0 คืน false ใช้ภาพเดิม
   2) ออร่า/ประกายที่ตัวละคร (วาดรอบ drawPlayer): ประกายปลายดาบ → ละอองลอย → วงรูนใต้เท้า → แสงเรือง → ลูกแก้วโคจร → รัศมี
   3) ลุคฮีโร่ +6..+10 อยู่ใน art_hero.js (ไหล่เกราะ ปีกหมวก อัญมณี สีตามดาบ)
   4) ตีบวกสำเร็จ: วงแหวน+รัศมีแสงที่ตัวละคร + toast บอกสิ่งที่ปลดล็อก · แท็บตีบวกดาบแสดงตัวอย่างเอฟเฟกต์ของระดับถัดไป
   ทุกสไปรต์ bake ครั้งเดียวต่อสี (คิวตอนว่าง GFX.later) ในลูปมีแค่ drawImage · โหมดคุณภาพต่ำ (Q<4) ลดจำนวนอนุภาค/ตัดรัศมี
   ปิดชั่วคราวเพื่อดีบัก: ?swfx=0 · ปรับตัวเลขที่ TIERS ด้านล่างที่เดียว
   ===================================================================== */
(function(){
  const PI=Math.PI,HEX=GFX.hex,mix=GFX.mix,OFF=/[?&]swfx=0/.test(location.search);
  const mem={},M=(k,f)=>mem[k]||(mem[k]=f());
  const mkF=(w,h,ax,ay,fn,ol)=>{const L=GFX.layer(w,h,ax,ay);fn(L);if(ol)L.outline(.5,ol);return GFX.frame(L)};
  const rgba=(h,a)=>{const c=HEX(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'};
  const colOf=wl=>wl>=10?'#ffd23f':BLADE[wl||0];

  /* ---------- ตารางระดับ (แก้ที่นี่) ---------- */
  const TIERS={
    glint:[0,1,1,1,1,1,1,1,1,1,1],                 // ประกายปลายดาบ
    glintGap:[0,3.2,2.6,2.2,1.9,1.7,1.5,1.3,1.1,1,.9], // วินาทีต่อครั้ง
    motes:[0,0,0,2,3,3,4,4,5,5,6],                  // ละอองประกายลอยรอบตัว
    ring:[0,0,0,0,0,1,1,1,1,1,1],                   // วงรูนใต้เท้า
    glow:[0,0,0,0,0,0,1,1,2,2,2],                   // แสงเรืองหลังตัว (2 = ใหญ่)
    orbs:[0,0,0,0,0,0,0,0,2,3,4],                   // ลูกแก้วโคจร
    rays:[0,0,0,0,0,0,0,0,0,0,1]                    // รัศมีหมุนหลังตัว
  };
  const DESC=['ดาบธรรมดา','ประกายแวบที่ปลายดาบ · ท่าฟันเปลี่ยนสีตามดาบ','ประกายถี่ขึ้น · เสี้ยวฟันหนาขึ้น','ละอองประกายลอยรอบตัว · เสี้ยวฟันคู่ · ด้ามประดับอัญมณี',
    'ใบดาบยาวขึ้น+มีร่อง · ละอองประกายมากขึ้น','วงรูนเรืองแสงใต้เท้า · ประกายกระเด็นตอนฟัน','ลุคฮีโร่ใหม่! ไหล่เกราะ ปีกหมวก ผ้าคลุมทอง · แสงเรืองรอบตัว',
    'อัญมณีที่อก · ใบดาบกว้าง · ท่าฟันมีดาวที่ปลาย','ลูกแก้วโคจร 2 ลูก · ปีกหมวกใหญ่ · แสงเรืองใหญ่ขึ้น','ลูกแก้วโคจร 3 ลูก · เงาฟันตามหลัง · ปลายดาบเรืองแสง',
    'ตำนาน! รัศมีหมุน · ลูกแก้ว 4 ลูก · ท่าฟันขอบทอง'];

  /* ---------- 1) ท่าฟันตามระดับ ---------- */
  const hsh=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};
  function arcPass(L,a0,s,tmax,rOut,thick,pal){
    for(let k=0;k<=70;k++){const t=k/70;if(t>tmax)break;const u=t/tmax,ang=a0+s*t*2.5,tp=Math.sin(PI*Math.min(1,u*.9+.05)),rIn=Math.round(rOut-3-tp*thick);
      for(let rad=rIn;rad<=rOut;rad++){const q=(rad-rIn)/Math.max(1,rOut-rIn);
        L.px(Math.round(Math.cos(ang)*rad),Math.round(Math.sin(ang)*rad),2,2,q>.7?pal[0]:q>.3?pal[1]:pal[2])}}
  }
  function slashFrame(wl,a,s,step){
    return M('sl'+wl+'_'+Math.round(a*100)+'_'+s+'_'+step,()=>mkF(96,96,48,48,L=>{
      const col=colOf(wl),gold=wl>=10,p=(step+.5)/6,a0=a+s*(-1.25),span=2.5*Math.min(1,p*1.6+.3),tmax=span/2.5;
      const pal=[gold?'#fff6c8':'#ffffff',gold?'#fff2a0':mix(col,'#ffffff',.6),gold?'#ffd23f':col];
      const rOut=38+Math.min(4,Math.floor(wl/2.5)),thick=12+wl*.8,angEnd=a0+s*span;
      if(wl>=9)arcPass(L,a0-s*.3,s,Math.max(.05,tmax-.12),rOut-2,thick+2,[mix(col,'#ffffff',.3),mix(col,'#2a1a4a',.2),mix(col,'#2a1a4a',.45)]);   // เงาตามหลัง
      arcPass(L,a0,s,tmax,rOut,thick,pal);
      if(wl>=3)arcPass(L,a0,s,tmax*.92,rOut-Math.round(thick)-6,3,[pal[1],pal[2],mix(col,'#2a1a4a',.3)]);                                        // เสี้ยวคู่ด้านใน
      if(wl>=5){const n=wl>=7?6:4;for(let i=0;i<n;i++){const ang=angEnd+s*(.04+i*.07),rad=Math.min(46,rOut-1+Math.floor(hsh(step,i)*7));
        L.px(Math.round(Math.cos(ang)*rad),Math.round(Math.sin(ang)*rad),2,2,i%2?'#ffffff':col)}}                                              // ประกายกระเด็น
      if(wl>=7){const x=Math.round(Math.cos(angEnd)*(rOut-1)),y=Math.round(Math.sin(angEnd)*(rOut-1)),w=wl>=9?2:1;
        L.px(x-4,y,9,w,'#ffffff');L.px(x,y-4,w,9,'#ffffff');L.px(x-1,y-1,3,3,gold?'#ffd23f':col)}                                                // ดาวที่ปลาย
    }));
  }
  const DIRS4=[[0,1],[PI/2,1],[PI,-1],[-PI/2,1]];
  function slash(e,p,x,y){
    if(OFF)return false;const wl=P.wl|0;if(wl<=0)return false;
    GFX.draw(ctx,slashFrame(wl,e.a,e.s,Math.min(5,Math.floor(p*6))),x,y,false,null,1-p*.9);return true;
  }

  /* ---------- 2) สไปรต์ออร่า (bake ต่อสี) ---------- */
  const glowF=(wl,big)=>M('gw'+wl+big,()=>{const c=colOf(wl),rx=big?34:26,ry=big?42:34;
    return mkF(rx*2+4,ry*2+4,rx+2,ry+2,L=>{for(let i=0;i<7;i++){const k=1-i/7;L.ell(0,0,Math.round(rx*k),Math.round(ry*k),rgba(c,.085))}})});
  const ringF=(wl,f)=>M('rg'+wl+'_'+f,()=>{const c=colOf(wl);
    return mkF(64,34,32,17,L=>{for(let j=0;j<12;j++){const a=(j+f/4)/12*PI*2;L.px(Math.round(Math.cos(a)*28)-1,Math.round(Math.sin(a)*13)-1,3,2,j%3===0?'#ffffff':c);L.px(Math.round(Math.cos(a)*28),Math.round(Math.sin(a)*13)+1,2,1,rgba('#1a1020',.5))}
      for(let k=0;k<64;k++){const a=k/64*PI*2;L.px(Math.round(Math.cos(a)*24),Math.round(Math.sin(a)*11),1,1,rgba(c,.8))}})});
  const moteF=(wl,w)=>M('mt'+wl+w,()=>{const c=w?'#ffffff':colOf(wl);
    return mkF(11,11,5,5,L=>{L.px(-1,-3,3,7,c);L.px(-3,-1,7,3,c);L.px(0,-1,1,1,'#ffffff')})});
  const orbF=wl=>M('ob'+wl,()=>{const c=colOf(wl);return mkF(11,11,5,5,L=>{L.ell(0,0,3,3,c);L.ell(0,0,2,2,mix(c,'#ffffff',.6));L.px(-1,-1,1,1,'#ffffff')},mix(c,'#2a1a4a',.5))});
  const glintF=wl=>M('gl'+wl,()=>{const c=colOf(wl);return mkF(15,15,7,7,L=>{L.px(-1,-6,3,13,mix(c,'#ffffff',.5));L.px(-6,-1,13,3,mix(c,'#ffffff',.5));L.px(-1,-1,3,3,'#ffffff');L.px(0,-4,1,9,'#ffffff');L.px(-4,0,9,1,'#ffffff')})});
  const raysF=wl=>M('ry'+wl,()=>{const c=colOf(wl);return mkF(112,112,56,56,L=>{
    for(let i=0;i<12;i++){const a=i/12*PI*2,len=i%2?34:50;for(let r=18;r<=len;r+=2){const w=r>len-10?1:2;L.px(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),w,w,r>len-14?rgba(c,.5):rgba(c,.8))}}})});
  const burstF=wl=>M('bs'+wl,()=>{const c=colOf(wl);return mkF(80,80,40,40,L=>{for(let i=0;i<16;i++){const a=i/16*PI*2,len=i%2?30:38;for(let r=10;r<=len;r+=2)L.px(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),2,2,r>len-8?'#ffffff':c)}})});

  function warm(wl){
    if(OFF||!wl)return;const q=f=>GFX.later(()=>GFX.touch(f()));
    DIRS4.forEach(([a,s])=>{for(let st=0;st<6;st++)q(()=>slashFrame(wl,a,s,st))});
    const T=TIERS;q(()=>glintF(wl));
    if(T.motes[wl]){q(()=>moteF(wl,0));q(()=>moteF(wl,1))}
    if(T.ring[wl])for(let f=0;f<4;f++)q(()=>ringF(wl,f));
    if(T.glow[wl])q(()=>glowF(wl,T.glow[wl]>1));
    if(T.orbs[wl])q(()=>orbF(wl));
    if(T.rays[wl])q(()=>raysF(wl));
    q(()=>burstF(wl));
  }

  /* ---------- วาดออร่ารอบ drawPlayer ---------- */
  const ups=[];                     // เอฟเฟกต์ตีบวกสำเร็จ {t,life,wl}
  function dr(f,x,y,alpha,ang,sc){
    ctx.save();ctx.translate(Math.round(x*RS)/RS,Math.round(y*RS)/RS);if(ang)ctx.rotate(ang);if(sc&&sc!==1)ctx.scale(sc,sc);
    ctx.globalAlpha=Math.max(0,Math.min(1,alpha));ctx.drawImage(f.b||f.c,-f.ax/RS,-f.ay/RS,f.w/RS,f.h/RS);ctx.restore();ctx.globalAlpha=1;
  }
  const lite=()=>{try{return Q<4}catch(e){return false}};
  function orbPos(i,n,t){const a=t*2.2+i*PI*2/n;return[P.x+Math.cos(a)*11,P.y-11+Math.sin(a)*4.5,Math.sin(a)]}
  function auraBack(wl,t){
    const T=TIERS,lt=lite();
    if(T.rays[wl]&&!lt)dr(raysF(wl),P.x,P.y-11,.28+.1*Math.sin(t*3),t*.35);
    if(T.glow[wl])dr(glowF(wl,T.glow[wl]>1),P.x,P.y-11,.8+.2*Math.sin(t*2.6));
    if(T.ring[wl])dr(ringF(wl,Math.floor(t*6)%4),P.x,P.y+1,.85);
    const n=lt?Math.ceil(T.orbs[wl]/2):T.orbs[wl];
    for(let i=0;i<n;i++){const o=orbPos(i,n,t);if(o[2]<0)dr(orbF(wl),o[0],o[1],.8)}
  }
  function auraFront(wl,t){
    const T=TIERS,lt=lite();
    const n=lt?Math.ceil(T.orbs[wl]/2):T.orbs[wl];
    for(let i=0;i<n;i++){const o=orbPos(i,n,t);if(o[2]>=0)dr(orbF(wl),o[0],o[1],1)}
    const m=lt?Math.ceil(T.motes[wl]/2):T.motes[wl];
    for(let i=0;i<m;i++){const sp=.55+hsh(i,wl)*.35,ph=hsh(i,7),k=(t*sp+ph)%1,xx=P.x+Math.sin(t*1.7+i*2.3)*(7+hsh(i,3)*5),yy=P.y-3-k*26,al=k<.15?k/.15:1-Math.max(0,(k-.55)/.45);
      dr(moteF(wl,i%2),xx,yy,al*.95,0,.6+.5*(1-k))}
    if(T.glint[wl]&&!P.atkT&&!P.castT&&!P.spinT){const gap=T.glintGap[wl],k=(t%gap)/.28;
      if(k<1){const f=Math.sin(PI*k);dr(glintF(wl),P.x+(P.dir===1?-5:5),P.y-13,f,k*1.2,.5+f*.7)}}
  }
  function upFx(t){
    for(let i=ups.length-1;i>=0;i--){const u=ups[i];u.t+=1/60;const p=u.t/u.life;if(p>=1){ups.splice(i,1);continue}
      dr(burstF(u.wl),P.x,P.y-11,1-p,p*.8,.4+p*1.3);
      dr(ringF(u.wl,0),P.x,P.y+1,1-p,0,.6+p*1.6);
      for(let k=0;k<6;k++){const a=k/6*PI*2+p*3;dr(moteF(u.wl,k%2),P.x+Math.cos(a)*(6+p*22),P.y-11+Math.sin(a)*(5+p*14)-p*8,1-p,0,1)}}
  }
  let T0=0;
  const _dp=drawPlayer;
  drawPlayer=function(){
    if(OFF||P.dead)return _dp();
    const wl=P.wl|0,t=S.t;
    if(wl>0)auraBack(wl,t);
    _dp();
    if(wl>0)auraFront(wl,t);
    if(ups.length)upFx(t);
  };

  /* ---------- 4) ตีบวกสำเร็จ + ตัวอย่างในร้านค้า ---------- */
  let lastWl=P.wl|0,warmed=-1;
  setInterval(()=>{
    const run=typeof running!=='undefined'&&running,wl=P.wl|0;
    if(!run){lastWl=wl;return}
    if(wl>lastWl){ups.push({t:0,life:.9,wl});SFX.lvl&&SFX.lvl();
      ftext(P.x,P.y-52,'ดาบ +'+wl,wl>=10?'#ffd23f':colOf(wl),2,1.4);
      if(DESC[wl])toast('ดาบ +'+wl+': '+DESC[wl],3200);
      burst(P.x,P.y-12,20,['#ffffff',colOf(wl),'#ffe99a'],80,.8,-20,2)}
    lastWl=wl;
    if(warmed!==wl){warmed=wl;warm(wl)}
  },100);
  const _uh=upHTML;
  upHTML=function(){
    const h=_uh(),n=P.wl|0;if(n>=WL_MAX)return h+`<div class="hint">เอฟเฟกต์ปัจจุบัน: ${DESC[n]}</div>`;
    return h+`<div class="hint">ตีบวกแล้วจะได้ (+${n+1}): ${DESC[n+1]}</div>`;
  };

  window.SWORD_FX={slash,slashFrame,warm,TIERS,DESC,get ups(){return ups},aura:{glowF,ringF,moteF,orbF,glintF,raysF,burstF}};
})();
