const mongoose = require("mongoose");

const EvaluacionesSchema = new mongoose.Schema({
  auditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuarios"
  },
  cursos: [
    {
      nombreCurso: { type: String},
      calificacion: { type: Number},
      aprobado: { type: Boolean}
    }
  ],
  conocimientosHabilidades: [
    {
      conocimiento: { type: String},
      puntuacion: { type: Number, min: 0, max: 5 }
    }
  ],
  atributosCualidadesPersonales: [
    {
      atributo: { type: String},
      puntuacion: { type: Number, min: 0, max: 5 }
    }
  ],
  experiencia: {
    tiempoLaborando: { type: String},
    equipoInocuidad: { type: Boolean},
    auditoriasInternas: { type: String}
  },
  formacionProfesional: {
    nivelEstudios: { type: String},
    especialidad: { type: String},
    puntuacion: { type: Number},
    comentarios: { type: String }
  },
  porcentajeTotal: { type: Number, default: 0 },
  estado: { type: String}
});

module.exports = mongoose.model("Evaluaciones", EvaluacionesSchema);
