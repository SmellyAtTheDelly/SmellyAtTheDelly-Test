const FILES = ["cactus_axe.png", "cactus_pickaxe.png", "cactus_sword.png", "crab_axe.png", "crab_pickaxe.png", "crab_sword.png",  "dinoaxe.png", "dinopickaxe.png", "dinosword.png", "ocean_axe.png", "ocean_pickaxe.png", "ocean_sword.png", "turtle_axe.png", "turtle_pickaxe.png", "turtle_sword.png", "dash_katana.png", "grave_digger.png", "night_blade.png",  "shadowfang.png", "stormbreaker.png", "gaurdian_amulet.png", "holy_cross.png", "invisibility_cloak.png", "shield_of_absorption.png", "wither_orb.png"];
const IMAGES = FILES.map(n => `images/${n}`);
const WM = 'smelly0. • Ssmelly';


function initTicker(track, speed=40){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let x=0, last=performance.now();
  function step(t){
    const dt=(t-last)/1000; last=t;
    x -= speed*dt;
    const first = track.firstElementChild;
    if(first){
      const w = first.getBoundingClientRect().width + parseFloat(getComputedStyle(first).marginRight || "0");
      if(-x >= w){ x += w; track.appendChild(first); }
    }
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function thumb(src){
  const d=document.createElement('div'); d.className='thumb';
  const img=new Image(); img.alt='Artwork'; img.decoding='async'; img.loading='lazy';
  img.src=src; img.style.imageRendering='pixelated'; img.style.objectFit='contain';
  d.appendChild(img);


  const wm=document.createElement('div'); wm.className='wm';
  const grad=document.createElement('div'); grad.className='wm-gradient'; wm.appendChild(grad);
  const track=document.createElement('div'); track.className='wm-track';
  const text = `${WM}`;
  const a=document.createElement('span'); a.className='wm-line'; a.textContent=text;
  const b=document.createElement('span'); b.className='wm-line'; b.textContent=text;
  track.appendChild(a); track.appendChild(b); wm.appendChild(track);
  d.appendChild(wm);
  queueMicrotask(()=>initTicker(track, 48));

  d.addEventListener('click',()=>openLightbox(img.src));
  return d;
}

const projectsGrid=document.getElementById('projectsGrid');
const galleryGrid=document.getElementById('galleryGrid');
(function renderAll(){ projectsGrid.innerHTML=''; galleryGrid.innerHTML=''; IMAGES.forEach((src)=>{ if(src) { projectsGrid.appendChild(thumb(src)); galleryGrid.appendChild(thumb(src)); } }); })();

const io=new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); } }); }, {threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));


let lastY = window.scrollY;
const gallerySection = document.getElementById('gallery');
function updateGalleryActive(){
  const rect = gallerySection.getBoundingClientRect();
  const topFromDoc = window.scrollY + rect.top;
  const goingDown = window.scrollY > lastY;
  const goingUp = !goingDown;
  const triggerIn = window.scrollY + window.innerHeight > topFromDoc + 120;
  const triggerOut = window.scrollY < topFromDoc - 220;
  if (goingDown && triggerIn) gallerySection.classList.add('active');
  if (goingUp && triggerOut) gallerySection.classList.remove('active');
  lastY = window.scrollY;
}
window.addEventListener('scroll', updateGalleryActive, {passive:true});
window.addEventListener('load', ()=>{
  document.getElementById('year').textContent=(new Date()).getFullYear();
  updateGalleryActive();

  const lbTrack = document.getElementById('lbTrack');
  if(lbTrack) initTicker(lbTrack, 58);
});


document.getElementById('copyDiscord')?.addEventListener('click', async (e)=>{
  const txt=e.currentTarget.getAttribute('data-copy');
  try{ await navigator.clipboard.writeText(txt); e.currentTarget.textContent='Copied!'; setTimeout(()=>{ e.currentTarget.textContent='@'+txt; }, 1200);}catch{ alert(txt); }
});

document.addEventListener('contextmenu', (e)=>{
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', (e)=>{
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();
});
document.querySelectorAll('img').forEach(img=>{
  img.setAttribute('draggable','false');
  img.addEventListener('touchstart', (ev)=>{ ev.preventDefault(); }, {passive:false});
});
