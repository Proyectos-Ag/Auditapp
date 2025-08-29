const GestionCambio = require('../models/gestionSchema');
const ValidacionCambio = require("../models/ValidacionCambio");

const ensureCardIds = (cards) => {
  if (!Array.isArray(cards)) return [];
  return cards.map(card => {
    const copy = { ...card };

    // id
    if (!copy.id) {
      copy.id = String(Date.now()) + Math.floor(Math.random() * 1000);
    } else {
      copy.id = String(copy.id);
    }

    // involucradosSelected puede venir como string "['SOCIOS']" o como CSV
    if (copy.involucradosSelected && typeof copy.involucradosSelected === 'string') {
      try { copy.involucradosSelected = JSON.parse(copy.involucradosSelected); }
      catch (e) {
        // intentar separar por comas
        copy.involucradosSelected = String(copy.involucradosSelected).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(copy.involucradosSelected)) copy.involucradosSelected = [];

    // involucradosData: aseguramos estructura mínima
    copy.involucradosData = copy.involucradosData || {};
    ['SOCIOS','PROVEEDORES','AUTORIDADES','CLIENTES','OTROS'].forEach(k => {
      if (!copy.involucradosData[k]) copy.involucradosData[k] = null;
    });

    // Normalizar fechas: si vienen como string, convertir a Date
    const maybeDate = (v) => {
      if (!v) return null;
      if (v instanceof Date && !isNaN(v)) return v;
      const d = new Date(v);
      return isNaN(d) ? null : d;
    };

    copy.fechaCompromiso = maybeDate(copy.fechaCompromiso);
    copy.fechaCompromisoDoc = maybeDate(copy.fechaCompromisoDoc);
    copy.fechaCompromisoRec = maybeDate(copy.fechaCompromisoRec);

    return copy;
  });
};

// --- helpers generales ---
function normalize(s) {
  return (s === null || s === undefined) ? '' : String(s).toLowerCase().trim();
}
function matchesUser(candidateName = '', candidateEmail = '', userEmail = '', userNameQuery = '') {
  const cName = normalize(candidateName);
  const cEmail = normalize(candidateEmail);
  if (userEmail && cEmail && cEmail === userEmail) return true;
  if (userNameQuery && cName && cName === userNameQuery) return true;
  if (userNameQuery && cName && (cName.includes(userNameQuery) || userNameQuery.includes(cName))) return true;
  return false;
}

// Normalizar firmadoPor entrante: asegurar arrays y tipos
function normalizeFirmadoPor(fp = {}) {
  const roles = ['solicitado','evaluado','aprobado','implementado','validado'];
  const out = {};
  roles.forEach(r => {
    let arr = fp[r];
    if (!arr) out[r] = [];
    else if (typeof arr === 'string') {
      try { arr = JSON.parse(arr); }
      catch (e) { arr = [arr]; }
      if (!Array.isArray(arr)) arr = [arr];
      out[r] = arr.map(a => normalizeFirmaObject(a));
    } else if (Array.isArray(arr)) {
      out[r] = arr.map(a => normalizeFirmaObject(a));
    } else if (typeof arr === 'object') {
      // single object -> wrap in array
      out[r] = [normalizeFirmaObject(arr)];
    } else {
      out[r] = [];
    }
  });
  return out;
}

function normalizeFirmaObject(a) {
  if (!a || typeof a !== 'object') return { nombre: '', cargo: '', firma: '', email: '', fechaFirma: null };
  return {
    nombre: a.nombre ? String(a.nombre) : '',
    cargo: a.cargo ? String(a.cargo) : '',
    firma: a.firma ? String(a.firma) : '',
    email: a.email ? String(a.email) : (a.correo ? String(a.correo) : ''),
    fechaFirma: a.fechaFirma ? new Date(a.fechaFirma) : (a.fecha ? new Date(a.fecha) : null)
  };
}

// Construye la vista filtrada de firmadoPor (sin otrosAprobadoresResumen/Count)
function buildFirmadoPorFiltered(doc, userEmailRaw = '', userNameRaw = '') {
  const userEmail = normalize(userEmailRaw);
  const userNameQuery = normalize(userNameRaw);
  const fp = (doc && doc.firmadoPor) ? doc.firmadoPor : {};

  const roles = ['solicitado','evaluado','aprobado','implementado','validado'];
  const result = {};

  roles.forEach(role => {
    const arr = Array.isArray(fp[role]) ? fp[role] : (fp[role] ? [fp[role]] : []);
    let self = null;
    const others = [];

    arr.forEach(a => {
      if (!a) return;
      const aEmail = a.email || a.correo || '';
      const aNombre = a.nombre || '';
      const aHasFirma = !!a.firma;
      if (matchesUser(aNombre, aEmail, userEmail, userNameQuery)) {
        self = { ...a }; // keep full if it's the user
      } else {
        others.push({ nombre: a.nombre || '', cargo: a.cargo || '', hasFirma: aHasFirma });
      }
    });

    result[role] = {
      self: self ? {
        nombre: self.nombre || '',
        cargo: self.cargo || '',
        hasFirma: !!self.firma,
        ...(self.email ? { email: self.email } : {}),
        ...(self.firma ? { firma: self.firma } : {}),
        fechaFirma: self.fechaFirma || null
      } : null,
      others,
      canSign: !!self ? !(self.firma) : false
    };
  });

  return result;
}

// ----------------- CONTROLLERS -----------------

// Crear un nuevo registro de gestión de cambio
const crearGestionCambio = async (req, res) => {
  try {
    const formData = req.body || {};

    // normalizar firmadoPor si viene
    if (formData.firmadoPor) {
      formData.firmadoPor = normalizeFirmadoPor(formData.firmadoPor);
    }

    // Normalizar arrays / objetos si vienen como strings
    if (formData.riesgosCards) formData.riesgosCards = ensureCardIds(formData.riesgosCards);
    else formData.riesgosCards = [];

    if (formData.impactosSeleccionados && typeof formData.impactosSeleccionados === 'string') {
      try { formData.impactosSeleccionados = JSON.parse(formData.impactosSeleccionados); }
      catch (e) { formData.impactosSeleccionados = [formData.impactosSeleccionados]; }
    }

    // Normalizar fechas de root si vienen como strings
    if (formData.fechaSolicitud) formData.fechaSolicitud = new Date(formData.fechaSolicitud);
    if (formData.fechaPlaneada) formData.fechaPlaneada = new Date(formData.fechaPlaneada);

    const nuevaGestion = new GestionCambio(formData);
    await nuevaGestion.save();
    res.status(201).json(nuevaGestion);
  } catch (error) {
    console.error('Error al crear el registro:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

// Obtener todos los registros de gestión de cambios
const obtenerGestionCambios = async (req, res) => {
  try {
    const gestiones = await GestionCambio.find().sort({ fechaCreacion: -1 });
    res.status(200).json(gestiones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/gestion-cambio/:id
const obtenerGestionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = (req.query.userEmail || req.query.email || '').toString().trim();
    const userNameQuery = (req.query.userName || req.query.nombre || '').toString().trim();

    const gestion = await GestionCambio.findById(id);
    if (!gestion) return res.status(404).json({ error: 'Registro no encontrado' });

    const doc = gestion.toObject();
    const firmadoPorFiltered = buildFirmadoPorFiltered(doc, userEmail, userNameQuery);

    console.log('firmadoPorFiltered', firmadoPorFiltered);

    return res.status(200).json({
      ...doc,
      firmadoPor: firmadoPorFiltered
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const signGestionCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, email, nombre, cargo, dataURL } = req.body || {};
    if (!role || !email || !dataURL) {
      return res.status(400).json({ error: 'Falta role, email o dataURL' });
    }

    const allowedRoles = ['solicitado','evaluado','aprobado','implementado','validado'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Role inválido' });

    const gestion = await GestionCambio.findById(id);
    if (!gestion) return res.status(404).json({ error: 'Registro no encontrado' });

    if (!gestion.firmadoPor) gestion.firmadoPor = {};
    // asegurar arrays / normalizar
    gestion.firmadoPor = Object.assign({}, gestion.firmadoPor, normalizeFirmadoPor(gestion.firmadoPor));

    const arr = Array.isArray(gestion.firmadoPor[role]) ? gestion.firmadoPor[role] : [];

    // buscar por email o nombre (case-insensitive)
    const idx = arr.findIndex(a => {
      if (!a) return false;
      const aEmail = (a.email || a.correo || '').toString().toLowerCase();
      const aNombre = (a.nombre || '').toString().toLowerCase();
      const targetEmail = (email || '').toString().toLowerCase();
      const targetNombre = (nombre || '').toString().toLowerCase();
      return (aEmail && targetEmail && aEmail === targetEmail) || (aNombre && targetNombre && aNombre === targetNombre);
    });

    const newEntry = {
      nombre: nombre || '',
      cargo: cargo || '',
      email,
      firma: dataURL,
      fechaFirma: new Date()
    };

    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...newEntry };
    } else {
      arr.push(newEntry);
    }

    gestion.firmadoPor[role] = arr;
    await gestion.save();

    // --- nueva lógica: si todas las etapas tienen al menos una firma, marcar aprobado y crear ValidacionCambio ---
    const requiredRoles = ['solicitado','evaluado','aprobado','implementado','validado'];
    const allSigned = requiredRoles.every(r => {
      const rArr = Array.isArray(gestion.firmadoPor[r]) ? gestion.firmadoPor[r] : [];
      // requiere que exista al menos un elemento y que TODOS los elementos tengan firma no vacía
      if (rArr.length === 0) return false;
      return rArr.every(a => a && a.firma && String(a.firma).trim() !== '');
    });

    let createdValidacion = null;
    if (allSigned && gestion.estado !== 'aprobado') {
      gestion.estado = 'aprobado';
      await gestion.save();

      // evitar duplicados: si ya existe una validación para esta gestión no crear otra
      const existingValidacion = await ValidacionCambio.findOne({ gestionId: gestion._id });
      if (!existingValidacion) {
        const validacionDoc = new ValidacionCambio({
          gestionId: gestion._id,
          fechaValidacion: new Date(),
          observaciones: 'Validación creada automáticamente al completarse todas las firmas',
          // si tienes req.user y quieres registrar quien creó la validación:
          creadoPor: (req.user && req.user._id) ? req.user._id : undefined
        });
        await validacionDoc.save();
        createdValidacion = validacionDoc;
      } else {
        createdValidacion = existingValidacion;
      }
    }

    // devolver vista filtrada para el que firmó
    const gestionDoc = gestion.toObject();
    const firmadoPorFiltered = buildFirmadoPorFiltered(gestionDoc, email, nombre);

    // incluir info de validación creada (si la hubo) en la respuesta
    return res.status(200).json({
      ...gestionDoc,
      firmadoPor: firmadoPorFiltered,
      validacionCreada: createdValidacion ? { _id: createdValidacion._id } : null
    });
  } catch (error) {
    console.error('Error al firmar:', error);
    return res.status(500).json({ error: 'Error interno al firmar' });
  }
};

// Actualizar un registro (PUT o PATCH)
const actualizarGestionCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body || {};

    // normalizar firmadoPor si viene
    if (datosActualizados.firmadoPor) {
      datosActualizados.firmadoPor = normalizeFirmadoPor(datosActualizados.firmadoPor);
    }

    // Si vienen riesgosCards, asegurar ids y normalizar fechas dentro
    if (datosActualizados.riesgosCards) {
      datosActualizados.riesgosCards = ensureCardIds(datosActualizados.riesgosCards);
    }

    // Si impactosSeleccionados viene como string JSON, parsear
    if (datosActualizados.impactosSeleccionados && typeof datosActualizados.impactosSeleccionados === 'string') {
      try { datosActualizados.impactosSeleccionados = JSON.parse(datosActualizados.impactosSeleccionados); }
      catch (e) { datosActualizados.impactosSeleccionados = [datosActualizados.impactosSeleccionados]; }
    }

    // Normalizar fechas de root si vienen como strings
    if (datosActualizados.fechaSolicitud) datosActualizados.fechaSolicitud = new Date(datosActualizados.fechaSolicitud);
    if (datosActualizados.fechaPlaneada) datosActualizados.fechaPlaneada = new Date(datosActualizados.fechaPlaneada);

    const gestionActualizada = await GestionCambio.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!gestionActualizada) return res.status(404).json({ error: 'Registro no encontrado' });

    res.status(200).json(gestionActualizada);
  } catch (error) {
    console.error('Error al actualizar:', error);
    const message = error && error.message ? error.message : 'Error interno del servidor';
    res.status(500).json({ error: 'Error interno del servidor', details: message });
  }
};


// Eliminar un registro
const eliminarGestionCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const gestionEliminada = await GestionCambio.findByIdAndDelete(id);
    if (!gestionEliminada) return res.status(404).json({ error: 'Registro no encontrado' });
    res.status(200).json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener resumen (sin cambios importantes; consulta sobre firmadoPor.aprobado.nombre sigue funcionando con arrays)
const obtenerResumenGestiones = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 0;
    const skip = parseInt(req.query.skip, 10) || 0;
    const sortDir = req.query.sort === 'asc' ? 1 : -1;

    const filtro = {};
    if (req.query.estado) {
      let estados = req.query.estado;
      if (Array.isArray(estados)) estados = estados.flatMap(s => String(s).split(','));
      else estados = String(estados).split(',');
      estados = estados.map(s => s.trim()).filter(Boolean);
      if (estados.length) filtro.estado = { $in: estados };
    }

    const tipoUsuarioRaw = (req.query.tipoUsuario || (req.user && req.user.TipoUsuario) || req.query.tipo || '').toString().toLowerCase().trim();
    const userNameRaw = (req.query.userName || req.query.nombre || (req.user && (req.user.nombre || req.user.Nombre)) || '').toString().trim();

    const escapeRegExp = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (tipoUsuarioRaw !== 'administrador') {
      if (!userNameRaw) {
        return res.status(400).json({ error: 'Se requiere userName para usuarios no administradores' });
      }

      const escaped = escapeRegExp(userNameRaw);
      const regex = new RegExp(escaped, 'i');

      const orConditions = [
        { 'firmadoPor.solicitado.nombre': { $regex: regex } },
        { 'firmadoPor.evaluado.nombre': { $regex: regex } },
        { 'firmadoPor.implementado.nombre': { $regex: regex } },
        { 'firmadoPor.validado.nombre': { $regex: regex } },
        { 'firmadoPor.aprobado.nombre': { $regex: regex } },
        { 'solicitante': { $regex: regex } }
      ];

      filtro.$or = orConditions;
    }

    const gestiones = await GestionCambio.find(filtro)
      .select('_id solicitante liderProyecto fechaSolicitud estado')
      .sort({ fechaSolicitud: sortDir })
      .skip(skip)
      .limit(limit);

    return res.status(200).json(gestiones);
  } catch (error) {
    console.error('Error al obtener resumen de gestiones:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearGestionCambio,
  obtenerGestionCambios,
  obtenerGestionPorId,
  actualizarGestionCambio,
  eliminarGestionCambio,
  obtenerResumenGestiones,
  enviarGestionCambio: async (req, res) => { // reutilizo la función anterior 'enviarGestionCambio'
    try {
      const { id } = req.params;
      const gestion = await GestionCambio.findById(id);
      if (!gestion) return res.status(404).json({ error: 'Registro no encontrado' });

      const faltantes = [];
      if (!gestion.solicitante) faltantes.push('solicitante');
      if (!gestion.areaSolicitante) faltantes.push('areaSolicitante');
      if (!gestion.lugar) faltantes.push('lugar');
      if (!gestion.fechaSolicitud) faltantes.push('fechaSolicitud');
      if (!gestion.fechaPlaneada) faltantes.push('fechaPlaneada');
      if (!gestion.tipoCambio) faltantes.push('tipoCambio');

      const causasBool = ['solicitudCliente','reparacionDefecto','accionPreventiva','actualizacionDocumento','accionCorrectiva'];
      const algunaCausaBool = causasBool.some(k => !!(gestion.causa && gestion.causa[k]));
      const causaOtros = gestion.causa && gestion.causa.otros && gestion.causa.otros.trim() !== '';
      if (!algunaCausaBool && !causaOtros) faltantes.push('causa (al menos una)');

      if (!gestion.descripcionPropuesta) faltantes.push('descripcionPropuesta');
      if (!gestion.justificacion) faltantes.push('justificacion');

      const implicBool = ['riesgos','recursos','documentacion'];
      const algunaImpBool = implicBool.some(k => !!(gestion.implicaciones && gestion.implicaciones[k]));
      const impOtros = gestion.implicaciones && gestion.implicaciones.otros && gestion.implicaciones.otros.trim() !== '';
      if (!algunaImpBool && !impOtros) faltantes.push('implicaciones (al menos una)');

      if (!gestion.consecuencias) faltantes.push('consecuencias');

      if (faltantes.length > 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos para enviar la solicitud', faltantes });
      }

      gestion.estado = 'enviado';
      await gestion.save();
      res.status(200).json(gestion);
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  },
  signGestionCambio
};
