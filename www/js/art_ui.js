'use strict';
/* =====================================================================
   ART UI (กลุ่ม 5 Remastered): ใบหน้า HUD ละเอียด 32x32 · มินิแมพคมชัด · ป้ายชื่อเหนือหัว
   - พอร์ตเทรตตัวละครสไตล์ Retro Fantasy: ทรงผม แววตา หมวก เครื่องประดับตามระดับดาบ (+0..+10)
   - มินิแมพพิกเซล: แคชพื้นหลังแผนที่ มาร์กเกอร์ผู้เล่น/บอส/มอนสเตอร์/สัตว์เลี้ยง/ทางออก ชัดเจน
   - ป้ายชื่อและระดับเลเวลเหนือหัว: ปรับคอนทราสต์ จัดเรียง Layer Y-depth อัตโนมัติ
   - ประหยัดพลังงานบนมือถือ: แคชภาพนิ่งและจำกัดรอบเรนเดอร์มินิแมพที่ 120ms
   - รักษา Gameplay Logic, Stats, HTML Element IDs, และ Global APIs เดิม 100%
   ===================================================================== */
(function () {
  const HP = HERO_PAL, cache = {};

  /* =====================================================================
     SECTION 1: พอร์ตเทรตตัวละคร 32x32 (HUD Portrait)
     ===================================================================== */
  function portrait(g, wl) {
    const key = g + wl;
    if (cache[key]) return cache[key];

    const Lk = LOOK[g], L = GFX.layer(32, 32, 16, 17);
    const hair = Lk.hair, hh = Lk.hairH, sk = HP.skin, skD = HP.skinD, skH = HP.skinH;

    // 1. เสื้อ ลำคอ และคอเสื้อ
    L.px(-10, 11, 20, 6, Lk.tun);
    L.px(-10, 11, 20, 1, Lk.tunD);
    L.px(-10, 12, 1, 5, Lk.tunD);
    L.px(9, 12, 1, 5, Lk.tunD);
    L.px(-3, 8, 6, 4, skD);
    L.px(-2, 9, 4, 3, sk);

    // 2. ผมด้านหลังศีรษะ
    if (g === 'f') {
      L.px(-13, -6, 5, 23, hair);
      L.px(8, -6, 5, 23, hair);
      L.px(-12, -4, 2, 18, hh);
      L.px(9, -4, 2, 18, hh);
      L.ell(0, -2, 12, 11, hair);
    } else {
      L.ell(0, -2, 12, 10, hair);
      L.px(-11, 3, 3, 5, hair);
      L.px(8, 3, 3, 5, hair);
    }

    // 3. โครงหน้าและผิวสองชั้น
    L.ell(0, 1, 10, 9, skD);
    L.ell(0, 0, 9, 8, sk);
    L.px(-12, 1, 2, 4, sk);
    L.px(10, 1, 2, 4, sk);
    L.px(-8, 8, 16, 1, '#d89c74'); // เงาคาง

    // 4. หน้าผากและปอยผมด้านหน้า
    L.px(-11, -9, 22, 5, hair);
    L.px(-11, -5, 4, 7, hair);
    L.px(7, -5, 4, 7, hair);
    L.px(-3, -5, 8, 2, hair);
    L.px(-6, -11, 5, 3, hh);
    L.px(2, -11, 5, 3, hh);
    L.px(-9, -9, 3, 1, hh);

    // 5. คิ้ว ดวงตา และแววตาสะท้อนแสง
    L.px(-5, -2, 3, 1, HP.eye);
    L.px(2, -2, 3, 1, HP.eye);
    L.px(-5, 1, 2, 3, HP.eye);
    L.px(3, 1, 2, 3, HP.eye);
    L.px(-5, 1, 1, 1, '#ffffff');
    L.px(3, 1, 1, 1, '#ffffff');

    // แก้มชมพู จมูก ปาก
    L.px(-8, 5, 3, 2, HP.blush);
    L.px(5, 5, 3, 2, HP.blush);
    L.px(-1, 4, 2, 1, skD);
    L.px(-1, 6, 3, 1, HP.mouth);

    // 6. เครื่องแต่งกายและหมวกตามระดับอาวุธ
    if (g === 'm') {
      if (wl >= 2) {
        // หมวกเกราะเหล็กอัศวิน
        L.ell(0, -8, 12, 6, HP.steel);
        L.px(-12, -8, 24, 2, HP.steelD);
        L.px(-6, -12, 5, 2, HP.steelH);
        L.px(-1, -6, 3, 8, HP.steelD);
        if (wl >= 3) {
          L.px(-1, -18, 4, 8, HP.plume);
          L.px(0, -18, 2, 4, '#e65363');
        }
        if (wl >= 5) L.px(-12, -5, 24, 1, HP.gold);
      } else if (wl === 1) {
        // หมวกหมุดหนัง
        L.ell(0, -8, 12, 5, HP.leather);
        L.px(-12, -6, 24, 2, '#543218');
        L.px(-5, -11, 4, 1, HP.leatherH);
      } else {
        // ผ้าโพกหัวนักผจญภัย
        L.px(-12, -7, 24, 3, Lk.scarf);
        L.px(-12, -5, 24, 1, Lk.scarfD);
        L.px(10, -6, 5, 3, Lk.scarf);
      }
    } else {
      if (wl >= 1) {
        // หมวกปีกจอมเวทคลาสสิก
        const hc = '#42347d', hl = '#5e4ea6', tall = wl >= 2;
        L.ell(0, -8, 16, 3, hc);
        for (let i = 0; i < (tall ? 12 : 6); i++) {
          const w = Math.max(2, 14 - i * (tall ? 1 : 2));
          L.px((-w / 2) | 0, -10 - i, w, 1, i % 3 ? hc : hl);
        }
        L.px(-12, -9, 24, 2, wl >= 5 ? HP.gold : '#241a54');
        if (wl >= 3) {
          L.px(-1, -9, 3, 2, '#6fd6ff');
          L.px(0, -9, 1, 1, '#ffffff');
        }
        if (wl >= 4 && tall) L.px(-1, -24, 3, 3, '#ffe066');
      } else {
        // โบว์ติดผมสาวนักเวท
        L.px(5, -12, 6, 5, HP.pink);
        L.px(11, -11, 3, 3, HP.pink);
        L.px(8, -10, 2, 2, '#d0508a');
        L.px(7, -11, 1, 1, '#ffffff');
      }
    }

    // 7. ลุคฮีโร่ขั้นสูง (+6..+10)
    if (wl >= 6) {
      const ac = BLADE[wl], gd = wl >= 10 ? '#ffd23f' : ac;
      if (g === 'm') {
        L.px(-15, -12, 4, 2, gd);
        L.px(-17, -14, 3, 2, gd);
        L.px(11, -12, 4, 2, gd);
        L.px(14, -14, 3, 2, gd);
        L.px(-1, -7, 3, 3, gd);
        L.px(0, -7, 1, 1, '#ffffff');
      } else {
        L.px(-12, -11, 24, 1, gd);
        L.px(-1, -26, 3, 3, gd);
        if (wl >= 8) {
          L.px(-13, -9, 3, 3, gd);
          L.px(10, -9, 3, 3, gd);
        }
      }
    }

    L.shade(1, .28, .30).outline(.75);
    return (cache[key] = GFX.frame(L));
  }

  window.faceTo = faceTo = function (c, g) {
    if (!c) return;
    c.width = 32;
    c.height = 32;
    const k = c.getContext('2d');
    k.imageSmoothingEnabled = false;
    k.clearRect(0, 0, 32, 32);
    k.drawImage(portrait(g, g === P.g ? (P.wl || 0) : 0).c, 0, 0);
  };

  window.drawFace = drawFace = () => faceTo($('face'), P.g);
  document.querySelectorAll('.gcard').forEach(b => faceTo(b.querySelector('canvas'), b.dataset.g));

  try { drawFace(); } catch (e) {}

  /* =====================================================================
     SECTION 2: มินิแมพพิกเซล (Crisp Pixel Minimap)
     ===================================================================== */
  const mm = document.getElementById('minimap');
  const mg = mm ? mm.getContext('2d') : null;
  const MS = 6, bg = {};

  if (mm && mg) {
    mm.width = W * MS;
    mm.height = H * MS;
    mg.imageSmoothingEnabled = false;
  }

  function mapBg(id) {
    if (bg[id]) return bg[id];
    const z = Z(), [c, g] = mkCanvas(W * MS, H * MS), cv = id === 'cave';
    const col = {
      g: cv ? '#353054' : (id === 'farm' ? '#5e8e3c' : '#457430'),
      p: cv ? '#6c658a' : '#d2ae74',
      w: '#3572b8'
    };

    // 1. พื้นฐานกระเบื้อง
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = z.t[y][x];
        g.fillStyle = col[t] || col.g;
        g.fillRect(x * MS, y * MS, MS, MS);

        // Texture พิกเซลดิน/หญ้า
        if (t === 'g' && (x * 7 + y * 3) % 5 === 0) {
          g.fillStyle = cv ? '#413a64' : (id === 'farm' ? '#6ca044' : '#528438');
          g.fillRect(x * MS + 2, y * MS + 2, 2, 2);
        }
        // ผิวน้ำสะท้อน
        if (t === 'w' && (x + y) % 2 === 0) {
          g.fillStyle = '#68aae6';
          g.fillRect(x * MS + 1, y * MS + 2, 3, 1);
        }
      }
    }

    // 2. สิ่งกีดขวาง ต้นไม้ และก้อนหิน
    const objs = new Set();
    z.objs.forEach(o => {
      if (o.k === 'tree' || o.k === 'rock') {
        const x = o.x / T, y = o.b / T - 1;
        objs.add(x + ',' + y);
        g.fillStyle = o.k === 'rock' ? '#8e8c9e' : (o.dead ? '#6e5a48' : (cv ? '#24203e' : '#224e22'));
        g.fillRect(x * MS + 1, y * MS + 1, MS - 2, MS - 2);
        g.fillStyle = o.k === 'rock' ? '#b8b6c8' : (o.dead ? '#8a745c' : (cv ? '#3e3862' : '#326c2e'));
        g.fillRect(x * MS + 1, y * MS + 1, MS - 2, 2);
      }
    });

    // 3. กำแพงและร้านค้า
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (z.solid[y][x] && z.t[y][x] !== 'w' && !objs.has(x + ',' + y)) {
          const sh = z.inter && z.inter[y] && z.inter[y][x] === 'shop';
          g.fillStyle = '#16101c';
          g.fillRect(x * MS, y * MS, MS, MS);
          g.fillStyle = sh ? '#fcc828' : '#a84c34';
          g.fillRect(x * MS + 1, y * MS + 1, MS - 2, MS - 2);
        }
      }
    }

    return (bg[id] = c);
  }

  const dot = (x, y, s, c) => {
    if (!mg) return;
    const px = Math.round((x / T) * MS - s / 2);
    const py = Math.round((y / T) * MS - s / 2);
    mg.fillStyle = '#0b0b12';
    mg.fillRect(px - 1, py - 1, s + 2, s + 2);
    mg.fillStyle = c;
    mg.fillRect(px, py, s, s);
  };

  const EXITS = { farm: ['r'], hunt: ['l', 'r'], cave: ['l'] };
  let lastT = 0;

  function paintMini() {
    if (!mm || !mg) return;
    const now = performance.now();
    if (now - lastT < 120) return;
    lastT = now;

    mm.style.display = running ? 'block' : 'none';
    if (!running) return;

    mg.clearRect(0, 0, mm.width, mm.height);
    mg.drawImage(mapBg(zone), 0, 0);

    const bl = ((now / 450) | 0) % 2, h = H * MS;

    // ประตูทางออกโซน (กะพริบแจ้งเตือน)
    (EXITS[zone] || []).forEach(s => {
      const r = s === 'r', x = r ? W * MS - 4 : 0;
      mg.fillStyle = bl ? '#ffd23f' : '#b8741a';
      mg.fillRect(x, 0, 4, h);
      mg.fillStyle = '#05060d';
      mg.fillRect(r ? x - 1 : 4, 0, 1, h);
      mg.fillStyle = '#fff3c4';
      const ax = r ? W * MS - 10 : 10, ay = (h / 2) | 0;
      for (let i = 0; i < 4; i++) {
        mg.fillRect(r ? ax + i : ax - i, ay - 3 + i, 1, 7 - 2 * i);
      }
    });

    // กรอบแสดงผลมุมมองกล้อง (Camera Viewport Box)
    if (CH < VH) {
      mg.strokeStyle = 'rgba(255, 255, 255, .75)';
      mg.lineWidth = 1;
      mg.strokeRect(.5, (camY / T) * MS + .5, W * MS - 1, (CH / T) * MS - 1);
    }

    // สัตว์เลี้ยงในฟาร์ม
    if (zone === 'farm' && typeof ANI !== 'undefined') {
      ANI.forEach(a => dot(a.x, a.y - 4, 4, '#fff2c8'));
    }

    // มอนสเตอร์ในพื้นที่ล่า (บอส = ส้มทองใหญ่, มอนสเตอร์ = แดง)
    if (HZ() && typeof mons !== 'undefined') {
      mons.forEach(m => {
        if (m.dead) return;
        if (m.type === 'king') dot(m.x, m.y - 4, 6, '#ffa028');
        else dot(m.x, m.y - 4, 4, '#ff4454');
      });
    }

    // ผู้เล่น (Player Compass Marker)
    const px = Math.round((P.x / T) * MS), py = Math.round(((P.y - 4) / T) * MS);
    const r = bl ? 7 : 5;
    mg.strokeStyle = 'rgba(255, 255, 255, .88)';
    mg.lineWidth = 1;
    mg.strokeRect(px - r + .5, py - r + .5, r * 2, r * 2);

    const dm = (k, c) => {
      mg.fillStyle = c;
      for (let i = -k; i <= k; i++) {
        const w = k - Math.abs(i);
        mg.fillRect(px - w, py + i, w * 2 + 1, 1);
      }
    };
    dm(5, '#0b0b12');
    dm(4, '#ffffff');
    dm(3, '#ffd23f');
  }

  const _hud = hud;
  hud = function () {
    _hud();
    paintMini();
  };

  /* =====================================================================
     SECTION 3: ป้ายชื่อและระดับเลเวลเหนือหัว (Overhead Nameplates)
     ===================================================================== */
  const _ex = window.EXTRA_DRAW;
  window.EXTRA_DRAW = function (list) {
    if (_ex) _ex(list);
    if (!running || P.dead) return;

    // ชื่อผู้เล่น
    list.push({
      b: P.y + .5,
      f: () => pixText(
        P.name || '',
        P.x,
        P.y - 38 + (P.wl >= 2 && P.g === 'f' ? -5 : 0),
        '#ffffff',
        .85,
        true
      )
    });

    // มอนสเตอร์ในระยะสายตา
    if (HZ() && typeof mons !== 'undefined') {
      for (const m of mons) {
        if (m.dead) continue;
        if (Math.hypot(m.x - P.x, m.y - P.y) > 78) continue;
        const d = MON[m.type];
        if (d) {
          list.push({
            b: m.y + .5,
            f: () => {
              pixText(d.name, m.x, m.y - d.h - 9, '#ffd7a8', .75, true);
              if (m.lv) {
                const df = m.lv - P.lv;
                const lvCol = df >= 3 ? '#ff7a7a' : (df >= 1 ? '#ffd23f' : '#b2e898');
                pixText('Lv.' + m.lv, m.x, m.y - d.h - 16, lvCol, .7, true);
              }
            }
          });
        }
      }
    }
  };
})();
