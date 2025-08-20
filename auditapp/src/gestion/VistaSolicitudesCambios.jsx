import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './css/VistaR.css';
import logo from '../assets/img/logoAguida-min.png';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';

const formatDate = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
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
  if (recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()) {
    return "Este mes";
  }
  const options = { month: 'long' };
  if (recordDate.getFullYear() !== today.getFullYear()) options.year = 'numeric';
  return recordDate.toLocaleDateString('es-ES', options);
};

const VistaSolicitudesCambios = () => {
  const { userData } = useContext(UserContext); // si lo necesitas
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(''); // '' = todos
  const navigate = useNavigate();

  // opciones de estado (ajusta según los estados que uses en backend)
  const estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'rechazado', label: 'Rechazado' },
  ];

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        setLoading(true);
        const params = {};
        if (estadoFilter) params.estado = estadoFilter; // envía ?estado=pendiente
        // puedes agregar limit/skip: params.limit = 100;
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/resumen`, { params });
        setSolicitudes(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } catch (err) {
        console.error('Error al obtener resumen de solicitudes:', err);
        setError('No se pudieron cargar las solicitudes. Inténtalo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchResumen();
  }, [estadoFilter]); // refetch cuando cambia el filtro

  // Nav: si estado es "pendiente" -> /gestion-cambio/:id, sino -> /solicitud-cambio/:id
  const navDetalle = (record) => {
    if (!record) return;
    const estado = (record.estado || '').toString().toLowerCase();
    if (estado === 'pendiente') {
      navigate(`/gestion-cambio/${record._id}`);
    } else {
      navigate(`/solicitud-cambio/${record._id}`);
    }
  };

  // ordenar por fecha (desc) para mostrar las más recientes arriba
  const solicitudesOrdenadas = solicitudes.slice().sort((a, b) => {
    const da = new Date(a.fechaSolicitud || 0).getTime();
    const db = new Date(b.fechaSolicitud || 0).getTime();
    return db - da;
  });

  if (loading) return <div className="cont-card-repo"><h3>Cargando solicitudes...</h3></div>;
  if (error) return <div className="cont-card-repo"><h3>{error}</h3></div>;

  return (
    <div>
      <div className='cont-card-repo' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Solicitudes de Cambio</h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 14, color: '#444' }}>Filtrar estado:</label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
            {estadoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {solicitudesOrdenadas.length === 0 ? (
        <div className='cont-card-repo'><h2>No hay solicitudes registradas.</h2></div>
      ) : (
        <div className='cont-card-repo'>
          {solicitudesOrdenadas.map((s) => {
            const label = getDateLabel(s.fechaSolicitud);
            return (
              <div
                key={s._id}
                className='card-repo'
                style={{ cursor: 'pointer' }}
                onClick={() => navDetalle(s)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navDetalle(s); }}
              >
                <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />
                <div style={{ flex: 1 }}>
                  <p><strong>Solicitante:</strong> {s.solicitante || '-'}</p>
                  <p><strong>Líder del proyecto:</strong> {s.liderProyecto || '-'}</p>
                  <p><strong>Fecha solicitud:</strong> {formatDate(s.fechaSolicitud)}</p>
                </div>
                <div style={{ marginLeft: 12, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>ID: {s._id}</div>
                  <div style={{ fontSize: 12, color: '#333', marginTop: 6 }}><strong>Estado:</strong> {s.estado || '-'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VistaSolicitudesCambios;