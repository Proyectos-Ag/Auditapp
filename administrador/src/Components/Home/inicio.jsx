import React, { useContext, useEffect, useRef } from "react";
import './css/inicio.css';
import videoFile from '../../assets/img/UpscaleVideo_1_20240628.mp4';
import Navigation from "../Navigation/Navbar";
import { UserContext } from '../../App';

const Inicio = () => {
  const { userData, setUserData } = useContext(UserContext);
  const videoRef = useRef(null);

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

    <div className="conten-funcion">
    <h1>Auditorías</h1>
    <div className="contenedor-home">
      <div className="card-home">
        Generar Auditoría
      </div>
      <div className="card-home"></div>
      <div className="card-home"></div>
      <div className="card-home"></div>
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
  );
};

export default Inicio;
