const mongoose = require("mongoose");

const SemanaSchema = new mongoose.Schema({
  S1: { type: String, default: "" },
  S2: { type: String, default: "" },
  S3: { type: String, default: "" },
  S4: { type: String, default: "" },
  S5: { type: String, default: "" }
});

const AccionCorrectivaSchema = new mongoose.Schema({
  fecha: { type: String, required: true },
  noObjetivo: { type: String, required: true },
  periodo: { type: String, required: true },
  acciones: { type: String, required: true },
  fichaCompromiso: { type: Date, required: true }, // Cambiado a Date
  responsable: {
    nombre: { type: String, required: true },
    email: { type: String, required: true } // Nuevo campo para notificaciones
  },
  efectividad: { type: String, required: true },
  observaciones: { type: String, required: true },
  historialFechas: { type: [String], default: [] },
  notificaciones: [{
    tipo: { type: String, enum: ['email', 'sistema'] },
    fecha: Date,
    mensaje: String,
    urgencia: { type: String, enum: ['media', 'inmediata'] }
  }],
  ultimaNotificacion: Date // Para evitar notificaciones duplicadas
}, { _id: true });

const ObjetivoSchema = new mongoose.Schema({
  area: { type: String, required: true },
  objetivo: { type: String, required: true },
  recursos: { type: String, default: "" },
  metaFrecuencia: { type: String, default: "" },
  indicadorENEABR: { type: SemanaSchema, default: () => ({}) },
  indicadorFEB: { type: SemanaSchema, default: () => ({}) },
  indicadorMAR: { type: SemanaSchema, default: () => ({}) },
  indicadorABR: { type: SemanaSchema, default: () => ({}) },
  indicadorMAYOAGO: { type: SemanaSchema, default: () => ({}) },
  indicadorJUN: { type: SemanaSchema, default: () => ({}) },
  indicadorJUL: { type: SemanaSchema, default: () => ({}) },
  indicadorAGO: { type: SemanaSchema, default: () => ({}) },
  indicadorSEPDIC: { type: SemanaSchema, default: () => ({}) },
  indicadorOCT: { type: SemanaSchema, default: () => ({}) },
  indicadorNOV: { type: SemanaSchema, default: () => ({}) },
  indicadorDIC: { type: SemanaSchema, default: () => ({}) },
  observaciones: { type: String, default: "" },
  accionesCorrectivas: { type: [AccionCorrectivaSchema], default: [] }
});

module.exports = mongoose.model("Objetivo", ObjetivoSchema);