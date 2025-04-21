const Ishikawa = require('../models/ishikawaSchema');
const transporter = require('../emailconfig');
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Configuracion multer para PDF
const storage = multer.memoryStorage(); // Almacenar el archivo en memoria
const upload = multer({ storage: storage });

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
      updatedIshikawa.estado === 'Rechazado' &&
      req.body.correo &&
      req.body.correo.trim() !== ''
    ) {
      const usuario = updatedIshikawa.auditado;
      const programa = req.body.programa;
      const correo = req.body.correo;
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
      const correo = req.body.correo;

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
        const { index, idIsh, idCorr } = req.params;

        // Buscar el documento Ishikawa por su _id
        const ishikawa = await Ishikawa.findById(idIsh);

        if (!ishikawa) {
            return res.status(404).json({ error: 'Ishikawa no encontrado' });
        }

        // Buscar la corrección dentro de ishikawa por su _id
        const correccion = ishikawa.correcciones.id(idCorr);

        if (!correccion) {
            return res.status(400).json({ error: 'Corrección no encontrada' });
        }

        // Eliminar la evidencia
        correccion.evidencia = ''; // O null, según tu preferencia

        // Guardar los cambios en la base de datos
        await ishikawa.save();

        res.status(200).json({ message: 'Evidencia eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    const ishikawas = await Ishikawa.find({ tipo: 'vacio' },'_id auditado fecha estado'); 

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
      const { id } = req.params; // Obtiene la ID desde los parámetros de la URL
      const correcciones = req.body; // Los datos enviados desde el frontend
      console.log(correcciones);

      if (!Array.isArray(correcciones) || correcciones.length === 0) {
          return res.status(400).json({ error: 'No se enviaron correcciones para actualizar' });
      }

      // Verifica que el Ishikawa exista antes de intentar actualizarlo
      const existingIshikawa = await Ishikawa.findById(id);
      if (!existingIshikawa) {
          return res.status(404).json({ error: 'Ishikawa no encontrado' });
      }

      // Actualiza las correcciones en el modelo
      existingIshikawa.correcciones = correcciones;

      // Guarda los cambios
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
      const { correcciones, estado } = req.body;

      if (!Array.isArray(correcciones) || correcciones.length === 0) {
          return res.status(400).json({ error: 'No se enviaron correcciones para actualizar' });
      }

      const isCorreccionValid = correcciones.every(correccion => 
          correccion.actividad && 
          correccion.responsable && 
          correccion.fechaCompromiso && 
          correccion.cerrada !== undefined && 
          (correccion.evidencia !== undefined)
      );

      if (!isCorreccionValid) {
          return res.status(400).json({ error: 'Las correcciones contienen datos inválidos' });
      }

      const updatedIshikawa = await Ishikawa.findByIdAndUpdate(
          id,
          { 
              $set: { 
                  correcciones, 
                  ...(estado && { estado }) 
              }
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

// Controlador: actualizarAcceso
const actualizarAcceso = async (req, res) => {
  const { id } = req.params;
  const { acceso: accesosEmail } = req.body;    // renombramos aquí

  console.log('Datos recibidos para acceso:', accesosEmail);

  if (!Array.isArray(accesosEmail)) {
    return res.status(400).json({ message: "El campo acceso debe ser un array" });
  }

  // Preparo lo que realmente voy a guardar en Mongo
  const accesosParaDB = accesosEmail.map(a => ({
    nombre:     a.nombre,
    correo:     a.correo,
    nivelAcceso:Number(a.nivelAcceso)
  }));

  try {
    const ishikawa = await Ishikawa.findByIdAndUpdate(
      id,
      { $push: { acceso: { $each: accesosParaDB } } },
      { new: true }
    );

    if (!ishikawa) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    // Cargo la plantilla de correo
    const templatePath   = path.join(__dirname, 'templates', 'notificacion-acceso.html');
    const emailTemplate  = fs.readFileSync(templatePath, 'utf8');

    // Envío un correo por cada acceso nuevo
    accesosEmail.forEach(({ nombre, correo, nivelAcceso, problema }) => {
      const nivelTexto = Number(nivelAcceso) === 1
        ? "Solo Lectura"
        : "Editor";

      const customized = emailTemplate
        .replace('{{usuario}}',     nombre)
        .replace('{{problema}}',    problema || '')
        .replace('{{nivelAcceso}}', nivelTexto);

      const mailOptions = {
        from:    `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to:      correo,
        subject: "Se te ha otorgado acceso a un Ishikawa",
        html:    customized,
        attachments: [{
          filename: 'logoAguida.png',
          path:     path.join(__dirname, '../assets/logoAguida-min.png'),
          cid:      'logoAguida'
        }]
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(`Error al enviar a ${correo}:`, err);
        else     console.log(`Correo enviado a ${correo}:`, info.response);
      });
    });

    return res
      .status(200)
      .json({ message: "Acceso actualizado y correos enviados", ishikawa });

  } catch (error) {
    console.error("Error al actualizar el acceso:", error);
    return res
      .status(500)
      .json({ message: "Error al actualizar", error: error.message });
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
    const ishikawas = await Ishikawa.find({ 'actividades.responsable.nombre': username });

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
            ishikawaId: doc._id,
            actividadId: actividad._id,
            actividad: actividad.actividad,
            fechaCompromiso: actividad.fechaCompromiso,
            concluido: actividad.concluido
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
    actualizarAcceso,
    deleteIshikawa,
    obtenerIshikawaEspInc,
    getActivitiesByUsername,
    updateConcluido
  };