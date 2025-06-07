import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/TablaObjetivosArea.css';

const TablaObjetivosArea = () => {
  const { label } = useParams();
  const navigate = useNavigate();
  const [objetivos, setObjetivos] = useState([]);
  const [, setLoading] = useState(true);
  const [valores, setValores] = useState({});
  const [cambios, setCambios] = useState({});
  const [showPanel, setShowPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [panelSize, setPanelSize] = useState({ width: 500, height: 400 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (dragging || resizing) {
      document.body.classList.add('no-select');
    } else {
      document.body.classList.remove('no-select');
    }
  }, [dragging, resizing]);

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
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPanelPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
    if (resizing) {
      setPanelSize({ 
        width: Math.max(300, e.clientX - panelPosition.x), 
        height: Math.max(200, e.clientY - panelPosition.y) 
      });
    }
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  useEffect(() => {
    async function fetchObjetivos() {
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
    }
    fetchObjetivos();
  }, [label]);

  const handleBlur = (name, objetivoId, meta) => {
    const valor = valores[`${objetivoId}.${name}`];
    if (valor && parseFloat(valor) < parseFloat(meta)) {
      Swal.fire({
        title: "¡Atención! Meta no alcanzada",
        text: "Se guardará la información y se redirigirá a la sección de Acciones Correctivas.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: '#4a6fa5',
        cancelButtonColor: '#6c757d',
        confirmButtonText: "Guardar e Ir a Acciones",
        cancelButtonText: "Cancelar",
        background: '#ffffff',
        color: '#333333',
      }).then((result) => {
        if (result.isConfirmed) {
          (async () => {
            try {
              await handleGuardar();
              const objetivo = objetivos.find((obj) => obj._id === objetivoId);
              
              navigate('/registro-accion', {
                state: {
                  idObjetivo: objetivoId,
                  objetivo: {
                    numero: objetivos.indexOf(objetivo) + 1,
                    objetivo: objetivo.objetivo,
                    area: label
                  },
                  periodo: name.split(".")[0],
                  label: label
                }
              });
            } catch (error) {
              Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar la información.',
                icon: 'error',
                background: '#ffffff',
                color: '#333333'
              });
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
      Swal.fire({
        title: '¡Guardado!',
        text: 'Los datos han sido guardados exitosamente.',
        icon: 'success',
        background: '#ffffff',
        color: '#333333',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      setCambios({});
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar la información.',
        icon: 'error',
        background: '#ffffff',
        color: '#333333'
      });
    }
  };

  const renderTablaFrecuencia = (meses, titulo, index) => {
    return (
      <div className={`frecuencia-container ${activeTab === index ? 'active' : ''}`}>
        <div className="frecuencia-header" onClick={() => setActiveTab(index)}>
          <h4>{titulo}</h4>
          <span className="toggle-icon">{activeTab === index ? '▼' : '►'}</span>
        </div>
        
        {activeTab === index && (
          <div className="frecuencia-content">
            <table className="objetivos-tabla">
              <thead>
                <tr>
                  <th rowSpan="2" className="header-bg">OBJ 2025</th>
                  <th rowSpan="2" className="header-bg">META</th>
                  {meses.map((mes) => (
                    <th colSpan="5" key={mes.nombre} className="header-bg">
                      {mes.nombre}
                    </th>
                  ))}
                </tr>
                <tr>
                  {meses.map((mes) =>
                    ["S1", "S2", "S3", "S4", "S5"].map((semana) => (
                      <th key={`${mes.nombre}-${semana}`} className="semana-header">
                        {semana}
                      </th>
                    ))
                  ).flat()}
                </tr>
              </thead>
              <tbody>
                {objetivos.map((objetivo, idx) => (
                  <tr key={objetivo._id} className={idx % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="objetivo-numero">{idx + 1}</td>
                    <td className="objetivo-meta">{objetivo.metaFrecuencia}</td>
                    {meses.map((mes) =>
                      ["S1", "S2", "S3", "S4", "S5"].map((semana) => (
                        <td key={`${mes.nombre}-${semana}`} className="semana-cell">
                          <input
                            type="text"
                            name={`${mes.campo}.${semana}`}
                            value={valores[`${objetivo._id}.${mes.campo}.${semana}`] || ''}
                            onChange={(e) => handleChange(e, objetivo._id)}
                            onBlur={() => handleBlur(`${mes.campo}.${semana}`, objetivo._id, objetivo.metaFrecuencia)}
                            className="input-frecuencia"
                          />
                        </td>
                      ))
                    ).flat()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const periodos = [
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL I',
      meses: [
        { nombre: 'ENERO', campo: 'indicadorENEABR' },
        { nombre: 'FEBRERO', campo: 'indicadorFEB' },
        { nombre: 'MARZO', campo: 'indicadorMAR' },
        { nombre: 'ABRIL', campo: 'indicadorABR' },
      ],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL II',
      meses: [
        { nombre: 'MAYO', campo: 'indicadorMAYOAGO' },
        { nombre: 'JUNIO', campo: 'indicadorJUN' },
        { nombre: 'JULIO', campo: 'indicadorJUL' },
        { nombre: 'AGOSTO', campo: 'indicadorAGO' },
      ],
    },
    {
      titulo: 'FRECUENCIA CUATRIMESTRAL III',
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
      <div className="header-container">
        <h1 className="tabla-titulo">SISTEMA DE GESTIÓN DE CALIDAD</h1>
        <h2 className="tabla-subtitulo">SEGUIMIENTO POR FRECUENCIA - ÁREA: {label.toUpperCase()}</h2>
      </div>

      <div className="botones-container">
        <button 
          className="button-acciones"
          onClick={() => navigate(`/acciones-list/${label}`)}
        >
          ACCIONES CORRECTIVAS
        </button>

        <button 
          className="btn-guardar"
          onClick={handleGuardar}
          disabled={Object.keys(cambios).length === 0}
        >
          GUARDAR CAMBIOS
        </button>

        <button 
          className="btn-ver-objetivos"
          onClick={() => setShowPanel(!showPanel)}
        >
          {showPanel ? 'OCULTAR OBJETIVOS' : 'VER OBJETIVOS'}
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
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="resize-handle"></div>
          <div className="panel-header">
            <h4>OBJETIVOS DEL ÁREA: {label.toUpperCase()}</h4>
            <button 
              className="panel-close"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <ul>
              {objetivos.map((objetivo, index) => (
                <li key={objetivo._id}>
                  <span className="objetivo-numero">{index + 1}.</span>
                  <span className="objetivo-texto">{objetivo.objetivo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="frecuencias-container">
        {periodos.map((periodo, index) => 
          renderTablaFrecuencia(periodo.meses, periodo.titulo, index)
        )}
      </div>

      <div className="footer-note">
        <p>Sistema de seguimiento de objetivos por frecuencia - Versión 2025</p>
      </div>
    </div>
  );
};

export default TablaObjetivosArea;
