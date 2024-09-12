const mongoose = require("mongoose");

const EvaluacionesSchema = new mongoose.Schema({
  auditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuarios",
    required: true
  },
  cursos: [
    {
      nombreCurso: { type: String, required: true },
      calificacion: { type: Number, required: true },
      aprobado: { type: Boolean, required: true }
    }
  ],
  conocimientosHabilidades: [
    {
      conocimiento: { type: String, required: true },
      puntuacion: { type: Number, required: true, min: 0, max: 5 }
    }
  ],
  atributosCualidadesPersonales: [
    {
      atributo: { type: String, required: true },
      puntuacion: { type: Number, required: true, min: 0, max: 5 }
    }
  ],
  experiencia: {
    tiempoLaborando: { type: String, required: true },
    equipoInocuidad: { type: Boolean, required: true },
    auditoriasInternas: { type: String, required: true }
  },
  formacionProfesional: {
    nivelEstudios: { type: String, required: true },
    especialidad: { type: String, required: true },
    puntuacion: { type: Number, required: true },
    comentarios: { type: String }
  },
  porcentajeTotal: { type: Number, default: 0 }
});

module.exports = mongoose.model("Evaluaciones", EvaluacionesSchema);
