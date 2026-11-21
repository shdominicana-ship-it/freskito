const getPath=(obj,path)=>path.split('.').reduce((value,key)=>value?.[key],obj);

function fitFlavorImage(image,container){
  const update=()=>{if(image.naturalWidth&&image.naturalHeight)container.classList.toggle('flavor-media-contain',image.naturalWidth/image.naturalHeight<1.2)};
  image.addEventListener('load',update,{once:true});if(image.complete)update();
}

function configureContact(content){
  const whatsapp=String(content.contact?.whatsapp||'').replace(/\D/g,'');
  const phone=content.contact?.phone||`+${whatsapp}`;
  const intentMessages={
    store:'Hola HELADÍSIMO, ¿dónde puedo comprar sus helados?',
    partner:'Hola HELADÍSIMO, quiero información para convertirme en Punto Aliado.',
    assorted:'Hola HELADÍSIMO, quiero pedir una docena surtida de 12 helados.',
    order:'Hola HELADÍSIMO, quiero realizar un pedido.',
    flavor:'Hola HELADÍSIMO, quiero pedir uno de sus sabores.',
    general:'Hola HELADÍSIMO, quiero más información.'
  };
  document.querySelectorAll('a[href*="wa.me"]').forEach(link=>{
    const sectionIntent=link.closest('#donde-comprar')?'store':link.closest('#aliados')?'partner':'general';
    const intent=link.dataset.intent||sectionIntent;
    link.href=`https://wa.me/${whatsapp}?text=${encodeURIComponent(intentMessages[intent]||intentMessages.general)}`;
  });
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
  const configuredSlides=Array.isArray(content.heroSlides)?content.heroSlides.filter(item=>item?.image):[];
  const overviewImage=content.hero?.image;
  const overviewAlreadyIncluded=configuredSlides.some(item=>item.isGroup||item.image===overviewImage);
  const overviewSlide=overviewImage&&!overviewAlreadyIncluded?{name:'Todos los sabores',subtitle:'13 sabores permanentes + edición de temporada',image:overviewImage,focus:'50% 50%',zoom:1,isGroup:true}:null;
  const slidesData=configuredSlides.length?[...configuredSlides,...(overviewSlide?[overviewSlide]:[])]:[overviewSlide||{name:'Todos los sabores',subtitle:'La frescura que te alegra',image:overviewImage,focus:'50% 50%',zoom:1,isGroup:true}];
  if(!carousel||!track)return;
  track.replaceChildren();
  track.setAttribute('aria-live','off');
  const legacyDots=carousel.querySelector('.carousel-dots');
  if(legacyDots)legacyDots.hidden=true;
  let status=carousel.querySelector('.carousel-status');
  if(!status){
    status=document.createElement('div');
    status.className='carousel-status';
    status.innerHTML='<span class="carousel-counter"><strong data-carousel-current>1</strong><span aria-hidden="true"> / </span><span data-carousel-total></span></span><span class="carousel-progress"><span data-carousel-progress></span></span><button type="button" data-carousel-toggle aria-pressed="false">Pausar</button>';
    carousel.appendChild(status);
  }
  const currentLabel=status.querySelector('[data-carousel-current]');
  const totalLabel=status.querySelector('[data-carousel-total]');
  const progress=carousel.querySelector('[data-carousel-progress]');
  const toggle=status.querySelector('[data-carousel-toggle]');
  const toggleLabel=toggle?.querySelector('[data-carousel-toggle-label]');
  const duration=4200;
  let active=0;
  let timer;
  let userPaused=false;
  if(totalLabel)totalLabel.textContent=String(slidesData.length);
  currentLabel?.closest('[aria-live]')?.setAttribute('aria-live','off');
  const slides=slidesData.map((item,index)=>{
    const slide=document.createElement('article');slide.className=`carousel-slide${index===0?' active':''}`;if(item.isGroup)slide.classList.add('carousel-slide-group');slide.setAttribute('aria-label',`${index+1} de ${slidesData.length}: ${item.name}`);slide.setAttribute('aria-hidden',String(index!==0));slide.style.setProperty('--slide-focus','50% 50%');slide.style.setProperty('--slide-zoom','1');
    const image=document.createElement('img');image.src=item.image;image.alt=item.isGroup?'Presentación de sabores HELADÍSIMO':`Helado HELADÍSIMO sabor ${item.name}`;image.loading=index<3?'eager':'lazy';image.decoding='async';if(index===0)image.fetchPriority='high';fitFlavorImage(image,slide);
    const caption=document.createElement('div');caption.className='carousel-caption';const small=document.createElement('small');small.textContent=item.subtitle||'Helado artesanal';const strong=document.createElement('strong');strong.textContent=item.name;caption.append(small,strong);slide.append(image,caption);track.appendChild(slide);
    return slide;
  });
  function stopAutoplay(){
    clearTimeout(timer);
    timer=undefined;
    carousel.classList.remove('is-playing');
    if(progress){progress.classList.remove('is-running');progress.style.transition='none';progress.style.width='0%'}
  }
  function scheduleAutoplay(){
    stopAutoplay();
    const canPlay=slides.length>1&&!userPaused&&!document.hidden;
    if(!canPlay)return;
    carousel.classList.add('is-playing');
    if(progress){
      progress.style.transition='none';
      progress.style.width='0%';
      void progress.offsetWidth;
      progress.style.transition=`width ${duration}ms linear`;
      progress.style.width='100%';
      progress.classList.add('is-running');
    }
    timer=setTimeout(()=>{show(active+1);scheduleAutoplay()},duration);
  }
  function show(index,manual=false){
    active=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>{const selected=i===active;slide.classList.toggle('active',selected);slide.setAttribute('aria-hidden',String(!selected))});
    carousel.classList.toggle('showing-group',Boolean(slidesData[active]?.isGroup));
    if(currentLabel)currentLabel.textContent=String(active+1);
    if(manual)scheduleAutoplay();
  }
  function updateToggle(){
    if(!toggle)return;
    toggle.hidden=slides.length<=1;
    toggle.setAttribute('aria-pressed',String(userPaused));
    if(toggleLabel)toggleLabel.textContent=userPaused?'Reproducir':'Pausar';else toggle.textContent=userPaused?'Reproducir':'Pausar';
    toggle.setAttribute('aria-label',userPaused?'Reproducir carrusel automático':'Pausar carrusel automático');
  }
  carousel.querySelector('.carousel-prev')?.addEventListener('click',()=>show(active-1,true));
  carousel.querySelector('.carousel-next')?.addEventListener('click',()=>show(active+1,true));
  toggle?.addEventListener('click',()=>{userPaused=!userPaused;updateToggle();scheduleAutoplay()});
  carousel.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();show(active-1,true)}
    if(event.key==='ArrowRight'){event.preventDefault();show(active+1,true)}
  });
  let touchStartX=0;
  let touchStartY=0;
  carousel.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0].clientX;touchStartY=event.changedTouches[0].clientY;stopAutoplay()},{passive:true});
  carousel.addEventListener('touchend',event=>{
    const deltaX=event.changedTouches[0].clientX-touchStartX;
    const deltaY=event.changedTouches[0].clientY-touchStartY;
    if(Math.abs(deltaX)>45&&Math.abs(deltaX)>Math.abs(deltaY))show(deltaX<0?active+1:active-1,true);else scheduleAutoplay();
  },{passive:true});
  document.addEventListener('visibilitychange',scheduleAutoplay);
  carousel.dataset.autoplay='true';
  show(0);updateToggle();scheduleAutoplay();
}

function configureFlavorCatalog(content){
  const grid=document.querySelector('#flavor-catalog');
  const dialog=document.querySelector('#flavor-dialog');
  if(!grid||!dialog)return;
  const flavors=(content.heroSlides||[]).filter(item=>item?.name&&item?.image&&!item.isGroup);
  let toggle=document.querySelector('#flavor-toggle, [data-flavor-toggle]');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.id='flavor-toggle';
    toggle.type='button';
    toggle.className='button button-outline flavor-catalog-toggle';
    toggle.dataset.flavorToggle='';
    grid.insertAdjacentElement('afterend',toggle);
  }
  toggle.setAttribute('aria-controls','flavor-catalog');
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
    const flavorName=String(item.name).trim();
    previousFocus=trigger;
    dialogTitle.textContent=flavorName;
    dialogSubtitle.textContent=item.subtitle||'Helado artesanal HELADÍSIMO';
    dialogDescription.textContent=item.description||`${item.subtitle||'Un sabor preparado para disfrutar.'} Elaborado artesanalmente con ingredientes naturales y la frescura característica de HELADÍSIMO.`;
    dialogImage.src=item.image;
    dialogImage.alt=`Helado HELADÍSIMO sabor ${flavorName}`;
    const dialogMedia=dialog.querySelector('.flavor-dialog-media');dialogMedia.classList.remove('flavor-media-contain');dialogMedia.style.setProperty('--flavor-focus','50% 50%');dialogMedia.style.setProperty('--flavor-zoom','1');fitFlavorImage(dialogImage,dialogMedia);
    dialogOrder.href=`https://wa.me/${orderNumber}?text=${encodeURIComponent(`Hola HELADÍSIMO, quiero pedir el sabor ${flavorName}.`)}`;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    document.body.classList.add('dialog-open');
  }

  grid.innerHTML='';
  if(!flavors.length){
    toggle.hidden=true;const empty=document.createElement('p');empty.className='flavor-catalog-empty';empty.textContent='Próximamente publicaremos nuestros sabores.';grid.appendChild(empty);return;
  }
  const cards=flavors.map((item,index)=>{
    const flavorName=String(item.name).trim();
    const card=document.createElement('button');card.type='button';card.className='flavor-card flavor-catalog-card reveal visible';card.setAttribute('aria-label',`Ver detalles del sabor ${flavorName}`);
    const media=document.createElement('span');media.className='flavor-card-media';media.style.setProperty('--flavor-focus','50% 50%');media.style.setProperty('--flavor-zoom','1');
    const image=document.createElement('img');image.src=item.image;image.alt=`Helado HELADÍSIMO sabor ${flavorName}`;image.loading='lazy';image.decoding='async';media.appendChild(image);fitFlavorImage(image,media);
    const body=document.createElement('span');body.className='flavor-card-body';
    const natural=document.createElement('small');natural.textContent='100 % natural';
    const title=document.createElement('strong');title.textContent=flavorName;
    const subtitle=document.createElement('span');subtitle.className='flavor-card-subtitle';subtitle.textContent=item.subtitle||'Helado artesanal HELADÍSIMO';
    const action=document.createElement('span');action.className='flavor-card-action';action.textContent='Ver detalles';
    body.append(natural,title,subtitle,action);card.append(media,body);card.addEventListener('click',()=>openFlavor(item,card));grid.appendChild(card);
    return card;
  });

  const mobileCatalog=window.matchMedia('(max-width: 720px)');
  let expanded=false;
  function updateCatalog(){
    const condensed=mobileCatalog.matches&&cards.length>6&&!expanded;
    cards.forEach((card,index)=>{card.hidden=condensed&&index>=6});
    toggle.hidden=!mobileCatalog.matches||cards.length<=6;
    toggle.setAttribute('aria-expanded',String(!condensed));
    toggle.textContent=condensed?`Ver todos los sabores (${cards.length})`:'Mostrar menos sabores';
  }
  toggle.onclick=()=>{
    const wasExpanded=expanded;
    expanded=!expanded;
    updateCatalog();
    if(wasExpanded)document.querySelector('#sabores .section-heading')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  };
  if(typeof mobileCatalog.addEventListener==='function')mobileCatalog.addEventListener('change',updateCatalog);else mobileCatalog.addListener(updateCatalog);
  updateCatalog();

  dialog.querySelector('.flavor-dialog-close').onclick=closeDialog;
  dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog()});
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog()});
}

function configureStores(content){
  const grid=document.querySelector('#store-grid');if(!grid)return;grid.innerHTML='';
  const stores=content.stores||[];
  if(!stores.length){
    const empty=document.createElement('div');empty.className='store-empty reveal visible';
    const label=document.createElement('span');label.textContent='Próximamente';
    const title=document.createElement('h3');title.textContent='Estamos sumando nuevos Puntos Aliados';
    const text=document.createElement('p');text.textContent='Escríbenos para conocer el punto de venta más cercano o para agregar tu negocio a nuestra red.';
    empty.append(label,title,text);grid.appendChild(empty);
  }
  stores.forEach(store=>{
    const card=document.createElement('article');card.className='store-card reveal visible';
    const channel=document.createElement('span');channel.className='store-channel';channel.textContent=store.channel||'Punto Aliado';
    const title=document.createElement('h3');title.textContent=store.name||'Punto Aliado HELADÍSIMO';
    const address=document.createElement('p');address.textContent=store.address||'';card.append(channel,title,address);
    const actions=document.createElement('div');actions.className='store-actions';
    if(store.mapUrl){const map=document.createElement('a');map.href=store.mapUrl;map.target='_blank';map.rel='noopener';map.textContent='Ver en el mapa';actions.appendChild(map)}
    if(store.whatsapp||store.phone){const number=String(store.whatsapp||store.phone).replace(/\D/g,'');const contact=document.createElement('a');contact.href=store.whatsapp?`https://wa.me/${number}`:`tel:${store.phone}`;contact.target=store.whatsapp?'_blank':'_self';contact.rel='noopener';contact.textContent=store.phone||store.whatsapp;actions.appendChild(contact)}
    card.appendChild(actions);grid.appendChild(card);
  });
  const orderNumber=String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'');
  document.querySelectorAll('[data-order-whatsapp]').forEach(link=>link.href=`https://wa.me/${orderNumber}?text=${encodeURIComponent('Hola HELADÍSIMO, quiero realizar un pedido.')}`);
  const officeAddress=content.office?.address||'';document.querySelectorAll('[data-office-map]').forEach(link=>link.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`);
}

function configureAssorted(content){
  const section=document.querySelector('.assorted-boxes');
  const grid=document.querySelector('#assorted-grid');
  const shortcuts=document.querySelector('#assorted-shortcuts');
  if(!section||!grid)return;
  const boxes=content.assortedBoxes||[];
  section.hidden=!boxes.length;grid.innerHTML='';if(shortcuts)shortcuts.innerHTML='';
  boxes.forEach((box,index)=>{
    const card=document.createElement('article');card.className='assorted-card reveal visible';card.id=`assorted-box-${index+1}`;card.tabIndex=-1;
    const media=document.createElement('div');media.className='assorted-card-media';
    const image=document.createElement('img');image.src=box.image;image.alt=`Docena surtida HELADÍSIMO: ${box.name}`;image.loading='lazy';image.decoding='async';media.appendChild(image);
    const body=document.createElement('div');body.className='assorted-card-body';
    const badge=document.createElement('span');badge.className='assorted-card-badge';badge.textContent=box.badge||'12 helados · 3 sabores';
    const title=document.createElement('h3');title.textContent=box.name||'Docena surtida';
    const flavors=document.createElement('p');flavors.textContent=box.flavors||'';
    body.append(badge,title,flavors);card.append(media,body);grid.appendChild(card);
    if(shortcuts){const shortcut=document.createElement('a');shortcut.href=`#${card.id}`;shortcut.textContent=box.name||`Combinación ${index+1}`;shortcut.addEventListener('click',event=>{event.preventDefault();card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});card.focus({preventScroll:true});history.replaceState(null,'',`#${card.id}`)});shortcuts.appendChild(shortcut)}
  });
  const orderNumber=String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'');
  document.querySelectorAll('[data-assorted-whatsapp]').forEach(link=>link.href=`https://wa.me/${orderNumber}?text=${encodeURIComponent('Hola HELADÍSIMO, quiero pedir una docena surtida de 12 helados.')}`);
}

function configureSeasonal(content){
  const section=document.querySelector('.seasonal-products');const grid=document.querySelector('#seasonal-grid');if(!section||!grid)return;
  const products=content.seasonalProducts||[];section.hidden=!products.length;grid.innerHTML='';
  products.forEach((product,index)=>{
    const card=document.createElement('article');card.className='seasonal-card reveal visible';
    const media=document.createElement('div');media.className='seasonal-media';
    if(product.image){const image=document.createElement('img');image.src=product.image;image.alt=`Helado HELADÍSIMO de temporada sabor ${product.name}`;image.loading='lazy';image.decoding='async';media.appendChild(image)}else{const placeholder=document.createElement('div');placeholder.className='seasonal-placeholder';const icon=document.createElement('span');icon.textContent='🥭';const label=document.createElement('small');label.textContent='Imagen próximamente';placeholder.append(icon,label);media.appendChild(placeholder)}
    const body=document.createElement('div');body.className='seasonal-body';const badge=document.createElement('span');badge.className='seasonal-badge';badge.textContent=product.badge||'Edición de temporada';const title=document.createElement('h3');title.textContent=product.name;const text=document.createElement('p');text.textContent=product.subtitle||'';const link=document.createElement('a');link.className='text-link';link.href=`https://wa.me/${String(content.orders?.whatsapp||content.contact?.whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(`Hola HELADÍSIMO, quiero pedir el sabor de temporada ${product.name}.`)}`;link.target='_blank';link.rel='noopener';link.textContent='Pedir por WhatsApp';body.append(badge,title,text,link);card.append(media,body);grid.appendChild(card);
  });
}

async function loadContent(){
  try{
    const response=await fetch('content.json',{cache:'no-cache'});
    if(!response.ok)throw new Error('No se pudo cargar el contenido');
    const content=await response.json();
    document.querySelectorAll('[data-content]').forEach(element=>{const value=getPath(content,element.dataset.content);if(value!==undefined)element.textContent=value});
    document.querySelectorAll('[data-image]').forEach(image=>{const value=getPath(content,image.dataset.image);if(value)image.src=value});
    configureContact(content);configureSocial(content);configureCarousel(content);configureFlavorCatalog(content);configureAssorted(content);configureStores(content);configureSeasonal(content);
    document.dispatchEvent(new CustomEvent('heladisimo:content-ready'));
  }catch(error){
    console.warn(error);
    const grid=document.querySelector('#flavor-catalog');
    if(grid&&!grid.children.length){const message=document.createElement('p');message.className='flavor-catalog-empty';message.textContent='No pudimos cargar el catálogo en este momento. Intenta recargar la página.';grid.appendChild(message)}
    document.querySelectorAll('.reveal').forEach(element=>element.classList.add('visible'));
  }
}

const menuButton=document.querySelector('.menu-button');
const navLinks=document.querySelector('.nav-links');
function closeMenu(returnFocus=false){
  if(!menuButton||!navLinks)return;
  navLinks.classList.remove('open');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Abrir menú');
  document.body.classList.remove('nav-open');
  if(returnFocus)menuButton.focus();
}
function openMenu(){
  if(!menuButton||!navLinks)return;
  navLinks.classList.add('open');
  menuButton.setAttribute('aria-expanded','true');
  menuButton.setAttribute('aria-label','Cerrar menú');
  document.body.classList.add('nav-open');
  requestAnimationFrame(()=>navLinks.querySelector('a')?.focus());
}
menuButton?.addEventListener('click',()=>navLinks?.classList.contains('open')?closeMenu():openMenu());
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>closeMenu()));
document.addEventListener('keydown',event=>{
  if(!navLinks?.classList.contains('open'))return;
  if(event.key==='Escape'){event.preventDefault();closeMenu(true);return}
  if(event.key!=='Tab')return;
  const focusable=[menuButton,...navLinks.querySelectorAll('a')];
  const first=focusable[0];
  const last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});
document.addEventListener('pointerdown',event=>{
  if(navLinks?.classList.contains('open')&&!navLinks.contains(event.target)&&!menuButton?.contains(event.target))closeMenu();
});
const desktopNav=window.matchMedia('(min-width: 961px)');
const handleNavViewport=()=>{if(desktopNav.matches)closeMenu()};
if(typeof desktopNav.addEventListener==='function')desktopNav.addEventListener('change',handleNavViewport);else desktopNav.addListener(handleNavViewport);

function initializeReveals(){
  const elements=document.querySelectorAll('.reveal:not([data-reveal-ready])');
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){elements.forEach(element=>element.classList.add('visible'));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -24px'});
  elements.forEach(element=>{element.dataset.revealReady='true';observer.observe(element)});
}
initializeReveals();
document.querySelectorAll('[data-current-year]').forEach(element=>{element.textContent=String(new Date().getFullYear())});
loadContent();
