import axios from 'axios';
import {
  initBackendRouter,
  getCurrentBase,
  subscribeBaseChange,
  maybeRecoverOnNetworkError,
  getAlternateBase,
  promoteBase,
} from './backendRouter';

const AUTH_FREE_PATHS = new Set(['/login']);

function resolvePathname(urlLike) {
  try {
    const base = getCurrentBase() || window.location.origin;
    return new URL(urlLike, base).pathname;
  } catch {
    return String(urlLike || '/');
  }
}
function isAuthFree(urlLike) {
  return AUTH_FREE_PATHS.has(resolvePathname(urlLike));
}

// Axios principal
export const api = axios.create({
  baseURL: getCurrentBase(),
  timeout: 15000,
  withCredentials: false,           // ← SIN cookies
  headers: { Accept: 'application/json' },
});

// Token + header diagnóstico
api.interceptors.request.use((config) => {
  if (!isAuthFree(config.url)) {
    const t = localStorage.getItem('authToken');
    if (t) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  config.headers = config.headers || {};
  config.headers['X-Client-Base'] = getCurrentBase();
  return config;
});

// Mantener baseURL sincronizada en runtime
subscribeBaseChange((newBase) => {
  api.defaults.baseURL = newBase;
});

// Métodos idempotentes reintentan en base alterna
const IDEMPOTENT = new Set(['get', 'head', 'options']);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err?.config || {};
    const status = err?.response?.status;

    // 1) 401 → cerrar sesión (sin refresh)
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(err);
    }

    // 2) Errores de red → tu failover
    const isNetworkErr =
      err?.code === 'ECONNABORTED' ||
      err?.message === 'Network Error' ||
      err?.response == null;

    if (!isNetworkErr) return Promise.reject(err);

    try { await maybeRecoverOnNetworkError(); } catch {}

    if (!cfg._altTried) {
      const method = String(cfg.method || 'get').toLowerCase();
      const canRetry = IDEMPOTENT.has(method) || cfg.retryOnAlt === true;
      const alt = getAlternateBase();

      if (alt && canRetry) {
        try {
          cfg._altTried = true;
          const healthUrl = alt.replace(/\/+$/, '') + (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health');
          const test = await fetch(healthUrl, { method: 'GET', cache: 'no-store', credentials: 'omit' });
          if (test.ok) {
            const newCfg = { ...cfg, baseURL: alt };
            const resp = await api.request(newCfg);
            promoteBase(alt);
            return resp;
          }
        } catch {}
      }
    }
    return Promise.reject(err);
  }
);

// Inicialización
export async function initApi() {
  await initBackendRouter();
  api.defaults.baseURL = getCurrentBase();
}

export default api;
