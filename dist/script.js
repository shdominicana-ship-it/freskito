const getPath=(obj,path)=>path.split('.').reduce((value,key)=>value?.[key],obj);

function fitFlavorImage(image,container){
  const update=()=>{if(image.naturalWidth&&image.naturalHeight)container.classList.toggle('flavor-media-contain',image.naturalWidth/image.naturalHeight<1.2)};
  image.addEventListener('load',update,{once:true});if(image.complete)update();
}

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
    const slide=document.createElement('article');slide.className=`carousel-slide${index===0?' active':''}`;slide.setAttribute('aria-label',`${index+1} de ${slidesData.length}: ${item.name}`);slide.setAttribute('aria-hidden',String(index!==0));slide.style.setProperty('--slide-focus','50% 50%');slide.style.setProperty('--slide-zoom','1');
    const image=document.createElement('img');image.src=item.image;image.alt=`Helado FRESKITO sabor ${item.name}`;image.loading=index===0?'eager':'lazy';fitFlavorImage(image,slide);
    const caption=document.createElement('div');caption.className='carousel-caption';const small=document.createElement('small');small.textContent=item.subtitle||'Helado artesanal';const strong=document.createElement('strong');strong.textContent=item.name;caption.append(small,strong);slide.append(image,caption);track.appendChild(slide);
    const dot=document.createElement('button');dot.type='button';dot.className=`carousel-dot${index===0?' active':''}`;dot.setAttribute('role','tab');dot.setAttribute('aria-label',`Mostrar ${item.name}`);dot.setAttribute('aria-selected',String(index===0));dot.addEventListener('click',()=>show(index,true));dots.appendChild(dot);return slide;
  });
  const dotButtons=[...dots.children];
  function show(index,manual=false){active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{const selected=i===active;slide.classList.toggle('active',selected);slide.setAttribute('aria-hidden',String(!selected));dotButtons[i].classList.toggle('active',selected);dotButtons[i].setAttribute('aria-selected',String(selected))});if(manual)restart()}
  function restart(){clearInterval(timer);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(active+1),3600)}
  carousel.querySelector('.carousel-prev').onclick=()=>show(active-1,true);carousel.querySelector('.carousel-next').onclick=()=>show(active+1,true);
  carousel.addEventListener('mouseenter',()=>clearInterval(timer));carousel.addEventListener('mouseleave',restart);carousel.addEventListener('focusin',()=>clearInterval(timer));carousel.addEventListener('focusout',restart);restart();
}

function configureFlavorCatalog(content){
  const grid=document.querySelector('#flavor-catalog');
  const dialog=document.querySelector('#flavor-dialog');
  if(!grid||!dialog)return;
  const flavors=(content.heroSlides||[]).filter(item=>item?.name&&item?.image&&!item.isGroup);
  const dialogImage=dialog.querySelector('#flavor-dialog-image');
  const dialogTitle=dialog.querySelector('#flavor-dialog-title');
  const dialogSubtitle=dialog.querySelector('#flavor-dialog-subtitle');
  const dialogDescription=dialog.querySelector('#flavor-dialog-description');
  const dialogOrder=dialog.querySelector('#flavor-dialog-order');
  const orderNumber=String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'');
  let previousFocus;

  function closeDialog(){
    if(dialog.open)dialog.close();
    document.body.classList.remove('dialog-open');
    previousFocus?.focus();
  }

  function openFlavor(item,trigger){
    previousFocus=trigger;
    dialogTitle.textContent=item.name;
    dialogSubtitle.textContent=item.subtitle||'Helado artesanal FRESKITO';
    dialogDescription.textContent=item.description||`${item.subtitle||'Un sabor preparado para disfrutar.'} Elaborado artesanalmente con ingredientes naturales y la frescura característica de FRESKITO.`;
    dialogImage.src=item.image;
    dialogImage.alt=`Helado FRESKITO sabor ${item.name}`;
    const dialogMedia=dialog.querySelector('.flavor-dialog-media');dialogMedia.classList.remove('flavor-media-contain');dialogMedia.style.setProperty('--flavor-focus','50% 50%');dialogMedia.style.setProperty('--flavor-zoom','1');fitFlavorImage(dialogImage,dialogMedia);
    dialogOrder.href=`https://wa.me/${orderNumber}?text=${encodeURIComponent(`Hola FRESKITO, quiero pedir el sabor ${item.name}.`)}`;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    document.body.classList.add('dialog-open');
  }

  grid.innerHTML='';
  if(!flavors.length){
    const empty=document.createElement('p');empty.className='flavor-catalog-empty';empty.textContent='Próximamente publicaremos nuestros sabores.';grid.appendChild(empty);return;
  }
  flavors.forEach((item,index)=>{
    const card=document.createElement('button');card.type='button';card.className='flavor-card flavor-catalog-card reveal visible';card.setAttribute('aria-label',`Ver detalles del sabor ${item.name}`);
    const media=document.createElement('span');media.className='flavor-card-media';media.style.setProperty('--flavor-focus','50% 50%');media.style.setProperty('--flavor-zoom','1');
    const image=document.createElement('img');image.src=item.image;image.alt=`Helado FRESKITO sabor ${item.name}`;image.loading=index<3?'eager':'lazy';media.appendChild(image);fitFlavorImage(image,media);
    const body=document.createElement('span');body.className='flavor-card-body';
    const natural=document.createElement('small');natural.textContent='100 % natural';
    const title=document.createElement('strong');title.textContent=item.name;
    const subtitle=document.createElement('span');subtitle.className='flavor-card-subtitle';subtitle.textContent=item.subtitle||'Helado artesanal FRESKITO';
    const action=document.createElement('span');action.className='flavor-card-action';action.textContent='Ver sabor →';
    body.append(natural,title,subtitle,action);card.append(media,body);card.addEventListener('click',()=>openFlavor(item,card));grid.appendChild(card);
  });

  dialog.querySelector('.flavor-dialog-close').onclick=closeDialog;
  dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog()});
}

function configureStores(content){
  const grid=document.querySelector('#store-grid');if(!grid)return;grid.innerHTML='';
  const stores=content.stores||[];
  if(!stores.length){const empty=document.createElement('div');empty.className='store-empty reveal visible';empty.innerHTML='<span>Próximamente</span><h3>Estamos sumando nuevos Puntos Aliados</h3><p>Escríbenos para conocer el punto de venta más cercano o para agregar tu negocio a nuestra red.</p>';grid.appendChild(empty)}
  stores.forEach(store=>{
    const card=document.createElement('article');card.className='store-card reveal visible';
    const channel=document.createElement('span');channel.className='store-channel';channel.textContent=store.channel||'Punto Aliado';
    const title=document.createElement('h3');title.textContent=store.name||'Punto Aliado FRESKITO';
    const address=document.createElement('p');address.textContent=store.address||'';card.append(channel,title,address);
    const actions=document.createElement('div');actions.className='store-actions';
    if(store.mapUrl){const map=document.createElement('a');map.href=store.mapUrl;map.target='_blank';map.rel='noopener';map.textContent='Ver en el mapa →';actions.appendChild(map)}
    if(store.whatsapp||store.phone){const number=String(store.whatsapp||store.phone).replace(/\D/g,'');const contact=document.createElement('a');contact.href=store.whatsapp?`https://wa.me/${number}`:`tel:${store.phone}`;contact.target=store.whatsapp?'_blank':'_self';contact.rel='noopener';contact.textContent=store.phone||store.whatsapp;actions.appendChild(contact)}
    card.appendChild(actions);grid.appendChild(card);
  });
  const orderNumber=String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'');
  document.querySelectorAll('[data-order-whatsapp]').forEach(link=>link.href=`https://wa.me/${orderNumber}?text=${encodeURIComponent('Hola FRESKITO, quiero realizar un pedido.')}`);
  const officeAddress=content.office?.address||'';document.querySelectorAll('[data-office-map]').forEach(link=>link.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`);
}

function configureAssorted(content){
  const section=document.querySelector('.assorted-boxes');
  const grid=document.querySelector('#assorted-grid');
  if(!section||!grid)return;
  const boxes=content.assortedBoxes||[];
  section.hidden=!boxes.length;grid.innerHTML='';
  boxes.forEach((box,index)=>{
    const card=document.createElement('article');card.className='assorted-card reveal visible';
    const media=document.createElement('div');media.className='assorted-card-media';
    const image=document.createElement('img');image.src=box.image;image.alt=`Docena surtida FRESKITO: ${box.name}`;image.loading=index===0?'eager':'lazy';media.appendChild(image);
    const body=document.createElement('div');body.className='assorted-card-body';
    const badge=document.createElement('span');badge.className='assorted-card-badge';badge.textContent=box.badge||'12 helados · 3 sabores';
    const title=document.createElement('h3');title.textContent=box.name||'Docena surtida';
    const flavors=document.createElement('p');flavors.textContent=box.flavors||'';
    body.append(badge,title,flavors);card.append(media,body);grid.appendChild(card);
  });
  const orderNumber=String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'');
  document.querySelectorAll('[data-assorted-whatsapp]').forEach(link=>link.href=`https://wa.me/${orderNumber}?text=${encodeURIComponent('Hola FRESKITO, quiero pedir una docena surtida de 12 helados.')}`);
}

function configureSeasonal(content){
  const section=document.querySelector('.seasonal-products');const grid=document.querySelector('#seasonal-grid');if(!section||!grid)return;
  const products=content.seasonalProducts||[];section.hidden=!products.length;grid.innerHTML='';
  products.forEach((product,index)=>{
    const card=document.createElement('article');card.className='seasonal-card reveal visible';
    const media=document.createElement('div');media.className='seasonal-media';
    if(product.image){const image=document.createElement('img');image.src=product.image;image.alt=`Helado FRESKITO de temporada sabor ${product.name}`;image.loading=index===0?'eager':'lazy';media.appendChild(image)}else{const placeholder=document.createElement('div');placeholder.className='seasonal-placeholder';placeholder.innerHTML='<span>🥭</span><small>Imagen próximamente</small>';media.appendChild(placeholder)}
    const body=document.createElement('div');body.className='seasonal-body';const badge=document.createElement('span');badge.className='seasonal-badge';badge.textContent=product.badge||'Edición de temporada';const title=document.createElement('h3');title.textContent=product.name;const text=document.createElement('p');text.textContent=product.subtitle||'';const link=document.createElement('a');link.className='text-link';link.href=`https://wa.me/${String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(`Hola FRESKITO, quiero pedir el sabor de temporada ${product.name}.`)}`;link.target='_blank';link.rel='noopener';link.textContent='Pedir por WhatsApp →';body.append(badge,title,text,link);card.append(media,body);grid.appendChild(card);
  });
}

async function loadContent(){
  try{
    const response=await fetch(`content.json?v=${Date.now()}`);
    if(!response.ok)throw new Error('No se pudo cargar el contenido');
    const content=await response.json();
    document.querySelectorAll('[data-content]').forEach(element=>{const value=getPath(content,element.dataset.content);if(value!==undefined)element.textContent=value});
    document.querySelectorAll('[data-image]').forEach(image=>{const value=getPath(content,image.dataset.image);if(value)image.src=value});
    configureContact(content);configureSocial(content);configureCarousel(content);configureFlavorCatalog(content);configureAssorted(content);configureStores(content);configureSeasonal(content);
  }catch(error){console.warn(error)}
}

const menuButton=document.querySelector('.menu-button');
const navLinks=document.querySelector('.nav-links');
menuButton.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{navLinks.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
loadContent();
