import React, { useEffect, useState,useContext } from 'react';
import api from '../../../services/api';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../App';

const VistaReporte = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Hacer la petición para obtener los datos de Ishikawa
        const encodedNombre = encodeURIComponent(userData.Nombre);
        const responseIshikawa = await api.get(`/ishikawa/por/vista/${encodedNombre}`);
  
        // Verificar que la respuesta tenga datos
        const respIsh = Array.isArray(responseIshikawa.data) ? responseIshikawa.data : [responseIshikawa.data];
        if (!respIsh || respIsh.length === 0) {
          console.warn("No se encontraron datos de Ishikawa.");
          return;
        }

        const auditorCorreo = userData?.Correo || userData?.correo;
        if (!auditorCorreo) {
            console.warn("No se encontró el correo del auditor en userData.");
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
            const response = await api.get(`/datos/aud-all`, {
              params: { idRep, correo: auditorCorreo },
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

const getDateLabel = (fecha) => {
  const recordDate = new Date(fecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  recordDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays === 2) return "Hace 2 días";
  if (diffDays >= 3 && diffDays < 7) return "Esta semana";
  if (
    recordDate.getMonth() === today.getMonth() &&
    recordDate.getFullYear() === today.getFullYear()
  ) {
    return "Este mes";
  }

  // Para fechas de hace 30 días o más
  const options = { month: 'long' };
  if (recordDate.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }
  return recordDate.toLocaleDateString('es-ES', options);
};  

const datosOrdenados = datos.slice().reverse();

const navReporte = (_id) => {
    navigate(`/reporte/${_id}`);
};

  return (
    <div>
      <div className='cont-card-repo'>
      <h1>Reportes generados</h1>
      </div>
      {datos.length > 0 ? (
      <div className='cont-card-repo'>
        {datosOrdenados.map((dato, index) => {
            const currentLabel = getDateLabel(dato.FechaElaboracion);
            let showDivider = false;
            if (index === 0) {
              showDivider = true;
            } else {
              const previousLabel = getDateLabel(datosOrdenados[index - 1].FechaElaboracion);
              if (currentLabel !== previousLabel) {
                showDivider = true;
              }
            }
            return (
              <React.Fragment key={dato._id}>
                {showDivider && <div className="divider" data-label={currentLabel}></div>}
                <div
                  className='card-repo'
                  onClick={() => navReporte(dato._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
                  <p>Fecha Elaboración: {formatearFecha(dato.FechaElaboracion)}</p>
                  <p>Tipo Auditoria: {dato.TipoAuditoria}</p>
                  <p>Duración: {dato.Duracion}</p>
                  {dato.Cliente && <p>Cliente: {dato.Cliente}</p>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <h2 className='cont-card-repo'>No hay repostes en proceso.</h2>
      )}
    </div>
  );
};

export default VistaReporte;