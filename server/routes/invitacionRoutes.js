const express = require('express');
const router = express.Router();
const { generarInvitacion, validarInvitacion, aceptarInvitacion, revokeGrant, listGrants } = require('../controllers/invitacionController');
const jwtAuth = require('../middlewares/jwtAuth');
const invitacionAuth = require('../middlewares/invitacionAuth');

// Endpoint para que administradores generen invitaciones (requiere JWT de administrador)
router.post('/generar', jwtAuth, generarInvitacion);

// Endpoint público para validar (GET) y aceptar (POST) una invitación
router.get('/consume/:token', validarInvitacion);
router.post('/consume/:token/accept', aceptarInvitacion);

// Admin endpoints to manage grants
router.get('/grants', jwtAuth, listGrants);
router.post('/grants/:grantId/revoke', jwtAuth, revokeGrant);

module.exports = router;
