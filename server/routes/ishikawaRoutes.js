// routes/ishikawaRoutes.js
const express = require('express');
const router = express.Router();
const ishikawaController = require('../controllers/ishikawaController');

router.post('/', ishikawaController.crearIshikawa);
router.get('/', ishikawaController.obtenerIshikawas);
router.get('/por/:_id', ishikawaController.obtenerIshikawasId);
router.get('/pordato/:_id', ishikawaController.obtenerIshikawaPorDato);
router.put('/fecha/:id', ishikawaController.actualizarFechaCompromiso);
router.put('/:id', ishikawaController.actualizarIshikawa);
router.put('/eliminar-evidencia/:id/:index', ishikawaController.eliminarEvidencia);


module.exports = router;