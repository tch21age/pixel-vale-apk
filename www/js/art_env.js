'use strict';
/* =====================================================================
   ART ENV (กลุ่ม 2): พื้นหญ้า ทางดิน น้ำ ต้นไม้ พุ่มไม้ หิน ถ้ำ
   - logic ยังเป็นช่อง 16px (T) เหมือนเดิม: ใช้ z.t / z.solid / z.objs / z.water เดิมทุกอย่าง
   - วาดที่ 2 เท่า (RS=2) ลง canvas ใหญ่ครั้งเดียวต่อโซน (cache ใน z.ground) แล้ว drawImage ย่อลงมา
   - ทับ buildZone (เรียกของเดิมเพื่อสร้างข้อมูล แล้ววาดพื้นใหม่ทับ) และ drawObj/drawTree
   - สไตล์ Pixel RPG แท้: ขอบคมชัด, เลเยอร์แสงเงา 3-4 ระดับ, ไม่มี blur/filter
   ===================================================================== */
const ENV_PAL = {
  farm: {
    base: ['#5e8332', '#6b9239', '#54772d'],
    dark: '#3e5c21',
    light: '#83aa43',
    tuft: '#344e1c',
    tuftL: '#97bf4e'
  },
  hunt: {
    base: ['#4b6f34', '#557b3b', '#41622c'],
    dark: '#2f491f',
    light: '#6d954e',
    tuft: '#263b1a',
    tuftL: '#82ad5e'
  },
  cave: {
    base: ['#423d57', '#4b4562', '#39344c'],
    dark: '#282436',
    light: '#5e5779',
    tuft: '#201d2c',
    tuftL: '#746c94'
  },
  dirt: ['#ad8453', '#9f7847', '#b9905e'],
  dirtD: '#74542e',
  dirtL: '#d1ad77',
  pebble: ['#797670', '#96938a', '#5c5a55', '#b8b5ac'],
  water: ['#3568a0', '#2d588b', '#427cbd', '#21436e'],
  waterD: '#1a3457',
  waterL: '#7eb5e6',
  foam: '#dff2fd',
  leaf: {
    green: ['#1f4422', '#2f632d', '#49863c', '#72b053', '#98d172'],
    teal:  ['#1c4044', '#295f62', '#3e8486', '#61adaa', '#8bd2cc'],
    autumn:['#5c3214', '#8c4e1f', '#bf7228', '#e3993d', '#f6c564'],
    dead:  ['#2c221a', '#433428', '#5c4a3b', '#7a6452', '#99826e']
  },
  trunk: ['#29180c', '#422814', '#5e3c20', '#825630', '#a87445'],
  rock: ['#282633', '#434052', '#636075', '#86839b', '#aaa7bf'],
  rockCave: ['#1e1c2e', '#33304a', '#4e4a6e', '#6e6a94', '#938ebc']
};

(function () {
  const RSc = RS;
  const mixc = GFX.mix;
  const rr = a => mulberry(a);

  /* ---------- Deterministic Value Noise Generator ---------- */
  function mkNoise(seed) {
    const r0 = rr(seed), G = 64, tab = [];
    for (let i = 0; i < G * G; i++) tab.push(r0());
    const at = (x, y) => tab[((y % G + G) % G) * G + ((x % G + G) % G)];
    const sm = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y),
            fx = sm(x - xi), fy = sm(y - yi);
      const a = at(xi, yi), b = at(xi + 1, yi),
            c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }
  const fbm = (n, x, y) => n(x, y) * .58 + n(x * 2.1 + 7, y * 2.1 + 3) * .3 + n(x * 4.3 + 1, y * 4.3 + 9) * .12;

  /* ---------- Sprite Bake & Cache System ---------- */
  const sprCache = {};
  const hexOf = GFX.hex;

  function bake(key, w, h, ax, ay, fn, opt) {
    if (sprCache[key]) return sprCache[key];
    const L = GFX.layer(w, h, ax, ay);
    fn(L);
    if (!opt || opt.shade !== false) L.shade(1, .28, .30);
    L.outline(.75);
    return (sprCache[key] = GFX.frame(L));
  }

  /* ---------- Leaf Cluster Shapes (Multi-layered Spherical Volumes) ---------- */
  function leafCluster(L, cx, cy, rx, ry, pal, rand) {
    // 1. Deep Underside Shadow
    L.ell(cx, cy + 2, rx, ry, pal[0]);
    // 2. Base Tone
    L.ell(cx, cy, rx, ry, pal[1]);
    // 3. Midtone Bulk (shifted up-left toward light)
    L.ell(cx - 1, cy - 1, Math.max(1, rx - 2), Math.max(1, ry - 2), pal[2]);
    // 4. Primary Highlight
    const hrx = Math.max(1, Math.round(rx * 0.55)), hry = Math.max(1, Math.round(ry * 0.5));
    L.ell(cx - 2, cy - 2, hrx, hry, pal[3]);
    // 5. Specular Crest
    if (pal[4] && rx > 8) {
      L.ell(cx - 3, cy - 3, Math.max(1, Math.round(rx * 0.28)), Math.max(1, Math.round(ry * 0.25)), pal[4]);
    }

    // 6. Natural Leaf Silhouette Breakup (Crisp Edge Tufts)
    const tuftCount = Math.round((rx + ry) * 0.45);
    for (let i = 0; i < tuftCount; i++) {
      const a = (i / tuftCount) * Math.PI * 2 + rand() * 0.4;
      const d = 0.85 + rand() * 0.25;
      const tx = Math.round(cx + Math.cos(a) * rx * d);
      const ty = Math.round(cy + Math.sin(a) * ry * d);
      const col = (ty > cy) ? pal[0] : (tx < cx ? pal[3] : pal[2]);
      L.px(tx, ty, 2, 1, col);
    }
  }

  function leafCanopy(L, cx, cy, rx, ry, pal, rand) {
    // Large background bulk
    leafCluster(L, cx, cy + 3, rx, ry, pal, rand);

    // Front modular foliage bulbs
    const bulbs = [
      { ox: 0, oy: -3, r: 0.65 },
      { ox: -Math.round(rx * 0.45), oy: 1, r: 0.48 },
      { ox: Math.round(rx * 0.48), oy: 2, r: 0.46 },
      { ox: -Math.round(rx * 0.25), oy: -Math.round(ry * 0.35), r: 0.42 },
      { ox: Math.round(rx * 0.28), oy: -Math.round(ry * 0.32), r: 0.40 }
    ];

    bulbs.forEach(b => {
      leafCluster(L, cx + b.ox, cy + b.oy, Math.round(rx * b.r), Math.round(ry * b.r), pal, rand);
    });

    // Canopy Dapple Highlights (Pixel-Art Leaves Catching Direct Light)
    const hlCount = Math.round(rx * 0.8);
    for (let i = 0; i < hlCount; i++) {
      const a = rand() * Math.PI * 1.5 + Math.PI * 0.75;
      const d = rand() * 0.75;
      const px = Math.round(cx + Math.cos(a) * rx * d);
      const py = Math.round(cy + Math.sin(a) * ry * d);
      L.px(px, py, 2, 1, pal[4] || pal[3]);
    }
  }

  function treeFam(id, v) {
    if (id === 'hunt') return v === 1 ? 'teal' : v === 2 ? 'autumn' : 'green';
    return v === 2 ? 'autumn' : v === 1 ? 'teal' : 'green';
  }

  /* ---------- Tree Sprite Builder ---------- */
  function treeFrame(id, v, dead) {
    const fam = dead ? 'dead' : treeFam(id, v);
    const key = 'tree_' + fam + '_' + (dead ? 'd' : v) + '_' + (id === 'cave' ? 'c' : 'n');

    return bake(key, 64, 88, 32, 80, L => {
      const rand = rr(900 + v * 37 + fam.length * 11);
      const P = ENV_PAL.leaf[fam], tk = ENV_PAL.trunk;

      // 1. Trunk Base & Roots
      L.px(-5, -6, 11, 6, tk[1]);
      L.px(-8, -2, 5, 3, tk[0]);   // Left Root
      L.px(4, -2, 5, 3, tk[0]);    // Right Root
      L.px(-7, -3, 3, 2, tk[2]);
      L.px(4, -3, 3, 2, tk[1]);

      // 2. Main Trunk Pillar
      L.px(-4, -28, 8, 24, tk[2]);
      // Left Highlight Strip
      L.px(-4, -28, 2, 23, tk[3]);
      L.px(-2, -26, 1, 20, tk[4]);
      // Right Shadow Strip
      L.px(2, -28, 2, 24, tk[1]);
      L.px(3, -28, 1, 24, tk[0]);

      // Bark Texture Grooves
      for (let y = -24; y < -6; y += 4) {
        L.px(-1, y + Math.floor(rand() * 2), 2, 2, tk[1]);
        L.px(1, y + 2, 1, 2, tk[0]);
      }

      if (dead) {
        // Dead Branches with Sharp Silhouette
        L.px(-2, -50, 4, 24, tk[2]);
        L.px(-2, -50, 1, 24, tk[3]);
        L.px(1, -50, 1, 24, tk[1]);

        // Branch Left
        L.px(-14, -42, 13, 3, tk[2]);
        L.px(-15, -48, 3, 8, tk[2]);
        L.px(-15, -48, 1, 8, tk[3]);
        L.px(-20, -47, 6, 2, tk[1]);

        // Branch Right
        L.px(2, -36, 13, 3, tk[2]);
        L.px(12, -44, 3, 10, tk[2]);
        L.px(14, -43, 1, 9, tk[0]);
        L.px(14, -48, 5, 2, tk[2]);
        return;
      }

      // 3. Foliage Canopy
      // Shadow branch connection
      L.px(-3, -34, 6, 8, tk[0]);

      // Multi-tier Foliage Volumes
      leafCanopy(L, 0, -46, 23, 18, P, rand);
      leafCluster(L, -13, -37, 12, 10, P, rand);
      leafCluster(L, 14, -36, 12, 10, P, rand);
      leafCluster(L, 1, -57, 14, 11, P, rand);
    });
  }

  /* ---------- Bush Sprite Builder ---------- */
  function bushFrame(fam, v) {
    return bake('bush_' + fam + '_' + v, 48, 36, 24, 30, L => {
      const rand = rr(300 + v * 17 + fam.length);
      const P = ENV_PAL.leaf[fam];
      // Ground shadow anchor
      L.ell(0, -2, 18, 5, 'rgba(18,12,32,0.35)');

      // Leaf mass
      leafCluster(L, 0, -11, 14 + v * 2, 10, P, rand);
      leafCluster(L, -10, -7, 9, 7, P, rand);
      leafCluster(L, 10, -7, 9, 7, P, rand);
      leafCluster(L, -1, -16, 8, 6, P, rand);
    });
  }

  /* ---------- Rock Sprite Builder (Chiseled Pixel Art) ---------- */
  function rockFrame(cave, v) {
    const P = cave ? ENV_PAL.rockCave : ENV_PAL.rock;
    return bake('rock_' + (cave ? 'c' : 'n') + '_' + v, 56, 52, 28, 46, L => {
      const poly = (pts, col) => {
        const g = L.g;
        g.fillStyle = col;
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(L.ax + x, L.ay + y) : g.moveTo(L.ax + x, L.ay + y)));
        g.closePath();
        g.fill();
      };

      // Base Structure
      poly([[-19, 0], [-21, -9], [-16, -17], [-4, -20], [9, -19], [18, -13], [21, -5], [18, 0]], P[1]);
      // Mid Facet (Facing East / Down)
      poly([[-16, -9], [-12, -18], [-3, -22], [8, -20], [14, -13], [11, -9]], P[2]);
      // Top Facet (Catching Sunlight)
      poly([[-13, -18], [-5, -23], [4, -23], [8, -20], [0, -19], [-9, -16]], P[3]);
      // Highlight Edge
      poly([[-6, -23], [3, -23], [7, -21], [0, -20]], P[4]);

      // Deep Shadow Crevices & Bottom Cavity
      L.px(-18, -5, 7, 5, P[0]);
      L.px(11, -9, 9, 9, P[0]);
      L.px(-3, -2, 8, 3, P[0]);

      // Chiseled Fractures (Crack Lines)
      for (let i = 0; i < 3; i++) {
        const cx = -9 + i * 7 + v, cy = -13 + i * 2;
        L.px(cx, cy, 5, 1, P[0]);
        L.px(cx, cy + 1, 4, 1, P[3]); // Specular bottom ledge
      }

      // Overgrown Moss (Surface Detail for Outdoors)
      if (!cave) {
        L.px(-15, -10, 6, 2, '#486828');
        L.px(-13, -12, 4, 2, '#668e36');
        L.px(-11, -13, 2, 1, '#8bb84c');
        L.px(7, -8, 5, 2, '#486828');
        L.px(8, -10, 3, 2, '#668e36');
      }
    }, { shade: true });
  }

  /* ---------- Procedural Ground Texture Painter ---------- */
  function paintGround(z) {
    const id = z.id;
    const A = ENV_PAL[id === 'farm' ? 'farm' : id === 'cave' ? 'cave' : 'hunt'];
    const S2 = RSc, TT = T * S2;
    const [c, g] = mkCanvas(W * TT, H * TT);
    g.imageSmoothingEnabled = false;

    const nz = mkNoise(id === 'farm' ? 7 : id === 'hunt' ? 29 : 43);
    const nz2 = mkNoise(id === 'farm' ? 81 : id === 'hunt' ? 97 : 19);
    const rand = rr(id === 'farm' ? 1234 : id === 'hunt' ? 5678 : 9012);

    const isT = (x, y, k) => z.t[y] && z.t[y][x] === k;
    const isPathish = (x, y) => isT(x, y, 'p');
    const isWat = (x, y) => isT(x, y, 'w');
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

    const GW = W * TT, GH = H * TT;
    const hb = A.base.map(hexOf);

    // 1) Base Terrain Surface via FBM Noise & Bayer Dithering
    const img = g.createImageData(GW, GH), d = img.data;
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const n = fbm(nz, x / 24, y / 24);
        const m = nz2(x / 10, y / 10);
        let col;

        if (n < .34) {
          col = hexOf(A.dark);
        } else if (n > .66) {
          col = hexOf(A.light);
        } else {
          col = hb[m < .33 ? 0 : m < .66 ? 1 : 2];
        }

        // Ordered 2x2 Bayer Dither for Smooth Organic Boundaries
        const bayer = ((x & 1) << 1) | ((y & 1) ^ (x & 1));
        if (Math.abs(n - .34) < .035) {
          if (bayer < 2) col = hexOf(A.dark);
        } else if (Math.abs(n - .66) < .035) {
          if (bayer < 2) col = hexOf(A.light);
        }

        const i = (y * GW + x) * 4;
        d[i] = col[0];
        d[i + 1] = col[1];
        d[i + 2] = col[2];
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    // 2) Dirt Road & Path Auto-Tiling
    const dirt = A === ENV_PAL.cave ? ['#544d6b', '#48425d', '#61597a'] : ENV_PAL.dirt;
    const dh = dirt.map(hexOf);
    const dD = hexOf(A === ENV_PAL.cave ? '#353047' : ENV_PAL.dirtD);
    const dL = hexOf(A === ENV_PAL.cave ? '#766c92' : ENV_PAL.dirtL);
    const pm = new Uint8Array(GW * GH); // 1 = Path Pixel

    const dist = (tx, ty, x, y) => {
      if (isPathish(tx, ty)) return 0;
      let best = 9;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (!isPathish(tx + ox, ty + oy)) continue;
          const cx = Math.max((tx + ox) * TT, Math.min(x, (tx + ox + 1) * TT - 1));
          const cy = Math.max((ty + oy) * TT, Math.min(y, (ty + oy + 1) * TT - 1));
          best = Math.min(best, Math.hypot(x - cx, y - cy) / TT);
        }
      }
      return best;
    };

    const im2 = g.getImageData(0, 0, GW, GH), d2 = im2.data;
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const tx = Math.floor(x / TT), ty = Math.floor(y / TT);
        if (!isPathish(tx, ty)) {
          let near = false;
          for (let oy = -1; oy <= 1 && !near; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              if (isPathish(tx + ox, ty + oy)) { near = true; break; }
            }
          }
          if (!near) continue;
        }

        const dd = dist(tx, ty, x, y);
        const wob = (fbm(nz2, x / 8, y / 8) - .5) * .55;
        if (dd - .22 + wob > .18) continue;

        pm[y * GW + x] = 1;
        const m = nz(x / 8, y / 8);
        const col = dh[m < .33 ? 0 : m < .66 ? 1 : 2];
        const i = (y * GW + x) * 4;
        d2[i] = col[0];
        d2[i + 1] = col[1];
        d2[i + 2] = col[2];
      }
    }

    // Path Crisp Borders (Top-Left Highlight, Bottom-Right Dark Shadow)
    const P1 = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && pm[y * GW + x] === 1;
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        if (!P1(x, y)) continue;
        const i = (y * GW + x) * 4;
        if (!P1(x, y + 1) || !P1(x + 1, y)) {
          d2[i] = dD[0]; d2[i + 1] = dD[1]; d2[i + 2] = dD[2];
        } else if (!P1(x, y - 1) || !P1(x - 1, y)) {
          d2[i] = dL[0]; d2[i + 1] = dL[1]; d2[i + 2] = dL[2];
        }
      }
    }
    g.putImageData(im2, 0, 0);

    // 3) Water Bodies with Depth Layers & Coastline
    for (let ty = 0; ty < H; ty++) {
      for (let tx = 0; tx < W; tx++) {
        if (!isWat(tx, ty)) continue;
        const X = tx * TT, Y = ty * TT;
        const n0 = !isWat(tx, ty - 1), s0 = !isWat(tx, ty + 1),
              w0 = !isWat(tx - 1, ty), e0 = !isWat(tx + 1, ty);

        // Water Interior Depth
        for (let j = 0; j < TT; j++) {
          for (let i = 0; i < TT; i++) {
            const k = nz2((X + i) / 7, (Y + j) / 7);
            const isCenter = (!n0 && !s0 && !w0 && !e0) && (i > 3 && i < TT - 4 && j > 3 && j < TT - 4);
            const waterColor = isCenter
              ? ENV_PAL.water[3]
              : ENV_PAL.water[k < .38 ? 0 : k < .72 ? 1 : 2];
            px(X + i, Y + j, 1, 1, waterColor);
          }
        }

        // Rounded Coastline Corners
        const cut = (cx, cy) => {
          const R = 7;
          for (let j = 0; j < R; j++) {
            for (let i = 0; i < R; i++) {
              if (Math.hypot(i - R + .5, j - R + .5) > R - .3) {
                const gx = cx === 0 ? X + i : X + TT - 1 - i;
                const gy = cy === 0 ? Y + j : Y + TT - 1 - j;
                px(gx, gy, 1, 1, A.base[0]);
              }
            }
          }
        };
        if (n0 && w0) cut(0, 0);
        if (n0 && e0) cut(1, 0);
        if (s0 && w0) cut(0, 1);
        if (s0 && e0) cut(1, 1);

        // Stepped Coastline Foam and Shadows
        if (n0) {
          px(X, Y, TT, 3, ENV_PAL.waterD);
          px(X, Y + 3, TT, 1, ENV_PAL.water[1]);
        }
        if (s0) {
          px(X, Y + TT - 5, TT, 1, ENV_PAL.foam);
          px(X, Y + TT - 4, TT, 1, ENV_PAL.waterL);
          px(X, Y + TT - 3, TT, 3, ENV_PAL.waterD);
        }
        if (w0) px(X, Y, 3, TT, ENV_PAL.waterD);
        if (e0) px(X + TT - 3, Y, 3, TT, ENV_PAL.waterD);

        // Fixed Pixel Ripple Waves
        for (let i = 0; i < 3; i++) {
          const a = X + 4 + Math.floor(rand() * (TT - 14));
          const b = Y + 5 + Math.floor(rand() * (TT - 12));
          px(a, b, 6, 1, ENV_PAL.waterL);
          px(a + 1, b + 1, 4, 1, ENV_PAL.water[2]);
        }
      }
    }

    // Grass Overhang Shadow near Coastline
    for (let ty = 0; ty < H; ty++) {
      for (let tx = 0; tx < W; tx++) {
        if (isWat(tx, ty) || isPathish(tx, ty)) continue;
        const X = tx * TT, Y = ty * TT;
        if (isWat(tx, ty + 1)) px(X, Y + TT - 2, TT, 2, A.dark);
        if (isWat(tx, ty - 1)) px(X, Y, TT, 1, A.dark);
        if (isWat(tx - 1, ty)) px(X, Y, 2, TT, A.dark);
        if (isWat(tx + 1, ty)) px(X + TT - 2, Y, 2, TT, A.dark);
      }
    }

    // 4) Ground Micro-Decorations (Grass Tuft, Flowers, Mushrooms, Crystals)
    const free = (x, y) => {
      const tx = Math.floor(x / TT), ty = Math.floor(y / TT);
      return z.t[ty] && z.t[ty][tx] === 'g' && !P1(x, y);
    };

    const tuft = (x, y, L2) => {
      const c1 = L2 ? A.tuftL : A.tuft;
      const c2 = A.dark;
      px(x, y, 1, 3, c1);
      px(x - 2, y + 1, 1, 2, c1);
      px(x + 2, y + 1, 1, 2, c1);
      px(x - 1, y, 1, 1, c1);
      px(x + 1, y, 1, 1, c1);
      px(x - 1, y + 2, 3, 1, c2); // Root Shadow
    };

    // Open Meadow Grass Tufts
    for (let i = 0; i < Math.round(W * H * 3.4); i++) {
      const x = Math.floor(rand() * GW), y = Math.floor(rand() * GH);
      if (free(x, y)) tuft(x, y, rand() < .45);
    }

    // Path Edge Grass Fringe
    for (let i = 0; i < W * H * 2; i++) {
      const x = Math.floor(rand() * GW), y = Math.floor(rand() * GH);
      if (P1(x, y) || !(P1(x + 4, y) || P1(x - 4, y) || P1(x, y + 4) || P1(x, y - 4))) continue;
      if (z.t[Math.floor(y/TT)] && z.t[Math.floor(y/TT)][Math.floor(x/TT)] === 'g') {
        tuft(x, y, rand() < .5);
      }
    }

    // Pebbles inside Path and Glades
    for (let i = 0; i < W * H * 2; i++) {
      const x = Math.floor(rand() * GW), y = Math.floor(rand() * GH);
      if (!(P1(x, y) || P1(x + 3, y + 2))) continue;
      if (P1(x, y) && rand() < .35) continue;
      if (A === ENV_PAL.cave) continue;
      const col = ENV_PAL.pebble;
      px(x, y + 1, 3, 2, col[2]);
      px(x, y, 3, 1, col[1]);
      px(x + 1, y, 1, 1, col[3]);
      px(x - 1, y + 2, 4, 1, 'rgba(15,10,25,0.3)'); // Micro Shadow
    }

    // Flora Variations by Biome
    for (let i = 0; i < W * H; i++) {
      const x = Math.floor(rand() * GW), y = Math.floor(rand() * GH);
      if (!free(x, y) || rand() > .18) continue;
      const tx = Math.floor(x / TT), ty = Math.floor(y / TT);
      if (z.solid[ty] && z.solid[ty][tx]) continue;

      if (id === 'farm') {
        // Multi-colored Wildflowers with Stems & Petal Center
        const petCol = ['#f48fb1', '#fff59d', '#e0f7fa', '#ce93d8', '#ffcc80'][Math.floor(rand() * 5)];
        px(x, y + 2, 1, 3, '#33691e');       // Stem
        px(x - 1, y, 3, 3, petCol);          // Petals
        px(x, y + 1, 1, 1, '#ffeb3b');       // Flower Core
        px(x - 1, y + 4, 3, 1, 'rgba(15,10,25,0.25)'); // Base Shadow
      } else if (id === 'hunt') {
        // Forest Mushrooms
        px(x, y + 2, 2, 3, '#d7ccc8');       // Stem
        px(x - 2, y, 6, 3, '#c62828');       // Cap
        px(x - 1, y, 1, 1, '#ffffff');       // White spots
        px(x + 2, y + 1, 1, 1, '#ffffff');
        px(x - 2, y + 4, 6, 1, 'rgba(15,10,25,0.3)');
      } else {
        // Cave Glowing Crystals
        px(x, y - 6, 3, 8, '#29b6f6');
        px(x + 1, y - 8, 1, 3, '#e1f5fe');   // Glowing Tip
        px(x - 3, y - 2, 3, 5, '#0288d1');
        px(x + 3, y - 1, 2, 4, '#01579b');
        px(x - 2, y + 2, 7, 2, 'rgba(10,6,28,0.4)'); // Shadow
      }
    }

    return c;
  }

  /* ---------- Hook: buildZone (Preserves Logic, Injects High-Res Art) ---------- */
  const _bz = buildZone;
  window.buildZone = buildZone = function (id) {
    const z = _bz(id);
    const gnd = paintGround(z);
    const [c, g] = mkCanvas(VW, VH);
    g.imageSmoothingEnabled = false;
    g.drawImage(gnd, 0, 0, VW, VH);

    // Fence Layering
    if (z.fence) {
      z.fence.forEach(([x, y]) => {
        const f = fenceFrame();
        GFX.drawShadow(g, x * T + 8, (y + 1) * T, 10, 4);
        GFX.draw(g, f, x * T + 8, (y + 1) * T, false, null);
      });
    }

    z.ground = c;
    z.groundHi = gnd;

    // Static Bush Decorations
    if (id !== 'cave' && !z.decorBush) {
      z.decorBush = true;
      const h = mulberry(id === 'farm' ? 303 : 707);
      const count = id === 'farm' ? 7 : 14;
      for (let i = 0; i < count; i++) {
        const x = 1 + Math.floor(h() * (W - 2));
        const y = 1 + Math.floor(h() * (H - 2));
        if (z.t[y][x] !== 'g' || z.solid[y][x]) continue;
        if (id === 'farm' && (y < 5 || (y >= 8 && y <= 11 && x >= 5 && x <= 12))) continue;

        const f = bushFrame(['green', 'teal', 'autumn'][Math.floor(h() * 3)], Math.floor(h() * 2));
        GFX.drawShadow(g, x * T + 8, y * T + 14, 11, 4);
        GFX.draw(g, f, x * T + 8, y * T + 14, false, null);
      }
    }
    return z;
  };

  /* ---------- Fence Sprite Builder ---------- */
  let _fence = null;
  function fenceFrame() {
    if (_fence) return _fence;
    const L = GFX.layer(36, 40, 18, 36);
    // Vertical Post
    L.px(-2, -24, 4, 24, '#5e3c20');
    L.px(-2, -24, 1, 24, '#825630');
    L.px(1, -24, 1, 24, '#422814');

    // Horizontal Rails
    L.px(-16, -18, 32, 5, '#825630');
    L.px(-16, -18, 32, 1, '#a87445');
    L.px(-16, -14, 32, 1, '#422814');

    L.px(-16, -8, 32, 5, '#5e3c20');
    L.px(-16, -8, 32, 1, '#825630');
    L.px(-16, -4, 32, 1, '#29180c');

    L.shade(1, .25, .3).outline(.72);
    return (_fence = GFX.frame(L));
  }

  /* ---------- Hooks: Object & Tree Drawing with Accurate Depth & Shadows ---------- */
  const _do = drawObj;

  window.drawTree = drawTree = function (x, b, dead, id, v) {
    const cx = x + 8;
    // Ground Shadow (Multi-level contact shadow)
    GFX.drawShadow(ctx, cx, b - 1, 18, 6);
    GFX.drawShadow(ctx, cx, b - 1, 10, 4);
    // Render Tree Frame
    GFX.draw(ctx, treeFrame(id, v, dead), cx, b - 1, false, null);
  };

  window.drawObj = drawObj = function (o) {
    if (o.k === 'rock') {
      const cave = zone === 'cave';
      const v = Math.floor(((o.x / T) * 7 + (o.b / T) * 3)) % 2;
      GFX.drawShadow(ctx, o.x + 8, o.b - 1, 16, 5);
      GFX.drawShadow(ctx, o.x + 8, o.b - 1, 9, 3);
      GFX.draw(ctx, rockFrame(cave, v), o.x + 8, o.b - 1, false, null);
      return;
    }
    return _do(o);
  };

  /* Public API Exposure */
  window.ENV_PAL = ENV_PAL;
  window.ENV_ART = { treeFrame, bushFrame, rockFrame, paintGround, fenceFrame };
})();
