'use strict';
/* =====================================================================
   ART SKILL (v19 Remastered): เอฟเฟกต์สกิลตามระดับ 0..10 — ปรับเฉพาะงานภาพ
   ชาย:  ลูกไฟระเบิด (K) · ฟันหมุนพายุใบมีด (L) · พุ่งฟันแทงทะลวง (I)
   หญิง: ลิ่มน้ำแข็งสะบั้น (K) · วงเวทฟื้นฟูศักดิ์สิทธิ์ (L) · สายฟ้าฟาดชิ่ง (I)
   - สเตจภาพ 0..5 (Lv.1-2=1, 3-4=2, 5-6=3, 7-8=4, 9-10=5) · สเตจ 0 ใช้ภาพพื้นฐานของ art_fx.js
   - สไตล์ Classic JRPG Pixel Art: คมชัด สเต็ปพิกเซลจัดเจน ปราศจาก Blur/Filter
   - รองรับการสเกลตามเลเวลจริงอย่างต่อเนื่อง · อบสไปรต์ล่วงหน้าผ่าน GFX.later
   - รักษา Combat Logic, MP, Cooldown, Hitbox, Damage และ Save/Load เดิม 100%
   ===================================================================== */
(function () {
  const PI = Math.PI, mix = GFX.mix, HEX = GFX.hex, OFF = /[?&]skfx=0/.test(location.search);
  const mem = {}, M = (k, f) => mem[k] || (mem[k] = f());

  const mkF = (w, h, ax, ay, fn, ol) => {
    const L = GFX.layer(w, h, ax, ay);
    fn(L);
    if (ol) L.outline(.5, ol);
    return GFX.frame(L);
  };

  const rgba = (h, a) => {
    const c = HEX(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  };

  const hsh = (a, b) => {
    const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  const lite = () => {
    try { return Q < 4; } catch (e) { return false; }
  };

  const lvOf = i => {
    try { return skLv(i); } catch (e) { return 0; }
  };

  const stOf = lv => (lv <= 0 ? 0 : Math.min(5, Math.ceil(lv / 2)));
  const stI = i => stOf(lvOf(i));
  const rd = Math.round, sn = Math.sin, cs = Math.cos;

  function dr(f, x, y, ang, alpha, sc) {
    ctx.save();
    ctx.translate(rd(x * RS) / RS, rd(y * RS) / RS);
    if (ang) ctx.rotate(ang);
    if (sc && sc !== 1) ctx.scale(sc, sc);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha === undefined ? 1 : alpha));
    ctx.drawImage(f.b || f.c, -f.ax / RS, -f.ay / RS, f.w / RS, f.h / RS);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---------- พาเลตสีประจำสเตจ (สเตจ 1..5) ---------- */
  const FIRE = [
    null,
    ['#b83324', '#f76a22', '#fcc232', '#fffad0'],
    ['#c82b18', '#fa8c24', '#ffd650', '#ffffff'],
    ['#7e1b34', '#fa4e22', '#fcc232', '#ffffff'],
    ['#542484', '#fa5e32', '#ffdf98', '#c8ebff'],
    ['#1a47b8', '#4296fa', '#b8e2ff', '#ffffff']
  ];

  const WHP = [
    null,
    ['#ffffff', '#b8e6ff', '#5298e2'],
    ['#ffffff', '#c2fad2', '#46c898'],
    ['#fff4c2', '#ffe498', '#fab832'],
    ['#ffeedc', '#ffb898', '#fa5e32'],
    ['#ffffff', '#ffe498', '#ac82fa']
  ];
  const WHN = [0, 3, 4, 4, 5, 6]; // จำนวนใบมีดตามสเตจ

  const DASHP = [
    null,
    ['#ffffff', '#94dcff', '#5298e2'],
    ['#ffffff', '#94fad2', '#46c898'],
    ['#fff4c2', '#facc38', '#b88218'],
    ['#ffdcce', '#fa6e32', '#982414'],
    ['#ffffff', '#ffe498', '#ac82fa']
  ];

  const ICEP = [
    null,
    ['#3884f8', '#94dcff', '#ffffff', '#173472'],
    ['#3884f8', '#94dcff', '#ffffff', '#173472'],
    ['#269efa', '#b8e8ff', '#ffffff', '#123a72'],
    ['#28c8d8', '#d0f8ff', '#ffffff', '#0c4462'],
    ['#64d8ff', '#e2f8ff', '#ffffff', '#523498']
  ];

  const HLP = [
    null,
    ['#74f892', '#c2f8d0', '#289252'],
    ['#84f8a0', '#d8f8e0', '#289252'],
    ['#54f8c8', '#d0f8ee', '#1a9282'],
    ['#c0f872', '#fff8b8', '#729824'],
    ['#f8d85e', '#fff2c2', '#b88218']
  ];

  const BOLTP = [
    null,
    ['#5286e8', '#b8dcff', '#ffffff'],
    ['#6252e8', '#c6b8ff', '#ffffff'],
    ['#8252f8', '#d8c8ff', '#ffffff'],
    ['#faa61a', '#ffea98', '#ffffff'],
    ['#9862f8', '#ffe498', '#ffffff']
  ];

  const PCOL = {
    m: [FIRE.map(c => c && c[2]), WHP.map(c => c && c[1]), DASHP.map(c => c && c[1])],
    f: [ICEP.map(c => c && c[1]), HLP.map(c => c && c[0]), BOLTP.map(c => c && c[1])]
  };

  const DESC = {
    m: [
      ['ลูกไฟธรรมดา', 'ลูกไฟร้อนแรงขึ้น หางยาว มีประกายไฟ', 'ไส้ในขาวร้อน หางยาวขึ้น · ระเบิดมีคลื่นกระแทกบนพื้น', 'ลูกไฟแดงเลือดหมู+ทอง มีรัศมีเรืองรอบลูก · ระเบิดคลื่นสองชั้น', 'ไฟม่วงแกนร้อน มีแฉกประกาย · ระเบิดมีประกายไฟพุ่งขึ้น', 'ไฟสีฟ้าขาว! ดวงไฟโคจรรอบลูก · ระเบิดเป็นเสาไฟ'],
      ['ฟันหมุนใบมีดสามเล่ม', 'ใบมีดสีฟ้าเข้มขึ้น หมุนเร็วขึ้น', 'ใบมีดสีเขียวมรกต 4 เล่ม', 'ใบมีดทอง วงในหมุนสวนทาง · มีคลื่นพื้น', 'ใบมีดส้มแดง 5 เล่ม · วงลมเรืองรอบนอก', 'ใบมีดขาวทอง 6 เล่ม ขอบม่วง · วงลมหมุนรอบ'],
      ['พุ่งฟันลายสีขาวฟ้า', 'เส้นความเร็วหนาขึ้น กว้างขึ้น', 'สีเขียวมรกต · มีลูกศรตามทางพุ่ง', 'เส้นสีทอง · รอยฟันกากบาทที่ปลายทาง · คลื่นกระแทกสองชั้น', 'สีส้มแดง ลูกศรใหญ่ขึ้น', 'ขาวทองขอบม่วง · ประกายกระจายตลอดทาง']
    ],
    f: [
      ['ลูกน้ำแข็งธรรมดา', 'เสี้ยนน้ำแข็งยาวขึ้น หางเรืองฟ้า', 'มีหนามน้ำแข็งด้านหลัง', 'ผลึกฟ้าสด · ละอองหิมะตามทาง · มีรอยน้ำแข็งบนพื้นตรงจุดโดน', 'ผลึกหนามแหลม 3 เสี้ยน (กระสุนข้างๆ ตามมา) · ไอเย็นเขียวมรกต', 'ผลึกฟ้าขาว ขอบม่วงออโรรา · คลื่นแช่แข็งตอนโดน'],
      ['ฟื้นฟู วงรูนสีเขียว', 'วงรูนและประกายลอยมากขึ้น', 'วงรูนซ้อนสองชั้น หมุนสวนทางกัน', 'เสาแสงสีเขียวมิ้นต์ · วงรูนแปดดวง', 'เกลียวประกายพันขึ้นฟ้า · สีเขียวทอง', 'วงรัศมีทองลอยเหนือหัว · เสาแสงสีทอง'],
      ['สายฟ้าสีฟ้า', 'สายฟ้าหนาขึ้น', 'สีม่วงคราม · มีกิ่งสายฟ้าแตก', 'จุดโดนเป็นประกายแฉก · มีคลื่นกระแทกพื้น', 'สายฟ้าคู่สีทองส้ม · ประกายกระเด็น', 'สายฟ้าทองขอบม่วง · ประกายกระจายตลอดทาง']
    ]
  };

  /* ---------- สไปรต์อนุภาคพื้นฐาน ---------- */
  const sparkF = col => M('sp' + col, () => mkF(11, 11, 5, 5, L => {
    L.px(-1, -4, 3, 9, col);
    L.px(-4, -1, 9, 3, col);
    L.px(0, -2, 1, 5, '#ffffff');
    L.px(-2, 0, 5, 1, '#ffffff');
  }));

  const flatRing = (key, c0, c1, c2) => M('fr' + key, () => mkF(140, 84, 70, 42, L => {
    for (let k = 0; k < 90; k++) {
      const a = k / 90 * PI * 2;
      L.px(rd(cs(a) * 52), rd(sn(a) * 26), 2, 2, c0);
      L.px(rd(cs(a) * 46), rd(sn(a) * 22), 2, 1, c1);
    }
    for (let k = 0; k < 110; k++) {
      const a = k / 110 * PI * 2;
      L.px(rd(cs(a) * 58), rd(sn(a) * 29), 1, 1, c2);
    }
  }));

  /* ================= 1) ลูกไฟ & ระเบิด (ชาย K) ================= */
  function fireF(f, st) {
    return M('fb' + st + '_' + f, () => {
      const c = FIRE[st], r = 9 + (st >= 3 ? 2 : 0) + (st >= 5 ? 1 : 0);
      return mkF(120, 60, 88, 30, L => {
        const w = Math.sin(f * PI / 2) * 2;
        if (st >= 3) {
          L.ell(0, 0, r + 8, r + 8, rgba(c[1], .16));
          L.ell(0, 0, r + 5, r + 5, rgba(c[1], .2));
        }

        [[c[0], 6, 5], [c[1], 5, 4], [c[2], 4, 3]].forEach(([col, rx, ry], i) => {
          const n = 5 + st - i;
          for (let k = n; k >= 1; k--) {
            L.ell(
              -r - k * 6 + i,
              rd(w * (k % 2 ? 1 : -1)),
              Math.max(1, rx + (st >= 2 ? 1 : 0) - k + 2),
              Math.max(1, ry + (st >= 2 ? 1 : 0) - Math.floor(k / 2)),
              col
            );
          }
        });

        for (let i = 0; i < 2 + st; i++) {
          L.px(-r - 6 - Math.floor(hsh(f, i) * 40), Math.floor((hsh(i, f + 3) - .5) * 18), 2, 2, i % 2 ? c[2] : c[1]);
        }

        L.ell(0, 0, r, r, c[0]);
        L.ell(0, 0, r - 2, r - 2, c[1]);
        L.ell(0, 0, r - 4, r - 4, c[2]);
        L.ell(0, 0, r - 6, r - 6, c[3]);
        L.px(-1, -1, 3, 3, '#ffffff');

        if (st >= 4) {
          L.px(-1, -r - 6, 3, 5, c[2]);
          L.px(-1, r + 2, 3, 5, c[2]);
          L.px(r + 2, -1, 5, 3, c[2]);
          L.px(-r - 6, -1, 5, 3, c[2]);
        }
        if (st >= 5) {
          for (let i = 0; i < 3; i++) {
            const a = f * .8 + i * 2.09;
            L.px(rd(cs(a) * (r + 6)) - 1, rd(sn(a) * (r + 6)) - 1, 3, 3, '#ffffff');
          }
        }
      });
    });
  }

  function boomF(st, step) {
    return M('bm' + st + '_' + step, () => {
      const c = FIRE[st], r = 8 + step * 8 + st * 2;
      return mkF(150, 150, 75, 75, L => {
        if (step >= 3) L.ell(0, -2, r + 2, r, st >= 5 ? 'rgba(28,36,75,.52)' : 'rgba(68,36,36,.56)');
        if (st >= 2) {
          const rx = r + 10, ry = rd(rx * .55);
          for (let k = 0; k < 90; k++) {
            const a = k / 90 * PI * 2;
            L.px(rd(cs(a) * rx), rd(sn(a) * ry) + 4, 2, 2, rgba(c[3], .8));
          }
        }
        if (st >= 3) {
          const rx = r + 18, ry = rd(rx * .55);
          for (let k = 0; k < 110; k++) {
            const a = k / 110 * PI * 2;
            L.px(rd(cs(a) * rx), rd(sn(a) * ry) + 4, 2, 1, rgba(c[2], .6));
          }
        }
        L.ell(0, 0, r, r, c[0]);
        L.ell(0, 0, rd(r * .8), rd(r * .8), c[1]);
        L.ell(0, 0, rd(r * .55), rd(r * .55), c[2]);
        if (step < 4) {
          L.ell(0, 0, rd(r * .3), rd(r * .3), c[3]);
          L.px(-1, -1, 3, 3, '#ffffff');
        }
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * PI * 2 + step * .3, d = r + 3 + step * 2;
          L.px(rd(cs(a) * d), rd(sn(a) * d), 3, 3, i % 2 ? c[2] : c[1]);
          L.px(rd(cs(a) * d), rd(sn(a) * d), 1, 1, '#ffffff');
        }
        if (st >= 4 && step >= 1) {
          for (let i = 0; i < 8; i++) {
            L.px(rd((hsh(i, 1) - .5) * r * 1.6), rd(-r * .6 - hsh(i, 2) * r * .9 - step * 3), 2, 2, i % 2 ? c[2] : c[3]);
          }
        }
        if (st >= 5 && step >= 1) {
          for (let j = 0; j < 4; j++) {
            L.ell(0, -rd(r * .3 + j * r * .25), Math.max(2, rd(r * .45 - j * 3)), Math.max(2, rd(r * .3)), j % 2 ? c[1] : c[2]);
          }
        }
      });
    });
  }

  function drawFireProj(p, ang, st, lv) {
    const f = Math.floor(S.t * 16) % 4, sc = 1 + .025 * lv;
    dr(fireF(f, st), p.x, p.y, ang, 1, sc);
    if (st >= 2 && !lite()) {
      const ux = cs(ang), uy = sn(ang), nx = -uy, ny = ux, n = st >= 4 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const k = (S.t * 3 + i / n) % 1, b = 10 + k * 26, o = (hsh(i, 4) - .5) * 8;
        dr(sparkF(FIRE[st][2]), p.x - ux * b + nx * o, p.y - uy * b + ny * o, 0, 1 - k, .5 + .4 * (1 - k));
      }
    }
  }

  function drawBoom(e, p, x, y, st, lv) {
    dr(boomF(st, Math.min(4, Math.floor(p * 5))), x, y, 0, 1 - Math.max(0, p - .5), 1 + .025 * lv);
  }

  /* ================= 2) ฟันหมุน (ชาย L) ================= */
  function whirlF(st) {
    return M('wh' + st, () => mkF(176, 176, 88, 88, L => {
      const c = WHP[st], nb = WHN[st], sweep = Math.min(1.5, 4.2 / nb);
      for (let b = 0; b < nb; b++) {
        const base = b * PI * 2 / nb;
        for (let k = 0; k <= 40; k++) {
          const t = k / 40, ang = base + t * sweep, tp = sn(PI * t), r0 = rd(60 - tp * 6);
          for (let rad = r0; rad <= 64; rad++) {
            const q = (rad - r0) / Math.max(1, 64 - r0);
            L.px(rd(cs(ang) * rad), rd(sn(ang) * rad), 2, 2, q > .6 ? c[0] : (q > .25 ? c[1] : c[2]));
          }
        }
      }
      for (let k = 0; k < 64; k++) {
        const a = k / 64 * PI * 2;
        if (k % 3) L.px(rd(cs(a) * 50), rd(sn(a) * 50), 1, 1, c[2]);
      }
      if (st >= 4) {
        for (let k = 0; k < 120; k++) {
          const a = k / 120 * PI * 2;
          L.px(rd(cs(a) * 68), rd(sn(a) * 68), 1, 1, rgba(c[1], .55));
        }
      }
      if (st >= 5) {
        for (let k = 0; k < 84; k += 6) {
          const a = k / 84 * PI * 2;
          L.px(rd(cs(a) * 76) - 1, rd(sn(a) * 76) - 1, 3, 3, c[0]);
        }
      }
    }));
  }

  function whirlInF(st) {
    return M('whi' + st, () => mkF(120, 120, 60, 60, L => {
      const c = WHP[st];
      for (let b = 0; b < 3; b++) {
        const base = b * PI * 2 / 3;
        for (let k = 0; k <= 30; k++) {
          const t = k / 30, ang = base + t * 1.2, tp = sn(PI * t), r0 = rd(34 - tp * 4);
          for (let rad = r0; rad <= 38; rad++) {
            const q = (rad - r0) / Math.max(1, 38 - r0);
            L.px(rd(cs(ang) * rad), rd(sn(ang) * rad), 2, 2, q > .5 ? c[0] : c[1]);
          }
        }
      }
    }));
  }

  const shockF = st => flatRing('dk' + st, DASHP[st][0], DASHP[st][1], DASHP[st][2]);

  function drawWhirl(e, p, x, y, st, lv) {
    const sc = .45 + p * .55, rot = p * PI * (3.2 + .12 * lv), al = 1 - p * .7;
    dr(whirlF(st), x, y, rot, al, sc);
    if (st >= 3) dr(whirlInF(st), x, y, -rot * 1.3, al, sc);
    if (st >= 3 && p > .3) dr(shockF(st), x, y + 8, 0, (1 - p) * .6, .5 + p * .7);
  }

  function drawDashShock(e, p, x, y, st) {
    dr(shockF(st), x, y + 4, 0, 1 - p, .4 + p * (.9 + .04 * st));
    if (st >= 3 && p > .2) dr(shockF(st), x, y + 4, 0, (1 - p) * .7, .3 + (p - .2) * 1.3);
  }

  /* ================= 3) พุ่งฟัน (ชาย I) ================= */
  function pathFrame(pts, pad, fn) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach(p => {
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    });
    const w = Math.ceil((x1 - x0) * RS) + pad * 2;
    const h = Math.ceil((y1 - y0) * RS) + pad * 2;
    const L = GFX.layer(w, h, pad, pad);
    fn(L, p => [rd((p.x - x0) * RS), rd((p.y - y0) * RS)]);
    return { f: GFX.frame(L), x: x0, y: y0 };
  }

  function dashPF(x0, y0, x1, y1, st) {
    const c = DASHP[st];
    return pathFrame([{ x: x0, y: y0 }, { x: x1, y: y1 }], 28, (L, m) => {
      const A = m({ x: x0, y: y0 }), B = m({ x: x1, y: y1 });
      const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, sp = 6 + st;

      for (let o = -sp; o <= sp; o += 3) {
        const ctr = Math.abs(o) < 4, sh = ctr ? 1 : .6;
        const sx = A[0] + nx * o + dx * (1 - sh) * .5, sy = A[1] + ny * o + dy * (1 - sh) * .5;
        L.line(rd(sx), rd(sy), rd(B[0] + nx * o), rd(B[1] + ny * o), ctr ? c[0] : c[1], ctr ? 2 + (st >= 3 ? 1 : 0) : 1);
      }

      if (st >= 2) {
        const n = Math.min(6, Math.floor(len / 16)), s = 5 + st;
        for (let i = 1; i <= n; i++) {
          const t = i / (n + 1), cx = A[0] + dx * t, cy = A[1] + dy * t;
          L.line(rd(cx - ux * s + nx * s), rd(cy - uy * s + ny * s), rd(cx), rd(cy), c[1], 2);
          L.line(rd(cx - ux * s - nx * s), rd(cy - uy * s - ny * s), rd(cx), rd(cy), c[1], 2);
        }
      }

      L.ell(A[0], A[1], 7, 5, '#4d3f32');
      L.ell(A[0] - 3, A[1] + 2, 5, 4, '#342920');
      L.ell(A[0] + 4, A[1] - 2, 4, 3, '#78624a');

      if (st >= 3) {
        const s = 8 + st * 2;
        L.line(B[0] - s, B[1] - s, B[0] + s, B[1] + s, c[0], 2);
        L.line(B[0] - s, B[1] + s, B[0] + s, B[1] - s, c[0], 2);
        L.ell(B[0], B[1], 4, 4, c[1]);
        L.px(B[0] - 1, B[1] - 1, 2, 2, '#ffffff');
      }

      if (st >= 5) {
        for (let i = 0; i < 10; i++) {
          const t = hsh(i, 1);
          L.px(rd(A[0] + dx * t + nx * (hsh(i, 2) - .5) * 30), rd(A[1] + dy * t + ny * (hsh(i, 2) - .5) * 30), 2, 2, i % 2 ? '#ffffff' : c[2]);
        }
      }
    });
  }

  function dash(x0, y0, x1, y1) {
    if (OFF || P.g !== 'm') return false;
    const st = stI(2);
    if (!st) return false;
    fx.push({ k: 'dash', x: 0, y: 0, t: 0, life: .3 + .02 * st, pf: dashPF(x0, y0, x1, y1, st) });
    return true;
  }

  /* ================= 4) ลูกน้ำแข็ง (หญิง K) ================= */
  function iceF(st) {
    return M('ic' + st, () => {
      const c = ICEP[st], len = 11 + st, hh = 4 + (st >= 2 ? 1 : 0) + (st >= 4 ? 1 : 0);
      return mkF(76, 40, 44, 20, L => {
        L.px(-14 - st * 2, -1, 8 + st * 2, 2, c[0]);
        if (st >= 2) {
          L.px(-8, -hh, 6, 1, c[1]);
          L.px(-8, hh - 1, 6, 1, c[1]);
        }
        if (st >= 3) {
          L.px(-14, -hh - 1, 6, 1, c[0]);
          L.px(-14, hh, 6, 1, c[0]);
        }
        if (st >= 5) L.px(-22, -1, 8, 1, '#b48aff');

        L.ell(0, 0, len, hh, c[0]);
        L.ell(1, 0, len - 2, hh - 1, c[1]);
        L.px(-3, 0, len, 1, c[2]);
        L.px(len, 0, 3, 1, c[2]);

        if (st >= 4) {
          L.px(len, -3, 5, 1, c[2]);
          L.px(len, 2, 5, 1, c[2]);
        }
      }, c[3]);
    });
  }

  function frostF(st) {
    return M('fr_' + st, () => {
      const c = ICEP[st], len = 22 + st * 2;
      return mkF(84, 84, 42, 42, L => {
        const arm = (a, l, w) => {
          const x = rd(cs(a) * l), y = rd(sn(a) * l);
          L.line(0, 0, x, y, c[1], w);
          if (st >= 2 && w > 1) {
            const bx = rd(cs(a) * l * .65), by = rd(sn(a) * l * .65);
            L.line(bx, by, bx + rd(cs(a + .6) * 6), by + rd(sn(a + .6) * 6), c[2], 1);
            L.line(bx, by, bx + rd(cs(a - .6) * 6), by + rd(sn(a - .6) * 6), c[2], 1);
          }
        };

        for (let i = 0; i < 6; i++) {
          const a = i * PI / 3;
          arm(a, len, 2);
          L.px(rd(cs(a) * 14) - 1, rd(sn(a) * 14) - 1, 3, 3, '#ffffff');
        }
        if (st >= 5) {
          for (let i = 0; i < 6; i++) arm(i * PI / 3 + PI / 6, len * .6, 1);
        }
        L.ell(0, 0, 5, 5, '#ffffff');
        L.ell(0, 0, 3, 3, c[0]);
      });
    });
  }

  const groundF = st => M('ig' + st, () => {
    const c = ICEP[st];
    return mkF(100, 56, 50, 28, L => {
      L.ell(0, 0, 40, 18, rgba('#bfeeff', .25));
      L.ell(0, 0, 28, 12, rgba('#ffffff', .2));
      for (let i = 0; i < 10; i++) {
        L.px(rd((hsh(i, 1) - .5) * 70), rd((hsh(i, 2) - .5) * 28), 2, 2, i % 2 ? '#ffffff' : c[1]);
      }
    });
  });

  function drawIce(e, p, st, lv) {
    const k = Math.min(1, p * 2.4), dx = e.x2 - e.x1, dy = e.y2 - e.y1, ang = Math.atan2(dy, dx);
    const sc = 1 + .02 * lv, nx = -sn(ang), ny = cs(ang), lt = lite();

    if (!e.sd) e.sd = Math.random() * 50;

    if (k < 1) {
      const ng = Math.min(8, 5 + st);
      for (let g = 0; g < ng; g++) {
        const kk = Math.max(0, k - g * .07);
        dr(iceF(st), e.x1 + dx * kk, e.y1 + dy * kk, ang, (1 - g / ng) * .55 * (1 - p), sc);
      }
      if (st >= 4 && !lt) {
        [-1, 1].forEach(sd => {
          for (let g = 0; g < 3; g++) {
            const kk = Math.max(0, k - g * .08), off = sd * 8 * sn(PI * kk);
            dr(iceF(st), e.x1 + dx * kk + nx * off, e.y1 + dy * kk + ny * off, ang, (1 - g / 3) * .8 * (1 - p), sc * .65);
          }
        });
      }
      if (st >= 3 && !lt) {
        for (let i = 0; i < 5; i++) {
          const t = Math.max(0, k - i * .05 - .03), o = (hsh(i, e.sd) - .5) * 10;
          dr(sparkF(i % 2 ? '#ffffff' : ICEP[st][1]), e.x1 + dx * t + nx * o, e.y1 + dy * t + ny * o, 0, (1 - p) * .9, .5 + .4 * hsh(i, 2));
        }
      }
      dr(iceF(st), e.x1 + dx * k, e.y1 + dy * k, ang, 1, sc);
    } else {
      const q = (p - .42) / .58;
      if (st >= 3) dr(groundF(st), e.x2, e.y2 + 5, 0, (1 - q) * .8, .5 + q * .6);
      dr(frostF(st), e.x2, e.y2, 0, 1 - q, .6 + q * .81 * (1 + .04 * st));
      if (st >= 5) dr(flatRing('ic5', ICEP[5][2], ICEP[5][1], '#b48aff'), e.x2, e.y2 + 3, 0, (1 - q) * .8, .3 + q * 1.1);
    }
  }

  /* ================= 5) ฟื้นฟูพลัง (หญิง L) ================= */
  function runeF(st, ph) {
    return M('hr' + st + '_' + ph, () => {
      const c = HLP[st], n = 6 + (st >= 3 ? 2 : 0);
      return mkF(120, 70, 60, 35, L => {
        for (let k = 0; k < 100; k++) {
          const a = k / 100 * PI * 2;
          L.px(rd(cs(a) * 54), rd(sn(a) * 27), 2, 2, c[0]);
          L.px(rd(cs(a) * 40), rd(sn(a) * 20), 1, 1, c[2]);
        }
        for (let k = 0; k < n; k++) {
          const a = k / n * PI * 2 + .3 + ph * .25 * (PI * 2 / n);
          L.px(rd(cs(a) * 47) - 1, rd(sn(a) * 23) - 1, 3, 3, c[1]);
          L.px(rd(cs(a) * 47), rd(sn(a) * 23), 1, 1, '#ffffff');
        }
        if (st >= 2) {
          for (let k = 0; k < 70; k++) {
            const a = k / 70 * PI * 2;
            L.px(rd(cs(a) * 30), rd(sn(a) * 15), 1, 1, c[1]);
          }
          for (let k = 0; k < 5; k++) {
            const a = -k / 5 * PI * 2 + .8 - ph * .25 * (PI * 2 / 5);
            L.px(rd(cs(a) * 30) - 1, rd(sn(a) * 15) - 1, 3, 3, c[0]);
          }
        }
      });
    });
  }

  const pillarF = st => M('hp' + st, () => {
    const c = HLP[st];
    return mkF(40, 110, 20, 104, L => {
      for (let j = 0; j < 100; j++) {
        const a = .32 * (1 - j / 100), s = Math.floor(j / 12);
        L.px(-14 + s, -j, 28 - 2 * s, 1, rgba(c[1], a));
        L.px(-14 + s, -j, 2, 1, rgba(c[0], Math.min(1, a * 2)));
        L.px(12 - s, -j, 2, 1, rgba(c[0], Math.min(1, a * 2)));
      }
    });
  });

  const haloF = () => M('hh5', () => mkF(72, 28, 36, 14, L => {
    for (let k = 0; k < 90; k++) {
      const a = k / 90 * PI * 2;
      L.px(rd(cs(a) * 28), rd(sn(a) * 8), 2, 2, '#ffe066');
      L.px(rd(cs(a) * 24), rd(sn(a) * 6), 1, 1, '#fff6c8');
    }
    for (let k = 0; k < 4; k++) {
      const a = k * PI / 2 + .4;
      L.px(rd(cs(a) * 28) - 1, rd(sn(a) * 8) - 1, 3, 3, '#ffffff');
    }
  }));

  function drawHeal(e, p, x, y, st, lv) {
    const c = HLP[st], lt = lite();
    dr(runeF(st, Math.floor(e.t * 10) % 4), x, y + 9, 0, 1 - p * .8, .5 + p * .9);
    if (st >= 3) dr(pillarF(st), x, y + 9, 0, sn(PI * p) * .58, 1);

    const n = lt ? 3 + st : 4 + st * 2;
    for (let i = 0; i < n; i++) {
      const k = (p * 1.2 + hsh(i, 5)) % 1, xx = x + sn(k * 6 + i * 2) * (8 + hsh(i, 3) * 10), yy = y + 8 - k * (28 + st * 4);
      dr(sparkF(i % 2 ? c[1] : c[0]), xx, yy, 0, sn(PI * k) * (1 - p * .5), .6 + .5 * (1 - k));
    }
    if (st >= 4 && !lt) {
      for (let h = 0; h < 2; h++) {
        for (let i = 0; i < 5; i++) {
          const t = i / 5, a = p * 8 + t * 5 + h * PI;
          dr(sparkF('#ffffff'), x + cs(a) * 10 * (1 - t * .4), y + 8 - t * 34 - p * 6, 0, (1 - p) * .9, .5);
        }
      }
    }
    if (st >= 5) dr(haloF(), x, y - 24 - p * 8, 0, sn(PI * Math.min(1, p * 1.3)) * .9, 1);
  }

  /* ================= 6) สายฟ้าฟาด (หญิง I) ================= */
  function boltPF(ox, oy, targets, st) {
    const pts = [{ x: ox, y: oy }].concat(targets.map(t => ({ x: t.x, y: t.y })));
    return pathFrame(pts, 30, (L, m) => {
      const c = BOLTP[st], jit = 14 + (st >= 3 ? 4 : 0), tw = [5, 6, 6, 7, 8, 9][st], mw = [3, 3, 4, 4, 5, 5][st], rand = Math.random;

      const build = jt => {
        const seg = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const A = m(pts[i]), B = m(pts[i + 1]), n = Math.max(3, rd(Math.hypot(B[0] - A[0], B[1] - A[1]) / 12));
          const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
          let prev = A;
          for (let k = 1; k <= n; k++) {
            const t = k / n, j = k === n ? 0 : (rand() - .5) * jt;
            const q = [rd(A[0] + dx * t + nx * j), rd(A[1] + dy * t + ny * j)];
            seg.push([prev, q]);
            prev = q;
          }
        }
        return seg;
      };

      const paint = (seg, wo, wm, wc, co, cm, cc) => {
        seg.forEach(([a, b]) => L.line(a[0], a[1], b[0], b[1], co, wo));
        seg.forEach(([a, b]) => L.line(a[0], a[1], b[0], b[1], cm, wm));
        seg.forEach(([a, b]) => L.line(a[0] + 1, a[1] + 1, b[0] + 1, b[1] + 1, cc, wc));
      };

      if (st >= 4) paint(build(jit + 4), Math.max(2, tw - 3), Math.max(1, mw - 2), 1, rgba(c[0], .75), c[1], c[2]);
      const main = build(jit);

      if (st >= 2) {
        const nb = Math.min(10, Math.floor(main.length / 3) + 1);
        for (let i = 0; i < nb; i++) {
          const s = main[Math.floor(rand() * main.length)], o = s[0], ang = rand() * PI * 2;
          const l1 = 8 + rand() * 8, l2 = 6 + rand() * 8;
          const p1 = [rd(o[0] + cs(ang) * l1), rd(o[1] + sn(ang) * l1)];
          const p2 = [rd(p1[0] + cs(ang + .7 * (rand() - .5) * 2) * l2), rd(p1[1] + sn(ang + .7 * (rand() - .5) * 2) * l2)];
          L.line(o[0], o[1], p1[0], p1[1], c[1], 2);
          L.line(p1[0], p1[1], p2[0], p2[1], c[1], 1);
          L.px(o[0], o[1], 1, 1, c[2]);
        }
      }

      paint(main, tw, mw, 1 + (st >= 3 ? 1 : 0), c[0], c[1], c[2]);

      pts.slice(1).forEach(p => {
        const q = m(p), r = 8 + st * 2;
        L.ell(q[0], q[1], r, r, mix(c[1], c[0], .4));
        L.ell(q[0], q[1], rd(r * .6), rd(r * .6), c[2]);
        if (st >= 3) {
          const s = 12 + st * 2;
          L.px(q[0] - s, q[1] - 1, s * 2 + 1, 2, c[1]);
          L.px(q[0] - 1, q[1] - s, 2, s * 2 + 1, c[1]);
          L.px(q[0] - 3, q[1] - 3, 7, 7, c[2]);
        }
      });

      if (st >= 5) {
        for (let i = 0; i < 14; i++) {
          const s = main[Math.floor(rand() * main.length)];
          L.px(rd(s[0][0] + (rand() - .5) * 24), rd(s[0][1] + (rand() - .5) * 24), 2, 2, i % 2 ? '#ffffff' : c[1]);
        }
      }
    });
  }

  function bolt(ox, oy, targets) {
    if (OFF || P.g !== 'f') return false;
    const st = stI(2);
    if (!st) return false;
    fx.push({ k: 'bolt', x: 0, y: 0, t: 0, life: .32 + .03 * st, pf: boltPF(ox, oy, targets, st) });
    if (st >= 3) {
      targets.slice(0, 4).forEach(t => fx.push({ k: 'skimp', x: t.x, y: t.y, t: 0, life: .4, st }));
    }
    return true;
  }

  function drawImpact(e, p, x, y) {
    const st = e.st, c = BOLTP[st];
    dr(flatRing('bt' + st, c[0], c[1], c[2]), x, y + 4, 0, (1 - p) * .9, .3 + p * .9);
    if (st >= 4) {
      for (let i = 0; i < 4; i++) {
        const a = i * PI / 2 + PI / 4;
        dr(sparkF(c[1]), x + cs(a) * p * 14, y + sn(a) * p * 10, 0, 1 - p, .8);
      }
    }
  }

  /* ================= Hooks เข้าสู่ art_fx.js ================= */
  function proj(p, ang) {
    if (OFF || P.g !== 'm' || p.ice) return false;
    const st = stI(0);
    if (!st) return false;
    drawFireProj(p, ang, st, lvOf(0));
    return true;
  }

  function fxHook(e, p, x, y) {
    if (OFF) return false;
    if (e.k === 'skimp') { drawImpact(e, p, x, y); return true; }
    if (e.k === 'boom') {
      if (P.g !== 'm') return false;
      const st = stI(0);
      if (!st) return false;
      drawBoom(e, p, x, y, st, lvOf(0));
      return true;
    }
    if (e.k === 'ice') {
      if (P.g !== 'f') return false;
      const st = stI(0);
      if (!st) return false;
      drawIce(e, p, st, lvOf(0));
      return true;
    }
    if (e.k === 'ring') {
      if (e.sk === 'whirl') {
        const st = stI(1);
        if (!st) return false;
        drawWhirl(e, p, x, y, st, lvOf(1));
        return true;
      }
      if (e.sk === 'dash') {
        const st = stI(2);
        if (!st) return false;
        drawDashShock(e, p, x, y, st);
        return true;
      }
      if (e.sk === 'heal') {
        const st = stI(1);
        if (!st) return false;
        drawHeal(e, p, x, y, st, lvOf(1));
        return true;
      }
    }
    return false;
  }

  /* ---------- แท็กวงแหวนสกิลเพื่อแยกประเภท ---------- */
  function tagRing(life, gold, tag, extra) {
    for (let i = fx.length - 1; i >= 0 && i >= fx.length - 8; i--) {
      const e = fx[i];
      if (e.k === 'ring' && !e.sk && !!e.gold === gold && Math.
