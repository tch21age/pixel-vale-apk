'use strict';
/* =====================================================================
   ART FX (กลุ่ม 4 Remastered): เอฟเฟกต์สกิล 6 อย่าง + ฟันดาบ + ระเบิด + เลเวลอัป
   Classic RPG / Retro Fantasy / High-Impact Pixel Art Remaster
   - สีโทนคลาสสิก: Dark Crimson, Antique Gold, Pure Cream, Frost Blue, Deep Forest, Charcoal
   - ไม่ใช้ shadowBlur หรือ Filter นุ่ม ใช้ Pixel Art Shading & Crisp Clusters 100%
   - คมชัด ไม่เบลอใน Canvas ความละเอียด 384x224
   - รักษา Combat Logic, MP, Cooldown, Hitbox และ Global API เดิม 100%
   ===================================================================== */
(function () {
  const PI = Math.PI, cache = {};
  const mem = (k, f) => cache[k] || (cache[k] = f());

  const mkF = (w, h, ax, ay, fn, ol) => {
    const L = GFX.layer(w, h, ax, ay);
    fn(L);
    if (ol) L.outline(.5, ol);
    return GFX.frame(L);
  };

  function drawRot(f, x, y, ang, alpha, sc) {
    ctx.save();
    ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS);
    if (ang) ctx.rotate(ang);
    if (sc && sc !== 1) ctx.scale(sc, sc);
    if (alpha !== undefined) ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(f.b || f.c, -f.ax / RS, -f.ay / RS, f.w / RS, f.h / RS);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---------- 1. วงดาบคลาสสิก (Sharp Arc Blade Slash) ---------- */
  function slashFrame(a, s, step) {
    return mem('sl' + Math.round(a * 100) + '_' + s + '_' + step, () => mkF(96, 96, 48, 48, L => {
      const p = (step + .5) / 6, a0 = a + s * (-1.28), span = 2.55 * Math.min(1, p * 1.6 + .3), tmax = span / 2.55;

      for (let k = 0; k <= 72; k++) {
        const t = k / 72;
        if (t > tmax) break;
        const u = t / tmax, ang = a0 + s * t * 2.55, tp = Math.sin(PI * Math.min(1, u * .9 + .06));
        const rOut = 43, rIn = Math.round(43 - 3 - tp * 13);

        for (let rad = rIn; rad <= rOut; rad++) {
          const q = (rad - rIn) / Math.max(1, rOut - rIn);
          // ชั้นสี: สันขาวเจิดจ้า -> ครีม -> ทองโบราณ -> โครงเงาเหล็ก
          const col = q > .78 ? '#ffffff' : (q > .50 ? '#f5edd8' : (q > .22 ? '#c9962e' : '#454c5e'));
          L.px(Math.round(Math.cos(ang) * rad), Math.round(Math.sin(ang) * rad), 2, 2, col);
        }
      }

      // ปลายคมดาบและสะเก็ดพลังเฉือน
      const tipAng = a0 + s * span;
      const tx = Math.round(Math.cos(tipAng) * 43), ty = Math.round(Math.sin(tipAng) * 43);
      L.px(tx, ty, 3, 3, '#ffffff');
      L.px(Math.round(Math.cos(tipAng) * 40), Math.round(Math.sin(tipAng) * 40), 2, 2, '#fae078');
      L.px(Math.round(Math.cos(tipAng) * 37), Math.round(Math.sin(tipAng) * 37), 1, 1, '#c9962e');
    }));
  }

  /* ---------- 2. ลูกไฟ & เพลิงระเบิด (Fireball & Heavy Explosion) ---------- */
  function fireFrame(f) {
    return mem('fb' + f, () => mkF(72, 40, 52, 20, L => {
      const w = Math.sin(f * PI / 2) * 2;

      // หางเปลวไฟสะบัดเป็นก้อนพิกเซลไล่ระดับ
      [
        ['#290b07', 6, 5],
        ['#781d14', 5, 4],
        ['#b83e14', 4, 3],
        ['#db711a', 3, 2]
      ].forEach(([c, rx, ry], i) => {
        const n = 5 - i;
        for (let k = n; k >= 1; k--) {
          L.ell(-9 - k * 6 + i, Math.round(w * (k % 2 ? 1 : -1)), Math.max(1, rx - k + 2), Math.max(1, ry - Math.floor(k / 2)), c);
        }
      });

      // แกนลูกไฟ 5 ชั้นประกายจัด
      L.ell(0, 0, 10, 10, '#2b0c08');
      L.ell(0, 0, 9, 9, '#822016');
      L.ell(0, 0, 7, 7, '#c64718');
      L.ell(0, 0, 5, 5, '#db8f24');
      L.ell(0, 0, 3, 3, '#f7e199');
      L.px(-1, -1, 3, 3, '#ffffff');
    }));
  }

  function iceFrame() {
    return mem('ice', () => mkF(44, 24, 24, 12, L => {
      // หางผลึกน้ำแข็ง
      L.px(-15, -1, 9, 2, '#162542');
      L.px(-11, -1, 7, 2, '#244375');
      // ลิ่มผลึกน้ำแข็งตัดเหลี่ยมคมกริบ
      L.ell(0, 0, 11, 4, '#162542');
      L.ell(0, 0, 10, 3, '#2f578f');
      L.ell(1, 0, 8, 2, '#74b2e8');
      L.px(-3, 0, 10, 1, '#dcf2ff');
      L.px(10, 0, 3, 1, '#ffffff');
      // ประกายเหลี่ยมแก้วสะท้อนแสง
      L.px(2, -3, 2, 1, '#74b2e8');
      L.px(2, 3, 2, 1, '#74b2e8');
      L.px(3, -2, 1, 1, '#ffffff');
    }, '#0b1424'));
  }

  function boomFrame(st) {
    return mem('bm' + st, () => mkF(112, 112, 56, 56, L => {
      const r = 8 + st * 8;

      // ควันดำและขอบระเบิด
      if (st >= 3) L.ell(0, -2, r + 2, r, 'rgba(30,16,14,.68)');
      L.ell(0, 0, r, r, '#59140f');
      L.ell(0, 0, Math.round(r * .8), Math.round(r * .8), '#962d16');
      L.ell(0, 0, Math.round(r * .6), Math.round(r * .6), '#c4571a');
      L.ell(0, 0, Math.round(r * .4), Math.round(r * .4), '#db992a');
      if (st < 4) {
        L.ell(0, 0, Math.round(r * .2), Math.round(r * .2), '#f7e7ba');
        L.px(-1, -1, 3, 3, '#ffffff');
      }

      // สะเก็ดเพลิงแตกกระจายรอบทิศ
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * PI * 2 + st * .3, d = r + 3 + st * 2;
        L.px(Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d), 3, 3, i % 2 ? '#c4571a' : '#db992a');
        L.px(Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d), 1, 1, '#ffffff');
      }
    }));
  }

  /* ---------- 3. ดาบหมุน คลื่นกระแทก วงเวทรูน และดาว ---------- */
  function whirlFrame() {
    return mem('wh', () => mkF(160, 160, 80, 80, L => {
      // คมดาบ 3 ทิศซ้อนประสานกัน
      for (let b = 0; b < 3; b++) {
        const base = b * PI * 2 / 3;
        for (let k = 0; k <= 42; k++) {
          const t = k / 42, ang = base + t * 1.5, tp = Math.sin(PI * t);
          for (let rad = Math.round(60 - tp * 6); rad <= 64; rad++) {
            const q = (rad - (60 - tp * 6)) / Math.max(1, (64 - (60 - tp * 6)));
            const col = q > .72 ? '#ffffff' : (q > .36 ? '#f5edd8' : '#c9962e');
            L.px(Math.round(Math.cos(ang) * rad), Math.round(Math.sin(ang) * rad), 2, 2, col);
          }
        }
      }
      // ประกายรอยฟันเหล็ก
      for (let k = 0; k < 64; k++) {
        const a = k / 64 * PI * 2;
        if (k % 3) L.px(Math.round(Math.cos(a) * 50), Math.round(Math.sin(a) * 50), 1, 1, k % 2 ? '#5b6475' : '#c9962e');
      }
    }));
  }

  function shockFrame() {
    return mem('sk', () => mkF(120, 70, 60, 35, L => {
      // คลื่นวงแหวนรูปไข่กระแทกพื้น
      for (let k = 0; k < 90; k++) {
        const a = k / 90 * PI * 2;
        L.px(Math.round(Math.cos(a) * 52), Math.round(Math.sin(a) * 26), 2, 2, '#f5edd8');
        L.px(Math.round(Math.cos(a) * 48), Math.round(Math.sin(a) * 24), 2, 1, '#c9962e');
        L.px(Math.round(Math.cos(a) * 44), Math.round(Math.sin(a) * 22), 1, 1, '#4d3f32');
      }
      // เศษหินดินแตกกระจาย
      [[-32, -10], [35, -8], [-18, 12], [22, 14]].forEach(([dx, dy]) => {
        L.px(dx, dy, 2, 2, '#7a5d3e');
        L.px(dx + 1, dy + 1, 1, 1, '#f5edd8');
      });
    }));
  }

  function runeFrame(gold) {
    return mem('ru' + gold, () => mkF(120, 70, 60, 35, L => {
      const c1 = gold ? '#c9962e' : '#558750';
      const c2 = gold ? '#f5edd8' : '#d2ebd0';
      const c3 = gold ? '#634412' : '#244222';

      for (let k = 0; k < 100; k++) {
        const a = k / 100 * PI * 2;
        L.px(Math.round(Math.cos(a) * 54), Math.round(Math.sin(a) * 27), 2, 2, c1);
        L.px(Math.round(Math.cos(a) * 40), Math.round(Math.sin(a) * 20), 1, 1, c3);
      }
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * PI * 2 + .3;
        L.px(Math.round(Math.cos(a) * 47) - 1, Math.round(Math.sin(a) * 23) - 1, 3, 3, c2);
        L.px(Math.round(Math.cos(a) * 47), Math.round(Math.sin(a) * 23), 1, 1, '#ffffff');
      }
    }));
  }

  function plusFrame(gold) {
    return mem('pl' + gold, () => mkF(16, 16, 8, 8, L => {
      const c = gold ? '#d9a738' : '#69a364';
      const cDark = gold ? '#634412' : '#244222';
      L.px(-2, -5, 5, 11, cDark);
      L.px(-5, -2, 11, 5, cDark);
      L.px(-1, -4, 3, 9, c);
      L.px(-4, -1, 9, 3, c);
      L.px(0, -3, 1, 7, '#ffffff');
      L.px(-3, 0, 7, 1, '#ffffff');
    }));
  }

  function frostFrame() {
    return mem('fr', () => mkF(56, 56, 28, 28, L => {
      // ดอกผลึกน้ำแข็ง 6 แฉกพร้อมประกายเพชร
      for (let i = 0; i < 6; i++) {
        const a = i * PI / 3, x = Math.round(Math.cos(a) * 22), y = Math.round(Math.sin(a) * 22);
        L.line(0, 0, x, y, '#244375', 3);
        L.line(0, 0, x, y, '#74b2e8', 1);
        L.px(Math.round(Math.cos(a) * 14) - 1, Math.round(Math.sin(a) * 14) - 1, 3, 3, '#dcf2ff');
        L.px(Math.round(Math.cos(a) * 14), Math.round(Math.sin(a) * 14), 1, 1, '#ffffff');
      }
      L.ell(0, 0, 6, 6, '#244375');
      L.ell(0, 0, 4, 4, '#74b2e8');
      L.ell(0, 0, 2, 2, '#ffffff');
    }));
  }

  function starFrame() {
    return mem('st', () => mkF(64, 64, 32, 32, L => {
      // ดาวเลเวลอัป 4 แฉก
      for (let k = 0; k < 4; k++) {
        const a = k * PI / 2;
        L.line(0, 0, Math.round(Math.cos(a) * 22), Math.round(Math.sin(a) * 22), '#c9962e', 3);
        L.line(0, 0, Math.round(Math.cos(a) * 20), Math.round(Math.sin(a) * 20), '#f5edd8', 1);
      }
      L.ell(0, 0, 7, 7, '#7a5611');
      L.ell(0, 0, 5, 5, '#c9962e');
      L.ell(0, 0, 3, 3, '#ffffff');
    }));
  }

  /* ---------- 4. Frame จาก Path สำหรับสกิลสายฟ้าและพุ่งชน ---------- */
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
    fn(L, p => [Math.round((p.x - x0) * RS), Math.round((p.y - y0) * RS)]);
    return { f: GFX.frame(L), x: x0, y: y0 };
  }

  function boltFx(ox, oy, targets) {
    if (window.SKILL_FX && SKILL_FX.bolt(ox, oy, targets)) return;
    const pts = [{ x: ox, y: oy }].concat(targets.map(t => ({ x: t.x, y: t.y })));

    const pf = pathFrame(pts, 14, (L, m) => {
      const seg = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const A = m(pts[i]), B = m(pts[i + 1]);
        const n = Math.max(3, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 12));
        const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        let prev = A;

        for (let k = 1; k <= n; k++) {
          const t = k / n;
          // หักมุมซิกแซกอย่างมีมิติ
          const j = k === n ? 0 : (((k % 2 === 0 ? 1 : -1) * 7) + ((k * 3) % 5 - 2));
          const q = [Math.round(A[0] + dx * t + nx * j), Math.round(A[1] + dy * t + ny * j)];
          seg.push([prev, q]);
          prev = q;
        }
      }

      // ลำสายฟ้าแกนคม: Deep Blue -> Radiant Cyan -> Pale White
      seg.forEach(([a, b]) => L.line(a[0], a[1], b[0], b[1], '#152545', 5));
      seg.forEach(([a, b]) => L.line(a[0], a[1], b[0], b[1], '#4371ab', 3));
      seg.forEach(([a, b]) => L.line(a[0], a[1], b[0], b[1], '#d4e7f7', 1));
      seg.forEach(([a, b]) => L.line(a[0] + 1, a[1] + 1, b[0] + 1, b[1] + 1, '#ffffff', 1));

      pts.slice(1).forEach(p => {
        const q = m(p);
        L.ell(q[0], q[1], 8, 8, '#152545');
        L.ell(q[0], q[1], 5, 5, '#74b2e8');
        L.ell(q[0], q[1], 3, 3, '#ffffff');
      });
    });

    fx.push({ k: 'bolt', x: 0, y: 0, t: 0, life: .32, pf });
  }

  function dashFx(x0, y0, x1, y1) {
    if (window.SKILL_FX && SKILL_FX.dash(x0, y0, x1, y1)) return;
    const pf = pathFrame([{ x: x0, y: y0 }, { x: x1, y: y1 }], 14, (L, m) => {
      const A = m({ x: x0, y: y0 }), B = m({ x: x1, y: y1 });
      const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;

      // ลายทางพุ่งดาบคมกริบ
      for (let o = -6; o <= 6; o += 3) {
        const sh = (Math.abs(o) < 4 ? 1 : .6);
        const sx = A[0] + nx * o + dx * (1 - sh) * .5;
        const sy = A[1] + ny * o + dy * (1 - sh) * .5;
        L.line(Math.round(sx), Math.round(sy), Math.round(B[0] + nx * o), Math.round(B[1] + ny * o), Math.abs(o) < 4 ? '#ffffff' : '#f5edd8', Math.abs(o) < 4 ? 2 : 1);
        L.line(Math.round(sx), Math.round(sy), Math.round(B[0] + nx * o), Math.round(B[1] + ny * o), '#c9962e', 1);
      }

      // ฝุ่นดินที่เท้าจุดออกตัว
      L.ell(A[0], A[1], 7, 5, '#4d3f32');
      L.ell(A[0] - 3, A[1] + 2, 5, 4, '#33271e');
      L.ell(A[0] + 4, A[1] - 2, 4, 3, '#78624a');
    });

    fx.push({ k: 'dash', x: 0, y: 0, t: 0, life: .3, pf });
  }

  /* ---------- 5. Global Hooks: drawProj & drawFx ---------- */
  window.drawProj = drawProj = function () {
    for (const p of proj) {
      const ang = Math.atan2(p.vy, p.vx);
      if (window.SKILL_FX && SKILL_FX.proj(p, ang)) continue;
      if (p.ice) drawRot(iceFrame(), p.x, p.y, ang);
      else drawRot(fireFrame(Math.floor(S.t * 16) % 4), p.x, p.y, ang);
    }
  };

  window.drawFx = drawFx = function () {
    for (const e of fx) {
      if (e.t < 0) continue;
      const p = e.t / e.life, x = e.x, y = e.y;

      if (window.SKILL_FX && SKILL_FX.fx(e, p, x, y)) continue;

      if (e.k === 'slash' && window.SWORD_FX && SWORD_FX.slash(e, p, x, y)) {
        // Handled by SWORD_FX
      } else if (e.k === 'slash') {
        GFX.draw(ctx, slashFrame(e.a, e.s, Math.min(5, Math.floor(p * 6))), x, y, false, null, 1 - p * .9);
      } else if (e.k === 'boom') {
        GFX.draw(ctx, boomFrame(Math.min(4, Math.floor(p * 5))), x, y, false, null, 1 - Math.max(0, p - .5));
      } else if (e.k === 'ring') {
        const L = e.life;
        if (e.gold && L > .55) {
          GFX.draw(ctx, runeFrame(1), x, y + 9, false, null, 1 - p);
          drawRot(starFrame(), x, y - 4 - p * 10, p * 1.5, 1 - p, .5 + p * .6);
        } else if (e.gold) {
          drawRot(runeFrame(0), x, y + 9, 0, 1 - p * .8, .5 + p * .9);
        } else if (L > .33) {
          drawRot(whirlFrame(), x, y, p * PI * 3.2, 1 - p * .7, .45 + p * .55);
        } else {
          drawRot(shockFrame(), x, y + 4, 0, 1 - p, .4 + p * .9);
        }
      } else if (e.k === 'mote') {
        const yy = y - p * 22, xx = x + Math.sin(p * 7 + e.ph) * 3;
        GFX.draw(ctx, plusFrame(e.gold), xx, yy, false, null, p < .15 ? p / .15 : 1 - Math.max(0, (p - .6) / .4));
      } else if (e.k === 'ice') {
        const k = Math.min(1, p * 2.4), dx = e.x2 - e.x1, dy = e.y2 - e.y1, ang = Math.atan2(dy, dx);
        if (k < 1) {
          for (let g = 0; g < 5; g++) {
            const kk = Math.max(0, k - g * .07);
            drawRot(iceFrame(), e.x1 + dx * kk, e.y1 + dy * kk, ang, (1 - g / 5) * .55 * (1 - p));
          }
          drawRot(iceFrame(), e.x1 + dx * k, e.y1 + dy * k, ang, 1);
        } else {
          drawRot(frostFrame(), e.x2, e.y2, 0, 1 - (p - .42) / .58, .6 + (p - .42) * 1.4);
        }
      } else if (e.k === 'bolt' || e.k === 'dash') {
        const f = e.pf;
        GFX.draw(ctx, f.f, f.x, f.y, false, null, (Math.floor(e.t * 34) % 2 ? 1 : .65) * (1 - p * p));
      }
    }
  };

  /* ---------- 6. Wrappers สกิล: เพิ่ม FX เมื่อร่ายสำเร็จ ---------- */
  const _f = tryFire, _s = trySpin, _k = trySk3;

  tryFire = function () {
    if (P.g !== 'f') return _f();
    const ox = P.x, oy = P.y - 8, d = DIRS[P.dir];
    let hit = null, bd = 130;

    for (const m of foes()) {
      const vx = m.x - ox, vy = cy(m) - oy, al = vx * d.x + vy * d.y, pp = Math.abs(vx * d.y - vy * d.x);
      if (al > 0 && al < bd && pp < 13) { bd = al; hit = m; }
    }

    const mp = P.mp;
    _f();
    if (P.mp < mp) {
      const L = hit ? bd : 130;
      fx.push({ k: 'ice', x: 0, y: 0, t: 0, life: .4, x1: ox + d.x * 8, y1: oy + d.y * 8, x2: ox + d.x * L, y2: oy + d.y * L });
    }
  };

  trySpin = function () {
    const mp = P.mp;
    _s();
    if (P.g === 'f' && P.mp < mp) {
      for (let i = 0; i < 6; i++) {
        fx.push({ k: 'mote', x: P.x + (i - 2.5) * 4, y: P.y - 2, t: -i * .07, life: .8, ph: i * 1.7, gold: i % 2 });
      }
    }
  };

  trySk3 = function () {
    const ox = P.x, oy = P.y - 8, mp = P.mp;
    let tg = null;

    if (P.g === 'f') {
      tg = foes()
        .filter(m => Math.hypot(m.x - ox, cy(m) - oy) < 90)
        .sort((a, b) => Math.hypot(a.x - ox, cy(a) - oy) - Math.hypot(b.x - ox, cy(b) - oy))
        .slice(0, 4)
        .map(m => ({ x: m.x, y: cy(m) }));
    }

    _k();
    if (P.mp >= mp) return;

    if (P.g === 'f') {
      if (tg && tg.length) boltFx(ox, oy, tg);
    } else if (Math.hypot(P.x - ox, P.y - 8 - oy) > 2) {
      dashFx(ox, oy, P.x, P.y - 8);
    }
  };

  /* ---------- 7. Warm-up Cache ---------- */
  let warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    const q = f => GFX.later(() => GFX.touch(f()));

    [[0, 1], [PI / 2, 1], [PI, -1], [-PI / 2, 1]].forEach(([a, s]) => {
      for (let st = 0; st < 6; st++) q(() => slashFrame(a, s, st));
    });
    for (let f = 0; f < 4; f++) q(() => fireFrame(f));
    q(iceFrame);
    for (let st = 0; st < 5; st++) q(() => boomFrame(st));
    q(whirlFrame);
    q(shockFrame);
    q(() => runeFrame(0));
    q(() => runeFrame(1));
    q(() => plusFrame(0));
    q(() => plusFrame(1));
    q(frostFrame);
    q(starFrame);
  }

  /* Public API Exposure */
  window.FX_ART = {
    boltFx,
    dashFx,
    slashFrame,
    fireFrame,
    boomFrame,
    whirlFrame,
    runeFrame,
    frostFrame,
    warm
  };
})();
