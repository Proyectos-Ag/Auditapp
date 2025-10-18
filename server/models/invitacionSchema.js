const mongoose = require('mongoose');

const InvitacionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuarios', required: true },
  // Optional: associate this invitation with an existing user to grant temporary permissions
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuarios', required: false },
  // permisos describes what the invitation grants (e.g. readonly)
  permisos: { type: String, enum: ['readonly'], default: 'readonly' },
  expiracion: { type: Date, required: true },
  usado: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Invitacion', InvitacionSchema);
