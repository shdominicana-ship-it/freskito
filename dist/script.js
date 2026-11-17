const getPath=(obj,path)=>path.split('.').reduce((value,key)=>value?.[key],obj);

function configureContact(content){
  const whatsapp=String(content.contact?.whatsapp||'').replace(/\D/g,'');
  const phone=content.contact?.phone||`+${whatsapp}`;
  const messages=['Hola FRESKITO, ¿dónde puedo comprar sus helados?','Hola FRESKITO, quiero información para convertirme en Punto Aliado.','Hola FRESKITO, quiero más información.','Hola FRESKITO, quiero más información.'];
  document.querySelectorAll('a[href*="wa.me"]').forEach((link,index)=>{link.href=`https://wa.me/${whatsapp}?text=${encodeURIComponent(messages[index]||messages[2])}`});
  document.querySelectorAll('[data-phone-link],a[href^="tel:"]').forEach(link=>link.href=`tel:${phone}`);
}

function configureSocial(content){
  const container=document.querySelector('.social-links');
  const icons={instagram:'IG',facebook:'f',tiktok:'♪',youtube:'▶'};
  const names={instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',youtube:'YouTube'};
  container.innerHTML='';
  Object.entries(content.social||{}).forEach(([network,url])=>{
    if(!url)return;
    const link=document.createElement('a');
    link.href=url;link.target='_blank';link.rel='noopener';link.className=`social social-${network}`;
    link.setAttribute('aria-label',names[network]||network);link.textContent=icons[network]||'↗';container.appendChild(link);
  });
  container.hidden=!container.children.length;
}

function configureCarousel(content){
  const carousel=document.querySelector('.hero-carousel');
  const track=carousel?.querySelector('.carousel-track');
  const dots=carousel?.querySelector('.carousel-dots');
  const slidesData=content.heroSlides?.length?content.heroSlides:[{name:'Todos los sabores',subtitle:'La frescura que te alegra',image:content.hero.image,focus:'50% 50%',zoom:1}];
  if(!carousel||!track||!dots)return;
  track.innerHTML='';dots.innerHTML='';let active=0;let timer;
  const slides=slidesData.map((item,index)=>{
    const slide=document.createElement('article');slide.className=`carousel-slide${index===0?' active':''}`;slide.setAttribute('aria-label',`${index+1} de ${slidesData.length}: ${item.name}`);slide.setAttribute('aria-hidden',String(index!==0));slide.style.setProperty('--slide-focus',item.focus||'50% 50%');slide.style.setProperty('--slide-zoom',String(item.zoom||1));
    const image=document.createElement('img');image.src=item.image;image.alt=`Helado FRESKITO sabor ${item.name}`;image.loading=index===0?'eager':'lazy';
    const caption=document.createElement('div');caption.className='carousel-caption';const small=document.createElement('small');small.textContent=item.subtitle||'Helado artesanal';const strong=document.createElement('strong');strong.textContent=item.name;caption.append(small,strong);slide.append(image,caption);track.appendChild(slide);
    const dot=document.createElement('button');dot.type='button';dot.className=`carousel-dot${index===0?' active':''}`;dot.setAttribute('role','tab');dot.setAttribute('aria-label',`Mostrar ${item.name}`);dot.setAttribute('aria-selected',String(index===0));dot.addEventListener('click',()=>show(index,true));dots.appendChild(dot);return slide;
  });
  const dotButtons=[...dots.children];
  function show(index,manual=false){active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{const selected=i===active;slide.classList.toggle('active',selected);slide.setAttribute('aria-hidden',String(!selected));dotButtons[i].classList.toggle('active',selected);dotButtons[i].setAttribute('aria-selected',String(selected))});if(manual)restart()}
  function restart(){clearInterval(timer);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(active+1),3600)}
  carousel.querySelector('.carousel-prev').onclick=()=>show(active-1,true);carousel.querySelector('.carousel-next').onclick=()=>show(active+1,true);
  carousel.addEventListener('mouseenter',()=>clearInterval(timer));carousel.addEventListener('mouseleave',restart);carousel.addEventListener('focusin',()=>clearInterval(timer));carousel.addEventListener('focusout',restart);restart();
}

async function loadContent(){
  try{
    const response=await fetch(`content.json?v=${Date.now()}`);
    if(!response.ok)throw new Error('No se pudo cargar el contenido');
    const content=await response.json();
    document.querySelectorAll('[data-content]').forEach(element=>{const value=getPath(content,element.dataset.content);if(value!==undefined)element.textContent=value});
    document.querySelectorAll('[data-image]').forEach(image=>{const value=getPath(content,image.dataset.image);if(value)image.src=value});
    configureContact(content);configureSocial(content);configureCarousel(content);
  }catch(error){console.warn(error)}
}

const menuButton=document.querySelector('.menu-button');
const navLinks=document.querySelector('.nav-links');
menuButton.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{navLinks.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
loadContent();
