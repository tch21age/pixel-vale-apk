'use strict';
/* ภารกิจต่อเนื่องตามเลเวล (v13) — ไม่มีวันหมด: ทำเสร็จแล้วขึ้นรอบใหม่ (เป้าหมาย+รางวัลเพิ่ม)
   · ปลดล็อกตามเลเวล · เลื่อนดูได้ · แตะภารกิจเพื่อ "นำทาง" (ลูกศรชี้ + ระยะทาง) · เซฟอยู่ใน X.stats.qs (ไม่แก้ save.js)
   ภารกิจหลัก 7 ข้อเดิมยังอยู่ (X.done เดิม) */
(function(){
  const ZN=['farm','hunt','cave'],ZT={farm:'ฟาร์ม',hunt:'ป่าล่าสัตว์',cave:'ถ้ำคริสตัล'};
  const PLACE={plots:[9*T,9.5*T,'แปลงผัก'],pond:[19*T,10.5*T,'บ่อน้ำ'],shop:[20*T,4.5*T,'ร้านค้า'],animals:[9*T,6.5*T,'คอกสัตว์']};
  const MK=['slime','goblin','wolf','boar','bat','skel','golem','king'];
  /* id, เลเวลปลดล็อก, สถิติ, เป้าเริ่ม, ตัวคูณต่อรอบ, ทอง, exp(ขั้นต่ำ), ข้อความ, นำทาง */
  const TPL=[
   {id:'hv', lv:1, k:'harvest',n0:5, st:.6,g:50, x:15,t:n=>`เก็บเกี่ยวพืช ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'any',lv:1, k:'any',    n0:8, st:.6,g:60, x:20,t:n=>`ล่ามอนสเตอร์ ${n} ตัว`,nav:{z:'hunt'}},
   {id:'sl', lv:1, k:'slime',  n0:6, st:.6,g:55, x:18,t:n=>`กำจัดสไลม์ ${n} ตัว`,nav:{z:'hunt',mon:'slime'}},
   {id:'lvl',lv:1, k:'lv',abs:1,g:0,x:0,t:n=>`ฝึกฝนจนถึงเลเวล ${n}`,nav:{z:'hunt'}},
   {id:'gb', lv:2, k:'goblin', n0:4, st:.6,g:80, x:26,t:n=>`กำจัดก็อบลิน ${n} ตัว`,nav:{z:'hunt',mon:'goblin'}},
   {id:'fi', lv:2, k:'fish',   n0:3, st:.7,g:70, x:20,t:n=>`ตกปลา ${n} ตัว`,nav:{z:'farm',at:'pond'}},
   {id:'pr', lv:3, k:'prod',   n0:3, st:.7,g:90, x:24,t:n=>`เก็บไข่/นมจากสัตว์ ${n} ครั้ง`,nav:{z:'farm',at:'animals'}},
   {id:'wf', lv:4, k:'wolf',   n0:4, st:.6,g:110,x:34,t:n=>`ล่าหมาป่า ${n} ตัว`,nav:{z:'hunt',mon:'wolf'}},
   {id:'bo', lv:5, k:'boar',   n0:4, st:.6,g:130,x:40,t:n=>`ล่าหมูป่า ${n} ตัว`,nav:{z:'hunt',mon:'boar'}},
   {id:'gd', lv:5, k:'gold',abs:1,g:0,x:0,t:n=>`สะสมเงินให้ถึง ${n.toLocaleString('en-US')} G`,nav:{z:'farm',at:'shop'}},
   {id:'kg', lv:6, k:'king',   n0:1, st:.5,g:260,x:90,t:n=>`ปราบราชาสไลม์ ${n} ครั้ง`,nav:{z:'hunt',mon:'king'}},
   {id:'bt', lv:8, k:'bat',    n0:5, st:.6,g:170,x:50,t:n=>`ล่าค้างคาวในถ้ำ ${n} ตัว`,nav:{z:'cave',mon:'bat'}},
   {id:'fi2',lv:8, k:'fish',   n0:15,st:.5,g:220,x:60,t:n=>`นักตกปลามือโปร: ตกปลา ${n} ตัว`,nav:{z:'farm',at:'pond'}},
   {id:'sk', lv:10,k:'skel',   n0:4, st:.6,g:230,x:70,t:n=>`ทำลายโครงกระดูก ${n} ตัว`,nav:{z:'cave',mon:'skel'}},
   {id:'hv2',lv:10,k:'harvest',n0:40,st:.5,g:300,x:80,t:n=>`เกษตรกรตัวจริง: เก็บเกี่ยว ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'pr2',lv:12,k:'prod',   n0:12,st:.5,g:320,x:90,t:n=>`เจ้าของฟาร์มสัตว์: เก็บผลผลิต ${n} ครั้ง`,nav:{z:'farm',at:'animals'}},
   {id:'gl', lv:14,k:'golem',  n0:2, st:.6,g:420,x:130,t:n=>`พิชิตโกเลมคริสตัล ${n} ตัว`,nav:{z:'cave',mon:'golem'}},
   {id:'an2',lv:15,k:'any',    n0:60,st:.5,g:500,x:150,t:n=>`สงครามไม่รู้จบ: ล่ามอนสเตอร์ ${n} ตัว`,nav:{z:'hunt'}},
   /* v14: สายภารกิจพืช (สถิติ plant / hv_<พืช> บันทึกใน crops.js) */
   {id:'plA',lv:2, k:'plant',   n0:8, st:.6,g:60, x:16,t:n=>`ปลูกพืชทุกชนิด ${n} ต้น`,nav:{z:'farm',at:'plots'}},
   {id:'hvD',lv:2, k:'hv_daikon',     n0:4, st:.6,g:70, x:18,t:n=>`เก็บเกี่ยวหัวไชเท้า ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvC',lv:4, k:'hv_carrot',     n0:4, st:.6,g:100,x:28,t:n=>`เก็บเกี่ยวแครอท ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvN',lv:5, k:'hv_corn',       n0:4, st:.6,g:130,x:36,t:n=>`เก็บเกี่ยวข้าวโพด ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvH',lv:7, k:'hv_chili',      n0:4, st:.6,g:170,x:48,t:n=>`เก็บเกี่ยวพริกแดง ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvP',lv:10,k:'hv_potato',     n0:5, st:.6,g:240,x:64,t:n=>`เก็บเกี่ยวมันฝรั่ง ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvW',lv:16,k:'hv_watermelon', n0:4, st:.6,g:380,x:100,t:n=>`เก็บเกี่ยวแตงโม ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvG',lv:20,k:'hv_grape',      n0:4, st:.6,g:520,x:140,t:n=>`เก็บเกี่ยวองุ่น ${n} ครั้ง`,nav:{z:'farm',at:'plots'}},
   {id:'hvU',lv:34,k:'hv_durian',     n0:3, st:.6,g:900,x:260,t:n=>`เก็บเกี่ยวทุเรียน ${n} ครั้ง`,nav:{z:'farm',at:'plots'}}
  ];
  const stat=q=>q.k==='lv'?P.lv:q.k==='gold'?P.gold:q.k==='any'?MK.reduce((a,m)=>a+(X.stats[m]||0),0):(X.stats[q.k]||0);
  const S_=()=>{const s=X.stats;if(!s.qs)s.qs={cur:{},n:0};return s.qs};
  function mkInst(t,r){let n,b=0;
    if(t.k==='lv'){n=(Math.floor(P.lv/5)+1)*5;return{r,b:0,n,g:n*30,x:0}}
    if(t.k==='gold'){n=Math.ceil((P.gold+400*(r+1)+P.lv*60)/100)*100;return{r,b:0,n,g:Math.round(n*.12),x:0}}
    n=Math.ceil(t.n0*(1+t.st*r));b=stat(t);
    return{r,b,n,g:Math.round(t.g*(1+.3*r)*(1+.1*P.lv)),x:Math.round(Math.max(t.x,P.expNeed*(.04+.012*Math.min(r,8))))}}
  const prog=(t,c)=>Math.max(0,Math.min(c.n,stat(t)-c.b));
  function ensure(){const q=S_();for(const t of TPL)if(P.lv>=t.lv&&!q.cur[t.id])q.cur[t.id]=mkInst(t,0)}

  /* ---------- นำทาง ---------- */
  let nav=null;
  function setNav(t){const c=S_().cur[t.id];if(nav&&nav.id===t.id){nav=null;toast('ยกเลิกนำทางแล้ว',1200);return}
    nav={id:t.id,...t.nav,label:t.t(c.n)};toast('นำทาง: '+ZT[t.nav.z]+(t.nav.at?' · '+PLACE[t.nav.at][2]:''),1800)}
  function target(){if(!nav)return null;
    const zi=ZN.indexOf(zone),ti=ZN.indexOf(nav.z);
    if(zi!==ti)return{x:ti>zi?VW-8:8,y:86,name:'ไป'+ZT[ZN[zi+(ti>zi?1:-1)]],far:1};
    if(nav.at){const p=PLACE[nav.at];return{x:p[0],y:p[1],name:p[2]}}
    if(nav.mon){let best=null,bd=1e9;for(const m of mons){if(m.dead||m.type!==nav.mon)continue;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;best=m}}
      if(best)return{x:best.x,y:best.y-8,name:MON[nav.mon].name};return{x:VW/2,y:86,name:'หา'+MON[nav.mon].name}}
    return{x:VW/2,y:86,name:ZT[zone]}}
  function drawNav(){const g=target();if(!g)return;const dx=g.x-P.x,dy=g.y-(P.y-8),d=Math.hypot(dx,dy);
    if(!g.far&&d<26&&nav.at){nav=null;toast('ถึงที่หมายแล้ว!',1400);return}
    if(!g.far&&d<40&&!nav.at)return;
    const a=Math.atan2(dy,dx),bob=Math.sin(S.t*6)*2,R=30+bob,x=clamp(P.x+Math.cos(a)*R,8,VW-8),y=P.y-10+Math.sin(a)*R*.8;
    const c=ctx;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(a);
    const sh=(col,o)=>{c.fillStyle=col;c.fillRect(-7-o,-1-o,9+o*2,2+o*2);c.fillRect(1-o,-4-o,2+o*2,8+o*2);c.fillRect(3-o,-3-o,2+o*2,6+o*2);c.fillRect(5-o,-2-o,2+o*2,4+o*2);c.fillRect(7-o,-1-o,2+o*2,2+o*2)};
    sh('#0b0b12',1);sh('#ffd23f',0);c.restore();
    const lab=g.far?g.name:g.name+' '+Math.max(1,Math.round(d/T))+' ช่อง';
    pixText(lab,clamp(x,26,VW-26),clamp(y-12,8,CH-8),'#ffe99a',.8,true)}
  addEventListener('load',()=>{const _ex=window.EXTRA_DRAW;
    window.EXTRA_DRAW=function(list){if(_ex)_ex(list);if(!running||P.dead||!nav)return;list.push({b:9999,f:drawNav})}});

  /* ---------- แผงภารกิจ ---------- */
  let lastH='';
  qDraw=function(){if(qp.classList.contains('hide'))return;ensure();const q=S_();
    const act=TPL.filter(t=>P.lv>=t.lv),lock=TPL.filter(t=>P.lv<t.lv).slice(0,4);
    let h='<div class="qt">ภารกิจ <small>ทำแล้ว '+(q.n||0)+' ครั้ง</small></div>';
    if(nav)h+='<button class="mini qstop" data-stop="1">หยุดนำทาง: '+nav.label+'</button>';
    h+='<div class="qh">ภารกิจต่อเนื่อง · ไม่มีวันหมด</div>';
    h+=act.map(t=>{const c=q.cur[t.id],p=prog(t,c),on=nav&&nav.id===t.id;
      return `<div class="q go${on?' nv':''}" data-id="${t.id}"><span>${t.t(c.n)}</span><em>รอบ ${c.r+1}</em><i><u style="width:${p/c.n*100}%"></u></i><small>${p.toLocaleString('en-US')}/${c.n.toLocaleString('en-US')} · ${c.g}G${c.x?' +'+c.x+'EXP':''}</small><b>${on?'● กำลังนำทาง':'➤ แตะเพื่อนำทาง'}</b></div>`}).join('');
    h+='<div class="qh">ภารกิจหลัก</div>'+QUESTS.map(o=>{const p=Math.min(prog0(o),o.n),d=X.done[o.id];
      return `<div class="q${d?' ok':''}"><span>${d?'✔ ':''}${o.t}</span><i><u style="width:${p/o.n*100}%"></u></i><small>${p}/${o.n} · รางวัล ${o.g}G</small></div>`}).join('');
    if(lock.length)h+='<div class="qh">ปลดล็อกเร็ว ๆ นี้</div>'+lock.map(t=>`<div class="q lk"><span>🔒 ${t.t(t.n0||'?')}</span><small>ปลดล็อกที่ Lv.${t.lv}</small></div>`).join('');
    if(h===lastH)return;lastH=h;const st=qp.scrollTop;qp.innerHTML=h;qp.scrollTop=st};
  const prog0=o=>o.k==='lv'?P.lv:o.k==='gold'?P.gold:(X.stats[o.k]||0);
  qCheck=function(){ensure();const q=S_();
    for(const o of QUESTS){if(X.done[o.id]||prog0(o)<o.n)continue;X.done[o.id]=1;P.gold+=o.g;if(o.x)gainExp(o.x);
      ftext(P.x,P.y-50,'ภารกิจสำเร็จ!','#ffd23f',2,1.6);toast('ภารกิจสำเร็จ: '+o.t+'  +'+o.g+'G',2800);SFX.lvl();save()}
    for(const t of TPL){const c=q.cur[t.id];if(!c||prog(t,c)<c.n)continue;
      P.gold+=c.g;q.n=(q.n||0)+1;if(c.x)gainExp(c.x);
      const bonus=(c.r+1)%4===0;if(bonus){P.inv.potion_hp=(P.inv.potion_hp||0)+2;refreshHot()}
      ftext(P.x,P.y-50,'ภารกิจสำเร็จ!','#ffd23f',2,1.6);
      toast('ภารกิจสำเร็จ: '+t.t(c.n)+'  +'+c.g+'G'+(c.x?' +'+c.x+'EXP':'')+(bonus?' +ยาฟื้น HP x2':''),3200);SFX.lvl();
      if(nav&&nav.id===t.id)nav=null;
      q.cur[t.id]=mkInst(t,c.r+1);save()}
    qDraw()};
  qp.addEventListener('click',e=>{if(e.target.closest('[data-stop]')){nav=null;lastH='';qDraw();return}
    const el=e.target.closest('.q.go');
    const t=el&&TPL.find(o=>o.id===el.dataset.id);
    if(!t){qp.classList.add('hide');return}   /* แตะส่วนอื่นของแผง → หุบ */
    setNav(t);qp.classList.add('hide')});
  /* เลเวลอัปแล้วภารกิจใหม่ปลดล็อก */
  const _gx2=gainExp;gainExp=function(n,x,y){const before=TPL.filter(t=>P.lv>=t.lv).length;_gx2(n,x,y);
    const nw=TPL.filter(t=>P.lv>=t.lv&&TPL.indexOf(t)>=0).length;if(nw>before){ensure();setTimeout(()=>toast('ปลดล็อกภารกิจใหม่ '+(nw-before)+' รายการ! (กดปุ่มภารกิจ)',2600),3000)}};
})();
