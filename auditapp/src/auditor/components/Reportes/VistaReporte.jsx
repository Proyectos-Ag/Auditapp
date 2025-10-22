import React, { useEffect, useState, useContext } from 'react';
import api from '../../../services/api';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../App';

const VistaReporte = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchDatos = async () => {
      try {
        const auditorCorreo = userData?.Correo || userData?.correo;
        if (!auditorCorreo) {
          console.warn('No se encontró el correo del auditor en userData.');
          if (isMounted) setDatos([]);
          return;
        }

        // ✅ Unica llamada requerida:
        // /datos/aud-all?correo=<auditorCorreo>
        const response = await api.get('/datos/aud-all', {
          params: { correo: auditorCorreo },
        });

        // Normalizar respuesta (array u objeto)
        const raw = response?.data;
        const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);

        // Asegurarnos de no romper si falta algo
        const safeList = list.filter(Boolean);

        if (isMounted) setDatos(safeList);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        if (isMounted) setDatos([]);
      }
    };

    fetchDatos();
    return () => {
      isMounted = false;
    };
  }, [userData?.Correo, userData?.correo]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const nuevaFecha = new Date(fecha);
    if (Number.isNaN(nuevaFecha.getTime())) return '';
    return nuevaFecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDateLabel = (fecha) => {
    if (!fecha) return '';
    const recordDate = new Date(fecha);
    const today = new Date();
    if (Number.isNaN(recordDate.getTime())) return '';

    today.setHours(0, 0, 0, 0);
    recordDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays === 2) return 'Hace 2 días';
    if (diffDays >= 3 && diffDays < 7) return 'Esta semana';
    if (
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    ) {
      return 'Este mes';
    }

    const options = { month: 'long' };
    if (recordDate.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    return recordDate.toLocaleDateString('es-ES', options);
  };

  const datosOrdenados = (datos || [])
    .slice()
    .sort((a, b) => {
      const da = new Date(a?.FechaElaboracion || 0).getTime();
      const db = new Date(b?.FechaElaboracion || 0).getTime();
      return db - da; // descendente
    });

  const navReporte = (_id) => {
    if (!_id) return;
    navigate(`/reporte/${_id}`);
  };

  return (
    <div>
      <div className="cont-card-repo">
        <h1>Reportes generados</h1>
      </div>

      {datosOrdenados.length > 0 ? (
        <div className="cont-card-repo">
          {datosOrdenados.map((dato, index) => {
            const currentLabel = getDateLabel(dato?.FechaElaboracion);
            let showDivider = false;

            if (index === 0) {
              showDivider = true;
            } else {
              const previousLabel = getDateLabel(
                datosOrdenados[index - 1]?.FechaElaboracion
              );
              if (currentLabel !== previousLabel) {
                showDivider = true;
              }
            }

            return (
              <React.Fragment key={dato?._id || `${index}-${dato?.FechaElaboracion || 'sin-fecha'}`}>
                {showDivider && currentLabel && (
                  <div className="divider" data-label={currentLabel}></div>
                )}

                <div
                  className="card-repo"
                  onClick={() => navReporte(dato?._id)}
                  style={{ cursor: dato?._id ? 'pointer' : 'default' }}
                  aria-disabled={!dato?._id}
                >
                  <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
                  <p>Fecha Elaboración: {formatearFecha(dato?.FechaElaboracion)}</p>
                  <p>Tipo Auditoria: {dato?.TipoAuditoria ?? '—'}</p>
                  <p>Duración: {dato?.Duracion ?? '—'}</p>
                  {dato?.Cliente && <p>Cliente: {dato.Cliente}</p>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <h2 className="cont-card-repo">No hay reportes en proceso.</h2>
      )}
    </div>
  );
};

export default VistaReporte;
