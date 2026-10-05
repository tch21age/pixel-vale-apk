'use strict';
/* v15 ส่วนที่ 2 — มอนสเตอร์ยากขึ้นตามเลเวลผู้เล่น
   โหลดหลัง features.js/world.js (ห่อ spawnMon ชั้นนอกสุด จึงเห็นชนิดสุดท้ายแล้ว เช่น ราชาสไลม์)
   ค่าฐานของมอนสเตอร์ใน MON[] ไม่ถูกแก้ — คูณสเกลต่อตัวตอนเกิด: m.lv / m.mhp / m.atk / m.em (EXP) / m.gm (ทอง)
   เซฟเดิมใช้ได้ (ไม่มีอะไรของมอนสเตอร์ถูกเซฟ) · ปรับสมดุลที่ DIFF ด้านล่างที่เดียว */
const DIFF={
  hp:.55, atk:.21, exp:.22, gold:.10,       // เพิ่มต่อเลเวลมอนสเตอร์ (คิดจากฐานที่ Lv.1) · v18 จูนให้ "ฟันกี่ครั้งตาย" และ "โดนตีกี่ % ของ HP" คงที่ตามเลเวล (ดู CHANGELOG v18)
  zoneLv:{farm:0,hunt:0,cave:3},            // ถ้ำคริสตัลเลเวลมอนสูงกว่าผู้เล่น
  bossLv:3, jitter:1, maxLv:120
};
const monScale=lv=>{const k=Math.max(0,lv-1);return{hp:1+DIFF.hp*k,atk:1+DIFF.atk*k,exp:1+DIFF.exp*k,gold:1+DIFF.gold*k}};
function applyMonScale(m){
  const d=MON[m.type];if(!d)return;
  const lv=clamp(P.lv+(DIFF.zoneLv[zone]||0)+(m.type==='king'?DIFF.bossLv:0)+ri(-DIFF.jitter,DIFF.jitter),1,DIFF.maxLv),s=monScale(lv);
  m.lv=lv;m.mhp=Math.max(1,Math.round(d.hp*s.hp));m.hp=m.mhp;m.atk=Math.max(1,Math.round(d.atk*s.atk));m.em=s.exp;m.gm=s.gold;
}
const _spScale=spawnMon;
spawnMon=function(){const n=mons.length;_spScale();if(mons.length>n)applyMonScale(mons[mons.length-1])};
/* v18: ชนิดมอนในป่า/ที่ล่าเปลี่ยนตามเลเวลผู้เล่น — สไลม์ค่อยๆ เกิดน้อยลง (32% ที่ Lv.1 → ต่ำสุด 6% ที่ Lv.14+) ที่เหลือแบ่งให้ ก็อบลิน/หมาป่า/หมูป่า ตามสัดส่วนเดิม · ถ้ำเหมือนเดิม */
const _pt=pickType;
pickType=function(){
  if(zone==='cave')return _pt();
  const sl=Math.max(.06,.32-.02*(P.lv-1)),k=(1-sl)/.68,q=Math.random();
  return q<sl?'slime':q<sl+.18*k?'goblin':q<sl+.46*k?'wolf':'boar';
};
window.__diff={DIFF,monScale,applyMonScale};
