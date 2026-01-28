const express = require("express");
const transporter = require('../emailconfig');
const router = express.Router();
const {
  obtenerObjetivos,
  obtenerObjetivoPorId,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea,
  reprogramarFechaCompromiso,
  actualizarAccionCorrectiva,
  obtenerObjetivosPorArea,
  crearObjetivoMultiDepartamento,
  obtenerObjetivosPorDepartamento,
  migrarTodosLosObjetivos,
  actualizarObjetivoEspecifico,
  actualizarIndicadorObjetivoEspecifico,
  obtenerObjetivosMultiPorArea,
  obtenerEstructuraJerarquica
} = require("../controllers/ObjetivoController");

// ✅ RUTAS EXISTENTES

// GET /api/objetivos?area=INGENIERIA - SOLO objetivos tradicionales
router.get("/", obtenerObjetivos);

// GET /api/objetivos/multi/area?area=PESADAS - Solo objetivos multi-departamento por área
router.get("/multi/area", obtenerObjetivosMultiPorArea);

// GET /api/objetivos/:id - Obtener objetivo por ID
router.get("/:id", obtenerObjetivoPorId);

// GET /api/objetivos/:id/estructura-jerarquica - Obtener estructura jerárquica
router.get("/:id/estructura-jerarquica", obtenerEstructuraJerarquica);

// GET /api/objetivos/acciones?area=INGENIERIA
router.get("/acciones", getAccionesCorrectivasByArea);

// GET /api/objetivos/area/:area
router.get("/area/:area", obtenerObjetivosPorArea);

// GET /api/objetivos/por-departamento?departamento=DEPARTAMENTO
router.get("/por-departamento", obtenerObjetivosPorDepartamento);

// POST /api/objetivos
router.post("/", crearObjetivo);

// POST /api/objetivos/multi-departamento
router.post("/multi-departamento", crearObjetivoMultiDepartamento);

// PUT /api/objetivos/:id
router.put("/:id", actualizarObjetivo);

// PUT /api/objetivos/multi/:objetivoId/objetivo-especifico - Actualizar objetivo específico
router.put("/multi/:objetivoId/objetivo-especifico", actualizarObjetivoEspecifico);

// PUT /api/objetivos/multi/:objetivoId/indicador - Actualizar indicador de objetivo específico
router.put("/multi/:objetivoId/indicador", actualizarIndicadorObjetivoEspecifico);

// DELETE /api/objetivos/:id
router.delete("/:id", eliminarObjetivo);

// POST /api/objetivos/:id/acciones-correctivas
router.post("/:id/acciones-correctivas", agregarAccionCorrectiva);

// PUT /api/objetivos/acciones/:id/reprogramar
router.put("/acciones/:id/reprogramar", reprogramarFechaCompromiso);

// PUT /api/objetivos/acciones/:id
router.put("/acciones/:id", actualizarAccionCorrectiva);

// ✅ RUTAS PARA MIGRACIÓN Y GESTIÓN

// POST /api/objetivos/migrar-año - Migrar todos los objetivos manualmente
router.post("/migrar-año", migrarTodosLosObjetivos);

// ✅ RUTA DE PRUEBA PARA EMAIL (opcional)
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

// ✅ RUTA PARA OBTENER HISTORIAL DE OBJETIVO POR AÑO
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

module.exports = router;