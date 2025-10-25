import axios from 'axios';
import {
  initBackendRouter,
  getCurrentBase,
  subscribeBaseChange,
  maybeRecoverOnNetworkError,
  getAlternateBase,
  promoteBase,
} from './backendRouter';

// Axios principal
export const api = axios.create({
  baseURL: getCurrentBase(),
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// Token + header de diagnóstico
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('authToken');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  config.headers['X-Client-Base'] = getCurrentBase();
  return config;
});

// Mantener baseURL sincronizada en runtime
subscribeBaseChange((newBase) => { api.defaults.baseURL = newBase; });

// Reintento en errores de red (con failover inmediato)
const IDEMPOTENT = new Set(['get', 'head', 'options']);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err?.config || {};
    const isNetworkErr =
      err?.code === 'ECONNABORTED' ||
      err?.message === 'Network Error' ||
      err?.response == null;

    if (!isNetworkErr) return Promise.reject(err);

    // 1) Dispara recuperación (switch base guardado en sessionStorage)
    await maybeRecoverOnNetworkError();

    // 2) Intento inmediato con base alterna (transparente)
    if (!cfg._altTried) {
      const method = String(cfg.method || 'get').toLowerCase();
      const canRetry = IDEMPOTENT.has(method) || cfg.retryOnAlt === true;
      const alt = getAlternateBase();

      if (alt && canRetry) {
        try {
          cfg._altTried = true;

          // Health corto para no encallar
          const healthUrl = alt.replace(/\/+$/, '') + (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health');
          const test = await fetch(healthUrl, { method: 'GET', cache: 'no-store', credentials: 'omit' });
          if (test.ok) {
            const newCfg = { ...cfg, baseURL: alt };
            const resp = await api.request(newCfg);
            // ¡Funciona! Promociona y persiste en sessionStorage
            promoteBase(alt);
            return resp;
          }
        } catch {
          // caemos al reject original abajo
        }
      }
    }
    return Promise.reject(err);
  }
);

// Inicialización (decide base al arranque, sin bloquear de más)
export async function initApi() {
  await initBackendRouter();
  api.defaults.baseURL = getCurrentBase();
}

export default api;