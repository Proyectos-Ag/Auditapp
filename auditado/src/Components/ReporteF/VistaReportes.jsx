import React, { useEffect, useState,useContext } from 'react';
import axios from 'axios';
import './css/VistaR.css'
import logo from '../../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';
import Navigation from '../Navigation/navbar';
import { UserContext } from '../../App';

const VistaReportes = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/esp/aud`, {
          params: { correo: userData.Correo },
        });
        setDatos(response.data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
  
    fetchDatos();
  }, [userData]);   

  const formatearFecha = (fecha) => {
    const nuevaFecha = new Date(fecha);
    return nuevaFecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const navReporte = (_id) => {
    navigate(`/reporte/${_id}`);
};

  return (
    <div>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <Navigation />
      </div>
      <div className='cont-card-repo'>
      <h1>Revisión de Ishikawa</h1>
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
        <p>No se encontraron datos.</p>
      )}
    </div>
  );
};

export default VistaReportes;