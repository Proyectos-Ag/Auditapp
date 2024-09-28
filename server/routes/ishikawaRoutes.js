// routes/ishikawaRoutes.js
const express = require('express');
const router = express.Router();
const ishikawaController = require('../controllers/ishikawaController');

router.post('/', ishikawaController.crearIshikawa);
router.get('/', ishikawaController.obtenerIshikawas);
router.get('/por/:_id', ishikawaController.obtenerIshikawasId);
router.get('/por/vista/:nombre', ishikawaController.obtenerIshikawaVista);
router.get('/pordato/:_id', ishikawaController.obtenerIshikawaPorDato);
router.put('/fecha/:id', ishikawaController.actualizarFechaCompromiso);
router.put('/:id', ishikawaController.actualizarIshikawa);
router.put('/eliminar-evidencia/:index/:idIsh/:idCorr', ishikawaController.eliminarEvidencia);


module.exports = router;