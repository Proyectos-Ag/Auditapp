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

// GET /api/objetivos?area=INGENIERIA
const obtenerObjetivos = async (req, res) => {
  try {
    const { area } = req.query;
    const query = area ? { area } : {};
    let objetivos = await Objetivo.find(query);
    
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
    res.status(500).json({ error: "Error al obtener objetivos" });
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

module.exports = {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea,
  reprogramarFechaCompromiso,
  actualizarAccionCorrectiva,
  migrarTodosLosObjetivos
};