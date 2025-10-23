const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Invitacion = require('../models/invitacionSchema');
const Usuarios = require('../models/usuarioSchema');
const TemporaryGrant = require('../models/temporaryGrantSchema');
const dotenv = require('dotenv');

dotenv.config();

// Generar una invitación (token) — debe ser usado por administradores
const generarInvitacion = async (req, res) => {
  try {
    // Verificar que el usuario autenticado sea administrador
    if (!req.user || req.user.tipoUsuario !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // body may include: targetUserId (optional) and durationHours (optional)
    const { targetUserId, durationHours } = req.body || {};

    // Generar token seguro
    const token = crypto.randomBytes(24).toString('hex');

    // Default: 8 hours if durationHours not provided
    const hrs = Number(durationHours) || 8;
    const expiracion = new Date(Date.now() + hrs * 60 * 60 * 1000);

    const invitObj = {
      token,
      creador: req.user.userId,
      permisos: 'readonly',
      expiracion
    };

    if (targetUserId) invitObj.targetUser = targetUserId;

    const nueva = new Invitacion(invitObj);
    await nueva.save();

    return res.status(201).json({ success: true, token, expiracion, targetUserId: targetUserId || null });
  } catch (err) {
    console.error('Error generarInvitacion:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// Validar invitación (no marcar como usada) — útil para cuando bots o previews hacen GET
const validarInvitacion = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const invit = await Invitacion.findOne({ token });
    if (!invit) return res.status(404).json({ error: 'Invitación no encontrada' });

    if (invit.usado) return res.status(410).json({ error: 'Invitación ya usada' });
    if (invit.expiracion < new Date()) return res.status(410).json({ error: 'Invitación expirada' });

    // generar una cuenta temporal sugerida (no creada todavía)
    const short = token.slice(0, 8);
    const previewEmail = `invite+${short}@invitado.local`;
    const previewName = `Invitado ${short}`;

    const result = { success: true, permisos: invit.permisos, expiracion: invit.expiracion, preview: { correo: previewEmail, nombre: previewName } };
    if (invit.targetUser) {
      // try to populate minimal info about the target user
      try {
        const tu = await Usuarios.findById(invit.targetUser).select('Nombre Correo');
        if (tu) result.targetUser = { _id: tu._id, Nombre: tu.Nombre, Correo: tu.Correo };
      } catch (e) {}
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error validarInvitacion:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// Aceptar invitación y emitir cookie JWT temporal readonly
const aceptarInvitacion = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const invit = await Invitacion.findOne({ token });
    if (!invit) return res.status(404).json({ error: 'Invitación no encontrada' });

    if (invit.usado) return res.status(410).json({ error: 'Invitación ya usada' });
    if (invit.expiracion < new Date()) return res.status(410).json({ error: 'Invitación expirada' });

    // If invitation targets an existing user, create a TemporaryGrant for that user
    if (invit.targetUser) {
      // mark invitation as used
      invit.usado = true;
      await invit.save();

      const grant = new TemporaryGrant({
        usuario: invit.targetUser,
        creador: invit.creador,
        permisos: invit.permisos,
        expiracion: invit.expiracion,
        activo: true
      });
      await grant.save();

      return res.status(200).json({ success: true, message: 'Permisos temporales otorgados', grantId: grant._id });
    }

    // Legacy behavior: create a temporary user account (when invitation had no targetUser)
    // Marcarla como usada
    invit.usado = true;
    await invit.save();
    // Crear una cuenta temporal en la colección Usuarios
    const short = token.slice(0, 8);
    const correoTemp = `invite+${short}@invitado.local`;
    const nombreTemp = `Invitado ${short}`;
    const contrasenaTemp = crypto.randomBytes(8).toString('hex');

    let usuario = await Usuarios.findOne({ Correo: correoTemp });
    if (!usuario) {
      usuario = new Usuarios({
        Nombre: nombreTemp,
        Correo: correoTemp,
        Contraseña: contrasenaTemp,
        TipoUsuario: 'invitado',
        area: 'Invitados'
      });
      await usuario.save();
    }

    // Generar un JWT con userId del usuario temporal
    const payload = {
      userId: usuario._id,
      correo: usuario.Correo,
      tipoUsuario: usuario.TipoUsuario,
      permisos: 'readonly'
    };

    const tokenJwt = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    };

    res.cookie('token', tokenJwt, cookieOptions);

    return res.status(200).json({ success: true, permisos: invit.permisos, usuario: { ID: usuario._id, Correo: usuario.Correo, Nombre: usuario.Nombre, TipoUsuario: usuario.TipoUsuario, Contrasena: contrasenaTemp } });
  } catch (err) {
    console.error('Error aceptarInvitacion:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// Admin endpoint: revoke a grant early
const revokeGrant = async (req, res) => {
  try {
    if (!req.user || req.user.tipoUsuario !== 'administrador') return res.status(403).json({ error: 'Acceso denegado' });
    const { grantId } = req.params;
    const grant = await TemporaryGrant.findById(grantId);
    if (!grant) return res.status(404).json({ error: 'Grant no encontrado' });
    grant.activo = false;
    await grant.save();
    return res.json({ success: true, message: 'Grant revocado' });
  } catch (err) {
    console.error('Error revokeGrant:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// List active grants (admin)
const listGrants = async (req, res) => {
  try {
    if (!req.user || req.user.tipoUsuario !== 'administrador') return res.status(403).json({ error: 'Acceso denegado' });
  const now = new Date();
  const grants = await TemporaryGrant.find({ activo: true, expiracion: { $gt: now } }).populate('usuario', 'Nombre Correo TipoUsuario').populate('creador', 'Nombre Correo');
    return res.json(grants);
  } catch (err) {
    console.error('Error listGrants:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { generarInvitacion, validarInvitacion, aceptarInvitacion, revokeGrant, listGrants };
