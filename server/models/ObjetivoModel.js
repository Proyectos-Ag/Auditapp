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
  area: { type: String, required: true },
  objetivo: { type: String, required: true },
  recursos: { type: String, default: "" },
  metaFrecuencia: { type: String, default: "" },
  
  // Campos de indicadores por semana
  indicadorENEABR: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorFEB: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorMAR: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorABR: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorMAYOAGO: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorJUN: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorJUL: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorAGO: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorSEPDIC: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorOCT: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorNOV: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorDIC: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  
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
  // Para objetivos multi-departamento
  nombreObjetivoGeneral: { type: String },
  
  // Departamentos que pueden ver este objetivo
  departamentosAsignados: [{ type: String }],
  
  // Objetivos específicos por departamento/area
  objetivosEspecificos: [ObjetivoEspecificoSchema],
  
  // Para objetivos tradicionales
  area: { type: String },
  objetivo: { type: String },
  recursos: { type: String, default: "" },
  metaFrecuencia: { type: String, default: "" },
  
  // Campos de indicadores por semana (para objetivos tradicionales)
  indicadorENEABR: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorFEB: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorMAR: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorABR: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorMAYOAGO: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorJUN: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorJUL: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorAGO: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorSEPDIC: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorOCT: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorNOV: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  indicadorDIC: { type: SemanaSchema, default: () => ({ S1: "", S2: "", S3: "", S4: "", S5: "" }) },
  
  observaciones: { type: String, default: "" },
  accionesCorrectivas: { type: [AccionCorrectivaSchema], default: [] },
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
  }],
  
  // Información general
  creadoPor: {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nombre: { type: String },
    fecha: { type: Date, default: Date.now }
  },
  
  // Año actual
  añoActual: { type: Number, default: () => new Date().getFullYear() },
  
  // Estado del objetivo
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now }
});

// Middleware para actualizar fecha de actualización
ObjetivoSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

// Middleware CORREGIDO para manejar cambio de año
ObjetivoSchema.pre('save', function(next) {
  const añoActualSistema = new Date().getFullYear();
  
  // Solo procesar si el año cambió
  if (this.isNew || this.añoActual < añoActualSistema) {
    
    // Para objetivos tradicionales
    if (this.area && !this.nombreObjetivoGeneral) {
      // Verificar si tiene datos actuales
      const tieneDatosActuales = this.tieneDatosIndicadores();
      
      if (tieneDatosActuales && this.añoActual < añoActualSistema) {
        // Archivar datos del año anterior
        if (!this.historialAnual) {
          this.historialAnual = [];
        }
        
        this.historialAnual.push({
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
        });
        
        // Resetear indicadores solo si el año cambió
        if (this.añoActual < añoActualSistema) {
          this.resetearIndicadores();
        }
      }
    }
    
    // Para objetivos multi-departamento
    if (this.nombreObjetivoGeneral && this.objetivosEspecificos) {
      this.objetivosEspecificos.forEach(objetivo => {
        const tieneDatos = objetivo.tieneDatosIndicadores();
        
        if (tieneDatos && this.añoActual < añoActualSistema) {
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
          
          // Resetear indicadores solo si el año cambió
          if (this.añoActual < añoActualSistema) {
            objetivo.resetearIndicadores();
          }
        }
      });
    }
    
    // Actualizar el año
    if (this.añoActual < añoActualSistema) {
      this.añoActual = añoActualSistema;
    }
  }
  
  next();
});

// Método para verificar si tiene datos en los indicadores
ObjetivoSchema.methods.tieneDatosIndicadores = function() {
  const campos = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  for (const campo of campos) {
    if (this[campo]) {
      const semanas = ['S1', 'S2', 'S3', 'S4', 'S5'];
      for (const semana of semanas) {
        if (this[campo][semana] && this[campo][semana] !== "") {
          return true;
        }
      }
    }
  }
  return false;
};

// Método para resetear indicadores
ObjetivoSchema.methods.resetearIndicadores = function() {
  const camposIndicadores = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  camposIndicadores.forEach(campo => {
    this[campo] = { S1: "", S2: "", S3: "", S4: "", S5: "" };
  });
};

// Método para ObjetivoEspecificoSchema
ObjetivoEspecificoSchema.methods.tieneDatosIndicadores = function() {
  const campos = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  for (const campo of campos) {
    if (this[campo]) {
      const semanas = ['S1', 'S2', 'S3', 'S4', 'S5'];
      for (const semana of semanas) {
        if (this[campo][semana] && this[campo][semana] !== "") {
          return true;
        }
      }
    }
  }
  return false;
};

// Método para resetear indicadores de ObjetivoEspecificoSchema
ObjetivoEspecificoSchema.methods.resetearIndicadores = function() {
  const camposIndicadores = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  camposIndicadores.forEach(campo => {
    this[campo] = { S1: "", S2: "", S3: "", S4: "", S5: "" };
  });
};

module.exports = mongoose.model("Objetivo", ObjetivoSchema);