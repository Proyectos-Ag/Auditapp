import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../../../App";
import './ObjetivosList.css';  // Asegúrate de importar el archivo CSS actualizado

const ObjetivosComponent = () => {
  const { userData } = useContext(UserContext);
  const [objetivos, setObjetivos] = useState([]);

  // Asegurar que `area` siempre tenga valor
  const areaUsuario = userData?.area?.trim() || userData?.Departamento?.trim() || "";
  const esAdmin = userData?.TipoUsuario?.toLowerCase() === "administrador";

  console.log("Datos completos del usuario:", userData);
  console.log("Área obtenida:", areaUsuario);

  useEffect(() => {
    const fetchObjetivos = async () => {
      try {
        if (!process.env.REACT_APP_BACKEND_URL) {
          console.error("Error: REACT_APP_BACKEND_URL no está definido en .env");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos`);
        let data = response.data;

        console.log("Objetivos obtenidos antes del filtro:", data);

        // Convertir tanto el área del usuario como el área del objetivo a minúsculas
        const areaUsuarioLower = areaUsuario.toLowerCase();

        if (!esAdmin && areaUsuario) {
          // Filtrar comparando las áreas en minúsculas
          data = data.filter(objetivo => objetivo.area.toLowerCase() === areaUsuarioLower);
          console.log("Objetivos filtrados para el usuario:", data);
        } else if (!esAdmin && !areaUsuario) {
          console.warn("El usuario no tiene área asignada, no se pueden filtrar los objetivos.");
          data = [];
        }

        setObjetivos(data);
      } catch (error) {
        console.error("Error al obtener objetivos", error);
      }
    };
    fetchObjetivos();
  }, [areaUsuario, esAdmin]);

  // Función para calcular el promedio de los indicadores
  const calcularPromedio = (indicador) => {
    if (!indicador || Object.keys(indicador).length === 0) return 0; // Si el objeto está vacío, devuelve 0
  
    const semanas = ["S1", "S2", "S3", "S4", "S5"];
    const valores = semanas
      .map((semana) => parseFloat(indicador[semana]) || 0) // Convertir los valores a números, usando 0 si no son válidos
      .filter((valor) => valor !== 0); // Filtrar solo los valores válidos
  
    if (valores.length === 0) return 0; // Si no hay valores válidos, devuelve 0
  
    // Calcular el promedio de los valores
    const suma = valores.reduce((acc, val) => acc + val, 0);
    const promedio = suma / valores.length;
  
    // Verificar si los valores parecen estar en porcentaje (mayores que 1), si es así, no multiplicar por 100
    const esPorcentaje = promedio > 1;
  
    // Si es un porcentaje, no lo multiplicamos por 100
    return (esPorcentaje ? promedio : promedio * 100).toFixed(2); // Redondeamos a dos decimales
  };
  

  // Agrupar los objetivos por área
  const objetivosPorArea = objetivos.reduce((acc, objetivo) => {
    const area = objetivo.area;
    if (!acc[area]) acc[area] = [];
    acc[area].push(objetivo);
    return acc;
  }, {});

  return (
    <div className="safety-container">
      <h2>Objetivos del Sistema</h2>
      <p>Área del usuario: {areaUsuario}</p>
      
      {Object.keys(objetivosPorArea).length === 0 ? (
        <p>No hay objetivos disponibles</p>
      ) : (
        Object.keys(objetivosPorArea).map((area) => (
          <div key={area}>
            {/* Título de la sección para el área */}
            <h3 className="area-separator">{area}</h3>
            <table className="safety-table">
              <thead>
                <tr>
                  <th>Objetivo</th>
                  <th>Recursos</th>
                  <th>Meta / Frecuencia</th>
                  <th>Indicador ENE-ABR</th>
                  <th>Indicador MAYO-AGO</th>
                  <th>Indicador SEP-DIC</th>
                </tr>
              </thead>
              <tbody>
                {objetivosPorArea[area].map((objetivo) => (
                  <tr key={objetivo._id}>
                    <td>{objetivo.objetivo}</td>
                    <td>{objetivo.recursos}</td>
                    <td>{objetivo.metaFrecuencia}</td>
                    {/* Calcular el promedio de los indicadores */}
                    <td>{calcularPromedio(objetivo.indicadorENEABR)}%</td>
                    <td>{calcularPromedio(objetivo.indicadorMAYOAGO)}%</td>
                    <td>{calcularPromedio(objetivo.indicadorSEPDIC)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="area-separator-line" />
          </div>
        ))
      )}
    </div>
  );
};

export default ObjetivosComponent;
