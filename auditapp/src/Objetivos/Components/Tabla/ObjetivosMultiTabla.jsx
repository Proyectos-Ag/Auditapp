import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from '../../../services/api';
import Swal from "sweetalert2";
import { UserContext } from "../../../App";
import "./ObjetivosTabla.css";

const ObjetivosMultiTabla = () => {
  const { label } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extraer datos del estado de navegación
  const { 
    esMultiDepartamento = false, 
    objetivoGeneral = '',
    area = '',
    departamento = '',
    objetivoId = label // Usar label si no viene en state
  } = location.state || {};

  const [tablaData, setTablaData] = useState([]);
  const [modoEdicion, setModoEdicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [añoHistorial, setAñoHistorial] = useState(2025);
  const [objetivoMultiData, setObjetivoMultiData] = useState(null);

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

  // Obtener objetivo específico por área
  const obtenerObjetivoEspecificoPorArea = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener el objetivo multi-departamento completo
      const response = await api.get(`/api/objetivos/${objetivoId}`);
      const objetivoMulti = response.data;
      setObjetivoMultiData(objetivoMulti);
      
      console.log('📥 Objetivo multi-departamento obtenido:', objetivoMulti);
      
      // 2. Encontrar el objetivo específico para esta área
      const objetivoEspecifico = objetivoMulti.objetivosEspecificos?.find(
        obj => obj.area === area || obj.departamento === departamento
      );
      
      if (!objetivoEspecifico) {
        console.error('❌ No se encontró objetivo específico para:', { area, departamento });
        Swal.fire({
          icon: 'error',
          title: 'Objetivo no encontrado',
          text: `No se encontró objetivo específico para el área/departamento: ${area || departamento}`,
          confirmButtonColor: '#3085d6',
        });
        setTablaData([]);
        return;
      }
      
      // 3. Formatear datos para la tabla (solo un objetivo específico)
      const objetivoFormateado = {
        _id: `${objetivoMulti._id}-${objetivoEspecifico._id}`,
        objetivoMultiId: objetivoMulti._id,
        objetivoEspecificoId: objetivoEspecifico._id,
        area: objetivoEspecifico.area,
        departamento: objetivoEspecifico.departamento,
        objetivo: objetivoEspecifico.objetivo,
        recursos: objetivoEspecifico.recursos,
        metaFrecuencia: objetivoEspecifico.metaFrecuencia,
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
        observaciones: objetivoEspecifico.observaciones || "",
        accionesCorrectivas: objetivoEspecifico.accionesCorrectivas || [],
        historialAnual: objetivoEspecifico.historialAnual || [],
        esMultiDepartamento: true,
        objetivoGeneral: objetivoMulti.nombreObjetivoGeneral
      };
      
      // 4. Calcular promedios
      objetivoFormateado.promedioENEABR = calcularPromedioTrimestre(
        objetivoFormateado, 
        ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']
      );
      objetivoFormateado.promedioMAYOAGO = calcularPromedioTrimestre(
        objetivoFormateado, 
        ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']
      );
      objetivoFormateado.promedioSEPDIC = calcularPromedioTrimestre(
        objetivoFormateado, 
        ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']
      );
      
      setTablaData([objetivoFormateado]);
      console.log('✅ Objetivo específico formateado:', objetivoFormateado);
      
    } catch (error) {
      console.error('❌ Error al obtener objetivo multi-departamento:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo cargar el objetivo. Por favor, intenta de nuevo.',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    if (!tablaData[0]?.objetivoEspecificoId || !objetivoMultiData) return;
    
    try {
      const objetivoEspecifico = tablaData[0];
      const historial = objetivoEspecifico.historialAnual.find(h => h.año === añoHistorial);
      
      if (!historial) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos históricos',
          text: `No hay datos del año ${añoHistorial} para este objetivo.`,
          confirmButtonColor: '#3085d6'
        });
        return;
      }
      
      const objetivoConHistorial = {
        ...objetivoEspecifico,
        historialSeleccionado: historial,
        promedioENEABR_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']),
        promedioMAYOAGO_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']),
        promedioSEPDIC_hist: calcularPromedioTrimestreHistorial(historial.indicadores, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']),
      };
      
      setHistorialData([objetivoConHistorial]);
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

  useEffect(() => {
    if (esMultiDepartamento && objetivoId) {
      obtenerObjetivoEspecificoPorArea();
    }
  }, [esMultiDepartamento, objetivoId, area, departamento]);

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
    if (esMultiDepartamento && objetivoId) {
      obtenerObjetivoEspecificoPorArea();
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
        text: "Sólo el administrador puede guardar objetivos.",
        confirmButtonColor: "#3085d6",
      });
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
      // Para objetivos multi-departamento, actualizar objetivo específico
      if (esMultiDepartamento) {
        const datosActualizados = {
          objetivoEspecificoId: fila.objetivoEspecificoId,
          objetivo: fila.objetivo,
          recursos: fila.recursos,
          metaFrecuencia: fila.metaFrecuencia,
          observaciones: fila.observaciones
        };
        
        await api.put(`/api/objetivos/multi/${fila.objetivoMultiId}/objetivo-especifico`, datosActualizados);
        
        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "El objetivo se ha actualizado correctamente.",
          confirmButtonColor: "#3085d6",
        });
        
        // Recargar datos
        await obtenerObjetivoEspecificoPorArea();
        setModoEdicion((prev) => ({ ...prev, [id]: false }));
      }
      
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ha ocurrido un error al guardar. Inténtalo nuevamente.",
        confirmButtonColor: "#3085d6",
      });
      console.error("Error al guardar objetivo:", error);
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
      
      // Actualizar localmente primero
      setTablaData((prevData) =>
        prevData.map((obj) => {
          if (obj._id === id) {
            const nuevosIndicadores = { ...obj[campo] };
            nuevosIndicadores[semana] = valor;
            return { ...obj, [campo]: nuevosIndicadores };
          }
          return obj;
        })
      );
      
      // Guardar en el backend para objetivos multi-departamento
      if (esMultiDepartamento) {
        const datosIndicador = {
          objetivoMultiId: fila.objetivoMultiId,
          area: fila.area,
          campo: campo,
          valores: { ...fila[campo], [semana]: valor }
        };
        
        await api.put(`/api/objetivos/multi/${fila.objetivoMultiId}/indicador`, datosIndicador);
        
        // Actualizar promedios después de guardar
        setTimeout(() => {
          obtenerObjetivoEspecificoPorArea();
        }, 100);
      }
      
    } catch (error) {
      console.error('Error al actualizar indicador:', error);
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

  return (
    <div className="objectives-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Objetivos del Sistema de Administración de Calidad</h1>
          <h2>
            {esMultiDepartamento ? (
              <>
                {objetivoGeneral || 'Objetivos Generales'} 
                <span className="subtitle"> | Área: {area} | Departamento: {departamento}</span>
              </>
            ) : (
              label
            )}
          </h2>
        </div>
        <div className="dashboard-actions">
          <button 
            className="history-button"
            onClick={cargarHistorial}
          >
            <i className="fas fa-history"></i> Ver Historial {añoHistorial}
          </button>
          <button 
            className="primary-button"
            onClick={() => navigate(`frecuencia/${label}`, { 
              state: { esMultiDepartamento, objetivoGeneral, area, departamento, objetivoId }
            })}
          >
            <i className="fas fa-clipboard-list"></i> Registro de Frecuencia
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
              <h2>📊 HISTORIAL {añoHistorial} - {area || departamento}</h2>
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
          <p>Cargando objetivo...</p>
        </div>
      ) : tablaData.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-clipboard-list empty-icon"></i>
          <h3>No hay objetivo registrado para esta área</h3>
        </div>
      ) : (
        <div className="objectives-table-container">
          {/* Nota informativa para objetivos multi-departamento */}
          {esMultiDepartamento && (
            <div className="multi-departamento-info">
              <i className="fas fa-info-circle"></i>
              <span>
                Este objetivo es parte de un objetivo general multi-departamento: <strong>{objetivoGeneral}</strong>
              </span>
            </div>
          )}
          
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
          
          {/* Sección de indicadores detallados (solo lectura) */}
          <div className="indicadores-detallados">
            <h3><i className="fas fa-chart-bar"></i> Indicadores Detallados</h3>
            <div className="indicadores-grid">
              <div className="indicador-periodo">
                <h4>ENE - ABR</h4>
                {renderIndicadorCell(tablaData[0], 'indicadorENEABR')}
                {renderIndicadorCell(tablaData[0], 'indicadorFEB')}
                {renderIndicadorCell(tablaData[0], 'indicadorMAR')}
                {renderIndicadorCell(tablaData[0], 'indicadorABR')}
              </div>
              <div className="indicador-periodo">
                <h4>MAY - AGO</h4>
                {renderIndicadorCell(tablaData[0], 'indicadorMAYOAGO')}
                {renderIndicadorCell(tablaData[0], 'indicadorJUN')}
                {renderIndicadorCell(tablaData[0], 'indicadorJUL')}
                {renderIndicadorCell(tablaData[0], 'indicadorAGO')}
              </div>
              <div className="indicador-periodo">
                <h4>SEP - DIC</h4>
                {renderIndicadorCell(tablaData[0], 'indicadorSEPDIC')}
                {renderIndicadorCell(tablaData[0], 'indicadorOCT')}
                {renderIndicadorCell(tablaData[0], 'indicadorNOV')}
                {renderIndicadorCell(tablaData[0], 'indicadorDIC')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjetivosMultiTabla;