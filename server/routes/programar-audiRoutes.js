const express = require('express');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();
const auditController = require('../controllers/programar-audiController');

// Ruta para obtener todas las auditorías
router.get('/audits', auditController.getAudits);

// Ruta para crear una nueva auditoría
router.post("/audits", auditController.createAudit);

router.post("/audits/send-email", upload.single("tablaImagen"), auditController.sendAuditEmail);

// Ruta para actualizar el estado de realizada o programada
router.put('/audits/:id', auditController.updateAuditStatus);

// Ruta para eliminar auditoría
router.delete('/audits/:id', auditController.deleteAudit);

// NUEVAS RUTAS PARA NOTAS
// Ruta para obtener las notas de una auditoría específica
router.get('/audits/:id/notas', auditController.getAuditNotes);

// Ruta para actualizar las notas de una auditoría específica
router.put('/audits/:id/notas', auditController.updateAuditNotes);

module.exports = router;
