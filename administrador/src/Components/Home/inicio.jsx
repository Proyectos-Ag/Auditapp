import React, { useContext, useEffect, useRef } from "react";
import './css/inicio.css';
import videoFile from '../../assets/img/UpscaleVideo_1_20240628.mp4';
import Navigation from "../Navigation/Navbar";
import pez from "../../assets/img/pez.png";
import revision from "../../assets/img/revision.png";
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
      <div className="card-home" onClick={() => navigate("/datos")}>
        Generar Auditoría
      </div>
      <div className="card-home" onClick={() => navigate("/revicion")}>
        Revisión de Auditoría
        <img src={revision} alt="Logo Aguida" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/revish")}>
      Revisión de Ishikawa
      <img src={pez} alt="Logo Aguida" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/vistafin")}>
        Auditorías Finalizadas
      </div>
    </div>
    </div>

    <div className="conten-funcion">
    <h1>Ishikawas</h1>
    <div className="contenedor-home">
      <div className="card-home">
        Generar Auditoria
      </div>
      <div className="card-home"></div>
      <div className="card-home"></div>
      <div className="card-home"></div>
    </div>
    </div>

    </div>

    </div>
  );
};

export default Inicio;
