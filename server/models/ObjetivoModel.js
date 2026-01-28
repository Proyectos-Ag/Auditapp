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

// Subdocumento para objetivos detallados dentro de un módulo
const ObjetivoDetalladoSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  recursos: { type: String, default: "" },
  metaFrecuencia: { type: String, default: "" }
});

// Subdocumento para objetivos específicos por departamento - MODIFICADO
const ObjetivoEspecificoSchema = new mongoose.Schema({
  departamento: { type: String, required: true },
  area: { type: String, required: true },
  objetivoEspecifico: { type: String, default: "" }, // NUEVO: Nombre del módulo/objetivo específico
  objetivo: { type: String, required: true }, // Ahora es el objetivo detallado
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

// Schema para estructura jerárquica - CORREGIDO: objetivoEspecificoId como String
const EstructuraJerarquicaSchema = new mongoose.Schema({
  objetivosEspecificos: [{
    nombre: { type: String, required: true },
    descripcion: { type: String, default: "" },
    departamento: { type: String, required: true },
    area: { type: String, required: true },
    objetivosDetallados: [ObjetivoDetalladoSchema]
  }],
  objetivosDetalladosPorModulo: [{
    objetivoEspecificoId: { type: String }, // Cambiado de ObjectId a String
    objetivoEspecificoNombre: { type: String },
    cantidadObjetivosDetallados: { type: Number, default: 0 }
  }]
}, { _id: false });

const ObjetivoSchema = new mongoose.Schema({
  // Para objetivos multi-departamento
  nombreObjetivoGeneral: { type: String },
  
  // Departamentos que pueden ver este objetivo
  departamentosAsignados: [{ type: String }],
  
  // Objetivos específicos por departamento/area
  objetivosEspecificos: [ObjetivoEspecificoSchema],
  
  // NUEVO: Estructura jerárquica completa
  estructuraJerarquica: { type: EstructuraJerarquicaSchema },
  
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

// Método para generar resumen de estructura jerárquica
ObjetivoSchema.methods.generarResumenEstructura = function() {
  if (!this.estructuraJerarquica) {
    return {
      totalModulos: 0,
      totalObjetivosDetallados: 0,
      areasInvolucradas: [],
      resumenPorArea: {}
    };
  }
  
  const resumen = {
    totalModulos: this.estructuraJerarquica.objetivosEspecificos.length,
    totalObjetivosDetallados: this.estructuraJerarquica.objetivosEspecificos.reduce(
      (total, modulo) => total + (modulo.objetivosDetallados?.length || 0), 0
    ),
    areasInvolucradas: [...new Set(this.estructuraJerarquica.objetivosEspecificos.map(mod => mod.area))],
    resumenPorArea: {}
  };
  
  // Calcular resumen por área
  this.estructuraJerarquica.objetivosEspecificos.forEach(modulo => {
    if (!resumen.resumenPorArea[modulo.area]) {
      resumen.resumenPorArea[modulo.area] = {
        totalModulos: 0,
        totalObjetivosDetallados: 0,
        modulos: []
      };
    }
    
    resumen.resumenPorArea[modulo.area].totalModulos++;
    resumen.resumenPorArea[modulo.area].totalObjetivosDetallados += modulo.objetivosDetallados?.length || 0;
    resumen.resumenPorArea[modulo.area].modulos.push({
      nombre: modulo.nombre,
      cantidadObjetivos: modulo.objetivosDetallados?.length || 0
    });
  });
  
  return resumen;
};

// Método para obtener objetivos detallados por módulo
ObjetivoSchema.methods.obtenerObjetivosPorModulo = function(moduloNombre) {
  if (!this.estructuraJerarquica) {
    return [];
  }
  
  const modulo = this.estructuraJerarquica.objetivosEspecificos.find(
    mod => mod.nombre === moduloNombre
  );
  
  if (!modulo) {
    return [];
  }
  
  return modulo.objetivosDetallados || [];
};

// Método para obtener todos los módulos por área
ObjetivoSchema.methods.obtenerModulosPorArea = function(area) {
  if (!this.estructuraJerarquica) {
    return [];
  }
  
  return this.estructuraJerarquica.objetivosEspecificos.filter(
    modulo => modulo.area === area
  );
};

// Método estático para buscar objetivos por módulo
ObjetivoSchema.statics.buscarPorModulo = function(moduloNombre) {
  return this.find({
    "estructuraJerarquica.objetivosEspecificos.nombre": moduloNombre
  });
};

// Método estático para buscar objetivos por área con estructura jerárquica
ObjetivoSchema.statics.buscarPorAreaConEstructura = function(area) {
  return this.find({
    $or: [
      { "objetivosEspecificos.area": area },
      { "estructuraJerarquica.objetivosEspecificos.area": area }
    ],
    nombreObjetivoGeneral: { $exists: true }
  });
};

// Index para búsquedas por estructura jerárquica
ObjetivoSchema.index({ "estructuraJerarquica.objetivosEspecificos.nombre": 1 });
ObjetivoSchema.index({ "estructuraJerarquica.objetivosEspecificos.area": 1 });
ObjetivoSchema.index({ "objetivosEspecificos.objetivoEspecifico": 1 }); // Nuevo índice para búsqueda por módulo

module.exports = mongoose.model("Objetivo", ObjetivoSchema);