import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./css/ValidacionForm.css";
import FileUploader from "../../components/fileUploader/FileUploader";
import NameSearchAutocomplete from "../../resources/NameSearchAutocomplete";
import SignaturePopup from "../SignaturePopup";

const initial = {
  etapaProceso: "",
  puntoValidar: "",
  fechaValidacion: "",
  peligro: "",
  medidaControl: "",
  parametrosValoresLimite: "",
  elementos: {
    queValidar: "",
    comoValidarlo: "",
    quienParticipa: "",
    cuandoCuantasVeces: "",
    riesgoInicial: "",
    queEsperamosResultado: ""
  },
  desarrolloValidacion: "",
  resultadosValidacion: "",
  medidaControlInicial: "",
  requiereCambio: false,
  requiereCambioDetalle: "",
  observaciones: "",
  // firmas
  elaboro: { nombre: "", cargo: "", email: "", firma: "" },
  reviso: { nombre: "", cargo: "", email: "", firma: "" },
  estado: "pendiente"
};

function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function ValidacionForm({ cambioId, prefillElaboro = null }) {
  const [form, setForm] = useState(initial);
  const [uploadedFiles, setUploadedFiles] = useState([]); // array de {url,name,type,...}
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileUploaderRef = useRef(null);
  const [validationId, setValidationId] = useState(null);

  const [sigRole, setSigRole] = useState(null); // 'elaboro' | 'reviso' | null
  const [revisoSelectedFromList, setRevisoSelectedFromList] = useState(false);

  // computed: si está finalizado/deshabilitado
  const isFinalizado = String(form.estado || "").toLowerCase() === "completado" || String(form.estado || "").toLowerCase() === "finalizado";

  useEffect(() => {
    if (!cambioId) return;
    let mounted = true;

    const fetch = async () => {
      setLoading(true);
      try {
        const base = process.env.REACT_APP_BACKEND_URL || "";
        const urlsToTry = [
          `${base}/api/validaciones/gestion/${cambioId}`,
          `${base}/api/validaciones/${cambioId}`
        ];

        let res = null;
        for (const u of urlsToTry) {
          try {
            res = await axios.get(u);
            if (res && res.data) break;
          } catch (err) {
            res = null;
          }
        }

        if (!res || !res.data) {
          if (mounted) {
            setForm(initial);
            setUploadedFiles([]);
          }
          return;
        }

        const data = Array.isArray(res.data) ? (res.data[0] || {}) : res.data;

        // helper para normalizar firmas base64 -> data URI
        const normalizeSignature = (sig) => {
          if (!sig) return "";
          if (typeof sig !== "string") return "";
          return sig.startsWith("data:") ? sig : `data:image/png;base64,${sig}`;
        };

        // extraer firmas (primero buscar en data.firmas, si no existe buscar en data.elaboro/data.reviso)
        const firmasFromDoc = data.firmas || {};
        const elaboroFromDoc = firmasFromDoc.elaboro || data.elaboro || {};
        const revisoFromDoc = firmasFromDoc.reviso || data.reviso || {};

        if (mounted) {
          console.log("validacion fetched:", data);
          setValidationId(data._id || null);

          setForm(prev => ({
            ...prev,
            etapaProceso: data.etapaProceso || "",
            puntoValidar: data.puntoValidar || "",
            fechaValidacion: formatDateForInput(data.fechaValidacion),
            peligro: data.peligro || "",
            medidaControl: data.medidaControl || "",
            parametrosValoresLimite: data.parametrosValoresLimite || "",
            elementos: data.elementos || initial.elementos,
            desarrolloValidacion: data.desarrolloValidacion || "",
            resultadosValidacion: data.resultadosValidacion || "",
            medidaControlInicial: data.medidaControlInicial || "",
            requiereCambio: !!data.requiereCambio,
            requiereCambioDetalle: data.requiereCambioDetalle || "",
            observaciones: data.observaciones || "",
            elaboro: {
              nombre: elaboroFromDoc.nombre || elaboroFromDoc.Nombre || data.solicitante || data.solicitanteNombre || "",
              cargo: elaboroFromDoc.cargo || elaboroFromDoc.Puesto || "",
              email: elaboroFromDoc.email || elaboroFromDoc.Correo || "",
              firma: normalizeSignature(elaboroFromDoc.firma || "")
            },
            reviso: {
              nombre: revisoFromDoc.nombre || revisoFromDoc.Nombre || "",
              cargo: revisoFromDoc.cargo || revisoFromDoc.Puesto || "",
              email: revisoFromDoc.email || revisoFromDoc.Correo || "",
              firma: normalizeSignature(revisoFromDoc.firma || "")
            },
            estado: data.estado || data.estadoValidacion || data.estadoRegistro || "pendiente"
          }));

          const evidencias = data.evidencias || data.evidenciasValidacion || [];
          setUploadedFiles(evidencias);

          if (fileUploaderRef.current?.setInitialFiles) {
            try { fileUploaderRef.current.setInitialFiles(evidencias); } catch (_) {}
          }

          if (revisoFromDoc && (revisoFromDoc.nombre || revisoFromDoc.Nombre)) {
            setRevisoSelectedFromList(true);
          }
        }
      } catch (err) {
        console.error("Error cargando validación:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [cambioId]);

  // prefill elaboro
  useEffect(() => {
    if (!prefillElaboro) return;
    const normalize = (p) => {
      if (!p) return null;
      if (typeof p === 'string') return { nombre: p, cargo: '', email: '' };
      return {
        nombre: p.nombre || p.Nombre || p.NombreCompleto || '',
        cargo: p.cargo || p.Puesto || p.puesto || p.position || '',
        email: p.email || p.Correo || p.correo || ''
      };
    };
    const n = normalize(prefillElaboro);
    if (!n) return;
    setForm(prev => {
      const existing = prev.elaboro || { nombre: '', cargo: '', email: '', firma: '' };
      return {
        ...prev,
        elaboro: {
          nombre: existing.nombre || n.nombre,
          cargo: existing.cargo || n.cargo,
          email: existing.email || n.email,
          firma: existing.firma || ''
        }
      };
    });
  }, [prefillElaboro]);

  const handleChange = (e) => {
    if (isFinalizado) return; // bloquear edición cuando finalizado
    const { name, value, type, checked } = e.target;
    if (name.startsWith("elementos.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, elementos: { ...prev.elementos, [key]: value }}));
      return;
    }
    if (name === "requiereCambio") {
      setForm((prev) => ({ ...prev, requiereCambio: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fileObj) => {
    if (!fileObj || !fileObj.url) return;
    setUploadedFiles(prev => {
      if (prev.some(p => p.url === fileObj.url)) return prev;
      return [...prev, fileObj];
    });
  };

  const removeUploaded = (index) => {
    if (isFinalizado) return;
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!form.etapaProceso || !form.etapaProceso.trim()) e.etapaProceso = "Requerido";
    if (!form.puntoValidar || !form.puntoValidar.trim()) e.puntoValidar = "Requerido";
    if (form.fechaValidacion && isNaN(new Date(form.fechaValidacion).getTime())) e.fechaValidacion = "Fecha inválida";

    if (!form.reviso || !form.reviso.nombre || String(form.reviso.nombre).trim() === "") {
      e.reviso = "Seleccione quien revisó (obligatorio)";
    } else if (!revisoSelectedFromList) {
      e.reviso = "Debe seleccionar una persona desde la lista (no escribir texto libre)";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // función común que guarda/actualiza (estado opcional)
  const saveValidation = async (estadoToSet) => {
    setLoading(true);
    try {
      // subir staged files
      let uploadResults = [];
      if (fileUploaderRef.current?.uploadAll) {
        try {
          uploadResults = await fileUploaderRef.current.uploadAll();
        } catch (err) {
          console.warn("uploadAll falló:", err);
          uploadResults = [];
        }
      }

      let evidenciasFromUploader = Array.isArray(uploadResults) && uploadResults.length > 0
        ? uploadResults
        : (fileUploaderRef.current?.getUploadedFiles ? fileUploaderRef.current.getUploadedFiles() : uploadedFiles || []);

      const evidenciasPayload = (evidenciasFromUploader || [])
        .map(f => {
          const url = f.url || f.path || f.link || null;
          if (!url) return null;
          return {
            url,
            name: f.name || f.fileName || null,
            type: f.type || f.mime || null,
            size: f.size ?? null,
            provider: f.provider || f.storageProvider || (f.storagePath ? 'firebase' : 'remote'),
            uploadedAt: f.uploadedAt || new Date()
          };
        })
        .filter(Boolean);

      const payload = {
        gestionId: cambioId,
        etapaProceso: form.etapaProceso,
        puntoValidar: form.puntoValidar,
        fechaValidacion: form.fechaValidacion || null,
        peligro: form.peligro,
        medidaControl: form.medidaControl,
        parametrosValoresLimite: form.parametrosValoresLimite,
        elementos: form.elementos,
        desarrolloValidacion: form.desarrolloValidacion,
        resultadosValidacion: form.resultadosValidacion,
        medidaControlInicial: form.medidaControlInicial,
        requiereCambio: form.requiereCambio,
        requiereCambioDetalle: form.requiereCambioDetalle,
        observaciones: form.observaciones,
        evidencias: evidenciasPayload,
        firmas: {
          elaboro: form.elaboro,
          reviso: form.reviso
        },
        // incluir estado si se pide (ej. 'completado')
        ...(typeof estadoToSet !== "undefined" ? { estado: estadoToSet } : {})
      };

      const base = process.env.REACT_APP_BACKEND_URL || "";
      const res = await axios.put(`${base}/api/validaciones/${validationId}`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      let saved = res?.data;
      if (!saved || !Object.keys(saved).length) {
        try {
          const getRes = await axios.get(`${base}/api/validaciones/${validationId}`);
          saved = getRes.data;
        } catch (err) {
          console.warn("No se pudo reobtener la validación tras el PUT:", err);
        }
      }

      if (saved) {
        const finalEvid = saved.evidencias || evidenciasPayload || [];
        setUploadedFiles(finalEvid);

        setForm(prev => ({
          ...prev,
          etapaProceso: saved.etapaProceso ?? prev.etapaProceso,
          puntoValidar: saved.puntoValidar ?? prev.puntoValidar,
          fechaValidacion: formatDateForInput(saved.fechaValidacion) ?? prev.fechaValidacion,
          elementos: saved.elementos ?? prev.elementos,
          desarrolloValidacion: saved.desarrolloValidacion ?? prev.desarrolloValidacion,
          resultadosValidacion: saved.resultadosValidacion ?? prev.resultadosValidacion,
          medidaControlInicial: saved.medidaControlInicial ?? prev.medidaControlInicial,
          requiereCambio: typeof saved.requiereCambio !== "undefined" ? !!saved.requiereCambio : prev.requiereCambio,
          requiereCambioDetalle: saved.requiereCambioDetalle ?? prev.requiereCambioDetalle,
          observaciones: saved.observaciones ?? prev.observaciones,
          elaboro: (saved.firmas?.elaboro) ? saved.firmas.elaboro : prev.elaboro,
          reviso: (saved.firmas?.reviso) ? saved.firmas.reviso : prev.reviso,
          estado: saved.estado || prev.estado || (estadoToSet || prev.estado)
        }));

        if (fileUploaderRef.current?.setInitialFiles) {
          try { fileUploaderRef.current.setInitialFiles(finalEvid); } catch (_) {}
        }

        setErrors({});
        if (estadoToSet === "completado") {
          alert("Validación finalizada correctamente.");
        } else {
          alert("Validación actualizada correctamente.");
        }
      } else {
        alert("Validación enviada (no se obtuvo documento actualizado del servidor).");
      }
    } catch (err) {
      console.error("saveValidation error:", err);
      alert("Error al guardar. Revisa la consola del servidor.");
    } finally {
      setLoading(false);
    }
  };

  // submit normal (guardar sin finalizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFinalizado) return;
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await saveValidation(); // sin estado => backend mantiene/actualiza el que corresponda
  };

  // finalizar (cambia estado a 'completado')
  const handleFinalize = async () => {
    if (isFinalizado) return;
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const ok = window.confirm("¿Deseas finalizar esta validación? Esto deshabilitará la edición.");
    if (!ok) return;
    await saveValidation("completado");
  };

  // helpers para firmas / nombres (bloqueamos acciones si finalizado)
  const openSignature = (role) => {
    if (isFinalizado) return;
    if (role === "reviso" && (!form.reviso || !form.reviso.nombre)) {
      setErrors(prev => ({ ...prev, reviso: "Seleccione quien revisó antes de firmar" }));
      return;
    }
    if (role === "elaboro") {
      if ((!form.elaboro || !form.elaboro.nombre || String(form.elaboro.nombre).trim() === "") && prefillElaboro) {
        const p = (typeof prefillElaboro === 'object') ? prefillElaboro : null;
        const nombre = p?.nombre || p?.Nombre || "";
        const cargo = p?.cargo || p?.Puesto || p?.puesto || "";
        const email = p?.email || p?.Correo || p?.correo || "";
        setForm(prev => ({
          ...prev,
          elaboro: {
            ...(prev.elaboro || { nombre: "", cargo: "", email: "", firma: "" }),
            nombre: prev.elaboro?.nombre || nombre,
            cargo: prev.elaboro?.cargo || cargo,
            email: prev.elaboro?.email || email
          }
        }));
      }
    }
    setSigRole(role);
  };

  const ensureDataUri = (s) => {
    if (!s) return "";
    if (s.startsWith("data:")) return s;
    return `data:image/png;base64,${s}`;
  };

  const handleSaveSignature = (roleFromPopup, dataURL) => {
    if (isFinalizado) return;
    const role = typeof dataURL === "string" ? roleFromPopup : sigRole;
    const raw = typeof dataURL === "string" ? dataURL : roleFromPopup;
    if (!role) return;
    const normalized = ensureDataUri(raw);

    setForm(prev => {
      const current = prev[role] || { nombre: "", cargo: "", email: "", firma: "" };
      let fallback = {};
      if (role === "elaboro" && prefillElaboro) {
        const p = prefillElaboro;
        fallback = {
          nombre: p?.nombre || p?.Nombre || current.nombre || "",
          cargo: p?.cargo || p?.Puesto || p?.puesto || current.cargo || "",
          email: p?.email || p?.Correo || p?.correo || current.email || ""
        };
      }
      const final = {
        ...current,
        nombre: (current.nombre && String(current.nombre).trim() !== "") ? current.nombre : (fallback.nombre || ""),
        cargo: (current.cargo && String(current.cargo).trim() !== "") ? current.cargo : (fallback.cargo || ""),
        email: (current.email && String(current.email).trim() !== "") ? current.email : (fallback.email || ""),
        firma: normalized || current.firma || ""
      };
      return { ...prev, [role]: final };
    });

    setSigRole(null);
  };

  const handleNameChangeForRole = (role, nv) => {
    if (isFinalizado) return;
    setForm(prev => {
      const next = { ...(prev[role] || {}) };
      if (!nv) {
        next.nombre = "";
        next.cargo = "";
        next.email = "";
      } else if (typeof nv === "string") {
        next.nombre = nv;
        if (role === "reviso") setRevisoSelectedFromList(false);
      } else {
        next.nombre = nv.Nombre || nv.nombre || "";
        next.cargo = nv.Puesto || nv.cargo || "";
        next.email = nv.Correo || nv.correo || nv.email || "";
        if (role === "reviso") setRevisoSelectedFromList(true);
      }
      return { ...prev, [role]: next };
    });
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[role === "reviso" ? "reviso" : "elaboro"];
      return copy;
    });
  };

  return (
    <form className="validacion-form" onSubmit={handleSubmit} noValidate>
      <div className="vf-header-row">
        <h2 className="vf-title">Validación de Cambios</h2>
        <div className="vf-meta">
          {validationId ? <span className="vf-badge">ID: {validationId.slice(0,8)}…</span> : <span className="vf-badge muted">Sin registro</span>}
          <span style={{ marginLeft: 8 }}>{isFinalizado ? <strong style={{ color: '#090' }}>Finalizado</strong> : <em style={{ color: '#666' }}>{form.estado}</em>}</span>
          {loading && <div className="vf-loading-inline">Cargando…</div>}
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="vf-alert" role="alert">
          Por favor corrige los campos indicados.
        </div>
      )}

      <section className="grid">
        <div className="field">
          <label htmlFor="etapaProceso">ETAPA/PROCESO DÓNDE SE REALIZA EL CAMBIO<span className="required">*</span></label>
          <input id="etapaProceso" name="etapaProceso" value={form.etapaProceso} onChange={handleChange} placeholder="Ej. Producción - Línea 1" disabled={isFinalizado} />
          {errors.etapaProceso && <small className="field-error">{errors.etapaProceso}</small>}
        </div>

        <div className="field">
          <label htmlFor="puntoValidar">PUNTO A VALIDAR<span className="required">*</span></label>
          <input id="puntoValidar" name="puntoValidar" value={form.puntoValidar} onChange={handleChange} placeholder="Ej. Alimentador de materia prima" disabled={isFinalizado} />
          {errors.puntoValidar && <small className="field-error">{errors.puntoValidar}</small>}
        </div>

        <div className="field">
          <label htmlFor="fechaValidacion">FECHA DE VALIDACIÓN</label>
          <input id="fechaValidacion" type="date" name="fechaValidacion" value={form.fechaValidacion} onChange={handleChange} disabled={isFinalizado} />
          {errors.fechaValidacion && <small className="field-error">{errors.fechaValidacion}</small>}
        </div>

        <div className="field">
          <label htmlFor="peligro">PELIGRO</label>
          <input id="peligro" name="peligro" value={form.peligro} onChange={handleChange} placeholder="Ej. Contaminación, Caídas..." disabled={isFinalizado} />
        </div>

        <div className="field">
          <label htmlFor="medidaControl">MEDIDA DE CONTROL</label>
          <input id="medidaControl" name="medidaControl" value={form.medidaControl} onChange={handleChange} placeholder="Ej. Mantenimiento preventivo semanal" disabled={isFinalizado} />
        </div>

        <div className="field">
          <label htmlFor="parametrosValoresLimite">PARÁMETROS / VALORES / LÍMITE CRITICO</label>
          <input id="parametrosValoresLimite" name="parametrosValoresLimite" value={form.parametrosValoresLimite} onChange={handleChange} placeholder="Ej. Temperatura < 80°C" disabled={isFinalizado} />
        </div>
      </section>

      <h3 className="subsection">Indique el punto</h3>
      <p className="muted">¿Que se requiere  validar? Para demostrar que en la medida de control aplicada se obtenga evidencia de que al 
aplicarla se obtuvo resultados que demuestren que es capaz de controlar  eficazmente los peligros identificados. </p>

      <section className="grid grid-2 elementos-grid">
        <div className="field">
          <label>QUÉ VALIDAR </label>
          <textarea
            name="elementos.queValidar"
            value={form.elementos.queValidar}
            onChange={handleChange}
            rows={2}
            className="small-ta"
            placeholder="Detalle (breve)"
            readOnly={isFinalizado}
          />
        </div>

        <div className="field">
          <label>CÓMO VALIDARLO</label>
          <textarea
            name="elementos.comoValidarlo"
            value={form.elementos.comoValidarlo}
            onChange={handleChange}
            rows={2}
            className="small-ta"
            placeholder="Método / instrumento (breve)"
            readOnly={isFinalizado}
          />
        </div>

        <div className="field">
          <label>QUIÉN PARTICIPA</label>
          <textarea
            name="elementos.quienParticipa"
            value={form.elementos.quienParticipa}
            onChange={handleChange}
            rows={2}
            className="small-ta"
            placeholder="Nombres / roles (breve)"
            readOnly={isFinalizado}
          />
        </div>

        <div className="field">
          <label>CUÁNDO Y CUÁNTAS VECES SE REPETIRÍA</label>
          <textarea
            name="elementos.cuandoCuantasVeces"
            value={form.elementos.cuandoCuantasVeces}
            onChange={handleChange}
            rows={2}
            className="small-ta"
            placeholder="Ej. Diario, 3 veces"
            readOnly={isFinalizado}
          />
        </div>

        <div className="field">
          <label>CUÁL SERÍA EL RIESGO INICIAL CONSIDERADO</label>
          <textarea
            name="elementos.riesgoInicial"
            value={form.elementos.riesgoInicial}
            onChange={handleChange}
            rows={2}
            className="small-ta"
            placeholder="Alto / Medio / Bajo"
            readOnly={isFinalizado}
          />
        </div>

        <div className="field">
          <label>QUÉ ESPERAMOS COMO RESULTADO AL FINAL DE LA APLICACIÓN DE LA MEDIDA DE CONTROL </label>
          <textarea
            name="elementos.queEsperamosResultado"
            value={form.elementos.queEsperamosResultado}
            onChange={handleChange}
            rows={2}
            className="small-ta"
            placeholder="Qué debe lograrse (breve)"
            readOnly={isFinalizado}
          />
        </div>
      </section>

      <section className="full">
        <label>Desarrollo de la validación (detalle)</label>
      </section>
      <textarea name="desarrolloValidacion" style={{width:"98%"}} value={form.desarrolloValidacion} onChange={handleChange} rows={5} placeholder="Describe lo realizado, observaciones y hallazgos" readOnly={isFinalizado} />

      <section className="files-section full">
        <label>Subir evidencias (fotos, pdf...)</label>

        <div className="files-area">
          {!isFinalizado && (
          <div className="uploader-card">
            {!isFinalizado && (
              <FileUploader
                label="Seleccionar / Tomar foto"
                accept="image/*,application/pdf"
                folder="validaciones"
                showPreview={false}
                ref={fileUploaderRef}
                onUploaded={handleFileUpload}
              />
            )}

            <div className="uploader-controls">
              <div className="uploader-count">{uploadedFiles.length} archivos</div>
              <div className="uploader-actions">
                {!isFinalizado && (
                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={() => {
                      if (fileUploaderRef.current?.clear) fileUploaderRef.current.clear();
                      setUploadedFiles([]);
                    }}
                    title="Limpiar archivos locales"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
          )}

          <div className="files-summary files-grid">
            {uploadedFiles.length === 0 ? (
              <div className="empty-files">No hay evidencias cargadas.</div>
            ) : (
              uploadedFiles.map((f, i) => (
                <div className="file-card" key={(f.url || f.name || i) + i}>
                  {f.type && f.type.startsWith("image/") ? (
                    <img className="card-thumb" src={f.url} alt={f.name || "img"} onClick={() => window.open(f.url, "_blank")} />
                  ) : (
                    <div className="card-thumb file-icon">📎</div>
                  )}

                  <div className="card-body">
                    <div className="file-name" title={f.name || ""}>{f.name || `archivo-${i+1}`}</div>
                    <div className="file-meta">
                      <span className="file-type">{f.type || "archivo"}</span>
                      {f.size ? <span className="file-size"> · {Math.round(f.size/1024)} KB</span> : null}
                    </div>
                  </div>

                  <div className="file-actions">
                    <button type="button" className="btn secondary tiny" onClick={() => window.open(f.url, "_blank")} title="Ver">Ver</button>

                    <a className="btn secondary tiny" href={f.url} download={f.name || ""} title="Descargar">Descargar</a>

                    {!isFinalizado && (
                      <button type="button" className="file-remove" onClick={() => removeUploaded(i)} aria-label={`Eliminar ${f.name || i}`}>×</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section >
        <div className="field">
          <label>Resultados de la validación</label>
          <textarea name="resultadosValidacion" value={form.resultadosValidacion} onChange={handleChange} rows={3} placeholder="Resultados principales" readOnly={isFinalizado} />
        </div>

        <div className="field">
          <label>Medida de control inicial</label>
           <textarea name="medidaControlInicial" value={form.medidaControlInicial} onChange={handleChange} placeholder="Medida inicial aplicada" rows={3} readOnly={isFinalizado} />
        </div>
      </section>

      <section className="grid">
        <div className="field checkbox-field">
          <label>
            <input type="checkbox" name="requiereCambio" checked={form.requiereCambio} onChange={handleChange} disabled={isFinalizado} />
            <span> Requiere de algún cambio</span>
          </label>
        </div>

        {form.requiereCambio && (
          <div className="field">
            <label>Detalle del cambio requerido</label>
            <input name="requiereCambioDetalle" value={form.requiereCambioDetalle} onChange={handleChange} placeholder="Detalle del cambio" disabled={isFinalizado} />
          </div>
        )}
      </section>

      <section className="full">
        <label>Observaciones</label>
      </section>
      <textarea name="observaciones" style={{width:"98%"}} value={form.observaciones} onChange={handleChange} rows={3} placeholder="Comentarios adicionales" readOnly={isFinalizado} />

      {/* Firmas */}
      <section className="signatures-section" style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
        <h4>Firmas</h4>
        <p className="muted">Elaboró: (preferentemente el solicitante del cambio). Revisó: debe seleccionarse desde la lista y firmar.</p>

        <div className="signature-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* ELABORÓ */}
          <div className="field">
            <label>Elaboró</label>

            {isFinalizado ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600 }}>{form.elaboro.nombre || ""}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{form.elaboro.cargo || ""}</div>
              </div>
            ) : (

            <NameSearchAutocomplete
              value={form.elaboro.nombre || (prefillElaboro && (prefillElaboro.nombre || prefillElaboro.Nombre)) || ""}
              onChange={(nv) => handleNameChangeForRole("elaboro", nv)}
              placeholder="Buscar persona (Elaboró)"
              size="small"
              disabled={isFinalizado}
            />
            )}

            {/* oculto input para mantener valor en submit si tu backend lo espera */}
            <input type="hidden" name="elaboroNombre" value={form.elaboro.nombre || (prefillElaboro && (prefillElaboro.nombre || prefillElaboro.Nombre)) || ''} />

            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              {!isFinalizado && (
                <button type="button" className="btn secondary" onClick={() => openSignature("elaboro")}>
                  {form.elaboro.firma ? "Re-firmar" : "Firmar"}
                </button>
              )}

              {form.elaboro.firma && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={form.elaboro.firma} alt="Firma elaboró" style={{ height: 50, border: "1px solid #ddd", borderRadius: 4 }} />
                  <small className="muted">Firma capturada</small>
                </div>
              )}
            </div>
          </div>


          {/* REVISÓ */}
          <div className="field">
            <label>Revisó <span style={{ color: "#c00" }}>*</span></label>

            {isFinalizado ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600 }}>{form.reviso.nombre || ""}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{form.reviso.cargo || ""}</div>
              </div>
            ) : (
              <NameSearchAutocomplete
                value={form.reviso.nombre || ""}
                onChange={(nv) => handleNameChangeForRole("reviso", nv)}
                placeholder="Buscar persona (Revisó) — obligatorio"
                size="small"
              />
            )}

            {errors.reviso && <small className="field-error">{errors.reviso}</small>}

            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              {!isFinalizado && (
                <button type="button" className="btn secondary" onClick={() => openSignature("reviso")}>
                  {form.reviso.firma ? "Re-firmar" : "Firmar"}
                </button>
              )}

              {form.reviso.firma && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={form.reviso.firma} alt="Firma revisó" style={{ height: 50, border: "1px solid #ddd", borderRadius: 4 }} />
                  <small className="muted">Firma capturada</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <SignaturePopup
        open={!!sigRole}
        role={sigRole}
        onSave={(maybeRole, maybeDataUrl) => {
          const roleFromPopup = (typeof maybeDataUrl === "string") ? maybeRole : sigRole;
          const dataUrl = (typeof maybeDataUrl === "string") ? maybeDataUrl : maybeRole;
          handleSaveSignature(roleFromPopup, dataUrl);
        }}
        onClose={() => setSigRole(null)}
      />

      {/* botones: ocultos cuando finalizado */}
      {!isFinalizado && (
        <div className="actions" style={{ marginTop: 16 }}>
          <button type="submit" className="btn primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Validación"}</button>

          <button type="button" className="btn danger" onClick={handleFinalize} disabled={loading} style={{ marginLeft: 8 }}>
            {loading ? "Procesando..." : "Finalizar Validación"}
          </button>

          <button type="button" className="btn secondary" onClick={() => { setForm(initial); setUploadedFiles([]); setErrors({}); if (fileUploaderRef.current?.clear) fileUploaderRef.current.clear(); }} style={{ marginLeft: 8 }}>
            Limpiar
          </button>
        </div>
      )}
    </form>
  );
};
