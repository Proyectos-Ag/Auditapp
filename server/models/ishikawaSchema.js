// ishikawa.js
const mongoose = require('mongoose');

const diagramaSchema = new mongoose.Schema({
    problema: String,
    text1: String,
    text2: String,
    text3: String,
    text4: String,
    text5: String,
    text6: String,
    text7: String,
    text8: String,
    text9: String,
    text10: String,
    text11: String,
    text12: String,
    text13: String,
    text14: String,
    text15: String
});

const responsableSchema = new mongoose.Schema({
    nombre: String,
    correo: String,
});

const actividadSchema = new mongoose.Schema({
    actividad: String,
    responsable: [responsableSchema],
    correo: String,
    fechaCompromiso: [String],
    concluido: {type: Boolean, default: false},
    fechaCheck: Date
});

const correccionSchema = new mongoose.Schema({
    actividad: String,
    responsable: String,
    fechaCompromiso: [String],
    cerrada: String,
    evidencia: String
});

const accesoSchema = new mongoose.Schema({
    nombre: String,
    nivelAcceso: Number,
    correo: String
});

const ishikawaSchema = new mongoose.Schema({
    idRep: String,
    idReq: String,
    proName: String,
    problema: String,
    afectacion: String,
    fecha: String,
    folio: String,
    auditado: String,
    correo: String,
    requisito: String,
    hallazgo: String,
    correccion: String,
    causa: String,
    diagrama:[diagramaSchema],
    participantes: String,
    actividades: [actividadSchema],
    correcciones: [correccionSchema],
    estado: String,
    tipo: String,
    notaRechazo: String,
    fechaElaboracion: String,
    acceso: [accesoSchema]
});

const Ishikawa = mongoose.model('Ishikawa', ishikawaSchema);

module.exports = Ishikawa;