const express = require('express');
const router = express.Router();
const areasController = require('../controllers/areasController');

router.get('/', areasController.obtenerAreas);
router.post('/', areasController.nuevaArea);

module.exports = router;