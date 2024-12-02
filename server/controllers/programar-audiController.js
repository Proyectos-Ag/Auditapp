const Audit = require('../models/programar-audiSchema');

// Obtener todas las auditorías
exports.getAudits = async (req, res) => {
    try {
        const audits = await Audit.find();
        res.status(200).json(audits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear una nueva auditoría
exports.createAudit = async (req, res) => {
    const { cliente, fecha, modalidad, status, realizada, programada } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!cliente || !fecha || !modalidad || !status) {
        return res.status(400).json({ message: "Por favor, completa todos los campos requeridos." });
    }

    try {
        const newAudit = new Audit({
            cliente,
            fecha,
            modalidad,
            status,
            realizada: realizada || false,
            programada: programada || false,
        });

        const savedAudit = await newAudit.save();
        res.status(201).json(savedAudit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar el estado de realizada o programada
exports.updateAuditStatus = async (req, res) => {
    const { id } = req.params;
    const { field, value } = req.body;

    try {
        const audit = await Audit.findById(id);
        if (!audit) return res.status(404).json({ message: "Auditoría no encontrada" });
        
        audit[field] = value;
        await audit.save();
        res.status(200).json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
