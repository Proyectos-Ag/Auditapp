import React, { useEffect, useRef } from "react";
import BotonesRol from "../../../resources/botones-rol";
import './css/Inicio.css';
import videoFile from '../assets/img/UpscaleVideo_1_20240628.webm';
import pez from "../assets/img/Ishikawa-mini.png";
import finalizado from "../assets/img/finalizado.png"
import { useNavigate } from "react-router-dom";
import Event from "../../../resources/event";

const Inicio = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

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
      <div className="card-home" onClick={() => navigate("/auditado/vistarep")}>
        Ishikawas Asignados
        <br/><br/>
        <img src={pez} alt="pez" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/reportes-auditado")}>
       Auditorías Terminadas
       <br/><br/>
        <img src={finalizado} alt="finalizado" style={{width:'80%'}} className='imagen-mini' />
      </div>
            <div className="card-home" onClick={() => navigate("/diagramas")}>
              Generar Ishikawa
              <br/><br/>
              <img src={pez} alt="pez" className='imagen-mini' />
              
            </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default Inicio;