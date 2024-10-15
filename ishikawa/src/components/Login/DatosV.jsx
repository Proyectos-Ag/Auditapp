import React from 'react';
import './css/datosv.css'; // Archivo CSS importado para los estilos

const DatosV = () => {

  return (
    <div className="modal-body">
        <h1>Versión 1.1 (Beta)</h1>
      <ul>
        <h3 className="modal-title">Cambios en la paleta de colores</h3>
        <li>Se ajustaron los tonos en la paleta de colores para ser mas agradables a la vista.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Cloud Storage </h3>
        <li>Se realizo la migración de imágenes a Cloud Storage por parte de Firebase, mejorando el rendimiento para la carga de diagramas.</li>
      </ul>

    </div>
  );
};

export default DatosV;