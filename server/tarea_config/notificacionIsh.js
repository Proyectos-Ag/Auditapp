const cron = require('node-cron');
const moment = require('moment');
const Ishikawa = require('../models/ishikawaSchema');
const transporter = require('../emailconfig');
const fs = require('fs');
const path = require('path');

/**
 * Función que obtiene las actividades para un día objetivo (targetDate)
 * considerando:
 * - La fecha del último compromiso (lastFechaCompromiso) debe estar definida y convertible.
 * - La actividad no debe estar concluida.
 * - La actividad aún no se procesó en el día de hoy (fechaCheck es inexistente o anterior al inicio de hoy).
 */
async function getTasksForDate(targetDate) {
  const hoy = moment().startOf('day').toDate();
  const startOfDay = moment(targetDate).startOf('day').toDate();
  const endOfDay   = moment(targetDate).endOf('day').toDate();

  console.log('comprobacion de fecha actual: ', hoy)

  return await Ishikawa.aggregate([
    { $unwind: "$actividades" },
    { $unwind: "$actividades.responsable" },
    {
      $project: {
        padreId: "$_id", // Id del documento principal
        actividadId: "$actividades._id", // Id de la actividad (se asume que existe)
        actividad: "$actividades.actividad",
        responsable: "$actividades.responsable", // objeto con { nombre, correo }
        fechaCheck: "$actividades.fechaCheck", // nuevo campo de control
        // Se obtiene el arreglo de fechas y el último elemento de ese arreglo
        fechaCompromisoArray: "$actividades.fechaCompromiso",
        lastFechaCompromiso: { $arrayElemAt: ["$actividades.fechaCompromiso", -1] },
        concluido: "$actividades.concluido"
      }
    },
    // Sólo incluir aquellas actividades que NO se hayan procesado hoy.
    {
      $match: {
        $or: [
          { fechaCheck: { $exists: false } },
          { fechaCheck: { $lt: hoy } }
        ]
      }
    },
    // Descartar documentos cuyo lastFechaCompromiso esté vacío o sea nulo.
    {
      $match: {
        lastFechaCompromiso: { $nin: ["", null] }
      }
    },
    // Convertir lastFechaCompromiso (string) a Date
    {
      $addFields: {
        lastFechaCompromisoDate: {
          $dateFromString: {
            dateString: "$lastFechaCompromiso",
            format: "%Y-%m-%d",
            timezone: "America/Mexico_City", // ajusta según necesidad
            onError: null,
            onNull: null
          }
        }
      }
    },
    // Filtrar para aquellas actividades cuya última fechaCompromiso se encuentre en el rango del día objetivo
    // y que no estén concluidas.
    {
      $match: {
        lastFechaCompromisoDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        concluido: { $ne: true }
      }
    }
  ]);
}

/**
 * Función que se encarga de leer la plantilla, obtener las tareas (para mañana y dentro de 3 días),
 * enviar correos a cada responsable y, en caso de enviar el correo, actualizar el campo fechaCheck
 * de la actividad con la fecha actual.
 */
async function ejecutarTarea() {
  console.log(`Ejecución de tarea a las: ${new Date().toLocaleString()}`);

  try {
    // Consultar actividades para mañana y dentro de 3 días.
    const tasksTomorrow = await getTasksForDate(moment().add(1, 'day'));
    const tasksThreeDays = await getTasksForDate(moment().add(3, 'days'));

    console.log(`Número de actividades para mañana: ${tasksTomorrow.length}`);
    console.log(`Número de actividades para dentro de 3 días: ${tasksThreeDays.length}`);

    // Leer la plantilla de correo.
    const templatePath = path.join(__dirname, 'templates', 'notificacion-compromiso.html');
    const emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Función auxiliar para enviar correo y, en caso exitoso, actualizar fechaCheck.
    async function procesarEnvio(doc, subject) {
      const { padreId, actividadId, actividad, responsable, lastFechaCompromiso } = doc;
      console.log(`Preparando correo para: ${responsable.nombre} - Actividad: ${actividad} (${subject})`);

      // Personalizar la plantilla del correo.
      const customizedTemplate = emailTemplate
        .replace('{{usuario}}', responsable.nombre)
        .replace('{{actividad}}', actividad)
        .replace('{{fechaCompromiso}}', lastFechaCompromiso);

      const mailOptions = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: responsable.correo,
        subject: subject,
        html: customizedTemplate,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida'
          }
        ]
      };

      // Enviar el correo.
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error(`Error al enviar correo a ${responsable.nombre}:`, error);
        } else {
          console.log(`Correo enviado a ${responsable.nombre}:`, info.response);
          // Una vez enviado el correo, se actualiza la fechaCheck de la actividad a la fecha actual
          try {
            await Ishikawa.updateOne(
              { _id: padreId, "actividades._id": actividadId },
              { $set: { "actividades.$.fechaCheck": new Date() } }
            );
            console.log(`fechaCheck actualizada para la actividad: ${actividad}`);
          } catch (updError) {
            console.error("Error actualizando fechaCheck:", updError);
          }
        }
      });
    }

    // Procesar tareas para mañana.
    tasksTomorrow.forEach(doc => {
      procesarEnvio(doc, 'Recordatorio: Tu fecha de compromiso es mañana');
    });

    // Procesar tareas para dentro de 3 días.
    tasksThreeDays.forEach(doc => {
      procesarEnvio(doc, 'Recordatorio: Faltan 3 días para tu fecha de compromiso');
    });

  } catch (error) {
    console.error("Error en la tarea programada:", error);
  }
}

/**
 * Función para ejecutar la tarea sólo si aún no se ha ejecutado hoy.
 * Se puede invocar tanto al iniciar el servidor como por cron.
 */
async function ejecutarSiNoEstaChequeada() {
  // Llamamos a la función que se encarga de enviar correos
  // Las condiciones para no enviar estarán definidas en la agregación (actividades que ya tienen fechaCheck hoy se descartan)
  await ejecutarTarea();
}

/**
 * Ejecutar la tarea inmediatamente cuando el servidor se inicia.
 */
ejecutarSiNoEstaChequeada();