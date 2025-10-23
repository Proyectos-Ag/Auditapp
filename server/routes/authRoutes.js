const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuarios = require('../models/usuarioSchema');
const TemporaryGrant = require('../models/temporaryGrantSchema');

function readBearer(req) {
  const a = req.headers.authorization || '';
  return a.startsWith('Bearer ') ? a.slice(7).trim() : null;
}

router.get('/verifyToken', async (req, res) => {
  try {
    const token = readBearer(req);
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    const usuario = await Usuarios
      .findById(decoded.userId)
      .select('Correo Nombre TipoUsuario Puesto Departamento area Foto')
      .lean();

    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    const grant = await TemporaryGrant.findOne({
      usuario: usuario._id, activo: true, expiracion: { $gt: new Date() }
    }).lean();

    const user = {
      id: String(usuario._id),
      email: usuario.Correo,
      nombre: usuario.Nombre,
      tipoUsuario: usuario.TipoUsuario,
      puesto: usuario.Puesto,
      departamento: usuario.Departamento,
      area: usuario.area,
      foto: usuario.Foto,
      // compat:
      Correo: usuario.Correo, Nombre: usuario.Nombre, TipoUsuario: usuario.TipoUsuario, Foto: usuario.Foto, ID: usuario._id,
    };

    if (grant) {
      user.temporaryGrant = { id: String(grant._id), permisos: grant.permisos, expiracion: grant.expiracion };
      user.tipoUsuario = 'administrador';
      user.TipoUsuario = 'administrador';
    }

    return res.status(200).json({ user });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Token inválido' });
    return res.status(401).json({ error: 'Error al verificar token' });
  }
});

// Opcionales ahora (sin cookies):
router.post('/logout', (_req, res) => res.json({ success: true }));
router.post('/refresh', (req, res) => res.status(501).json({ error: 'No implementado' }));

module.exports = router;