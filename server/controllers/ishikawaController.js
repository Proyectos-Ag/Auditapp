const Ishikawa = require('../models/ishikawaSchema');
const transporter = require('../emailconfig');
const path = require('path');
const fs = require('fs');

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
          from: process.env.EMAIL_USERNAME,
          to: correo,
          subject: 'Se te ha asignado un nuevo Ishikawa',
          html: customizedTemplateAsignacion,
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
      const usuario = req.body.usuario;

      // Leer y personalizar la plantilla
      const templatePathRevision = path.join(__dirname, 'templates', 'revision-ishikawa.html');
      const emailTemplateRevision = fs.readFileSync(templatePathRevision, 'utf8');
      const customizedTemplateRevision = emailTemplateRevision.replace('{{usuario}}', usuario);

      // Configuración del correo
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: 'rcruces@aguida.com',
        subject: 'Ishikawa enviado para revisión',
        html: customizedTemplateRevision,
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
    if (updatedIshikawa.estado === 'Rechazado') {
      const usuario = req.body.usuario;
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
        from: process.env.EMAIL_USERNAME,
        to: correo,
        subject: 'Ishikawa rechazado',
        html: customizedTemplateRechazado,
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
      const usuario = req.body.usuario;
      const programa = req.body.programa;
      const correo = req.body.correo;

      const templatePathAprobado = path.join(__dirname, 'templates', 'aprobado-ishikawa.html');
      const emailTemplateAprobado = fs.readFileSync(templatePathAprobado, 'utf8');
      const customizedTemplateAprobado = emailTemplateAprobado
      .replace('{{usuario}}', usuario)
      .replace('{{programa}}', programa);

      const mailOptionsAprobado = {
        from: process.env.EMAIL_USERNAME,
        to: correo,
        subject: 'Ishikawa aprobado',
        html: customizedTemplateAprobado,
      };

      transporter.sendMail(mailOptionsAprobado, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
    };

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
      const { id } = req.params;
      const { actividades } = req.body;
  
      const ishikawa = await Ishikawa.findById(id);
      if (!ishikawa) {
        return res.status(404).json({ error: 'Ishikawa not found' });
      }
  
      // Actualizar actividades
      const updatedActividades = actividades.map((actividad, index) => {
        if (ishikawa.actividades[index]) {
          return {
            ...ishikawa.actividades[index].toObject(),
            fechaCompromiso: [...ishikawa.actividades[index].fechaCompromiso, ...actividad.fechaCompromiso]
          };
        }
        return actividad;
      });
  
      ishikawa.actividades = updatedActividades;
      await ishikawa.save();
  
      res.status(200).json(ishikawa);
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

const obtenerIshikawaEsp = async (req, res) => {
  try {
    // Selecciona solo los campos que deseas incluir en la respuesta
    const ishikawas = await Ishikawa.find({ tipo: 'vacio' },'_id auditado fecha'); 

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
          correccion.evidencia
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
    ishikawaFinalizado
  };