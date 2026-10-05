'use strict';
/* =====================================================================
   GFX — pipeline สไปรต์พิกเซลอาร์ต (โหลดก่อน game.js)
   - หน่วย "art px" = 1/2 หน่วย logic (RS=2): logic ยังเป็นช่อง 16px เหมือนเดิม
   - สร้างสไปรต์เป็นเลเยอร์ (ฟังก์ชันวาด) → autoShade (3 โทน) → outline → cache เป็น frame
   - ตอนเล่นใช้ drawImage อย่างเดียว ไม่มี fillRect ต่อจุด / ไม่มี shadowBlur / filter
   - รองรับ Pixel-perfect rendering, Canvas crisp scaling (384x224),
     Pixel-Art Dynamic Lighting & Soft Shadows
   ===================================================================== */
const RS = 2;
const GFX = (function () {
  const hex = h => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };

  const toHex = (r, g, b) =>
    '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  };

  const LIGHT = [255, 243, 196], SHADE = [42, 26, 74], INK = [26, 16, 32];     // แสงอุ่น / เงาม่วงเย็น / หมึกขอบ
  const ramp = c => ({
    hi: mix(c, '#fff3c4', .34),
    base: c,
    lo: mix(c, '#2a1a4a', .34),
    dk: mix(c, '#2a1a4a', .62)
  });

  /* ---------- Canvas Context Smoothing Helper ---------- */
  function disableSmoothing(ctx) {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
  }

  /* ---------- layer: canvas เล็ก + primitives (พิกัดสัมพัทธ์กับจุดยืนเท้า ax,ay) ---------- */
  function layer(w, h, ax, ay) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    disableSmoothing(g);

    const L = {
      c, g, w, h, ax, ay,
      px(x, y, ww, hh, col) {
        g.fillStyle = col;
        g.fillRect(ax + x, ay + y, ww, hh);
        return L;
      },
      ell(cx, cy, rx, ry, col) {
        g.fillStyle = col;
        const R = ry + .5;
        for (let y = -ry; y <= ry; y++) {
          const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R))) + .5);
          g.fillRect(ax + cx - hw, ay + cy + y, hw * 2 + 1, 1);
        }
        return L;
      },
      line(x0, y0, x1, y1, col, t = 1) {
        g.fillStyle = col;
        let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0),
            sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1,
            e = dx + dy;
        for (let n = 0; n < 400; n++) {
          g.fillRect(ax + x0, ay + y0, t, t);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * e;
          if (e2 >= dy) { e += dy; x0 += sx; }
          if (e2 <= dx) { e += dx; y0 += sy; }
        }
        return L;
      },
      /* ตาราง palette index: rows = สตริง, pal = {ตัวอักษร:สี}, '.' = โปร่ง, ox/oy = มุมซ้ายบนสัมพัทธ์ */
      grid(rows, pal, ox, oy, flip) {
        rows.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const ch = flip ? row[row.length - 1 - i] : row[i];
            const col = pal[ch];
            if (col && ch !== '.') {
              g.fillStyle = col;
              g.fillRect(ax + ox + i, ay + oy + j, 1, 1);
            }
          }
        });
        return L;
      },
      blit(o, dx = 0, dy = 0) {
        g.drawImage(o.c, dx, dy);
        return L;
      },
      /* 3 โทน: ขอบบน/ซ้ายสว่าง ขอบล่าง/ขวาเข้ม (n = ความหนาของขอบแสง) */
      shade(n = 1, hiK = .3, loK = .32) {
        return shadeLayer(L, n, hiK, loK);
      },
      outline(strength = .74, col) {
        return outlineLayer(L, strength, col);
      },
      clear() {
        g.clearRect(0, 0, w, h);
        return L;
      }
    };
    return L;
  }

  function shadeLayer(L, n, hiK, loK) {
    const { g, w, h } = L, im = g.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d);
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 128;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!op(x, y)) continue;
        let hi = false, lo = false;
        for (let k = 1; k <= n; k++) {
          if (!op(x, y - k) || !op(x - k, y)) hi = true;
          if (!op(x, y + k) || !op(x + k, y)) lo = true;
        }
        if (hi === lo) continue;
        const i = (y * w + x) * 4, T = hi ? LIGHT : SHADE, k = hi ? hiK : loK;
        d[i] += (T[0] - d[i]) * k;
        d[i + 1] += (T[1] - d[i + 1]) * k;
        d[i + 2] += (T[2] - d[i + 2]) * k;
      }
    }
    g.putImageData(im, 0, 0);
    return L;
  }

  function outlineLayer(L, strength, fixed) {
    const { g, w, h } = L, im = g.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d);
    const a = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? src[(y * w + x) * 4 + 3] : 0;
    const F = fixed ? hex(fixed) : null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (a(x, y) > 128) continue;
        let r = 0, gg = 0, b = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx, yy = y + dy;
          if (a(xx, yy) > 128) {
            const j = (yy * w + xx) * 4;
            r += src[j];
            gg += src[j + 1];
            b += src[j + 2];
            n++;
          }
        }
        if (!n) continue;
        const i = (y * w + x) * 4;
        if (F) {
          d[i] = F[0];
          d[i + 1] = F[1];
          d[i + 2] = F[2];
        } else {
          d[i] = r / n + (INK[0] - r / n) * strength;
          d[i + 1] = gg / n + (INK[1] - gg / n) * strength;
          d[i + 2] = b / n + (INK[2] - b / n) * strength;
        }
        d[i + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
    return L;
  }

  /* ---------- frame = canvas สำเร็จรูป + จุดยืน; มีตัวแปรสี (flash) cache ไว้ ---------- */
  function frame(L) {
    const c = document.createElement('canvas');
    c.width = L.w;
    c.height = L.h;
    const g = c.getContext('2d');
    disableSmoothing(g);
    g.drawImage(L.c, 0, 0);
    const f = { c, w: L.w, h: L.h, ax: L.ax, ay: L.ay, v: {}, b: null };
    bmp(f);
    return f;
  }

  function bmp(f) {
    if (!window.createImageBitmap) return;
    try {
      createImageBitmap(f.c).then(b => { f.b = b; }).catch(() => {});
    } catch (e) {}
  }

  /* ---------- Background Texture Baking Queue ---------- */
  const jobs = [];
  let pending = false;
  let ema = 6;
  let loadUntil = 0;
  const busy = () => {
    try {
      return typeof running !== 'undefined' && running && !paused && !modal && performance.now() > loadUntil;
    } catch (e) {
      return false;
    }
  };

  function pump(d) {
    pending = false;
    const t0 = performance.now(), play = busy(), budget = play ? 2.5 : 14;
    let n = 0;
    while (jobs.length) {
      const forced = !!(d && d.didTimeout), rem = (d && d.timeRemaining && !forced) ? d.timeRemaining() : budget;
      if (play && !forced && rem < ema * 1.15 + 1) break;
      if (n > 0 && (forced || performance.now() - t0 > budget)) break;
      const t1 = performance.now();
      try { jobs.shift()(); } catch (e) {}
      ema = ema * .7 + (performance.now() - t1) * .3;
      n++;
    }
    if (jobs.length) sched();
  }

  function sched() {
    if (pending) return;
    pending = true;
    if (busy()) {
      if (window.requestIdleCallback) requestIdleCallback(pump, { timeout: 1200 });
      else setTimeout(pump, 60);
    } else {
      setTimeout(pump, 0);
    }
  }

  const tc = document.createElement('canvas');
  tc.width = tc.height = 1;
  const tg = tc.getContext('2d');
  function touch(f) {
    try { if (f && f.c) tg.drawImage(f.c, 0, 0, 1, 1); } catch (e) {}
    return f;
  }

  function later(fn, front) {
    if (front) jobs.unshift(fn);
    else jobs.push(fn);
    sched();
  }

  function tinted(f, col) {
    let t = f.v[col];
    if (t) return t.b || t.c;
    const c = document.createElement('canvas');
    c.width = f.w;
    c.height = f.h;
    const g = c.getContext('2d');
    disableSmoothing(g);
    g.drawImage(f.c, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = col;
    g.fillRect(0, 0, f.w, f.h);
    const t2 = { c, b: null };
    bmp(t2);
    f.v[col] = t2;
    return c;
  }

  /* x,y = จุดยืนเท้าในหน่วย logic; flip = กลับซ้ายขวารอบจุดยืน; tint = rgba string หรือ null */
  function draw(g, f, x, y, flip, tint, alpha) {
    if (!f || !g) return;
    disableSmoothing(g);

    // ป้องกัน subpixel jittering โดยการ snap เข้ากับ logic grid
    x = Math.round(x * RS) / RS;
    y = Math.round(y * RS) / RS;
    const src = tint ? tinted(f, tint) : (f.b || f.c);

    if (alpha !== undefined && alpha !== 1) g.globalAlpha = alpha;
    if (flip) {
      g.save();
      g.translate(x, y);
      g.scale(-1, 1);
      g.drawImage(src, -Math.round(f.ax) / RS, -Math.round(f.ay) / RS, f.w / RS, f.h / RS);
      g.restore();
    } else {
      g.drawImage(src, x - Math.round(f.ax) / RS, y - Math.round(f.ay) / RS, f.w / RS, f.h / RS);
    }
    if (alpha !== undefined && alpha !== 1) g.globalAlpha = 1;
  }

  /* ---------- Shadow System (แคชตามขนาด, สไตล์เงา Pixel RPG โทนเย็น) ---------- */
  const shCache = {};
  function shadow(rx, ry) {
    const k = rx + '_' + ry;
    if (shCache[k]) return shCache[k];
    const w = rx * 2 + 3, h = ry * 2 + 3, L = layer(w, h, rx + 1, ry + 1);
    // ชั้นนอก: โทนม่วงเข้มโปร่งใส นุ่มตา
    L.ell(0, 0, rx, ry, 'rgba(16,10,36,0.24)');
    // ชั้นใน: แกนเงาเข้มขึ้น ช่วยเน้นมิติการสัมผัสพื้น
    L.ell(0, 0, Math.max(1, rx - 2), Math.max(0, ry - 1), 'rgba(16,10,36,0.22)');
    return (shCache[k] = frame(L));
  }

  function drawShadow(g, x, y, rx, ry, alpha = 1) {
    draw(g, shadow(rx, ry), x, y, false, null, alpha);
  }

  /* art-px rect ลง ctx หลัก (หน่วย logic) สำหรับเอฟเฟกต์เล็กๆ */
  const ar = (g, x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(x / RS, y / RS, w / RS, h / RS);
  };

  /* =====================================================================
     Visual Enhancement & System Extensions (Non-destructive APIs)
     ===================================================================== */

  /* จัดการความคมชัดของ Canvas และขยายเต็มจอแบบ Perfect Aspect Ratio (384x224) */
  function setupCanvas(canvas, targetW = 384, targetH = 224) {
    if (!canvas) return null;
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    disableSmoothing(ctx);

    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
    return ctx;
  }

  /* คำนวณ Scale สำหรับ Responsive Fullscreen โดยไม่เสียอัตราส่วน */
  function fitScreen(canvas, maxW = window.innerWidth, maxH = window.innerHeight, integerScaleOnly = false) {
    if (!canvas) return 1;
    const baseW = canvas.width || 384;
    const baseH = canvas.height || 224;
    let scale = Math.min(maxW / baseW, maxH / baseH);
    if (integerScaleOnly && scale >= 1) scale = Math.floor(scale);

    canvas.style.width = Math.floor(baseW * scale) + 'px';
    canvas.style.height = Math.floor(baseH * scale) + 'px';
    return scale;
  }

  /* ---------- Lightweight Pixel-Art Lighting Support ---------- */
  let lightCanvas = null, lightCtx = null;
  function getLightLayer(w = 384, h = 224) {
    if (!lightCanvas) {
      lightCanvas = document.createElement('canvas');
      lightCtx = lightCanvas.getContext('2d');
      disableSmoothing(lightCtx);
    }
    if (lightCanvas.width !== w || lightCanvas.height !== h) {
      lightCanvas.width = w;
      lightCanvas.height = h;
      disableSmoothing(lightCtx);
    }
    return { canvas: lightCanvas, ctx: lightCtx };
  }

  function beginLighting(ambientCol = 'rgba(10,8,22,0.65)', w = 384, h = 224) {
    const { ctx } = getLightLayer(w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = ambientCol;
    ctx.fillRect(0, 0, w, h);
    return ctx;
  }

  /* วาดดวงไฟแบบ Pixel Stepping (ไม่มีการเบลอเพื่อคงเสน่ห์ Pixel Art) */
  function drawPointLight(x, y, radius, intensity = 1.0, col = '255,240,180') {
    if (!lightCtx) return;
    lightCtx.save();
    lightCtx.globalCompositeOperation = 'destination-out';

    const steps = 4;
    for (let i = steps; i >= 1; i--) {
      const r = Math.round((radius * i) / steps);
      const alpha = (intensity / steps) * 0.9;
      lightCtx.fillStyle = `rgba(0,0,0,${alpha})`;
      lightCtx.beginPath();
      lightCtx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
      lightCtx.fill();
    }
    lightCtx.restore();
  }

  /* ผสานเลเยอร์แสงลงบน main game context */
  function applyLighting(mainCtx) {
    if (!lightCanvas || !mainCtx) return;
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'multiply';
    mainCtx.drawImage(lightCanvas, 0, 0);
    mainCtx.restore();
  }

  return {
    // Original Public APIs (Strictly Maintained)
    hex, toHex, mix, ramp, layer, frame, draw, tinted, shadow, drawShadow, ar,
    shadeLayer, outlineLayer, later, touch,
    loadFor: ms => { loadUntil = performance.now() + ms; },

    // Enhanced Utilities for Display & Pixel Graphics
    disableSmoothing,
    setupCanvas,
    fitScreen,
    getLightLayer,
    beginLighting,
    drawPointLight,
    applyLighting
  };
})();
