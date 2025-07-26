import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GestionCambioPDF from './GestionCambioPDF';
import './css/GestionList.css';

const GestionCambioList = () => {
  const [gestiones, setGestiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGestiones = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio`);
        setGestiones(response.data);
      } catch (err) {
        console.error('Error al obtener gestiones:', err);
        setError('No se pudieron cargar los registros. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchGestiones();
  }, []);

  // Función para renderizar campos con valores
  const renderField = (label, value, important = false) => (
    <div className={`gcl-field ${important ? 'gcl-important' : ''}`}>
      <span className="gcl-field-label">{label}:</span>
      <span className="gcl-field-value">{value || '-'}</span>
    </div>
  );

  // Función para renderizar campos booleanos
  const renderBooleanField = (label, value) => (
    <div className="gcl-field">
      <span className="gcl-field-label">{label}:</span>
      <span className={`gcl-boolean ${value ? 'gcl-true' : 'gcl-false'}`}>
        {value ? 'Sí' : 'No'}
      </span>
    </div>
  );

  if (loading) return (
    <div className="gcl-loading-container">
      <div className="gcl-spinner"></div>
      <p className="gcl-loading-text">Cargando registros...</p>
    </div>
  );
  
  if (error) return (
    <div className="gcl-error-container">
      <div className="gcl-error-icon">⚠️</div>
      <p className="gcl-error-text">{error}</p>
      <button className="gcl-retry-button" onClick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="gcl-container">
      <div className="gcl-header-container">
        <h1 className="gcl-header">Registros de Gestión de Cambio</h1>
        <div className="gcl-stats">
          <span className="gcl-stat-card">
            <strong>{gestiones.length}</strong> solicitudes
          </span>
          <span className="gcl-stat-card">
            <strong>{gestiones.filter(g => g.firmadoPor?.aprobador?.nombre).length}</strong> aprobadas
          </span>
        </div>
      </div>
      
      {gestiones.length === 0 ? (
        <div className="gcl-no-data-container">
          <div className="gcl-no-data-icon">📭</div>
          <p className="gcl-no-data-text">No hay registros disponibles</p>
          <p className="gcl-no-data-subtext">Crea una nueva solicitud para comenzar</p>
        </div>
      ) : (
        <div className="gcl-grid">
          {gestiones.map((item) => (
            <div key={item._id} className="gcl-card">
              <div className="gcl-card-header">
                <div className="gcl-card-id">Solicitud ID: {item._id}</div>
                <div className="gcl-card-date">
                  {new Date(item.fechaSolicitud).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              <div className="gcl-card-body">
                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">📋</span>
                    Datos de la solicitud
                  </h3>
                  <div className="gcl-grid-fields">
                    {renderField("Solicitante", item.solicitante, true)}
                    {renderField("Área solicitante", item.areaSolicitante)}
                    {renderField("Lugar", item.lugar)}
                    {renderField("Líder de proyecto", item.liderProyecto)}
                    {renderField("Fecha planeada", 
                      new Date(item.fechaPlaneada).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    )}
                  </div>
                </div>

                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">📊</span>
                    Alcance del cambio
                  </h3>
                  <div className="gcl-grid-fields">
                    {renderField("Tipo de cambio", item.tipoCambio, true)}
                    {renderField("Productos", item.productos)}
                    {renderField("Sistemas/Equipos", item.sistemasEquipos)}
                    {renderField("Locales de producción", item.localesProduccion)}
                    {renderField("Programas de limpieza", item.programasLimpieza)}
                    {renderField("Sistemas de embalaje", item.sistemasEmbalaje)}
                    {renderField("Niveles de personal", item.nivelesPersonal)}
                    {renderField("Requisitos legales", item.requisitosLegales)}
                    {renderField("Conocimientos de peligros", item.conocimientosPeligros)}
                    {renderField("Requisitos del cliente", item.requisitosCliente)}
                    {renderField("Consultas a partes", item.consultasPartes)}
                    {renderField("Quejas de peligros", item.quejasPeligros)}
                    {renderField("Otras condiciones", item.otrasCondiciones)}
                  </div>
                </div>

                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">🔍</span>
                    Causa
                  </h3>
                  <div className="gcl-grid-fields">
                    {renderBooleanField("Solicitud cliente", item.causa?.solicitudCliente)}
                    {renderBooleanField("Reparación defecto", item.causa?.reparacionDefecto)}
                    {renderBooleanField("Acción preventiva", item.causa?.accionPreventiva)}
                    {renderBooleanField("Actualización documento", item.causa?.actualizacionDocumento)}
                    {renderBooleanField("Acción correctiva", item.causa?.accionCorrectiva)}
                    {renderField("Otros", item.causa?.otros)}
                  </div>
                </div>

                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">📝</span>
                    Descripción propuesta
                  </h3>
                  <div className="gcl-text-content">
                    {item.descripcionPropuesta || 'Sin descripción proporcionada'}
                  </div>
                </div>
                
                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">💡</span>
                    Justificación
                  </h3>
                  <div className="gcl-text-content">
                    {item.justificacion || 'Sin justificación proporcionada'}
                  </div>
                </div>

                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">⚖️</span>
                    Implicaciones
                  </h3>
                  <div className="gcl-grid-fields">
                    {renderBooleanField("Riesgos", item.implicaciones?.riesgos)}
                    {renderBooleanField("Recursos", item.implicaciones?.recursos)}
                    {renderBooleanField("Documentación", item.implicaciones?.documentacion)}
                    {renderField("Otros", item.implicaciones?.otros)}
                  </div>
                </div>

                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">⚠️</span>
                    Consecuencias
                  </h3>
                  <div className="gcl-text-content">
                    {item.consecuencias || 'Sin consecuencias descritas'}
                  </div>
                </div>

                <div className="gcl-section">
                  <h3 className="gcl-section-title">
                    <span className="gcl-section-icon">✍️</span>
                    Firmas
                  </h3>
                  <div className="gcl-signatures-grid">
                    {Object.entries(item.firmadoPor || {}).map(([role, persona]) => (
                      <div key={role} className="gcl-signature-card">
                        <div className="gcl-signature-role">{role}:</div>
                        <div className="gcl-signature-info">
                          <div className="gcl-signature-name">{persona.nombre || 'Pendiente'}</div>
                          <div className="gcl-signature-position">{persona.cargo || '-'}</div>
                        </div>
                        {persona.firma ? (
                          <img src={persona.firma} alt={`Firma ${role}`} className="gcl-signature-img" />
                        ) : (
                          <div className="gcl-signature-pending">Pendiente</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="gcl-card-footer">
                <span className="gcl-status">
                  Estado: {item.firmadoPor?.aprobador?.nombre ? 'Aprobado' : 'Pendiente'}
                </span>
                <GestionCambioPDF registro={item} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GestionCambioList;