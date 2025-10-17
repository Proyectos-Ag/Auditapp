const Invitacion = require('../models/invitacionSchema');

// Middleware que valida un token de invitación y establece req.user con permisos readonly
// Se busca en: Authorization: Bearer INVITE_<token>  o query ?invite=<token>
module.exports = async function(req, res, next) {
  try {
    const auth = req.headers['authorization'];
    let token = null;

    if (auth && auth.startsWith('Bearer ')) {
      const val = auth.slice(7).trim();
      if (val.startsWith('INVITE_')) token = val.replace('INVITE_', '');
    }

    if (!token && req.query && req.query.invite) token = req.query.invite;

    if (!token) return next(); // No hay invitación, continuar normal

    const invit = await Invitacion.findOne({ token });
    if (!invit) return res.status(401).json({ error: 'Invitación inválida' });
    if (invit.expiracion < new Date()) return res.status(401).json({ error: 'Invitación expirada' });

    // If JWT auth already populated req.user (real user), do NOT override it.
    if (!req.user) {
      // Anexar un usuario de solo lectura
      req.user = {
        userId: null,
        correo: null,
        tipoUsuario: 'invitado',
        permisos: 'readonly',
        invitacionId: invit._id
      };
    }

    // Permitimos seguir con la petición, las rutas deberían respetar req.user.permisos
    return next();
  } catch (err) {
    console.error('Error en invitacionAuth:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};
