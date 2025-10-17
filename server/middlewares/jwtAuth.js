const jwt = require('jsonwebtoken');
const Usuarios = require('../models/usuarioSchema');
const dotenv = require('dotenv');

dotenv.config();

module.exports = async function(req, res, next) {
  try {
    // If already set by other middleware, skip
    if (req.user) return next();

    // Look for token in cookies
    const token = req.cookies?.token;
    if (!token) return next();

    // Verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info minimal (include permisos when present so readonlyBlock can act)
    req.user = {
      userId: decoded.userId,
      correo: decoded.correo,
      tipoUsuario: decoded.tipoUsuario,
      permisos: decoded.permisos || null
    };

    // Optionally fetch more user data if needed
    try {
      const usuario = await Usuarios.findById(decoded.userId).select('Correo Nombre TipoUsuario area Foto Puesto Departamento');
      if (usuario) req.user.profile = usuario;
    } catch (err) {
      // ignore profile enrichment errors
    }

    return next();
  } catch (err) {
    // If token invalid/expired, clear cookie and continue without user
    console.error('jwtAuth error:', err.message);
    try { res.clearCookie('token', { path: '/' }); } catch (e) {}
    return next();
  }
};
