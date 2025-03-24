const Usuarios = require('../models/usuarioSchema');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const iniciarSesion = async (req, res) => {
  const { Correo, Contraseña } = req.body;

  try {
    const usuario = await Usuarios.findOne({ Correo });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const esContraseñaCorrecta = await bcrypt.compare(Contraseña, usuario.Contraseña);
    if (!esContraseñaCorrecta) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    let tipoUsuario = '';
    switch (usuario.TipoUsuario) {
      case 'administrador':
        tipoUsuario = 'administrador';
        break;
      case 'auditor':
        tipoUsuario = 'auditor';
        break;
      case 'auditado':
        tipoUsuario = 'auditado';
        break;
      default:
        tipoUsuario = 'Desconocido';
        break;
    }

    // Generar el token JWT con una validez de 8 horas
    const token = jwt.sign({ userId: usuario._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    
    // Establecer el token en una cookie HttpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
    });
    
    return res.status(200).json({
      usuario: {
        Correo: usuario.Correo, 
        Nombre: usuario.Nombre, 
        TipoUsuario: tipoUsuario, 
        area: usuario.area, 
        Foto: usuario.Foto,
        Puesto: usuario.Puesto,
        Departamento: usuario.Departamento,
        ID: usuario._id
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { iniciarSesion };
