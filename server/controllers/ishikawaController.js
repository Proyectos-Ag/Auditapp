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
      const ishikawas = await Ishikawa.find({ idRep: _id }, 'idRep idReq proName estado actividades');

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


const actualizarIshikawa = async (req, res) => {
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
  
  module.exports = {
    crearIshikawa,
    obtenerIshikawas,
    actualizarIshikawa,
    actualizarFechaCompromiso,
    obtenerIshikawasId
  };