import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from '../../../services/api';
import Swal from "sweetalert2";
import { UserContext } from "../../../App";
import "./ObjetivosTabla.css";

// ✅ Función para normalizar texto (eliminar acentos, convertir a minúsculas)
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize("NFD") // Descomponer acentos
    .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
    .toLowerCase()
    .trim();
};

// ✅ Función para comparar áreas ignorando mayúsculas/minúsculas y acentos
const compareAreas = (area1, area2) => {
  return normalizeText(area1) === normalizeText(area2);
};

const ObjetivosTabla = () => {
  const { label } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Inicializar estados con los valores del location.state inmediatamente
  const locationState = location.state || {};
  const [esMultiDepartamento, setEsMultiDepartamento] = useState(locationState.esMultiDepartamento || false);
  const [objetivoGeneral, setObjetivoGeneral] = useState(locationState.objetivoGeneral || '');
  const [areaMulti, setAreaMulti] = useState(locationState.area || userData?.area || '');
  const [departamentoMulti, setDepartamentoMulti] = useState(locationState.departamento || '');
  const [objetivoIdMulti, setObjetivoIdMulti] = useState(locationState.objetivoId || label);
  
  const [tablaData, setTablaData] = useState([]);
  const [modoEdicion, setModoEdicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial] = useState(2025);

  // Función para calcular promedio por trimestre
  const calcularPromedioTrimestre = useCallback((objetivo, campos) => {
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
  }, []);

  // ✅ fetchObjetivos optimizado y memoizado
  const fetchObjetivos = useCallback(async () => {
    try {
      setLoading(true);
      
      let response;
      let objetivosData = [];
      
      if (esMultiDepartamento && objetivoIdMulti) {
        // ✅ Cargar objetivo multi-departamento específico
        response = await api.get(`/api/objetivos/${objetivoIdMulti}`);
        
        if (response.data) {
          const objetivoMulti = response.data;
          
          // Área a buscar
          const areaBuscar = areaMulti || userData?.area || '';
          
          if (!areaBuscar) {
            Swal.fire({
              icon: "error",
              title: "Área no especificada",
              text: "No se pudo determinar el área del objetivo multi-departamento.",
              confirmButtonColor: "#3085d6",
            });
            setLoading(false);
            return;
          }
          
          // Normalizar área de búsqueda
          const areaBuscarNormalizada = normalizeText(areaBuscar);
          
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
          }
          
          if (objetivoEspecifico) {
            objetivosData = [{
              _id: objetivoIdMulti + '-' + objetivoEspecifico.area,
              objetivo: objetivoEspecifico.objetivo || '',
              recursos: objetivoEspecifico.recursos || '',
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
              observaciones: objetivoEspecifico.observaciones || '',
              esMultiDepartamento: true,
              objetivoGeneral: objetivoMulti.nombreObjetivoGeneral,
              objetivoIdMulti: objetivoIdMulti,
              area: objetivoEspecifico.area,
              departamento: objetivoEspecifico.departamento
            }];
          }
        }
      } else {
        // ✅ Cargar objetivos tradicionales
        response = await api.get(`/api/objetivos`, {
          params: { area: label },
        });

        objetivosData = response.data.map((objetivo) => ({
          ...objetivo,
          promedioENEABR: calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']),
          promedioMAYOAGO: calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']),
          promedioSEPDIC: calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']),
        }));
      }

      setTablaData(objetivosData);
    } catch (error) {
      console.error("Error al cargar objetivos:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudieron cargar los objetivos. Por favor, intenta de nuevo.",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading(false);
    }
  }, [esMultiDepartamento, objetivoIdMulti, areaMulti, userData?.area, label, calcularPromedioTrimestre]);

  // ✅ useEffect optimizado - se ejecuta inmediatamente
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose', {
      esMultiDepartamento,
      objetivoIdMulti,
      areaMulti,
      label,
      locationState
    });
    
    // Ejecutar fetchObjetivos inmediatamente
    fetchObjetivos();
  }, [fetchObjetivos]); // Solo se ejecuta cuando fetchObjetivos cambia

  // ✅ useEffect adicional para detectar cambios en location.state
  useEffect(() => {
    if (location.state) {
      const { 
        esMultiDepartamento: esMulti, 
        objetivoGeneral: objetivoGen, 
        area, 
        departamento,
        objetivoId 
      } = location.state;
      
      // Solo actualizar si hay cambios reales
      if (esMulti !== esMultiDepartamento) {
        setEsMultiDepartamento(esMulti || false);
      }
      if (objetivoGen !== objetivoGeneral) {
        setObjetivoGeneral(objetivoGen || '');
      }
      if (area !== areaMulti) {
        setAreaMulti(area || userData?.area || '');
      }
      if (departamento !== departamentoMulti) {
        setDepartamentoMulti(departamento || '');
      }
      if (objetivoId !== objetivoIdMulti && objetivoId) {
        setObjetivoIdMulti(objetivoId);
      }
    }
  }, [location.state, esMultiDepartamento, objetivoGeneral, areaMulti, departamentoMulti, objetivoIdMulti, userData?.area]);

  const cargarHistorial = async () => {
    try {
      let response;
      let objetivosConHistorial = [];
      
      if (esMultiDepartamento) {
        response = await api.get(`/api/objetivos/${objetivoIdMulti}`);
        const objetivoMulti = response.data;
        
        const areaBuscarNormalizada = normalizeText(areaMulti || userData?.area || '');
        const objetivoEspecifico = objetivoMulti.objetivosEspecificos?.find(
          obj => normalizeText(obj.area) === areaBuscarNormalizada
        );
        
        if (objetivoEspecifico && objetivoEspecifico.historialAnual) {
          const historial = objetivoEspecifico.historialAnual.find(h => h.año === añoHistorial);
          if (historial) {
            objetivosConHistorial = [{
              ...objetivoEspecifico,
              _id: objetivoIdMulti + '-' + objetivoEspecifico.area,
              historialSeleccionado: historial,
              promedioENEABR_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']),
              promedioMAYOAGO_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']),
              promedioSEPDIC_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']),
            }];
          }
        }
      } else {
        response = await api.get(`/api/objetivos`, { params: { area: label } });
        
        objetivosConHistorial = response.data
          .filter(obj => obj.historialAnual && obj.historialAnual.length > 0)
          .map(obj => {
            const historial = obj.historialAnual.find(h => h.año === añoHistorial);
            if (historial) {
              return {
                ...obj,
                historialSeleccionado: historial,
                promedioENEABR_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']),
                promedioMAYOAGO_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']),
                promedioSEPDIC_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']),
              };
            }
            return null;
          })
          .filter(obj => obj !== null);
      }

      if (objetivosConHistorial.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} para esta área.`,
          confirmButtonColor: '#3085d6'
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

  const manejarAgregarFila = async () => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede agregar filas.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (esMultiDepartamento) {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "No se pueden agregar filas a objetivos multi-departamento.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const result = await Swal.fire({
      title: "¿Seguro que deseas agregar una fila?",
      text: "Se creará una nueva fila en modo edición.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, agregar",
      cancelButtonText: "No, cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    const tempId = `temp-${Date.now()}`;
    const nuevaFila = {
      _id: tempId,
      area: label,
      objetivo: "",
      recursos: "",
      metaFrecuencia: "",
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
      observaciones: "",
    };

    setTablaData((prev) => [...prev, nuevaFila]);
    setModoEdicion((prev) => ({ ...prev, [tempId]: true }));
  };

  const manejarEditarFila = async (id) => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede editar filas.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (esMultiDepartamento) {
      Swal.fire({
        icon: "info",
        title: "Editar objetivo multi-departamento",
        text: "Los objetivos multi-departamento deben editarse desde la pantalla de creación.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setModoEdicion((prev) => ({ ...prev, [id]: true }));
  };

  const manejarCancelarEdicion = (id) => {
    if (id.startsWith("temp-")) {
      setTablaData((prev) => prev.filter((item) => item._id !== id));
    }
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
        text: "Sólo el administrador puede guardar filas.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (esMultiDepartamento) {
      const fila = tablaData.find((item) => item._id === id);
      
      if (!fila.objetivo.trim()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: 'El campo "Objetivo" es requerido.',
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      try {
        const updateData = {
          objetivoEspecificoId: id.includes('-') ? id.split('-')[1] : id,
          objetivo: fila.objetivo,
          recursos: fila.recursos,
          metaFrecuencia: fila.metaFrecuencia,
          indicadorENEABR: fila.indicadorENEABR,
          indicadorFEB: fila.indicadorFEB,
          indicadorMAR: fila.indicadorMAR,
          indicadorABR: fila.indicadorABR,
          indicadorMAYOAGO: fila.indicadorMAYOAGO,
          indicadorJUN: fila.indicadorJUN,
          indicadorJUL: fila.indicadorJUL,
          indicadorAGO: fila.indicadorAGO,
          indicadorSEPDIC: fila.indicadorSEPDIC,
          indicadorOCT: fila.indicadorOCT,
          indicadorNOV: fila.indicadorNOV,
          indicadorDIC: fila.indicadorDIC,
          observaciones: fila.observaciones
        };

        await api.put(`/api/objetivos/multi/${objetivoIdMulti}/objetivo-especifico`, updateData);
        setModoEdicion((prev) => ({ ...prev, [id]: false }));

        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "El objetivo multi-departamento se ha actualizado correctamente.",
          confirmButtonColor: "#3085d6",
        });
        
        await fetchObjetivos();
      } catch (error) {
        console.error("Error al guardar objetivo multi-departamento:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ha ocurrido un error al guardar. Inténtalo nuevamente.",
          confirmButtonColor: "#3085d6",
        });
      }
      return;
    }

    const fila = tablaData.find((item) => item._id === id);

    if (!fila.objetivo.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: 'El campo "Objetivo" es requerido.',
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      if (id.startsWith("temp-")) {
        const { _id, promedioENEABR, promedioMAYOAGO, promedioSEPDIC, ...filaSinId } = fila;
        const response = await api.post(`/api/objetivos`, filaSinId);
        const objetivoCreado = response.data;

        setTablaData((prevData) =>
          prevData.map((obj) => (obj._id === id ? objetivoCreado : obj))
        );
        setModoEdicion((prev) => {
          const { [id]: _, ...rest } = prev;
          return { ...rest, [objetivoCreado._id]: false };
        });
      } else {
        const { promedioENEABR, promedioMAYOAGO, promedioSEPDIC, ...filaParaGuardar } = fila;
        await api.put(`/api/objetivos/${id}`, filaParaGuardar);
        setModoEdicion((prev) => ({ ...prev, [id]: false }));
      }

      Swal.fire({
        icon: "success",
        title: "Guardado",
        text: "El objetivo se ha guardado correctamente.",
        confirmButtonColor: "#3085d6",
      });
      
      await fetchObjetivos();
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

  const manejarEliminarFila = async (id) => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede eliminar filas.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (esMultiDepartamento) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "Los objetivos multi-departamento no pueden eliminarse individualmente.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const result = await Swal.fire({
      title: "¿Seguro que deseas eliminar esta fila?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/objetivos/${id}`);
      setTablaData((prev) => prev.filter((item) => item._id !== id));

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El objetivo se ha eliminado correctamente.",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error("Error al eliminar objetivo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ha ocurrido un error al eliminar. Inténtalo nuevamente.",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const manejarCambioCampo = (id, campo, valor) => {
    setTablaData((prevData) =>
      prevData.map((obj) => (obj._id === id ? { ...obj, [campo]: valor } : obj))
    );
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

  // ✅ Función para navegar a la pantalla de frecuencia
  const navegarAFrecuencia = () => {
    if (esMultiDepartamento) {
      navigate(`/objetivos/frecuencia/multi/${objetivoIdMulti}`, {
        state: {
          area: areaMulti,
          objetivoGeneral: objetivoGeneral,
          esMultiDepartamento: true
        }
      });
    } else {
      navigate(`/objetivos/frecuencia/${label}`);
    }
  };

  return (
    <div className="objectives-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>
            {esMultiDepartamento ? 'OBJETIVOS MULTI-DEPARTAMENTO' : 'OBJETIVOS DEL SISTEMA DE ADMINISTRACIÓN DE CALIDAD'}
          </h1>
          <h2>
            {esMultiDepartamento ? 
              `${objetivoGeneral} - ${areaMulti}` : 
              label
            }
          </h2>
          {esMultiDepartamento && (
            <div className="multi-departamento-info">
              <span className="badge-multi">MULTI-DEPARTAMENTO</span>
              <span className="departamento-info">Departamento: {departamentoMulti}</span>
            </div>
          )}
        </div>
        <div className="dashboard-actions">
          <button 
            className="history-button"
            onClick={cargarHistorial}
            disabled={loading}
          >
            <i className="fas fa-history"></i> Ver Historial {añoHistorial}
          </button>
          <button 
            className="primary-button"
            onClick={navegarAFrecuencia}
            disabled={loading}
          >
            <i className="fas fa-clipboard-list"></i> Registro de Frecuencia
          </button>
          {userData?.TipoUsuario === "administrador" && !esMultiDepartamento && (
            <button 
              className="add-button"
              onClick={manejarAgregarFila}
              disabled={loading}
            >
              <i className="fas fa-plus-circle"></i> Agregar Objetivo
            </button>
          )}
        </div>
      </div>

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay-historia" onClick={() => setShowHistorial(false)}>
          <div className="modal-historial-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-historial-header">
              <h2>📊 HISTORIAL {añoHistorial} - {esMultiDepartamento ? areaMulti.toUpperCase() : label.toUpperCase()}</h2>
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
                        <td><div className="text-content">{row.objetivo}</div></td>
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
          <h3>No hay objetivos registrados</h3>
          {userData?.TipoUsuario === "administrador" && !esMultiDepartamento && (
            <p>Haz clic en "Agregar Objetivo" para comenzar.</p>
          )}
          {esMultiDepartamento && (
            <p>No se encontraron objetivos específicos para esta área.</p>
          )}
        </div>
      ) : (
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
                {userData?.TipoUsuario === "administrador" && !esMultiDepartamento && (
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
                        <textarea
                          className="form-control"
                          value={row.objetivo}
                          onChange={(e) => manejarCambioCampo(row._id, "objetivo", e.target.value)}
                          placeholder="Describe el objetivo..."
                          rows={3}
                        />
                      ) : (
                        <div className="text-content">{row.objetivo}</div>
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
                      {renderProgressBar(row.promedioENEABR || calcularPromedioTrimestre(row, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']))}
                    </td>
                    <td className="column-centered">
                      {renderProgressBar(row.promedioMAYOAGO || calcularPromedioTrimestre(row, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']))}
                    </td>
                    <td className="column-centered">
                      {renderProgressBar(row.promedioSEPDIC || calcularPromedioTrimestre(row, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']))}
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
                    {userData?.TipoUsuario === "administrador" && !esMultiDepartamento && (
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
                        <button 
                          className="action-button delete-button"
                          onClick={() => manejarEliminarFila(row._id)}
                          title="Eliminar objetivo"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ObjetivosTabla;