const express = require("express");
const router = express.Router();
const {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea,
  reprogramarFechaCompromiso // Nueva función
} = require("../controllers/ObjetivoController");

// GET /api/objetivos?area=INGENIERIA
router.get("/", obtenerObjetivos);

// GET /api/objetivos/acciones?area=INGENIERIA
router.get("/acciones", getAccionesCorrectivasByArea);

// POST /api/objetivos
router.post("/", crearObjetivo);

// PUT /api/objetivos/:id
router.put("/:id", actualizarObjetivo);

// DELETE /api/objetivos/:id
router.delete("/:id", eliminarObjetivo);

// POST /api/objetivos/:id/acciones-correctivas
router.post("/:id/acciones-correctivas", agregarAccionCorrectiva);

// PUT /api/objetivos/acciones/:id/reprogramar
router.put("/acciones/:id/reprogramar", reprogramarFechaCompromiso);

module.exports = router;