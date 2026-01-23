import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/TablaObjetivosArea.css';

const FrecuenciaMultiTabla = () => {
  const { label } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extraer datos del estado de navegación
  const { 
    esMultiDepartamento = false, 
    objetivoGeneral = '',
    area = '',
    departamento = '',
    objetivoId = label
  } = location.state || {};

  const [objetivoEspecifico, setObjetivoEspecifico] = useState(null);
  const [objetivoMulti, setObjetivoMulti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [valores, setValores] = useState({});
  const [cambios, setCambios] = useState({});
  const [showPanel, setShowPanel] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial, setAñoHistorial] = useState(2025);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [panelSize, setPanelSize] = useState({ width: 500, height: 400 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [activeTabHistorial, setActiveTabHistorial] = useState(0);
  const [añoActual] = useState(new Date().getFullYear());

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
    } else {
      setDragging(true);
      setOffset({ x: e.clientX - panelPosition.x, y: e.clientY - panelPosition.y });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPanelPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
    if (resizing) {
      setPanelSize({ 
        width: Math.max(300, e.clientX - panelPosition.x), 
        height: Math.max(200, e.clientY - panelPosition.y) 
      });
    }
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  // Obtener objetivo multi-departamento específico
  const obtenerObjetivoEspecifico = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener el objetivo multi-departamento completo
      const response = await api.get(`/api/objetivos/${objetivoId}`);
      const objetivoMultiData = response.data;
      setObjetivoMulti(objetivoMultiData);
      
      // 2. Encontrar el objetivo específico para esta área
      const objetivoEspecificoData = objetivoMultiData.objetivosEspecificos?.find(
        obj => obj.area === area || obj.departamento === departamento
      );
      
      if (!objetivoEspecificoData) {
        Swal.fire({
          icon: 'error',
          title: 'Objetivo no encontrado',
          text: `No se encontró objetivo específico para el área/departamento: ${area || departamento}`,
          confirmButtonColor: '#4a6fa5',
        });
        setLoading(false);
        return;
      }
      
      setObjetivoEspecifico(objetivoEspecificoData);
      
      // 3. Inicializar valores
      const valoresIniciales = {};
      const campos = [
        "indicadorENEABR", "indicadorFEB", "indicadorMAR", "indicadorABR",
        "indicadorMAYOAGO", "indicadorJUN", "indicadorJUL", "indicadorAGO",
        "indicadorSEPDIC", "indicadorOCT", "indicadorNOV", "indicadorDIC"
      ];
      
      campos.forEach((campo) => {
        if (objetivoEspecificoData[campo]) {
          ["S1", "S2", "S3", "S4", "S5"].forEach((semana) => {
            const key = `${objetivoEspecificoData._id}.${campo}.${semana}`;
            valoresIniciales[key] = objetivoEspecificoData[campo][semana] || "";
          });
        }
      });
      
      setValores(valoresIniciales);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error al obtener objetivo multi-departamento:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo cargar el objetivo. Por favor, intenta de nuevo.',
        confirmButtonColor: '#4a6fa5',
      });
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    if (!objetivoEspecifico) return;
    
    try {
      const historial = objetivoEspecifico.historialAnual?.find(h => h.año === añoHistorial);
      
      if (!historial) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} para este objetivo.`,
          confirmButtonColor: '#4a6fa5'
        });
        return;
      }
      
      // Crear datos para el historial
      const datosHistorial = {
        ...objetivoEspecifico,
        historialSeleccionado: historial,
        objetivoGeneral: objetivoGeneral || objetivoMulti?.nombreObjetivoGeneral
      };
      
      setHistorialData([datosHistorial]);
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

  useEffect(() => {
    if (esMultiDepartamento && objetivoId) {
      obtenerObjetivoEspecifico();
    }
  }, [esMultiDepartamento, objetivoId, area, departamento]);

  const handleBlur = (name, meta) => {
    const valor = valores[`${objetivoEspecifico?._id}.${name}`];
    if (valor && parseFloat(valor) < parseFloat(meta)) {
      Swal.fire({
        title: "¡Atención! Meta no alcanzada",
        text: "Se guardará la información y se redirigirá a la sección de Acciones Correctivas.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: '#4a6fa5',
        cancelButtonColor: '#6c757d',
        confirmButtonText: "Guardar e Ir a Acciones",
        cancelButtonText: "Cancelar",
        background: '#ffffff',
        color: '#333333',
      }).then((result) => {
        if (result.isConfirmed) {
          (async () => {
            try {
              await handleGuardar();
              
              navigate('/registro-accion', {
                state: {
                  idObjetivo: objetivoId,
                  idObjetivoEspecifico: objetivoEspecifico?._id,
                  objetivo: {
                    numero: 1,
                    objetivo: objetivoEspecifico?.objetivo,
                    area: area,
                    departamento: departamento,
                    esMultiDepartamento: true,
                    objetivoGeneral: objetivoGeneral
                  },
                  periodo: name.split(".")[0],
                  label: label,
                  esMultiDepartamento: true
                }
              });
            } catch (error) {
              Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar la información.',
                icon: 'error',
                background: '#ffffff',
                color: '#333333'
              });
            }
          })();
        }
      });
    }
  };

  const handleChange = (e) => {
    if (!objetivoEspecifico) return;
    
    const { name, value } = e.target;
    setValores({ ...valores, [`${objetivoEspecifico._id}.${name}`]: value });
    setCambios({ ...cambios, [`${objetivoEspecifico._id}.${name}`]: true });
  };

  const handleGuardar = async () => {
    if (!objetivoEspecifico || !objetivoMulti) return;
    
    try {
      for (const [key] of Object.entries(cambios)) {
        const [objetivoEspecificoId, campo] = key.split('.');
        
        if (campo.startsWith('indicador')) {
          const semanas = ["S1", "S2", "S3", "S4", "S5"];
          const indicadorData = semanas.reduce((acc, semana) => {
            acc[semana] = valores[`${objetivoEspecificoId}.${campo}.${semana}`] || "";
            return acc;
          }, {});
          
          // Usar la API específica para actualizar indicadores de multi-departamento
          await api.put(`/api/objetivos/multi/${objetivoId}/indicador`, {
            area: area,
            campo: campo,
            valores: indicadorData
          });
        }
      }
      
      Swal.fire({
        title: '¡Guardado!',
        text: 'Los datos han sido guardados exitosamente.',
        icon: 'success',
        background: '#ffffff',
        color: '#333333',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      
      setCambios({});
      // Recargar datos después de guardar
      await obtenerObjetivoEspecifico();
      
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar la información.',
        icon: 'error',
        background: '#ffffff',
        color: '#333333'
      });
    }
  };

  const renderTablaFrecuencia = (meses, titulo, index, esHistorial = false) => {
    const datos = esHistorial ? historialData : (objetivoEspecifico ? [objetivoEspecifico] : []);
    const tabActivo = esHistorial ? activeTabHistorial : activeTab;
    const setTabActivo = esHistorial ? setActiveTabHistorial : setActiveTab;
    
    if (datos.length === 0) return null;
    
    const objetivo = datos[0];
    
    return (
      <div className={`frecuencia-container ${tabActivo === index ? 'active' : ''}`}>
        <div className="frecuencia-header" onClick={() => setTabActivo(index)}>
          <h4>{titulo}</h4>
          <span className="toggle-icon">{tabActivo === index ? '▼' : '►'}</span>
        </div>
        
        {tabActivo === index && (
          <div className="frecuencia-content">
            <div className="multi-info-header">
              <span className="multi-badge">Multi-Departamento</span>
              <span className="objetivo-general">{objetivoGeneral}</span>
            </div>
            <table className="objetivos-tabla">
              <thead>
                <tr>
                  <th rowSpan="2" className="header-bg">OBJ {esHistorial ? añoHistorial : añoActual}</th>
                  <th rowSpan="2" className="header-bg">META</th>
                  <th rowSpan="2" className="header-bg">ÁREA/DEPTO</th>
                  {meses.map((mes) => (
                    <th colSpan="5" key={mes.nombre} className="header-bg">
                      {mes.nombre}
                    </th>
                  ))}
                </tr>
                <tr>
                  {meses.map((mes) =>
                    ["S1", "S2", "S3", "S4", "S5"].map((semana) => (
                      <th key={`${mes.nombre}-${semana}`} className="semana-header">
                        {semana}
                      </th>
                    ))
                  ).flat()}
                </tr>
              </thead>
              <tbody>
                <tr className="even-row">
                  <td className="objetivo-numero">1</td>
                  <td className="objetivo-meta">{objetivo.metaFrecuencia}</td>
                  <td className="area-departamento">
                    <div>{area}</div>
                    <div className="departamento-sub">{departamento}</div>
                  </td>
                  {meses.map((mes) =>
                    ["S1", "S2", "S3", "S4", "S5"].map((semana) => {
                      const campoCompleto = `${mes.campo}.${semana}`;
                      let valor;
                      
                      if (esHistorial) {
                        valor = objetivo.historialSeleccionado?.indicadores?.[mes.campo]?.[semana] || '';
                      } else {
                        valor = valores[`${objetivo._id}.${mes.campo}.${semana}`] || '';
                      }
                      
                      return (
                        <td key={`${mes.nombre}-${semana}`} className="semana-cell">
                          {esHistorial ? (
                            <span className="valor-historial">{valor}</span>
                          ) : (
                            <input
                              type="text"
                              name={campoCompleto}
                              value={valor}
                              onChange={handleChange}
                              onBlur={() => handleBlur(campoCompleto, objetivo.metaFrecuencia)}
                              className="input-frecuencia"
                            />
                          )}
                        </td>
                      );
                    })
                  ).flat()}
                </tr>
              </tbody>
            </table>
            <div className="objetivo-descripcion">
              <strong>Objetivo:</strong> {objetivo.objetivo}
            </div>
            {objetivo.recursos && (
              <div className="objetivo-recursos">
                <strong>Recursos:</strong> {objetivo.recursos}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const periodos = [
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL I',
      meses: [
        { nombre: 'ENERO', campo: 'indicadorENEABR' },
        { nombre: 'FEBRERO', campo: 'indicadorFEB' },
        { nombre: 'MARZO', campo: 'indicadorMAR' },
        { nombre: 'ABRIL', campo: 'indicadorABR' },
      ],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL II',
      meses: [
        { nombre: 'MAYO', campo: 'indicadorMAYOAGO' },
        { nombre: 'JUNIO', campo: 'indicadorJUN' },
        { nombre: 'JULIO', campo: 'indicadorJUL' },
        { nombre: 'AGOSTO', campo: 'indicadorAGO' },
      ],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL III',
      meses: [
        { nombre: 'SEPTIEMBRE', campo: 'indicadorSEPDIC' },
        { nombre: 'OCTUBRE', campo: 'indicadorOCT' },
        { nombre: 'NOVIEMBRE', campo: 'indicadorNOV' },
        { nombre: 'DICIEMBRE', campo: 'indicadorDIC' },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Cargando objetivo...</p>
      </div>
    );
  }

  if (!objetivoEspecifico) {
    return (
      <div className="empty-state">
        <i className="fas fa-clipboard-list empty-icon"></i>
        <h3>No hay objetivo registrado para esta área</h3>
      </div>
    );
  }

  return (
    <div className="tabla-container">
      <div className="header-container">
        <h1 className="tabla-titulo">SISTEMA DE GESTIÓN DE CALIDAD</h1>
        <h2 className="tabla-subtitulo">
          SEGUIMIENTO POR FRECUENCIA - {objetivoGeneral?.toUpperCase() || 'OBJETIVOS GENERALES'}
          <br />
          ÁREA: {area?.toUpperCase()} | DEPARTAMENTO: {departamento?.toUpperCase()} - AÑO {añoActual}
        </h2>
      </div>

      <div className="botones-container">
        <button 
          className="button-acciones"
          onClick={() => navigate('/acciones', { 
            state: { 
              esMultiDepartamento: true,
              area: area,
              departamento: departamento,
              objetivoGeneral: objetivoGeneral
            } 
          })}
        >
          ACCIONES CORRECTIVAS
        </button>

        <button 
          className="btn-historial"
          onClick={cargarHistorial}
        >
          📊 VER HISTORIAL {añoHistorial}
        </button>

        <button 
          className="btn-guardar"
          onClick={handleGuardar}
          disabled={Object.keys(cambios).length === 0}
        >
          GUARDAR CAMBIOS
        </button>

        <button 
          className="btn-ver-objetivos"
          onClick={() => setShowPanel(!showPanel)}
        >
          {showPanel ? 'OCULTAR DETALLES' : 'VER DETALLES'}
        </button>

        <button 
          className="btn-volver"
          onClick={() => navigate(`/objetivos/${objetivoId}`, { 
            state: { 
              esMultiDepartamento: true,
              objetivoGeneral: objetivoGeneral,
              area: area,
              departamento: departamento,
              objetivoId: objetivoId
            } 
          })}
        >
          ← VOLVER A TABLA
        </button>
      </div>

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay" onClick={() => setShowHistorial(false)}>
          <div className="modal-historial" onClick={(e) => e.stopPropagation()}>
            <div className="modal-historial-header">
              <h2>📊 HISTORIAL {añoHistorial} - {area?.toUpperCase()}</h2>
              <button className="modal-close" onClick={() => setShowHistorial(false)}>✕</button>
            </div>
            <div className="modal-historial-body">
              {periodos.map((periodo, index) => 
                renderTablaFrecuencia(periodo.meses, periodo.titulo, index, true)
              )}
            </div>
          </div>
        </div>
      )}

      {showPanel && (
        <div
          className="panel-flotante"
          style={{
            position: 'absolute',
            left: `${panelPosition.x}px`,
            top: `${panelPosition.y}px`,
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`,
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="resize-handle"></div>
          <div className="panel-header">
            <h4>DETALLES DEL OBJETIVO - {area?.toUpperCase()}</h4>
            <button 
              className="panel-close"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="detalle-item">
              <strong>Objetivo General:</strong>
              <p>{objetivoGeneral}</p>
            </div>
            <div className="detalle-item">
              <strong>Objetivo Específico:</strong>
              <p>{objetivoEspecifico.objetivo}</p>
            </div>
            <div className="detalle-item">
              <strong>Área:</strong>
              <p>{area}</p>
            </div>
            <div className="detalle-item">
              <strong>Departamento:</strong>
              <p>{departamento}</p>
            </div>
            <div className="detalle-item">
              <strong>Meta/Frecuencia:</strong>
              <p>{objetivoEspecifico.metaFrecuencia}</p>
            </div>
            {objetivoEspecifico.recursos && (
              <div className="detalle-item">
                <strong>Recursos:</strong>
                <p>{objetivoEspecifico.recursos}</p>
              </div>
            )}
            {objetivoEspecifico.observaciones && (
              <div className="detalle-item">
                <strong>Observaciones:</strong>
                <p>{objetivoEspecifico.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="frecuencias-container">
        {periodos.map((periodo, index) => 
          renderTablaFrecuencia(periodo.meses, periodo.titulo, index, false)
        )}
      </div>

      <div className="footer-note">
        <p>
          Sistema de seguimiento de objetivos multi-departamento por frecuencia - 
          {objetivoGeneral} - Año {añoActual}
        </p>
      </div>
    </div>
  );
};

export default FrecuenciaMultiTabla;