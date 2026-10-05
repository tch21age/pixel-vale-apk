/* v22 UX: เตือน HP ต่ำ · สั่นเบาๆ เมื่อกดปุ่ม · แจ้งเตือนสกิลพร้อมใช้ */
(function(){
  const $=id=>document.getElementById(id);
  const v=document.createElement('div');v.id='vig';document.body.appendChild(v);
  const hp=$('hpf');
  function pct(){
    if(!hp)return 1;
    const s=hp.style,m=/scaleX\(([\d.]+)\)/.exec(s.transform||'');
    if(m)return +m[1];
    const w=parseFloat(s.width);return isNaN(w)?1:w/100;
  }
  function chk(){document.body.classList.toggle('lowhp',pct()>0&&pct()<.3)}
  if(hp){new MutationObserver(chk).observe(hp,{attributes:true,attributeFilter:['style']});chk()}
  const vib=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
  document.addEventListener('pointerdown',e=>{
    const t=e.target.closest&&e.target.closest('.abtn,.d,.slot');
    if(t)vib(t.classList.contains('abtn')?10:6);
  },{passive:true});
  /* สกิลคูลดาวน์เสร็จ → วงแหวนเรืองครั้งเดียว */
  document.querySelectorAll('.abtn .cd').forEach(cd=>{
    const b=cd.parentElement;let on=false;
    const f=()=>{const m=/scaleY\(([\d.]+)\)/.exec(cd.style.transform||'');const a=m?+m[1]>.02:false;
      if(on&&!a){b.classList.remove('ready');void b.offsetWidth;b.classList.add('ready')}on=a};
    new MutationObserver(f).observe(cd,{attributes:true,attributeFilter:['style']});
  });
})();
