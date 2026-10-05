'use strict';
/* =====================================================================
   ART LIGHT (กลุ่ม 3): เงา แสง บรรยากาศตามเวลา + บ้าน ร้านค้า สัตว์ฟาร์ม หมา
   - ENV_LIGHT(ctx,minutes,isHunt,zone): ควบคุมโทนสีบรรยากาศรอบโลก (Morning, Noon, Sunset, Night, Cave)
     ใช้ fillRect สีบรรยากาศ + Vignette แบบแคช + แอ่งแสง Pixel Lantern รอบตัวละคร
   - ENV_SUN: เงามีทิศทางตกกระทบตามตำแหน่งดวงอาทิตย์ (เช้าเงาชี้ซ้าย เย็นชี้ขวา)
   - Procedural Pixel Art Sprites: บ้าน, ร้านค้า, ไก่, วัว, สุนัข คมชัดทุกรายละเอียด
   - แสงส่องจากทิศบนซ้าย (Top-Left Light Bias) สอดรับกับ Hero, Mon, Environment, Farm, Crops
   - รักษา Function Names, Parameters, Global APIs เดิม 100%
   ===================================================================== */
(function () {
  const hexOf = GFX.hex;

  /* ---------- Keyframes สีบรรยากาศตามช่วงเวลา (ชั่วโมง, R, G, B, Alpha) ---------- */
  // 00:00 - 04:30 : กลางคืนครามเข้ม (Deep Indigo Moonlit Night)
  // 06:00 - 07:30 : รุ่งอรุณแสงสีส้มชมพู (Warm Sunrise)
  // 09:00 - 16:00 : กลางวันแสงธรรมชาติสดใส คมชัด
  // 17:30 - 19:00 : พลบค่ำแสงสีส้มทองอมม่วง (Warm Sunset & Twilight)
  // 20:30 - 24:00 : กลางคืนคืนสู่ความเงียบสงบ
  const KF = [
    [0,    18,  22,  68, 0.46],
    [4.5,  18,  22,  68, 0.44],
    [6.0, 160,  88, 120, 0.22],
    [7.5, 255, 185, 130, 0.10],
    [9.0, 255, 245, 215, 0.00],
    [16.0, 255, 245, 215, 0.00],
    [17.5, 255, 155,  65, 0.16],
    [19.0, 140,  65, 115, 0.26],
    [20.5,  18,  22,  68, 0.42],
    [24.0,  18,  22,  68, 0.46]
  ];

  function tint(h) {
    for (let i = 0; i < KF.length - 1; i++) {
      const a = KF[i], b = KF[i + 1];
      if (h >= a[0] && h <= b[0]) {
        const t = (h - a[0]) / (b[0] - a[0]);
        return a.slice(1).map((v, k) => v + (b[k + 1] - v) * t);
      }
    }
    return [0, 0, 0, 0];
  }

  const nightK = h => (h >= 20.5 || h < 4.5 ? 1 : h >= 19 ? (h - 19) / 1.5 : h < 6 ? 1 - (h - 4.5) / 1.5 : 0);

  window.ENV_SUN = {
    night: () => nightK(S.minutes / 60),
    /* ออฟเซ็ตเงา (หน่วย logic) และความจางตามตำแหน่งดวงอาทิตย์ */
    off() {
      const h = Math.max(6, Math.min(18, S.minutes / 60));
      return {
        dx: (h - 12) * 1.15,
        a: Math.max(0.25, 1 - nightK(S.minutes / 60) * 0.72),
        len: 1 + Math.abs(h - 12) / 6 * 0.45
      };
    }
  };

  /* เงาวงรีมีทิศทาง: ใช้แทน GFX.drawShadow ในวัตถุถาวร */
  window.envShadow = function (g, x, y, rx, ry) {
    const s = ENV_SUN.off();
    GFX.draw(g, GFX.shadow(Math.round(rx * s.len), ry), x + s.dx, y, false, null, s.a);
  };

  /* ---------- Vignette + แอ่งแสงตะเกียงแบบแคช (Pixel Light Pool) ---------- */
  let vig = null, pool = null;

  function mkVig() {
    const [c, g] = mkCanvas(VW, VH);
    const gr = g.createRadialGradient(VW / 2, VH / 2, VH * 0.36, VW / 2, VH / 2, VW * 0.64);
    gr.addColorStop(0, 'rgba(6, 4, 18, 0)');
    gr.addColorStop(0.7, 'rgba(6, 4, 18, 0.45)');
    gr.addColorStop(1, 'rgba(6, 4, 18, 0.95)');
    g.fillStyle = gr;
    g.fillRect(0, 0, VW, VH);
    return c;
  }

  function mkPool() {
    const R = 58, [c, g] = mkCanvas(R * 2, R * 2);
    // รัศมีแสงแบบ Stepped Ring สไตล์ Pixel Art Lantern
    const gr = g.createRadialGradient(R, R, 2, R, R, R);
    gr.addColorStop(0, 'rgba(255, 225, 135, 0.65)');
    gr.addColorStop(0.35, 'rgba(255, 185, 95, 0.38)');
    gr.addColorStop(0.7, 'rgba(255, 145, 65, 0.16)');
    gr.addColorStop(1, 'rgba(255, 130, 50, 0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, R * 2, R * 2);
    return c;
  }

  /* ---------- Global Environment Lighting Hook ---------- */
  window.ENV_LIGHT = function (ctx, minutes, hz, zn) {
    const h = minutes / 60, t = tint(h), n = nightK(h);

    // 1. ท้องฟ้าและฟิลเตอร์สีบรรยากาศ
    if (t[3] > 0.002) {
      ctx.fillStyle = 'rgba(' + (t[0] | 0) + ',' + (t[1] | 0) + ',' + (t[2] | 0) + ',' + t[3].toFixed(3) + ')';
      ctx.fillRect(0, 0, VW, CH);
    }

    if (!vig) { vig = mkVig(); pool = mkPool(); }

    // 2. ความมืดตามพื้นที่ (Cave / Wild Hunt Zone)
    const dark = zn === 'cave' ? 0.52 : (hz ? 0.28 : 0);
    const va = Math.min(0.65, 0.16 + n * 0.32 + dark);
    ctx.globalAlpha = va;
    ctx.drawImage(vig, 0, 0, VW, CH > VH ? VH : CH);
    ctx.globalAlpha = 1;

    if (hz) {
      ctx.fillStyle = zn === 'cave' ? 'rgba(18, 8, 48, 0.22)' : 'rgba(16, 8, 36, 0.12)';
      ctx.fillRect(0, 0, VW, CH);
    }

    // 3. แอ่งแสงตะเกียงรอบตัวผู้เล่น (เมื่อมืดหรืออยู่ในถ้ำ) พร้อม Flicker เบาๆ
    const pl = Math.max(n, zn === 'cave' ? 0.85 : 0);
    if (pl > 0.05) {
      const flicker = (typeof S !== 'undefined' && S.t) ? Math.sin(S.t * 4.2) * 1.5 : 0;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, pl * 0.92);
      ctx.drawImage(
        pool,
        Math.round(P.x - 58 + flicker),
        Math.round(P.y - camY - 45 + flicker)
      );
      ctx.restore();
    }
  };

  /* ---------- Procedural Sprite Bake Helper ---------- */
  const cache = {};
  function bake(key, w, h, ax, ay, fn, sh) {
    if (cache[key]) return cache[key];
    const L = GFX.layer(w, h, ax, ay);
    fn(L);
    if (sh !== false) L.shade(1, .26, .30);
    L.outline(.72);
    return (cache[key] = GFX.frame(L));
  }

  const rect = (L, x, y, w, h, c) => L.px(x, y, w, h, c);

  /* ---------- 1. บ้านฟาร์ม (Farmhouse Structure) ---------- */
  function houseFrame(night) {
    return bake('house' + night, 176, 150, 88, 142, L => {
      const wall = '#e6d5a8', wallD = '#cdb98a', wood = '#754f2c', woodD = '#54361c', stone = '#878492';

      // 1.1 ปล่องไฟอิฐแดง (Chimney)
      rect(L, 24, -120, 18, 50, '#855444');
      rect(L, 24, -120, 18, 4, '#5e382b');
      rect(L, 26, -116, 4, 40, '#a26b5b');
      rect(L, 38, -114, 3, 36, '#6b4032'); // เงาข้างปล่องไฟ

      // 1.2 ผนังหลักและโครงไม้ค้ำยัน
      rect(L, -60, -60, 120, 60, wall);
      rect(L, -60, -60, 120, 4, wood);
      for (let i = 0; i < 4; i++) {
        rect(L, -60 + i * 40, -56, 4, 52, wood);
        rect(L, -60 + i * 40, -56, 1, 52, '#966a3e'); // ขอบไม้สะท้อนแสง
      }
      rect(L, -60, -24, 120, 3, wallD);

      // 1.3 ฐานหินของตัวบ้าน
      rect(L, -62, -10, 124, 10, stone);
      for (let i = 0; i < 8; i++) rect(L, -60 + i * 16, -8, 2, 8, '#5e5b66');
      rect(L, -62, -10, 124, 2, '#aba8b5');

      // 1.4 หลังคากระเบื้องซ้อนชั้น (Shingled Tile Roof)
      for (let i = 0; i < 9; i++) {
        const w = 136 - i * 12, y = -62 - i * 6;
        rect(L, -w / 2, y, w, 6, i % 2 ? '#b24c28' : '#963a1e');
        for (let k = -w / 2 + 4; k < w / 2 - 4; k += 10) {
          rect(L, k, y + 2, 5, 2, i % 2 ? '#c86438' : '#b24c28');
        }
      }
      rect(L, -10, -116, 20, 4, '#5c2415');
      rect(L, -70, -60, 140, 4, '#5c2415');

      // 1.5 ประตูไม้โค้งมนพร้อมมือจับทองเหลือง
      rect(L, -13, -44, 26, 44, woodD);
      rect(L, -11, -42, 22, 42, wood);
      rect(L, -1, -42, 2, 42, woodD);
      L.ell(0, -42, 11, 5, wood);
      rect(L, 6, -20, 3, 3, '#deb440');
      rect(L, 7, -19, 1, 1, '#ffffff');
      rect(L, -16, -2, 32, 3, '#a39fb0'); // บันไดหินหน้าบ้าน

      // 1.6 หน้าต่างกระจก (กลางคืนไฟสว่างสีทอง / กลางวันสะท้อนท้องฟ้า)
      [-46, 26].forEach(wx => {
        rect(L, wx, -48, 22, 22, woodD);
        rect(L, wx + 2, -46, 18, 18, night ? '#ffcc5e' : '#8ac8fa');
        rect(L, wx + 10, -46, 2, 18, woodD);
        rect(L, wx + 2, -38, 18, 2, woodD);
        rect(L, wx + 3, -45, 6, 4, night ? '#fff4b8' : '#d2eeff');
        rect(L, wx - 2, -26, 26, 3, wood);
      });
    });
  }

  const _dh = drawHouse;
  window.drawHouse = drawHouse = function () {
    const night = ENV_SUN.night() > 0.45 ? 1 : 0;
    envShadow(ctx, 48, 63, 40, 6);
    GFX.draw(ctx, houseFrame(night), 48, 64, false, null);
  };

  /* ---------- 2. ร้านค้า (Merchant Shop & Stall) ---------- */
  function shopFrame() {
    return bake('shop', 176, 140, 88, 132, L => {
      // 2.1 ผนังด้านหลังและชั้นวางของ
      rect(L, -60, -70, 120, 70, '#664024');
      for (let i = 0; i < 4; i++) rect(L, -58, -62 + i * 14, 116, 2, '#4d2e18');
      rect(L, -64, -76, 8, 76, '#54341b');
      rect(L, 56, -76, 8, 76, '#54341b');
      rect(L, -64, -76, 2, 76, '#754f2c');

      // 2.2 พ่อค้า NPC
      L.ell(0, -46, 7, 7, '#f4bf98');
      rect(L, -8, -58, 16, 6, '#2a6ab0');
      rect(L, -8, -53, 16, 2, '#1a4980');
      rect(L, -3, -46, 2, 2, '#18101a');
      rect(L, 3, -46, 2, 2, '#18101a');
      rect(L, -8, -38, 16, 10, '#d69e38');
      rect(L, -8, -38, 16, 2, '#e6b95c');

      // 2.3 เคาน์เตอร์ไม้และสินค้าจัดแสดง (Potions & Crops)
      rect(L, -60, -30, 120, 30, '#9e6d3c');
      rect(L, -64, -36, 128, 7, '#c49054');
      rect(L, -60, -4, 120, 4, '#754f2c');
      // ยาโพชั่นสีแดงและสีฟ้า
      rect(L, -48, -48, 8, 12, '#dc3644');
      rect(L, -46, -52, 4, 4, '#f2f2f2');
      rect(L, -47, -46, 2, 8, '#ff8a94');
      rect(L, -30, -48, 8, 12, '#3884f8');
      rect(L, -28, -52, 4, 4, '#f2f2f2');
      rect(L, -29, -46, 2, 8, '#8ec2ff');
      // ผลผลิตจัดวางบนโต๊ะ
      rect(L, 22, -44, 14, 8, '#f59620');
      rect(L, 40, -44, 12, 8, '#965ac8');

      // 2.4 กันสาดผ้าใบหน้าร้านลายทางขอบโค้ง (Canopy Awning)
      for (let i = 0; i < 8; i++) {
        const x = -64 + i * 16, c = i % 2 ? '#eee4c6' : '#c43e38';
        rect(L, x, -92, 16, 28, c);
        L.ell(x + 8, -64, 8, 6, c);
      }
      rect(L, -66, -96, 132, 6, '#862422');
      rect(L, -66, -96, 132, 2, '#b2443e');

      // 2.5 ป้ายชื่อร้านค้าด้านบน
      rect(L, -38, -124, 76, 26, '#54341b');
      rect(L, -36, -122, 72, 22, '#754f2c');
      rect(L, -36, -122, 72, 2, '#99673d');
    });
  }

  window.drawShop = drawShop = function () {
    envShadow(ctx, 320, 63, 40, 6);
    GFX.draw(ctx, shopFrame(), 320, 64, false, null);
    pixText('ร้านค้า', 320, 64 - 58, K.gold, 1.4, true);
  };

  /* ---------- 3. สัตว์ฟาร์ม (Farm Animals: Chicken & Cow) ---------- */
  function chickenFrame(s) {
    return bake('chk' + s, 36, 40, 18, 34, L => {
      // ขา
      L.px(-3, -5, 2, 5 + s, '#de9c24');
      L.px(3, -5, 2, 5, '#de9c24');
      // ลำตัวและหางขน
      L.ell(0, -12, 9, 7, '#f7f4ec');
      L.ell(-1, -10, 6, 4, '#dfd9c4');
      L.px(-11, -18, 5, 8, '#ebe5d2');
      L.px(-12, -20, 3, 4, '#dfd9c4');
      // หัว หงอนไก่ และจะงอยปาก
      L.ell(8, -20, 5, 5, '#f7f4ec');
      L.px(7, -28, 3, 4, '#d63a38');
      L.px(10, -27, 2, 3, '#d63a38');
      L.px(13, -20, 4, 3, '#ee9c1c');
      L.px(9, -22, 2, 2, '#18101a');
      L.px(11, -16, 3, 3, '#d63a38');
    });
  }

  function cowFrame(s) {
    return bake('cow' + s, 64, 56, 32, 50, L => {
      // ขา 4 ข้าง
      L.px(-16, -9, 5, 9, '#34241c');
      L.px(-9 + s, -9, 5, 9, '#f2eee4');
      L.px(5 - s, -9, 5, 9, '#34241c');
      L.px(12, -9, 5, 9, '#f2eee4');
      // ลำตัวลายจุดขาวดำ
      L.ell(-1, -20, 20, 11, '#f2eee4');
      L.ell(-1, -17, 18, 6, '#e0dbce');
      L.ell(-9, -23, 6, 5, '#34241c');
      L.ell(5, -19, 5, 4, '#34241c');
      L.px(0, -12, 8, 4, '#e6a49c'); // เต้านม
      // หาง
      L.px(-22, -24, 3, 12, '#34241c');
      L.px(-24, -14, 4, 4, '#34241c');
      // หัว จมูก และเขา
      L.ell(17, -27, 7, 7, '#f2eee4');
      L.px(20, -24, 8, 6, '#e6a49c');
      L.px(22, -22, 2, 2, '#b87067');
      L.px(14, -30, 2, 2, '#18101a');
      L.px(10, -37, 3, 5, '#cebe98');
      L.px(18, -37, 3, 5, '#cebe98');
      L.px(11, -34, 3, 4, '#34241c');
    });
  }

  const _da = drawAni;
  window.drawAni = drawAni = function (a) {
    const x = Math.round(a.x);
    const y = Math.round(a.y);
    const s = Math.sin(a.anim * 8) > 0 ? 1 : 0;
    const ready = a.prod >= AT[a.t].t;
    const ch = a.t === 'chicken';

    envShadow(ctx, x, y - 1, ch ? 9 : 15, ch ? 3 : 5);
    GFX.draw(ctx, ch ? chickenFrame(s) : cowFrame(s), x, y, a.face < 0, null);

    if (ready) pixText('!', x, y - (ch ? 21 : 28), '#ffd23f', 1.6, true);
  };

  /* ---------- 4. สุนัขฟาร์ม (Farm Dog) ---------- */
  function dogFrame(s) {
    return bake('dog' + s, 48, 44, 24, 38, L => {
      // หางกระดิก
      L.px(-14, -14, 6, 3, '#85552f');
      L.px(-17, -18 + s, 4, 5, '#85552f');
      // ขา
      L.px(-10, -8, 4, 8, '#a26e3a');
      L.px(-3 + s * 2, -8, 4, 8, '#85552f');
      L.px(5 - s * 2, -8, 4, 8, '#85552f');
      L.px(10, -8, 4, 8, '#a26e3a');
      // ลำตัว
      L.ell(-1, -14, 14, 7, '#c48b48');
      L.px(-6, -8, 14, 3, '#eddcb0');
      L.ell(-1, -19, 12, 3, '#dba968');
      // หัว หู และจมูก
      L.ell(13, -20, 6, 6, '#d19a54');
      L.px(17, -17, 6, 5, '#eddcb0');
      L.px(21, -17, 2, 2, '#18101a');
      L.px(14, -23, 2, 2, '#18101a');
      L.px(9, -28, 4, 7, '#754726');
      L.px(15, -28, 4, 7, '#754726');
    });
  }

  window.drawDog = drawDog = function () {
    const x = Math.round(DOG.x);
    const y = Math.round(DOG.y);
    const s = Math.sin(DOG.anim * 12) > 0 ? 1 : 0;
    envShadow(ctx, x, y - 1, 10, 3);
    GFX.draw(ctx, dogFrame(s), x, y, DOG.face < 0, null);
  };

  /* ---------- 5. Hooks: วัตถุสิ่งแวดล้อม (ต้นไม้ หิน บ้าน ร้านค้า) ใช้เงามีทิศ ---------- */
  const _t = drawTree;
  window.drawTree = drawTree = function (x, b, dead, id, v) {
    envShadow(ctx, x + 8, b - 1, 16, 6);
    GFX.draw(ctx, ENV_ART.treeFrame(id, v, dead), x + 8, b - 1, false, null);
  };

  const _o = drawObj;
  window.drawObj = drawObj = function (o) {
    if (o.k === 'rock') {
      const cave = zone === 'cave';
      const v = Math.floor(((o.x / T) * 7 + (o.b / T) * 3)) % 2;
      envShadow(ctx, o.x + 8, o.b - 1, 15, 5);
      GFX.draw(ctx, ENV_ART.rockFrame(cave, v), o.x + 8, o.b - 1, false, null);
      return;
    }
    if (o.k === 'tree') return drawTree(o.x, o.b, o.dead, o.id, o.v);
    if (o.k === 'house') return drawHouse();
    if (o.k === 'shop') return drawShop();
    return _o(o);
  };
})();
