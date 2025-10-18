const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuarios = require('../models/usuarioSchema');
const TemporaryGrant = require('../models/temporaryGrantSchema');
const dotenv = require('dotenv');

dotenv.config();

// Verificar el token JWT
router.get('/verifyToken', async (req, res) => {
  try {
    const token = req.cookies.token;

    console.log('Verificando token...');
    console.log('Cookies recibidas:', req.cookies);
    console.log('Token:', token ? 'Existe' : 'No existe');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);

    // Buscar usuario
    const usuario = await Usuarios.findById(decoded.userId);

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('Usuario encontrado:', usuario.Correo);

    // Responder con datos del usuario
    // Buscar grants activos para este usuario
    const now = new Date();
    const grant = await TemporaryGrant.findOne({ usuario: usuario._id, activo: true, expiracion: { $gt: now } });

    const responsePayload = {
      Correo: usuario.Correo,
      Nombre: usuario.Nombre,
      TipoUsuario: usuario.TipoUsuario,
      Puesto: usuario.Puesto,
      Departamento: usuario.Departamento,
      area: usuario.area,
      ID: usuario._id,
      Foto: usuario.Foto
    };

    if (grant) {
      // Indicar el grant y además sobreescribir temporalmente el rol
      responsePayload.temporaryGrant = { id: grant._id, permisos: grant.permisos, expiracion: grant.expiracion };
      // Para que la UI cargue igual que un administrador (pero en modo readonly),
      // sobreescribimos temporalmente TipoUsuario a 'administrador' en la respuesta.
      responsePayload.TipoUsuario = 'administrador';
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Error al verificar token:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    return res.status(401).json({ error: 'Error al verificar token' });
  }
});

// Cerrar sesión
router.post('/logout', (req, res) => {
  try {
    // Limpiar cookie con las mismas opciones con las que se creó
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    
    console.log('Sesión cerrada correctamente');
    
    return res.status(200).json({ 
      success: true,
      message: 'Sesión cerrada correctamente' 
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// Ruta para renovar token (opcional pero recomendada)
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuarios.findById(decoded.userId);

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Generar nuevo token
    const nuevoToken = jwt.sign(
      { 
        userId: usuario._id,
        correo: usuario.Correo,
        tipoUsuario: usuario.TipoUsuario
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    // Establecer nueva cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    };

    res.cookie('token', nuevoToken, cookieOptions);

    return res.status(200).json({ 
      success: true,
      message: 'Token renovado correctamente' 
    });
  } catch (err) {
    console.error('Error al renovar token:', err);
    return res.status(401).json({ error: 'Error al renovar token' });
  }
});

module.exports = router;