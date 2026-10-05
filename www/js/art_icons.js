'use strict';
/* =====================================================================
   ART ICONS (v12 Remastered): ไอคอนไอเท็ม/สกิล 12x12 สไตล์ Pixel RPG
   - ปรับ Silhouette คมชัด, แสงตกกระทบจากทิศบนซ้าย (Top-Left Lighting)
   - วาดในกรอบ 10x10 กึ่งกลาง 12x12 พร้อม GFX shade และ outline
   - รักษา Palette API, ฟังก์ชัน make, และชื่อคีย์ใน IC เดิม 100%
   - ทำงานร่วมกับ art_crops.js, art_farm.js, และระบบ Inventory/Shop สมบูรณ์แบบ
   ===================================================================== */
(function () {
  const C = {
    w: '#ffffff', W: '#f4ede0', V: '#c5b796',
    g: '#4fa844', G: '#28622c', h: '#8ee06a',
    r: '#dc3444', R: '#941e2a', q: '#ff8a96',
    o: '#f59220', O: '#b8580c', a: '#ffc25c',
    y: '#fcc828', Y: '#be8c12', u: '#fff49c',
    b: '#38a4e8', B: '#20629e', c: '#b5e4ff',
    p: '#9656cc', P: '#623094', l: '#d8b0f4',
    n: '#82522c', N: '#543218', m: '#b47c44',
    s: '#d2dbe6', S: '#7e8898', t: '#4e5564', k: '#16101c'
  };

  const mixc = GFX.mix;

  // rows: สตริงไม่เกิน 10 ตัว · extra: ตัวอักษรเฉพาะไอคอน · วางกึ่งกลางกรอบ 12x12
  function mk(rows, extra) {
    const pal = Object.assign({}, C, extra || {});
    const L = GFX.layer(12, 12, 0, 0);
    const h = rows.length;
    const w = Math.max.apply(null, rows.map(s => s.length));
    L.grid(rows, pal, Math.floor((12 - w) / 2), Math.floor((12 - h) / 2));
    L.shade(1, .24, .30).outline(.75);
    return L.c.toDataURL();
  }

  const X = c => ({
    X: c,
    x: mixc(c, '#2a1a4a', .38),
    q: mixc(c, '#fff3c4', .5)
  });

  /* ---------- แม่แบบไอคอนซองเมล็ด, โพชั่น, และปลา ---------- */
  const seed = c => mk([
    '.WWWWWWWW.',
    '.WVVVVVVW.',
    '.WXXXXXXW.',
    '.WXxZZxXW.',
    '.WXXXXXXW.',
    '.WWWWWWWW.',
    '.WWWhWWWW.',
    '.WWhGhWWW.',
    '.WWWhGWWW.',
    '.WWWWWWWW.'
  ], Object.assign(X(c), { Z: mixc(c, '#ffffff', .35) }));

  const potion = c => mk([
    '....mm....',
    '....NN....',
    '...sSSs...',
    '...sXXs...',
    '..sXXXXs..',
    '.sXqXXXXs.',
    '.sXqXXXxs.',
    '.sXXXXXxs.',
    '..sXXXxs..',
    '...ssss...'
  ], X(c));

  const fish = c => mk([
    '...xxx....',
    '.XXXXXXX.x',
    'XXwkXXXXxx',
    'XqXXXXXXxx',
    '.xXXXXXXxx',
    '...xxxx...'
  ], Object.assign(X(c), { q: mixc(c, '#ffffff', .65) }));

  /* ---------- ตารางไอคอนระบบหลัก ---------- */
  const ICONS = {
    // 1. ซองเมล็ดพืช
    seed_turnip:  () => seed('#9656cc'),
    seed_tomato:  () => seed('#dc3444'),
    seed_pumpkin: () => seed('#f59220'),

    // 2. น้ำยาฟื้นฟู (Potions)
    potion_hp: () => potion('#dc3444'),
    potion_mp: () => potion('#3884f8'),

    // 3. ผลผลิตฟาร์ม (Crops)
    crop_turnip: () => mk([
      '..g.gg.g..',
      '..gGggGg..',
      '...gGGg...',
      '..pppppp..',
      '.pplpppPP.',
      '.wwwwwwwV.',
      '.wwwwwwwV.',
      '..wwwwwV..',
      '...wwwV...',
      '....wV....'
    ]),

    crop_tomato: () => mk([
      '....gg....',
      '..gGggGg..',
      '...gGGg...',
      '..rrrrrr..',
      '.rqqrrrrR.',
      '.rqrrrrrR.',
      '.rrrrrrrR.',
      '.rrrrrrRR.',
      '..rRrRRR..',
      '...RRRR...'
    ]),

    crop_pumpkin: () => mk([
      '.....nN...',
      '....nNgg..',
      '.aaooOooO.',
      'aaooOooOOO',
      'aooOooOooO',
      'aooOooOooO',
      'aooOooOooO',
      '.oooOooOOO',
      '..ooOooOO.',
      '...OOOOO..'
    ]),

    // 4. วัสดุมอนสเตอร์ & การล่า
    jelly: () => mk([
      '...bbbb...',
      '..bcbbbbB.',
      '.bcwbbbbbB',
      '.bcbbbbbbB',
      '.bbbbBbbBB',
      '.bbbbbbBBB',
      '..BBBBBBB.'
    ]),

    fang: () => mk([
      '.wwwwww...',
      '.wWwwwwV..',
      '..wwwwwV..',
      '..wwwwV...',
      '...wwwV...',
      '...wwV....',
      '....wV....',
      '....V.....'
    ]),

    pelt: () => mk([
      '.s.ssss...',
      'sSSsSSSSs.',
      'sSSSSSSSSs',
      '.SSStSSSSs',
      '.SSSttSSS.',
      'sSSSSSSSSs',
      '.SSSSSSSs.',
      '..sS.SSs..'
    ]),

    tusk: () => mk([
      '......WWW.',
      '....WWwwWV',
      '..WWwWWVV.',
      '.WWwWVV...',
      '.WWWVV....',
      '.WWV......',
      '..V.......'
    ]),

    wing: () => mk([
      '.P........',
      '.PP...PP..',
      '.pPP.PppP.',
      '.ppPPPpppP',
      '.pppPpppP.',
      '.ppplpppp.',
      '..pP.pP.p.'
    ]),

    bone: () => mk([
      '.......ww.',
      '......wwwV',
      '.....wwwV.',
      '....wwwV..',
      '...wwwV...',
      '..wwwV....',
      'wwwwV.....',
      '.wwV......'
    ]),

    crystal: () => mk([
      '...cwcc...',
      '..cwccbb..',
      '.cwccbbbB.',
      '.ccbbbbBB.',
      '..cbbbBB..',
      '...bbBB...',
      '....BB....'
    ]),

    // 5. เหรียญทอง (Coin)
    coin: () => mk([
      '...yyyy...',
      '..yuuyyY..',
      '.yuyYYyyY.',
      '.yuyYyyyY.',
      '.yyyYyyyY.',
      '.yyyYYyyY.',
      '..yyyyYY..',
      '...YYYY...'
    ]),

    // 6. ปลาจากการตกปลา
    fish_a: () => fish('#82a8c8'),
    fish_b: () => fish('#e48250'),
    fish_c: () => fish('#fcc828'),

    // 7. ผลิตผลสัตว์เลี้ยง
    egg: () => mk([
      '...wwww...',
      '..wwwwwV..',
      '.wwwwwwwV.',
      '.wWwwwwwV.',
      '.wwwwwwWV.',
      '..wwwwWV..',
      '...VVVV...'
    ]),

    milk: () => mk([
      '...SS.....',
      '...ww.....',
      '..wwww....',
      '.wwwwwV...',
      '.wwwwwV...',
      '.bbbbbb...',
      '.bbbbbB...',
      '.wwwwwV...',
      '..VVVV....'
    ]),

    // 8. ไอคอนสกิล
    sk_dash: () => mk([
      '.....B....',
      '.....bB...',
      'bbbbbbbB..',
      'bBBBBBbbB.',
      'bbbbbbbB..',
      '.....bB...',
      '.....B....'
    ]),

    sk_ice: () => mk([
      '....cc....',
      '...cwwc...',
      '.c.cwwc.c.',
      '..cwbbwc..',
      'cccwbbwccc',
      '..cwbbwc..',
      '.c.cwwc.c.',
      '...cwwc...',
      '....cc....'
    ]),

    sk_heal: () => mk([
      '.RRR..RRR.',
      'RqqrRRrrrR',
      'RqrrrrrrrR',
      'RrrrrrrrrR',
      '.RrrrrrrR.',
      '..RrrrrR..',
      '...RrrR...',
      '....RR....'
    ]),

    sk_bolt: () => mk([
      '.....yyyy.',
      '....yuyy..',
      '...yuyy...',
      '..yyyyyyy.',
      '....yyyy..',
      '...yyy....',
      '...yy.....',
      '..yy......',
      '..y.......'
    ])
  };

  /* bake ขอบให้ปุ่ม 16x16 (b_*) เดิม: อ่านรูปที่วาดไว้แล้ว → outline → ใส่กลับ */
  function bakeButton(name, done) {
    const src = IC[name];
    if (!src) return;
    const im = new Image();
    im.onload = () => {
      const L = GFX.layer(im.width, im.height, 0, 0);
      L.g.drawImage(im, 0, 0);
      L.outline(.75);
      IC[name] = L.c.toDataURL();
      done && done(name);
    };
    im.src = src;
  }

  function refresh() {
    try {
      if (window.$ && $('coinimg')) $('coinimg').src = IC.coin;
      if (typeof setCls === 'function') setCls();
      for (const k of ['attack', 'fire', 'spin', 'act']) {
        const e = $('b_' + k);
        if (e && IC['b_' + k]) {
          const i = e.querySelector('img');
          if (i && k !== 'fire' && k !== 'spin') i.src = IC['b_' + k];
        }
      }
      if (typeof refreshHot === 'function') refreshHot();
    } catch (e) {}
  }

  // สร้างไอคอนหลักทั้งหมด
  const names = Object.keys(ICONS);
  names.forEach(k => {
    try {
      IC[k] = ICONS[k]();
    } catch (e) {
      console.warn('icon', k, e);
    }
  });

  refresh();

  // ปุ่มสกิลตัวเต็ม 16x16: bake ขอบ แล้วใส่กลับ
  let left = 4;
  ['b_attack', 'b_fire', 'b_spin', 'b_act'].forEach(n => bakeButton(n, () => {
    if (--left === 0) refresh();
  }));

  /* Public API Exposure */
  window.ICON_ART = { names, make: mk };
})();
