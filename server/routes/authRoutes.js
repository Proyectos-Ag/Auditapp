const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuarios = require('../models/usuarioSchema');
const dotenv = require('dotenv');

dotenv.config();

// verificar el token JWT
router.get('/verifyToken', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuarios.findById(decoded.userId);

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      Correo: usuario.Correo,
      Nombre: usuario.Nombre,
      TipoUsuario: usuario.TipoUsuario,
      Puesto: usuario.Puesto,
      Departamento: usuario.Departamento,
      area: usuario.area,
      ID: usuario.id,
      Foto: usuario.Foto
    });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;