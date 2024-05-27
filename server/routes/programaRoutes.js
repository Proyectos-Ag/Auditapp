const express = require('express');
const router = express.Router();
const programasController = require('../controllers/programasController');

router.get('/', programasController.obtenerProgramas);
router.post('/', programasController.crearPrograma);

module.exports = router;