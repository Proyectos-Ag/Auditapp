import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from '../../../services/api';
import Swal from "sweetalert2";
import "./RegistroAccionCorrectiva.css";

const RegistroAccionCorrectiva = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  
  // Extraemos todos los datos necesarios con valores por defecto
  const { 
    idObjetivo = null, 
    objetivo = { numero: '', objetivo: '', area: '' }, 
    periodo = '',
    label = objetivo?.area || ''
  } = state || {};

  const [registro, setRegistro] = useState({
    fecha: new Date().toLocaleDateString(),
    noObjetivo: objetivo?.numero || '',
    objetivo: objetivo?.objetivo || '',
    periodo: periodo || '',
    acciones: '',
    fichaCompromiso: new Date().toISOString().split('T')[0],
    responsable: {
      nombre: '',
      email: ''
    },
    efectividad: '',
    observaciones: ''
  });

  const [guardando, setGuardando] = useState(false);

  // Validamos que tengamos los datos necesarios al cargar
  useEffect(() => {
    if (!idObjetivo || !objetivo?.numero || !periodo) {
      Swal.fire({
        title: 'Datos incompletos',
        text: 'Falta información necesaria para registrar la acción',
        icon: 'error'
      }).then(() => {
        navigate('/');
      });
    }
  }, [idObjetivo, objetivo, periodo, navigate]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    
    if (name === "responsableNombre" || name === "responsableEmail") {
      setRegistro(prev => ({
        ...prev,
        responsable: {
          ...prev.responsable,
          [name === "responsableNombre" ? "nombre" : "email"]: value
        }
      }));
    } else {
      setRegistro(prev => ({ ...prev, [name]: value }));
    }
  };

  const validarFormulario = () => {
    if (!registro.acciones.trim()) {
      Swal.fire({
        title: 'Acciones requeridas',
        text: 'Debe describir las acciones correctivas',
        icon: 'warning'
      });
      return false;
    }

    if (!registro.fichaCompromiso) {
      Swal.fire({
        title: 'Fecha requerida',
        text: 'Debe especificar una fecha de compromiso',
        icon: 'warning'
      });
      return false;
    }

    if (new Date(registro.fichaCompromiso) <= new Date()) {
      Swal.fire({
        title: 'Fecha inválida',
        text: 'La fecha de compromiso debe ser futura',
        icon: 'warning'
      });
      return false;
    }

    if (!registro.responsable.nombre.trim()) {
      Swal.fire({
        title: 'Responsable requerido',
        text: 'Debe especificar un responsable',
        icon: 'warning'
      });
      return false;
    }

    if (!registro.responsable.email || !/\S+@\S+\.\S+/.test(registro.responsable.email)) {
      Swal.fire({
        title: 'Email inválido',
        text: 'Debe proporcionar un email válido del responsable',
        icon: 'warning'
      });
      return false;
    }

    return true;
  };

  const guardarAccionCorrectiva = async () => {
    if (!validarFormulario()) return;
    
    setGuardando(true);
    
    try {
      const datosParaBackend = {
        ...registro,
        area: label // Asegurarnos de incluir el área
      };

      const response = await api.post(
        `/api/objetivos/${idObjetivo}/acciones-correctivas`,
        datosParaBackend,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        await Swal.fire({
          title: '¡Acción registrada!',
          text: 'La acción correctiva se ha guardado correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Redirigir a la lista de acciones con el área codificada
        navigate(`/acciones-list/${encodeURIComponent(label)}`);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      let mensajeError = 'Ocurrió un error al guardar la acción';
      
      if (error.response) {
        if (error.response.status === 404) {
          mensajeError = 'No se encontró el objetivo relacionado';
        } else if (error.response.data?.message) {
          mensajeError = error.response.data.message;
        }
      }

      Swal.fire({
        title: 'Error',
        text: mensajeError,
        icon: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="contenedor-principal-accion">
      <div className="encabezado-accion">
        <h1 className="titulo-accion">
          <span className="icono-accion">📝</span> Registro de Acción Correctiva
        </h1>
        <p className="subtitulo-accion">
          Sistema de seguimiento y mejora continua - Área: {label}
        </p>
      </div>

      <div className="tarjeta-formulario-accion">
        <div className="encabezado-tarjeta">
          <h2>Formulario de Registro</h2>
          <div className="indicador-estado">
            <span className={`estado-burbuja ${!registro.fichaCompromiso ? 'inactivo' : 
              new Date(registro.fichaCompromiso) < new Date() ? 'vencido' : 'activo'}`}></span>
            {!registro.fichaCompromiso ? 'Sin planificar' : 
              new Date(registro.fichaCompromiso) < new Date() ? 'Acción vencida' : 'En progreso'}
          </div>
        </div>

        <div className="contenedor-formulario">
          <div className="grupo-campos">
            <div className="campo-formulario">
              <label>Fecha de registro</label>
              <div className="campo-texto">{registro.fecha}</div>
            </div>

            <div className="campo-formulario">
              <label>Número de objetivo</label>
              <div className="campo-texto">{registro.noObjetivo}</div>
            </div>

            <div className="campo-formulario">
              <label>Periodo de evaluación</label>
              <div className="campo-texto">{registro.periodo}</div>
            </div>
          </div>

          <div className="campo-formulario campo-completo">
            <label>Descripción del objetivo</label>
            <div className="campo-texto-descripcion">{registro.objetivo}</div>
          </div>

          <div className="grupo-campos">
            <div className="campo-formulario">
              <label>Acciones correctivas *</label>
              <textarea
                name="acciones"
                value={registro.acciones}
                onChange={manejarCambio}
                className="input-acciones"
                placeholder="Describa detalladamente las acciones a implementar"
                rows="3"
                required
              />
            </div>

            <div className="campo-formulario">
              <label>Fecha compromiso *</label>
              <input
                type="date"
                name="fichaCompromiso"
                value={registro.fichaCompromiso}
                onChange={manejarCambio}
                className="input-fecha"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="grupo-campos">
            <div className="campo-formulario">
              <label>Responsable *</label>
              <input
                type="text"
                name="responsableNombre"
                value={registro.responsable.nombre}
                onChange={manejarCambio}
                className="input-responsable"
                placeholder="Nombre completo del responsable"
                required
              />
            </div>

            <div className="campo-formulario">
              <label>Email responsable *</label>
              <input
                type="email"
                name="responsableEmail"
                value={registro.responsable.email}
                onChange={manejarCambio}
                className="input-contacto"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>

          <div className="grupo-campos">
            <div className="campo-formulario">
              <label>Efectividad</label>
              <select
                name="efectividad"
                value={registro.efectividad}
                onChange={manejarCambio}
                className="selector-efectividad"
              >
                <option value="">Seleccione efectividad...</option>
                <option value="0%">0% - No efectivo</option>
                <option value="25%">25% - Poco efectivo</option>
                <option value="50%">50% - Medianamente efectivo</option>
                <option value="75%">75% - Muy efectivo</option>
                <option value="100%">100% - Totalmente efectivo</option>
              </select>
            </div>

            <div className="campo-formulario">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={registro.observaciones}
                onChange={manejarCambio}
                className="input-observaciones"
                placeholder="Observaciones adicionales relevantes"
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="pie-tarjeta">
          <button 
            className="boton-primario"
            onClick={guardarAccionCorrectiva}
            disabled={guardando || 
              !registro.acciones || 
              !registro.fichaCompromiso || 
              !registro.responsable.nombre || 
              !registro.responsable.email}
          >
            {guardando ? (
              <>
                <span className="boton-cargando"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span className="boton-icono">💾</span>
                <span className="boton-texto">Guardar Acción Correctiva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistroAccionCorrectiva;