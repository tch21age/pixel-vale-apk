'use strict';
/* ภารกิจ · ฝน · บอสราชาสไลม์ · หิ่งห้อย · แสงขอบจอ */
const QUESTS=[
 {id:'h5',t:'เก็บเกี่ยวพืช 5 ครั้ง',k:'harvest',n:5,g:60,x:20},
 {id:'s5',t:'กำจัดสไลม์ 5 ตัว',k:'slime',n:5,g:80,x:30},
 {id:'g3',t:'กำจัดก็อบลิน 3 ตัว',k:'goblin',n:3,g:120,x:50},
 {id:'l5',t:'ถึงเลเวล 5',k:'lv',n:5,g:250,x:0},
 {id:'h15',t:'เก็บเกี่ยวพืช 15 ครั้ง',k:'harvest',n:15,g:200,x:80},
 {id:'au',t:'สะสมเงิน 1,000 G',k:'gold',n:1000,g:300,x:100},
 {id:'kg',t:'ปราบราชาสไลม์',k:'king',n:1,g:500,x:200}];
const prog=q=>q.k==='lv'?P.lv:q.k==='gold'?P.gold:(X.stats[q.k]||0);
const qp=document.createElement('div');qp.id='quests';qp.className='panel hide';document.body.appendChild(qp);
function qDraw(){if(qp.classList.contains('hide'))return;
  qp.innerHTML='<div class="qt">ภารกิจ</div>'+QUESTS.map(q=>{const p=Math.min(prog(q),q.n),d=X.done[q.id];
    return `<div class="q${d?' ok':''}"><span>${d?'✔ ':''}${q.t}</span><i><u style="width:${p/q.n*100}%"></u></i><small>${p}/${q.n} · รางวัล ${q.g}G</small></div>`}).join('')}
function qCheck(){for(const q of QUESTS){if(X.done[q.id]||prog(q)<q.n)continue;X.done[q.id]=1;P.gold+=q.g;if(q.x)gainExp(q.x);
  ftext(P.x,P.y-50,'ภารกิจสำเร็จ!','#ffd23f',2,1.6);toast('ภารกิจสำเร็จ: '+q.t+'  +'+q.g+'G',2800);SFX.lvl();save()}qDraw()}
document.getElementById('gmQuest').onclick=()=>{qp.classList.toggle('hide');qDraw()};
/* สถิติ */
const _kill=killMonster;killMonster=function(m){_kill(m);X.stats[m.type]=(X.stats[m.type]||0)+1};
const _plot=plotAct;plotAct=function(pl,x,y){const h=pl.state===2&&pl.stage>=3;_plot(pl,x,y);if(h)X.stats.harvest=(X.stats.harvest||0)+1};
/* บอส */
MON.king={name:'ราชาสไลม์',hp:260,atk:14,spd:22,exp:120,gold:[80,140],drop:['potion_hp',1],aggro:120,range:20,h:26};
const _sp=spawnMon;spawnMon=function(){const n=mons.length;_sp();
  if(mons.length>n&&zone==='hunt'&&P.lv>=3&&Math.random()<.07&&!mons.some(o=>o.type==='king'&&!o.dead)){const m=mons[mons.length-1];m.type='king';m.hp=MON.king.hp;toast('ราชาสไลม์ปรากฏตัวแล้ว!',2400)}};
const _gs=goblinSprite,_ss=slimeSprite;
goblinSprite=function(x,y,m){if(m.type!=='king')return _gs(x,y,m);
  ctx.save();ctx.translate(x,y);ctx.scale(1.7,1.7);_ss(0,0,m);ctx.fillStyle='#ffd23f';ctx.fillRect(-5,-17,10,3);ctx.fillRect(-5,-20,2,3);ctx.fillRect(-1,-21,2,4);ctx.fillRect(3,-20,2,3);ctx.restore()};
/* อัปเดต: ฝน + เวลาเล่น + ภารกิจ */
let qT=0;const _up=update;
update=function(dt){_up(dt);X.play+=dt;
  if((X.rainT-=dt)<=0){X.rain=!X.rain&&Math.random()<.4?1:0;X.rainT=rnd(40,90);if(X.rain&&zone==='farm')toast('ฝนตก! พืชในฟาร์มถูกรดน้ำให้เอง',2600)}
  if(X.rain&&zone==='farm')for(const k in plots)if(plots[k].state===2)plots[k].watered=true;
  if((qT-=dt)<=0){qT=.5;qCheck()}};
/* ภาพ: ฝน หิ่งห้อย แสงขอบจอ */
const _rd=render;
render=function(){_rd();const c=ctx,h=S.minutes/60,farm=zone==='farm';
  if(X.rain&&farm&&running){c.fillStyle='rgba(30,50,90,.2)';c.fillRect(0,0,VW,CH);c.fillStyle='rgba(180,215,255,.6)';
    for(let i=0;i<80;i++)c.fillRect((i*53.7+S.t*45)%VW,(i*31.3+S.t*300)%CH,1,5)}
  if(farm&&(h>=19.5||h<5))for(let i=0;i<14;i++){const x=(i*67+Math.sin(S.t*.6+i)*24+VW)%VW,y=30+((i*41)%Math.max(40,CH-70))+Math.cos(S.t*.8+i*2)*8,a=.5+.5*Math.sin(S.t*3+i*5);
    c.fillStyle='rgba(255,233,122,'+(a*.3).toFixed(2)+')';c.fillRect(x-1,y-1,4,4);c.fillStyle='rgba(255,245,170,'+a.toFixed(2)+')';c.fillRect(x,y,2,2)}
  const g=c.createRadialGradient(VW/2,CH/2,CH*.5,VW/2,CH/2,VW*.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.35)');c.fillStyle=g;c.fillRect(0,0,VW,CH)};
