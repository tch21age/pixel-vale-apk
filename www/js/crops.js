'use strict';
/* =====================================================================
   พืชใหม่ 20 ชนิด (v14) — ข้อมูล + logic ล้วน (ภาพอยู่ที่ js/art_crops.js)
   - ต่อ CROPS / ITEMS / SEEDS / CROPKEYS / BUY เข้าระบบเดิมแบบ "ต่อท้ายเท่านั้น" (ไม่เรียงใหม่)
     → S.sel ในเซฟเก่า (ดัชนี 0..2) ยังชี้เมล็ดตัวเดิม · เซฟเก่าไม่มี key พืชใหม่ → default 0
   - ล็อกเลเวล: ปลูก/ซื้อเมล็ดที่ยังไม่ถึงเลเวลไม่ได้ (พืชเดิม 3 ชนิดเป็น Lv.1 เพื่อไม่ให้เซฟเก่าพัง)
   - แถบไอเท็ม: [◀][เมล็ดที่เลือก][▶][ยา HP][ยา MP] · ปุ่ม 1/2/3 = ก่อนหน้า/เปิดรายการ/ถัดไป · 4,5 = ยาเหมือนเดิม
   - สถิติเก็บใน X.stats (save.js เซฟให้อยู่แล้ว): plant, pl_<พืช>, hv_<พืช>
   ===================================================================== */
(function(){
  /* key, ชื่อไทย, เลเวล, เวลาโต(วินาที), exp, ราคาซื้อเมล็ด, ราคาขายผลผลิต */
  const NEW=[
    ['daikon',     'หัวไชเท้า',      2,  15,   5,    8,   20],
    ['lettuce',    'ผักกาดหอม',      3,  20,   7,   14,   34],
    ['carrot',     'แครอท',          4,  26,  10,   20,   50],
    ['corn',       'ข้าวโพด',        5,  34,  15,   34,   82],
    ['eggplant',   'มะเขือม่วง',     6,  40,  19,   45,  108],
    ['chili',      'พริกแดง',        7,  46,  23,   58,  138],
    ['cabbage',    'กะหล่ำปลี',      8,  54,  28,   75,  178],
    ['shallot',    'หอมแดง',         9,  62,  34,   95,  225],
    ['potato',     'มันฝรั่ง',      10,  70,  40,  120,  280],
    ['sweetpotato','มันเทศ',        12,  80,  48,  150,  350],
    ['cucumber',   'แตงกวา',        14,  92,  58,  190,  440],
    ['watermelon', 'แตงโม',         16, 105,  70,  240,  560],
    ['strawberry', 'สตรอว์เบอร์รี',  18, 120,  85,  300,  700],
    ['grape',      'องุ่น',         20, 135, 102,  380,  880],
    ['pineapple',  'สับปะรด',       23, 150, 122,  480, 1100],
    ['mango',      'มะม่วง',        26, 170, 146,  600, 1380],
    ['dragonfruit','แก้วมังกร',     30, 190, 175,  760, 1750],
    ['durian',     'ทุเรียน',       34, 215, 210,  960, 2200],
    ['ginseng',    'โสมเกาหลี',     38, 245, 250, 1200, 2800],
    ['goldapple',  'แอปเปิลทอง',    42, 280, 300, 1500, 3500]
  ];
  const LV={turnip:1,tomato:1,pumpkin:1};          // เลเวลปลดล็อกของพืชเดิม
  for(const [k,n,lv,grow,exp,buy,sell] of NEW){
    LV[k]=lv;
    CROPS[k]={grow,exp,name:n};
    ITEMS['seed_'+k]={n:'เมล็ด'+n,buy,lv};
    ITEMS['crop_'+k]={n,sell};
    SEEDS.push('seed_'+k);CROPKEYS.push(k);BUY.push('seed_'+k);
  }
  ITEMS.seed_turnip.lv=ITEMS.seed_tomato.lv=ITEMS.seed_pumpkin.lv=1;
  const ensureInv=()=>{for(const k of CROPKEYS){if(!(P.inv['seed_'+k]>=0))P.inv['seed_'+k]=0;if(!(P.inv['crop_'+k]>=0))P.inv['crop_'+k]=0}};
  ensureInv();
  const _ld=load;load=function(){const r=_ld();ensureInv();if(!(S.sel>=0&&S.sel<SEEDS.length))S.sel=0;return r};

  const lvOf=i=>LV[CROPKEYS[i]]||1;
  const order=SEEDS.map((_,i)=>i).sort((a,b)=>lvOf(a)-lvOf(b)||a-b);       // เรียงตามเลเวล (เสถียร)
  const open=()=>order.filter(i=>P.lv>=lvOf(i));
  window.CROPDATA={LV,order,lvOf,NEW};

  /* ---------- สถิติ + ล็อกเลเวลตอนปลูก ---------- */
  const _pa=plotAct;
  plotAct=function(pl,x,y){
    if(pl.state===1){
      const i=S.sel,c=CROPKEYS[i];
      if(P.lv<lvOf(i)){toast('ยังปลูก'+CROPS[c].name+'ไม่ได้ — ต้อง Lv.'+lvOf(i),1600);SFX.err();return}
      const had=P.inv[SEEDS[i]]>0;_pa(pl,x,y);
      if(had&&pl.state===2){const s=X.stats;s.plant=(s.plant||0)+1;s['pl_'+c]=(s['pl_'+c]||0)+1}
      return}
    const hv=pl.state===2&&pl.stage>=3,c=pl.crop;_pa(pl,x,y);
    if(hv&&pl.state===1){const s=X.stats;s['hv_'+c]=(s['hv_'+c]||0)+1}
  };

  /* ---------- แถบไอเท็ม ---------- */
  function cycle(d){
    const a=open(),p=a.indexOf(S.sel);let n=a[((p<0?0:p)+d+a.length)%a.length];
    S.sel=n;SFX.click();refreshHot();toast('เลือก: '+ITEMS[SEEDS[n]].n+' ('+(P.inv[SEEDS[n]]||0)+')',900)}
  const _us=useSlot;
  useSlot=function(i){
    if(modal&&i<3)return;
    if(i===0)return cycle(-1);
    if(i===1)return openPick();
    if(i===2)return cycle(1);
    return _us(i)};
  refreshHot=function(){
    const hb=$('hotbar'),sk=SEEDS[S.sel],n=P.inv[sk]||0;
    let h=`<div class="slot arr" data-i="0"><i class="tri l"></i><u>1</u></div>`+
      `<div class="slot seedsel sel${n<=0?' empty':''}" data-i="1"><img class="px" src="${IC[sk]||''}" alt=""><u>2</u><b>${n}</b><em>Lv${lvOf(S.sel)}</em></div>`+
      `<div class="slot arr" data-i="2"><i class="tri r"></i><u>3</u></div>`;
    HOT.slice(3).forEach((k,j)=>{const m=P.inv[k]||0;h+=`<div class="slot${m<=0?' empty':''}" data-i="${j+3}"><img class="px" src="${IC[k]||''}" alt=""><u>${j+4}</u><b>${m}</b></div>`});
    hb.innerHTML=h};

  /* ---------- หน้าเลือกเมล็ด (เลื่อนได้) ---------- */
  const pk=document.createElement('div');pk.id='seedpick';pk.className='modal hidden';
  pk.innerHTML='<div class="win panel"><div class="wt"><span>เลือกเมล็ดพันธุ์</span><span id="pklv"></span><button class="mini" id="pkclose">X</button></div><div id="pklist"></div><div class="hint">แตะเมล็ดเพื่อเลือก · ตัวที่ล็อกต้องเลเวลถึงก่อน</div></div>';
  document.body.appendChild(pk);
  function renderPick(){
    $('pklv').textContent='Lv.'+P.lv;
    $('pklist').innerHTML=order.map(i=>{
      const k=SEEDS[i],it=ITEMS[k],c=CROPKEYS[i],lv=lvOf(i),lock=P.lv<lv,cd=CROPS[c];
      return `<div class="item pkrow${lock?' lock':''}${i===S.sel?' cur':''}" data-i="${i}"><img class="px" src="${IC[k]||''}" alt=""><div class="nm">${cd.name}<small>${lock?'ล็อก — ต้อง Lv.'+lv:'โต '+cd.grow+' วิ · EXP '+cd.exp+' · ขาย '+ITEMS['crop_'+c].sell+'G'}</small></div><span class="pr">${lock?'Lv.'+lv:'x'+(P.inv[k]||0)}</span></div>`}).join('')}
  function openPick(){
    if(modal||P.dead)return;modal=true;held.clear();renderPick();pk.classList.remove('hidden');SFX.click();
    const cur=$('pklist').querySelector('.cur');if(cur)cur.scrollIntoView({block:'center'})}
  function closePick(){if(pk.classList.contains('hidden'))return;pk.classList.add('hidden');modal=false}
  $('pklist').addEventListener('click',e=>{
    const r=e.target.closest('.pkrow');if(!r)return;audioInit();const i=+r.dataset.i;
    if(P.lv<lvOf(i)){toast('ต้อง Lv.'+lvOf(i)+' ถึงจะปลูก'+CROPS[CROPKEYS[i]].name+'ได้',1400);SFX.err();return}
    S.sel=i;SFX.click();closePick();refreshHot();toast('เลือก: '+ITEMS[SEEDS[i]].n,900)});
  $('pkclose').addEventListener('click',closePick);
  pk.addEventListener('pointerdown',e=>{if(e.target===pk)closePick()});
  addEventListener('keydown',e=>{if(!pk.classList.contains('hidden')&&(e.code==='Escape'||e.code==='KeyE')){closePick();e.preventDefault()}});

  /* ---------- ร้านค้า: แท็บ "ซื้อ" แสดงเมล็ดตามเลเวล (ล็อกไว้ถ้ายังไม่ถึง) ---------- */
  const _rs=renderShop;
  renderShop=function(){
    if(shopTab!=='buy')return _rs();
    const L=$('shoplist');$('shopgold').textContent=P.gold+' G';
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===shopTab));
    const row=k=>{const it=ITEMS[k],lock=it.lv&&P.lv<it.lv;
      if(lock)return `<div class="item lock"><img class="px" src="${IC[k]||''}" alt=""><div class="nm">${it.n}<small>ล็อก — ต้อง Lv.${it.lv}</small></div><span class="pr">${it.buy}G</span></div>`;
      return `<div class="item"><img class="px" src="${IC[k]||''}" alt=""><div class="nm">${it.n}<small>${it.d||'มีอยู่: '+(P.inv[k]||0)}</small></div><span class="pr">${it.buy}G</span><button class="mini" data-a="buy" data-k="${k}" data-n="1" ${P.gold<it.buy?'disabled':''}>ซื้อ</button><button class="mini" data-a="buy" data-k="${k}" data-n="5" ${P.gold<it.buy*5?'disabled':''}>x5</button></div>`};
    const un=order.filter(i=>P.lv>=lvOf(i)),lk=order.filter(i=>P.lv<lvOf(i));
    let h='<div class="qh shh">เมล็ดพันธุ์ที่ซื้อได้ (เรียงตามเลเวล)</div>'+un.map(i=>row(SEEDS[i])).join('')+
      '<div class="qh shh">ยา</div>'+['potion_hp','potion_mp'].map(row).join('');
    if(lk.length)h+='<div class="qh shh">เมล็ดที่ยังล็อก</div>'+lk.map(i=>row(SEEDS[i])).join('');
    L.innerHTML=h};
})();
