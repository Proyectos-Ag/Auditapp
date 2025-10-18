// src/services/backendRouter.js
// Administra la baseURL activa (local vs remoto), la decisión inicial y re-intentos low-cost.

const LOCAL_URL   = (process.env.REACT_APP_LOCAL_BACKEND_URL || '').replace(/\/+$/, '');
const REMOTE_URL  = (process.env.REACT_APP_LINE_BACKEND_URL || '').replace(/\/+$/, '');
const HEALTH_PATH = (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health').replace(/^\/*/, '/');
const PING_TIMEOUT_MS = Number(process.env.REACT_APP_BACKEND_PING_TIMEOUT_MS || 15000);

// Estado interno
let currentBase = REMOTE_URL || '/api';
let inited = false;
let subscribers = new Set();
let usingRemoteSince = 0;

// Control de reintentos low-cost
let periodicTimer = null;
let lastVisibilityProbe = 0;
let debounceErrorProbe = 0;

// Persiste para siguientes cargas (acelera path feliz)
const LS_KEY = 'api:lastBase';

function safeJoin(base, path) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Ping con fetch + AbortController (evita cookies/CORS complejos)
async function ping(base, timeoutMs = PING_TIMEOUT_MS) {
  if (!base) return false;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // IMPORTANTE: Asegúrate que tu backend expone CORS en /health y responde 200.
    const url = safeJoin(base, HEALTH_PATH);
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    clearTimeout(id);
    // Consideramos OK cualquier 2xx
    return res.ok;
  } catch {
    clearTimeout(id);
    return false;
  }
}

function notifySubscribers(base) {
  subscribers.forEach(fn => {
    try { fn(base); } catch {}
  });
}

function setBase(base) {
  if (currentBase !== base && base) {
    currentBase = base.replace(/\/+$/, '');
    localStorage.setItem(LS_KEY, currentBase);
    notifySubscribers(currentBase);
  }
}

export function getCurrentBase() {
  return currentBase;
}

export function subscribeBaseChange(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

// ===== Inicialización (bloquea hasta decidir base) =====
export async function initBackendRouter() {
  if (inited) return currentBase;

  // Seed inicial: si ya teníamos última base, úsala provisionalmente
  const last = localStorage.getItem(LS_KEY);
  if (last) currentBase = last;

  // 1) Intentar LOCAL primero con timeout de 15s
  if (LOCAL_URL && await ping(LOCAL_URL, PING_TIMEOUT_MS)) {
    setBase(LOCAL_URL);
    inited = true;
    clearMonitor();
    return currentBase;
  }

  // 2) Fallback a REMOTO (si no hay remoto, caeremos a "/api")
  const fallback = REMOTE_URL || '/api';
  setBase(fallback);
  inited = true;

  // Si quedamos en remoto, armamos monitor barato para detectar si aparece el local
  usingRemoteSince = Date.now();
  setupMonitor();
  return currentBase;
}

// ===== Monitorización barata para volver a LOCAL si aparece =====
function clearMonitor() {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
  window.removeEventListener('online', onOnlineTryLocal);
  document.removeEventListener('visibilitychange', onVisibilityTryLocal);
}

function setupMonitor() {
  clearMonitor();

  if (!LOCAL_URL) return;
  if (currentBase === LOCAL_URL) return;

  // 1) Intervalo espaciado (3 min) solo si estamos usando remoto
  periodicTimer = setInterval(trySwitchToLocal, 180000);

  // 2) Evento de red: cuando vuelve a estar online
  window.addEventListener('online', onOnlineTryLocal);

  // 3) Evento de foco/visibilidad (máx 1 cada 8 min)
  document.addEventListener('visibilitychange', onVisibilityTryLocal);
}

async function trySwitchToLocal() {
  if (currentBase === LOCAL_URL) return; // ya estamos en local
  const ok = await ping(LOCAL_URL, Math.min(PING_TIMEOUT_MS, 4000)); // prueba corta
  if (ok) {
    setBase(LOCAL_URL);
    clearMonitor(); // ya no necesitamos monitorear
  }
}

function onOnlineTryLocal() {
  // Espera breve para estabilizar red
  setTimeout(trySwitchToLocal, 1000);
}

function onVisibilityTryLocal() {
  if (document.visibilityState !== 'visible') return;
  const now = Date.now();
  if (now - lastVisibilityProbe < 8 * 60 * 1000) return; // throttle 8 min
  lastVisibilityProbe = now;
  trySwitchToLocal();
}

// ===== Integración con Axios: ante "network error" podemos probar local una vez (debounced) =====
export function maybeProbeLocalOnNetworkError() {
  if (currentBase === LOCAL_URL) return;
  const now = Date.now();
  if (now - debounceErrorProbe < 30 * 1000) return; // máx 1 cada 30s
  debounceErrorProbe = now;
  // No bloquea la respuesta original; solo intenta en background
  trySwitchToLocal();
}