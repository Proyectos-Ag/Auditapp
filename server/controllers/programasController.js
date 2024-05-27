const Programas = require('../models/programaSchema');

const obtenerProgramas = async (req, res) => {
  try {
    const programas = await Programas.find();
    console.log(programas);
    res.status(200).json(programas);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const crearPrograma = async (req, res) => {
  try {
    const { Nombre, Descripcion } = req.body;
    const nuevoPrograma = new Programas({ Nombre, Descripcion });
    await nuevoPrograma.save();
    res.status(201).json(nuevoPrograma);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const nuevoPrograma = async (req, res) => {
  try {
    const {
      Nombre,
      Descripcion
    } = req.body;

    // Crear una nueva Auditoria
    const nuevaPrograma = new Datos({
      Nombre,
      Descripcion
    });

    await nuevaPrograma.save();

    res.status(201).json({ message: 'Programa generado exitosamente' });
  } catch (error) {
    console.error('Error al generar programa:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación', details: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
};

module.exports = {
  obtenerProgramas,
  crearPrograma
};