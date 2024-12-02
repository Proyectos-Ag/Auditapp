// routes/ishikawaRoutes.js
const express = require('express');
const router = express.Router();
const ishikawaController = require('../controllers/ishikawaController');

router.post('/', ishikawaController.crearIshikawa);
router.get('/', ishikawaController.obtenerIshikawas);
router.get('/ishesp', ishikawaController.obtenerIshikawaEsp);
router.get('/por/:_id', ishikawaController.obtenerIshikawasId);
router.get('/vac/por/:_id', ishikawaController.obtenerIshikawaPorId);
router.get('/por/vista/:nombre', ishikawaController.obtenerIshikawaVista);
router.get('/pordato/:_id', ishikawaController.obtenerIshikawaPorDato);
router.put('/fecha/:id', ishikawaController.actualizarFechaCompromiso);
router.put('/:id', ishikawaController.actualizarIshikawa);
router.put('/completo/:id', ishikawaController.actualizarIshikawaCompleto);
router.put('/estado/:id', ishikawaController.actualizarEstado);
router.put('/eliminar-evidencia/:index/:idIsh/:idCorr', ishikawaController.eliminarEvidencia);
router.delete('/eliminar/:idRep', ishikawaController.eliminarIshikawasPorIdRep);



module.exports = router;