const Datos = require('../models/datosSchema');

const express = require('express');
const router = express.Router();
const datosController = require('../controllers/datosController');

// Ruta para el registro
router.post('/', datosController.nuevoAuditoria);
router.get('/', datosController.obtenerTodosDatos);


module.exports = router;