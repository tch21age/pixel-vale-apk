'use strict';
/* =====================================================================
   ART TITLE (กลุ่ม 6 Remastered): หน้าเริ่มเกม — ปรับเฉพาะงานภาพ
   - #titleBg: ฉากพิกเซลดินแดนฟาร์มยามพลบค่ำ (Sunset Sky แบบ Bayer Dither,
     พระจันทร์นวลตา, ดาวกะพริบ, ดาวตก, เมฆลอยช้าๆ, เทือกเขา 2 ชั้น,
     เนินป่าสน, บ้านฟาร์มควันลอยจากปล่องไฟ, และฝูงหิ่งห้อยเรืองแสง)
   - ฮีโร่ที่เลือกยืนอย่างสง่างามบนเนินหน้า พร้อมเงาและอนิเมชัน Idle/Action
   - #emblem: ตราสัญลักษณ์เกม (ดาบอัศวิน + ต้นกล้าฟาร์ม) ขนาด 32x32 คมชัด
   - ไม่แตะต้อง Game Flow, Save/Load, หรือ DOM Element IDs เดิม 100%
   ===================================================================== */
(function () {
  const T = document.getElementById('title'),
        cv = document.getElementById('titleBg'),
        emb = document.getElementById('emblem');

  if (!T || !cv) return;

  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const PI = Math.PI;

  /* ---------- ฟังก์ชันคณิตศาสตร์และตัวช่วย ---------- */
  const mk = seed => () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const h2r = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const r2h = (r, gg, b) => '#' + [r, gg, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const lerp = (a, b, t) => {
    const A = h2r(a), B = h2r(b);
    return r2h(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  };

  const cnv = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  };

  function ell(x, cx, cy, rx, ry, col) {
    x.fillStyle = col;
    const R = ry + .5;
    for (let y = -ry; y <= ry; y++) {
      const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R))) + .5);
      x.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
    }
  }

  /* =====================================================================
     SECTION 1: ตราสัญลักษณ์ประจำเกม (#emblem 32x32)
     ===================================================================== */
  function drawEmblem() {
    if (!emb || typeof GFX === 'undefined') return;
    const L = GFX.layer(32, 32, 16, 16);
    const gold = '#deb23e', goldH = '#fff08a', goldD = '#805b14';

    // 1. ตราวงกลมทองคำขอบลึก
    L.ell(0, 0, 15, 15, goldD);
    L.ell(0, 0, 14, 14, gold);
    L.ell(0, -1, 13, 13, goldH);
    L.ell(0, 0, 12, 12, '#241442');
    L.ell(0, 1, 11, 10, '#362460');

    // 2. ดาบอัศวินตรงกลาง (Sword of Adventure)
    L.px(-1, -13, 3, 1, '#ffffff');
    L.px(-2, -12, 5, 16, '#d8e2f8');
    L.px(0, -12, 1, 16, '#8ca0c8'); // สันดาบ
    L.px(-1, -12, 1, 16, '#ffffff'); // ไฮไลต์ใบมีด

    // การ์ดดาบ ด้าม และหัวดาบ
    L.px(-8, 4, 17, 3, goldD);
    L.px(-8, 4, 17, 2, gold);
    L.px(-8, 4, 17, 1, goldH);
    L.px(-1, 7, 3, 5, '#5c381c');
    L.px(-3, 12, 7, 2, gold);
    L.px(-1, 12, 3, 2, goldH);

    // 3. ต้นกล้าฟาร์มแห่งความอุดมสมบูรณ์ (Crops of Life)
    L.ell(-7, 8, 4, 2, '#509e3e');
    L.ell(7, 8, 4, 2, '#509e3e');
    L.px(-6, 8, 3, 1, '#90e66c');
    L.px(4, 8, 3, 1, '#90e66c');
    L.px(-1, 4, 3, 2, '#38782a'); // ยอดอ่อนโคนต้น

    // ประกายดาวเวทมนตร์บนตรา
    L.px(-9, -8, 2, 2, '#fff6c8');
    L.px(8, -6, 2, 2, '#fff6c8');
    L.px(-7, -3, 1, 1, '#bfe9ff');
    L.px(6, -10, 1, 1, '#bfe9ff');

    L.shade(1, .28, .30).outline(.76);

    const f = GFX.frame(L);
    const k = emb.getContext('2d');
    k.imageSmoothingEnabled = false;
    k.clearRect(0, 0, 32, 32);
    k.drawImage(f.c, 0, 0);
  }

  /* =====================================================================
     SECTION 2: โครงสร้างฉากหลังและทัศนียภาพ (#titleBg)
     ===================================================================== */
  let W = 0, H = 0, s = 2, pt = 0, hz = 0,
      sky = null, land = null, fg = null,
      hx = 0, hy = 0,
      clouds = [], stars = [], flies = [],
      house = null;

  const parts = [];
  let shoot = null, nextShoot = 3;
  let selG = 'm', selT = -9, smokeT = 0;

  // โทนสีท้องฟ้าพลบค่ำไล่เฉด 9 ระดับ
  const SKY = [
    '#120e2a', '#1a1640', '#281f50', '#3e2a62',
    '#5e3870', '#88446e', '#bc5864', '#e67e58', '#fcae6c'
  ];

  const crestMid = x => hz - 16 + Math.round(4 * Math.sin(x * .035 + 1) + 2 * Math.sin(x * .09));
  const crestFront = x => pt - 3 + Math.round(2 * Math.sin(x * .05) + Math.sin(x * .13));

  function bakeSky() {
    const [c, x] = cnv(W, H);
    const N = SKY.length;

    for (let y = 0; y < H; y++) {
      const t = Math.min(1, y / hz) * (N - 1);
      const b = Math.min(N - 2, Math.floor(t));
      const f = t - b;

      x.fillStyle = SKY[b];
      x.fillRect(0, y, W, 1);

      // Bayer Matrix Dithering (2x2) บริเวณรอยต่อของแสง
      if (f > 0.72) {
        x.fillStyle = SKY[b + 1];
        for (let i = (y & 1); i < W; i += 2) x.fillRect(i, y, 1, 1);
      }
    }

    // พระจันทร์เสี้ยวนวลตา + วงรัศมี (Moon Glow)
    const mx = Math.round(W > 260 ? W * .88 : W * .78);
    const my = Math.max(14, Math.min(28, Math.round(hz * .3)));

    x.globalAlpha = .06;
    ell(x, mx, my, 22, 22, '#fff6c8');
    x.globalAlpha = .12;
    ell(x, mx, my, 16, 16, '#fff6c8');
    x.globalAlpha = 1;

    ell(x, mx, my, 11, 11, '#fff3c4');
    ell(x, mx, my, 10, 10, '#fffbe8');

    // พื้นผิวหลุมดวงจันทร์ (Moon Craters)
    x.fillStyle = '#e4d4a8';
    x.fillRect(mx - 5, my - 3, 3, 2);
    x.fillRect(mx + 2, my + 2, 4, 3);
    x.fillRect(mx - 2, my + 5, 2, 2);
    x.fillRect(mx + 3, my - 6, 2, 2);

    return c;
  }

  function ridge(x, seed, base, amp, col, rim, p) {
    const r = mk(seed), p1 = r() * 6, p2 = r() * 6;
    for (let i = 0; i < W; i++) {
      const h = amp * (.62 * (1 - Math.abs(Math.sin(i * p + p1))) + .3 * (1 - Math.abs(Math.sin(i * p * 2.6 + p2))) + .08 * r());
      const top = Math.round(base - h);
      x.fillStyle = col;
      x.fillRect(i, top, 1, H - top);
      x.fillStyle = rim;
      x.fillRect(i, top, 1, 1);
    }
  }

  function pine(x, cx, by, h, col, hi) {
    for (let i = 0; i < h; i++) {
      const w = 1 + Math.floor(i * .7);
      x.fillStyle = (i % 4 === 1) ? hi : col;
      x.fillRect(cx - (w >> 1), by - h + i, w, 1);
    }
    x.fillStyle = '#261814';
    x.fillRect(cx, by, 1, 2);
  }

  function bakeLand() {
    const [c, x] = cnv(W, H);
    const r = mk(11);
    const mtH = Math.min(60, Math.max(24, Math.round(hz * .62)));

    // 1. เทือกเขาไกลและใกล้ (Twilight Mountains)
    ridge(x, 3, hz - 6, mtH, '#543876', '#926088', .021);
    ridge(x, 9, hz - 2, mtH * .7, '#30245a', '#544282', .034);

    // 2. เนินเขากลาง + ป่าสน + บ้านฟาร์ม
    for (let i = 0; i < W; i++) {
      const y = crestMid(i);
      x.fillStyle = '#24443a';
      x.fillRect(i, y, 1, H - y);
      x.fillStyle = '#447250';
      x.fillRect(i, y, 1, 1);
    }

    for (let i = 4; i < W - 4; i += 5 + Math.floor(r() * 7)) {
      if (r() < .2) continue;
      pine(x, i, crestMid(i) + 1, 6 + Math.floor(r() * 5), '#14342c', '#20483c');
    }

    // บ้านฟาร์มในฉากหลัง
    const hxm = Math.round(W > 260 ? W * .78 : W * .66), hym = crestMid(hxm) + 1;
    x.fillStyle = '#181224';
    x.fillRect(hxm - 6, hym - 9, 12, 9);
    x.fillStyle = '#261814';

    // หลังคาบ้าน
    for (let i = 0; i < 7; i++) {
      x.fillStyle = i % 2 ? '#643424' : '#82422e';
      x.fillRect(hxm - 8 + i, hym - 9 - i + (i > 3 ? (i - 3) * 2 : 0), 16 - i * 2, 1);
    }

    // หน้าต่างบ้านมีไฟส้มอบอุ่น
    x.fillStyle = '#ffd572';
    x.fillRect(hxm - 4, hym - 6, 2, 2);
    x.fillRect(hxm + 2, hym - 6, 2, 2);
    x.fillStyle = '#ff9242';
    x.fillRect(hxm - 4, hym - 5, 2, 1);
    x.fillRect(hxm + 2, hym - 5, 2, 1);

    // ปล่องไฟ
    x.fillStyle = '#34201c';
    x.fillRect(hxm + 4, hym - 14, 2, 4);
    house = { x: hxm + 5, y: hym - 15 };

    // 3. เนินดินหน้า (จุดที่ฮีโร่ยืน)
    for (let i = 0; i < W; i++) {
      const y = crestFront(i);
      x.fillStyle = '#386340';
      x.fillRect(i, y, 1, H - y);
      x.fillStyle = '#a8be62';
      x.fillRect(i, y, 1, 1);
      x.fillStyle = '#669852';
      x.fillRect(i, y + 1, 1, 1);
      x.fillStyle = '#2a5236';
      x.fillRect(i, y + 5, 1, H - y - 5);
      x.fillStyle = '#1e3e28';
      x.fillRect(i, y + 14, 1, H - y - 14);
    }

    // ดอกไม้ป่าบนเนิน
    for (let n = 0; n < Math.round(W / 9); n++) {
      const fx = Math.floor(r() * W);
      const fy = crestFront(fx) + 2 + Math.floor(r() * 5);
      x.fillStyle = ['#fff6c8', '#ff8ec8', '#ffcc48', '#b5e4ff'][n % 4];
      x.fillRect(fx, fy, 1, 1);
    }

    return c;
  }

  function bakeFg() {
    const [c, x] = cnv(W, H);
    const r = mk(5);
    for (let i = 0; i < W; i += 2 + Math.floor(r() * 3)) {
      const y = crestFront(i) + 1;
      const h = 2 + Math.floor(r() * 3);
      x.fillStyle = '#82b054';
      x.fillRect(i, y - h, 1, h);
      x.fillStyle = '#a8be62';
      x.fillRect(i + 1, y - h + 1, 1, h - 1);
    }
    return c;
  }

  function bakeCloud(w, h, seed) {
    const [c, x] = cnv(w, h);
    const r = mk(seed);
    for (let i = 0; i < 5; i++) {
      const rx = 5 + Math.floor(r() * 7);
      const ry = 2 + Math.floor(r() * 3);
      ell(x, Math.round(6 + i * (w - 12) / 4), h - 4 - Math.floor(r() * 3) - ry + 1, rx, ry, '#b084bc');
    }
    x.fillRect(0, 0, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = '#ee9e82';
    x.fillRect(0, Math.round(h * .58), w, h);
    x.fillStyle = '#ffca96';
    x.fillRect(0, Math.round(h * .78), w, h);
    return c;
  }

  function bake() {
    const cw = T.clientWidth, ch = T.clientHeight;
    if (!cw || !ch) return false;

    const win = T.querySelector('.win').getBoundingClientRect();
    const tr = T.getBoundingClientRect();

    s = Math.min(3, Math.max(1.6, Math.min(cw, ch) / 180));
    W = Math.ceil(cw / s);
    H = Math.ceil(ch / s);
    cv.width = W;
    cv.height = H;
    g.imageSmoothingEnabled = false;

    pt = Math.max(40, Math.round((win.top - tr.top) / s));
    hz = Math.min(H - 10, pt + 12);

    sky = bakeSky();
    land = bakeLand();
    fg = bakeFg();

    hx = Math.round(W * .17);
    hy = crestFront(hx);

    const r = mk(21);
    clouds = [0, 1, 2, 3].map(i => ({
      c: bakeCloud(46 + i * 6, 15, 30 + i),
      x: r() * W,
      y: 6 + r() * Math.max(8, hz * .45),
      v: 1.5 + r() * 3
    }));

    stars = [];
    for (let i = 0; i < Math.round((W * hz) / 330); i++) {
      stars.push({
        x: Math.floor(r() * W),
        y: Math.floor(r() * hz * .62),
        ph: r() * 6,
        sp: 1 + r() * 2,
        big: r() < .12,
        c: ['#fff6c8', '#ffffff', '#b5e4ff'][i % 3]
      });
    }

    flies = [];
    for (let i = 0; i < 14; i++) {
      flies.push({
        x: r() * W,
        y: pt * .5 + r() * (pt * .5 + 8),
        ax: 3 + r() * 8,
        ay: 2 + r() * 5,
        ph: r() * 6,
        sp: .4 + r() * .8
      });
    }

    return true;
  }

  /* =====================================================================
     SECTION 3: ตัวละครฮีโร่บนเนินเขา
     ===================================================================== */
  function heroFrame(t) {
    if (typeof HERO_ART === 'undefined') return null;
    const e = t - selT;
    try {
      if (e < .46) {
        if (selG === 'm') return HERO_ART.getFrame('m', 0, 'atk', 'd', Math.min(3, Math.floor(e / .115)));
        return HERO_ART.getFrame('f', 0, 'cast', 'd', 0);
      }
      return HERO_ART.getFrame(selG, 0, 'walk', 'd', 0);
    } catch (err) {
      return null;
    }
  }

  function spark(n) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: hx + (Math.random() - .5) * 14,
        y: hy - 16 - Math.random() * 20,
        vx: (Math.random() - .5) * 20,
        vy: -10 - Math.random() * 22,
        life: .5 + Math.random() * .4,
        t: 0,
        c: ['#fff6c8', '#ffd54f', '#b5e4ff', '#ffffff'][i % 4]
      });
    }
  }

  function select(gn, first) {
    if (gn === selG && !first) return;
    selG = gn;
    selT = performance.now() / 1000;
    if (!first) spark(14);
  }

  /* =====================================================================
     SECTION 4: วงรอบการเรนเดอร์ (Animation Loop ~30 FPS)
     ===================================================================== */
  let last = 0, tPrev = 0;

  function draw(t) {
    const dt = Math.min(.1, t - tPrev);
    tPrev = t;

    // 1. ท้องฟ้า
    g.drawImage(sky, 0, 0);

    // 2. ดวงดาวกะพริบ
    for (const st of stars) {
      const a = .45 + .55 * Math.sin(t * st.sp + st.ph);
      if (a < .25) continue;
      g.globalAlpha = a;
      g.fillStyle = st.c;
      g.fillRect(st.x, st.y, 1, 1);
      if (st.big && a > .8) {
        g.fillRect(st.x - 1, st.y, 3, 1);
        g.fillRect(st.x, st.y - 1, 1, 3);
      }
    }
    g.globalAlpha = 1;

    // 3. ดาวตกพาดผ่านฟ้า
    nextShoot -= dt;
    if (!shoot && nextShoot <= 0) {
      shoot = { x: W * (.2 + Math.random() * .5), y: 4 + Math.random() * hz * .22, t: 0 };
      nextShoot = 6 + Math.random() * 7;
    }
    if (shoot) {
      shoot.t += dt;
      const k = shoot.t / .55;
      const px = shoot.x - k * 46;
      const py = shoot.y + k * 20;
      for (let i = 0; i < 7; i++) {
        g.globalAlpha = Math.max(0, (1 - k) * (1 - i / 7));
        g.fillStyle = '#fff6c8';
        g.fillRect(Math.round(px + i * 2.2), Math.round(py - i), 1, 1);
      }
      g.globalAlpha = 1;
      if (k >= 1) shoot = null;
    }

    // 4. เมฆลอยเอื่อย
    for (const c of clouds) {
      c.x += c.v * dt;
      if (c.x > W + 4) c.x = -c.c.width - 4;
      g.globalAlpha = .9;
      g.drawImage(c.c, Math.round(c.x), Math.round(c.y));
    }
    g.globalAlpha = 1;

    // 5. ภูมิประเทศและเทือกเขา
    g.drawImage(land, 0, 0);

    // 6. ควันจากปล่องไฟบ้านฟาร์ม
    if (house) {
      smokeT -= dt;
      if (smokeT <= 0) {
        smokeT = .55;
        parts.push({ x: house.x, y: house.y, vx: 3, vy: -6, life: 2.2, t: 0, c: '#b4a2c0', smoke: 1 });
      }
    }

    // 7. เงาและตัวละครฮีโร่บนเนิน
    const f = heroFrame(t);
    if (f) {
      g.globalAlpha = .32;
      for (let y = -2; y <= 2; y++) {
        const hw = Math.round(9 * Math.sqrt(1 - (y * y) / 6.25));
        g.fillStyle = '#0a0518';
        g.fillRect(hx - hw, hy + y, hw * 2 + 1, 1);
      }
      g.globalAlpha = 1;

      // Idle Breathing bob เบาๆ 1px
      const bob = (t - selT > .5 && Math.floor(t * 1.6) % 2) ? -1 : 0;
      g.drawImage(f.b || f.c, Math.round(hx - f.ax), Math.round(hy - f.ay + bob));
    }

    // 8. ทุ่งหญ้าฉากหน้า
    g.drawImage(fg, 0, 0);

    // 9. ฝูงหิ่งห้อยเรืองแสง
    for (const fl of flies) {
      const x = fl.x + Math.sin(t * fl.sp + fl.ph) * fl.ax;
      const y = fl.y + Math.cos(t * fl.sp * 1.3 + fl.ph) * fl.ay;
      const a = .5 + .5 * Math.sin(t * 2.2 + fl.ph * 3);

      g.globalAlpha = .18 * a;
      g.fillStyle = '#e4ff82';
      g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      g.globalAlpha = .4 + .6 * a;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    g.globalAlpha = 1;

    // 10. อนุภาคควันและประกายไฟ
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) {
        parts.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.smoke) p.vy += 22 * dt;

      const k = 1 - p.t / p.life;
      g.globalAlpha = p.smoke ? .5 * k : k;
      g.fillStyle = p.c;

      const sz = p.smoke ? 1 + Math.floor((1 - k) * 2) : 1;
      g.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);

      if (!p.smoke && k > .6) {
        g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1);
        g.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3);
      }
    }
    g.globalAlpha = 1;
  }

  function loop(ts) {
    if (T.classList.contains('hidden') || document.hidden) {
      setTimeout(() => requestAnimationFrame(loop), 300);
      return;
    }
    if (!sky && !bake()) {
      requestAnimationFrame(loop);
      return;
    }
    if (ts - last >= 33) {
      last = ts;
      draw(ts / 1000);
    }
    requestAnimationFrame(loop);
  }

  /* =====================================================================
     SECTION 5: เชื่อมต่อเหตุการณ์ UI และ Event Listeners
     ===================================================================== */
  let rt = 0;
  const rebake = () => {
    clearTimeout(rt);
    rt = setTimeout(() => { sky = null; }, 120);
  };

  addEventListener('resize', rebake);
  addEventListener('orientationchange', rebake);

  if (window.ResizeObserver) {
    const w = T.querySelector('.win');
    if (w) new ResizeObserver(rebake).observe(w);
  }

  document.querySelectorAll('.gcard').forEach(b => {
    b.addEventListener('click', () => select(b.dataset.g));
  });

  const on = document.querySelector('.gcard.on');
  selG = on ? on.dataset.g : 'm';
  select(selG, true);

  const hb = document.getElementById('howBtn');
  if (hb) {
    hb.addEventListener('click', () => {
      const o = T.classList.toggle('showhow');
      hb.textContent = o ? 'กลับ' : 'วิธีเล่น';
      rebake();
    });
  }

  try { drawEmblem(); } catch (e) {}

  requestAnimationFrame(loop);
})();
