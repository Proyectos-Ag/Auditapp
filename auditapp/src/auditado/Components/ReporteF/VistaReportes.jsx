import React, { useEffect, useState,useContext } from 'react';
import axios from 'axios';
import './css/VistaR.css'
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../App';

const VistaReportes = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Hacer la petición para obtener los datos de Ishikawa
        const encodedNombre = encodeURIComponent(userData.Nombre);
        const responseIshikawa = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/por/vista/${encodedNombre}`);
        console.log("aquiiiii", responseIshikawa);
  
        // Verificar que la respuesta tenga datos
        const respIsh = Array.isArray(responseIshikawa.data) ? responseIshikawa.data : [responseIshikawa.data];
        if (!respIsh || respIsh.length === 0) {
          console.warn("No se encontraron datos de Ishikawa.");
          return;
        }
  
        // Crear un conjunto para almacenar los idRep consultados
        const idRepConsultados = new Set();
  
        // Iterar sobre cada objeto en respIsh
        const promises = respIsh.map(async (ishikawa) => {
          const idRep = ishikawa?.idRep;
          console.log("idRep: ", idRep);
  
          // Verificar que idRep exista y no se haya consultado ya
          if (!idRep || idRepConsultados.has(idRep)) {
            console.warn(`El idRep ${idRep} ya ha sido consultado o es inválido.`);
            return null; // Ignorar si ya fue consultado o no es válido
          }
  
          // Marcar el idRep como consultado
          idRepConsultados.add(idRep);
  
          // Hacer la solicitud de datos basados en idRep
          try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/esp/aud`, {
              params: { idRep },
            });
            console.log(response.data);
            return response.data; // Devolver los datos obtenidos
          } catch (error) {
            console.error(`Error al obtener los datos para idRep ${idRep}:`, error);
            return null; // Si hay un error en una solicitud, retornar null
          }
        });
  
        // Esperar a que todas las solicitudes se completen
        const allDatos = await Promise.all(promises);
  
        // Filtrar los resultados que no sean null y "aplanar" arrays anidados
        const filteredDatos = allDatos.filter(dato => dato !== null).flat();
  
        console.log("Datos filtrados", filteredDatos);
        setDatos(filteredDatos);
  
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
  
    // Llamar la función
    fetchDatos();
  }, [userData]);  
  

const formatearFecha = (fecha) => {
  const nuevaFecha = new Date(fecha);
  return nuevaFecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const navReporte = (_id) => {
    navigate(`/auditado/reporte/${_id}`);
};

  return (
    <div>
      <div className='cont-card-repo'>
      <h1>Reportes en proceso</h1>
      </div>
      {datos.length > 0 ? (
        <div className='cont-card-repo'>
        {datos.map((dato) => (
          <div key={dato._id} 
          className='card-repo'
          onClick={() => navReporte(dato._id)}
              style={{ cursor: 'pointer' }}>
             <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
             <p>Fecha Elaboración: {formatearFecha(dato.FechaElaboracion)}</p>
            <p>Tipo Auditoria: {dato.TipoAuditoria}</p>
            <p>Duración: {dato.Duracion}</p>
          </div>
        ))}
      </div>
      ) : (
        <h2 className='cont-card-repo'>No hay repostes en proceso.</h2>
      )}
    </div>
  );
};

export default VistaReportes;