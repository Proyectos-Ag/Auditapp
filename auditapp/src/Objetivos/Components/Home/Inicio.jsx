import React, { useEffect, useRef, useContext } from "react";
import BotonesRol from "../../../resources/botones-rol";
import './css/Inicio.css';
import videoFile from '../assets/img/UpscaleVideo_1_20240628.webm';
import menu from "../assets/img/menu.png";
import { useNavigate } from "react-router-dom";
import Nieve from "../../../resources/event";
import { UserContext } from "../../../App";

const Inicio = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { userData } = useContext(UserContext); // Usando el mismo patrón que BotonesRol

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  // Verificar si el usuario es administrador
  const esAdministrador = userData?.TipoUsuario === 'administrador';

  return (
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
      <Nieve/>

      <div className="fondo-home">
        <BotonesRol/>
        
        <div className="conten-funcion">
          <h1>Objetivos</h1>
          <div className="contenedor-home">
            <div className="card-home" onClick={() => navigate("/menu")}>
              Menú
              <br/><br/>
              <img src={menu} alt="menu" className='imagen-mini' />
            </div>

            <div className="card-home" onClick={() => navigate("/concentradon")}>
              Concentrado
              <br/><br/>
              <p>...</p>
            </div>

            {/* Mostrar solo si es administrador */}
            {esAdministrador && (
              <div className="card-home" onClick={() => navigate("/registroObjetivo")}>
                Registro
                <br/><br/>
                <img src={menu} alt="menu" className='imagen-mini' />
              </div>
            )}
            
            <div className="card-home" onClick={() => navigate("/saefty-goals2")}>
              Safety Goals
              <br/>
              <br/>
              <p>...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicio;