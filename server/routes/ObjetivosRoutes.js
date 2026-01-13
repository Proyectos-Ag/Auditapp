const express = require("express");
const transporter = require('../emailconfig');
const router = express.Router();
const {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea,
  reprogramarFechaCompromiso,
  actualizarAccionCorrectiva,
  migrarTodosLosObjetivos
} = require("../controllers/ObjetivoController");

// GET /api/objetivos?area=INGENIERIA
router.get("/", obtenerObjetivos);

// NUEVA RUTA: Forzar actualización de año manualmente
router.post("/actualizar-año", async (req, res) => {
  try {
    await verificarYActualizarAño();
    res.json({ message: "Año actualizado correctamente para todos los objetivos" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar año" });
  }
});

// NUEVA RUTA: Obtener historial de un objetivo por año
router.get("/:id/historial/:año", async (req, res) => {
  try {
    const Objetivo = require("../models/ObjetivoModel");
    const objetivo = await Objetivo.findById(req.params.id);
    
    if (!objetivo) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    
    const año = parseInt(req.params.año);
    const historial = objetivo.historialAnual.find(h => h.año === año);
    
    if (!historial) {
      return res.status(404).json({ error: "No hay datos para ese año" });
    }
    
    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

router.get('/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      to: 'fredyesparza08@gmail.com',
      subject: 'Prueba de correo',
      html: '<h1>¡Este es un correo de prueba!</h1>'
    });
    res.send('Correo enviado correctamente');
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).send('Error al enviar correo');
  }
});

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

// PUT /api/objetivos/acciones/:id
router.put("/acciones/:id", actualizarAccionCorrectiva);

module.exports = router;