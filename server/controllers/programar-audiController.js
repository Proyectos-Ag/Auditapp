require('dotenv').config();
const Audit = require('../models/programar-audiSchema');
const puppeteer = require('puppeteer');
const transporter = require('../emailconfig');
const path = require('path');
const fs = require('fs');

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
  const { cliente, fecha, modalidad, status, realizada, programada } = req.body;

  // Validar campos requeridos
  if (!cliente || !fecha || !modalidad || !status) {
    return res
      .status(400)
      .json({ message: 'Por favor, completa todos los campos requeridos.' });
  }

  try {
    // 1. Crear y guardar la auditoría en la BD
    const newAudit = new Audit({
      cliente,
      fecha,
      modalidad,
      status,
      realizada: realizada || false,
      programada: programada || false,
    });
    const savedAudit = await newAudit.save();

    // 2. Enviar Correo con Captura de Pantalla
    try {
      // a) Lanzar Puppeteer
      const browser = await puppeteer.launch({
        // Si lo corres en un hosting tipo Heroku u otro, a veces necesitas:
        // args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      // Ajusta la URL a la ruta real donde se ve la tabla con la nueva auditoría
      await page.goto('https://auditapp-dqej.onrender.com/correo-prog-audi', {
        waitUntil: 'networkidle2',
      });

      // b) Ocultar elementos antes de la captura
      await page.evaluate(() => {
        const elementosOcultar = [
          '.boton-consultar', // Clase del botón "Consultar Auditorías 2024"
          '.acciones-panel', // Clase del panel de acciones
          '.boton-agregar'   // Clase del botón "Agregar Nueva Auditoría"
        ];
        elementosOcultar.forEach(selector => {
          const elemento = document.querySelector(selector);
          if (elemento) {
            elemento.style.display = 'none';
          }
        });
      });
       // b) Ocultar elementos antes de la captura
       await page.evaluate(() => {
        const elementosOcultar = [
          '.boton-consultar', // Clase del botón "Consultar Auditorías 2024"
          '.acciones-panel', // Clase del panel de acciones
          '.boton-agregar' ,
          'toggle-2024-button'  // Clase del botón "Agregar Nueva Auditoría"
        ];
        elementosOcultar.forEach(selector => {
          const elemento = document.querySelector(selector);
          if (elemento) {
            elemento.style.display = 'none';
          }
        });
      });
      
      // b) Tomar screenshot
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      await browser.close();

      // c) Lista de correos separados por comas
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
      vbarron@aguida.com
      `.trim().replace(/\s+/g, '');

      const templatePathPrograma = path.join(__dirname, 'templates', 'programa-auditorias.html');
            const emailTemplatePrograma = fs.readFileSync(templatePathPrograma, 'utf8');
            const customizedTemplatePrograma = emailTemplatePrograma
            .replace('{{cliente}}', savedAudit.cliente)
            .replace('{{fecha}}', savedAudit.fecha);

      // e) Enviar el correo 
      const mailOptions = {
        from: `"Sistema Auditorías" <${process.env.EMAIL_USERNAME}>`,
        to: recipientEmails, // Usa 'bcc' si quieres ocultar los correos
        subject: 'Nueva Auditoría Registrada',
        html: customizedTemplatePrograma,
        attachments: [
          {
            filename: 'captura.png',
            content: screenshotBuffer,
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Correo enviado correctamente a múltiples destinatarios:', info.messageId);
    } catch (errorMail) {
      console.error('Error al enviar correo o capturar pantalla:', errorMail);
    }

    // Finalmente, responder al front con la auditoría creada
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
