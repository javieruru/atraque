/* ============================================================
   DOCKSIM — firebase.js
   Gestión de sesiones en Firestore
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection,
         getDocs, orderBy, query, limit, startAfter }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAbL7OCNH7gbUQghQ-KcXTx9fUzy39H-NQ",
  authDomain:        "simuelleapp.firebaseapp.com",
  projectId:         "simuelleapp",
  storageBucket:     "simuelleapp.firebasestorage.app",
  messagingSenderId: "503527848585",
  appId:             "1:503527848585:web:ce3ed53840fcbcb5b7e458"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const PAGE_SIZE = 6;

/* ─── Helpers ─── */
function generarId() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function snapshotActual() {
  return window.DockSim?.getSnapshot?.() ?? null;
}

/* ─── Guardar sesión ─── */
async function guardarSesion(nombreSesion) {
  const snapshot = snapshotActual();
  if (!snapshot) throw new Error('Sin datos');
  const id  = generarId();
  const now = new Date();
  const data = {
    id,
    nombre:     nombreSesion || `Sesión ${now.toLocaleDateString('es-UY')} ${now.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}`,
    fecha:      now.toISOString(),
    fechaStr:   `${now.toLocaleDateString('es-UY')} ${now.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}`,
    // índice de búsqueda: nombres de buques en minúsculas para filtrar client-side
    buquesNombres: snapshot.buques.map(b => b.nombre.toLowerCase()),
    buques:     snapshot.buques,
    cabos:      snapshot.cabos,
    contadores: snapshot.contadores
  };
  await setDoc(doc(db, 'sesiones', id), data);
  return id;
}

/* ─── Cargar sesión por ID ─── */
async function cargarSesionPorId(id) {
  const snap = await getDoc(doc(db, 'sesiones', id));
  if (!snap.exists()) throw new Error('Sesión no encontrada');
  return snap.data();
}

/* ─── Eliminar sesión ─── */
async function eliminarSesion(id) {
  await deleteDoc(doc(db, 'sesiones', id));
}

/* ─── Listar sesiones paginadas ─── */
// lastDoc: último documento de la página anterior (para startAfter), null = primera página
async function listarSesionesPaginadas(lastDoc = null) {
  let q = query(collection(db,'sesiones'), orderBy('fecha','desc'), limit(PAGE_SIZE));
  if (lastDoc) q = query(collection(db,'sesiones'), orderBy('fecha','desc'), startAfter(lastDoc), limit(PAGE_SIZE));
  const snap = await getDocs(q);
  return {
    sesiones: snap.docs.map(d => d.data()),
    lastDoc:  snap.docs[snap.docs.length - 1] ?? null,
    hayMas:   snap.docs.length === PAGE_SIZE
  };
}

/* ─── Exponer globalmente ─── */
window.FirebaseSesiones = {
  guardarSesion,
  cargarSesionPorId,
  eliminarSesion,
  listarSesionesPaginadas,
  generarId,
  PAGE_SIZE
};

