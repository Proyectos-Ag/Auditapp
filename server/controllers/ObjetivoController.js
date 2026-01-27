const Objetivo = require("../models/ObjetivoModel");
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// FUNCIÓN AUXILIAR: Migrar objetivo sin año
const migrarObjetivoSinAño = async (objetivo) => {
  const añoActual = new Date().getFullYear();
  
  // Si ya tiene año, no hacer nada
  if (objetivo.añoActual) {
    return objetivo;
  }
  
  console.log(`🔄 Migrando objetivo ${objetivo._id} sin año definido`);
  
  // Verificar si tiene datos
  const tieneDatos = verificarSiTieneDatos(objetivo);
  
  if (tieneDatos) {
    // Tiene datos del 2025, archivar y resetear
    console.log(`📦 Archivando datos de 2025`);
    
    if (!objetivo.historialAnual) {
      objetivo.historialAnual = [];
    }
    
    objetivo.historialAnual.push({
      año: 2025,
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
    
    // Resetear indicadores
    const camposIndicadores = [
      'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
      'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
      'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
    ];
    
    camposIndicadores.forEach(campo => {
      objetivo[campo] = { S1: "", S2: "", S3: "", S4: "", S5: "" };
    });
  }
  
  // Establecer año actual
  objetivo.añoActual = añoActual;
  await objetivo.save();
  console.log(`✅ Objetivo migrado a año ${añoActual}`);
  
  return objetivo;
};

// Función para verificar si tiene datos
const verificarSiTieneDatos = (objetivo) => {
  const campos = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  for (const campo of campos) {
    if (objetivo[campo]) {
      const semanas = ['S1', 'S2', 'S3', 'S4', 'S5'];
      for (const semana of semanas) {
        if (objetivo[campo][semana] && objetivo[campo][semana] !== "") {
          return true;
        }
      }
    }
  }
  return false;
};

// Tarea programada para notificaciones
cron.schedule('0 8 * * *', async () => {
  try {
    console.log('Cron job ejecutándose...');
    const objetivos = await Objetivo.find({});
    const ahora = new Date();
    console.log('Fecha actual:', ahora);

    for (const objetivo of objetivos) {
      for (const accion of objetivo.accionesCorrectivas) {
        const fechaLimite = new Date(accion.fichaCompromiso);
        const diasRestantes = Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60 * 24));
        console.log('Días restantes:', diasRestantes);

        let urgencia = '';
        if (diasRestantes <= 1) urgencia = 'inmediata';
        else if (diasRestantes <= 3) urgencia = 'media';

        if (urgencia && (!accion.ultimaNotificacion || 
           (ahora - new Date(accion.ultimaNotificacion)) > 12 * 60 * 60 * 1000)) {
          console.log('Enviando notificación a:', accion.responsable.email);

          const fechaLimiteMasUnDia = new Date(fechaLimite);
          fechaLimiteMasUnDia.setDate(fechaLimiteMasUnDia.getDate() + 1);

          const dia = fechaLimiteMasUnDia.getDate();
          const mes = fechaLimiteMasUnDia.getMonth() + 1;
          const año = fechaLimiteMasUnDia.getFullYear();
          const fechaFormateada = `${dia}/${mes}/${año}`;

          await transporter.sendMail({
            from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
            to: accion.responsable.email,
            subject: `⏰ Alerta de Vencimiento (${urgencia.toUpperCase()})`,
            html: `<h2>Acción Correctiva Pendiente</h2>
                  <p><strong>Objetivo:</strong> ${accion.noObjetivo}</p>
                  <p><strong>Acción:</strong> ${accion.acciones}</p>
                  <p><strong>Fecha Límite:</strong> ${fechaFormateada}</p>
                  <p><strong>Días Restantes:</strong> ${diasRestantes}</p>`
          });

          accion.notificaciones.push({
            tipo: 'email',
            fecha: ahora,
            mensaje: `Alerta de ${urgencia} - ${diasRestantes} días restantes`,
            urgencia: urgencia
          });
          accion.ultimaNotificacion = ahora;
          await objetivo.save();
        }
      }
    }
  } catch (error) {
    console.error('Error en tarea programada:', error);
  }
});

// ✅ MODIFICADA: GET /api/objetivos?area=INGENIERIA - SOLO objetivos tradicionales
// ✅ MODIFICADA: GET /api/objetivos?area=INGENIERIA - Para admin devuelve TODO
const obtenerObjetivos = async (req, res) => {
  try {
    const { area } = req.query;
    
    console.log(`🔍 Obteniendo objetivos. Área solicitada: ${area}`);
    console.log(`👤 Rol del usuario (si estuviera disponible): ${req.user?.tipoUsuario || 'desconocido'}`);
    
    // ✅ ADMIN: Si no hay área o área es ALL, devolver TODO
    // Nota: Asumimos que el middleware de autenticación añade req.user
    // Si no tienes middleware, podrías necesitar otra forma de identificar al admin
    
    if (area === 'ALL' || !area) {
      console.log('🔍 Admin: Obteniendo TODOS los objetivos');
      const todosObjetivos = await Objetivo.find({});
      console.log(`📊 Total objetivos encontrados: ${todosObjetivos.length}`);
      
      // Migrar objetivos sin año automáticamente
      const objetivosMigrados = [];
      for (const objetivo of todosObjetivos) {
        if (!objetivo.añoActual) {
          const objetivoMigrado = await migrarObjetivoSinAño(objetivo);
          objetivosMigrados.push(objetivoMigrado);
        } else {
          objetivosMigrados.push(objetivo);
        }
      }
      
      return res.json(objetivosMigrados);
    }
    
    // ✅ FILTRAR para usuarios normales: Solo objetivos tradicionales (NO multi-departamento)
    const query = { 
      area: area,
      nombreObjetivoGeneral: { $exists: false } // Solo objetivos sin nombreObjetivoGeneral
    };
    
    console.log(`🔍 Buscando objetivos tradicionales para área: ${area}`);
    let objetivos = await Objetivo.find(query);
    
    console.log(`📊 Resultados encontrados: ${objetivos.length} objetivos tradicionales`);
    
    // Migrar objetivos sin año automáticamente
    const objetivosMigrados = [];
    for (const objetivo of objetivos) {
      if (!objetivo.añoActual) {
        const objetivoMigrado = await migrarObjetivoSinAño(objetivo);
        objetivosMigrados.push(objetivoMigrado);
      } else {
        objetivosMigrados.push(objetivo);
      }
    }
    
    res.json(objetivosMigrados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos tradicionales" });
  }
};

// ✅ NUEVA: GET /api/objetivos/multi/area?area=PESADAS - Solo objetivos multi-departamento por área
const obtenerObjetivosMultiPorArea = async (req, res) => {
  try {
    const { area } = req.query;
    
    if (!area) {
      return res.status(400).json({ error: "El parámetro 'area' es requerido" });
    }
    
    console.log(`🔍 Buscando objetivos multi-departamento para área: ${area}`);
    
    // Buscar objetivos multi-departamento que tengan esta área en objetivosEspecificos
    const objetivosMulti = await Objetivo.find({
      "objetivosEspecificos.area": area,
      nombreObjetivoGeneral: { $exists: true } // Solo objetivos multi-departamento
    });
    
    console.log(`📊 Encontrados ${objetivosMulti.length} objetivos multi-departamento`);
    
    // Transformar para devolver solo los objetivos específicos del área
    const objetivosEspecificos = [];
    
    objetivosMulti.forEach(objetivoMulti => {
      const especificosParaArea = objetivoMulti.objetivosEspecificos.filter(
        obj => obj.area === area
      );
      
      especificosParaArea.forEach((especifico, index) => {
        objetivosEspecificos.push({
          // ID único compuesto para identificar este objetivo específico
          _id: `${objetivoMulti._id}_${especifico._id}`,
          area: especifico.area,
          objetivoDescripcion: especifico.objetivo,
          objetivoEspecifico: especifico.objetivoEspecifico || '', // Nuevo campo para el módulo
          objetivoGeneral: objetivoMulti.nombreObjetivoGeneral,
          recursos: especifico.recursos,
          metaFrecuencia: especifico.metaFrecuencia,
          // Pasar TODOS los valores de indicadores exactamente como están en la base de datos
          indicadorENEABR: especifico.indicadorENEABR ? { 
            S1: especifico.indicadorENEABR.S1 || "",
            S2: especifico.indicadorENEABR.S2 || "",
            S3: especifico.indicadorENEABR.S3 || "",
            S4: especifico.indicadorENEABR.S4 || "",
            S5: especifico.indicadorENEABR.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorFEB: especifico.indicadorFEB ? { 
            S1: especifico.indicadorFEB.S1 || "",
            S2: especifico.indicadorFEB.S2 || "",
            S3: especifico.indicadorFEB.S3 || "",
            S4: especifico.indicadorFEB.S4 || "",
            S5: especifico.indicadorFEB.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorMAR: especifico.indicadorMAR ? { 
            S1: especifico.indicadorMAR.S1 || "",
            S2: especifico.indicadorMAR.S2 || "",
            S3: especifico.indicadorMAR.S3 || "",
            S4: especifico.indicadorMAR.S4 || "",
            S5: especifico.indicadorMAR.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorABR: especifico.indicadorABR ? { 
            S1: especifico.indicadorABR.S1 || "",
            S2: especifico.indicadorABR.S2 || "",
            S3: especifico.indicadorABR.S3 || "",
            S4: especifico.indicadorABR.S4 || "",
            S5: especifico.indicadorABR.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorMAYOAGO: especifico.indicadorMAYOAGO ? { 
            S1: especifico.indicadorMAYOAGO.S1 || "",
            S2: especifico.indicadorMAYOAGO.S2 || "",
            S3: especifico.indicadorMAYOAGO.S3 || "",
            S4: especifico.indicadorMAYOAGO.S4 || "",
            S5: especifico.indicadorMAYOAGO.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorJUN: especifico.indicadorJUN ? { 
            S1: especifico.indicadorJUN.S1 || "",
            S2: especifico.indicadorJUN.S2 || "",
            S3: especifico.indicadorJUN.S3 || "",
            S4: especifico.indicadorJUN.S4 || "",
            S5: especifico.indicadorJUN.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorJUL: especifico.indicadorJUL ? { 
            S1: especifico.indicadorJUL.S1 || "",
            S2: especifico.indicadorJUL.S2 || "",
            S3: especifico.indicadorJUL.S3 || "",
            S4: especifico.indicadorJUL.S4 || "",
            S5: especifico.indicadorJUL.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorAGO: especifico.indicadorAGO ? { 
            S1: especifico.indicadorAGO.S1 || "",
            S2: especifico.indicadorAGO.S2 || "",
            S3: especifico.indicadorAGO.S3 || "",
            S4: especifico.indicadorAGO.S4 || "",
            S5: especifico.indicadorAGO.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorSEPDIC: especifico.indicadorSEPDIC ? { 
            S1: especifico.indicadorSEPDIC.S1 || "",
            S2: especifico.indicadorSEPDIC.S2 || "",
            S3: especifico.indicadorSEPDIC.S3 || "",
            S4: especifico.indicadorSEPDIC.S4 || "",
            S5: especifico.indicadorSEPDIC.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorOCT: especifico.indicadorOCT ? { 
            S1: especifico.indicadorOCT.S1 || "",
            S2: especifico.indicadorOCT.S2 || "",
            S3: especifico.indicadorOCT.S3 || "",
            S4: especifico.indicadorOCT.S4 || "",
            S5: especifico.indicadorOCT.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorNOV: especifico.indicadorNOV ? { 
            S1: especifico.indicadorNOV.S1 || "",
            S2: especifico.indicadorNOV.S2 || "",
            S3: especifico.indicadorNOV.S3 || "",
            S4: especifico.indicadorNOV.S4 || "",
            S5: especifico.indicadorNOV.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          indicadorDIC: especifico.indicadorDIC ? { 
            S1: especifico.indicadorDIC.S1 || "",
            S2: especifico.indicadorDIC.S2 || "",
            S3: especifico.indicadorDIC.S3 || "",
            S4: especifico.indicadorDIC.S4 || "",
            S5: especifico.indicadorDIC.S5 || ""
          } : { S1: "", S2: "", S3: "", S4: "", S5: "" },
          
          observaciones: especifico.observaciones,
          esMultiDepartamento: true,
          objetivoIdMulti: objetivoMulti._id,
          objetivoEspecificoId: especifico._id,
          departamento: especifico.departamento,
          accionesCorrectivas: especifico.accionesCorrectivas || [],
          historialAnual: especifico.historialAnual || [],
          index: index,
          estructuraJerarquica: objetivoMulti.estructuraJerarquica || null // Nuevo: incluir estructura jerárquica
        });
      });
    });
    
    console.log(`✅ Devolviendo ${objetivosEspecificos.length} objetivos específicos multi-departamento`);
    
    // Log de los primeros valores para debug
    if (objetivosEspecificos.length > 0) {
      console.log('📊 Primer objetivo - indicadorENEABR:', objetivosEspecificos[0].indicadorENEABR);
      console.log('📊 Primer objetivo - objetivoEspecifico (módulo):', objetivosEspecificos[0].objetivoEspecifico);
      console.log('📊 IDs únicos generados:', objetivosEspecificos.map(obj => obj._id));
    }
    
    res.json(objetivosEspecificos);
  } catch (error) {
    console.error('Error al obtener objetivos multi por área:', error);
    res.status(500).json({ error: "Error al obtener objetivos multi-departamento" });
  }
};

// Obtener un objetivo por ID
const obtenerObjetivoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const objetivo = await Objetivo.findById(id);
    
    if (!objetivo) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    
    res.json(objetivo);
  } catch (error) {
    console.error('❌ Error al obtener objetivo por ID:', error);
    res.status(500).json({ 
      error: "Error al obtener objetivo",
      details: error.message 
    });
  }
};

const actualizarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    const objetivo = await Objetivo.findOne({ 'accionesCorrectivas._id': id });
    
    if (!objetivo) {
      return res.status(404).json({ error: "Acción no encontrada" });
    }

    const accion = objetivo.accionesCorrectivas.id(id);
    if (!accion) {
      return res.status(404).json({ error: "Acción no encontrada" });
    }

    if (req.body.responsable) {
      accion.responsable = req.body.responsable;
    }
    if (req.body.efectividad) {
      accion.efectividad = req.body.efectividad;
    }
    if (req.body.observaciones !== undefined) {
      accion.observaciones = req.body.observaciones;
    }
    if (req.body.acciones !== undefined) {
      accion.acciones = req.body.acciones;
    }

    await objetivo.save();
    res.json(accion);
  } catch (error) {
    console.error("Error al actualizar acción:", error);
    res.status(500).json({ error: "Error al actualizar acción correctiva" });
  }
};

const reprogramarFechaCompromiso = async (req, res) => {
  try {
    const objetivo = await Objetivo.findOne({ 'accionesCorrectivas._id': req.params.id });
    if (!objetivo) return res.status(404).send("Acción no encontrada");

    const accion = objetivo.accionesCorrectivas.id(req.params.id);
    accion.historialFechas.push(accion.fichaCompromiso);
    accion.fichaCompromiso = req.body.nuevaFecha;

    await objetivo.save();
    res.json(accion);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

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

const actualizarObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    
    console.log('📝 Actualizando objetivo:', { id, datosActualizados });
    
    // Primero obtener el objetivo actual
    const objetivoActual = await Objetivo.findById(id);
    
    if (!objetivoActual) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    
    // Verificar si es un objetivo tradicional
    const esTradicional = !objetivoActual.nombreObjetivoGeneral && objetivoActual.area;
    
    if (esTradicional) {
      // Para objetivos tradicionales, actualizar solo los campos necesarios
      const camposPermitidos = [
        'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
        'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
        'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC',
        'observaciones', 'añoActual', 'activo'
      ];
      
      // Filtrar solo los campos permitidos
      const datosParaActualizar = {};
      Object.keys(datosActualizados).forEach(key => {
        if (camposPermitidos.includes(key)) {
          datosParaActualizar[key] = datosActualizados[key];
        }
      });
      
      console.log('📤 Actualizando objetivo tradicional con:', datosParaActualizar);
      
      // Usar findByIdAndUpdate para evitar triggers del middleware
      const actualizado = await Objetivo.findByIdAndUpdate(
        id,
        { $set: datosParaActualizar },
        { new: true, runValidators: true }
      );
      
      res.json(actualizado);
      
    } else {
      // Para objetivos multi-departamento, usar update normal
      const actualizado = await Objetivo.findByIdAndUpdate(id, datosActualizados, { new: true });
      res.json(actualizado);
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar objetivo:', error);
    res.status(500).json({ 
      error: "Error al actualizar objetivo",
      details: error.message 
    });
  }
};

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

const agregarAccionCorrectiva = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID recibido en el backend:", id);

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
    const { area, esMultiDepartamento, objetivoId } = req.query;
    console.log('🔍 Parámetros recibidos:', { area, esMultiDepartamento, objetivoId });

    if (!area && !objetivoId) {
      return res.status(400).json({ error: "Se requiere el parámetro 'area' u 'objetivoId'." });
    }

    let acciones = [];

    if (esMultiDepartamento === 'true' && objetivoId) {
      // ✅ Para objetivos multi-departamento: buscar por objetivoId
      console.log('🔍 Buscando acciones para objetivo multi-departamento ID:', objetivoId);
      
      const objetivo = await Objetivo.findById(objetivoId);
      
      if (!objetivo) {
        return res.status(404).json({ error: "Objetivo multi-departamento no encontrado" });
      }

      // Buscar acciones en el objetivo específico del área
      if (objetivo.objetivosEspecificos && objetivo.objetivosEspecificos.length > 0) {
        const objetivoEspecifico = objetivo.objetivosEspecificos.find(
          obj => obj.area === area || obj._id.toString() === area
        );
        
        if (objetivoEspecifico && objetivoEspecifico.accionesCorrectivas) {
          // Acciones del objetivo específico
          acciones = objetivoEspecifico.accionesCorrectivas.map((accion) => ({
            ...accion.toObject(),
            idObjetivo: objetivo._id,
            idObjetivoEspecifico: objetivoEspecifico._id,
            area: objetivoEspecifico.area,
            departamento: objetivoEspecifico.departamento,
            objetivo: objetivoEspecifico.objetivo,
            objetivoEspecifico: objetivoEspecifico.objetivoEspecifico || '', // Nuevo campo
            esMultiDepartamento: true,
            objetivoGeneral: objetivo.nombreObjetivoGeneral
          }));
        }
      }
      
      // También incluir acciones del nivel principal (si las hay)
      if (objetivo.accionesCorrectivas && objetivo.accionesCorrectivas.length > 0) {
        const accionesPrincipales = objetivo.accionesCorrectivas.map((accion) => ({
          ...accion.toObject(),
          idObjetivo: objetivo._id,
          esMultiDepartamento: true,
          esNivelPrincipal: true,
          objetivoGeneral: objetivo.nombreObjetivoGeneral
        }));
        acciones = [...acciones, ...accionesPrincipales];
      }
      
    } else {
      // ✅ Para objetivos tradicionales: buscar por área
      console.log('🔍 Buscando acciones para área tradicional:', area);
      
      const objetivos = await Objetivo.find({ area });

      objetivos.forEach((objetivo) => {
        if (objetivo.accionesCorrectivas && objetivo.accionesCorrectivas.length > 0) {
          const accionesEnriquecidas = objetivo.accionesCorrectivas.map((accion) => ({
            ...accion.toObject(),
            idObjetivo: objetivo._id,
            area: objetivo.area,
            objetivo: objetivo.objetivo,
            esMultiDepartamento: false
          }));
          acciones = acciones.concat(accionesEnriquecidas);
        }
      });
    }

    console.log(`✅ Encontradas ${acciones.length} acciones`);
    res.status(200).json(acciones);
  } catch (error) {
    console.error("Error en getAccionesCorrectivasByArea:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// NUEVA FUNCIÓN: Migrar todos los objetivos manualmente
const migrarTodosLosObjetivos = async (req, res) => {
  try {
    const objetivos = await Objetivo.find({});
    let migrados = 0;
    
    for (const objetivo of objetivos) {
      if (!objetivo.añoActual) {
        await migrarObjetivoSinAño(objetivo);
        migrados++;
      }
    }
    
    res.json({ 
      message: `Migración completada. ${migrados} objetivos actualizados.`,
      total: objetivos.length,
      migrados: migrados
    });
  } catch (error) {
    console.error('Error en migración:', error);
    res.status(500).json({ error: "Error al migrar objetivos" });
  }
};

// MODIFICADA: Crear objetivo multi-departamento con estructura jerárquica
// MODIFICADA: Crear objetivo multi-departamento con estructura jerárquica - CORREGIDA
const crearObjetivoMultiDepartamento = async (req, res) => {
  try {
    const { 
      nombreObjetivoGeneral, 
      departamentosAsignados, 
      objetivosEspecificos, 
      usuario, 
      estructuraJerarquica 
    } = req.body;
    
    // ✅ Log para debugging
    console.log('📥 Datos recibidos en backend para creación jerárquica:');
    console.log('nombreObjetivoGeneral:', nombreObjetivoGeneral);
    console.log('departamentosAsignados:', departamentosAsignados);
    console.log('objetivosEspecificos recibidos:', objetivosEspecificos?.length || 0);
    console.log('estructuraJerarquica recibida:', estructuraJerarquica ? 'Sí' : 'No');
    
    if (estructuraJerarquica) {
      console.log('📊 Estructura jerárquica:');
      console.log('- Total módulos:', estructuraJerarquica.objetivosEspecificos?.length || 0);
      console.log('- Total en objetivosDetalladosPorModulo:', estructuraJerarquica.objetivosDetalladosPorModulo?.length || 0);
      
      if (estructuraJerarquica.objetivosDetalladosPorModulo) {
        estructuraJerarquica.objetivosDetalladosPorModulo.forEach((item, idx) => {
          console.log(`  ${idx + 1}. objetivoEspecificoId: ${item.objetivoEspecificoId} (tipo: ${typeof item.objetivoEspecificoId})`);
        });
      }
    }
    
    // Validar datos requeridos
    if (!nombreObjetivoGeneral || !departamentosAsignados || departamentosAsignados.length === 0) {
      return res.status(400).json({ 
        error: "Nombre del objetivo y departamentos asignados son requeridos" 
      });
    }
    
    // ✅ Validar que cada objetivo específico tenga los campos necesarios
    if (objetivosEspecificos && objetivosEspecificos.length > 0) {
      for (const objEsp of objetivosEspecificos) {
        if (!objEsp.area) {
          console.error('❌ Objetivo específico sin área:', objEsp);
          return res.status(400).json({ 
            error: `El objetivo para el departamento "${objEsp.departamento}" no tiene área asignada` 
          });
        }
        if (!objEsp.departamento) {
          console.error('❌ Objetivo específico sin departamento:', objEsp);
          return res.status(400).json({ 
            error: "Todos los objetivos específicos deben tener departamento asignado" 
          });
        }
        if (!objEsp.objetivo) {
          console.error('❌ Objetivo específico sin descripción:', objEsp);
          return res.status(400).json({ 
            error: `El objetivo para "${objEsp.area}" del departamento "${objEsp.departamento}" está vacío` 
          });
        }
      }
    } else {
      console.error('❌ No se recibieron objetivos específicos');
      return res.status(400).json({ 
        error: "Debe incluir al menos un objetivo específico" 
      });
    }
    
    // ✅ Limpiar la estructura jerárquica para evitar problemas con IDs temporales
    let estructuraJerarquicaLimpia = null;
    
    if (estructuraJerarquica) {
      // Convertir IDs de números a strings para evitar errores de validación
      estructuraJerarquicaLimpia = {
        objetivosEspecificos: estructuraJerarquica.objetivosEspecificos || [],
        objetivosDetalladosPorModulo: []
      };
      
      // Si hay objetivosDetalladosPorModulo, asegurarse de que los IDs sean strings
      if (estructuraJerarquica.objetivosDetalladosPorModulo && estructuraJerarquica.objetivosDetalladosPorModulo.length > 0) {
        estructuraJerarquicaLimpia.objetivosDetalladosPorModulo = estructuraJerarquica.objetivosDetalladosPorModulo.map(item => ({
          objetivoEspecificoId: item.objetivoEspecificoId ? item.objetivoEspecificoId.toString() : '',
          objetivoEspecificoNombre: item.objetivoEspecificoNombre || '',
          cantidadObjetivosDetallados: item.cantidadObjetivosDetallados || 0
        }));
        
        console.log('✅ IDs convertidos a strings:', estructuraJerarquicaLimpia.objetivosDetalladosPorModulo.map(item => item.objetivoEspecificoId));
      }
    }
    
    // ✅ Asegurar que los objetivosEspecificos tengan el campo objetivoEspecifico
    const objetivosConMódulo = objetivosEspecificos.map(obj => {
      // Si viene de la nueva estructura jerárquica, ya debería tener objetivoEspecifico
      if (!obj.objetivoEspecifico && estructuraJerarquica?.objetivosEspecificos) {
        // Buscar el nombre del módulo en la estructura jerárquica
        const moduloInfo = estructuraJerarquica.objetivosEspecificos.find(
          mod => mod.departamento === obj.departamento && 
                 mod.area === obj.area
        );
        if (moduloInfo) {
          obj.objetivoEspecifico = moduloInfo.nombre;
        }
      }
      return obj;
    });
    
    console.log('📊 Objetivos procesados con módulos:', objetivosConMódulo.length);
    console.log('📊 Muestra de objetivos procesados:');
    objetivosConMódulo.slice(0, 3).forEach((obj, idx) => {
      console.log(`  ${idx + 1}. Depto: ${obj.departamento}, Área: ${obj.area}, Módulo: "${obj.objetivoEspecifico || 'Sin módulo'}", Objetivo: ${obj.objetivo.substring(0, 50)}...`);
    });
    
    // Crear el objetivo principal con la nueva estructura jerárquica
    const nuevoObjetivo = new Objetivo({
      nombreObjetivoGeneral,
      departamentosAsignados,
      objetivosEspecificos: objetivosConMódulo,
      estructuraJerarquica: estructuraJerarquicaLimpia,
      creadoPor: {
        usuarioId: usuario?.id,
        nombre: usuario?.nombre || "Sistema",
        fecha: new Date()
      },
      añoActual: new Date().getFullYear(),
      activo: true
    });
    
    const saved = await nuevoObjetivo.save();
    
    // ✅ Log del documento guardado
    console.log('✅ Objetivo jerárquico guardado exitosamente:');
    console.log('ID:', saved._id);
    console.log('Objetivos específicos guardados:', saved.objetivosEspecificos.length);
    console.log('Estructura jerárquica guardada:', saved.estructuraJerarquica ? 'Sí' : 'No');
    
    saved.objetivosEspecificos.forEach((obj, index) => {
      console.log(`  ${index + 1}. Depto: ${obj.departamento}, Área: ${obj.area}, Módulo: "${obj.objetivoEspecifico || 'Sin módulo'}", Objetivo: ${obj.objetivo.substring(0, 40)}...`);
    });
    
    res.status(201).json(saved);
  } catch (error) {
    console.error('❌ Error al crear objetivo multi-departamento jerárquico:', error);
    console.error('❌ Detalles del error:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    res.status(500).json({ 
      error: "Error al crear objetivo jerárquico",
      details: error.message,
      validationErrors: error.errors
    });
  }
};

// Función para obtener objetivos por departamento (mantiene compatibilidad)
const obtenerObjetivosPorDepartamento = async (req, res) => {
  try {
    const { departamento } = req.query;
    
    if (!departamento) {
      return res.status(400).json({ error: "El parámetro 'departamento' es requerido" });
    }
    
    // Buscar objetivos donde el departamento esté en la lista de departamentos asignados
    const objetivos = await Objetivo.find({ 
      departamentosAsignados: departamento,
      activo: true 
    });
    
    // Transformar los datos para mantener compatibilidad con el frontend existente
    const objetivosTransformados = [];
    
    objetivos.forEach(objetivoGeneral => {
      const objetivoEspecifico = objetivoGeneral.objetivosEspecificos.find(
        obj => obj.departamento === departamento
      );
      
      if (objetivoEspecifico) {
        objetivosTransformados.push({
          _id: objetivoGeneral._id,
          area: departamento,
          objetivo: objetivoEspecifico.objetivo,
          objetivoEspecifico: objetivoEspecifico.objetivoEspecifico || '', // Nuevo campo
          recursos: objetivoEspecifico.recursos,
          metaFrecuencia: objetivoEspecifico.metaFrecuencia,
          añoActual: objetivoGeneral.añoActual,
          indicadorENEABR: objetivoEspecifico.indicadorENEABR,
          indicadorFEB: objetivoEspecifico.indicadorFEB,
          indicadorMAR: objetivoEspecifico.indicadorMAR,
          indicadorABR: objetivoEspecifico.indicadorABR,
          indicadorMAYOAGO: objetivoEspecifico.indicadorMAYOAGO,
          indicadorJUN: objetivoEspecifico.indicadorJUN,
          indicadorJUL: objetivoEspecifico.indicadorJUL,
          indicadorAGO: objetivoEspecifico.indicadorAGO,
          indicadorSEPDIC: objetivoEspecifico.indicadorSEPDIC,
          indicadorOCT: objetivoEspecifico.indicadorOCT,
          indicadorNOV: objetivoEspecifico.indicadorNOV,
          indicadorDIC: objetivoEspecifico.indicadorDIC,
          observaciones: objetivoEspecifico.observaciones,
          accionesCorrectivas: objetivoEspecifico.accionesCorrectivas,
          historialAnual: objetivoEspecifico.historialAnual,
          estructuraJerarquica: objetivoGeneral.estructuraJerarquica // Incluir estructura
        });
      }
    });
    
    res.json(objetivosTransformados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos" });
  }
};

const obtenerObjetivosPorArea = async (req, res) => {
  try {
    const { area } = req.params;
    
    if (!area) {
      return res.status(400).json({ error: "El parámetro 'area' es requerido" });
    }
    
    // Buscar objetivos donde el área esté en los departamentos asignados
    // o en los objetivos específicos
    const objetivos = await Objetivo.find({
      $or: [
        { departamentosAsignados: { $in: [area] } },
        { "objetivosEspecificos.area": area },
        { area: area } // Para compatibilidad con objetivos antiguos
      ],
      activo: true
    });
    
    res.json(objetivos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener objetivos" });
  }
};

// Actualizar objetivo específico de multi-departamento
const actualizarObjetivoEspecifico = async (req, res) => {
  try {
    const { objetivoId } = req.params;
    const { objetivoEspecificoId, objetivo, recursos, metaFrecuencia, observaciones, objetivoEspecifico } = req.body;
    
    console.log('📝 Actualizando objetivo específico (jerárquico):', { 
      objetivoId, 
      objetivoEspecificoId,
      tieneObjetivoEspecifico: !!objetivoEspecifico 
    });
    
    const objetivoMulti = await Objetivo.findById(objetivoId);
    
    if (!objetivoMulti) {
      return res.status(404).json({ error: "Objetivo multi-departamento no encontrado" });
    }
    
    // Buscar el objetivo específico
    const objetivoEspecificoObj = objetivoMulti.objetivosEspecificos.find(
      obj => obj._id.toString() === objetivoEspecificoId
    );
    
    if (!objetivoEspecificoObj) {
      return res.status(404).json({ error: "Objetivo específico no encontrado" });
    }
    
    // Actualizar campos
    if (objetivo !== undefined) objetivoEspecificoObj.objetivo = objetivo;
    if (objetivoEspecifico !== undefined) objetivoEspecificoObj.objetivoEspecifico = objetivoEspecifico;
    if (recursos !== undefined) objetivoEspecificoObj.recursos = recursos;
    if (metaFrecuencia !== undefined) objetivoEspecificoObj.metaFrecuencia = metaFrecuencia;
    if (observaciones !== undefined) objetivoEspecificoObj.observaciones = observaciones;
    
    await objetivoMulti.save();
    
    console.log('✅ Objetivo específico actualizado:', {
      objetivo: objetivoEspecificoObj.objetivo.substring(0, 50),
      objetivoEspecifico: objetivoEspecificoObj.objetivoEspecifico
    });
    
    res.json({
      success: true,
      message: "Objetivo específico actualizado correctamente",
      objetivoEspecifico: objetivoEspecificoObj
    });
  } catch (error) {
    console.error('❌ Error al actualizar objetivo específico:', error);
    res.status(500).json({ 
      error: "Error al actualizar objetivo específico",
      details: error.message 
    });
  }
};

// Actualizar indicador de objetivo específico - VERSIÓN CORREGIDA DEFINITIVA
const actualizarIndicadorObjetivoEspecifico = async (req, res) => {
  try {
    const { objetivoId } = req.params;
    const { area, campo, valores, objetivoEspecificoId, index } = req.body;
    
    console.log('📝 Actualizando indicador (jerárquico):', { 
      objetivoIdRecibido: objetivoId,
      area, 
      campo, 
      valores: JSON.stringify(valores),
      objetivoEspecificoId,
      index
    });
    
    // Extraer el ObjectId puro
    const objetivoIdLimpio = objetivoId.split('-')[0];
    
    console.log('🔍 ID limpiado:', objetivoIdLimpio);
    
    const objetivoMulti = await Objetivo.findById(objetivoIdLimpio);
    
    if (!objetivoMulti) {
      console.error('❌ Objetivo no encontrado con ID:', objetivoIdLimpio);
      return res.status(404).json({ error: "Objetivo multi-departamento no encontrado" });
    }
    
    console.log(`✅ Objetivo encontrado: ${objetivoMulti.nombreObjetivoGeneral}`);
    console.log(`📊 Total objetivos específicos: ${objetivoMulti.objetivosEspecificos?.length || 0}`);
    console.log(`📊 Estructura jerárquica: ${objetivoMulti.estructuraJerarquica ? 'Presente' : 'No presente'}`);
    
    let objetivoEspecifico;
    
    // PRIMERO: Buscar por objetivoEspecificoId si viene
    if (objetivoEspecificoId) {
      objetivoEspecifico = objetivoMulti.objetivosEspecificos.id(objetivoEspecificoId);
      if (objetivoEspecifico) {
        console.log(`🔍 Encontrado por ID específico: ${objetivoEspecifico.objetivo.substring(0, 50)}...`);
        console.log(`🔍 Módulo asociado: ${objetivoEspecifico.objetivoEspecifico || 'Sin módulo'}`);
      }
    }
    
    // SEGUNDO: Buscar por índice si no se encontró por ID
    if (!objetivoEspecifico && index !== undefined && index >= 0) {
      objetivoEspecifico = objetivoMulti.objetivosEspecificos[index];
      if (objetivoEspecifico) {
        console.log(`🔍 Encontrado por índice ${index}: ${objetivoEspecifico.objetivo.substring(0, 50)}...`);
        console.log(`🔍 Módulo asociado: ${objetivoEspecifico.objetivoEspecifico || 'Sin módulo'}`);
      }
    }
    
    // TERCERO: Buscar por área como último recurso
    if (!objetivoEspecifico && area) {
      const objetivosPorArea = objetivoMulti.objetivosEspecificos.filter(obj => obj.area === area);
      if (objetivosPorArea.length === 1) {
        objetivoEspecifico = objetivosPorArea[0];
        console.log(`🔍 Encontrado por área ${area}: ${objetivoEspecifico.objetivo.substring(0, 50)}...`);
        console.log(`🔍 Módulo asociado: ${objetivoEspecifico.objetivoEspecifico || 'Sin módulo'}`);
      } else if (objetivosPorArea.length > 1) {
        // Si hay múltiples objetivos para la misma área, usar el índice si está disponible
        if (index !== undefined && index < objetivosPorArea.length) {
          objetivoEspecifico = objetivosPorArea[index];
          console.log(`🔍 Encontrado por área ${area} e índice ${index}: ${objetivoEspecifico.objetivo.substring(0, 50)}...`);
          console.log(`🔍 Módulo asociado: ${objetivoEspecifico.objetivoEspecifico || 'Sin módulo'}`);
        } else {
          console.error('❌ Múltiples objetivos encontrados para área:', area);
          console.log('📊 Objetivos disponibles:', objetivosPorArea.map((obj, idx) => 
            `${idx}: [${obj.objetivoEspecifico || 'Sin módulo'}] ${obj.objetivo.substring(0, 50)}...`
          ));
        }
      }
    }
    
    if (!objetivoEspecifico) {
      console.error('❌ Objetivo específico no encontrado');
      console.log('📊 Áreas disponibles:', objetivoMulti.objetivosEspecificos.map(obj => obj.area));
      console.log('📊 Módulos disponibles:', objetivoMulti.objetivosEspecificos.map(obj => obj.objetivoEspecifico));
      console.log('📊 Índices disponibles:', objetivoMulti.objetivosEspecificos.map((obj, idx) => idx));
      return res.status(404).json({ 
        error: `Objetivo específico no encontrado`,
        areasDisponibles: objetivoMulti.objetivosEspecificos.map(obj => obj.area),
        modulosDisponibles: objetivoMulti.objetivosEspecificos.map(obj => obj.objetivoEspecifico),
        indicesDisponibles: objetivoMulti.objetivosEspecificos.map((obj, idx) => idx)
      });
    }
    
    // Validar que el campo sea un indicador válido
    const indicadoresValidos = [
      'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
      'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
      'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
    ];
    
    if (!indicadoresValidos.includes(campo)) {
      console.error('❌ Campo de indicador no válido:', campo);
      return res.status(400).json({ 
        error: "Campo de indicador no válido",
        camposValidos: indicadoresValidos
      });
    }
    
    // Obtener valores actuales del indicador
    const valoresActuales = objetivoEspecifico[campo] || { S1: "", S2: "", S3: "", S4: "", S5: "" };
    
    console.log('🔍 Valores actuales antes de actualizar:', valoresActuales);
    console.log('🔍 Valores recibidos para actualizar:', valores);
    
    // Crear nuevo objeto combinando valores actuales con los nuevos
    // SOLO actualizar los valores que vienen en la petición, mantener los demás
    const nuevosValores = {
      S1: valores.S1 !== undefined ? valores.S1.toString() : valoresActuales.S1,
      S2: valores.S2 !== undefined ? valores.S2.toString() : valoresActuales.S2,
      S3: valores.S3 !== undefined ? valores.S3.toString() : valoresActuales.S3,
      S4: valores.S4 !== undefined ? valores.S4.toString() : valoresActuales.S4,
      S5: valores.S5 !== undefined ? valores.S5.toString() : valoresActuales.S5
    };
    
    console.log('🔍 Nuevos valores combinados:', nuevosValores);
    
    // Actualizar SOLO el campo específico, mantener todo lo demás
    objetivoEspecifico.set(campo, nuevosValores);
    
    // Guardar los cambios
    await objetivoMulti.save();
    
    console.log('✅ Indicador actualizado exitosamente');
    console.log('✅ Valores finales guardados:', objetivoEspecifico[campo]);
    console.log('✅ Información del objetivo:');
    console.log('   - Módulo:', objetivoEspecifico.objetivoEspecifico || 'Sin módulo');
    console.log('   - Objetivo:', objetivoEspecifico.objetivo.substring(0, 60) + '...');
    console.log('   - Área:', objetivoEspecifico.area);
    console.log('   - Departamento:', objetivoEspecifico.departamento);
    
    res.json({
      success: true,
      message: "Indicador actualizado correctamente",
      data: {
        objetivoGeneral: objetivoMulti.nombreObjetivoGeneral,
        objetivoEspecifico: objetivoEspecifico.objetivoEspecifico || 'Sin módulo',
        objetivoDetallado: objetivoEspecifico.objetivo,
        area: objetivoEspecifico.area,
        departamento: objetivoEspecifico.departamento,
        campo: campo,
        valores: objetivoEspecifico[campo],
        objetivoEspecificoId: objetivoEspecifico._id,
        index: objetivoMulti.objetivosEspecificos.indexOf(objetivoEspecifico),
        estructuraJerarquica: objetivoMulti.estructuraJerarquica
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar indicador:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      error: "Error al actualizar indicador",
      message: error.message,
      details: error.stack
    });
  }
};

// Nueva función para obtener estructura jerárquica completa
const obtenerEstructuraJerarquica = async (req, res) => {
  try {
    const { objetivoId } = req.params;
    
    console.log(`🔍 Obteniendo estructura jerárquica para objetivo: ${objetivoId}`);
    
    const objetivo = await Objetivo.findById(objetivoId);
    
    if (!objetivo) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }
    
    if (!objetivo.estructuraJerarquica) {
      // Si no tiene estructura jerárquica, crear una a partir de los datos existentes
      console.log('⚠️ Objetivo no tiene estructura jerárquica, generando a partir de datos...');
      
      const estructuraGenerada = {
        objetivosEspecificos: [],
        objetivosDetalladosPorModulo: []
      };
      
      // Agrupar por módulo (objetivoEspecifico)
      const modulosUnicos = [...new Set(objetivo.objetivosEspecificos.map(obj => obj.objetivoEspecifico).filter(Boolean))];
      
      if (modulosUnicos.length > 0) {
        // Si ya tiene módulos definidos
        modulosUnicos.forEach(modulo => {
          const objetivosDeModulo = objetivo.objetivosEspecificos.filter(obj => obj.objetivoEspecifico === modulo);
          const primerObjetivo = objetivosDeModulo[0];
          
          estructuraGenerada.objetivosEspecificos.push({
            nombre: modulo,
            descripcion: '',
            departamento: primerObjetivo.departamento,
            area: primerObjetivo.area,
            objetivosDetallados: objetivosDeModulo.map(obj => ({
              descripcion: obj.objetivo,
              recursos: obj.recursos,
              metaFrecuencia: obj.metaFrecuencia
            }))
          });
        });
      } else {
        // Si no tiene módulos, tratar cada objetivo como un módulo separado
        objetivo.objetivosEspecificos.forEach((obj, index) => {
          estructuraGenerada.objetivosEspecificos.push({
            nombre: `Módulo ${index + 1}`,
            descripcion: '',
            departamento: obj.departamento,
            area: obj.area,
            objetivosDetallados: [{
              descripcion: obj.objetivo,
              recursos: obj.recursos,
              metaFrecuencia: obj.metaFrecuencia
            }]
          });
        });
      }
      
      res.json(estructuraGenerada);
    } else {
      res.json(objetivo.estructuraJerarquica);
    }
    
  } catch (error) {
    console.error('❌ Error al obtener estructura jerárquica:', error);
    res.status(500).json({ 
      error: "Error al obtener estructura jerárquica",
      details: error.message 
    });
  }
};

module.exports = {
  obtenerObjetivos,
  obtenerObjetivoPorId,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  agregarAccionCorrectiva,
  obtenerObjetivosPorArea,
  getAccionesCorrectivasByArea,
  crearObjetivoMultiDepartamento,
  obtenerObjetivosPorDepartamento,
  reprogramarFechaCompromiso,
  actualizarAccionCorrectiva,
  migrarTodosLosObjetivos,
  actualizarObjetivoEspecifico,
  actualizarIndicadorObjetivoEspecifico,
  obtenerObjetivosMultiPorArea,
  obtenerEstructuraJerarquica
};