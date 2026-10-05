'use strict';
/* =====================================================================
   ART ICONS (v11): ไอคอนไอเท็ม/สกิล 12x12 วาดใหม่
   - วาดลายในกรอบ 10x10 แล้ว GFX shade (3 โทน) + outline เป็นสีเข้มของสีข้างเคียง → bake ลงรูปจริง
     จึงไม่ต้องพึ่ง CSS drop-shadow หลายชั้น (ui2.css v11 ปิด filter ของไอคอนแล้ว)
   - ปุ่ม b_* (16x16) ถูกอ่านกลับมา bake ขอบเดียวกัน แล้วใส่รูปกลับอัตโนมัติ
   - ใช้ชื่อคีย์ IC เดิมทั้งหมด → ร้านค้า/แถบไอเท็ม/ปุ่มสกิลไม่ต้องแก้
   ===================================================================== */
(function(){
  const C={w:'#ffffff',W:'#f3ead0',V:'#c8bb94',
    g:'#5cb050',G:'#2e6b34',h:'#9be07a',
    r:'#e0414f',R:'#a02535',q:'#ff9aa4',
    o:'#f59a2a',O:'#c06a12',a:'#ffc767',
    y:'#ffd23f',Y:'#c99a1a',u:'#fff2a0',
    b:'#4fb0e8',B:'#2b72b0',c:'#bfeaff',
    p:'#9a5fd0',P:'#6a3a9a',l:'#d9b4f4',
    n:'#8a5a34',N:'#5e3b20',m:'#b8824c',
    s:'#d8e0ea',S:'#8c94a4',t:'#5a6070',k:'#1a1220'};
  const mixc=GFX.mix;

  // rows: สตริงไม่เกิน 10 ตัว · extra: ตัวอักษรเฉพาะไอคอน · วางกึ่งกลางกรอบ 12x12
  function mk(rows,extra){
    const pal=Object.assign({},C,extra||{}),L=GFX.layer(12,12,0,0);
    const h=rows.length,w=Math.max.apply(null,rows.map(s=>s.length));
    L.grid(rows,pal,Math.floor((12-w)/2),Math.floor((12-h)/2)+(h>=9?0:0));
    L.shade(1,.24,.30).outline(.74);
    return L.c.toDataURL();
  }
  const X=(c)=>({X:c,x:mixc(c,'#2a1a4a',.38),q:mixc(c,'#fff3c4',.5)});

  const seed=c=>mk([
    '.WWWWWWWW.','.WVVVVVVW.','.WXXXXXXW.','.WXxXXxXW.','.WXXXXXXW.','.WWWWWWWW.','.WWWhWWWW.','.WWhGhWWW.','.WWWhGWWW.','.WWWWWWWW.'],X(c));
  const potion=c=>mk([
    '....mm....','....nn....','...sSSs...','...sXXs...','..sXXXXs..','.sXqXXXXs.','.sXqXXXxs.','.sXXXXXxs.','..sXXXxs..','...ssss...'],X(c));
  const fish=c=>mk([
    '...xxx....','.XXXXXXX.x','XXwkXXXXxx','XqXXXXXXxx','.xXXXXXXxx','...xxxx...'],Object.assign(X(c),{q:mixc(c,'#ffffff',.55)}));

  const ICONS={
    seed_turnip:()=>seed('#9a5fd0'),seed_tomato:()=>seed('#e0414f'),seed_pumpkin:()=>seed('#f59a2a'),
    potion_hp:()=>potion('#e0414f'),potion_mp:()=>potion('#3f8cff'),
    crop_turnip:()=>mk(['..g.gg.g..','..gGggGg..','...gGGg...','..pppppp..','.pplpppPP.','.wwwwwwwV.','.wwwwwwwV.','..wwwwwV..','...wwwV...','....wV....']),
    crop_tomato:()=>mk(['....gg....','..gGggGg..','...gGGg...','..rrrrrr..','.rqqrrrrR.','.rqrrrrrR.','.rrrrrrrR.','.rrrrrrRR.','..rRrRRR..','...RRRR...']),
    crop_pumpkin:()=>mk(['.....nN...','....nNgg..','.aaooOooO.','aaooOooOOO','aooOooOooO','aooOooOooO','aooOooOooO','.oooOooOOO','..ooOooOO.','...OOOOO..']),
    jelly:()=>mk(['...bbbb...','..bcbbbbB.','.bcwbbbbbB','.bcbbbbbbB','.bbbbBbbBB','.bbbbbbBBB','..BBBBBBB.']),
    fang:()=>mk(['.wwwwww...','.wWwwwwV..','..wwwwwV..','..wwwwV...','...wwwV...','...wwV....','....wV....','....V.....']),
    coin:()=>mk(['...yyyy...','..yuuyyY..','.yuyYYyyY.','.yuyYyyyY.','.yyyYyyyY.','.yyyYYyyY.','..yyyyYY..','...YYYY...']),
    pelt:()=>mk(['.s.ssss...','sSSsSSSSs.','sSSSSSSSSs','.SSStSSSSs','.SSSttSSS.','sSSSSSSSSs','.SSSSSSSs.','..sS.SSs..']),
    tusk:()=>mk(['......WWW.','....WWwwWV','..WWwWWVV.','.WWwWVV...','.WWWVV....','.WWV......','..V.......']),
    wing:()=>mk(['.P........','.PP...PP..','.pPP.PppP.','.ppPPPpppP','.pppPpppP.','.ppplpppp.','..pP.pP.p.']),
    bone:()=>mk(['.......ww.','......wwwV','.....wwwV.','....wwwV..','...wwwV...','..wwwV....','wwwwV.....','.wwV......']),
    crystal:()=>mk(['...cwcc...','..cwccbb..','.cwccbbbB.','.ccbbbbBB.','..cbbbBB..','...bbBB...','....BB....']),
    fish_a:()=>fish('#8fb0c8'),fish_b:()=>fish('#e08a5a'),fish_c:()=>fish('#ffd23f'),
    egg:()=>mk(['...wwww...','..wwwwwV..','.wwwwwwwV.','.wWwwwwwV.','.wwwwwwWV.','..wwwwWV..','...VVVV...']),
    sk_dash:()=>mk(['.....B....','.....bB...','bbbbbbbB..','bBBBBBbbB.','bbbbbbbB..','.....bB...','.....B....']),
    sk_ice:()=>mk(['....cc....','...cwwc...','.c.cwwc.c.','..cwbbwc..','cccwbbwccc','..cwbbwc..','.c.cwwc.c.','...cwwc...','....cc....']),
    sk_heal:()=>mk(['.RRR..RRR.','RqqrRRrrrR','RqrrrrrrrR','RrrrrrrrrR','.RrrrrrrR.','..RrrrrR..','...RrrR...','....RR....']),
    sk_bolt:()=>mk(['.....yyyy.','....yuyy..','...yuyy...','..yyyyyyy.','....yyyy..','...yyy....','...yy.....','..yy......','..y.......'])
  };
  ICONS.milk=()=>mk(['...SS.....','...ww.....','..wwww....','.wwwwwV...','.wwwwwV...','.bbbbbb...','.bbbbbB...','.wwwwwV...','..VVVV....']);

  /* bake ขอบให้ปุ่ม 16x16 (b_*) เดิม: อ่านรูปที่วาดไว้แล้ว → outline → ใส่กลับ */
  function bakeButton(name,done){
    const src=IC[name];if(!src)return;
    const im=new Image();
    im.onload=()=>{
      const L=GFX.layer(im.width,im.height,0,0);L.g.drawImage(im,0,0);
      L.outline(.74);IC[name]=L.c.toDataURL();done&&done(name);
    };
    im.src=src;
  }

  function refresh(){
    try{
      if(window.$&&$('coinimg'))$('coinimg').src=IC.coin;
      if(typeof setCls==='function')setCls();
      for(const k of ['attack','fire','spin','act']){const e=$('b_'+k);if(e&&IC['b_'+k]){const i=e.querySelector('img');if(i&&k!=='fire'&&k!=='spin')i.src=IC['b_'+k]}}
      if(typeof refreshHot==='function')refreshHot();
    }catch(e){}
  }

  const names=Object.keys(ICONS);
  names.forEach(k=>{try{IC[k]=ICONS[k]()}catch(e){console.warn('icon',k,e)}});
  refresh();
  // ปุ่มสกิลตัวเต็ม 16x16: bake ขอบ แล้วใส่กลับ (async เพราะต้องโหลดรูป)
  let left=4;
  ['b_attack','b_fire','b_spin','b_act'].forEach(n=>bakeButton(n,()=>{if(--left===0)refresh()}));
  window.ICON_ART={names,make:mk};
})();
