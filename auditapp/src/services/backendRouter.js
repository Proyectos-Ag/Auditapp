// Administra baseURL activa (local vs remoto) con decisión inicial veloz y reintentos low-cost.

const LOCAL_URL   = (process.env.REACT_APP_LOCAL_BACKEND_URL  || '').replace(/\/+$/, '');
const REMOTE_URL  = (process.env.REACT_APP_LINE_BACKEND_URL   || '').replace(/\/+$/, '');
const HEALTH_PATH = (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health').replace(/^\/*/, '/');

// Tiempos: afina según tu red
const PING_TIMEOUT_MS   = Number(process.env.REACT_APP_BACKEND_PING_TIMEOUT_MS || 1200); // ping rápido
const STAGGER_REMOTE_MS = 150;   // escalonado: arranca remoto 150ms después del local
const INITIAL_WINDOW_MS = 1000;  // ventana máxima para decidir base al inicio
const PERIODIC_MS       = 180000; // 3 min
const VIS_THROTTLE_MS   = 8 * 60 * 1000;
const ERROR_DEBOUNCE_MS = 30000;

const IDLE_RETRY_MS     = 4000;  // pings cortos en monitor
const LOCAL_STICKY_MS   = 2 * 60 * 1000; // si estamos en local, no soltar por fluctuaciones breves

function isHttpsPage() { return window.location.protocol === 'https:'; }
function isHttpUrl(u)  { return /^http:\/\//i.test(u || ''); }

// Opcional: bloquear LOCAL http si la página es https (evita mixed-content)
function isLocalAllowedInThisContext() {
  if (!LOCAL_URL) return false;
  if (isHttpsPage() && isHttpUrl(LOCAL_URL)) return false; // no se puede llamar a http desde https
  return true;
}

// Estado
let currentBase = REMOTE_URL || '/api';
let inited = false;
let subscribers = new Set();
let usingRemoteSince = 0;
let lastLocalOkAt = 0;

// Monitoreo
let periodicTimer = null;
let lastVisibilityProbe = 0;
let debounceErrorProbe = 0;

// Cross-tab sync
const chan = ('BroadcastChannel' in window) ? new BroadcastChannel('api-base') : null;
chan?.addEventListener('message', (ev) => {
  if (ev?.data?.type === 'BASE_CHANGED' && typeof ev.data.base === 'string') {
    setBase(ev.data.base, { fromChannel: true });
  }
});

// Persistencia
const LS_KEY = 'api:lastBase';

function safeJoin(base, path) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ping(base, timeoutMs = PING_TIMEOUT_MS) {
  if (!base) return { ok: false, t: timeoutMs };
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const url = safeJoin(base, HEALTH_PATH);
    const res = await fetch(url, {
      method: 'GET',            // GET por compatibilidad amplia (HEAD a veces falla en proxies)
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    clearTimeout(id);
    return { ok: res.ok, t: Math.max(1, Math.round(performance.now() - t0)) };
  } catch {
    clearTimeout(id);
    return { ok: false, t: Math.max(1, Math.round(performance.now() - t0)) };
  }
}

function notifySubscribers(base) {
  subscribers.forEach(fn => { try { fn(base); } catch {} });
}

function setBase(base, { fromChannel = false } = {}) {
  if (!base || currentBase === base) return;
  currentBase = base.replace(/\/+$/, '');
  localStorage.setItem(LS_KEY, currentBase);
  notifySubscribers(currentBase);
  if (!fromChannel) chan?.postMessage({ type: 'BASE_CHANGED', base: currentBase });
}

export function getCurrentBase() { return currentBase; }

export function subscribeBaseChange(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function clearMonitor() {
  if (periodicTimer) { clearInterval(periodicTimer); periodicTimer = null; }
  window.removeEventListener('online', onOnlineTryLocal);
  document.removeEventListener('visibilitychange', onVisibilityTryLocal);
}

function setupMonitor() {
  clearMonitor();
  if (!LOCAL_URL) return;
  if (currentBase === LOCAL_URL) return;
  periodicTimer = setInterval(trySwitchToLocal, PERIODIC_MS);
  window.addEventListener('online', onOnlineTryLocal);
  document.addEventListener('visibilitychange', onVisibilityTryLocal);
}

async function trySwitchToLocal() {
  if (currentBase === LOCAL_URL) return; // ya en local
  const { ok } = await ping(LOCAL_URL, Math.min(PING_TIMEOUT_MS, IDLE_RETRY_MS));
  if (ok) {
    lastLocalOkAt = Date.now();
    setBase(LOCAL_URL);
    clearMonitor();
  }
}

function onOnlineTryLocal() { setTimeout(trySwitchToLocal, 1000); }

function onVisibilityTryLocal() {
  if (document.visibilityState !== 'visible') return;
  const now = Date.now();
  if (now - lastVisibilityProbe < VIS_THROTTLE_MS) return;
  lastVisibilityProbe = now;
  trySwitchToLocal();
}

// Carrera “Happy-Eyeballs”: lanza LOCAL y, con leve retraso, REMOTO. Gana el primero OK.
async function raceProbe() {
  const results = { decided: false, base: null };

  const decide = (base, tag) => {
    if (!results.decided) {
      results.decided = true;
      results.base = base;
    }
  };

  const t0 = Date.now();

const localPromise = (async () => {
  if (!LOCAL_URL || !isLocalAllowedInThisContext()) return;
  const r = await ping(LOCAL_URL, PING_TIMEOUT_MS);
  if (r.ok) {
    lastLocalOkAt = Date.now();
    decide(LOCAL_URL, 'local-ok');
  }
})();


  const remotePromise = (async () => {
    if (!REMOTE_URL) return;
    await sleep(STAGGER_REMOTE_MS);
    const r = await ping(REMOTE_URL, PING_TIMEOUT_MS);
    if (r.ok) decide(REMOTE_URL, 'remote-ok');
  })();

  // Espera hasta ventana máxima o hasta que alguien decida
  const until = async (ms) => {
    const limit = Date.now() + ms;
    while (!results.decided && Date.now() < limit) {
      await sleep(20);
    }
  };

  await Promise.race([until(INITIAL_WINDOW_MS), Promise.allSettled([localPromise, remotePromise])]);

  // Preferencia por LOCAL: si ambos OK casi a la par, quédate con LOCAL
  if (!results.base) {
    // Ninguno contestó a tiempo: usa remoto o '/api' y monitorea
    return REMOTE_URL || '/api';
  }
  // Si decidió remoto pero local también respondió muy pronto, corregimos en ventana breve:
  if (results.base === REMOTE_URL && LOCAL_URL) {
    const dt = Date.now() - t0;
    // si la decisión fue muy temprana (<200ms), damos 200ms extra a local
    if (dt < 200) {
      const { ok } = await ping(LOCAL_URL, 200);
      if (ok) return LOCAL_URL;
    }
  }
  return results.base;
}

// ===== Inicialización =====
export async function initBackendRouter() {
  if (inited) return currentBase;

  // Semilla: mantener experiencia previa instantánea
  const last = localStorage.getItem(LS_KEY);
  if (last) currentBase = last;

  // Carrera rápida para confirmar
  const chosen = await raceProbe();
  setBase(chosen);
  inited = true;

  if (currentBase !== LOCAL_URL) {
    usingRemoteSince = Date.now();
    setupMonitor();
  } else {
    clearMonitor();
  }
  return currentBase;
}

// ===== Integración con Axios: “toque” ante error de red =====
export async function maybeRecoverOnNetworkError() {
  const now = Date.now();
  if (now - debounceErrorProbe < ERROR_DEBOUNCE_MS) return; // throttling 30s
  debounceErrorProbe = now;

  // Si estamos en LOCAL y falló la red, intentamos REMOTO (failover)
  if (currentBase === LOCAL_URL && REMOTE_URL) {
    const { ok } = await ping(REMOTE_URL, Math.min(PING_TIMEOUT_MS, IDLE_RETRY_MS));
    if (ok) {
      promoteBase(REMOTE_URL); // cambia base y arma monitor para volver a local
      return;
    }
  }

  // Si estamos en REMOTO, prueba si ya apareció el LOCAL (como ya hacías)
  if (currentBase !== LOCAL_URL && LOCAL_URL && isLocalAllowedInThisContext()) {
    trySwitchToLocal();
  }
}

// ===== API pública extra (opcional) =====
export function getConnectionStatus() {
  return {
    base: currentBase,
    isLocal: currentBase === LOCAL_URL,
    lastLocalOkAt,
    usingRemoteSince,
  };
}

export function getAlternateBase() {
  if (currentBase === LOCAL_URL && REMOTE_URL) return REMOTE_URL;
  if (currentBase !== LOCAL_URL && LOCAL_URL) return LOCAL_URL;
  return null;
}

export function promoteBase(base) {
  if (!base) return;
  setBase(base);
  // Si promocionamos a remoto, dejamos monitor para volver a local cuando aparezca
  if (currentBase !== LOCAL_URL) setupMonitor(); else clearMonitor();
}