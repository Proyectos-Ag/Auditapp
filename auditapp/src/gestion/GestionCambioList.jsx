import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import GestionCambioPDF from "./GestionCambioPDF";
import SignaturePopup from "./SignaturePopup";
import { UserContext } from '../App';
import ValidacionForm from "./validacion/ValidacionForm";
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

// helpers para mapear firmadoPor del backend (filtrado) a la forma legacy que espera el front
const capitalize = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function mapFirmadoPorBackendToLegacy(fpFiltered = {}) {
  const roles = ['solicitado','evaluado','aprobado','implementado','validado'];
  const out = {};

  roles.forEach((role) => {
    const node = fpFiltered[role] || {};
    const self = node.self || null; // objeto completo si el backend detectó que el usuario es uno de los del rol
    const others = Array.isArray(node.others) ? node.others : []; // [{nombre,cargo,hasFirma},...]

    // Construimos array legacy: self (si existe) al inicio, luego others
    const arr = [];
    if (self) {
      arr.push({
        nombre: self.nombre || '',
        cargo: self.cargo || '',
        firma: self.firma || '',
        email: self.email || '',
        fechaFirma: self.fechaFirma || null,
        hasFirma: !!self.firma
      });
    }
    others.forEach(o => {
      arr.push({
        nombre: o.nombre || '',
        cargo: o.cargo || '',
        hasFirma: !!o.hasFirma,
        // otros objetos de la lista de "others" normalmente no traen 'firma' ni 'email'
      });
    });

    // Exportamos el array como la representación principal del role (compatibilidad mejorada)
    out[role] = arr;

    // También exportamos un objeto con el primer elemento para lecturas antiguas
    out[`${role}Obj`] = arr.length > 0 ? arr[0] : null;

    // Flags de canSign: soportamos ambos nombres por compatibilidad
    const canSign = !!node.canSign;
    if (role === 'aprobado') {
      out['canSignAprobador'] = canSign;
      out['canSignAprobado'] = canSign;
      // estructuras adicionales que el UI ya usaba
      out.aprobadoSelf = self ? { ...self, hasFirma: !!self.firma } : null;
      out.otrosAprobadoresResumen = others.map(o => ({ nombre: o.nombre || '', cargo: o.cargo || '', hasFirma: !!o.hasFirma }));
      out.aprobado = arr; // legacy: mantenemos también la propiedad aprobado (array)
      out.aprobadoObj = out.aprobadoObj || null;
    } else {
      const key = `canSign${capitalize(role)}`;
      out[key] = canSign;
    }
  });

  return out;
}

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
  setCollapsed(!!(item && item.estado === 'aprobado'));
}, [item?.estado]);

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
        const userEmail = encodeURIComponent(userData?.Correo || userData?.correo || userData?.email || '');
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${recordId}?userName=${userName}&userEmail=${userEmail}`
        );
        if (!cancelled) {
          // mapear firmadoPor si viene (backend devuelve firmadoPor filtrado)
          const data = res.data || null;
          if (data && data.firmadoPor) {
            data.firmadoPor = mapFirmadoPorBackendToLegacy(data.firmadoPor);
          }
          setItem(data);
        }
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
  }, [id, userData?.Nombre, userData?.Correo, userData?.correo, userData?.email]);

  // normaliza nombre del usuario actual
const _userNombre = (userData?.Nombre || userData?.nombre || "").trim().toLowerCase();

// obtiene lista de firmantes "validado" (compatibilidad con validadoObj)
const validadoList = Array.isArray(item?.firmadoPor?.validado)
  ? item.firmadoPor.validado
  : (item?.firmadoPor?.validadoObj ? [item.firmadoPor.validadoObj] : []);

// decide si el usuario está en la lista "validado"
const userIsInValidado = Boolean(
  _userNombre &&
  Array.isArray(validadoList) &&
  validadoList.some(s => ((s?.nombre || "").trim().toLowerCase()) === _userNombre)
);


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
    const data = res.data;
    if (data && data.firmadoPor) {
      data.firmadoPor = mapFirmadoPorBackendToLegacy(data.firmadoPor);
    }
    setItem(data);
    setSignatureOpen(false);

    if (data && data.validacionCreada) {
      // ejemplo simple: mostrar alerta o navegar a la validación
      alert(`Se creó la validación: ${data.validacionCreada._id}`);
      // o: navigate(`/validacion/${data.validacionCreada._id}`);
    }
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
                          {renderFieldIf("TIPO DE PELIGRO", card.tipoPeligro)}
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
                          {renderFieldIf("TIPO DE RECURSOS", card.tipoRecursos)}
                        </div>
                      )}
                      {showRecOrigen && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("ORIGEN DE LOS RECURSOS (INTERNO/EXTERNO)", card.origenRecursos)}
                        </div>
                      )}
                    </div>
                    <div className="gcl-inline-row smalls">
                      {showCostos && (
                        <div className="gcl-inline-item">
                          {renderFieldIf("COSTOS", card.costos)}
                        </div>
                      )}
                      {showTiempo && (
                        <div className="gcl-inline-item">
                          {renderFieldIf(
                            "TIEMPO EN QUE ESTARAN DISPONIBLES",
                            card.tiempoDisponible
                          )}
                        </div>
                      )}
                    </div>
                    {showFechaRec &&
                      renderFieldIf(
                        "FECHA COMPROMISO",
                        formatDate(card.fechaCompromisoRec)
                      )}
                    {showRespRec &&
                      renderFieldIf("RESPONSABLE", card.responsableRec)}
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

          <button
            className="gcl-button-secondary"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expandir contenido' : 'Minimizar contenido'}
            style={{ marginLeft: 8 }}
          >
            {collapsed ? 'Expandir' : 'Minimizar'}
          </button>

          <GestionCambioPDF registroId={id} />
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

          {collapsed ? (
            <div className="gcl-card-body gcl-collapsed">
              <div style={{ padding: 12 }}>
                <strong>Solicitud minimizada</strong>
                <div className="gcl-minimized-row" style={{ marginTop: 8 }}>
                  {renderFieldIf("Solicitante del cambio", item.solicitante)}
                  {renderFieldIf("Tipo de cambio", item.tipoCambio)}
                  {renderFieldIf("Fecha planeada", formatDate(item.fechaPlaneada))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <small style={{ color: '#666' }}>Contenido minimizado porque el estado es <strong>{item.estado}</strong>. Pulsa <em>Expandir</em> para ver todo.</small>
                </div>
              </div>
            </div>
          ) : (
          <div className="gcl-card-body">
            {/* Datos de la solicitud */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Sección 1: Datos de la solicitud del cambio</h3>
              <div className="gcl-grid-fields compact">
                {renderFieldIf("Solicitante del cambio", item.solicitante, true)}
                {renderFieldIf("Área del solicitante", item.areaSolicitante)}
                {renderFieldIf("Lugar", item.lugar)}
                {renderFieldIf("Líder del proyecto", item.liderProyecto)}
                {renderFieldIf(
                  "Fecha planeada para realizar el cambio",
                  formatDate(item.fechaPlaneada)
                )}
              </div>
            </div>

            {/* Alcance */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Sección 2: Formulario de Notificación de Solicitud de Cambio</h3>
              <div className="gcl-grid-fields">
                {renderFieldIf("Tipo de cambio", item.tipoCambio, true)}
                {renderFieldIf(
                  "Productos nuevos, MP´S, ingredientes y servicios",
                  item.impactosData?.productos || item.productos
                )}
                {renderFieldIf(
                  "Sistemas y equipos de producción",
                  item.impactosData?.sistemasEquipos || item.sistemasEquipos
                )}
                {renderFieldIf(
                  "Locales de producción, ubicación de los equipos, entorno circundante",
                  item.impactosData?.localesProduccion || item.localesProduccion
                )}
                {renderFieldIf(
                  "Programas de limpieza y desinfección",
                  item.impactosData?.programasLimpieza || item.programasLimpieza
                )}
                {renderFieldIf(
                  "Sistemas de embalaje, almacenamiento y distribución",
                  item.impactosData?.sistemasEmbalaje || item.sistemasEmbalaje
                )}
                {renderFieldIf(
                  "Niveles de calificación del personal y/o asignación de responsabilidades  y autorizaciones",
                  item.impactosData?.nivelesPersonal || item.nivelesPersonal
                )}
                {renderFieldIf(
                  "Requisitos legales y reglamentarios",
                  item.impactosData?.requisitosLegales || item.requisitosLegales
                )}
                {renderFieldIf(
                  "Conocimientos relativos a los peligros para la inocuidad de los alimentos y medidas de control",
                  item.impactosData?.conocimientosPeligros ||
                    item.conocimientosPeligros
                )}
                {renderFieldIf(
                  "Requisitos del cliente, del sector y otros requisitos que la organización tiene en cuenta",
                  item.impactosData?.requisitosCliente || item.requisitosCliente
                )}
                {renderFieldIf(
                  "Consultas pertinentes de las partes interesadas externas",
                  item.impactosData?.consultasPartes || item.consultasPartes
                )}
                {renderFieldIf(
                  "Quejas indicando peligros relacionados con la inocuidad de los alimentos, asociados al producto",
                  item.impactosData?.quejasPeligros || item.quejasPeligros
                )}
                {renderFieldIf(
                  "Otras condiciones que tenga impacto en la inocuidad de los alimentos",
                  item.impactosData?.otrasCondiciones || item.otrasCondiciones
                )}
              </div>
            </div>

            {/* Causa */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Sección 3: Causa/ Origen del cambio</h3>
              <div className="gcl-grid-fields compact">
                {renderBooleanIf(
                  "Solicitud del cliente",
                  item.causa?.solicitudCliente
                )}
                {renderBooleanIf(
                  "Reparación de defecto",
                  item.causa?.reparacionDefecto
                )}
                {renderBooleanIf(
                  "Acción preventiva",
                  item.causa?.accionPreventiva
                )}
                {renderBooleanIf(
                  " Actualización / modificación de documento",
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
                <h3 className="gcl-section-title">Sección 4: Descripción de la propuesta de cambio</h3>
                <div className="gcl-text-content">
                  {item.descripcionPropuesta}
                </div>
              </div>
            )}

            {hasValue(item.justificacion) && (
              <div className="gcl-section">
                <h3 className="gcl-section-title">Sección 5: Justificación de la propuesta de cambio</h3>
                <div className="gcl-text-content">{item.justificacion}</div>
              </div>
            )}

            {/* Implicaciones */}
            <div className="gcl-section">
              <h3 className="gcl-section-title">Sección 6: Implicaciones del cambio</h3>
              <div className="gcl-grid-fields compact">
                {renderBooleanIf("Riesgos para la inocuidad", item.implicaciones?.riesgos)}
                {renderBooleanIf("Recursos (humano, económico, material)", item.implicaciones?.recursos)}
                {renderBooleanIf(
                  "Documentación (layout, procedimientos, planos etc.)",
                  item.implicaciones?.documentacion
                )}
                {renderFieldIf("Otros", item.implicaciones?.otros)}
              </div>
            </div>

             {/* Consecuencias */}
            {hasValue(item.consecuencias) && (
              <div className="gcl-section">
                <h3 className="gcl-section-title">Sección 7: Consecuencias de no realizar el  cambio</h3>
                <div className="gcl-text-content">{item.consecuencias}</div>
              </div>
            )}

            {/* Riesgos */}
            {renderRiesgosCards(item.riesgosCards)}

            {/* Firmas */}
          
{/* Firmas */}
{(() => {
  const firmadoPor = item?.firmadoPor || {};
  const userNombre = userData?.nombre || userData?.Nombre || '';
  const userCargo = userData?.cargo || userData?.Cargo || '';

  const renderRoleSigners = (roleKey, label, canSignFlagKey) => {
    const arr = Array.isArray(firmadoPor?.[roleKey]) ? firmadoPor[roleKey] : (firmadoPor?.[roleKey] ? [firmadoPor[roleKey]] : []);
    const canSign = !!(firmadoPor?.[canSignFlagKey]);

    return (
      <div key={roleKey} className="gcl-signature-card">
        <div className="gcl-signature-role">{label}</div>

        <div className="gcl-signers-list">
          {arr.length === 0 ? (
            <div className="gcl-signature-pending">Pendiente</div>
          ) : (
            arr.map((s, i) => {
              const name = s?.nombre || 'Pendiente';
              const cargo = s?.cargo || '-';
              const hasFirma = !!s?.hasFirma || !!s?.firma;
              return (
                <div key={`${roleKey}-${i}`} className="gcl-signer-row" style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div className="gcl-signature-info">
                      <div className="gcl-signature-name">{name}</div>
                      <div className="gcl-signature-position">{cargo}</div>
                    </div>
                  </div>

                  <div style={{ width: 240 }}>
                    {s?.firma ? (
                      <SignatureProtegida src={s.firma} alt={`Firma ${name}`} width={220} />
                    ) : hasFirma ? (
                      <div className="gcl-signed-badge">
                        <span className="gcl-check-icon" />
                        Firmado
                      </div>
                    ) : (
                      <div className="gcl-signature-pending">Pendiente</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Botón de firmar para este rol (si el backend indicó que el usuario puede) */}
        {canSign ? (
          <div className="gcl-sign-action" style={{ marginTop: 8 }}>
            <button
              className="gcl-sign-btn"
              onClick={() => {
                setSignatureRole(roleKey);
                setSignatureOpen(true);
              }}
            >
              Firmar
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="gcl-section">
      <h3 className="gcl-section-title">Firmas</h3>

      <div className="gcl-signatures-grid two-per-row">
        {renderRoleSigners('solicitado', 'Solicitante', 'canSignSolicitado')}
        {renderRoleSigners('evaluado', 'Evaluado por', 'canSignEvaluado')}
        {renderRoleSigners('aprobado', 'Aprobado por', 'canSignAprobador')}
        {renderRoleSigners('implementado', 'Implementado por', 'canSignImplementado')}
        {renderRoleSigners('validado', 'Validado por', 'canSignValidado')}
      </div>
    </div>
  );
})()}

          </div>

)}

          <div className="gcl-card-footer">
            <span className={`gcl-status ${item?.estado === 'aprobado' ? 'gcl-status-approved' : 'gcl-status-pending'}`}>
              {item?.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'}
            </span>
          </div>
        </div>
        {item?.estado === 'aprobado' && (userData?.TipoUsuario === 'administrador' || userIsInValidado) && (
          <div className="gcl-validation-section" style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 12 }}>Formulario de Validación</h3>

            {/* Prefill: toma el primer solicitante normalizado si existe */}
            <ValidacionForm
              cambioId={item._id}
              prefillElaboro={
                // intento preferente: objeto legacy 'solicitadoObj', si no, primer elemento del array
                item?.firmadoPor?.solicitadoObj || (Array.isArray(item?.firmadoPor?.solicitado) ? item.firmadoPor.solicitado[0] : null)
              }
            />
          </div>
        )}
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