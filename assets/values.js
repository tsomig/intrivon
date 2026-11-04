(()=>{
 const root=document.querySelector('#values .core-carousel');if(!root)return;
 const slides=[...root.querySelectorAll('.core-slide')],button=root.querySelector('.core-playback'),status=root.querySelector('.core-status');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let active=0,playing=!reduced.matches,timer,visible=true;
 function schedule(){clearTimeout(timer);if(playing&&visible&&!document.hidden)timer=setTimeout(()=>move(1,false),7000);}
 function reflect(){button.setAttribute('aria-label',playing?'Pause automatic rotation':'Resume automatic rotation');button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${playing?'M8 5v14M16 5v14':'M7 4l13 8-13 8z'}"/></svg>`;}
 function render(announce=false){slides.forEach((slide,i)=>{slide.hidden=false;slide.classList.toggle('is-active',i===active);slide.setAttribute('aria-hidden',String(i!==active));slide.inert=i!==active;});if(announce)status.textContent=slides[active].querySelector('h3').textContent;}
 function move(step,manual=true){if(manual)playing=false;active=(active+step+slides.length)%slides.length;render(manual);reflect();schedule();}
 button.addEventListener('click',()=>{playing=!playing;reflect();schedule();});
 root.querySelectorAll('[data-core-step]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.coreStep))));
 root.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}});
 document.addEventListener('visibilitychange',schedule);window.addEventListener('pagehide',()=>clearTimeout(timer));window.addEventListener('pageshow',schedule);
 reduced.addEventListener('change',e=>{if(e.matches){playing=false;reflect();schedule();}});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15}).observe(root);
 render();reflect();schedule();
})();
