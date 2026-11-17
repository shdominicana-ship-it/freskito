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
  const sections=[['portada','Portada'],['marca','Marca'],['producto','Producto'],['sabores','Sabores'],['ventas','Ventas'],['puntos','Puntos de venta'],['contacto','Contacto'],['redes','Redes sociales'],['avanzado','Avanzado']];
  $('#section-nav').innerHTML=sections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('');
  $('#benefit-fields').innerHTML=content.benefits.map((benefit,index)=>`<div class="repeat-card"><h3>Beneficio ${index+1}</h3><label>Título<input data-path="benefits.${index}.title"></label><label>Descripción<textarea rows="4" data-path="benefits.${index}.text"></textarea></label></div>`).join('');
  $('#slide-fields').innerHTML=(content.heroSlides||[]).map((slide,index)=>`<div class="slide-admin-card"><img id="preview-slide-${index}" src="${slide.image}" alt="Vista previa de ${slide.name}"><label>Nombre del sabor<input data-path="heroSlides.${index}.name"></label><label>Frase corta<input data-path="heroSlides.${index}.subtitle"></label><label class="upload">Cambiar fotografía<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="heroSlides.${index}.image" data-preview="preview-slide-${index}"><span>Seleccionar imagen</span><small>JPG, PNG o WebP · máximo 4 MB</small></label></div>`).join('');
  renderStoreEditors();bindContentFields();
  $('#add-store').onclick=()=>{content.stores=content.stores||[];content.stores.push({name:'Nuevo Punto Aliado',channel:'Colmado / Minimarket',address:'',phone:'',whatsapp:'',mapUrl:''});renderStoreEditors();markDirty()};
  $('#preview-hero').src=content.hero.image;$('#preview-logo').src=content.branding.logo;syncJson();
  $$('[data-upload]').forEach(input=>input.addEventListener('change',previewUpload));
}

function bindContentFields(scope=document){
  [...scope.querySelectorAll('[data-path]')].forEach(field=>{if(field.dataset.bound)return;field.dataset.bound='true';field.value=getPath(content,field.dataset.path)??'';field.addEventListener('input',()=>{setPath(content,field.dataset.path,field.value);markDirty()})});
}

function renderStoreEditors(){
  const list=$('#store-admin-list');if(!list)return;content.stores=content.stores||[];
  list.innerHTML=content.stores.length?content.stores.map((store,index)=>`<div class="store-admin-card"><h3>Punto de venta ${index+1}</h3><button type="button" class="remove-store" data-remove-store="${index}">Eliminar</button><div class="grid two"><label>Nombre<input data-path="stores.${index}.name"></label><label>Canal de venta<input data-path="stores.${index}.channel" placeholder="Colmado, minimarket, cafetería…"></label></div><label>Dirección<textarea data-path="stores.${index}.address" rows="2"></textarea></label><div class="grid two"><label>Teléfono visible<input data-path="stores.${index}.phone"></label><label>WhatsApp con código de país<input data-path="stores.${index}.whatsapp" inputmode="numeric"></label></div><label>Enlace de Google Maps<input data-path="stores.${index}.mapUrl" type="url" placeholder="https://maps.app.goo.gl/…"></label></div>`).join(''):'<p class="help">Todavía no hay puntos de venta registrados.</p>';
  bindContentFields(list);list.querySelectorAll('[data-remove-store]').forEach(button=>button.onclick=()=>{content.stores.splice(Number(button.dataset.removeStore),1);renderStoreEditors();markDirty()});
}

function previewUpload(event){
  const file=event.target.files[0];if(!file)return;
  const max=event.target.dataset.upload==='branding.logo'?2:4;
  if(file.size>max*1024*1024){event.target.value='';toast(`La imagen supera el máximo de ${max} MB.`,true);return}
  pendingUploads.set(event.target.dataset.upload,file);
  const previewId=event.target.dataset.preview||(event.target.dataset.upload==='hero.image'?'preview-hero':'preview-logo');
  document.getElementById(previewId).src=URL.createObjectURL(file);markDirty();
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
      const name=slot==='hero.image'?'imagen-principal':slot==='branding.logo'?'logo':`sabor-${Number(slot.split('.')[1])+1}`;const path=`dist/assets/${name}-${Date.now()}.${ext}`;
      await putFile(path,await fileToBase64(file),`Actualizar ${name} de FRESKITO`);setPath(content,slot,path.replace('dist/',''));
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
