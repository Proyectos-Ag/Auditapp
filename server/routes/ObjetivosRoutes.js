const express = require("express");
const router = express.Router();
const {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea
} = require("../controllers/ObjetivoController");

// GET /api/objetivos?area=INGENIERIA
router.get("/", obtenerObjetivos);

router.get("/acciones", getAccionesCorrectivasByArea);

// POST /api/objetivos
router.post("/", crearObjetivo);

// PUT /api/objetivos/:id
router.put("/:id", actualizarObjetivo);

// DELETE /api/objetivos/:id
router.delete("/:id", eliminarObjetivo);

// POST /api/objetivos/:id/acciones-correctivas
router.post("/:id/acciones-correctivas", agregarAccionCorrectiva);

module.exports = router;