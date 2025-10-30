import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import logo from '../assets/img/logoAguida-min.png';
import './css/Revicion.css';

const STATUS = {
  REVISION: 'revision',
  REVISADAS: 'revisadas', // engloba Terminada/Finalizada
};

export default function VistaRevision() {
  const [revisionData, setRevisionData] = useState([]);   // /datos/espreal  (en revisión)
  const [revisadasData, setRevisadasData] = useState([]); // /datos/esp      (revisadas/finalizadas)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | revision | revisadas
  const navigate = useNavigate();

  // Carga ambos endpoints en paralelo
  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [revRes, espRes] = await Promise.all([
          api.get('/datos/espreal'), // EN REVISIÓN
          api.get('/datos/esp'),     // REVISADAS/FINALIZADAS
        ]);
        if (!active) return;
        setRevisionData(Array.isArray(revRes.data) ? revRes.data : []);
        setRevisadasData(Array.isArray(espRes.data) ? espRes.data : []);
      } catch (e) {
        console.error('Error al obtener datos:', e);
        setError('No se pudieron cargar los datos.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, []);

  const normEstado = (d, fallback) => {
    const v = String(d?.Estado || '').toLowerCase();
    if (v.includes('finaliz') || v.includes('termin')) return STATUS.REVISADAS;
    if (v.includes('revis')) return STATUS.REVISION;
    // Si no trae Estado, usamos el origen del endpoint como fallback
    return fallback;
  };

  const formatearFecha = (fecha) => {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getDateLabel = (fecha) => {
    const recordDate = new Date(fecha);
    const today = new Date();
    if (Number.isNaN(recordDate.getTime())) return 'Sin fecha';

    today.setHours(0,0,0,0);
    recordDate.setHours(0,0,0,0);
    const diffDays = Math.floor((today - recordDate) / (1000*60*60*24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays === 2) return 'Hace 2 días';
    if (diffDays >= 3 && diffDays < 7) return 'Esta semana';

    if (recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()) {
      return 'Este mes';
    }

    const options = { month: 'long' };
    if (recordDate.getFullYear() !== today.getFullYear()) options.year = 'numeric';
    return recordDate.toLocaleDateString('es-ES', options);
  };

  // Unifica y enriquece
  const allItems = useMemo(() => {
    const asItem = (d, fallbackStatus) => {
      const status = normEstado(d, fallbackStatus);
      return {
        ...d,
        _status: status,
        _date: new Date(d?.FechaElaboracion || d?.fecha || d?.createdAt || 0),
      };
    };
    return [
      ...revisionData.map(d => asItem(d, STATUS.REVISION)),
      ...revisadasData.map(d => asItem(d, STATUS.REVISADAS)),
    ];
  }, [revisionData, revisadasData]);

  const counts = useMemo(() => ({
    all: allItems.length,
    revision: allItems.filter(i => i._status === STATUS.REVISION).length,
    revisadas: allItems.filter(i => i._status === STATUS.REVISADAS).length,
  }), [allItems]);

  // Filtro por estado + texto (cliente/tipo/duración/id/auditor líder)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems
      .filter(i => filterStatus === 'all' || i._status === filterStatus)
      .filter(i => {
        if (!q) return true;
        const campos = [
          i?.Cliente, i?.TipoAuditoria, i?.Duracion,
          i?.Programa, i?._id, i?.AuditorLiderEmail,
        ].filter(Boolean).map(String);
        return campos.some(v => v.toLowerCase().includes(q));
      })
      .sort((a, b) => (b._date - a._date)); // descendente por fecha
  }, [allItems, filterStatus, query]);

  // Agrupa por etiqueta temporal
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const srcDate = item?.FechaElaboracion || item?._date;
      const label = getDateLabel(srcDate);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(item);
    }
    return Array.from(map.entries()); // [[label, items], ...]
  }, [filtered]);

  // Navegación por estado
  const onOpen = (item) => {
      navigate(`/reporte/${item._id}`);
  };

  return (
    <div>
      <div className="cont-card-repo" style={{ gap: 12, alignItems: 'center' }}>
        <h1 style={{ margin: 0, flexBasis: '100%' }}>Panel de Auditorías</h1>

        <div className="toolbar">
          <div className="toolbar__left">
            <button
              className={`filter-btn ${filterStatus === 'all' ? 'filter-btn--active' : ''}`}
              onClick={() => setFilterStatus('all')}
              title="Mostrar todo"
            >
              Todo <span className="badge">{counts.all}</span>
            </button>
            <button
              className={`filter-btn ${filterStatus === STATUS.REVISION ? 'filter-btn--active' : ''}`}
              onClick={() => setFilterStatus(STATUS.REVISION)}
              title="Solo En revisión"
            >
              En revisión <span className="badge badge--revision">{counts.revision}</span>
            </button>
            <button
              className={`filter-btn ${filterStatus === STATUS.REVISADAS ? 'filter-btn--active' : ''}`}
              onClick={() => setFilterStatus(STATUS.REVISADAS)}
              title="Solo Revisadas"
            >
              Revisadas <span className="badge badge--revisadas">{counts.revisadas}</span>
            </button>
          </div>

          <div className="toolbar__right">
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por cliente, tipo, duración…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <h3 className="cont-card-repo">Cargando…</h3>}
      {error && !loading && <h3 className="cont-card-repo">{error}</h3>}

      {!loading && !error && counts.all === 0 && (
        <h2 className="cont-card-repo">No hay auditorías para mostrar</h2>
      )}

      {!loading && !error && counts.all > 0 && (
        <div className="cont-card-repo">
          {groups.map(([label, items]) => (
            <Fragment key={label}>
              <div className="divider" data-label={label}></div>

              {items.map(item => (
                <div
                  key={item._id}
                  className="card-repo"
                  onClick={() => onOpen(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={logo} alt="Logo Empresa" className="logo-empresa-revi" />

                  <div className="card-meta">
                    <span className={`pill ${item._status === STATUS.REVISION ? 'pill--revision' : 'pill--revisadas'}`}>
                      {item._status === STATUS.REVISION ? 'En revisión' : 'Revisada'}
                    </span>
                  </div>

                  <p>Fecha Elaboración: {formatearFecha(item?.FechaElaboracion || item?._date)}</p>
                  <p>Tipo Auditoría: {item?.TipoAuditoria ?? '—'}</p>
                  <p>Duración: {item?.Duracion ?? '—'}</p>
                  {item?.Cliente && <p>Cliente: {item.Cliente}</p>}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
