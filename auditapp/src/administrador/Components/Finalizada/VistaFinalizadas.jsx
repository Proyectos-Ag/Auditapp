import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';

const VistaFinalizadas = () => {
  const [datos, setDatos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/espfin`);
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

  const getDateLabel = (fecha) => {
    const recordDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    recordDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays === 2) return "Hace 2 días";
    if (diffDays >= 3 && diffDays < 7) return "Esta semana";
    if (
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    ) {
      return "Este mes";
    }
  
    // Para fechas de hace 30 días o más
    const options = { month: 'long' };
    if (recordDate.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    return recordDate.toLocaleDateString('es-ES', options);
  };  

  const datosOrdenados = datos.slice().reverse();

  const navReporte = (_id) => {
    navigate(`/finalizadas/${_id}`);
};

  return (
    <div>
      <div className='cont-card-repo'>
      <h1>Auditorías Finalizadas</h1>
      </div>
      {datos.length > 0 ? (
      <div className='cont-card-repo'>
        {datosOrdenados.map((dato, index) => {
            const currentLabel = getDateLabel(dato.FechaElaboracion);
            let showDivider = false;
            if (index === 0) {
              showDivider = true;
            } else {
              const previousLabel = getDateLabel(datosOrdenados[index - 1].FechaElaboracion);
              if (currentLabel !== previousLabel) {
                showDivider = true;
              }
            }
            return (
              <React.Fragment key={dato._id}>
                {showDivider && <div className="divider" data-label={currentLabel}></div>}
                <div
                  className='card-repo'
                  onClick={() => navReporte(dato._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
                  <p>Fecha Elaboración: {formatearFecha(dato.FechaElaboracion)}</p>
                  <p>Tipo Auditoria: {dato.TipoAuditoria}</p>
                  <p>Duración: {dato.Duracion}</p>
                  {dato.Cliente && <p>Cliente: {dato.Cliente}</p>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <h2 className='cont-card-repo'>No hay auditorías finalizadas</h2>
      )}
    </div>
  );
};

export default VistaFinalizadas;