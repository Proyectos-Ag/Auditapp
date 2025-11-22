// models/EmpleadoCapacitacionSchema.js
const mongoose = require('mongoose');

const CursoSchema = new mongoose.Schema({
  name: String,
  status: String,
  completedAt: Date,
  required: Boolean
});

const EmpleadoCapacitacionSchema = new mongoose.Schema({
  clave: String,
  nombre: String,
  frecuenciaPaga: String,
  status: String,
  sexo: String,
  departamento: String,
  puesto: String,
  escolaridad: String,
  fechaIngreso: Date,
  antiguedad: Number,
  rfc: String,
  nss: String,
  curp: String,
  transporte: Number,
  turno: String,
  turnoActual: String,
  turnoManual: Boolean,
  cursos: [CursoSchema],
  createdAt: Date,
  updatedAt: Date
}, {
  collection: 'empleados'
});

module.exports = EmpleadoCapacitacionSchema;