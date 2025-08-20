const express = require('express');
const router = express.Router();
const gestionCambioController = require('../controllers/gestionCambioController');

// Ruta para crear un nuevo registro
router.post('/', gestionCambioController.crearGestionCambio);

// Ruta para obtener todos los registros
router.get('/', gestionCambioController.obtenerGestionCambios);

router.get('/resumen', gestionCambioController.obtenerResumenGestiones);

// Ruta para obtener un registro por ID
router.get('/:id', gestionCambioController.obtenerGestionPorId);

// Enviar (cambia estado a 'enviado' si pasa validación)
router.post('/:id/enviar', gestionCambioController.enviarGestionCambio);

// Ruta para actualizar un registro
router.put('/:id', gestionCambioController.actualizarGestionCambio);

// Ruta para eliminar un registro
router.delete('/:id', gestionCambioController.eliminarGestionCambio);

module.exports = router;