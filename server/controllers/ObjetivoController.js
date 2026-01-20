const Objetivo = require("../models/ObjetivoModel");
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// FUNCIÓN AUXILIAR: Migrar objetivo sin año
const migrarObjetivoSinAño = async (objetivo) => {
  const añoActual = new Date().getFullYear();
  
  // Si ya tiene año, no hacer nada
  if (objetivo.añoActual) {
    return objetivo;
  }
  
  console.log(`🔄 Migrando objetivo ${objetivo._id} sin año definido`);
  
  // Verificar si tiene datos
  const tieneDatos = verificarSiTieneDatos(objetivo);
  
  if (tieneDatos) {
    // Tiene datos del 2025, archivar y resetear
    console.log(`📦 Archivando datos de 2025`);
    
    if (!objetivo.historialAnual) {
      objetivo.historialAnual = [];
    }
    
    objetivo.historialAnual.push({
      año: 2025,
      indicadores: {
        indicadorENEABR: objetivo.indicadorENEABR,
        indicadorFEB: objetivo.indicadorFEB,
        indicadorMAR: objetivo.indicadorMAR,
        indicadorABR: objetivo.indicadorABR,
        indicadorMAYOAGO: objetivo.indicadorMAYOAGO,
        indicadorJUN: objetivo.indicadorJUN,
        indicadorJUL: objetivo.indicadorJUL,
        indicadorAGO: objetivo.indicadorAGO,
        indicadorSEPDIC: objetivo.indicadorSEPDIC,
        indicadorOCT: objetivo.indicadorOCT,
        indicadorNOV: objetivo.indicadorNOV,
        indicadorDIC: objetivo.indicadorDIC
      }
    });
    
    // Resetear indicadores
    const camposIndicadores = [
      'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
      'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
      'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
    ];
    
    camposIndicadores.forEach(campo => {
      objetivo[campo] = { S1: "", S2: "", S3: "", S4: "", S5: "" };
    });
  }
  
  // Establecer año actual
  objetivo.añoActual = añoActual;
  await objetivo.save();
  console.log(`✅ Objetivo migrado a año ${añoActual}`);
  
  return objetivo;
};

// Función para verificar si tiene datos
const verificarSiTieneDatos = (objetivo) => {
  const campos = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  for (const campo of campos) {
    if (objetivo[campo]) {
      const semanas = ['S1', 'S2', 'S3', 'S4', 'S5'];
      for (const semana of semanas) {
        if (objetivo[campo][semana] && objetivo[campo][semana] !== "") {
          return true;
        }
      }
    }
  }
  return false;
};

// Tarea programada para notificaciones
cron.schedule('0 8 * * *', async () => {
  try {
    console.log('Cron job ejecutándose...');
    const objetivos = await Objetivo.find({});
    const ahora = new Date();
    console.log('Fecha actual:', ahora);

    for (const objetivo of objetivos) {
      for (const accion of objetivo.accionesCorrectivas) {
        const fechaLimite = new Date(accion.fichaCompromiso);
        const diasRestantes = Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60 * 24));
        console.log('Días restantes:', diasRestantes);

        let urgencia = '';
        if (diasRestantes <= 1) urgencia = 'inmediata';
        else if (diasRestantes <= 3) urgencia = 'media';

        if (urgencia && (!accion.ultimaNotificacion || 
           (ahora - new Date(accion.ultimaNotificacion)) > 12 * 60 * 60 * 1000)) {
          console.log('Enviando notificación a:', accion.responsable.email);

          const fechaLimiteMasUnDia = new Date(fechaLimite);
          fechaLimiteMasUnDia.setDate(fechaLimiteMasUnDia.getDate() + 1);

          const dia = fechaLimiteMasUnDia.getDate();
          const mes = fechaLimiteMasUnDia.getMonth() + 1;
          const año = fechaLimiteMasUnDia.getFullYear();
          const fechaFormateada = `${dia}/${mes}/${año}`;

          await transporter.sendMail({
            from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
            to: accion.responsable.email,
            subject: `⏰ Alerta de Vencimiento (${urgencia.toUpperCase()})`,
            html: `<h2>Acción Correctiva Pendiente</h2>
                  <p><strong>Objetivo:</strong> ${accion.noObjetivo}</p>
                  <p><strong>Acción:</strong> ${accion.acciones}</p>
                  <p><strong>Fecha Límite:</strong> ${fechaFormateada}</p>
                  <p><strong>Días Restantes:</strong> ${diasRestantes}</p>`
          });

          accion.notificaciones.push({
            tipo: 'email',
            fecha: ahora,
            mensaje: `Alerta de ${urgencia} - ${diasRestantes} días restantes`,
            urgencia: urgencia
          });
          accion.ultimaNotificacion = ahora;
          await objetivo.save();
        }
      }
    }
  } catch (error) {
    console.error('Error en tarea programada:', error);
  }
});

// ✅ MODIFICADA: GET /api/objetivos?area=INGENIERIA - SOLO objetivos tradicionales
const obtenerObjetivos = async (req, res) => {
  try {
    const { area } = req.query;
    
    // ✅ FILTRAR: Solo objetivos tradicionales (NO multi-departamento)
    const query = area ? { 
      area: area,
      nombreObjetivoGeneral: { $exists: false } // Solo objetivos sin nombreObjetivoGeneral
    } : { nombreObjetivoGeneral: { $exists: false } };
    
    let objetivos = await Objetivo.find(query);
    
    console.log(`🔍 Buscando objetivos tradicionales para área: ${area}`);
    console.log(`📊 Resultados encontrados: ${objetivos.length} objetivos tradicionales`);
    
    // Migrar objetivos sin año automáticamente
    const objetivosMigrados = [];
    for (const objetivo of objetivos) {
      if (!objetivo.añoActual) {
        const objetivoMigrado = await migrarObjetivoSinAño(objetivo);
        objetivosMigrados.push(objetivoMigrado);
      } else {
        objetivosMigrados.push(objetivo);
      }
    }
    
    res.json(objetivosMigrados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos tradicionales" });
  }
};

// ✅ NUEVA: GET /api/objetivos/multi/area?area=PESADAS - Solo objetivos multi-departamento por área
const obtenerObjetivosMultiPorArea = async (req, res) => {
  try {
    const { area } = req.query;
    
    if (!area) {
      return res.status(400).json({ error: "El parámetro 'area' es requerido" });
    }
    
    console.log(`🔍 Buscando objetivos multi-departamento para área: ${area}`);
    
    // Buscar objetivos multi-departamento que tengan esta área en objetivosEspecificos
    const objetivosMulti = await Objetivo.find({
      "objetivosEspecificos.area": area,
      nombreObjetivoGeneral: { $exists: true } // Solo objetivos multi-departamento
    });
    
    console.log(`📊 Encontrados ${objetivosMulti.length} objetivos multi-departamento`);
    
    // Transformar para devolver solo los objetivos específicos del área
    const objetivosEspecificos = [];
    
    objetivosMulti.forEach(objetivoMulti => {
      const especificosParaArea = objetivoMulti.objetivosEspecificos.filter(
        obj => obj.area === area
      );
      
      especificosParaArea.forEach(especifico => {
        objetivosEspecificos.push({
          _id: objetivoMulti._id + '-' + especifico.area,
          area: especifico.area,
          objetivo: especifico.objetivo,
          recursos: especifico.recursos,
          metaFrecuencia: especifico.metaFrecuencia,
          indicadorENEABR: especifico.indicadorENEABR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorFEB: especifico.indicadorFEB || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorMAR: especifico.indicadorMAR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorABR: especifico.indicadorABR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorMAYOAGO: especifico.indicadorMAYOAGO || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorJUN: especifico.indicadorJUN || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorJUL: especifico.indicadorJUL || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorAGO: especifico.indicadorAGO || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorSEPDIC: especifico.indicadorSEPDIC || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorOCT: especifico.indicadorOCT || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorNOV: especifico.indicadorNOV || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorDIC: especifico.indicadorDIC || { S1: "", S2: "", S3: "", S4: "", S5: "" },
          observaciones: especifico.observaciones,
          esMultiDepartamento: true,
          objetivoGeneral: objetivoMulti.nombreObjetivoGeneral,
          objetivoIdMulti: objetivoMulti._id,
          departamento: especifico.departamento,
          accionesCorrectivas: especifico.accionesCorrectivas || [],
          historialAnual: especifico.historialAnual || []
        });
      });
    });
    
    console.log(`✅ Devolviendo ${objetivosEspecificos.length} objetivos específicos multi-departamento`);
    res.json(objetivosEspecificos);
  } catch (error) {
    console.error('Error al obtener objetivos multi por área:', error);
    res.status(500).json({ error: "Error al obtener objetivos multi-departamento" });
  }
};

// Obtener un objetivo por ID
const obtenerObjetivoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const objetivo = await Objetivo.findById(id);
    
    if (!objetivo) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    
    res.json(objetivo);
  } catch (error) {
    console.error('❌ Error al obtener objetivo por ID:', error);
    res.status(500).json({ 
      error: "Error al obtener objetivo",
      details: error.message 
    });
  }
};

const actualizarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    const objetivo = await Objetivo.findOne({ 'accionesCorrectivas._id': id });
    
    if (!objetivo) {
      return res.status(404).json({ error: "Acción no encontrada" });
    }

    const accion = objetivo.accionesCorrectivas.id(id);
    if (!accion) {
      return res.status(404).json({ error: "Acción no encontrada" });
    }

    if (req.body.responsable) {
      accion.responsable = req.body.responsable;
    }
    if (req.body.efectividad) {
      accion.efectividad = req.body.efectividad;
    }
    if (req.body.observaciones !== undefined) {
      accion.observaciones = req.body.observaciones;
    }
    if (req.body.acciones !== undefined) {
      accion.acciones = req.body.acciones;
    }

    await objetivo.save();
    res.json(accion);
  } catch (error) {
    console.error("Error al actualizar acción:", error);
    res.status(500).json({ error: "Error al actualizar acción correctiva" });
  }
};

const reprogramarFechaCompromiso = async (req, res) => {
  try {
    const objetivo = await Objetivo.findOne({ 'accionesCorrectivas._id': req.params.id });
    if (!objetivo) return res.status(404).send("Acción no encontrada");

    const accion = objetivo.accionesCorrectivas.id(req.params.id);
    accion.historialFechas.push(accion.fichaCompromiso);
    accion.fichaCompromiso = req.body.nuevaFecha;

    await objetivo.save();
    res.json(accion);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const crearObjetivo = async (req, res) => {
  try {
    const nuevoObjetivo = new Objetivo(req.body);
    const saved = await nuevoObjetivo.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear objetivo" });
  }
};

const actualizarObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Objetivo.findByIdAndUpdate(id, req.body, { new: true });
    if (!actualizado) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar objetivo" });
  }
};

const eliminarObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Objetivo.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    res.json({ message: "Objetivo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar objetivo" });
  }
};

const agregarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID recibido en el backend:", id);

    const accionCorrectiva = req.body;
    const objetivo = await Objetivo.findById(id);

    if (!objetivo) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }

    objetivo.accionesCorrectivas.push(accionCorrectiva);
    const saved = await objetivo.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar acción correctiva" });
  }
};

const getAccionesCorrectivasByArea = async (req, res) => {
  try {
    const { area } = req.query;
    console.log('Area: ', area);
    if (!area) {
      return res.status(400).json({ error: "El parámetro 'area' es obligatorio." });
    }

    const objetivos = await Objetivo.find({ area });

    let acciones = [];
    objetivos.forEach((objetivo) => {
      if (objetivo.accionesCorrectivas && objetivo.accionesCorrectivas.length > 0) {
        const accionesEnriquecidas = objetivo.accionesCorrectivas.map((accion) => ({
          ...accion.toObject(),
          idObjetivo: objetivo._id,
        }));
        acciones = acciones.concat(accionesEnriquecidas);
      }
    });

    res.status(200).json(acciones);
  } catch (error) {
    console.error("Error en getAccionesCorrectivasByArea:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// NUEVA FUNCIÓN: Migrar todos los objetivos manualmente
const migrarTodosLosObjetivos = async (req, res) => {
  try {
    const objetivos = await Objetivo.find({});
    let migrados = 0;
    
    for (const objetivo of objetivos) {
      if (!objetivo.añoActual) {
        await migrarObjetivoSinAño(objetivo);
        migrados++;
      }
    }
    
    res.json({ 
      message: `Migración completada. ${migrados} objetivos actualizados.`,
      total: objetivos.length,
      migrados: migrados
    });
  } catch (error) {
    console.error('Error en migración:', error);
    res.status(500).json({ error: "Error al migrar objetivos" });
  }
};

const crearObjetivoMultiDepartamento = async (req, res) => {
  try {
    const { nombreObjetivoGeneral, departamentosAsignados, objetivosEspecificos, usuario } = req.body;
    
    // ✅ Log para debugging
    console.log('📥 Datos recibidos en backend:');
    console.log('nombreObjetivoGeneral:', nombreObjetivoGeneral);
    console.log('departamentosAsignados:', departamentosAsignados);
    console.log('objetivosEspecificos:', JSON.stringify(objetivosEspecificos, null, 2));
    
    // Validar datos requeridos
    if (!nombreObjetivoGeneral || !departamentosAsignados || departamentosAsignados.length === 0) {
      return res.status(400).json({ 
        error: "Nombre del objetivo y departamentos asignados son requeridos" 
      });
    }
    
    // ✅ Validar que cada objetivo específico tenga el campo 'area'
    if (objetivosEspecificos && objetivosEspecificos.length > 0) {
      for (const objEsp of objetivosEspecificos) {
        if (!objEsp.area) {
          console.error('❌ Objetivo específico sin área:', objEsp);
          return res.status(400).json({ 
            error: `El objetivo para el departamento "${objEsp.departamento}" no tiene área asignada` 
          });
        }
        if (!objEsp.departamento) {
          console.error('❌ Objetivo específico sin departamento:', objEsp);
          return res.status(400).json({ 
            error: "Todos los objetivos específicos deben tener departamento asignado" 
          });
        }
        if (!objEsp.objetivo) {
          console.error('❌ Objetivo específico sin descripción:', objEsp);
          return res.status(400).json({ 
            error: `El objetivo para "${objEsp.area}" del departamento "${objEsp.departamento}" está vacío` 
          });
        }
      }
    }
    
    // Crear el objetivo principal
    const nuevoObjetivo = new Objetivo({
      nombreObjetivoGeneral,
      departamentosAsignados,
      objetivosEspecificos: objetivosEspecificos || [],
      creadoPor: {
        usuarioId: usuario?.id,
        nombre: usuario?.nombre || "Sistema",
        fecha: new Date()
      },
      añoActual: new Date().getFullYear(),
      activo: true
    });
    
    const saved = await nuevoObjetivo.save();
    
    // ✅ Log del documento guardado
    console.log('✅ Objetivo guardado exitosamente:');
    console.log('ID:', saved._id);
    console.log('Objetivos específicos guardados:', saved.objetivosEspecificos.length);
    saved.objetivosEspecificos.forEach((obj, index) => {
      console.log(`  ${index + 1}. Depto: ${obj.departamento}, Área: ${obj.area}`);
    });
    
    res.status(201).json(saved);
  } catch (error) {
    console.error('❌ Error al crear objetivo multi-departamento:', error);
    res.status(500).json({ 
      error: "Error al crear objetivo",
      details: error.message 
    });
  }
};

// Función para obtener objetivos por departamento (mantiene compatibilidad)
const obtenerObjetivosPorDepartamento = async (req, res) => {
  try {
    const { departamento } = req.query;
    
    if (!departamento) {
      return res.status(400).json({ error: "El parámetro 'departamento' es requerido" });
    }
    
    // Buscar objetivos donde el departamento esté en la lista de departamentos asignados
    const objetivos = await Objetivo.find({ 
      departamentosAsignados: departamento,
      activo: true 
    });
    
    // Transformar los datos para mantener compatibilidad con el frontend existente
    const objetivosTransformados = [];
    
    objetivos.forEach(objetivoGeneral => {
      const objetivoEspecifico = objetivoGeneral.objetivosEspecificos.find(
        obj => obj.departamento === departamento
      );
      
      if (objetivoEspecifico) {
        objetivosTransformados.push({
          _id: objetivoGeneral._id,
          area: departamento,
          objetivo: objetivoEspecifico.objetivo,
          recursos: objetivoEspecifico.recursos,
          metaFrecuencia: objetivoEspecifico.metaFrecuencia,
          añoActual: objetivoGeneral.añoActual,
          indicadorENEABR: objetivoEspecifico.indicadorENEABR,
          indicadorFEB: objetivoEspecifico.indicadorFEB,
          indicadorMAR: objetivoEspecifico.indicadorMAR,
          indicadorABR: objetivoEspecifico.indicadorABR,
          indicadorMAYOAGO: objetivoEspecifico.indicadorMAYOAGO,
          indicadorJUN: objetivoEspecifico.indicadorJUN,
          indicadorJUL: objetivoEspecifico.indicadorJUL,
          indicadorAGO: objetivoEspecifico.indicadorAGO,
          indicadorSEPDIC: objetivoEspecifico.indicadorSEPDIC,
          indicadorOCT: objetivoEspecifico.indicadorOCT,
          indicadorNOV: objetivoEspecifico.indicadorNOV,
          indicadorDIC: objetivoEspecifico.indicadorDIC,
          observaciones: objetivoEspecifico.observaciones,
          accionesCorrectivas: objetivoEspecifico.accionesCorrectivas,
          historialAnual: objetivoEspecifico.historialAnual
        });
      }
    });
    
    res.json(objetivosTransformados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos" });
  }
};

const obtenerObjetivosPorArea = async (req, res) => {
  try {
    const { area } = req.params;
    
    if (!area) {
      return res.status(400).json({ error: "El parámetro 'area' es requerido" });
    }
    
    // Buscar objetivos donde el área esté en los departamentos asignados
    // o en los objetivos específicos
    const objetivos = await Objetivo.find({
      $or: [
        { departamentosAsignados: { $in: [area] } },
        { "objetivosEspecificos.area": area },
        { area: area } // Para compatibilidad con objetivos antiguos
      ],
      activo: true
    });
    
    res.json(objetivos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos" });
  }
};

// Actualizar objetivo específico de multi-departamento
const actualizarObjetivoEspecifico = async (req, res) => {
  try {
    const { objetivoId } = req.params;
    const { objetivoEspecificoId, objetivo, recursos, metaFrecuencia, observaciones } = req.body;
    
    console.log('📝 Actualizando objetivo específico:', { objetivoId, objetivoEspecificoId });
    
    const objetivoMulti = await Objetivo.findById(objetivoId);
    
    if (!objetivoMulti) {
      return res.status(404).json({ error: "Objetivo multi-departamento no encontrado" });
    }
    
    // Buscar el objetivo específico
    const objetivoEspecifico = objetivoMulti.objetivosEspecificos.find(
      obj => obj._id.toString() === objetivoEspecificoId
    );
    
    if (!objetivoEspecifico) {
      return res.status(404).json({ error: "Objetivo específico no encontrado" });
    }
    
    // Actualizar campos
    if (objetivo !== undefined) objetivoEspecifico.objetivo = objetivo;
    if (recursos !== undefined) objetivoEspecifico.recursos = recursos;
    if (metaFrecuencia !== undefined) objetivoEspecifico.metaFrecuencia = metaFrecuencia;
    if (observaciones !== undefined) objetivoEspecifico.observaciones = observaciones;
    
    await objetivoMulti.save();
    
    res.json({
      success: true,
      message: "Objetivo específico actualizado correctamente",
      objetivoEspecifico
    });
  } catch (error) {
    console.error('❌ Error al actualizar objetivo específico:', error);
    res.status(500).json({ 
      error: "Error al actualizar objetivo específico",
      details: error.message 
    });
  }
};

// Actualizar indicador de objetivo específico
const actualizarIndicadorObjetivoEspecifico = async (req, res) => {
  try {
    const { objetivoId } = req.params;
    const { area, campo, valores } = req.body;
    
    console.log('📝 Actualizando indicador:', { objetivoId, area, campo });
    
    const objetivoMulti = await Objetivo.findById(objetivoId);
    
    if (!objetivoMulti) {
      return res.status(404).json({ error: "Objetivo multi-departamento no encontrado" });
    }
    
    // Buscar el objetivo específico por área
    const objetivoEspecifico = objetivoMulti.objetivosEspecificos.find(
      obj => obj.area === area
    );
    
    if (!objetivoEspecifico) {
      return res.status(404).json({ error: `Objetivo específico para el área ${area} no encontrado` });
    }
    
    // Validar que el campo sea un indicador válido
    const indicadoresValidos = [
      'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
      'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
      'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
    ];
    
    if (!indicadoresValidos.includes(campo)) {
      return res.status(400).json({ error: "Campo de indicador no válido" });
    }
    
    // Actualizar el indicador
    objetivoEspecifico[campo] = valores;
    
    await objetivoMulti.save();
    
    res.json({
      success: true,
      message: "Indicador actualizado correctamente",
      objetivoEspecifico
    });
  } catch (error) {
    console.error('❌ Error al actualizar indicador:', error);
    res.status(500).json({ 
      error: "Error al actualizar indicador",
      details: error.message 
    });
  }
};

module.exports = {
  obtenerObjetivos,
  obtenerObjetivoPorId,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  obtenerObjetivosPorArea,
  getAccionesCorrectivasByArea,
  crearObjetivoMultiDepartamento,
  obtenerObjetivosPorDepartamento,
  reprogramarFechaCompromiso,
  actualizarAccionCorrectiva,
  migrarTodosLosObjetivos,
  actualizarObjetivoEspecifico,
  actualizarIndicadorObjetivoEspecifico,
  obtenerObjetivosMultiPorArea // ✅ Nueva función exportada
};