'use strict';
/* เพลงประกอบ 8-bit ง่ายๆ — ปิดได้ด้วยปุ่ม "เสียง" / M */
let mi=0;
setInterval(()=>{if(!running||paused||muted||!AC)return;mi++;const hunt=zone!=='farm',
  sc=hunt?[220,261.6,329.6,246.9,293.7,196]:[261.6,329.6,392,523.3,392,329.6],bs=[130.8,98,110,87.3];
  if(mi%2===0){const f=sc[(mi/2)%sc.length|0];tone(f,f,.3,'triangle',.017)}
  if(mi%8===0){const f=bs[(mi/8)%4|0];tone(f,f,1.2,'sine',.03)}},240);
