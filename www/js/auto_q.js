'use strict';
/* =====================================================================
   AUTO QUALITY (v11): ถ้าเฟรมช้าต่อเนื่องระหว่างเล่น → ลดความละเอียดแคนวาส Q 4→3→2 (ไม่ขึ้นกลับ กันแกว่ง)
   - ไม่แตะ logic: เปลี่ยนแค่ Q แล้ว fit() (ปรับขนาดแคนวาส) + ล้างแคชข้อความที่ bake ตาม Q
     สไปรต์ GFX (RS=2) กับมินิแมพไม่ขึ้นกับ Q จึงไม่ต้องล้าง
   - ล็อกคุณภาพด้วย ?q=2..4 · ปิดระบบด้วย ?autoq=0 · เก็บผลไว้ใน localStorage ('pvq') ให้เริ่มรอบหน้าที่ระดับนั้นเลย
   - ทดสอบ: ?autoq=force จะถือว่าทุกเฟรมช้า (ใช้ตรวจว่ากลไกทำงาน)
   ===================================================================== */
(function(){
  if(Q_FORCED||/[?&]autoq=0/.test(location.search))return;
  const FORCE=/[?&]autoq=force/.test(location.search);
  const SLOW=24,WIN=90,NEED=2,GRACE=3500,MINQ=2;       // เฉลี่ย >24 ms (<~42 fps) ต่อ 90 เฟรม ติดกัน 2 รอบ
  let last=0,acc=0,n=0,bad=0,hold=performance.now()+GRACE;

  function setQuality(q){
    if(q===Q||q<MINQ||q>4)return;
    Q=q;fit();
    if(typeof pixTextFlush==='function')pixTextFlush();
    try{localStorage.setItem('pvq',String(q))}catch(e){}
    acc=0;n=0;bad=0;hold=performance.now()+GRACE;     // เว้นช่วงให้แคนวาสใหม่/แคชข้อความ bake ก่อนวัดซ้ำ
    window.dispatchEvent(new CustomEvent('pvquality',{detail:q}));
  }
  window.setQuality=setQuality;

  function active(){
    try{return running&&!paused&&!modal&&!document.hidden}catch(e){return false}
  }
  (function tick(t){
    requestAnimationFrame(tick);
    const dt=t-last;last=t;
    if(!active()||t<hold||dt>250||dt<=0){acc=0;n=0;if(!active())bad=0;return}   // หยุด/แท็บซ่อน/สะดุดใหญ่ครั้งเดียว ไม่นับ
    acc+=FORCE?60:dt;n++;
    if(n>=WIN){
      const avg=acc/n;acc=0;n=0;
      if(avg>SLOW){if(++bad>=NEED)setQuality(Q-1)}else bad=0;
    }
  })(0);
})();
