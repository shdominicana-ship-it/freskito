const OWNER='shdominicana-ship-it';
const REPO='freskito';
const BRANCH='main';
const CONTENT_PATH='dist/content.json';
let token='';let content={};let contentSha='';let pendingUploads=new Map();let dirty=false;
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

function getPath(obj,path){return path.split('.').reduce((value,key)=>value?.[key],obj)}
function setPath(obj,path,value){const keys=path.split('.');let current=obj;for(let i=0;i<keys.length-1;i++){const key=keys[i];if(current[key]===undefined)current[key]=/^\d+$/.test(keys[i+1])?[]:{};current=current[key]}current[keys.at(-1)]=value}
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className=`toast show${error?' error':''}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',4200)}
function markDirty(){dirty=true;$('#save-state').textContent='Cambios pendientes de publicar';syncJson()}
function api(path,options={}){return fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}})}
function decodeBase64(value){const bytes=Uint8Array.from(atob(value.replace(/\s/g,'')),char=>char.charCodeAt(0));return new TextDecoder().decode(bytes)}
function encodeBase64(value){const bytes=new TextEncoder().encode(value);let binary='';bytes.forEach(byte=>binary+=String.fromCharCode(byte));return btoa(binary)}
function fileToBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)})}

async function connect(event){
  event.preventDefault();token=$('#token').value.trim();
  const button=event.submitter;button.disabled=true;button.textContent='Conectando…';
  try{
    const [repoResponse,contentResponse]=await Promise.all([api(`/repos/${OWNER}/${REPO}`),api(`/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}?ref=${BRANCH}`)]);
    if(repoResponse.status===401)throw new Error('El token no es válido.');
    if(repoResponse.status===403)throw new Error('El token no tiene permiso para este repositorio.');
    if(!repoResponse.ok||!contentResponse.ok)throw new Error('No se pudo leer el contenido del repositorio.');
    const repo=await repoResponse.json();const file=await contentResponse.json();
    content=JSON.parse(decodeBase64(file.content));contentSha=file.sha;
    $('#connection-user').textContent=repo.full_name;$('#auth-card').classList.add('hidden');$('#editor').classList.remove('hidden');
    buildEditor();toast('Contenido cargado correctamente.');
  }catch(error){toast(error.message,true);token=''}finally{button.disabled=false;button.textContent='Conectar y cargar contenido';$('#token').value=''}
}

function buildEditor(){
  const sections=[['portada','Portada'],['marca','Marca'],['producto','Producto'],['sabores','Sabores'],['temporada','Productos de temporada'],['ventas','Ventas'],['puntos','Puntos de venta'],['contacto','Contacto'],['redes','Redes sociales'],['avanzado','Avanzado']];
  $('#section-nav').innerHTML=sections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('');
  $('#benefit-fields').innerHTML=content.benefits.map((benefit,index)=>`<div class="repeat-card"><h3>Beneficio ${index+1}</h3><label>Título<input data-path="benefits.${index}.title"></label><label>Descripción<textarea rows="4" data-path="benefits.${index}.text"></textarea></label></div>`).join('');
  renderSlideEditors();renderSeasonalEditors();renderStoreEditors();bindContentFields();
  $('#add-slide').onclick=()=>{content.heroSlides=content.heroSlides||[];content.heroSlides.push({name:'Nuevo sabor',subtitle:'Helado artesanal FRESKITO',image:'assets/productos-freskito.jpg',focus:'50% 50%',zoom:1});pendingUploads.clear();renderSlideEditors();markDirty()};
  $('#add-seasonal').onclick=()=>{content.seasonalProducts=content.seasonalProducts||[];content.seasonalProducts.push({name:'Nuevo sabor',subtitle:'Edición artesanal por tiempo limitado.',badge:'Disponible por tiempo limitado',image:''});pendingUploads.clear();renderSeasonalEditors();markDirty()};
  $('#add-store').onclick=()=>{content.stores=content.stores||[];content.stores.push({name:'Nuevo Punto Aliado',channel:'Colmado / Minimarket',address:'',phone:'',whatsapp:'',mapUrl:''});renderStoreEditors();markDirty()};
  $('#preview-hero').src=content.hero.image;$('#preview-logo').src=content.branding.logo;syncJson();
  bindUploadFields();
}

function bindContentFields(scope=document){
  [...scope.querySelectorAll('[data-path]')].forEach(field=>{if(field.dataset.bound)return;field.dataset.bound='true';field.value=getPath(content,field.dataset.path)??'';field.addEventListener('input',()=>{setPath(content,field.dataset.path,field.value);markDirty()})});
}

function renderStoreEditors(){
  const list=$('#store-admin-list');if(!list)return;content.stores=content.stores||[];
  list.innerHTML=content.stores.length?content.stores.map((store,index)=>`<div class="store-admin-card"><h3>Punto de venta ${index+1}</h3><button type="button" class="remove-store" data-remove-store="${index}">Eliminar</button><div class="grid two"><label>Nombre<input data-path="stores.${index}.name"></label><label>Canal de venta<input data-path="stores.${index}.channel" placeholder="Colmado, minimarket, cafetería…"></label></div><label>Dirección<textarea data-path="stores.${index}.address" rows="2"></textarea></label><div class="grid two"><label>Teléfono visible<input data-path="stores.${index}.phone"></label><label>WhatsApp con código de país<input data-path="stores.${index}.whatsapp" inputmode="numeric"></label></div><label>Enlace de Google Maps<input data-path="stores.${index}.mapUrl" type="url" placeholder="https://maps.app.goo.gl/…"></label></div>`).join(''):'<p class="help">Todavía no hay puntos de venta registrados.</p>';
  bindContentFields(list);list.querySelectorAll('[data-remove-store]').forEach(button=>button.onclick=()=>{content.stores.splice(Number(button.dataset.removeStore),1);renderStoreEditors();markDirty()});
}

function bindUploadFields(scope=document){[...scope.querySelectorAll('[data-upload]')].forEach(input=>{if(input.dataset.uploadBound)return;input.dataset.uploadBound='true';input.addEventListener('change',previewUpload)})}

function renderSlideEditors(){
  const list=$('#slide-fields');if(!list)return;content.heroSlides=content.heroSlides||[];
  list.innerHTML=content.heroSlides.length?content.heroSlides.map((slide,index)=>`<div class="slide-admin-card"><h4>Diapositiva ${index+1}</h4><button type="button" class="remove-slide" data-remove-slide="${index}">Eliminar</button><img id="preview-slide-${index}" src="${slide.image}" alt="Vista previa de ${slide.name}"><label>Nombre del sabor<input data-path="heroSlides.${index}.name"></label><label>Frase corta<input data-path="heroSlides.${index}.subtitle"></label><label class="upload">Cambiar fotografía<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="heroSlides.${index}.image" data-preview="preview-slide-${index}"><span>Seleccionar imagen</span><small>JPG, PNG o WebP · máximo 4 MB</small></label></div>`).join(''):'<p class="help">No hay sabores en el carrusel. Pulsa “Agregar sabor” para comenzar.</p>';
  bindContentFields(list);bindUploadFields(list);list.querySelectorAll('[data-remove-slide]').forEach(button=>button.onclick=()=>{content.heroSlides.splice(Number(button.dataset.removeSlide),1);pendingUploads.clear();renderSlideEditors();markDirty()});
}

function renderSeasonalEditors(){
  const list=$('#seasonal-admin-list');if(!list)return;content.seasonalProducts=content.seasonalProducts||[];
  list.innerHTML=content.seasonalProducts.length?content.seasonalProducts.map((product,index)=>`<div class="seasonal-admin-card">${product.image?`<img id="preview-seasonal-${index}" src="${product.image}" alt="Vista previa de ${product.name}">`:`<div id="preview-seasonal-${index}" class="seasonal-admin-placeholder">🥭</div>`}<div class="seasonal-admin-fields"><button type="button" class="remove-seasonal" data-remove-seasonal="${index}">Eliminar</button><label>Nombre<input data-path="seasonalProducts.${index}.name"></label><label>Descripción<textarea data-path="seasonalProducts.${index}.subtitle" rows="2"></textarea></label><label>Distintivo<input data-path="seasonalProducts.${index}.badge"></label><label class="upload">Subir fotografía<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="seasonalProducts.${index}.image" data-preview="preview-seasonal-${index}"><span>Seleccionar imagen</span><small>Horizontal 3:2 · máximo 4 MB</small></label></div></div>`).join(''):'<p class="help">No hay sabores de temporada publicados.</p>';
  bindContentFields(list);bindUploadFields(list);list.querySelectorAll('[data-remove-seasonal]').forEach(button=>button.onclick=()=>{content.seasonalProducts.splice(Number(button.dataset.removeSeasonal),1);pendingUploads.clear();renderSeasonalEditors();markDirty()});
}

function previewUpload(event){
  const file=event.target.files[0];if(!file)return;
  const max=event.target.dataset.upload==='branding.logo'?2:4;
  if(file.size>max*1024*1024){event.target.value='';toast(`La imagen supera el máximo de ${max} MB.`,true);return}
  pendingUploads.set(event.target.dataset.upload,file);
  const previewId=event.target.dataset.preview||(event.target.dataset.upload==='hero.image'?'preview-hero':'preview-logo');
  let preview=document.getElementById(previewId);const previewUrl=URL.createObjectURL(file);if(preview.tagName==='IMG'){preview.src=previewUrl}else{const image=document.createElement('img');image.id=previewId;image.src=previewUrl;image.alt='Vista previa de la imagen';preview.replaceWith(image)}markDirty();
}

function syncJson(){if($('#json-editor'))$('#json-editor').value=JSON.stringify(content,null,2)}
function applyJson(){try{content=JSON.parse($('#json-editor').value);$$('[data-path]').forEach(field=>field.value=getPath(content,field.dataset.path)??'');markDirty();toast('JSON aplicado al formulario.')}catch(error){toast('El JSON contiene un error de formato.',true)}}

async function putFile(path,base64,message,sha){
  const payload={message,content:base64,branch:BRANCH};if(sha)payload.sha=sha;
  const response=await api(`/repos/${OWNER}/${REPO}/contents/${path}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!response.ok){const details=await response.json().catch(()=>({}));throw new Error(details.message||`No se pudo publicar ${path}`)}
  return response.json();
}

async function publish(event){
  event.preventDefault();const buttons=$$('button[type="submit"]');buttons.forEach(button=>{button.disabled=true;button.textContent='Publicando…'});$('#save-state').textContent='Subiendo cambios…';
  try{
    for(const [slot,file] of pendingUploads){
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
      const name=slot==='hero.image'?'imagen-principal':slot==='branding.logo'?'logo':slot.startsWith('seasonalProducts.')?`temporada-${Number(slot.split('.')[1])+1}`:`sabor-${Number(slot.split('.')[1])+1}`;const path=`dist/assets/${name}-${Date.now()}.${ext}`;
      await putFile(path,await fileToBase64(file),`Actualizar ${name} de FRESKITO`);setPath(content,slot,path.replace('dist/',''));if(slot.startsWith('heroSlides.')){const slideIndex=Number(slot.split('.')[1]);content.heroSlides[slideIndex].zoom=1;content.heroSlides[slideIndex].focus='50% 50%'}
    }
    const latest=await api(`/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}?ref=${BRANCH}`);if(latest.ok)contentSha=(await latest.json()).sha;
    const result=await putFile(CONTENT_PATH,encodeBase64(`${JSON.stringify(content,null,2)}\n`),'Actualizar contenido del sitio FRESKITO',contentSha);
    contentSha=result.content.sha;pendingUploads.clear();dirty=false;$('#save-state').textContent='Publicado · GitHub está desplegando la actualización';syncJson();toast('Cambios publicados. La web se actualizará en aproximadamente un minuto.');
  }catch(error){$('#save-state').textContent='No se pudo publicar';toast(error.message,true)}finally{buttons.forEach(button=>{button.disabled=false;button.textContent='Publicar cambios'})}
}

$('#auth-form').addEventListener('submit',connect);
$('#content-form').addEventListener('submit',publish);
$('#apply-json').addEventListener('click',applyJson);
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=''}});
