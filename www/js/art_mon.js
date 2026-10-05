'use strict';
/* =====================================================================
   ART: มอนสเตอร์ — slime, king, goblin, wolf, boar, bat, skel, golem
   Classic RPG / Old-school JRPG Pixel Art Remaster
   - Multi-tone pixel shading (Base, Shadow, Highlight, Specular & Dark Outlines)
   - แสงส่องจากทิศบนซ้าย (Top-Left Light Source) กลมกลืนกับ Player และ Environment
   - ปรับ Silhouette ให้จดจำง่าย คมชัดทุกตัวละครในความละเอียด 384x224
   - รักษาโครงสร้าง MON_PAL, MON_ART, drawMon เดิม 100% ไม่กระทบ Gameplay/Hitbox
   ===================================================================== */
const MON_PAL = {
  slime: '#3282c4', slimeD: '#1a4978', slimeH: '#7fd0f7', slimeSpec: '#e2f6ff',
  gskin: '#4a8536', gskinD: '#26541c', gskinH: '#72b350', vest: '#4e331c', vestD: '#2d1b0d', vestH: '#755030',
  horn: '#c4b59b', club: '#633d20', clubD: '#3b200c', clubH: '#855631', dark: '#120d13',
  wolf: '#5f6572', wolfL: '#acb2bf', wolfD: '#3a3e4a', wolfH: '#cfd4e3',
  boar: '#543624', boarD: '#301c10', boarH: '#754d35', snout: '#ad7664', tusk: '#eee4cb', tuskD: '#b3a589',
  bat: '#271c32', batW: '#3c2450', batWD: '#22132f', batWH: '#5d3d78', batEye: '#ff4848',
  bone: '#ded8c3', boneD: '#746d5a', boneH: '#fbf8ee', steel: '#7d8799', steelD: '#4d5563', steelH: '#b4c0d4',
  rock: '#5a5f73', rockL: '#777d94', rockD: '#373a48', rockH: '#9da4bc',
  crys: '#269ec4', crysL: '#82e2ff', crysD: '#125f7c', crysSpec: '#f0fbff',
  eyeY: '#eec432', eyeYH: '#fff982', red: '#dc3232', redD: '#821616', gold: '#c49228', goldH: '#f8dc70', goldD: '#7a5410'
};

(function () {
  const M = MON_PAL;
  const mk = (w = 72, h = 84, ax = 36, ay = 78) => GFX.layer(w, h, ax, ay);
  const comp = (parts, w, h, ax, ay) => {
    const F = mk(w, h, ax, ay);
    parts.forEach(p => F.blit(p));
    F.outline(.85);
    return GFX.frame(F);
  };

  function tri(L, x0, y0, x1, y1, x2, y2, col) {
    const mn = Math.min(y0, y1, y2), mx = Math.max(y0, y1, y2);
    for (let y = mn; y <= mx; y++) {
      const xs = [];
      [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]].forEach(([ax, ay, bx, by]) => {
        if (y >= Math.min(ay, by) && y <= Math.max(ay, by)) {
          if (ay === by) xs.push(ax, bx);
          else xs.push(ax + (bx - ax) * (y - ay) / (by - ay));
        }
      });
      if (xs.length) {
        const a = Math.round(Math.min(...xs)), b = Math.round(Math.max(...xs));
        L.px(a, y, b - a + 1, 1, col);
      }
    }
  }

  const thick = (L, x0, y0, x1, y1, col, t) => L.line(x0, y0, x1, y1, col, t);

  /* ---------------- 1. สไลม์ / ราชาสไลม์ (Translucent JRPG Pudding Blob) ---------------- */
  function slime(k, wind, big) {
    const sq = [0, 0.8, 0, -0.8][k % 4], s = big ? 1.65 : 1;
    const rx = Math.round((13 - sq * 1.8 + (wind ? 3.5 : 0)) * s);
    const ry = Math.round((9 + sq * 1.4 - (wind ? 3 : 0)) * s);
    const L = mk(64, 64, 32, 60);

    // 1.1 ฐานเงาและมวลวุ้นโปร่งแสง
    L.ell(0, -ry, rx, ry, M.slimeD);
    L.ell(0, -ry - 1, rx - 1, ry - 1, M.slime);
    L.ell(-1, -ry - 2, Math.max(1, rx - 2), Math.max(1, ry - 2), M.slimeH);

    // 1.2 แกนวุ้นชั้นใน (Darker Core)
    L.ell(0, -Math.round(ry * 0.55), Math.max(2, rx - 4), Math.max(1, Math.round(ry * 0.45)), M.slimeD);

    // 1.3 จุดสะท้อนแสงผิววุ้นเงางาม (Glossy Specular Glare)
    L.ell(-Math.round(rx * 0.42), -Math.round(ry * 1.55), Math.max(2, Math.round(rx * 0.22)), 2, M.slimeSpec);
    L.px(-Math.round(rx * 0.55), -Math.round(ry * 1.1), 2, 1, '#ffffff');
    L.px(Math.round(rx * 0.45), -Math.round(ry * 0.6), 1, 2, M.slimeH); // แสงสะท้อนขอบหลัง
    L.shade(1, .25, .32);

    // 1.4 ดวงตาลูกปัดแวววาว (JRPG Classic Eyes)
    const ey = -ry - Math.round(2 * s), ex = Math.round(5 * s);
    L.px(-ex - 1, ey, 3, 5, M.dark);
    L.px(ex - 1, ey, 3, 5, M.dark);
    L.px(-ex - 1, ey, 1, 2, '#ffffff'); // Catchlight
    L.px(ex - 1, ey, 1, 2, '#ffffff');
    L.px(-ex, ey + 3, 1, 1, M.slimeH);  // Inner pupil bounce
    L.px(ex, ey + 3, 1, 1, M.slimeH);

    // ปาก
    if (wind) {
      L.px(-2, ey + Math.round(5 * s), 5, 2, M.dark);
      L.px(-1, ey + Math.round(5 * s), 3, 1, '#ff6e6e');
    } else {
      L.px(-1, ey + Math.round(5.5 * s), Math.max(2, Math.round(3 * s)), 1, M.slimeD);
    }

    // 1.5 มงกุฎทองคำประดับทับทิมสำหรับราชาสไลม์ (King Slime Crown)
    if (big) {
      const t = -2 * ry + 1;
      L.px(-10, t - 2, 20, 4, M.goldD);
      L.px(-10, t - 3, 20, 3, M.gold);
      L.px(-9, t - 3, 18, 1, M.goldH);
      [-10, -3, 4].forEach(x => {
        tri(L, x, t - 2, x + 2, t - 2, x + 1, t - 8, M.gold);
        L.px(x + 1, t - 9, 1, 2, M.goldH);
      });
      // Center Gem
      L.px(-2, t - 1, 4, 3, M.redD);
      L.px(-1, t - 1, 2, 2, M.red);
      L.px(-1, t - 1, 1, 1, '#ffffff');
    }

    L.outline(.85);
    return GFX.frame(L);
  }

  /* ---------------- 2. ก็อบลิน (Fierce Forest Marauder) ---------------- */
  function goblin(view, pose, k) {
    const wind = pose === 'wind', sd = view === 's', b = (pose === 'walk' && k) ? -1 : 0, out = [];

    // 2.1 ขาและรองเท้าหนัง
    const lg = mk();
    if (sd) {
      const lo = k ? 3 : -3;
      lg.px(-3 - lo, -9, 4, 6, M.gskinD);
      lg.px(-4 - lo, -3, 6, 3, M.vestD);
      lg.px(-3 - lo, -2, 5, 1, M.vest);
      lg.px(-1 + lo, -9, 4, 6, M.gskin);
      lg.px(-1 + lo, -9, 1, 6, M.gskinH);
      lg.px(-1 + lo, -3, 7, 3, M.vestD);
      lg.px(0 + lo, -2, 6, 1, M.vest);
    } else {
      const a = k ? 2 : 0, c = k ? 0 : 2;
      lg.px(-6, -9 - a, 5, 6, M.gskinD);
      lg.px(1, -9 - c, 5, 6, M.gskinD);
      lg.px(-5, -9 - a, 2, 6, M.gskinH);
      lg.px(2, -9 - c, 2, 6, M.gskinH);
      lg.px(-7, -3 - a, 6, 3, M.vestD);
      lg.px(1, -3 - c, 6, 3, M.vestD);
      lg.px(-6, -2 - a, 5, 1, M.vest);
      lg.px(2, -2 - c, 5, 1, M.vest);
    }
    lg.shade(1).outline();

    // 2.2 ลำตัวและเสื้อกั๊กหนังสัตว์
    const tr = mk(), w = sd ? 10 : 14;
    tr.px(-w / 2, -22 + b, w, 13, M.vest);
    tr.px(-w / 2 + 1, -21 + b, w - 2, 1, M.vestD);
    tr.px(-w / 2 - 1, -12 + b, w + 2, 3, M.vestD);
    tr.px(-w / 2 + 1, -20 + b, 2, 7, M.vestH); // ตะเข็บเสื้อซ้าย
    if (view === 'd') {
      tr.px(-3, -19 + b, 6, 6, M.gskinD);
      tr.px(-2, -18 + b, 4, 4, M.gskin);
      tr.px(-1, -17 + b, 2, 2, M.gskinH);
    }
    // เข็มขัดหนังและหัวเข็มขัด
    tr.px(-w / 2, -13 + b, w, 2, M.dark);
    if (view === 'd') {
      tr.px(-1, -13 + b, 3, 2, M.gold);
      tr.px(0, -13 + b, 1, 1, M.goldH);
    }
    tr.shade(1).outline();

    // 2.3 กระบองไม้ติดหนามกระดูก (Spiked Heavy Club)
    const ang = wind ? -2.25 : (sd ? -1.2 : -1.5), hx = sd ? 5 : 9, hy = -14 + b - (wind ? 4 : 0);
    const cl = mk(), ca = Math.cos(ang), sa = Math.sin(ang), len = 21;
    thick(cl, hx, hy, Math.round(hx + ca * len), Math.round(hy + sa * len), M.club, 4);
    thick(cl, hx + Math.round(ca * 4), hy + Math.round(sa * 4), Math.round(hx + ca * len), Math.round(hy + sa * len), M.clubD, 2);
    const cx = Math.round(hx + ca * len), cy = Math.round(hy + sa * len);
    cl.ell(cx, cy, 5, 5, M.clubD);
    cl.ell(cx, cy, 4, 4, M.club);
    cl.px(cx - 1, cy - 2, 2, 2, M.clubH); // Highlight
    // หนามกระดูกแหลมคมรอบหัวกระบอง
    [[-4, -2], [3, 4], [4, -3], [-3, 4]].forEach(([sx, sy]) => {
      cl.px(cx + sx, cy + sy, 2, 2, M.boneH);
      cl.px(cx + sx, cy + sy, 1, 1, '#ffffff');
    });
    cl.shade(1).outline();

    // 2.4 แขนขวา (ถือกระบอง)
    const arR = mk();
    thick(arR, sd ? 2 : 8, -19 + b, hx, hy, M.gskin, 4);
    arR.px(hx - 1, hy - 1, 4, 4, M.gskinD);
    arR.px(hx, hy, 2, 2, M.gskinH);
    arR.shade(1).outline();

    // 2.5 แขนซ้าย
    const arL = mk();
    if (sd) {
      thick(arL, -1, -19 + b, -2, -11 + b, M.gskinD, 4);
    } else {
      thick(arL, -8, -19 + b, -10, -11 + b - (k ? 1 : 0), M.gskin, 4);
      arL.px(-11, -12 + b, 4, 4, M.gskinD);
      arL.px(-10, -11 + b, 2, 2, M.gskinH);
    }
    arL.shade(1).outline();

    // 2.6 หัว, หูยาว, และเขาเล็ก
    const hd = mk(), cxh = sd ? 1 : 0;
    hd.ell(cxh, -31 + b, sd ? 9 : 10, 7, M.gskinD);
    hd.ell(cxh, -32 + b, sd ? 8 : 9, 6, M.gskin);
    hd.ell(cxh - 1, -33 + b, sd ? 5 : 6, 3, M.gskinH); // Brow highlight
    if (view === 'u') hd.px(-3, -30 + b, 6, 2, M.gskinD);
    if (sd) {
      hd.px(-9, -34 + b, 5, 3, M.gskinD);
      hd.px(-12, -35 + b, 3, 2, M.gskin);
      hd.px(9, -31 + b, 4, 3, M.gskin);
    } else {
      hd.px(-15, -34 + b, 6, 3, M.gskinD);
      hd.px(-17, -35 + b, 3, 2, M.gskin);
      hd.px(9, -34 + b, 6, 3, M.gskinD);
      hd.px(14, -35 + b, 3, 2, M.gskin);
      hd.px(-14, -33 + b, 3, 1, M.gskinH);
      hd.px(11, -33 + b, 3, 1, M.gskinH);
    }
    // Horns (เขาสั้นคู่)
    hd.px(-6 + cxh, -44 + b, 2, 6, M.horn);
    hd.px(4 + cxh, -44 + b, 2, 6, M.horn);
    hd.px(-5 + cxh, -44 + b, 1, 5, M.boneH);
    hd.px(5 + cxh, -44 + b, 1, 5, M.boneH);
    hd.shade(1).outline();

    // 2.7 ใบหน้า ตาอำพัน และเขี้ยวล่าง
    const fc = mk();
    if (view !== 'u') {
      if (sd) {
        fc.px(2, -35 + b, 6, 1, M.dark);
        fc.px(3, -33 + b, 3, 3, M.eyeY);
        fc.px(4, -33 + b, 1, 1, M.eyeYH);
        fc.px(5, -33 + b, 1, 3, M.dark);
        fc.px(8, -29 + b, 3, 2, M.gskinD); // Snout
        if (wind) {
          fc.px(-1, -26 + b, 10, 3, M.dark);
          fc.px(1, -27 + b, 2, 3, M.boneH);
          fc.px(6, -27 + b, 2, 3, M.boneH);
        } else {
          fc.px(1, -26 + b, 8, 1, M.dark);
          fc.px(6, -27 + b, 2, 2, M.boneH);
        }
      } else {
        fc.px(-7, -35 + b, 5, 1, M.dark);
        fc.px(2, -35 + b, 5, 1, M.dark);
        fc.px(-6, -33 + b, 4, 3, M.eyeY);
        fc.px(2, -33 + b, 4, 3, M.eyeY);
        fc.px(-5, -33 + b, 1, 1, M.eyeYH);
        fc.px(3, -33 + b, 1, 1, M.eyeYH);
        fc.px(-4, -33 + b, 1, 3, M.dark);
        fc.px(3, -33 + b, 1, 3, M.dark);
        fc.px(-1, -30 + b, 2, 2, M.gskinD); // Nose
        if (wind) {
          fc.px(-5, -27 + b, 10, 4, M.dark);
          fc.px(-4, -27 + b, 2, 2, M.boneH);
          fc.px(2, -27 + b, 2, 2, M.boneH);
          fc.px(-2, -24 + b, 4, 1, M.redD);
        } else {
          fc.px(-5, -26 + b, 10, 1, M.dark);
          fc.px(-4, -27 + b, 2, 2, M.boneH);
          fc.px(2, -27 + b, 2, 2, M.boneH);
        }
      }
    }
    if (wind) {
      fc.px(sd ? 3 : -6, -33 + b, sd ? 3 : 4, 1, M.red);
      if (!sd) fc.px(2, -33 + b, 4, 1, M.red);
    }

    if (view === 'd') out.push(lg, tr, arL, hd, fc, arR, cl);
    else if (view === 'u') out.push(cl, lg, tr, arL, arR, hd, fc);
    else out.push(arL, lg, tr, hd, fc, arR, cl);
    return comp(out, 72, 84, 36, 78);
  }

  /* ---------------- 3. หมาป่า (Dire Wolf with Layered Fur) ---------------- */
  function wolf(k, wind) {
    const out = [], b = wind ? 1 : 0;

    // 3.1 ขาและกรงเล็บ
    const lg = mk(72, 60, 34, 56);
    [[-11, 0], [-7, .5], [6, .25], [10, .75]].forEach(([x, ph], i) => {
      const s = Math.sin((k / 4 + ph) * 6.283), lift = Math.cos((k / 4 + ph) * 6.283) > .3 ? 2 : 0;
      const col = i % 2 ? M.wolf : M.wolfD;
      thick(lg, x, -12, x + Math.round(s * 3), -3 - lift, col, 3);
      lg.px(x + Math.round(s * 3) - 1, -3 - lift, 4, 3, M.dark);
    });
    lg.shade(1).outline();

    // 3.2 หางปุย
    const tl = mk(72, 60, 34, 56);
    thick(tl, -13, -19, -21, -26 + (k % 2), M.wolfD, 4);
    tl.ell(-22, -27 + (k % 2), 5, 4, M.wolf);
    tl.px(-23, -28 + (k % 2), 2, 2, M.wolfH);
    tl.shade(1).outline();

    // 3.3 ลำตัวและแผงขนหลัง
    const bd = mk(72, 60, 34, 56);
    bd.ell(-1, -17 + b, 15, 7, M.wolfD);
    bd.ell(-1, -15 + b, 13, 5, M.wolf);
    bd.ell(-1, -13 + b, 11, 3, M.wolfL); // Belly fur
    bd.ell(-5, -21 + b, 8, 3, M.wolfH);  // Spine highlight
    // ขนข้างลำตัวเป็นริ้ว
    for (let fx = -8; fx <= 4; fx += 4) {
      bd.px(fx, -19 + b, 2, 1, M.wolfH);
      bd.px(fx + 1, -18 + b, 1, 1, M.wolf);
    }
    bd.shade(1).outline();

    // 3.4 หัว หู และขากรรไกร
    const hd = mk(72, 60, 34, 56);
    hd.ell(14, -22 + b, 7, 6, M.wolfD);
    hd.ell(14, -23 + b, 6, 5, M.wolf);
    hd.px(18, -22 + b, 9, 5, M.wolfL);
    hd.px(26, -22 + b, 3, 3, M.dark); // Black nose
    hd.px(26, -22 + b, 1, 1, M.wolfH);
    // หูตั้งปลายแหลม
    tri(hd, 10, -27 + b, 12, -35 + b, 15, -27 + b, M.wolfD);
    tri(hd, 15, -27 + b, 18, -34 + b, 20, -26 + b, M.wolf);
    hd.px(16, -31 + b, 1, 3, M.wolfH);
    if (wind) {
      hd.px(19, -18 + b, 8, 3, M.redD);
      hd.px(20, -19 + b, 2, 3, M.boneH); // Fangs
      hd.px(24, -19 + b, 2, 3, M.boneH);
    } else {
      hd.px(19, -18 + b, 7, 1, M.dark);
      hd.px(23, -18 + b, 1, 2, M.boneH);
    }
    hd.shade(1).outline();

    // 3.5 ดวงตานักล่า
    const ey = mk(72, 60, 34, 56);
    ey.px(16, -25 + b, 3, 2, wind ? M.red : M.eyeY);
    ey.px(16, -25 + b, 1, 1, M.eyeYH);
    ey.px(18, -25 + b, 1, 2, M.dark);

    out.push(tl, lg, bd, hd, ey);
    return comp(out, 72, 60, 34, 56);
  }

  /* ---------------- 4. หมูป่า (Tough Armored Boar) ---------------- */
  function boar(k, wind) {
    const out = [], b = wind ? 1 : 0;

    // 4.1 ขาหนึกแน่น
    const lg = mk(72, 60, 34, 56);
    [[-11, 0], [-6, .5], [7, .25], [12, .75]].forEach(([x, ph], i) => {
      const s = Math.sin((k / 4 + ph) * 6.283), lift = Math.cos((k / 4 + ph) * 6.283) > .3 ? 2 : 0;
      const col = i % 2 ? M.boarD : M.dark;
      thick(lg, x, -11, x + Math.round(s * 2), -3 - lift, col, 4);
      lg.px(x + Math.round(s * 2) - 1, -3 - lift, 5, 3, M.dark);
    });
    lg.shade(1).outline();

    // 4.2 ลำตัวหนาแน่นและแผงคอขนแปรง
    const bd = mk(72, 60, 34, 56);
    bd.ell(-1, -17 + b, 16, 9, M.boarD);
    bd.ell(-1, -16 + b, 14, 7, M.boar);
    bd.ell(-1, -23 + b, 13, 3, M.boarD);
    for (let i = -9; i <= 7; i += 3) {
      bd.px(i, -27 + b, 2, 4, M.dark);
      bd.px(i, -28 + b, 1, 2, M.boarH);
    }
    bd.ell(1, -12 + b, 12, 3, M.boarH);
    bd.shade(1).outline();

    // 4.3 หางสั้น
    const tl = mk(72, 60, 34, 56);
    thick(tl, -16, -20, -19, -25, M.dark, 2);
    tl.px(-20, -26, 2, 2, M.boarD);
    tl.outline();

    // 4.4 หัวและจมูกหมูดันดิน
    const hd = mk(72, 60, 34, 56);
    hd.ell(15, -16 + b, 8, 7, M.boar);
    hd.ell(23, -13 + b, 5, 4, M.snout);
    hd.px(25, -14 + b, 2, 2, M.dark); // รูจมูก
    tri(hd, 10, -22 + b, 12, -28 + b, 15, -22 + b, M.boarD);
    hd.px(12, -25 + b, 1, 2, M.boarH);
    hd.shade(1).outline();

    // 4.5 เขี้ยวโค้งคู่ทรงพลัง (Curved Tusks)
    const tu = mk(72, 60, 34, 56);
    tu.px(20, -11 + b, 6, 2, M.tuskD);
    tu.px(21, -12 + b, 5, 2, M.tusk);
    tu.px(25, -15 + b, 2, 5, M.tusk);
    tu.px(25, -16 + b, 1, 2, M.boneH); // ปลายเขี้ยวสะท้อนแสง
    if (wind) {
      tu.px(19, -9 + b, 8, 2, M.tuskD);
      tu.px(26, -17 + b, 2, 7, M.tusk);
      tu.px(26, -18 + b, 1, 3, M.boneH);
    }
    tu.outline();

    // 4.6 ตา
    const ey = mk(72, 60, 34, 56);
    ey.px(16, -18 + b, 3, 2, wind ? M.red : M.eyeY);
    ey.px(16, -18 + b, 1, 1, M.eyeYH);
    ey.px(18, -18 + b, 1, 2, M.dark);

    out.push(tl, lg, bd, hd, tu, ey);
    return comp(out, 72, 60, 34, 56);
  }

  /* ---------------- 5. ค้างคาว (Vampiric Winged Bat) ---------------- */
  function bat(k, wind) {
    const out = [], y0 = -20, wy = [-12, -3, 6][k % 3];
    const wg = mk(72, 64, 36, 60);

    // 5.1 ปีกพังผืด 3 แฉกพร้อมกระดูกปีก
    for (const sgn of [-1, 1]) {
      const sx = sgn * 4, tipx = sgn * (wind ? 24 : 22), tipy = y0 + wy;
      tri(wg, sx, y0 - 3, tipx, tipy, sx, y0 + 5, M.batW);
      tri(wg, sx, y0 - 3, sgn * 14, tipy + (k === 1 ? -1 : -6) + 3, tipx, tipy, M.batWD);
      thick(wg, sx, y0 - 3, tipx, tipy, M.batWD, 1);
      thick(wg, sx, y0 - 2, sgn * 12, tipy + 4, M.batWH, 1);
      wg.px(tipx, tipy, 1, 1, M.batWH);
    }
    wg.shade(1).outline();

    // 5.2 ลำตัวขนและหูแหลม
    const bd = mk(72, 64, 36, 60);
    bd.ell(0, y0, 5, 6, M.bat);
    bd.ell(0, y0 - 1, 4, 4, M.batW);
    tri(bd, -5, y0 - 4, -4, y0 - 13, -1, y0 - 6, M.bat);
    tri(bd, 5, y0 - 4, 4, y0 - 13, 1, y0 - 6, M.bat);
    bd.px(-3, y0 - 10, 1, 4, M.batWH);
    bd.px(3, y0 - 10, 1, 4, M.batWH);
    bd.shade(1).outline();

    // 5.3 ดวงตาสีแดงฉานและเขี้ยวดูดเลือด
    const f = mk(72, 64, 36, 60);
    f.px(-4, y0 - 3, 3, 3, wind ? M.red : M.batEye);
    f.px(1, y0 - 3, 3, 3, wind ? M.red : M.batEye);
    f.px(-4, y0 - 3, 1, 1, '#ffffff');
    f.px(1, y0 - 3, 1, 1, '#ffffff');
    f.px(-3, y0 - 2, 1, 1, M.dark);
    f.px(2, y0 - 2, 1, 1, M.dark);
    // Sharp Fangs
    f.px(-2, y0 + 3, 1, 3, M.boneH);
    f.px(1, y0 + 3, 1, 3, M.boneH);
    if (wind) f.px(-3, y0 + 2, 6, 1, M.redD);

    out.push(wg, bd, f);
    return comp(out, 72, 64, 36, 60);
  }

  /* ---------------- 6. โครงกระดูก (Crypt Skeleton Warrior) ---------------- */
  function skel(view, pose, k) {
    const wind = pose === 'wind', sd = view === 's', b = (pose === 'walk' && k) ? -1 : 0, out = [];

    // 6.1 ขากระดูก
    const lg = mk(72, 90, 36, 84);
    if (sd) {
      const lo = k ? 3 : -3;
      thick(lg, -1 - lo, -16, -1 - lo, -4, M.boneD, 2);
      lg.px(-3 - lo, -3, 5, 3, M.boneD);
      thick(lg, 1 + lo, -16, 1 + lo, -4, M.bone, 2);
      lg.px(0 + lo, -3, 6, 3, M.bone);
      lg.px(1 + lo, -2, 4, 1, M.boneH);
    } else {
      const a = k ? 2 : 0, c = k ? 0 : 2;
      lg.px(-5, -16 - a, 2, 13, M.bone);
      lg.px(3, -16 - c, 2, 13, M.bone);
      lg.px(-4, -16 - a, 1, 13, M.boneH);
      lg.px(4, -16 - c, 1, 13, M.boneH);
      lg.px(-6, -3 - a, 5, 3, M.bone);
      lg.px(2, -3 - c, 5, 3, M.bone);
    }
    lg.shade(1).outline();

    // 6.2 ซี่โครงและแนวกระดูกสันหลัง
    const tr = mk(72, 90, 36, 84);
    tr.px(-1, -32 + b, 2, 16, M.boneD);
    if (sd) {
      for (let i = 0; i < 4; i++) {
        tr.px(-4, -30 + b + i * 3, 8, 2, i % 2 ? M.boneD : M.bone);
        tr.px(-2, -30 + b + i * 3, 4, 1, M.boneH);
      }
      tr.px(-4, -17 + b, 8, 3, M.bone);
    } else {
      for (let i = 0; i < 4; i++) {
        tr.px(-7, -30 + b + i * 3, 14, 2, i % 2 ? M.boneD : M.bone);
        tr.px(-6, -30 + b + i * 3, 5, 1, M.boneH);
        tr.px(1, -30 + b + i * 3, 5, 1, M.boneH);
      }
      tr.px(-5, -17 + b, 10, 3, M.bone);
      tr.px(-8, -31 + b, 16, 2, M.bone);
    }
    tr.shade(1).outline();

    // 6.3 กะโหลกศีรษะ (Chiseled Skull)
    const hd = mk(72, 90, 36, 84), cx = sd ? 1 : 0;
    hd.ell(cx, -41 + b, 8, 7, M.boneD);
    hd.ell(cx, -42 + b, 7, 6, M.bone);
    hd.px(-4 + cx, -46 + b, 8, 3, M.boneH); // Cranium highlight
    hd.px(-5 + cx, -34 + b, 10, 4, M.bone);
    hd.shade(1).outline();

    // 6.4 เบ้าตากลวงและแสงวิญญาณสีแดง
    const fc = mk(72, 90, 36, 84);
    if (view !== 'u') {
      if (sd) {
        fc.px(3, -43 + b, 4, 4, M.dark);
        fc.px(4, -42 + b, 2, 2, M.red);
        fc.px(4, -42 + b, 1, 1, '#ffffff');
        fc.px(7, -38 + b, 2, 2, M.boneD);
        fc.px(2, -34 + b, 7, 1, M.dark);
        if (wind) fc.px(2, -33 + b, 7, 2, M.dark);
      } else {
        fc.px(-6, -43 + b, 4, 5, M.dark);
        fc.px(2, -43 + b, 4, 5, M.dark);
        fc.px(-5, -42 + b, 2, 2, M.red);
        fc.px(3, -42 + b, 2, 2, M.red);
        fc.px(-5, -42 + b, 1, 1, '#ffffff');
        fc.px(3, -42 + b, 1, 1, '#ffffff');
        fc.px(-1, -38 + b, 2, 2, M.boneD); // โพรงจมูก
        fc.px(-4, -34 + b, 8, 1, M.dark);
        fc.px(-2, -35 + b, 1, 3, M.dark);
        fc.px(1, -35 + b, 1, 3, M.dark);
        if (wind) fc.px(-4, -33 + b, 8, 2, M.dark);
      }
    }

    // 6.5 ดาบเหล็กสนิมโบราณ (Rusty Crypt Blade)
    const sw = mk(72, 90, 36, 84), ang = wind ? -2.0 : (sd ? -1.15 : -1.45), hx = sd ? 5 : 9, hy = -18 + b - (wind ? 5 : 0);
    thick(sw, sd ? 2 : 7, -30 + b, hx, hy, M.bone, 2);
    sw.px(hx, hy, 3, 3, M.bone);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    thick(sw, hx, hy, Math.round(hx + ca * 22), Math.round(hy + sa * 22), M.steel, 3);
    thick(sw, hx, hy, Math.round(hx + ca * 20), Math.round(hy + sa * 20), M.steelH, 1);
    for (let q = -3; q <= 3; q++) sw.px(Math.round(hx + ca * 2 - sa * q), Math.round(hy + sa * 2 + ca * q), 1, 1, M.clubD);
    sw.shade(1).outline();

    // 6.6 แขนซ้าย
    const al = mk(72, 90, 36, 84);
    if (sd) {
      thick(al, -1, -30 + b, -2, -18 + b, M.boneD, 2);
    } else {
      thick(al, -8, -30 + b, -10, -18 + b - (k ? 1 : 0), M.bone, 2);
      al.px(-11, -18 + b, 3, 3, M.bone);
    }
    al.shade(1).outline();

    if (view === 'd') out.push(lg, tr, al, hd, fc, sw);
    else if (view === 'u') out.push(sw, lg, tr, al, hd);
    else out.push(al, lg, tr, hd, fc, sw);
    return comp(out, 72, 90, 36, 84);
  }

  /* ---------------- 7. โกเลมคริสตัล (Ancient Crystal Monolith) ---------------- */
  function golem(view, pose, k) {
    const wind = pose === 'wind', sd = view === 's', b = (pose === 'walk' && k) ? -1 : 0, out = [];
    const AXg = 48, AYg = 100, mkg = () => mk(96, 112, AXg, AYg);

    // 7.1 ขาเสาหินยักษ์
    const lg = mkg();
    if (sd) {
      const lo = k ? 3 : -3;
      lg.px(-7 - lo, -18, 9, 18, M.rockD);
      lg.px(-2 + lo, -18, 10, 18, M.rock);
      lg.px(-1 + lo, -16, 3, 14, M.rockH);
    } else {
      const a = k ? 2 : 0, c = k ? 0 : 2;
      lg.px(-11, -18 - a, 9, 18 + a, M.rockD);
      lg.px(2, -18 - c, 9, 18 + c, M.rockD);
      lg.px(-9, -16 - a, 5, 14 + a, M.rock);
      lg.px(4, -16 - c, 5, 14 + c, M.rock);
      lg.px(-8, -14 - a, 2, 10 + a, M.rockH);
      lg.px(5, -14 - c, 2, 10 + c, M.rockH);
    }
    lg.shade(2).outline();

    // 7.2 ลำตัวศิลาและรอยแตกร้าวโบราณ
    const tr = mkg(), w = sd ? 24 : 30;
    tr.px(-w / 2, -48 + b, w, 32, M.rockD);
    tr.px(-w / 2 + 2, -47 + b, w - 4, 29, M.rock);
    tr.px(-w / 2 + 3, -46 + b, w - 6, 2, M.rockH);
    tr.px(-w / 2, -20 + b, w, 4, M.rockD);
    // รอยแตกเรืองแสง
    for (const [x, y] of [[-6, -42], [5, -30], [-9, -26]]) {
      tr.px(x, y + b, 5, 1, M.dark);
      tr.px(x + 1, y + b + 1, 3, 1, M.crysD);
    }
    tr.shade(2).outline();

    // 7.3 แกนผลึกคริสตัลเรืองแสง (Glowing Core)
    const cr = mkg();
    if (view === 'd') {
      tri(cr, -5, -30 + b, 0, -45 + b, 5, -30 + b, M.crys);
      tri(cr, -5, -30 + b, 0, -19 + b, 5, -30 + b, M.crysD);
      cr.px(-1, -38 + b, 2, 8, M.crysL);
      cr.px(0, -36 + b, 1, 4, M.crysSpec);
    } else if (view === 'u') {
      for (const x of [-8, 0, 7]) {
        tri(cr, x - 3, -30 + b, x, -48 + b - Math.abs(x) / 2, x + 3, -30 + b, M.crys);
        cr.px(x, -42 + b, 1, 8, M.crysL);
      }
    } else {
      tri(cr, -2, -34 + b, 2, -48 + b, 6, -34 + b, M.crys);
      cr.px(2, -44 + b, 1, 6, M.crysL);
    }
    cr.shade(1).outline();

    // 7.4 แขนหินทรงพลัง
    const arm = (sx) => {
      const L = mkg(), up = wind ? -12 : 0;
      L.px(sx - 4, -48 + b + up, 9, 24, M.rock);
      L.px(sx - 3, -47 + b + up, 3, 22, M.rockH);
      L.px(sx - 6, -26 + b + up, 13, 10, M.rockD);
      L.px(sx - 5, -25 + b + up, 11, 8, M.rock);
      L.px(sx - 4, -24 + b + up, 3, 3, M.rockH);
      L.shade(2).outline();
      return L;
    };

    // 7.5 สนับบ่าและผลึกคริสตัลบนไหล่
    const sh = mkg();
    if (sd) {
      sh.px(-3, -54 + b, 10, 10, M.rockL);
      tri(sh, -1, -54 + b, 2, -64 + b, 5, -54 + b, M.crys);
      sh.px(2, -62 + b, 1, 6, M.crysL);
    } else {
      sh.px(-19, -54 + b, 11, 10, M.rockL);
      sh.px(8, -54 + b, 11, 10, M.rockL);
      sh.px(-18, -53 + b, 4, 2, M.rockH);
      sh.px(9, -53 + b, 4, 2, M.rockH);
      tri(sh, -17, -54 + b, -14, -64 + b, -11, -54 + b, M.crys);
      tri(sh, 10, -54 + b, 13, -65 + b, 16, -54 + b, M.crys);
      sh.px(-14, -62 + b, 1, 6, M.crysL);
      sh.px(13, -62 + b, 1, 6, M.crysL);
    }
    sh.shade(2).outline();

    // 7.6 ศีรษะศิลา
    const hd = mkg(), hx = sd ? 3 : 0;
    hd.px(-7 + hx, -66 + b, 14, 12, M.rockD);
    hd.px(-6 + hx, -66 + b, 12, 11, M.rock);
    hd.px(-5 + hx, -67 + b, 10, 2, M.rockH);
    hd.shade(1).outline();

    // 7.7 ดวงตาคริสตัลเรืองแสง
    const fc = mkg();
    if (view !== 'u') {
      if (sd) {
        fc.px(3, -62 + b, 4, 3, M.crys);
        fc.px(4, -62 + b, 2, 1, '#ffffff');
      } else {
        fc.px(-5, -62 + b, 4, 3, M.crys);
        fc.px(1, -62 + b, 4, 3, M.crys);
        fc.px(-4, -62 + b, 2, 1, '#ffffff');
        fc.px(2, -62 + b, 2, 1, '#ffffff');
      }
    }
    if (wind) fc.px(-3, -58 + b, 6, 2, M.crysL);

    if (view === 'd') out.push(lg, tr, cr, arm(-19), arm(19), sh, hd, fc);
    else if (view === 'u') out.push(lg, arm(-19), arm(19), tr, cr, sh, hd);
    else out.push(arm(-3), lg, tr, cr, sh, hd, fc, arm(8));
    return comp(out, 96, 112, AXg, AYg);
  }

  /* ---------------- Frame Cache Engine ---------------- */
  const cache = {};
  const HUM = { goblin: goblin, skel: skel, golem: golem };

  function get(type, view, pose, k) {
    const key = type + view + pose + k;
    if (cache[key]) return cache[key];
    let f;
    if (type === 'slime') f = slime(k, pose === 'wind', false);
    else if (type === 'king') f = slime(k, pose === 'wind', true);
    else if (HUM[type]) f = HUM[type](view, pose, k);
    else f = { wolf, boar, bat }[type](k, pose === 'wind');
    return (cache[key] = f);
  }

  const WALKN = { slime: 4, king: 4, wolf: 4, boar: 4, bat: 3, goblin: 2, skel: 2, golem: 2 };
  const SHADOW = {
    slime: [14, 3],
    king: [26, 5],
    goblin: [16, 3],
    wolf: [20, 3],
    boar: [22, 4],
    bat: [13, 3],
    skel: [13, 3],
    golem: [26, 5]
  };

  const monView = m => {
    if (!HUM[m.type]) return 's';
    const chase = m.state === 'chase' || m.state === 'windup';
    const vx = chase ? P.x - m.x : (m.vx || 0);
    const vy = chase ? (P.y - 6) - m.y : (m.vy || 0);
    if (Math.abs(vx) + Math.abs(vy) > .2) {
      m._v = (Math.abs(vy) > Math.abs(vx) * 1.25) ? (vy > 0 ? 'd' : 'u') : 's';
    }
    return m._v || 's';
  };

  /* ---------------- Global Monster Drawing Hook ---------------- */
  drawMon = function (m) {
    const d = MON[m.type], x = Math.round(m.x), y = Math.round(m.y);
    const sh = SHADOW[m.type] || [16, 3];

    // Shadow Layer (ปรับขนาดตามมอนสเตอร์และยกให้ bat ลอย)
    GFX.drawShadow(ctx, x, y, sh[0], sh[1]);

    const wind = m.state === 'windup', v = monView(m);
    const moving = m.state !== 'wander' || m.vx || m.vy;
    const k = wind ? 0 : (moving ? Math.floor(m.anim * (m.type === 'bat' ? 9 : 5)) % WALKN[m.type] : 0);
    const f = get(m.type, v, wind ? 'wind' : 'walk', k);

    // Hit Vibration & Idle Subtle Breathing
    const hurtShk = (m.hurtT > 0) ? (Math.floor(S.t * 30) % 2 === 0 ? 1 : -1) : 0;
    const idleBreath = (!moving && !wind && m.type !== 'bat')
      ? (Math.sin((S.t || 0) * 3 + (m.x || 0)) > 0.6 ? -1 : 0)
      : 0;
    const batBob = m.type === 'bat' ? Math.round(Math.sin(m.anim * 4) * 2) : 0;

    // Visual Flash & Status Color Tint
    const tint = m.fz > 0
      ? 'rgba(140, 210, 255, .6)'
      : m.hurtT > 0
        ? 'rgba(255, 255, 255, .75)'
        : (wind && Math.floor(S.t * 16) % 2 ? 'rgba(255, 60, 60, .4)' : null);

    GFX.draw(ctx, f, x + hurtShk, y + batBob + idleBreath, v === 's' && m.face < 0, tint);

    // Attack Wind-up Indicator
    if (wind) pixText('!', x, y - d.h - 12, '#ff5a4a', 2, true);

    // Pixel HP Bar (Classic RPG Style)
    const mh = m.mhp || d.hp;
    if (m.hp < mh) {
      const w = 14;
      r(x - w / 2 - 1, y - d.h - 7, w + 2, 4, '#000000');
      r(x - w / 2, y - d.h - 6, w, 2, '#2d0f13');
      const curW = Math.max(1, Math.round(w * m.hp / mh));
      r(x - w / 2, y - d.h - 6, curW, 2, '#dc3232');
      r(x - w / 2, y - d.h - 6, curW, 1, '#ff7878'); // Specular highlight on top edge
    }
  };

  /* Public API Exposure */
  window.MON_PAL = MON_PAL;
  window.MON_ART = { get, WALKN };
  window.__monSheet = function () {
    const types = Object.keys(WALKN), Z = 3, cw = 100, ch = 112, cv = document.createElement('canvas');
    cv.width = cw * Z * 9;
    cv.height = types.length * ch * Z;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#4f7a3c';
    g.fillRect(0, 0, cv.width, cv.height);
    types.forEach((t, r) => {
      let c = 0;
      const put = f => {
        g.drawImage(f.c, 0, 0, f.w, f.h, c * cw * Z + (cw - f.w) / 2 * Z, r * ch * Z + (ch - f.h) / 2 * Z, f.w * Z, f.h * Z);
        c++;
      };
      const views = HUM[t] ? ['d', 's', 'u'] : ['s'];
      for (const v of views) {
        for (let k = 0; k < WALKN[t]; k++) put(get(t, v, 'walk', k));
        put(get(t, v, 'wind', 0));
      }
    });
    return cv.toDataURL();
  };
})();
