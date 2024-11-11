import React, { useContext, useEffect, useRef } from "react";
import BotonesRol from "../../../administrador/Components/Home/botones-rol";
import './css/Inicio.css';
import videoFile from '../assets/img/UpscaleVideo_1_20240628.mp4';
import pez from "../assets/img/Ishikawa-mini.png";
import usuario from "../assets/img/usuario.png";
import { UserContext } from '../../../App';
import { useNavigate } from "react-router-dom";

const Inicio = () => {
  const { userData, setUserData } = useContext(UserContext);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [setUserData]);

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
        {userData && (
          <div className="user-info">
            <p className="user-name">{userData.Nombre}</p>
          </div>
        )}
      </div>
    </div>

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
      <div className="card-home" >
       Auditorías Terminadas
      </div>
      <div className="card-home" onClick={() => navigate("/auditado/informacion")}>
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