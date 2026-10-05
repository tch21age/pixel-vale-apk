'use strict';
/* =====================================================================
   PIXEL VALE — 2D Pixel RPG & Farming (single file)
   ===================================================================== */
const $=id=>document.getElementById(id);
const T=16,W=24,H=14,VW=W*T,VH=H*T;           // tile size, map size (tiles), view size (px)
const cv=$('game'); let ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
const MAINCTX=ctx;const Q_FORCED=/[?&]q=([2-4])/.test(location.search);       // ?q=2..4 = ล็อกคุณภาพ (ปิดโหมดลดคุณภาพอัตโนมัติ)
let Q=(function(){const m=/[?&]q=([2-4])/.exec(location.search);if(m)return +m[1];try{const s=+localStorage.getItem('pvq');if(s>=2&&s<=4)return s}catch(e){}return 4})();let CH=VH,camY=0;
const DIRS=[{x:0,y:1},{x:-1,y:0},{x:1,y:0},{x:0,y:-1}];   // 0 down, 1 left, 2 right, 3 up
const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)};
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g]}

/* ---------------- tiny 3x5 pixel font (for in-canvas text) ---------------- */
const FONT={'0':[7,5,5,5,7],'1':[2,6,2,2,7],'2':[7,1,7,4,7],'3':[7,1,7,1,7],'4':[5,5,7,1,1],'5':[7,4,7,1,7],'6':[7,4,7,5,7],'7':[7,1,1,1,1],'8':[7,5,7,5,7],'9':[7,5,7,1,7],
A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],G:[7,4,5,5,7],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],K:[5,5,6,5,5],L:[4,4,4,4,7],M:[5,7,7,5,5],
N:[7,5,5,5,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,7,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],Y:[5,5,2,2,2],Z:[7,1,2,4,7],
'+':[0,2,7,2,0],'-':[0,0,7,0,0],'!':[2,2,2,0,2],'.':[0,0,0,0,2],'/':[1,1,2,4,4],':':[0,2,0,2,0],'%':[5,1,2,4,5],' ':[0,0,0,0,0],'?':[7,1,2,0,2]};
function textW(s,sc){ctx.font='700 '+Math.round(7*sc)+'px Sarabun,sans-serif';return ctx.measureText(String(s)).width}
function pixText(s,x,y,col,sc=1,center=false,out='#0b0b12'){
  s=String(s);x=Math.round(x);y=Math.round(y);
  ctx.font='700 '+Math.round(7*sc)+'px Sarabun,sans-serif';ctx.textAlign=center?'center':'left';ctx.textBaseline='top';
  ctx.lineJoin='round';ctx.lineWidth=Math.max(2,sc*1.6);ctx.strokeStyle=out;ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);
}

/* ---------------- palette ---------------- */
const K={skin:'#f0b88a',skinD:'#d89a6a',hair:'#6b3f1f',hairH:'#8f5a2c',tun:'#3f8f3a',tunD:'#2c6a2c',arm:'#8a5a34',armD:'#5e3b20',scarf:'#c8283a',scarfD:'#8f1c2a',
 cape:'#b01e30',capeD:'#7f1424',pant:'#8c8c96',boot:'#5a3a22',blade:'#d8e0ea',blade2:'#8c94a4',gold:'#d9b24a',eye:'#1d1420',out:'#1a1220',
 gskin:'#4f9a45',gskinD:'#357a34',horn:'#d2c39e',club:'#8a5a34'};

/* =====================================================================
   WORLD / ZONES
   ===================================================================== */
const zones={};
function Z(){return zones[zone]||(zones[zone]=buildZone(zone))}
let zone='farm';
const HZ=()=>zone==='hunt'||zone==='cave';
const plots={};      // "tx,ty" -> plot
const CROPS={turnip:{grow:18,exp:6,name:'หัวผักกาด'},tomato:{grow:32,exp:14,name:'มะเขือเทศ'},pumpkin:{grow:55,exp:32,name:'ฟักทอง'}};
const SEEDS=['seed_turnip','seed_tomato','seed_pumpkin'], CROPKEYS=['turnip','tomato','pumpkin'];
for(let y=8;y<=10;y++)for(let x=6;x<=11;x++)plots[x+','+y]={state:0,crop:null,stage:0,grow:0,watered:false};

function buildZone(id){
  const z={id,t:[],solid:[],inter:[],objs:[],fence:[],water:[],decor:[]};
  for(let y=0;y<H;y++){z.t[y]=[];z.solid[y]=[];z.inter[y]=[];for(let x=0;x<W;x++){z.t[y][x]='g';z.solid[y][x]=false;z.inter[y][x]=null}}
  const h=mulberry(id==='farm'?11:97), occupied=(x,y)=>z.solid[y][x]||z.t[y][x]!=='g';
  const tree=(x,y,dead)=>{if(id==='cave'){z.objs.push({k:'rock',x:x*T,b:(y+1)*T});z.solid[y][x]=true;return}
  z.objs.push({k:'tree',x:x*T,b:(y+1)*T,dead:!!dead,id,v:Math.floor(h()*3)});z.solid[y][x]=true};
  const gate=(x,y)=>(y===5||y===6)&&(id==='farm'?x===W-1:id==='cave'?x===0:(x===0||x===W-1));
  if(id==='farm'){
    for(let x=1;x<W;x++){z.t[5][x]='p';z.t[6][x]='p'}
    z.t[4][2]=z.t[4][3]=z.t[4][19]=z.t[4][20]='p';
    for(let y=9;y<=12;y++)for(let x=16;x<=21;x++){if((x===16||x===21)&&(y===9||y===12))continue;z.t[y][x]='w';z.solid[y][x]=true;z.water.push([x,y])}
    for(let x=5;x<=12;x++){if(x!==8&&x!==9){z.fence.push([x,7])}z.fence.push([x,11])}
    for(let y=8;y<=10;y++){z.fence.push([5,y]);z.fence.push([12,y])}
    z.fence.forEach(([x,y])=>{z.solid[y][x]=true});
    for(let y=1;y<=3;y++)for(let x=1;x<=4;x++)z.solid[y][x]=true;
    for(let y=1;y<=3;y++)for(let x=18;x<=21;x++)z.solid[y][x]=true;
    z.inter[3][2]=z.inter[3][3]='house';z.inter[3][19]=z.inter[3][20]='shop';
    z.objs.push({k:'house',b:64},{k:'shop',b:64},{k:'sign',x:22*T,b:5*T});
    [[7,1],[11,2],[14,1],[2,9],[3,12],[14,11],[8,13],[4,7]].forEach(([x,y])=>{if(!occupied(x,y))tree(x,y)});
  } else {
    for(let x=0;x<=4;x++){z.t[5][x]='p';z.t[6][x]='p'}
    if(id==='hunt')for(let x=W-5;x<W;x++){z.t[5][x]='p';z.t[6][x]='p'}
    if(id==='cave')for(let y=8;y<=11;y++)for(let x=11;x<=14;x++){z.t[y][x]='w';z.solid[y][x]=true;z.water.push([x,y])}
    for(let i=0;i<(id==='cave'?3:16);i++){const x=ri2(h,5,W-6),y=ri2(h,1,H-2);if(!occupied(x,y)&&!z.objs.some(o=>o.x===x*T&&o.b===(y+1)*T))tree(x,y,h()<.35)}
    for(let i=0;i<11;i++){const x=ri2(h,5,W-2),y=ri2(h,1,H-2);if(!occupied(x,y)){z.objs.push({k:'rock',x:x*T,b:(y+1)*T});z.solid[y][x]=true}}
  }
  for(let x=0;x<W;x++){if(!gate(x,0))tree(x,0,id==='hunt'&&h()<.3);tree(x,H-1,id==='hunt'&&h()<.3)}
  for(let y=1;y<H-1;y++){if(!gate(0,y))tree(0,y,id==='hunt'&&h()<.3);if(!gate(W-1,y))tree(W-1,y,id==='hunt'&&h()<.3)}
  // ---- render ground to cache ----
  const [c,g]=mkCanvas(VW,VH), sv=ctx; ctx=g;
  const pal=id==='cave'?['#3a3452','#342e4a','#2b2640','#4b4468']:id==='farm'?['#62b24c','#5aa846','#4f9a3c','#75c85e']:['#4b7f3f','#447739','#3a6a31','#5d9650'];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const px=x*T,py=y*T;
    if(z.t[y][x]==='p'){
      r(px,py,T,T,(x+y)%2?'#cda76e':'#c59f66');
      for(let i=0;i<6;i++)r(px+ri2(h,0,14),py+ri2(h,0,14),2,1,h()<.5?'#a98250':'#e0bf88');
      continue;
    }
    if(z.t[y][x]==='w'){
      r(px,py,T,T,(x+y)%2?'#3a7bd5':'#3573cb');
      const wat=(a,b)=>z.t[b]&&z.t[b][a]==='w';
      if(!wat(x,y-1))r(px,py,T,3,'#2a5da8');if(!wat(x,y+1))r(px,py+T-3,T,3,'#2a5da8');
      if(!wat(x-1,y))r(px,py,3,T,'#2a5da8');if(!wat(x+1,y))r(px+T-3,py,3,T,'#2a5da8');
      continue;
    }
    r(px,py,T,T,h()<.5?pal[0]:pal[1]);
    for(let i=0;i<5;i++)r(px+ri2(h,0,14),py+ri2(h,0,14),2,1,h()<.5?pal[2]:pal[3]);
    if(h()<.2){const a=px+ri2(h,3,12),b=py+ri2(h,3,11);r(a,b,1,3,pal[3]);r(a-2,b+1,1,2,pal[3]);r(a+2,b+1,1,2,pal[3])}
    if(id==='farm'&&h()<.08&&!z.solid[y][x]){const a=px+ri2(h,2,12),b=py+ri2(h,2,12),col=['#ff7aa8','#ffe066','#ffffff','#b48cff'][ri2(h,0,3)];r(a,b,2,2,col);r(a+1,b+1,1,1,'#ffd23f')}
    if(id==='cave'&&h()<.05&&!z.solid[y][x]){const a=px+ri2(h,3,10),b=py+ri2(h,5,12);r(a,b-4,3,6,'#6fd6ff');r(a+1,b-6,1,3,'#c8f4ff');r(a-2,b-1,2,4,'#3f9fd0');r(a+3,b,2,3,'#3f9fd0')}
    if(id==='hunt'){
      if(h()<.1){r(px+ri2(h,1,9),py+ri2(h,2,10),5,3,'#5c5a30');}
      if(h()<.035&&!z.solid[y][x]){const a=px+ri2(h,2,10),b=py+ri2(h,4,10);r(a,b+2,2,3,'#e8e0d0');r(a-1,b,4,2,'#c0392b');r(a,b,1,1,'#fff')}   // mushroom
      if(h()<.03&&!z.solid[y][x]){const a=px+2,b=py+6;r(a,b,12,7,'#2e6b34');r(a+1,b-1,10,1,'#2e6b34');r(a+1,b,6,3,'#3f8f3f')}                  // bush
    }
  }
  z.fence.forEach(([x,y])=>{const px=x*T,py=y*T;r(px+6,py+3,4,13,'#8a5a34');r(px+6,py+3,1,13,'#a8743f');r(px,py+6,T,2,'#a8743f');r(px,py+11,T,2,'#8a5a34');r(px+6,py+2,4,1,'#c89558')});
  ctx=sv; z.ground=c; return z;
}
function ri2(h,a,b){return a+Math.floor(h()*(b-a+1))}

/* ---- static objects ---- */
function drawObj(o){
  if(o.k==='tree')return drawTree(o.x,o.b,o.dead,o.id,o.v);
  if(o.k==='rock'){const x=o.x,b=o.b;r(x+1,b-3,14,3,'rgba(0,0,0,.25)');r(x+2,b-11,12,9,'#7d8294');r(x+3,b-12,9,1,'#7d8294');r(x+3,b-11,5,3,'#a4a9ba');r(x+9,b-6,5,4,'#5f6475');r(x+2,b-3,12,1,'#454a5a');return}
  if(o.k==='sign'){const x=o.x,b=o.b;r(x+7,b-14,2,14,'#5e3b20');r(x+1,b-22,14,9,'#a8743f');r(x+1,b-22,14,1,'#c89558');r(x+3,b-19,7,2,'#f1e9d2');r(x+9,b-20,1,5,'#f1e9d2');r(x+10,b-19,1,3,'#f1e9d2');r(x+11,b-18,1,1,'#f1e9d2');return}
  if(o.k==='house')return drawHouse();
  if(o.k==='shop')return drawShop();
}
function drawTree(x,b,dead,id,v){
  r(x+2,b-3,12,3,'rgba(0,0,0,.22)');
  r(x+6,b-11,4,11,'#5e3b20');r(x+6,b-11,1,11,'#7a4e2c');r(x+5,b-2,6,2,'#5e3b20');
  if(dead){r(x+7,b-22,2,12,'#4a3220');r(x+3,b-21,5,2,'#4a3220');r(x+3,b-23,2,3,'#4a3220');r(x+9,b-18,5,2,'#4a3220');r(x+12,b-21,2,4,'#4a3220');return}
  const dk=id==='farm'?['#2e6b34','#3f8f3f','#5cb050']:['#25502d','#33703a','#4a9248'];
  const rows=[[5,6],[3,10],[2,12],[1,14],[0,16],[0,16],[1,14],[2,12],[3,10],[5,6]];
  rows.forEach((o,i)=>{const y=b-31+i*2;r(x+o[0],y,o[1],2,dk[0]);r(x+o[0],y,Math.max(0,o[1]-3),2,dk[1])});
  r(x+4,b-29,4,2,dk[2]);r(x+9+(v%2),b-25,3,2,dk[2]);r(x+3,b-21,3,2,dk[2]);
  r(x+3,b-11,10,1,'#1f4a26');
}
function drawHouse(){
  const x=16,b=64;
  r(x+44,b-60,8,16,'#7a5a4a');r(x+44,b-60,8,2,'#5a3e32');
  r(x+2,b-28,60,28,'#e6d3a3');r(x+2,b-28,60,2,'#8a5a34');r(x+2,b-3,60,3,'#8a5a34');r(x+2,b-28,3,28,'#8a5a34');r(x+59,b-28,3,28,'#8a5a34');
  for(let i=0;i<8;i++){const inset=(7-i)*4;r(x-2+inset,b-52+i*3,68-2*inset,3,i%2?'#b24a2e':'#9c3f27')}
  r(x-2,b-29,68,2,'#6d2a18');
  r(x+26,b-21,12,21,'#4a2e18');r(x+28,b-19,8,19,'#6b4a2b');r(x+34,b-10,2,2,K.gold);
  [[x+9],[x+45]].forEach(([wx])=>{r(wx,b-21,10,10,'#8a5a34');r(wx+1,b-20,8,8,'#7fc7ff');r(wx+4,b-20,2,8,'#8a5a34');r(wx+1,b-17,8,2,'#8a5a34');r(wx+1,b-20,3,2,'#cfeeff')});
  r(x+2,b-1,60,1,'rgba(0,0,0,.25)');
}
function drawShop(){
  const x=288,b=64;
  r(x+2,b-36,3,36,'#5e3b20');r(x+59,b-36,3,36,'#5e3b20');r(x+4,b-34,56,34,'#7a5230');
  // shopkeeper
  r(x+27,b-26,10,8,K.skin);r(x+25,b-31,14,5,'#2f6fb0');r(x+27,b-27,10,1,'#1f4f88');r(x+29,b-23,2,2,K.eye);r(x+34,b-23,2,2,K.eye);r(x+27,b-18,10,6,'#d9a13f');
  for(let i=0;i<8;i++){const c=i%2?'#f1e9d2':'#d9413f';r(x+i*8,b-42,8,12,c);r(x+i*8+2,b-30,4,2,c)}
  r(x,b-44,64,2,'#8f2a28');
  r(x+14,b-56,36,12,'#5e3b20');r(x+15,b-55,34,10,'#7a5230');
  pixText('ร้านค้า',x+32,b-54,K.gold,1.4,true);
  r(x+2,b-15,60,15,'#a8743f');r(x,b-17,64,3,'#c89558');r(x+2,b-3,60,3,'#7a5230');
  r(x+8,b-21,4,5,'#e0414f');r(x+9,b-23,2,2,'#fff');r(x+16,b-21,4,5,'#3f8cff');r(x+17,b-23,2,2,'#fff');r(x+42,b-20,6,4,'#f59a2a');r(x+50,b-20,5,4,'#9a5fd0');
}

/* =====================================================================
   PLAYER / ENTITIES / STATE
   ===================================================================== */
const S={t:0,minutes:8*60,day:1,sel:0,shake:0,fade:0,toastT:0};
const mons=[],parts=[],floats=[],fx=[],proj=[];
let running=false,paused=false,modal=false,muted=false,spawnT=0;
const ATK_T=.22;
const P={name:'ฮีโร่',x:56,y:84,dir:0,lv:1,exp:0,hp:100,mp:38,gold:60,maxHp:100,maxMp:38,atk:9,expNeed:24,
 atkCd:0,fireCd:0,spinCd:0,atkT:0,castT:0,spinT:0,hurtT:0,invul:0,kx:0,ky:0,walkT:0,step:0,moving:false,dead:false,deadT:0,
 inv:{seed_turnip:5,seed_tomato:0,seed_pumpkin:0,potion_hp:2,potion_mp:0,crop_turnip:0,crop_tomato:0,crop_pumpkin:0,jelly:0,fang:0,pelt:0,tusk:0,wing:0,bone:0,crystal:0,fish_a:0,fish_b:0,fish_c:0,egg:0,milk:0}};
function recalc(){P.maxHp=80+20*P.lv;P.maxMp=30+8*P.lv;P.atk=6+3*P.lv;P.expNeed=Math.floor(24*Math.pow(P.lv,1.55))}
recalc();P.hp=P.maxHp;P.mp=P.maxMp;

const ITEMS={
 seed_turnip:{n:'เมล็ดหัวผักกาด',buy:12},seed_tomato:{n:'เมล็ดมะเขือเทศ',buy:30},seed_pumpkin:{n:'เมล็ดฟักทอง',buy:80},
 potion_hp:{n:'ยาฟื้น HP',buy:30,sell:10,d:'ฟื้น HP 70 หรือ 30% ของ HP สูงสุด (เอาที่มากกว่า)'},potion_mp:{n:'ยาฟื้น MP',buy:25,sell:8,d:'ฟื้น MP 40 หรือ 30% ของ MP สูงสุด (เอาที่มากกว่า)'},
 crop_turnip:{n:'หัวผักกาด',sell:28},crop_tomato:{n:'มะเขือเทศ',sell:70},crop_pumpkin:{n:'ฟักทอง',sell:180},
 jelly:{n:'เยลลี่สไลม์',sell:9},fang:{n:'เขี้ยวก็อบลิน',sell:22}};
const BUY=['seed_turnip','seed_tomato','seed_pumpkin','potion_hp','potion_mp'];
const HOT=['seed_turnip','seed_tomato','seed_pumpkin','potion_hp','potion_mp'];
const MON={
 slime:{name:'สไลม์',hp:22,atk:5,spd:24,exp:9,gold:[2,6],drop:['jelly',.55],aggro:64,range:11,h:12},
 goblin:{name:'ก็อบลิน',hp:48,atk:11,spd:34,exp:24,gold:[8,18],drop:['fang',.45],aggro:86,range:15,h:32}};

/* ---------------- audio ---------------- */
let AC=null;
function audioInit(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f0,f1,d,type='square',v=.05,delay=0){if(!AC||muted)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02)}
function noise(d,v=.05,delay=0){if(!AC||muted)return;const n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=v;s.connect(g);g.connect(AC.destination);s.start(AC.currentTime+delay)}
const SFX={slash:()=>{noise(.1,.04);tone(500,150,.1,'sawtooth',.03)},hit:()=>tone(240,90,.1,'square',.06),crit:()=>{tone(400,100,.12,'square',.07);tone(800,300,.1,'triangle',.05,.03)},
 fire:()=>{noise(.25,.05);tone(200,700,.25,'sawtooth',.04)},boom:()=>{noise(.3,.08);tone(120,40,.3,'square',.06)},spin:()=>{noise(.3,.04);tone(300,700,.3,'sawtooth',.03)},
 hurt:()=>tone(180,50,.25,'sawtooth',.07),coin:()=>{tone(988,988,.07,'square',.04);tone(1319,1319,.12,'square',.04,.07)},pick:()=>tone(660,990,.1,'square',.04),
 till:()=>noise(.08,.05),plant:()=>tone(300,500,.1,'triangle',.06),water:()=>{noise(.2,.03);tone(900,500,.15,'sine',.03)},
 harvest:()=>{tone(523,523,.07,'square',.05);tone(784,784,.1,'square',.05,.07)},lvl:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,f,.14,'square',.06,i*.1))},
 die:()=>tone(300,50,.7,'sawtooth',.08),err:()=>tone(150,120,.12,'square',.05),click:()=>tone(700,700,.04,'square',.03),drink:()=>{tone(400,800,.12,'triangle',.05);tone(800,1000,.1,'triangle',.04,.1)}};

/* =====================================================================
   INPUT
   ===================================================================== */
const held=new Set(), pressQ=[];
const KEYMAP={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',KeyJ:'attack',Space:'attack',KeyK:'fire',KeyL:'spin',KeyI:'sk3'};
addEventListener('keydown',e=>{
  if(document.activeElement&&document.activeElement.tagName==='INPUT')return;
  audioInit();
  const a=KEYMAP[e.code];
  if(a){held.add(a);e.preventDefault();return}
  if(e.repeat)return;
  if(e.code==='KeyE'||e.code==='KeyF'||e.code==='Enter'){pressQ.push('act');e.preventDefault()}
  else if(/^Digit[1-5]$/.test(e.code))pressQ.push('slot'+(+e.code[5]-1));
  else if(e.code==='KeyM')toggleMute();
  else if(e.code==='KeyP'&&running&&!modal)paused=!paused;
  else if(e.code==='Escape')closeShop();
});
addEventListener('keyup',e=>{const a=KEYMAP[e.code];if(a)held.delete(a)});
addEventListener('blur',()=>held.clear());
document.querySelectorAll('[data-hold]').forEach(b=>{const a=b.dataset.hold;
  b.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();held.add(a);b.classList.add('on')});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>{held.delete(a);b.classList.remove('on')}))});
document.querySelectorAll('[data-tap]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();pressQ.push(b.dataset.tap);b.classList.add('on');setTimeout(()=>b.classList.remove('on'),120)}));
(function(){
  const dp=$('dpad');if(!dp)return;
  const parts={up:dp.querySelector('.up'),down:dp.querySelector('.down'),left:dp.querySelector('.left'),right:dp.querySelector('.right')};
  const clear=()=>{['up','down','left','right'].forEach(k=>{held.delete(k);parts[k]&&parts[k].classList.remove('on')})};
  const setDir=e=>{clear();const b=dp.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),dead=b.width*.1,ax=Math.abs(dx),ay=Math.abs(dy);
    const add=k=>{held.add(k);parts[k]&&parts[k].classList.add('on')};
    if(ax>dead&&ax>=ay*.45)add(dx>0?'right':'left');if(ay>dead&&ay>=ax*.45)add(dy>0?'down':'up')};
  dp.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();try{dp.setPointerCapture(e.pointerId)}catch(_){}setDir(e)});
  dp.addEventListener('pointermove',e=>{if(e.buttons||e.pressure>0)setDir(e)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>dp.addEventListener(ev,clear));
})();
function syncSet(){const m=$('mutebtn'),p=$('padbtn'),hp=document.body.classList.contains('hidepad');
  m.dataset.on=muted?0:1;m.querySelector('b').textContent=muted?'ปิด':'เปิด';
  p.dataset.on=hp?0:1;p.querySelector('b').textContent=hp?'ซ่อน':'แสดง';
  try{localStorage.setItem('pvmute',muted?1:0);localStorage.setItem('pvpad',hp?0:1)}catch(e){}}
window.syncSet=syncSet;
$('padbtn').addEventListener('click',()=>{document.body.classList.toggle('hidepad');syncSet()});
$('mutebtn').addEventListener('click',toggleMute);
function toggleMute(){muted=!muted;syncSet();toast(muted?'ปิดเสียง':'เปิดเสียง')}
setTimeout(()=>{try{if(localStorage.getItem('pvmute')==='1')muted=true;if(localStorage.getItem('pvpad')==='0')document.body.classList.add('hidepad')}catch(e){}syncSet()},0);

/* =====================================================================
   HELPERS: toast, floating text, particles
   ===================================================================== */
let toastTimer=0;
function toast(msg,ms=1500){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),ms)}
function ftext(x,y,txt,col='#fff',sc=1,life=.95){floats.push({x:x+rnd(-4,4),y,txt,col,sc,life,max:life})}
function burst(x,y,n,cols,sp=40,life=.5,g=60,size=2){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=rnd(sp*.3,sp);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-sp*.25,life:rnd(life*.6,life),max:life,col:cols[ri(0,cols.length-1)],g,size})}}

/* =====================================================================
   COLLISION
   ===================================================================== */
function blocked(x,y,hw,hh){
  const z=Z(),x0=Math.floor((x-hw)/T),x1=Math.floor((x+hw-.01)/T),y0=Math.floor((y-hh)/T),y1=Math.floor((y-.01)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=W||ty>=H)return true;if(z.solid[ty][tx])return true}
  return false;
}
function moveE(e,dx,dy,hw,hh){
  if(dx){const nx=e.x+dx;if(!blocked(nx,e.y,hw,hh))e.x=nx}
  if(dy){const ny=e.y+dy;if(!blocked(e.x,ny,hw,hh))e.y=ny}
}
function targetTile(){const d=DIRS[P.dir];return {x:Math.floor((P.x+d.x*10)/T),y:Math.floor((P.y-4+d.y*10)/T)}}

/* =====================================================================
   UPDATE
   ===================================================================== */
function update(dt){
  S.minutes+=dt*2;if(S.minutes>=1440){S.minutes-=1440;S.day++}
  S.shake=Math.max(0,S.shake-dt*14);S.fade=Math.max(0,S.fade-dt);
  updatePlayer(dt);
  if(HZ())updateMonsters(dt);
  updateProj(dt);updatePlots(dt);
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)parts.splice(i,1)}
  for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.y-=20*dt;f.life-=dt;if(f.life<=0)floats.splice(i,1)}
  for(let i=fx.length-1;i>=0;i--){fx[i].t+=dt;if(fx[i].t>=fx[i].life)fx.splice(i,1)}
}
function updatePlayer(dt){
  if(P.dead){P.deadT-=dt;if(P.deadT<=0)respawn();return}
  for(const k of ['atkCd','fireCd','spinCd','atkT','castT','spinT','hurtT','invul'])P[k]=Math.max(0,P[k]-dt);
  P.mp=Math.min(P.maxMp,P.mp+dt*(1.4+.05*P.lv));   /* v18: MP ฟื้นเร็วขึ้นตามเลเวล (Lv.30 = 2.9/วิ) เพราะ MP สูงสุดโตตามเลเวลแต่เดิมฟื้นคงที่ */
  if(zone==='farm'&&!anyMonsterNear())P.hp=Math.min(P.maxHp,P.hp+dt*.6);
  let dx=(held.has('right')?1:0)-(held.has('left')?1:0),dy=(held.has('down')?1:0)-(held.has('up')?1:0);
  const busy=P.castT>0||P.spinT>0;
  P.moving=false;
  if(dx||dy){
    if(!busy){
      if(dx&&!dy)P.dir=dx>0?2:1;else if(dy&&!dx)P.dir=dy>0?0:3;
      else{const vert=P.dir===0||P.dir===3;if(vert&&Math.sign(dy)===(P.dir===0?1:-1)){}else if(!vert&&Math.sign(dx)===(P.dir===2?1:-1)){}else P.dir=vert?(dx>0?2:1):(dy>0?0:3)}
    }
    const sp=64*(P.atkT>0?.5:1)*(busy?.3:1),n=Math.hypot(dx,dy);
    moveE(P,dx/n*sp*dt,0,4,5);moveE(P,0,dy/n*sp*dt,4,5);
    P.moving=true;P.walkT+=dt;P.step=Math.floor(P.walkT*9)%4;
  }
  if(P.kx||P.ky){moveE(P,P.kx*dt,0,4,5);moveE(P,0,P.ky*dt,4,5);const d=Math.max(0,1-dt*9);P.kx*=d;P.ky*=d;if(Math.abs(P.kx)<2)P.kx=0;if(Math.abs(P.ky)<2)P.ky=0}
  if(held.has('attack'))tryAttack();if(held.has('fire'))tryFire();if(held.has('spin'))trySpin();
  while(pressQ.length){const q=pressQ.shift();if(q==='act')interact();else if(q.startsWith('slot'))useSlot(+q.slice(4))}
  // zone gates
  if(zone==='farm'&&P.x>=VW-6)changeZone('hunt');
  else if(zone==='hunt'&&P.x>=VW-6)changeZone('cave');
  else if(zone==='hunt'&&P.x<=6)changeZone('farm');
  else if(zone==='cave'&&P.x<=6)changeZone('hunt');
}
function anyMonsterNear(){return false}
function changeZone(id){
  const from=zone;zone=id;proj.length=0;fx.length=0;mons.length=0;
  const L=id==='cave'||(id==='hunt'&&from==='farm');P.x=L?14:VW-14;P.y=86;
  if(HZ())ensureMons();toast(id==='cave'?'ถ้ำคริสตัล (อันตราย!)':id==='hunt'?'ป่าล่าสัตว์':'ฟาร์ม',1800);
  S.fade=.35;Z();save();
}
function respawn(){
  P.dead=false;P.hp=Math.ceil(P.maxHp/2);P.mp=Math.ceil(P.maxMp/2);const lost=Math.floor(P.gold*.15);P.gold-=lost;
  zone='farm';P.x=48;P.y=78;P.dir=0;P.invul=1.5;mons.length=0;proj.length=0;fx.length=0;S.fade=.8;
  toast('คุณตื่นขึ้นที่บ้าน'+(lost?'  -'+lost+'G':''),2200);save();
}
/* ---- combat ---- */
function tryAttack(){
  if(P.atkCd>0||P.castT>0||P.spinT>0||modal)return;
  P.atkCd=.36;P.atkT=ATK_T;SFX.slash();
  const d=DIRS[P.dir],cx=P.x,cy=P.y-8,base=Math.atan2(d.y,d.x);
  fx.push({k:'slash',x:cx,y:cy,a:base,t:0,life:.2,s:(P.dir===1?-1:1)});
  if(!HZ())return;
  for(const m of mons){if(m.dead)continue;const vx=m.x-cx,vy=(m.y-MON[m.type].h/2)-cy,dist=Math.hypot(vx,vy);
    if(dist<=30&&(dist<12||(vx*d.x+vy*d.y)/dist>.35)){const crit=Math.random()<.12;hitMonster(m,Math.max(1,Math.round(P.atk*rnd(.85,1.2)*(crit?1.8:1))),cx,cy,crit?95:70,crit)}}
}
/* v16: ค่าสำรองของสกิล (ถ้าลูปเกมวิ่งก่อน world.js โหลด) — world.js ประกาศฟังก์ชันชื่อเดียวกันทับด้วยค่าจริงตามระดับสกิล */
function skMp(i){return[10,14,13][i]}
function skCd(i){return[.7,1.1,2][i]}
function skDm(){return 1}
function tryFire(){
  if(P.fireCd>0||P.castT>0||P.atkT>0||P.spinT>0||modal)return;
  const mpN=skMp(0);if(P.mp<mpN){SFX.err();flashMp();P.fireCd=.25;return}
  P.mp-=mpN;P.fireCd=skCd(0);P.castT=.28;SFX.fire();
  const d=DIRS[P.dir];
  proj.push({x:P.x+d.x*10,y:P.y-8+d.y*8,vx:d.x*150,vy:d.y*150,life:1.3,dmg:P.atk*2.4*skDm(0),tr:0});
  burst(P.x+d.x*8,P.y-8+d.y*8,8,['#9be0ff','#fff','#3f8cff'],50,.4,0);
}
function trySpin(){
  if(P.spinCd>0||P.castT>0||P.atkT>0||modal)return;
  const mpN=skMp(1);if(P.mp<mpN){SFX.err();flashMp();P.spinCd=.25;return}
  P.mp-=mpN;P.spinCd=skCd(1);P.spinT=.36;SFX.spin();S.shake=2;
  fx.push({k:'ring',x:P.x,y:P.y-8,t:0,life:.36});
  if(HZ())for(const m of mons){if(m.dead)continue;if(Math.hypot(m.x-P.x,(m.y-MON[m.type].h/2)-(P.y-8))<=34){const crit=Math.random()<.15;hitMonster(m,Math.round(P.atk*1.8*skDm(1)*rnd(.9,1.15)*(crit?1.6:1)),P.x,P.y-8,130,crit)}}
}
function flashMp(){const b=$('mpbar');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast('MP ไม่พอ!',900)}
function hitMonster(m,dmg,fx0,fy0,kb,crit){
  m.hp-=dmg;m.hurtT=.18;const a=Math.atan2(m.y-fy0,m.x-fx0);m.kx=Math.cos(a)*kb;m.ky=Math.sin(a)*kb;
  if(m.state==='wander')m.state='chase';if(m.state==='windup'){m.state='chase';m.t=0}
  ftext(m.x,m.y-MON[m.type].h-4,crit?dmg+'!':dmg,crit?'#ffd23f':'#ffffff',crit?2:1);
  burst(m.x,m.y-MON[m.type].h/2,crit?9:5,['#fff','#ffd23f','#ff8a3a'],55,.3,60);
  crit?SFX.crit():SFX.hit();S.shake=Math.max(S.shake,crit?2:1);
  if(m.hp<=0)killMonster(m);
}
function killMonster(m){
  m.dead=true;const d=MON[m.type];SFX.pick();
  burst(m.x,m.y-d.h/2,16,m.type==='slime'?['#4fb0e8','#9be0ff','#2b72b0']:['#4f9a45','#357a34','#d2c39e'],70,.6,90,3);
  const g=Math.round(ri(d.gold[0],d.gold[1])*(m.gm||1));P.gold+=g;ftext(m.x,m.y-d.h-12,'+'+g+'G','#ffd23f');
  setTimeout(()=>{SFX.coin()},60);
  gainExp(Math.max(1,Math.round(d.exp*(m.em||1))),m.x,m.y-d.h-20);
  if(Math.random()<d.drop[1]){P.inv[d.drop[0]]++;ftext(m.x,m.y-d.h-24+10,'+1 '+ITEMS[d.drop[0]].n,'#9be0ff');refreshHot()}
  spawnT=Math.min(spawnT,1.5);
}
function gainExp(n,x,y){
  P.exp+=n;ftext(x===undefined?P.x:x,y===undefined?P.y-34:y,'+'+n+' EXP','#8ee05a');
  let up=false;while(P.exp>=P.expNeed&&P.lv<99){P.exp-=P.expNeed;P.lv++;recalc();P.hp=P.maxHp;P.mp=P.maxMp;up=true}
  if(up){SFX.lvl();ftext(P.x,P.y-44,'เลเวลอัป!','#ffd23f',2,1.5);fx.push({k:'ring',x:P.x,y:P.y-8,t:0,life:.6,gold:true});burst(P.x,P.y-10,24,['#ffd23f','#fff','#ffe99a'],80,.9,-10,2);toast('เลเวลอัป! เลเวล '+P.lv,2000);save()}
}
function takeDamage(dmg,fx0,fy0){
  if(P.invul>0||P.dead)return;
  P.hp-=dmg;P.invul=.75;P.hurtT=.25;const a=Math.atan2(P.y-fy0,P.x-fx0);P.kx=Math.cos(a)*100;P.ky=Math.sin(a)*100;
  ftext(P.x,P.y-30,'-'+dmg,'#ff5a66',1);SFX.hurt();S.shake=3;burst(P.x,P.y-10,6,['#ff5a66','#fff'],50,.3,80);
  if(P.hp<=0){P.hp=0;P.dead=true;P.deadT=2.4;SFX.die()}
}
/* ---- projectiles ---- */
function updateProj(dt){
  for(let i=proj.length-1;i>=0;i--){const p=proj[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.tr-=dt;
    if(p.tr<=0){p.tr=.03;parts.push({x:p.x,y:p.y,vx:rnd(-8,8),vy:rnd(-8,8),life:.3,max:.3,col:['#ff8a3a','#ffd23f','#e0414f'][ri(0,2)],g:0,size:2})}
    let hit=p.life<=0||blocked(p.x,p.y+2,2,2);
    if(!hit&&HZ())for(const m of mons){if(!m.dead&&Math.hypot(m.x-p.x,(m.y-MON[m.type].h/2)-p.y)<10){hit=true;break}}
    if(hit){explode(p.x,p.y,p.dmg);proj.splice(i,1)}}
}
function explode(x,y,dmg){
  SFX.boom();S.shake=3;fx.push({k:'boom',x,y,t:0,life:.35});burst(x,y,22,['#ff8a3a','#ffd23f','#e0414f','#fff'],95,.5,40,3);
  if(HZ())for(const m of mons){if(!m.dead&&Math.hypot(m.x-x,(m.y-MON[m.type].h/2)-y)<=26){const crit=Math.random()<.1;hitMonster(m,Math.round(dmg*rnd(.9,1.12)*(crit?1.5:1)),x,y,110,crit)}}
}
/* ---- monsters ---- */
function ensureMons(){while(mons.filter(m=>!m.dead).length<5)spawnMon()}
function spawnMon(){
  for(let tries=0;tries<30;tries++){
    const x=ri(6,W-2)*T+8,y=ri(1,H-2)*T+14;
    if(blocked(x,y,5,4)||Math.hypot(x-P.x,y-P.y)<90)continue;
    const type=pickType(),d=MON[type];
    mons.push({type,x,y,hp:d.hp,dead:false,state:'wander',t:rnd(.3,1.5),vx:0,vy:0,kx:0,ky:0,hurtT:0,atkCd:rnd(.3,1),face:1,anim:Math.random()*6});return}
}
function updateMonsters(dt){
  for(let i=mons.length-1;i>=0;i--)if(mons[i].dead)mons.splice(i,1);
  spawnT-=dt;if(spawnT<=0){if(mons.length<8)spawnMon();spawnT=5}
  for(const m of mons){
    const d=MON[m.type];m.anim+=dt;m.hurtT=Math.max(0,m.hurtT-dt);m.atkCd-=dt;m.t-=dt;
    const px=P.x,py=P.y-6,dx=px-m.x,dy=py-m.y,dist=Math.hypot(dx,dy)||1;
    if(m.kx||m.ky){moveE(m,m.kx*dt,0,5,4);moveE(m,0,m.ky*dt,5,4);const k=Math.max(0,1-dt*8);m.kx*=k;m.ky*=k}
    if(m.hurtT>.1)continue;
    if(P.dead&&m.state!=='wander'){m.state='wander';m.t=1}
    if(m.state==='wander'){
      if(m.t<=0){m.t=rnd(1,2.6);if(Math.random()<.35){m.vx=m.vy=0}else{const a=Math.random()*6.283;m.vx=Math.cos(a);m.vy=Math.sin(a)}}
      const sp=d.spd*.45;moveE(m,m.vx*sp*dt,0,5,4);moveE(m,0,m.vy*sp*dt,5,4);if(m.vx)m.face=m.vx>0?1:-1;
      if(!P.dead&&dist<d.aggro){m.state='chase';SFX.click&&0}
    }else if(m.state==='chase'){
      if(dist>d.aggro*2.2){m.state='wander';m.t=1;continue}
      m.face=dx>0?1:-1;
      if(dist>d.range*.8){const sp=d.spd;moveE(m,dx/dist*sp*dt,0,5,4);moveE(m,0,dy/dist*sp*dt,5,4)}
      if(dist<=d.range&&m.atkCd<=0){m.state='windup';m.t=.38}
    }else if(m.state==='windup'){
      if(m.t<=0){
        const dd=Math.hypot(P.x-m.x,(P.y-6)-m.y);
        m.kx=(dx/dist)*80;m.ky=(dy/dist)*80;
        if(dd<=d.range+7){const ma=m.atk||d.atk;takeDamage(ma+ri(-1,2+Math.floor(ma/12)),m.x,m.y)}
        m.atkCd=1.15;m.state='chase';
      }
    }
    // soft separation
    for(const o of mons){if(o===m||o.dead)continue;const ox=m.x-o.x,oy=m.y-o.y,od=Math.hypot(ox,oy);if(od>0&&od<9){moveE(m,ox/od*20*dt,0,5,4);moveE(m,0,oy/od*20*dt,5,4)}}
  }
}
/* ---- farming ---- */
function updatePlots(dt){
  for(const k in plots){const p=plots[k];
    if(p.state===2&&p.watered&&p.stage<3){p.grow+=dt;const t=CROPS[p.crop].grow,ns=p.grow>=t?3:Math.floor(p.grow/(t/3));
      if(ns!==p.stage){p.stage=ns;const [x,y]=k.split(',').map(Number);burst(x*T+8,y*T+8,6,['#b4f07d','#fff','#ffd23f'],30,.5,-10)}}}
}
function interact(){
  if(modal||P.dead)return;
  if(zone!=='farm'){toast('ที่นี่ไม่มีอะไร');return}
  const z=Z(),t=targetTile(),own={x:Math.floor(P.x/T),y:Math.floor((P.y-2)/T)};
  const inb=(a,b)=>a>=0&&b>=0&&a<W&&b<H;
  if(inb(t.x,t.y)){const k=z.inter[t.y][t.x];if(k==='shop')return openShop();if(k==='house')return rest()}
  if(plots[t.x+','+t.y])return plotAct(plots[t.x+','+t.y],t.x,t.y);
  if(plots[own.x+','+own.y])return plotAct(plots[own.x+','+own.y],own.x,own.y);
  toast('หันหน้าเข้าแปลงดิน ร้านค้า หรือบ้าน');
}
function plotAct(pl,tx,ty){
  const cx=tx*T+8,cy=ty*T+8;
  if(pl.state===0){pl.state=1;SFX.till();burst(cx,cy+4,9,['#8b6a45','#6b4a2b','#a98250'],45,.4,140);return}
  if(pl.state===1){
    const key=SEEDS[S.sel];
    if(P.inv[key]>0){P.inv[key]--;pl.state=2;pl.crop=CROPKEYS[S.sel];pl.stage=0;pl.grow=0;pl.watered=false;SFX.plant();burst(cx,cy+2,6,['#5a3d22','#c9b072'],30,.3,100);refreshHot()}
    else{toast('ไม่มี'+ITEMS[key].n+'! ไปซื้อที่ร้านค้า');SFX.err()}
    return}
  if(pl.stage>=3){
    const n=1+(Math.random()<.25?1:0),c=pl.crop;P.inv['crop_'+c]+=n;SFX.harvest();
    ftext(cx,cy-8,'+'+n+' '+CROPS[c].name,'#ffd23f');burst(cx,cy,12,['#ffd23f','#fff','#b4f07d'],60,.5,80);
    gainExp(CROPS[c].exp,cx,cy-20);pl.state=1;pl.crop=null;pl.stage=0;pl.grow=0;pl.watered=false;refreshHot();return}
  if(!pl.watered){pl.watered=true;SFX.water();burst(cx,cy-6,10,['#3a7bd5','#9be0ff','#fff'],35,.5,120);ftext(cx,cy-10,'รดน้ำแล้ว','#9be0ff')}
  else toast('กำลังโต... '+Math.round(pl.grow/CROPS[pl.crop].grow*100)+'%',900);
}
function rest(){
  const night=S.minutes>=20*60||S.minutes<5*60;
  P.hp=P.maxHp;P.mp=P.maxMp;SFX.lvl();S.fade=.7;
  if(night){S.minutes=6*60;S.day++}
  toast(night?'อรุณสวัสดิ์! HP/MP เต็มแล้ว':'พักผ่อนแล้ว! HP/MP เต็มแล้ว',1800);save();
}
function useSlot(i){
  if(i<3){S.sel=i;SFX.click();refreshHot();toast('เลือก: '+ITEMS[SEEDS[i]].n,900);return}
  const key=HOT[i];
  if(P.inv[key]<=0){toast('ไม่มี'+ITEMS[key].n);SFX.err();return}
  if(key==='potion_hp'){if(P.hp>=P.maxHp){toast('HP เต็มแล้ว');return}const hn=Math.max(70,Math.round(P.maxHp*.3));P.hp=Math.min(P.maxHp,P.hp+hn);ftext(P.x,P.y-30,'+'+hn+' HP','#ff7a86')}
  else{if(P.mp>=P.maxMp){toast('MP เต็มแล้ว');return}const mn=Math.max(40,Math.round(P.maxMp*.3));P.mp=Math.min(P.maxMp,P.mp+mn);ftext(P.x,P.y-30,'+'+mn+' MP','#7fb6ff')}
  P.inv[key]--;SFX.drink();burst(P.x,P.y-10,8,key==='potion_hp'?['#ff7a86','#fff']:['#7fb6ff','#fff'],40,.5,-20);refreshHot();
}

/* =====================================================================
   SHOP
   ===================================================================== */
let shopTab='buy';
function openShop(){modal=true;held.clear();$('shop').classList.remove('hidden');renderShop();SFX.click()}
function closeShop(){if(!$('shop').classList.contains('hidden')){$('shop').classList.add('hidden');modal=false;save()}}
function renderShop(){
  const L=$('shoplist');$('shopgold').textContent=P.gold+' G';
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===shopTab));
  let h='';
  if(shopTab==='buy'){BUY.forEach(k=>{const it=ITEMS[k];h+=`<div class="item"><img class="px" src="${IC[k]}" alt=""><div class="nm">${it.n}<small>${it.d||'มีอยู่: '+P.inv[k]}</small></div><span class="pr">${it.buy}G</span><button class="mini" data-a="buy" data-k="${k}" data-n="1" ${P.gold<it.buy?'disabled':''}>ซื้อ</button><button class="mini" data-a="buy" data-k="${k}" data-n="5" ${P.gold<it.buy*5?'disabled':''}>x5</button></div>`})}
  else{const ks=Object.keys(ITEMS).filter(k=>ITEMS[k].sell&&P.inv[k]>0);
    h=ks.length?ks.map(k=>{const it=ITEMS[k];return `<div class="item"><img class="px" src="${IC[k]}" alt=""><div class="nm">${it.n}<small>x${P.inv[k]}</small></div><span class="pr">${it.sell}G</span><button class="mini" data-a="sell" data-k="${k}" data-n="1">ขาย</button><button class="mini" data-a="sell" data-k="${k}" data-n="${P.inv[k]}">ทั้งหมด</button></div>`}).join(''):'<div class="hint" style="padding:12px">ยังไม่มีของให้ขาย<br>เก็บเกี่ยวพืชผลหรือล่ามอนสเตอร์ดูสิ!</div>'}
  L.innerHTML=h;
}
$('shoplist').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b||b.disabled)return;audioInit();
  const k=b.dataset.k,n=+b.dataset.n,it=ITEMS[k];
  if(b.dataset.a==='buy'&&P.gold>=it.buy*n){P.gold-=it.buy*n;P.inv[k]+=n;SFX.coin()}
  else if(b.dataset.a==='sell'&&P.inv[k]>=n){P.inv[k]-=n;P.gold+=it.sell*n;SFX.coin()}
  refreshHot();renderShop()});
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{shopTab=b.dataset.tab;SFX.click();renderShop()}));
$('shopclose').addEventListener('click',closeShop);
$('shop').addEventListener('pointerdown',e=>{if(e.target===$('shop'))closeShop()});

/* =====================================================================
   SAVE / LOAD
   ===================================================================== */
const SAVEKEY='pixelvale_save_v1';
function save(){try{localStorage.setItem(SAVEKEY,JSON.stringify({name:P.name,lv:P.lv,exp:P.exp,gold:P.gold,hp:P.hp,mp:P.mp,inv:P.inv,plots,minutes:S.minutes,day:S.day,sel:S.sel}))}catch(e){}}
function load(){
  try{const d=JSON.parse(localStorage.getItem(SAVEKEY));if(!d)return false;
    P.name=d.name||'ฮีโร่';P.lv=d.lv||1;P.exp=d.exp||0;P.gold=d.gold||0;recalc();P.hp=Math.min(d.hp||P.maxHp,P.maxHp);P.mp=Math.min(d.mp||P.maxMp,P.maxMp);
    Object.assign(P.inv,d.inv||{});for(const k in d.plots||{})if(plots[k])Object.assign(plots[k],d.plots[k]);
    S.minutes=d.minutes||480;S.day=d.day||1;S.sel=d.sel||0;return true}catch(e){return false}
}
function hasSave(){try{return !!localStorage.getItem(SAVEKEY)}catch(e){return false}}
setInterval(()=>{if(running&&!modal)save()},8000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)save()});

/* =====================================================================
   SPRITES: hero, goblin, slime
   ===================================================================== */
function flashDraw(x,y,fn,amt){
  if(!amt){fn(x,y);return}
  OC.clearRect(0,0,48,60);const sv=ctx;ctx=OC;fn(24,50);OC.globalCompositeOperation='source-atop';OC.fillStyle=amt;OC.fillRect(0,0,48,60);OC.globalCompositeOperation='source-over';ctx=sv;ctx.drawImage(OFF,x-24,y-50);
}
const [OFF,OC]=mkCanvas(48,60);

function heroSprite(x,y){
  let dir=P.dir;if(P.spinT>0)dir=[0,2,3,1][Math.floor((1-P.spinT/.36)*8)%4];
  const side=dir===1||dir===2,f=dir===1?-1:1,step=P.moving?P.step:0,bob=(P.moving&&(step===1||step===3))?-1:0;
  if(P.atkT>0){const p=1-P.atkT/ATK_T,l=Math.round(Math.sin(p*Math.PI)*2);x+=DIRS[dir].x*l;y+=DIRS[dir].y*l}
  const R=side?(ox,oy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+(f<0?-ox-w:ox),y+oy,w,h)}:(ox,oy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+ox,y+oy,w,h)};
  const swing=P.atkT>0, lift=[0,1,0,-1][step];
  const drawSword=()=>{
    const p=1-P.atkT/ATK_T,base=[Math.PI/2,Math.PI,0,-Math.PI/2][dir],s=dir===1?-1:1,a=base+s*(p*2-1)*1.25,d=DIRS[dir];
    const hx=x+d.x*4,hy=y-9+d.y*3,ca=Math.cos(a),sa=Math.sin(a);
    for(let i=1;i<=15;i++){const px=Math.round(hx+ca*i),py=Math.round(hy+sa*i);r(px-1,py-1,3,3,i>12?'#ffffff':K.blade2);r(px,py,2,2,i>12?'#fff':K.blade)}
    for(let k=-2;k<=2;k++)r(Math.round(hx+ca*2-sa*k),Math.round(hy+sa*2+ca*k),2,2,K.gold);
    r(Math.round(hx-ca),Math.round(hy-sa),3,3,K.armD);
  };
  const shadow=()=>{};
  if(dir===0){ // ---- facing down
    R(-7,-13+bob,3,11,K.capeD);R(-7,-13+bob,2,10,K.cape);
    R(-4,-6+(lift>0?-1:0),3,3,K.pant);R(-4,-3+(lift>0?-1:0),3,3,K.boot);R(1,-6+(lift<0?-1:0),3,3,K.pant);R(1,-3+(lift<0?-1:0),3,3,K.boot);
    R(-5,-14+bob,10,8,K.tun);R(-5,-8+bob,10,1,K.armD);R(-5,-7+bob,10,1,K.tunD);
    for(let i=0;i<6;i++)R(-4+i,-13+bob+i,1,1,K.arm);
    R(-1,-9+bob,2,2,K.gold);
    R(-7,-13+bob,2,6,K.tun);R(-7,-7+bob-lift,2,2,K.skin);R(5,-13+bob,2,6,K.tun);R(5,-7+bob+lift,2,2,K.skin);R(-7,-14+bob,3,2,K.arm);R(4,-14+bob,3,2,K.arm);
    if(!swing)for(let i=0;i<8;i++)R(3+((i*.55)|0),-9+i+bob,1,1,i<7?K.blade:K.blade2),R(2,-10+bob,3,1,K.gold);
    R(-5,-15+bob,10,2,K.scarf);R(-1,-13+bob,3,3,K.scarfD);
    R(-5,-23+bob,10,8,K.skin);R(-5,-16+bob,10,1,K.skinD);
    R(-6,-25+bob,12,5,K.hair);R(-6,-21+bob,2,4,K.hair);R(4,-21+bob,2,4,K.hair);R(-2,-21+bob,4,1,K.hair);R(-4,-26+bob,3,2,K.hairH);R(1,-27+bob,3,3,K.hairH);R(-1,-20+bob,1,1,K.hair);
    R(-3,-19+bob,2,2,K.eye);R(1,-19+bob,2,2,K.eye);R(-1,-16+bob,2,1,'#b06a4a');
  } else if(dir===3){ // ---- facing up
    if(swing)drawSword();
    R(-4,-6+(lift>0?-1:0),3,3,K.pant);R(-4,-3+(lift>0?-1:0),3,3,K.boot);R(1,-6+(lift<0?-1:0),3,3,K.pant);R(1,-3+(lift<0?-1:0),3,3,K.boot);
    R(-6,-14+bob,12,13,K.cape);R(-2,-12+bob,1,10,K.capeD);R(2,-12+bob,1,10,K.capeD);R(-6,-2+bob,2,1,K.capeD);R(0,-2+bob,3,1,K.capeD);R(-6,-3+bob,1,2,K.capeD);R(5,-3+bob,1,2,K.capeD);
    R(-7,-13+bob,2,6,K.tun);R(-7,-7+bob,2,2,K.skin);R(5,-13+bob,2,6,K.tun);R(5,-7+bob,2,2,K.skin);R(-7,-14+bob,3,2,K.arm);R(4,-14+bob,3,2,K.arm);
    R(-5,-15+bob,10,2,K.scarf);
    R(-5,-23+bob,10,8,K.hair);R(-6,-25+bob,12,7,K.hair);R(-4,-26+bob,3,2,K.hairH);R(1,-27+bob,3,3,K.hairH);R(-3,-20+bob,2,2,K.hairH);R(2,-18+bob,2,2,K.hairH);R(-6,-18+bob,12,3,K.hair);R(-4,-15+bob,8,1,K.skinD);
  } else { // ---- side view (facing right, mirrored for left)
    const wv=P.moving?(step%2):0;
    R(-9-wv,-13+bob,5,12,K.cape);R(-9-wv,-13+bob,1,12,K.capeD);R(-10-wv,-4,2,3,K.capeD);R(-6-wv,-2,3,2,K.capeD);
    const lo=[0,2,0,-2][step];
    R(-3-lo,-6,3,3,K.pant);R(-3-lo,-3,4,3,K.boot);R(0+lo,-6,3,3,K.pant);R(0+lo,-3,4,3,K.boot);
    R(-3,-14+bob,7,8,K.tun);R(-3,-8+bob,7,1,K.armD);R(-3,-7+bob,7,1,K.tunD);for(let i=0;i<6;i++)R(-2+i,-13+bob+i,1,1,K.arm);
    if(!swing){for(let i=0;i<7;i++)R(-3-((i*.8)|0),-9+i+bob,1,1,i<6?K.blade:K.blade2);R(-2,-10+bob,1,3,K.gold)}
    R(-1,-14+bob,3,2,K.arm);R(-1,-13+bob,3,6,K.tun);R(-1,-7+bob+(lo>0?1:0),3,2,K.skin);
    R(-4,-15+bob,8,2,K.scarf);R(-8-wv,-14+bob,4,2,K.scarfD);
    R(-4,-23+bob,8,8,K.skin);R(4,-19+bob,1,2,K.skinD);R(-4,-16+bob,8,1,K.skinD);
    R(-5,-25+bob,10,4,K.hair);R(-5,-21+bob,3,7,K.hair);R(0,-22+bob,5,1,K.hair);R(-4,-26+bob,3,2,K.hairH);R(1,-27+bob,3,3,K.hairH);R(3,-21+bob,2,2,K.hair);
    R(1,-19+bob,2,2,K.eye);R(2,-16+bob,2,1,'#b06a4a');
  }
  if(swing&&dir!==3)drawSword();
  if(P.castT>0){const d=DIRS[dir],ox=x+d.x*8,oy=y-9+d.y*6;r(ox-3,oy-3,7,7,'rgba(155,224,255,.55)');r(ox-2,oy-2,5,5,'#3f8cff');r(ox-1,oy-1,3,3,'#fff');
    R(side?5:(dir===0?5:5),-11,2,2,K.skin)}
}
function goblinSprite(x,y,m){
  const bob=Math.floor(Math.sin(m.anim*8)*1+.5),wup=m.state==='windup',fc=m.face;
  const R=(ox,oy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+ox,y+oy,w,h)};
  const step=Math.sin(m.anim*9)>0?1:0;
  R(-5,-5+(step?0:-1),4,3,K.gskinD);R(1,-5+(step?-1:0),4,3,K.gskinD);R(-6,-2+(step?0:-1),5,2,K.gskin);R(1,-2+(step?-1:0),6,2,K.gskin);R(-6,-1+(step?0:-1),1,1,'#e8e0d0');R(6,-1+(step?-1:0),1,1,'#e8e0d0');
  // club (behind arm)
  const cx=fc>0?8:-11,up=wup?-6:0;R(cx,-17+up,3,13,K.club);R(cx-1,-19+up,5,5,'#a8743f');R(cx+1,-18+up,1,1,'#7d8294');R(cx+1,-14+up,1,1,'#7d8294');R(cx,-17+up,1,13,'#a8743f');
  // body
  R(-6,-14+bob,12,10,'#7a5230');R(-6,-14+bob,12,2,'#8a5a34');R(-6,-6+bob,3,3,'#7a5230');R(-1,-5+bob,2,3,'#7a5230');R(3,-6+bob,3,2,'#7a5230');R(2,-12+bob,3,3,'#7d8294');R(-2,-8+bob,5,3,K.gskin);
  R(-6,-9+bob,12,1,'#3b2a1a');R(-1,-9+bob,3,2,K.gold);
  // arms
  R(-9,-13+bob,3,9,K.gskin);R(-9,-5+bob,3,2,K.gskinD);R(6,-13+bob,3,9,K.gskin);R(6,-5+bob,3,2,K.gskinD);R(-9,-13+bob,1,8,K.gskinD);
  // head
  R(-5,-26+bob,10,1,K.gskin);R(-6,-25+bob,12,10,K.gskin);R(-5,-15+bob,10,1,K.gskinD);R(-6,-17+bob,12,1,K.gskinD);
  R(-10,-23+bob,4,3,K.gskin);R(-11,-24+bob,2,2,K.gskin);R(6,-23+bob,4,3,K.gskin);R(9,-24+bob,2,2,K.gskin);R(-9,-22+bob,2,1,K.gskinD);R(7,-22+bob,2,1,K.gskinD);
  R(-5,-31+bob,2,6,K.horn);R(-6,-30+bob,1,3,K.horn);R(-4,-32+bob,1,2,K.horn);R(3,-31+bob,2,6,K.horn);R(5,-30+bob,1,3,K.horn);R(3,-32+bob,1,2,K.horn);
  R(-4,-23+bob,3,1,K.gskinD);R(1,-23+bob,3,1,K.gskinD);R(-4,-21+bob,3,2,'#ffd93a');R(1,-21+bob,3,2,'#ffd93a');R(-3,-21+bob,1,2,K.eye);R(2,-21+bob,1,2,K.eye);
  R(-1,-19+bob,2,2,K.gskinD);R(-3,-16+bob,6,1,K.eye);R(-3,-17+bob,1,1,'#fff');R(2,-17+bob,1,1,'#fff');
}
function slimeSprite(x,y,m){
  const sq=Math.sin(m.anim*5);let h=Math.round(10+sq*1.2),w=14+Math.round(-sq*1.2);if(m.state==='windup'){h-=3;w+=3}
  const top=y-h,R=(ox,oy,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x+ox,oy,ww,hh)},rw=i=>i<3?[6,10,12][i]:w;
  for(let i=-1;i<=h;i++){const ww=(i<0?4:i>=h?w:rw(i))+2;R(-(ww>>1),top+i,ww,1,K.out)}
  for(let i=0;i<h;i++){const ww=rw(i);R(-(ww>>1),top+i,ww,1,i>=h-2?'#2b72b0':(i<h-4?'#58b8ee':'#3a97d4'))}
  R(-5,top+2,3,2,'#c8efff');R(-5,top+4,1,1,'#c8efff');
  R(-4,top+4,3,4,'#fff');R(2,top+4,3,4,'#fff');R(-3,top+5,2,3,K.out);R(3,top+5,2,3,K.out);R(-1,top+h-3,3,1,'#2b72b0');
}
function drawMon(m){
  const d=MON[m.type],x=Math.round(m.x),y=Math.round(m.y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-(m.type==='slime'?7:(MON[m.type].w||8)),y-2,m.type==='slime'?14:(MON[m.type].w||8)*2,3);
  const fn=SPR[m.type]?(cx,cy)=>SPR[m.type](cx,cy,m):m.type==='slime'?(cx,cy)=>slimeSprite(cx,cy,m):(cx,cy)=>goblinSprite(cx,cy,m);
  flashDraw(x,y,fn,m.fz>0?'rgba(140,210,255,.6)':m.hurtT>0?'rgba(255,255,255,.75)':(m.state==='windup'&&Math.floor(S.t*16)%2?'rgba(255,60,60,.4)':null));
  if(m.state==='windup')pixText('!',x,y-d.h-12,'#ff5a4a',2,true);
  const mh=m.mhp||d.hp;if(m.hp<mh){const w=14;r(x-w/2-1,y-d.h-7,w+2,4,'#000');r(x-w/2,y-d.h-6,w,2,'#5a1a22');r(x-w/2,y-d.h-6,Math.max(1,Math.round(w*m.hp/mh)),2,'#e0414f')}
}
function drawPlayer(){
  const x=Math.round(P.x),y=Math.round(P.y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-6,y-2,12,3);
  if(P.dead){r(x-10,y-6,20,6,K.tun);r(x-10,y-6,20,1,K.tunD);r(x-14,y-8,8,8,K.skin);r(x-15,y-9,9,4,K.hair);r(x-12,y-5,3,1,K.eye);r(x+9,y-5,5,4,K.boot);r(x-4,y-7,10,2,K.cape);return}
  const flick=P.invul>0&&Math.floor(S.t*22)%2===0;if(flick)ctx.globalAlpha=.45;
  flashDraw(x,y,heroSprite,P.hurtT>0?'rgba(255,255,255,.7)':null);
  ctx.globalAlpha=1;
}

/* =====================================================================
   RENDER
   ===================================================================== */
function render(){
  ctx=MAINCTX;const z=Z();ctx.setTransform(Q,0,0,Q,0,0);ctx.imageSmoothingEnabled=false;camY=clamp(Math.round(P.y-CH/2-8),0,Math.max(0,VH-CH));ctx.save();
  if(S.shake>0)ctx.translate(ri(-1,1)*Math.ceil(S.shake/2),ri(-1,1)*Math.ceil(S.shake/2));
  ctx.translate(0,-camY);ctx.drawImage(z.ground,0,0);
  for(const [wx,wy] of z.water){const k=Math.floor(S.t*2.2+wx*3+wy*5)%4;r(wx*T+2+k*3,wy*T+4+(k%2)*6,3,1,'#bfe0ff');r(wx*T+10-k*2,wy*T+11-(k%2)*5,2,1,'#8fc1ff')}
  if(zone==='farm')drawPlots();
  drawCursor();
  const list=[];z.objs.forEach(o=>list.push({b:o.b,f:()=>drawObj(o)}));
  if(HZ())mons.forEach(m=>{if(!m.dead)list.push({b:m.y,f:()=>drawMon(m)})});
  list.push({b:P.y,f:drawPlayer});if(window.EXTRA_DRAW)EXTRA_DRAW(list);
  list.sort((a,b)=>a.b-b.b);list.forEach(i=>i.f());
  drawProj();drawFx();
  for(const p of parts){ctx.globalAlpha=Math.min(1,p.life/p.max*1.5);r(Math.round(p.x),Math.round(p.y),p.size,p.size,p.col)}ctx.globalAlpha=1;
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life/f.max*2);pixText(f.txt,clamp(f.x,textW(String(f.txt),f.sc)/2+2,VW-textW(String(f.txt),f.sc)/2-2),f.y,f.col,f.sc,true)}ctx.globalAlpha=1;
  ctx.restore();
  // ambient light
  if(window.ENV_LIGHT){ENV_LIGHT(ctx,S.minutes,zone==='hunt',zone)}else{
  const h=S.minutes/60;let a=0;if(h>18&&h<21)a=(h-18)/3*.42;else if(h>=21||h<4.5)a=.42;else if(h>=4.5&&h<7)a=(1-(h-4.5)/2.5)*.42;
  if(a>0){ctx.fillStyle='rgba(14,20,72,'+a.toFixed(3)+')';ctx.fillRect(0,0,VW,CH)}
  if(h>=17&&h<19.5){ctx.fillStyle='rgba(255,140,50,.09)';ctx.fillRect(0,0,VW,CH)}
  if(HZ()){ctx.fillStyle='rgba(20,10,40,.14)';ctx.fillRect(0,0,VW,CH)}
  }
  if(S.fade>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,S.fade*1.6)+')';ctx.fillRect(0,0,VW,CH)}
  if(P.hp<P.maxHp*.25&&!P.dead&&running){ctx.fillStyle='rgba(200,20,40,'+(.08+.06*Math.sin(S.t*6))+')';ctx.fillRect(0,0,VW,CH)}
  if(P.dead){const k=Math.min(1,(2.4-P.deadT)*1.2);ctx.fillStyle='rgba(0,0,0,'+k*.65+')';ctx.fillRect(0,0,VW,CH);pixText('คุณสลบ!',VW/2,CH/2-10,'#ff5a66',3,true)}
  if(paused){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,VW,CH);pixText('หยุดเกม',VW/2,CH/2-8,'#ffd23f',3,true)}
}
function drawPlots(){
  for(const k in plots){const p=plots[k],[tx,ty]=k.split(',').map(Number),x=tx*T,y=ty*T;
    const wet=p.state===2&&p.watered&&p.stage<3;
    r(x,y,T,T,p.state===0?'#8e6e47':(wet?'#4a3220':'#6b4a2b'));
    if(p.state===0){r(x+3,y+4,3,1,'#6f9a45');r(x+10,y+9,3,1,'#6f9a45');r(x+5,y+12,2,1,'#a98250');r(x+11,y+3,2,1,'#a98250')}
    else{const fc=wet?'#33200f':'#573a20';r(x+1,y+4,14,1,fc);r(x+1,y+9,14,1,fc);r(x+1,y+14,14,1,fc)}
    r(x,y,T,1,'rgba(0,0,0,.25)');r(x,y,1,T,'rgba(0,0,0,.18)');
    if(p.state===2)drawCrop(x,y,p);
  }
}
function drawCrop(x,y,p){
  const s=p.stage;
  if(s===0){r(x+6,y+10,4,2,'#c9b072');r(x+7,y+9,2,1,'#c9b072')}
  else if(s===1){r(x+7,y+7,2,5,'#5cb050');r(x+5,y+6,3,2,'#7ad060');r(x+9,y+5,3,2,'#7ad060')}
  else if(s===2){r(x+7,y+4,2,9,'#3f8f3f');r(x+3,y+4,5,3,'#5cb050');r(x+8,y+3,5,3,'#5cb050');r(x+4,y+8,4,2,'#3f8f3f');r(x+9,y+8,4,2,'#3f8f3f');r(x+3,y+4,2,1,'#8fe07a')}
  else if(p.crop==='turnip'){r(x+4,y+1,2,5,'#3f8f3f');r(x+7,y+0,2,6,'#5cb050');r(x+10,y+1,2,5,'#3f8f3f');r(x+4,y+7,8,6,'#f4ecff');r(x+4,y+7,8,3,'#9a5fd0');r(x+5,y+13,6,1,'#d6c8f0');r(x+7,y+14,2,1,'#d6c8f0');r(x+5,y+7,2,1,'#c7a0f0')}
  else if(p.crop==='tomato'){r(x+3,y+3,10,9,'#3f8f3f');r(x+2,y+5,12,5,'#3f8f3f');[[3,7],[9,5],[7,9],[11,9],[4,10]].forEach(([a,b])=>{r(x+a,y+b,3,3,'#e0414f');r(x+a,y+b,1,1,'#ff9aa4')})}
  else{r(x+7,y+3,2,3,'#3f8f3f');r(x+9,y+3,3,2,'#5cb050');r(x+2,y+6,12,8,'#f59a2a');r(x+3,y+5,10,1,'#f59a2a');r(x+3,y+6,2,7,'#ffb85a');r(x+7,y+6,2,8,'#c06a12');r(x+11,y+7,1,6,'#c06a12');r(x+2,y+13,12,1,'#a85a0e')}
  if(s===3&&Math.floor(S.t*3)%2===0)r(x+12,y+1,2,2,'#fff2a0');
}
function drawCursor(){
  if(P.dead||zone!=='farm')return;
  const z=Z(),t=targetTile();if(t.x<0||t.y<0||t.x>=W||t.y>=H)return;
  const k=z.inter[t.y][t.x],pl=plots[t.x+','+t.y];if(!k&&!pl)return;
  const x=t.x*T,y=t.y*T,on=Math.floor(S.t*4)%2===0;
  if(pl){const c=on?'#fff':'#ffd23f';r(x,y,4,1,c);r(x,y,1,4,c);r(x+12,y,4,1,c);r(x+15,y,1,4,c);r(x,y+15,4,1,c);r(x,y+12,1,4,c);r(x+12,y+15,4,1,c);r(x+15,y+12,1,4,c)}
  let label=null;
  if(k==='shop')label='E: ร้านค้า';else if(k==='house')label='E: พักผ่อน';
  else if(pl){label=pl.state===0?'E: ไถดิน':pl.state===1?'E: ปลูก':pl.stage>=3?'E: เก็บเกี่ยว':!pl.watered?'E: รดน้ำ':null}
  if(label)pixText(label,clamp(x+8,24,VW-24),y-8-(on?1:0),'#ffd23f',1,true);
}
function drawProj(){for(const p of proj){if(p.ice){const x=Math.round(p.x),y=Math.round(p.y);r(x-3,y-3,7,7,'#3f8cff');r(x-2,y-2,5,5,'#9be0ff');r(x-1,y-1,3,3,'#fff');continue}const x=Math.round(p.x),y=Math.round(p.y),f=Math.floor(S.t*20)%2;r(x-4,y-4,9,9,'#e0414f');r(x-5+f,y-3,11-2*f,7,'#e0414f');r(x-3,y-3,7,7,'#ff8a3a');r(x-2,y-2,5,5,'#ffd23f');r(x-1,y-1,3,3,'#fff')}}
function drawFx(){
  for(const e of fx){const p=e.t/e.life,x=Math.round(e.x),y=Math.round(e.y);
    if(e.k==='slash'){const a0=e.a+e.s*(-1.25),span=2.5*Math.min(1,p*1.6+.3);
      for(let k=0;k<=18;k++){const t=k/18;if(t>span/2.5)break;const ang=a0+e.s*t*2.5;
        for(let rad=14;rad<=21;rad+=2){const fade=1-p,w=(rad>=18?2:1);ctx.globalAlpha=Math.max(0,fade*(.3+t*.7));r(Math.round(x+Math.cos(ang)*rad),Math.round(y+Math.sin(ang)*rad),w+1,w+1,rad>=18?'#ffffff':'#bfeaff')}}ctx.globalAlpha=1}
    else if(e.k==='ring'){const rad=8+p*30;ctx.globalAlpha=1-p;for(let a=0;a<6.283;a+=.17){r(Math.round(x+Math.cos(a)*rad),Math.round(y+Math.sin(a)*rad),3,3,e.gold?'#ffd23f':(Math.floor(a*5)%2?'#ffffff':'#ff5a66'))}ctx.globalAlpha=1}
    else if(e.k==='boom'){const rad=4+p*20;ctx.globalAlpha=1-p*.8;for(let a=0;a<6.283;a+=.2){r(Math.round(x+Math.cos(a)*rad)-1,Math.round(y+Math.sin(a)*rad)-1,3,3,'#ffd23f')}for(let a=0;a<6.283;a+=.3){r(Math.round(x+Math.cos(a)*rad*.6)-1,Math.round(y+Math.sin(a)*rad*.6)-1,3,3,'#ff8a3a')}ctx.globalAlpha=1}
  }
}

/* =====================================================================
   HUD / HOTBAR / ICONS
   ===================================================================== */
const IC={};
function iconURL(w,h,fn){const [c,g]=mkCanvas(w,h),sv=ctx;ctx=g;fn();ctx=sv;return c.toDataURL()}
const PAL={k:'#1a1220',w:'#ffffff',g:'#5cb050',G:'#2e6b34',r:'#e0414f',R:'#a02535',o:'#f59a2a',O:'#c06a12',y:'#ffd23f',b:'#4fb0e8',B:'#2b72b0',c:'#bfeaff',p:'#9a5fd0',P:'#6a3a9a',n:'#8a5a34',N:'#5e3b20',s:'#d8e0ea',S:'#8c94a4',W:'#eee3c0'};
function mapIcon(rows,extra){const pal=Object.assign({},PAL,extra||{});return iconURL(12,12,()=>{rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c!=='.'&&pal[c])r(x,y,1,1,pal[c])}})})}
function makeIcons(){
  const seed=c=>mapIcon(['..kkkkkk....','.kWWWWWWk...','.kWWXXWWk...','.kWWXXWWk...','.kWWWWWWk...','.kWWgWWWk...','.kWWgGWWk...','.kWWWWWWk...','..kkkkkk....'],{X:c});
  IC.seed_turnip=seed('#9a5fd0');IC.seed_tomato=seed('#e0414f');IC.seed_pumpkin=seed('#f59a2a');
  const pot=c=>mapIcon(['....kk......','....nn......','...kssk.....','...kXXk.....','..kXXXXk....','.kXwXXXXk...','.kXwXXXXk...','.kXXXXXXk...','..kXXXXk....','...kkkk.....'],{X:c});
  IC.potion_hp=pot('#e0414f');IC.potion_mp=pot('#3f8cff');
  IC.crop_turnip=mapIcon(['...g.g.g....','...gGgGg....','....gGg.....','..kpppppk...','.kppPpppPk..','.kwwwwwwwk..','.kwwwwwwwk..','..kwwwwwk...','...kwwwk....','....kwk.....','.....k......']);
  IC.crop_tomato=mapIcon(['....gg......','..gggGgg....','...kgGgk....','..krrrrrk...','.krwrrrrRk..','.krwrrrrRk..','.krrrrrrRk..','.krrrrrRRk..','..kRrrRRk...','...kkkkk....']);
  IC.crop_pumpkin=mapIcon(['.....nN.....','....kGn.....','..kkookk....','.koooOoooOk.','kooOoooOoooOk','koooOoooOoOk.','koooOoooOoOk.','.koooOoooOk..','..kkkkkkkk...']);
  IC.jelly=mapIcon(['............','...kkkk.....','..kbbbbk....','.kbcbbbbk...','.kbbbbbBk...','.kbbbbbBk...','..kBBBBk....','...kkkk.....']);
  IC.fang=mapIcon(['...kkkk.....','..kwwwwk....','..kwWwwk....','...kwWk.....','...kwWk.....','....kwk.....','....kk......']);
  IC.coin=mapIcon(['...kkkk...','..kyyyyk..','.kyyOyyyk.','.kyOyyOyk.','.kyOyyOyk.','.kyyOOyyk.','..kyyyyk..','...kkkk...']);
  IC.b_attack=iconURL(16,16,()=>{
    for(let a=1.6;a<3.4;a+=.09){const x=Math.round(9+Math.cos(a)*7.5),y=Math.round(9+Math.sin(a)*7.5);r(x,y,2,2,a>2.6?'#e0414f':'#ff8a8a')}
    for(let i=0;i<9;i++){r(2+i,12-i,2,2,i>7?'#fff':'#d8e0ea');r(2+i,13-i,1,1,'#8c94a4')}
    for(let k=-2;k<=2;k++)r(10+k,3+k+1,2,2,K.gold);r(12,1,2,2,K.arm);r(13,0,1,1,'#e0414f')});
  IC.b_fire=iconURL(16,16,()=>{
    const disc=(cx,cy,rad,c)=>{for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++)if(x*x+y*y<=rad*rad+1)r(cx+x,cy+y,1,1,c)};
    r(1,7,4,2,'#e0414f');r(0,9,3,1,'#ff8a3a');r(3,5,3,1,'#ff8a3a');
    disc(10,8,5,'#e0414f');disc(10,8,4,'#ff8a3a');disc(10,8,2,'#ffd23f');r(9,7,2,2,'#fff')});
  IC.b_spin=iconURL(16,16,()=>{
    for(let a=.3;a<5.6;a+=.13){r(Math.round(7+Math.cos(a)*5.5),Math.round(7+Math.sin(a)*5.5),2,2,a>4.3?'#fff':'#e0414f')}
    r(10,1,5,2,'#fff');r(13,3,2,3,'#fff');r(6,6,4,4,'#d8e0ea');r(7,7,2,2,'#8c94a4')});
  IC.b_act=iconURL(16,16,()=>{
    r(4,12,9,3,'#6b4a2b');r(3,13,11,2,'#6b4a2b');r(5,12,5,1,'#8e6e47');
    r(7,6,2,7,'#3f8f3f');r(2,3,5,4,'#7ad060');r(2,3,5,1,'#b4f07d');r(9,2,5,4,'#5cb050');r(9,2,5,1,'#9be07a')});
  $('coinimg').src=IC.coin;
  for(const k of ['attack','fire','spin','act'])$('b_'+k).querySelector('img').src=IC['b_'+k];
}
function drawFace(){
  const g=$('face').getContext('2d'),sv=ctx;ctx=g;g.clearRect(0,0,16,16);
  r(0,13,16,3,K.scarf);r(2,12,12,1,K.scarfD);r(3,4,10,9,K.skin);r(3,12,10,1,K.skinD);
  r(2,1,12,5,K.hair);r(2,4,2,5,K.hair);r(12,4,2,5,K.hair);r(5,4,6,1,K.hair);r(4,0,3,2,K.hairH);r(9,0,3,2,K.hairH);
  r(5,8,2,2,K.eye);r(9,8,2,2,K.eye);r(7,11,2,1,'#b06a4a');ctx=sv;
}
const hc={},cdEl={};
function setT(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v}}
function setW(id,v){if(hc[id]!==v){hc[id]=v;$(id).style.transform='scaleX('+(parseFloat(v)/100).toFixed(3)+')'}}
function hud(){
  setT('pname',P.name);setT('plv','Lv.'+P.lv);
  setT('hpt',Math.ceil(P.hp)+'/'+P.maxHp);setW('hpf',(P.hp/P.maxHp*100).toFixed(1)+'%');
  setT('mpt',Math.floor(P.mp)+'/'+P.maxMp);setW('mpf',(P.mp/P.maxMp*100).toFixed(1)+'%');
  setT('xpt',P.exp+'/'+P.expNeed);setW('xpf',(P.exp/P.expNeed*100).toFixed(1)+'%');
  setT('gold',P.gold+'G');setT('zname',zone==='farm'?'ฟาร์ม':zone==='hunt'?'ป่าล่าสัตว์':'ถ้ำคริสตัล');
  const m=Math.floor(S.minutes);setT('clock','วัน '+S.day+' '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));
  const cd=(id,v,max)=>{const h=Math.ceil(clamp(v/max,0,1)*40)/40;if(hc[id]!==h){hc[id]=h;(cdEl[id]||(cdEl[id]=$(id).querySelector('.cd'))).style.transform='scaleY('+h+')'}};
  cd('b_attack',P.atkCd,.36);cd('b_fire',P.fireCd,skCd(0));cd('b_spin',P.spinCd,skCd(1));
}
function refreshHot(){
  const hb=$('hotbar');let h='';
  HOT.forEach((k,i)=>{const n=P.inv[k];h+=`<div class="slot${i<3&&S.sel===i?' sel':''}${n<=0?' empty':''}" data-i="${i}"><img class="px" src="${IC[k]}" alt=""><u>${i+1}</u><b>${n}</b></div>`});
  hb.innerHTML=h;
}
$('hotbar').addEventListener('pointerdown',e=>{const s=e.target.closest('.slot');if(s){e.preventDefault();audioInit();pressQ.push('slot'+s.dataset.i)}});

/* =====================================================================
   MAIN LOOP / BOOT
   ===================================================================== */
function fit(){const aw=innerWidth,ah=innerHeight,asp=aw/ah;CH=asp>=VW/VH?Math.max(120,Math.round(VW/asp)):VH;
  cv.width=VW*Q;cv.height=CH*Q;const k=Math.min(aw/VW,ah/CH);cv.style.width=Math.floor(VW*k)+'px';cv.style.height=Math.floor(CH*k)+'px'}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,150));
let last=0;
function frame(ts){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(ts-last)/1000||0);last=ts;S.t+=dt;
  if(running&&!paused&&!modal)update(dt);
  render();hud();
}
function startGame(cont){
  audioInit();try{const de=document.documentElement;de.requestFullscreen&&de.requestFullscreen().catch(()=>{});screen.orientation&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}
  if(cont)load();
  else{try{localStorage.removeItem(SAVEKEY)}catch(e){}P.name=($('nameIn').value||'ฮีโร่').trim().toUpperCase().slice(0,10)||'ฮีโร่'}
  recalc();P.hp=Math.min(P.hp,P.maxHp);P.mp=Math.min(P.mp,P.maxMp);
  zone='farm';P.x=56;P.y=84;mons.length=0;
  $('title').classList.add('hidden');running=true;modal=false;refreshHot();save();
  toast('ยินดีต้อนรับ, '+P.name+'!',2200);S.fade=.5;
}
function boot(){try{document.fonts.load('700 12px Sarabun','ก')}catch(e){}
  makeIcons();drawFace();refreshHot();fit();Z();
  if(hasSave())$('contBtn').style.display='';
  $('startBtn').addEventListener('click',()=>startGame(false));
  $('contBtn').addEventListener('click',()=>startGame(true));
  setTimeout(fit,100);setTimeout(fit,500);
  requestAnimationFrame(frame);
}
boot();
window.__dbg={P,S,mons,plots,update,render,startGame,changeZone,interact,tryAttack,tryFire,trySpin,openShop,closeShop,held,pressQ,spawnMon,takeDamage,gainExp,get zone(){return zone}};