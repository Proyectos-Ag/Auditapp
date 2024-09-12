const express = require('express');
const router = express.Router();
const Evaluacion = require('../models/EvaluacionesSchema');
const mongoose = require('mongoose');

// Ruta para crear una nueva evaluación
router.post('/', async (req, res) => {
  const { auditorId, cursos, conocimientosHabilidades, atributosCualidadesPersonales, experiencia, formacionProfesional, porcentajeTotal } = req.body;

  // Validaciones generales
  if (!auditorId || !Array.isArray(cursos) || !Array.isArray(conocimientosHabilidades) || !Array.isArray(atributosCualidadesPersonales) || !experiencia || !formacionProfesional) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  // Validación de ID del auditor
  if (!mongoose.Types.ObjectId.isValid(auditorId)) {
    return res.status(400).json({ message: 'ID de auditor inválido' });
  }

  // Validación de cursos
  cursos.forEach(curso => {
    if (typeof curso.nombreCurso !== 'string' || typeof curso.calificacion !== 'number' || typeof curso.aprobado !== 'boolean') {
      return res.status(400).json({ message: 'Datos de curso inválidos' });
    }
  });

  // Validación de conocimientos y habilidades
  conocimientosHabilidades.forEach(conocimiento => {
    if (typeof conocimiento.conocimiento !== 'string' || typeof conocimiento.puntuacion !== 'number' || conocimiento.puntuacion < 0 || conocimiento.puntuacion > 5) {
      return res.status(400).json({ message: 'Datos de conocimientos inválidos' });
    }
  });

  // Validación de atributos y cualidades personales
  atributosCualidadesPersonales.forEach(atributo => {
    if (typeof atributo.atributo !== 'string' || typeof atributo.puntuacion !== 'number' || atributo.puntuacion < 0 || atributo.puntuacion > 5) {
      return res.status(400).json({ message: 'Datos de atributos inválidos' });
    }
  });

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
      experiencia, // Se agrega el campo experiencia
      formacionProfesional, // Se agrega el campo formación profesional
      porcentajeTotal // Se recibe el porcentaje total calculado en el frontend
    });

    const evaluacionGuardada = await nuevaEvaluacion.save();
    res.status(201).json(evaluacionGuardada);
  } catch (error) {
    console.error('Error al guardar la evaluación:', error);
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

module.exports = router;
