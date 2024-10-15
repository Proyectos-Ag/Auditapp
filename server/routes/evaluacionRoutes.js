const express = require('express');
const router = express.Router();
const Evaluacion = require('../models/EvaluacionesSchema');
const mongoose = require('mongoose');

// Ruta para crear una nueva evaluación
router.post('/', async (req, res) => {
  console.log(req.body)
  const { auditorId, cursos, conocimientosHabilidades, atributosCualidadesPersonales, experiencia, formacionProfesional, porcentajeTotal, estado } = req.body;

  // Validaciones generales
  if (!auditorId || !Array.isArray(cursos) || !Array.isArray(conocimientosHabilidades) || !Array.isArray(atributosCualidadesPersonales) || !experiencia || !formacionProfesional) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  // Validación de ID del auditor
  if (!mongoose.Types.ObjectId.isValid(auditorId)) {
    return res.status(400).json({ message: 'ID de auditor inválido' });
  }

  // Validación de cursos
  for (const curso of cursos) {
    if (typeof curso.nombreCurso !== 'string' || typeof curso.calificacion !== 'number' || typeof curso.aprobado !== 'boolean') {
      return res.status(400).json({ message: 'Datos de curso inválidos' });
    }
  }

  // Validación de conocimientos y habilidades
  for (const conocimiento of conocimientosHabilidades) {
    if (
      typeof conocimiento.conocimiento !== 'string' ||
      (conocimiento.puntuacion !== '' && (typeof conocimiento.puntuacion !== 'number' || conocimiento.puntuacion < 0 || conocimiento.puntuacion > 5))
    ) {
      return res.status(400).json({ message: 'Datos de conocimientos inválidos' });
    }
  }  

  // Validación de atributos y cualidades personales
  for (const atributo of atributosCualidadesPersonales) {
    if (
      typeof atributo.atributo !== 'string' ||
      (atributo.puntuacion !== '' && (typeof atributo.puntuacion !== 'number' || atributo.puntuacion < 0 || atributo.puntuacion > 5))
    ) {
      return res.status(400).json({ message: 'Datos de atributos inválidos' });
    }
  }  

  // Validación de experiencia
  const { tiempoLaborando, equipoInocuidad, auditoriasInternas } = experiencia;
  if (
    typeof tiempoLaborando !== 'string' ||
    typeof equipoInocuidad !== 'boolean' ||
    typeof auditoriasInternas !== 'string'
  ) {
    return res.status(400).json({ message: 'Datos de experiencia inválidos' });
  }

  // Validación de formación profesional
  const { nivelEstudios, especialidad, puntuacion, comentarios } = formacionProfesional;
  if (
    typeof nivelEstudios !== 'string' ||
    typeof especialidad !== 'string' ||
    typeof puntuacion !== 'number' ||
    puntuacion < 0 || puntuacion > 5
  ) {
    return res.status(400).json({ message: 'Datos de formación profesional inválidos' });
  }

  try {
    const nuevaEvaluacion = new Evaluacion({
      auditorId,
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

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { cursos, conocimientosHabilidades, atributosCualidadesPersonales, experiencia, formacionProfesional, porcentajeTotal } = req.body;

  // Validaciones generales
  if (!Array.isArray(cursos) || !Array.isArray(conocimientosHabilidades) || !Array.isArray(atributosCualidadesPersonales) || !experiencia || !formacionProfesional) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  // Validación de ID de evaluación
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de evaluación inválido' });
  }

  try {
    // Actualizar la evaluación en la base de datos
    const evaluacionActualizada = await Evaluacion.findByIdAndUpdate(
      id,
      {
        cursos,
        conocimientosHabilidades,
        atributosCualidadesPersonales,
        experiencia,
        formacionProfesional,
        porcentajeTotal
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!evaluacionActualizada) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    res.status(200).json(evaluacionActualizada);
  } catch (error) {
    console.error('Error al actualizar la evaluación:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:auditorId', async (req, res) => {
  const { auditorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(auditorId)) {
    return res.status(400).json({ message: 'ID de auditor inválido' });
  }

  try {
    // No uses `new` para `ObjectId` aquí
    const evaluaciones = await Evaluacion.find({ auditorId: auditorId });

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


module.exports = router;
