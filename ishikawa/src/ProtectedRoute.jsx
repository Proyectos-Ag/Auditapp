// ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from './App';

const ProtectedRoute = ({ children }) => {
  const { userData } = useContext(UserContext);

  if (!userData) {
    // Redirigir al login si no hay datos de usuario
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
