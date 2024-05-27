const Datos = require('../models/datosSchema');

const express = require('express');
const router = express.Router();
const datosController = require('../controllers/datosController');

// Ruta para el registro
router.post('/', datosController.nuevoAuditoria);

module.exports = router;