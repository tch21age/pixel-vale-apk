'use strict';
/* =====================================================================
   ART: ฮีโร่ชาย/หญิง — Classic RPG / Old-school JRPG Pixel Art Remaster
   - คมชัดด้วย Silhouette, Shading 3-4 ระดับ (Base, Shadow, Highlight, Specular)
   - สรีระตัวละครสมส่วนแบบ Pixel RPG: ใบหน้า คิ้ว ตา แววตาคมชัด
   - แยกเอกลักษณ์เด่น: ชาย (นักรบเกราะเหล็ก ดาบคู่กาย) / หญิง (จอมเวท คทาคริสตัล หมวกปีกกว้าง)
   - เดินและโจมตีมีน้ำหนัก คมชัด ไม่เบลอ ปราศจาก filter/anti-aliasing
   - รักษาโครงสร้าง HERO_PAL, HERO_ART, drawPlayer เดิม 100% ไม่กระทบระบบภายนอก
   ===================================================================== */
const HERO_PAL = {
  skin: '#f2be9b', skinD: '#ba8261', skinH: '#fae2d2',
  pant: '#3c384c', pantD: '#252230', pantH: '#554f6b',
  boot: '#442a18', bootD: '#26150a', bootH: '#684024',
  belt: '#4a2c16', beltD: '#2c190c',
  gold: '#c9962e', goldH: '#fae078', goldD: '#7d5711',
  eye: '#16101c', eyeH: '#ffffff', blush: '#e6887a', mouth: '#a3423c',
  steel: '#949eb3', steelD: '#586275', steelH: '#d2dbe8',
  plume: '#b82c3c', plumeH: '#e65363',
  leather: '#6e4322', leatherD: '#422612', leatherH: '#966036',
  pink: '#db5c96', pinkH: '#ff94c6'
};

(function () {
  const HW = 64, HH = 80, HAX = 32, HAY = 70;
  const mkL = () => GFX.layer(HW, HH, HAX, HAY);
  const PI = Math.PI, TIERS = 6;

  function pal(g, wl) {
    const Lk = LOOK[g];
    return Object.assign({}, HERO_PAL, {
      hair: Lk.hair, hairH: Lk.hairH,
      tun: Lk.tun, tunD: Lk.tunD,
      scarf: Lk.scarf, scarfD: Lk.scarfD,
      cape: Lk.cape, capeD: Lk.capeD,
      blade: BLADE[wl || 0],
      g, tier: Math.min(wl || 0, TIERS - 1), wl: wl || 0, hero: (wl || 0) >= 6, acc: BLADE[wl || 0]
    },
    (wl || 0) >= 6 ? {
      scarf: GFX.mix(Lk.scarf, BLADE[wl], .35), scarfD: GFX.mix(Lk.scarfD, BLADE[wl], .35),
      cape: GFX.mix(Lk.cape, BLADE[wl], .18), capeD: GFX.mix(Lk.capeD, BLADE[wl], .18)
    } : null);
  }

  /* ---------- อาวุธ: ดาบอัศวิน (ชาย) / คทาเวทมนตร์ (หญิง) ---------- */
  function weapon(c, hx, hy, ang, len) {
    const L = mkL();
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const P = (i, w, col) => L.px(Math.round(hx + ca * i), Math.round(hy + sa * i), w, w, col);
    const wl = c.wl;

    if (c.g === 'm') {
      const gl = 3 + (wl >= 3 ? 1 : 0) + (wl >= 6 ? 1 : 0);
      const bw = wl >= 7 ? 3 : 2;

      // 1. ด้ามดาบพันหนัง + ท้ายด้าม (Pommel)
      for (let i = -4; i <= 0; i++) P(i, 2, c.belt);
      P(-3, 1, c.beltD);
      P(-5, 2, wl >= 3 ? c.gold : c.steelD);
      if (wl >= 3) {
        P(-5, 1, c.goldH);
        if (wl >= 6) P(-6, 2, c.acc);
      }

      // 2. การ์ดดาบ (Crossguard) เสริมทองเหลือง
      for (let k = -gl; k <= gl; k += 1) {
        const isEnd = Math.abs(k) >= gl - 1;
        const gx = Math.round(hx + ca * 1 - sa * k);
        const gy = Math.round(hy + sa * 1 + ca * k);
        L.px(gx, gy, 2, 2, wl >= 9 && isEnd ? c.acc : c.gold);
        L.px(gx, gy, 1, 1, c.goldH);
      }

      // 3. คมดาบ สันดาบ และร่องเลือด
      for (let i = 2; i <= len; i++) {
        const isTip = i >= len - 1;
        P(i, bw, isTip ? '#ffffff' : c.blade);
        // สันดาบสะท้อนแสงตรงกลาง
        if (bw > 2) {
          L.px(Math.round(hx + ca * i), Math.round(hy + sa * i), 1, 1, '#ffffff');
          L.px(Math.round(hx + ca * i - sa * 1), Math.round(hy + sa * i + ca * 1), 1, 1, GFX.mix(c.blade, '#000000', .35));
        }
      }

      // 4. พลังเวทที่แผ่ออกมาตามขั้นอาวุธ
      if (wl >= 4) {
        for (let i = 5; i < len - 2; i += 2) {
          L.px(Math.round(hx + ca * i), Math.round(hy + sa * i), 1, 1, GFX.mix(c.blade, '#ffffff', .85));
        }
      }
      if (wl >= 9) {
        P(len + 1, 2, '#ffffff');
        P(len + 3, 1, c.acc);
      }
    } else {
      // 1. ด้ามคทาไม้โอ๊คกลึง
      for (let i = -4; i <= len - 2; i++) {
        P(i, 2, c.leather);
        P(i, 1, c.leatherH);
      }
      // ลวดลายเกลียวทองที่ด้าม
      for (let i = -1; i <= len - 4; i += 4) {
        L.px(Math.round(hx + ca * i), Math.round(hy + sa * i), 1, 1, c.gold);
      }

      const tx = Math.round(hx + ca * len), ty = Math.round(hy + sa * len);
      const gr = wl >= 7 ? 5 : (wl >= 3 ? 4 : 3);

      // 2. ปีกทองประคองหัวคทา
      if (wl >= 4) {
        L.px(tx - gr - 2, ty - 2, 2, 4, c.gold);
        L.px(tx + gr + 1, ty - 2, 2, 4, c.gold);
        L.px(tx - gr - 2, ty - 1, 1, 2, c.goldH);
        L.px(tx + gr + 1, ty - 1, 1, 2, c.goldH);
      }
      if (wl >= 6) {
        L.px(tx - 1, ty - gr - 3, 3, 2, c.gold);
        L.px(tx, ty - gr - 3, 1, 1, c.goldH);
      }

      // 3. ผลึกแก้วเวทมนตร์ (Magical Gem Orb)
      L.ell(tx, ty, gr + 1, gr + 1, c.goldD);
      L.ell(tx, ty, gr, gr, GFX.mix(c.blade, '#000000', .25));
      L.ell(tx - 1, ty - 1, Math.max(1, gr - 1), Math.max(1, gr - 1), c.blade);
      L.px(tx - 1, ty - 1, 2, 2, '#ffffff');
      L.px(tx, ty, 1, 1, c.goldH);
    }
    return L.shade(1, .28, .32).outline(.8);
  }

  /* แขนและถุงมือ: ไล่เฉดจากไหล่ ปลอกแขนหนัง จนถึงฝ่ามือ */
  function arm(c, sx, sy, hx, hy, sleeve) {
    const L = mkL();
    L.line(sx, sy, hx, hy, sleeve, 3);
    // ปลอกแขนหนังคั่นข้อมือ
    const mx = Math.round((sx + hx * 2) / 3);
    const my = Math.round((sy + hy * 2) / 3);
    L.px(mx, my, 2, 2, c.beltD);
    L.px(mx, my, 1, 1, c.gold);
    // ถุงมือ / มือสีผิว
    L.px(hx, hy, 3, 3, c.skinD);
    L.px(hx, hy, 2, 2, c.skin);
    L.px(hx, hy, 1, 1, c.skinH);
    return L.shade(1).outline(.8);
  }

  /* ---------- หมวกและเกราะส่วนศีรษะ ---------- */
  function hat(c, view, b) {
    const L = mkL(), t = c.tier, m = c.g === 'm', sd = view === 's', cx = sd ? 1 : 0;
    if (m) {
      if (t === 0) {
        // ผ้าโพกหัวนักรบพเนจร
        L.px(-9 + cx, -36 + b, 18, 3, '#941e2b');
        L.px(-9 + cx, -37 + b, 18, 1, '#ba2737');
        L.px(-8 + cx, -36 + b, 16, 1, '#e64052');
        if (view !== 'd') L.px(-13 + cx, -35 + b, 4, 6, '#941e2b');
        if (view === 'd') L.px(7, -35 + b, 3, 6, '#941e2b');
      } else if (t === 1) {
        // หมวกหมุดหนังเสริมเหล็ก
        L.ell(cx, -40 + b, 9, 5, c.leatherD);
        L.ell(cx, -41 + b, 8, 4, c.leather);
        L.px(-10 + cx, -36 + b, 20, 2, c.belt);
        L.px(-4 + cx, -43 + b, 4, 1, c.leatherH);
        // หมุดโลหะ
        L.px(-6 + cx, -36 + b, 1, 1, c.steelH);
        L.px(0 + cx, -36 + b, 1, 1, c.steelH);
        L.px(6 + cx, -36 + b, 1, 1, c.steelH);
      } else {
        // หมวกเกราะเหล็กอัศวิน
        const gold = t >= 5, hc = gold ? c.gold : c.steelD;
        L.ell(cx, -40 + b, 9, 6, c.steelD);
        L.ell(cx, -41 + b, 8, 5, c.steel);
        L.px(-6 + cx, -44 + b, 5, 2, c.steelH); // ประกายสะท้อนแสงบนหน้าหมวก
        L.px(-10 + cx, -36 + b, 20, 2, hc);
        L.px(-1 + cx, -50 + b, 2, 6, gold ? c.gold : c.steelH);
        if (view === 'd') L.px(-1, -35 + b, 2, 5, hc);
        if (t >= 3) {
          // พู่ขนนกยอดหมวกอัศวิน
          L.px(-1 + cx, -54 + b, 2, 4, c.plume);
          L.px(0 + cx, -57 + b, 3, 4, c.plume);
          L.px(1 + cx, -57 + b, 1, 3, c.plumeH);
          L.px(2 + cx, -60 + b, 3, 3, c.plume);
        }
      }
    } else {
      if (t === 0) {
        // โบว์ผ้าไหมติดผมสาวนักเวท
        const x = sd ? 3 : 5;
        L.ell(x, -41 + b, 3, 2, c.pink);
        L.ell(x + 6, -43 + b, 3, 2, c.pink);
        L.px(x + 2, -42 + b, 3, 3, '#ffd6ea');
        L.px(x + 3, -42 + b, 1, 1, '#ffffff');
      } else {
        // หมวกปีกจอมเวทคลาสสิก (Wizard Hat)
        const col = t >= 2 ? c.tun : '#452878';
        const colD = t >= 2 ? c.tunD : '#2c194f';
        const h = t >= 2 ? 19 : 10, top = -40 - h;
        // ปีกหมวกกว้าง
        L.ell(cx, -39 + b, t >= 5 ? 14 : 13, 2, t >= 5 ? c.gold : colD);
        L.ell(cx, -40 + b, t >= 5 ? 13 : 12, 1, t >= 5 ? c.goldH : col);
        // กรวยหมวกโค้งมน
        for (let i = 0; i < h; i++) {
          const hw = Math.max(1, Math.round(8 * (1 - i / h)));
          const ox = -hw + cx + (i > h * .55 ? Math.floor((i - h * .55) / 1.8) : 0);
          L.px(ox, -40 - i + b, hw * 2 + 1, 1, colD);
          L.px(ox + 1, -40 - i + b, Math.max(1, hw * 2 - 1), 1, col);
          if (i < h - 2) L.px(ox + 1, -40 - i + b, 1, 1, GFX.mix(col, '#ffffff', .3));
        }
        // แถบคาดหมวกทองคำ
        L.px(-8 + cx, -41 + b, 17, 2, c.gold);
        L.px(-8 + cx, -41 + b, 17, 1, c.goldH);
        if (t >= 3) {
          L.px(-1 + cx, -42 + b, 3, 3, c.blade);
          L.px(0 + cx, -42 + b, 1, 1, '#ffffff');
        }
        if (t >= 4) L.px(2 + cx + (h > 12 ? 4 : 2), top + b + 1, 3, 3, c.gold);
      }
    }
    if (c.hero) heroHat(L, c, view, b, cx);
    return L.shade(1, .28, .30).outline(.8);
  }

  function heroHat(L, c, view, b, cx) {
    const A = c.acc, wl = c.wl;
    if (c.g === 'm') {
      const n = wl >= 8 ? 4 : (wl >= 7 ? 3 : 2);
      if (view === 's') {
        for (let i = 0; i < n; i++) {
          L.px(-12 - i * 3 + cx, -39 - i * 2 + b, 3, 2, A);
          L.px(-12 - i * 3 + cx, -39 - i * 2 + b, 1, 1, '#ffffff');
        }
      } else {
        for (const sx of [-1, 1]) {
          for (let i = 0; i < n; i++) {
            L.px(sx * (10 + i * 3) - (sx < 0 ? 2 : 0) + cx, -39 - i * 2 + b, 3, 2, A);
            L.px(sx * (10 + i * 3) - (sx < 0 ? 2 : 0) + cx, -39 - i * 2 + b, 1, 1, '#ffffff');
          }
        }
      }
      if (view === 'd') {
        L.px(-1, -41 + b, 3, 3, A);
        L.px(0, -41 + b, 1, 1, '#ffffff');
      }
      if (wl >= 9) {
        L.px(-6 + cx, -47 + b, 2, 3, c.gold);
        L.px(5 + cx, -47 + b, 2, 3, c.gold);
      }
    } else {
      L.px(-9 + cx, -44 + b, 19, 1, A);
      if (wl >= 7) {
        L.ell(-13 + cx, -39 + b, 2, 2, A);
        L.ell(13 + cx, -39 + b, 2, 2, A);
      }
      if (wl >= 8) L.ell(cx, -39 + b, 16, 3, c.gold);
      if (wl >= 9) {
        L.px(cx + 2, -64 + b, 3, 1, A);
        L.px(cx + 3, -65 + b, 1, 3, A);
      }
    }
  }

  /* ---------- ศีรษะ ใบหน้า และทรงผม ---------- */
  function head(c, view, b) {
    const out = [], g = c.g, sd = view === 's', cx = sd ? 1 : 0;

    // 1. ผมด้านหลัง (Back Hair Layer)
    const back = mkL();
    back.ell(sd ? -2 : 0, -32 + b, 9, 9, c.hair);
    if (g === 'f') {
      if (view === 'd') {
        // ผมยาวประบ่าสองข้าง
        back.px(-10, -33 + b, 3, 16, c.hair);
        back.px(7, -33 + b, 3, 16, c.hair);
        back.px(-9, -26 + b, 1, 8, c.hairH);
        back.px(8, -26 + b, 1, 8, c.hairH);
      } else if (view === 'u') {
        back.px(-9, -33 + b, 18, 18, c.hair);
        back.px(-6, -24 + b, 12, 7, c.hairH);
      } else {
        back.px(-11, -34 + b, 6, 19, c.hair);
        back.px(-9, -28 + b, 2, 9, c.hairH);
      }
    }
    back.shade(2).outline(.8);
    out.push(back);

    // ทิศมองขึ้น (ด้านหลังศีรษะ)
    if (view === 'u') {
      const hh = mkL();
      hh.ell(0, -34 + b, 9, 8, c.hair);
      hh.px(-1, -26 + b, 2, 3, c.hairH);
      hh.px(-4, -44 + b, 3, 4, c.hairH);
      hh.px(1, -43 + b, 4, 3, c.hairH);
      hh.shade(2).outline(.8);
      out.push(hh);
      return out;
    }

    // 2. โครงหน้าและผิว (Face Structure)
    const face = mkL();
    face.ell(cx, -28 + b, sd ? 7 : 8, 7, c.skinD);
    face.ell(cx, -29 + b, sd ? 6 : 7, 6, c.skin);
    face.px(cx - 2, -30 + b, sd ? 4 : 5, 2, c.skinH);
    face.shade(1).outline(.6);
    out.push(face);

    // 3. ใบหน้า: ตา คิ้ว ปาก และแก้มสีระเรื่อ (Classic RPG Expressive Face)
    const ft = mkL();
    if (sd) {
      // คิ้ว
      ft.px(3, -31 + b, 3, 1, c.eye);
      // ตาและแววตา
      ft.px(4, -29 + b, 2, 3, c.eye);
      ft.px(4, -29 + b, 1, 1, c.eyeH);
      // จมูก ปาก แก้ม
      ft.px(8, -27 + b, 2, 1, c.skinD);
      ft.px(5, -24 + b, 2, 1, c.mouth);
      ft.px(2, -26 + b, 3, 1, c.blush);
    } else {
      // คิ้วสองข้าง
      ft.px(-6, -31 + b, 3, 1, c.eye);
      ft.px(3, -31 + b, 3, 1, c.eye);
      // ดวงตาสองข้าง + จุดประกายตาขาว
      ft.px(-5, -29 + b, 2, 3, c.eye);
      ft.px(3, -29 + b, 2, 3, c.eye);
      ft.px(-5, -29 + b, 1, 1, c.eyeH);
      ft.px(3, -29 + b, 1, 1, c.eyeH);
      // จมูกและปาก
      ft.px(-1, -26 + b, 2, 1, c.skinD);
      ft.px(-1, -24 + b, 2, 1, c.mouth);
      // แก้มอมชมพู
      ft.px(-7, -26 + b, 2, 1, c.blush);
      ft.px(5, -26 + b, 2, 1, c.blush);
    }
    out.push(ft);

    // 4. ปอยผมด้านหน้า (Bangs & Forehair)
    const fr = mkL();
    if (sd) {
      fr.ell(1, -37 + b, 8, 5, c.hair);
      fr.px(-3, -33 + b, 3, 8, c.hair);
      fr.px(6, -33 + b, 3, 3, c.hair);
    } else {
      fr.ell(0, -37 + b, 9, 5, c.hair);
      fr.px(-9, -34 + b, 3, 8, c.hair);
      fr.px(6, -34 + b, 3, 8, c.hair);
      fr.px(-2, -33 + b, 4, 3, c.hair);
    }
    // ประกายแสงสะท้อนบนเส้นผม
    fr.px(-4 + cx, -44 + b, 4, 3, c.hairH);
    fr.px(1 + cx, -43 + b, 4, 3, c.hairH);
    fr.shade(2).outline(.8);
    out.push(fr);

    out.push(hat(c, view, b));
    return out;
  }

  /* ---------- ขา กางเกง และรองเท้าบูท ---------- */
  function legs(c, view, step) {
    const L = mkL();
    const lift = [0, 1, 0, -1][step];

    if (view === 's') {
      const lo = [0, 3, 0, -3][step];
      // ขาหลัง (ไกลกล้อง - ทึบแสง)
      L.px(-3 - lo, -9, 4, 5, c.pantD);
      L.px(-3 - lo, -4, 6, 4, c.bootD);
      // ขาหน้า (ใกล้กล้อง - มีเส้นไฮไลต์สันขาและปลายรองเท้า)
      L.px(-1 + lo, -9, 4, 5, c.pant);
      L.px(-1 + lo, -9, 1, 5, c.pantH);
      L.px(-1 + lo, -4, 6, 4, c.boot);
      L.px(-1 + lo, -4, 1, 4, c.bootH);
      L.px(-1 + lo, -1, 6, 1, c.bootD);
    } else {
      const ll = lift > 0 ? 2 : 0, rl = lift < 0 ? 2 : 0;
      // ขาซ้าย
      L.px(-5, -9 - ll, 4, 5, c.pant);
      L.px(-5, -9 - ll, 1, 5, c.pantH);
      L.px(-6, -4 - ll, 5, 4, c.boot);
      L.px(-6, -4 - ll, 1, 4, c.bootH);
      L.px(-6, -1 - ll, 5, 1, c.bootD);
      // ขาขวา
      L.px(1, -9 - rl, 4, 5, c.pant);
      L.px(1, -9 - rl, 1, 5, c.pantH);
      L.px(1, -4 - rl, 5, 4, c.boot);
      L.px(1, -4 - rl, 1, 4, c.bootH);
      L.px(1, -1 - rl, 5, 1, c.bootD);
    }
    return L.shade(1).outline(.8);
  }

  /* ---------- ผ้าคลุมหลัง ---------- */
  function cape(c, view, b, step) {
    const L = mkL(), wv = step % 2;
    if (view === 's') {
      L.px(-10 - wv, -22 + b, 7, 15, c.capeD);
      L.px(-9 - wv, -21 + b, 5, 13, c.cape);
      L.px(-11 - wv, -10 + b, 3, 4, c.cape);
      L.px(-9 - wv, -7 + b, 5, 1, c.capeD);
      if (c.hero) L.px(-10 - wv, -9 + b, 7, 1, c.gold);
    } else if (view === 'd') {
      L.px(-8, -21 + b, 16, 14, c.capeD);
      L.px(-7, -20 + b, 14, 12, c.cape);
      L.px(-8, -9 + b, 3, 2, c.cape);
      L.px(5, -9 + b, 3, 2, c.cape);
      if (c.hero) {
        L.px(-8, -9 + b, 3, 1, c.gold);
        L.px(5, -9 + b, 3, 1, c.gold);
      }
    } else {
      L.px(-8, -23 + b, 16, 18, c.capeD);
      L.px(-7, -22 + b, 14, 16, c.cape);
      L.px(-1, -22 + b, 2, 15, c.hero && c.wl >= 8 ? c.acc : c.capeD);
      L.px(-8, -6 + b, 4, 2, c.capeD);
      L.px(4, -6 + b, 4, 2, c.capeD);
      if (c.hero) L.px(-8, -7 + b, 16, 1, c.gold);
    }
    return L.shade(1).outline(.8);
  }

  /* ---------- ลำตัว เสื้อ และเข็มขัด ---------- */
  function torso(c, view, b) {
    const L = mkL();
    if (view === 's') {
      L.px(-4, -20 + b, 9, 11, c.tunD);
      L.px(-3, -19 + b, 7, 9, c.tun);
      L.px(-5, -10 + b, 11, 2, c.tunD);
      // สันเกราะ/เสื้อผ้าด้านหน้า
      L.px(3, -18 + b, 1, 6, GFX.mix(c.tun, '#ffffff', .3));
      // เข็มขัดหนังและหัวเข็มขัดทองเหลือง
      L.px(-4, -13 + b, 9, 2, c.belt);
      L.px(-4, -13 + b, 9, 1, c.beltD);
      L.px(2, -13 + b, 2, 2, c.gold);
      L.px(2, -13 + b, 1, 1, c.goldH);
      if (c.hero && c.wl >= 7) L.px(2, -18 + b, 2, 3, c.acc);
    } else {
      L.px(-5, -20 + b, 10, 1, c.tunD);
      L.px(-6, -19 + b, 12, 9, c.tunD);
      L.px(-5, -18 + b, 10, 8, c.tun);
      L.px(-7, -10 + b, 14, 2, c.tunD);
      // ไฮไลต์กลางลำตัว
      L.px(-3, -18 + b, 6, 1, GFX.mix(c.tun, '#ffffff', .25));
      // เข็มขัด
      L.px(-6, -13 + b, 12, 2, c.belt);
      L.px(-6, -13 + b, 12, 1, c.beltD);
      if (view === 'd') {
        L.px(-1, -13 + b, 2, 2, c.gold);
        L.px(-1, -13 + b, 1, 1, c.goldH);
      }
      if (view === 'u') L.px(5, -13 + b, 3, 6, c.tunD);
      if (view === 'd' && c.hero && c.wl >= 7) {
        L.px(-2, -18 + b, 4, 4, c.gold);
        L.px(-1, -17 + b, 2, 2, c.acc);
        L.px(-1, -17 + b, 1, 1, '#ffffff');
      }
    }
    return L.shade(1).outline(.8);
  }

  /* ---------- ผ้าพันคอคลาสสิก ---------- */
  function scarf(c, view, b, step) {
    const L = mkL(), wv = step % 2;
    if (view === 's') {
      L.px(-5, -22 + b, 10, 3, c.scarf);
      L.px(-4, -21 + b, 8, 1, c.scarf);
      L.px(-11 - wv, -22 + b, 6, 3, c.scarfD);
    } else {
      L.px(-7, -22 + b, 14, 3, c.scarfD);
      L.px(-6, -22 + b, 12, 2, c.scarf);
      if (view === 'd') L.px(2, -19 + b, 3, 6, c.scarfD);
    }
    return L.shade(1).outline(.8);
  }

  /* ---------- เกราะไหล่ (Pauldrons) ---------- */
  function pauldron(c, view, b) {
    if (!c.hero) return null;
    const L = mkL(), m = c.g === 'm', base = m ? c.steel : c.tun, baseD = m ? c.steelD : c.tunD;
    const big = c.wl >= 8, rx = big ? 5 : 4, ry = big ? 4 : 3, y = -20 + b;

    if (view === 's') {
      L.ell(1, y, rx, ry, baseD);
      L.ell(1, y - 1, rx - 1, ry - 1, base);
      L.px(1 - rx, y + ry - 1, rx * 2 + 1, 1, c.gold);
      if (c.wl >= 7) L.px(0, y - 1, 3, 2, c.acc);
      if (big && m) L.px(0, y - ry - 3, 2, 3, c.gold);
    } else {
      for (const sx of [-1, 1]) {
        const cx = sx * 8;
        L.ell(cx, y, rx, ry, baseD);
        L.ell(cx, y - 1, rx - 1, ry - 1, base);
        L.px(cx - rx, y + ry - 1, rx * 2 + 1, 1, c.gold);
        if (c.wl >= 7) L.px(cx - 1, y - 1, 3, 2, c.acc);
        if (big && m) L.px(cx - 1, y - ry - 3, 2, 3, c.gold);
      }
    }
    return L.shade(1).outline(.8);
  }

  /* ---------- โล่อัศวิน ---------- */
  function shield(c, view, b) {
    if (!(c.g === 'm' && c.tier >= 4)) return null;
    const L = mkL(), gold = c.tier >= 5;
    if (view === 'd') {
      L.ell(-11, -14 + b, 5, 6, c.steelD);
      L.ell(-11, -14 + b, 4, 5, c.steel);
      L.ell(-11, -14 + b, 2, 3, gold ? c.gold : c.plume);
      L.px(-11, -14 + b, 1, 1, '#ffffff');
    } else if (view === 'u') {
      L.ell(-10, -16 + b, 4, 6, c.steelD);
    } else {
      L.px(-2, -19 + b, 3, 10, c.steelD);
      L.px(-2, -19 + b, 1, 10, gold ? c.gold : c.steel);
      L.px(-2, -15 + b, 1, 2, c.steelH);
    }
    return L.shade(1).outline(.8);
  }

  /* ---------- ประกอบร่างสไปรต์ (Sprite Assembly) ---------- */
  function build(c, view, pose, k) {
    const step = pose === 'walk' ? k : 0;
    const lift = [0, 1, 0, -1][step];
    const b = (pose === 'walk' && (step === 1 || step === 3)) ? -1 : 0;
    const sd = view === 's';
    const base = { d: PI / 2, s: 0, u: -PI / 2 }[view];
    const shoulderW = sd ? [1, -19 + b] : [7, -18 + b];
    const shoulderF = sd ? [1, -19 + b] : [-7, -18 + b];

    let hand, wang, wlen = c.g === 'm' ? 15 + [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2][c.wl] : 17;
    let farHand, drawWeaponFirst = false;

    if (pose === 'atk') {
      const a = base + (k * 2 - 1) * 1.25;
      wang = a;
      hand = [Math.round(shoulderW[0] + Math.cos(a) * 6), Math.round(shoulderW[1] + Math.sin(a) * 6)];
      drawWeaponFirst = view === 'u';
    } else {
      wang = sd ? -1.15 : -1.4;
      hand = sd ? [4, -11 + b] : [7, -10 + b - (lift < 0 ? 1 : 0)];
      if (pose === 'cast') { hand = sd ? [3, -9 + b] : [7, -9 + b]; }
    }

    farHand = sd ? [-1 + (lift > 0 ? 2 : (lift < 0 ? -2 : 0)), -11 + b] : [-7, -10 + b - (lift > 0 ? 1 : 0)];
    if (pose === 'cast') {
      const e = { d: [-4, -6 + b], u: [-6, -31 + b], s: [11, -19 + b] }[view];
      farHand = e;
    }

    const parts = [];
    const wp = weapon(c, hand[0] + 1, hand[1] + 1, wang, wlen);
    const aW = arm(c, shoulderW[0], shoulderW[1], hand[0], hand[1], c.tun);
    const aF = arm(c, shoulderF[0], shoulderF[1], farHand[0], farHand[1], sd ? c.tunD : c.tun);
    const sh = shield(c, view, b), pd = pauldron(c, view, b);

    // Dynamic Trail Pixel บนดาบขณะโจมตี (Visual Enhancement)
    let slashFx = null;
    if (pose === 'atk' && (k === 0.38 || k === 0.62)) {
      slashFx = mkL();
      const tx = Math.round(hand[0] + Math.cos(wang) * (wlen * 0.8));
      const ty = Math.round(hand[1] + Math.sin(wang) * (wlen * 0.8));
      slashFx.ell(tx, ty, 3, 2, 'rgba(255,255,255,0.7)');
      slashFx.px(tx, ty, 2, 2, c.blade);
    }

    if (view === 'd') {
      parts.push(cape(c, view, b, step), legs(c, view, step));
      if (sh) parts.push(sh);
      parts.push(torso(c, view, b), scarf(c, view, b, step), aF, aW);
      if (pd) parts.push(pd);
      parts.push(wp);
      if (slashFx) parts.push(slashFx);
      parts.push(...head(c, view, b));
    } else if (view === 'u') {
      if (drawWeaponFirst) parts.push(wp);
      parts.push(legs(c, view, step), cape(c, view, b, step));
      if (sh) parts.push(sh);
      parts.push(aF, aW);
      if (pd) parts.push(pd);
      if (!drawWeaponFirst) parts.push(wp);
      if (slashFx) parts.push(slashFx);
      parts.push(scarf(c, view, b, step), ...head(c, view, b));
    } else {
      parts.push(aF, cape(c, view, b, step), legs(c, view, step));
      if (sh) parts.push(sh);
      parts.push(torso(c, view, b), scarf(c, view, b, step), aW);
      if (pd) parts.push(pd);
      parts.push(wp);
      if (slashFx) parts.push(slashFx);
      parts.push(...head(c, view, b));
    }

    const F = mkL();
    parts.forEach(p => F.blit(p));
    F.outline(.85);
    return GFX.frame(F);
  }

  function buildDead(c) {
    const L = mkL();
    L.px(-12, -6, 22, 6, c.tunD);
    L.px(-11, -5, 20, 4, c.tun);
    L.px(-13, -1, 3, 2, c.bootD);
    L.px(9, -6, 6, 5, c.bootD);
    L.px(10, -5, 4, 3, c.boot);
    L.px(-3, -5, 12, 2, c.beltD);
    L.px(-6, -8, 12, 2, c.capeD);
    L.ell(-14, -6, 6, 5, c.skinD);
    L.ell(-14, -6, 5, 4, c.skin);
    L.ell(-15, -8, 6, 4, c.hair);
    L.px(-16, -5, 2, 1, c.eye);
    L.px(-21, -5, 3, 5, c.hair);
    L.shade(1).outline(.85);
    return GFX.frame(L);
  }

  const ATK_P = [.12, .38, .62, .88], fc = {};

  function getFrame(g, wl, pose, v, k) {
    const key = g + (wl || 0) + pose + v + k;
    if (fc[key]) return fc[key];
    const c = pal(g, wl);
    return (fc[key] = pose === 'dead' ? buildDead(c) : build(c, v, pose, pose === 'atk' ? ATK_P[k] : k));
  }

  function getSet(g, wl) {
    const S = { walk: {}, atk: {}, cast: {}, dead: getFrame(g, wl, 'dead', 'd', 0) };
    for (const v of ['d', 's', 'u']) {
      S.walk[v] = [0, 1, 2, 3].map(k => getFrame(g, wl, 'walk', v, k));
      S.atk[v] = [0, 1, 2, 3].map(k => getFrame(g, wl, 'atk', v, k));
      S.cast[v] = getFrame(g, wl, 'cast', v, 0);
    }
    return S;
  }

  window.HERO_ART = { getFrame, getSet, pal, ATK_P };

  /* ---------- ระบบเรนเดอร์ผู้เล่นในเกม ---------- */
  const VIEW = ['d', 's', 's', 'u'];

  function drawHero(x, y, tint, alpha) {
    let dir = P.dir;
    if (P.spinT > 0) dir = [0, 2, 3, 1][Math.floor((1 - P.spinT / .36) * 8) % 4];
    if (P.atkT > 0) {
      const p = 1 - P.atkT / ATK_T, l = Math.round(Math.sin(p * Math.PI) * 2);
      x += DIRS[dir].x * l;
      y += DIRS[dir].y * l;
    }
    const v = VIEW[dir], flip = dir === 1;
    let f;
    if (P.atkT > 0) {
      const p = 1 - P.atkT / ATK_T;
      f = getFrame(P.g, P.wl, 'atk', v, Math.min(3, Math.floor(p * 4)));
    } else if (P.castT > 0) {
      f = getFrame(P.g, P.wl, 'cast', v, 0);
    } else {
      f = getFrame(P.g, P.wl, 'walk', v, P.moving ? P.step : 0);
    }

    // Classic RPG Idle Breathing: ขยับเบาๆ 1px เมื่อยืนนิ่ง
    const idleBreath = (!P.moving && P.atkT <= 0 && P.castT <= 0)
      ? (Math.sin((S.t || 0) * 3.5) > 0.65 ? -1 : 0)
      : 0;

    // Hurt Recoil Shiver
    const hurtShk = (P.hurtT > 0)
      ? (Math.floor((S.t || 0) * 32) % 2 === 0 ? 1 : -1)
      : 0;

    GFX.draw(ctx, f, x + hurtShk, y + idleBreath, flip, tint, alpha);

    // เอฟเฟกต์ประกายเวทขณะร่าย (Cast Light Flare)
    if (P.castT > 0) {
      const d = DIRS[dir];
      const ox = Math.round((x + d.x * 8) * RS);
      const oy = Math.round((y - 9 + d.y * 6) * RS);
      GFX.ar(ctx, ox - 4, oy - 4, 9, 9, 'rgba(120, 210, 255, .35)');
      GFX.ar(ctx, ox - 3, oy - 3, 7, 7, 'rgba(155, 224, 255, .65)');
      GFX.ar(ctx, ox - 2, oy - 2, 5, 5, '#3f8cff');
      GFX.ar(ctx, ox - 1, oy - 1, 3, 3, '#ffffff');
    }
  }

  drawPlayer = function () {
    const x = Math.round(P.x), y = Math.round(P.y);
    // เงาใต้เท้าตัวละคร
    GFX.drawShadow(ctx, x, y, P.dead ? 11 : 8, 3);
    if (P.dead) {
      GFX.draw(ctx, getFrame(P.g, P.wl, 'dead', 'd', 0), x, y, false, null);
      return;
    }
    const flick = P.invul > 0 && Math.floor(S.t * 22) % 2 === 0;
    drawHero(x, y, P.hurtT > 0 ? 'rgba(255,255,255,.75)' : null, flick ? .45 : 1);
  };
})();
