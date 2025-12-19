// src/.../VistaIshikawas.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import logo from "../assets/img/logoAguida-min.png";
import { useNavigate } from "react-router-dom";
import "./css/VistaIshikawasGrid.css"; // ✅ NUEVO CSS (ruta relativa según tu carpeta)

const VistaIshikawas = () => {
  const [ishikawas, setIshikawas] = useState([]);
  const [ishikawasInc, setIshikawasInc] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedYears, setExpandedYears] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await api.get("/ishikawa/ishesp");
        const responseInc = await api.get("/ishikawa/ishesp-inc");
        setIshikawas(response.data || []);
        setIshikawasInc(responseInc.data || []);

        const currentYear = new Date().getFullYear();
        setExpandedYears({ [currentYear]: true });
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchDatos();
  }, []);

  // ===== helpers fecha (ajuste UTC->local) =====
  const toLocalFromUTC = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return null;
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d;
  };

  const toTimeFixed = (fecha) => {
    const d = toLocalFromUTC(fecha);
    return d ? d.getTime() : 0;
  };

  const formatearFecha = (fecha) => {
    const d = toLocalFromUTC(fecha);
    if (!d) return "Fecha no disponible";

    const dia = d.getDate();
    const mes = d.toLocaleString("es-ES", { month: "long" });
    const año = d.getFullYear();
    return `${dia} de ${mes} de ${año}`;
  };

  const sortByFechaDesc = (arr, field = "fecha") =>
    [...(arr || [])].sort((a, b) => toTimeFixed(b?.[field]) - toTimeFixed(a?.[field]));

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case "Hecho":
        return "yellow";
      case "Rechazado":
        return "red";
      case "Aprobado":
        return "blue";
      case "Finalizado":
        return "green";
      default:
        return "black";
    }
  };

  const formatearEstado = (estado) => (estado === "Hecho" ? "En revisión" : estado);

  const navReporte = (_id) => navigate(`/diagrama/${_id}`);

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // ===== data derivada =====
  const gruposPorAnio = useMemo(() => {
    const grupos = {};

    (ishikawas || []).forEach((ishikawa) => {
      const d = toLocalFromUTC(ishikawa.fecha);
      if (!d) return;

      const year = d.getFullYear();
      if (!grupos[year]) grupos[year] = [];
      grupos[year].push(ishikawa);
    });

    Object.keys(grupos).forEach((y) => {
      grupos[y] = sortByFechaDesc(grupos[y], "fecha");
    });

    return grupos;
  }, [ishikawas]);

  const anios = useMemo(
    () => Object.keys(gruposPorAnio).sort((a, b) => Number(b) - Number(a)),
    [gruposPorAnio]
  );

  const currentYear = new Date().getFullYear();

  const ishikawasIncOrdenadas = useMemo(() => {
    // si trae fechaElaboracion úsala; si no, cae a fecha
    return [...(ishikawasInc || [])].sort(
      (a, b) =>
        toTimeFixed(b.fechaElaboracion || b.fecha) - toTimeFixed(a.fechaElaboracion || a.fecha)
    );
  }, [ishikawasInc]);

  return (
    <div className="ishrev-page">
      {/* Header */}
      <div className="ishrev-header">
        <h1 className="ishrev-title">Revisión de Ishikawa</h1>

        <button type="button" className="ishrev-procBtn" onClick={() => setShowModal(true)}>
          En proceso: {ishikawasInc.length} registros
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ishrev-modalOverlay" role="dialog" aria-modal="true">
          <div className="ishrev-modal">
            <div className="ishrev-modalTop">
              <h2 className="ishrev-modalTitle">En Proceso</h2>

              <button className="ishrev-modalClose" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>

            {ishikawasIncOrdenadas.length > 0 ? (
              <div className="ishrev-grid ishref-grid--modal">
                {ishikawasIncOrdenadas.map((ishikawa) => (
                  <div
                    key={ishikawa._id}
                    className="ishrev-card"
                    onClick={() => navReporte(ishikawa._id)}
                    role="button"
                    tabIndex={0}
                  >
                    <img src={logo} alt="Logo Empresa" className="ishrev-logo" />

                    <div className="ishrev-info">
                      <p className="ishrev-line">
                        <span className="ishrev-label">Fecha:</span>
                        {formatearFecha(ishikawa.fechaElaboracion || ishikawa.fecha)}
                      </p>

                      <p className="ishrev-line">
                        <span className="ishrev-label">Realizó:</span>
                        {ishikawa.auditado}
                      </p>

                      <p
                        className="ishrev-status"
                        style={{
                          color:
                            ishikawa.estado === "Incompleto"
                              ? "orange"
                              : obtenerColorEstado(ishikawa.estado),
                        }}
                      >
                        Estado:{" "}
                        {ishikawa.estado === "Incompleto"
                          ? "En proceso"
                          : formatearEstado(ishikawa.estado)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ishrev-empty">No hay ishikawas en proceso.</div>
            )}
          </div>
        </div>
      )}

      {/* Lista principal */}
      <div className="ishrev-grid">
        {anios.length > 0 ? (
          anios.map((year) => {
            const yearInt = Number(year);
            const isCurrent = yearInt === currentYear;
            const isExpanded = expandedYears[year] || isCurrent;

            return (
              <React.Fragment key={year}>
                {!isCurrent && (
                  <button
                    type="button"
                    className="ishrev-yearToggle"
                    onClick={() => toggleYear(year)}
                  >
                    Año: {year} {isExpanded ? "▲" : "▼"}
                  </button>
                )}

                {isExpanded &&
                  (gruposPorAnio[year] || []).map((ishikawa) => (
                    <div
                      key={ishikawa._id}
                      className="ishrev-card"
                      onClick={() => navReporte(ishikawa._id)}
                      role="button"
                      tabIndex={0}
                    >
                      <img src={logo} alt="Logo Empresa" className="ishrev-logo" />

                      <div className="ishrev-info">
                        <p className="ishrev-line">
                          <span className="ishrev-label">Fecha:</span>
                          {formatearFecha(ishikawa.fecha)}
                        </p>

                        <p className="ishrev-line">
                          <span className="ishrev-label">Realizó:</span>
                          {ishikawa.auditado}
                        </p>

                        <p
                          className="ishrev-status"
                          style={{ color: obtenerColorEstado(ishikawa.estado) }}
                        >
                          Estado: {formatearEstado(ishikawa.estado)}
                        </p>
                      </div>
                    </div>
                  ))}
              </React.Fragment>
            );
          })
        ) : (
          <div className="ishrev-empty">No hay ishikawas por revisar.</div>
        )}
      </div>
    </div>
  );
};

export default VistaIshikawas;