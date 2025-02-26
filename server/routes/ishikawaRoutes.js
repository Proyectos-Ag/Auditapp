// routes/ishikawaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require("multer");
const ishikawaController = require('../controllers/ishikawaController');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', ishikawaController.crearIshikawa);
router.get('/', ishikawaController.obtenerIshikawas);
router.get('/ishesp', ishikawaController.obtenerIshikawaEsp);
router.get('/por/:_id', ishikawaController.obtenerIshikawasId);
router.get('/vac/por/:_id', ishikawaController.obtenerIshikawaPorId);
router.get('/por/vista/:nombre', ishikawaController.obtenerIshikawaVista);
router.get('/pordato/:_id', ishikawaController.obtenerIshikawaPorDato);
router.put('/fecha/:id', ishikawaController.actualizarFechaCompromiso);
router.put('/:id', ishikawaController.actualizarIshikawa);
router.put('/fin/:id', ishikawaController.ishikawaFinalizado);
router.put('/completo/:id', ishikawaController.actualizarIshikawaCompleto);
router.put('/acceso/:id', ishikawaController.actualizarAcceso);
router.put('/estado/:id', ishikawaController.actualizarEstado);
router.put('/eliminar-evidencia/:index/:idIsh/:idCorr', ishikawaController.eliminarEvidencia);
router.delete('/delete/:id', ishikawaController.deleteIshikawa);
router.delete('/eliminar/:idRep', ishikawaController.eliminarIshikawasPorIdRep);
router.post('/enviar-pdf', upload.single("pdf"), ishikawaController.enviarPDF);



module.exports = router;