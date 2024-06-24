// routes/ishikawaRoutes.js
const express = require('express');
const router = express.Router();
const ishikawaController = require('../controllers/ishikawaController');

router.post('/', ishikawaController.crearIshikawa);
router.get('/', ishikawaController.obtenerIshikawas);

module.exports = router;