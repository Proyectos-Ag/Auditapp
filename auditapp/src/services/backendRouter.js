// Administra baseURL activa (local vs remoto) con decisión inicial veloz y failover inmediato.
// ► Persistencia en sessionStorage (no localStorage) y sync cross-tab.

const LOCAL_URL   = (process.env.REACT_APP_LOCAL_BACKEND_URL  || '').replace(/\/+$/, '');
const REMOTE_URL  = (process.env.REACT_APP_LINE_BACKEND_URL   || '').replace(/\/+$/, '');
const HEALTH_PATH = (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health').replace(/^\/*/, '/');

// Timings (ajusta a tu red si gustas)
const PING_TIMEOUT_MS   = Number(process.env.REACT_APP_BACKEND_PING_TIMEOUT_MS || 1200);
const STAGGER_REMOTE_MS = 150;      // Remoto arranca 150ms después del local
const INITIAL_WINDOW_MS = 1000;     // Máximo para decidir base en init
const PERIODIC_MS       = 180000;   // 3 min: vigilante para volver a LOCAL
const VIS_THROTTLE_MS   = 8 * 60 * 1000;
const ERROR_DEBOUNCE_MS = 8000;     // más corto para failover rápido

const IDLE_RETRY_MS     = 4000;
const LOCAL_STICKY_MS   = 2 * 60 * 1000; // evita flapping si LOCAL volvió hace poco

function isHttpsPage() { return typeof window !== 'undefined' && window.location.protocol === 'https:'; }
function isHttpUrl(u)  { return /^http:\/\//i.test(u || ''); }
function isLocalAllowedInThisContext() {
  if (!LOCAL_URL) return false;
  if (isHttpsPage() && isHttpUrl(LOCAL_URL)) return false; // mixed-content
  return true;
}

// =========================== Persistencia (sessionStorage) ===========================
const SS_KEY = 'api:base';
const STORE = (() => {
  try {
    // En algunos contextos puede lanzar (privacy modes)
    return window.sessionStorage;
  } catch {
    // Fallback in-memory (misma API)
    const mem = {};
    return {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
    };
  }
})();

// (opcional) limpia residuos viejos en localStorage
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('api:lastBase'); // clave vieja
  }
} catch { /* ignore */ }

// =============================== Estado y eventos ===============================
let currentBase = REMOTE_URL || '/api';
let inited = false;
let subscribers = new Set();
let usingRemoteSince = 0;
let lastLocalOkAt = 0;

let periodicTimer = null;
let lastVisibilityProbe = 0;
let debounceErrorProbe = 0;

const chan = ('BroadcastChannel' in window) ? new BroadcastChannel('api-base') : null;
chan?.addEventListener('message', (ev) => {
  if (ev?.data?.type === 'BASE_CHANGED' && typeof ev.data.base === 'string') {
    setBase(ev.data.base, { fromChannel: true });
  }
});

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
      method: 'GET',
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

function persistBaseInSession(base) {
  try {
    // Forzamos borrado y set para cumplir tu requisito explícito
    STORE.removeItem(SS_KEY);
    STORE.setItem(SS_KEY, base);
  } catch { /* ignore */ }
}

function setBase(base, { fromChannel = false } = {}) {
  if (!base) return;
  const cleaned = base.replace(/\/+$/, '');
  if (currentBase === cleaned) return;

  currentBase = cleaned;
  persistBaseInSession(currentBase);
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
  if (currentBase === LOCAL_URL) return;
  if (!isLocalAllowedInThisContext()) return;
  // Evita soltar REMOTO si LOCAL apenas "revivió"
  if (Date.now() - lastLocalOkAt < LOCAL_STICKY_MS) return;

  const { ok } = await ping(LOCAL_URL, Math.min(PING_TIMEOUT_MS, IDLE_RETRY_MS));
  if (ok) {
    lastLocalOkAt = Date.now();
    setBase(LOCAL_URL);
    clearMonitor();
  }
}

function onOnlineTryLocal() { setTimeout(trySwitchToLocal, 500); }
function onVisibilityTryLocal() {
  if (document.visibilityState !== 'visible') return;
  const now = Date.now();
  if (now - lastVisibilityProbe < VIS_THROTTLE_MS) return;
  lastVisibilityProbe = now;
  trySwitchToLocal();
}

// Carrera estilo "Happy Eyeballs"
async function raceProbe() {
  const results = { decided: false, base: null };
  const decide = (base) => { if (!results.decided) { results.decided = true; results.base = base; } };
  const t0 = Date.now();

  const localPromise = (async () => {
    if (!LOCAL_URL || !isLocalAllowedInThisContext()) return;
    const r = await ping(LOCAL_URL, PING_TIMEOUT_MS);
    if (r.ok) { lastLocalOkAt = Date.now(); decide(LOCAL_URL); }
  })();

  const remotePromise = (async () => {
    if (!REMOTE_URL) return;
    await sleep(STAGGER_REMOTE_MS);
    const r = await ping(REMOTE_URL, PING_TIMEOUT_MS);
    if (r.ok) decide(REMOTE_URL);
  })();

  const until = async (ms) => {
    const limit = Date.now() + ms;
    while (!results.decided && Date.now() < limit) { await sleep(20); }
  };
  await Promise.race([until(INITIAL_WINDOW_MS), Promise.allSettled([localPromise, remotePromise])]);

  if (!results.base) return REMOTE_URL || '/api';

  if (results.base === REMOTE_URL && LOCAL_URL) {
    const dt = Date.now() - t0;
    if (dt < 200) {
      const { ok } = await ping(LOCAL_URL, 200);
      if (ok) return LOCAL_URL;
    }
  }
  return results.base;
}

// ============================== Inicialización ===============================
export async function initBackendRouter() {
  if (inited) return currentBase;

  // Semilla desde sessionStorage
  const last = STORE.getItem(SS_KEY);
  if (last) currentBase = last;

  // Confirmación con carrera
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

// ============================== Failover rápido ===============================
export async function maybeRecoverOnNetworkError() {
  const now = Date.now();
  if (now - debounceErrorProbe < ERROR_DEBOUNCE_MS) return; // throttling
  debounceErrorProbe = now;

  // Si estamos en LOCAL y falló, intenta REMOTO y promociona si está OK
  if (currentBase === LOCAL_URL && REMOTE_URL) {
    const { ok } = await ping(REMOTE_URL, Math.min(PING_TIMEOUT_MS, IDLE_RETRY_MS));
    if (ok) {
      promoteBase(REMOTE_URL);
      return;
    }
  }

  // Si estamos en REMOTO, prueba si LOCAL ya está disponible
  if (currentBase !== LOCAL_URL && LOCAL_URL && isLocalAllowedInThisContext()) {
    trySwitchToLocal();
  }
}

// =============================== API pública extra ===============================
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
  if (currentBase !== LOCAL_URL) setupMonitor();
  else clearMonitor();
}