'use strict';
/* =====================================================================
   ART WARM (v9 Remastered): 
   1) Pre-warming Engine: ป้องกันการกระตุก (zero-stutter) ตอนฟัน/สกิล/ตัวอักษร
   2) Warm Ambient Atmosphere System: ละอองเกสรในฟาร์ม, ใบไม้ร่วงในป่า,
      ประกายฝุ่นคริสตัลในถ้ำ, สายลมพัดเอื่อยๆ สไตล์ Pixel RPG
   3) ไม่สร้าง Object/Canvas ใน Render Loop — ประหยัดแบตเตอรี่และลื่นไหลบนมือถือ
   4) รักษา Pre-warm Logic, pixText, Audio Buffer Reuse และ Global APIs เดิม 100%
   ===================================================================== */
(function () {
  const VIEW = ['d', 's', 's', 'u'];
  const HERO_TINT = 'rgba(255,255,255,.7)';
  const MON_TINTS = ['rgba(255,255,255,.75)', 'rgba(140,210,255,.6)'], WIND_TINT = 'rgba(255,60,60,.4)';
  const HUMAN = { goblin: 1, skel: 1, golem: 1 };
  const heroDone = {};
  let monDone = false, fxDone = false, pixDone = false;

  /* =====================================================================
     SECTION 1: Pre-warming Pipeline (Zero-Stutter Optimization)
     ===================================================================== */
  function warmHeroFor(g, wl) {
    if (typeof HERO_ART === 'undefined') return;
    const key = g + wl;
    if (heroDone[key]) return;
    heroDone[key] = 1;
    const cur = VIEW[P.dir] || 'd', views = [cur].concat(['d', 's', 'u'].filter(v => v !== cur));
    const jobs = [];
    const job = (pose, v, k) => jobs.push(() => {
      const f = HERO_ART.getFrame(g, wl, pose, v, k);
      GFX.touch(f);
      GFX.tinted(f, HERO_TINT);
    });

    for (const v of views) {
      for (let k = 0; k < 4; k++) job('atk', v, k);
      job('cast', v, 0);
    }
    for (const v of views) {
      for (let k = 0; k < 4; k++) job('walk', v, k);
    }
    jobs.push(() => {
      const f = HERO_ART.getFrame(g, wl, 'dead', 'd', 0);
      GFX.touch(f);
      GFX.tinted(f, HERO_TINT);
    });

    for (let i = jobs.length - 1; i >= 0; i--) GFX.later(jobs[i], true);
  }

  function warmMon() {
    if (monDone || typeof MON_ART === 'undefined') return;
    monDone = true;
    const tintAll = (f, wind) => {
      GFX.touch(f);
      MON_TINTS.forEach(t => GFX.tinted(f, t));
      if (wind) GFX.tinted(f, WIND_TINT);
    };

    for (const type in MON_ART.WALKN) {
      const n = MON_ART.WALKN[type], views = HUMAN[type] ? ['s', 'd', 'u'] : ['s'];
      for (const v of views) {
        for (let k = 0; k < n; k++) GFX.later(() => tintAll(MON_ART.get(type, v, 'walk', k)));
        GFX.later(() => tintAll(MON_ART.get(type, v, 'wind', 0), true));
      }
    }
  }

  function warmFx() {
    if (fxDone || typeof FX_ART === 'undefined' || !FX_ART.warm) return;
    fxDone = true;
    FX_ART.warm();
  }

  let warmedBoot = false;
  function boot() {
    if (warmedBoot) return;
    warmedBoot = true;
    ['m', 'f'].forEach(g => warmHeroFor(g, P.wl || 0));
    warmFx();
    warmMon();
    if (!pixDone) {
      pixDone = true;
      pixWarm();
    }
  }
  setTimeout(boot, 50);

  let wasRunning = false;
  setInterval(() => {
    const run = typeof running !== 'undefined' && running;
    if (run && !wasRunning) GFX.loadFor(2500);
    wasRunning = run;
    if (!run) return;
    warmHeroFor(P.g, P.wl || 0);
    boot();
  }, 100);

  /* =====================================================================
     SECTION 2: Cached Pixel Text Rendering (pixText Engine)
     ===================================================================== */
  let pixWarm = () => {};
  window.pixTextFlush = () => {};

  if (typeof pixText === 'function' && typeof Q !== 'undefined') {
    const orig = pixText, whole = new Map(), glyphs = new Map(), ASCII = /^[\x20-\x7e]+$/;
    const FS = sc => Math.max(1, Math.round(7 * sc)), LW = sc => Math.max(2, sc * 1.6);

    function bakeBox(w, h) {
      const c = document.createElement('canvas');
      c.width = w * Q;
      c.height = h * Q;
      const g = c.getContext('2d');
      g.setTransform(Q, 0, 0, Q, 0, 0);
      return [c, g];
    }

    function bake(s, col, sc, center, out) {
      const k = Q, fs = FS(sc), lw = LW(sc), pad = Math.ceil(lw) + 3;
      const m = document.createElement('canvas').getContext('2d');
      m.font = '700 ' + (fs * k) + 'px Sarabun,sans-serif';
      const tw = m.measureText(s).width / k;
      let w = Math.ceil(tw) + pad * 2;
      if (w % 2) w++;
      const h = Math.ceil(fs * 1.7) + pad * 2;

      const [c, g] = bakeBox(w, h);
      g.font = '700 ' + fs + 'px Sarabun,sans-serif';
      g.textAlign = center ? 'center' : 'left';
      g.textBaseline = 'top';
      g.lineJoin = 'round';
      g.lineWidth = lw;
      g.strokeStyle = out;
      g.fillStyle = col;
      const ox = center ? w / 2 : pad;
      g.strokeText(s, ox, pad);
      g.fillText(s, ox, pad);
      return { c, w, h, ox, oy: pad };
    }

    function glyph(ch, col, sc, out) {
      const key = ch + '|' + col + '|' + sc + '|' + out;
      let e = glyphs.get(key);
      if (e) return e;

      const k = Q, fs = FS(sc), lw = LW(sc), pad = Math.ceil(lw) + 3;
      const m = document.createElement('canvas').getContext('2d');
      m.font = '700 ' + (fs * k) + 'px Sarabun,sans-serif';
      const adv = m.measureText(ch).width / k;
      const w = Math.ceil(adv) + pad * 2, h = Math.ceil(fs * 1.7) + pad * 2;

      const [c, g] = bakeBox(w, h);
      g.font = '700 ' + fs + 'px Sarabun,sans-serif';
      g.textAlign = 'left';
      g.textBaseline = 'top';
      g.lineJoin = 'round';
      g.lineWidth = lw;
      g.strokeStyle = out;
      g.fillStyle = col;
      g.strokeText(ch, pad, pad);
      g.fillText(ch, pad, pad);

      e = { c, w, h, pad, adv };
      if (glyphs.size > 600) glyphs.clear();
      glyphs.set(key, e);
      return e;
    }

    function drawAscii(s, x, y, col, sc, center, out) {
      const gs = [];
      let total = 0;
      for (const ch of s) {
        const e = glyph(ch, col, sc, out);
        gs.push(e);
        total += e.adv;
      }
      let pen = center ? x - total / 2 : x;
      for (const e of gs) {
        ctx.drawImage(e.c, Math.round((pen - e.pad) * Q) / Q, y - e.pad, e.w, e.h);
        pen += e.adv;
      }
    }

    pixText = function (s, x, y, col, sc = 1, center = false, out = '#0b0b12') {
      try {
        s = String(s);
        x = Math.round(x);
        y = Math.round(y);
        if (ASCII.test(s)) return drawAscii(s, x, y, col, sc, center, out);

        const key = s + '|' + col + '|' + sc + '|' + center + '|' + out;
        let e = whole.get(key);
        if (!e) {
          e = bake(s, col, sc, center, out);
          if (whole.size > 400) whole.clear();
          whole.set(key, e);
        }
        ctx.drawImage(e.c, x - e.ox, y - e.oy, e.w, e.h);
      } catch (err) {
        orig(s, x, y, col, sc, center, out);
      }
    };

    pixWarm = function () {
      const O = '#0b0b12', chars = '0123456789+-!GEXPHM %';
      [
        ['#ffffff', 1], ['#ffd23f', 1], ['#ffd23f', 2], ['#ff5a66', 1],
        ['#8ee05a', 1], ['#ff7a86', 1], ['#7fb6ff', 1], ['#9be0ff', 1], ['#ff5a4a', 2]
      ].forEach(([c, sc]) => GFX.later(() => {
        for (const ch of chars) glyph(ch, c, sc, O);
      }));

      if (typeof MON !== 'undefined') {
        for (const t in MON) {
          const n = MON[t] && MON[t].name;
          if (n) GFX.later(() => {
            const key = n + '|#ffd7a8|0.75|true|' + O;
            if (!whole.has(key)) whole.set(key, bake(n, '#ffd7a8', .75, true, O));
          });
        }
      }

      GFX.later(() => {
        const n = P.name || '', key = n + '|#ffffff|0.85|true|' + O;
        if (n && !ASCII.test(n) && !whole.has(key)) whole.set(key, bake(n, '#ffffff', .85, true, O));
      });
    };

    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => {
        whole.clear();
        glyphs.clear();
      });
    }
    window.pixTextFlush = () => {
      whole.clear();
      glyphs.clear();
    };
  }

  /* =====================================================================
     SECTION 3: Audio Buffer Reuse & Noise Optimization
     ===================================================================== */
  if (typeof noise === 'function' && typeof tone === 'function') {
    let nbuf = null, nrate = 0;
    function getNoise() {
      if (nbuf && nrate === AC.sampleRate) return nbuf;
      nrate = AC.sampleRate;
      const n = Math.floor(nrate * .5);
      nbuf = AC.createBuffer(1, n, nrate);
      const a = nbuf.getChannelData(0);
      for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
      return nbuf;
    }

    noise = function (d, v = .05, delay = 0) {
      if (!AC || muted) return;
      try {
        const t = AC.currentTime + delay, s = AC.createBufferSource(), g = AC.createGain();
        s.buffer = getNoise();
        g.gain.setValueAtTime(v, t);
        g.gain.linearRampToValueAtTime(.0001, t + d);
        s.connect(g);
        g.connect(AC.destination);
        s.start(t, Math.random() * .2, d + .02);
      } catch (e) {}
    };

    const origS = SFX;
    ['slash', 'hit', 'spin', 'fire'].forEach(k => {
      const f = origS[k];
      if (typeof f !== 'function') return;
      let last = 0;
      origS[k] = function () {
        const t = performance.now();
        if (t - last < 45) return;
        last = t;
        return f.apply(this, arguments);
      };
    });
  }

  /* =====================================================================
     SECTION 4: Warm Ambient Atmosphere System (Pixel Particles & Breeze)
     ===================================================================== */
  const P_SEED = [0.18, 0.42, 0.77, 0.29, 0.91, 0.53, 0.84, 0.12, 0.65, 0.38, 0.71, 0.25, 0.88, 0.49, 0.61, 0.33];

  function drawWarmAtmosphere(targetCtx) {
    if (!targetCtx || typeof S === 'undefined' || typeof zone === 'undefined') return;

    const t = S.t || 0;
    const zn = zone || 'farm';
    const isLite = typeof Q !== 'undefined' && Q < 4;
    const count = isLite ? 8 : 16;
    const vw = typeof VW !== 'undefined' ? VW : 384;
    const vh = typeof VH !== 'undefined' ? VH : 224;
    const cY = typeof camY !== 'undefined' ? camY : 0;

    // คำนวณความเร็วและทิศทางลมแบบต่อเนื่อง
    const windBase = Math.sin(t * 0.8) * 12;

    targetCtx.save();

    for (let i = 0; i < count; i++) {
      const s1 = P_SEED[i % P_SEED.length];
      const s2 = P_SEED[(i * 3 + 5) % P_SEED.length];
      const s3 = P_SEED[(i * 7 + 2) % P_SEED.length];

      let px, py, sz = 1, col, alpha;

      if (zn === 'farm') {
        // ละอองเกสรดอกไม้และละอองแดดอบอุ่น (Golden Pollen & Warm Dapples)
        const cycle = (t * 0.35 + s1 * 10) % 1;
        px = (s2 * vw + cycle * 45 + windBase + Math.sin(t * 1.6 + i) * 8) % vw;
        py = (s3 * vh + Math.sin(t * 1.2 + i * 2) * 10 - cY * 0.1) % vh;
        if (py < 0) py += vh;

        sz = s1 > 0.65 ? 2 : 1;
        alpha = Math.sin(cycle * Math.PI) * (s1 > 0.5 ? 0.45 : 0.28);
        col = s1 > 0.7 ? '#fff6b0' : (s1 > 0.35 ? '#ffd54f' : '#ffecb3');

      } else if (zn === 'cave') {
        // ละอองฝุ่นและไอคริสตัลระยิบระยับ (Cave Crystal Dust)
        const cycle = (t * 0.25 + s1 * 8) % 1;
        px = (s2 * vw + Math.sin(t * 0.9 + i * 1.5) * 6) % vw;
        py = (s3 * vh - cycle * 30 - cY * 0.05) % vh;
        if (py < 0) py += vh;

        sz = s1 > 0.75 ? 2 : 1;
        alpha = Math.sin(cycle * Math.PI) * 0.5;
        col = s1 > 0.6 ? '#80d8ff' : (s1 > 0.3 ? '#40c4ff' : '#e1f5fe');

      } else {
        // ป่าล่าสัตว์: ใบไม้ร่วงและละอองลมพัดเฉียง (Falling Leaves & Forest Breeze)
        const cycle = (t * 0.45 + s1 * 12) % 1;
        px = (s2 * vw + cycle * 70 + windBase * 1.5) % vw;
        py = (s3 * vh + cycle * 40 - cY * 0.15) % vh;
        if (py < 0) py += vh;

        sz = s1 > 0.5 ? 2 : 1;
        alpha = Math.sin(cycle * Math.PI) * 0.42;
        col = s1 > 0.65 ? '#81c784' : (s1 > 0.35 ? '#dce775' : '#ffb74d');
      }

      if (alpha > 0.05) {
        targetCtx.globalAlpha = alpha;
        targetCtx.fillStyle = col;
        targetCtx.fillRect(Math.round(px), Math.round(py), sz, sz);
      }
    }

    targetCtx.restore();
  }

  window.drawWarmAtmosphere = drawWarmAtmosphere;

  /* เชื่อมระบบเข้ากับ ENV_LIGHT โดยอัตโนมัติ (หลังวาดแสงเพื่อเป็น Foreground Atmosphere) */
  if (typeof window.ENV_LIGHT === 'function') {
    const _origLight = window.ENV_LIGHT;
    window.ENV_LIGHT = function (c, minutes, hz, zn) {
      _origLight(c, minutes, hz, zn);
      try {
        drawWarmAtmosphere(c);
      } catch (e) {}
    };
  }

  /* =====================================================================
     SECTION 5: Real-time Performance Monitor (?perf=1)
     ===================================================================== */
  if (/[?&]perf=1/.test(location.search)) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:99;background:rgba(0,0,0,.75);color:#9f9;font:10px monospace;padding:3px 5px;pointer-events:none;white-space:pre;max-width:60vw';
    document.body.appendChild(box);
    const log = [];
    let last = performance.now(), acc = [], worst = 0, evt = '';

    ['tryAttack', 'tryFire', 'trySpin', 'trySk3'].forEach(n => {
      const o = window[n];
      if (typeof o === 'function') {
        window[n] = function () {
          evt = n + '@' + (performance.now() | 0);
          return o.apply(this, arguments);
        };
      }
    });

    (function tick(t) {
      const dt = t - last;
      last = t;
      acc.push(dt);
      if (acc.length > 60) acc.shift();
      if (dt > worst) worst = dt;
      if (dt > 24) {
        log.push(Math.round(dt) + 'ms ' + evt);
        if (log.length > 5) log.shift();
      }
      const avg = acc.reduce((a, b) => a + b, 0) / acc.length;
      box.textContent = 'Q=' + Q + ' dt ' + dt.toFixed(0) + ' avg ' + avg.toFixed(1) + ' max ' + worst.toFixed(0) + '\n' + log.join('\n');
      requestAnimationFrame(tick);
    })(last);

    setInterval(() => { worst = 0; }, 5000);
  }
})();
