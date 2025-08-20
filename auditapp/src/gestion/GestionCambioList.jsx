import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import GestionCambioPDF from "./GestionCambioPDF";
import SignaturePopup from "./SignaturePopup";
import { UserContext } from '../App';
import "./css/GestionList.css";

// Componente SignatureProtegida (sin cambios en funcionalidad)
const SignatureProtegida = ({ src, alt, width = 220 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxW = width;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // marca de agua tenue
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-0.5);
      ctx.textAlign = "center";
      ctx.font = `${Math.max(10, Math.floor(canvas.width / 10))}px Arial`;
      ctx.fillStyle = "rgba(255,0,0,0.10)";
      for (let x = -canvas.width; x < canvas.width * 2; x += 200) {
        ctx.fillText("CONFIDENCIAL", x, 0);
      }
      ctx.restore();
    };
    img.onerror = () => {
      canvas.width = width;
      canvas.height = Math.round(width * 0.4);
      ctx.fillStyle = "#f3f3f3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#666";
      ctx.fillText("Imagen no disponible", 10, 20);
    };
    img.src = src;
  }, [src, width]);

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="gcl-signature-protected"
      onContextMenu={prevent}
      onDragStart={prevent}
      onCopy={prevent}
      onCut={prevent}
      onMouseDown={(e) => e.preventDefault()}
      aria-hidden="false"
    >
      <canvas
        ref={canvasRef}
        className="gcl-signature-canvas"
        aria-label={alt}
      />
      <div className="gcl-signature-overlay" aria-hidden="true" />
    </div>
  );
};

/* ------------------ Helpers ------------------ */
const hasValue = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object")
    return Object.values(v).some((val) => hasValue(val));
  if (typeof v === "number") return true;
  if (typeof v === "boolean") return v === true;
  return !!v;
};

const formatDate = (d) => {
  if (!d) return "-";
  try {
    const dateOnly = new Date(d).toISOString().split("T")[0];
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return "-";
  }
};

/* ------------------ Componente principal ------------------ */
const GestionCambioList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useContext(UserContext);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureRole, setSignatureRole] = useState('aprobado');

  useEffect(() => {
    if (!id) {
      setError("ID no proporcionado en la ruta.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchById = async (recordId) => {
      try {
        setLoading(true);
        const userName = encodeURIComponent(userData?.Nombre || '');
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${recordId}?userName=${userName}`
        );
        if (!cancelled) setItem(res.data || null);
      } catch (err) {
        console.error(`Error al obtener gestion ${recordId}:`, err);
        if (!cancelled) {
          if (err.response && err.response.status === 404)
            setError("Registro no encontrado.");
          else setError("No se pudo cargar el registro. Intenta más tarde.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchById(id);
    return () => { cancelled = true; };
  }, [id, userData?.correo]);

  const volver = () => navigate(-1);

  const renderFieldIf = (label, value, important = false) => {
    if (!hasValue(value)) return null;
    return (
      <div className={`gcl-field ${important ? "gcl-important" : ""}`}>
        <span className="gcl-field-label">{label}:</span>
        <span className="gcl-field-value">{value ?? "-"}</span>
      </div>
    );
  };

  const renderBooleanIf = (label, boolVal) => {
    if (boolVal !== true) return null;
    return (
      <div className="gcl-field">
        <span className="gcl-field-label">{label}:</span>
        <span className="gcl-boolean gcl-true">Sí</span>
      </div>
    );
  };

  const onSaveSignature = async (role, dataURL) => {
    try {
      const payload = {
        role,
        email: userData?.Correo,
        nombre: userData?.Nombre,
        cargo: userData?.cargo,
        dataURL
      };
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${id}/sign`,
        payload
      );
      setItem(res.data);
      setSignatureOpen(false);
    } catch (err) {
      console.error('Error guardando firma:', err);
    }
  };

  const renderRiesgosCards = (cards = []) => {
    if (!Array.isArray(cards) || cards.length === 0) return null;
    const populated = cards.filter((card) => hasValue(card));
    if (populated.length === 0) return null;

    return (
      <div className="gcl-riesgos-grid">
        {populated.map((card, idx) => {
          const showTipoPeligro = hasValue(card.tipoPeligro);
          const showDescripcion = hasValue(card.descripcionPeligro);
          const showProb = hasValue(card.probabilidad);
          const showSev = hasValue(card.severidad);
          const showNivel = hasValue(card.nivelRiesgo);
          const showMedidas = hasValue(card.medidasControl);
          const showResp = hasValue(card.responsable);
          const showFecha = hasValue(card.fechaCompromiso);

          const showDocTipo = hasValue(card.tipoDocumento);
          const showDocNombre = hasValue(card.nombreDocumento);
          const showCambioRealizar = hasValue(card.cambioRealizar);
          const showFechaDoc = hasValue(card.fechaCompromisoDoc);
          const showRespDoc = hasValue(card.responsableDoc);

          const showRecTipo = hasValue(card.tipoRecursos);
          const showRecOrigen = hasValue(card.origenRecursos);
          const showCostos = hasValue(card.costos);
          const showTiempo = hasValue(card.tiempoDisponible);
          const showFechaRec = hasValue(card.fechaCompromisoRec);
          const showRespRec = hasValue(card.responsableRec);

          const showInvolucrados =
            Array.isArray(card.involucradosSelected) &&
            card.involucradosSelected.length > 0;

          const anyVisible =
            showTipoPeligro ||
            showDescripcion ||
            showProb ||
            showSev ||
            showNivel ||
            showMedidas ||
            showResp ||
            showFecha ||
            showDocTipo ||
            showDocNombre ||
            showCambioRealizar ||
            showFechaDoc ||
            showRespDoc ||
            showRecTipo ||
            showRecOrigen ||
            showCostos ||
            showTiempo ||
            showFechaRec ||
            showRespRec ||
            showInvolucrados;

          if (!anyVisible) return null;

          return (
            <div key={card.id ?? idx} className="gcl-riesgo-card">
              <div className="gcl-riesgo-card-head">
                <strong className="gcl-riesgo-title">
                  {card.tipoImplicacion === "OTRAS"
                    ? `OTRAS: ${card.otherLabel || ""}`
                    : card.tipoImplicacion || "IMPLICACIÓN"}
                </strong>
                <span className="gcl-riesgo-badge">#{idx + 1}</span>
              </div>

              <div className="gcl-riesgo-body">
                {card.tipoImplicacion === "IMPLICACION_DE_RIESGOS" && (
                  <>
                    <div className="gcl-inline-row">
                      {showTipoPeligro && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Tipo de peligro", card.tipoPeligro)}
                        </div>
                      )}
                      {showResp && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Responsable", card.responsable)}
                        </div>
                      )}
                    </div>
                    {showDescripcion && (
                      <div className="gcl-text-content-small">
                        {card.descripcionPeligro}
                      </div>
                    )}
                    <div className="gcl-inline-row smalls">
                      {showProb && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Probabilidad", card.probabilidad)}
                        </div>
                      )}
                      {showSev && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Severidad", card.severidad)}
                        </div>
                      )}
                      {showNivel && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Nivel", card.nivelRiesgo)}
                        </div>
                      )}
                    </div>
                    {showMedidas &&
                      renderFieldIf("Medidas de control", card.medidasControl)}
                    {showFecha &&
                      renderFieldIf(
                        "Fecha compromiso",
                        formatDate(card.fechaCompromiso)
                      )}
                  </>
                )}

                {card.tipoImplicacion === "DOCUMENTOS" && (
                  <>
                    <div className="gcl-inline-row">
                      {showDocTipo && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Tipo documento", card.tipoDocumento)}
                        </div>
                      )}
                      {showRespDoc && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Responsable", card.responsableDoc)}
                        </div>
                      )}
                    </div>
                    {showDocNombre &&
                      renderFieldIf("Nombre documento", card.nombreDocumento)}
                    {showCambioRealizar && (
                      <div className="gcl-text-content-small">
                        {card.cambioRealizar}
                      </div>
                    )}
                    {showFechaDoc &&
                      renderFieldIf(
                        "Fecha compromiso",
                        formatDate(card.fechaCompromisoDoc)
                      )}
                  </>
                )}

                {card.tipoImplicacion === "RECURSOS" && (
                  <>
                    <div className="gcl-inline-row">
                      {showRecTipo && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Tipo recursos", card.tipoRecursos)}
                        </div>
                      )}
                      {showRecOrigen && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Origen", card.origenRecursos)}
                        </div>
                      )}
                    </div>
                    <div className="gcl-inline-row smalls">
                      {showCostos && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("Costos", card.costos)}
                        </div>
                      )}
                      {showTiempo && (
                        <div className="gcl-inline-item">
                          {renderFieldIf(
                            "Tiempo disponible",
                            card.tiempoDisponible
                          )}
                        </div>
                      )}
                    </div>
                    {showFechaRec &&
                      renderFieldIf(
                        "Fecha compromiso",
                        formatDate(card.fechaCompromisoRec)
                      )}
                    {showRespRec &&
                      renderFieldIf("Responsable", card.responsableRec)}
                  </>
                )}

                {card.tipoImplicacion === "OTRAS" && (
                  <>
                    {showInvolucrados
                      ? card.involucradosSelected.map((inv) => {
                          const data = (card.involucradosData || {})[inv] || {};
                          if (!hasValue(data)) return null;
                          return (
                            <div key={inv} className="gcl-involucrado-block">
                              <h5 className="gcl-involucrado-title">{inv}</h5>
                              <div className="gcl-inline-row smalls">
                                {hasValue(data.tipoAfectacion) && (
                                  <div className="gcl-inline-item">
                                    {renderFieldIf(
                                      "Tipo afectación",
                                      data.tipoAfectacion
                                    )}
                                  </div>
                                )}
                                {hasValue(data.generaCostos) && (
                                  <div className="gcl-inline-item">
                                    {renderFieldIf(
                                      "Genera costos",
                                      data.generaCostos ? "Sí" : "No"
                                    )}
                                  </div>
                                )}
                              </div>
                              {hasValue(data.medidasControl) &&
                                renderFieldIf("Medidas", data.medidasControl)}
                              {hasValue(data.fechaCompromiso) &&
                                renderFieldIf(
                                  "Fecha compromiso",
                                  formatDate(data.fechaCompromiso)
                                )}
                              {hasValue(data.responsable) &&
                                renderFieldIf("Responsable", data.responsable)}
                            </div>
                          );
                        })
                      : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading)
    return (
      <div className="gcl-loading-container">
        <div className="gcl-spinner" />
        <p className="gcl-loading-text">Cargando registro...</p>
      </div>
    );

  if (error)
    return (
      <div className="gcl-no-data-container" style={{ padding: 24 }}>
        <div className="gcl-error-message">{error}</div>
        <button className="gcl-retry-button" onClick={() => volver()}>
          Volver
        </button>
      </div>
    );

  if (!item)
    return (
      <div className="gcl-container-single">
        <div className="gcl-no-data-container">
          <p className="gcl-no-data-text">
            No se encontró la solicitud solicitada.
          </p>
          <button className="gcl-retry-button" onClick={() => volver()}>
            Volver
          </button>
        </div>
      </div>
    );

  const fp = item?.firmadoPor || {};
  const aprobadoList = Array.isArray(fp.aprobado)
    ? fp.aprobado
    : fp.aprobado
    ? [fp.aprobado]
    : [];
  const solicitado = fp.solicitado || fp.solicitante || {};

  const nonEmpty = (s) => typeof s === "string" && s.trim() !== "";

  const solicitanteCompleto =
    nonEmpty(solicitado?.nombre) &&
    nonEmpty(solicitado?.cargo) &&
    nonEmpty(solicitado?.firma);

  const roleComplete = (roleObj) =>
    roleObj &&
    nonEmpty(roleObj.nombre) &&
    nonEmpty(roleObj.cargo) &&
    nonEmpty(roleObj.firma);
  const evaluadoCompleto = roleComplete(fp.evaluado);
  const implementadoCompleto = roleComplete(fp.implementado);
  const validadoCompleto = roleComplete(fp.validado);

  const aprobadoresCompleto =
    Array.isArray(aprobadoList) &&
    aprobadoList.length > 0 &&
    aprobadoList.every((a) => a && nonEmpty(a.nombre) && nonEmpty(a.cargo));

  const todasFirmasCompletas =
    solicitanteCompleto &&
    evaluadoCompleto &&
    implementadoCompleto &&
    validadoCompleto &&
    aprobadoresCompleto;

  return (
    <div className="gcl-container-single">
      <div className="gcl-header-container">
        <div className="gcl-header-content">
          <div>
            <h1 className="gcl-header">Detalle de Solicitud</h1>
            <div className="gcl-subheader">
              Solicitud ID: <strong>{item._id}</strong>
            </div>
          </div>

          <div className="gcl-header-actions">
            <button className="gcl-button-secondary" onClick={() => volver()}>
              Volver
            </button>
            <GestionCambioPDF registro={item} />
          </div>
        </div>
      </div>

      <div className="gcl-single-card-wrapper">
        <div className="gcl-card gcl-card-single">
          <div className="gcl-card-header">
            <div className="gcl-card-id">Solicitud ID: {item._id}</div>
            <div className="gcl-card-date">
              {formatDate(item.fechaSolicitud)}
            </div>
          </div>

          <div className="gcl-card-body">
            {/* Datos de la solicitud */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Datos de la solicitud</h3>
              <div className="gcl-grid-fields compact">
                {renderFieldIf("Solicitante", item.solicitante, true)}
                {renderFieldIf("Área solicitante", item.areaSolicitante)}
                {renderFieldIf("Lugar", item.lugar)}
                {renderFieldIf("Líder de proyecto", item.liderProyecto)}
                {renderFieldIf(
                  "Fecha planeada",
                  formatDate(item.fechaPlaneada)
                )}
              </div>
            </div>

            {/* Alcance */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Alcance del cambio</h3>
              <div className="gcl-grid-fields">
                {renderFieldIf("Tipo de cambio", item.tipoCambio, true)}
                {renderFieldIf(
                  "Productos",
                  item.impactosData?.productos || item.productos
                )}
                {renderFieldIf(
                  "Sistemas/Equipos",
                  item.impactosData?.sistemasEquipos || item.sistemasEquipos
                )}
                {renderFieldIf(
                  "Locales de producción",
                  item.impactosData?.localesProduccion || item.localesProduccion
                )}
                {renderFieldIf(
                  "Programas de limpieza",
                  item.impactosData?.programasLimpieza || item.programasLimpieza
                )}
                {renderFieldIf(
                  "Sistemas de embalaje",
                  item.impactosData?.sistemasEmbalaje || item.sistemasEmbalaje
                )}
                {renderFieldIf(
                  "Niveles de personal",
                  item.impactosData?.nivelesPersonal || item.nivelesPersonal
                )}
                {renderFieldIf(
                  "Requisitos legales",
                  item.impactosData?.requisitosLegales || item.requisitosLegales
                )}
                {renderFieldIf(
                  "Conocimientos de peligros",
                  item.impactosData?.conocimientosPeligros ||
                    item.conocimientosPeligros
                )}
                {renderFieldIf(
                  "Requisitos del cliente",
                  item.impactosData?.requisitosCliente || item.requisitosCliente
                )}
                {renderFieldIf(
                  "Consultas a partes",
                  item.impactosData?.consultasPartes || item.consultasPartes
                )}
                {renderFieldIf(
                  "Quejas de peligros",
                  item.impactosData?.quejasPeligros || item.quejasPeligros
                )}
                {renderFieldIf(
                  "Otras condiciones",
                  item.impactosData?.otrasCondiciones || item.otrasCondiciones
                )}
              </div>
            </div>

            {/* Causa */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Causa</h3>
              <div className="gcl-grid-fields compact">
                {renderBooleanIf(
                  "Solicitud cliente",
                  item.causa?.solicitudCliente
                )}
                {renderBooleanIf(
                  "Reparación defecto",
                  item.causa?.reparacionDefecto
                )}
                {renderBooleanIf(
                  "Acción preventiva",
                  item.causa?.accionPreventiva
                )}
                {renderBooleanIf(
                  "Actualización documento",
                  item.causa?.actualizacionDocumento
                )}
                {renderBooleanIf(
                  "Acción correctiva",
                  item.causa?.accionCorrectiva
                )}
                {renderFieldIf("Otros", item.causa?.otros)}
              </div>
            </div>

            {/* Descripción / Justificación */}
            {hasValue(item.descripcionPropuesta) && (
              <div className="gcl-section">
                <h3 className="gcl-section-title">Descripción propuesta</h3>
                <div className="gcl-text-content">
                  {item.descripcionPropuesta}
                </div>
              </div>
            )}

            {hasValue(item.justificacion) && (
              <div className="gcl-section">
                <h3 className="gcl-section-title">Justificación</h3>
                <div className="gcl-text-content">{item.justificacion}</div>
              </div>
            )}

            {/* Implicaciones */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Implicaciones</h3>
              <div className="gcl-grid-fields compact">
                {renderBooleanIf("Riesgos", item.implicaciones?.riesgos)}
                {renderBooleanIf("Recursos", item.implicaciones?.recursos)}
                {renderBooleanIf(
                  "Documentación",
                  item.implicaciones?.documentacion
                )}
                {renderFieldIf("Otros", item.implicaciones?.otros)}
              </div>
            </div>

            {/* Riesgos */}
            {renderRiesgosCards(item.riesgosCards)}

            {/* Consecuencias */}
            {hasValue(item.consecuencias) && (
              <div className="gcl-section">
                <h3 className="gcl-section-title">Consecuencias</h3>
                <div className="gcl-text-content">{item.consecuencias}</div>
              </div>
            )}

            {/* Firmas */}
          
{(() => {
  const firmadoPor = item?.firmadoPor || {};
  const userNombre = userData?.nombre || userData?.Nombre || '';
  const userCargo = userData?.cargo || userData?.Cargo || '';
  return (
    <div className="gcl-section">
      <h3 className="gcl-section-title">Firmas</h3>

      <div className="gcl-signatures-grid two-per-row">

        {/* SOLICITANTE */}
        <div key="solicitado" className="gcl-signature-card">
          <div className="gcl-signature-role">Solicitante</div>
          <div className="gcl-signature-info">
            <div className="gcl-signature-name">{firmadoPor?.solicitado?.nombre || "Pendiente"}</div>
            <div className="gcl-signature-position">{firmadoPor?.solicitado?.cargo || "-"}</div>
          </div>

          {firmadoPor?.solicitado?.firma ? (
            <SignatureProtegida src={firmadoPor.solicitado.firma} alt="Firma solicitante" width={220} />
          ) : firmadoPor?.solicitado?.hasFirma ? (
            <div className="gcl-signed-badge">
              <span className="gcl-check-icon"></span>
              Firmado
            </div>
          ) : firmadoPor?.canSignSolicitado ? (
            <div className="gcl-sign-action">
              <button className="gcl-sign-btn" onClick={() => { setSignatureRole('solicitado'); setSignatureOpen(true); }}>
                Firmar
              </button>
            </div>
          ) : (
            <div className="gcl-signature-pending">Pendiente</div>
          )}
        </div>

        {/* EVALUADO */}
        <div key="evaluado" className="gcl-signature-card">
          <div className="gcl-signature-role">Evaluado por</div>
          <div className="gcl-signature-info">
            <div className="gcl-signature-name">{firmadoPor?.evaluado?.nombre || "Pendiente"}</div>
            <div className="gcl-signature-position">{firmadoPor?.evaluado?.cargo || "-"}</div>
          </div>

          {firmadoPor?.evaluado?.firma ? (
            <SignatureProtegida src={firmadoPor.evaluado.firma} alt="Firma evaluado" width={220} />
          ) : firmadoPor?.evaluado?.hasFirma ? (
            <div className="gcl-signed-badge">
              <span className="gcl-check-icon"></span>
              Firmado
            </div>
          ) : firmadoPor?.canSignEvaluado ? (
            <div className="gcl-sign-action">
              <button className="gcl-sign-btn" onClick={() => { setSignatureRole('evaluado'); setSignatureOpen(true); }}>
                Firmar
              </button>
            </div>
          ) : (
            <div className="gcl-signature-pending">Pendiente</div>
          )}
        </div>

        {/* APROBADOR USUARIO AUTENTICADO */}
        <div key="aprobador_self" className="gcl-signature-card">
          <div className="gcl-signature-role">Aprobado por</div>
          <div className="gcl-signature-info">
            <div className="gcl-signature-name">
              {firmadoPor?.aprobadoSelf?.nombre || userNombre || 'Tú'}
            </div>
            <div className="gcl-signature-position">
              {firmadoPor?.aprobadoSelf?.cargo || userCargo || '-'}
            </div>
          </div>

          {firmadoPor?.aprobadoSelf?.firma ? (
            <SignatureProtegida src={firmadoPor.aprobadoSelf.firma} alt="Tu firma" width={220} />
          ) : firmadoPor?.aprobadoSelf?.hasFirma ? (
            <div className="gcl-signed-badge">
              <span className="gcl-check-icon"></span>
              Firmado
            </div>
          ) : firmadoPor?.canSignAprobador ? (
            <div className="gcl-sign-action">
              <button className="gcl-sign-btn" onClick={() => { setSignatureRole('aprobado'); setSignatureOpen(true); }}>
                Firmar
              </button>
            </div>
          ) : (
            <div className="gcl-signature-pending">Pendiente</div>
          )}
        </div>

        {/* Resumen de otros aprobadores */}
        <div key="aprobadores_resumen" className="gcl-signature-card gcl-aprobadores-resumen">
          <div className="gcl-signature-role">Aprobadores</div>
          <div className="gcl-aprobadores-list">
            {(firmadoPor?.otrosAprobadoresResumen && firmadoPor.otrosAprobadoresResumen.length > 0) ? (
              firmadoPor.otrosAprobadoresResumen.map((o, i) => (
                <div key={i} className="gcl-otro-aprobador">
                  <div className="gcl-otro-name">{o.nombre}</div>
                  <div className="gcl-otro-cargo">{o.cargo}</div>
                  <div className="gcl-otro-status">
                    {o.hasFirma ? (
                      <>
                        <span className="gcl-check-icon"></span>
                        Firmado
                      </>
                    ) : (
                      "Pendiente"
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="gcl-signature-pending">No hay más aprobadores</div>
            )}
          </div>
        </div>

        {/* IMPLEMENTADO */}
        <div key="implementado" className="gcl-signature-card">
          <div className="gcl-signature-role">Implementado por</div>
          <div className="gcl-signature-info">
            <div className="gcl-signature-name">{firmadoPor?.implementado?.nombre || "Pendiente"}</div>
            <div className="gcl-signature-position">{firmadoPor?.implementado?.cargo || "-"}</div>
          </div>

          {firmadoPor?.implementado?.firma ? (
            <SignatureProtegida src={firmadoPor.implementado.firma} alt="Firma implementado" width={220} />
          ) : firmadoPor?.implementado?.hasFirma ? (
            <div className="gcl-signed-badge">
              <span className="gcl-check-icon"></span>
              Firmado
            </div>
          ) : firmadoPor?.canSignImplementado ? (
            <div className="gcl-sign-action">
              <button className="gcl-sign-btn" onClick={() => { setSignatureRole('implementado'); setSignatureOpen(true); }}>
                Firmar
              </button>
            </div>
          ) : (
            <div className="gcl-signature-pending">Pendiente</div>
          )}
        </div>

        {/* VALIDADO */}
        <div key="validado" className="gcl-signature-card">
          <div className="gcl-signature-role">Validado por</div>
          <div className="gcl-signature-info">
            <div className="gcl-signature-name">{firmadoPor?.validado?.nombre || "Pendiente"}</div>
            <div className="gcl-signature-position">{firmadoPor?.validado?.cargo || "-"}</div>
          </div>

          {firmadoPor?.validado?.firma ? (
            <SignatureProtegida src={firmadoPor.validado.firma} alt="Firma validado" width={220} />
          ) : firmadoPor?.validado?.hasFirma ? (
            <div className="gcl-signed-badge">
              <span className="gcl-check-icon"></span>
              Firmado
            </div>
          ) : firmadoPor?.canSignValidado ? (
            <div className="gcl-sign-action">
              <button className="gcl-sign-btn" onClick={() => { setSignatureRole('validado'); setSignatureOpen(true); }}>
                Firmar
              </button>
            </div>
          ) : (
            <div className="gcl-signature-pending">Pendiente</div>
          )}
        </div>
      </div>
    </div>
  );
})()}
          </div>

          <div className="gcl-card-footer">
            <span className={`gcl-status ${item?.estado === 'aprobado' ? 'gcl-status-approved' : 'gcl-status-pending'}`}>
              {item?.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      <SignaturePopup
        open={signatureOpen}
        role={signatureRole}
        onSave={(role, dataURL) => onSaveSignature(role, dataURL)}
        onClose={() => setSignatureOpen(false)}
      />
    </div>
  );
};

export default GestionCambioList;