import React, { useContext, useEffect, useRef } from "react";
import './css/inicio.css';
import videoFile from '../../assets/img/UpscaleVideo_1_20240628.mp4';
import Navigation from "../Navigation/Navbar";
import pez from "../../assets/img/Ishikawa-mini.png";
import revision from "../../assets/img/revision.png";
import proceso from "../../assets/img/proceso.png";
import finalizado from "../../assets/img/finalizado.png";
import evaluacion from "../../assets/img/evaluacion.png";
import aprobado from "../../assets/img/aprobado.png";
import usuarios from "../../assets/img/usuarios.png"
import departamentos from "../../assets/img/departamentos.png"
import verevaluacion from "../../assets/img/ver-evaluacion.png"
import calendario from "../../assets/img/calendario.png"
import estadisticas from "../../assets/img/estadisticas.png"
import subirxls from "../../assets/img/subir-xls.png"
import programas from "../../assets/img/programas.png"

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
        Generar 
        <br />
        Auditoría
        <br />
        <br />
        <br />  
        <img src={proceso} alt="proceso" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/revicion")}>
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
    </div>
    </div>

    <div className="conten-funcion" style={{marginTop:'-18%'}}>
    <h1>Administración</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/evuaauditor")}>
        Realizar Evaluacion
        <br /><br />
        <img src={evaluacion} alt="evaluacion" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/vereva")}>
        Ver Evaluaciones
        <br /><br />
        <img src={verevaluacion} alt="ver-evaluacion" className='imagen-mini' />
      </div>
      <div className="card-home" onClick={() => navigate("/calendario")}>
        Calendario de Auditorias
        <br /><br />
        <img src={calendario} alt="calendario" className='imagen-mini' style={{width:'80%'}} />
      </div>
      <div className="card-home" onClick={() => navigate("/auditcalendar")}>
        Historial de Auditorias
      </div>
    </div>
    </div>

    <div className="conten-funcion" style={{marginTop:'-18%'}}>
    <h1>Gestion</h1>
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
    <h1>Carga y Graficas</h1>
    <div className="contenedor-home">
      <div className="card-home" onClick={() => navigate("/carga")}>
        Carga de Auditorias
        <br/><br/>
        <img src={subirxls} alt="subir xls" className='imagen-mini' style={{width:'75%'}} />
      </div>
      <div className="card-home" onClick={() => navigate("/estadisticas")}>
        Estadisticas
        <br/><br/>
        <img src={estadisticas} alt="estadisticas" className='imagen-mini' style={{width:'75%'}} />
      </div>
    </div>
    </div>

    </div>

    </div>
  );
};

export default Inicio;
