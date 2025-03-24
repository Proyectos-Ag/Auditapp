const cron = require('node-cron');
const moment = require('moment');
const Ishikawa = require('../models/ishikawaSchema');
const transporter = require('../emailconfig');
const fs = require('fs');
const path = require('path');

// Programación de tarea
cron.schedule('0 0 * * 1', async () => {
  console.log(`Tarea cron ejecutada a las: ${new Date().toLocaleString()}`);

  try {
    // Definir el rango para el día siguiente: inicio y fin
    const startOfTomorrow = moment().add(1, 'day').startOf('day').toDate();
    const endOfTomorrow = moment().add(1, 'day').endOf('day').toDate();

    // Pipeline de agregación para extraer las actividades con la última fechaCompromiso y cada responsable
    const resultados = await Ishikawa.aggregate([
      { $unwind: "$actividades" },
      // Desenrollamos el arreglo de responsables
      { $unwind: "$actividades.responsable" },
      {
        $project: {
          actividad: "$actividades.actividad",
          responsable: "$actividades.responsable", // ahora es un objeto { nombre, correo }
          fechaCompromisoArray: "$actividades.fechaCompromiso",
          // Obtener la última fecha del arreglo
          lastFechaCompromiso: { $arrayElemAt: ["$actividades.fechaCompromiso", -1] }
        }
      },
      {
        $addFields: {
          lastFechaCompromisoDate: {
            $dateFromString: { 
              dateString: "$lastFechaCompromiso", 
              format: "%Y-%m-%d",
              timezone: "America/Mexico_City", // ajusta la zona horaria según necesites
              onError: null, 
              onNull: null 
            }
          }
        }
      },
      {
        $match: {
          lastFechaCompromisoDate: {
            $gte: startOfTomorrow,
            $lte: endOfTomorrow
          }
        }
      }
    ]);

    console.log(`Número de actividades encontradas: ${resultados.length}`);
    console.log("Fechas encontradas:", resultados.map(r => ({
      actividad: r.actividad,
      responsable: r.responsable,
      lastFechaCompromiso: r.lastFechaCompromiso,
      lastFechaCompromisoDate: r.lastFechaCompromisoDate
    })));      

    // Leer la plantilla de correo
    const templatePath = path.join(__dirname, 'templates', 'notificacion-compromiso.html');
    const emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Iterar cada actividad y enviar correo a cada responsable
    resultados.forEach(doc => {
      const { actividad, responsable, lastFechaCompromiso } = doc;
      console.log(`Preparando correo para: ${responsable.nombre} - Actividad: ${actividad}`);

      // Personaliza el template de correo, incluyendo detalles como el nombre del responsable, actividad y fecha de compromiso
      const customizedTemplate = emailTemplate
        .replace('{{usuario}}', responsable.nombre)
        .replace('{{actividad}}', actividad)
        .replace('{{fechaCompromiso}}', lastFechaCompromiso);

      // Configurar las opciones del correo usando el correo del responsable
      const mailOptions = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: responsable.correo, // ahora se envía al correo del objeto responsable
        subject: 'Recordatorio: Tu fecha de compromiso es mañana',
        html: customizedTemplate,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida'
          }
        ]
      };

      // Enviar el correo usando nodemailer
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Error al enviar correo a ${responsable.nombre}:`, error);
        } else {
          console.log(`Correo enviado a ${responsable.nombre}:`, info.response);
        }
      });
    });
  } catch (error) {
    console.error("Error en la tarea programada:", error);
  }
});