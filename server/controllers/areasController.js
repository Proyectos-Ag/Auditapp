const Areas = require('../models/areasSchema');

const obtenerAreas = async (req, res) => {
  try {
    const areas = await Areas.find();
    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const nuevaArea = async (req, res) => {
    try {
      const {
        NombreArea
      } = req.body;
  
      // Crear una nueva Auditoria
      const nuevaArea = new Areas({
        NombreArea
      });
  
      // Guardar los datos en la base de datos
      await nuevaArea.save();
  
      res.status(201).json({ message: 'Area generada exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

module.exports = {
  obtenerAreas,
  nuevaArea
};