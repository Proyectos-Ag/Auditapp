const mongoose = require("mongoose");

const DescripcionSchema = new mongoose.Schema({
  ID: { type: String, required: true },
  Requisito: { type: String, required: true },
  Observacion: { type: String, required: true },
  Hallazgo: { type: String, required: true }
});

const ProgramaSchema = new mongoose.Schema({
  Nombre: { type: String, required: true },
  Descripcion: [DescripcionSchema]
});

const EquipoSchema = new mongoose.Schema({
  Nombre: { type: String, required: true },
  Correo: { type: String, required: true }
});

const DatosSchema = new mongoose.Schema({
  TipoAuditoria: { type: String, required: true },
  Duracion: { type: String, required: true },
  Departamento: { type: String, required: true },
  AreasAudi: { type: String, required: true },
  Auditados: { type: String, required: true },
  AuditorLider: { type: String, required: true },
  AuditorLiderEmail: { type: String, required: true },
  EquipoAuditor: [EquipoSchema],
  Observador: { type: Boolean, required: true },
  NombresObservadores: { type: String, required: false },
  Programa: [ProgramaSchema],
  Estado: { type: String, required: false },
  Observaciones: { type: String, required: false }
});

module.exports = mongoose.model("Datos", DatosSchema);