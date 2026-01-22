const Datos = require('../models/datosSchema');
const transporter = require('../emailconfig');
const path = require('path');
const fs = require('fs');

const nuevoAuditoria = async (req, res) => {
  try {
    console.log('Payload recibido:', req.body);

    const {
      TipoAuditoria,
      FechaInicio,
      FechaFin,
      Duracion,
      Departamento,
      AreasAudi,
      Auditados,
      AuditorLider,
      AuditorLiderEmail,
      EquipoAuditor,
      Observador,
      NombresObservadores,
      Programa,
      Estado,
      PorcentajeTotal,
      FechaElaboracion,
      Comentario,
      Estatus
    } = req.body;

    // Crear una nueva auditoría
    const nuevaAuditoria = new Datos({
      TipoAuditoria,
      FechaInicio,
      FechaFin,
      Duracion,
      Departamento,
      AreasAudi,
      Auditados,
      AuditorLider,
      AuditorLiderEmail,
      EquipoAuditor,
      Observador,
      NombresObservadores,
      Programa,
      Estado,
      PorcentajeTotal,
      FechaElaboracion,
      Comentario,
      Estatus
    });

    await nuevaAuditoria.save();

    const nombresEquipoAuditor = EquipoAuditor.map(auditor => auditor.Nombre).join(', ');

    const templatePathLider = path.join(__dirname, 'templates', 'lider-asignado.html');
    const emailTemplateLider = fs.readFileSync(templatePathLider, 'utf8');
    const customizedTemplateLider = emailTemplateLider
    .replace('{{usuario}}', AuditorLider)
    .replace('{{Duracion}}', Duracion)
    .replace('{{nombresEquipoAuditor}}', nombresEquipoAuditor);


    // Enviar correo electrónico al Auditor Líder
    const mailOptionsAuditorLider = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      to: AuditorLiderEmail,
      subject: 'Tienes una nueva auditoría',
      html: customizedTemplateLider,
      attachments: [
        {
          filename: 'logoAguida.png',
          path: path.join(__dirname, '../assets/logoAguida-min.png'),
          cid: 'logoAguida' 
        }
      ]
    };

    transporter.sendMail(mailOptionsAuditorLider, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo electrónico al Auditor Líder:', error);
      } else {
        console.log('Correo electrónico enviado al Auditor Líder:', info.response);
        // Después de enviar el correo al Auditor Líder, enviar correos electrónicos a los miembros del equipo auditor
        enviarCorreosMiembrosEquipoAuditor(EquipoAuditor, () => {
          // Después de enviar a los miembros del equipo auditor, enviar correos a los auditados
          enviarCorreosAuditados(Auditados);
        });
      }
    });

    // Función para enviar correos electrónicos a los miembros del equipo auditor de manera escalonada
    const enviarCorreosMiembrosEquipoAuditor = (equipoAuditor, callback) => {
      let correosEnviados = 0;
      equipoAuditor.forEach((miembro, index) => {
        setTimeout(() => {

          const templatePathMiembro = path.join(__dirname, 'templates', 'miembro-asignado.html');
          const emailTemplateMiembro = fs.readFileSync(templatePathMiembro, 'utf8');
          const customizedTemplateMiembro = emailTemplateMiembro
          .replace('{{usuario}}', miembro.Nombre)
          .replace('{{Duracion}}', Duracion)
          .replace('{{AuditorLider}}', AuditorLider);

          const mailOptionsMiembro = {
            from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
            to: miembro.Correo,
            subject: 'Tienes una nueva auditoría',
            html: customizedTemplateMiembro,
            attachments: [
              {
                filename: 'logoAguida.png',
                path: path.join(__dirname, '../assets/logoAguida-min.png'),
                cid: 'logoAguida' 
              }
            ]
          };

          transporter.sendMail(mailOptionsMiembro, (error, info) => {
            if (error) {
              console.error('Error al enviar el correo electrónico al miembro del equipo auditor:', error);
            } else {
              console.log('Correo electrónico enviado al miembro del equipo auditor:', info.response);
            }

            // Incrementa el contador de correos enviados
            correosEnviados++;
            // Verifica si todos los correos han sido enviados
            if (correosEnviados === equipoAuditor.length) {
              callback(); // Llama al callback después de enviar todos los correos
            }
          });
        }, index * 1000); // Ajusta el intervalo de tiempo según sea necesario (en milisegundos)
      });
    };

    // Función para enviar correos electrónicos a los auditados
    const enviarCorreosAuditados = (Auditados) => {
      Auditados.forEach((aud, index) => {
        setTimeout(() => {

          const templatePathAuditado = path.join(__dirname, 'templates', 'auditado-asignado.html');
          const emailTemplateAuditado = fs.readFileSync(templatePathAuditado, 'utf8');
          const customizedTemplateAuditado = emailTemplateAuditado
          .replace('{{usuario}}', aud.Nombre)
          .replace('{{Duracion}}', Duracion)
          .replace('{{AuditorLider}}', AuditorLider);

          const mailOptionsAuditado = {
            from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
            to: aud.Correo,
            subject: 'Tienes una nueva auditoría',
            html: customizedTemplateAuditado,
            attachments: [
              {
                filename: 'logoAguida.png',
                path: path.join(__dirname, '../assets/logoAguida-min.png'),
                cid: 'logoAguida' 
              }
            ]
          };

          transporter.sendMail(mailOptionsAuditado, (error, info) => {
            if (error) {
              console.error('Error al enviar el correo electrónico al auditado:', error);
            } else {
              console.log('Correo electrónico enviado al auditado:', info.response);
            }
          });
        }, index * 1000);
      });
    };

    res.status(201).json({ message: 'Auditoría generada exitosamente' });
  } catch (error) {
    console.error('Error al generar auditoría:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación', details: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
};

const actualizarEstado = async (req, res)=> {
  const { id } = req.params;
    const { programIdx, observaciones, percentage, usuario, PorcentajeTotal, Estado } = req.body;
    try {
      console.log('Payload recibido:', req.body);
        const datos = await Datos.findById(id);
        if (!datos) {
            return res.status(404).json({ error: 'Datos no encontrados' });
        }

        if (PorcentajeTotal !== undefined) {
            datos.PorcentajeTotal = PorcentajeTotal;
            datos.Estado = Estado;  // Actualiza el estado a "Devuelto"

            // Actualizar Estatus basado en PorcentajeTotal
            if (PorcentajeTotal === 100) {
                datos.Estatus = 'Bueno';
            } else if (PorcentajeTotal >= 90) {
                datos.Estatus = 'Bueno';
            } else if (PorcentajeTotal >= 80) {
                datos.Estatus = 'Aceptable';
            } else if (PorcentajeTotal >= 60) {
                datos.Estatus = 'No Aceptable';
            } else if (PorcentajeTotal < 60) {
                datos.Estatus = 'Crítico';
            }

            // Actualizar FechaElaboracion con la fecha actual
            datos.FechaElaboracion = new Date().toISOString();
        } else {
            const programa = datos.Programa[programIdx];
            if (!programa) {
                return res.status(404).json({ error: 'Programa no encontrado' });
            }

            // Actualiza las observaciones
            observaciones.forEach((obs) => {
                const descripcion = programa.Descripcion.find((desc) => desc.ID === obs.ID);
                if (descripcion) {
                    descripcion.Criterio = obs.Criterio; // Agrega esta línea para actualizar el Criterio
                    descripcion.Observacion = obs.Observacion;
                    descripcion.Problema = obs.Problema;
                    descripcion.Hallazgo = obs.Hallazgo;
                }
            });

            // Actualiza el porcentaje del programa
            programa.Porcentaje = percentage.toFixed(2);

            // Calcular el porcentaje total
            const totalPorcentaje = datos.Programa.reduce((acc, prog) => acc + parseFloat(prog.Porcentaje), 0);
            datos.PorcentajeTotal = (totalPorcentaje / datos.Programa.length).toFixed(2);
        }
        await datos.save();

        // Enviar correo solo si Estado es "Realizada"
    if (Estado === 'Realizada') {
      // Leer y personalizar la plantilla
      const templatePath = path.join(__dirname, 'templates', 'revision-auditoria.html');
      const emailTemplate = fs.readFileSync(templatePath, 'utf8');
      const customizedTemplate = emailTemplate.replace('{{usuario}}', usuario);

      // Configuración del correo
      const mailOptionsAuditor = {
        from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
        to: `${process.env.EMAIL_ADMIN}`,
        subject: 'Se ha enviado una auditoría para revisión',
        html: customizedTemplate,
        attachments: [
          {
            filename: 'logoAguida.png',
            path: path.join(__dirname, '../assets/logoAguida-min.png'),
            cid: 'logoAguida' 
          }
        ]
      };

      transporter.sendMail(mailOptionsAuditor, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo electrónico:', error);
        } else {
          console.log('Correo electrónico enviado:', info.response);
        }
      });
    }

    res.status(200).json({ message: 'Datos actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerTodosDatos = async (req, res) => {
  try {
    const datos = await Datos.find();
    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosFiltrados = async (req, res) => {
  const { _id, id, nombre } = req.query;

  try {
      // Busca el dato por su _id
      const datosFiltrados = await Datos.findOne({ _id });

      if (!datosFiltrados) {
          return res.status(404).json({ message: 'Datos no encontrados' });
      }

     // Busca el programa con el nombre específico
    const programaEncontrado = datosFiltrados.Programa.find(prog => prog.Nombre === nombre);

    if (!programaEncontrado) {
      return res.status(404).json({ message: 'Programa no encontrado' });
    }

    // Busca la descripción específica dentro del programa
    const descripcionEncontrada = programaEncontrado.Descripcion.find(desc => desc.ID === id);

    if (!descripcionEncontrada) {
      return res.status(404).json({ message: 'Descripción no encontrada' });
    }

      res.status(200).json({ datosFiltrados, programaEncontrado, descripcionEncontrada });
  } catch (error) {
      console.error('Error al obtener los datos filtrados:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosEsp = async (req, res) => {
  try {
    const datos = await Datos.find({ Estado: 'Terminada' },
      '_id FechaElaboracion TipoAuditoria Duracion Estado Cliente'); 

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosHistorial = async (req, res) => {
  try {
    // Filtrar registros que no tengan el campo PuntuacionMaxima y Estado sea 'Terminada'
    const datos = await Datos.find(
      { PuntuacionMaxima: { $exists: false } }, // Filtrar por ausencia del campo
      'AuditorLider FechaFin Programa.Nombre' // Seleccionar solo los campos necesarios
    );

    // Estructurar los datos para devolver un formato limpio
    const datosFiltrados = datos.map((dato) => ({
      AuditorLider: dato.AuditorLider,
      FechaFin: dato.FechaFin,
      Programa: dato.Programa.map((programa) => programa.Nombre), // Extraer nombres de Programa
    }));

    res.status(200).json(datosFiltrados); // Enviar los datos filtrados al cliente
  } catch (error) {
    console.error('Error al obtener los datos sin PuntuacionMaxima:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosEspFinal = async (req, res) => {
  try {
    // Selecciona solo los campos que deseas incluir en la respuesta
    const datos = await Datos.find({ Estado: 'Finalizado' },'_id FechaElaboracion TipoAuditoria Duracion Estado Cliente'); 

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosEspRealiz = async (req, res) => {
  try {
    // Selecciona solo los campos que deseas incluir en la respuesta
    const datos = await Datos.find({ Estado: 'Realizada' },
      '_id AuditorLider FechaElaboracion TipoAuditoria Duracion Estado Cliente'); 

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosAudLid = async (req, res) => {
  try {
    // Selecciona solo los campos que deseas incluir en la respuesta
    const datos = await Datos.find({ },'_id AuditorLider FechaElaboracion TipoAuditoria Duracion Estado'); 

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosEspAud = async (req, res) => {
  try {
    const { idRep } = req.query;
    console.log("id de reporte",idRep);
    
    // Filtrar por Estado 'Terminada' y nombre dentro del array 'Auditados'
    const datos = await Datos.find({
      _id: idRep,
      Estado: 'Terminada'
    }, '_id FechaElaboracion TipoAuditoria Duracion Estado Cliente'); 

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosEspAll = async (req, res) => {
  try {
    const { correo } = req.query;
    
    // Filtrar por Estado 'Terminada' y nombre dentro del array 'Auditados'
    const datos = await Datos.find({
      AuditorLiderEmail: correo,
    }, '_id FechaElaboracion TipoAuditoria Duracion Estado'); 

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatoPorId = async (req, res) => {
  const { _id } = req.params; // Obtener la ID de los parámetros de la URL

  try {
      const dato = await Datos.findById(_id);
      if (!dato) {
          return res.status(404).json({ error: 'Dato no encontrado' });
      }
      res.status(200).json(dato);
  } catch (error) {
      console.error('Error al obtener el dato:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const obtenerDatosFiltradosAud = async (req, res) => {
  const { _id } = req.params; // Obtener la ID desde la URL
  const { correo } = req.query; // Correo para el filtrado

  try {
    // Buscar el dato específico por ID
    const dato = await Datos.findById(_id);

    if (!dato) {
      return res.status(404).json({ error: 'Dato no encontrado' });
    }

    // Filtrar si el correo coincide con algún correo en el array 'Auditados'
    const esAuditado = dato.Auditados.some(auditado => auditado.Correo === correo);

    if (!esAuditado) {
      return res.status(403).json({ error: 'Acceso denegado. No eres un auditado para este dato.' });
    }

    // Retornar el dato si pasa el filtro
    res.status(200).json(dato);
  } catch (error) {
    console.error('Error al obtener el dato:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

// 🔥 NUEVA FUNCIÓN: Obtener auditorías por auditor
const obtenerAuditoriasPorAuditor = async (req, res) => {
  try {
    const { nombre, correo } = req.query;
    
    console.log('🔍 Buscando auditorías para:', nombre, correo);

    if (!nombre && !correo) {
      return res.status(400).json({ error: 'Se requiere nombre o correo del auditor' });
    }

    // Buscar auditorías donde el usuario sea:
    // 1. Auditor Líder
    // 2. Miembro del Equipo Auditor
    // 3. Auditado (opcional, si quieres contar también estas)
    const auditorias = await Datos.find({
      $or: [
        { AuditorLider: nombre },
        { AuditorLiderEmail: correo },
        { 'EquipoAuditor.Nombre': nombre },
        { 'EquipoAuditor.Correo': correo },
        // Descomentar si quieres contar auditorías como auditado
        // { 'Auditados.Nombre': nombre },
        // { 'Auditados.Correo': correo }
      ],
      Estado: { $in: ['Terminada', 'Finalizado'] } // Solo auditorías completadas
    }).select('_id TipoAuditoria FechaInicio FechaFin AuditorLider EquipoAuditor Auditados Estado');

    console.log(`✅ Se encontraron ${auditorias.length} auditorías completadas`);

    // Clasificar las auditorías
    const clasificacion = {
      comoLider: auditorias.filter(a => a.AuditorLider === nombre).length,
      comoMiembro: auditorias.filter(a => 
        a.EquipoAuditor && a.EquipoAuditor.some(m => m.Nombre === nombre || m.Correo === correo)
      ).length,
      comoAuditado: auditorias.filter(a => 
        a.Auditados && a.Auditados.some(m => m.Nombre === nombre || m.Correo === correo)
      ).length,
      total: auditorias.length,
      detalles: auditorias.map(a => ({
        _id: a._id,
        TipoAuditoria: a.TipoAuditoria,
        FechaInicio: a.FechaInicio,
        FechaFin: a.FechaFin,
        AuditorLider: a.AuditorLider,
        Estado: a.Estado
      }))
    };

    res.json(clasificacion);
  } catch (error) {
    console.error('❌ Error obteniendo auditorías del auditor:', error);
    res.status(500).json({ error: 'Error al obtener auditorías', detalle: error.message });
  }
};

// Carga masiva de auditorías desde un archivo Excel
const cargaMasiva = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const auditorias = data.map(row => ({
      TipoAuditoria: row['TipoAuditoria'],
      FechaInicio: row['FechaInicio'],
      FechaFin: row['FechaFin'],
      Duracion: row['Duracion'],
      Departamento: row['Departamento'],
      AreasAudi: row['AreasAudi'],
      Auditados: row['Auditados'],
      AuditorLider: row['AuditorLider'],
      AuditorLiderEmail: row['AuditorLiderEmail'],
      EquipoAuditor: row['EquipoAuditor'] ? JSON.parse(row['EquipoAuditor']) : [],
      Observador: row['Observador'],
      NombresObservadores: row['NombresObservadores'],
      Programa: row['Programa'] ? JSON.parse(row['Programa']) : [],
      Estado: row['Estado'],
      PorcentajeTotal: row['PorcentajeTotal'],
      FechaElaboracion: row['FechaElaboracion'],
      Comentario: row['Comentario'],
      Estatus: row['Estatus']
    }));

    await Datos.insertMany(auditorias);

    res.status(201).json({ message: 'Datos cargados exitosamente' });
  } catch (error) {
    console.error('Error al cargar datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const datosEstado = async (req, res)=>{
  const { id } = req.params;
    const { Estado,AuditorLiderEmail, Comentario, PorcentajeCump, PuntuacionObten, PuntuacionConf, Estatus, PorcentajeTotal} = req.body; 
    console.log(req.body);
    try {
      console.log('Payload recibido:', req.body);
        const datos = await Datos.findById(id);
        if (!datos) {
            return res.status(404).json({ error: 'Datos no encontrados' });
        }

        const update = { Estado };
        if (Comentario !== undefined)      update.Comentario = Comentario;
        if (PorcentajeCump !== undefined)  update.PorcentajeCump = PorcentajeCump;
        if (PuntuacionObten !== undefined) update.PuntuacionObten = PuntuacionObten;
        if (PuntuacionConf !== undefined)  update.PuntuacionConf = PuntuacionConf;
        if (Estatus !== undefined)         update.Estatus = Estatus;
        if (PorcentajeTotal !== undefined) update.PorcentajeTotal = PorcentajeTotal;

        // 2) Actualiza y devuelve el documento actualizado
        const updated = await Datos.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
        if (!updated) return res.status(404).json({ error: 'Datos no encontrados' });

        let estadoEmail = Estado;
        let comentario = Comentario;

        if (Estado === 'Devuelto') {
              estadoEmail = 'rechazada';
        }
        if (Estado === 'Terminada') {
          estadoEmail = 'aprobada';
          comentario = '';
        }

      const templatePathEstado = path.join(__dirname, 'templates', 'auditoria-estado.html');
      const emailTemplateEstado = fs.readFileSync(templatePathEstado, 'utf8');
      const customizedTemplateEstado = emailTemplateEstado
      .replace(/{{Estado}}/g, estadoEmail)
      .replace('{{Comentario}}', comentario);

         // Enviar correo electrónico al Auditor Líder
    const mailOptionsAdministrador = {
      from: `"Auditapp" <${process.env.EMAIL_USERNAME}>`,
      to: AuditorLiderEmail,
      subject: 'Auditoría '+estadoEmail,
      html: customizedTemplateEstado,
      attachments: [
        {
          filename: 'logoAguida.png',
          path: path.join(__dirname, '../assets/logoAguida-min.png'),
          cid: 'logoAguida' 
        }
      ]
    };

    transporter.sendMail(mailOptionsAdministrador, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo electrónico al Auditor:', error);
      } else {
        console.log('Correo electrónico enviado al Auditor:', info.response);
      }
    });

    return res.status(200).json(updated);
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

const eliminarRegistro = async (req, res) => {
  const { _id } = req.params;

  try {
    // Verificar si el registro existe
    const registroEliminado = await Datos.findByIdAndDelete(_id);

    if (!registroEliminado) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.status(200).json({ message: 'Registro eliminado exitosamente', data: registroEliminado });
  } catch (error) {
    console.error('Error al eliminar el registro:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const deleteImageUrl = async (req, res) => {
  try {
    const { docId, imageUrl } = req.body;

    console.log('Datos recibidos en el cuerpo: ', req.body)

    // Validamos que se reciban los datos necesarios
    if (!docId || !imageUrl) {
      return res.status(400).json({ message: 'Se requiere docId e imageUrl.' });
    }

    // Actualizamos el documento, eliminando la URL del arreglo "Hallazgo"
    const updatedDoc = await Datos.findByIdAndUpdate(
      docId,
      { $pull: { 'Programa.0.Descripcion.$[].Hallazgo': imageUrl } }, // Ajusta la ruta según la estructura real
      { new: true } // Retorna el documento actualizado
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: 'Documento no encontrado.' });
    }

    return res.status(200).json({
      message: 'Imagen eliminada exitosamente de la base de datos.',
      document: updatedDoc,
    });
  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  nuevoAuditoria,
  obtenerTodosDatos,
  cargaMasiva,
  actualizarEstado,
  datosEstado,
  obtenerDatosEsp,
  obtenerDatoPorId,
  obtenerDatosFiltrados,
  obtenerDatosEspAud,
  obtenerDatosFiltradosAud,
  obtenerDatosEspFinal,
  eliminarRegistro,
  obtenerDatosEspRealiz,
  obtenerDatosHistorial,
  obtenerDatosAudLid,
  deleteImageUrl,
  obtenerAuditoriasPorAuditor,
  obtenerDatosEspAll
};