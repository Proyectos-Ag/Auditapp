// models/ValidacionCambio.js
const mongoose = require("mongoose");

const ElementosSchema = new mongoose.Schema({
  queValidar: { type: String, default: "" },
  comoValidarlo: { type: String, default: "" },
  quienParticipa: { type: String, default: "" },
  cuandoCuantasVeces: { type: String, default: "" },
  riesgoInicial: { type: String, default: "" },
  queEsperamosResultado: { type: String, default: "" }
}, { _id: false });

const EvidenciaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, default: null },
  type: { type: String, default: null },
  size: { type: Number, default: null },      // bytes (opcional)
  provider: { type: String, default: null },  // 'firebase','local', etc.
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const ValidacionCambioSchema = new mongoose.Schema({
  gestionId: { type: mongoose.Schema.Types.ObjectId, ref: "Gestion", required: true },
  etapaProceso: { type: String },
  puntoValidar: { type: String },
  fechaValidacion: { type: Date },
  peligro: { type: String },
  medidaControl: { type: String },
  parametrosValoresLimite: { type: String },
  elementos: { type: ElementosSchema, default: () => ({}) },
  desarrolloValidacion: { type: String },
  evidencias: { type: [EvidenciaSchema], default: [] }, // <-- aquí cambiamos
  resultadosValidacion: { type: String },
  medidaControlInicial: { type: String },
  requiereCambio: { type: Boolean, default: false },
  requiereCambioDetalle: { type: String },
  observaciones: { type: String },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  estado: { type: String, enum: ['pendiente', 'completado'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model("ValidacionCambio", ValidacionCambioSchema);