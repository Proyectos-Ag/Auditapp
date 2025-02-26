import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1>Error 401 - No autorizado</h1>
    <p>No tienes acceso a esta página. Por favor, inicia sesión para continuar.</p>
    <Link to="/login">Ir a Iniciar Sesión</Link>
  </div>
);

export default UnauthorizedPage;
