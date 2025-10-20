const jwt = require('jsonwebtoken');

module.exports = function jwtAuth(req, _res, next) {
  try {
    if (req.user) return next();
    const a = req.headers.authorization || '';
    if (!a.startsWith('Bearer ')) { req.user = null; return next(); }

    const token = a.slice(7).trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    req.user = { userId: decoded.userId, correo: decoded.correo, tipoUsuario: decoded.tipoUsuario };
    return next();
  } catch {
    req.user = null;
    return next();
  }
};