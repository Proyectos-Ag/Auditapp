import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';

const VistaRevicion = () => {
  const [datos, setDatos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/espreal`);
        setDatos(response.data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
  
    fetchDatos();
  }, []);  

  const formatearFecha = (fecha) => {
    const nuevaFecha = new Date(fecha);
    return nuevaFecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const navReporte = (_id) => {
    navigate(`/revicion/${_id}`);
};

  return (
    <div>
      <div className='cont-card-repo'>
      <h1>Auditorías en Revisión</h1>
      </div>
      {datos.length > 0 ? (
        <div className='cont-card-repo'>
        {datos.map((dato) => (
          <div key={dato._id} 
          className='card-repo'
          onClick={() => navReporte(dato._id)}
              style={{ cursor: 'pointer' }}>
             <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
             <p>Fecha Elaboración: {formatearFecha(dato.FechaElaboracion)}</p>
            <p>Tipo Auditoria: {dato.TipoAuditoria}</p>
            <p>Duración: {dato.Duracion}</p>
          </div>
        ))}
      </div>
      ) : (
        <h2 className='cont-card-repo'>No hay auditorías por revisar</h2>
      )}
    </div>
  );
};

export default VistaRevicion;