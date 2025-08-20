const GestionCambio = require('../models/gestionSchema');

/**
 * Helper: asegura que cada card tenga un id (string) para poder identificarla en front/back
 */
const ensureCardIds = (cards) => {
  if (!Array.isArray(cards)) return [];
  return cards.map(card => {
    const copy = { ...card };
    if (!copy.id) copy.id = String(Date.now()) + Math.floor(Math.random() * 1000);
    // normalizar boolean strings (si front envía "true"/"false")
    if (copy.involucradosSelected && typeof copy.involucradosSelected === 'string') {
      try { copy.involucradosSelected = JSON.parse(copy.involucradosSelected); }
      catch (e) { copy.involucradosSelected = [copy.involucradosSelected]; }
    }
    return copy;
  });
};

// Crear un nuevo registro de gestión de cambio
const crearGestionCambio = async (req, res) => {
  try {
    const formData = req.body || {};

    // normalizar firmadoPor
if (formData.firmadoPor) {
  const fp = formData.firmadoPor;

  // aprobado puede llegar como string JSON -> parsearlo
  if (fp.aprobado && typeof fp.aprobado === 'string') {
    try { fp.aprobado = JSON.parse(fp.aprobado); }
    catch (e) { fp.aprobado = [fp.aprobado]; }
  }

  // asegurar que aprobado sea array de objetos {nombre,cargo}
  fp.aprobado = Array.isArray(fp.aprobado) ? fp.aprobado.map(a => ({ nombre: (a && a.nombre) ? String(a.nombre) : '', cargo: (a && a.cargo) ? String(a.cargo) : '' })) : [];

  // asegurarnos de que evaluado/implementado/validado existan como objetos simples {nombre,cargo}
  ['evaluado','implementado','validado'].forEach(k => {
    if (!fp[k] || typeof fp[k] !== 'object') fp[k] = { nombre: '', cargo: '' };
    else fp[k] = { nombre: fp[k].nombre ? String(fp[k].nombre) : '', cargo: fp[k].cargo ? String(fp[k].cargo) : '' };
  });

  // solicitante: mantener firma si llega
  if (!fp.solicitado || typeof fp.solicitado !== 'object') fp.solicitado = { nombre: '', cargo: '', firma: '' };
  else fp.solicitado = {
    nombre: fp.solicitado.nombre ? String(fp.solicitado.nombre) : '',
    cargo:  fp.solicitado.cargo ? String(fp.solicitado.cargo) : '',
    firma:  fp.solicitado.firma ? String(fp.solicitado.firma) : ''
  };

  formData.firmadoPor = fp; // o datosActualizados.firmadoPor = fp si estás en actualizarGestionCambio
}


    // Normalizar arrays / objetos si vienen como strings
    if (formData.riesgosCards) formData.riesgosCards = ensureCardIds(formData.riesgosCards);
    if (formData.impactosSeleccionados && typeof formData.impactosSeleccionados === 'string') {
      try { formData.impactosSeleccionados = JSON.parse(formData.impactosSeleccionados); }
      catch (e) { formData.impactosSeleccionados = [formData.impactosSeleccionados]; }
    }

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

    const gestion = await GestionCambio.findById(id);
    if (!gestion) return res.status(404).json({ error: 'Registro no encontrado' });

    // Normalizar firmadoPor
    if (!gestion.firmadoPor) gestion.firmadoPor = {};
    const fp = gestion.firmadoPor;

    if (role === 'aprobado') {
      fp.aprobado = Array.isArray(fp.aprobado) ? fp.aprobado : (fp.aprobado ? [fp.aprobado] : []);
      const idx = fp.aprobado.findIndex(a =>
        a && (
          (a.email && a.email.toLowerCase() === (email || '').toLowerCase()) ||
          (a.nombre && a.nombre.toLowerCase() === (nombre || '').toLowerCase())
        )
      );
      const newEntry = { nombre: nombre || '', cargo: cargo || '', email, firma: dataURL, fechaFirma: new Date() };
      if (idx >= 0) fp.aprobado[idx] = { ...fp.aprobado[idx], ...newEntry };
      else fp.aprobado.push(newEntry);
    } else {
      if (!fp[role] || typeof fp[role] !== 'object') fp[role] = {};
      fp[role].nombre = nombre || fp[role].nombre || '';
      fp[role].cargo = cargo || fp[role].cargo || '';
      fp[role].email = email;
      fp[role].firma = dataURL;
      fp[role].fechaFirma = new Date();
    }

    gestion.firmadoPor = fp;
    await gestion.save();

    // -> RESPONDER con VISTA FILTRADA para el usuario que firmó
    const gestionDoc = gestion.toObject();
    const firmadoPorFiltered = buildFirmadoPorFiltered(gestionDoc, email, nombre);

    return res.status(200).json({
      ...gestionDoc,
      firmadoPor: firmadoPorFiltered
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

    // normalizar firmadoPor
if (datosActualizados.firmadoPor) {
  const fp = datosActualizados.firmadoPor;

  // aprobado puede llegar como string JSON -> parsearlo
  if (fp.aprobado && typeof fp.aprobado === 'string') {
    try { fp.aprobado = JSON.parse(fp.aprobado); }
    catch (e) { fp.aprobado = [fp.aprobado]; }
  }

  // asegurar que aprobado sea array de objetos {nombre,cargo}
  fp.aprobado = Array.isArray(fp.aprobado) ? fp.aprobado.map(a => ({ nombre: (a && a.nombre) ? String(a.nombre) : '', cargo: (a && a.cargo) ? String(a.cargo) : '' })) : [];

  // asegurarnos de que evaluado/implementado/validado existan como objetos simples {nombre,cargo}
  ['evaluado','implementado','validado'].forEach(k => {
    if (!fp[k] || typeof fp[k] !== 'object') fp[k] = { nombre: '', cargo: '' };
    else fp[k] = { nombre: fp[k].nombre ? String(fp[k].nombre) : '', cargo: fp[k].cargo ? String(fp[k].cargo) : '' };
  });

  // solicitante: mantener firma si llega
  if (!fp.solicitado || typeof fp.solicitado !== 'object') fp.solicitado = { nombre: '', cargo: '', firma: '' };
  else fp.solicitado = {
    nombre: fp.solicitado.nombre ? String(fp.solicitado.nombre) : '',
    cargo:  fp.solicitado.cargo ? String(fp.solicitado.cargo) : '',
    firma:  fp.solicitado.firma ? String(fp.solicitado.firma) : ''
  };

  datosActualizados.firmadoPor = fp; // o datosActualizados.firmadoPor = fp si estás en actualizarGestionCambio
}


    // Si vienen riesgosCards, asegurar ids
    if (datosActualizados.riesgosCards) {
      datosActualizados.riesgosCards = ensureCardIds(datosActualizados.riesgosCards);
    }

    // Si impactosSeleccionados viene como string JSON, parsear
    if (datosActualizados.impactosSeleccionados && typeof datosActualizados.impactosSeleccionados === 'string') {
      try { datosActualizados.impactosSeleccionados = JSON.parse(datosActualizados.impactosSeleccionados); }
      catch (e) { datosActualizados.impactosSeleccionados = [datosActualizados.impactosSeleccionados]; }
    }

    // Actualizamos el documento. findByIdAndUpdate reemplazará los arrays si se envían.
    const gestionActualizada = await GestionCambio.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!gestionActualizada) return res.status(404).json({ error: 'Registro no encontrado' });

    res.status(200).json(gestionActualizada);
  } catch (error) {
    console.error('Error al actualizar:', error);
    // enviar mensaje del validador si aplica
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

// GET /api/gestion-cambio/resumen
const obtenerResumenGestiones = async (req, res) => {
  try {
    // paginado / sorting opcionales
    const limit = parseInt(req.query.limit, 10) || 0;
    const skip = parseInt(req.query.skip, 10) || 0;
    const sortDir = req.query.sort === 'asc' ? 1 : -1;

    // estado puede venir como ?estado=pendiente,enviado o repeated params
    const filtro = {};
    if (req.query.estado) {
      let estados = req.query.estado;
      if (Array.isArray(estados)) estados = estados.flatMap(s => String(s).split(','));
      else estados = String(estados).split(',');
      estados = estados.map(s => s.trim()).filter(Boolean);
      if (estados.length) filtro.estado = { $in: estados };
    }

    // obtener info del usuario (puede venir por query o por req.user si autenticas con middleware)
    const tipoUsuarioRaw = (req.query.tipoUsuario || (req.user && req.user.TipoUsuario) || req.query.tipo || '').toString().toLowerCase().trim();
    const userNameRaw = (req.query.userName || req.query.nombre || (req.user && (req.user.nombre || req.user.Nombre)) || '').toString().trim();

    // helper para escapar regex
    const escapeRegExp = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // si no es administrador aplicar filtro por nombre del usuario
    if (tipoUsuarioRaw !== 'administrador') {
      // si no nos pasan el nombre del usuario, devolvemos 400 o cero resultados (elección de tu app)
      if (!userNameRaw) {
        return res.status(400).json({ error: 'Se requiere userName para usuarios no administradores' });
      }

      const escaped = escapeRegExp(userNameRaw);
      const regex = new RegExp(escaped, 'i'); // case-insensitive, match parcial

      // campos a buscar (PersonaSchema y SolicitanteFirmaSchema)
      const orConditions = [
        { 'firmadoPor.solicitado.nombre': { $regex: regex } },
        { 'firmadoPor.evaluado.nombre': { $regex: regex } },
        { 'firmadoPor.implementado.nombre': { $regex: regex } },
        { 'firmadoPor.validado.nombre': { $regex: regex } },
        { 'firmadoPor.aprobado.nombre': { $regex: regex } }, // busca en array aprobado.nombre
        { 'solicitante': { $regex: regex } } // en caso uses solicitante como string top-level
      ];

      // unir con filtro existente (estado)
      filtro.$or = orConditions;
    }

    // Proyección: solo campos requeridos en el resumen
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



const enviarGestionCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const gestion = await GestionCambio.findById(id);
    if (!gestion) return res.status(404).json({ error: 'Registro no encontrado' });

    // Validaciones (mismas reglas que front)
    const faltantes = [];

    // Sección 1
    if (!gestion.solicitante) faltantes.push('solicitante');
    if (!gestion.areaSolicitante) faltantes.push('areaSolicitante');
    if (!gestion.lugar) faltantes.push('lugar');
    if (!gestion.fechaSolicitud) faltantes.push('fechaSolicitud');
    if (!gestion.fechaPlaneada) faltantes.push('fechaPlaneada');

    // Sección 2
    if (!gestion.tipoCambio) faltantes.push('tipoCambio');

    // Sección 3: al menos una causa booleana o causa.otros
    const causasBool = ['solicitudCliente','reparacionDefecto','accionPreventiva','actualizacionDocumento','accionCorrectiva'];
    const algunaCausaBool = causasBool.some(k => !!(gestion.causa && gestion.causa[k]));
    const causaOtros = gestion.causa && gestion.causa.otros && gestion.causa.otros.trim() !== '';
    if (!algunaCausaBool && !causaOtros) faltantes.push('causa (al menos una)');

    // Sección 4
    if (!gestion.descripcionPropuesta) faltantes.push('descripcionPropuesta');

    // Sección 5
    if (!gestion.justificacion) faltantes.push('justificacion');

    // Sección 6: implicaciones boolean o implicaciones.otros
    const implicBool = ['riesgos','recursos','documentacion'];
    const algunaImpBool = implicBool.some(k => !!(gestion.implicaciones && gestion.implicaciones[k]));
    const impOtros = gestion.implicaciones && gestion.implicaciones.otros && gestion.implicaciones.otros.trim() !== '';
    if (!algunaImpBool && !impOtros) faltantes.push('implicaciones (al menos una)');

    // Sección 7
    if (!gestion.consecuencias) faltantes.push('consecuencias');

    // (Opcional) Sección 8 no estricta

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
};

//Helper
// helpers (encápsular lógica de filtrado)
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

/**
 * Construye el firmadoPor filtrado para devolver al cliente.
 * - muestra firma base64 solo si pertenece al usuario (match por email/nombre)
 * - para los demás devuelve nombre/cargo/hasFirma (no base64)
 */
function buildFirmadoPorFiltered(doc, userEmailRaw = '', userNameRaw = '') {
  const userEmail = normalize(userEmailRaw);
  const userNameQuery = normalize(userNameRaw);

  const fp = (doc && doc.firmadoPor) ? doc.firmadoPor : {};
  const aprobado = Array.isArray(fp.aprobado) ? fp.aprobado : (fp.aprobado ? [fp.aprobado] : []);

  // aprobadores
  let aprobadoSelf = null;
  const otros = [];
  aprobado.forEach(a => {
    if (!a) return;
    const aEmail = a.email || a.correo || '';
    const aNombre = a.nombre || '';
    const aHasFirma = !!a.firma;
    if (matchesUser(aNombre, aEmail, userEmail, userNameQuery)) {
      aprobadoSelf = { ...a }; // signer match -> conserva firma si existe
    } else {
      otros.push({ nombre: a.nombre || '', cargo: a.cargo || '', hasFirma: aHasFirma });
    }
  });

  // roles únicos
  const solicitadoObj = fp.solicitado || {};
  const evaluadoObj = fp.evaluado || {};
  const implementadoObj = fp.implementado || {};
  const validadoObj = fp.validado || {};

  const solicitadoIsSelf = matchesUser(solicitadoObj.nombre, solicitadoObj.email || solicitadoObj.correo, userEmail, userNameQuery);
  const evaluadoIsSelf   = matchesUser(evaluadoObj.nombre, evaluadoObj.email || evaluadoObj.correo, userEmail, userNameQuery);
  const implementadoIsSelf = matchesUser(implementadoObj.nombre, implementadoObj.email || implementadoObj.correo, userEmail, userNameQuery);
  const validadoIsSelf   = matchesUser(validadoObj.nombre, validadoObj.email || validadoObj.correo, userEmail, userNameQuery);

  const solicitadoHasFirma = !!(solicitadoObj && solicitadoObj.firma);
  const evaluadoHasFirma = !!(evaluadoObj && evaluadoObj.firma);
  const implementadoHasFirma = !!(implementadoObj && implementadoObj.firma);
  const validadoHasFirma = !!(validadoObj && validadoObj.firma);

  const solicitadoReturn = {
    nombre: solicitadoObj.nombre || '',
    cargo: solicitadoObj.cargo || '',
    hasFirma: solicitadoHasFirma,
    ...(solicitadoIsSelf ? { firma: solicitadoObj.firma || null } : {})
  };
  const evaluadoReturn = {
    nombre: evaluadoObj.nombre || '',
    cargo: evaluadoObj.cargo || '',
    hasFirma: evaluadoHasFirma,
    ...(evaluadoIsSelf ? { firma: evaluadoObj.firma || null } : {})
  };
  const implementadoReturn = {
    nombre: implementadoObj.nombre || '',
    cargo: implementadoObj.cargo || '',
    hasFirma: implementadoHasFirma,
    ...(implementadoIsSelf ? { firma: implementadoObj.firma || null } : {})
  };
  const validadoReturn = {
    nombre: validadoObj.nombre || '',
    cargo: validadoObj.cargo || '',
    hasFirma: validadoHasFirma,
    ...(validadoIsSelf ? { firma: validadoObj.firma || null } : {})
  };

  return {
    solicitado: solicitadoReturn,
    evaluado: evaluadoReturn,
    implementado: implementadoReturn,
    validado: validadoReturn,

    aprobadoSelf: aprobadoSelf ? {
      nombre: aprobadoSelf.nombre || '',
      cargo: aprobadoSelf.cargo || '',
      hasFirma: !!aprobadoSelf.firma,
      ...(aprobadoSelf.firma ? { firma: aprobadoSelf.firma } : {})
    } : null,

    otrosAprobadoresCount: otros.length,
    otrosAprobadoresResumen: otros.slice(0, 50),

    canSignSolicitado: solicitadoIsSelf && !solicitadoHasFirma,
    canSignEvaluado: evaluadoIsSelf && !evaluadoHasFirma,
    canSignImplementado: implementadoIsSelf && !implementadoHasFirma,
    canSignValidado: validadoIsSelf && !validadoHasFirma,
    canSignAprobador: !!aprobadoSelf && !(aprobadoSelf.firma)
  };
}

module.exports = {
  crearGestionCambio,
  obtenerGestionCambios,
  obtenerGestionPorId,
  actualizarGestionCambio,
  eliminarGestionCambio,
  obtenerResumenGestiones,
  enviarGestionCambio,
  signGestionCambio
};