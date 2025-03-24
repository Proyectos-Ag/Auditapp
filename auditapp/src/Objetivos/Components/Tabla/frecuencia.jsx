import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/TablaObjetivosArea.css';
import { useNavigate } from 'react-router-dom';

const TablaObjetivosArea = () => {
  const { label } = useParams();
  const [objetivos, setObjetivos] = useState([]);
  const [valores, setValores] = useState({});
  const [cambios, setCambios] = useState({});
  const [showPanel, setShowPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [panelSize, setPanelSize] = useState({ width: 500, height: 400 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Evita la selección de texto mientras se arrastra o redimensiona
  useEffect(() => {
    if (dragging || resizing) {
      document.body.classList.add('no-select');
    } else {
      document.body.classList.remove('no-select');
    }
  }, [dragging, resizing]);

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
    } catch (error) {
      console.error("Error al cargar objetivos:", error);
    }
  };

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, resizing]);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) {
      setResizing(true);
    } else {
      setDragging(true);
      setOffset({ x: e.clientX - panelPosition.x, y: e.clientY - panelPosition.y });
    }
    e.preventDefault(); // Evita la selección de texto
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPanelPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
    if (resizing) {
      setPanelSize({ width: e.clientX - panelPosition.x, height: e.clientY - panelPosition.y });
    }
    e.preventDefault(); // Evita la selección de texto
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  useEffect(() => {
    fetchObjetivos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  const handleBlur = (name, objetivoId, meta) => {
    const valor = valores[`${objetivoId}.${name}`];
    if (valor && parseFloat(valor) < parseFloat(meta)) {
      Swal.fire({
        title: "Meta no alcanzada",
        text: "Se guardará la información y se redirigirá a la sección de Acciones Correctivas.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Guardar e Ir a Acciones",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          (async () => {
            try {
              await handleGuardar();
              const objetivo = objetivos.find((obj) => obj._id === objetivoId);
              const objetivoData = {
                numero: objetivos.indexOf(objetivo) + 1,
                objetivo: objetivo.objetivo,
              };
              const periodoData = name.split(".")[0];
              navigate('/acciones', {
                state: {
                  idObjetivo: objetivoId,
                  objetivo: objetivoData,
                  periodo: periodoData,
                },
              });
            } catch (error) {
              Swal.fire('Error', 'No se pudo guardar la información.', 'error');
            }
          })();
        }
      });
    }
  };

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
          if (campo.startsWith('indicador')) {
            const semanas = ["S1", "S2", "S3", "S4", "S5"];
            const indicadorData = semanas.reduce((acc, semana) => {
              acc[semana] = valores[`${objetivoId}.${campo}.${semana}`] || "";
              return acc;
            }, {});
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/objetivos/${objetivoId}`, {
              [campo]: indicadorData,
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
              <th rowSpan="2">OBJ 2025</th>
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
                        onBlur={() => handleBlur(`${mes.campo}.S${i + 1}`, objetivo._id, objetivo.metaFrecuencia, objetivo[mes.campo]?._id)}
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

        <button 
          className="btn-ver-objetivos"
          onClick={() => setShowPanel(!showPanel)}
        >
          Ver Objetivos
        </button>
      </div>

      {showPanel && (
          <div
            className="panel-flotante"
            style={{
              position: 'absolute',
              left: `${panelPosition.x}px`,
              top: `${panelPosition.y}px`,
              width: `${panelSize.width}px`,
              height: `${panelSize.height}px`,
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              padding: '10px',
              cursor: dragging ? 'grabbing' : 'grab',
              resize: 'none',
              overflow: 'auto'
            }}
            onMouseDown={handleMouseDown}
          >
          <div className="resize-handle" />
          <h4>Objetivos del Área: {label}</h4>
          <ul>
            {objetivos.map((objetivo, index) => (
              <li key={objetivo._id}>
                {index + 1}. {objetivo.objetivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        {periodos.map((periodo) => renderTablaMeses(periodo.meses, periodo.titulo))}
      </div>
    </div>
  );
};

export default TablaObjetivosArea;