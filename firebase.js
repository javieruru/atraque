/* ============================================================
   DOCKSIM — firebase.js
   Gestión de sesiones en Firestore
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, orderBy, query, limit }
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

/* ─── Helpers ─── */
function generarId() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function snapshotActual() {
  // Pide los datos al script principal vía función global
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
    nombre:   nombreSesion || `Sesión ${now.toLocaleDateString('es-UY')} ${now.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}`,
    fecha:    now.toISOString(),
    fechaStr: `${now.toLocaleDateString('es-UY')} ${now.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}`,
    buques:   snapshot.buques,
    cabos:    snapshot.cabos,
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

/* ─── Listar sesiones recientes ─── */
async function listarSesiones(limite = 20) {
  const q    = query(collection(db,'sesiones'), orderBy('fecha','desc'), limit(limite));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

/* ─── Exponer globalmente ─── */
window.FirebaseSesiones = { guardarSesion, cargarSesionPorId, listarSesiones, generarId };
