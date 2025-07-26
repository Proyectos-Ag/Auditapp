const GestionCambio = require('../models/gestionSchema');

// Crear un nuevo registro de gestión de cambio
const crearGestionCambio = async (req, res) => {
  try {
    const formData = req.body;
    const nuevaGestion = new GestionCambio(formData);
    await nuevaGestion.save();
    res.status(201).json(nuevaGestion);
  } catch (error) {
    console.error('Error al crear el registro:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

// Obtener todos los registros de gestión de cambios
const obtenerGestionCambios = async (req, res) => {
  try {
    const gestiones = await GestionCambio.find().sort({ fechaCreacion: -1 });
    res.status(200).json(gestiones);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un registro por ID
const obtenerGestionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const gestion = await GestionCambio.findById(id);
    if (!gestion) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.status(200).json(gestion);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar un registro
const actualizarGestionCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    
    const gestionActualizada = await GestionCambio.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true }
    );
    
    if (!gestionActualizada) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    
    res.status(200).json(gestionActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar un registro
const eliminarGestionCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const gestionEliminada = await GestionCambio.findByIdAndDelete(id);
    
    if (!gestionEliminada) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    
    res.status(200).json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearGestionCambio,
  obtenerGestionCambios,
  obtenerGestionPorId,
  actualizarGestionCambio,
  eliminarGestionCambio
};