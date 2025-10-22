import axios from 'axios';
import {
  initBackendRouter,
  getCurrentBase,
  subscribeBaseChange,
  maybeProbeLocalOnNetworkError,
  getAlternateBase,
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
      maybeProbeLocalOnNetworkError();

      // Evitar bucles
      if (!cfg._altTried) {
        const method = String(cfg.method || 'get').toLowerCase();
        const canRetry = IDEMPOTENT.has(method) || cfg.retryOnAlt === true; // opcional: permitir en endpoints que tú marques seguros
        const alt = getAlternateBase();

        if (canRetry && alt) {
          // Ping corto al alterno para no desperdiciar tiempo
          try {
            cfg._altTried = true;
            const test = await fetch(alt.replace(/\/+$/, '') + (process.env.REACT_APP_BACKEND_HEALTH_PATH || '/health'), {
              method: 'GET',
              cache: 'no-store',
              credentials: 'omit',
            });
            if (test.ok) {
              // Reintenta al vuelo en el alterno
              const newCfg = { ...cfg, baseURL: alt };
              return api.request(newCfg);
            }
          } catch {
            // Ignorar, caerá al reject original
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