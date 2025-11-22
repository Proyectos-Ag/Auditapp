const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Ishikawa = require('../models/ishikawaSchema');
const transporter = require('../emailconfig');
const { dbConnect, mongoose } = require('../config/dbconfig');

// ========== Utils de conexión ==========
function dbReady() {
  return mongoose?.connection?.readyState === 1;
}
async function ensureDb() {
  if (!dbReady()) {
    try {
      await dbConnect();
    } catch (e) {

    }
  }
  return dbReady();
}

// ========== Cache (plantilla email) ==========
let emailTemplateCache = null;
function getEmailTemplate() {
  if (emailTemplateCache) return emailTemplateCache;
  const templatePath = path.join(__dirname, 'templates', 'notificacion-compromiso.html');
  emailTemplateCache = fs.readFileSync(templatePath, 'utf8');
  return emailTemplateCache;
}

// ========== Agregación ==========
/**
 * Obtiene actividades cuya última fechaCompromiso cae en targetDate,
 * que NO estén concluidas y que NO se hayan chequeado hoy (fechaCheck < hoy o inexistente).
 */
async function getTasksForDate(targetDate) {
  const hoy = moment().startOf('day').toDate();
  const startOfDay = moment(targetDate).startOf('day').toDate();
  const endOfDay   = moment(targetDate).endOf('day').toDate();

  // Asegura conexión antes de agregar (evita "aggregate() before initial connection")
  if (!(await ensureDb())) {
    console.warn('[cron-ish] DB no lista en getTasksForDate; retorno vacío');
    return [];
  }

  return Ishikawa.aggregate([
    { $unwind: '$actividades' },
    { $unwind: '$actividades.responsable' },
    {
      $project: {
        padreId: '$_id',
        actividadId: '$actividades._id',
        actividad: '$actividades.actividad',
        responsable: '$actividades.responsable', // { nombre, correo }
        fechaCheck: '$actividades.fechaCheck',
        fechaCompromisoArray: '$actividades.fechaCompromiso',
        lastFechaCompromiso: { $arrayElemAt: ['$actividades.fechaCompromiso', -1] },
        concluido: '$actividades.concluido'
      }
    },
    // No procesadas hoy
    {
      $match: {
        $or: [{ fechaCheck: { $exists: false } }, { fechaCheck: { $lt: hoy } }]
      }
    },
    // Debe existir fecha compromiso
    {
      $match: { lastFechaCompromiso: { $nin: ['', null] } }
    },
    // Parsear string -> Date en MX
    {
      $addFields: {
        lastFechaCompromisoDate: {
          $dateFromString: {
            dateString: '$lastFechaCompromiso',
            format: '%Y-%m-%d',
            timezone: 'America/Mexico_City',
            onError: null,
            onNull: null
          }
        }
      }
    },
    // En el rango del día objetivo y no concluido
    {
      $match: {
        lastFechaCompromisoDate: { $gte: startOfDay, $lte: endOfDay },
        concluido: { $ne: true }
      }
    }
  ])
  // Evita problemas si la colección es grande
  .allowDiskUse?.(true);
}

// ========== Envío / actualización ==========
async function procesarEnvio(doc, subject) {
  const { padreId, actividadId, actividad, responsable, lastFechaCompromiso } = doc;

  if (!responsable?.correo) {
    console.warn('[cron-ish] Actividad sin correo de responsable; salto:', actividad);
    return;
  }

  const tpl = getEmailTemplate()
    .replace('{{usuario}}', responsable.nombre || '')
    .replace('{{actividad}}', actividad || '')
    .replace('{{fechaCompromiso}}', lastFechaCompromiso || '');

  const mailOptions = {
    from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
    to: responsable.correo,
    subject,
    html: tpl,
    attachments: [
      {
        filename: 'logoAguida.png',
        path: path.join(__dirname, '../assets/logoAguida-min.png'),
        cid: 'logoAguida'
      }
    ]
  };

  try {
    // Si nodemailer es v6+, sendMail sin callback retorna Promise
    const info = await transporter.sendMail(mailOptions);
    console.log(`[cron-ish] Correo enviado a ${responsable.nombre} (${responsable.correo}): ${info.response}`);

    // Marca fechaCheck si el envío fue exitoso
    await Ishikawa.updateOne(
      { _id: padreId, 'actividades._id': actividadId },
      { $set: { 'actividades.$.fechaCheck': new Date() } }
    );
    console.log(`[cron-ish] fechaCheck actualizada: ${actividad}`);
  } catch (err) {
    console.error(`[cron-ish] Error enviando a ${responsable?.correo}:`, err?.message || err);
  }
}

// ========== Lógica de tarea ==========
async function ejecutarTarea() {
  console.log(`[cron-ish] Tick: ${new Date().toLocaleString('es-MX')}`);

  if (!(await ensureDb())) {
    console.warn('[cron-ish] DB no disponible; salto tick');
    return;
  }

  try {
    const tasksTomorrow  = await getTasksForDate(moment().add(1, 'day'));
    const tasksThreeDays = await getTasksForDate(moment().add(3, 'days'));

    console.log(`[cron-ish] Mañana: ${tasksTomorrow.length} | +3 días: ${tasksThreeDays.length}`);

    const trabajos = [
      ...tasksTomorrow.map(d => procesarEnvio(d, 'Recordatorio: Tu fecha de compromiso es mañana')),
      ...tasksThreeDays.map(d => procesarEnvio(d, 'Recordatorio: Faltan 3 días para tu fecha de compromiso'))
    ];

    // Ejecuta en paralelo pero captura errores por tarea
    await Promise.allSettled(trabajos);
  } catch (error) {
    console.error('[cron-ish] Error en la tarea programada:', error);
  }
}

// Ejecuta la tarea (con guardias) — se usará tanto en cron como en arranque
async function ejecutarSiNoEstaChequeada() {
  await ejecutarTarea();
}

// ========== Programación ==========
/**
 * Registra el cron y ejecuta una corrida inicial.
 * Llama a esta función DESPUÉS de await dbConnect() en tu entrypoint.
 * @param {string} expr - Expresión CRON, por defecto cada 5 minutos (útil en pruebas)
 */
function scheduleIshNotifications(expr = '0 10 * * *') {
  // Corrida inicial (no bloqueante)
  ejecutarSiNoEstaChequeada().catch(() => {});

  // Programa cron
  cron.schedule(expr, () => {
    ejecutarSiNoEstaChequeada().catch(() => {});
  }, { timezone: 'America/Mexico_City' });

  console.log(`[cron-ish] Programado con expresión "${expr}" (America/Mexico_City)`);
}

module.exports = { scheduleIshNotifications };