require('dotenv').config();
const Audit = require('../models/programar-audiSchema');
const puppeteer = require('puppeteer');
const transporter = require('../emailconfig');
const path = require('path');
const fs = require('fs');
const multer = require("multer");
const sharp = require('sharp');

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

exports.deleteAudit = async (req, res) => {
  try {
    const deletedAudit = await Audit.findByIdAndDelete(req.params.id);
    
    if (!deletedAudit) {
      return res.status(404).json({ 
        success: false,
        message: 'Auditoría no encontrada' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Auditoría eliminada correctamente', 
      data: deletedAudit 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar auditoría',
      error: error.message 
    });
  }
};

/**
 * POST /programas-anuales/audits
 * Crea una nueva auditoría y envía correo con captura de pantalla.
 */
exports.createAudit = async (req, res) => {
  const { cliente, fechaInicio, fechaFin, modalidad, status, realizada, programada, notas } = req.body;

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
      notas: notas || '' // Incluir notas
    });
    const savedAudit = await newAudit.save();

    res.status(201).json(savedAudit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendAuditEmail = async (req, res) => {
  try {
    // Acceder al archivo enviado en la solicitud
    const imageBuffer = req.file ? req.file.buffer : null;
    if (!imageBuffer) {
      return res.status(400).json({ message: 'No se recibió la imagen.' });
    }

    // Comprimir y redimensionar la imagen
    const compressedImage = await sharp(imageBuffer)
      .resize({
        width: 1000,
        height: 1000,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3
      })
      .png({
        quality: 100,
        compressionLevel: 1,
        adaptiveFiltering: true,
        force: true
      })
      .toBuffer();

    // Definir los destinatarios del correo
    const recipientEmails = `
      fredyesparza08@gmail.com`
    .trim();

    // Leer la plantilla HTML para el correo
    const templatePath = path.join(__dirname, 'templates', 'programa-auditorias.html');
    const emailTemplate = fs.readFileSync(templatePath, 'utf8');

    const customizedTemplate = emailTemplate;

    // Configurar las opciones del correo
    const mailOptions = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      bcc: recipientEmails,
      subject: 'Nueva Auditoría Registrada',
      html: customizedTemplate,
      attachments: [
        {
          filename: 'captura.png',
          content: compressedImage,
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
  const updateData = req.body;

  try {
    // Validar que exista la auditoría
    const audit = await Audit.findById(id);
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    // Actualizar todos los campos recibidos
    Object.keys(updateData).forEach(key => {
      if (key !== '_id') {
        audit[key] = updateData[key];
      }
    });

    // Guardar los cambios
    const updatedAudit = await audit.save();

    res.status(200).json(updatedAudit);
  } catch (error) {
    console.error("Error al actualizar auditoría:", error);
    res.status(500).json({ 
      message: 'Error al actualizar auditoría',
      error: error.message 
    });
  }
};

/**
 * PUT /programas-anuales/audits/:id/notas
 * Actualiza específicamente las notas de una auditoría
 */
exports.updateAuditNotes = async (req, res) => {
  const { id } = req.params;
  const { notas } = req.body;

  try {
    // Validar que las notas no excedan el límite
    if (notas && notas.length > 1000) {
      return res.status(400).json({ 
        message: 'Las notas no pueden exceder 1000 caracteres' 
      });
    }

    // Buscar y actualizar la auditoría
    const updatedAudit = await Audit.findByIdAndUpdate(
      id,
      { notas: notas || '' },
      { new: true, runValidators: true }
    );

    if (!updatedAudit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    res.status(200).json(updatedAudit);
  } catch (error) {
    console.error("Error al actualizar notas:", error);
    res.status(500).json({ 
      message: 'Error al actualizar notas',
      error: error.message 
    });
  }
};

/**
 * GET /programas-anuales/audits/:id/notas
 * Obtiene las notas específicas de una auditoría
 */
exports.getAuditNotes = async (req, res) => {
  const { id } = req.params;

  try {
    const audit = await Audit.findById(id, 'notas cliente');
    
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    res.status(200).json({
      id: audit._id,
      cliente: audit.cliente,
      notas: audit.notas || ''
    });
  } catch (error) {
    console.error("Error al obtener notas:", error);
    res.status(500).json({ 
      message: 'Error al obtener notas',
      error: error.message 
    });
  }
};
