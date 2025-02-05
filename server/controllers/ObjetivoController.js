const Objetivo = require("../models/ObjetivoModel");

// GET /api/objetivos?area=INGENIERIA
const obtenerObjetivos = async (req, res) => {
  try {
    const { area } = req.query;
    const query = area ? { area } : {};
    const objetivos = await Objetivo.find(query);
    res.json(objetivos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos" });
  }
};

// POST /api/objetivos
const crearObjetivo = async (req, res) => {
  try {
    const nuevoObjetivo = new Objetivo(req.body);
    const saved = await nuevoObjetivo.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear objetivo" });
  }
};

// PUT /api/objetivos/:id
const actualizarObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Objetivo.findByIdAndUpdate(id, req.body, { new: true });
    if (!actualizado) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar objetivo" });
  }
};

// DELETE /api/objetivos/:id
const eliminarObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Objetivo.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    res.json({ message: "Objetivo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar objetivo" });
  }
};

// POST /api/objetivos/:id/acciones-correctivas
const agregarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID recibido en el backend:", id); // Depuración

    const accionCorrectiva = req.body;
    const objetivo = await Objetivo.findById(id);

    if (!objetivo) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }

    objetivo.accionesCorrectivas.push(accionCorrectiva);
    const saved = await objetivo.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar acción correctiva" });
  }
};

const getAccionesCorrectivasByArea = async (req, res) => {
  try {
    const { area } = req.query;
    console.log('Area: ', area)
    if (!area) {
      return res.status(400).json({ error: "El parámetro 'area' es obligatorio." });
    }

    // Buscar todos los objetivos del área indicada
    const objetivos = await Objetivo.find({ area });

    // Reunir todas las acciones correctivas
    let acciones = [];
    objetivos.forEach((objetivo, index) => {
      if (objetivo.accionesCorrectivas && objetivo.accionesCorrectivas.length > 0) {
        // Si lo deseas, puedes agregar datos adicionales a cada acción
        const accionesEnriquecidas = objetivo.accionesCorrectivas.map((accion) => ({
          ...accion.toObject(),
          idObjetivo: objetivo._id,
          // Agrega más datos del objetivo si es necesario (por ejemplo, número u otro identificador)
        }));
        acciones = acciones.concat(accionesEnriquecidas);
      }
    });

    res.status(200).json(acciones);
  } catch (error) {
    console.error("Error en getAccionesCorrectivasByArea:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  getAccionesCorrectivasByArea
};