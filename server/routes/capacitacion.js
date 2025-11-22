// routes/capacitacion.js
const express = require('express');
const router = express.Router();
const { getEmpleadoCapacitacionByNombre, mapearCursosCapacitacion, connectToDatabase } = require('../config/dbconfig');
const EmpleadoCapacitacionSchema = require('../models/EmpleadoCapacitacionSchema');

// Ruta para obtener empleado por nombre desde BDCAPACITACION
router.get('/empleado/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    const nombreDecoded = decodeURIComponent(nombre);
    
    console.log('🔍 Buscando empleado en capacitación:', nombreDecoded);

    if (!nombreDecoded) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const empleado = await getEmpleadoCapacitacionByNombre(nombreDecoded);
    
    if (!empleado) {
      return res.status(404).json({ 
        error: 'Empleado no encontrado en base de datos de capacitación',
        nombreBuscado: nombreDecoded
      });
    }

    // Mapear cursos al formato de evaluación
    const cursosMapeados = mapearCursosCapacitacion(empleado.cursos);

    res.json({
      empleado: {
        nombre: empleado.nombre,
        departamento: empleado.departamento,
        puesto: empleado.puesto,
        escolaridad: empleado.escolaridad,
        fechaIngreso: empleado.fechaIngreso,
        antiguedad: empleado.antiguedad
      },
      cursos: empleado.cursos,
      cursosMapeados: cursosMapeados,
      totalCursos: empleado.cursos ? empleado.cursos.length : 0,
      cursosCompletados: empleado.cursos ? empleado.cursos.filter(c => c.status === 'completado').length : 0
    });

  } catch (error) {
    console.error('❌ Error en ruta de capacitación:', error);
    res.status(500).json({ 
      error: 'Error al obtener información de capacitación',
      detalle: error.message 
    });
  }
});

// Ruta para buscar empleados por coincidencia de nombre
router.get('/empleados/buscar/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const queryDecoded = decodeURIComponent(query);
    
    console.log('🔍 Buscando empleados con query:', queryDecoded);

    if (!queryDecoded || queryDecoded.length < 3) {
      return res.status(400).json({ error: 'Query debe tener al menos 3 caracteres' });
    }

    const connection = await connectToDatabase('BDCAPACITACION');
    const EmpleadoCapacitacion = connection.model('Empleado', EmpleadoCapacitacionSchema);
    
    const empleados = await EmpleadoCapacitacion.find({
      nombre: new RegExp(queryDecoded, 'i')
    }, 'nombre departamento puesto clave')
    .limit(10)
    .lean();

    console.log(`✅ Encontrados ${empleados.length} empleados`);

    res.json(empleados);

  } catch (error) {
    console.error('❌ Error buscando empleados:', error);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

// Ruta de prueba para verificar que la conexión funciona
router.get('/test', async (req, res) => {
  try {
    const connection = await connectToDatabase('BDCAPACITACION');
    const EmpleadoCapacitacion = connection.model('Empleado', EmpleadoCapacitacionSchema);
    
    const count = await EmpleadoCapacitacion.countDocuments();
    
    res.json({ 
      message: '✅ Conexión a BDCAPACITACION exitosa',
      totalEmpleados: count
    });
  } catch (error) {
    console.error('❌ Error en test de conexión:', error);
    res.status(500).json({ error: 'Error de conexión', detalle: error.message });
  }
});

module.exports = router;