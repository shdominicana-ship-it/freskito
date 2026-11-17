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

async function loadContent(){
  try{
    const response=await fetch(`content.json?v=${Date.now()}`);
    if(!response.ok)throw new Error('No se pudo cargar el contenido');
    const content=await response.json();
    document.querySelectorAll('[data-content]').forEach(element=>{const value=getPath(content,element.dataset.content);if(value!==undefined)element.textContent=value});
    document.querySelectorAll('[data-image]').forEach(image=>{const value=getPath(content,image.dataset.image);if(value)image.src=value});
    configureContact(content);configureSocial(content);
  }catch(error){console.warn(error)}
}

const menuButton=document.querySelector('.menu-button');
const navLinks=document.querySelector('.nav-links');
menuButton.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{navLinks.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
loadContent();
