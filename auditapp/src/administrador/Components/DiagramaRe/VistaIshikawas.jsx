import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';

const VistaIshikawas = () => {
  const [ishikawas, setIshikawas] = useState([]);
  const [ishikawasInc, setIshikawasInc] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedYears, setExpandedYears] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/ishesp`);
        const responseInc = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/ishesp-inc`);
        setIshikawas(response.data);
        setIshikawasInc(responseInc.data);
        
        // Inicializar estado expandido para el año actual
        const currentYear = new Date().getFullYear();
        setExpandedYears({ [currentYear]: true });
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
  
    fetchDatos();
  }, []);  

  // Función corregida para formateo de fechas UTC
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    
    const nuevaFecha = new Date(fecha);
    if (isNaN(nuevaFecha)) return 'Fecha inválida';
    
    // Ajustar para problema de zona horaria
    nuevaFecha.setMinutes(nuevaFecha.getMinutes() + nuevaFecha.getTimezoneOffset());
    
    const dia = nuevaFecha.getDate();
    const mes = nuevaFecha.toLocaleString('es-ES', { month: 'long' });
    const año = nuevaFecha.getFullYear();
    
    return `${dia} de ${mes} de ${año}`;
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
        return 'black';
    }
  };

  const formatearEstado = (estado) => {
    return estado === 'Hecho' ? 'En revisión' : estado;
  };

  const navReporte = (_id) => {
    navigate(`/diagrama/${_id}`);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  // Agrupar ishikawas por año
  const agruparPorAnio = () => {
    const grupos = {};
    const currentYear = new Date().getFullYear();
    
    ishikawas.forEach(ishikawa => {
      const fecha = new Date(ishikawa.fecha);
      // Ajuste de zona horaria
      fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
      const year = fecha.getFullYear();
      
      if (!grupos[year]) {
        grupos[year] = [];
      }
      
      grupos[year].push(ishikawa);
    });
    
    return grupos;
  };

  const gruposPorAnio = agruparPorAnio();
  const anios = Object.keys(gruposPorAnio).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  return (
    <div>
      <div className='cont-card-repo'>
        <h1>Revisión de Ishikawa</h1>
        <button type="button" className='button-proc' onClick={handleOpenModal}>
          En proceso: {ishikawasInc.length} registros
        </button>
      </div>
      
      {/* Modal para mostrar los registros en proceso */}
      {showModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            className="modal-content" 
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              width: '80%',
              maxHeight: '80%',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <h2>En Proceso</h2>
            <button 
              onClick={handleCloseModal} 
              style={{
                color:'#fff',
                backgroundColor:'red',
                position: 'absolute',
                top: '10px',
                borderRadius:'8px',
                right: '10px'
              }}
            >
              Cerrar
            </button>
            {ishikawasInc.length > 0 ? (
              <div className='cont-card-repo-modal'>
                {ishikawasInc.map((ishikawa) => (
                  <div 
                    key={ishikawa._id} 
                    className='card-repo-ish'
                    onClick={() => navReporte(ishikawa._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
                    <p>Fecha Elaboración: {formatearFecha(ishikawa.fechaElaboracion)}</p>
                    <p>Realizado por: {ishikawa.auditado}</p>
                    <p style={{ color: ishikawa.estado === 'Incompleto' ? 'orange' : obtenerColorEstado(ishikawa.estado) }}>
                      Estado: {ishikawa.estado === 'Incompleto' ? 'En proceso' : formatearEstado(ishikawa.estado)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <h2 className='cont-card-repo'>No hay ishikawas en proceso.</h2>
            )}
          </div>
        </div>
      )}

      <div className='cont-card-repo'>
        {anios.length > 0 ? (
          anios.map(year => {
            const yearInt = parseInt(year);
            const isCurrentYear = yearInt === currentYear;
            const isExpanded = expandedYears[year] || isCurrentYear;

            return (
              <React.Fragment key={year}>
                {!isCurrentYear && (
                  <div 
                    onClick={() => toggleYear(year)}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      cursor: 'pointer',
                      margin: '10px 0',
                      borderRadius: '5px',
                      fontWeight: 'bold'
                    }}
                  >
                    Año: {year} {isExpanded ? '▲' : '▼'}
                  </div>
                )}
                
                {isExpanded && gruposPorAnio[year].map(ishikawa => (
                  <div 
                    key={ishikawa._id} 
                    className='card-repo-ish'
                    onClick={() => navReporte(ishikawa._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
                    <p>Fecha Elaboración: {formatearFecha(ishikawa.fecha)}</p>
                    <p>Realizado por: {ishikawa.auditado}</p>
                    <p style={{ color: obtenerColorEstado(ishikawa.estado) }}>
                      Estado: {formatearEstado(ishikawa.estado)}
                    </p>
                  </div>
                ))}
              </React.Fragment>
            );
          })
        ) : (
          <h2>No hay ishikawas por revisar.</h2>
        )}
      </div>
    </div>
  );
};

export default VistaIshikawas;