// models/gestionSchema.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FirmaSchema = new Schema({
  nombre: { type: String, default: '' },
  cargo: { type: String, default: '' },
  firma: { type: String, default: '' },
  email: { type: String, default: '' },
  fechaFirma: { type: Date, default: null }
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

const InvolucradoDetailSchema = new Schema({
  tipoAfectacion: { type: String, default: '' },
  generaCostos: { type: Boolean, default: false },
  medidasControl: { type: String, default: '' },
  fechaCompromiso: { type: Date },
  responsable: { type: String, default: '' }
}, { _id: false });

const RiesgoCardSchema = new Schema({
  id: { type: String, required: true, default: () => String(Date.now()) + Math.floor(Math.random() * 1000) },
  // ya no obligamos tipoImplicacion al crear; el front podrá crear la card vacía y luego el usuario selecciona el tipo
  tipoImplicacion: { type: String, default: '' }, // valores esperados: 'IMPLICACION_DE_RIESGOS','DOCUMENTOS','RECURSOS','OTRAS' (pero no forzamos enum aquí)

  tipoPeligro: { type: String, default: '' },
  descripcionPeligro: { type: String, default: '' },
  consecuencias: { type: String, default: '' },
  probabilidad: { type: String, default: '' },
  severidad: { type: String, default: '' },
  nivelRiesgo: { type: String, default: '' },
  medidasControl: { type: String, default: '' },
  responsable: { type: String, default: '' },
  fechaCompromiso: { type: Date, default: null },

  tipoDocumento: { type: String, default: '' },
  nombreDocumento: { type: String, default: '' },
  cambioRealizar: { type: String, default: '' },
  fechaCompromisoDoc: { type: Date, default: null },
  responsableDoc: { type: String, default: '' },

  tipoRecursos: { type: String, default: '' },
  origenRecursos: { type: String, default: '' },
  costos: { type: String, default: '' },
  tiempoDisponible: { type: String, default: '' },
  fechaCompromisoRec: { type: Date, default: null },
  responsableRec: { type: String, default: '' },

  involucradosSelected: { type: [String], default: [] },
  involucradosData: {
    SOCIOS: { type: InvolucradoDetailSchema, default: () => ({}) },
    PROVEEDORES: { type: InvolucradoDetailSchema, default: () => ({}) },
    AUTORIDADES: { type: InvolucradoDetailSchema, default: () => ({}) },
    CLIENTES: { type: InvolucradoDetailSchema, default: () => ({}) },
    OTROS: { type: InvolucradoDetailSchema, default: () => ({}) }
  },
  otherLabel: { type: String, default: null }
}, { _id: false });

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
  solicitante: { type: String },
  areaSolicitante: { type: String },
  lugar: { type: String },
  liderProyecto: { type: String, default: '' },
  fechaSolicitud: { type: Date },
  fechaPlaneada: { type: Date },

  tipoCambio: { type: String },
  impactosSeleccionados: { type: [String], default: [] },
  impactosData: { type: ImpactosDataSchema, default: () => ({}) },

  causa: { type: CausaSchema, default: () => ({}) },

  descripcionPropuesta: { type: String },
  justificacion: { type: String },
  implicaciones: { type: ImplicacionesSchema, default: () => ({}) },
  consecuencias: { type: String },

  riesgosCards: { type: [RiesgoCardSchema], default: [] },

  // firmadoPor: ahora TODOS los roles son arrays de FirmaSchema
  firmadoPor: {
    solicitado: { type: [FirmaSchema], default: [] },
    evaluado: { type: [FirmaSchema], default: [] },
    aprobado: { type: [FirmaSchema], default: [] },
    implementado: { type: [FirmaSchema], default: [] },
    validado: { type: [FirmaSchema], default: [] }
  },

  fechaCreacion: { type: Date, default: Date.now },
  estado: { type: String, default: 'pendiente' } 
}, {
  strict: false,
  timestamps: true
});

const GestionCambio = mongoose.model('GestionCambio', GestionCambioSchema);
module.exports = GestionCambio;