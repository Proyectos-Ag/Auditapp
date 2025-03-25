const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    cliente: { type: String, required: true },
    fechaInicio: { type: String, required: true },
    fechaFin: { type: String, required: true },
    modalidad: { type: String, required: true },
    status: { type: String, enum: ['Realizada', 'Programada', 'Cancelada', 'Por Confirmar', 'En Curso'], required: true },
    realizada: { type: Boolean, default: false },
    programada: { type: Boolean, default: false }
});

module.exports = mongoose.model('Audit', auditSchema);
