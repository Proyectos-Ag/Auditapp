import React, { useContext } from 'react';
import { UserContext } from './App';
import UnauthorizedPage from './components/Pag-error/UnauthorizedPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userData, loading } = useContext(UserContext);

  if (loading) {
    // Mientras AuthProvider sigue cargando, mostramos un indicador de carga o nada
    return <div>Cargando...</div>;
  }

  if (!userData) {
    return <UnauthorizedPage />;
  }

  // Verificar si el rol del usuario está permitido
  if (allowedRoles && !allowedRoles.includes(userData.TipoUsuario)) {
    // Permitir a los invitados ver páginas protegidas (solo lectura)
    if (userData.TipoUsuario === 'invitado') return children;

    // Permitir también si el usuario tiene un grant temporal activo (readonly)
    if (userData.temporaryGrant && userData.temporaryGrant.permisos === 'readonly') return children;
    return <UnauthorizedPage />; // O a una página de acceso denegado
  }

  return children; // Si el usuario tiene acceso, renderizamos el contenido
};

export default ProtectedRoute;