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
    // Crear y guardar la auditoría en la BD
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

    // Se podría almacenar el archivo en la BD si se requiere, o dejarlo para el otro controlador
    // Por ejemplo, guardar el nombre del archivo o alguna referencia.

    // Responder con la auditoría creada
    res.status(201).json(savedAudit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendAuditEmail = async (req, res) => {
  try {
    // Acceder al archivo enviado en la solicitud (imagen o PDF)
    const pdfBuffer = req.file ? req.file.buffer : null;
    if (!pdfBuffer) {
      return res.status(400).json({ message: 'No se recibió la imagen.' });
    }

    // Definir los destinatarios del correo
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
      soleje2862004@gmail.com`
    .trim();

    // Leer la plantilla HTML para el correo
    const templatePath = path.join(__dirname, 'templates', 'programa-auditorias.html');
    const emailTemplate = fs.readFileSync(templatePath, 'utf8');

    const customizedTemplate = emailTemplate;

    // Configurar las opciones del correo, incluyendo el adjunto (la imagen)
    const mailOptions = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      bcc: recipientEmails,
      subject: 'Nueva Auditoría Registrada',
      html: customizedTemplate,
      attachments: [
        {
          filename: 'captura.png', // Puedes cambiar el nombre si lo deseas
          content: pdfBuffer,
          cid: 'tabla'
        },
        {
          filename: 'logoAguida.png',
          path: path.join(__dirname, '../assets/logoAguida-min.png'),
          cid: 'logoAguida' 
        }
      ],
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado correctamente:', info.messageId);
    res.status(200).json({ message: 'Correo enviado correctamente.' });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
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
