const express = require('express');
const router = express.Router();
const Datos = require('../models/datosSchema');
const datosController = require('../controllers/datosController');

// Ruta para el registro
router.post('/', datosController.nuevoAuditoria);
router.get('/', datosController.obtenerTodosDatos);

// Ruta para actualizar datos existentes
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { programIdx, observaciones, percentage, PorcentajeTotal, Estado } = req.body;
    try {
        const datos = await Datos.findById(id);
        if (!datos) {
            return res.status(404).json({ error: 'Datos no encontrados' });
        }

        if (PorcentajeTotal !== undefined) {
            datos.PorcentajeTotal = PorcentajeTotal;
            datos.Estado = Estado;  // Actualiza el estado a "Realizada"

            // Actualizar Estatus basado en PorcentajeTotal
            if (PorcentajeTotal === 100) {
                datos.Estatus = 'Excelente';
            } else if (PorcentajeTotal >= 90) {
                datos.Estatus = 'Aceptable';
            } else if (PorcentajeTotal >= 80) {
                datos.Estatus = 'Poco aceptable';
            } else if (PorcentajeTotal < 80) {
                datos.Estatus = 'No aceptable';
            }

            // Actualizar FechaElaboracion con la fecha actual
            datos.FechaElaboracion = new Date().toISOString();
        } else {
            const programa = datos.Programa[programIdx];
            if (!programa) {
                return res.status(404).json({ error: 'Programa no encontrado' });
            }

            // Actualiza las observaciones
            observaciones.forEach((obs) => {
                const descripcion = programa.Descripcion.find((desc) => desc.ID === obs.ID);
                if (descripcion) {
                    descripcion.Criterio = obs.Criterio; // Agrega esta línea para actualizar el Criterio
                    descripcion.Observacion = obs.Observacion;
                    descripcion.Hallazgo = obs.Hallazgo;
                }
            });

            // Actualiza el porcentaje del programa
            programa.Porcentaje = percentage.toFixed(2);

            // Calcular el porcentaje total
            const totalPorcentaje = datos.Programa.reduce((acc, prog) => acc + parseFloat(prog.Porcentaje), 0);
            datos.PorcentajeTotal = (totalPorcentaje / datos.Programa.length).toFixed(2);
        }

        await datos.save();
        res.status(200).json({ message: 'Datos actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar los datos:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});

module.exports = router;
