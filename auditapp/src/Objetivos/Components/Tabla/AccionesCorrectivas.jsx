import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AccionesCorrectivas.css";
import Swal from "sweetalert2";

const AccionesCorrectivas = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extraemos la información pasada en el state de navigate
  const { idObjetivo, objetivo, periodo } = location.state || {};

  // Si no se recibe la información necesaria, redirigimos al usuario (por ejemplo, a la página principal)
  useEffect(() => {
    if (!idObjetivo || !objetivo || !periodo) {
      navigate("/");
    }
  }, [idObjetivo, objetivo, periodo, navigate]);

  const [fila, setFila] = useState({
    fecha: new Date().toLocaleDateString(),
    noObjetivo: objetivo ? objetivo.numero : "",
    objetivo: objetivo ? objetivo.objetivo : "",
    periodo: periodo || "",
    acciones: "",
    fichaCompromiso: "",
    responsable: "",
    efectividad: "",
    observaciones: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFila((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    try {
      console.log("ID del objetivo:", idObjetivo); // Depuración
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${idObjetivo}/acciones-correctivas`,
        fila,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status !== 201) {
        throw new Error("Error al guardar la acción correctiva");
      }
  
      console.log("Objetivo recibido en AccionesCorrectivas:", objetivo);
      console.log(
        "URL de la solicitud:",
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${idObjetivo}/acciones-correctivas`
      );
      console.log("Datos a enviar:", fila);
  
      // Alerta de éxito con Swal
      Swal.fire({
        icon: "success",
        title: "Guardado exitoso",
        text: "La acción correctiva se ha guardado correctamente.",
        confirmButtonText: "OK",
      });
  
      // navigate("/");
    } catch (error) {
      console.error("Error al guardar la acción correctiva:", error);
  
      // Alerta de error con Swal
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar la acción correctiva.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="acciones-correctivas-container">
      <h2>Acciones Correctivas</h2>
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
          <tr>
            <td>{fila.fecha}</td>
            <td>{fila.noObjetivo}</td>
            <td>{fila.periodo}</td>
            <td>
              <input
                type="text"
                name="acciones"
                value={fila.acciones}
                onChange={handleChange}
              />
            </td>
            <td>
              <input
                type="text"
                name="fichaCompromiso"
                value={fila.fichaCompromiso}
                onChange={handleChange}
              />
            </td>
            <td>
              <input
                type="text"
                name="responsable"
                value={fila.responsable}
                onChange={handleChange}
              />
            </td>
            <td>
              <input
                type="text"
                name="efectividad"
                value={fila.efectividad}
                onChange={handleChange}
              />
            </td>
            <td>
              <input
                type="text"
                name="observaciones"
                value={fila.observaciones}
                onChange={handleChange}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleGuardar}>Guardar</button>
    </div>
  );
};

export default AccionesCorrectivas;