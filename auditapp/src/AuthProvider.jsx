import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from './services/api';
import { UserContext } from './App';

const MySwal = withReactContent(Swal);

// Ajusta estas ventanas a gusto:
const SKEW_MS = 2000;                // pequeño margen antes de expirar
const WARN_MAX_MS = 5 * 60 * 1000;   // máx. 5 min antes (producción)
const WARN_MIN_MS = 15000;           // mín. 15 s antes (dev tokens cortos)

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutTimerRef = useRef(null);
  const warnTimerRef   = useRef(null);

  function clearTimers() {
    if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
    if (warnTimerRef.current)   { clearTimeout(warnTimerRef.current);   warnTimerRef.current = null; }
  }

  async function forceLogout(showAlert = true) {
    clearTimers();
    localStorage.removeItem('authToken');
    setUserData(null);
    const onLogin = window.location.pathname.includes('/');
    if (showAlert && !onLogin) {
      await MySwal.fire({
        icon: 'warning',
        title: 'Sesión finalizada',
        text: 'Tu sesión ha expirado. Vuelve a iniciar.',
        confirmButtonText: 'Entendido',
      });
      window.location.href = '/';
    } else if (!onLogin) {
      window.location.href = '/';
    }
  }

  async function renewSession() {
    try {
      // Importante: api ya adjunta Authorization
      const { data } = await api.post('/auth/renew', { ttl: '1h' }); // opcional ttl
      const newToken = data?.token || data?.accessToken;
      if (!newToken) throw new Error('Sin token');
      localStorage.setItem('authToken', newToken);
      scheduleSessionTimers(newToken); // reprograma warning + logout
      // feedback discreto
      MySwal.fire({ toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, icon: 'success', title: 'Sesión extendida +1h' });
      return true;
    } catch (e) {
      await MySwal.fire({ icon: 'warning', title: 'No se pudo extender', text: 'Tu sesión ya expiró o no fue posible renovarla.' });
      await forceLogout(false);
      return false;
    }
  }

  async function showExtendPrompt(msLeft) {
    // Evita spam de prompts entre pestañas: respeta un “cooldown” global
    const last = Number(localStorage.getItem('AUTH_PROMPT_AT') || 0);
    if (Date.now() - last < 10000) return; // 10s de ventana
    localStorage.setItem('AUTH_PROMPT_AT', String(Date.now()));

    // Pequeño countdown visual
    let seconds = Math.max(1, Math.floor(msLeft / 1000));
    const { isConfirmed } = await MySwal.fire({
      title: '¿Extender tu sesión?',
      html: `Tu sesión caducará en <b>${seconds}s</b>.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Extender +1 hora',
      cancelButtonText: 'Cerrar sesión',
      allowOutsideClick: false,
      didOpen: () => {
        const h = setInterval(() => {
          seconds = Math.max(0, seconds - 1);
          const b = MySwal.getHtmlContainer()?.querySelector('b');
          if (b) b.textContent = `${seconds}s`;
          if (seconds <= 0) clearInterval(h);
        }, 1000);
      },
    });

    if (isConfirmed) {
      await renewSession();
    } else {
      await forceLogout(false);
    }
  }

  function scheduleSessionTimers(token) {
    clearTimers();
    if (!token) return;

    const p = decodeJwt(token);
    const expMs = p?.exp ? p.exp * 1000 : null;
    if (!expMs) return;

    const now = Date.now();
    const msLeft = Math.max(expMs - now - SKEW_MS, 0);

    // Calcula una ventana de aviso agradable según lo que falte
    const warnWindow = Math.min(WARN_MAX_MS, Math.max(WARN_MIN_MS, Math.floor(msLeft * 0.15)));
    const warnDelay  = Math.max(msLeft - warnWindow, 0);

    // Programa aviso
    warnTimerRef.current = setTimeout(() => {
      // Si la pestaña no está visible, evita múltiple prompts simultáneos
      if (document.hidden) return; 
      const t = localStorage.getItem('authToken');
      const pp = t ? decodeJwt(t) : null;
      const left = pp?.exp ? Math.max(pp.exp * 1000 - Date.now() - SKEW_MS, 0) : 0;
      if (left > 0) showExtendPrompt(left);
    }, warnDelay);

    // Programa logout duro (si el user no aceptó renovar)
    logoutTimerRef.current = setTimeout(() => {
      forceLogout(true);
    }, msLeft);
  }

  // Verificación al montar
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setUserData(null); return; }

        scheduleSessionTimers(token);

        const { data } = await api.get('/auth/verifyToken');
        const user = data.user ?? data;
        setUserData(user);
      } catch {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => clearTimers();
  }, []);

  // Responder a 401 global (enviado por api.js)
  useEffect(() => {
    const handler = () => forceLogout(true);
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // Reprogramar al recuperar foco/visibilidad
  useEffect(() => {
    const onWake = () => {
      const t = localStorage.getItem('authToken');
      if (!t) return forceLogout(false);
      const p = decodeJwt(t);
      if (!p?.exp || Date.now() >= p.exp * 1000 - 500) {
        // Si al volver ya expiró, damos chance de renovar (UX mejor)
        showExtendPrompt(5000); // 5s simbólicos; si ya expiró, renew fallará y deslogueamos
      } else {
        scheduleSessionTimers(t);
      }
    };
    window.addEventListener('focus', onWake);
    const onVis = () => document.visibilityState === 'visible' && onWake();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Sincronización entre pestañas (token renovado o removido)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'authToken') {
        const t = e.newValue;
        if (!t) forceLogout(false);
        else scheduleSessionTimers(t);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading) return null;

  return (
    <UserContext.Provider value={{ userData, setUserData, loading }}>
      {children}
    </UserContext.Provider>
  );
}