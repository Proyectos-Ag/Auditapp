import React, { useEffect, useState, useContext } from "react";
import api from "../../../services/api";
import { UserContext } from "../../../App";
import './ObjetivosList.css';
import Swal from 'sweetalert2';

const ObjetivosComponent = () => {
  const { userData } = useContext(UserContext);
  const [objetivos, setObjetivos] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial, setAñoHistorial] = useState(new Date().getFullYear() - 1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Verificar si es administrador
  const esAdmin = userData?.TipoUsuario?.toLowerCase() === "administrador";
  const areaUsuario = userData?.area?.trim() || userData?.Departamento?.trim() || "";

  console.log("Usuario es admin:", esAdmin);
  console.log("Área del usuario:", areaUsuario);

  useEffect(() => {
    const fetchObjetivos = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/objetivos`);
        let data = response.data;

        console.log("Objetivos obtenidos (total):", data.length);

        // SOLO filtrar si NO es administrador Y tiene área asignada
        if (!esAdmin && areaUsuario) {
          const areaUsuarioLower = areaUsuario.toLowerCase();
          data = data.filter(objetivo => 
            objetivo.area && objetivo.area.toLowerCase() === areaUsuarioLower
          );
          console.log("Objetivos después de filtro (no admin):", data.length);
        } else if (!esAdmin && !areaUsuario) {
          // Si no es admin y no tiene área, no mostrar nada
          console.warn("Usuario no administrador sin área asignada");
          data = [];
        }
        // Si ES administrador, mostrar TODOS los objetivos sin filtrar

        setObjetivos(data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener objetivos", error);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los objetivos',
          confirmButtonColor: '#4a6fa5'
        });
      }
    };
    fetchObjetivos();
  }, [areaUsuario, esAdmin]);

  // Función para cargar historial
  const cargarHistorial = async () => {
    try {
      const response = await api.get(`/api/objetivos`);
      let data = response.data;

      // Para admin: mostrar todo, para no admin: filtrar por área
      if (!esAdmin && areaUsuario) {
        const areaUsuarioLower = areaUsuario.toLowerCase();
        data = data.filter(objetivo => 
          objetivo.area && objetivo.area.toLowerCase() === areaUsuarioLower
        );
      }

      const objetivosConHistorial = data
        .filter(obj => obj.historialAnual && obj.historialAnual.length > 0)
        .map(obj => {
          const historial = obj.historialAnual.find(h => h.año === añoHistorial);
          return historial ? { 
            ...obj, 
            historialSeleccionado: historial
          } : null;
        })
        .filter(obj => obj !== null);

      if (objetivosConHistorial.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} ${!esAdmin ? 'para tu área' : 'en el sistema'}.`,
          confirmButtonColor: '#4a6fa5'
        });
        return;
      }

      setHistorialData(objetivosConHistorial);
      setShowHistorial(true);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el historial',
        confirmButtonColor: '#4a6fa5'
      });
    }
  };

  // Función para calcular promedio por trimestre
  const calcularPromedioTrimestre = (objetivo, campos, esHistorial = false) => {
    const semanas = ["S1", "S2", "S3", "S4", "S5"];
    let todosLosValores = [];
    
    campos.forEach(campo => {
      if (esHistorial && objetivo.historialSeleccionado?.indicadores?.[campo]) {
        semanas.forEach(semana => {
          const valor = objetivo.historialSeleccionado.indicadores[campo][semana];
          if (valor !== undefined && valor !== null && valor !== "") {
            todosLosValores.push(parseFloat(valor) || 0);
          }
        });
      } else if (!esHistorial && objetivo[campo]) {
        semanas.forEach(semana => {
          const valor = objetivo[campo][semana];
          if (valor !== undefined && valor !== null && valor !== "") {
            todosLosValores.push(parseFloat(valor) || 0);
          }
        });
      }
    });
    
    if (todosLosValores.length === 0) return 0;
    return (todosLosValores.reduce((acc, val) => acc + val, 0) / todosLosValores.length).toFixed(2);
  };

  // Agrupar objetivos por área
  const agruparObjetivosPorArea = (data, esHistorial = false) => {
    return data.reduce((acc, objetivo) => {
      const area = objetivo.area;
      if (!acc[area]) acc[area] = [];
      acc[area].push({...objetivo, esHistorial});
      return acc;
    }, {});
  };

  const objetivosPorArea = agruparObjetivosPorArea(objetivos);
  const historialPorArea = showHistorial ? agruparObjetivosPorArea(historialData, true) : {};

  // Renderizar tabla de historial detallada
  const renderTablaHistorialDetallada = () => {
    const periodos = [
      {
        titulo: 'ENE-ABR',
        campos: ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'],
      },
      {
        titulo: 'MAYO-AGO',
        campos: ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'],
      },
      {
        titulo: 'SEP-DIC',
        campos: ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'],
      },
    ];

    return (
      <div className="historial-detallado">
        <h3>Vista Detallada {añoHistorial}</h3>
        {periodos.map((periodo, index) => (
          <div key={index} className={`frecuencia-container ${activeTab === index ? 'active' : ''}`}>
            <div className="frecuencia-header" onClick={() => setActiveTab(index)}>
              <h4>{periodo.titulo}</h4>
              <span className="toggle-icon">{activeTab === index ? '▼' : '►'}</span>
            </div>
            
            {activeTab === index && (
              <div className="frecuencia-content">
                <table className="detalle-table">
                  <thead>
                    <tr>
                      <th>Área</th>
                      <th>Objetivo</th>
                      <th>Meta</th>
                      {periodo.campos.map(campo => (
                        <th key={campo} colSpan="5">
                          {campo.replace('indicador', '')}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th colSpan="3"></th>
                      {periodo.campos.flatMap(campo => 
                        ["S1", "S2", "S3", "S4", "S5"].map(semana => (
                          <th key={`${campo}-${semana}`}>{semana}</th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.map((objetivo, idx) => (
                      <tr key={`${objetivo._id}-${idx}`}>
                        <td>{objetivo.area}</td>
                        <td>{objetivo.objetivo}</td>
                        <td>{objetivo.metaFrecuencia}</td>
                        {periodo.campos.flatMap(campo => 
                          ["S1", "S2", "S3", "S4", "S5"].map(semana => {
                            const valor = objetivo.historialSeleccionado?.indicadores?.[campo]?.[semana] || '';
                            return (
                              <td key={`${campo}-${semana}`}>
                                <span className="valor-cell">{valor}</span>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando objetivos...</p>
      </div>
    );
  }

  return (
    <div className="safety-container">
      <div className="header-controls">
        <h2>Objetivos del Sistema {esAdmin ? '(Vista Administrador)' : ''}</h2>
        
        <div className="controls-row">
          <div className="user-info-box">
            <p><strong>Usuario:</strong> {userData?.Nombre || userData?.nombre}</p>
            <p><strong>Tipo:</strong> {userData?.TipoUsuario}</p>
            <p><strong>Área:</strong> {areaUsuario || 'Administrador'}</p>
          </div>
          
          <div className="historial-controls">
            <div className="year-select">
              <label>Historial del año:</label>
              <select 
                value={añoHistorial}
                onChange={(e) => setAñoHistorial(parseInt(e.target.value))}
              >
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i - 1).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <button 
              className="btn-ver-historial"
              onClick={cargarHistorial}
            >
              📊 Ver Historial {añoHistorial}
            </button>
          </div>
        </div>
      </div>

      {/* Mostrar mensaje si no hay objetivos */}
      {Object.keys(objetivosPorArea).length === 0 ? (
        <div className="no-data-message">
          <p>No hay objetivos disponibles {!esAdmin && areaUsuario ? `para el área ${areaUsuario}` : 'en el sistema'}.</p>
          {!esAdmin && !areaUsuario && (
            <p className="warning">No tienes un área asignada. Contacta al administrador.</p>
          )}
        </div>
      ) : (
        // Mostrar objetivos agrupados por área
        Object.keys(objetivosPorArea).map((area) => (
          <div key={area} className="area-section">
            <div className="area-header">
              <h3>{area}</h3>
              <span className="objetivo-count">{objetivosPorArea[area].length} objetivo(s)</span>
            </div>
            
            <table className="safety-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Objetivo</th>
                  <th>Recursos</th>
                  <th>Meta / Frecuencia</th>
                  <th>Indicador ENE-ABR</th>
                  <th>Indicador MAYO-AGO</th>
                  <th>Indicador SEP-DIC</th>
                </tr>
              </thead>
              <tbody>
                {objetivosPorArea[area].map((objetivo, index) => (
                  <tr key={objetivo._id}>
                    <td className="numero">{index + 1}</td>
                    <td className="objetivo-text">{objetivo.objetivo}</td>
                    <td className="recursos">{objetivo.recursos}</td>
                    <td className="meta">{objetivo.metaFrecuencia}</td>
                    <td className="indicador">
                      {calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'])}%
                    </td>
                    <td className="indicador">
                      {calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'])}%
                    </td>
                    <td className="indicador">
                      {calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'])}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="table-footer">
              <p>Promedio del área {area}: 
                <span className="promedio-area">
                  {(
                    objetivosPorArea[area].reduce((sum, objetivo) => {
                      const eneAbr = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']));
                      const mayoAgo = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']));
                      const sepDic = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']));
                      
                      const valores = [eneAbr, mayoAgo, sepDic].filter(v => !isNaN(v) && v > 0);
                      const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
                      
                      return sum + promedio;
                    }, 0) / objetivosPorArea[area].length
                  ).toFixed(2)}%
                </span>
              </p>
            </div>
            
            <hr className="area-separator-line" />
          </div>
        ))
      )}

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay" onClick={() => setShowHistorial(false)}>
          <div className="modal-historial" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Historial {añoHistorial}</h2>
              <button className="modal-close" onClick={() => setShowHistorial(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Resumen por áreas del historial */}
              {Object.keys(historialPorArea).length === 0 ? (
                <div className="no-historial-data">
                  <p>No hay datos históricos disponibles para {añoHistorial}</p>
                </div>
              ) : (
                <>
                  {Object.keys(historialPorArea).map((area) => (
                    <div key={area} className="historial-area-section">
                      <div className="area-header historial">
                        <h3>{area} - {añoHistorial}</h3>
                        <span className="objetivo-count">{historialPorArea[area].length} objetivo(s)</span>
                      </div>
                      
                      <table className="safety-table historial-table">
                        <thead>
                          <tr>
                            <th>No.</th>
                            <th>Objetivo</th>
                            <th>Meta</th>
                            <th>Indicador ENE-ABR</th>
                            <th>Indicador MAYO-AGO</th>
                            <th>Indicador SEP-DIC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialPorArea[area].map((objetivo, index) => (
                            <tr key={`${objetivo._id}-hist`}>
                              <td className="numero">{index + 1}</td>
                              <td className="objetivo-text">{objetivo.objetivo}</td>
                              <td className="meta">{objetivo.metaFrecuencia}</td>
                              <td className="indicador">
                                {calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'], true)}%
                              </td>
                              <td className="indicador">
                                {calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'], true)}%
                              </td>
                              <td className="indicador">
                                {calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'], true)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="table-footer historial">
                        <p>Promedio histórico {area} ({añoHistorial}): 
                          <span className="promedio-area">
                            {(
                              historialPorArea[area].reduce((sum, objetivo) => {
                                const eneAbr = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'], true));
                                const mayoAgo = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'], true));
                                const sepDic = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'], true));
                                
                                const valores = [eneAbr, mayoAgo, sepDic].filter(v => !isNaN(v) && v > 0);
                                const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
                                
                                return sum + promedio;
                              }, 0) / historialPorArea[area].length
                            ).toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Tabla detallada del historial */}
                  {renderTablaHistorialDetallada()}
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <p>Sistema de Gestión de Calidad - Historial {añoHistorial}</p>
              <p>Total de objetivos históricos: {historialData.length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="system-footer">
        <p>Sistema de Gestión de Calidad - {new Date().getFullYear()}</p>
        <p>Total de objetivos: {objetivos.length} | Total de áreas: {Object.keys(objetivosPorArea).length}</p>
      </div>
    </div>
  );
};

export default ObjetivosComponent;