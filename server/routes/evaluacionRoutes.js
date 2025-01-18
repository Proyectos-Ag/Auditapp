const express = require('express');
const router = express.Router();
const Evaluacion = require('../models/EvaluacionesSchema');
const mongoose = require('mongoose');

router.get('/eva-esp', async (req, res) => {
  try {
    // Buscar todas las evaluaciones y devolver solo los campos especificados
    const evaluaciones = await Evaluacion.find({},'folio auditoriaId nombre');
        // Devolver los registros encontrados con los campos especificados
    res.json(evaluaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar las evaluaciones.', error });
  }
});

// Ruta para crear una nueva evaluación
router.post('/', async (req, res) => {
  console.log(req.body)
  const { folio, auditoriaId, auditorId, nombre, cursos, conocimientosHabilidades, 
    atributosCualidadesPersonales, experiencia, formacionProfesional, porcentajeTotal, estado } = req.body;

  try {
    const nuevaEvaluacion = new Evaluacion({
      folio,
      auditoriaId,
      auditorId,
      nombre,
      cursos,
      conocimientosHabilidades,
      atributosCualidadesPersonales,
      experiencia,
      formacionProfesional,
      porcentajeTotal,
      estado
    });

    const evaluacionGuardada = await nuevaEvaluacion.save();
    res.status(201).json(evaluacionGuardada);
  } catch (error) {
    console.error('Error al guardar la evaluación:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/folio/:folio', async (req, res) => {
  const { folio } = req.params;
  const { cursos, conocimientosHabilidades, atributosCualidadesPersonales, 
    experiencia, formacionProfesional, porcentajeTotal, estado } = req.body;
  console.log('Payload recibido:', req.body);

  // Validaciones generales
  if (!Array.isArray(cursos) || !Array.isArray(conocimientosHabilidades) || !Array.isArray(atributosCualidadesPersonales) || !experiencia || !formacionProfesional) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  try {
    // Actualizar la evaluación en la base de datos usando el folio
    const evaluacionActualizada = await Evaluacion.findOneAndUpdate(
      { folio }, // Criterio de búsqueda
      {
        cursos,
        conocimientosHabilidades,
        atributosCualidadesPersonales,
        experiencia,
        formacionProfesional,
        porcentajeTotal, 
        estado
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!evaluacionActualizada) {
      return res.status(404).json({ message: 'Evaluación no encontrada con el folio proporcionado' });
    }

    res.status(200).json(evaluacionActualizada);
  } catch (error) {
    console.error('Error al actualizar la evaluación:', error);
    res.status(500).json({ message: error.message });
  }
});


router.get('/:folio', async (req, res) => {
  const { folio } = req.params;

  try {
    // No uses `new` para `ObjectId` aquí
    const evaluaciones = await Evaluacion.find({ folio: folio });

    if (evaluaciones.length === 0) {
      return res.status(404).json({ message: 'No se encontraron evaluaciones para este auditor' });
    }

    res.status(200).json(evaluaciones);
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ruta para obtener una evaluación con estado 'Incompleta' por auditor

router.get('/:auditorId/estado/incompleta', async (req, res) => {
  try {
    const { auditorId } = req.params;
    const evaluacion = await Evaluacion.findOne({ auditorId, estado: 'Incompleta' });
    if (!evaluacion) {
      return res.status(404).json({ message: 'No se encontró una evaluación incompleta.' });
    }
    res.json(evaluacion);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar la evaluación incompleta.', error });
  }
});

router.get('/', async (req, res) => {
  try {
    // Buscar todas las evaluaciones y devolver todos los campos
    const evaluaciones = await Evaluacion.find(); // Sin restricciones en los campos

    // Devolver todos los registros encontrados
    res.json(evaluaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar las evaluaciones.', error });
  }
});


module.exports = router;
