'use strict';
/* =====================================================================
   ART ENV (กลุ่ม 2): พื้นหญ้า ทางดิน น้ำ ต้นไม้ พุ่มไม้ หิน ถ้ำ
   - logic ยังเป็นช่อง 16px (T) เหมือนเดิม: ใช้ z.t / z.solid / z.objs / z.water เดิมทุกอย่าง
   - วาดที่ 2 เท่า (RS=2) ลง canvas ใหญ่ครั้งเดียวต่อโซน (cache ใน z.ground) แล้ว drawImage ย่อลงมา
   - ทับ buildZone (เรียกของเดิมเพื่อสร้างข้อมูล แล้ววาดพื้นใหม่ทับ) และ drawObj/drawTree
   - ไม่มี shadowBlur / filter · สไปรต์ต้นไม้/หิน/พุ่มไม้ bake เป็นเฟรมผ่าน GFX.layer
   ===================================================================== */
const ENV_PAL={
  farm:{base:['#6f8f3c','#7a9a42','#66863a'],dark:'#587a30',light:'#8fae52',tuft:'#4e6e2a',tuftL:'#a2c060'},
  hunt:{base:['#56773a','#5e803f','#4f6f35'],dark:'#41612d',light:'#729552',tuft:'#37552a',tuftL:'#86a863'},
  cave:{base:['#4a4560','#524c68','#433e58'],dark:'#35314a',light:'#6a6486',tuft:'#2e2a42',tuftL:'#7d779c'},
  dirt:['#b08a5a','#a58052','#bb9565'],dirtD:'#8a6a42',dirtL:'#cba874',pebble:['#8d8a82','#a5a299','#6f6c66'],
  water:['#3d6fa8','#356398','#4a80b8'],waterD:'#28507c',waterL:'#8fc0e8',foam:'#d6ecf8',
  leaf:{
    green:['#2f5a2c','#437a38','#5f9a4a','#86b866'],
    teal:['#27565a','#37787a','#52999a','#7dbcb4'],
    autumn:['#7a4a1e','#b0702a','#d89a3a','#f0c264'],
    dead:['#3e3226','#54453a','#6a5a4c','#7e6e5e']},
  trunk:['#3a2616','#57391f','#7a5230'],
  rock:['#3c3a48','#5a5868','#7d7b8a','#a09eac'],
  rockCave:['#2c2a3e','#45425c','#615e7e','#86839f']
};
(function(){
  const RSc=RS;                       // art px ต่อ logic px
  const mixc=GFX.mix;
  const rr=a=>mulberry(a);

  /* ---------- value noise ต่อเนื่อง (ใช้ทำหย่อมหญ้าเข้ม/สว่างและขอบทางไม่เป็นเหลี่ยม) ---------- */
  function mkNoise(seed){
    const r0=rr(seed),G=64,tab=[];for(let i=0;i<G*G;i++)tab.push(r0());
    const at=(x,y)=>tab[((y%G+G)%G)*G+((x%G+G)%G)];
    const sm=t=>t*t*(3-2*t);
    return (x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=sm(x-xi),fy=sm(y-yi);
      const a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);
      return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
  }
  const fbm=(n,x,y)=>n(x,y)*.6+n(x*2.1+7,y*2.1+3)*.3+n(x*4.3+1,y*4.3+9)*.1;

  /* ---------- สไปรต์ที่ bake แล้ว cache ---------- */
  const sprCache={};
  const hexOf=GFX.hex;
  function bake(key,w,h,ax,ay,fn,opt){
    if(sprCache[key])return sprCache[key];
    const L=GFX.layer(w,h,ax,ay);fn(L);
    if(!opt||opt.shade!==false)L.shade(1,.28,.30);
    L.outline(.72);
    return sprCache[key]=GFX.frame(L);
  }
  /* ก้อนใบกลมซ้อนกัน: กลุ่ม blob ทรงกลม + ไฮไลต์บนซ้าย + เงาล่างขวา */
  function blob(L,cx,cy,rx,ry,pal){
    L.ell(cx,cy,rx,ry,pal[1]);
    L.ell(cx-1,cy-1,Math.max(1,rx-2),Math.max(1,ry-2),pal[2]);
    L.ell(cx-2,cy-2,Math.max(1,Math.round(rx*.45)),Math.max(1,Math.round(ry*.4)),pal[3]);
  }
  function leafClump(L,cx,cy,rx,ry,pal,rand){
    L.ell(cx+1,cy+2,rx,ry,pal[0]);                       // ฐานเข้ม
    const n=Math.round(rx/3)+2;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2+rand()*.5,d=.55+rand()*.3;
      const bx=Math.round(cx+Math.cos(a)*rx*d*.7),by=Math.round(cy+Math.sin(a)*ry*d*.6);
      blob(L,bx,by,Math.round(rx*.5+rand()*2),Math.round(ry*.5+rand()),pal);
    }
    blob(L,cx,cy-1,Math.round(rx*.62),Math.round(ry*.62),pal);
    // จุดใบสว่างกระจาย
    for(let i=0;i<Math.round(rx*.9);i++){const a=rand()*Math.PI*2,d=rand()*.8;
      L.px(Math.round(cx+Math.cos(a)*rx*d),Math.round(cy+Math.sin(a)*ry*d-2),2,1,pal[3])}
  }

  const FAMS=['green','teal','autumn'];
  function treeFam(id,v,ox){
    if(id==='hunt')return v===1?'teal':v===2?'autumn':'green';
    return v===2?'autumn':v===1?'teal':'green';
  }
  function treeFrame(id,v,dead,big){
    const fam=dead?'dead':treeFam(id,v);
    const key='tree_'+fam+'_'+(dead?0:v)+'_'+(id==='cave'?'c':'n');
    return bake(key,64,84,32,76,L=>{
      const rand=rr(900+v*37+fam.length*11),P=ENV_PAL.leaf[fam],tk=ENV_PAL.trunk;
      // ลำต้น
      L.px(-4,-26,8,26,tk[1]);L.px(-4,-26,3,26,tk[2]);L.px(2,-26,2,26,tk[0]);
      L.px(-6,-3,12,3,tk[1]);L.px(-7,-1,3,2,tk[1]);L.px(4,-1,3,2,tk[0]);
      if(dead){
        L.px(-1,-46,3,22,tk[1]);L.px(-12,-40,12,3,tk[1]);L.px(-13,-44,3,6,tk[1]);L.px(2,-34,12,3,tk[1]);L.px(11,-40,3,8,tk[1]);
        L.px(-1,-46,1,22,tk[2]);return;
      }
      // พุ่มใบเป็นกลุ่มก้อน
      leafClump(L,0,-44,22,17,P,rand);
      leafClump(L,-12,-36,11,9,P,rand);
      leafClump(L,13,-35,11,9,P,rand);
      leafClump(L,1,-54,13,9,P,rand);
    });
  }
  function bushFrame(fam,v){
    return bake('bush_'+fam+'_'+v,48,34,24,28,L=>{
      const rand=rr(300+v*17+fam.length),P=ENV_PAL.leaf[fam];
      leafClump(L,0,-9,13+v*2,9,P,rand);
      leafClump(L,-9,-5,8,6,P,rand);leafClump(L,9,-5,8,6,P,rand);
    });
  }
  function rockFrame(cave,v){
    const P=cave?ENV_PAL.rockCave:ENV_PAL.rock;
    return bake('rock_'+(cave?'c':'n')+'_'+v,56,52,28,46,L=>{
      // ก้อนหินซ้อนชั้น: ฐานกว้าง + ก้อนกลาง + ก้อนบน
      const poly=(pts,col)=>{const g=L.g;g.fillStyle=col;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(L.ax+x,L.ay+y):g.moveTo(L.ax+x,L.ay+y));g.closePath();g.fill()};
      poly([[-18,0],[-20,-8],[-15,-16],[-4,-19],[8,-18],[17,-12],[20,-4],[17,0]],P[1]);
      poly([[-15,-8],[-12,-17],[-3,-21],[7,-19],[12,-12],[10,-8]],P[2]);
      poly([[-12,-17],[-5,-22],[3,-22],[7,-19],[0,-18],[-8,-15]],P[3]);
      L.px(-17,-4,6,4,P[0]);L.px(10,-8,8,8,P[0]);
      for(let i=0;i<3;i++)L.px(-8+i*7+v,-12+i*2,5,1,P[0]);   // รอยแตกชั้นหิน
      if(!cave){L.px(-14,-9,5,2,'#5f7f3a');L.px(-12,-11,3,2,'#7a9a48')}  // มอส
    },{shade:true});
  }

  /* ---------- พื้น: noise + auto-tile ---------- */
  function paintGround(z){
    const id=z.id,A=ENV_PAL[id==='farm'?'farm':id==='cave'?'cave':'hunt'];
    const S2=RSc,TT=T*S2,[c,g]=mkCanvas(W*TT,H*TT);
    const nz=mkNoise(id==='farm'?5:id==='hunt'?23:41),nz2=mkNoise(id==='farm'?77:id==='hunt'?91:13);
    const rand=rr(id==='farm'?1234:id==='hunt'?5678:9012);
    const isT=(x,y,k)=>z.t[y]&&z.t[y][x]===k;
    const isPathish=(x,y)=>isT(x,y,'p');
    const isWat=(x,y)=>isT(x,y,'w');
    const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
    const GW=W*TT,GH=H*TT;
    const hb=A.base.map(hexOf);
    // 1) ฐานหญ้าไล่เฉดด้วย noise (ทีละ art px)
    const img=g.createImageData(GW,GH),d=img.data;
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
      const n=fbm(nz,x/22,y/22),m=nz2(x/9,y/9);
      let col;
      if(n<.36)col=hexOf(A.dark);else if(n>.64)col=hexOf(A.light);else col=hb[m<.33?0:m<.66?1:2];
      // ขอบหย่อมเฉดแบบ dither บางๆ
      if(Math.abs(n-.36)<.02||Math.abs(n-.64)<.02){if(((x+y)&1)===0)col=hb[0]}
      const i=(y*GW+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;
    }
    g.putImageData(img,0,0);
    // 2) ทางดิน: สร้าง mask ด้วย noise ให้ขอบโค้งไม่เป็นเหลี่ยม
    const dirt=A===ENV_PAL.cave?['#5c5675','#524c6a','#675f82']:ENV_PAL.dirt;
    const dh=dirt.map(hexOf),dD=hexOf(A===ENV_PAL.cave?'#3f3a58':ENV_PAL.dirtD),dL=hexOf(A===ENV_PAL.cave?'#7a7298':ENV_PAL.dirtL);
    const pm=new Uint8Array(GW*GH);       // 1 = ทาง
    const dist=(tx,ty,x,y)=>{ // ระยะ (หน่วย tile) จากจุดใน tile ไปยัง path tile ที่ใกล้ที่สุด 0 = อยู่ใน path
      if(isPathish(tx,ty))return 0;let best=9;
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!isPathish(tx+ox,ty+oy))continue;
        const cx=Math.max((tx+ox)*TT,Math.min(x,(tx+ox+1)*TT-1)),cy=Math.max((ty+oy)*TT,Math.min(y,(ty+oy+1)*TT-1));
        best=Math.min(best,Math.hypot(x-cx,y-cy)/TT)}return best};
    const im2=g.getImageData(0,0,GW,GH),d2=im2.data;
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
      const tx=Math.floor(x/TT),ty=Math.floor(y/TT);
      if(!isPathish(tx,ty)){let near=false;for(let oy=-1;oy<=1&&!near;oy++)for(let ox=-1;ox<=1;ox++)if(isPathish(tx+ox,ty+oy)){near=true;break}if(!near)continue}
      const dd=dist(tx,ty,x,y),wob=(fbm(nz2,x/7,y/7)-.5)*.5;
      // ภายในทางขยายออกเล็กน้อย + wobble ที่ขอบ
      if(dd-.22+wob>.18)continue;
      // ยกเว้นขอบแมพ: ให้ทางลากออกนอกขอบได้เต็ม
      pm[y*GW+x]=1;
      const m=nz(x/8,y/8),col=dh[m<.33?0:m<.66?1:2];
      const i=(y*GW+x)*4;d2[i]=col[0];d2[i+1]=col[1];d2[i+2]=col[2];
    }
    // ขอบทาง: ขอบบนสว่าง ขอบล่างเข้ม + กรวด/เศษหญ้ากลืนขอบ
    const P1=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH&&pm[y*GW+x]===1;
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
      if(!P1(x,y))continue;const i=(y*GW+x)*4;
      if(!P1(x,y+1)||!P1(x+1,y)){d2[i]=dD[0];d2[i+1]=dD[1];d2[i+2]=dD[2]}
      else if(!P1(x,y-1)||!P1(x-1,y)){d2[i]=dL[0];d2[i+1]=dL[1];d2[i+2]=dL[2]}
    }
    g.putImageData(im2,0,0);
    // 3) น้ำ: ฐานลึก + ขอบฝั่ง (auto-tile) + ริ้วคลื่นนิ่ง
    const wh=ENV_PAL.water.map(hexOf);
    for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
      if(!isWat(tx,ty))continue;const X=tx*TT,Y=ty*TT;
      const n0=!isWat(tx,ty-1),s0=!isWat(tx,ty+1),w0=!isWat(tx-1,ty),e0=!isWat(tx+1,ty);
      for(let j=0;j<TT;j++)for(let i=0;i<TT;i++){
        const k=nz2((X+i)/6,(Y+j)/6);px(X+i,Y+j,1,1,ENV_PAL.water[k<.4?0:k<.7?1:2])}
      // โค้งมุม: ตัดมุมให้กลม
      const cut=(cx,cy,sx,sy)=>{const R=7;for(let j=0;j<R;j++)for(let i=0;i<R;i++){if(Math.hypot(i-R+.5,j-R+.5)>R-.3){
        const gx=cx===0?X+i:X+TT-1-i,gy=cy===0?Y+j:Y+TT-1-j;px(gx,gy,1,1,'rgba(0,0,0,0)');g.clearRect(gx,gy,1,1);
        // วาดหญ้าทับ (ใช้สีฐานเฉด 0)
        px(gx,gy,1,1,A.base[0])}}};
      if(n0&&w0)cut(0,0);if(n0&&e0)cut(1,0);if(s0&&w0)cut(0,1);if(s0&&e0)cut(1,1);
      // ขอบฝั่ง
      if(n0){px(X,Y,TT,3,ENV_PAL.waterD);px(X,Y+3,TT,1,ENV_PAL.water[0])}
      if(s0){px(X,Y+TT-4,TT,1,ENV_PAL.waterL);px(X,Y+TT-3,TT,3,ENV_PAL.waterD)}
      if(w0)px(X,Y,3,TT,ENV_PAL.waterD);
      if(e0)px(X+TT-3,Y,3,TT,ENV_PAL.waterD);
      if(A===ENV_PAL.cave){}
      // ริ้วคลื่นคงที่
      for(let i=0;i<3;i++){const a=X+4+Math.floor(rand()*(TT-12)),b=Y+5+Math.floor(rand()*(TT-10));px(a,b,6,1,ENV_PAL.waterL);px(a+1,b+1,3,1,ENV_PAL.water[2])}
    }
    // ริมน้ำ: ขอบหญ้าเข้มด้านนอก
    for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
      if(isWat(tx,ty)||isPathish(tx,ty))continue;
      const X=tx*TT,Y=ty*TT;
      if(isWat(tx,ty+1))px(X,Y+TT-2,TT,2,A.dark);
      if(isWat(tx,ty-1))px(X,Y,TT,1,A.dark);
      if(isWat(tx-1,ty))px(X,Y,2,TT,A.dark);
      if(isWat(tx+1,ty))px(X+TT-2,Y,2,TT,A.dark);
    }
    // 4) กอหญ้า ดอกไม้ ก้อนกรวด กระจายตาม noise
    const free=(x,y)=>{const tx=Math.floor(x/TT),ty=Math.floor(y/TT);return z.t[ty]&&z.t[ty][tx]==='g'&&!P1(x,y)};
    const tuft=(x,y,L2)=>{const col=L2?A.tuftL:A.tuft;px(x,y,1,3,col);px(x-2,y+1,1,2,col);px(x+2,y+1,1,2,col);px(x-1,y,1,1,col);px(x+1,y,1,1,col)};
    for(let i=0;i<Math.round(W*H*3.2);i++){
      const x=Math.floor(rand()*GW),y=Math.floor(rand()*GH);if(!free(x,y))continue;
      tuft(x,y,rand()<.45);
    }
    // กอหญ้าริมทาง (กลืนขอบ)
    for(let i=0;i<W*H*2;i++){
      const x=Math.floor(rand()*GW),y=Math.floor(rand()*GH);
      if(P1(x,y)||!(P1(x+4,y)||P1(x-4,y)||P1(x,y+4)||P1(x,y-4)))continue;
      if(z.t[Math.floor(y/TT)][Math.floor(x/TT)]!=='g')continue;
      tuft(x,y,rand()<.5)}
    // กรวดในและริมทาง
    for(let i=0;i<W*H*2;i++){
      const x=Math.floor(rand()*GW),y=Math.floor(rand()*GH);
      if(!(P1(x,y)||P1(x+3,y+2)))continue;if(P1(x,y)&&rand()<.4)continue;
      const col=ENV_PAL.pebble;if(A===ENV_PAL.cave)continue;
      px(x,y,3,2,col[2]);px(x,y,3,1,col[1]);px(x+1,y,1,1,'#c4c0b6')}
    // ดอกไม้ในฟาร์ม · เห็ดในป่า · ผลึกในถ้ำ
    for(let i=0;i<W*H;i++){
      const x=Math.floor(rand()*GW),y=Math.floor(rand()*GH);if(!free(x,y)||rand()>.16)continue;
      const tx=Math.floor(x/TT),ty=Math.floor(y/TT);if(z.solid[ty][tx])continue;
      if(id==='farm'){const col=['#e88aa8','#f0d868','#f4f0e4','#a890d8'][Math.floor(rand()*4)];
        px(x,y+2,1,3,A.tuft);px(x-1,y,3,3,col);px(x,y+1,1,1,'#f0c040')}
      else if(id==='hunt'){if(rand()<.5){px(x,y+2,2,3,'#e8e0d0');px(x-2,y,6,3,'#b8403a');px(x-1,y,1,1,'#fff');px(x+2,y+1,1,1,'#fff')}}
      else{px(x,y-6,3,8,'#58c8f0');px(x+1,y-9,1,4,'#c8f4ff');px(x-3,y-2,3,5,'#3a98c8');px(x+3,y-1,2,4,'#3a98c8');px(x,y+2,6,1,'rgba(10,6,30,.3)')}
    }
    return c;
  }

  /* ---------- hook: buildZone ---------- */
  const _bz=buildZone;
  window.buildZone=buildZone=function(id){
    const z=_bz(id);                 // สร้าง z.t/solid/objs และพื้นเดิม (ถูกทับด้านล่าง)
    const gnd=paintGround(z),[c,g]=mkCanvas(VW,VH);
    g.imageSmoothingEnabled=false;g.drawImage(gnd,0,0,VW,VH);
    // รั้วไม้ (วาดที่ 2 เท่าด้วย GFX layer)
    z.fence.forEach(([x,y])=>{const f=fenceFrame();GFX.draw(g,f,x*T+8,(y+1)*T,false,null)});
    z.ground=c;z.groundHi=gnd;
    // วัตถุที่เป็นหินในถ้ำ/ป่า: เพิ่มพุ่มไม้เตี้ยแบบกระจุกเป็น decor (ไม่ชน)
    if(id!=='cave'&&!z.decorBush){z.decorBush=true;const h=mulberry(id==='farm'?303:707);
      for(let i=0;i<(id==='farm'?6:12);i++){const x=1+Math.floor(h()*(W-2)),y=1+Math.floor(h()*(H-2));
        if(z.t[y][x]!=='g'||z.solid[y][x]||(id==='farm'&&(y<5||(y>=8&&y<=11&&x>=5&&x<=12))))continue;
        // วางเฉพาะช่องที่อยู่ติดสิ่งกีดขวางอยู่แล้ว เพื่อไม่เปลี่ยน logic การเดิน → วาดเป็น decor ภายในช่องนั้นโดยไม่ตั้ง solid ไม่ได้
        // จึงทำเป็นพุ่มเตี้ยฝังลง ground cache เท่านั้น (ไม่มี collision เหมือนหญ้า)
        const f=bushFrame(['green','teal','autumn'][Math.floor(h()*3)],Math.floor(h()*2));
        GFX.draw(g,GFX.shadow(10,4),x*T+8,y*T+14,false,null);GFX.draw(g,f,x*T+8,y*T+14,false,null)}}
    return z;
  };
  let _fence=null;
  function fenceFrame(){
    if(_fence)return _fence;
    const L=GFX.layer(36,40,18,36);
    L.px(-2,-24,4,24,'#7a5230');L.px(-2,-24,1,24,'#a07040');L.px(-16,-18,32,4,'#a07040');L.px(-16,-8,32,4,'#8a5a34');L.px(-16,-18,32,1,'#c8955a');
    L.shade(1,.25,.3).outline(.7);
    return _fence=GFX.frame(L);
  }

  /* ---------- hook: drawObj (ต้นไม้ หิน) ---------- */
  const _do=drawObj;
  window.drawTree=drawTree=function(x,b,dead,id,v){
    const cx=x+8;
    GFX.drawShadow(ctx,cx,b-1,16,6);
    GFX.draw(ctx,treeFrame(id,v,dead),cx,b-1,false,null);
  };
  window.drawObj=drawObj=function(o){
    if(o.k==='rock'){
      const cave=zone==='cave',v=((o.x/T)*7+(o.b/T)*3)%2;
      GFX.drawShadow(ctx,o.x+8,o.b-1,15,5);
      GFX.draw(ctx,rockFrame(cave,v),o.x+8,o.b-1,false,null);return;
    }
    return _do(o);
  };
  window.ENV_ART={treeFrame,bushFrame,rockFrame,paintGround};
})();
