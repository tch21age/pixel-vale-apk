'use strict';
/* =====================================================================
   ART FARM (v12 Remastered): แปลงผัก · พืช 3 ชนิด × 4 ระยะ · ป้ายฟาร์ม
   - ใช้ GFX pipeline สไตล์ Classic JRPG Pixel Art (layer → shade → outline → frame)
   - ไม่แตะ Farming Logic: ใช้ plots/state/stage/crop/watered เดิม 100%
   - ช่องดิน 16x16 logic = 32x32 art px · ต้นพืชยึดจุดยืนกลางช่อง (x+8, y+15)
   - แสงเงาจากทิศบนซ้าย (Top-Left Light Source) สอดคล้องกับ Hero, Monster และ Environment
   ===================================================================== */
const FARM_PAL = {
  soil: {
    raw: ['#9c7a4e', '#8c6b43', '#7b5c39'], rawL: '#b59263', rawD: '#664a2d',
    dry: ['#734f2d', '#664424', '#7c5531'], dryRidge: '#8c643b', dryRidgeL: '#a47c4c', dryTrough: '#462c16',
    wet: ['#442d1c', '#3a2416', '#4e3421'], wetRidge: '#543b25', wetRidgeL: '#674a30', wetTrough: '#24150c',
    wetGlint: '#86bfe8', wetSpec: '#d9efff'
  },
  tuft: '#699640', tuftL: '#9ac45e', tuftD: '#467228', pebble: ['#a27a48', '#c49e68', '#735232'],
  leaf: { base: '#46963c', hi: '#82d268', lo: '#2a662e', dk: '#1a4422' },
  seed: '#dec985', seedD: '#aa924c',
  turnip: { top: '#a258d4', topL: '#d89ef4', topD: '#70339a', body: '#fbf7ff', bodyD: '#c0b0dc', root: '#dcd0f4' },
  tomato: { fruit: '#e43644', fruitL: '#ffa0a8', fruitD: '#9e1c2c', fruitSpec: '#ffffff', stake: '#9e6d3c', stakeD: '#634220' },
  pumpkin: { body: '#f59620', bodyL: '#ffbe56', bodyD: '#bc5e0a', groove: '#9e4e08', stem: '#688c34', stemD: '#3c581d' }
};

(function () {
  const P_ = FARM_PAL, cache = {};
  const hash = (a, b, c) => {
    let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  /* ---------- 1. แปลงดิน (Farmland Tiles) ---------- */
  // kind: 0 = ดินยังไม่ไถ · 1 = ไถแล้ว (แห้ง) · 2 = ไถแล้ว (เปียก) · v = 0..2 ความต่างต่อช่อง
  function soilFrame(kind, v) {
    const key = 's' + kind + '_' + v;
    if (cache[key]) return cache[key];
    const rnd = mulberry(9000 + kind * 31 + v * 7);
    const L = GFX.layer(32, 32, 0, 0), S = P_.soil;
    const px = (x, y, w, h, c) => L.px(x, y, w, h, c);

    if (kind === 0) {
      // ดินยังไม่ไถ: ผิวหน้าดินร่วน + หินกรวด + กอหญ้าเล็กน้อย
      px(0, 0, 32, 32, S.raw[v % 3]);
      for (let i = 0; i < 48; i++) {
        const x = Math.floor(rnd() * 30), y = Math.floor(rnd() * 30);
        px(x, y, 2, 1, rnd() < .5 ? S.raw[(v + 1) % 3] : S.raw[(v + 2) % 3]);
      }
      for (let i = 0; i < 9; i++) {
        const x = 1 + Math.floor(rnd() * 28), y = 1 + Math.floor(rnd() * 28);
        px(x, y, 2, 1, S.rawL);
        px(x, y + 1, 2, 1, S.rawD);
      }
      // วัชพืชและกอหญ้าธรรมชาติ
      const tuft = (x, y) => {
        px(x, y, 1, 3, P_.tuftD);
        px(x + 2, y + 1, 1, 2, P_.tuftD);
        px(x + 1, y - 1, 1, 4, P_.tuft);
        px(x + 1, y - 1, 1, 1, P_.tuftL);
      };
      tuft(4 + Math.floor(rnd() * 6), 5 + Math.floor(rnd() * 6));
      tuft(18 + Math.floor(rnd() * 8), 17 + Math.floor(rnd() * 8));
      if (rnd() < .7) tuft(8 + Math.floor(rnd() * 14), 24 + Math.floor(rnd() * 4));

      // ก้อนกรวดในดิน
      const pc = P_.pebble;
      for (let i = 0; i < 2; i++) {
        const x = 3 + Math.floor(rnd() * 24), y = 3 + Math.floor(rnd() * 24);
        px(x, y + 1, 3, 2, pc[2]);
        px(x, y, 3, 1, pc[1]);
        px(x, y, 1, 1, pc[0]);
      }
    } else {
      // ดินไถแล้ว: มีร่องไถ 3 แนว (Furrows & Ridges)
      const wet = kind === 2;
      const B = wet ? S.wet : S.dry;
      const rid = wet ? S.wetRidge : S.dryRidge;
      const ridL = wet ? S.wetRidgeL : S.dryRidgeL;
      const tr = wet ? S.wetTrough : S.dryTrough;

      px(0, 0, 32, 32, B[v % 3]);

      for (let k = 0; k < 3; k++) {
        const y = 3 + k * 10;
        px(1, y + 4, 30, 3, tr);      // ร่องลึก
        px(1, y, 30, 4, rid);         // สันดินนูน
        px(1, y, 30, 1, ridL);        // สันดินสะท้อนแสงบน
        px(1, y + 3, 30, 1, B[(v + 1) % 3]);

        // รอยดินร่วนเป็นก้อน (Soil clods)
        for (let i = 0; i < 8; i++) {
          const x = 1 + Math.floor(rnd() * 28);
          px(x, y + 1, 2, 1, B[(v + 2) % 3]);
          if (rnd() < .5) px(x + 3, y + 2, 1, 1, ridL);
        }
      }

      if (wet) {
        // ประกายน้ำขังในร่องดิน
        for (let i = 0; i < 6; i++) {
          const x = 2 + Math.floor(rnd() * 26), y = 2 + Math.floor(rnd() * 26);
          px(x, y, 2, 1, S.wetGlint);
          px(x + 1, y, 1, 1, S.wetSpec);
          px(x, y + 1, 2, 1, 'rgba(134,191,232,0.4)');
        }
      } else {
        // ฝุ่นดินแห้ง
        for (let i = 0; i < 5; i++) {
          const x = 2 + Math.floor(rnd() * 26), y = 2 + Math.floor(rnd() * 26);
          px(x, y, 1, 1, '#aa865c');
        }
      }
    }

    L.shade(1, .24, .32);
    return (cache[key] = GFX.frame(L));
  }

  /* ---------- 2. พืชและพืชผล (Crops System) ---------- */
  const CW = 40, CH_ = 46, CAX = 20, CAY = 38;
  function cropLayer() { return GFX.layer(CW, CH_, CAX, CAY); }
  function finish(L, key) {
    L.shade(1, .28, .34).outline(.74);
    return (cache[key] = GFX.frame(L));
  }

  const leaf = (L, x, y, w, h, flip) => {
    const lf = P_.leaf;
    L.ell(x, y, w, h, lf.base);
    L.px(x - w + 1, y - h, w, 1, lf.hi);
    L.px(x, y + h, Math.max(1, w - 1), 1, lf.lo);
    L.px(flip ? x + w - 2 : x - w + 1, y, w, 1, lf.lo);
  };

  // กองดินโคนต้น
  function mound(L, seedOnly) {
    L.ell(0, -1, 8, 3, '#6e4c2c');
    L.ell(0, -2, 6, 2, '#855c36');
    L.px(-3, -4, 5, 1, '#9e7244');
    if (seedOnly) {
      // เมล็ดพันธุ์ฝังในดิน
      L.px(-1, -4, 3, 2, P_.seed);
      L.px(-1, -4, 1, 1, '#fff6d4');
      L.px(1, -3, 1, 1, P_.seedD);
    }
  }

  // ระยะ 1: ต้นอ่อน (Sprout)
  function sprout(L) {
    const lf = P_.leaf;
    // ก้านลำต้น
    L.px(-1, -9, 2, 9, lf.lo);
    L.px(0, -9, 1, 9, lf.base);
    // ใบเลี้ยงคู่ซ้าย-ขวา
    L.ell(-4, -10, 3, 2, lf.base);
    L.px(-6, -12, 3, 1, lf.hi);
    L.ell(4, -12, 3, 2, lf.base);
    L.px(2, -14, 3, 1, lf.hi);
    // ยอดอ่อนตรงกลาง
    L.px(0, -13, 1, 3, lf.hi);
  }

  // ระยะ 2: กำลังเจริญเติบโต (Growing)
  function growing(L, crop) {
    const lf = P_.leaf;
    if (crop === 'tomato') {
      // มะเขือเทศ: หลักไม้ค้ำ + เถาและใบ + ดอกเหลืองเล็กๆ
      L.px(5, -27, 2, 27, P_.tomato.stake);
      L.px(5, -27, 1, 27, '#c89558');
      L.px(-1, -25, 2, 25, lf.lo);
      L.px(0, -25, 1, 25, lf.base);
      leaf(L, -6, -8, 5, 3);
      leaf(L, 6, -13, 5, 3, true);
      leaf(L, -6, -17, 5, 3);
      leaf(L, 5, -21, 4, 3, true);
      leaf(L, -2, -26, 4, 3);
      // เชือกมัดกิ่งกับเสา
      L.px(4, -15, 2, 1, '#d8b080');
      L.px(4, -22, 2, 1, '#d8b080');
      // ดอกสีเหลืองเตรียมติดผล
      L.px(-2, -12, 2, 2, '#fff176');
      L.px(3, -18, 2, 2, '#fff176');
    } else if (crop === 'pumpkin') {
      // ฟักทอง: ใบกว้างคลุมดิน + เถาเลื้อย
      L.px(-1, -11, 2, 11, lf.lo);
      L.px(0, -11, 1, 11, lf.base);
      leaf(L, -9, -7, 8, 4);
      leaf(L, 10, -6, 8, 4, true);
      leaf(L, 0, -16, 8, 5);
      leaf(L, -11, -13, 5, 3);
      // เถาวัลย์ม้วนขด
      L.line(7, -4, 14, -9, P_.pumpkin.stem, 1);
      L.px(14, -10, 2, 2, P_.pumpkin.stem);
      L.px(15, -8, 1, 2, P_.pumpkin.stemD);
    } else {
      // หัวผักกาด: กอใบผักกาดกว้าง
      L.px(-1, -15, 2, 15, lf.lo);
      L.px(0, -15, 1, 15, lf.base);
      leaf(L, -8, -13, 6, 3);
      leaf(L, 8, -13, 6, 3, true);
      leaf(L, -5, -19, 5, 4);
      leaf(L, 5, -20, 5, 4, true);
      leaf(L, 0, -25, 4, 5);
      L.px(-13, -14, 2, 1, lf.hi);
      L.px(11, -14, 2, 1, lf.hi);
      L.px(-1, -29, 1, 3, lf.hi);
    }
  }

  // ระยะ 3: สุกพร้อมเก็บเกี่ยว (Harvest-Ready)
  function ripe(L, crop) {
    const lf = P_.leaf;
    if (crop === 'turnip') {
      const T = P_.turnip;
      // พุ่มใบตั้งชันเขียวชอุ่ม
      L.px(-8, -28, 4, 11, lf.lo);
      L.px(-7, -31, 3, 4, lf.base);
      L.px(-8, -32, 2, 2, lf.hi);
      L.px(-1, -32, 4, 15, lf.base);
      L.px(-1, -34, 3, 3, lf.hi);
      L.px(2, -31, 1, 14, lf.lo);
      L.px(5, -28, 4, 11, lf.lo);
      L.px(5, -31, 3, 4, lf.base);
      L.px(7, -32, 2, 2, lf.hi);
      L.px(-10, -25, 3, 6, lf.base);
      L.px(9, -25, 3, 6, lf.base);

      // หัวผักกาดโผล่พ้นดิน (บนม่วง ล่างขาวนวล มีรากหาง)
      L.ell(0, -9, 11, 9, T.body);
      L.ell(0, -14, 11, 5, T.top);
      L.px(-7, -18, 7, 2, T.topL);
      L.px(-10, -13, 2, 3, T.topL);
      L.px(0, -12, 11, 2, T.topD);
      L.px(-9, -7, 6, 3, '#ffffff');
      L.px(6, -4, 5, 3, T.bodyD);
      L.px(-6, -1, 12, 1, T.bodyD);
      // รากแก้วโคนหัว
      L.px(-1, 1, 3, 3, T.root);
      L.px(0, 4, 1, 3, T.root);
    } else if (crop === 'tomato') {
      const T = P_.tomato;
      // เสาค้ำไม้
      L.px(5, -35, 2, 35, T.stake);
      L.px(5, -35, 1, 35, '#c89558');
      L.px(5, -35, 1, 1, '#e6b880');
      // พุ่มใบหนาแน่น
      L.ell(0, -19, 12, 14, lf.lo);
      L.ell(-1, -21, 11, 12, lf.base);
      L.px(-10, -28, 8, 2, lf.hi);
      L.px(1, -32, 8, 2, lf.hi);
      L.px(-4, -23, 7, 1, lf.hi);

      // ผลมะเขือเทศสุกแดงแวววาว 6 ผล
      const tom = (x, y, s) => {
        L.ell(x, y, s, s, T.fruit);
        L.px(x - s + 1, y - s + 1, 2, 2, T.fruitL);
        L.px(x - s + 1, y - s + 1, 1, 1, T.fruitSpec); // จุดเงาประกาย
        L.px(x + s - 2, y + s - 1, 2, 1, T.fruitD);
        L.px(x - s + 2, y + s - 1, s * 2 - 3, 1, T.fruitD);
        L.px(x - 1, y - s, 3, 1, lf.lo); // ขั้วผล
      };
      tom(-7, -13, 4);
      tom(6, -18, 4);
      tom(-3, -7, 3);
      tom(8, -9, 3);
      tom(-6, -24, 3);
      tom(2, -14, 3);
    } else {
      const T = P_.pumpkin;
      // ใบและเถาโคนฟักทอง
      L.px(-13, -23, 6, 2, lf.lo);
      leaf(L, -13, -9, 7, 4);
      leaf(L, 13, -7, 6, 4, true);
      L.line(10, -11, 17, -17, T.stem, 1);

      // ฟักทองยักษ์ 3 กลีบโค้ง
      L.ell(0, -10, 16, 11, T.body);
      L.ell(-9, -10, 9, 11, T.body);
      L.ell(9, -10, 9, 11, T.body);
      L.px(-17, -8, 5, 3, T.bodyD);
      L.px(12, -8, 5, 3, T.bodyD);

      // ร่องลึกของผิวฟักทอง
      L.px(-1, -21, 2, 21, T.groove);
      L.px(-10, -19, 2, 17, T.groove);
      L.px(8, -19, 2, 17, T.groove);

      // สันไฮไลต์ผิวส้มสด
      L.px(-15, -15, 5, 2, T.bodyL);
      L.px(-7, -19, 5, 2, T.bodyL);
      L.px(2, -19, 5, 2, T.bodyL);
      L.px(-13, -17, 2, 3, T.bodyL);
      L.px(-13, -1, 26, 1, T.bodyD);
      L.px(-9, 0, 18, 1, '#944406');

      // ขั้วฟักทองบิดเกลียว
      L.px(-2, -25, 4, 6, T.stem);
      L.px(-3, -25, 2, 6, T.stemD);
      L.px(1, -27, 4, 3, T.stem);
      L.px(3, -29, 2, 2, T.stem);
    }
  }

  function cropFrame(crop, stage) {
    const key = 'c' + crop + stage;
    if (cache[key]) return cache[key];
    const L = cropLayer();
    if (stage === 0) mound(L, true);
    else if (stage === 1) { mound(L, false); sprout(L); }
    else if (stage === 2) { mound(L, false); growing(L, crop); }
    else { mound(L, false); ripe(L, crop); }
    return finish(L, key);
  }

  /* ---------- 3. ป้ายไม้ฟาร์ม (Farm Sign Object) ---------- */
  function signFrame() {
    if (cache.sign) return cache.sign;
    const L = GFX.layer(44, 56, 22, 50);
    const W = ['#c89558', '#a8743f', '#7a5230', '#5e3b20'];

    // เสาไม้ปักดิน
    L.px(-2, -30, 5, 30, W[2]);
    L.px(-2, -30, 1, 30, W[1]);
    L.px(2, -30, 1, 30, W[3]);

    // โคนเสาและหญ้ารอบโคน
    L.ell(0, 0, 7, 2, '#7a5a38');
    L.px(-6, -3, 2, 3, '#5b8a3c');
    L.px(-5, -5, 1, 3, '#7ab050');
    L.px(5, -2, 2, 2, '#5b8a3c');
    L.px(4, -4, 1, 3, '#7ab050');

    // แผ่นกระดานป้ายบอกทาง (ปลายลูกศรชี้ขวา)
    L.px(-15, -44, 29, 16, W[1]);
    L.px(-15, -44, 29, 1, W[0]);
    L.px(-15, -37, 29, 1, W[3]);
    L.px(-15, -29, 29, 1, W[3]);
    L.px(14, -42, 2, 12, W[1]);
    L.px(16, -40, 2, 8, W[1]);
    L.px(18, -38, 2, 4, W[1]);
    L.px(14, -43, 2, 1, W[0]);
    L.px(-15, -43, 1, 14, W[0]);

    // ตะปูตอก 4 มุม
    L.px(-13, -42, 1, 1, '#3a2616');
    L.px(-13, -31, 1, 1, '#3a2616');
    L.px(11, -42, 1, 1, '#3a2616');
    L.px(11, -31, 1, 1, '#3a2616');

    // ลายแกะสลักสัญลักษณ์โบราณ
    const ink = '#f1e9d2', inkD = '#d6c8a0';
    L.px(-10, -41, 6, 2, ink);
    L.px(-10, -41, 2, 6, ink);
    L.px(-10, -36, 6, 1, ink);
    L.px(-6, -39, 1, 4, ink);
    L.px(-2, -41, 1, 7, ink);
    L.px(-2, -41, 4, 1, ink);
    L.px(1, -41, 1, 3, ink);
    L.px(-2, -38, 4, 1, ink);
    L.px(5, -41, 5, 1, ink);
    L.px(5, -38, 5, 1, ink);
    L.px(5, -35, 5, 1, ink);
    L.px(5, -41, 1, 7, ink);
    L.px(-10, -34, 19, 1, inkD);

    // ลวดลายเสี้ยนไม้
    L.px(-8, -33, 5, 1, W[2]);
    L.px(3, -43, 6, 1, W[2]);

    L.shade(1, .28, .34).outline(.72);
    return (cache.sign = GFX.frame(L));
  }

  /* ---------- 4. Hooks: drawPlots & drawCrop ---------- */
  window.drawCrop = drawCrop = function (x, y, p) {
    const f = cropFrame(p.crop || 'turnip', p.stage);
    // เงาสัมผัสพื้นดินใต้พืช
    const shRadius = p.stage >= 3 && p.crop === 'pumpkin' ? 14 : (p.stage >= 2 ? 10 : 7);
    GFX.drawShadow(ctx, x + 8, y + 14, shRadius, 3);
    GFX.draw(ctx, f, x + 8, y + 15, false, null);

    // ประกายระยิบระยับของพืชพร้อมเก็บเกี่ยว (Harvest Sparkle Star)
    if (p.stage === 3 && typeof S !== 'undefined' && Math.floor(S.t * 3.5) % 2 === 0) {
      const sx = Math.round((x + 12) * RS);
      const sy = Math.round((y + 3) * RS);
      GFX.ar(ctx, sx, sy - 2, 1, 5, '#fff176');
      GFX.ar(ctx, sx - 2, sy, 5, 1, '#fff176');
      GFX.ar(ctx, sx - 1, sy - 1, 3, 3, '#fff9c4');
      GFX.ar(ctx, sx, sy, 1, 1, '#ffffff');
    }
  };

  window.drawPlots = drawPlots = function () {
    for (const k in plots) {
      const p = plots[k];
      const c = k.indexOf(',');
      const tx = +k.slice(0, c), ty = +k.slice(c + 1);
      const x = tx * T, y = ty * T;
      const wet = p.state === 2 && p.watered && p.stage < 3;
      const kind = p.state === 0 ? 0 : (wet ? 2 : 1);
      const v = Math.floor(hash(tx, ty, kind) * 3);

      GFX.draw(ctx, soilFrame(kind, v), x, y, false, null);
      if (p.state === 2) drawCrop(x, y, p);
    }
  };

  /* ---------- 5. Hook: drawObj (Signboard) ---------- */
  const _do = drawObj;
  window.drawObj = drawObj = function (o) {
    if (o.k === 'sign') {
      const cx = o.x + 8;
      if (typeof envShadow === 'function') envShadow(ctx, cx, o.b - 1, 11, 4);
      else GFX.drawShadow(ctx, cx, o.b - 1, 11, 4);
      GFX.draw(ctx, signFrame(), cx, o.b, false, null);
      return;
    }
    return _do(o);
  };

  /* Public API Exposure */
  window.FARM_PAL = FARM_PAL;
  window.FARM_ART = { soilFrame, cropFrame, signFrame };

  // Bake สไปรต์ล่วงหน้าใน Idle Queue
  setTimeout(() => {
    for (let k = 0; k < 3; k++) {
      for (let v = 0; v < 3; v++) GFX.later(() => GFX.touch(soilFrame(k, v)));
    }
    for (const c of ['turnip', 'tomato', 'pumpkin']) {
      for (let s = 0; s < 4; s++) GFX.later(() => GFX.touch(cropFrame(c, s)));
    }
    GFX.later(() => GFX.touch(signFrame()));
  }, 80);
})();
