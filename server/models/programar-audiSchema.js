const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    cliente: { type: String, required: true },
    fechaInicio: { type: String, required: true },
    fechaFin: { type: String, required: true },
    modalidad: { type: String, required: true },
    status: { type: String, enum: ['Realizada', 'Programada', 'No ejecutada', 'Por Confirmar', 'En Curso'], required: true },
    realizada: { type: Boolean, default: false },
    programada: { type: Boolean, default: false },
    // Nuevo campo para notas
    notas: { 
        type: String, 
        default: '',
        maxlength: 1000 // Limitar a 1000 caracteres
    }
}, {
    timestamps: true // Esto agregará createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Audit', auditSchema);
