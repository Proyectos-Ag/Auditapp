import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';
import './CrearObjetivoMultiDepto.css';

const CrearObjetivoMultiDepartamento = () => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  const [pasoActual, setPasoActual] = useState(1);
  const [departamentosConAreas, setDepartamentosConAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paso 1: Datos del objetivo general
  const [nombreObjetivoGeneral, setNombreObjetivoGeneral] = useState('');
  
  // Paso 2: Departamentos y áreas seleccionadas
  const [departamentosSeleccionados, setDepartamentosSeleccionados] = useState([]);
  
  // Paso 3: Objetivos específicos por departamento/área
  const [objetivosEspecificos, setObjetivosEspecificos] = useState([]);
  const [contadorObjetivos, setContadorObjetivos] = useState(1); // Para IDs únicos
  
  // Cargar departamentos con sus áreas
  useEffect(() => {
    const cargarDepartamentosConAreas = async () => {
      try {
        const response = await api.get('/areas');
        const data = response.data;
        
        // Estructurar datos: cada departamento con sus áreas
        const deptosConAreas = data.map(item => ({
          departamento: item.departamento,
          areas: item.areas || []
        }));
        
        setDepartamentosConAreas(deptosConAreas);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los departamentos y áreas',
          confirmButtonColor: '#4a6fa5'
        });
      }
    };
    
    cargarDepartamentosConAreas();
  }, []);
  
  // Manejar selección de departamento y área
  const handleSeleccionDepartamentoArea = (departamento, area) => {
    // Convertir área a mayúsculas
    const areaMayusculas = area.toUpperCase().trim();
    
    const existe = departamentosSeleccionados.find(
      item => item.departamento === departamento && item.area === areaMayusculas
    );
    
    if (existe) {
      // Si ya está seleccionado, lo quitamos
      const nuevosSeleccionados = departamentosSeleccionados.filter(item => 
        !(item.departamento === departamento && item.area === areaMayusculas)
      );
      setDepartamentosSeleccionados(nuevosSeleccionados);
      
      // También quitamos todos los objetivos asociados a esta área
      const nuevosObjetivos = objetivosEspecificos.filter(obj => 
        !(obj.departamento === departamento && obj.area === areaMayusculas)
      );
      setObjetivosEspecificos(nuevosObjetivos);
    } else {
      // Si no está, lo agregamos con área en mayúsculas
      setDepartamentosSeleccionados([
        ...departamentosSeleccionados,
        { departamento, area: areaMayusculas }
      ]);
    }
  };
  
  // Inicializar objetivos específicos cuando se seleccionan departamentos/áreas
  useEffect(() => {
    if (departamentosSeleccionados.length > 0) {
      // Solo agregar objetivos iniciales si no hay ninguno para estas áreas
      const areasConObjetivos = [...new Set(objetivosEspecificos.map(obj => 
        `${obj.departamento}-${obj.area}`
      ))];
      
      const nuevosObjetivos = [...objetivosEspecificos];
      
      departamentosSeleccionados.forEach(item => {
        const key = `${item.departamento}-${item.area}`;
        if (!areasConObjetivos.includes(key)) {
          nuevosObjetivos.push({
            id: Date.now() + Math.random(), // ID único temporal
            departamento: item.departamento,
            area: item.area,
            objetivo: '',
            recursos: '',
            metaFrecuencia: ''
          });
        }
      });
      
      setObjetivosEspecificos(nuevosObjetivos);
      setContadorObjetivos(prev => prev + 1);
    }
  }, [departamentosSeleccionados]);
  
  // Manejar cambios en objetivos específicos
  const handleCambioObjetivoEspecifico = (id, campo, valor) => {
    const nuevosObjetivos = objetivosEspecificos.map(obj => 
      obj.id === id ? { ...obj, [campo]: valor } : obj
    );
    setObjetivosEspecificos(nuevosObjetivos);
  };
  
  // Agregar nuevo objetivo para cualquier área seleccionada
  const agregarNuevoObjetivo = () => {
    if (departamentosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin áreas seleccionadas',
        text: 'Primero selecciona al menos un área en el Paso 2',
        confirmButtonColor: '#4a6fa5'
      });
      return;
    }
    
    // Mostrar selector de área
    Swal.fire({
      title: 'Seleccionar área para nuevo objetivo',
      html: `
        <p>Selecciona el área para el nuevo objetivo:</p>
        <select id="area-select" class="swal2-select">
          ${departamentosSeleccionados.map((item, index) => 
            `<option value="${index}">${item.departamento} - ${item.area}</option>`
          ).join('')}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a6fa5',
      preConfirm: () => {
        const select = document.getElementById('area-select');
        const selectedIndex = select.value;
        return selectedIndex;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const selectedIndex = parseInt(result.value);
        const selectedArea = departamentosSeleccionados[selectedIndex];
        
        const nuevoObjetivo = {
          id: Date.now() + Math.random(), // ID único temporal
          departamento: selectedArea.departamento,
          area: selectedArea.area,
          objetivo: '',
          recursos: '',
          metaFrecuencia: ''
        };
        
        setObjetivosEspecificos(prev => [...prev, nuevoObjetivo]);
        setContadorObjetivos(prev => prev + 1);
        
        Swal.fire({
          icon: 'success',
          title: 'Nuevo objetivo agregado',
          text: `Se agregó un nuevo objetivo para ${selectedArea.area}`,
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Eliminar objetivo específico
  const eliminarObjetivo = (id) => {
    Swal.fire({
      title: '¿Eliminar este objetivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#4a6fa5',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const objetivoAEliminar = objetivosEspecificos.find(obj => obj.id === id);
        const nuevosObjetivos = objetivosEspecificos.filter(obj => obj.id !== id);
        
        // Verificar si es el último objetivo para esta área
        const otrosObjetivosMismaArea = nuevosObjetivos.filter(obj => 
          obj.departamento === objetivoAEliminar.departamento && 
          obj.area === objetivoAEliminar.area
        );
        
        if (otrosObjetivosMismaArea.length === 0) {
          // Si era el último objetivo para esta área, preguntar si también quitar el área
          Swal.fire({
            title: '¿Quitar el área también?',
            text: `No hay más objetivos para ${objetivoAEliminar.area}. ¿Deseas quitar el área de la selección?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4a6fa5',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, quitar área',
            cancelButtonText: 'No, mantener área'
          }).then((result2) => {
            if (result2.isConfirmed) {
              // Quitar área de la selección
              const nuevasAreas = departamentosSeleccionados.filter(item => 
                !(item.departamento === objetivoAEliminar.departamento && 
                  item.area === objetivoAEliminar.area)
              );
              setDepartamentosSeleccionados(nuevasAreas);
            }
            setObjetivosEspecificos(nuevosObjetivos);
          });
        } else {
          setObjetivosEspecificos(nuevosObjetivos);
        }
      }
    });
  };
  
  // Validar paso actual
  const validarPaso = () => {
    switch(pasoActual) {
      case 1:
        if (!nombreObjetivoGeneral.trim()) {
          Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Debes ingresar un nombre para el objetivo general',
            confirmButtonColor: '#4a6fa5'
          });
          return false;
        }
        return true;
        
      case 2:
        if (departamentosSeleccionados.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Selección requerida',
            text: 'Debes seleccionar al menos un departamento y área',
            confirmButtonColor: '#4a6fa5'
          });
          return false;
        }
        return true;
        
      case 3:
        if (objetivosEspecificos.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin objetivos',
            text: 'Debes agregar al menos un objetivo específico',
            confirmButtonColor: '#4a6fa5'
          });
          return false;
        }
        
        for (const objetivo of objetivosEspecificos) {
          if (!objetivo.objetivo.trim()) {
            Swal.fire({
              icon: 'warning',
              title: 'Campo requerido',
              text: `Debes ingresar el objetivo para ${objetivo.departamento} - ${objetivo.area}`,
              confirmButtonColor: '#4a6fa5'
            });
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  };
  
  // Avanzar al siguiente paso
  const siguientePaso = () => {
    if (validarPaso()) {
      if (pasoActual < 3) {
        setPasoActual(pasoActual + 1);
      }
    }
  };
  
  // Regresar al paso anterior
  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };
  
  // Guardar objetivo completo
  const guardarObjetivo = async () => {
    if (!validarPaso()) return;
    
    try {
      const usuarioInfo = {
        id: userData?._id,
        nombre: userData?.Nombre || userData?.nombre || 'Administrador'
      };
      
      // Transformar los datos asegurando que área esté en mayúsculas
      const objetivosTransformados = objetivosEspecificos.map(obj => ({
        departamento: obj.departamento,
        area: obj.area.toUpperCase().trim(), // ✅ CONVERTIR A MAYÚSCULAS
        objetivo: obj.objetivo,
        recursos: obj.recursos || "",
        metaFrecuencia: obj.metaFrecuencia || "",
        observaciones: "",
        indicadorENEABR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorFEB: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorMAR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorABR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorMAYOAGO: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorJUN: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorJUL: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorAGO: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorSEPDIC: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorOCT: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorNOV: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        indicadorDIC: { S1: "", S2: "", S3: "", S4: "", S5: "" },
        accionesCorrectivas: [],
        historialAnual: []
      }));
      
      // Extraer departamentos únicos
      const departamentosUnicos = [...new Set(objetivosEspecificos.map(item => item.departamento))];
      
      const objetivoData = {
        nombreObjetivoGeneral,
        departamentosAsignados: departamentosUnicos,
        objetivosEspecificos: objetivosTransformados,
        usuario: usuarioInfo,
        activo: true,
        añoActual: new Date().getFullYear()
      };
      
      console.log('📤 Datos a enviar:');
      console.log('Nombre objetivo general:', nombreObjetivoGeneral);
      console.log('Total objetivos específicos:', objetivosTransformados.length);
      console.log('Departamentos involucrados:', departamentosUnicos);
      
      const response = await api.post('/api/objetivos/multi-departamento', objetivoData);
      
      Swal.fire({
        icon: 'success',
        title: '¡Objetivo creado!',
        html: `
          <p>Se ha creado el objetivo: <strong>${nombreObjetivoGeneral}</strong></p>
          <p>Total de objetivos específicos: <strong>${objetivosEspecificos.length}</strong></p>
          <p>Áreas involucradas: <strong>${departamentosSeleccionados.length}</strong></p>
        `,
        confirmButtonColor: '#4a6fa5'
      }).then(() => {
        navigate('/objetivos');
      });
      
    } catch (error) {
      console.error('Error al crear objetivo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo crear el objetivo. Intenta nuevamente.',
        confirmButtonColor: '#4a6fa5'
      });
    }
  };
  
  // Función para verificar si un departamento/área está seleccionado
  const estaSeleccionado = (departamento, area) => {
    // Convertir área a mayúsculas para la comparación
    const areaMayusculas = area.toUpperCase().trim();
    
    return departamentosSeleccionados.some(
      item => item.departamento === departamento && item.area === areaMayusculas
    );
  };
  
  // Contar objetivos por área
  const contarObjetivosPorArea = (departamento, area) => {
    return objetivosEspecificos.filter(obj => 
      obj.departamento === departamento && obj.area === area.toUpperCase().trim()
    ).length;
  };
  
  // Renderizar paso actual
  const renderPaso = () => {
    switch(pasoActual) {
      case 1:
        return (
          <div className="paso-container">
            <h3>Paso 1: Nombre del Objetivo General</h3>
            <div className="form-group">
              <label htmlFor="nombreObjetivo">Nombre del Objetivo General *</label>
              <input
                type="text"
                id="nombreObjetivo"
                value={nombreObjetivoGeneral}
                onChange={(e) => setNombreObjetivoGeneral(e.target.value)}
                placeholder="Ej: Mejorar la eficiencia operativa"
                className="form-input"
              />
              <p className="helper-text">Este nombre será visible para todos los departamentos y áreas asignados</p>
            </div>
            
            <div className="ejemplo-container">
              <h4>Ejemplos:</h4>
              <ul>
                <li>Optimizar procesos administrativos</li>
                <li>Incrementar la satisfacción del cliente</li>
                <li>Reducir costos operativos</li>
                <li>Mejorar la calidad de productos/servicios</li>
              </ul>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="paso-container">
            <h3>Paso 2: Seleccionar Departamentos y Áreas</h3>
            <p className="instrucciones">Selecciona las áreas específicas que podrán ver y gestionar este objetivo:</p>
            
            {loading ? (
              <div className="loading-departamentos">
                <div className="spinner"></div>
                <p>Cargando departamentos y áreas...</p>
              </div>
            ) : (
              <div className="departamentos-areas-container">
                {departamentosConAreas.map((depto, deptoIndex) => (
                  <div key={deptoIndex} className="departamento-section">
                    <h4 className="departamento-titulo">{depto.departamento}</h4>
                    
                    {depto.areas.length === 0 ? (
                      <div className="sin-areas">
                        <p>Este departamento no tiene áreas definidas</p>
                      </div>
                    ) : (
                      <div className="areas-grid">
                        {depto.areas.map((area, areaIndex) => {
                          const seleccionada = estaSeleccionado(depto.departamento, area);
                          const cantidadObjetivos = contarObjetivosPorArea(depto.departamento, area);
                          
                          return (
                            <div 
                              key={areaIndex}
                              className={`area-card ${seleccionada ? 'seleccionada' : ''}`}
                              onClick={() => handleSeleccionDepartamentoArea(depto.departamento, area)}
                            >
                              <div className="area-checkbox">
                                {seleccionada ? '✓' : ''}
                              </div>
                              <div className="area-info">
                                <div className="area-nombre">{area}</div>
                                <div className="area-departamento">{depto.departamento}</div>
                                {seleccionada && cantidadObjetivos > 0 && (
                                  <div className="area-contador">
                                    {cantidadObjetivos} objetivo{cantidadObjetivos !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="seleccionados-info">
              <h4>Áreas seleccionadas:</h4>
              {departamentosSeleccionados.length === 0 ? (
                <p className="no-seleccionados">No hay áreas seleccionadas</p>
              ) : (
                <div className="seleccionados-lista">
                  {departamentosSeleccionados.map((item, index) => {
                    const cantidadObjetivos = contarObjetivosPorArea(item.departamento, item.area);
                    return (
                      <span key={index} className="badge-area">
                        {item.departamento} - {item.area}
                        {cantidadObjetivos > 0 && (
                          <span className="badge-contador">{cantidadObjetivos}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="paso-container">
            <div className="paso-header">
              <h3>Paso 3: Definir Objetivos Específicos</h3>
              <button 
                className="btn-agregar-objetivo"
                onClick={agregarNuevoObjetivo}
                disabled={departamentosSeleccionados.length === 0}
              >
                <span>+</span> Agregar Nuevo Objetivo
              </button>
            </div>
            
            <div className="instrucciones-container">
              <p className="instrucciones">
                Define el objetivo específico, recursos y meta para cada área seleccionada.
                Puedes agregar tantos objetivos como necesites para cada área.
              </p>
              <div className="estadisticas-objetivos">
                <div className="estadistica">
                  <span className="estadistica-valor">{objetivosEspecificos.length}</span>
                  <span className="estadistica-label">Objetivos totales</span>
                </div>
                <div className="estadistica">
                  <span className="estadistica-valor">{departamentosSeleccionados.length}</span>
                  <span className="estadistica-label">Áreas seleccionadas</span>
                </div>
                <div className="estadistica">
                  <span className="estadistica-valor">
                    {[...new Set(departamentosSeleccionados.map(item => item.departamento))].length}
                  </span>
                  <span className="estadistica-label">Departamentos</span>
                </div>
              </div>
            </div>
            
            {objetivosEspecificos.length === 0 ? (
              <div className="sin-objetivos">
                <div className="sin-objetivos-icon">📝</div>
                <h4>No hay objetivos definidos</h4>
                <p>Comienza agregando tu primer objetivo usando el botón "Agregar Nuevo Objetivo"</p>
                <button 
                  className="btn-agregar-primer"
                  onClick={agregarNuevoObjetivo}
                  disabled={departamentosSeleccionados.length === 0}
                >
                  + Agregar Primer Objetivo
                </button>
              </div>
            ) : (
              <div className="objetivos-especificos-container">
                {objetivosEspecificos.map((objetivo, index) => (
                  <div key={objetivo.id} className="objetivo-especifico-card">
                    <div className="card-header">
                      <div className="card-header-left">
                        <h4>Objetivo #{index + 1}</h4>
                        <div className="card-subtitle">
                          <span className="badge-area-card">{objetivo.area}</span>
                          <span className="badge-depto-card">{objetivo.departamento}</span>
                        </div>
                      </div>
                      <div className="card-header-right">
                        <button
                          className="btn-eliminar-card"
                          onClick={() => eliminarObjetivo(objetivo.id)}
                          title="Eliminar este objetivo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`objetivo-${objetivo.id}`}>
                        Objetivo Específico *
                      </label>
                      <textarea
                        id={`objetivo-${objetivo.id}`}
                        value={objetivo.objetivo}
                        onChange={(e) => handleCambioObjetivoEspecifico(objetivo.id, 'objetivo', e.target.value)}
                        placeholder={`Describe el objetivo específico para ${objetivo.area} del departamento ${objetivo.departamento}`}
                        className="form-textarea"
                        rows="3"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-col">
                        <label htmlFor={`recursos-${objetivo.id}`}>Recursos</label>
                        <textarea
                          id={`recursos-${objetivo.id}`}
                          value={objetivo.recursos}
                          onChange={(e) => handleCambioObjetivoEspecifico(objetivo.id, 'recursos', e.target.value)}
                          placeholder={`Recursos necesarios para ${objetivo.area}`}
                          className="form-textarea"
                          rows="2"
                        />
                      </div>
                      <div className="form-col">
                        <label htmlFor={`meta-${objetivo.id}`}>Meta / Frecuencia</label>
                        <input
                          type="text"
                          id={`meta-${objetivo.id}`}
                          value={objetivo.metaFrecuencia}
                          onChange={(e) => handleCambioObjetivoEspecifico(objetivo.id, 'metaFrecuencia', e.target.value)}
                          placeholder="Ej: 95% mensual"
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="ejemplo-objetivo">
                      <strong>Ejemplo para {objetivo.area}:</strong>
                      <p>"Reducir el tiempo de procesamiento de solicitudes en un 20% mediante la implementación de un sistema automatizado"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {objetivosEspecificos.length > 0 && (
              <div className="botones-inferiores">
                <button 
                  className="btn-agregar-mas"
                  onClick={agregarNuevoObjetivo}
                  disabled={departamentosSeleccionados.length === 0}
                >
                  + Agregar Otro Objetivo
                </button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="crear-objetivo-container">
      <div className="header-creacion">
        <h2>Crear Nuevo Objetivo Multi-Departamento/Área</h2>
        <p>Sigue los 3 pasos para crear un objetivo que pueda ser visto por múltiples áreas de diferentes departamentos</p>
      </div>
      
      {/* Barra de progreso */}
      <div className="progress-bar">
        <div className="progress-steps">
          <div className={`step ${pasoActual >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Objetivo General</div>
          </div>
          <div className={`step ${pasoActual >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Seleccionar Áreas</div>
          </div>
          <div className={`step ${pasoActual >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Definir Objetivos</div>
          </div>
        </div>
      </div>
      
      {/* Contenido del paso actual */}
      <div className="paso-content">
        {renderPaso()}
      </div>
      
      {/* Controles de navegación */}
      <div className="navegacion-pasos">
        <div className="navegacion-izquierda">
          {pasoActual > 1 && (
            <button 
              className="btn-paso-anterior"
              onClick={pasoAnterior}
            >
              ← Paso Anterior
            </button>
          )}
        </div>
        
        <div className="navegacion-derecha">
          {pasoActual < 3 ? (
            <button 
              className="btn-siguiente"
              onClick={siguientePaso}
            >
              Siguiente Paso →
            </button>
          ) : (
            <button 
              className="btn-guardar"
              onClick={guardarObjetivo}
            >
              Guardar Objetivo
            </button>
          )}
        </div>
      </div>
      
      {/* Resumen */}
      <div className="resumen-creacion">
        <h4>Resumen de la creación:</h4>
        <div className="resumen-grid">
          <div className="resumen-item">
            <span className="resumen-label">Objetivo General:</span>
            <span className="resumen-valor">{nombreObjetivoGeneral || 'No definido'}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Áreas seleccionadas:</span>
            <span className="resumen-valor">
              {departamentosSeleccionados.length > 0 
                ? `${departamentosSeleccionados.length} área(s)` 
                : 'No seleccionadas'}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Objetivos definidos:</span>
            <span className="resumen-valor">
              {objetivosEspecificos.length > 0 
                ? `${objetivosEspecificos.length} objetivo(s)` 
                : 'Por definir'}
            </span>
          </div>
        </div>
        
        {/* Detalle de áreas y objetivos */}
        {(departamentosSeleccionados.length > 0 || objetivosEspecificos.length > 0) && (
          <div className="detalle-completo">
            <h5>Detalle por área:</h5>
            <div className="areas-objetivos-detalle">
              {departamentosSeleccionados.map((area, index) => {
                const objetivosDeEstaArea = objetivosEspecificos.filter(obj => 
                  obj.departamento === area.departamento && 
                  obj.area === area.area
                );
                
                return (
                  <div key={index} className="area-detalle-completo">
                    <div className="area-detalle-header">
                      <span className="area-detalle-departamento">{area.departamento}:</span>
                      <span className="area-detalle-nombre">{area.area}</span>
                      <span className="area-detalle-contador">
                        {objetivosDeEstaArea.length} objetivo{objetivosDeEstaArea.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {objetivosDeEstaArea.length > 0 && (
                      <div className="objetivos-area-lista">
                        {objetivosDeEstaArea.map((obj, objIndex) => (
                          <div key={objIndex} className="objetivo-resumen">
                            <span className="objetivo-indice">#{objIndex + 1}</span>
                            <span className="objetivo-texto">
                              {obj.objetivo.substring(0, 60)}...
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrearObjetivoMultiDepartamento;