import React, { useEffect, useRef } from "react";
import './css/inicio.css';
import BotonesRol from "../../../resources/botones-rol";
import videoFile from '../assets/img/UpscaleVideo_1_20240628.mp4';
import revision from "../assets/img/revision.png";
import finalizado from "../assets/img/finalizado.png";
import usuario from "../assets/img/usuario.png";
import { useNavigate } from "react-router-dom";

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

    <div className="fondo-home">
    <BotonesRol/>
      
    <div className="conten-funcion">
    <h1>Auditorías</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/pendiente")}>
        Llenado de Checklist
        <br/><br/>
        <img src={revision} alt="revision" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/reporte")}>
       Reportes Generados
       <br/>
       <br/>
       <br/>
       <img src={finalizado} alt="finalizado" className='imagen-mini' style={{width:'70%'}} />
      </div>
      <div className="card-home" onClick={() => navigate("/informacion")}>
        Usuario
        <br />
        <br />
        <img src={usuario} alt="usuario" className='imagen-mini' />
      </div>
    </div>
    </div>

    </div>
    </div>
  );
};

export default Inicio;