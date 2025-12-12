require('dotenv').config();
const Audit = require('../models/programar-audiSchema');
const transporter = require('../emailconfig');
const path = require('path');
const fs = require('fs');
const multer = require("multer");
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * GET /programas-anuales/audits
 * Obtiene todas las auditorías
 */
exports.getAudits = async (req, res) => {
  try {
    console.log('📋 GET /audits - Obteniendo todas las auditorías');
    const audits = await Audit.find();
    console.log(`✅ Encontradas ${audits.length} auditorías`);
    res.status(200).json(audits);
  } catch (error) {
    console.error('❌ Error al obtener auditorías:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /programas-anuales/audits/:id
 * Elimina una auditoría
 */
exports.deleteAudit = async (req, res) => {
  try {
    console.log(`🗑️ DELETE /audits/${req.params.id} - Eliminando auditoría`);
    const deletedAudit = await Audit.findByIdAndDelete(req.params.id);
    
    if (!deletedAudit) {
      console.log(`❌ Auditoría ${req.params.id} no encontrada`);
      return res.status(404).json({ 
        success: false,
        message: 'Auditoría no encontrada' 
      });
    }
    
    console.log(`✅ Auditoría ${req.params.id} eliminada correctamente`);
    res.json({ 
      success: true,
      message: 'Auditoría eliminada correctamente', 
      data: deletedAudit 
    });
    
  } catch (error) {
    console.error('❌ Error al eliminar auditoría:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar auditoría',
      error: error.message 
    });
  }
};

/**
 * POST /programas-anuales/audits
 * Crea una nueva auditoría
 */
exports.createAudit = async (req, res) => {
  const { cliente, fechaInicio, fechaFin, modalidad, status, realizada, programada, notas } = req.body;

  console.log('📝 POST /audits - Creando nueva auditoría:', {
    cliente,
    fechaInicio,
    fechaFin,
    modalidad,
    status
  });

  // Validar campos requeridos
  if (!cliente || !fechaInicio || !fechaFin || !modalidad || !status) {
    console.log('❌ Campos requeridos faltantes');
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
      notas: notas || ''
    });
    const savedAudit = await newAudit.save();

    console.log(`✅ Auditoría creada con ID: ${savedAudit._id}`);
    res.status(201).json(savedAudit);
  } catch (error) {
    console.error('❌ Error al crear auditoría:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /programas-anuales/audits/years
 * Obtiene todos los años disponibles en las auditorías
 */
exports.getAvailableYears = async (req, res) => {
  try {
    console.log('📅 GET /audits/years - Obteniendo años disponibles');
    const audits = await Audit.find();
    const yearsSet = new Set();
    
    audits.forEach(audit => {
      try {
        if (audit && audit.fechaInicio) {
          const date = new Date(audit.fechaInicio);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            yearsSet.add(year);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al procesar fecha de auditoría:', error.message);
      }
    });
    
    const years = Array.from(yearsSet).sort((a, b) => b - a);
    console.log(`✅ Años encontrados: ${years.join(', ')}`);
    
    res.status(200).json(years);
  } catch (error) {
    console.error('❌ Error al obtener años:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /programas-anuales/audits/send-email
 * Envía correo con auditorías específicas por año
 */
/**
 * POST /programas-anuales/audits/send-email
 * Envía correo con auditorías específicas por año
 */
exports.sendAuditEmail = async (req, res) => {
  console.log('📧 POST /audits/send-email - Enviando correo');
  
  try {
    // Log de los datos recibidos
    console.log('📨 Datos recibidos en req.body:', req.body);
    console.log('📎 ¿Hay archivo adjunto?', req.file ? 'Sí' : 'No');
    
    // Acceder al archivo
    const imageBuffer = req.file ? req.file.buffer : null;
    
    if (!imageBuffer) {
      console.log('❌ No se recibió la imagen');
      return res.status(400).json({ message: 'No se recibió la imagen.' });
    }
    
    console.log(`📊 Tamaño de la imagen: ${imageBuffer.length} bytes`);

    // Parsear selectedYears
    let selectedYears;
    try {
      if (typeof req.body.selectedYears === 'string') {
        selectedYears = JSON.parse(req.body.selectedYears);
      } else {
        selectedYears = req.body.selectedYears;
      }
      console.log('📅 Años seleccionados (parseados):', selectedYears);
    } catch (error) {
      console.error('❌ Error al parsear selectedYears:', error.message);
      return res.status(400).json({ 
        message: 'Formato inválido para selectedYears' 
      });
    }

    // Validar selectedYears
    if (!selectedYears || !Array.isArray(selectedYears) || selectedYears.length === 0) {
      console.log('❌ selectedYears no es válido:', selectedYears);
      return res.status(400).json({ 
        message: 'Debe seleccionar al menos un año válido.' 
      });
    }

    // Convertir todos los años a strings para consistencia
    selectedYears = selectedYears.map(year => year.toString());
    console.log('📅 Años seleccionados (normalizados):', selectedYears);

    // Comprimir y redimensionar la imagen
    console.log('🖼️ Procesando imagen...');
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

    console.log(`🖼️ Imagen comprimida: ${compressedImage.length} bytes`);

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
      enfermeria@aguida.com,
      almrefacciones@aguida.com,
      almrefacciones2@aguida.com,
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
      vbarron@aguida.com,
      soleje2862004@gmail.com`
    .trim();
        console.log('👥 Destinatarios:', recipientEmails);

    // Obtener todas las auditorías para mostrar información en el correo
    const audits = await Audit.find();
    console.log(`📋 Total de auditorías en BD: ${audits.length}`);

    // Filtrar auditorías por años seleccionados
    const selectedAudits = audits.filter(audit => {
      if (!audit || !audit.fechaInicio) return false;
      
      try {
        const date = new Date(audit.fechaInicio);
        if (isNaN(date.getTime())) return false;
        
        const year = date.getFullYear();
        return selectedYears.includes(year.toString());
      } catch (error) {
        console.warn('⚠️ Error al procesar auditoría:', audit?._id, error.message);
        return false;
      }
    });

    console.log(`📋 Auditorías para años seleccionados: ${selectedAudits.length}`);

    // Crear lista de años seleccionados para el asunto
    const yearsList = selectedYears.sort((a, b) => b - a).join(', ');
    console.log('📅 Lista de años para el asunto:', yearsList);
    
    // Obtener datos para el correo
    const emailSubject = req.body.emailSubject || `Programa Anual de Auditorías ${yearsList}`;
    const customMessage = req.body.customMessage || 'Se ha actualizado el programa anual de auditorías.';
    
    console.log('📧 Asunto del correo:', emailSubject);
    console.log('💬 Mensaje personalizado:', customMessage);

    // CORRECCIÓN AQUÍ: Cambiar la ruta del template
    // De: const templatePath = path.join(__dirname, '../templates/programa-auditorias.html');
    // A: (porque templates está en controllers/templates)
    const templatePath = path.join(__dirname, 'templates/programa-auditorias.html');
    
    console.log('📄 Ruta de plantilla CORREGIDA:', templatePath);
    console.log('📄 Directorio actual (__dirname):', __dirname);
    
    let emailTemplate;
    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
      console.log('✅ Plantilla cargada correctamente desde controllers/templates/');
    } catch (error) {
      console.error('❌ Error al cargar plantilla:', error.message);
      console.error('🔍 Directorio completo:', templatePath);
      
      // Intentar rutas alternativas si es necesario
      const altPath1 = path.join(__dirname, 'templates/programa-auditorias.html');
      const altPath2 = path.join(process.cwd(), 'controllers/templates/programa-auditorias.html');
      console.log('🔍 Ruta alternativa 1:', altPath1);
      console.log('🔍 Ruta alternativa 2:', altPath2);
      
      return res.status(500).json({ 
        message: 'Error al cargar la plantilla del correo',
        details: `No se encontró el archivo en: ${templatePath}`
      });
    }
    
    // Personalizar la plantilla con los datos
    emailTemplate = emailTemplate
      .replace('{{yearsList}}', yearsList)
      .replace('{{auditsCount}}', selectedAudits.length)
      .replace('{{selectedYearsCount}}', selectedYears.length)
      .replace('{{customMessage}}', customMessage);

    console.log('✅ Plantilla personalizada correctamente');

    // Configurar las opciones del correo
    const mailOptions = {
      from: `"Gestión para la Calidad" <${process.env.EMAIL_USERNAME}>`,
      bcc: recipientEmails,
      subject: emailSubject,
      html: emailTemplate,
      attachments: [
        {
          filename: 'programa-auditorias.png',
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

    console.log('📧 Configurando opciones del correo...');
    console.log('📨 De:', mailOptions.from);
    console.log('👥 Para:', mailOptions.bcc);
    console.log('📌 Adjuntos:', mailOptions.attachments.length);

    // Verificar que exista el logo
    try {
      const logoPath = mailOptions.attachments[1].path;
      const logoExists = fs.existsSync(logoPath);
      console.log(`🖼️ Logo existe en ${logoPath}?:`, logoExists ? '✅ Sí' : '❌ No');
    } catch (logoError) {
      console.warn('⚠️ No se pudo verificar el logo:', logoError.message);
    }

    // Enviar el correo
    console.log('🚀 Enviando correo...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Correo enviado exitosamente! ID: ${info.messageId}`);
    console.log(`📊 Años enviados: ${yearsList}`);
    console.log(`📋 Auditorías incluidas: ${selectedAudits.length}`);
    console.log(`📨 Respuesta del servidor SMTP:`, info.response);
    
    res.status(200).json({ 
      success: true,
      message: `Correo enviado correctamente para los años ${yearsList}`,
      years: selectedYears,
      totalAudits: selectedAudits.length,
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error.message);
    console.error("🔍 Detalles del error:", error);
    
    // Si es un error específico de nodemailer, mostrar más detalles
    if (error.code) {
      console.error(`🔧 Código de error: ${error.code}`);
    }
    if (error.response) {
      console.error(`📨 Respuesta SMTP: ${error.response}`);
    }
    if (error.command) {
      console.error(`🖥️ Comando SMTP: ${error.command}`);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al enviar el correo',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

/**
 * PUT /programas-anuales/audits/:id
 * Actualiza el estado de una auditoría
 */
exports.updateAuditStatus = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log(`✏️ PUT /audits/${id} - Actualizando auditoría:`, updateData);

  try {
    // Validar que exista la auditoría
    const audit = await Audit.findById(id);
    if (!audit) {
      console.log(`❌ Auditoría ${id} no encontrada`);
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

    console.log(`✅ Auditoría ${id} actualizada correctamente`);
    res.status(200).json(updatedAudit);
  } catch (error) {
    console.error("❌ Error al actualizar auditoría:", error.message);
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

  console.log(`📝 PUT /audits/${id}/notas - Actualizando notas:`, notas?.length || 0, 'caracteres');

  try {
    // Validar que las notas no excedan el límite
    if (notas && notas.length > 1000) {
      console.log('❌ Las notas exceden el límite de 1000 caracteres');
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
      console.log(`❌ Auditoría ${id} no encontrada`);
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    console.log(`✅ Notas de auditoría ${id} actualizadas correctamente`);
    res.status(200).json(updatedAudit);
  } catch (error) {
    console.error("❌ Error al actualizar notas:", error.message);
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

  console.log(`📖 GET /audits/${id}/notas - Obteniendo notas`);

  try {
    const audit = await Audit.findById(id, 'notas cliente');
    
    if (!audit) {
      console.log(`❌ Auditoría ${id} no encontrada`);
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    console.log(`✅ Notas obtenidas para auditoría ${id}`);
    res.status(200).json({
      id: audit._id,
      cliente: audit.cliente,
      notas: audit.notas || ''
    });
  } catch (error) {
    console.error("❌ Error al obtener notas:", error.message);
    res.status(500).json({ 
      message: 'Error al obtener notas',
      error: error.message 
    });
  }
};
