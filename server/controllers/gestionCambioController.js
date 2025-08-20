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

// Obtener un registro por ID
const obtenerGestionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const gestion = await GestionCambio.findById(id);
    if (!gestion) return res.status(404).json({ error: 'Registro no encontrado' });
    res.status(200).json(gestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

const obtenerResumenGestiones = async (req, res) => {
  try {
    // opcionales: limit, skip, sort
    const limit = parseInt(req.query.limit, 10) || 0; // 0 => sin límite
    const skip = parseInt(req.query.skip, 10) || 0;
    const sortDir = req.query.sort === 'asc' ? 1 : -1; // por fechaSolicitud

    // filtro base
    const filtro = {};

    // estado puede llegar como: ?estado=pendiente  ó ?estado=pendiente,enviado ó ?estado=pendiente&estado=enviado
    if (req.query.estado) {
      let estados = req.query.estado;
      // si es array (multiple params) o string con comas -> normalizar a array de strings
      if (Array.isArray(estados)) {
        estados = estados.flatMap(s => String(s).split(','));
      } else {
        estados = String(estados).split(',');
      }
      estados = estados.map(s => s.trim()).filter(Boolean);
      if (estados.length > 0) filtro.estado = { $in: estados };
    }

    // Proyección: solo campos requeridos (+ estado para mostrar en la lista)
    const gestiones = await GestionCambio.find(filtro)
      .select('_id solicitante liderProyecto fechaSolicitud estado')
      .sort({ fechaSolicitud: sortDir })
      .skip(skip)
      .limit(limit);

    res.status(200).json(gestiones);
  } catch (error) {
    console.error('Error al obtener resumen de gestiones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

module.exports = {
  crearGestionCambio,
  obtenerGestionCambios,
  obtenerGestionPorId,
  actualizarGestionCambio,
  eliminarGestionCambio,
  obtenerResumenGestiones,
  enviarGestionCambio
};
