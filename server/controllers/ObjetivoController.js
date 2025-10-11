const Objetivo = require("../models/ObjetivoModel");
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config(); // Asegúrate de cargar las variables de entorno

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Usar 'Gmail' directamente
  auth: {
    user: process.env.EMAIL_USERNAME, // Usar EMAIL_USERNAME
    pass: process.env.EMAIL_PASSWORD // Usar EMAIL_PASSWORD
  }
});

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

          // Sumar 1 día a la fecha compromiso
          const fechaLimiteMasUnDia = new Date(fechaLimite);
          fechaLimiteMasUnDia.setDate(fechaLimiteMasUnDia.getDate() + 1);

          // Formatear la fecha manualmente
          const dia = fechaLimiteMasUnDia.getDate();
          const mes = fechaLimiteMasUnDia.getMonth() + 1; // Los meses van de 0 a 11
          const año = fechaLimiteMasUnDia.getFullYear();
          const fechaFormateada = `${dia}/${mes}/${año}`; // Formato: día/mes/año

          await transporter.sendMail({
            from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
            bcc: recipientEmails,
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

// PUT /api/objetivos/acciones/:id
const actualizarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el objetivo que contiene la acción correctiva
    const objetivo = await Objetivo.findOne({ 'accionesCorrectivas._id': id });
    
    if (!objetivo) {
      return res.status(404).json({ error: "Acción no encontrada" });
    }

    // Encontrar la acción específica
    const accion = objetivo.accionesCorrectivas.id(id);
    if (!accion) {
      return res.status(404).json({ error: "Acción no encontrada" });
    }

    // Actualizar los campos de la acción
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

// GET /api/objetivos?area=INGENIERIA
const obtenerObjetivos = async (req, res) => {
  try {
    const { area } = req.query;
    const query = area ? { area } : {};
    const objetivos = await Objetivo.find(query);
    res.json(objetivos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos" });
  }
};

const reprogramarFechaCompromiso = async (req, res) => {
  try {
    const objetivo = await Objetivo.findOne({ 'accionesCorrectivas._id': req.params.id });
    if (!objetivo) return res.status(404).send("Acción no encontrada");

    const accion = objetivo.accionesCorrectivas.id(req.params.id);
    accion.historialFechas.push(accion.fichaCompromiso); // Guardar fecha anterior
    accion.fichaCompromiso = req.body.nuevaFecha; // Actualizar con nueva fecha

    await objetivo.save();
    res.json(accion);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// POST /api/objetivos
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

// PUT /api/objetivos/:id
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

// DELETE /api/objetivos/:id
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

// POST /api/objetivos/:id/acciones-correctivas
const agregarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID recibido en el backend:", id); // Depuración

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

    // Buscar todos los objetivos del área indicada
    const objetivos = await Objetivo.find({ area });

    // Reunir todas las acciones correctivas
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

module.exports = {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea,
  reprogramarFechaCompromiso,
  actualizarAccionCorrectiva
};