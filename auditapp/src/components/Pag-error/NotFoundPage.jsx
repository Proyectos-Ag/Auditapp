import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1>Error 404 - Página no encontrada</h1>
    <p>La ruta que busca no existe.</p>
    <Link to="/">Volver al inicio</Link>
  </div>
);

export default NotFoundPage;
