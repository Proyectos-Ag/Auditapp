const Ishikawa = require('../models/ishikawaSchema');
const Usuarios = require('../models/usuarioSchema');
const transporter = require('../emailconfig');
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Configuracion multer para PDF
const storage = multer.memoryStorage(); // Almacenar el archivo en memoria
const upload = multer({ storage: storage });

// ✅ Convierte evidencia vieja (string) o nueva (array) a array siempre
const normalizeEvidencia = (e) => {
  if (e == null) return [];
  if (Array.isArray(e)) return e.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);

  const s = String(e).trim();
  return s ? [s] : [];
};

const normalizeCorrecciones = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => ({
    ...c,
    evidencia: normalizeEvidencia(c.evidencia),
  }));
};

const crearIshikawa = async (req, res) => {
  try {
      const newIshikawa = new Ishikawa(req.body);
      console.log(req.body);
      
      await newIshikawa.save();

      // Enviar correo para notificar la asignación de un diagrama
      const auditado = newIshikawa.auditado;
      const correo = newIshikawa.correo;
      const proName = newIshikawa.proName;
      
      console.log('Auditado:', auditado, 'Correo:', correo, 'Programa:', proName);

      const templatePathAsignacion = path.join(__dirname, 'templates', 'asignacion-ishikawa.html');
      const emailTemplateAsignacion = fs.readFileSync(templatePathAsignacion, 'utf8');
      const customizedTemplateAsignacion = emailTemplateAsignacion
      .replace('{{usuario}}', auditado)
      .replace('{{programa}}', proName);

      const mailOptionsAsignacion = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: correo,
        subject: 'Se te ha asignado un nuevo Ishikawa',
        html: customizedTemplateAsignacion,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida' 
          }
        ]
      }; 
      
      transporter.sendMail(mailOptionsAsignacion, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
      
      res.status(200).json(newIshikawa);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

const crearIshikawa2 = async (req, res) => {
  try {
    const { folio: prefixRaw, tipo, ...restBody } = req.body;

    // 4) Crear instancia y asignar folio
    const newIshikawa = new Ishikawa({
       ...restBody,
      folio: prefixRaw,
      tipo
    });
    console.log('Guardando Ishikawa con folio:', fullFolio);

    // 5) Guardar en BD
    await newIshikawa.save();

    // 6) Enviar correo solo si 'tipo' no es 'vacio'
    if (newIshikawa.tipo !== 'vacio') {
      const auditado = newIshikawa.auditado;
      const correo = newIshikawa.correo;
      const proName = newIshikawa.proName;
      console.log('Auditado:', auditado, 'Correo:', correo, 'Programa:', proName);

      // Leer plantilla y personalizar
      const templatePathAsignacion = path.join(__dirname, 'templates', 'asignacion-ishikawa.html');
      const emailTemplateAsignacion = fs.readFileSync(templatePathAsignacion, 'utf8');
      const customizedTemplateAsignacion = emailTemplateAsignacion
        .replace('{{usuario}}', auditado)
        .replace('{{programa}}', proName);

      const mailOptionsAsignacion = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: correo,
        subject: 'Se te ha asignado un nuevo Ishikawa',
        html: customizedTemplateAsignacion,
        attachments: [{
          filename: 'logoAguida.png',
          path: path.join(__dirname, '../assets/logoAguida-min.png'),
          cid: 'logoAguida'
        }]
      };

      transporter.sendMail(mailOptionsAsignacion, (error, info) => {
        if (error) console.error('Error al enviar el correo:', error);
        else console.log('Correo enviado:', info.response);
      });
    }

    // 7) Responder al cliente
    res.status(200).json(newIshikawa);
  } catch (error) {
    console.error('Error en crearIshikawa:', error);
    res.status(400).json({ error: error.message });
  }
};

const obtenerIshikawas = async (req, res) => {
  const { idRep, idReq, proName } = req.query;

  try {
      const query = {};

      if (idRep) query.idRep = idRep;
      if (idReq) query.idReq = idReq;
      if (proName) query.proName = proName;

      const ishikawas = await Ishikawa.find(query);
      res.status(200).json(ishikawas);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

const obtenerIshikawasId = async (req, res) => {
  try {
      const { _id } = req.params;

      // Filtrar los Ishikawas donde idRep sea igual al id de la URL
      const ishikawas = await Ishikawa.find({ idRep: _id }, 
      'idRep idReq proName estado actividades auditado correo');

      // Si no hay registros, devuelve un array vacío.
      if (ishikawas.length === 0) {
          return res.status(200).json([]); // Devuelve un array vacío
      }

      // Devolver los registros encontrados
      res.status(200).json(ishikawas);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

const actualizarIshikawaCompleto = async (req, res) => {
  try {
      const { id } = req.params;
      console.log('Datos recibidos en el cuerpo de la solicitud:', req.body); 
      const updatedIshikawa = await Ishikawa.findByIdAndUpdate(id, req.body, { new: true });
      console.log('Ishikawa actualizado:', updatedIshikawa);
      if (!updatedIshikawa) {
          return res.status(404).json({ error: 'Ishikawa not found' });
      }

      // Verificar si el estado es "En revisión"
    if (updatedIshikawa.estado === 'En revisión') {
      const usuario = updatedIshikawa.auditado;

      // Leer y personalizar la plantilla
      const templatePathRevision = path.join(__dirname, 'templates', 'revision-ishikawa.html');
      const emailTemplateRevision = fs.readFileSync(templatePathRevision, 'utf8');
      const customizedTemplateRevision = emailTemplateRevision.replace('{{usuario}}', usuario);

      // Configuración del correo
      const mailOptions = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: `${process.env.EMAIL_ADMIN}`,
        subject: 'Ishikawa enviado para revisión',
        html: customizedTemplateRevision,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida' 
          }
        ]
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
    }

    // Verificar si el estado es "Rechazado"
    if (
      updatedIshikawa.estado === 'Rechazado') {
      const usuario = updatedIshikawa.auditado;
      const programa = req.body.programa;
      const correo = updatedIshikawa.correo;
      const nota = req.body.notaRechazo;

      console.log('correo:', correo)
      console.log('usuario:', usuario)
      console.log('programa:', programa)
      console.log('nota:', nota)

      const templatePathRechazado = path.join(__dirname, 'templates', 'rechazado-ishikawa.html');
      const emailTemplateRechazado = fs.readFileSync(templatePathRechazado, 'utf8');
      const customizedTemplateRechazado = emailTemplateRechazado
      .replace('{{usuario}}', usuario)
      .replace('{{programa}}', programa)
      .replace('{{nota}}', nota);

      const mailOptionsRechazado = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: correo,
        subject: 'Ishikawa rechazado',
        html: customizedTemplateRechazado,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida' 
          }
        ]
      };

      transporter.sendMail(mailOptionsRechazado, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
    };

    // Verificar si el estado es "Aprobado"
    if (updatedIshikawa.estado === 'Aprobado') {
      const usuario = updatedIshikawa.auditado;
      const programa = req.body.programa;
      const correo = updatedIshikawa.correo;

      const templatePathAprobado = path.join(__dirname, 'templates', 'aprobado-ishikawa.html');
      const emailTemplateAprobado = fs.readFileSync(templatePathAprobado, 'utf8');
      const customizedTemplateAprobado = emailTemplateAprobado
      .replace('{{usuario}}', usuario)
      .replace('{{programa}}', programa);

      const mailOptionsAprobado = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: correo,
        subject: 'Ishikawa aprobado',
        html: customizedTemplateAprobado,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida' 
          }
        ]
      };

      transporter.sendMail(mailOptionsAprobado, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
    };

    if (updatedIshikawa.estado === 'Hecho') {
      const usuario = req.body.auditado;
      const problema = req.body.problema;
      const fecha = req.body.fecha;

      // Leer y personalizar la plantilla
      const templatePathRevision = path.join(__dirname, 'templates', 'revision-ishikawa-vac.html');
      const emailTemplateRevision = fs.readFileSync(templatePathRevision, 'utf8');
      const customizedTemplateRevision = emailTemplateRevision
      .replace('{{usuario}}', usuario)
      .replace('{{problema}}', problema)
      .replace('{{fecha}}', fecha);

      // Configuración del correo
      const mailOptions = {
        from:`"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: `${process.env.EMAIL_ADMIN}`,
        subject: 'Ishikawa individual enviado para revisión',
        html: customizedTemplateRevision,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida' 
          }
        ]
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
    }

      res.status(200).json(updatedIshikawa);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el id del parámetro
    const { estado } = req.body; // Obtener el estado del cuerpo de la solicitud

    // Buscar el Ishikawa por id
    const ishikawa = await Ishikawa.findById(id);
    if (!ishikawa) {
      return res.status(404).json({ error: 'Ishikawa no encontrado' });
    }

    // Actualizar el campo 'estado'
    ishikawa.estado = estado;

    // Guardar los cambios
    await ishikawa.save();

    // Enviar respuesta con el objeto actualizado
    res.status(200).json({ mensaje: 'Estado actualizado correctamente', ishikawa });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const actualizarFechaCompromiso = async (req, res) => {
  try {
    const { id } = req.params; // Id del documento Ishikawa
    const { actividades } = req.body; // Se espera un arreglo con la(s) actividad(es) a actualizar

    const ishikawaDoc = await Ishikawa.findById(id);
    if (!ishikawaDoc) {
      return res.status(404).json({ error: "Documento Ishikawa no encontrado" });
    }

    // Se itera sobre las actividades enviadas desde el front
    actividades.forEach((actividad) => {
      // Se busca la actividad en el documento usando el _id
      const actividadEncontrada = ishikawaDoc.actividades.find(
        (act) => act._id.toString() === actividad._id
      );
      if (actividadEncontrada) {
        // Asegurarse de que el campo fechaCompromiso es un arreglo
        if (!Array.isArray(actividadEncontrada.fechaCompromiso)) {
          actividadEncontrada.fechaCompromiso = [];
        }
        // Agrega la(s) nueva(s) fecha(s) recibida(s)
        actividad.fechaCompromiso.forEach((nuevaFecha) => {
          // Opcional: evitar duplicados
          if (!actividadEncontrada.fechaCompromiso.includes(nuevaFecha)) {
            actividadEncontrada.fechaCompromiso.push(nuevaFecha);
          }
        });
      }
    });

    const updatedDoc = await ishikawaDoc.save();
    res.status(200).json(updatedDoc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


  const obtenerIshikawaPorDato = async (req, res) => {
    try {
      const { _id } = req.params;
      const { nombre } = req.query;
      console.log(`_id: ${_id}, nombre: ${nombre}`);
      // Filtrar los Ishikawas donde idRep sea igual al id de la URL
      const ishikawas = await Ishikawa.find({ idRep: _id, auditado: nombre}, 
      'idRep idReq proName estado actividades auditado');

      // Si no hay registros, devuelve un array vacío.
      if (ishikawas.length === 0) {
          return res.status(200).json([]); // Devuelve un array vacío
      }

      // Devolver los registros encontrados
      res.status(200).json(ishikawas);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
  }; 
  
  //Nuevo Gestor de registros Ishikawa
  const obtenerIshikawaVacioEsp = async (req, res) => {
    try {
      const { nombre } = req.query;
      console.log(`nombre: ${nombre}`);
      // Filtrar los Ishikawas donde idRep sea igual al id de la URL
      const ishikawas = await Ishikawa.find({ tipo: 'vacio',
        $or: [
          { auditado: nombre },                 // el usuario es dueño
          { 'acceso.nombre': nombre }           // el usuario está en el array de acceso
        ]
       }, 
      '_id problema auditado acceso estado createdAt');

      if (ishikawas.length === 0) {
          return res.status(200).json([]); // Devuelve un array vacío
      }

      console.log('Ishikawas: ',ishikawas);

      // Devolver los registros encontrados
      res.status(200).json(ishikawas);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
  };

  const getAccesosByIshikawa = async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log(`ID de Ishikawa recibido: ${req.params.id}`);
      const ishikawa = await Ishikawa.findById(id).select('acceso');
      if (!ishikawa) {
        return res.status(404).json({ message: 'Ishikawa no encontrado' });
      }
      // suponemos que el campo en tu schema es 'acceso'
      res.json({ acceso: ishikawa.acceso || [] });
    } catch (err) {
      next(err);
    }
  };

  const obtenerIshikawaVista = async (req, res) => {
    try {
      const nombre = decodeURIComponent(req.params.nombre);
        
        const ishikawas = await Ishikawa.find({ auditado: nombre}, 
          'idRep');

        if (ishikawas.length === 0) {
            console.log('No se encontraron registros de Ishikawa.');
            return res.status(200).json([]); // Devuelve un array vacío
        }

        console.log(`Registros enviados al cliente: ${JSON.stringify(ishikawas)}`);
        res.status(200).json(ishikawas);
    } catch (error) {
        console.error('Error en obtenerIshikawaVista:', error);
        res.status(500).json({ error: error.message });
    }
};


const eliminarEvidencia = async (req, res) => {
  try {
    const { idIsh, idCorr, evIndex } = req.params;

    const ishikawa = await Ishikawa.findById(idIsh);
    if (!ishikawa) {
      return res.status(404).json({ error: 'Ishikawa no encontrado' });
    }

    const correccion = ishikawa.correcciones.id(idCorr);
    if (!correccion) {
      return res.status(400).json({ error: 'Corrección no encontrada' });
    }

    // ✅ Por si venía como string en docs viejos
    correccion.evidencia = normalizeEvidencia(correccion.evidencia);

    // Si viene evIndex -> elimina solo ese elemento
    if (evIndex !== undefined) {
      const i = Number(evIndex);
      if (Number.isNaN(i) || i < 0 || i >= correccion.evidencia.length) {
        return res.status(400).json({ error: 'Índice de evidencia inválido' });
      }
      correccion.evidencia.splice(i, 1);
    } else {
      // Si NO viene evIndex -> elimina todas
      correccion.evidencia = [];
    }

    await ishikawa.save();

    return res.status(200).json({
      message: 'Evidencia eliminada exitosamente',
      evidencia: correccion.evidencia,
    });
  } catch (error) {
    console.error('Error al eliminar evidencia:', error);
    return res.status(500).json({ error: error.message });
  }
};

const obtenerIshikawaEspInc = async (req, res) => {
  try {
    const ishikawas = await Ishikawa.find(
      { idRep: { $exists: false }, estado: 'Incompleto' },
      '_id auditado fechaElaboracion estado'
    );

    res.status(200).json(ishikawas);
  } catch (error) {
    console.error('Error al obtener los ishikawas:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerIshikawaEsp = async (req, res) => {
  try {
    // Selecciona solo los campos que desean incluir en la respuesta
    const ishikawas = await Ishikawa.find({ tipo: 'vacio', estado: { $ne: 'Incompleto' }
    },'_id auditado fecha estado'); 

    res.status(200).json(ishikawas);
  } catch (error) {
    console.error('Error al obtener los ishikawas:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerIshikawaPorId = async (req, res) => {
  const { _id } = req.params; // Obtener la ID de los parámetros de la URL

  try {
      const ishikawa = await Ishikawa.findById(_id);
      if (!ishikawa) {
          return res.status(404).json({ error: 'Ishikawa no encontrado' });
      }
      res.status(200).json(ishikawa);
  } catch (error) {
      console.error('Error al obtener el ushikawa:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

//eliminar todos los ishikawas que correspondan a la auditoria
const eliminarIshikawasPorIdRep = async (req, res) => {
  try {
    const { idRep } = req.params; // Obtiene el parámetro idRep de la URL

    if (!idRep) {
      return res.status(400).json({ error: 'El parámetro idRep es obligatorio' });
    }

    // Busca y elimina todos los registros que coincidan con idRep
    const resultado = await Ishikawa.deleteMany({ idRep });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ message: 'No se encontraron registros con el idRep especificado' });
    }

    res.status(200).json({
      message: 'Registros eliminados exitosamente',
      eliminados: resultado.deletedCount,
    });
  } catch (error) {
    console.error('Error al eliminar Ishikawas por idRep:', error);
    res.status(500).json({ error: error.message });
  }
};

const actualizarIshikawa = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ normaliza (por si llega evidencia como string)
    const correcciones = normalizeCorrecciones(req.body);

    if (!Array.isArray(correcciones) || correcciones.length === 0) {
      return res.status(400).json({ error: 'No se enviaron correcciones para actualizar' });
    }

    const existingIshikawa = await Ishikawa.findById(id);
    if (!existingIshikawa) {
      return res.status(404).json({ error: 'Ishikawa no encontrado' });
    }

    existingIshikawa.correcciones = correcciones;
    const updatedIshikawa = await existingIshikawa.save();

    res.status(200).json({
      message: 'Ishikawa actualizado exitosamente',
      data: updatedIshikawa,
    });
  } catch (error) {
    console.error('Error al actualizar Ishikawa:', error);
    res.status(500).json({
      error: 'Ocurrió un error al actualizar el Ishikawa',
      details: error.message,
    });
  }
};

const ishikawaFinalizado = async (req, res) => {
  try {
    const { id } = req.params;
    const { correcciones: rawCorrecciones, estado } = req.body;

    const correcciones = normalizeCorrecciones(rawCorrecciones);

    if (!Array.isArray(correcciones) || correcciones.length === 0) {
      return res.status(400).json({ error: 'No se enviaron correcciones para actualizar' });
    }

    // ✅ Validación: evidencia ahora es array (puede estar vacío si tú lo permites)
    const isCorreccionValid = correcciones.every((c) =>
      c.actividad &&
      c.responsable &&
      c.fechaCompromiso &&
      c.cerrada !== undefined &&
      Array.isArray(c.evidencia) // 👈 antes era string/undefined
    );

    if (!isCorreccionValid) {
      return res.status(400).json({ error: 'Las correcciones contienen datos inválidos' });
    }

    const updatedIshikawa = await Ishikawa.findByIdAndUpdate(
      id,
      {
        $set: {
          correcciones,
          ...(estado && { estado }),
        },
      },
      { new: true }
    );

    if (!updatedIshikawa) {
      return res.status(404).json({ error: 'Ishikawa no encontrado' });
    }

    res.status(200).json({
      message: 'Ishikawa actualizado exitosamente',
      data: updatedIshikawa,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID inválido' });
    }
    console.error('Error al actualizar Ishikawa:', error);
    res.status(500).json({
      error: 'Ocurrió un error al actualizar el Ishikawa',
      details: error.message,
    });
  }
};

const enviarPDF = async (req, res) => {
  try {
      console.log("Correos electrónicos recibidos:", req.body.emails);
      console.log("Archivo recibido:", req.file);

      if (!req.body.emails || !req.file) {
          return res.status(400).json({ error: "Faltan datos (emails o archivo PDF no recibidos)" });
      }

      const emails = req.body.emails; // Ya es un array, no necesitas JSON.parse()
      const pdfBuffer = req.file.buffer;

      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USERNAME,
              pass: process.env.EMAIL_PASSWORD,
          },
      });

      const mailOptions = {
          from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
          to: emails, // Usar directamente el array
          subject: "Diagrama Ishikawa",
          text: "Adjunto encontrarás el diagrama Ishikawa en formato PDF.",
          attachments: [{
              filename: "diagrama_ishikawa.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
          }],
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error("Error al enviar el correo:", error);
              return res.status(500).json({ error: "Error al enviar el correo" });
          } else {
              console.log("Correo enviado:", info.response);
              res.status(200).json({ message: "Correo enviado exitosamente" });
          }
      });
  } catch (error) {
      console.error("Error en el servidor:", error);
      res.status(500).json({ error: error.message });
  }
};

const enviarPDFDos = async (req, res) => {
  try {
    const participantesStr = req.body.participantes;
    const pdfFile       = req.file;                      // multer single('file')
    const responsablesRaw = req.body.correoResponsable;

    if (!participantesStr || !pdfFile) {
      return res.status(400).json({ error: "Faltan datos (participantes o PDF)" });
    }

    // 1) Separamos por "/"
    const rawParts = participantesStr
      .split('/')
      .map(s => s.trim())
      .filter(s => s);

    // 2) Buscamos los correos de participantes
    const emailsParticipantes = [];
    for (let i = 0; i < rawParts.length; i++) {
      let nombre = rawParts[i];
      let user = await Usuarios.findOne({ Nombre: nombre });

      // si no existe y hay siguiente, probamos con la combinación "A / B"
      if (!user && i + 1 < rawParts.length) {
        const combinado = `${nombre} / ${rawParts[i + 1]}`;
        user = await Usuarios.findOne({ Nombre: combinado });
        if (user) {
          emailsParticipantes.push(user.Correo);
          i++; // saltamos el siguiente
          continue;
        }
      }

      if (user) {
        emailsParticipantes.push(user.Correo);
      } else {
        console.warn(`Usuario no encontrado en DB: "${nombre}"`);
      }
    }

    if (emailsParticipantes.length === 0) {
      return res.status(404).json({ error: "No se encontraron participantes válidos" });
    }

    // 3) Procesamos correosResponsable (puede venir como string o array)
    let emailsResponsables = [];
    if (responsablesRaw) {
      if (Array.isArray(responsablesRaw)) {
        emailsResponsables = responsablesRaw.filter(Boolean);
      } else {
        emailsResponsables = [responsablesRaw];
      }
    }

    // 4) Unimos ambos arrays y eliminamos duplicados
    const todosLosEmails = Array.from(
      new Set([ ...emailsParticipantes, ...emailsResponsables ])
    );

    // 5) Configuramos nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const templatePathAsignacion = path.join(__dirname, 'templates', 'pdf-aprobado.html');
    const emailTemplateAsignacion = fs.readFileSync(templatePathAsignacion, 'utf8');

    // 6) Preparamos el email con el PDF adjunto
    const mailOptions = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      to: todosLosEmails,  // ya sin duplicados
      subject: "Ishikawa Aprobado",
      html: emailTemplateAsignacion,
      attachments: [
        {
          filename: pdfFile.originalname || 'diagrama_ishikawa.pdf',
          content: pdfFile.buffer,
          contentType: 'application/pdf',
          cid: 'pdfIshikawa',
          contentDisposition: 'inline'
        },
        {
          filename: 'logoAguida.png',
          path: path.join(__dirname, '../assets/logoAguida-min.png'),
          cid: 'logoAguida'
        }
      ]
    };

    // 7) Enviamos
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error al enviar el correo:", err);
        return res.status(500).json({ error: "Error al enviar correo" });
      }
      console.log("Correo enviado:", info.response);
      res.status(200).json({ 
        message: "Correo enviado exitosamente", 
        enviadosA: todosLosEmails 
      });
    });

  } catch (error) {
    console.error("Error en enviarPDFDos:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controlador: actualizarAcceso
const actualizarAcceso = async (req, res) => {
  const { id } = req.params;
  const { acceso: accesosEmail = [] } = req.body;

  if (!Array.isArray(accesosEmail)) {
    return res.status(400).json({ message: 'El campo acceso debe ser un array' });
  }

  // Preparo la data que quiero guardar en DB
  const accesosParaDB = accesosEmail.map(a => ({
    nombre: a.nombre,
    correo: a.correo,
    nivelAcceso: Number(a.nivelAcceso)
  }));

  try {
    // 1) Obtengo el registro previo para comparar
    const ishikawaPrevio = await Ishikawa.findById(id).select('acceso problema');
    if (!ishikawaPrevio) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    const prevAccesos = ishikawaPrevio.acceso.map(a => ({ correo: a.correo, nivelAcceso: a.nivelAcceso }));
    const problema = ishikawaPrevio.problema;

    // 2) Reemplazo todo el array de acceso
    ishikawaPrevio.acceso = accesosParaDB;
    const ishikawaActualizado = await ishikawaPrevio.save();

    // 3) Comparo antiguos vs nuevos:
    // Usuarios nuevos: en accesosParaDB pero no en prevAccesos
    const nuevos = accesosParaDB.filter(a => !prevAccesos.some(o => o.correo === a.correo));
    // Usuarios que cambiaron nivel: en ambos pero con nivel distinto
    const nivelCambiado = accesosParaDB.filter(a => {
      const old = prevAccesos.find(o => o.correo === a.correo);
      return old && old.nivelAcceso !== a.nivelAcceso;
    });

    // Cargo plantilla de correo
    const templatePath = path.join(__dirname, 'templates', 'notificacion-acceso.html');
    const emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Función para enviar un correo personalizado
    const sendNotification = ({ nombre, correo, nivelAcceso }, motivo) => {
      const nivelTexto = nivelAcceso === 1 ? 'Solo Lectura' : 'Editor';
      let customized = emailTemplate
        .replace('{{usuario}}', nombre)
        .replace('{{problema}}', problema || '')
        .replace('{{nivelAcceso}}', nivelTexto)
        .replace('{{motivo}}', motivo);

      transporter.sendMail({
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: correo,
        subject: 'Notificación de acceso a Ishikawa',
        html: customized,
        attachments: [{
          filename: 'logoAguida.png',
          path: path.join(__dirname, '../assets/logoAguida-min.png'),
          cid: 'logoAguida'
        }]
      }, (err, info) => {
        if (err) console.error(`Error al enviar a ${correo}:`, err);
        else console.log(`Correo enviado a ${correo}:`, info.response);
      });
    };

    // 4) Envío correos solo a nuevos y a quienes subieron/bajaron nivel
    nuevos.forEach(acc => sendNotification(acc, 'te han otorgado acceso'));
    nivelCambiado.forEach(acc => sendNotification(acc, 'se ha modificado tu nivel de acceso'));

    return res.status(200).json({ message: 'Accesos sincronizados', ishikawa: ishikawaActualizado });
  } catch (error) {
    console.error('Error al actualizar el acceso:', error);
    return res.status(500).json({ message: 'Error interno', error: error.message });
  }
};

const deleteIshikawa = async (req, res) => {
  try {
      const { id } = req.params;

      const deletedDiagram = await Ishikawa.findByIdAndDelete(id);

      if (!deletedDiagram) {
          return res.status(404).json({ message: 'Diagrama no encontrado' });
      }

      res.json({ message: 'Diagrama eliminado correctamente' });
  } catch (error) {
      console.error('Error al eliminar el diagrama:', error);
      res.status(500).json({ message: 'Error al eliminar el diagrama' });
  }
};

const getActivitiesByUsername = async (req, res) => { 
  try {
    // Obtenemos el parámetro "username" de la URL (por ejemplo: /activities/:username)
    const username = req.params.username;

    // Buscamos todos los documentos que tengan al menos una actividad
    // cuyo responsable contenga el nombre buscado
    const ishikawas = await Ishikawa.find({ 
      'actividades.responsable.nombre': username, estado: 'Aprobado' });

    // Array para acumular las actividades que cumplan la condición
    let actividadesFiltradas = [];

    // Recorremos cada documento encontrado
    ishikawas.forEach(doc => {
      // Recorremos el arreglo de actividades del documento
      doc.actividades.forEach(actividad => {
        // Verificamos si en el arreglo de responsables alguno tiene el nombre igual a "username"
        const responsableEncontrado = actividad.responsable.find(r => r.nombre === username);
        if (responsableEncontrado) {
          // Agregamos la actividad, fecha de compromiso, id del ishikawa y id de la actividad al array de resultados
          actividadesFiltradas.push({
            proName: doc.proName,
            idRep: doc.idRep,
            idReq: doc.idReq,
            ishikawaId: doc._id,
            actividadId: actividad._id,
            actividad: actividad.actividad,
            fechaCompromiso: actividad.fechaCompromiso,
            concluido: actividad.concluido,
            tipo: doc.tipo
          });
        }
      });
    });

    // Devolvemos el resultado en formato JSON
    return res.json(actividadesFiltradas);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    return res.status(500).json({ error: error.message });
  }
};

const updateConcluido = async (req, res) => {
  try {
    console.log(req.body);
    const { ishikawaId, actividadId, actividad, user, concluido } = req.body;

    const result = await Ishikawa.updateOne(
      { _id: ishikawaId, "actividades._id": actividadId },
      { $set: { "actividades.$.concluido": concluido } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'No se encontró la actividad especificada.' });
    }

    const templatePath = path.join(__dirname, 'templates', 'notificacion-actividad.html');
    const emailTemplate = fs.readFileSync(templatePath, 'utf8');

    const customizedTemplate = emailTemplate
        .replace('{{usuario}}', user)
        .replace('{{actividad}}', actividad);

    const mailOptions = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      to: process.env.EMAIL_ADMIN,
      subject: "Actualización de actividad: Estado Concluido modificado",
      html: customizedTemplate,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida'
          }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`Error al enviar el correo al administrador:`, error);
      } else {
        console.log(`Correo enviado exitosamente al administrador: ${process.env.EMAIL_ADMIN}`, info.response);
      }
    });

    res.json({ message: 'Estado "concluido" actualizado correctamente.', result });
  } catch (error) {
    console.error("Error al actualizar 'concluido':", error);
    res.status(500).json({ error: error.message });
  }
};

const reasignarIshikawa = async (req, res) => {
  try {
    const { id } = req.params;
    const { auditado: newAuditado, correo: newCorreo } = req.body;

    // 1. Recuperar datos previos
    const existing = await Ishikawa.findById(id);
    if (!existing) {
      return res.status(404).json({ msg: 'Registro no encontrado' });
    }
    const oldAuditado = existing.auditado;
    const oldCorreo = existing.correo;
    const proName = existing.proName;

    // 2. Actualizar y guardar
    existing.auditado = newAuditado;
    existing.correo = newCorreo;
    const actualizado = await existing.save();

    /*** ENVÍO AL NUEVO AUDITADO ***/
    const tplAsignPath = path.join(__dirname, 'templates', 'asignacion-ishikawa.html');
    const tplAsign = fs.readFileSync(tplAsignPath, 'utf8');
    const htmlAsign = tplAsign
      .replace('{{usuario}}', newAuditado)
      .replace('{{programa}}', proName);

    const mailToNew = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      to: newCorreo,
      subject: 'Se te ha asignado un nuevo Ishikawa',
      html: htmlAsign,
      attachments: [{
        filename: 'logoAguida.png',
        path: path.join(__dirname, '../assets/logoAguida-min.png'),
        cid: 'logoAguida'
      }]
    };
    transporter.sendMail(mailToNew, (err, info) => {
      if (err) console.error('Error envío a nuevo auditado:', err);
      else console.log('Email enviado al nuevo auditado:', info.response);
    });

    /*** ENVÍO AL AUDITADO ANTERIOR ***/
    const tplOldPath = path.join(__dirname, 'templates', 'reasignacion-anterior.html');
    const tplOld = fs.readFileSync(tplOldPath, 'utf8');
    const htmlOld = tplOld
      .replace('{{usuarioAnterior}}', oldAuditado)
      .replace('{{usuarioNuevo}}', newAuditado)
      .replace('{{programa}}', proName);

    const mailToOld = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      to: oldCorreo,
      subject: 'Tu Ishikawa ha sido reasignado',
      html: htmlOld,
      attachments: [{
        filename: 'logoAguida.png',
        path: path.join(__dirname, '../assets/logoAguida-min.png'),
        cid: 'logoAguida'
      }]
    };
    transporter.sendMail(mailToOld, (err, info) => {
      if (err) console.error('Error envío a auditado anterior:', err);
      else console.log('Email enviado al auditado anterior:', info.response);
    });

    return res.json(actualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error del servidor' });
  }
};

  
  module.exports = {
    crearIshikawa,
    obtenerIshikawas,
    actualizarIshikawa,
    actualizarIshikawaCompleto,
    actualizarFechaCompromiso,
    obtenerIshikawasId,
    obtenerIshikawaPorDato,
    eliminarEvidencia,
    obtenerIshikawaVista,
    actualizarEstado,
    obtenerIshikawaEsp,
    obtenerIshikawaPorId,
    eliminarIshikawasPorIdRep,
    ishikawaFinalizado,
    enviarPDF,
    enviarPDFDos,
    actualizarAcceso,
    deleteIshikawa,
    obtenerIshikawaEspInc,
    getActivitiesByUsername,
    updateConcluido,
    obtenerIshikawaVacioEsp,
    getAccesosByIshikawa,
    crearIshikawa2,
    reasignarIshikawa
  };