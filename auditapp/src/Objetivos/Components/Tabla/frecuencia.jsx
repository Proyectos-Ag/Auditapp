import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/TablaObjetivosArea.css';

// ✅ Función para normalizar texto
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const TablaObjetivosArea = () => {
  const { label } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Determinar si es multi-departamento
  const esMultiDepartamento = location.pathname.includes('/multi/');
  const objetivoIdMulti = esMultiDepartamento ? label : null;
  
  // ✅ Obtener área del state o del parámetro
  const area = esMultiDepartamento ? location.state?.area : label;
  const objetivoGeneral = location.state?.objetivoGeneral || '';
  
  const [objetivos, setObjetivos] = useState([]);
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

  const cargarHistorial = async () => {
    try {
      let response;
      let objetivosConHistorial = [];
      
      if (esMultiDepartamento && objetivoIdMulti) {
        // ✅ Historial para objetivo multi-departamento
        response = await api.get(`/api/objetivos/${objetivoIdMulti}`);
        const objetivoMulti = response.data;
        
        const areaBuscarNormalizada = normalizeText(area || '');
        const objetivoEspecifico = objetivoMulti.objetivosEspecificos?.find(
          obj => normalizeText(obj.area) === areaBuscarNormalizada
        );
        
        if (objetivoEspecifico && objetivoEspecifico.historialAnual) {
          const historial = objetivoEspecifico.historialAnual.find(h => h.año === añoHistorial);
          if (historial) {
            objetivosConHistorial = [{
              ...objetivoEspecifico,
              _id: objetivoIdMulti + '-' + objetivoEspecifico.area,
              historialSeleccionado: historial
            }];
          }
        }
      } else {
        // ✅ Historial para objetivos tradicionales
        response = await api.get(`/api/objetivos`, { params: { area: label } });
        
        // ✅ FILTRAR: Solo objetivos tradicionales (sin nombreObjetivoGeneral)
        const objetivosTradicionales = response.data.filter(objetivo => {
          // Solo incluir objetivos que NO tengan nombreObjetivoGeneral
          // y que coincidan exactamente con el área
          return !objetivo.nombreObjetivoGeneral && objetivo.area === label;
        });
        
        objetivosConHistorial = objetivosTradicionales
          .filter(obj => obj.historialAnual && obj.historialAnual.length > 0)
          .map(obj => {
            const historial = obj.historialAnual.find(h => h.año === añoHistorial);
            return historial ? { ...obj, historialSeleccionado: historial } : null;
          })
          .filter(obj => obj !== null);
      }

      if (objetivosConHistorial.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} para esta área.`,
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

  useEffect(() => {
    async function fetchObjetivos() {
      try {
        let objetivosData = [];
        let valoresIniciales = {};
        
        if (esMultiDepartamento && objetivoIdMulti) {
          // ✅ Cargar objetivo multi-departamento específico
          console.log('🔍 Cargando objetivo multi-departamento con ID:', objetivoIdMulti);
          const response = await api.get(`/api/objetivos/${objetivoIdMulti}`);
          const objetivoMulti = response.data;
          
          if (!area) {
            console.error('❌ No se especificó área para objetivo multi-departamento');
            Swal.fire({
              icon: 'error',
              title: 'Área no especificada',
              text: 'No se pudo determinar el área del objetivo multi-departamento.',
              confirmButtonColor: '#4a6fa5'
            });
            setLoading(false);
            return;
          }
          
          // Normalizar área de búsqueda
          const areaBuscarNormalizada = normalizeText(area);
          
          // Buscar objetivo específico
          let objetivoEspecifico = null;
          
          if (objetivoMulti.objetivosEspecificos) {
            objetivoEspecifico = objetivoMulti.objetivosEspecificos.find(obj => {
              if (!obj.area) return false;
              return normalizeText(obj.area) === areaBuscarNormalizada;
            });
          }
          
          if (!objetivoEspecifico && objetivoMulti.objetivosEspecificos?.length > 0) {
            // Usar el primero como fallback
            objetivoEspecifico = objetivoMulti.objetivosEspecificos[0];
            console.log('🔄 Usando primer objetivo como fallback:', objetivoEspecifico.area);
          }
          
          if (objetivoEspecifico) {
            console.log('✅ Objetivo específico encontrado:', objetivoEspecifico);
            
            objetivosData = [{
              _id: objetivoIdMulti + '-' + objetivoEspecifico.area,
              objetivo: objetivoEspecifico.objetivo || '',
              metaFrecuencia: objetivoEspecifico.metaFrecuencia || '',
              indicadorENEABR: objetivoEspecifico.indicadorENEABR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorFEB: objetivoEspecifico.indicadorFEB || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorMAR: objetivoEspecifico.indicadorMAR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorABR: objetivoEspecifico.indicadorABR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorMAYOAGO: objetivoEspecifico.indicadorMAYOAGO || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorJUN: objetivoEspecifico.indicadorJUN || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorJUL: objetivoEspecifico.indicadorJUL || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorAGO: objetivoEspecifico.indicadorAGO || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorSEPDIC: objetivoEspecifico.indicadorSEPDIC || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorOCT: objetivoEspecifico.indicadorOCT || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorNOV: objetivoEspecifico.indicadorNOV || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              indicadorDIC: objetivoEspecifico.indicadorDIC || { S1: "", S2: "", S3: "", S4: "", S5: "" },
              esMultiDepartamento: true,
              objetivoGeneral: objetivoMulti.nombreObjetivoGeneral,
              objetivoIdMulti: objetivoIdMulti,
              area: objetivoEspecifico.area
            }];
            
            // Preparar valores iniciales
            objetivosData.forEach((objetivo) => {
              [
                "indicadorENEABR",
                "indicadorFEB",
                "indicadorMAR",
                "indicadorABR",
                "indicadorMAYOAGO",
                "indicadorJUN",
                "indicadorJUL",
                "indicadorAGO",
                "indicadorSEPDIC",
                "indicadorOCT",
                "indicadorNOV",
                "indicadorDIC",
              ].forEach((campo) => {
                if (objetivo[campo]) {
                  ["S1", "S2", "S3", "S4", "S5"].forEach((semana) => {
                    valoresIniciales[`${objetivo._id}.${campo}.${semana}`] =
                      objetivo[campo][semana] || "";
                  });
                }
              });
            });
          } else {
            console.error('❌ No se pudo encontrar ningún objetivo específico');
            Swal.fire({
              icon: "error",
              title: "Objetivo no encontrado",
              text: `No se encontró un objetivo específico para el área "${area}" en este objetivo multi-departamento.`,
              confirmButtonColor: "#4a6fa5",
            });
          }
        } else {
          // ✅ Cargar SOLO objetivos tradicionales (NO multi-departamento)
          console.log('🔍 Cargando objetivos tradicionales para área:', label);
          const response = await api.get(
            `/api/objetivos`,
            { params: { area: label } }
          );
          
          // ✅ FILTRAR: Solo objetivos tradicionales (sin nombreObjetivoGeneral)
          objetivosData = response.data.filter(objetivo => {
            // Solo incluir objetivos que:
            // 1. NO tengan nombreObjetivoGeneral (no son multi-departamento)
            // 2. Tengan área exactamente igual al label
            return !objetivo.nombreObjetivoGeneral && objetivo.area === label;
          });
          
          console.log('✅ Objetivos tradicionales encontrados:', objetivosData.length);
          console.log('📊 Total objetivos recibidos del backend:', response.data.length);
          
          // Log para debugging
          response.data.forEach((obj, idx) => {
            console.log(`Objetivo ${idx + 1}:`, {
              _id: obj._id,
              area: obj.area,
              nombreObjetivoGeneral: obj.nombreObjetivoGeneral || 'NO (tradicional)',
              incluido: !obj.nombreObjetivoGeneral && obj.area === label ? '✅ INCLUIDO' : '❌ EXCLUIDO'
            });
          });
    
          objetivosData.forEach((objetivo) => {
            [
              "indicadorENEABR",
              "indicadorFEB",
              "indicadorMAR",
              "indicadorABR",
              "indicadorMAYOAGO",
              "indicadorJUN",
              "indicadorJUL",
              "indicadorAGO",
              "indicadorSEPDIC",
              "indicadorOCT",
              "indicadorNOV",
              "indicadorDIC",
            ].forEach((campo) => {
              if (objetivo[campo]) {
                ["S1", "S2", "S3", "S4", "S5"].forEach((semana) => {
                  valoresIniciales[`${objetivo._id}.${campo}.${semana}`] =
                    objetivo[campo][semana] || "";
                });
              }
            });
          });
        }
  
        setObjetivos(objetivosData);
        setValores(valoresIniciales);
        setLoading(false);
        
        // ✅ Verificar actualización de año (solo para objetivos tradicionales)
        if (!esMultiDepartamento && objetivosData.length > 0) {
          const objetivosDesactualizados = objetivosData.filter(
            obj => obj.añoActual && obj.añoActual < añoActual
          );
          
          if (objetivosDesactualizados.length > 0) {
            Swal.fire({
              title: '⚠️ Nuevo Año Detectado',
              html: `Se detectaron ${objetivosDesactualizados.length} objetivo(s) con datos del año ${objetivosDesactualizados[0].añoActual}.<br><br>¿Deseas resetear los indicadores para el año ${añoActual}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#4a6fa5',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, actualizar año',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await api.post('/api/objetivos/migrar-año');
                  Swal.fire({
                    title: '✓ Año Actualizado',
                    text: `Los objetivos se han actualizado al año ${añoActual}`,
                    icon: 'success',
                    confirmButtonColor: '#4a6fa5'
                  });
                  window.location.reload();
                } catch (error) {
                  Swal.fire({
                    title: 'Error',
                    text: 'No se pudo actualizar el año',
                    icon: 'error'
                  });
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar objetivos:", error);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los objetivos. Intenta de nuevo.',
          confirmButtonColor: '#4a6fa5'
        });
      }
    }
    fetchObjetivos();
  }, [label, esMultiDepartamento, objetivoIdMulti, area, añoActual]);

  const handleBlur = (name, objetivoId, meta) => {
    const valor = valores[`${objetivoId}.${name}`];
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
              const objetivo = objetivos.find((obj) => obj._id === objetivoId);
              
              navigate('/registro-accion', {
                state: {
                  idObjetivo: objetivoId,
                  objetivo: {
                    numero: objetivos.indexOf(objetivo) + 1,
                    objetivo: objetivo.objetivo,
                    area: esMultiDepartamento ? area : label
                  },
                  periodo: name.split(".")[0],
                  label: esMultiDepartamento ? area : label
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

  const handleChange = (e, objetivoId) => {
    const { name, value } = e.target;
    setValores({ ...valores, [`${objetivoId}.${name}`]: value });
    setCambios({ ...cambios, [`${objetivoId}.${name}`]: true });
  };

  const handleGuardar = async () => {
    try {
      for (const [key, value] of Object.entries(cambios)) {
        if (value) {
          const [objetivoId, campo] = key.split('.');
          
          if (esMultiDepartamento) {
            // ✅ Guardar cambios en objetivo multi-departamento
            const [objetivoMultiId, areaObjetivo] = objetivoId.split('-');
            const semanas = ["S1", "S2", "S3", "S4", "S5"];
            const indicadorData = semanas.reduce((acc, semana) => {
              acc[semana] = valores[`${objetivoId}.${campo}.${semana}`] || "";
              return acc;
            }, {});
            
            await api.put(`/api/objetivos/multi/${objetivoMultiId}/indicador`, {
              area: areaObjetivo,
              campo: campo,
              valores: indicadorData
            });
          } else {
            // ✅ Guardar cambios en objetivo tradicional
            if (campo.startsWith('indicador')) {
              const semanas = ["S1", "S2", "S3", "S4", "S5"];
              const indicadorData = semanas.reduce((acc, semana) => {
                acc[semana] = valores[`${objetivoId}.${campo}.${semana}`] || "";
                return acc;
              }, {});
              await api.put(`/api/objetivos/${objetivoId}`, {
                [campo]: indicadorData,
              });
            } else {
              await api.put(`/api/objetivos/${objetivoId}`, {
                [campo]: isNaN(valores[key]) ? valores[key] : Number(valores[key]),
              });
            }
          }
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
    const datos = esHistorial ? historialData : objetivos;
    const tabActivo = esHistorial ? activeTabHistorial : activeTab;
    const setTabActivo = esHistorial ? setActiveTabHistorial : setActiveTab;
    
    return (
      <div className={`frecuencia-container ${tabActivo === index ? 'active' : ''}`}>
        <div className="frecuencia-header" onClick={() => setTabActivo(index)}>
          <h4>{titulo}</h4>
          <span className="toggle-icon">{tabActivo === index ? '▼' : '►'}</span>
        </div>
        
        {tabActivo === index && (
          <div className="frecuencia-content">
            <table className="objetivos-tabla">
              <thead>
                <tr>
                  <th rowSpan="2" className="header-bg">OBJ {esHistorial ? añoHistorial : añoActual}</th>
                  <th rowSpan="2" className="header-bg">META</th>
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
                {datos.map((objetivo, idx) => (
                  <tr key={objetivo._id} className={idx % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="objetivo-numero">{idx + 1}</td>
                    <td className="objetivo-meta">{objetivo.metaFrecuencia}</td>
                    {meses.map((mes) =>
                      ["S1", "S2", "S3", "S4", "S5"].map((semana) => {
                        const valor = esHistorial 
                          ? objetivo.historialSeleccionado?.indicadores?.[mes.campo]?.[semana] || ''
                          : valores[`${objetivo._id}.${mes.campo}.${semana}`] || '';
                        
                        return (
                          <td key={`${mes.nombre}-${semana}`} className="semana-cell">
                            {esHistorial ? (
                              <span className="valor-historial">{valor}</span>
                            ) : (
                              <input
                                type="text"
                                name={`${mes.campo}.${semana}`}
                                value={valor}
                                onChange={(e) => handleChange(e, objetivo._id)}
                                onBlur={() => handleBlur(`${mes.campo}.${semana}`, objetivo._id, objetivo.metaFrecuencia)}
                                className="input-frecuencia"
                              />
                            )}
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

  // ✅ Mostrar loader mientras carga
  if (loading) {
    return (
      <div className="tabla-container">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando objetivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-container">
      <div className="header-container">
        <h1 className="tabla-titulo">SISTEMA DE GESTIÓN DE CALIDAD</h1>
        <h2 className="tabla-subtitulo">
          SEGUIMIENTO POR FRECUENCIA - 
          {esMultiDepartamento 
            ? ` OBJETIVO MULTI-DEPARTAMENTO: ${objetivoGeneral.toUpperCase() || ''}` 
            : ` ÁREA: ${label?.toUpperCase() || ''}`
          } 
          - AÑO {añoActual}
        </h2>
        {esMultiDepartamento && objetivos[0] && (
          <h3 className="tabla-area-multi">
            Área específica: {objetivos[0]?.area?.toUpperCase() || area?.toUpperCase() || ''}
          </h3>
        )}
      </div>

      <div className="botones-container">
        <button 
          className="button-acciones"
          onClick={() => navigate(`/acciones-list/${esMultiDepartamento ? area : label}`)}
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
          {showPanel ? 'OCULTAR OBJETIVOS' : 'VER OBJETIVOS'}
        </button>
      </div>

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay" onClick={() => setShowHistorial(false)}>
          <div className="modal-historial" onClick={(e) => e.stopPropagation()}>
            <div className="modal-historial-header">
              <h2>📊 HISTORIAL {añoHistorial} - {esMultiDepartamento ? area?.toUpperCase() || '' : label?.toUpperCase() || ''}</h2>
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
            <h4>
              {esMultiDepartamento 
                ? `OBJETIVO MULTI-DEPARTAMENTO: ${objetivoGeneral}` 
                : `OBJETIVOS DEL ÁREA: ${label?.toUpperCase() || ''}`
              } 
              - {añoActual}
            </h4>
            <button 
              className="panel-close"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <ul>
              {objetivos.map((objetivo, index) => (
                <li key={objetivo._id}>
                  <span className="objetivo-numero">{index + 1}.</span>
                  <span className="objetivo-texto">{objetivo.objetivo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="frecuencias-container">
        {periodos.map((periodo, index) => 
          renderTablaFrecuencia(periodo.meses, periodo.titulo, index, false)
        )}
      </div>

      <div className="footer-note">
        <p>Sistema de seguimiento de objetivos por fredscuasencia - Año {añoActual}</p>
      </div>
    </div>
  );
};

export default TablaObjetivosArea;