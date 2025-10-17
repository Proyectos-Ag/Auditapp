const mongoose = require('mongoose');

const TemporaryGrantSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuarios', required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuarios', required: true },
  permisos: { type: String, enum: ['readonly'], default: 'readonly' },
  expiracion: { type: Date, required: true },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TemporaryGrant', TemporaryGrantSchema);
