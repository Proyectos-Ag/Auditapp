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
            datos.Estado = Estado;  // Actualiza el estado a "Devuelto"

            // Actualizar Estatus basado en PorcentajeTotal
            if (PorcentajeTotal === 100) {
                datos.Estatus = 'Bueno';
            } else if (PorcentajeTotal >= 90) {
                datos.Estatus = 'Bueno';
            } else if (PorcentajeTotal >= 80) {
                datos.Estatus = 'Aceptable';
            } else if (PorcentajeTotal >= 60) {
                datos.Estatus = 'No Aceptable';
            } else if (PorcentajeTotal < 60) {
                datos.Estatus = 'Crítico';
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

router.put('/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { Estado, Comentario, PorcentajeCump, PuntuacionObten, PuntuacionConf, Estatus, PorcentajeTotal} = req.body; 
    console.log(req.body);
    try {
        const datos = await Datos.findById(id);
        if (!datos) {
            return res.status(404).json({ error: 'Datos no encontrados' });
        }

        // Actualizar el estado, el comentario y el porcentaje de cumplimiento si están presentes
        datos.Estado = Estado;
        if (Comentario) {
            datos.Comentario = Comentario;
        }
        if (PorcentajeCump) {
            datos.PorcentajeCump = PorcentajeCump;
        }
        if (PuntuacionObten) {
            datos.PuntuacionObten = PuntuacionObten;
        }
        if (PuntuacionConf) {
            datos.PuntuacionConf = PuntuacionConf;
        }
        if (Estatus) {
            datos.Estatus = Estatus;
        }
        if (PorcentajeTotal) {
            datos.PorcentajeTotal = PorcentajeTotal;
        }

        await datos.save();
        res.status(200).json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});

router.post('/carga-masiva', async (req, res) => {
    const { overwrite } = req.query;
    let jsonData = req.body; // Asegúrate de que los datos estén en el cuerpo de la solicitud

    try {
        // Validación de que los datos sean un arreglo
        if (!Array.isArray(jsonData)) {
            return res.status(400).json({ error: 'Los datos proporcionados no son válidos. Se esperaba un arreglo de objetos.' });
        }

        // Asegúrate de que 'Programa' sea un array de objetos
        jsonData = jsonData.map(item => {
            if (typeof item.Programa === 'string') {
                item.Programa = JSON.parse(item.Programa);
            }
            return item;
        });

        // Validación de campos requeridos
        const requiredFields = ['TipoAuditoria', 'FechaInicio', 'FechaFin', 'Duracion', 'Departamento', 'AreasAudi', 'Auditados', 'AuditorLider', 'AuditorLiderEmail', 'Observador'];
        const missingFields = jsonData.filter(item => requiredFields.some(field => !item[field]));

        if (missingFields.length > 0) {
            console.error('Faltan campos requeridos:', missingFields);
            return res.status(400).json({ error: 'Por favor completa todos los campos requeridos en los datos del archivo' });
        }

        const existingData = await Datos.findOne({
            TipoAuditoria: jsonData[0].TipoAuditoria,
            FechaInicio: jsonData[0].FechaInicio,
            FechaFin: jsonData[0].FechaFin,
            Departamento: jsonData[0].Departamento
        });

        if (existingData && overwrite !== 'true') {
            return res.status(409).json({ message: 'Datos ya existen. ¿Desea sobrescribir?' });
        }

        if (existingData && overwrite === 'true') {
            await Datos.findByIdAndUpdate(existingData._id, jsonData[0]);
            return res.status(200).json({ success: true, message: 'Datos sobrescritos exitosamente' });
        }

        // Guardar los datos en la base de datos
        const savedData = await Datos.create(jsonData);
        console.log('Datos guardados en la base de datos:', savedData);

        res.status(200).json({ success: true, data: savedData });
    } catch (error) {
        console.error('Error al procesar la carga masiva:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
