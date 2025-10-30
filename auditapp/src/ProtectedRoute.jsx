import React, { useContext } from 'react';
import { UserContext } from './App';
import UnauthorizedPage from './components/Pag-error/UnauthorizedPage';

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { userData, loading } = useContext(UserContext);
  if (loading) return <div>Cargando...</div>;

  // Bloquea si el token no existe o ya expiró
  const token = localStorage.getItem('authToken');
  const payload = token ? decodeJwt(token) : null;
  const isExpired = !token || !payload?.exp || Date.now() >= payload.exp * 1000;
  if (isExpired) return <UnauthorizedPage />;

  // Bloquea si no hay usuario cargado
  if (!userData) return <UnauthorizedPage />;

  // Roles permitidos (normalizados a minúsculas)
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = (userData.TipoUsuario ?? userData.tipoUsuario ?? '').toLowerCase();
    const ok =
      allowedRoles.map(String).map(r => r.toLowerCase()).includes(userRole) ||
      userRole === 'invitado' ||
      userData.temporaryGrant?.permisos === 'readonly';
    if (!ok) return <UnauthorizedPage />;
  }

  return children;
}