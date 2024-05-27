const Usuarios = require('../models/usuarioSchema');

// Controlador para registrar un nuevo usuario
const registroUsuario = async (req, res) => {
  try {
    const nuevoUsuario = new Usuarios(req.body);
    await nuevoUsuario.save();
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuarios.find();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para obtener un usuario por su ID
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuarios.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para actualizar un usuario por su ID
const actualizarUsuario = async (req, res) => {
  try {
    const updates = req.body;
    // Convertir FormaParteEquipoInocuidad a booleano
    if (updates.FormaParteEquipoInocuidad !== undefined) {
      updates.FormaParteEquipoInocuidad = updates.FormaParteEquipoInocuidad === 'on' || updates.FormaParteEquipoInocuidad === true;
    }
    if (updates.PromedioEvaluacion !== undefined) {
      updates.Aprobado = updates.PromedioEvaluacion >= 80;
    }
    if (updates.calificaciones) {
      updates.calificaciones = updates.calificaciones.map(calificacion => ({
        nombreCurso: calificacion.nombreCurso,
        calificacion: calificacion.calificacion
      }));
    }

    const usuario = await Usuarios.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para eliminar un usuario por su ID
const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuarios.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  registroUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
};