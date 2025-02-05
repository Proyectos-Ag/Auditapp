import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./AccionesCorrectivas.css";

const AccionesCorrectivasList = () => {
  const { label } = useParams();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAcciones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  if (loading) {
    return <div className="acciones-correctivas-container">Cargando acciones correctivas...</div>;
  }

  if (acciones.length === 0) {
    return (
      <div className="acciones-correctivas-container">
        No hay acciones correctivas registradas para el área <strong>{label}</strong>.
      </div>
    );
  }

  return (
    <div className="acciones-correctivas-container">
      <h2>Acciones Correctivas para el Área: {label}</h2>
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
          {acciones.map((accion, index) => (
            <tr key={index}>
              <td>{accion.fecha}</td>
              <td>{accion.noObjetivo}</td>
              <td>{accion.periodo}</td>
              <td>{accion.acciones}</td>
              <td>{accion.fichaCompromiso}</td>
              <td>{accion.responsable}</td>
              <td>{accion.efectividad}</td>
              <td>{accion.observaciones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccionesCorrectivasList;