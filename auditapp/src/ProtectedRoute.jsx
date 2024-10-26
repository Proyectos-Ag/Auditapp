import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from './App';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userData, loading } = useContext(UserContext);

  if (loading) {
    // Mientras AuthProvider sigue cargando, mostramos un indicador de carga o nada
    return <div>Cargando...</div>;
  }

  if (!userData) {
    // Si no hay datos de usuario (después de cargar), redirigir al login
    return <Navigate to="/" replace />;
  }

  // Verificar si el rol del usuario está permitido
  if (allowedRoles && !allowedRoles.includes(userData.TipoUsuario)) {
    return <Navigate to="/" replace />; // O a una página de acceso denegado
  }

  return children; // Si el usuario tiene acceso, renderizamos el contenido
};

export default ProtectedRoute;