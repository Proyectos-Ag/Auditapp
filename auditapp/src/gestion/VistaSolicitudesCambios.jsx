import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./css/VistaR.css";
import logo from "../assets/img/logoAguida-min.png";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Formatea la fecha mostrando la "fecha calendario" según UTC (evita shift por timezone)
const formatDate = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (isNaN(d)) return "-";
  // formateamos usando UTC para evitar el desplazamiento hacia el día anterior
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(d);
};

const daysBetweenUTC = (dateA, dateB) => {
  // normalizar a Date
  const a = new Date(dateA);
  const b = new Date(dateB);
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((utcB - utcA) / MS_PER_DAY);
};

const getDateLabel = (fecha) => {
  if (!fecha) return "-";
  const recordDate = new Date(fecha);
  if (isNaN(recordDate)) return "-";

  const today = new Date();

  const diffDays = daysBetweenUTC(recordDate, today);

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays === 2) return "Hace 2 días";
  if (diffDays >= 3 && diffDays < 7) return "Esta semana";

  // Comprobar si está en el mismo mes/año (usamos UTC para comparar la "fecha calendario")
  const sameMonth = recordDate.getUTCMonth() === today.getUTCMonth() && recordDate.getUTCFullYear() === today.getUTCFullYear();
  if (sameMonth) return "Este mes";

  const options = { month: 'long' };
  if (recordDate.getUTCFullYear() !== today.getUTCFullYear()) options.year = 'numeric';

  // Para formato abreviado del mes usamos Intl con timeZone UTC
  return new Intl.DateTimeFormat('es-ES', { ...options, timeZone: 'UTC' }).format(recordDate);
};

const VistaSolicitudesCambios = () => {
  const { userData } = useContext(UserContext);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState("");
  const navigate = useNavigate();

  // opciones de estado (ajusta según los estados que uses en backend)
  const estadoOptions = [
    { value: "", label: "Todos" },
    { value: "pendiente", label: "Pendiente" },
    { value: "enviado", label: "Enviado" },
    { value: "aprobado", label: "Aprobado" },
    { value: "rechazado", label: "Rechazado" },
  ];

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        setLoading(true);
        const params = {};
        if (estadoFilter) params.estado = estadoFilter;
        params.userName = userData?.Nombre;
        params.tipoUsuario = (userData?.TipoUsuario).toString();
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/resumen`,
          { params }
        );
        setSolicitudes(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } catch (err) {
        console.error("Error al obtener resumen de solicitudes:", err);
        setError("No se pudieron cargar las solicitudes. Inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchResumen();
  }, [estadoFilter]);

  const navDetalle = (record) => {
    if (!record) return;
    const estado = (record.estado || "").toString().toLowerCase();
    if (estado === "pendiente") {
      navigate(`/gestion-cambio/${record._id}`);
    } else {
      navigate(`/solicitud-cambio/${record._id}`);
    }
  };

  const solicitudesOrdenadas = solicitudes.slice().sort((a, b) => {
    const da = new Date(a.fechaSolicitud || 0).getTime();
    const db = new Date(b.fechaSolicitud || 0).getTime();
    return db - da;
  });

  if (loading)
    return (
      <div className="cont-card-repo">
        <h3>Cargando solicitudes...</h3>
      </div>
    );
  if (error)
    return (
      <div className="cont-card-repo">
        <h3>{error}</h3>
      </div>
    );

  return (
    <div>
      <div
        className="cont-card-repo"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Solicitudes de Cambio</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Botón para crear nueva solicitud */}
          <button
            type="button"
            onClick={() => navigate("/gestion-cambio")}
            title="Crear nueva solicitud"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(180deg,#4b9cff,#2b76f6)",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(43,118,246,0.18)",
            }}
          >
            Crear nueva solicitud
          </button>

          <label style={{ fontSize: 14, color: "#444", marginLeft: 8 }}>
            Filtrar estado:
          </label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            {estadoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {solicitudesOrdenadas.length === 0 ? (
        <div className="cont-card-repo">
          <h2>No hay solicitudes registradas.</h2>
        </div>
      ) : (
        <div className="cont-card-repo">
          {solicitudesOrdenadas.map((s) => {
            const label = getDateLabel(s.fechaSolicitud);
            return (
              <div
                key={s._id}
                className="card-repo"
                style={{ cursor: "pointer" }}
                onClick={() => navDetalle(s)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navDetalle(s);
                }}
              >
                <img
                  src={logo}
                  alt="Logo Empresa"
                  className="logo-empresa-revi"
                />
                <div style={{ flex: 1 }}>
                  <p>
                    <strong>Solicitante:</strong> {s.solicitante || "-"}
                  </p>
                  <p>
                    <strong>Líder del proyecto:</strong>{" "}
                    {s.liderProyecto || "-"}
                  </p>
                  <p>
                    <strong>Fecha solicitud:</strong>{" "}
                    {formatDate(s.fechaSolicitud)}
                  </p>
                </div>
                <div style={{ marginLeft: 12, textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>
                    <strong>Estado:</strong> {s.estado || "-"}
                  </div>
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
