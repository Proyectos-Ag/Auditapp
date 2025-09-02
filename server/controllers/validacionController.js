const { estimatedDocumentCount } = require("../models/usuarioSchema");
const ValidacionCambio = require("../models/ValidacionCambio");

// Normaliza el objeto firmas recibido (acepta string JSON o objeto)
function normalizeFirmas(bodyFirmas) {
  if (!bodyFirmas) return { elaboro: { nombre:"", cargo:"", email:"", firma:"" }, reviso: { nombre:"", cargo:"", email:"", firma:"" } };
  if (typeof bodyFirmas === "string") {
    try { bodyFirmas = JSON.parse(bodyFirmas); } catch(e) { return normalizeFirmas(null); }
  }
  const f = bodyFirmas || {};
  const normal = {
    elaboro: {
      nombre: (f.elaboro && (f.elaboro.nombre || f.elaboro.Nombre)) || "",
      cargo: (f.elaboro && (f.elaboro.cargo || f.elaboro.Puesto)) || "",
      email: (f.elaboro && (f.elaboro.email || f.elaboro.Correo)) || "",
      firma: (f.elaboro && f.elaboro.firma) || ""
    },
    reviso: {
      nombre: (f.reviso && (f.reviso.nombre || f.reviso.Nombre)) || "",
      cargo: (f.reviso && (f.reviso.cargo || f.reviso.Puesto)) || "",
      email: (f.reviso && (f.reviso.email || f.reviso.Correo)) || "",
      firma: (f.reviso && f.reviso.firma) || ""
    }
  };
  return normal;
}

function normalizeEvidencias(bodyEvidencias) {
  const out = [];
  if (!bodyEvidencias) return out;

  // Si viene como string JSON (poco probable si frontend envía JSON),
  // intentar parsearlo:
  if (typeof bodyEvidencias === "string") {
    try {
      const parsed = JSON.parse(bodyEvidencias);
      return normalizeEvidencias(parsed);
    } catch (e) {
      // string simple -> tratar como URL única
      return [{ url: bodyEvidencias, name: null, type: null, size: null, provider: null, uploadedAt: new Date() }];
    }
  }

  if (!Array.isArray(bodyEvidencias)) {
    // si es un objeto único
    const obj = bodyEvidencias;
    const url = obj && (obj.url || obj.path || obj.link);
    if (url) {
      out.push({
        url,
        name: obj.name || null,
        type: obj.type || null,
        size: obj.size ?? null,
        provider: obj.provider || "remote",
        uploadedAt: obj.uploadedAt ? new Date(obj.uploadedAt) : new Date()
      });
    }
    return out;
  }

  // es array
  bodyEvidencias.forEach(item => {
    if (!item) return;
    if (typeof item === "string") {
      out.push({ url: item, name: null, type: null, size: null, provider: null, uploadedAt: new Date() });
      return;
    }
    // item es objeto
    const url = item.url || item.path || item.link;
    if (!url) return;
    out.push({
      url,
      name: item.name || null,
      type: item.type || null,
      size: item.size ?? null,
      provider: item.provider || "remote",
      uploadedAt: item.uploadedAt ? new Date(item.uploadedAt) : new Date()
    });
  });

  // eliminar duplicados por URL
  const seen = new Set();
  return out.filter(ev => {
    if (!ev || !ev.url) return false;
    if (seen.has(ev.url)) return false;
    seen.add(ev.url);
    return true;
  });
}

exports.createValidacion = async (req, res) => {
  try {
    // Asegúrate de que express.json() está activo para leer req.body
    const evidencias = normalizeEvidencias(req.body.evidencias);
    const firmas = normalizeFirmas(req.body.firmas);

    const elementos = req.body.elementos && typeof req.body.elementos === "string"
      ? JSON.parse(req.body.elementos)
      : (req.body.elementos || {});

    const doc = new ValidacionCambio({
      etapaProceso: req.body.etapaProceso || null,
      puntoValidar: req.body.puntoValidar || null,
      fechaValidacion: req.body.fechaValidacion ? new Date(req.body.fechaValidacion) : null,
      peligro: req.body.peligro || null,
      medidaControl: req.body.medidaControl || null,
      parametrosValoresLimite: req.body.parametrosValoresLimite || null,
      elementos,
      desarrolloValidacion: req.body.desarrolloValidacion || null,
      evidencias, // guardamos array de objetos
      resultadosValidacion: req.body.resultadosValidacion || null,
      medidaControlInicial: req.body.medidaControlInicial || null,
      requiereCambio: !!req.body.requiereCambio,
      requiereCambioDetalle: req.body.requiereCambioDetalle || null,
      observaciones: req.body.observaciones || null,
      firmas,
    });

    await doc.save();
    return res.status(201).json(doc);
  } catch (err) {
    console.error("createValidacion error:", err);
    return res.status(500).json({ message: "Error creando validación", error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const docs = await ValidacionCambio.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getByGestionId = async (req, res) => {
  try {
    const { gestionId } = req.params;
    
    // si esperas un solo registro:
    const doc = await ValidacionCambio.findOne({ gestionId });

    // si esperas varios registros:
    // const docs = await ValidacionCambio.find({ gestionId });

    if (!doc) return res.status(404).json({ message: "No encontrado" });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await ValidacionCambio.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "No encontrado" });

    const newEvidencias = normalizeEvidencias(req.body.evidencias);
    // concatenar (evitar duplicados)
    const combined = (existing.evidencias || []).concat(newEvidencias);
    // eliminar duplicados por url
    const seen = new Set();
    const finalEvid = combined.filter(ev => {
      if (!ev || !ev.url) return false;
      if (seen.has(ev.url)) return false;
      seen.add(ev.url);
      return true;
    });

        // Normalizar firmas recibidas (si vienen)
    const firmasPayload = (typeof req.body.firmas === "string")
      ? (() => { try { return JSON.parse(req.body.firmas); } catch(e){ return null; } })()
      : (req.body.firmas || null);

    // crear objeto final de firmas haciendo merge conservador
    let finalFirmas = existing.firmas || { elaboro: { nombre:"", cargo:"", email:"", firma:"" }, reviso: { nombre:"", cargo:"", email:"", firma:"" } };
    if (firmasPayload) {
      finalFirmas = {
        elaboro: { ...(finalFirmas.elaboro || {}), ...(firmasPayload.elaboro || {}) },
        reviso: { ...(finalFirmas.reviso || {}), ...(firmasPayload.reviso || {}) }
      };
    }

    const elementos = req.body.elementos && typeof req.body.elementos === "string"
      ? JSON.parse(req.body.elementos)
      : (req.body.elementos ?? existing.elementos);

    existing.set({
      etapaProceso: req.body.etapaProceso ?? existing.etapaProceso,
      puntoValidar: req.body.puntoValidar ?? existing.puntoValidar,
      fechaValidacion: req.body.fechaValidacion ? new Date(req.body.fechaValidacion) : existing.fechaValidacion,
      peligro: req.body.peligro ?? existing.peligro,
      medidaControl: req.body.medidaControl ?? existing.medidaControl,
      parametrosValoresLimite: req.body.parametrosValoresLimite ?? existing.parametrosValoresLimite,
      elementos,
      desarrolloValidacion: req.body.desarrolloValidacion ?? existing.desarrolloValidacion,
      evidencias: finalEvid,
      firmas: finalFirmas,
      resultadosValidacion: req.body.resultadosValidacion ?? existing.resultadosValidacion,
      medidaControlInicial: req.body.medidaControlInicial ?? existing.medidaControlInicial,
      requiereCambio: typeof req.body.requiereCambio !== "undefined" ? !!req.body.requiereCambio : existing.requiereCambio,
      requiereCambioDetalle: req.body.requiereCambioDetalle ?? existing.requiereCambioDetalle,
      observaciones: req.body.observaciones ?? existing.observaciones,
      estado: req.body.estado || existing.estado
    });

    await existing.save();
    res.json(existing);
  } catch (err) {
    console.error("update error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const doc = await ValidacionCambio.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};