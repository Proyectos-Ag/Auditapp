import axios from 'axios';
import { initBackendRouter, getCurrentBase, subscribeBaseChange, maybeProbeLocalOnNetworkError } from './backendRouter';

export const api = axios.create({
  baseURL: getCurrentBase(),
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// Añade Authorization si hay token en localStorage
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('authToken');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

subscribeBaseChange((newBase) => { api.defaults.baseURL = newBase; });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isNetworkErr = err.code === 'ECONNABORTED' || err.message === 'Network Error' || err?.response == null;
    if (isNetworkErr) maybeProbeLocalOnNetworkError();
    return Promise.reject(err);
  }
);

export async function initApi() {
  await initBackendRouter();
  api.defaults.baseURL = getCurrentBase();
}

export default api;
