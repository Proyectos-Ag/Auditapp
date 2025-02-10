import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';

const VistaIshikawas = () => {
  const [ishikawas, setIshikawas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/ishesp`);
        setIshikawas(response.data);
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

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Hecho':
        return 'yellow';
      case 'Rechazado':
        return 'red';
      case 'Aprobado':
        return 'blue';
      case 'Finalizado':
        return 'green';
      default:
        return 'black'; // Color por defecto
    }
  };

   // Función para formatear el texto del estado
   const formatearEstado = (estado) => {
    return estado === 'Hecho' ? 'En revisión' : estado;
  };

  const navReporte = (_id) => {
    navigate(`/diagrama/${_id}`);
};

  return (
    <div>
      <div className='cont-card-repo'>
      <h1>Revisión de Ishikawa</h1>
      </div>
      {ishikawas.length > 0 ? (
        <div className='cont-card-repo'>
        {ishikawas.map((ishikawa) => (
          <div key={ishikawa._id} 
          className='card-repo-ish'
          onClick={() => navReporte(ishikawa._id)}
              style={{ cursor: 'pointer' }}>
             <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
             <p>Fecha Elaboración: {formatearFecha(ishikawa.fecha)}</p>
            <p>Realizado por: {ishikawa.auditado}</p>
            <p style={{ color: obtenerColorEstado(ishikawa.estado) }}>
            Estado: {formatearEstado(ishikawa.estado)}
              </p>
          </div>
        ))}
      </div>
      ) : (
        <h2 className='cont-card-repo'>No hay ishikawas por revisar.</h2>
      )}
    </div>
  );
};

export default VistaIshikawas;