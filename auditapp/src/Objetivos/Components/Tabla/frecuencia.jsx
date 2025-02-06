import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/TablaObjetivosArea.css';
import { useNavigate } from 'react-router-dom';


const TablaObjetivosArea = () => {
  const { label } = useParams();
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [valores, setValores] = useState({});
  const [cambios, setCambios] = useState({});
  const navigate = useNavigate();
  

  const fetchObjetivos = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos`,
        { params: { area: label } }
      );
      const objetivosData = response.data;

      const valoresIniciales = {};
      objetivosData.forEach((objetivo) => {
        [
          "indicadorENEABR",
          "indicadorFEB",
          "indicadorMAR",
          "indicadorABR",
          "indicadorMAYOAGO",
          "indicadorJUN",
          "indicadorJUL",
          "indicadorAGO",
          "indicadorSEPDIC",
          "indicadorOCT",
          "indicadorNOV",
          "indicadorDIC",
        ].forEach((campo) => {
          if (objetivo[campo]) {
            ["S1", "S2", "S3", "S4", "S5"].forEach((semana) => {
              valoresIniciales[`${objetivo._id}.${campo}.${semana}`] =
                objetivo[campo][semana] || "";
            });
          }
        });
      });

      setObjetivos(objetivosData);
      setValores(valoresIniciales);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar objetivos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjetivos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  if (loading) {
    return <div>Cargando objetivos...</div>;
  }

  if (!objetivos || objetivos.length === 0) {
    return <div>No hay objetivos registrados para esta área.</div>;
  }

  const handleBlur = (name, objetivoId, meta) => {
    const valor = valores[`${objetivoId}.${name}`];
    if (valor && parseFloat(valor) < parseFloat(meta)) {
      Swal.fire({
        title: "Meta no alcanzada",
        text: "Ingresa a la siguiente pestaña para poner acciones correctivas.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ir a Acciones",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          // Obtener el objetivo seleccionado
          const objetivo = objetivos.find((obj) => obj._id === objetivoId);
          // Construir los datos que se quieren pasar
          const objetivoData = {
            numero: objetivos.indexOf(objetivo) + 1,
            objetivo: objetivo.objetivo,
          };
          const periodoData = name.split(".")[0]; // Extraer el periodo
  
          // Navegar a la ruta /acciones pasando los datos en el state
          navigate('/acciones', {
            state: {
              idObjetivo: objetivoId,
              objetivo: objetivoData,
              periodo: periodoData,
            },
          });
        }
      });
    }
  };

  if (loading) {
    return <div>Cargando objetivos...</div>;
  }

  if (!objetivos || objetivos.length === 0) {
    return <div>No hay objetivos registrados para esta área.</div>;
  }

  const handleChange = (e, objetivoId) => {
    const { name, value } = e.target;
    setValores({ ...valores, [`${objetivoId}.${name}`]: value });
    setCambios({ ...cambios, [`${objetivoId}.${name}`]: true });
  };

  const handleGuardar = async () => {
    try {
      for (const [key, value] of Object.entries(cambios)) {
        if (value) {
          const [objetivoId, campo] = key.split('.');
  
          // Si el campo pertenece a un indicador, asegurarse de enviar un objeto con la estructura esperada
          if (campo.startsWith('indicador')) {
            const semanas = ["S1", "S2", "S3", "S4", "S5"];
            const indicadorData = semanas.reduce((acc, semana) => {
              acc[semana] = valores[`${objetivoId}.${campo}.${semana}`] || "";
              return acc;
            }, {});
  
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${objetivoId}`, {
              [campo]: indicadorData, // Enviar el objeto completo
            });
          } else {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${objetivoId}`, {
              [campo]: isNaN(valores[key]) ? valores[key] : Number(valores[key]),
            });
          }
        }
      }
      Swal.fire('Guardado', 'Los datos han sido guardados exitosamente.', 'success');
      setCambios({});
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      Swal.fire('Error', 'No se pudo guardar la información.', 'error');
    }
  };

  const renderTablaMeses = (meses, titulo) => {
    return (
      <div className="meses-container">

        <h4>{titulo}</h4>
        <table className="objetivos-tabla">
          <thead>
            <tr>
              <th rowSpan="2" style={{}}>OBJ 2025</th>
              <th rowSpan="2">META</th>
              {meses.map((mes) => (
                <th colSpan="5" key={mes.nombre}>{mes.nombre}</th>
              ))}
            </tr>
            <tr>
              {meses.map((mes) =>
                Array.from({ length: 5 }, (_, i) => (
                  <th key={`${mes.nombre}-S${i + 1}`}>S{i + 1}</th>
                ))
              ).flat()}
            </tr>
          </thead>
          <tbody>
            {objetivos.map((objetivo, index) => (
              <tr key={objetivo._id}>
                <td>{index + 1}</td>
                <td>{objetivo.metaFrecuencia}</td>
                {meses.map((mes) =>
                  Array.from({ length: 5 }, (_, i) => (
                    <td key={`${mes.nombre}-${i}`}>
                      <input
                        type="text"
                        name={`${mes.campo}.S${i + 1}`}
                        value={valores[`${objetivo._id}.${mes.campo}.S${i + 1}`] || ''}
                        onChange={(e) => handleChange(e, objetivo._id)}
                        onBlur={() => handleBlur(`${mes.campo}.S${i + 1}`, objetivo._id, objetivo.metaFrecuencia,objetivo[mes.campo]?._id)}
                      />
                    </td>
                  ))
                ).flat()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const periodos = [
    {
      titulo: 'ENERO - ABRIL',
      meses: [
        { nombre: 'ENERO', campo: 'indicadorENEABR' },
        { nombre: 'FEBRERO', campo: 'indicadorFEB' },
        { nombre: 'MARZO', campo: 'indicadorMAR' },
        { nombre: 'ABRIL', campo: 'indicadorABR' },
      ],
    },
    {
      titulo: 'MAYO - AGOSTO',
      meses: [
        { nombre: 'MAYO', campo: 'indicadorMAYOAGO' },
        { nombre: 'JUNIO', campo: 'indicadorJUN' },
        { nombre: 'JULIO', campo: 'indicadorJUL' },
        { nombre: 'AGOSTO', campo: 'indicadorAGO' },
      ],
    },
    {
      titulo: 'SEPTIEMBRE - DICIEMBRE',
      meses: [
        { nombre: 'SEPTIEMBRE', campo: 'indicadorSEPDIC' },
        { nombre: 'OCTUBRE', campo: 'indicadorOCT' },
        { nombre: 'NOVIEMBRE', campo: 'indicadorNOV' },
        { nombre: 'DICIEMBRE', campo: 'indicadorDIC' },
      ],
    },
  ];

  return (
    <div className="tabla-container">
      <h2 className="tabla-titulo">OBJETIVOS DEL SISTEMA DE ADMINISTRACIÓN DE CALIDAD E INOCUIDAD DE LOS ALIMENTOS</h2>
      <h3 className="tabla-subtitulo">Área: {label}</h3>
      <div className="botones-container">
      <button 
        className="button-acciones"
        onClick={() => navigate(`/acciones-list/${label}`)}
      >
        Acciones Correctivas
      </button>

      <button 
        className="btn-guardar"
        onClick={handleGuardar}
      >
        Guardar
      </button>
      </div>
      
      <div >
      {periodos.map((periodo) => renderTablaMeses(periodo.meses, periodo.titulo))}
      
      </div>
      
    </div>
  );
};

export default TablaObjetivosArea;