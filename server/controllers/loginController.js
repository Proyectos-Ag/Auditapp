const Usuarios = require('../models/usuarioSchema');
const bcrypt = require('bcrypt');

const iniciarSesion = async (req, res) => {
  const { Correo, Contraseña } = req.body;

  try {
    // Buscar el usuario por correo electrónico
    const usuario = await Usuarios.findOne({ Correo });

    // Verificar si el usuario existe
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si la contraseña es correcta
    const esContraseñaCorrecta = await bcrypt.compare(Contraseña, usuario.Contraseña);
    if (!esContraseñaCorrecta) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar el tipo de usuario
    const tipoUsuario = usuario.TipoUsuario;
    if (tipoUsuario === 'Administrador') {
      return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario, tipo: 'Administrador' });
    } else if (tipoUsuario === 'auditor') {
      return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario, tipo: 'auditor' });
    } else if (tipoUsuario === 'auditado') {
      return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario, tipo: 'auditado' });
    } else {
      return res.status(403).json({ error: 'No tienes permisos para acceder a esta aplicación' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  iniciarSesion
};
