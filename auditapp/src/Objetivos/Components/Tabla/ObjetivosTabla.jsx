import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./ObjetivosTabla.css";
import { UserContext } from "../../../App"; // Ajusta la ruta según tu proyecto
import { useNavigate } from "react-router-dom";

const ObjetivosTabla = () => {
  const { label } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const [tablaData, setTablaData] = useState([]);
  const [modoEdicion, setModoEdicion] = useState({});

  const calcularPromedio = (indicador) => {
    if (!indicador || Object.keys(indicador).length === 0) return 0; // Si el objeto está vacío, devuelve 0
    const semanas = ["S1", "S2", "S3", "S4", "S5"];
    const valores = semanas
      .map((semana) => parseFloat(indicador[semana]) || 0)
      .filter((valor) => valor !== 0);
    if (valores.length === 0) return 0;
    return (valores.reduce((acc, val) => acc + val, 0) / valores.length).toFixed(2);
  };
  const fetchObjetivos = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos`, {
        params: { area: label },
      });

      const objetivosData = response.data.map((objetivo) => ({
        ...objetivo,
        promedioENEABR: calcularPromedio(objetivo.indicadorENEABR),
        promedioMAYOAGO: calcularPromedio(objetivo.indicadorMAYOAGO),
        promedioSEPDIC: calcularPromedio(objetivo.indicadorSEPDIC),
      }));

      setTablaData(objetivosData);
    } catch (error) {
      console.error("Error al cargar objetivos:", error);
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
    });
  
    if (!result.isConfirmed) return;
  
    const tempId = `temp-${Date.now()}`;
    const nuevaFila = {
      _id: tempId,
      area: label,
      objetivo: "",
      recursos: "",
      metaFrecuencia: "",
      indicadorENEABR: {}, // Objeto vacío
      indicadorMAYOAGO: {}, // Objeto vacío
      indicadorSEPDIC: {}, // Objeto vacío
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
      });
      return;
    }

    setModoEdicion((prev) => ({ ...prev, [id]: true }));
  };

  const manejarGuardarFila = async (id) => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede guardar filas.",
      });
      return;
    }

    const fila = tablaData.find((item) => item._id === id);

    if (!fila.objetivo.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: 'El campo "Objetivo" es requerido.',
      });
      return;
    }

    if (id.startsWith("temp-")) {
      const { _id, ...filaSinId } = fila;

      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos`, filaSinId);
        const objetivoCreado = response.data;

        setTablaData((prevData) =>
          prevData.map((obj) => (obj._id === id ? objetivoCreado : obj))
        );
        setModoEdicion((prev) => {
          const { [id]: _, ...rest } = prev;
          return { ...rest, [objetivoCreado._id]: false };
        });

        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "El objetivo se ha creado correctamente.",
        });
      } catch (error) {
        console.error("Error al crear objetivo:", error);
      }
    } else {
      try {
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${id}`, fila);
        setModoEdicion((prev) => ({ ...prev, [id]: false }));

        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "El objetivo se ha actualizado correctamente.",
        });
      } catch (error) {
        console.error("Error al actualizar objetivo:", error);
      }
    }
  };

  const manejarEliminarFila = async (id) => {
    if (userData?.TipoUsuario !== "administrador") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Sólo el administrador puede eliminar filas.",
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
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${id}`);
      setTablaData((prev) => prev.filter((item) => item._id !== id));

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El objetivo se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar objetivo:", error);
    }
  };

  const manejarCambioCampo = (id, campo, valor) => {
    setTablaData((prevData) =>
      prevData.map((obj) => (obj._id === id ? { ...obj, [campo]: valor } : obj))
    );
  };

  return (
    <div className="tabla-container">
      <button 
      className="button-frecuencia"
      onClick={() => navigate(`frecuencia/${label}`)}>
        Frecuencia
      </button>
      <h2 className="tabla-titulo">OBJETIVOS DEL SISTEMA DE ADMINISTRACIÓN DE CALIDAD</h2>
      <h3 className="tabla-subtitulo">Área: {label}</h3>

      <table className="objetivos-tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>OBJETIVO</th>
            <th>RECURSOS</th>
            <th>META / FRECUENCIA</th>
            <th>ENE - ABR</th>
            <th>MAYO - AGO</th>
            <th>SEP - DIC</th>
            <th>OBSERVACIONES</th>
            {userData?.TipoUsuario === "administrador" && (
            <th>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
  {tablaData.map((row, index) => {
    const editando = modoEdicion[row._id] === true;
    return (
      <tr key={row._id}>
        <td>{index + 1}</td>
        <td>
          {editando ? (
            <input
              type="text"
              value={row.objetivo}
              onChange={(e) => manejarCambioCampo(row._id, "objetivo", e.target.value)}
            />
          ) : (
            row.objetivo
          )}
        </td>
        <td>
          {editando ? (
            <input
              type="text"
              value={row.recursos}
              onChange={(e) => manejarCambioCampo(row._id, "recursos", e.target.value)}
            />
          ) : (
            row.recursos
          )}
        </td>
        <td>
          {editando ? (
            <input
              type="text"
              value={row.metaFrecuencia}
              onChange={(e) => manejarCambioCampo(row._id, "metaFrecuencia", e.target.value)}
            />
          ) : (
            row.metaFrecuencia
          )}
        </td>
        <td>{row.promedioENEABR}%</td>
        <td>{row.promedioMAYOAGO}%</td>
        <td>{row.promedioSEPDIC}%</td>
        <td>
          {editando ? (
            <input
              type="text"
              value={row.observaciones}
              onChange={(e) => manejarCambioCampo(row._id, "observaciones", e.target.value)}
            />
          ) : (
            row.observaciones
          )}
        </td>
        {userData?.TipoUsuario === "administrador" && (
          <td>
            {editando ? (
              <button 
              className="button-guardar"
              onClick={() => manejarGuardarFila(row._id)}>Guardar</button>
            ) : (
              <button 
              className="button-editar"
              onClick={() => manejarEditarFila(row._id)}>Editar</button>
            )}
            <button 
            className="button-eliminar"
            onClick={() => manejarEliminarFila(row._id)}>Eliminar</button>
          </td>
        )}
      </tr>
    );
  })}
</tbody>
      </table>

      {userData?.TipoUsuario === "administrador" && (
        <div className="agregar-fila-container">
          <button 
          className="button-guardar"
          onClick={manejarAgregarFila}>Agregar Fila</button>
        </div>
      )}
    </div>
  );
};

export default ObjetivosTabla;