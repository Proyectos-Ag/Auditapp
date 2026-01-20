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

// Subdocumento para objetivos específicos por departamento
const ObjetivoEspecificoSchema = new mongoose.Schema({
  departamento: { type: String, required: true },
  area: { type: String, required: true }, // ✅ AGREGADO: Campo area
  objetivo: { type: String, required: true },
  recursos: { type: String, default: "" },
  metaFrecuencia: { type: String, default: "" },
  
  // Campos de indicadores por semana
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
  
  // Historial por departamento
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

const ObjetivoSchema = new mongoose.Schema({
  // Paso 1: Nombre del objetivo general
  nombreObjetivoGeneral: { type: String, required: true },
  
  // Paso 2: Departamentos que pueden ver este objetivo
  departamentosAsignados: [{ type: String, required: true }],
  
  // Paso 3: Objetivos específicos por departamento/area
  objetivosEspecificos: [ObjetivoEspecificoSchema],
  
  // Información general
  creadoPor: {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nombre: { type: String },
    fecha: { type: Date, default: Date.now }
  },
  
  // Año actual (se sincroniza entre todos los objetivos específicos)
  añoActual: { type: Number, default: () => new Date().getFullYear() },
  
  // Estado del objetivo
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
  
  // ✅ AGREGADO: Campo area para compatibilidad con sistema anterior
  area: { type: String }
});

// Middleware para actualizar fecha de actualización
ObjetivoSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

// Middleware para sincronizar año entre objetivos específicos
ObjetivoSchema.pre('save', function(next) {
  const añoActualSistema = new Date().getFullYear();
  
  // Si el año cambió, actualizar todos los objetivos específicos
  if (this.añoActual < añoActualSistema) {
    this.objetivosEspecificos.forEach(objetivo => {
      // Archivar datos del año anterior
      if (!objetivo.historialAnual) {
        objetivo.historialAnual = [];
      }
      
      objetivo.historialAnual.push({
        año: this.añoActual,
        indicadores: {
          indicadorENEABR: objetivo.indicadorENEABR,
          indicadorFEB: objetivo.indicadorFEB,
          indicadorMAR: objetivo.indicadorMAR,
          indicadorABR: objetivo.indicadorABR,
          indicadorMAYOAGO: objetivo.indicadorMAYOAGO,
          indicadorJUN: objetivo.indicadorJUN,
          indicadorJUL: objetivo.indicadorJUL,
          indicadorAGO: objetivo.indicadorAGO,
          indicadorSEPDIC: objetivo.indicadorSEPDIC,
          indicadorOCT: objetivo.indicadorOCT,
          indicadorNOV: objetivo.indicadorNOV,
          indicadorDIC: objetivo.indicadorDIC
        }
      });
      
      // Resetear todos los indicadores
      const camposIndicadores = [
        'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
        'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
        'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
      ];
      
      camposIndicadores.forEach(campo => {
        objetivo[campo] = { S1: "", S2: "", S3: "", S4: "", S5: "" };
      });
    });
    
    // Actualizar el año
    this.añoActual = añoActualSistema;
  }
  
  next();
});

module.exports = mongoose.model("Objetivo", ObjetivoSchema);