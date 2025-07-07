import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { UserContext } from "../../../App";
import "./ObjetivosTabla.css";

const ObjetivosTabla = () => {
  const { label } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const [tablaData, setTablaData] = useState([]);
  const [modoEdicion, setModoEdicion] = useState({});
  const [loading, setLoading] = useState(true);

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

  const fetchObjetivos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos`, {
        params: { area: label },
      });

      const objetivosData = response.data.map((objetivo) => ({
        ...objetivo,
        promedioENEABR: calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']),
        promedioMAYOAGO: calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']),
        promedioSEPDIC: calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']),
      }));

      setTablaData(objetivosData);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudieron cargar los objetivos. Por favor, intenta de nuevo.",
        confirmButtonColor: "#3085d6",
      });
      console.error("Error al cargar objetivos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (label) {
      fetchObjetivos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

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
      indicadorENEABR: {},
      indicadorFEB: {},
      indicadorMAR: {},
      indicadorABR: {},
      indicadorMAYOAGO: {},
      indicadorJUN: {},
      indicadorJUL: {},
      indicadorAGO: {},
      indicadorSEPDIC: {},
      indicadorOCT: {},
      indicadorNOV: {},
      indicadorDIC: {},
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

    setModoEdicion((prev) => ({ ...prev, [id]: true }));
  };

  const manejarCancelarEdicion = (id) => {
    // Si es una fila temporal, la eliminamos
    if (id.startsWith("temp-")) {
      setTablaData((prev) => prev.filter((item) => item._id !== id));
    }
    // Si es una fila existente, solo quitamos el modo de edición
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
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos`, filaSinId);
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
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${id}`, filaParaGuardar);
        setModoEdicion((prev) => ({ ...prev, [id]: false }));
      }

      Swal.fire({
        icon: "success",
        title: "Guardado",
        text: "El objetivo se ha guardado correctamente.",
        confirmButtonColor: "#3085d6",
      });
      
      // Recalcular promedios después de guardar
      await fetchObjetivos();
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
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${id}`);
      setTablaData((prev) => prev.filter((item) => item._id !== id));

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El objetivo se ha eliminado correctamente.",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ha ocurrido un error al eliminar. Inténtalo nuevamente.",
        confirmButtonColor: "#3085d6",
      });
      console.error("Error al eliminar objetivo:", error);
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

  return (
    <div className="objectives-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Objetivos del Sistema de Administración de Calidad</h1>
          <h2>{label}</h2>
        </div>
        <div className="dashboard-actions">
          <button 
            className="primary-button"
            onClick={() => navigate(`frecuencia/${label}`)}
          >
            <i className="fas fa-clipboard-list"></i> Registro de Frecuencia
          </button>
          {userData?.TipoUsuario === "administrador" && (
            <button 
              className="add-button"
              onClick={manejarAgregarFila}
            >
              <i className="fas fa-plus-circle"></i> Agregar Objetivo
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando objetivos...</p>
        </div>
      ) : tablaData.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-clipboard-list empty-icon"></i>
          <h3>No hay objetivos registrados</h3>
          {userData?.TipoUsuario === "administrador" && (
            <p>Haz clic en "Agregar Objetivo" para comenzar.</p>
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
