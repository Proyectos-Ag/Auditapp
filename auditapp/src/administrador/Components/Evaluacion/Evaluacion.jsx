import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';

const Evaluaciones = () => {
  const [auditores, setAuditores] = useState([]);
  const [selectedAuditor, setSelectedAuditor] = useState('');
  const [selectedFolio, setSelectedFolio] = useState('');
  const [selectedAuditoria, setSelectedAuditoria] = useState('');
  const [selectedAudi, setSelectedAudi] = useState('');
  const [evaluacionExistente, setEvaluacionEx] = useState('');
  const [evaluacion, setEvaluacion] = useState({
    
    cursos: {
      'Auditor interno en el SGI': { calificacion: '', aprobado: false },
      'BPM´s': { calificacion: '', aprobado: false },
      'HACCP': { calificacion: '', aprobado: false },
      'PPR´s': { calificacion: '', aprobado: false },
      'Microbiología básica': { calificacion: '', aprobado: false },
    },
    conocimientos: {
      'Conocimiento del proceso de la empresa': '',
      'Documentos del SGI y de referencia': '',
      'Requisitos legales aplicables': '',
      'Principios, procedimientos y técnicas de auditoria': '',
      'Recopila información': '',
    },
    atributos: {
      'Ético (imparcial, honesto, discreto)': '',
      'Versátil (se adapta fácilmente a las diferentes situaciones)': '',
      'Perceptivo (consciente y capaz de entender las situaciones)': '',
      'De mente abierta (muestra disposición a considerar ideas o puntos de vista alternativos)': '',
      'Diplomático (muestra tacto en las relaciones personales)': '',
      'Observador (consciente del entorno físico y de las actividades)': '',
      'Seguro de sí mismo (actúa y funciona de manera independiente, a la vez se relaciona eficazmente con los otros)': '',
      'Presentación ecuánime (informa con veracidad y exactitud los hallazgos, conclusiones e informes de la auditoría, entrega en tiempo y forma los reportes de auditoría, presentación personal idónea)': '',
    },
    experiencia: {
      tiempoLaborando: '',
      equipoInocuidad: false,
      auditoriasInternas: ''
    }
  });

  const [resultadoFinal, setResultadoFinal] = useState(0);
  const [auditorDetails, setAuditorDetails] = useState(null); // Para guardar los detalles del auditor
  const [formacionProfesional, setFormacionProfesional] = useState({
    nivelEstudios: '',
    especialidad: '',
    puntuacion: 0,
    comentarios: ''
  });

  // Verificar si selectedFolio coincide con folio en evaluacionExistente
  useEffect(() => {
    if (selectedFolio && evaluacionExistente.length > 0) {
      const registro = evaluacionExistente.find((item) => item.folio === selectedFolio);

      if (registro) {
        // Actualizar el estado evaluacion con los datos del registro encontrado
        setEvaluacion({
          cursos: registro.cursos.reduce((acc, curso) => {
            acc[curso.nombreCurso] = { calificacion: curso.calificacion, aprobado: curso.aprobado };
            return acc;
          }, {}),
          conocimientos: registro.conocimientosHabilidades.reduce((acc, conocimiento) => {
            acc[conocimiento.conocimiento] = conocimiento.puntuacion;
            return acc;
          }, {}),
          atributos: registro.atributosCualidadesPersonales.reduce((acc, atributo) => {
            acc[atributo.atributo] = atributo.puntuacion;
            return acc;
          }, {}),
          experiencia: registro.experiencia,
        });
      }
    }
  }, [selectedFolio, evaluacionExistente]);

  useEffect(() => {
    const obtenerAuditores = async () => {
      try {
        const responseEvaluacion = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/evaluacion`);
        console.log('Estado',responseEvaluacion.data)
        setEvaluacionEx(responseEvaluacion.data);
        // Obtener los datos con los IDs y nombres de AuditorLider
        const responseDatos = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/aud-lid`);
  
        console.log('Datos obtenidos:', responseDatos.data);
  
        // Crear una lista con objetos que incluyan ID y AuditorLider
        const auditoresLider = responseDatos.data.map(dato => ({
          idRegistro: dato._id,
          nombreLider: dato.AuditorLider,
          tipoAuditoria: dato.TipoAuditoria,
          duracion: dato.Duracion
        }));
  
        if (!auditoresLider.length) {
          console.error("No se encontraron AuditoresLider en los datos obtenidos");
          return;
        }
  
        // Obtener la lista de usuarios
        const responseUsuarios = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
  
        // Asociar cada AuditorLider con su usuario y conservar el ID del registro
        const auditoresFiltrados = auditoresLider.map(({ idRegistro, nombreLider, duracion, tipoAuditoria }) => {
          const usuarioEncontrado = responseUsuarios.data.find(usuario => usuario.Nombre === nombreLider);
          if (usuarioEncontrado) {
            return { ...usuarioEncontrado, idRegistro, nombreLider, duracion, tipoAuditoria };
          }
          return null;
        }).filter(Boolean); // Eliminar valores nulos si no hay coincidencia

        const filteredAuditores = auditoresFiltrados.filter(auditor => {
          // Excluir los auditores que tengan coincidencias con evaluaciones "Completas"
          return !responseEvaluacion.data.some(evaluacion => {
            return evaluacion.auditoriaId === auditor.idRegistro && evaluacion.estado !== "Incompleta";
          });
        });        

        console.log('Filtrado',filteredAuditores)
  
        console.log('Auditores con duplicados e IDs de registros:', auditoresFiltrados);
        setAuditores(filteredAuditores);
        console.log('Aver',auditoresFiltrados)
      } catch (error) {
        console.error('Error al obtener auditores:', error);
      }
    };
  
    obtenerAuditores();
  }, []);  
  
  
  useEffect(() => {
    if (selectedAuditor) {
      console.log('Selected Auditor:', selectedAuditor);
      console.log('Auditores disponibles:', auditores);

      const auditor = auditores.find(a => `${a._id}_${a.idRegistro}` === selectedAuditor);
      console.log('Auditor:', auditor);
      setAuditorDetails(auditor);

      // Actualizar la sección de formación profesional
      if (auditor) {
        const puntuacionPorEscolaridad = {
          'Profesional': 3,
          'TSU': 2,
          'Preparatoria': 1
        };

        setFormacionProfesional({
          nivelEstudios: auditor.Escolaridad || '',
          especialidad: auditor.Carrera || '',
          puntuacion: puntuacionPorEscolaridad[auditor.Escolaridad] || 0,
          comentarios: ''
        });
      }
    } else {
      setSelectedFolio(null);
      setAuditorDetails(null);
      setFormacionProfesional({
        nivelEstudios: '',
        especialidad: '',
        puntuacion: 0,
        comentarios: ''
      });
    }
  }, [selectedAuditor, auditores]);

  useEffect(() => {
    calcularResultadoFinal();
  },);

  const manejarCambio = (event) => {
    const { name, value, type, checked } = event.target;
    const [categoria, tipo] = name.split('.');

    if (categoria === 'cursos') {
      const numeroValor = parseFloat(value) || 0;
      setEvaluacion(prevState => ({
        ...prevState,
        cursos: {
          ...prevState.cursos,
          [tipo]: { ...prevState.cursos[tipo], calificacion: numeroValor, aprobado: numeroValor >= 80 }
        }
      }));
    } else if (categoria === 'conocimientos') {
      const numeroValor = parseFloat(value) || 0;
      setEvaluacion(prevState => ({
        ...prevState,
        conocimientos: {
          ...prevState.conocimientos,
          [tipo]: numeroValor
        }
      }));
    } else if (categoria === 'atributos') {
      const numeroValor = parseFloat(value) || 0;
      setEvaluacion(prevState => ({
        ...prevState,
        atributos: {
          ...prevState.atributos,
          [tipo]: numeroValor
        }
      }));
    } else if (categoria === 'experiencia') {
      if (type === 'checkbox') {
        setEvaluacion(prevState => ({
          ...prevState,
          experiencia: {
            ...prevState.experiencia,
            [tipo]: checked
          }
        }));
      } else {
        setEvaluacion(prevState => ({
          ...prevState,
          experiencia: {
            ...prevState.experiencia,
            [tipo]: value
          }
        }));
      }
    } else if (categoria === 'formacionProfesional') {
      setFormacionProfesional(prevState => ({
        ...prevState,
        [tipo]: value
      }));
    }
  };

  // Función para formatear la fecha en formato DD/MM/YYYY
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const calcularResultadoFinal = () => {
    // Total de puntos para cursos
    const totalCursos = Object.keys(evaluacion.cursos).length;
    const cursosAprobados = Object.values(evaluacion.cursos).filter(curso => curso.aprobado).length;

    // Puntos obtenidos en cursos (Capacitación)
    const puntosCursos = (cursosAprobados / totalCursos) * 5; // La puntuación máxima de capacitación es 5
    const porcentajeCursos = (puntosCursos / 5) * 30; // 30% del total corresponde a capacitación

    // Puntos de conocimientos y habilidades
    const puntosConocimientos = Object.values(evaluacion.conocimientos).reduce((a, b) => a + b, 0);
    const porcentajeConocimientos = (puntosConocimientos / (5 * Object.keys(evaluacion.conocimientos).length)) * 30; // 30% del total

    // Puntos de atributos y cualidades personales
    const puntosAtributos = Object.values(evaluacion.atributos).reduce((a, b) => a + b, 0);
    const porcentajeAtributos = (puntosAtributos / 40) * 20; // 20% del total corresponde a atributos y cualidades personales

    // Puntos de experiencia
    let puntosExperiencia = 0;
    switch (evaluacion.experiencia.tiempoLaborando) {
      case 'menos de 2 años':
        puntosExperiencia += 1;
        break;
      case 'de 2 a 5 años':
        puntosExperiencia += 4;
        break;
      case 'más de 5 años':
        puntosExperiencia += 5;
        break;
      default:
        puntosExperiencia += 0;
        break;
    }
  
    if (evaluacion.experiencia.equipoInocuidad) puntosExperiencia += 2;
    const auditorias = evaluacion.experiencia.auditoriasInternas;
    switch (auditorias) {
      case '4':
        puntosExperiencia += 3;
        break;
      case '3':
        puntosExperiencia += 2;
        break;
      case '2':
        puntosExperiencia += 1;
        break;
      case '1':
        puntosExperiencia += 1;
        break;
      case '0':
        puntosExperiencia += 0;
        break;
      default:
        puntosExperiencia += 0;
        break;
    }

    const porcentajeExperiencia = (puntosExperiencia / 10) * 10; // 10% del total corresponde a experiencia
  
    // Puntos de formación profesional
    let puntosFormacionProfesional = 0;
    switch (formacionProfesional.nivelEstudios) {
      case 'Profesional':
        puntosFormacionProfesional = 3;
        break;
      case 'TSU':
        puntosFormacionProfesional = 2;
        break;
      case 'Preparatoria':
        puntosFormacionProfesional = 1;
        break;
      default:
        puntosFormacionProfesional = 0;
    }
    const porcentajeFormacionProfesional = (puntosFormacionProfesional / 3) * 10; // 10% del total corresponde a formación profesional
  
    // Calcular resultado final con un máximo de 100%
    const resultadoFinalCalculado = Math.min(
      porcentajeCursos + porcentajeConocimientos + porcentajeAtributos + porcentajeExperiencia + porcentajeFormacionProfesional, 100
    );
  
    setResultadoFinal(resultadoFinalCalculado);
};

  const limpiarCampos = () => {
    setEvaluacion({
      cursos: {
        'Auditor interno en el SGI': { calificacion: '', aprobado: false },
        'BPM´s': { calificacion: '', aprobado: false },
        'HACCP': { calificacion: '', aprobado: false },
        'PPR´s': { calificacion: '', aprobado: false },
        'Microbiología básica': { calificacion: '', aprobado: false },
      },
      conocimientos: {
        'Conocimiento del proceso de la empresa': '',
        'Documentos del SGI y de referencia': '',
        'Requisitos legales aplicables': '',
        'Principios, procedimientos y técnicas de auditoria': '',
        'Recopila información': '',
      },
      atributos: {
        'Ético (imparcial, honesto, discreto)': '',
        'Versátil (se adapta fácilmente a las diferentes situaciones)': '',
        'Perceptivo (consciente y capaz de entender las situaciones)': '',
        'De mente abierta (muestra disposición a considerar ideas o puntos de vista alternativos)': '',
        'Diplomático (muestra tacto en las relaciones personales)': '',
        'Observador (consciente del entorno físico y de las actividades)': '',
        'Seguro de sí mismo (actúa y funciona de manera independiente, a la vez se relaciona eficazmente con los otros)': '',
        'Presentación ecuánime (informa con veracidad y exactitud los hallazgos, conclusiones e informes de la auditoría, entrega en tiempo y forma los reportes de auditoría, presentación personal idónea)': '',
      },
      experiencia: {
        tiempoLaborando: '',
        equipoInocuidad: false,
        auditoriasInternas: ''
      }
    });
    setSelectedAuditor('');
    setResultadoFinal(0);
    setFormacionProfesional({
      nivelEstudios: '',
      especialidad: '',
      puntuacion: 0,
      comentarios: ''
    });
  }; 

  const guardarEvaluacionConEstado = async (estado) => {
    try {
      const cursosArray = Object.entries(evaluacion.cursos).map(([nombreCurso, datos]) => ({
        nombreCurso,
        calificacion: Number(datos.calificacion) || null, // Enviar vacío si no hay calificación
        aprobado: datos.aprobado !== undefined ? datos.aprobado : null, // Enviar vacío si no hay aprobado
      }));
  
      const conocimientosHabilidadesArray = Object.entries(evaluacion.conocimientos).map(([conocimiento, puntuacion]) => ({
        conocimiento,
        puntuacion: puntuacion !== undefined ? puntuacion : null, // Enviar vacío si no hay puntuación
      }));
  
      const atributosArray = Object.entries(evaluacion.atributos).map(([atributo, puntuacion]) => ({
        atributo,
        puntuacion: puntuacion !== undefined ? puntuacion : null, // Enviar vacío si no hay puntuación
      }));
  
      let evaluacionExistente = null;
      try {
        // Consulta para verificar si el registro ya existe
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/${selectedFolio}`);
        evaluacionExistente = response.data;
        console.log('Evaluación existente:', evaluacionExistente);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('Registro no encontrado, se creará uno nuevo.');
        } else {
          console.error('Error al verificar la existencia de la evaluación:', error);
          throw error; // Si hay otro error, termina la ejecución aquí
        }
      }
  
      // Si existe, realiza una actualización; si no, crea el registro
      if (evaluacionExistente) {
        // Actualizar registro existente con PUT
        console.log('Actualizando evaluación...');
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/folio/${selectedFolio}`, {
          folio: selectedFolio,
          cursos: cursosArray,
          conocimientosHabilidades: conocimientosHabilidadesArray,
          atributosCualidadesPersonales: atributosArray,
          experiencia: evaluacion.experiencia !== undefined ? evaluacion.experiencia : null, // Enviar vacío si no hay experiencia
          formacionProfesional: formacionProfesional !== undefined ? formacionProfesional : null, // Enviar vacío si no hay formación
          porcentajeTotal: resultadoFinal !== undefined ? resultadoFinal : null, // Enviar vacío si no hay porcentaje
          estado,
        });
        alert(`Evaluación actualizada como ${estado}`);
      } else {
        // Crear un nuevo registro con POST
        console.log('Creando nueva evaluación...');
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/evaluacion`, {
          folio: selectedFolio,
          auditoriaId:selectedAuditoria,
          auditorId: selectedAudi,
          nombre:auditorDetails.Nombre,
          cursos: cursosArray,
          conocimientosHabilidades: conocimientosHabilidadesArray,
          atributosCualidadesPersonales: atributosArray,
          experiencia: evaluacion.experiencia !== undefined ? evaluacion.experiencia : null, // Enviar vacío si no hay experiencia
          formacionProfesional: formacionProfesional !== undefined ? formacionProfesional : null, // Enviar vacío si no hay formación
          porcentajeTotal: resultadoFinal !== undefined ? resultadoFinal : null, // Enviar vacío si no hay porcentaje
          estado,
        });
        alert(`Evaluación guardada como ${estado}`);
      }
  
      limpiarCampos();
    } catch (error) {
      console.error('Error al guardar o actualizar la evaluación:', error);
    }
  };

  const handleAuditorSelect = (auditorId, idRegistro, Nombre) => {
    // Obtener las iniciales del nombre
    const iniciales = Nombre.split(' ') // Divide el nombre por espacios
      .map(palabra => palabra.charAt(0).toUpperCase()) // Obtiene la primera letra de cada palabra y la convierte en mayúscula
      .join(''); // Une las iniciales en una cadena
  
    // Construir folioKey con las iniciales y el idRegistro
    const auditorKey = `${auditorId}_${idRegistro}`;
    const folioKey = `${idRegistro}${iniciales}`;
  
    if (selectedAuditor === auditorId) {
      // Deseleccionar si se hace clic en el auditor ya seleccionado
      setSelectedAuditor(null);
      setSelectedFolio(null);
      setSelectedAuditoria(null);
      setSelectedAudi(null);
    } else {
      // Seleccionar un auditor y ocultar los demás
      setSelectedAuditor(auditorKey);
      setSelectedFolio(folioKey);
      setSelectedAuditoria(idRegistro);
      setSelectedAudi(auditorId);
    }
  };  


  return (
   <Box sx={{ padding: '20px', marginTop: '50px' }}>
    <div>
        <h1>Seleccione un Auditor</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {auditores
            .map((auditor) => (
              <div
                key={auditor.idRegistro}
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  borderRadius: "8px",
                  background: selectedAuditor === `${auditor._id}_${auditor.idRegistro}` ? "#f0f8ff" : "#fff",
                  cursor: "pointer",
                  display:
                    selectedAuditor && selectedAuditor !== `${auditor._id}_${auditor.idRegistro}`
                      ? "none"
                      : "block",
                }}
                onClick={() => handleAuditorSelect(auditor._id, auditor.idRegistro, auditor.Nombre)}
              >
                <h3>{auditor.Nombre}</h3>
                <p>{auditor.duracion}</p>
                <p>{auditor.tipoAuditoria}</p>
                <p>{auditor.idRegistro}</p>
              </div>
            ))}
        </div>
        {selectedAuditor && (
          <Button
            onClick={limpiarCampos}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Mostrar todos
          </Button>
        )}
      </div>

      {selectedAuditor && (
        <>
      <Box sx={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>

      <h1>Evaluación de Auditores Internos</h1>
      <p>GCF070</p>
      <p><strong>Departamento:</strong> {auditorDetails ? auditorDetails.Departamento : 'Seleccione un auditor'}</p>
      <p><strong>Folio:</strong> {selectedFolio}</p>
      <p><strong>Nombre:</strong> {auditorDetails ? auditorDetails.Nombre : 'Seleccione un auditor'}</p>
      <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
      <p><strong>Fecha de Ingreso:</strong> {auditorDetails ? formatearFecha(auditorDetails.FechaIngreso) : 'N/A'}</p>
      <p>La siguiente evaluación deberá ser llenada por el Gerente de Gestión para la Calidad y será aplicada a partir de la ejecución de la primera auditoría con la finalidad de conocer el rango del auditor interno.</p>

          <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">Evaluación de Cursos</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Curso</TableCell>
                  <TableCell>Calificación (%)</TableCell>
                  <TableCell>Aprobado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(evaluacion.cursos).map((curso) => (
                  <TableRow key={curso}>
                    <TableCell>{curso}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        name={`cursos.${curso}`}
                        value={evaluacion.cursos[curso].calificacion}
                        onChange={manejarCambio}
                        inputProps={{ min: 0, max: 100 }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{evaluacion.cursos[curso].aprobado ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">Conocimientos y Habilidades</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Conocimiento/Habilidad</TableCell>
                  <TableCell>Puntuación (1-5)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(evaluacion.conocimientos).map((conocimientos) => (
                  <TableRow key={conocimientos}>
                    <TableCell>{conocimientos}</TableCell>
                    <TableCell>
                      <TextField
                         type="number"
                         name={`conocimientos.${conocimientos}`}
                         value={evaluacion.conocimientos[conocimientos]}
                         onChange={manejarCambio}
                         inputProps={{
                          min: 1,
                          max: 5,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">Atributos y Cualidades Personales</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Atributo/Cualidad</TableCell>
                  <TableCell>Puntuación (1-5)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(evaluacion.atributos).map((atributo) => (
                  <TableRow key={atributo}>
                    <TableCell>{atributo}</TableCell>
                    <TableCell>
                      <TextField
                         type="number"
                         name={`atributos.${atributo}`}
                         value={evaluacion.atributos[atributo]}
                         onChange={manejarCambio}
                         inputProps={{
                          min: 1,
                          max: 5,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">Evaluación de Experiencia</Typography>
          <TableContainer>
            <Table>
              <TableBody>
                  <TableRow >
                    <TableCell>
                    Tiempo laborando en la planta:
                    </TableCell>
                    <TableCell>
                    <Select
                    name="experiencia.tiempoLaborando"
                    value={evaluacion.experiencia.tiempoLaborando}
                    onChange={manejarCambio}
                  >
                    <MenuItem value="">Seleccione</MenuItem>
                    <MenuItem value="menos de 2 años">Menos de 2 años</MenuItem>
                    <MenuItem value="de 2 a 5 años">De 2 a 5 años</MenuItem>
                    <MenuItem value="más de 5 años">Más de 5 años</MenuItem>
                  </Select>
                    </TableCell>
                  </TableRow>

                  <TableRow >
                  <TableCell>
                  Forma parte del equipo de inocuidad:
                  </TableCell>
                  <TableCell>
                  <input
                    type="checkbox"
                    name="experiencia.equipoInocuidad"
                    checked={evaluacion.experiencia.equipoInocuidad}
                    onChange={manejarCambio}
                  />
                  </TableCell>
                </TableRow>

                <TableRow >
                  <TableCell>
                  Participación en auditorías internas:
                  </TableCell>
                  <TableCell>
                  <Select
                    name="experiencia.auditoriasInternas"
                    value={evaluacion.experiencia.auditoriasInternas}
                    onChange={manejarCambio}
                  >
                    <MenuItem value="">Seleccione</MenuItem>
                    <MenuItem value="4">4</MenuItem>
                    <MenuItem value="3">3</MenuItem>
                    <MenuItem value="2">2</MenuItem>
                    <MenuItem value="1">1</MenuItem>
                    <MenuItem value="0">0</MenuItem>
                  </Select>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">Formación Profesional</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nivel de Estudios</TableCell>
                  <TableCell>Especialidad</TableCell>
                  <TableCell>Puntuación</TableCell>
                  <TableCell>Comentarios</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                
                  <TableRow >
                    <TableCell>
                    <Select
                    name="formacionProfesional.nivelEstudios"
                    value={formacionProfesional.nivelEstudios}
                    onChange={manejarCambio}
                  >
                    <MenuItem value="">Selecciona</MenuItem>
                    <MenuItem value="Profesional">Profesional</MenuItem>
                    <MenuItem value="TSU">TSU</MenuItem>
                    <MenuItem value="Preparatoria">Preparatoria</MenuItem>
                  </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        label="Especialidad"
                        name="formacionProfesional.especialidad"
                        value={formacionProfesional.especialidad}
                        onChange={manejarCambio}
                        variant="standard" // También puedes usar "filled" o "standard"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                    {formacionProfesional.puntuacion}
                    </TableCell>
                    <TableCell>
                      <TextField
                        label="Comentario"
                        name="formacionProfesional.comentarios"
                        value={formacionProfesional.comentarios}
                        onChange={manejarCambio}
                        variant="standard" // También puedes usar "filled" o "standard"
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <h1>Resultado Final: {resultadoFinal.toFixed(2)}%</h1>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '20px',
          }}
        >

          <Button
            onClick={() => guardarEvaluacionConEstado('Incompleta')}
            sx={{
              backgroundColor: 'blue',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'darkred',
              },
            }}
          >
            Guardar Cambios
          </Button>

          <Button
            onClick={() => guardarEvaluacionConEstado('Completa')}
            sx={{
              backgroundColor: 'green',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'darkred',
              },
            }}
          >
            Guardar Evaluación
          </Button>
        </Box>
      </Box>
      </>
      )}
    </Box>
  );
};

export default Evaluaciones;