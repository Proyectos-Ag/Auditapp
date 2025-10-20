const Usuarios = require('../models/usuarioSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// === Helpers ===
const isIpOrLocalhost = (h) =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(h || '') || (h || '').includes('localhost');

function buildCookieOptions(req) {
  const opts = {
    httpOnly: true,
    secure: true,   
    sameSite: 'none',      
    path: '/',
    maxAge: 8 * 60 * 60 * 1000, // 8 horas
  };

  // Solo fija domain si sirves bajo un dominio (no IP/localhost)
  if (process.env.COOKIE_DOMAIN && !isIpOrLocalhost(req.hostname)) {
    opts.domain = process.env.COOKIE_DOMAIN; // p.ej. ".midominio.com"
  }

  return opts;
}

// === Login ===
const iniciarSesion = async (req, res) => {
  try {
    const { Correo, Contraseña } = req.body || {};
    if (!Correo || !Contraseña) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuarios.findOne({ Correo });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const ok = await bcrypt.compare(Contraseña, usuario.Contraseña);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token (8h)
    const payload = {
      userId: String(usuario._id),
      correo: usuario.Correo,
      tipoUsuario: usuario.TipoUsuario,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Establecer cookie de sesión coherente con cross-site
    res.cookie('token', token, buildCookieOptions(req));

    // Respuesta sin token en el body
    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      usuario: {
        Correo: usuario.Correo,
        Nombre: usuario.Nombre,
        TipoUsuario: usuario.TipoUsuario,    // usa el real del documento
        area: usuario.area,
        Foto: usuario.Foto,
        Puesto: usuario.Puesto,
        Departamento: usuario.Departamento,
        ID: usuario._id,
      },
    });
  } catch (error) {
    console.error('Error en iniciarSesion:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { iniciarSesion };