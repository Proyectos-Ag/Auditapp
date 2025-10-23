module.exports = function(req, res, next) {
  try {
    // Allow auth and invitation-accept endpoints to run even if invitacionAuth set a readonly req.user.
    // These endpoints need to be callable to sign-in, refresh tokens, logout or create the temporary account.
    const method = req.method.toUpperCase();
    const path = (req.path || '').toString();
    if (method === 'POST') {
      // Allow login and any auth routes (refresh/logout) to proceed
      if (path === '/login' || path.startsWith('/auth')) return next();
      // Allow invitation accept endpoint to create the temporary account
      if (path.startsWith('/invitacion/consume') && path.includes('/accept')) return next();
    }
    // If req.user indicates readonly permissions, block non-GET methods
    // Block when explicit permisos === 'readonly' OR when TipoUsuario is 'invitado'
    if (req.user && (req.user.permisos === 'readonly' || (req.user.tipoUsuario || req.user.TipoUsuario) === 'invitado')) {
      const method = req.method.toUpperCase();
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        return res.status(403).json({ error: 'Acceso de solo lectura: operación no permitida' });
      }
    }
    return next();
  } catch (err) {
    console.error('readonlyBlock error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};
