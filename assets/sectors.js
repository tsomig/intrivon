(()=>{
const root=document.querySelector('#sectors');if(!root)return;
const track=root.querySelector('.sector-track'),cards=[...track.children],nav=root.querySelector('.sector-pagination');
const mobile=matchMedia('(max-width:700px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let perPage=mobile.matches?1:2;
cards.forEach(card=>{
 const button=document.createElement('button');button.type='button';button.className='sector-expand';button.setAttribute('aria-label','Expand '+card.getAttribute('aria-label'));button.setAttribute('aria-expanded','false');card.append(button);
 button.setAttribute('aria-controls',card.querySelector('.sector-detail').id);
 function set(open){card.querySelector('.sector-detail').hidden=!open;card.classList.toggle('is-expanded',open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',(open?'Collapse ':'Expand ')+card.getAttribute('aria-label'))}
 card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')set(true)});
 card.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')set(false)});
 button.addEventListener('click',e=>{if(e.pointerType==='mouse'){set(true)}else{set(!card.classList.contains('is-expanded'))}});
 button.addEventListener('keydown',e=>{if(e.key==='Escape'){set(false);button.blur()}});
 button.addEventListener('blur',()=>set(false));
});

function current(){const width=cards[0].getBoundingClientRect().width+28;return Math.max(0,Math.min(nav.children.length-1,Math.round(track.scrollLeft/(width*perPage))))}
function mark(){const active=current();[...nav.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===active)))}
function go(page){const card=cards[Math.max(0,Math.min(cards.length-1,page*perPage))];track.scrollTo({left:card.offsetLeft-cards[0].offsetLeft,behavior:reduced.matches?'instant':'smooth'})}
function build(){perPage=mobile.matches?1:2;nav.replaceChildren();for(let i=0;i<Math.ceil(cards.length/perPage);i++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show sectors '+(i*perPage+1)+(perPage===2?' and '+(i*perPage+2):''));b.addEventListener('click',()=>go(i));nav.append(b)}mark()}
track.addEventListener('scroll',mark,{passive:true});track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(current()+(e.key==='ArrowRight'?1:-1))}});
mobile.addEventListener('change',build);build();
})();
