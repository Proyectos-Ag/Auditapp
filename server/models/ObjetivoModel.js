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
  fichaCompromiso: { type: Date, required: true },
  responsable: {
    nombre: { type: String, required: true },
    email: { type: String, required: true }
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
  ultimaNotificacion: Date
}, { _id: true });

const ObjetivoSchema = new mongoose.Schema({
  area: { type: String, required: true },
  objetivo: { type: String, required: true },
  recursos: { type: String, default: "" },
  metaFrecuencia: { type: String, default: "" },
  
  // NUEVO: Campo para rastrear el año actual
  añoActual: { type: Number, default: () => new Date().getFullYear() },
  
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
  accionesCorrectivas: { type: [AccionCorrectivaSchema], default: [] },
  
  // NUEVO: Historial de años anteriores (opcional)
  historialAnual: [{
    año: Number,
    indicadores: {
      indicadorENEABR: SemanaSchema,
      indicadorFEB: SemanaSchema,
      indicadorMAR: SemanaSchema,
      indicadorABR: SemanaSchema,
      indicadorMAYOAGO: SemanaSchema,
      indicadorJUN: SemanaSchema,
      indicadorJUL: SemanaSchema,
      indicadorAGO: SemanaSchema,
      indicadorSEPDIC: SemanaSchema,
      indicadorOCT: SemanaSchema,
      indicadorNOV: SemanaSchema,
      indicadorDIC: SemanaSchema
    }
  }]
});

// Middleware para verificar y resetear año
ObjetivoSchema.pre('save', function(next) {
  const añoActualSistema = new Date().getFullYear();
  
  // Si el año cambió, archivar datos y resetear
  if (this.añoActual < añoActualSistema) {
    // Archivar datos del año anterior
    const datosAñoAnterior = {
      año: this.añoActual,
      indicadores: {
        indicadorENEABR: this.indicadorENEABR,
        indicadorFEB: this.indicadorFEB,
        indicadorMAR: this.indicadorMAR,
        indicadorABR: this.indicadorABR,
        indicadorMAYOAGO: this.indicadorMAYOAGO,
        indicadorJUN: this.indicadorJUN,
        indicadorJUL: this.indicadorJUL,
        indicadorAGO: this.indicadorAGO,
        indicadorSEPDIC: this.indicadorSEPDIC,
        indicadorOCT: this.indicadorOCT,
        indicadorNOV: this.indicadorNOV,
        indicadorDIC: this.indicadorDIC
      }
    };
    
    this.historialAnual.push(datosAñoAnterior);
    
    // Resetear todos los indicadores
    const camposIndicadores = [
      'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
      'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
      'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
    ];
    
    camposIndicadores.forEach(campo => {
      this[campo] = { S1: "", S2: "", S3: "", S4: "", S5: "" };
    });
    
    // Actualizar el año
    this.añoActual = añoActualSistema;
  }
  
  next();
});

module.exports = mongoose.model("Objetivo", ObjetivoSchema);