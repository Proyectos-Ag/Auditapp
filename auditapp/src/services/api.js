// src/services/api.js
import axios from 'axios';
import { initBackendRouter, getCurrentBase, subscribeBaseChange, maybeProbeLocalOnNetworkError } from './backendRouter';

export const api = axios.create({
  baseURL: getCurrentBase(),
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// Actualiza el baseURL cuando backendRouter cambie
subscribeBaseChange((newBase) => {
  api.defaults.baseURL = newBase;
});

// Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers?.Authorization) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

// Errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Si es un error de red/timeout, intentamos detectar si el local ya está disponible.
    const isNetworkErr =
      err.code === 'ECONNABORTED' ||
      err.message === 'Network Error' ||
      err?.response == null; // sin respuesta HTTP

    if (isNetworkErr) {
      maybeProbeLocalOnNetworkError();
    }
    return Promise.reject(err);
  }
);

// Inicialización explícita (se llama antes de montar la app)
export async function initApi() {
  await initBackendRouter();
  api.defaults.baseURL = getCurrentBase();
}

export default api;