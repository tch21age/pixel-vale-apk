'use strict';
/* ชาย/หญิง · 3 สกิลต่างกัน · ตกปลา · เลี้ยงสัตว์ · อัปเกรดดาบ · ถ้ำคริสตัล · มอนสเตอร์ใหม่ */

/* ---------- ตัวละคร ชาย/หญิง ---------- */
const LOOK={m:{hair:'#6b3f1f',hairH:'#8f5a2c',tun:'#3f8f3a',tunD:'#2c6a2c',scarf:'#c8283a',scarfD:'#8f1c2a',cape:'#b01e30',capeD:'#7f1424'},
 f:{hair:'#c4552e',hairH:'#e8864a',tun:'#8e4fc4',tunD:'#6a3a9a',scarf:'#ffd23f',scarfD:'#c99a1a',cape:'#3f6fd0',capeD:'#2a4a9a'}};
const BLADE=['#d8e0ea','#9be0ff','#7dff9b','#ffd23f','#ff9ad5','#c08cff','#ff9a3a','#ff4a5e','#3fe0d0','#e8f4ff','#fff1a0'];
P.g='m';P.wl=0;P.s3Cd=0;let SELG='m';
function faceTo(c,g){const L=LOOK[g],k=c.getContext('2d'),sv=ctx;ctx=k;k.clearRect(0,0,16,16);
  if(g==='f'){r(1,4,3,11,L.hair);r(12,4,3,11,L.hair)}
  r(0,13,16,3,L.scarf);r(2,12,12,1,L.scarfD);r(3,4,10,9,K.skin);r(3,12,10,1,K.skinD);
  r(2,1,12,5,L.hair);r(2,4,2,5,L.hair);r(12,4,2,5,L.hair);r(5,4,6,1,L.hair);r(4,0,3,2,L.hairH);r(9,0,3,2,L.hairH);
  r(5,8,2,2,K.eye);r(9,8,2,2,K.eye);r(7,11,2,1,'#b06a4a');
  if(g==='f'){r(11,0,4,3,'#ff7ab8');r(12,1,2,1,'#fff');r(5,9,1,1,'#fff');r(9,9,1,1,'#fff')}ctx=sv}
drawFace=()=>faceTo($('face'),P.g);
function applyLook(){Object.assign(K,LOOK[P.g]);K.blade=BLADE[P.wl||0];drawFace();setCls()}
const _hs=heroSprite;
heroSprite=function(x,y){_hs(x,y);if(P.g!=='f'||P.spinT>0)return;
  const d=P.dir,b=(P.moving&&(P.step===1||P.step===3))?-1:0;
  if(d===0){r(x-7,y-22+b,2,9,K.hair);r(x+5,y-22+b,2,9,K.hair);r(x-6,y-8+b,12,3,K.tun);r(x-6,y-6+b,12,1,K.tunD);r(x+2,y-27+b,4,3,'#ff7ab8')}
  else if(d===3){r(x-6,y-23+b,12,18,K.hair);r(x-1,y-14+b,2,8,K.hairH);r(x-2,y-27+b,4,3,'#ff7ab8')}
  else{const f=d===1?-1:1;r(f>0?x-10:x+5,y-23+b,5,15,K.hair);r(f>0?x-5:x-5,y-8+b,10,3,K.tun);r(f>0?x-5:x-5,y-6+b,10,1,K.tunD);r(f>0?x-1:x-3,y-27+b,4,3,'#ff7ab8')}};

/* ---------- ไอเท็ม + ไอคอน ---------- */
Object.assign(ITEMS,{pelt:{n:'หนังหมาป่า',sell:30},tusk:{n:'งาหมูป่า',sell:34},wing:{n:'ปีกค้างคาว',sell:26},bone:{n:'กระดูกโบราณ',sell:45},crystal:{n:'ผลึกคริสตัล',sell:110},
 fish_a:{n:'ปลาซิว',sell:22},fish_b:{n:'ปลากะพง',sell:60},fish_c:{n:'ปลาทองคำ',sell:220},egg:{n:'ไข่ไก่',sell:35},milk:{n:'นมวัว',sell:90}});
const gem=c=>mapIcon(['....kk......','...kXXk.....','..kXwXXk....','.kXXXXXXk...','.kXXXXXXk...','..kXXXXk....','...kkkk.....'],{X:c});
const fish=c=>mapIcon(['............','..kkk....k..','.kXXXkk.kXk.','kXwXXXXkkXXk','kXXXXXXXkXXk','.kXXXXkk.kk.','..kkkk......'],{X:c});
IC.pelt=gem('#8a8f9c');IC.tusk=gem('#f1e9d2');IC.wing=gem('#7a4fa0');IC.bone=gem('#d8d2bc');IC.crystal=gem('#3fcfff');
IC.fish_a=fish('#8fb0c8');IC.fish_b=fish('#e08a5a');IC.fish_c=fish('#ffd23f');
IC.egg=mapIcon(['....kk....','...kwwk...','..kwWWwk..','..kwWWwk..','..kWWWWk..','...kkkk...']);
IC.milk=mapIcon(['...kkkk...','...kwwk...','..kwwwwk..','..kwwwwk..','..kwwwwk..','..kbbbbk..','...kkkk...']);
IC.sk_dash=mapIcon(['......k.....','.....kbk....','kkkkkkbbk...','kbbbbbbbbk..','kkkkkkbbk...','.....kbk....','......k.....']);
IC.sk_ice=mapIcon(['.....kk.....','....kcck....','...kcwck....','..kccwbck...','..kcbbbck...','...kcbbk....','....kbBk....','.....kk.....']);
IC.sk_heal=mapIcon(['..kk..kk....','.krrkkrrk...','krwrrrrrrk..','krrrrrrrrk..','.krrrrrrk...','..krrrrk....','...krrk.....','....kk......']);
IC.sk_bolt=mapIcon(['....kkkk....','...kyyyk....','..kyyyk.....','.kyyyyyyk...','..kkkyyk....','....kyyk....','...kyyk.....','...kyk......','...kk.......']);

/* ---------- มอนสเตอร์ใหม่ ---------- */
Object.assign(MON,{
 wolf:{name:'หมาป่า',hp:42,atk:10,spd:52,exp:20,gold:[6,14],drop:['pelt',.5],aggro:100,range:15,h:21,w:10},
 boar:{name:'หมูป่า',hp:62,atk:13,spd:44,exp:28,gold:[10,20],drop:['tusk',.45],aggro:80,range:16,h:18,w:11},
 bat:{name:'ค้างคาว',hp:20,atk:7,spd:60,exp:14,gold:[5,10],drop:['wing',.5],aggro:96,range:13,h:20,w:8},
 skel:{name:'โครงกระดูก',hp:78,atk:15,spd:30,exp:40,gold:[15,30],drop:['bone',.5],aggro:90,range:16,h:28,w:6},
 golem:{name:'โกเลมคริสตัล',hp:170,atk:22,spd:20,exp:90,gold:[40,80],drop:['crystal',.7],aggro:70,range:19,h:40,w:12}});
function pickType(){const q=Math.random();
  if(zone==='cave')return q<.38?'bat':q<.84?'skel':'golem';
  return q<.32?'slime':q<.5?'goblin':q<.78?'wolf':'boar'}
const mk=(x,y,fc)=>(ox,oy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(fc>0?x+ox:x-ox-w,y+oy,w,h)};
const SPR={};
SPR.wolf=(x,y,m)=>{const R=mk(x,y,m.face),s=Math.sin(m.anim*10)>0?1:0,w=m.state==='windup';
  R(-13,-13,4,2,'#6b707d');R(-15,-15,3,3,'#a8adb9');
  R(-8,-5,2,5,'#4a4e5a');R(-5+s*2,-5,2,5,'#5d6270');R(3-s*2,-5,2,5,'#4a4e5a');R(6,-5,2,5,'#5d6270');
  R(-10,-12,18,8,'#8a8f9c');R(-10,-12,18,2,'#aab0bd');R(-10,-6,18,2,'#6b707d');R(-4,-5,9,2,'#d9dce3');
  R(5,-15,5,9,'#8a8f9c');R(5,-14,4,5,'#a8adb9');R(7,-19,8,7,'#9aa0ad');R(7,-21,2,3,'#5d6270');R(11,-21,2,3,'#5d6270');
  R(13,-15,5,3,'#b9bdc8');R(17,-15,2,2,'#111');R(10,-17,2,1,w?'#ff4a4a':'#ffd23f');
  if(w){R(13,-12,4,2,'#fff');R(14,-12,1,1,'#c0392b')}else R(13,-12,4,1,'#3a1a1a')};
SPR.boar=(x,y,m)=>{const R=mk(x,y,m.face),s=Math.sin(m.anim*9)>0?1:0,w=m.state==='windup';
  R(-8,-5,3,5,'#3b281c');R(-4+s*2,-5,3,5,'#4a3224');R(3-s*2,-5,3,5,'#3b281c');R(7,-5,3,5,'#4a3224');
  R(-11,-14,20,10,'#6b4a35');R(-11,-14,20,3,'#4a3224');R(-10,-17,14,3,'#3b281c');R(-13,-12,2,4,'#4a3224');
  R(6,-14,8,9,'#7a5640');R(12,-11,5,5,'#c99a86');R(16,-10,1,2,'#3a1a1a');R(11,-8,5,1,'#f1e9d2');R(15,-10,1,3,'#f1e9d2');
  R(8,-17,3,3,'#4a3224');R(10,-12,2,2,w?'#ff4a4a':'#ffd23f')};
SPR.bat=(x,y,m)=>{const f=Math.sin(m.anim*14)>0,by=-10+Math.round(Math.sin(m.anim*4)*2),u=f?-6:2,w=m.state==='windup';
  const X=(ox,oy,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x+ox,y+by+oy,ww,hh)};
  X(-13,u,10,3,'#54386e');X(-13,u+3,5,3,'#3f2a55');X(-9,u+3,3,2,'#54386e');X(3,u,10,3,'#54386e');X(8,u+3,5,3,'#3f2a55');X(6,u+3,3,2,'#54386e');
  X(-4,-3,8,8,'#3a2a4a');X(-4,-3,8,2,'#4b385e');X(-4,-6,2,3,'#3a2a4a');X(2,-6,2,3,'#3a2a4a');
  X(-3,-1,2,2,w?'#ff4a4a':'#ff8a8a');X(1,-1,2,2,w?'#ff4a4a':'#ff8a8a');X(-1,3,2,1,'#fff')};
SPR.skel=(x,y,m)=>{const bob=Math.floor(Math.sin(m.anim*8)+.5),w=m.state==='windup',s=Math.sin(m.anim*9)>0?1:0;
  const X=(ox,oy,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x+ox,y+oy,ww,hh)};
  X(-4,-6,2,6,'#d8d2bc');X(2,-6,2,6,'#d8d2bc');X(-5,-1+(s?-1:0),3,1,'#b8b29c');X(2,-1+(s?0:-1),3,1,'#b8b29c');
  X(-5,-15+bob,10,2,'#d8d2bc');X(-4,-12+bob,8,1,'#8c8672');X(-4,-10+bob,8,1,'#d8d2bc');X(-4,-8+bob,8,1,'#8c8672');X(-1,-14+bob,2,8,'#b8b29c');
  X(-8,-15+bob,3,8,'#d8d2bc');X(5,-15+bob,3,8,'#d8d2bc');
  const sx=m.face>0?8:-11,up=w?-6:0;X(sx,-18+up,3,14,'#9aa3b3');X(sx-1,-6+up,5,2,'#8a5a34');X(sx,-18+up,1,12,'#cfd6e2');
  X(-5,-26+bob,10,9,'#e8e2cc');X(-4,-18+bob,8,3,'#d8d2bc');X(-4,-23+bob,3,3,'#1a1220');X(1,-23+bob,3,3,'#1a1220');
  X(-3,-22+bob,1,1,'#ff5a4a');X(2,-22+bob,1,1,'#ff5a4a');X(-1,-20+bob,2,1,'#8c8672');X(-3,-17+bob,6,1,'#1a1220')};
SPR.golem=(x,y,m)=>{const bob=Math.floor(Math.sin(m.anim*4)+.5),up=m.state==='windup'?-5:0;
  const X=(ox,oy,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x+ox,y+oy,ww,hh)};
  X(-9,-8,7,8,'#5b5f73');X(2,-8,7,8,'#5b5f73');
  X(-12,-26+bob,24,19,'#7a7f96');X(-12,-26+bob,24,4,'#9096ae');X(-12,-10+bob,24,3,'#5b5f73');
  X(-17,-24+bob+up,6,15,'#6b7088');X(11,-24+bob+up,6,15,'#6b7088');X(-18,-10+bob+up,8,6,'#5b5f73');X(10,-10+bob+up,8,6,'#5b5f73');
  X(-6,-34+bob,12,9,'#8a8fa6');X(-4,-31+bob,3,2,'#6fe0ff');X(1,-31+bob,3,2,'#6fe0ff');
  X(-3,-22+bob,6,8,'#3fcfff');X(-2,-24+bob,4,3,'#c8f4ff');X(-10,-30+bob,3,6,'#3fcfff');X(8,-31+bob,3,7,'#3fcfff');
  X(-9,-18+bob,5,1,'#3a3d4f');X(4,-15+bob,6,1,'#3a3d4f')};
const _um=updateMonsters;updateMonsters=function(dt){for(const m of mons)if(m.fz>0){m.fz-=dt;m.hurtT=.2}_um(dt)};

/* ---------- 3 สกิล ต่างกันตามอาชีพ ---------- */
const SK={m:[{n:'ลูกไฟ',mp:10,cd:.7,ic:'b_fire'},{n:'ฟันหมุน',mp:14,cd:1.1,ic:'b_spin'},{n:'พุ่งฟัน',mp:13,cd:2,ic:'sk_dash'}],
 f:[{n:'ลูกน้ำแข็ง',mp:9,cd:.8,ic:'sk_ice'},{n:'ฟื้นฟู',mp:16,cd:6,ic:'sk_heal'},{n:'สายฟ้า',mp:18,cd:2.2,ic:'sk_bolt'}]};
/* ---------- v16 ส่วน 3: ตีบวกสกิล (ระดับ 0..SKL_MAX ต่อสกิล · P.sl[0..2] ตามอาชีพของช่องเซฟนั้น) ----------
   ค่าฐานอยู่ใน SK[g][i] (mp/cd) · ตัวคูณต่อระดับ: ดาเมจ +SKD ต่อระดับ (Lv.10 = ×2.0, ฟันหมุน ×1.8) · คูลดาวน์ −4% · MP −3% (ปัดลง ขั้นต่ำ 1)
   ฟื้นฟู (f[1]) ไม่ใช้ดาเมจ → ฟื้น 40% + 3%/ระดับ ของ HP สูงสุด · ปรับสมดุลที่ค่าคงที่ด้านล่างที่เดียว */
const SKL_MAX=10,SKL_CD=.04,SKL_MP=.03,SKL_REQ=[3,6,9,12,16,20,25,30,36,42];
const SKD={m:[.10,.08,.10],f:[.10,0,.10]},HEAL_BASE=.40,HEAL_STEP=.03;
const SKM_MAT=[['jelly','fang','pelt','bone','crystal'],['fang','tusk','pelt','bone','crystal'],['jelly','wing','tusk','bone','crystal']];
P.sl=[0,0,0];
function skLv(i){return Math.max(0,Math.min(SKL_MAX,(P.sl&&P.sl[i])|0))}
function skDm(i,n){n=n===undefined?skLv(i):n;return 1+SKD[P.g][i]*n}
function skCd(i,n){n=n===undefined?skLv(i):n;return +(SK[P.g][i].cd*(1-SKL_CD*n)).toFixed(3)}
function skMp(i,n){n=n===undefined?skLv(i):n;return Math.max(1,Math.floor(SK[P.g][i].mp*(1-SKL_MP*n)))}
function skHeal(n){return HEAL_BASE+HEAL_STEP*n}
function skGold(n){return Math.round(150*Math.pow(1.55,n)/10)*10}
function skMat(i,n){const q=2+Math.round(n*1.5),s=Math.floor(n/2),o={};o[SKM_MAT[i][s]]=q;if(n>=4)o[SKM_MAT[i][s-1]]=Math.round(q*.6);return o}
function skNorm(a){const o=[0,0,0];if(Array.isArray(a))for(let i=0;i<3;i++)o[i]=Math.max(0,Math.min(SKL_MAX,a[i]|0));return o}
function setCls(){['b_fire','b_spin','b_sk3'].forEach((id,i)=>{$(id).querySelector('img').src=IC[SK[P.g][i].ic]});
  const sp=['K','L','I'];['b_fire','b_spin','b_sk3'].forEach((id,i)=>{$(id).querySelector('span').textContent=sp[i];$(id).title=SK[P.g][i].n+(skLv(i)?' Lv.'+skLv(i):'')})}
const cy=m=>m.y-MON[m.type].h/2, foes=()=>HZ()?mons.filter(m=>!m.dead):[];
function spend(mp,key,cd){if(P.dead||P[key]>0||P.castT>0||P.atkT>0||P.spinT>0||modal)return false;
  if(P.mp<mp){SFX.err();flashMp();P[key]=.25;return false}P.mp-=mp;P[key]=cd;return true}
const _tf=tryFire,_ts=trySpin;
tryFire=function(){if(P.g==='m')return _tf();
  if(!spend(skMp(0),'fireCd',skCd(0)))return;P.castT=.28;SFX.fire();
  const d=DIRS[P.dir],ox=P.x,oy=P.y-8;let hit=null,bd=130;
  for(const m of foes()){const vx=m.x-ox,vy=cy(m)-oy,al=vx*d.x+vy*d.y,pp=Math.abs(vx*d.y-vy*d.x);if(al>0&&al<bd&&pp<13){bd=al;hit=m}}
  for(let i=8;i<=(hit?bd:130);i+=4)parts.push({x:ox+d.x*i,y:oy+d.y*i,vx:rnd(-8,8),vy:rnd(-8,8),life:.35,max:.35,col:['#9be0ff','#fff','#3f8cff'][ri(0,2)],g:0,size:2});
  if(hit){hitMonster(hit,Math.round(P.atk*2.3*skDm(0)*rnd(.9,1.1)),ox,oy,60,false);hit.fz=2.2;burst(hit.x,cy(hit),12,['#9be0ff','#fff'],50,.5,30)}};
trySpin=function(){if(P.g==='m')return _ts();
  if(!spend(skMp(1),'spinCd',skCd(1)))return;P.castT=.3;const n=Math.round(P.maxHp*skHeal(skLv(1)));P.hp=Math.min(P.maxHp,P.hp+n);SFX.lvl();
  ftext(P.x,P.y-30,'+'+n+' HP','#7dff9b');fx.push({k:'ring',x:P.x,y:P.y-8,t:0,life:.5,gold:true});burst(P.x,P.y-10,18,['#7dff9b','#fff','#b4f07d'],55,.8,-30,2)};
function trySk3(){
  if(P.g==='m'){
    if(!spend(skMp(2),'s3Cd',skCd(2)))return;P.invul=Math.max(P.invul,.35);SFX.spin();const d=DIRS[P.dir],done=new Set();
    for(let i=0;i<9;i++){moveE(P,d.x*5,d.y*5,4,5);for(const m of foes()){if(done.has(m))continue;
      if(Math.hypot(m.x-P.x,cy(m)-(P.y-8))<20){done.add(m);hitMonster(m,Math.round(P.atk*2.4*skDm(2)*rnd(.9,1.1)),P.x-d.x*8,P.y-d.y*8,120,false)}}
      if(i%2===0)burst(P.x,P.y-8,3,['#9be0ff','#fff'],20,.3,0)}
    fx.push({k:'ring',x:P.x,y:P.y-8,t:0,life:.3});S.shake=2;return}
  const ox=P.x,oy=P.y-8,t=foes().filter(m=>Math.hypot(m.x-ox,cy(m)-oy)<90).sort((a,b)=>Math.hypot(a.x-ox,cy(a)-oy)-Math.hypot(b.x-ox,cy(b)-oy)).slice(0,4);
  if(!t.length){if(P.s3Cd<=0){toast('ไม่มีเป้าหมายในระยะ',800);P.s3Cd=.4}return}
  if(!spend(skMp(2),'s3Cd',skCd(2)))return;P.castT=.3;SFX.boom();let px=ox,py=oy;
  for(const m of t){const ex=m.x,ey=cy(m);for(let i=0;i<=8;i++){const k=i/8;parts.push({x:px+(ex-px)*k+rnd(-3,3),y:py+(ey-py)*k+rnd(-3,3),vx:0,vy:0,life:.3,max:.3,col:i%2?'#fff':'#ffe66a',g:0,size:2})}
    hitMonster(m,Math.round(P.atk*2.1*skDm(2)*rnd(.9,1.1)),px,py,50,Math.random()<.2);px=ex;py=ey}}

/* ---------- ตกปลา ---------- */
const F={s:0,t:0,x:0,y:0};
function waterAhead(){if(zone==='hunt')return null;const t=targetTile();if(t.x<0||t.y<0||t.x>=W||t.y>=H)return null;return Z().t[t.y][t.x]==='w'?t:null}
function fishAct(){
  if(F.s===1){F.s=0;toast('เก็บเบ็ดก่อนเวลา',900);return true}
  if(F.s===2){catchFish();return true}
  const w=waterAhead();if(!w)return false;
  F.s=1;F.t=rnd(1.5,4.2);F.x=w.x*T+8;F.y=w.y*T+8;SFX.water();toast('ทิ้งเบ็ดแล้ว รอปลากินเบ็ด... เห็น ! ให้กด E',1600);return true}
function catchFish(){F.s=0;const q=Math.random(),cave=zone==='cave',k=q<(cave?.35:.7)?'fish_a':q<(cave?.8:.94)?'fish_b':'fish_c';
  P.inv[k]++;X.stats.fish=(X.stats.fish||0)+1;SFX.harvest();ftext(F.x,F.y-12,'+1 '+ITEMS[k].n,'#9be0ff',1.3);
  burst(F.x,F.y,14,['#9be0ff','#fff','#3a7bd5'],60,.5,100);gainExp(k==='fish_c'?30:k==='fish_b'?10:4,F.x,F.y-24);
  if(k==='fish_c')toast('ได้ปลาทองคำ! สุดยอด!',2000);refreshHot()}
function updateFish(dt){if(!F.s)return;if(P.moving||modal||P.dead){F.s=0;return}
  F.t-=dt;if(F.s===1&&F.t<=0){F.s=2;F.t=.9;tone(880,880,.1,'square',.05);S.shake=1}
  else if(F.s===2&&F.t<=0){F.s=0;toast('ปลาหลุดไป!',1000)}}

/* ---------- สัตว์ในฟาร์ม + หมาคู่ใจ ---------- */
const ANI=[],DOG={on:0,x:0,y:0,anim:0,cd:0,face:1};
const AT={chicken:{n:'ไก่',cost:150,max:4,t:45,out:'egg'},cow:{n:'วัว',cost:450,max:2,t:75,out:'milk'}};
const abl=(x,y)=>blocked(x,y,5,4)||(x>5*T-4&&x<13*T+4&&y>7*T&&y<12*T+4);
function addAni(t){for(let i=0;i<40;i++){const x=ri(2,15)*T+8,y=ri(6,13)*T+12;
  if(!abl(x,y)){ANI.push({t,x,y,vx:0,vy:0,tt:rnd(.5,2),prod:0,anim:Math.random()*6,face:1});return}}
  ANI.push({t,x:3*T,y:6*T+12,vx:0,vy:0,tt:1,prod:0,anim:0,face:1})}
function updateAni(dt){for(const a of ANI){const A=AT[a.t];a.anim+=dt;a.prod=Math.min(A.t,a.prod+dt);if(zone!=='farm')continue;
  a.tt-=dt;if(a.tt<=0){a.tt=rnd(1,3);const g=Math.random()<.4;a.vx=g?0:rnd(-1,1);a.vy=g?0:rnd(-1,1)}
  const sp=a.t==='cow'?9:14,nx=a.x+a.vx*sp*dt,ny=a.y+a.vy*sp*dt;
  if(!abl(nx,a.y))a.x=nx;else a.vx*=-1;if(!abl(a.x,ny))a.y=ny;else a.vy*=-1;if(a.vx)a.face=a.vx>0?1:-1}}
function aniAct(){if(zone!=='farm')return false;const d=DIRS[P.dir],fx0=P.x+d.x*8,fy0=P.y-4+d.y*8;let best=null,bd=22;
  for(const a of ANI){const dd=Math.hypot(a.x-fx0,a.y-4-fy0);if(dd<bd){bd=dd;best=a}}
  if(!best)return false;const A=AT[best.t];
  if(best.prod>=A.t){best.prod=0;P.inv[A.out]++;SFX.harvest();X.stats.prod=(X.stats.prod||0)+1;ftext(best.x,best.y-18,'+1 '+ITEMS[A.out].n,'#ffd23f');gainExp(6,best.x,best.y-30);refreshHot()}
  else toast(A.n+'ยังไม่พร้อม — อีก '+Math.ceil(A.t-best.prod)+' วินาที',1000);return true}
function updateDog(dt){if(!DOG.on)return;DOG.anim+=dt;DOG.cd-=dt;
  const dx=P.x-DOG.x,dy=P.y-DOG.y,dist=Math.hypot(dx,dy)||1;let tg=null,td=70;
  for(const m of foes()){const dd=Math.hypot(m.x-DOG.x,m.y-DOG.y);if(dd<td){td=dd;tg=m}}
  if(tg){const ex=tg.x-DOG.x,ey=tg.y-DOG.y,e=Math.hypot(ex,ey)||1;
    if(e>12){moveE(DOG,ex/e*52*dt,0,4,3);moveE(DOG,0,ey/e*52*dt,4,3)}DOG.face=ex>0?1:-1;
    if(e<=16&&DOG.cd<=0){DOG.cd=1;hitMonster(tg,Math.max(1,Math.round(P.atk*.7)),DOG.x,DOG.y,50,false)}}
  else if(dist>22){const sp=dist>80?90:50;moveE(DOG,dx/dist*sp*dt,0,4,3);moveE(DOG,0,dy/dist*sp*dt,4,3);DOG.face=dx>0?1:-1}
  if(dist>140){DOG.x=P.x-8;DOG.y=P.y}}
function drawAni(a){const x=Math.round(a.x),y=Math.round(a.y),R=mk(x,y,a.face),s=Math.sin(a.anim*8)>0?1:0,ready=a.prod>=AT[a.t].t;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-6,y-2,12,3);
  if(a.t==='chicken'){R(-1,-2,1,2+s,'#e0a02a');R(2,-2,1,2,'#e0a02a');R(-5,-9,10,6,'#f6f2e8');R(-6,-10,3,4,'#e8e2d2');R(-4,-7,6,3,'#dcd5c0');
    R(3,-12,4,5,'#f6f2e8');R(4,-14,2,3,'#d9413f');R(7,-10,2,2,'#f0a020');R(5,-11,1,1,'#111');R(3,-8,2,2,'#d9413f')}
  else{R(-9,-4,3,4,'#3a2a22');R(-5+s,-4,3,4,'#f1ede2');R(2-s,-4,3,4,'#3a2a22');R(6,-4,3,4,'#f1ede2');R(-10,-14,20,10,'#f1ede2');
    R(-6,-14,6,5,'#3a2a22');R(2,-11,6,4,'#3a2a22');R(-3,-5,5,2,'#e8a8a0');R(8,-16,7,7,'#f1ede2');R(12,-11,4,4,'#e8a8a0');
    R(8,-18,2,3,'#3a2a22');R(11,-18,2,3,'#3a2a22');R(10,-14,1,1,'#111');R(-11,-13,2,6,'#3a2a22')}
  if(ready)pixText('!',x,y-(a.t==='cow'?26:21),'#ffd23f',1.6,true)}
function drawDog(){const x=Math.round(DOG.x),y=Math.round(DOG.y),R=mk(x,y,DOG.face),s=Math.sin(DOG.anim*12)>0?1:0;
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-6,y-2,12,3);
  R(-7,-8,3,2,'#8a5a34');R(-5,-4,2,4,'#a8743f');R(-2+s,-4,2,4,'#8a5a34');R(2-s,-4,2,4,'#8a5a34');R(4,-4,2,4,'#a8743f');
  R(-6,-9,12,6,'#c8914f');R(-6,-9,12,2,'#e0b070');R(-2,-4,6,1,'#f1e0b8');R(4,-12,6,6,'#d6a05a');R(9,-9,3,3,'#f1e0b8');R(11,-9,1,1,'#111');
  R(5,-14,2,3,'#7a4e2c');R(8,-14,2,3,'#7a4e2c');R(8,-11,1,1,'#111')}
window.__sk={skLv,skDm,skCd,skMp,skHeal,skGold,skMat,SKL_REQ,SKL_MAX,SKD};
window.EXTRA_DRAW=list=>{
  if(F.s)list.push({b:F.y+9,f:()=>{const bob=F.s===2?Math.round(Math.sin(S.t*40)*2):Math.round(Math.sin(S.t*3));
    ctx.fillStyle='rgba(255,255,255,.45)';for(let i=0;i<8;i++)ctx.fillRect(Math.round(P.x+(F.x-P.x)*i/8),Math.round(P.y-14+(F.y-P.y+14)*i/8-Math.sin(i/8*3.14)*6),1,1);
    r(F.x-2,F.y-2+bob,4,4,'#e0414f');r(F.x-2,F.y+bob,4,2,'#fff');if(F.s===2)pixText('!',F.x,F.y-18,'#ffd23f',2.2,true)}});
  if(zone==='farm')ANI.forEach(a=>list.push({b:a.y,f:()=>drawAni(a)}));
  if(DOG.on)list.push({b:DOG.y,f:drawDog});
  const w=(!F.s&&running&&!modal&&!P.dead)?waterAhead():null;
  if(w)list.push({b:999,f:()=>pixText('E: ตกปลา',clamp(w.x*T+8,24,VW-24),w.y*T-6,'#9be0ff',1,true)})};

/* ---------- ร้านค้า: อัปเกรดดาบ + สัตว์ ---------- */
/* v15: ตีบวกดาบ +0..+10 · UP[n] = ราคา/วัตถุดิบเพื่อขึ้น +(n+1) · WL_REQ[n] = เลเวลผู้เล่นขั้นต่ำเพื่อขึ้น +(n+1) */
const UP=[[100,{jelly:5}],[220,{fang:4}],[400,{pelt:5}],[700,{bone:6}],[1200,{crystal:5}],
  [1800,{tusk:8,wing:8}],[2800,{bone:12,pelt:10}],[4200,{crystal:10,tusk:10}],[6200,{crystal:14,bone:14,wing:10}],[9000,{crystal:20,bone:20,tusk:15,wing:15}]];
const WL_MAX=UP.length,WL_REQ=[2,4,6,8,10,13,16,20,25,30];
const swordAtk=n=>n<=5?n*5:25+(n-5)*7;   // +1..+5 = +5 ต่อขั้น (เหมือนเดิม) · +6..+10 = +7 ต่อขั้น
const _rc=recalc;recalc=function(){_rc();P.atk+=swordAtk(P.wl||0)};recalc();
const tabsEl=document.querySelector('#shop .tabs');
[['up','ตีบวกดาบ'],['sk','ตีบวกสกิล'],['pet','สัตว์']].forEach(([k,n])=>{const b=document.createElement('button');b.className='mini';b.dataset.tab=k;b.textContent=n;tabsEl.appendChild(b);
  b.addEventListener('click',()=>{shopTab=k;SFX.click();renderShop()})});
function upHTML(){const n=P.wl;let h=`<div class="item"><img class="px" src="${IC.b_attack}" alt=""><div class="nm">ดาบ +${n}<small>โจมตีเพิ่ม +${swordAtk(n)} · ATK รวม ${P.atk}</small></div></div>`;
  if(n>=WL_MAX)return h+'<div class="hint">ดาบของคุณถึงขั้นสูงสุดแล้ว!</div>';
  const [g,mat]=UP[n],req=WL_REQ[n],lvOk=P.lv>=req,ok=lvOk&&P.gold>=g&&Object.keys(mat).every(k=>P.inv[k]>=mat[k]),mt=Object.keys(mat).map(k=>ITEMS[k].n+' '+P.inv[k]+'/'+mat[k]).join(', ');
  return h+`<div class="item"><div class="nm">ตีบวกเป็น +${n+1}<small>${lvOk?'':'🔒 ต้องเลเวล '+req+' ก่อน (ตอนนี้ Lv.'+P.lv+') · '}${mt}<br>ATK ${P.atk} → ${P.atk+swordAtk(n+1)-swordAtk(n)}</small></div><span class="pr">${g}G</span><button class="mini" data-x="up" ${ok?'':'disabled'}>${lvOk?'อัปเกรด':'Lv.'+req}</button></div>
  <div class="hint">หาวัตถุดิบ: สไลม์→เยลลี่ · ก็อบลิน→เขี้ยว · หมาป่า→หนัง · หมูป่า→งา · ค้างคาว→ปีก · ถ้ำ→กระดูก/ผลึก</div>`}
function petHTML(){return Object.keys(AT).map(k=>{const a=AT[k],own=ANI.filter(x=>x.t===k).length;
  return `<div class="item"><div class="nm">${a.n}<small>มี ${own}/${a.max} · ให้${ITEMS[a.out].n}ทุก ${a.t} วินาที</small></div><span class="pr">${a.cost}G</span><button class="mini" data-x="pet" data-k="${k}" ${own>=a.max||P.gold<a.cost?'disabled':''}>ซื้อ</button></div>`}).join('')
  +`<div class="item"><div class="nm">หมาคู่ใจ<small>${DOG.on?'ติดตามคุณและช่วยกัดมอนสเตอร์':'ช่วยกัดมอนสเตอร์ตอนผจญภัย'}</small></div><span class="pr">300G</span><button class="mini" data-x="dog" ${DOG.on||P.gold<300?'disabled':''}>${DOG.on?'มีแล้ว':'ซื้อ'}</button></div>
  <div class="hint">ในฟาร์ม หันหน้าเข้าหาสัตว์ที่มี ! แล้วกด E เพื่อเก็บผลผลิต</div>`}
const _rs=renderShop;renderShop=function(){if(shopTab!=='up'&&shopTab!=='pet'&&shopTab!=='sk')return _rs();
  $('shopgold').textContent=P.gold+' G';document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===shopTab));
  $('shoplist').innerHTML=shopTab==='up'?upHTML():shopTab==='sk'?skHTML():petHTML()};
$('shoplist').addEventListener('click',e=>{const b=e.target.closest('button[data-x]');if(!b||b.disabled)return;audioInit();const x=b.dataset.x;
  if(x==='up'){if(P.wl>=WL_MAX||P.lv<WL_REQ[P.wl])return;const [g,mat]=UP[P.wl];if(P.gold<g||!Object.keys(mat).every(k=>P.inv[k]>=mat[k]))return;P.gold-=g;for(const k in mat)P.inv[k]-=mat[k];P.wl++;recalc();K.blade=BLADE[P.wl];X.stats.wl=P.wl;SFX.lvl();toast('ดาบ +'+P.wl+' สำเร็จ!',1800)}
  else if(x==='pet'){const a=AT[b.dataset.k];if(P.gold<a.cost)return;P.gold-=a.cost;addAni(b.dataset.k);SFX.coin();toast('ได้'+a.n+'ตัวใหม่แล้ว!',1500)}
  else if(x==='dog'){if(P.gold<300)return;P.gold-=300;DOG.on=1;DOG.x=P.x;DOG.y=P.y;SFX.coin();toast('ได้หมาคู่ใจแล้ว!',1500)}
  save();renderShop()});

/* v16: แท็บ "ตีบวกสกิล" */
function skStat(i,n){const base=SK[P.g][i];
  const eff=i===1&&P.g==='f'?'ฟื้น '+Math.round(skHeal(n)*100)+'% HP':'ดาเมจ ×'+skDm(i,n).toFixed(2);
  return eff+' · คูลดาวน์ '+skCd(i,n)+' วิ · MP '+skMp(i,n)}
function skHTML(){let h='';
  for(let i=0;i<3;i++){const n=skLv(i),sk=SK[P.g][i];
    h+=`<div class="item"><img class="px" src="${IC[sk.ic]}" alt=""><div class="nm">${sk.n} Lv.${n}/${SKL_MAX}<small>${skStat(i,n)}</small></div></div>`;
    if(n>=SKL_MAX){h+='<div class="hint">สกิลนี้ถึงระดับสูงสุดแล้ว!</div>';continue}
    const g=skGold(n),mat=skMat(i,n),req=SKL_REQ[n],lvOk=P.lv>=req,ok=lvOk&&P.gold>=g&&Object.keys(mat).every(k=>P.inv[k]>=mat[k]),
      mt=Object.keys(mat).map(k=>ITEMS[k].n+' '+P.inv[k]+'/'+mat[k]).join(', ');
    h+=`<div class="item"><div class="nm">ตีบวกเป็น Lv.${n+1}<small>${lvOk?'':'🔒 ต้องเลเวล '+req+' ก่อน (ตอนนี้ Lv.'+P.lv+') · '}${mt}<br>${skStat(i,n+1)}</small></div><span class="pr">${g}G</span><button class="mini" data-sk="${i}" ${ok?'':'disabled'}>${lvOk?'อัปเกรด':'Lv.'+req}</button></div>`}
  return h+'<div class="hint">ทุกระดับ: ดาเมจ/ฟื้นเพิ่ม · คูลดาวน์ลด 4% · MP ลด 3% · ใช้ทอง + วัตถุดิบจากมอนสเตอร์ (ต่างกันตามสกิล)</div>'}
$('shoplist').addEventListener('click',e=>{const b=e.target.closest('button[data-sk]');if(!b||b.disabled)return;audioInit();
  const i=+b.dataset.sk,n=skLv(i);if(!(i>=0&&i<3)||n>=SKL_MAX||P.lv<SKL_REQ[n])return;
  const g=skGold(n),mat=skMat(i,n);if(P.gold<g||!Object.keys(mat).every(k=>P.inv[k]>=mat[k]))return;
  P.gold-=g;for(const k in mat)P.inv[k]-=mat[k];P.sl[i]=n+1;X.stats.sk=(X.stats.sk||0)+1;setCls();SFX.lvl();
  toast(SK[P.g][i].n+' Lv.'+(n+1)+' สำเร็จ!',1800);save();renderShop();refreshHot&&refreshHot()});

/* ---------- เซฟข้อมูลเพิ่มเติม ---------- */
const xk=()=>'pv_x'+X.slot;
const _sv=save;save=function(){_sv();if(!running)return;try{localStorage.setItem(xk(),JSON.stringify({g:P.g,wl:P.wl,sl:P.sl,dog:DOG.on,ani:ANI.map(a=>({t:a.t,p:Math.floor(a.prod)}))}))}catch(e){}};
const _ld=load;load=function(){const ok=_ld();if(!ok)return false;
  try{const d=JSON.parse(localStorage.getItem(xk()))||{};P.g=d.g||'m';P.wl=d.wl||0;P.sl=skNorm(d.sl);DOG.on=d.dog||0;ANI.length=0;(d.ani||[]).forEach(o=>{addAni(o.t);ANI[ANI.length-1].prod=o.p||0})}catch(e){}
  recalc();applyLook();return true};
const _sg=startGame;startGame=function(cont){if(!cont){P.g=SELG;P.wl=0;P.sl=[0,0,0];DOG.on=0;ANI.length=0;recalc()}_sg(cont);DOG.x=P.x;DOG.y=P.y;applyLook()};

/* ---------- วนอัปเดต / HUD / ฉาก ---------- */
const _up2=update;update=function(dt){_up2(dt);P.s3Cd=Math.max(0,P.s3Cd-dt);if(held.has('sk3'))trySk3();updateFish(dt);updateAni(dt);updateDog(dt)};
const _int=interact;interact=function(){if(modal||P.dead)return;if(fishAct()||aniAct())return;_int()};
const SKID=['b_fire','b_spin','b_sk3'],skHc={};
const _hud=hud;hud=function(){_hud();[['b_fire','fireCd',0],['b_spin','spinCd',1],['b_sk3','s3Cd',2]].forEach(([id,k,i])=>{
    const h=Math.ceil(clamp(P[k]/skCd(i),0,1)*40)/40,el=$(id).querySelector('.cd');if(skHc[id]!==h){skHc[id]=h;el.style.transform='scaleY('+h+')'}$(id).classList.toggle('lack',P.mp<skMp(i))});
  const bk=P.g+P.sl.join(',');if(skHc.bk!==bk){skHc.bk=bk;setCls();SKID.forEach((id,i)=>{let e=$(id).querySelector('.slv');if(!e){e=document.createElement('u');e.className='slv';$(id).appendChild(e)}e.textContent=skLv(i)?skLv(i):'';e.style.display=skLv(i)?'':'none'})}
  $('plv').textContent='Lv.'+P.lv+(P.wl?'  ⚔+'+P.wl:'')};
const _r2=render;render=function(){_r2();if(zone!=='cave')return;const c=ctx;c.fillStyle='rgba(8,4,36,.28)';c.fillRect(0,0,VW,CH);
  for(let i=0;i<10;i++){const x=(i*71+Math.sin(S.t*.5+i)*14+VW)%VW,y=24+((i*37)%Math.max(40,CH-50)),a=.4+.4*Math.sin(S.t*2.4+i*3);
    c.fillStyle='rgba(111,214,255,'+(a*.35).toFixed(2)+')';c.fillRect(x-1,y-1,4,4);c.fillStyle='rgba(200,244,255,'+a.toFixed(2)+')';c.fillRect(x,y,2,2)}};
QUESTS.push({id:'f5',t:'ตกปลา 5 ตัว',k:'fish',n:5,g:100,x:30},{id:'w2',t:'ตีบวกดาบถึง +2',k:'wl',n:2,g:200,x:60},
 {id:'p5',t:'เก็บผลผลิตจากสัตว์ 5 ครั้ง',k:'prod',n:5,g:150,x:40},{id:'sk3',t:'ปราบโครงกระดูก 3 ตัว',k:'skel',n:3,g:300,x:100});

/* ---------- หน้าเลือกตัวละคร ---------- */
document.querySelectorAll('.gcard').forEach(b=>{faceTo(b.querySelector('canvas'),b.dataset.g);
  b.addEventListener('click',()=>{SELG=b.dataset.g;document.querySelectorAll('.gcard').forEach(o=>o.classList.toggle('on',o===b));SFX.click&&audioInit()})});
applyLook();
