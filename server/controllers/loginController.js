const Usuarios = require('../models/usuarioSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const iniciarSesion = async (req, res) => {
  try {
    const { Correo, Contraseña } = req.body || {};
    if (!Correo || !Contraseña) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    const usuario = await Usuarios.findOne({ Correo }).select('+Contraseña +Contrasena').lean();
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    const hash = usuario.Contraseña ?? usuario.Contrasena;
    const ok = await bcrypt.compare(Contraseña, hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: String(usuario._id), correo: usuario.Correo, tipoUsuario: usuario.TipoUsuario },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    const user = {
      id: String(usuario._id),
      email: usuario.Correo,
      nombre: usuario.Nombre,
      tipoUsuario: usuario.TipoUsuario,
      puesto: usuario.Puesto,
      departamento: usuario.Departamento,
      area: usuario.area,
      foto: usuario.Foto,
      // (si quieres compatibilidad con tus claves antiguas)
      Correo: usuario.Correo,
      Nombre: usuario.Nombre,
      TipoUsuario: usuario.TipoUsuario,
      Foto: usuario.Foto,
      ID: usuario._id,
    };

    return res.status(200).json({ success: true, token, user });
  } catch (e) {
    console.error('iniciarSesion error:', e);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


module.exports = { iniciarSesion };