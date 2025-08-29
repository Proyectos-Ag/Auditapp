import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./css/ValidacionForm.css";
import FileUploader from "../../components/fileUploader/FileUploader";

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
  observaciones: ""
};

function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function ValidacionForm({ cambioId }) {
  const [form, setForm] = useState(initial);
  const [uploadedFiles, setUploadedFiles] = useState([]); // array de {url,name,type,...}
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileUploaderRef = useRef(null);
  const [validationId, setValidationId] = useState(null);

  useEffect(() => {
    if (!cambioId) return;
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        // Intentamos la ruta que propusimos en el backend: /api/validaciones/gestion/:gestionId
        // Si tu backend tiene otra ruta, ajusta esta URL.
        const base = process.env.REACT_APP_BACKEND_URL || "";
        const urlsToTry = [
          `${base}/api/validaciones/gestion/${cambioId}`,
          `${base}/api/validaciones/${cambioId}` // fallback
        ];

        let res = null;
        for (const u of urlsToTry) {
          try {
            res = await axios.get(u);
            if (res && res.data) break;
          } catch (err) {
            // si 404 o error, seguimos al siguiente
            res = null;
          }
        }

        if (!res || !res.data) {
          // no encontrado: dejamos estado inicial
          if (mounted) {
            setForm(initial);
            setUploadedFiles([]);
          }
          return;
        }

        // Si el endpoint devuelve un array (varios registros), tomamos el primero.
        const data = Array.isArray(res.data) ? (res.data[0] || {}) : res.data;

        setValidationId(res.data._id || data._id);

        console.log("Validación cargada:", data, res, res.data);

        if (mounted) {
          setForm({
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
            observaciones: data.observaciones || ""
          });

          const evidencias = data.evidencias || data.evidenciasValidacion || []; // por si tienes otro nombre
          setUploadedFiles(evidencias);

          // si tu FileUploader soporta pre-cargar archivos, llámalo
          if (fileUploaderRef.current?.setInitialFiles) {
            fileUploaderRef.current.setInitialFiles(evidencias);
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

  const handleChange = (e) => {
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
    setUploadedFiles(prev => {
      if (!fileObj || !fileObj.url) return prev;
      if (prev.some(p => p.url === fileObj.url)) return prev;
      return [...prev, fileObj];
    });
  };

  const removeUploaded = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!form.etapaProceso || !form.etapaProceso.trim()) e.etapaProceso = "Requerido";
    if (!form.puntoValidar || !form.puntoValidar.trim()) e.puntoValidar = "Requerido";
    if (form.fechaValidacion && isNaN(new Date(form.fechaValidacion).getTime())) e.fechaValidacion = "Fecha inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  try {
    setLoading(true);

    // 1) subir staged files y obtener resultados directos
    let uploadResults = [];
    if (fileUploaderRef.current?.uploadAll) {
      try {
        uploadResults = await fileUploaderRef.current.uploadAll(); // devuelve los nuevos items subidos
      } catch (err) {
        console.warn("uploadAll falló:", err);
        uploadResults = [];
      }
    }

    // 2) obtener lista final de evidencias (preferir uploadResults)
    let evidenciasFromUploader = Array.isArray(uploadResults) && uploadResults.length > 0
      ? uploadResults
      : (fileUploaderRef.current?.getUploadedFiles ? fileUploaderRef.current.getUploadedFiles() : uploadedFiles || []);

    // 3) Normalizar para enviar al backend (solo objetos con url)
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

    console.log("EVIDENCIAS a enviar:", evidenciasPayload);

    // 4) Armar payload (incluye evidenciasPayload aunque existing.evidencias esté vacío)
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
      evidencias: evidenciasPayload
    };

    // 5) PUT (tu id debe existir)
    const base = process.env.REACT_APP_BACKEND_URL || "";
    const res = await axios.put(`${base}/api/validaciones/${validationId}`, payload, {
      headers: { "Content-Type": "application/json" }
    });

    // 6) sincronizar UI con lo que devolvió el servidor (res.data)
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
        observaciones: saved.observaciones ?? prev.observaciones
      }));

      // sincronizar uploader si tiene API para precargar
      if (fileUploaderRef.current?.setInitialFiles) {
        try { fileUploaderRef.current.setInitialFiles(finalEvid); } catch (_) {}
      }

      setErrors({});
      alert("Validación actualizada correctamente.");
    } else {
      alert("Validación enviada (no se obtuvo documento actualizado del servidor).");
    }

  } catch (err) {
    console.error("handleSubmit error:", err);
    alert("Error al guardar. Revisa la consola del servidor.");
  } finally {
    setLoading(false);
  }
};


return (
  <form className="validacion-form" onSubmit={handleSubmit} noValidate>
    <div className="vf-header-row">
      <h2 className="vf-title">Validación de Cambios</h2>
      <div className="vf-meta">
        {validationId ? <span className="vf-badge">ID: {validationId.slice(0,8)}…</span> : <span className="vf-badge muted">Sin registro</span>}
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
        <label htmlFor="etapaProceso">Etapa / Proceso <span className="required">*</span></label>
        <input id="etapaProceso" name="etapaProceso" value={form.etapaProceso} onChange={handleChange} placeholder="Ej. Producción - Línea 1" />
        {errors.etapaProceso && <small className="field-error">{errors.etapaProceso}</small>}
      </div>

      <div className="field">
        <label htmlFor="puntoValidar">Punto a validar <span className="required">*</span></label>
        <input id="puntoValidar" name="puntoValidar" value={form.puntoValidar} onChange={handleChange} placeholder="Ej. Alimentador de materia prima" />
        {errors.puntoValidar && <small className="field-error">{errors.puntoValidar}</small>}
      </div>

      <div className="field">
        <label htmlFor="fechaValidacion">Fecha de validación</label>
        <input id="fechaValidacion" type="date" name="fechaValidacion" value={form.fechaValidacion} onChange={handleChange} />
        {errors.fechaValidacion && <small className="field-error">{errors.fechaValidacion}</small>}
      </div>

      <div className="field">
        <label htmlFor="peligro">Peligro</label>
        <input id="peligro" name="peligro" value={form.peligro} onChange={handleChange} placeholder="Ej. Contaminación, Caídas..." />
      </div>

      <div className="field">
        <label htmlFor="medidaControl">Medida de control</label>
        <input id="medidaControl" name="medidaControl" value={form.medidaControl} onChange={handleChange} placeholder="Ej. Mantenimiento preventivo semanal" />
      </div>

      <div className="field">
        <label htmlFor="parametrosValoresLimite">Parámetros / Valores / Límite crítico</label>
        <input id="parametrosValoresLimite" name="parametrosValoresLimite" value={form.parametrosValoresLimite} onChange={handleChange} placeholder="Ej. Temperatura < 80°C" />
      </div>
    </section>

    <h3 className="subsection">Indique el punto</h3>
    <p className="muted">Describe qué validar y cómo para demostrar que la medida de control funciona.</p>

    <section className="grid grid-2 elementos-grid">
      <div className="field">
        <label>Qué validar</label>
        <textarea
          name="elementos.queValidar"
          value={form.elementos.queValidar}
          onChange={handleChange}
          rows={2}
          className="small-ta"
          placeholder="Detalle (breve)"
        />
      </div>

      <div className="field">
        <label>Cómo validarlo</label>
        <textarea
          name="elementos.comoValidarlo"
          value={form.elementos.comoValidarlo}
          onChange={handleChange}
          rows={2}
          className="small-ta"
          placeholder="Método / instrumento (breve)"
        />
      </div>

      <div className="field">
        <label>Quién participa</label>
        <textarea
          name="elementos.quienParticipa"
          value={form.elementos.quienParticipa}
          onChange={handleChange}
          rows={2}
          className="small-ta"
          placeholder="Nombres / roles (breve)"
        />
      </div>

      <div className="field">
        <label>Cuándo y cuántas veces</label>
        <textarea
          name="elementos.cuandoCuantasVeces"
          value={form.elementos.cuandoCuantasVeces}
          onChange={handleChange}
          rows={2}
          className="small-ta"
          placeholder="Ej. Diario, 3 veces"
        />
      </div>

      <div className="field">
        <label>Riesgo inicial</label>
        <textarea
          name="elementos.riesgoInicial"
          value={form.elementos.riesgoInicial}
          onChange={handleChange}
          rows={2}
          className="small-ta"
          placeholder="Alto / Medio / Bajo"
        />
      </div>

      <div className="field">
        <label>Resultado esperado</label>
        <textarea
          name="elementos.queEsperamosResultado"
          value={form.elementos.queEsperamosResultado}
          onChange={handleChange}
          rows={2}
          className="small-ta"
          placeholder="Qué debe lograrse (breve)"
        />
      </div>
    </section>

    <section className="full">
      <label>Desarrollo de la validación (detalle)</label>
    </section>
    <textarea name="desarrolloValidacion" style={{width:"98%"}} value={form.desarrolloValidacion} onChange={handleChange} rows={5} placeholder="Describe lo realizado, observaciones y hallazgos" />

    <section className="files-section full">
      <label>Subir evidencias (fotos, pdf...)</label>

      <div className="files-area">
        <div className="uploader-card">
          <FileUploader
            label="Seleccionar / Tomar foto"
            accept="image/*,application/pdf"
            folder="validaciones"
            showPreview={false}
            ref={fileUploaderRef}
            onUploaded={handleFileUpload}
          />

          <div className="uploader-controls">
            <div className="uploader-count">{uploadedFiles.length} archivos</div>
            <div className="uploader-actions">
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
            </div>
          </div>
        </div>

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

                  <button type="button" className="file-remove" onClick={() => removeUploaded(i)} aria-label={`Eliminar ${f.name || i}`}>×</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>

    <section className="grid">
      <div className="field">
        <label>Resultados de la validación</label>
        <textarea name="resultadosValidacion" value={form.resultadosValidacion} onChange={handleChange} rows={3} placeholder="Resultados principales" />
      </div>

      <div className="field">
        <label>Medida de control inicial</label>
        <input name="medidaControlInicial" value={form.medidaControlInicial} onChange={handleChange} placeholder="Medida inicial aplicada" />
      </div>
    </section>

    <section className="grid">
      <div className="field checkbox-field">
        <label>
          <input type="checkbox" name="requiereCambio" checked={form.requiereCambio} onChange={handleChange} />
          <span> Requiere de algún cambio</span>
        </label>
      </div>

      {form.requiereCambio && (
        <div className="field">
          <label>Detalle del cambio requerido</label>
          <input name="requiereCambioDetalle" value={form.requiereCambioDetalle} onChange={handleChange} placeholder="Detalle del cambio" />
        </div>
      )}
    </section>

    <section className="full">
      <label>Observaciones</label>
    </section>
    <textarea name="observaciones" style={{width:"98%"}} value={form.observaciones} onChange={handleChange} rows={3} placeholder="Comentarios adicionales" />

    <div className="actions">
      <button type="submit" className="btn primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Validación"}</button>
      <button type="button" className="btn secondary" onClick={() => { setForm(initial); setUploadedFiles([]); setErrors({}); if (fileUploaderRef.current?.clear) fileUploaderRef.current.clear(); }}>Limpiar</button>
    </div>
  </form>
);
}