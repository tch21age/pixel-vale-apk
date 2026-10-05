'use strict';
/* =====================================================================
   ART CROPS (v15 Remastered): ภาพพืช 20 ชนิด × 4 ระยะ + ไอคอน 12x12
   - ใช้ GFX pipeline สไตล์ Classic JRPG Pixel Art (layer 40x46 จุดยืน (20,38) → shade → outline)
   - 9 สัณฐานวิทยา (root, head, stalk, bush, melon, berry, trellis, crown, tree)
   - แสงส่องจากทิศบนซ้าย (Top-Left Lighting) สอดรับกับ Hero, Monster, Environment และ Farm
   - รักษา Farming Logic, Growth Stages, CFG, IC_ และ drawCrop เดิม 100%
   ===================================================================== */
(function () {
  const mix = GFX.mix, cache = {};

  const LC = {
    g:  { base: '#438f3a', hi: '#7ece64', lo: '#275e2c', dk: '#17401c' },
    lt: { base: '#6eb84b', hi: '#a8e67a', lo: '#417e30', dk: '#28581e' },
    dk: { base: '#317336', hi: '#5ea654', lo: '#1d4d24', dk: '#103318' }
  };

  const WOOD = { b: '#9c6a38', l: '#c49052', d: '#633f1f', h: '#dec085' };

  const CFG = {
    daikon:      { a: 'root', shape: 'daikon', leaf: 'g',  body: '#f4f0e4', bodyL: '#ffffff', bodyD: '#c8c0a8', top: '#9fd070', seed: '#e8e0c0' },
    lettuce:     { a: 'head', kind: 'frill',  leaf: 'lt', head: '#8fd45a', pale: '#d0f69a', seed: '#d6bf80' },
    carrot:      { a: 'root', shape: 'carrot', leaf: 'dk', body: '#f2862a', bodyL: '#ffb868', bodyD: '#b8561a', top: '#e07020' },
    corn:        { a: 'stalk', leaf: 'lt' },
    eggplant:    { a: 'bush', fruit: 'egg',   leaf: 'dk', c: '#7a3fa8', cL: '#b078d8', cD: '#4a2470' },
    chili:       { a: 'bush', fruit: 'pod',   leaf: 'g',  c: '#e02a2a', cL: '#ff8a7a', cD: '#9a1a20' },
    cabbage:     { a: 'head', kind: 'ball',   leaf: 'g',  head: '#a8dc7a', pale: '#e0f8c0' },
    shallot:     { a: 'root', shape: 'bulb',  leaf: 'g',  body: '#b8507a', bodyL: '#e890b0', bodyD: '#80305a' },
    potato:      { a: 'root', shape: 'lumpy', leaf: 'dk', body: '#c9a068', bodyL: '#e8c890', bodyD: '#8a6a3a' },
    sweetpotato: { a: 'root', shape: 'sweet', leaf: 'lt', body: '#b0507a', bodyL: '#e088b0', bodyD: '#7a3058' },
    cucumber:    { a: 'trellis', fruit: 'cuke', leaf: 'g' },
    watermelon:  { a: 'melon', leaf: 'g', wide: 1 },
    strawberry:  { a: 'berry', leaf: 'dk' },
    grape:       { a: 'trellis', fruit: 'grape', leaf: 'dk', c: '#7a3a9a', cL: '#c08ae0' },
    pineapple:   { a: 'crown', leaf: 'lt', wide: 1 },
    mango:       { a: 'tree', fruit: 'mango', leaf: 'g', wide: 1 },
    dragonfruit: { a: 'tree', fruit: 'dragon', leaf: 'g', wide: 1 },
    durian:      { a: 'tree', fruit: 'durian', leaf: 'dk', wide: 1 },
    ginseng:     { a: 'root', shape: 'ginseng', leaf: 'dk', body: '#e8d2a0', bodyL: '#fff0c8', bodyD: '#a8844a' },
    goldapple:   { a: 'tree', fruit: 'gold', leaf: 'lt', wide: 1 }
  };

  /* ---------- Visual Primitives & Helpers ---------- */
  const lfx = (L, x, y, w, h, c) => {
    L.ell(x, y, w, h, c.base);
    L.px(x - w + 1, y - h, w, 1, c.hi);
    L.px(x, y + h, Math.max(1, w - 1), 1, c.lo);
  };

  const stem = (L, x, y, h, c) => {
    L.px(x - 1, y - h, 2, h, c.lo);
    L.px(x, y - h, 1, h, c.base);
  };

  function fan(L, c, y0, n) {
    stem(L, 0, y0, n, c);
    const k = a => y0 - Math.round(n * a);
    lfx(L, -6, k(.55), 5, 3, c);
    lfx(L, 6, k(.55), 5, 3, c);
    lfx(L, -3, k(.85), 4, 4, c);
    lfx(L, 4, k(.9), 4, 4, c);
    lfx(L, 0, y0 - n, 3, 5, c);
    L.px(-11, k(.55) + 1, 2, 1, c.hi);
    L.px(9, k(.55) + 1, 2, 1, c.hi);
  }

  function mound(L, seed, col) {
    L.ell(0, -1, 8, 3, '#6e4c2c');
    L.ell(0, -2, 6, 2, '#855c36');
    L.px(-3, -4, 5, 1, '#9e7244');
    if (seed) {
      L.px(-1, -4, 3, 2, col || '#d6bf80');
      L.px(-1, -4, 1, 1, mix(col || '#d6bf80', '#ffffff', .6));
      L.px(1, -3, 1, 1, mix(col || '#d6bf80', '#000000', .35));
    }
  }

  function sprout(L, c) {
    stem(L, 0, 0, 9, c);
    lfx(L, -4, -10, 3, 2, c);
    L.px(-6, -12, 3, 1, c.hi);
    lfx(L, 4, -12, 3, 2, c);
    L.px(2, -14, 3, 1, c.hi);
    L.px(0, -13, 1, 3, c.hi);
  }

  /* ---------- 1) Root Crops (พืชหัวใต้ดิน) ---------- */
  function rootRipe(L, C, c) {
    const s = C.shape, B = C.body, BL = C.bodyL, BD = C.bodyD;
    if (s === 'daikon') {
      L.ell(0, -6, 5, 8, B);
      L.px(-3, -12, 2, 7, BL);
      L.px(2, -5, 2, 6, BD);
      L.px(-1, 2, 3, 2, BD);
      L.px(-5, -15, 10, 4, C.top);
      L.px(-4, -16, 5, 1, '#c8f09a');
      fan(L, c, -14, 16);
    } else if (s === 'carrot') {
      L.ell(0, -5, 6, 5, B);
      L.px(-3, 0, 7, 2, B);
      L.px(-1, 2, 3, 3, BD);
      L.px(-5, -6, 10, 1, BD);
      L.px(-3, -3, 6, 1, BD);
      L.px(-4, -8, 2, 3, BL);
      L.px(-4, -11, 9, 2, C.top);
      fan(L, c, -10, 18);
    } else if (s === 'bulb') {
      L.ell(0, -8, 8, 8, B);
      L.px(-5, -13, 3, 5, BL);
      L.px(2, -4, 4, 3, BD);
      L.px(-2, -15, 1, 12, BD);
      L.px(2, -15, 1, 12, BD);
      L.px(-1, -18, 3, 3, B);
      L.px(0, -20, 1, 2, BD);
      L.px(-3, 0, 7, 1, '#d8c8a8');
      L.px(-2, 1, 1, 2, '#d8c8a8');
      L.px(2, 1, 1, 2, '#d8c8a8');
      fan(L, c, -17, 14);
    } else if (s === 'lumpy') {
      L.ell(-7, -4, 6, 4, B);
      L.ell(6, -5, 7, 5, B);
      L.ell(0, -9, 7, 5, B);
      L.px(-9, -7, 3, 1, BL);
      L.px(4, -9, 3, 1, BL);
      L.px(-3, -12, 3, 1, BL);
      L.px(-5, -3, 1, 1, BD);
      L.px(8, -5, 1, 1, BD);
      L.px(1, -8, 1, 1, BD);
      L.px(-9, 0, 5, 1, BD);
      L.px(5, 0, 6, 1, BD);
      fan(L, c, -13, 14);
      L.px(-3, -27, 3, 3, '#ffffff');
      L.px(-2, -26, 1, 1, '#ffd23f');
      L.px(5, -24, 3, 3, '#ffffff');
    } else if (s === 'sweet') {
      L.ell(-6, -3, 8, 3, B);
      L.ell(6, -4, 7, 4, B);
      L.px(-12, -5, 5, 1, BL);
      L.px(3, -7, 5, 1, BL);
      L.px(-8, 0, 6, 1, BD);
      L.px(3, 0, 8, 1, BD);
      lfx(L, -11, -10, 5, 4, c);
      lfx(L, 11, -9, 5, 4, c);
      lfx(L, -4, -14, 5, 5, c);
      lfx(L, 5, -15, 5, 5, c);
      lfx(L, 0, -21, 4, 5, c);
      L.px(-1, -18, 2, 14, c.lo);
      L.line(-8, -8, -2, -12, c.lo, 1);
      L.line(8, -8, 2, -12, c.lo, 1);
    } else { // ginseng
      L.px(-2, -12, 5, 9, B);
      L.px(-2, -12, 1, 9, BL);
      L.px(2, -12, 1, 9, BD);
      L.line(0, -3, -5, 2, B, 2);
      L.line(1, -3, 6, 2, B, 2);
      L.ell(0, -13, 3, 2, BD);
      L.px(-1, -26, 2, 13, c.lo);
      L.px(0, -26, 1, 13, c.base);
      lfx(L, -7, -22, 4, 2, c);
      lfx(L, 7, -22, 4, 2, c);
      lfx(L, -4, -28, 3, 2, c);
      lfx(L, 4, -28, 3, 2, c);
      lfx(L, 0, -31, 3, 3, c);
      L.ell(0, -34, 2, 2, '#e0414f');
      L.ell(-3, -33, 1, 1, '#e0414f');
      L.ell(3, -33, 1, 1, '#e0414f');
      L.px(-1, -35, 1, 1, '#ffb0b0');
    }
  }

  /* ---------- 2) Head Crops (ผักกาดหอม กะหล่ำปลี) ---------- */
  function headGrow(L, C, c) {
    lfx(L, -8, -5, 7, 4, c);
    lfx(L, 8, -5, 7, 4, c);
    lfx(L, -4, -10, 6, 5, c);
    lfx(L, 4, -10, 6, 5, c);
    L.ell(0, -9, 4, 4, C.pale);
    L.px(-3, -12, 3, 1, '#ffffff');
  }

  function headRipe(L, C, c) {
    if (C.kind === 'ball') {
      lfx(L, -12, -6, 6, 5, c);
      lfx(L, 12, -6, 6, 5, c);
      lfx(L, -9, -14, 4, 4, c);
      lfx(L, 9, -14, 4, 4, c);
      L.ell(0, -11, 10, 10, C.head);
      L.ell(0, -13, 6, 6, C.pale);
      L.px(0, -20, 1, 16, c.lo);
      L.px(-6, -14, 5, 1, c.lo);
      L.px(2, -12, 5, 1, c.lo);
      L.px(-5, -9, 4, 1, c.lo);
      L.px(-7, -18, 5, 2, '#ffffff');
      L.px(-9, -12, 1, 3, c.hi);
    } else {
      const ring = [[-10, -6, 5], [10, -6, 5], [-8, -12, 5], [8, -12, 5], [-4, -17, 5], [4, -17, 5]];
      ring.forEach(r => { L.ell(r[0], r[1], r[2], r[2], C.head); });
      ring.forEach(r => {
        L.px(r[0] - r[2] + 1, r[1] - r[2], r[2], 1, c.hi);
        L.px(r[0] + 1, r[1] + r[2], r[2] - 1, 1, c.lo);
      });
      L.ell(0, -10, 7, 8, C.pale);
      L.px(-3, -15, 4, 1, '#ffffff');
      L.px(-1, -11, 1, 5, C.head);
      L.px(3, -9, 1, 4, C.head);
      L.px(-12, -4, 3, 1, c.lo);
      L.px(10, -4, 3, 1, c.lo);
    }
  }

  /* ---------- 3) Stalk Crops (ข้าวโพด) ---------- */
  function cornGrow(L, c) {
    stem(L, 0, 0, 30, c);
    L.line(0, -8, -12, -14, c.base, 2);
    L.line(0, -13, 12, -19, c.base, 2);
    L.line(0, -18, -11, -25, c.base, 2);
    L.line(0, -23, 10, -30, c.base, 2);
    L.px(-13, -15, 2, 1, c.hi);
    L.px(12, -20, 2, 1, c.hi);
    L.px(-12, -26, 2, 1, c.hi);
  }

  function cornRipe(L, c) {
    stem(L, 0, 0, 34, c);
    L.line(0, -6, -13, -11, c.base, 2);
    L.line(0, -10, 13, -14, c.base, 2);
    L.line(0, -26, -12, -31, c.base, 2);
    L.line(0, -28, 12, -33, c.base, 2);
    L.px(-14, -12, 2, 1, c.hi);
    L.px(13, -15, 2, 1, c.hi);
    // รวงเกสรยอดข้าวโพด
    L.px(-3, -36, 7, 1, '#d8c060');
    L.px(-1, -35, 1, 3, '#d8c060');
    L.px(2, -35, 1, 3, '#d8c060');
    // ฝักข้าวโพดอวบแน่น 2 ข้าง
    const cob = (x, y) => {
      L.ell(x, y, 3, 8, '#5fa040');
      L.px(x - 3, y - 3, 2, 9, '#7ac456');
      L.ell(x, y - 4, 2, 5, '#ffd23f');
      L.px(x - 1, y - 8, 1, 3, '#fff2a0');
      L.px(x + 1, y - 6, 1, 1, '#c89a1a');
      L.px(x - 1, y - 2, 1, 1, '#c89a1a');
      L.px(x, y - 10, 1, 2, '#c89040');
    };
    cob(-6, -17);
    cob(6, -11);
  }

  /* ---------- 4) Bush Crops (มะเขือม่วง พริก) ---------- */
  function bushGrow(L, C, c) {
    stem(L, 0, 0, 24, c);
    lfx(L, -6, -8, 6, 4, c);
    lfx(L, 6, -10, 6, 4, c);
    lfx(L, -4, -16, 5, 4, c);
    lfx(L, 5, -18, 5, 4, c);
    lfx(L, 0, -24, 4, 4, c);
    L.px(-8, -17, 2, 2, '#ffffff');
    L.px(7, -12, 2, 2, '#ffffff');
    L.px(-7, -17, 1, 1, '#ffd23f');
  }

  function bushRipe(L, C, c) {
    L.ell(0, -15, 12, 13, c.lo);
    L.ell(-1, -17, 11, 12, c.base);
    L.px(-9, -26, 8, 2, c.hi);
    L.px(1, -29, 8, 2, c.hi);
    L.px(-4, -21, 7, 1, c.hi);
    L.px(-10, -12, 3, 1, c.lo);
    L.px(6, -9, 3, 1, c.lo);

    if (C.fruit === 'egg') {
      const eg = (x, y) => {
        L.ell(x, y, 3, 5, C.c);
        L.px(x - 2, y - 6, 5, 2, '#3f7a3a');
        L.px(x - 2, y - 3, 1, 5, C.cL);
        L.px(x + 2, y + 1, 1, 3, C.cD);
      };
      eg(-7, -11);
      eg(7, -14);
      eg(0, -5);
      eg(-3, -19);
    } else {
      const pod = (x, y, d) => {
        L.line(x, y, x + d, y + 9, C.c, 2);
        L.px(x + d, y + 10, 1, 2, C.cD);
        L.px(x - 1, y - 1, 3, 2, '#3f7a3a');
        L.px(x, y + 1, 1, 5, C.cL);
      };
      pod(-9, -18, 1);
      pod(5, -21, -1);
      pod(-3, -12, 1);
      pod(9, -12, -1);
      pod(-10, -9, 2);
      pod(0, -20, 1);
    }
  }

  /* ---------- 5) Melon Crops (แตงโม) ---------- */
  function melonGrow(L, c) {
    stem(L, 0, 0, 9, c);
    lfx(L, -8, -5, 8, 4, c);
    lfx(L, 9, -5, 7, 4, c);
    lfx(L, 0, -12, 6, 4, c);
    lfx(L, -10, -11, 4, 3, c);
    L.px(-8, -5, 14, 1, c.lo);
    L.line(7, -4, 13, -8, c.lo, 1);
    L.px(5, -9, 3, 3, '#ffd23f');
    L.px(6, -8, 1, 1, '#fff2a0');
  }

  function melonRipe(L, c) {
    lfx(L, -14, -10, 5, 3, c);
    lfx(L, 14, -9, 5, 3, c);
    L.line(11, -8, 16, -14, c.lo, 1);
    L.ell(0, -9, 14, 9, '#2f8a40');
    for (let x = -13; x <= 13; x++) {
      const hh = Math.floor(9 * Math.sqrt(Math.max(0, 1 - (x * x) / (14.5 * 14.5))));
      if (Math.floor((x + 14) / 4) % 2 === 0 && hh > 1) {
        L.px(x, -9 - hh + 1, 1, 2 * hh - 1, '#1f5a2c');
      }
    }
    L.px(-10, -15, 6, 2, '#8ad070');
    L.px(-12, -12, 2, 3, '#8ad070');
    L.px(-12, -1, 24, 1, '#1f5a2c');
    L.px(-1, -19, 2, 3, '#6a8a3a');
    L.px(1, -21, 3, 2, '#6a8a3a');
  }

  /* ---------- 6) Berry Crops (สตรอว์เบอร์รี) ---------- */
  function berryGrow(L, c) {
    lfx(L, -7, -7, 5, 3, c);
    lfx(L, 7, -7, 5, 3, c);
    lfx(L, 0, -11, 5, 4, c);
    lfx(L, -4, -4, 4, 3, c);
    lfx(L, 5, -4, 4, 3, c);
    const fl = (x, y) => {
      L.px(x, y, 3, 3, '#ffffff');
      L.px(x + 1, y + 1, 1, 1, '#ffd23f');
    };
    fl(-10, -14);
    fl(7, -15);
    fl(-2, -18);
  }

  function berryRipe(L, c) {
    lfx(L, -8, -6, 6, 3, c);
    lfx(L, 8, -6, 6, 3, c);
    lfx(L, 0, -10, 5, 4, c);
    const be = (x, y) => {
      L.ell(x, y, 3, 4, '#e0304a');
      L.px(x - 1, y + 3, 3, 1, '#e0304a');
      L.px(x - 2, y - 4, 5, 2, '#4a9a3a');
      L.px(x - 2, y - 3, 1, 3, '#ff8a9a');
      L.px(x - 1, y - 1, 1, 1, '#ffe080');
      L.px(x + 1, y + 1, 1, 1, '#ffe080');
      L.px(x - 1, y + 2, 1, 1, '#ffe080');
      L.px(x + 2, y - 1, 1, 1, '#a01a30');
    };
    be(-8, -8);
    be(0, -4);
    be(8, -9);
    be(-3, -15);
    be(5, -17);
    be(-12, -3);
  }

  /* ---------- 7) Trellis Crops (แตงกวา องุ่น) ---------- */
  function posts(L) {
    L.px(-15, -34, 2, 34, WOOD.b);
    L.px(-15, -34, 1, 34, WOOD.l);
    L.px(13, -34, 2, 34, WOOD.b);
    L.px(13, -34, 1, 34, WOOD.l);
    L.px(-15, -34, 30, 2, WOOD.b);
    L.px(-15, -34, 30, 1, WOOD.l);
  }

  function trellisGrow(L, C, c) {
    posts(L);
    L.line(-12, -2, -6, -12, c.lo, 1);
    L.line(-6, -12, 6, -20, c.lo, 1);
    L.line(6, -20, -4, -28, c.lo, 1);
    L.line(-4, -28, 8, -32, c.lo, 1);
    lfx(L, -8, -10, 4, 3, c);
    lfx(L, 4, -16, 4, 3, c);
    lfx(L, -6, -22, 4, 3, c);
    lfx(L, 8, -26, 4, 3, c);
    lfx(L, 0, -31, 4, 3, c);
    lfx(L, -11, -5, 3, 2, c);
    L.px(8, -18, 2, 2, '#ffd23f');
    L.px(-8, -24, 2, 2, '#ffd23f');
  }

  function trellisRipe(L, C, c) {
    posts(L);
    [[-10, -29, 5, 4], [0, -30, 6, 4], [10, -29, 5, 4], [-6, -24, 4, 3], [6, -25, 4, 3]].forEach(a => lfx(L, a[0], a[1], a[2], a[3], c));
    L.px(-1, -34, 2, 6, c.lo);

    if (C.fruit === 'grape') {
      const bunch = (x, y) => {
        [3, 3, 2, 2, 1].forEach((n, r) => {
          for (let i = 0; i < n; i++) {
            const dx = Math.round((i - (n - 1) / 2) * 4);
            L.ell(x + dx, y + r * 4, 2, 2, C.c);
            L.px(x + dx - 1, y + r * 4 - 2, 1, 1, C.cL);
          }
        });
        L.px(x, y - 3, 1, 3, c.lo);
      };
      bunch(-8, -22);
      bunch(6, -22);
      bunch(-1, -12);
    } else {
      const ck = (x, y) => {
        L.ell(x, y, 2, 7, '#3f9a40');
        L.px(x - 1, y - 6, 1, 11, '#8ad060');
        L.px(x + 1, y - 3, 1, 1, '#2a6a2c');
        L.px(x + 1, y + 1, 1, 1, '#2a6a2c');
        L.px(x, y - 8, 1, 2, '#ffd23f');
      };
      ck(-9, -20);
      ck(-2, -22);
      ck(5, -18);
      ck(10, -24);
      ck(-5, -8);
    }
  }

  /* ---------- 8) Crown Crops (สับปะรด) ---------- */
  function crownGrow(L, c) {
    [[-12, -10], [-8, -18], [0, -22], [8, -18], [12, -10], [-14, -4], [14, -4]].forEach(p => L.line(0, -3, p[0], p[1], c.base, 2));
    [[-12, -10], [-8, -18], [0, -22], [8, -18], [12, -10]].forEach(p => L.px(p[0], p[1] - 1, 2, 1, c.hi));
  }

  function crownRipe(L, c) {
    [[-14, -12], [14, -12], [-16, -6], [16, -6]].forEach(p => L.line(0, -4, p[0], p[1], c.lo, 2));
    L.ell(0, -9, 8, 10, '#f2c230');
    for (let y = -18; y <= 0; y++) {
      for (let x = -8; x <= 8; x++) {
        if ((x * x) / 64 + ((y + 9) * (y + 9)) / 110 > 1) continue;
        if (((x + y) & 3) === 0) L.px(x, y, 1, 1, '#c8901e');
        else if (((x - y) & 3) === 0 && y % 2 === 0) L.px(x, y, 1, 1, '#fff08a');
      }
    }
    L.px(-6, -16, 3, 2, '#fff08a');
    L.px(-8, -9, 1, 5, '#fff08a');
    L.px(5, -2, 3, 1, '#b8801a');
    [[-7, -31], [-3, -35], [2, -35], [7, -31], [0, -33]].forEach(p => L.line(0, -18, p[0], p[1], c.base, 2));
    L.px(-1, -33, 2, 2, c.hi);
    L.px(-7, -32, 2, 1, c.hi);
  }

  /* ---------- 9) Tree Crops (มะม่วง แก้วมังกร ทุเรียน แอปเปิลทอง) ---------- */
  function treeGrow(L, C, c) {
    if (C.fruit === 'dragon') {
      L.px(-3, -20, 6, 20, '#3f9a58');
      L.px(-3, -20, 1, 20, '#6ac080');
      L.px(2, -20, 1, 20, '#2a6a3c');
      L.ell(0, -20, 3, 2, '#3f9a58');
      L.px(-1, -18, 1, 16, '#2a6a3c');
      L.px(-5, -12, 2, 1, '#f4f0c0');
      L.px(4, -8, 2, 1, '#f4f0c0');
      L.px(-4, -6, 1, 1, '#f4f0c0');
      L.px(-2, -24, 5, 4, '#ffffff');
      L.px(0, -23, 1, 2, '#ffd23f');
      return;
    }
    L.px(-2, -14, 4, 14, '#7a5230');
    L.px(-2, -14, 1, 14, '#a8743f');
    L.ell(0, -19, 8, 6, c.lo);
    L.ell(-1, -20, 7, 5, c.base);
    L.px(-6, -24, 5, 1, c.hi);
    L.px(1, -18, 4, 1, c.hi);
    if (C.fruit === 'gold') {
      L.px(-4, -17, 2, 2, '#ffd23f');
      L.px(-3, -18, 1, 1, '#ffffff');
      L.px(4, -22, 2, 2, '#ffd23f');
    } else {
      L.px(3, -17, 2, 2, '#ffffff');
    }
  }

  function treeRipe(L, C, c) {
    if (C.fruit === 'dragon') {
      const arm = (sx) => {
        L.px(sx * 10 - 1, -22, 3, 12, '#3f9a58');
        L.px(Math.min(0, sx * 10) - 1, -12, Math.abs(sx * 10) + 2, 3, '#3f9a58');
        L.px(sx * 10 - 1, -22, 1, 12, '#6ac080');
        L.ell(sx * 10, -22, 1, 1, '#3f9a58');
      };
      L.px(-4, -30, 8, 30, '#3f9a58');
      L.px(-4, -30, 2, 30, '#6ac080');
      L.px(2, -30, 2, 30, '#2a6a3c');
      L.ell(0, -30, 4, 2, '#3f9a58');
      L.px(0, -28, 1, 26, '#2a6a3c');
      arm(-1);
      arm(1);
      [[-3, -24], [3, -18], [-2, -8], [2, -4], [-10, -18], [10, -16]].forEach(p => L.px(p[0], p[1], 1, 1, '#f4f0c0'));
      const fr = (x, y) => {
        L.ell(x, y, 3, 4, '#e0408a');
        L.px(x - 2, y - 2, 1, 3, '#ff90c0');
        L.px(x + 1, y + 2, 2, 1, '#a02060');
        L.px(x - 4, y - 1, 2, 1, '#6ac060');
        L.px(x + 3, y - 1, 2, 1, '#6ac060');
        L.px(x - 1, y - 5, 3, 1, '#6ac060');
        L.px(x - 1, y + 4, 3, 1, '#6ac060');
        L.px(x, y, 1, 1, '#ffffff');
      };
      fr(-10, -27);
      fr(10, -25);
      fr(0, -34);
      return;
    }

    L.px(-2, -18, 5, 18, '#7a5230');
    L.px(-2, -18, 1, 18, '#a8743f');
    L.px(2, -18, 1, 18, '#5a3a20');
    L.px(-6, 0, 3, 2, '#7a5230');
    L.px(4, 0, 3, 2, '#7a5230');
    L.ell(0, -26, 13, 9, c.lo);
    L.ell(-1, -28, 12, 8, c.base);
    L.px(-10, -33, 7, 2, c.hi);
    L.px(1, -35, 8, 2, c.hi);
    L.px(-4, -28, 6, 1, c.hi);
    L.px(-12, -24, 3, 1, c.lo);
    L.px(8, -21, 4, 1, c.lo);

    if (C.fruit === 'mango') {
      const m = (x, y) => {
        L.ell(x, y, 3, 4, '#ffb02e');
        L.px(x + 1, y - 1, 2, 4, '#e8602a');
        L.px(x - 2, y - 3, 1, 3, '#ffe080');
        L.px(x, y - 5, 1, 2, '#3a7a30');
      };
      m(-9, -16);
      m(7, -14);
      m(0, -11);
      m(-4, -20);
    } else if (C.fruit === 'gold') {
      const a = (x, y) => {
        L.ell(x, y, 3, 3, '#ffd23f');
        L.px(x - 2, y - 2, 2, 1, '#fff6b0');
        L.px(x + 1, y + 2, 2, 1, '#c99a1a');
        L.px(x, y - 4, 1, 2, '#7a5230');
        L.px(x + 1, y - 4, 2, 1, '#4f9a46');
      };
      a(-9, -17);
      a(8, -16);
      a(0, -13);
      a(-4, -21);
      a(5, -22);
      L.px(-12, -30, 1, 3, '#fff2a0');
      L.px(-13, -29, 3, 1, '#fff2a0');
      L.px(11, -31, 1, 3, '#fff2a0');
      L.px(10, -30, 3, 1, '#fff2a0');
    } else { // durian
      const d = (x, y) => {
        L.ell(x, y, 5, 6, '#a0a84a');
        L.ell(x, y + 1, 4, 4, '#8a9238');
        for (let j = -5; j <= 5; j += 2) {
          for (let i = -4; i <= 4; i += 2) {
            if ((i * i) / 25 + (j * j) / 36 > 1) continue;
            L.px(x + i + ((j / 2) & 1), y + j, 1, 1, '#e0e48a');
            L.px(x + i + ((j / 2) & 1), y + j + 1, 1, 1, '#5a6a22');
          }
        }
        L.px(x, y - 8, 1, 3, '#7a5230');
      };
      d(-8, -14);
      d(8, -16);
      d(0, -9);
    }
  }

  /* ---------- Crop Frame Assembly ---------- */
  const DRAW = {
    root:    [(L, C, c) => { fan(L, c, 0, 18); }, rootRipe],
    head:    [headGrow, headRipe],
    stalk:   [(L, C, c) => cornGrow(L, c), (L, C, c) => cornRipe(L, c)],
    bush:    [bushGrow, bushRipe],
    melon:   [(L, C, c) => melonGrow(L, c), (L, C, c) => melonRipe(L, c)],
    berry:   [(L, C, c) => berryGrow(L, c), (L, C, c) => berryRipe(L, c)],
    trellis: [trellisGrow, trellisRipe],
    crown:   [(L, C, c) => crownGrow(L, c), (L, C, c) => crownRipe(L, c)],
    tree:    [treeGrow, treeRipe]
  };

  function frame(crop, stage) {
    const key = crop + stage;
    if (cache[key]) return cache[key];
    const C = CFG[crop];
    if (!C) return null;
    const c = LC[C.leaf], L = GFX.layer(40, 46, 20, 38);

    if (stage === 0) mound(L, true, C.seed);
    else if (stage === 1) { mound(L, false); sprout(L, c); }
    else { mound(L, false); DRAW[C.a][stage - 2](L, C, c); }

    L.shade(1, .26, .32).outline(.72);
    return (cache[key] = GFX.frame(L));
  }

  /* ---------- Hook: drawCrop (Global Render Wrapper) ---------- */
  const _dc = drawCrop;
  window.drawCrop = drawCrop = function (x, y, p) {
    const C = CFG[p.crop];
    if (!C) return _dc(x, y, p);

    // เงาสัมผัสพื้นดินใต้พืช
    const shRadius = p.stage >= 2 && C.wide ? 14 : (p.stage >= 2 ? 10 : 7);
    GFX.drawShadow(ctx, x + 8, y + 14, shRadius, 3);
    GFX.draw(ctx, frame(p.crop, p.stage), x + 8, y + 15, false, null);

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

  /* ---------- 12x12 Pixel Icons (Seed & Crop Produce) ---------- */
  const SEEDROWS = [
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
  ];

  const R = {
    round:  ['....nG....', '...nGgg...', '..XXXXXX..', '.XqqXXXXx.', '.XqXXXXXx.', '.XXXXXXXx.', '.XXXXXXXx.', '..XXXXXx..', '...xxxx...'],
    carrot: ['...g.gg...', '...gGgGg..', '....gGg...', '..XXXXXX..', '..XqXXXXx.', '...XXXXx..', '...XXXXx..', '....XXx...', '....Xxx...', '.....x....'],
    daikon: ['...g.gg...', '...gGgGg..', '....gGg...', '...ZZZZZ..', '...XqXXXx.', '...XqXXXx.', '....XXXx..', '....XXXx..', '.....XXx..', '.....xx...'],
    cuke:   ['.......xxx', '.....XXXXx', '...XXXqXXx', '..XXXXXXx.', '.XXqXXXxx.', 'XXXXXXxx..', '.xxxxx....'],
    egg:    ['.GGG......', 'GGgG......', '.XXXXX....', '.XqXXXXx..', '..XXXXXXx.', '...XXXXXx.', '....XXXXx.', '.....xxx..'],
    pod:    ['..nG......', '..GGG.....', '.XXXXX....', '.XqXXXx...', '..XXXXx...', '..XXXx....', '...XXx....', '....Xx....', '....xx....'],
    corn:   ['....XXx...', '...XqXXx..', '...XXXXx..', '...XqXXx..', '..ZXXXXxZ.', '.ZZXXXxZZ.', '.ZZzXXzZZ.', '..ZzzzzZ..', '....zz....'],
    head:   ['..ZZZZZZ..', '.ZXXXXXXZ.', 'ZXqXXXXXxZ', 'ZXqXzXXXxZ', 'ZXXXzXXXxZ', 'ZXXXXzXXxZ', '.ZXXXXXxZ.', '..zzzzzz..'],
    bulb:   ['....g.g...', '....gGg...', '...XXXX...', '..XXqXXX..', '.XXqXXXXx.', '.XXXXXXXx.', '.XXXXXXXx.', '..XXXXXx..', '...xxxx...', '....xx....'],
    lumpy:  ['..XXXXX...', '.XXqXXXXx.', 'XXqXXxXXXx', 'XXXXXXXXXx', 'XXxXXXXxXx', '.XXXXXXXx.', '..xxxxxx..'],
    sweet:  ['.......XXX', '.....XXqXXx', '...XXXXXXx.', '.XXqXXXXx..', 'XXXXXXXxx..', '.xxxxx....'],
    melon:  ['...nn.....', '.XXxXXxXX.', 'XqXXxXXxXx', 'XqXxXXxXXx', 'XXXxXXxXXx', 'XXXxXXxXXx', 'XXXxXXxXxx', '.XXxXXxXx.', '..xxxxxx..'],
    berry:  ['..ZZzZZ...', '.XXXXXXXx.', '.XqXyXXXx.', '.XqXXXyXx.', '..XXyXXx..', '..XXXXXx..', '...XyXx...', '....xx....'],
    grape:  ['...nn.....', '..GGGg....', '.XqXXqXX..', '.XXXXXXXx.', '..XqXXXXx.', '...XXXXx..', '...xXXXx..', '....xXx...', '.....x....'],
    pine:   ['..G.Gg.G..', '...GgGG...', '....GG....', '..XXXXXX..', '.XZXXZXXXx', '.XXZXXZXXx', '.XZXXZXXXx', '.XXZXXZXXx', '..XZXXZXx.', '...xxxxx..'],
    mango:  ['....nGG...', '...nGGg...', '..XXXXXx..', '.XqXXXZZx.', '.XqXXXZZx.', '.XXXXXZXx.', '..XXXXXx..', '...xxxx...'],
    dragon: ['.g...g..g.', '..XXXXXX..', '.XqXXXXXx.', 'gXqXXjXXXg', '.XXXjXXXx.', 'gXXXXXXXxg', '.XXXXXXx..', '..xxxxxx..'],
    durian: ['....nG....', '..XjXjXj..', '.jXXjXXjXx', 'XjXXXjXXXx', 'jXXjXXjXXj', 'XjXXjXXXjx', '.XjXXjXjx.', '..xjxxjx..'],
    ginseng:['..r.r.....', '...GGG....', '..GGGGG...', '....G.....', '...XXX....', '..XqXXx...', '..XXXXx...', '.XXX.XXx..', '.XX...XXx.', 'XX.....Xx.']
  };

  const IC_ = {
    daikon:      ['daikon',  '#f4f0e4', '#8fd45a'],
    lettuce:     ['head',    '#a8e070', '#4f9a46'],
    carrot:      ['carrot',  '#f2862a', '#e07020'],
    corn:        ['corn',    '#ffd23f', '#5fa040'],
    eggplant:    ['egg',     '#7a3fa8', '#b078d8'],
    chili:       ['pod',     '#e02a2a', '#ff8a7a'],
    cabbage:     ['head',    '#cdeea0', '#5aa04a'],
    shallot:     ['bulb',    '#b8507a', '#e890b0'],
    potato:      ['lumpy',   '#c9a068', '#e8c890'],
    sweetpotato: ['sweet',   '#b0507a', '#e088b0'],
    cucumber:    ['cuke',    '#4fa84a', '#8ad060'],
    watermelon:  ['melon',   '#3f9a4a', '#e0414f'],
    strawberry:  ['berry',   '#e0304a', '#4a9a3a'],
    grape:       ['grape',   '#7a3a9a', '#c08ae0'],
    pineapple:   ['pine',    '#f2c230', '#c8901e'],
    mango:       ['mango',   '#ffb02e', '#e8602a'],
    dragonfruit: ['dragon',  '#e0408a', '#ff90c0'],
    durian:      ['durian',  '#a0a84a', '#e0e48a'],
    ginseng:     ['ginseng', '#e8d2a0', '#a8844a'],
    goldapple:   ['round',   '#ffd23f', '#c99a1a']
  };

  const D = c => mix(c, '#2a1a4a', .38);
  const Lt = c => mix(c, '#fff3c4', .5);

  function makeIcons() {
    const mk = window.ICON_ART && ICON_ART.make;
    if (!mk) return;
    for (const k in IC_) {
      const [shape, c1, c2] = IC_[k];
      const pal = { X: c1, x: D(c1), q: Lt(c1), Z: c2, z: D(c2), j: Lt(c2), y: '#ffd23f' };
      if (k === 'cabbage') pal.Z = '#4f9a46';
      try {
        IC['seed_' + k] = mk(SEEDROWS, { X: c1, x: D(c1), Z: c2 });
        IC['crop_' + k] = mk(R[shape], pal);
      } catch (e) {
        console.warn('crop icon', k, e);
      }
    }
    if (typeof refreshHot === 'function') refreshHot();
  }
  makeIcons();

  /* Public API Exposure */
  window.CROP_ART = { frame, CFG, makeIcons };

  // อบสไปรต์ล่วงหน้าใน Idle Queue
  setTimeout(() => {
    for (const k in CFG) {
      for (let s = 0; s < 4; s++) GFX.later(() => GFX.touch(frame(k, s)));
    }
  }, 1800);
})();
