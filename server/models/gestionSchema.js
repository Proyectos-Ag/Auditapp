const mongoose = require('mongoose');
const { Schema } = mongoose;

const PersonaSchema = new Schema({
  nombre: { type: String, default: '' },
  cargo: { type: String, default: '' },
  firma: { type: String, default: '' }
}, { _id: false });

const SolicitanteFirmaSchema = new Schema({
  nombre: { type: String, default: '' },
  cargo: { type: String, default: '' },
  firma: { type: String, default: '' }
}, { _id: false });

const CausaSchema = new Schema({
  solicitudCliente: { type: Boolean, default: false },
  reparacionDefecto: { type: Boolean, default: false },
  accionPreventiva: { type: Boolean, default: false },
  actualizacionDocumento: { type: Boolean, default: false },
  accionCorrectiva: { type: Boolean, default: false },
  otros: { type: String, default: '' }
}, { _id: false });

const ImplicacionesSchema = new Schema({
  riesgos: { type: Boolean, default: false },
  recursos: { type: Boolean, default: false },
  documentacion: { type: Boolean, default: false },
  otros: { type: String, default: '' }
}, { _id: false });

/* Schema para cada involucrado dentro de una card (OTRAS) */
const InvolucradoDetailSchema = new Schema({
  tipoAfectacion: { type: String, default: '' },
  generaCostos: { type: Boolean, default: false },
  medidasControl: { type: String, default: '' },
  fechaCompromiso: { type: Date },
  responsable: { type: String, default: '' }
}, { _id: false });

/* Schema para riesgosCards (Sección 8) */
const RiesgoCardSchema = new Schema({
  id: { type: String, required: true }, // id provisto por front (timestamp o uuid)
  tipoImplicacion: { type: String, enum: ['IMPLICACION_DE_RIESGOS','DOCUMENTOS','RECURSOS','OTRAS'], required: true },

  /* IMPLICACION_DE_RIESGOS campos */
  tipoPeligro: { type: String, default: '' },
  descripcionPeligro: { type: String, default: '' },
  consecuencias: { type: String, default: '' },
  probabilidad: { type: String, default: '' },
  severidad: { type: String, default: '' },
  nivelRiesgo: { type: String, default: '' },
  medidasControl: { type: String, default: '' },
  responsable: { type: String, default: '' },
  fechaCompromiso: { type: Date },

  /* DOCUMENTOS campos */
  tipoDocumento: { type: String, default: '' },
  nombreDocumento: { type: String, default: '' },
  cambioRealizar: { type: String, default: '' },
  fechaCompromisoDoc: { type: Date },
  responsableDoc: { type: String, default: '' },

  /* RECURSOS campos */
  tipoRecursos: { type: String, default: '' },
  origenRecursos: { type: String, default: '' },
  costos: { type: String, default: '' },
  tiempoDisponible: { type: String, default: '' },
  fechaCompromisoRec: { type: Date },
  responsableRec: { type: String, default: '' },

  /* OTRAS campos */
  involucradosSelected: { type: [String], default: [] },
  involucradosData: {
    SOCIOS: { type: InvolucradoDetailSchema, default: null },
    PROVEEDORES: { type: InvolucradoDetailSchema, default: null },
    AUTORIDADES: { type: InvolucradoDetailSchema, default: null },
    CLIENTES: { type: InvolucradoDetailSchema, default: null },
    OTROS: { type: InvolucradoDetailSchema, default: null }
  },

  /* Para OTRAS: etiqueta que el usuario escribió en Sección 6 (campo implicaciones.otros) */
  otherLabel: { type: String, default: null }
}, { _id: false });

/* Impactos (Sección 2) - estructura flexible con campos concretos */
const ImpactosDataSchema = new Schema({
  productos: { type: String, default: '' },
  sistemasEquipos: { type: String, default: '' },
  localesProduccion: { type: String, default: '' },
  programasLimpieza: { type: String, default: '' },
  sistemasEmbalaje: { type: String, default: '' },
  nivelesPersonal: { type: String, default: '' },
  requisitosLegales: { type: String, default: '' },
  conocimientosPeligros: { type: String, default: '' },
  requisitosCliente: { type: String, default: '' },
  consultasPartes: { type: String, default: '' },
  quejasPeligros: { type: String, default: '' },
  otrasCondiciones: { type: String, default: '' }
}, { _id: false });

const GestionCambioSchema = new Schema({
  // Sección 1
  solicitante: { type: String },
  areaSolicitante: { type: String },
  lugar: { type: String },
  liderProyecto: { type: String, default: '' },
  fechaSolicitud: { type: Date },
  fechaPlaneada: { type: Date },

  // Sección 2
  tipoCambio: { type: String },
  impactosSeleccionados: { type: [String], default: [] }, // keys seleccionadas
  impactosData: { type: ImpactosDataSchema, default: () => ({}) },

  // Sección 3
  causa: { type: CausaSchema, default: () => ({}) },

  // Sección 4
  descripcionPropuesta: { type: String },

  // Sección 5
  justificacion: { type: String },

  // Sección 6
  implicaciones: { type: ImplicacionesSchema, default: () => ({}) },

  // Sección 7
  consecuencias: { type: String },

  // Sección 8 -> Riesgos cards (array)
  riesgosCards: { type: [RiesgoCardSchema], default: [] },

  // Firmas
  firmadoPor: {
  solicitado: { type: SolicitanteFirmaSchema, default: () => ({}) },
  evaluado: { type: PersonaSchema, default: () => ({}) },
  aprobado: { type: [PersonaSchema], default: [] },      // ahora es array
  implementado: { type: PersonaSchema, default: () => ({}) },
  validado: { type: PersonaSchema, default: () => ({}) }
},

  fechaCreacion: { type: Date, default: Date.now },
  estado: { type: String, default: 'pendiente' } // pendiente, aprobado, rechazado, implementado, validado
}, {
  strict: false 
},{ timestamps: true });

const GestionCambio = mongoose.model('GestionCambio', GestionCambioSchema);
module.exports = GestionCambio;