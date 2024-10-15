import React, { useContext, useEffect, useRef } from "react";
import './css/inicio.css';
import videoFile from '../../assets/img/UpscaleVideo_1_20240628.mp4';
import Navigation from "../Navigation/narbar";
import revision from "../../assets/img/revision.png";
import finalizado from "../../assets/img/finalizado.png";
import usuario from "../../assets/img/usuario.png";
import { UserContext } from '../../App';
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
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4rem',
         borderRadius:'10px', backgroundColor:'#000000' }}>
        <Navigation />
      </div>
      <div className="inicio-content">
        <h1>Bienvenido</h1>
        {userData && (
          <div className="user-info">
            <p className="user-name">{userData.Nombre}</p>
          </div>
        )}
      </div>
    </div>

    <div className="fondo-home">
      
    <div className="conten-funcion">
    <h1>Auditorías</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/pendiente")}>
        LLenado de Checklist
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