// routes/signatureRoutes.js
const express = require('express');
const router = express.Router();

// Temporalmente guardaremos en memoria:
const sessions = {};

// Recibe la firma desde el móvil
router.post('/', (req, res) => {
  const { session, role, dataURL } = req.body;
  if (!session || !dataURL) return res.status(400).json({ error: 'Falta session o dataURL' });
  // Guardamos bajo esa sesión
  sessions[session] = sessions[session] || {};
  sessions[session][role] = dataURL;
  return res.json({ ok: true });
});

// El popup hará polling a esta ruta
router.get('/:session', (req, res) => {
  const { session } = req.params;
  const data = sessions[session];
  if (!data) return res.status(404).json({ error: 'Firma no encontrada aún' });
  return res.json({ dataURL: data }); // devolvemos todo el objeto de firmas (o sólo el rol)
});

module.exports = router;
