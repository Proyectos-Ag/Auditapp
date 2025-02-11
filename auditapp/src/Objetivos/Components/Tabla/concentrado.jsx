import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './concentrado.css'; // Asegúrate de importar el archivo CSS actualizado

const ObjetivosComponent = () => {
  const [objetivos, setObjetivos] = useState([]);
  const [userData, setUserData] = useState({});

  // Obtener datos del usuario desde el almacenamiento local
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userData")) || {};
    setUserData(user);
  }, []);

  useEffect(() => {
    const fetchObjetivos = async () => {
      try {
        // Suponiendo que el endpoint de los objetivos está en esta ruta
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos`);
        let data = response.data;

        // Obtener área del usuario
        const areaUsuario = userData?.area?.trim() || userData?.Departamento?.trim() || "";
        const esAdmin = userData?.TipoUsuario?.toLowerCase() === "administrador";

        // Filtrar los objetivos dependiendo del tipo de usuario
        if (!esAdmin && areaUsuario) {
          // Filtrar los objetivos por área si no es administrador
          data = data.filter((objetivo) => objetivo.area.toLowerCase() === areaUsuario.toLowerCase());
        } else if (!esAdmin && !areaUsuario) {
          // Si el usuario no tiene área asignada, no mostrar objetivos
          data = [];
        }

        setObjetivos(data);
      } catch (error) {
        console.error('Error al obtener los objetivos:', error);
      }
    };

    fetchObjetivos();
  }, [userData]);

  // Función para calcular el promedio de las semanas (solo promedia si hay valores)
  const calcularPromedioSemana = (semana) => {
    const valores = ["S1", "S2", "S3", "S4", "S5"].map((key) => parseFloat(semana[key]) || 0);
    const semanasConDatos = valores.filter((valor) => valor > 0); // Filtra solo los valores positivos

    // Si no hay datos en ninguna semana, retornar 0
    if (semanasConDatos.length === 0) return 0;

    const suma = semanasConDatos.reduce((acc, curr) => acc + curr, 0);
    return suma / semanasConDatos.length;
  };

  // Función para calcular el promedio de los indicadores ENEABR, MAYOAGO, SEPDIC
  const calcularPromedioIndicador = (indicador) => {
    return calcularPromedioSemana(indicador);
  };

  // Función para calcular el promedio anual (promedio de los promedios semanales de cada indicador)
  const calcularPromedioAnual = (indicadores) => {
    const eneAbr = calcularPromedioIndicador(indicadores.indicadorENEABR);
    const mayoAgo = calcularPromedioIndicador(indicadores.indicadorMAYOAGO);
    const sepDic = calcularPromedioIndicador(indicadores.indicadorSEPDIC);

    const valores = [eneAbr, mayoAgo, sepDic];

    // Si no hay datos válidos, retornar 0
    const suma = valores.reduce((acc, curr) => acc + curr, 0);
    const validos = valores.filter((v) => v > 0).length;

    if (validos === 0) return 0;

    return suma / validos;
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
      <p>Área del usuario: {userData?.area || userData?.Departamento}</p>
      
      {Object.keys(objetivosPorArea).map((area) => (
        <div key={area}>
          {/* Separador de área */}
          <div className="area-separator">
            <span>{area}</span>
          </div>
          <table className="safety-table">
            <thead>
              <tr>
                <th>Departamento</th>
                <th>No. Objetivo</th>
                <th>Promedio ENE-ABR</th>
                <th>Promedio MAYO-AGO</th>
                <th>Promedio SEP-DIC</th>
                <th>Promedio Anual</th>
              </tr>
            </thead>
            <tbody>
            {objetivosPorArea[area].map((objetivo, index) => {
  const isFirstInArea = index === 0 || objetivo.area !== objetivosPorArea[area][index - 1].area;

  return (
    <tr key={objetivo._id}>
      {/* Solo renderiza la celda "Departamento" en la primera fila del área */}
      {isFirstInArea ? (
        <td rowSpan={objetivosPorArea[area].length}>{objetivo.area}</td>
      ) : null}
      {/* Número del objetivo */}
      <td>{index + 1}</td>
      <td>{calcularPromedioIndicador(objetivo.indicadorENEABR).toFixed(2)}%</td>
      <td>{calcularPromedioIndicador(objetivo.indicadorMAYOAGO).toFixed(2)}%</td>
      <td>{calcularPromedioIndicador(objetivo.indicadorSEPDIC).toFixed(2)}%</td>
      <td>{calcularPromedioAnual(objetivo).toFixed(2)}%</td>
    </tr>
  );
})}
            </tbody>
          </table>
          <hr className="area-separator-line" />
        </div>
      ))}
    </div>
  );
};

export default ObjetivosComponent;
