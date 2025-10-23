import React, { useEffect, useRef } from "react";
import BotonesRol from "../../resources/botones-rol";
import './css/Home.css';
import videoFile from '../../auditado/Components/assets/img/UpscaleVideo_1_20240628.webm';
import ciclo from "../../assets/img/ciclo.png";
import { useNavigate } from "react-router-dom";
import Event from "../../resources/event";
import { CircleNotifications } from "@mui/icons-material";

const Home = () => {
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
    <h1>Gestión de Cambios</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/vista-solictudes")}>
        Solicitudes de Cambio
        <br/>
        <img src={ciclo} alt="pez" className='imagen-mini' />
      </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default Home;