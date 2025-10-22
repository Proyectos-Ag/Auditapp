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

// Token
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('authToken');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  // Útil para diagnosticar en el backend
  config.headers['X-Client-Base'] = getCurrentBase();
  return config;
});

// Mantener baseURL sincronizada si cambia en runtime
subscribeBaseChange((newBase) => { api.defaults.baseURL = newBase; });

// Reintento transparente en errores de red (solo métodos idempotentes por seguridad)
const IDEMPOTENT = new Set(['get', 'head', 'options']);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err?.config || {};
    const isNetworkErr = err?.code === 'ECONNABORTED' || err?.message === 'Network Error' || err?.response == null;

    if (isNetworkErr) {
      // Recuperación bidireccional: LOCAL→REMOTO o REMOTO→LOCAL
      maybeRecoverOnNetworkError();

      if (!cfg._altTried) {
        const method = String(cfg.method || 'get').toLowerCase();
        const canRetry = IDEMPOTENT.has(method) || cfg.retryOnAlt === true;
        const alt = getAlternateBase();

        if (canRetry && alt) {
          try {
            cfg._altTried = true;
            const healthUrl = alt.replace(/\/+$/, '') + (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health');
            const test = await fetch(healthUrl, { method: 'GET', cache: 'no-store', credentials: 'omit' });
            if (test.ok) {
              const newCfg = { ...cfg, baseURL: alt };
              const resp = await api.request(newCfg);
              // ¡Listo! el alterno funciona → lo promocionamos para siguientes requests
              promoteBase(alt);
              return resp;
            }
          } catch {
            // caer al reject original
          }
        }
      }
    }
    return Promise.reject(err);
  }
);

// Inicialización (bloquea lo mínimo necesario para decidir base)
export async function initApi() {
  await initBackendRouter();
  api.defaults.baseURL = getCurrentBase();
}

export default api;