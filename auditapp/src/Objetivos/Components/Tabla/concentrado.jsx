import React, { useEffect, useState, useContext } from 'react';
import api from '../../../services/api';
import './concentrado.css';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';

const ObjetivosComponent = () => {
  const [objetivos, setObjetivos] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial, setAñoHistorial] = useState(new Date().getFullYear() - 1);
  const [activeTab, setActiveTab] = useState(0);
  const { userData } = useContext(UserContext);
  const [objetivosActuales, setObjetivosActuales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalSize, setModalSize] = useState({ width: 800, height: 600 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Efectos para manejar el drag & drop
  useEffect(() => {
    if (dragging || resizing) {
      document.body.classList.add('no-select');
    } else {
      document.body.classList.remove('no-select');
    }
  }, [dragging, resizing]);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing]);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) {
      setResizing(true);
    } else if (e.target.classList.contains('modal-historial-header')) {
      setDragging(true);
      setOffset({ x: e.clientX - modalPosition.x, y: e.clientY - modalPosition.y });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setModalPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
    if (resizing) {
      setModalSize({ 
        width: Math.max(500, e.clientX - modalPosition.x), 
        height: Math.max(300, e.clientY - modalPosition.y) 
      });
    }
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  useEffect(() => {
    const fetchObjetivos = async () => {
      try {
        const response = await api.get(`/api/objetivos`);
        let data = response.data;

        // Obtener área del usuario
        const areaUsuario = userData?.area?.trim() || userData?.Departamento?.trim() || "";
        const esAdmin = userData?.TipoUsuario?.toLowerCase() === "administrador";

        // Filtrar los objetivos dependiendo del tipo de usuario
        if (!esAdmin && areaUsuario) {
          data = data.filter((objetivo) => objetivo.area.toLowerCase() === areaUsuario.toLowerCase());
        } else if (!esAdmin && !areaUsuario) {
          data = [];
        }

        setObjetivos(data);
        setObjetivosActuales(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener los objetivos:', error);
        setLoading(false);
      }
    };

    fetchObjetivos();
  }, [userData]);

  // Función para cargar historial
  const cargarHistorial = async () => {
    try {
      const response = await api.get(`/api/objetivos`);
      let data = response.data;

      // Filtrar por área si no es admin
      const areaUsuario = userData?.area?.trim() || userData?.Departamento?.trim() || "";
      const esAdmin = userData?.TipoUsuario?.toLowerCase() === "administrador";
      
      if (!esAdmin && areaUsuario) {
        data = data.filter((objetivo) => objetivo.area.toLowerCase() === areaUsuario.toLowerCase());
      }

      const objetivosConHistorial = data
        .filter(obj => obj.historialAnual && obj.historialAnual.length > 0)
        .map(obj => {
          const historial = obj.historialAnual.find(h => h.año === añoHistorial);
          return historial ? { 
            ...obj, 
            historialSeleccionado: historial,
            area: obj.area,
            objetivo: obj.objetivo,
            metaFrecuencia: obj.metaFrecuencia,
            añoActual: obj.añoActual
          } : null;
        })
        .filter(obj => obj !== null);

      if (objetivosConHistorial.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} para el área.`,
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

  // Función para calcular el promedio anual
  const calcularPromedioAnual = (objetivo, esHistorial = false) => {
    const eneAbr = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'], esHistorial));
    const mayoAgo = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'], esHistorial));
    const sepDic = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'], esHistorial));

    const valores = [eneAbr, mayoAgo, sepDic].filter(v => !isNaN(v) && v > 0);
    if (valores.length === 0) return 0;

    return (valores.reduce((acc, curr) => acc + curr, 0) / valores.length).toFixed(2);
  };

  // Agrupar objetivos por área
  const agruparObjetivosPorArea = (data, esHistorial = false) => {
    return data.reduce((acc, objetivo) => {
      const area = objetivo.area;
      if (!acc[area]) acc[area] = [];
      acc[area].push(objetivo);
      return acc;
    }, {});
  };

  const objetivosPorArea = agruparObjetivosPorArea(objetivosActuales);
  const historialPorArea = showHistorial ? agruparObjetivosPorArea(historialData, true) : {};

  const periodos = [
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL I',
      campos: ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL II',
      campos: ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL III',
      campos: ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'],
    },
  ];

  const renderTablaDetalladaHistorial = (periodo, index) => {
    const datos = historialData;
    
    return (
      <div className={`frecuencia-container ${activeTab === index ? 'active' : ''}`}>
        <div className="frecuencia-header" onClick={() => setActiveTab(index)}>
          <h4>{periodo.titulo} - {añoHistorial}</h4>
          <span className="toggle-icon">{activeTab === index ? '▼' : '►'}</span>
        </div>
        
        {activeTab === index && (
          <div className="frecuencia-content">
            <table className="objetivos-tabla">
              <thead>
                <tr>
                  <th rowSpan="2" className="header-bg">ÁREA</th>
                  <th rowSpan="2" className="header-bg">OBJETIVO</th>
                  <th rowSpan="2" className="header-bg">META</th>
                  {periodo.campos.map((campo, idx) => (
                    <th colSpan="5" key={campo} className="header-bg">
                      {campo.replace('indicador', '')}
                    </th>
                  ))}
                </tr>
                <tr>
                  {periodo.campos.map(campo =>
                    ["S1", "S2", "S3", "S4", "S5"].map((semana) => (
                      <th key={`${campo}-${semana}`} className="semana-header">
                        {semana}
                      </th>
                    ))
                  ).flat()}
                </tr>
              </thead>
              <tbody>
                {datos.map((objetivo, idx) => (
                  <tr key={`${objetivo._id}-${idx}`} className={idx % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="objetivo-area">{objetivo.area}</td>
                    <td className="objetivo-texto">{objetivo.objetivo}</td>
                    <td className="objetivo-meta">{objetivo.metaFrecuencia}</td>
                    {periodo.campos.map(campo =>
                      ["S1", "S2", "S3", "S4", "S5"].map((semana) => {
                        const valor = objetivo.historialSeleccionado?.indicadores?.[campo]?.[semana] || '';
                        return (
                          <td key={`${campo}-${semana}`} className="semana-cell">
                            <span className="valor-historial">{valor}</span>
                          </td>
                        );
                      })
                    ).flat()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Cargando objetivos...</div>;
  }

  return (
    <div className="safety-container">
      <div className="header-concentrado">
        <h2>Concentrado de Objetivos del Sistema</h2>
        <div className="controls-concentrado">
          <div className="year-selector">
            <label htmlFor="yearSelect">Ver Historial del Año:</label>
            <select 
              id="yearSelect"
              value={añoHistorial}
              onChange={(e) => setAñoHistorial(parseInt(e.target.value))}
            >
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i - 1).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="btn-historial"
            onClick={cargarHistorial}
          >
            📊 VER HISTORIAL {añoHistorial}
          </button>
          
          {userData?.TipoUsuario?.toLowerCase() === "administrador" && (
            <div className="user-info">
              <p><strong>Usuario:</strong> {userData?.Nombre || userData?.nombre}</p>
              <p><strong>Tipo:</strong> {userData?.TipoUsuario}</p>
            </div>
          )}
        </div>
        <p className="area-usuario">
          <strong>Área del usuario:</strong> {userData?.area || userData?.Departamento || 'No asignada'}
        </p>
      </div>

      {/* Tabla de concentrado actual */}
      {Object.keys(objetivosPorArea).map((area) => (
        <div key={area} className="area-section">
          <div className="area-separator">
            <span>{area} - AÑO {new Date().getFullYear()}</span>
          </div>
          <table className="safety-table">
            <thead>
              <tr>
                <th>Departamento</th>
                <th>No. Objetivo</th>
                <th>Promedio ENE-ABR</th>
                <th>Promedio MAYO-AGO</th>
                <th>Promedio SEP-DIC</th>
                <th>Promedio Anual</th>
              </tr>
            </thead>
            <tbody>
              {objetivosPorArea[area].map((objetivo, index) => {
                const isFirstInArea = index === 0 || objetivo.area !== objetivosPorArea[area][index - 1].area;

                return (
                  <tr key={objetivo._id}>
                    {isFirstInArea ? (
                      <td rowSpan={objetivosPorArea[area].length}>{objetivo.area}</td>
                    ) : null}
                    <td>{index + 1}</td>
                    <td>{calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'])}%</td>
                    <td>{calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'])}%</td>
                    <td>{calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'])}%</td>
                    <td>{calcularPromedioAnual(objetivo)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <hr className="area-separator-line" />
        </div>
      ))}

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay" onClick={() => setShowHistorial(false)}>
          <div 
            className="modal-historial concentrado-modal"
            style={{
              position: 'fixed',
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              width: `${modalSize.width}px`,
              height: `${modalSize.height}px`,
              cursor: dragging ? 'grabbing' : 'default',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resize-handle"></div>
            <div 
              className="modal-historial-header"
              onMouseDown={handleMouseDown}
            >
              <h2>📊 HISTORIAL {añoHistorial} - CONCENTRADO</h2>
              <button className="modal-close" onClick={() => setShowHistorial(false)}>✕</button>
            </div>
            <div className="modal-historial-body">
              
              {/* Resumen por áreas del historial */}
              {Object.keys(historialPorArea).map((area) => (
                <div key={area} className="historial-area-section">
                  <div className="area-separator historial">
                    <span>{area} - AÑO {añoHistorial}</span>
                  </div>
                  <table className="safety-table historial-table">
                    <thead>
                      <tr>
                        <th>Departamento</th>
                        <th>No. Objetivo</th>
                        <th>Promedio ENE-ABR</th>
                        <th>Promedio MAYO-AGO</th>
                        <th>Promedio SEP-DIC</th>
                        <th>Promedio Anual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialPorArea[area].map((objetivo, index) => {
                        const isFirstInArea = index === 0 || objetivo.area !== historialPorArea[area][index - 1].area;

                        return (
                          <tr key={`${objetivo._id}-hist`}>
                            {isFirstInArea ? (
                              <td rowSpan={historialPorArea[area].length}>{objetivo.area}</td>
                            ) : null}
                            <td>{index + 1}</td>
                            <td>{calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'], true)}%</td>
                            <td>{calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'], true)}%</td>
                            <td>{calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'], true)}%</td>
                            <td>{calcularPromedioAnual(objetivo, true)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Tablas detalladas por frecuencia */}
              <div className="tabs-detalladas-historial">
                <h3>Vista Detallada por Frecuencia</h3>
                {periodos.map((periodo, index) => 
                  renderTablaDetalladaHistorial(periodo, index)
                )}
              </div>

            </div>
            <div className="modal-historial-footer">
              <p>Datos históricos del año {añoHistorial} - Sistema de Gestión de Calidad</p>
            </div>
          </div>
        </div>
      )}

      <div className="footer-concentrado">
        <p>Sistema de Gestión de Calidad - Concentrado de Objetivos - Año {new Date().getFullYear()}</p>
        <p>Total de objetivos: {objetivos.length} | Total de áreas: {Object.keys(objetivosPorArea).length}</p>
      </div>
    </div>
  );
};

export default ObjetivosComponent;