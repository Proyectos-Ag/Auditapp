const express = require('express');
const router = express.Router();
const programasController = require('../controllers/programasController');
const upload = require('../middlewares/upload');

router.get('/', programasController.obtenerProgramas);
router.post('/', programasController.crearPrograma);
router.post('/carga-masiva', upload.single('file'), programasController.cargaMasiva);

module.exports = router;