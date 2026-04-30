/* =============================================
   DOCKSIM — script.js
============================================= */
'use strict';

/* ============================================================
   DATOS BITAS
============================================================ */
const MUELLE_METROS_TOTAL = 616.07;
const SEPARACION_MIN_M    = 15;
const MARGEN_BORDE_M      = 3.75;

const BITAS = [
  {num:212,pos:3.750,  cap:250},{num:211,pos:33.230, cap:150},
  {num:210,pos:62.710, cap:150},{num:209,pos:95.490, cap:150},
  {num:208,pos:124.970,cap:150},{num:207,pos:154.450,cap:150},
  {num:206,pos:187.230,cap:150},{num:205,pos:216.710,cap:150},
  {num:204,pos:246.190,cap:150},{num:203,pos:278.970,cap:150},
  {num:202,pos:308.450,cap:150},{num:201,pos:337.930,cap:250},
  {num:2,  pos:349.310,cap:55 },{num:3,  pos:381.850,cap:250},
  {num:4,  pos:414.990,cap:250},{num:5,  pos:448.130,cap:55 },
  {num:6,  pos:481.270,cap:55 },{num:7,  pos:514.410,cap:55 },
  {num:8,  pos:547.550,cap:55 },{num:9,  pos:580.690,cap:55 },
  {num:10, pos:613.820,cap:55 },
];

const TRAMOS = [
  {desde:'Borde',hasta:212,dist:3.50 },{desde:212,hasta:211,dist:28.98},
  {desde:211,hasta:210,dist:28.98},{desde:210,hasta:209,dist:32.28},
  {desde:209,hasta:208,dist:28.98},{desde:208,hasta:207,dist:28.98},
  {desde:207,hasta:206,dist:32.28},{desde:206,hasta:205,dist:28.98},
  {desde:205,hasta:204,dist:28.98},{desde:204,hasta:203,dist:32.28},
  {desde:203,hasta:202,dist:28.98},{desde:202,hasta:201,dist:28.98},
  {desde:201,hasta:2,  dist:10.88},{desde:2,  hasta:3,  dist:32.04},
  {desde:3,  hasta:4,  dist:32.64},{desde:4,  hasta:5,  dist:32.64},
  {desde:5,  hasta:6,  dist:32.64},{desde:6,  hasta:7,  dist:32.64},
  {desde:7,  hasta:8,  dist:32.64},{desde:8,  hasta:9,  dist:32.64},
  {desde:9,  hasta:10, dist:32.63},{desde:10, hasta:'Borde',dist:2.00},
];

const PALETTE = [
  '#e85555','#e87030','#d4a020','#3aaa5a',
  '#1fa8d0','#2878e8','#7050e0','#d04090',
  '#00b8a0','#e88010','#4060e0','#20b060'
];

/* ============================================================
   ESTADO
============================================================ */
let buques = [], cabos = [];
let idCounter = 0, caboCounter = 0;

const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));

function getEscala() { return $('#zonaBuques').clientWidth / MUELLE_METROS_TOTAL; }

function mangaPorDefecto(metros) {
  metros = parseFloat(metros)||0;
  if (metros <= 120) return 25;
  if (metros <= 200) return 30;
  return 35;
}

/* ============================================================
   BITAS — render
============================================================ */
function generarBitas() {
  const cont = $('#bitasContenedor');
  if (!cont) return;
  cont.innerHTML = '';
  const escala = getEscala();
  BITAS.forEach(b => {
    const cls = b.cap===250?'bita-250':b.cap===150?'bita-150':'bita-55';
    const div = document.createElement('div');
    div.className = `bita ${cls}`;
    div.dataset.num = String(b.num);
    div.dataset.pos = String(b.pos);
    div.dataset.cap = String(b.cap);
    div.style.left  = (b.pos * escala) + 'px';
    div.innerHTML = `<div class="bita-palo"></div><div class="bita-cabeza"></div><div class="bita-label">${b.num}</div>`;
    // Hover → panel info flotante
    div.addEventListener('mouseenter', () => mostrarInfoBita(b));
    div.addEventListener('mouseleave', () => ocultarInfoPanel());
    cont.appendChild(div);
  });
}

function calcularBitas(obj) {
  const inicioPx = parseFloat(obj.el.style.left);
  const finPx    = inicioPx + obj.el.offsetWidth;
  const domB     = $$('.bita').map(b=>({num:b.dataset.num, x:b.offsetLeft}));
  let desde='–', hasta='–';
  for (let i=0;i<domB.length;i++) { if(domB[i].x>=inicioPx){desde=domB[i].num;break;} }
  for (let i=domB.length-1;i>=0;i--) { if(domB[i].x<=finPx){hasta=domB[i].num;break;} }
  obj.bitaDesde=desde; obj.bitaHasta=hasta;
}

/* ============================================================
   PANEL INFO FLOTANTE — buques y bitas
============================================================ */
const panelIF    = $('#panelInfoFlotante');
const pifTitulo  = $('#pifTitulo');
const pifIcon    = $('#pifIcon');
const pifBody    = $('#pifBody');
let   pifTimer   = null;

function mostrarInfoBuque(obj) {
  clearTimeout(pifTimer);
  pifIcon.textContent  = '🚢';
  pifTitulo.textContent = obj.nombre;

  const misCabos = cabos.filter(c => c.buqueId === obj.id);
  const cabosStr = misCabos.length === 0
    ? 'Sin cabos'
    : misCabos.map(c => {
        const zona = c.pctX < 0.3
          ? (obj.orientacion==='babor'?'Popa':'Proa')
          : c.pctX > 0.7 ? (obj.orientacion==='babor'?'Proa':'Popa') : 'Centro';
        return `${zona} → Bita ${c.bitaNum}`;
      }).join('<br>');

  pifBody.innerHTML = `
    <div class="pif-row"><span class="pif-label">Eslora</span><span class="pif-value">${obj.metros} m</span></div>
    <div class="pif-row"><span class="pif-label">Manga</span><span class="pif-value">${obj.manga} m</span></div>
    <div class="pif-row"><span class="pif-label">Banda</span><span class="pif-value">${obj.orientacion.charAt(0).toUpperCase()+obj.orientacion.slice(1)}</span></div>
    <div class="pif-row"><span class="pif-label">Bitas</span><span class="pif-value highlight">${obj.bitaDesde} → ${obj.bitaHasta}</span></div>
    <div class="pif-row"><span class="pif-label">Estado</span><span class="pif-value ${obj.locked?'warn':''}">${obj.locked?'🔒 Bloqueado':'🔓 Libre'}</span></div>
    <div class="pif-divider"></div>
    <div class="pif-row"><span class="pif-label">Cabos</span><span class="pif-value" style="font-size:10px;line-height:1.5">${cabosStr}</span></div>
    <div class="pif-hint">Doble clic para editar · Ctrl+clic para amarrar</div>
  `;
  panelIF.classList.add('visible');
}

function mostrarInfoBita(b) {
  clearTimeout(pifTimer);
  const tipo = b.cap===250 ? 'Reforzada' : b.cap===150 ? 'Estándar' : 'Liviana';
  const color = b.cap===250 ? '#a02020' : b.cap===150 ? '#555' : '#999';

  // Distancia al siguiente
  const idx = TRAMOS.findIndex(t => t.desde === b.num);
  const distSig = idx >= 0 && TRAMOS[idx+1] ? TRAMOS[idx].dist + ' m → ' + TRAMOS[idx+1].dist + ' m' : '—';

  // Cabos amarrados a esta bita
  const cabosBita = cabos.filter(c => c.bitaNum === b.num);
  const cabosBitaStr = cabosBita.length === 0
    ? 'Sin cabos'
    : cabosBita.map(c => {
        const buq = buques.find(b2=>b2.id===c.buqueId);
        return buq ? buq.nombre : '?';
      }).join(', ');

  pifIcon.textContent   = '⚓';
  pifTitulo.textContent = `Bita ${b.num}`;
  pifBody.innerHTML = `
    <div class="pif-row"><span class="pif-label">Posición</span><span class="pif-value">${b.pos.toFixed(2)} m</span></div>
    <div class="pif-row"><span class="pif-label">Tipo</span><span class="pif-value" style="color:${color}">${tipo}</span></div>
    <div class="pif-row"><span class="pif-label">Capacidad</span><span class="pif-value" style="color:${color}">${b.cap} t</span></div>
    <div class="pif-divider"></div>
    <div class="pif-row"><span class="pif-label">Cabos</span><span class="pif-value" style="font-size:10px">${cabosBitaStr}</span></div>
  `;
  panelIF.classList.add('visible');
}

function ocultarInfoPanel() {
  pifTimer = setTimeout(() => panelIF.classList.remove('visible'), 120);
}

// Mantener panel visible al hacer hover sobre él mismo
panelIF.addEventListener('mouseenter', () => clearTimeout(pifTimer));
panelIF.addEventListener('mouseleave', ocultarInfoPanel);

/* ============================================================
   PANEL INFO BITAS (modal con tabla completa)
============================================================ */
function buildTablaInfoBitas() {
  const tbody = $('#tablaInfoBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const distSig = {};
  for (let i=0;i<TRAMOS.length-1;i++) {
    if(TRAMOS[i].hasta!=='Borde') distSig[TRAMOS[i].hasta]=TRAMOS[i+1].dist;
  }
  BITAS.forEach(b => {
    const cls = b.cap===250?'250':b.cap===150?'150':'55';
    const sig = distSig[b.num]!==undefined ? distSig[b.num].toFixed(2)+' m' : '—';
    const tr  = document.createElement('tr');
    tr.innerHTML = `<td class="bita-num-cell bita-num-${cls}">${b.num}</td><td>${b.pos.toFixed(3)} m</td><td>${sig}</td><td><span class="cap-badge cap-${cls}">${b.cap} t</span></td>`;
    tbody.appendChild(tr);
  });
}

(function initPanelInfoModal() {
  const btn=$('#btnInfoBitas'),panel=$('#panelInfoBitas'),overlay=$('#overlayInfo'),close=$('#closeInfoBitas');
  buildTablaInfoBitas();
  function abrir(){overlay.style.display='block';panel.style.display='block';requestAnimationFrame(()=>{overlay.classList.add('visible');panel.classList.add('visible');});}
  function cerrar(){overlay.classList.remove('visible');panel.classList.remove('visible');setTimeout(()=>{overlay.style.display='none';panel.style.display='none';},240);}
  btn?.addEventListener('click',abrir);
  close?.addEventListener('click',cerrar);
  overlay?.addEventListener('click',cerrar);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('visible'))cerrar();});
})();

/* ============================================================
   COLORES
============================================================ */
function randomPastel(){return hslToHex(Math.floor(Math.random()*360),62+Math.random()*18,48+Math.random()*14);}
function hslToHex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));const hex=x=>Math.round(255*x).toString(16).padStart(2,'0');return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;}
function darken(hex,amt){const r=Math.max(0,parseInt(hex.slice(1,3),16)-amt),g=Math.max(0,parseInt(hex.slice(3,5),16)-amt),b=Math.max(0,parseInt(hex.slice(5,7),16)-amt);return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;}

/* ============================================================
   COLISIONES
============================================================ */
function hayColision(x,ancho,excluirId){
  const sep=SEPARACION_MIN_M*getEscala();
  for(const b of buques){
    if(b.id===excluirId)continue;
    const bx=parseFloat(b.el.style.left),bw=b.el.offsetWidth;
    if(x<bx+bw+sep&&x+ancho+sep>bx)return true;
  }
  return false;
}
function encontrarHueco(metros){
  const escala=getEscala(),anchoPx=metros*escala,margenPx=MARGEN_BORDE_M*escala,totalW=$('#zonaBuques').clientWidth;
  for(let c=margenPx;c<=totalW-margenPx-anchoPx;c+=2){if(!hayColision(c,anchoPx,null))return c;}
  return null;
}

/* ============================================================
   HTML BUQUE
============================================================ */
function buildCasillas(){
  const cs=['rgba(0,0,0,.22)','rgba(0,0,0,.14)','rgba(255,255,255,.13)','rgba(0,0,0,.18)','rgba(255,255,255,.07)','rgba(0,0,0,.20)'];
  return cs.map(c=>`<div class="casilla" style="background:${c}"></div>`).join('');
}
function buqueHTML(info){
  const grad=`linear-gradient(160deg,${info.color} 0%,${darken(info.color,22)} 100%)`;
  return `
    <div class="buque-casco" style="background:${grad}">
      <div class="buque-casilleria">${buildCasillas()}</div>
      <div class="buque-puente"><div class="buque-puente-ventana"></div></div>
      <div class="buque-cubierta-linea"></div>
      <div class="buque-texto">
        <div class="buque-nombre">${info.nombre}</div>
        <div class="buque-metros">${info.metros}m · ${info.manga}m manga</div>
      </div>
    </div>
    <div class="lock-badge">🔒</div>
    <div class="panel-cabos-buque" id="pcb-${info.id}">
      <div class="pcb-header"><span>⚓ Cabos</span><button class="pcb-toggle" data-id="${info.id}">▼</button></div>
      <div class="pcb-body" id="pcb-body-${info.id}">
        <div class="pcb-empty" id="pcb-empty-${info.id}">Sin cabos</div>
      </div>
    </div>`;
}
function crearBuqueEl(info){
  const escala=getEscala(),anchoPx=info.metros*escala,altoPx=Math.max(30,Math.round(info.manga*escala));
  const el=document.createElement('div');
  el.className=`buque${info.orientacion==='babor'?' babor':''} entrando`;
  el.style.width=anchoPx+'px'; el.style.height=altoPx+'px'; el.style.left=info.x+'px';
  el.dataset.id=info.id;
  el.innerHTML=buqueHTML(info);
  el.addEventListener('animationend',()=>el.classList.remove('entrando'),{once:true});
  return el;
}

/* ============================================================
   AGREGAR BUQUE
============================================================ */
function agregarBuque(nombre,metros,manga,color,orientacion){
  metros=parseFloat(metros); manga=parseFloat(manga);
  if(!nombre||isNaN(metros)||metros<70||isNaN(manga)||manga<8){mostrarToast('⚠ Datos inválidos');return false;}
  const xPx=encontrarHueco(metros);
  if(xPx===null){mostrarToast('⚠ No hay espacio libre en el muelle');return false;}
  const id=++idCounter;
  const info={id,nombre:nombre.toUpperCase(),metros,manga,color,orientacion,x:xPx};
  const el=crearBuqueEl(info);
  const obj={id,nombre:info.nombre,metros,manga,color,orientacion,locked:false,el,bitaDesde:'–',bitaHasta:'–',leftM:xPx/getEscala()};
  buques.push(obj);
  $('#zonaBuques').appendChild(el);
  calcularBitas(obj);
  iniciarDrag(obj);
  iniciarHoverInfo(obj);
  iniciarPanelCabos(obj);
  actualizarTabla();
  guardarEstado();
  mostrarToast(`✓ ${info.nombre} agregado`);
  return true;
}

/* ============================================================
   PERSISTENCIA
============================================================ */
function guardarEstado(){
  localStorage.setItem('docksim_buques',JSON.stringify(buques.map(b=>({id:b.id,nombre:b.nombre,metros:b.metros,manga:b.manga,color:b.color,orientacion:b.orientacion,locked:b.locked,leftM:b.leftM}))));
  localStorage.setItem('docksim_cabos', JSON.stringify(cabos.map(c=>({id:c.id,buqueId:c.buqueId,pctX:c.pctX,pctY:c.pctY,bitaNum:c.bitaNum}))));
  localStorage.setItem('docksim_counter',String(idCounter));
  localStorage.setItem('docksim_cabo_counter',String(caboCounter));
}
function cargarEstado(){
  try{
    const raw=localStorage.getItem('docksim_buques'),cnt=localStorage.getItem('docksim_counter');
    if(!raw){actualizarTabla();return;}
    const data=JSON.parse(raw);
    if(cnt)idCounter=parseInt(cnt);
    data.forEach(d=>{
      const escala=getEscala(),altoPx=Math.max(30,Math.round((d.manga||35)*escala)),xPx=(d.leftM||0)*escala;
      const info={...d,manga:d.manga||35,x:xPx};
      const el=crearBuqueEl(info); el.style.height=altoPx+'px';
      const obj={...info,el,bitaDesde:'–',bitaHasta:'–'};
      buques.push(obj);
      $('#zonaBuques').appendChild(el);
      calcularBitas(obj); iniciarDrag(obj); iniciarHoverInfo(obj); iniciarPanelCabos(obj);
      if(obj.locked)obj.el.classList.add('locked');
    });
    const rawC=localStorage.getItem('docksim_cabos'),cntC=localStorage.getItem('docksim_cabo_counter');
    if(rawC){const cd=JSON.parse(rawC);if(cntC)caboCounter=parseInt(cntC);cd.forEach(c=>{const o=buques.find(b=>b.id===c.buqueId);if(o)crearCabo(o,c.pctX,c.pctY,c.bitaNum,c.id);});}
    actualizarTabla();
  }catch(e){console.warn('Error:',e);actualizarTabla();}
}

/* ============================================================
   DRAG
============================================================ */
function iniciarDrag(obj){
  const el=obj.el;
  let arras=false,startX=0,startL=0;

  el.addEventListener('mousedown',e=>{
    if(e.ctrlKey)return;
    if(e.target.closest('.lock-badge,.panel-cabos-buque'))return;
    if(obj.locked)return;
    e.preventDefault(); arras=true; startX=e.clientX; startL=parseFloat(el.style.left);
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp,{once:true});
  });
  el.addEventListener('touchstart',e=>{
    if(obj.locked)return; e.preventDefault();
    arras=true; startX=e.touches[0].clientX; startL=parseFloat(el.style.left);
    document.addEventListener('touchmove',onMoveT,{passive:false});
    document.addEventListener('touchend',onUp,{once:true});
  },{passive:false});

  function mover(cx){
    if(!arras)return;
    const escala=getEscala(),margenPx=MARGEN_BORDE_M*escala,zona=$('#zonaBuques');
    let newX=Math.max(margenPx,Math.min(startL+(cx-startX),zona.clientWidth-margenPx-el.offsetWidth));
    if(!hayColision(newX,el.offsetWidth,obj.id)){
      el.style.left=newX+'px'; obj.leftM=newX/escala;
      calcularBitas(obj); actualizarCabosBuque(obj); actualizarTabla();
    }
  }
  const onMove=e=>mover(e.clientX);
  const onMoveT=e=>{e.preventDefault();mover(e.touches[0].clientX);};
  function onUp(){arras=false;document.removeEventListener('mousemove',onMove);document.removeEventListener('touchmove',onMoveT);calcularBitas(obj);actualizarTabla();guardarEstado();}

  el.addEventListener('dblclick',e=>{if(e.ctrlKey)return;e.stopPropagation();abrirModalEditar(obj);});
  el.addEventListener('click',e=>{if(!e.ctrlKey)return;e.preventDefault();e.stopPropagation();iniciarModoAmarre(obj,e);});
}

/* ============================================================
   HOVER INFO (buques)
============================================================ */
function iniciarHoverInfo(obj){
  const el=obj.el;
  el.addEventListener('mouseenter',()=>{ clearTimeout(pifTimer); mostrarInfoBuque(obj); });
  el.addEventListener('mouseleave',ocultarInfoPanel);
}

/* ============================================================
   MODO CTRL
============================================================ */
document.addEventListener('keydown',e=>{if(e.key==='Control')document.body.classList.add('ctrl-mode');});
document.addEventListener('keyup',  e=>{if(e.key==='Control')document.body.classList.remove('ctrl-mode');});

/* ============================================================
   SISTEMA DE CABOS (SVG)
============================================================ */
const svgCabos=$('#svgCabos');

function getSVGRef(){return $('#svgCabos').getBoundingClientRect();}
function getBitaPos(bitaNum){
  const bitaEl=$(`.bita[data-num="${bitaNum}"]`);
  if(!bitaEl)return null;
  const svgR=getSVGRef(),cabEl=bitaEl.querySelector('.bita-cabeza'),ref=cabEl||bitaEl,refR=ref.getBoundingClientRect();
  return{x:refR.left-svgR.left+refR.width/2,y:refR.top-svgR.top+refR.height/2};
}
function getPuntoPos(obj,pctX,pctY){
  const svgR=getSVGRef(),elR=obj.el.getBoundingClientRect();
  return{x:elR.left-svgR.left+pctX*elR.width,y:elR.top-svgR.top+pctY*elR.height};
}

function crearCabo(obj,pctX,pctY,bitaNum,idForzado){
  const id=idForzado!==undefined?idForzado:++caboCounter;
  const punto=document.createElement('div');
  punto.className='punto-amarre'; punto.dataset.id=id;
  punto.style.left=(pctX*100)+'%'; punto.style.top=(pctY*100)+'%';
  obj.el.appendChild(punto);
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  line.classList.add('cabo-linea'); line.dataset.id=id;
  svgCabos.appendChild(line);
  const cabo={id,buqueId:obj.id,pctX,pctY,bitaNum,puntoEl:punto,lineaEl:line};
  cabos.push(cabo);
  actualizarLineaCabo(cabo,obj);
  line.addEventListener('dblclick',()=>eliminarCabo(id));
  punto.addEventListener('dblclick',e=>{e.stopPropagation();eliminarCabo(id);});
  actualizarPanelCabosBuque(obj);
  actualizarTabla();
  return cabo;
}

function actualizarLineaCabo(cabo,obj){
  if(!obj)obj=buques.find(b=>b.id===cabo.buqueId);
  if(!obj)return;
  const p1=getPuntoPos(obj,cabo.pctX,cabo.pctY),p2=getBitaPos(cabo.bitaNum);
  if(!p1||!p2)return;
  cabo.lineaEl.setAttribute('x1',p1.x); cabo.lineaEl.setAttribute('y1',p1.y);
  cabo.lineaEl.setAttribute('x2',p2.x); cabo.lineaEl.setAttribute('y2',p2.y);
}
function actualizarCabosBuque(obj){cabos.filter(c=>c.buqueId===obj.id).forEach(c=>actualizarLineaCabo(c,obj));}

function eliminarCabo(caboId){
  const idx=cabos.findIndex(c=>c.id===caboId);
  if(idx===-1)return;
  const cabo=cabos[idx];
  cabo.puntoEl.remove(); cabo.lineaEl.remove(); cabos.splice(idx,1);
  const obj=buques.find(b=>b.id===cabo.buqueId);
  if(obj)actualizarPanelCabosBuque(obj);
  actualizarTabla(); guardarEstado();
}

/* Modo amarre */
let amarreEnCurso=null;
function iniciarModoAmarre(obj,e){
  if(amarreEnCurso)cancelarAmarre();
  const elR=obj.el.getBoundingClientRect();
  const pctX=(e.clientX-elR.left)/elR.width,pctY=(e.clientY-elR.top)/elR.height;
  const lp=document.createElementNS('http://www.w3.org/2000/svg','line');
  lp.classList.add('cabo-preview'); svgCabos.appendChild(lp);
  const svgR=getSVGRef(),p1x=e.clientX-svgR.left,p1y=e.clientY-svgR.top;
  lp.setAttribute('x1',p1x); lp.setAttribute('y1',p1y); lp.setAttribute('x2',p1x); lp.setAttribute('y2',p1y);
  amarreEnCurso={obj,pctX,pctY,lineaPreview:lp};
  document.body.classList.add('amarre-activo');
  mostrarToast('🎯 Clic en una bita para amarrar · ESC cancela');
  document.addEventListener('mousemove',onPreviewMove);
  document.addEventListener('click',onBitaClick,{capture:true});
  document.addEventListener('keydown',onEscAmarre);
}
function onPreviewMove(e){
  if(!amarreEnCurso)return;
  const svgR=getSVGRef();
  amarreEnCurso.lineaPreview.setAttribute('x2',e.clientX-svgR.left);
  amarreEnCurso.lineaPreview.setAttribute('y2',e.clientY-svgR.top);
}
function onBitaClick(e){
  if(!amarreEnCurso)return;
  const bitaEl=e.target.closest('.bita');
  if(!bitaEl)return;
  e.stopPropagation(); e.preventDefault();
  const{obj,pctX,pctY}=amarreEnCurso;
  const bitaNum=parseInt(bitaEl.dataset.num);
  cancelarAmarre();
  crearCabo(obj,pctX,pctY,bitaNum);
  guardarEstado();
  mostrarToast(`✓ Cabo → Bita ${bitaNum}`);
}
function onEscAmarre(e){if(e.key==='Escape')cancelarAmarre();}
function cancelarAmarre(){
  if(!amarreEnCurso)return;
  amarreEnCurso.lineaPreview.remove();
  document.body.classList.remove('amarre-activo');
  document.removeEventListener('mousemove',onPreviewMove);
  document.removeEventListener('click',onBitaClick,{capture:true});
  document.removeEventListener('keydown',onEscAmarre);
  amarreEnCurso=null;
}

/* ============================================================
   PANEL CABOS EN EL BUQUE (div interno)
============================================================ */
function iniciarPanelCabos(obj){
  obj.el.addEventListener('click',e=>{
    const btn=e.target.closest('.pcb-toggle');
    if(!btn)return; e.stopPropagation();
    const body=$(`#pcb-body-${obj.id}`);
    if(!body)return;
    const col=body.style.display==='none';
    body.style.display=col?'':'none';
    btn.textContent=col?'▼':'▲';
  });
  obj.el.addEventListener('click',e=>{
    const btn=e.target.closest('.pcb-cabo-eliminar');
    if(!btn)return; e.stopPropagation();
    eliminarCabo(parseInt(btn.dataset.cabo));
  });
}
function actualizarPanelCabosBuque(obj){
  const panel=$(`#pcb-${obj.id}`),body=$(`#pcb-body-${obj.id}`),emptyEl=$(`#pcb-empty-${obj.id}`);
  if(!panel||!body)return;
  const misCabos=cabos.filter(c=>c.buqueId===obj.id);
  panel.classList.toggle('visible',misCabos.length>0);
  $$('.pcb-cabo-item',body).forEach(el=>el.remove());
  if(misCabos.length===0){if(emptyEl)emptyEl.style.display='block';return;}
  if(emptyEl)emptyEl.style.display='none';
  misCabos.forEach(c=>{
    const div=document.createElement('div'); div.className='pcb-cabo-item';
    const zona=c.pctX<0.3?(obj.orientacion==='babor'?'Popa':'Proa'):c.pctX>0.7?(obj.orientacion==='babor'?'Proa':'Popa'):'Centro';
    div.innerHTML=`<div class="pcb-cabo-info"><div class="pcb-cabo-dot"></div><span>${zona} → Bita ${c.bitaNum}</span></div><button class="pcb-cabo-eliminar" data-cabo="${c.id}" title="Eliminar cabo">✕</button>`;
    body.appendChild(div);
  });
}

/* ============================================================
   TABLA FLOTANTE BUQUES (con sub-fila de cabos)
============================================================ */
function actualizarTabla(){
  const tbody=$('#tablaBody'),emptyEl=$('#panelEmpty'),tablaEl=$('#tablaBuques');
  if(!tbody)return;
  tbody.innerHTML='';
  if(buques.length===0){emptyEl.style.display='block';tablaEl.style.display='none';return;}
  emptyEl.style.display='none'; tablaEl.style.display='table';

  buques.forEach(obj=>{
    const misCabos=cabos.filter(c=>c.buqueId===obj.id);

    // Fila principal
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><span class="color-dot" style="background:${obj.color}"></span></td>
      <td style="font-weight:700">${obj.nombre}</td>
      <td>${obj.orientacion.charAt(0).toUpperCase()+obj.orientacion.slice(1)}</td>
      <td>${obj.metros} m</td>
      <td>${obj.manga} m</td>
      <td>${obj.bitaDesde} → ${obj.bitaHasta}</td>
      <td><button class="lock-btn-table" data-id="${obj.id}">${obj.locked?'🔒':'🔓'}</button></td>
      <td><button class="btn-toggle-cabos" data-id="${obj.id}" title="Ver cabos">⚓${misCabos.length>0?` <span style="color:#ff6600;font-weight:700">${misCabos.length}</span>`:''}</button></td>
    `;
    tbody.appendChild(tr);

    // Sub-fila cabos (oculta por defecto)
    const trCabos=document.createElement('tr');
    trCabos.className='tabla-cabos-row';
    trCabos.id=`tcr-${obj.id}`;
    trCabos.style.display='none';
    const tdCabos=document.createElement('td');
    tdCabos.colSpan=8;

    if(misCabos.length===0){
      tdCabos.innerHTML='<div class="tabla-cabos-inner"><span class="tcr-empty">Sin cabos amarrados</span></div>';
    } else {
      const items=misCabos.map(c=>{
        const zona=c.pctX<0.3?(obj.orientacion==='babor'?'Popa':'Proa'):c.pctX>0.7?(obj.orientacion==='babor'?'Proa':'Popa'):'Centro';
        return `<div class="tcr-item"><div class="tcr-dot"></div><span>${zona} → Bita ${c.bitaNum}</span><button class="tcr-eliminar" data-cabo="${c.id}" title="Eliminar cabo">✕</button></div>`;
      }).join('');
      tdCabos.innerHTML=`<div class="tabla-cabos-inner">${items}</div>`;
    }

    trCabos.appendChild(tdCabos);
    tbody.appendChild(trCabos);
  });
}

// Delegación de eventos en tabla
$('#tablaBody').addEventListener('click',e=>{
  // Lock
  const lockBtn=e.target.closest('.lock-btn-table');
  if(lockBtn){
    const obj=buques.find(b=>b.id===parseInt(lockBtn.dataset.id));
    if(obj){obj.locked=!obj.locked;obj.el.classList.toggle('locked',obj.locked);actualizarTabla();guardarEstado();mostrarToast(obj.locked?`🔒 ${obj.nombre} bloqueado`:`🔓 ${obj.nombre} desbloqueado`);}
    return;
  }
  // Toggle cabos sub-fila
  const caboToggle=e.target.closest('.btn-toggle-cabos');
  if(caboToggle){
    const id=parseInt(caboToggle.dataset.id);
    const trCabos=$(`#tcr-${id}`);
    if(trCabos)trCabos.style.display=trCabos.style.display==='none'?'':'none';
    return;
  }
  // Eliminar cabo desde tabla
  const elim=e.target.closest('.tcr-eliminar');
  if(elim){eliminarCabo(parseInt(elim.dataset.cabo));return;}
});

/* ============================================================
   PANEL TOGGLE
============================================================ */
(function initPanel(){
  const btn=$('#panelToggle'),body=$('#panelBody');
  let col=false;
  btn.addEventListener('click',e=>{e.stopPropagation();col=!col;body.classList.toggle('collapsed',col);btn.textContent=col?'▲':'▼';});
})();

/* ============================================================
   MODAL AGREGAR
============================================================ */
(function initModalAgregar(){
  const overlay=$('#overlayAgregar'),modal=$('#modalAgregar'),segBanda=$('#seg-banda'),swatchesEl=$('#colorSwatches');
  let bandaVal='estribor',mangaTocada=false;

  PALETTE.forEach(c=>{
    const s=document.createElement('div'); s.className='swatch'; s.style.background=c; s.title=c;
    s.addEventListener('click',()=>{$('#inp-color').value=c;$$('.swatch',swatchesEl).forEach(x=>x.classList.remove('selected'));s.classList.add('selected');});
    swatchesEl.appendChild(s);
  });

  function colorRandom(){$('#inp-color').value=randomPastel();$$('.swatch',swatchesEl).forEach(x=>x.classList.remove('selected'));}
  $('#btnRandomColor').addEventListener('click',colorRandom);

  segBanda.querySelectorAll('.seg-btn').forEach(btn=>btn.addEventListener('click',()=>{segBanda.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');bandaVal=btn.dataset.val;}));

  $('#inp-manga').addEventListener('input',()=>{mangaTocada=true;});
  $('#inp-metros').addEventListener('input',()=>{if(!mangaTocada&&$('#inp-metros').value){$('#inp-manga').value=mangaPorDefecto($('#inp-metros').value);}});

  function abrir(){
    $('#inp-nombre').value='';$('#inp-metros').value='';$('#inp-manga').value='';
    mangaTocada=false; colorRandom(); bandaVal='estribor';
    segBanda.querySelectorAll('.seg-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
    overlay.style.display='block';modal.style.display='block';
    requestAnimationFrame(()=>{overlay.classList.add('visible');modal.classList.add('visible');});
    setTimeout(()=>$('#inp-nombre').focus(),230);
  }
  function cerrar(){overlay.classList.remove('visible');modal.classList.remove('visible');setTimeout(()=>{overlay.style.display='none';modal.style.display='none';},230);}

  $('#btnAgregarBuque').addEventListener('click',abrir);
  $('#closeAgregar').addEventListener('click',cerrar);
  $('#cancelAgregar').addEventListener('click',cerrar);
  overlay.addEventListener('click',cerrar);

  $('#confirmAgregar').addEventListener('click',()=>{
    const nombre=$('#inp-nombre').value.trim(),metros=$('#inp-metros').value,manga=$('#inp-manga').value,color=$('#inp-color').value;
    if(!nombre){$('#inp-nombre').focus();mostrarToast('⚠ Ingresá el nombre');return;}
    if(!metros||parseFloat(metros)<70){$('#inp-metros').focus();mostrarToast('⚠ Eslora mínima 70 m');return;}
    if(!manga||parseFloat(manga)<8){$('#inp-manga').focus();mostrarToast('⚠ Manga mínima 8 m');return;}
    if(agregarBuque(nombre,metros,manga,color,bandaVal))cerrar();
  });

  [$('#inp-nombre'),$('#inp-metros'),$('#inp-manga')].forEach(inp=>inp?.addEventListener('keydown',e=>{if(e.key==='Enter')$('#confirmAgregar').click();}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('visible'))cerrar();});
})();

/* ============================================================
   MODAL EDITAR
============================================================ */
let objEditando=null;
function abrirModalEditar(obj){
  objEditando=obj;
  const overlay=$('#overlayEditar'),modal=$('#modalEditar'),segBanda=$('#seg-edit-banda');
  $('#edit-nombre').value=obj.nombre; $('#edit-metros').value=obj.metros; $('#edit-manga').value=obj.manga; $('#edit-color').value=obj.color;
  segBanda.querySelectorAll('.seg-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.val===obj.orientacion));
  overlay.style.display='block';modal.style.display='block';
  requestAnimationFrame(()=>{overlay.classList.add('visible');modal.classList.add('visible');});
}
(function initModalEditar(){
  const overlay=$('#overlayEditar'),modal=$('#modalEditar'),segBanda=$('#seg-edit-banda');
  segBanda.querySelectorAll('.seg-btn').forEach(btn=>btn.addEventListener('click',()=>{segBanda.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}));
  $('#editBtnRandom').addEventListener('click',()=>{$('#edit-color').value=randomPastel();});

  function cerrar(){overlay.classList.remove('visible');modal.classList.remove('visible');setTimeout(()=>{overlay.style.display='none';modal.style.display='none';},230);objEditando=null;}
  $('#closeEditar').addEventListener('click',cerrar); $('#cancelEditar').addEventListener('click',cerrar); overlay.addEventListener('click',cerrar);

  $('#confirmEditar').addEventListener('click',()=>{
    if(!objEditando)return;
    const obj=objEditando,nombre=$('#edit-nombre').value.trim(),metros=parseFloat($('#edit-metros').value),manga=parseFloat($('#edit-manga').value),color=$('#edit-color').value;
    const banda=segBanda.querySelector('.seg-btn.active')?.dataset.val||obj.orientacion;
    if(!nombre){mostrarToast('⚠ Ingresá el nombre');return;}
    if(isNaN(metros)||metros<70){mostrarToast('⚠ Eslora mínima 70 m');return;}
    if(isNaN(manga)||manga<8){mostrarToast('⚠ Manga mínima 8 m');return;}
    const escala=getEscala(),nuevoAncho=metros*escala,nuevoAlto=Math.max(30,Math.round(manga*escala));
    const zona=$('#zonaBuques'),margenPx=MARGEN_BORDE_M*escala;
    let newX=parseFloat(obj.el.style.left);
    if(hayColision(newX,nuevoAncho,obj.id)){mostrarToast('⚠ No cabe con ese tamaño');return;}
    newX=Math.max(margenPx,Math.min(newX,zona.clientWidth-margenPx-nuevoAncho));
    obj.nombre=nombre.toUpperCase(); obj.metros=metros; obj.manga=manga; obj.color=color; obj.orientacion=banda; obj.leftM=newX/escala;
    obj.el.className=`buque${banda==='babor'?' babor':''}${obj.locked?' locked':''}`;
    obj.el.style.width=nuevoAncho+'px'; obj.el.style.height=nuevoAlto+'px'; obj.el.style.left=newX+'px';
    obj.el.innerHTML=buqueHTML(obj);
    iniciarPanelCabos(obj);
    cabos.filter(c=>c.buqueId===obj.id).forEach(c=>{
      const p=document.createElement('div'); p.className='punto-amarre'; p.dataset.id=c.id;
      p.style.left=(c.pctX*100)+'%'; p.style.top=(c.pctY*100)+'%';
      p.addEventListener('dblclick',e=>{e.stopPropagation();eliminarCabo(c.id);});
      obj.el.appendChild(p); c.puntoEl=p;
    });
    actualizarCabosBuque(obj); actualizarPanelCabosBuque(obj);
    calcularBitas(obj); actualizarTabla(); guardarEstado(); cerrar();
    mostrarToast(`✓ ${obj.nombre} actualizado`);
  });

  $('#eliminarBuque').addEventListener('click',()=>{
    if(!objEditando)return;
    const obj=objEditando; cerrar();
    cabos.filter(c=>c.buqueId===obj.id).forEach(c=>{c.puntoEl?.remove();c.lineaEl?.remove();});
    cabos=cabos.filter(c=>c.buqueId!==obj.id);
    obj.el.classList.add('saliendo');
    setTimeout(()=>{obj.el.remove();buques=buques.filter(b=>b.id!==obj.id);actualizarTabla();guardarEstado();mostrarToast(`🗑 ${obj.nombre} eliminado`);},300);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('visible'))cerrar();});
})();

/* ============================================================
   MODAL IMPRIMIR
============================================================ */
(function initImprimir(){
  const btn=$('#btnImprimir'),overlay=$('#overlayImprimir'),modal=$('#modalImprimir'),close=$('#closeImprimir');

  function abrir(){overlay.style.display='block';modal.style.display='block';requestAnimationFrame(()=>{overlay.classList.add('visible');modal.classList.add('visible');});}
  function cerrar(){overlay.classList.remove('visible');modal.classList.remove('visible');setTimeout(()=>{overlay.style.display='none';modal.style.display='none';},230);}

  btn?.addEventListener('click',abrir);
  close?.addEventListener('click',cerrar);
  overlay?.addEventListener('click',cerrar);

  $('#btnPrintDirect')?.addEventListener('click',()=>{ cerrar(); setTimeout(()=>window.print(),300); });

  $('#btnPrintImg')?.addEventListener('click',async()=>{
    cerrar();
    mostrarToast('📸 Generando imagen...');
    try {
      // Usamos html2canvas si está disponible, sino dom-to-image via CDN
      const script=document.createElement('script');
      script.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
      script.onload=async()=>{
        const zona=document.querySelector('.zona-principal');
        const canvas=await window.html2canvas(zona,{
          backgroundColor:'#90d4ea',
          scale:2,
          useCORS:true,
          logging:false
        });
        const link=document.createElement('a');
        link.download=`docksim-${new Date().toISOString().slice(0,16).replace('T','_')}.png`;
        link.href=canvas.toDataURL('image/png');
        link.click();
        mostrarToast('✓ Imagen descargada');
      };
      script.onerror=()=>mostrarToast('⚠ Error cargando html2canvas');
    } catch(e){ mostrarToast('⚠ Error generando imagen'); }
  });

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('visible'))cerrar();});
})();

/* ============================================================
   TOAST
============================================================ */
let toastTimer=null;
function mostrarToast(msg){
  const el=$('#toast'); el.textContent=msg; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('visible'),2800);
}

/* ============================================================
   RESIZE
============================================================ */
window.addEventListener('resize',()=>{
  const escala=getEscala(),zona=$('#zonaBuques'),margenPx=MARGEN_BORDE_M*escala;
  buques.forEach(obj=>{
    const nuevoAncho=obj.metros*escala,nuevoAlto=Math.max(30,Math.round(obj.manga*escala));
    let newX=Math.max(margenPx,Math.min((obj.leftM||0)*escala,zona.clientWidth-margenPx-nuevoAncho));
    obj.el.style.width=nuevoAncho+'px'; obj.el.style.height=nuevoAlto+'px'; obj.el.style.left=newX+'px';
    calcularBitas(obj); actualizarCabosBuque(obj);
  });
  generarBitas(); actualizarTabla();
});

/* ============================================================
   INIT
============================================================ */
window.addEventListener('load',()=>{ generarBitas(); cargarEstado(); });
