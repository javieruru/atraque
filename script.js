/* =============================================
   DOCKSIM — script.js
============================================= */
'use strict';

/* ============================================================
   DATOS
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
let buques=[], cabos=[];
let idCounter=0, caboCounter=0;
const caboRowsOpen = new Set(); // IDs de buques con sub-fila de cabos abierta

const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));

function getEscala(){ return $('#zonaBuques').clientWidth / MUELLE_METROS_TOTAL; }

function mangaPorDefecto(m){
  m=parseFloat(m)||0;
  if(m<=120) return 25;
  if(m<=200) return 30;
  return 35;
}

/* ============================================================
   BITAS
============================================================ */
function generarBitas(){
  const cont=$('#bitasContenedor');
  if(!cont) return;
  cont.innerHTML='';
  const escala=getEscala();
  BITAS.forEach(b=>{
    const cls=b.cap===250?'bita-250':b.cap===150?'bita-150':'bita-55';
    const div=document.createElement('div');
    div.className=`bita ${cls}`;
    div.dataset.num=String(b.num);
    div.dataset.pos=String(b.pos);
    div.dataset.cap=String(b.cap);
    div.style.left=(b.pos*escala)+'px';
    div.innerHTML=`<div class="bita-palo"></div><div class="bita-cabeza"></div><div class="bita-label">${b.num}</div>`;
    div.addEventListener('mouseenter',()=>mostrarInfoBita(b));
    div.addEventListener('mouseleave',ocultarInfoPanel);
    cont.appendChild(div);
  });
}

function calcularBitas(obj){
  const ini=parseFloat(obj.el.style.left), fin=ini+obj.el.offsetWidth;
  const domB=$$('.bita').map(b=>({num:b.dataset.num,x:b.offsetLeft}));
  let desde='–',hasta='–';
  for(let i=0;i<domB.length;i++){if(domB[i].x>=ini){desde=domB[i].num;break;}}
  for(let i=domB.length-1;i>=0;i--){if(domB[i].x<=fin){hasta=domB[i].num;break;}}
  obj.bitaDesde=desde; obj.bitaHasta=hasta;
}

/* ============================================================
   PANEL INFO FLOTANTE
============================================================ */
const panelIF=$('#panelInfoFlotante');
const pifTitulo=$('#pifTitulo');
const pifIcon=$('#pifIcon');
const pifBody=$('#pifBody');
let pifTimer=null;

function mostrarInfoBuque(obj){
  clearTimeout(pifTimer);
  pifIcon.textContent='🚢';
  pifTitulo.textContent=obj.nombre;
  const misCabos=cabos.filter(c=>c.buqueId===obj.id);
  const cabosStr=misCabos.length===0?'Sin cabos':misCabos.map(c=>{
    const z=c.pctX<0.3?(obj.orientacion==='babor'?'Proa':'Popa'):c.pctX>0.7?(obj.orientacion==='babor'?'Popa':'Proa'):'Centro';
    return `${z} → Bita ${c.bitaNum}`;
  }).join('<br>');
  pifBody.innerHTML=`
    <div class="pif-row"><span class="pif-label">Eslora</span><span class="pif-value">${obj.metros} m</span></div>
    <div class="pif-row"><span class="pif-label">Manga</span><span class="pif-value">${obj.manga} m</span></div>
    <div class="pif-row"><span class="pif-label">Banda</span><span class="pif-value">${obj.orientacion.charAt(0).toUpperCase()+obj.orientacion.slice(1)}</span></div>
    <div class="pif-row"><span class="pif-label">Bitas</span><span class="pif-value highlight">${obj.bitaDesde} → ${obj.bitaHasta}</span></div>
    <div class="pif-row"><span class="pif-label">Estado</span><span class="pif-value ${obj.locked?'warn':''}">${obj.locked?'🔒 Bloqueado':'🔓 Libre'}</span></div>
    <div class="pif-divider"></div>
    <div class="pif-row"><span class="pif-label">Cabos</span><span class="pif-value" style="font-size:10px;line-height:1.6">${cabosStr}</span></div>
    <div class="pif-hint">Doble clic = editar · Ctrl+clic = amarrar</div>`;
  panelIF.classList.add('visible');
}

function mostrarInfoBita(b){
  clearTimeout(pifTimer);
  const tipo=b.cap===250?'Reforzada':b.cap===150?'Estándar':'Liviana';
  const color=b.cap===250?'#a02020':b.cap===150?'#555':'#999';
  const cabosBita=cabos.filter(c=>c.bitaNum===b.num);
  const str=cabosBita.length===0?'Sin cabos':cabosBita.map(c=>{const bq=buques.find(b2=>b2.id===c.buqueId);return bq?bq.nombre:'?';}).join(', ');
  pifIcon.textContent='⚓';
  pifTitulo.textContent=`Bita ${b.num}`;
  pifBody.innerHTML=`
    <div class="pif-row"><span class="pif-label">Posición</span><span class="pif-value">${b.pos.toFixed(2)} m</span></div>
    <div class="pif-row"><span class="pif-label">Tipo</span><span class="pif-value" style="color:${color}">${tipo}</span></div>
    <div class="pif-row"><span class="pif-label">Capacidad</span><span class="pif-value" style="color:${color}">${b.cap} t</span></div>
    <div class="pif-divider"></div>
    <div class="pif-row"><span class="pif-label">Cabos</span><span class="pif-value" style="font-size:10px">${str}</span></div>`;
  panelIF.classList.add('visible');
}

function ocultarInfoPanel(){ pifTimer=setTimeout(()=>panelIF.classList.remove('visible'),120); }
panelIF.addEventListener('mouseenter',()=>clearTimeout(pifTimer));
panelIF.addEventListener('mouseleave',ocultarInfoPanel);

/* ============================================================
   PANEL INFO BITAS (modal)
============================================================ */
function buildTablaInfoBitas(){
  const tbody=$('#tablaInfoBody');
  if(!tbody) return;
  tbody.innerHTML='';
  const ds={};
  for(let i=0;i<TRAMOS.length-1;i++){if(TRAMOS[i].hasta!=='Borde')ds[TRAMOS[i].hasta]=TRAMOS[i+1].dist;}
  BITAS.forEach(b=>{
    const cls=b.cap===250?'250':b.cap===150?'150':'55';
    const sig=ds[b.num]!==undefined?ds[b.num].toFixed(2)+' m':'—';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="bita-num-cell bita-num-${cls}">${b.num}</td><td>${b.pos.toFixed(3)} m</td><td>${sig}</td><td><span class="cap-badge cap-${cls}">${b.cap} t</span></td>`;
    tbody.appendChild(tr);
  });
}

(function initPanelInfoModal(){
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
function hayColision(x,ancho,excId){
  const sep=SEPARACION_MIN_M*getEscala();
  for(const b of buques){if(b.id===excId)continue;const bx=parseFloat(b.el.style.left),bw=b.el.offsetWidth;if(x<bx+bw+sep&&x+ancho+sep>bx)return true;}
  return false;
}
function encontrarHueco(metros){
  const escala=getEscala(),ap=metros*escala,mp=MARGEN_BORDE_M*escala,tw=$('#zonaBuques').clientWidth;
  for(let c=mp;c<=tw-mp-ap;c+=2){if(!hayColision(c,ap,null))return c;}
  return null;
}

/* ============================================================
   HTML BUQUE
============================================================ */
function buildCasillas(){
  return ['rgba(0,0,0,.22)','rgba(0,0,0,.14)','rgba(255,255,255,.13)','rgba(0,0,0,.18)','rgba(255,255,255,.07)','rgba(0,0,0,.20)']
    .map(c=>`<div class="casilla" style="background:${c}"></div>`).join('');
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
    `;
}

function crearBuqueEl(info){
  const escala=getEscala(),ap=info.metros*escala,alt=Math.max(30,Math.round(info.manga*escala));
  const el=document.createElement('div');
  el.className=`buque${info.orientacion==='babor'?' babor':''} entrando`;
  el.style.width=ap+'px'; el.style.height=alt+'px'; el.style.left=info.x+'px';
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
  if(xPx===null){mostrarToast('⚠ No hay espacio libre');return false;}
  const id=++idCounter;
  const info={id,nombre:nombre.toUpperCase(),metros,manga,color,orientacion,x:xPx};
  const el=crearBuqueEl(info);
  const obj={id,nombre:info.nombre,metros,manga,color,orientacion,locked:false,el,bitaDesde:'–',bitaHasta:'–',leftM:xPx/getEscala()};
  buques.push(obj);
  $('#zonaBuques').appendChild(el);
  calcularBitas(obj); iniciarDrag(obj); iniciarHoverInfo(obj); iniciarPanelCabos(obj);
  actualizarTabla(); guardarEstado();
  mostrarToast(`✓ ${info.nombre} agregado`);
  return true;
}

/* ============================================================
   PERSISTENCIA
============================================================ */
function guardarEstado(){
  localStorage.setItem('docksim_buques',JSON.stringify(buques.map(b=>({id:b.id,nombre:b.nombre,metros:b.metros,manga:b.manga,color:b.color,orientacion:b.orientacion,locked:b.locked,leftM:b.leftM}))));
  // Solo guardar datos lógicos — las coords se recalculan desde escala al restaurar
  localStorage.setItem('docksim_cabos',JSON.stringify(cabos.map(c=>({id:c.id,buqueId:c.buqueId,pctX:c.pctX,pctY:c.pctY,bitaNum:c.bitaNum}))));
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
      const escala=getEscala(),alt=Math.max(30,Math.round((d.manga||35)*escala)),xPx=(d.leftM||0)*escala;
      const info={...d,manga:d.manga||35,x:xPx};
      const el=crearBuqueEl(info); el.style.height=alt+'px';
      const obj={...info,el,bitaDesde:'–',bitaHasta:'–'};
      buques.push(obj);
      $('#zonaBuques').appendChild(el);
      calcularBitas(obj); iniciarDrag(obj); iniciarHoverInfo(obj); iniciarPanelCabos(obj);
      if(obj.locked)obj.el.classList.add('locked');
    });
    actualizarTabla();

    // Restaurar cabos — las coords se calculan desde escala (no dependen del layout)
    const rawC=localStorage.getItem('docksim_cabos'),cntC=localStorage.getItem('docksim_cabo_counter');
    if(rawC){
      const cd=JSON.parse(rawC);
      if(cntC) caboCounter=parseInt(cntC);
      cd.forEach(c=>{
        const o=buques.find(b=>b.id===c.buqueId);
        if(!o) return;
        const id=c.id;
        const punto=document.createElement('div');
        punto.className='punto-amarre'; punto.dataset.id=id;
        punto.style.left=(c.pctX*100)+'%'; punto.style.top=(c.pctY*100)+'%';
        o.el.appendChild(punto);
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        line.classList.add('cabo-linea'); line.dataset.id=id;
        svgCabos.appendChild(line);
        const cabo={id,buqueId:o.id,pctX:c.pctX,pctY:c.pctY,bitaNum:c.bitaNum,puntoEl:punto,lineaEl:line};
        cabos.push(cabo);
        // Calcular línea directamente desde escala — siempre correcto
        actualizarLineaCabo(cabo,o);
        line.addEventListener('dblclick',()=>eliminarCabo(id));
        punto.addEventListener('dblclick',ev=>{ev.stopPropagation();eliminarCabo(id);});
      });
      actualizarTabla();
    }
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
    const escala=getEscala(),mp=MARGEN_BORDE_M*escala,zona=$('#zonaBuques');
    let newX=Math.max(mp,Math.min(startL+(cx-startX),zona.clientWidth-mp-el.offsetWidth));
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

function iniciarHoverInfo(obj){
  const el=obj.el;
  el.addEventListener('mouseenter',()=>{clearTimeout(pifTimer);mostrarInfoBuque(obj);});
  el.addEventListener('mouseleave',ocultarInfoPanel);
}

/* ============================================================
   MODO CTRL
============================================================ */
document.addEventListener('keydown',e=>{if(e.key==='Control')document.body.classList.add('ctrl-mode');});
document.addEventListener('keyup',  e=>{if(e.key==='Control')document.body.classList.remove('ctrl-mode');});

/* ============================================================
   SISTEMA CABOS (SVG)
============================================================ */
const svgCabos=$('#svgCabos');

/* ----------------------------------------------------------------
   Sistema de coordenadas SVG
   El SVG tiene position:absolute; inset:0 dentro de .zona-principal.
   Usamos SIEMPRE .zona-buques como referencia horizontal (mismo ancho
   que el SVG) y calculamos Y desde datos conocidos (muelle-h en px).
   Esto funciona tanto al crear como al restaurar desde localStorage.
---------------------------------------------------------------- */
function coordsBuque(obj, pctX, pctY){
  const zona=$('#zonaBuques');
  const escala=getEscala();
  // X: posición izquierda del buque en px + porcentaje del ancho
  const x=(obj.leftM||0)*escala + pctX*(obj.metros*escala);
  // Y: el buque está pegado al fondo de zona-buques (bottom:0)
  //    zona-buques ocupa toda la altura menos el muelle
  const zonaH=zona.clientHeight;
  const buqueH=Math.max(30, Math.round(obj.manga*escala));
  const y=zonaH - buqueH + pctY*buqueH;
  return {x, y};
}

function coordsBita(bitaNum){
  const bita=BITAS.find(b=>b.num===bitaNum);
  if(!bita) return null;
  const escala=getEscala();
  const zona=$('#zonaBuques');
  // X: posición de la bita en metros
  const x=bita.pos*escala;
  // Y: la bita está en el tope del muelle = fondo de zona-buques + un pequeño offset
  const y=zona.clientHeight+12;
  return {x, y};
}

// Para crear un cabo con Ctrl+clic necesitamos convertir
// la posición del click (clientX/Y) a coordenadas de zona-buques
function clientToZona(clientX, clientY){
  const zona=$('#zonaBuques');
  const r=zona.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top };
}

// pctX/pctY desde un click sobre el buque
function clickToPct(obj, clientX, clientY){
  const elR=obj.el.getBoundingClientRect();
  return {
    pctX: Math.max(0,Math.min(1,(clientX-elR.left)/elR.width)),
    pctY: Math.max(0,Math.min(1,(clientY-elR.top)/elR.height))
  };
}

function getBitaPos(bitaNum){ return coordsBita(bitaNum); }
function getPuntoPos(obj,pctX,pctY){ return coordsBuque(obj,pctX,pctY); }

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

let amarreEnCurso=null;
function iniciarModoAmarre(obj,e){
  if(amarreEnCurso)cancelarAmarre();
  // Calcular pctX/pctY desde el click sobre el buque
  const pct=clickToPct(obj,e.clientX,e.clientY);
  const pctX=pct.pctX, pctY=pct.pctY;
  // Punto de inicio en coordenadas zona-buques
  const p1=coordsBuque(obj,pctX,pctY);
  const lp=document.createElementNS('http://www.w3.org/2000/svg','line');
  lp.classList.add('cabo-preview'); svgCabos.appendChild(lp);
  lp.setAttribute('x1',p1.x); lp.setAttribute('y1',p1.y);
  lp.setAttribute('x2',p1.x); lp.setAttribute('y2',p1.y);
  amarreEnCurso={obj,pctX,pctY,lineaPreview:lp};
  document.body.classList.add('amarre-activo');
  mostrarToast('🎯 Clic en una bita para amarrar · ESC cancela');
  document.addEventListener('mousemove',onPreviewMove);
  document.addEventListener('click',onBitaClick,{capture:true});
  document.addEventListener('keydown',onEscAmarre);
}
function onPreviewMove(e){
  if(!amarreEnCurso)return;
  // Convertir posición del mouse a coordenadas zona-buques
  const pos=clientToZona(e.clientX,e.clientY);
  amarreEnCurso.lineaPreview.setAttribute('x2',pos.x);
  amarreEnCurso.lineaPreview.setAttribute('y2',pos.y);
}
function onBitaClick(e){
  if(!amarreEnCurso)return;
  const bitaEl=e.target.closest('.bita');
  if(!bitaEl)return;
  e.stopPropagation(); e.preventDefault();
  const{obj,pctX,pctY}=amarreEnCurso,bitaNum=parseInt(bitaEl.dataset.num);
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
   PANEL CABOS EN BUQUE
============================================================ */
function iniciarPanelCabos(obj){
  // Panel de cabos ahora vive en la tabla flotante, no en el buque
}

function actualizarPanelCabosBuque(obj){
  // Los cabos se muestran en la tabla flotante via actualizarTabla()
  actualizarTabla();
}

/* ============================================================
   TABLA FLOTANTE BUQUES
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
    tr.className='fila-buque';
    tr.innerHTML=`
      <td><span class="color-dot" style="background:${obj.color}"></span></td>
      <td style="font-weight:700">${obj.nombre}</td>
      <td>${obj.orientacion.charAt(0).toUpperCase()+obj.orientacion.slice(1)}</td>
      <td>${obj.metros} m</td>
      <td>${obj.manga} m</td>
      <td>${obj.bitaDesde} → ${obj.bitaHasta}</td>
      <td><button class="lock-btn-table" data-id="${obj.id}">${obj.locked?'🔒':'🔓'}</button></td>
      <td>
        <button class="btn-toggle-cabos" data-id="${obj.id}" title="${misCabos.length} cabo(s)">
          ⚓${misCabos.length>0?`<span class="cabo-count"> ${misCabos.length}</span>`:''}
        </button>
      </td>`;
    tbody.appendChild(tr);

    // Sub-fila cabos — siempre presente pero oculta por defecto
    const trCabos=document.createElement('tr');
    trCabos.className='fila-cabos-wrap';
    trCabos.id=`tcr-${obj.id}`;
    const tdCabos=document.createElement('td');
    tdCabos.colSpan=8;
    const inner=document.createElement('div');
    inner.className='fila-cabos-inner';

    if(misCabos.length===0){
      inner.innerHTML='<span class="tcr-empty">Sin cabos amarrados</span>';
    } else {
      misCabos.forEach(c=>{
        const z=c.pctX<0.3?(obj.orientacion==='babor'?'Proa':'Popa'):c.pctX>0.7?(obj.orientacion==='babor'?'Popa':'Proa'):'Centro';
        const item=document.createElement('div'); item.className='tcr-item';
        item.innerHTML=`<div class="tcr-dot"></div><span>${z} → Bita ${c.bitaNum}</span><button class="tcr-eliminar" data-cabo="${c.id}">✕</button>`;
        inner.appendChild(item);
      });
    }
    tdCabos.appendChild(inner);
    trCabos.appendChild(tdCabos);
    tbody.appendChild(trCabos);

    // Restaurar estado abierto si estaba expandido
    if(caboRowsOpen.has(obj.id)){
      trCabos.classList.add('abierto');
    }
  });
}

// Delegación eventos tabla
$('#tablaBody').addEventListener('click',e=>{
  const lockBtn=e.target.closest('.lock-btn-table');
  if(lockBtn){
    const obj=buques.find(b=>b.id===parseInt(lockBtn.dataset.id));
    if(obj){obj.locked=!obj.locked;obj.el.classList.toggle('locked',obj.locked);actualizarTabla();guardarEstado();mostrarToast(obj.locked?`🔒 ${obj.nombre}`:`🔓 ${obj.nombre}`);}
    return;
  }
  const caboToggle=e.target.closest('.btn-toggle-cabos');
  if(caboToggle){
    const id=parseInt(caboToggle.dataset.id);
    const tr=$(`#tcr-${id}`);
    if(tr){
      const open=tr.classList.toggle('abierto');
      if(open) caboRowsOpen.add(id); else caboRowsOpen.delete(id);
    }
    return;
  }
  const elim=e.target.closest('.tcr-eliminar');
  if(elim){eliminarCabo(parseInt(elim.dataset.cabo));}
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
  const overlay=$('#overlayAgregar'),modal=$('#modalAgregar'),segBanda=$('#seg-banda'),swEl=$('#colorSwatches');
  let bandaVal='estribor',mangaTocada=false;

  PALETTE.forEach(c=>{
    const s=document.createElement('div'); s.className='swatch'; s.style.background=c;
    s.addEventListener('click',()=>{$('#inp-color').value=c;$$('.swatch',swEl).forEach(x=>x.classList.remove('selected'));s.classList.add('selected');});
    swEl.appendChild(s);
  });

  function colorRandom(){$('#inp-color').value=randomPastel();$$('.swatch',swEl).forEach(x=>x.classList.remove('selected'));}
  $('#btnRandomColor').addEventListener('click',colorRandom);
  segBanda.querySelectorAll('.seg-btn').forEach(btn=>btn.addEventListener('click',()=>{segBanda.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');bandaVal=btn.dataset.val;}));
  $('#inp-manga').addEventListener('input',()=>{mangaTocada=true;});
  $('#inp-metros').addEventListener('input',()=>{if(!mangaTocada&&$('#inp-metros').value)$('#inp-manga').value=mangaPorDefecto($('#inp-metros').value);});

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
  $('#edit-nombre').value=obj.nombre;$('#edit-metros').value=obj.metros;$('#edit-manga').value=obj.manga;$('#edit-color').value=obj.color;
  segBanda.querySelectorAll('.seg-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.val===obj.orientacion));
  overlay.style.display='block';modal.style.display='block';
  requestAnimationFrame(()=>{overlay.classList.add('visible');modal.classList.add('visible');});
}
(function initModalEditar(){
  const overlay=$('#overlayEditar'),modal=$('#modalEditar'),segBanda=$('#seg-edit-banda');
  segBanda.querySelectorAll('.seg-btn').forEach(btn=>btn.addEventListener('click',()=>{segBanda.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}));
  $('#editBtnRandom').addEventListener('click',()=>{$('#edit-color').value=randomPastel();});
  function cerrar(){overlay.classList.remove('visible');modal.classList.remove('visible');setTimeout(()=>{overlay.style.display='none';modal.style.display='none';},230);objEditando=null;}
  $('#closeEditar').addEventListener('click',cerrar);$('#cancelEditar').addEventListener('click',cerrar);overlay.addEventListener('click',cerrar);
  $('#confirmEditar').addEventListener('click',()=>{
    if(!objEditando)return;
    const obj=objEditando,nombre=$('#edit-nombre').value.trim(),metros=parseFloat($('#edit-metros').value),manga=parseFloat($('#edit-manga').value),color=$('#edit-color').value;
    const banda=segBanda.querySelector('.seg-btn.active')?.dataset.val||obj.orientacion;
    if(!nombre){mostrarToast('⚠ Nombre requerido');return;}
    if(isNaN(metros)||metros<70){mostrarToast('⚠ Eslora mínima 70 m');return;}
    if(isNaN(manga)||manga<8){mostrarToast('⚠ Manga mínima 8 m');return;}
    const escala=getEscala(),ap=metros*escala,alt=Math.max(30,Math.round(manga*escala));
    const zona=$('#zonaBuques'),mp=MARGEN_BORDE_M*escala;
    let newX=parseFloat(obj.el.style.left);
    if(hayColision(newX,ap,obj.id)){mostrarToast('⚠ No cabe con ese tamaño');return;}
    newX=Math.max(mp,Math.min(newX,zona.clientWidth-mp-ap));
    obj.nombre=nombre.toUpperCase();obj.metros=metros;obj.manga=manga;obj.color=color;obj.orientacion=banda;obj.leftM=newX/escala;
    obj.el.className=`buque${banda==='babor'?' babor':''}${obj.locked?' locked':''}`;
    obj.el.style.width=ap+'px';obj.el.style.height=alt+'px';obj.el.style.left=newX+'px';
    obj.el.innerHTML=buqueHTML(obj);
    iniciarPanelCabos(obj);
    cabos.filter(c=>c.buqueId===obj.id).forEach(c=>{
      const p=document.createElement('div');p.className='punto-amarre';p.dataset.id=c.id;
      p.style.left=(c.pctX*100)+'%';p.style.top=(c.pctY*100)+'%';
      p.addEventListener('dblclick',e=>{e.stopPropagation();eliminarCabo(c.id);});
      obj.el.appendChild(p);c.puntoEl=p;
    });
    actualizarCabosBuque(obj);actualizarPanelCabosBuque(obj);
    calcularBitas(obj);actualizarTabla();guardarEstado();cerrar();
    mostrarToast(`✓ ${obj.nombre} actualizado`);
  });
  $('#eliminarBuque').addEventListener('click',()=>{
    if(!objEditando)return;
    const obj=objEditando;cerrar();
    cabos.filter(c=>c.buqueId===obj.id).forEach(c=>{c.puntoEl?.remove();c.lineaEl?.remove();});
    cabos=cabos.filter(c=>c.buqueId!==obj.id);
    obj.el.classList.add('saliendo');
    setTimeout(()=>{obj.el.remove();buques=buques.filter(b=>b.id!==obj.id);actualizarTabla();guardarEstado();mostrarToast(`🗑 ${obj.nombre} eliminado`);},300);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('visible'))cerrar();});
})();

/* ============================================================
   EXPORTAR / IMPRIMIR
   Estrategia: dibujamos todo en un canvas y luego:
   - Print: mostramos el canvas en #printZone y llamamos window.print()
   - Imagen: descargamos directamente el canvas como PNG
============================================================ */
/* ============================================================
   RENDER CANVAS — usado para preview y para impresión
   canvasEl: el elemento canvas donde dibujar
   aguaH: altura del agua en px (recortada)
   muelleH: altura del muelle en px
   escalaFactor: multiplicador de escala (1 = igual que pantalla)
============================================================ */
function renderCanvas(canvasEl, aguaH, muelleH){
  const escala = getEscala();
  const W = $('#zonaBuques').clientWidth;
  const DPR = 2;

  canvasEl.width  = W * DPR;
  canvasEl.height = (aguaH + muelleH) * DPR;
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = (aguaH + muelleH) + 'px';

  const ctx = canvasEl.getContext('2d');
  ctx.scale(DPR, DPR);

  // ---- AGUA ----
  const gradAgua = ctx.createLinearGradient(0, 0, 0, aguaH);
  gradAgua.addColorStop(0,   '#c2ecf8');
  gradAgua.addColorStop(0.5, '#7bc8e0');
  gradAgua.addColorStop(1,   '#52b0cc');
  ctx.fillStyle = gradAgua;
  ctx.fillRect(0, 0, W, aguaH);

  // Ondas sutiles
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1.5;
  for(let y = 0; y < aguaH; y += 28){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }

  // ---- BUQUES ----
  // offsetY: los buques están pegados al fondo de zona-buques
  // en el canvas, el fondo del agua = aguaH
  buques.forEach(obj => {
    const bw = obj.metros * escala;
    const bh = Math.max(30, Math.round(obj.manga * escala));
    const bx = (obj.leftM || 0) * escala;
    const by = aguaH - bh; // pegado al borde inferior del agua

    // Sombra
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur  = 10;
    ctx.shadowOffsetY = 4;

    // Forma del casco
    const r = Math.min(bh / 2, bw * 0.12);
    ctx.beginPath();
    if(obj.orientacion === 'babor'){
      ctx.moveTo(bx + bw, by);
      ctx.lineTo(bx + r,  by);
      ctx.arc(bx + r, by + bh/2, r, Math.PI*1.5, Math.PI*0.5, true);
      ctx.lineTo(bx + bw, by + bh);
    } else {
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw - r, by);
      ctx.arc(bx + bw - r, by + bh/2, r, Math.PI*1.5, Math.PI*0.5, false);
      ctx.lineTo(bx, by + bh);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    grad.addColorStop(0, obj.color);
    grad.addColorStop(1, darken(obj.color, 22));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Highlight superior
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(bx + 4, by + 2, bw - 8, bh * 0.3);

    // Casillería (lado popa)
    const casW = bw * 0.18, casH = bh * 0.62;
    const casX = obj.orientacion === 'babor' ? bx + bw - casW - 8 : bx + 8;
    const casY = by + bh * 0.19;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(casX, casY, casW, casH);
    // grid de casillas
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 0.5;
    for(let ci = 1; ci < 3; ci++){
      ctx.beginPath(); ctx.moveTo(casX + casW*ci/3, casY); ctx.lineTo(casX + casW*ci/3, casY + casH); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(casX, casY + casH/2); ctx.lineTo(casX + casW, casY + casH/2); ctx.stroke();

    // Puente (lado proa)
    const pW = bw * 0.08, pH = bh * 0.60;
    const pX = obj.orientacion === 'babor' ? bx + 10 : bx + bw - pW - 10;
    const pY = by + bh * 0.20;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(pX, pY, pW, pH);
    // ventana
    ctx.fillStyle = 'rgba(255,235,140,0.85)';
    ctx.fillRect(pX + pW*0.2, pY + pH*0.25, pW*0.6, pH*0.25);

    // Nombre del buque
    const fontSize = Math.max(9, Math.min(14, bh * 0.24));
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.font = `bold ${fontSize}px Syne, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3;
    ctx.fillText(obj.nombre, bx + bw/2, by + bh/2 - fontSize*0.3);
    ctx.font = `${Math.max(7, fontSize*0.72)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.fillText(`${obj.metros}m · ${obj.manga}m manga`, bx + bw/2, by + bh/2 + fontSize*0.7);
    ctx.shadowBlur = 0;
  });

  // ---- CABOS ----
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.shadowColor = 'rgba(255,100,0,0.45)';
  ctx.shadowBlur  = 4;
  cabos.forEach(cabo => {
    const obj = buques.find(b => b.id === cabo.buqueId);
    if(!obj) return;
    const bw = obj.metros * escala;
    const bh = Math.max(30, Math.round(obj.manga * escala));
    const bx = (obj.leftM || 0) * escala;
    const by = aguaH - bh;
    // punto en el buque
    const px = bx + cabo.pctX * bw;
    const py = by + cabo.pctY * bh;
    // punto en la bita (tope del muelle)
    const bitaData = BITAS.find(b => b.num === cabo.bitaNum);
    if(!bitaData) return;
    const qx = bitaData.pos * escala;
    const qy = aguaH + 10; // tope del muelle
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
    // punto de amarre
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2); ctx.fill();
  });
  ctx.shadowBlur = 0;

  // ---- MUELLE ----
  const my = aguaH;
  // Espuma borde
  const gradEsp = ctx.createLinearGradient(0, my, 0, my + 10);
  gradEsp.addColorStop(0, 'rgba(74,174,204,0.55)');
  gradEsp.addColorStop(1, 'transparent');
  ctx.fillStyle = gradEsp;
  ctx.fillRect(0, my, W, 10);

  // Tablones
  const gradMad = ctx.createLinearGradient(0, my + 10, 0, my + muelleH);
  gradMad.addColorStop(0,   '#caba90');
  gradMad.addColorStop(0.4, '#b8a478');
  gradMad.addColorStop(1,   '#a08858');
  ctx.fillStyle = gradMad;
  ctx.fillRect(0, my + 10, W, muelleH - 10);

  // Líneas verticales tablones
  ctx.strokeStyle = 'rgba(0,0,0,0.055)';
  ctx.lineWidth = 1;
  for(let x2 = 0; x2 < W; x2 += 30){
    ctx.beginPath(); ctx.moveTo(x2, my+10); ctx.lineTo(x2, my+muelleH); ctx.stroke();
  }
  // Líneas horizontales tablones
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for(let y2 = my+10; y2 < my+muelleH; y2 += 12){
    ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(W, y2); ctx.stroke();
  }

  // Borde superior muelle
  ctx.fillStyle = '#7a6030';
  ctx.fillRect(0, my + 10, W, 3);

  // ---- BITAS ----
  BITAS.forEach(b => {
    const bx      = b.pos * escala;
    const topY    = my + 14;
    const palH    = 16;
    const cr      = b.cap===250 ? 6 : b.cap===150 ? 5 : 4;
    const palColor = b.cap===250 ? '#b02020' : b.cap===150 ? '#6a5020' : '#a09070';
    const headColor = b.cap===250 ? '#e04030' : b.cap===150 ? '#aaa' : '#ccc';
    const txtColor  = b.cap===250 ? '#901010' : b.cap===150 ? 'rgba(55,35,5,0.7)' : 'rgba(55,35,5,0.42)';

    // Palo
    ctx.strokeStyle = palColor; ctx.lineWidth = b.cap===250 ? 2.5 : 2;
    ctx.beginPath(); ctx.moveTo(bx, topY); ctx.lineTo(bx, topY+palH); ctx.stroke();
    // Cabeza
    ctx.fillStyle = headColor;
    ctx.shadowColor='rgba(0,0,0,0.25)'; ctx.shadowBlur=2;
    ctx.beginPath(); ctx.arc(bx, topY+palH, cr, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // Número
    ctx.fillStyle  = txtColor;
    ctx.font       = `bold ${b.cap===250?10:9}px "JetBrains Mono",monospace`;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(b.num), bx, topY+palH+cr+2);
  });

  // ---- REGLA DE ESCALA ----
  // Dibujamos una regla cada 50m en el borde inferior del muelle
  ctx.fillStyle = 'rgba(70,45,5,0.45)';
  ctx.font = '8px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  for(let m = 0; m <= MUELLE_METROS_TOTAL; m += 50){
    const rx = m * escala;
    ctx.fillStyle = 'rgba(100,70,10,0.35)';
    ctx.fillRect(rx, my + muelleH - 14, 1, 8);
    ctx.fillStyle = 'rgba(70,45,5,0.45)';
    ctx.textAlign = m===0 ? 'left' : 'center';
    ctx.fillText(m+'m', rx + (m===0?2:0), my + muelleH - 1);
  }

  // Labels zonas
  ctx.fillStyle = 'rgba(70,45,5,0.4)';
  ctx.font = 'bold 8px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('◀ 212 — 201', 14, my + 4);
  ctx.textAlign = 'right';
  ctx.fillText('201 — 10 ▶', W - 40, my + 4);
}

/* ============================================================
   INIT IMPRIMIR
============================================================ */
(function initImprimir(){
  const btn=$('#btnImprimir');

  function imprimir(){
    mostrarToast('🖨️ Preparando...');
    setTimeout(()=>{
      prepararPrintZone();
      setTimeout(()=>window.print(), 400);
    }, 200);
  }

  btn?.addEventListener('click', imprimir);
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key==='p'){ e.preventDefault(); imprimir(); }
  });
})();

/* ============================================================
   RENDER CANVAS PARA IMPRESIÓN
   Dibuja: agua recortada + buques + cabos + muelle + bitas + escala
============================================================ */
function renderizarCanvas(){
  const canvas = $('#printCanvas');
  const zona   = $('#zonaBuques');
  const muelle = $('#muelle');
  const zonaR  = zona.getBoundingClientRect();
  const muelleR= muelle.getBoundingClientRect();
  const escala = getEscala();

  // Calcular el buque más alto para recortar el agua
  const alturaMaxBuque = buques.reduce((max, obj)=>{
    return Math.max(max, Math.max(30, Math.round(obj.manga * escala)));
  }, 60);
  // Mostrar solo el agua necesaria: altura del buque más alto + margen
  const aguaVisible = alturaMaxBuque + 1230;
  const muelleH    = muelleR.height;
  const W = Math.round(zonaR.width);
  const H = aguaVisible + muelleH;
  const DPR = 2;

  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  // ── AGUA ──
  const gradAgua = ctx.createLinearGradient(0, 0, 0, aguaVisible);
  gradAgua.addColorStop(0,   '#c2ecf8');
  gradAgua.addColorStop(0.4, '#90d4ea');
  gradAgua.addColorStop(1,   '#62bcd8');
  ctx.fillStyle = gradAgua;
  ctx.fillRect(0, 0, W, aguaVisible);

  // Ondas sutiles
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  for(let y=0; y<aguaVisible; y+=28){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }

  // ── BUQUES ──
  // Los buques tienen bottom:0 en zona-buques → Y = aguaVisible - buqueH
  buques.forEach(obj=>{
    const buqueW = obj.metros * escala;
    const buqueH = Math.max(30, Math.round(obj.manga * escala));
    const x      = (obj.leftM || 0) * escala;
    const y      = aguaVisible - buqueH;
    const r      = Math.min(buqueH / 2, buqueW * 0.12);

    // Sombra
    ctx.shadowColor   = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur    = 10;
    ctx.shadowOffsetY = 4;

    // Forma del casco
    ctx.beginPath();
    if(obj.orientacion === 'babor'){
      ctx.moveTo(x + buqueW, y);
      ctx.lineTo(x + r, y);
      ctx.arc(x + r, y + buqueH/2, r, Math.PI*1.5, Math.PI*0.5, true);
      ctx.lineTo(x + buqueW, y + buqueH);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + buqueW - r, y);
      ctx.arc(x + buqueW - r, y + buqueH/2, r, Math.PI*1.5, Math.PI*0.5, false);
      ctx.lineTo(x, y + buqueH);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y, x + buqueW, y + buqueH);
    grad.addColorStop(0, obj.color);
    grad.addColorStop(1, darken(obj.color, 22));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Casillería (popa)
    const casW = buqueW * 0.20;
    const casX = obj.orientacion === 'babor' ? x + buqueW - casW - 6 : x + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(casX, y + buqueH * 0.15, casW, buqueH * 0.7);
    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    for(let col=1; col<3; col++){
      const cx = casX + casW * col / 3;
      ctx.beginPath(); ctx.moveTo(cx, y + buqueH*0.15); ctx.lineTo(cx, y + buqueH*0.85); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(casX, y + buqueH*0.5); ctx.lineTo(casX+casW, y + buqueH*0.5); ctx.stroke();

    // Puente (proa)
    const pteW = buqueW * 0.09;
    const pteX = obj.orientacion === 'babor' ? x + 6 : x + buqueW - pteW - 6;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(pteX, y + buqueH * 0.18, pteW, buqueH * 0.64);
    // Ventana
    ctx.fillStyle = 'rgba(255,235,100,0.85)';
    ctx.fillRect(pteX + pteW*0.25, y + buqueH*0.38, pteW*0.5, buqueH*0.18);

    // Nombre
    const fontSize = Math.max(9, Math.min(14, buqueH * 0.22));
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `bold ${fontSize}px Syne,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 3;
    ctx.fillText(obj.nombre, x + buqueW/2, y + buqueH/2 - fontSize*0.4);
    const subSize = Math.max(7, fontSize * 0.7);
    ctx.font = `${subSize}px "JetBrains Mono",monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillText(`${obj.metros}m · ${obj.manga}m manga`, x + buqueW/2, y + buqueH/2 + subSize);
    ctx.shadowBlur = 0;
  });

  // ── CABOS ──
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.shadowColor = 'rgba(255,100,0,0.45)'; ctx.shadowBlur = 5;

  cabos.forEach(cabo=>{
    const obj = buques.find(b => b.id === cabo.buqueId);
    if(!obj) return;
    const buqueW = obj.metros * escala;
    const buqueH = Math.max(30, Math.round(obj.manga * escala));
    const buqueX = (obj.leftM || 0) * escala;
    const buqueY = aguaVisible - buqueH;

    // Punto en el buque
    const px = buqueX + cabo.pctX * buqueW;
    const py = buqueY + cabo.pctY * buqueH;

    // Posición de la bita en el canvas
    const bitaData = BITAS.find(b => b.num === cabo.bitaNum);
    if(!bitaData) return;
    const bx = bitaData.pos * escala;
    const by = aguaVisible + 14; // dentro del muelle

    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();

    // Punto de amarre
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2); ctx.fill();
  });
  ctx.shadowBlur = 0;

  // ── MUELLE ──
  const my = aguaVisible;

  // Espuma borde agua
  const gradEsp = ctx.createLinearGradient(0, my, 0, my+10);
  gradEsp.addColorStop(0, 'rgba(74,174,204,0.5)');
  gradEsp.addColorStop(1, 'transparent');
  ctx.fillStyle = gradEsp; ctx.fillRect(0, my, W, 10);

  // Madera
  const gradMad = ctx.createLinearGradient(0, my+10, 0, my+muelleH);
  gradMad.addColorStop(0,   '#caba90');
  gradMad.addColorStop(0.4, '#b8a478');
  gradMad.addColorStop(1,   '#a08858');
  ctx.fillStyle = gradMad; ctx.fillRect(0, my+10, W, muelleH-10);

  // Tablones verticales
  ctx.strokeStyle = 'rgba(0,0,0,0.055)'; ctx.lineWidth = 1;
  for(let x=0; x<W; x+=30){
    ctx.beginPath(); ctx.moveTo(x, my+10); ctx.lineTo(x, my+muelleH); ctx.stroke();
  }

  // Borde superior muelle
  ctx.fillStyle = '#7a6030'; ctx.fillRect(0, my+10, W, 4);

  // ── BITAS ──
  BITAS.forEach(b=>{
    const bx = b.pos * escala;
    const topY = my + 14;
    const palH = 16;
    const cr   = b.cap===250 ? 6 : b.cap===150 ? 5 : 4;

    // Palo
    ctx.strokeStyle = b.cap===250 ? '#c0392b' : b.cap===150 ? '#7a6030' : '#b0a080';
    ctx.lineWidth   = b.cap===250 ? 2.5 : 2;
    ctx.beginPath(); ctx.moveTo(bx, topY); ctx.lineTo(bx, topY+palH); ctx.stroke();

    // Cabeza
    const bc = b.cap===250 ? '#e05040' : b.cap===150 ? '#999' : '#bbb';
    ctx.fillStyle   = bc;
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.arc(bx, topY+palH, cr, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur  = 0;

    // Número
    ctx.fillStyle     = b.cap===250 ? '#a02020' : b.cap===150 ? 'rgba(55,35,5,0.65)' : 'rgba(55,35,5,0.38)';
    ctx.font          = `bold ${b.cap===250?10:9}px "JetBrains Mono",monospace`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'top';
    ctx.fillText(String(b.num), bx, topY+palH+cr+2);
  });

  // ── REGLA DE ESCALA ──
  const reglaY = my + muelleH - 14;
  ctx.fillStyle   = 'rgba(70,45,5,0.45)';
  ctx.font        = 'bold 8px "JetBrains Mono",monospace';
  ctx.textAlign   = 'left';
  ctx.textBaseline= 'middle';
  ctx.fillText('◀ 212 — 201', 14, reglaY);
  ctx.textAlign = 'right';
  ctx.fillText('201 — 10 ▶', W - 14, reglaY);

  // Línea de escala con marcas cada 50m
  const reglaLineY = my + muelleH - 4;
  ctx.strokeStyle = 'rgba(70,45,5,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, reglaLineY); ctx.lineTo(W, reglaLineY); ctx.stroke();
  for(let m=0; m<=MUELLE_METROS_TOTAL; m+=50){
    const rx = m * escala;
    ctx.strokeStyle = 'rgba(70,45,5,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx, reglaLineY-3); ctx.lineTo(rx, reglaLineY+3); ctx.stroke();
    ctx.fillStyle   = 'rgba(70,45,5,0.4)';
    ctx.font        = '7px "JetBrains Mono",monospace';
    ctx.textAlign   = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(m+'m', rx, reglaLineY-4);
  }
}

/* ============================================================
   PREPARAR ZONA DE IMPRESIÓN
============================================================ */
function prepararPrintZone(){
  const now   = new Date();
  const fecha = `${now.toLocaleDateString('es-UY',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} — ${now.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}`;
  const fechaCorta = `${now.toLocaleDateString('es-UY')} ${now.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}`;

  $('#pzFecha').textContent       = fecha;
  $('#pzFechaFooter').textContent = fechaCorta;

  // Stats
  const nBuques = buques.length;
  const nCabos  = cabos.length;
  const metros  = buques.reduce((s,b) => s + b.metros, 0);
  $('#pzStats').textContent = `${nBuques} buque${nBuques!==1?'s':''} · ${nCabos} cabo${nCabos!==1?'s':''} · ${metros.toFixed(0)} m ocupados`;

  // Renderizar canvas
  renderizarCanvas();

  // Tabla
  const tbody = $('#pzTablaBody');
  tbody.innerHTML = '';
  buques.forEach((obj, i)=>{
    const misCabos = cabos.filter(c => c.buqueId === obj.id);
    const cabosTags = misCabos.length === 0
      ? '<span style="color:#aaa">—</span>'
      : misCabos.map(c=>{
          const z = c.pctX < 0.3
            ? (obj.orientacion==='babor' ? 'Proa' : 'Popa')
            : c.pctX > 0.7
            ? (obj.orientacion==='babor' ? 'Popa' : 'Proa')
            : 'Centro';
          return `<span class="pz-cabo-tag">${z} → ${c.bitaNum}</span>`;
        }).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:#888;font-size:9px">${i+1}</td>
      <td><span class="pz-color-dot" style="background:${obj.color}"></span><strong>${obj.nombre}</strong></td>
      <td>${obj.orientacion.charAt(0).toUpperCase()+obj.orientacion.slice(1)}</td>
      <td>${obj.metros} m</td>
      <td>${obj.manga} m</td>
      <td>${obj.bitaDesde} → ${obj.bitaHasta}</td>
      <td>${cabosTags}</td>`;
    tbody.appendChild(tr);
  });
}

/* Después de print */
window.addEventListener('afterprint', ()=>{});


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
  const escala=getEscala(),zona=$('#zonaBuques'),mp=MARGEN_BORDE_M*escala;
  buques.forEach(obj=>{
    const ap=obj.metros*escala,alt=Math.max(30,Math.round(obj.manga*escala));
    let newX=Math.max(mp,Math.min((obj.leftM||0)*escala,zona.clientWidth-mp-ap));
    obj.el.style.width=ap+'px';obj.el.style.height=alt+'px';obj.el.style.left=newX+'px';
    calcularBitas(obj); actualizarCabosBuque(obj);
  });
  generarBitas(); actualizarTabla();
});

/* ============================================================
   INIT
============================================================ */
window.addEventListener('load',()=>{
  generarBitas();
  cargarEstado();
  // Re-dibujar líneas de cabos una vez que la página esté completamente cargada
  // (fonts, imágenes, layout final)
  window.addEventListener('load', ()=>{
    requestAnimationFrame(()=>{
      cabos.forEach(c=>{
        const obj=buques.find(b=>b.id===c.buqueId);
        if(obj) actualizarLineaCabo(c,obj);
      });
    });
  }, {once:true});
});
