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
  actualizarAccionCorrectiva // Nueva función
} = require("../controllers/ObjetivoController");

// GET /api/objetivos?area=INGENIERIA
router.get("/", obtenerObjetivos);


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