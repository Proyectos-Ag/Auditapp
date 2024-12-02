const express = require('express');
const router = express.Router();
const auditController = require('../controllers/programar-audiController');

// Ruta para obtener todas las auditorías
router.get('/audits', auditController.getAudits);

// Ruta para crear una nueva auditoría
router.post('/audits', auditController.createAudit);

// Ruta para actualizar el estado de realizada o programada
router.put('/audits/:id', auditController.updateAuditStatus);

module.exports = router;