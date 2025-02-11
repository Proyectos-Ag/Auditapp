import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./AccionesCorrectivas.css";

const AccionesCorrectivasList = () => {
  const { label } = useParams();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReprogramar, setShowReprogramar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const fetchAcciones = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos/acciones`,
        { params: { area: label } }
      );
      setAcciones(response.data);
    } catch (error) {
      console.error("Error al cargar acciones correctivas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReprogramar = async (accionId) => {
    if (!nuevaFecha) {
      alert("Por favor selecciona una fecha válida");
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos/acciones/${accionId}/reprogramar`,
        { nuevaFecha }
      );
      await fetchAcciones();
      setShowReprogramar(null);
      setNuevaFecha("");
    } catch (error) {
      console.error("Error al actualizar fecha:", error);
    }
  };

  useEffect(() => {
    fetchAcciones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  if (loading) return <div className="acciones-correctivas-container">Cargando...</div>;

  return (
    <div className="acciones-correctivas-container">
      <h2>Acciones Correctivas para {label}</h2>
      <table className="acciones-correctivas-tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>No. Objetivo</th>
            <th>Periodo</th>
            <th>Acciones</th>
            <th>Fecha Compromiso</th>
            <th>Responsable</th>
            <th>Efectividad</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {acciones.map((accion) => (
            <tr key={accion._id}>
              <td>{accion.fecha}</td>
              <td>{accion.noObjetivo}</td>
              <td>{accion.periodo}</td>
              <td>{accion.acciones}</td>
              <td>
                <div className="fecha-actual">{accion.fichaCompromiso}</div>
                {accion.historialFechas?.map((fecha, idx) => (
                  <div key={idx} className="fecha-anterior">
                    Anterior: {fecha}
                  </div>
                ))}
                <button 
                  onClick={() => setShowReprogramar(accion._id)}
                  className="btn-reprogramar"
                >
                  Reprogramar
                </button>
                
                {showReprogramar === accion._id && (
                  <div className="reprogramar-container">
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                    />
                    <button 
                      onClick={() => handleReprogramar(accion._id)}
                      className="btn-guardar"
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={() => setShowReprogramar(null)}
                      className="btn-cancelar"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </td>
              <td>{accion.responsable}</td>
              <td style={{ backgroundColor: efectividadColors[accion.efectividad] }}>
                {accion.efectividad}
              </td>
              <td>{accion.observaciones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const efectividadColors = {
  '0%': '#ff9999',
  '25%': '#ffcc99',
  '50%': '#ffff99',
  '75%': '#99cc99',
  '100%': '#99ff99'
};

export default AccionesCorrectivasList;