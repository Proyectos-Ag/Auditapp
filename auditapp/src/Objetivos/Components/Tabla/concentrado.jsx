import React, { useEffect, useState, useContext } from 'react';
import api from '../../../services/api';
import './concentrado.css'; // Asegúrate de importar el archivo CSS actualizado
import { UserContext } from '../../../App';


const ObjetivosComponent = () => {
  const [objetivos, setObjetivos] = useState([]);
    const { userData } = useContext(UserContext);

  

  useEffect(() => {
    const fetchObjetivos = async () => {
      try {
        // Suponiendo que el endpoint de los objetivos está en esta ruta
        const response = await api.get(`/api/objetivos`);
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

  // Función para calcular promedio por trimestre (igual que en el segundo componente)
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

  // Función para calcular el promedio anual (promedio de los promedios trimestrales)
  const calcularPromedioAnual = (objetivo) => {
    const eneAbr = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR']));
    const mayoAgo = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO']));
    const sepDic = parseFloat(calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC']));

    const valores = [eneAbr, mayoAgo, sepDic].filter(v => !isNaN(v) && v > 0);
    if (valores.length === 0) return 0;

    return (valores.reduce((acc, curr) => acc + curr, 0) / valores.length).toFixed(2);
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
                    <td>{calcularPromedioTrimestre(objetivo, ['indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR'])}%</td>
                    <td>{calcularPromedioTrimestre(objetivo, ['indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO'])}%</td>
                    <td>{calcularPromedioTrimestre(objetivo, ['indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'])}%</td>
                    <td>{calcularPromedioAnual(objetivo)}%</td>
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
