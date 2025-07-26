const mongoose = require('mongoose');

const FirmaSchema = new mongoose.Schema({
  nombre: { type: String },
  cargo: { type: String },
  firma: { type: String } // Almacena la imagen de la firma como data URL
});

const CausaSchema = new mongoose.Schema({
  solicitudCliente: Boolean,
  reparacionDefecto: Boolean,
  accionPreventiva: Boolean,
  actualizacionDocumento: Boolean,
  accionCorrectiva: Boolean,
  otros: String
});

const ImplicacionesSchema = new mongoose.Schema({
  riesgos: Boolean,
  recursos: Boolean,
  documentacion: Boolean,
  otros: String
});

const GestionCambioSchema = new mongoose.Schema({
  // Sección 1
  solicitante: { type: String, required: true },
  areaSolicitante: { type: String, required: true },
  lugar: { type: String, required: true },
  liderProyecto: String,
  fechaSolicitud: { type: Date, required: true },
  fechaPlaneada: { type: Date, required: true },
  
  // Sección 2
  tipoCambio: { type: String, required: true },
  productos: String,
  sistemasEquipos: String,
  localesProduccion: String,
  programasLimpieza: String,
  sistemasEmbalaje: String,
  nivelesPersonal: String,
  requisitosLegales: String,
  conocimientosPeligros: String,
  requisitosCliente: String,
  consultasPartes: String,
  quejasPeligros: String,
  otrasCondiciones: String,
  
  // Sección 3
  causa: CausaSchema,
  
  // Sección 4
  descripcionPropuesta: { type: String, required: true },
  
  // Sección 5
  justificacion: { type: String, required: true },
  
  // Sección 6
  implicaciones: ImplicacionesSchema,
  
  // Sección 7
  consecuencias: { type: String, required: true },
  
  // Firmas
  firmadoPor: {
    solicitado: FirmaSchema,
    evaluado: FirmaSchema,
    aprobado: FirmaSchema,
    implementado: FirmaSchema,
    validado: FirmaSchema
  },
  
  fechaCreacion: { type: Date, default: Date.now }
});

const GestionCambio = mongoose.model('GestionCambio', GestionCambioSchema);

module.exports = GestionCambio;