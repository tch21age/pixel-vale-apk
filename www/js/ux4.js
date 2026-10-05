/* v24: แตะแผนที่เพื่อขยาย/ย่อ */
(function(){const w=document.getElementById('mapwrap');if(!w)return;
  w.addEventListener('click',()=>{w.classList.toggle('big');try{SFX.click()}catch(e){}});})();
