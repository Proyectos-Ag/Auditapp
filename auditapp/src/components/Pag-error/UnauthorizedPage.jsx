import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1>Error 401 - No autorizado</h1>
    <p>No tiene acceso a esta página. Por favor, inicie sesión para continuar.</p>
    <Link to="/">Ir a Iniciar Sesión</Link>
  </div>
);

export default UnauthorizedPage;
