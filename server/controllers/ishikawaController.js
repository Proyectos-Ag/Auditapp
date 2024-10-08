const { upload } = require('../config/multer.js');

const uploadFile = require('../util/uploadFile'); 

// controllers/ishikawaController.js
const Ishikawa = require('../models/ishikawaSchema');


const crearIshikawa = async (req, res) => {
    try {
        const newIshikawa = new Ishikawa(req.body);
        console.log(req.body);
        await newIshikawa.save();
        res.status(201).json(newIshikawa);
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

const actualizarIshikawa = [
  upload.fields([{ name: 'imageSub' }]), // Aceptamos un campo llamado imageSub para las imágenes
  async (req, res) => { 
    console.log('Datos recibidos', req.body);
    try {
      const { id } = req.params;
      const evidencias = req.files.imageSub; // Accedemos a las imágenes que llegan bajo imageSub
      console.log('Contenido de imageSub:', evidencias);

      // Recuperar el documento actual de Ishikawa para preservar las imágenes existentes
      const currentIshikawa = await Ishikawa.findById(id);
      if (!currentIshikawa) {
        return res.status(404).json({ error: 'Ishikawa no encontrado' });
      }

      // Reconstruimos las correcciones desde el formato plano de req.body
      const correcciones = [];
      Object.keys(req.body).forEach(key => {
        const match = key.match(/correcciones\[(\d+)\]\.(\w+)/);
        if (match) {
          const index = parseInt(match[1], 10);
          const field = match[2];
          correcciones[index] = correcciones[index] || {};
          correcciones[index][field] = req.body[key];
        }
      });

      // Procesar imágenes si existen
      if (evidencias && evidencias.length > 0) {
        for (const [index, file] of evidencias.entries()) {
          const uploadedFile = await uploadFile(file); // Función que sube la imagen
          const downloadURL = uploadedFile.downloadURL; // URL devuelta de la imagen subida

          // Aseguramos que asignamos la imagen solo al índice correspondiente
          const match = file.originalname.match(/image_(\d+)\.png/); // Aseguramos que la imagen corresponde al índice correcto
          if (match) {
            const imageIndex = parseInt(match[1], 10);
            if (correcciones[imageIndex]) {
              correcciones[imageIndex].evidencia = downloadURL; // Asignamos la URL de la imagen
            }
          }
        }
      }

      // Mantener las imágenes existentes si no se envían nuevas
      currentIshikawa.correcciones.forEach((correccion, index) => {
        if (correccion.evidencia && (!correcciones[index] || !correcciones[index].evidencia)) {
          correcciones[index] = correcciones[index] || {};
          correcciones[index].evidencia = correccion.evidencia; // Preservar la imagen existente si no se recibe una nueva
        }
      });

      // Actualizar el documento Ishikawa
      const updatedIshikawa = await Ishikawa.findByIdAndUpdate(
        id,
        { $set: { correcciones } },
        { new: true }
      );

      if (!updatedIshikawa) {
        return res.status(404).json({ error: 'Ishikawa no encontrado' });
      }

      res.status(200).json(updatedIshikawa);
    } catch (error) {
      console.error('Error al actualizar Ishikawa:', error);
      res.status(400).json({ error: error.message });
    }
  }
];

const actualizarIshikawaCompleto = async (req, res) => {
  try {
      const { id } = req.params;
      console.log('Datos recibidos en el cuerpo de la solicitud:', req.body); 
      const updatedIshikawa = await Ishikawa.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedIshikawa) {
          return res.status(404).json({ error: 'Ishikawa not found' });
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
        const { nombre } = req.params;
        
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
    obtenerIshikawaPorId
  };