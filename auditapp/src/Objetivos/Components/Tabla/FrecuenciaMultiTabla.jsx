import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/TablaObjetivosArea.css';

const FrecuenciaMultiAreaTabla = () => {
  const { area } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ CORRECCIÓN: Extraer también el módulo y la bandera
  const { 
    esMultiDepartamentoArea = false, 
    area: areaFromState = '',
    objetivos: objetivosIniciales = [],
    objetivosCount = 0,
    modulo = null, // ✅ NUEVO: Módulo seleccionado
    mostrarSoloModulo = false // ✅ NUEVO: Si solo mostrar ese módulo
  } = location.state || {};

  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [valores, setValores] = useState({});
  const [cambios, setCambios] = useState({});
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial, setAñoHistorial] = useState(2025);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTabHistorial, setActiveTabHistorial] = useState(0);
  const [añoActual] = useState(new Date().getFullYear());

  // Función para extraer ObjectId puro
  const extraerObjectId = (id) => {
    if (!id) return null;
    const objectIdRegex = /[0-9a-fA-F]{24}/;
    const match = id.match(objectIdRegex);
    return match ? match[0] : id;
  };

  // ✅ CORRECCIÓN: Función mejorada para obtener valores de indicadores
  const obtenerValorIndicador = (objetivo, campo) => {
    if (!objetivo || !campo) return { S1: "", S2: "", S3: "", S4: "", S5: "" };
    
    console.log(`🔍 obtenerValorIndicador para campo "${campo}":`, {
      tieneCampoDirecto: !!objetivo[campo],
      tieneIndicadores: !!objetivo.indicadores,
      campoDirecto: objetivo[campo],
      indicadores: objetivo.indicadores?.[campo]
    });
    
    // PRIMERO: Buscar en el campo directo (ej: indicadorENEABR)
    if (objetivo[campo] && typeof objetivo[campo] === 'object') {
      const valores = {
        S1: objetivo[campo].S1 !== undefined && objetivo[campo].S1 !== null && objetivo[campo].S1 !== "" 
          ? objetivo[campo].S1.toString() 
          : "",
        S2: objetivo[campo].S2 !== undefined && objetivo[campo].S2 !== null && objetivo[campo].S2 !== "" 
          ? objetivo[campo].S2.toString() 
          : "",
        S3: objetivo[campo].S3 !== undefined && objetivo[campo].S3 !== null && objetivo[campo].S3 !== "" 
          ? objetivo[campo].S3.toString() 
          : "",
        S4: objetivo[campo].S4 !== undefined && objetivo[campo].S4 !== null && objetivo[campo].S4 !== "" 
          ? objetivo[campo].S4.toString() 
          : "",
        S5: objetivo[campo].S5 !== undefined && objetivo[campo].S5 !== null && objetivo[campo].S5 !== "" 
          ? objetivo[campo].S5.toString() 
          : ""
      };
      
      console.log(`✅ Valores encontrados en campo directo:`, valores);
      return valores;
    }
    
    // SEGUNDO: Buscar en el objeto indicadores (si existe)
    if (objetivo.indicadores && objetivo.indicadores[campo] && typeof objetivo.indicadores[campo] === 'object') {
      const valores = {
        S1: objetivo.indicadores[campo].S1 !== undefined && objetivo.indicadores[campo].S1 !== null && objetivo.indicadores[campo].S1 !== "" 
          ? objetivo.indicadores[campo].S1.toString() 
          : "",
        S2: objetivo.indicadores[campo].S2 !== undefined && objetivo.indicadores[campo].S2 !== null && objetivo.indicadores[campo].S2 !== "" 
          ? objetivo.indicadores[campo].S2.toString() 
          : "",
        S3: objetivo.indicadores[campo].S3 !== undefined && objetivo.indicadores[campo].S3 !== null && objetivo.indicadores[campo].S3 !== "" 
          ? objetivo.indicadores[campo].S3.toString() 
          : "",
        S4: objetivo.indicadores[campo].S4 !== undefined && objetivo.indicadores[campo].S4 !== null && objetivo.indicadores[campo].S4 !== "" 
          ? objetivo.indicadores[campo].S4.toString() 
          : "",
        S5: objetivo.indicadores[campo].S5 !== undefined && objetivo.indicadores[campo].S5 !== null && objetivo.indicadores[campo].S5 !== "" 
          ? objetivo.indicadores[campo].S5.toString() 
          : ""
      };
      
      console.log(`✅ Valores encontrados en indicadores:`, valores);
      return valores;
    }
    
    console.log(`⚠️ No se encontraron valores para el campo "${campo}"`);
    return { S1: "", S2: "", S3: "", S4: "", S5: "" };
  };

  // ✅ CORRECCIÓN CRÍTICA: Cargar objetivos respetando el filtro de módulo
  const cargarObjetivosPorArea = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Iniciando carga de objetivos para frecuencia...');
      console.log('📋 Estado recibido:', {
        area: area || areaFromState,
        modulo: modulo,
        mostrarSoloModulo: mostrarSoloModulo,
        objetivosInicialesCount: objetivosIniciales.length
      });
      
      let objetivosData = [];
      
      // ✅ IMPORTANTE: Si vienen objetivos del estado Y tienen datos completos, usarlos
      // Si no tienen indicadores completos, recargar de la API
      if (objetivosIniciales && objetivosIniciales.length > 0) {
        // Verificar si los objetivos tienen indicadores
        const tienenIndicadores = objetivosIniciales.some(obj => 
          obj.indicadorENEABR && typeof obj.indicadorENEABR === 'object'
        );
        
        if (tienenIndicadores) {
          console.log('✅ Usando objetivos del estado (ya filtrados con indicadores):', objetivosIniciales.length);
          objetivosData = objetivosIniciales;
        } else {
          console.log('⚠️ Objetivos del estado no tienen indicadores, recargando desde API...');
          // Recargar desde API
          const response = await api.get(`/api/objetivos/multi/area?area=${area || areaFromState}`);
          let objetivosDesdeAPI = response.data || [];
          
          // Aplicar el mismo filtro si está activo
          if (mostrarSoloModulo && modulo) {
            console.log('🔍 Filtrando por módulo:', modulo);
            objetivosData = objetivosDesdeAPI.filter(obj => 
              obj.objetivoEspecifico === modulo
            );
            console.log('✅ Objetivos filtrados:', objetivosData.length);
          } else {
            objetivosData = objetivosDesdeAPI;
          }
        }
      } else {
        // Si no hay objetivos en el estado, cargarlos de la API
        console.log('📥 Obteniendo objetivos desde API...');
        const response = await api.get(`/api/objetivos/multi/area?area=${area || areaFromState}`);
        let objetivosDesdeAPI = response.data || [];
        
        // ✅ Aplicar filtro de módulo si está activo
        if (mostrarSoloModulo && modulo) {
          console.log('🔍 Filtrando por módulo:', modulo);
          objetivosData = objetivosDesdeAPI.filter(obj => 
            obj.objetivoEspecifico === modulo
          );
          console.log('✅ Objetivos filtrados:', objetivosData.length);
        } else {
          objetivosData = objetivosDesdeAPI;
        }
      }
      
      console.log('📊 Total objetivos a mostrar:', objetivosData.length);
      
      // Verificar estructura de los datos
      if (objetivosData.length > 0) {
        const primerObjetivo = objetivosData[0];
        console.log('🔍 Primer objetivo completo:', primerObjetivo);
        console.log('🔍 Estructura del primer objetivo:', {
          objetivoGeneral: primerObjetivo.objetivoGeneral,
          objetivoEspecifico: primerObjetivo.objetivoEspecifico,
          descripcion: primerObjetivo.objetivoDescripcion?.substring(0, 50),
          tieneIndicadorENEABR: !!primerObjetivo.indicadorENEABR,
          indicadorENEABR: primerObjetivo.indicadorENEABR,
          tieneObjetoIndicadores: !!primerObjetivo.indicadores,
          keys: Object.keys(primerObjetivo)
        });
        
        // Verificar si hay un objetivo con valores (como Residuos con "100")
        objetivosData.forEach((obj, idx) => {
          if (obj.indicadorENEABR && 
              (obj.indicadorENEABR.S1 || obj.indicadorENEABR.S2 || obj.indicadorENEABR.S3)) {
            console.log(`🔍 Objetivo ${idx + 1} (${obj.objetivoEspecifico}) tiene valores:`, {
              S1: obj.indicadorENEABR.S1,
              S2: obj.indicadorENEABR.S2,
              S3: obj.indicadorENEABR.S3
            });
          }
        });
      }
      
      setObjetivos(objetivosData);
      
      // Inicializar valores para todos los objetivos
      const valoresIniciales = {};
      let totalValores = 0;
      let valoresNoVacios = 0;
      
      objetivosData.forEach((objetivo, index) => {
        const objetivoId = extraerObjectId(objetivo.objetivoIdMulti || objetivo.objetivoId || objetivo._id);
        const objetivoEspecificoId = objetivo.objetivoEspecificoId || objetivo._id;
        const idCompleto = `${objetivoId}_${objetivoEspecificoId}`;
        
        console.log(`\n🔍 Procesando objetivo ${index + 1}:`, {
          idCompleto,
          objetivoGeneral: objetivo.objetivoGeneral,
          objetivoEspecifico: objetivo.objetivoEspecifico,
          descripcion: objetivo.objetivoDescripcion?.substring(0, 30)
        });
        
        const campos = [
          "indicadorENEABR", "indicadorFEB", "indicadorMAR", "indicadorABR",
          "indicadorMAYOAGO", "indicadorJUN", "indicadorJUL", "indicadorAGO",
          "indicadorSEPDIC", "indicadorOCT", "indicadorNOV", "indicadorDIC"
        ];
        
        campos.forEach((campo) => {
          const indicadores = obtenerValorIndicador(objetivo, campo);
          
          // Contar valores no vacíos para este campo
          let valoresEncontrados = 0;
          
          ["S1", "S2", "S3", "S4", "S5"].forEach((semana) => {
            const key = `${idCompleto}.${campo}.${semana}`;
            totalValores++;
            
            const valor = indicadores[semana] || "";
            
            if (valor && valor !== "") {
              valoresNoVacios++;
              valoresEncontrados++;
            }
            
            valoresIniciales[key] = valor;
            
            // Log solo si hay valores
            if (valor && valor !== "" && index < 2) {
              console.log(`   ✅ ${campo}.${semana} = "${valor}"`);
            }
          });
          
          if (valoresEncontrados > 0) {
            console.log(`   📊 Campo ${campo}: ${valoresEncontrados} valores encontrados`);
          }
        });
      });
      
      setValores(valoresIniciales);
      setLoading(false);
      
      console.log('✅ Carga completada exitosamente');
      console.log(`📊 Total objetivos: ${objetivosData.length}`);
      console.log(`📊 Total campos de valores: ${totalValores}`);
      console.log(`📊 Valores no vacíos: ${valoresNoVacios}`);
      
      if (valoresNoVacios > 0) {
        console.log('✅ ¡Se encontraron datos en la base de datos!');
      } else {
        console.log('⚠️ No se encontraron datos en la base de datos. Todos los campos están vacíos.');
      }
      
    } catch (error) {
      console.error('❌ Error al cargar objetivos:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        html: `
          <div style="text-align: left;">
            <p><strong>No se pudieron cargar los objetivos.</strong></p>
            <p>Error: ${error.message}</p>
            <p>Por favor, verifica la conexión al servidor.</p>
          </div>
        `,
        confirmButtonColor: '#4a6fa5',
      });
      
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      const historiales = await Promise.all(
        objetivos.map(async (objetivo) => {
          try {
            if (objetivo.esMultiDepartamento && objetivo.objetivoIdMulti) {
              const response = await api.get(`/api/objetivos/${objetivo.objetivoIdMulti}`);
              const objetivoCompleto = response.data;
              
              const objetivoEspecifico = objetivoCompleto.objetivosEspecificos?.find(
                obj => obj._id === objetivo.objetivoEspecificoId
              );
              
              if (objetivoEspecifico) {
                const historial = objetivoEspecifico.historialAnual?.find(h => h.año === añoHistorial);
                if (historial) {
                  return {
                    ...objetivo,
                    historialSeleccionado: historial,
                    objetivoGeneral: objetivo.objetivoGeneral || objetivoCompleto.nombreObjetivoGeneral
                  };
                }
              }
            }
            return null;
          } catch (error) {
            console.error('Error cargando historial:', error);
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
          confirmButtonColor: '#4a6fa5'
        });
        return;
      }
      
      setHistorialData(historialesFiltrados);
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
    console.log('🎬 useEffect ejecutado en FrecuenciaMultiAreaTabla');
    if (esMultiDepartamentoArea) {
      cargarObjetivosPorArea();
    }
  }, [esMultiDepartamentoArea, area, areaFromState, modulo, mostrarSoloModulo]);

  // Función handleBlur para verificar meta no alcanzada
  const handleBlur = (objetivoId, objetivoEspecificoId, campo, semana, meta) => {
    const idCompleto = `${objetivoId}_${objetivoEspecificoId}`;
    const key = `${idCompleto}.${campo}.${semana}`;
    const valor = valores[key];
    
    console.log(`🔍 handleBlur: ${key} = "${valor}", meta = "${meta}"`);
    
    if (valor && meta) {
      // Extraer número de la meta (ej: "90%" -> 90)
      const matchMeta = meta.match(/(\d+)%/);
      const metaValor = matchMeta ? parseInt(matchMeta[1]) : 100;
      const valorNumerico = parseFloat(valor);
      
      if (!isNaN(valorNumerico) && valorNumerico < metaValor) {
        const objetivo = objetivos.find(obj => {
          const objId = extraerObjectId(obj.objetivoIdMulti || obj.objetivoId || obj._id);
          const objEspecificoId = obj.objetivoEspecificoId || obj._id;
          return `${objId}_${objEspecificoId}` === idCompleto;
        });
        
        if (!objetivo) return;
        
        Swal.fire({
          title: "¡Atención! Meta no alcanzada",
          html: `
            <div style="text-align: left;">
              <p><strong>Objetivo:</strong> ${objetivo.objetivoDescripcion?.substring(0, 80)}...</p>
              <p><strong>Meta establecida:</strong> ${meta}</p>
              <p><strong>Valor registrado:</strong> ${valor}%</p>
              <p><strong>Período:</strong> ${campo.replace('indicador', '')} - Semana ${semana}</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: '#4a6fa5',
          cancelButtonColor: '#6c757d',
          confirmButtonText: "Guardar e Ir a Acciones",
          cancelButtonText: "Cancelar",
          background: '#ffffff',
          color: '#333333',
          width: '500px',
        }).then((result) => {
          if (result.isConfirmed) {
            handleGuardar().then(() => {
              navigate('/registro-accion', {
                state: {
                  idObjetivo: objetivoId,
                  idObjetivoEspecifico: objetivoEspecificoId,
                  objetivo: {
                    numero: objetivos.findIndex(obj => {
                      const objId = extraerObjectId(obj.objetivoIdMulti || obj.objetivoId || obj._id);
                      const objEspecificoId = obj.objetivoEspecificoId || obj._id;
                      return `${objId}_${objEspecificoId}` === idCompleto;
                    }) + 1,
                    objetivo: objetivo.objetivoDescripcion,
                    area: objetivo.area,
                    departamento: objetivo.departamento,
                    esMultiDepartamento: true,
                    objetivoGeneral: objetivo.objetivoGeneral
                  },
                  periodo: campo,
                  semana: semana,
                  label: objetivo.area,
                  esMultiDepartamento: true
                }
              });
            }).catch(error => {
              console.error('Error al guardar:', error);
              Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar la información.',
                icon: 'error',
                background: '#ffffff',
                color: '#333333'
              });
            });
          }
        });
      }
    }
  };

  // Función handleChange
  const handleChange = (e, objetivoId, objetivoEspecificoId) => {
    const { name, value } = e.target;
    const idCompleto = `${objetivoId}_${objetivoEspecificoId}`;
    const key = `${idCompleto}.${name}`;
    
    setValores(prev => ({ ...prev, [key]: value }));
    setCambios(prev => ({ ...prev, [key]: true }));
  };

  // Función handleGuardar
  const handleGuardar = async () => {
    console.log('💾 Iniciando guardado de cambios...');
    console.log(`📊 Cambios pendientes: ${Object.keys(cambios).length}`);
    
    if (Object.keys(cambios).length === 0) {
      Swal.fire({
        title: 'Sin cambios',
        text: 'No hay cambios para guardar.',
        icon: 'info',
        background: '#ffffff',
        color: '#333333',
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }
    
    try {
      const updates = [];
      const grupos = {};
      
      for (const [key] of Object.entries(cambios)) {
        const [idParte, campo, semana] = key.split('.');
        const [objetivoId, objetivoEspecificoId] = idParte.split('_');
        
        const grupoKey = `${objetivoId}_${objetivoEspecificoId}_${campo}`;
        
        if (!grupos[grupoKey]) {
          const objetivo = objetivos.find(obj => {
            const objId = extraerObjectId(obj.objetivoIdMulti || obj.objetivoId || obj._id);
            const objEspecificoId = obj.objetivoEspecificoId || obj._id;
            return objId === objetivoId && objEspecificoId === objetivoEspecificoId;
          });
          
          if (!objetivo) {
            console.warn(`⚠️ Objetivo no encontrado para ${grupoKey}`);
            continue;
          }
          
          grupos[grupoKey] = {
            objetivoId: objetivoId,
            objetivoEspecificoId: objetivoEspecificoId,
            area: objetivo.area,
            campo: campo,
            valores: {},
            index: objetivos.findIndex(obj => {
              const objId = extraerObjectId(obj.objetivoIdMulti || obj.objetivoId || obj._id);
              const objEspecificoId = obj.objetivoEspecificoId || obj._id;
              return objId === objetivoId && objEspecificoId === objetivoEspecificoId;
            })
          };
        }
        
        grupos[grupoKey].valores[semana] = valores[key] || "";
      }
      
      console.log(`🔍 Total grupos a actualizar: ${Object.keys(grupos).length}`);
      
      const resultados = [];
      for (const grupoKey in grupos) {
        const { objetivoId, objetivoEspecificoId, area, campo, valores: valoresCampo, index } = grupos[grupoKey];
        
        const idCompleto = `${objetivoId}-${area}-${index}`;
        
        console.log(`📤 Enviando actualización ${grupoKey}:`, { 
          idCompleto, 
          area, 
          campo, 
          valoresCampo 
        });
        
        try {
          const response = await api.put(`/api/objetivos/multi/${idCompleto}/indicador`, {
            area: area,
            campo: campo,
            valores: valoresCampo,
            objetivoEspecificoId: objetivoEspecificoId,
            index: index
          });
          
          resultados.push({ success: true, campo });
          console.log(`✅ Actualización exitosa: ${campo}`);
        } catch (error) {
          console.error(`❌ Error actualizando ${campo}:`, error);
          resultados.push({ success: false, campo, error });
        }
      }
      
      const exitosos = resultados.filter(r => r.success).length;
      const total = resultados.length;
      
      if (exitosos === total) {
        Swal.fire({
          title: '¡Guardado!',
          text: `Se guardaron ${exitosos} actualizaciones correctamente.`,
          icon: 'success',
          background: '#ffffff',
          color: '#333333',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
      } else if (exitosos > 0) {
        Swal.fire({
          title: 'Guardado parcial',
          text: `Se guardaron ${exitosos} de ${total} actualizaciones.`,
          icon: 'warning',
          background: '#ffffff',
          color: '#333333',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar ninguna actualización.',
          icon: 'error',
          background: '#ffffff',
          color: '#333333'
        });
      }
      
      setCambios({});
      
      console.log('🔄 Recargando datos del backend...');
      await cargarObjetivosPorArea();
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      
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
    
    if (datos.length === 0) return null;
    
    return (
      <div className={`frecuencia-container ${tabActivo === index ? 'active' : ''}`}>
        <div className="frecuencia-header" onClick={() => setTabActivo(index)}>
          <h4>{titulo}</h4>
          <span className="toggle-icon">{tabActivo === index ? '▼' : '►'}</span>
        </div>
        
        {tabActivo === index && (
          <div className="frecuencia-content">
            <div className="multi-area-info">
              <span className="multi-badge">ÁREA: {areaFromState || area}</span>
              {/* ✅ Mostrar el módulo si está activo el filtro */}
              {mostrarSoloModulo && modulo && (
                <span className="multi-badge" style={{ backgroundColor: '#9c27b0' }}>
                  MÓDULO: {modulo}
                </span>
              )}
              <span className="objetivos-count">{datos.length} objetivo(s)</span>
            </div>
            
            <div className="scrollable-table">
              <table className="objetivos-tabla">
                <thead>
                  <tr>
                    <th rowSpan="2" className="header-bg">#</th>
                    <th rowSpan="2" className="header-bg">OBJETIVO</th>
                    <th rowSpan="2" className="header-bg">META</th>
                    <th rowSpan="2" className="header-bg">DEPT</th>
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
                  {datos.map((objetivo, idx) => {
                    const objetivoId = extraerObjectId(objetivo.objetivoIdMulti || objetivo.objetivoId || objetivo._id);
                    const objetivoEspecificoId = objetivo.objetivoEspecificoId || objetivo._id;
                    const idCompleto = `${objetivoId}_${objetivoEspecificoId}`;
                    
                    return (
                      <tr key={`${idCompleto}-${idx}`} 
                          className={idx % 2 === 0 ? "even-row" : "odd-row"}>
                        <td className="objetivo-numero">{idx + 1}</td>
                        <td className="objetivo-desc">
                          <div className="objetivo-general-small">
                            {objetivo.objetivoGeneral}
                          </div>
                          <div className="objetivo-especifico">
                            {objetivo.objetivoDescripcion}
                          </div>
                        </td>
                        <td className="objetivo-meta">{objetivo.metaFrecuencia}</td>
                        <td className="area-departamento">
                          <div className="departamento-sub">{objetivo.departamento}</div>
                        </td>
                        {meses.map((mes) =>
                          ["S1", "S2", "S3", "S4", "S5"].map((semana) => {
                            let valor;
                            
                            if (esHistorial) {
                              valor = objetivo.historialSeleccionado?.indicadores?.[mes.campo]?.[semana] || '';
                            } else {
                              const key = `${idCompleto}.${mes.campo}.${semana}`;
                              valor = valores[key] || '';
                            }
                            
                            return (
                              <td key={`${mes.nombre}-${semana}-${idCompleto}`} className="semana-cell">
                                {esHistorial ? (
                                  <span className="valor-historial">{valor}</span>
                                ) : (
                                  <input
                                    type="text"
                                    name={`${mes.campo}.${semana}`}
                                    value={valor}
                                    onChange={(e) => handleChange(e, objetivoId, objetivoEspecificoId)}
                                    onBlur={() => handleBlur(objetivoId, objetivoEspecificoId, mes.campo, semana, objetivo.metaFrecuencia)}
                                    className="input-frecuencia"
                                    placeholder="0"
                                    maxLength="5"
                                  />
                                )}
                              </td>
                            );
                          })
                        ).flat()}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const periodos = [
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL I',
      meses: [
        { nombre: 'ENE', campo: 'indicadorENEABR' },
        { nombre: 'FEB', campo: 'indicadorFEB' },
        { nombre: 'MAR', campo: 'indicadorMAR' },
        { nombre: 'ABR', campo: 'indicadorABR' },
      ],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL II',
      meses: [
        { nombre: 'MAY', campo: 'indicadorMAYOAGO' },
        { nombre: 'JUN', campo: 'indicadorJUN' },
        { nombre: 'JUL', campo: 'indicadorJUL' },
        { nombre: 'AGO', campo: 'indicadorAGO' },
      ],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL III',
      meses: [
        { nombre: 'SEP', campo: 'indicadorSEPDIC' },
        { nombre: 'OCT', campo: 'indicadorOCT' },
        { nombre: 'NOV', campo: 'indicadorNOV' },
        { nombre: 'DIC', campo: 'indicadorDIC' },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Cargando objetivos...</p>
      </div>
    );
  }

  if (objetivos.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-clipboard-list empty-icon"></i>
        <h3>No hay objetivos registrados para {mostrarSoloModulo ? 'este módulo' : 'esta área'}</h3>
        <button 
          className="btn-volver"
          onClick={() => navigate('/menu')}
        >
          ← VOLVER AL MENÚ
        </button>
      </div>
    );
  }

  return (
    <div className="tabla-container">
      <div className="header-container">
        <h1 className="tabla-titulo">SISTEMA DE GESTIÓN DE CALIDAD</h1>
        <h2 className="tabla-subtitulo">
          SEGUIMIENTO POR FRECUENCIA - ÁREA: {areaFromState || area}
          {/* ✅ Mostrar el módulo en el título si está activo */}
          {mostrarSoloModulo && modulo && ` - MÓDULO: ${modulo}`} - AÑO {añoActual}
        </h2>
      </div>

      <div className="botones-container">
        <button 
          className="button-acciones"
          onClick={() => navigate('/acciones', { 
            state: { 
              esMultiDepartamento: true,
              area: areaFromState || area,
              esMultiArea: true
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
          style={{
            opacity: Object.keys(cambios).length === 0 ? 0.5 : 1,
            cursor: Object.keys(cambios).length === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: Object.keys(cambios).length > 0 ? '#4a6fa5' : '#6c757d'
          }}
        >
          💾 GUARDAR CAMBIOS ({Object.keys(cambios).length})
        </button>

        <button 
          className="btn-volver"
          onClick={() => navigate(`/objetivos/multi-area/${encodeURIComponent(areaFromState || area)}`, { 
            state: { 
              esMultiDepartamentoArea: true,
              area: areaFromState || area,
              objetivos: objetivos,
              objetivosCount: objetivos.length,
              modulo: modulo, // ✅ Pasar el módulo de vuelta
              mostrarSoloModulo: mostrarSoloModulo // ✅ Pasar la bandera de vuelta
            } 
          })}
        >
          ← VOLVER A TABLA PRINCIPAL
        </button>
      </div>

      {/* Modal de Historial */}
      {showHistorial && (
        <div className="modal-overlay" onClick={() => setShowHistorial(false)}>
          <div className="modal-historial" onClick={(e) => e.stopPropagation()}>
            <div className="modal-historial-header">
              <h2>📊 HISTORIAL {añoHistorial} - {areaFromState || area}</h2>
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

      <div className="frecuencias-container">
        {periodos.map((periodo, index) => 
          renderTablaFrecuencia(periodo.meses, periodo.titulo, index, false)
        )}
      </div>

      <div className="footer-note">
        <p>
          Sistema de seguimiento multi-objetivo por área - 
          {areaFromState || area}
          {mostrarSoloModulo && modulo && ` - Módulo: ${modulo}`} - {objetivos.length} objetivo(s) - Año {añoActual}
        </p>
        <p className="changes-counter">
          Cambios pendientes: {Object.keys(cambios).length}
        </p>
      </div>
    </div>
  );
};

export default FrecuenciaMultiAreaTabla;