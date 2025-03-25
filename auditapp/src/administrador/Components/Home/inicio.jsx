import React, { useEffect, useRef, useState } from "react";
import './css/inicio.css';
import BotonesRol from "../../../resources/botones-rol";
import videoFile from '../assets/img/UpscaleVideo_1_20240628.webm';
import pez from "../assets/img/Ishikawa-mini.png";
import revision from "../assets/img/revision.png";
import proceso from "../assets/img/proceso.png";
import finalizado from "../assets/img/finalizado.png";
import evaluacion from "../assets/img/evaluacion.png";
import aprobado from "../assets/img/aprobado.png";
import usuarios from "../assets/img/usuarios.png"
import departamentos from "../assets/img/departamentos.png"
import verevaluacion from "../assets/img/ver-evaluacion.png"
import calendario from "../assets/img/calendario.png"
import estadisticas from "../assets/img/estadisticas.png"
import subirxls from "../assets/img/subir-xls.png"
import programas from "../assets/img/programas.png"
import Event from "../../../resources/event";
import DatosV from "../../../components/login/DatosV";

import { useNavigate } from "react-router-dom";

const Inicio = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      handleCloseModal();
    }
  };


  return(
    <div>
    <div className="inicio-container" style={{ position: 'relative' }}>
      <video 
      className="video"
        ref={videoRef} 
        src={videoFile} 
        autoPlay 
        loop 
        muted 
      />

      
      <div className="inicio-content">
        <h1>Bienvenidos a Auditapp</h1>
      </div>
    </div>
    <Event/>

    <div className="fondo-home">
      <BotonesRol/>
      
    <div className="conten-funcion">
    <h1>Auditorías</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/datos")}>
        Generar 
        <br />
        Auditoría
        <br />
        <br />
        <br />  
        <img src={proceso} alt="proceso" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/ver-reali")}>
        Revisión de Auditoría
        <img src={revision} alt="revision" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/revish")}>
      Revisión de Ishikawa
      <img src={pez} alt="pez" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/vistafin")}>
        Auditorías Finalizadas
        <br />
        <br />
        <img src={finalizado} alt="finalizado"  style={{width:'70%'}} className='imagen-mini' />
      </div>
    </div>
    </div>

    <div className="conten-funcion" style={{marginTop:'-18%'}}>
    <h1>Ishikawas</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/ishikawa")}>
        Generar Ishikawa
        <img src={pez} alt="pez" className='imagen-mini' />
        <img src={proceso} alt="proceso" className='imagen-mini' style={{marginTop:'-2em', width:'75%'}}/>
      </div>
      <div className="card-home" onClick={() => navigate("/ishikawasesp")}>
        Ishikawas Generados
        <img src={pez} alt="pez" className='imagen-mini' />
        <img src={aprobado} alt="aprobado" className='imagen-mini' style={{width: '40%',marginTop:'-1.5em'}}/>
      </div>
      <div className="card-home" onClick={() => navigate("/ishikawas-estadisticas")}>
        Estadísticas de Ishikawas
        <img src={pez} alt="pez" className='imagen-mini' />
        <img src={estadisticas} alt="estadisticas" className='imagen-mini' style={{width: '40%',marginTop:'-1.5em'}}/>
      </div>
    </div>
    </div>

    <div className="conten-funcion" style={{marginTop:'-18%'}}>
    <h1>Administración</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/evuaauditor")}>
        Realizar Evaluación
        <br /><br />
        <img src={evaluacion} alt="evaluacion" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/vereva")}>
        Ver Evaluaciones
        <br /><br />
        <img src={verevaluacion} alt="ver-evaluacion" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/prog-audi")}>
        Programar Auditoría
        <br /><br />
        <img src={calendario} alt="programar" className='imagen-mini' style={{width:'80%'}} />
      </div>
      <div className="card-home" onClick={() => navigate("/auditcalendar")}>
        Calendario de Auditorías
        <br /><br />
        <img src={calendario} alt="calendario" className='imagen-mini' style={{width:'80%'}} />
      </div>
    </div>
    </div>

    <div className="conten-funcion" style={{marginTop:'-18%'}}>
    <h1>Gestión</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/usuariosRegistrados")}>
        Usuarios
        <img src={usuarios} alt="usuarios" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/programa")}>
        Programas
        <br/><br/>
        <img src={programas} alt="programas" className='imagen-mini' style={{width:'75%'}} />
      </div>
      <div className="card-home" onClick={() => navigate("/departamento")}>
        Departamentos
        <br/><br/>
        <br/>
        <img src={departamentos} alt="usuarios" className='imagen-mini' style={{width:'75%'}}/>
      </div>
    </div>
    </div>

    <div className="conten-funcion" style={{marginTop:'-18%'}}>
    <h1>Carga y Gráficas</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/carga")}>
        Carga de Auditorías
        <br/><br/>
        <img src={subirxls} alt="subir xls" className='imagen-mini' style={{width:'75%'}} />
      </div>
      <div className="card-home" onClick={() => navigate("/estadisticas")}>
        Estadísticas
        <br/><br/>
        <img src={estadisticas} alt="estadisticas" className='imagen-mini' style={{width:'75%'}} />
      </div>
    </div>
    </div>
    <div style={{
    position: 'fixed',
    bottom: '10px',
    right: '10px',
  }}>
    <span
        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}
        onClick={handleOpenModal}
      >
        <br />
        v2.1.6(Beta)
    </span>
    </div>

    </div>
    {showModal && (
          <div className="modal-overlay" onClick={handleOverlayClick}>
            <div onClick={(e) => e.stopPropagation()}>
              <DatosV />
            </div>
          </div>
        )}

    </div>
  );
};

export default Inicio;