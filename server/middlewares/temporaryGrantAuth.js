const TemporaryGrant = require('../models/temporaryGrantSchema');

module.exports = async function(req, res, next) {
  try {
    // only applies when there is an authenticated user
    if (!req.user || !req.user.userId) return next();

    // find any active grants for this user that haven't expired
    const now = new Date();
    const grant = await TemporaryGrant.findOne({ usuario: req.user.userId, activo: true, expiracion: { $gt: now } });
    if (!grant) return next();

    // attach temporary permissions
    req.user.permisos = grant.permisos;
  // override tipoUsuario temporarily so server-side role checks allow admin views
  req.user.originalTipoUsuario = req.user.tipoUsuario || null;
  req.user.tipoUsuario = 'administrador';
  // set flag so frontend can detect temporary readonly access
  req.user.temporaryGrant = { id: grant._id, permisos: grant.permisos, expiracion: grant.expiracion };

    return next();
  } catch (err) {
    console.error('temporaryGrantAuth error:', err);
    return next();
  }
};
