const Usuarios = require('../models/usuarioSchema');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const iniciarSesion = async (req, res) => {
  const { Correo, Contraseña } = req.body;

  try {
    // Validar que se enviaron los datos
    if (!Correo || !Contraseña) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuarios.findOne({ Correo });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const esContraseñaCorrecta = await bcrypt.compare(Contraseña, usuario.Contraseña);
    if (!esContraseñaCorrecta) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Determinar tipo de usuario
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

    // Generar token JWT con validez de 8 horas
    const token = jwt.sign(
      { 
        userId: usuario._id,
        correo: usuario.Correo,
        tipoUsuario: usuario.TipoUsuario
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    // Configuración de cookie consistente
    const cookieOptions = {
      httpOnly: true,
      secure: true, // true porque usarás HTTPS
      sameSite: 'none', // 'none' es requerido para HTTPS con CORS
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
      path: '/'
    };

    // Establecer cookie
    res.cookie('token', token, cookieOptions);
    
    console.log('Login exitoso para:', usuario.Correo);
    console.log('Token generado y cookie establecida');
    
    // Responder con datos del usuario (sin enviar el token en el body)
    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
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
    console.error('Error en iniciarSesion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { iniciarSesion };