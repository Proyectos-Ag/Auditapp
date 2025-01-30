require('dotenv').config();
const Audit = require('../models/programar-audiSchema');
const puppeteer = require('puppeteer');
const transporter = require('../emailconfig');
const path = require('path');
const fs = require('fs');
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * GET /programas-anuales/audits
 */
exports.getAudits = async (req, res) => {
  try {
    const audits = await Audit.find();
    res.status(200).json(audits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /programas-anuales/audits
 * Crea una nueva auditoría y envía correo con captura de pantalla.
 */
exports.createAudit = async (req, res) => {
  const { cliente, fechaInicio, fechaFin, modalidad, status, realizada, programada } = req.body;

  // Validar campos requeridos
  if (!cliente || !fechaInicio || !fechaFin || !modalidad || !status) {
    return res
      .status(400)
      .json({ message: 'Por favor, completa todos los campos requeridos.' });
  }

  try {
    // Crear y guardar la auditoría en la base de datos
    const newAudit = new Audit({
      cliente,
      fechaInicio,
      fechaFin,
      modalidad,
      status,
      realizada: realizada || false,
      programada: programada || false,
    });
    const savedAudit = await newAudit.save();

    // Si existe un archivo en la solicitud, accede a él con `req.file.buffer`
    const pdfBuffer = req.file ? req.file.buffer : null;

    // Si hay una imagen (pdfBuffer), puedes hacer lo que necesites, por ejemplo, enviarla en el correo
    if (pdfBuffer) {
      // Crear un archivo PDF o realizar cualquier otra operación con `pdfBuffer`

      // Preparar el email con el archivo adjunto
      const recipientEmails = `
      aaranda@aguida.com,
      almacen@aguida.com,
      amartinez@aguida.com,
      cgarciae@aguida.com,
      comedor@aguida.com,
      controlycuidadoambiental@aguida.com,
      coord.seghigiene@aguida.com,
      coordalmpt@aguida.com,
      fjflores@aguida.com,
      golvera@aguida.com,
      jagranados@aguida.com,
      jcarriaga@aguida.com,
      jefelaboratorio@aguida.com,
      jefeproduccion@aguida.com,
      jloyolac@aguida.com,
      jpsalinas@aguida.com,
      jrhernandez@aguida.com,
      jsarriaga@aguida.com,
      ljalvarez@aguida.com,
      materiasprimas@aguida.com,
      rcruces@aguida.com,
      rgutierrez@aguida.com,
      rloyola@aguida.com,
      rmendez@aguida.com,
      supervisores@aguida.com,
      validacionproceso@aguida.com,
      jessica@aguida.com,
      inventariosmp@aguida.com,
      reclutamiento@aguida.com,
      itzelcardenas@aguida.com,
      paulesparza@aguida.com,
      jefemantenimientotp@aguida.com,
      nbgarcia@aguida.com,
      jrivera@aguida.com,
      cpadron@aguida.com,
      vbarron@aguida.com,
      soleje2862004@gmail.com
      `.trim().replace(/\s+/g, '');

      const templatePathPrograma = path.join(__dirname, 'templates', 'programa-auditorias.html');
      const emailTemplatePrograma = fs.readFileSync(templatePathPrograma, 'utf8');
      const customizedTemplatePrograma = emailTemplatePrograma
        .replace('{{cliente}}', savedAudit.cliente)
        .replace('{{fechaFin}}', savedAudit.fechaFin)
        .replace('{{fecha}}', savedAudit.fechaInicio);

      // Configurar el correo con la imagen adjunta
      const mailOptions = {
        from: `"Sistema Auditorías" <${process.env.EMAIL_USERNAME}>`,
        bcc: recipientEmails,
        subject: 'Nueva Auditoría Registrada',
        html: customizedTemplatePrograma,
        attachments: [
          {
            filename: 'captura.png', // O el nombre que prefieras para el archivo
            content: pdfBuffer,      // Este es el buffer de la imagen o archivo que recibiste
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Correo enviado correctamente a múltiples destinatarios:', info.messageId);
    }

    // Responder con la auditoría creada
    res.status(201).json(savedAudit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /programas-anuales/audits/:id
 * Actualiza el campo que se indique (status, realizada, programada, etc.)
 */
exports.updateAuditStatus = async (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body;

  try {
    const audit = await Audit.findById(id);
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }
    // Actualiza el campo dinámicamente
    audit[field] = value;
    await audit.save();

    res.status(200).json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
