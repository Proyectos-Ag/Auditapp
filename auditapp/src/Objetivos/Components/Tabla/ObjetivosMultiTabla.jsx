import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from '../../../services/api';
import Swal from "sweetalert2";
import { UserContext } from "../../../App";
import "./ObjetivosTabla.css";

// Importar componentes de Material-UI necesarios
import { 
  Button,
  IconButton,
  Tooltip,
  Chip,
  Badge,
  CircularProgress,
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  FolderSpecial as FolderSpecialIcon,
  CalendarToday as CalendarTodayIcon,
  CollectionsBookmark as CollectionsBookmarkIcon
} from '@mui/icons-material';

const ObjetivosMultiTabla = () => {
  const { area } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ CORRECCIÓN: Extraer también el módulo y la bandera de filtro
  const { 
    esMultiDepartamentoArea = false, 
    area: areaFromState = '',
    objetivos: objetivosIniciales = [],
    objetivosCount = 0,
    modulo = null, // ✅ NUEVO: Módulo seleccionado
    mostrarSoloModulo = false // ✅ NUEVO: Si solo mostrar ese módulo
  } = location.state || {};

  const [tablaData, setTablaData] = useState([]);
  const [modoEdicion, setModoEdicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial, setAñoHistorial] = useState(2025);

  // Variables para el tema y responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Función para extraer ObjectId puro
  const extraerObjectId = (id) => {
    if (!id) return null;
    
    // Buscar un string de 24 caracteres hexadecimales
    const objectIdRegex = /[0-9a-fA-F]{24}/;
    const match = id.match(objectIdRegex);
    
    if (match) {
      return match[0];
    }
    
    return id;
  };

  // Función para calcular promedio por trimestre
  const calcularPromedioTrimestre = (objetivo, campos) => {
    const semanas = ["S1", "S2", "S3", "S4", "S5"];
    let todosLosValores = [];
    
    campos.forEach(campo => {
      if (objetivo[campo]) {
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

  // ✅ CORRECCIÓN: Aplicar filtro de módulo si existe
  const cargarObjetivosPorArea = async () => {
    try {
      setLoading(true);
      
      let objetivosParaMostrar = [];
      
      if (objetivosIniciales && objetivosIniciales.length > 0) {
        // ✅ Si hay un módulo específico y la bandera está activa, filtrar
        if (mostrarSoloModulo && modulo) {
          console.log('🔍 Filtrando objetivos por módulo:', modulo);
          objetivosParaMostrar = objetivosIniciales.filter(obj => 
            obj.objetivoEspecifico === modulo
          );
          console.log('✅ Objetivos filtrados:', objetivosParaMostrar.length);
        } else {
          // Mostrar todos los objetivos del área
          objetivosParaMostrar = objetivosIniciales;
        }
        
        // Formatear los objetivos
        const objetivosFormateados = objetivosParaMostrar.map((obj, index) => {
          const objetivoIdValido = extraerObjectId(obj.objetivoIdMulti || obj.objetivoId || obj._id);
          const objetivoEspecificoId = obj.objetivoEspecificoId || obj._id;
          
          const promedioENEABR = calcularPromedioTrimestre(
            obj, 
            ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']
          );
          const promedioMAYOAGO = calcularPromedioTrimestre(
            obj, 
            ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']
          );
          const promedioSEPDIC = calcularPromedioTrimestre(
            obj, 
            ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']
          );
          
          return {
            ...obj,
            _id: `${objetivoIdValido}_${objetivoEspecificoId}`,
            objetivoId: objetivoIdValido,
            objetivoEspecificoId: objetivoEspecificoId,
            index: index,
            promedioENEABR,
            promedioMAYOAGO,
            promedioSEPDIC
          };
        });
        
        setTablaData(objetivosFormateados);
        console.log('✅ Objetivos cargados:', objetivosFormateados.length);
      } else {
        // Si no vienen objetivos, obtenerlos de la API
        const response = await api.get(`/api/objetivos/multi/area?area=${area || areaFromState}`);
        const objetivos = response.data || [];
        
        // ✅ Aplicar filtro de módulo si existe
        if (mostrarSoloModulo && modulo) {
          objetivosParaMostrar = objetivos.filter(obj => 
            obj.objetivoEspecifico === modulo
          );
        } else {
          objetivosParaMostrar = objetivos;
        }
        
        const objetivosFormateados = objetivosParaMostrar.map((obj, index) => {
          const objetivoIdValido = extraerObjectId(obj.objetivoIdMulti || obj._id);
          const objetivoEspecificoId = obj.objetivoEspecificoId || obj._id;
          
          const promedioENEABR = calcularPromedioTrimestre(
            obj, 
            ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']
          );
          const promedioMAYOAGO = calcularPromedioTrimestre(
            obj, 
            ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']
          );
          const promedioSEPDIC = calcularPromedioTrimestre(
            obj, 
            ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']
          );
          
          return {
            ...obj,
            _id: `${objetivoIdValido}_${objetivoEspecificoId}`,
            objetivoId: objetivoIdValido,
            objetivoEspecificoId: objetivoEspecificoId,
            index: index,
            promedioENEABR,
            promedioMAYOAGO,
            promedioSEPDIC
          };
        });
        
        setTablaData(objetivosFormateados);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar objetivos por área:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudieron cargar los objetivos. Por favor, intenta de nuevo.',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      // Para cada objetivo, cargar su historial
      const historiales = await Promise.all(
        tablaData.map(async (objetivo) => {
          try {
            // Para objetivos multi-departamento, necesitamos obtener el historial del objetivo específico
            if (objetivo.esMultiDepartamento && objetivo.objetivoId) {
              const response = await api.get(`/api/objetivos/${objetivo.objetivoId}`);
              const objetivoCompleto = response.data;
              
              // Buscar el objetivo específico por su ID específico
              const objetivoEspecifico = objetivoCompleto.objetivosEspecificos?.find(
                obj => obj._id.toString() === objetivo.objetivoEspecificoId
              );
              
              if (objetivoEspecifico) {
                const historial = objetivoEspecifico.historialAnual?.find(h => h.año === añoHistorial);
                if (historial) {
                  return {
                    ...objetivo,
                    historialSeleccionado: historial,
                    promedioENEABR_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']),
                    promedioMAYOAGO_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']),
                    promedioSEPDIC_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']),
                  };
                }
              }
            }
            return null;
          } catch (error) {
            console.error('Error cargando historial para objetivo:', objetivo.objetivoDescripcion, error);
            return null;
          }
        })
      );
      
      const historialesFiltrados = historiales.filter(h => h !== null);
      
      if (historialesFiltrados.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} para estos objetivos.`,
          confirmButtonColor: '#3085d6'
        });
        return;
      }
      
      setHistorialData(historialesFiltrados);
      setShowHistorial(true);
      
    } catch (error) {
      console.error('Error al cargar historial general:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el historial',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const calcularPromedioTrimestreHistorial = (indicadores, campos) => {
    const semanas = ["S1", "S2", "S3", "S4", "S5"];
    let todosLosValores = [];
    
    campos.forEach(campo => {
      if (indicadores[campo]) {
        semanas.forEach(semana => {
          const valor = indicadores[campo][semana];
          if (valor !== undefined && valor !== null && valor !== "") {
            todosLosValores.push(parseFloat(valor) || 0);
          }
        });
      }
    });
    
    if (todosLosValores.length === 0) return 0;
    return (todosLosValores.reduce((acc, val) => acc + val, 0) / todosLosValores.length).toFixed(2);
  };

  useEffect(() => {
    if (esMultiDepartamentoArea) {
      cargarObjetivosPorArea();
    }
  }, [esMultiDepartamentoArea, area, areaFromState, modulo, mostrarSoloModulo]);

  const manejarEditarFila = async (id) => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede editar objetivos.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setModoEdicion((prev) => ({ ...prev, [id]: true }));
  };

  const manejarCancelarEdicion = (id) => {
    // Recargar datos originales
    cargarObjetivosPorArea();
    setModoEdicion((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const manejarGuardarFila = async (id) => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede guardar objetivos.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const fila = tablaData.find((item) => item._id === id);

    if (!fila.objetivoDescripcion?.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: 'El campo "Objetivo" es requerido.',
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      // Para objetivos multi-departamento, actualizar objetivo específico
      if (fila.esMultiDepartamento && fila.objetivoId) {
        const datosActualizados = {
          objetivoEspecificoId: fila.objetivoEspecificoId,
          objetivo: fila.objetivoDescripcion,
          recursos: fila.recursos,
          metaFrecuencia: fila.metaFrecuencia,
          observaciones: fila.observaciones,
          index: fila.index
        };
        
        console.log('📤 Guardando objetivo:', {
          objetivoId: fila.objetivoId,
          datos: datosActualizados
        });
        
        await api.put(`/api/objetivos/multi/${fila.objetivoId}/objetivo-especifico`, datosActualizados);
        
        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "El objetivo se ha actualizado correctamente.",
          confirmButtonColor: "#3085d6",
        });
        
        // Recargar datos
        await cargarObjetivosPorArea();
        setModoEdicion((prev) => ({ ...prev, [id]: false }));
      }
      
    } catch (error) {
      console.error("Error al guardar objetivo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ha ocurrido un error al guardar. Inténtalo nuevamente.",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const manejarCambioCampo = (id, campo, valor) => {
    setTablaData((prevData) =>
      prevData.map((obj) => (obj._id === id ? { ...obj, [campo]: valor } : obj))
    );
  };

  const manejarCambioIndicador = async (id, campo, semana, valor) => {
    try {
      const fila = tablaData.find((item) => item._id === id);
      
      if (!fila) {
        console.error('❌ Fila no encontrada:', id);
        return;
      }
      
      // ✅ Usar la función extraerObjectId para obtener un ID válido
      const objetivoIdValido = extraerObjectId(fila.objetivoId);
      
      if (!objetivoIdValido) {
        console.error('❌ No se pudo obtener un objetivoId válido para:', fila);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo identificar el objetivo. Por favor, recarga la página.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }
      
      console.log('🔍 Datos para actualizar indicador:', {
        objetivoIdValido: objetivoIdValido,
        objetivoIdOriginal: fila.objetivoId,
        area: fila.area,
        campo: campo,
        semana: semana,
        valor: valor,
        objetivoEspecificoId: fila.objetivoEspecificoId,
        index: fila.index
      });
      
      // Actualizar localmente primero
      setTablaData((prevData) =>
        prevData.map((obj) => {
          if (obj._id === id) {
            const nuevosIndicadores = { ...obj[campo] };
            nuevosIndicadores[semana] = valor;
            
            // Recalcular promedios después de cambiar indicador
            const objActualizado = { ...obj, [campo]: nuevosIndicadores };
            
            // Recalcular promedios basado en qué trimestre cambió
            if (campo.includes('ENE') || campo.includes('FEB') || campo.includes('MAR') || campo.includes('ABR')) {
              objActualizado.promedioENEABR = calcularPromedioTrimestre(
                objActualizado, 
                ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']
              );
            } else if (campo.includes('MAY') || campo.includes('JUN') || campo.includes('JUL') || campo.includes('AGO')) {
              objActualizado.promedioMAYOAGO = calcularPromedioTrimestre(
                objActualizado, 
                ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']
              );
            } else if (campo.includes('SEP') || campo.includes('OCT') || campo.includes('NOV') || campo.includes('DIC')) {
              objActualizado.promedioSEPDIC = calcularPromedioTrimestre(
                objActualizado, 
                ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']
              );
            }
            
            return objActualizado;
          }
          return obj;
        })
      );
      
      // Guardar en el backend para objetivos multi-departamento
      if (fila.esMultiDepartamento && objetivoIdValido) {
        // Obtener los valores actuales del campo
        const valoresActuales = { ...fila[campo] };
        valoresActuales[semana] = valor;
        
        // Crear ID compuesto para enviar al backend
        const idCompleto = `${objetivoIdValido}-${fila.area}-${fila.index}`;
        
        const datosIndicador = {
          area: fila.area,
          campo: campo,
          valores: valoresActuales,
          objetivoEspecificoId: fila.objetivoEspecificoId,
          index: fila.index
        };
        
        console.log('📤 Enviando datos a API:', {
          idCompleto: idCompleto,
          datos: datosIndicador
        });
        
        await api.put(`/api/objetivos/multi/${idCompleto}/indicador`, datosIndicador);
        
        console.log('✅ Indicador actualizado exitosamente');
        
        // Actualizar promedios después de guardar
        setTimeout(() => {
          cargarObjetivosPorArea();
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Error al actualizar indicador:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el indicador. Por favor, intenta de nuevo.',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const getProgressColor = (value) => {
    const numericValue = parseFloat(value);
    if (numericValue >= 90) return "var(--success-color)";
    if (numericValue >= 70) return "var(--warning-color)";
    return "var(--danger-color)";
  };

  const renderProgressBar = (value) => {
    const numericValue = parseFloat(value);
    return (
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ 
            width: `${numericValue}%`, 
            backgroundColor: getProgressColor(numericValue)
          }}
        ></div>
        <span className="progress-value">{numericValue}%</span>
      </div>
    );
  };

  // Renderizar celda de indicador
  const renderIndicadorCell = (fila, campo) => {
    const editando = modoEdicion[fila._id];
    
    if (editando) {
      return (
        <div className="indicador-cell-edit">
          {['S1', 'S2', 'S3', 'S4', 'S5'].map((semana) => (
            <input
              key={semana}
              type="text"
              className="indicador-input"
              value={fila[campo]?.[semana] || ''}
              onChange={(e) => manejarCambioIndicador(fila._id, campo, semana, e.target.value)}
              placeholder={semana}
              style={{ width: '40px', margin: '2px' }}
              maxLength="5"
            />
          ))}
        </div>
      );
    } else {
      const tieneDatos = fila[campo] && Object.values(fila[campo]).some(val => val && val !== '');
      
      if (!tieneDatos) {
        return <span className="text-muted">Sin datos</span>;
      }
      
      return (
        <div className="indicador-cell-view">
          {['S1', 'S2', 'S3', 'S4', 'S5'].map((semana) => (
            <span key={semana} className="indicador-value">
              {fila[campo]?.[semana] || '-'}
            </span>
          ))}
        </div>
      );
    }
  };

  // ✅ CORRECCIÓN CRÍTICA: Pasar los objetivos filtrados y el módulo a frecuencia
  const handleIrAFrecuencia = () => {
    const primerObjetivo = tablaData[0];
    const objetivoIdValido = primerObjetivo ? 
      extraerObjectId(primerObjetivo.objetivoId) : 
      null;
    
    console.log('🚀 Navegando a frecuencia con:', {
      area: areaFromState || area,
      modulo: modulo,
      mostrarSoloModulo: mostrarSoloModulo,
      objetivosCount: tablaData.length
    });
    
    navigate(`/objetivos/frecuencia-area/${encodeURIComponent(areaFromState || area)}`, { 
      state: { 
        esMultiDepartamentoArea: true,
        area: areaFromState || area,
        objetivos: tablaData, // ✅ Pasar los objetivos YA FILTRADOS
        objetivosCount: tablaData.length,
        objetivoIdValido: objetivoIdValido,
        modulo: modulo, // ✅ NUEVO: Pasar el módulo
        mostrarSoloModulo: mostrarSoloModulo // ✅ NUEVO: Pasar la bandera
      } 
    });
  };

  return (
    <div className="objectives-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Objetivos del Sistema de Administración de Calidad</h1>
          <h2>
            {areaFromState || area}
            {/* ✅ Mostrar el módulo si está activo el filtro */}
            {mostrarSoloModulo && modulo && (
              <span className="subtitle"> | Módulo: {modulo}</span>
            )}
            <span className="subtitle"> | {tablaData.length} objetivo(s) multi-departamento</span>
          </h2>
        </div>
        <div className="dashboard-actions">
          <button 
            className="history-button"
            onClick={cargarHistorial}
          >
            <i className="fas fa-history"></i> Ver Historial {añoHistorial}
          </button>
          
          {/* ✅ Botón para ir a frecuencia */}
          <button 
            className="primary-button"
            onClick={handleIrAFrecuencia}
          >
            <i className="fas fa-calendar-alt"></i> Registro de Frecuencia
          </button>
          
          <button 
            className="secondary-button"
            onClick={() => navigate('/menu')}
          >
            <i className="fas fa-arrow-left"></i> Volver al Menú
          </button>
        </div>
      </div>

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay-historia" onClick={() => setShowHistorial(false)}>
          <div className="modal-historial-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-historial-header">
              <h2>📊 HISTORIAL {añoHistorial} - {areaFromState || area}</h2>
              <button className="modal-close-btn" onClick={() => setShowHistorial(false)}>✕</button>
            </div>
            <div className="modal-historial-body">
              <div className="objectives-table-container">
                <table className="objectives-table">
                  <thead>
                    <tr>
                      <th className="column-narrow">#</th>
                      <th className="column-wide">Objetivo</th>
                      <th className="column-medium">Recursos</th>
                      <th className="column-medium">Meta / Frecuencia</th>
                      <th className="column-narrow">ENE - ABR</th>
                      <th className="column-narrow">MAY - AGO</th>
                      <th className="column-narrow">SEP - DIC</th>
                      <th className="column-medium">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.map((row, index) => (
                      <tr key={row._id}>
                        <td className="column-centered">{index + 1}</td>
                        <td>
                          <div className="text-content">
                            <strong>{row.objetivoGeneral}</strong><br/>
                            {row.objetivoDescripcion}
                          </div>
                        </td>
                        <td><div className="text-content">{row.recursos}</div></td>
                        <td><div className="text-content text-center">{row.metaFrecuencia}</div></td>
                        <td className="column-centered">
                          {renderProgressBar(row.promedioENEABR_hist)}
                        </td>
                        <td className="column-centered">
                          {renderProgressBar(row.promedioMAYOAGO_hist)}
                        </td>
                        <td className="column-centered">
                          {renderProgressBar(row.promedioSEPDIC_hist)}
                        </td>
                        <td><div className="text-content">{row.observaciones}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando objetivos...</p>
        </div>
      ) : tablaData.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-clipboard-list empty-icon"></i>
          <h3>No hay objetivos registrados para esta {mostrarSoloModulo ? 'módulo' : 'área'}</h3>
        </div>
      ) : (
        <div className="objectives-table-container">
          <table className="objectives-table">
            <thead>
              <tr>
                <th className="column-narrow">#</th>
                <th className="column-wide">Objetivo General / Específico</th>
                <th className="column-medium">Recursos</th>
                <th className="column-medium">Meta / Frecuencia</th>
                <th className="column-narrow">ENE - ABR</th>
                <th className="column-narrow">MAY - AGO</th>
                <th className="column-narrow">SEP - DIC</th>
                <th className="column-medium">Observaciones</th>
                {userData?.TipoUsuario === "administrador" && (
                  <th className="column-narrow">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tablaData.map((row, index) => {
                const editando = modoEdicion[row._id] === true;
                return (
                  <tr key={row._id} className={editando ? "row-editing" : ""}>
                    <td className="column-centered">{index + 1}</td>
                    <td>
                      {editando ? (
                        <>
                          <div className="objetivo-general-label">
                            <strong>{row.objetivoGeneral}</strong>
                          </div>
                          <textarea
                            className="form-control"
                            value={row.objetivoDescripcion}
                            onChange={(e) => manejarCambioCampo(row._id, "objetivoDescripcion", e.target.value)}
                            placeholder="Describe el objetivo específico..."
                            rows={3}
                          />
                        </>
                      ) : (
                        <div className="text-content">
                          <div className="objetivo-general-label">
                            <strong>{row.objetivoGeneral}</strong>
                          </div>
                          <div className="objetivo-especifico">
                            {row.objetivoDescripcion}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editando ? (
                        <textarea
                          className="form-control"
                          value={row.recursos}
                          onChange={(e) => manejarCambioCampo(row._id, "recursos", e.target.value)}
                          placeholder="Lista los recursos necesarios..."
                          rows={3}
                        />
                      ) : (
                        <div className="text-content">{row.recursos}</div>
                      )}
                    </td>
                    <td>
                      {editando ? (
                        <input
                          type="text"
                          className="form-control"
                          value={row.metaFrecuencia}
                          onChange={(e) => manejarCambioCampo(row._id, "metaFrecuencia", e.target.value)}
                          placeholder="Ej: 100% mensual"
                        />
                      ) : (
                        <div className="text-content text-center">{row.metaFrecuencia}</div>
                      )}
                    </td>
                    <td className="column-centered">
                      {renderProgressBar(row.promedioENEABR)}
                    </td>
                    <td className="column-centered">
                      {renderProgressBar(row.promedioMAYOAGO)}
                    </td>
                    <td className="column-centered">
                      {renderProgressBar(row.promedioSEPDIC)}
                    </td>
                    <td>
                      {editando ? (
                        <textarea
                          className="form-control"
                          value={row.observaciones}
                          onChange={(e) => manejarCambioCampo(row._id, "observaciones", e.target.value)}
                          placeholder="Observaciones adicionales..."
                          rows={2}
                        />
                      ) : (
                        <div className="text-content">{row.observaciones}</div>
                      )}
                    </td>
                    {userData?.TipoUsuario === "administrador" && (
                      <td className="column-actions">
                        {editando ? (
                          <>
                            <button 
                              className="action-button save-button"
                              onClick={() => manejarGuardarFila(row._id)}
                              title="Guardar cambios"
                            >
                              <i className="fas fa-save"></i>
                            </button>
                            <button 
                              className="action-button cancel-button"
                              onClick={() => manejarCancelarEdicion(row._id)}
                              title="Cancelar edición"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        ) : (
                          <button 
                            className="action-button edit-button"
                            onClick={() => manejarEditarFila(row._id)}
                            title="Editar objetivo"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Sección de indicadores detallados - Ahora con tabs para cada objetivo */}
          <div className="indicadores-detallados">
            <h3><i className="fas fa-chart-bar"></i> Indicadores Detallados por Objetivo</h3>
            
            <div className="objetivos-tabs">
              {tablaData.map((objetivo, index) => (
                <div key={objetivo._id} className="objetivo-tab-content">
                  <div className="objetivo-tab-header">
                    <h4>
                      <span className="tab-index">{index + 1}.</span> 
                      {objetivo.objetivoGeneral} - {objetivo.objetivoDescripcion.substring(0, 50)}...
                    </h4>
                  </div>
                  <div className="indicadores-grid">
                    <div className="indicador-periodo">
                      <h5>ENE - ABR</h5>
                      <div className="indicador-meses">
                        <div className="indicador-mes">
                          <span className="mes-label">ENE</span>
                          {renderIndicadorCell(objetivo, 'indicadorENEABR')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">FEB</span>
                          {renderIndicadorCell(objetivo, 'indicadorFEB')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">MAR</span>
                          {renderIndicadorCell(objetivo, 'indicadorMAR')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">ABR</span>
                          {renderIndicadorCell(objetivo, 'indicadorABR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="indicador-periodo">
                      <h5>MAY - AGO</h5>
                      <div className="indicador-meses">
                        <div className="indicador-mes">
                          <span className="mes-label">MAY</span>
                          {renderIndicadorCell(objetivo, 'indicadorMAYOAGO')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">JUN</span>
                          {renderIndicadorCell(objetivo, 'indicadorJUN')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">JUL</span>
                          {renderIndicadorCell(objetivo, 'indicadorJUL')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">AGO</span>
                          {renderIndicadorCell(objetivo, 'indicadorAGO')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="indicador-periodo">
                      <h5>SEP - DIC</h5>
                      <div className="indicador-meses">
                        <div className="indicador-mes">
                          <span className="mes-label">SEP</span>
                          {renderIndicadorCell(objetivo, 'indicadorSEPDIC')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">OCT</span>
                          {renderIndicadorCell(objetivo, 'indicadorOCT')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">NOV</span>
                          {renderIndicadorCell(objetivo, 'indicadorNOV')}
                        </div>
                        <div className="indicador-mes">
                          <span className="mes-label">DIC</span>
                          {renderIndicadorCell(objetivo, 'indicadorDIC')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjetivosMultiTabla;