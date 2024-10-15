import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from "../Navigation/Navbar";
import styles from './css/Evalua.module.css';

const Evaluaciones = () => {
  const [auditores, setAuditores] = useState([]);
  const [selectedAuditor, setSelectedAuditor] = useState('');
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


  useEffect(() => {
    const obtenerAuditores = async () => {
      try {
        const respuesta = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
        const auditoresFiltrados = respuesta.data.filter(usuario => usuario.TipoUsuario === 'auditor');
        setAuditores(auditoresFiltrados);
      } catch (error) {
        console.error('Error al obtener auditores:', error);
      }
    };

    obtenerAuditores();
  }, []);

  useEffect(() => {
    if (selectedAuditor) {
      const auditor = auditores.find(a => a._id === selectedAuditor);
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

  const SelectedAuditor = async (auditorId) => {
    try {
      // Actualiza el auditor seleccionado
      setSelectedAuditor(auditorId);
      
      // Verifica si existe un registro "Incompleta"
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/${auditorId}/estado/incompleta`);
      const evaluacionExistente = response.data;
  
      if (evaluacionExistente) {
        console.log('Registro con estado "Incompleta" encontrado:', evaluacionExistente);
        
        // Actualiza el estado local de la evaluación con los datos existentes
        setEvaluacion({
          cursos: evaluacionExistente.cursos || {},
          conocimientos: evaluacionExistente.conocimientosHabilidades || {},
          atributos: evaluacionExistente.atributosCualidadesPersonales || {},
          experiencia: evaluacionExistente.experiencia || {},
          formacionProfesional: evaluacionExistente.formacionProfesional || {},
        });
  
        // Cargar otros detalles, si es necesario
      } else {
        console.log('No hay registro con estado "Incompleta".');
        limpiarCampos(); // Si no existe, limpia los campos para una nueva evaluación
      }
    } catch (error) {
      console.error('Error al verificar el estado de la evaluación:', error);
    }
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
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/${selectedAuditor}`);
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
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/${selectedAuditor}`, {
          auditorId: selectedAuditor,
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
          auditorId: selectedAuditor,
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
     

  return (
  <div>
    <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
    <div className={styles.evaluaciones}>
      <h1>Evaluación de Auditores Internos</h1>
      <p>GESTIÓN PARA LA CALIDAD</p>
      <p>GCF070</p>
      <p><strong>Folio:</strong> 3</p>
      <p><strong>Nombre:</strong> {auditorDetails ? auditorDetails.Nombre : 'Seleccione un auditor'}</p>
      <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
      <p><strong>Fecha de Ingreso:</strong> {auditorDetails ? formatearFecha(auditorDetails.FechaIngreso) : 'N/A'}</p>
      <p>La siguiente evaluación deberá ser llenada por el Gerente de Gestión para la Calidad y será aplicada a partir de la ejecución de la primera auditoría con la finalidad de conocer el rango del auditor interno.</p>
      <select onChange={(e) => SelectedAuditor(e.target.value)} value={selectedAuditor}>
        <option value="">Selecciona un auditor</option>
        {auditores.map(auditor => (
          <option key={auditor._id} value={auditor._id}>{auditor.Nombre}</option>
        ))}
      </select>

      {selectedAuditor && (
        <>
          <h2>Evaluación de Cursos</h2>
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Calificación (%)</th>
                <th>Aprobado</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(evaluacion.cursos).map(curso => (
                <tr key={curso}>
                  <td>{curso}</td>
                  <td>
                    <input
                      type="number"
                      name={`cursos.${curso}`}
                      value={evaluacion.cursos[curso].calificacion}
                      onChange={manejarCambio}
                      min="0"
                      max="100"
                    />
                  </td>
                  <td>{evaluacion.cursos[curso].aprobado ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Conocimientos y Habilidades</h2>
          <table>
            <thead>
              <tr>
                <th>Conocimiento/Habilidad</th>
                <th>Puntuación (1-5)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(evaluacion.conocimientos).map(conocimiento => (
                <tr key={conocimiento}>
                  <td>{conocimiento}</td>
                  <td>
                    <input
                      type="number"
                      name={`conocimientos.${conocimiento}`}
                      value={evaluacion.conocimientos[conocimiento]}
                      onChange={manejarCambio}
                      min="1"
                      max="5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Atributos y Cualidades Personales</h2>
          <table>
            <thead>
              <tr>
                <th>Atributo/Cualidad</th>
                <th>Puntuación (1-5)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(evaluacion.atributos).map(atributo => (
                <tr key={atributo}>
                  <td>{atributo}</td>
                  <td>
                    <input
                      type="number"
                      name={`atributos.${atributo}`}
                      value={evaluacion.atributos[atributo]}
                      onChange={manejarCambio}
                      min="1"
                      max="5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Evaluación de Experiencia</h2>
          <table>
            <tbody>
              <tr>
                <td>Tiempo laborando en la planta:</td>
                <td>
                  <select
                    name="experiencia.tiempoLaborando"
                    value={evaluacion.experiencia.tiempoLaborando}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona</option>
                    <option value="menos de 2 años">Menos de 2 años</option>
                    <option value="de 2 a 5 años">De 2 a 5 años</option>
                    <option value="más de 5 años">Más de 5 años</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Forma parte del equipo de inocuidad:</td>
                <td>
                  <input
                    type="checkbox"
                    name="experiencia.equipoInocuidad"
                    checked={evaluacion.experiencia.equipoInocuidad}
                    onChange={manejarCambio}
                  />
                </td>
              </tr>
              <tr>
                <td>Participación en auditorías internas:</td>
                <td>
                  <select
                    name="experiencia.auditoriasInternas"
                    value={evaluacion.experiencia.auditoriasInternas}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona</option>
                    <option value="4">4</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                    <option value="0">0</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Formación Profesional</h2>
          <table>
            <thead>
              <tr>
                <th>Nivel de Estudios</th>
                <th>Especialidad</th>
                <th>Puntuación</th>
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <select
                    name="formacionProfesional.nivelEstudios"
                    value={formacionProfesional.nivelEstudios}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona</option>
                    <option value="Profesional">Profesional</option>
                    <option value="TSU">TSU</option>
                    <option value="Preparatoria">Preparatoria</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name="formacionProfesional.especialidad"
                    value={formacionProfesional.especialidad}
                    onChange={manejarCambio}
                  />
                </td>
                <td>{formacionProfesional.puntuacion}</td>
                <td>
                  <input
                    type="text"
                    name="formacionProfesional.comentarios"
                    value={formacionProfesional.comentarios}
                    onChange={manejarCambio}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div >
  <h2>Indicadores de Evaluación</h2>
  <table>
    <thead>
      <tr>
        <th>Indicador de Evaluación</th>
        <th>Puntuación Máxima</th>
        <th>Valor en %</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Experiencia</td>
        <td>10</td>
        <td>10%</td>
      </tr>
      <tr>
        <td>Capacitación</td>
        <td>5</td>
        <td>30%</td>
      </tr>
      <tr>
        <td>Conocimiento y habilidades</td>
        <td>25</td>
        <td>30%</td>
      </tr>
      <tr>
        <td>Formación y profesional</td>
        <td>3</td>
        <td>10%</td>
      </tr>
      <tr>
        <td>Atributos y cualidades personales</td>
        <td>40</td>
        <td>20%</td>
      </tr>
    </tbody>
  </table>
</div>

<div>
  <h2>Calificación Total Obtenida</h2>
  <table>
    <thead>
      <tr>
        <th>Calificación Total</th>
        <th>Descripción</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>80-100%</td>
        <td>Competente y candidato a ser auditor líder (evaluación anual)</td>
      </tr>
      <tr>
        <td>80-84%</td>
        <td>Competente y es candidato a formar parte del equipo de inocuidad (evaluación semestral)</td>
      </tr>
      <tr>
        <td>60-79%</td>
        <td>Se puede considerar auditor de entrenamiento (evaluación trimestral)</td>
      </tr>
      <tr>
        <td>Menor a 59%</td>
        <td>Se considera no competente y fuera del equipo auditor</td>
      </tr>
    </tbody>
  </table>
</div>

          <h2>Resultado Final: {resultadoFinal.toFixed(2)}%</h2>

          <button onClick={() => guardarEvaluacionConEstado('Incompleta')}>Guardar Cambios</button>
          <button onClick={() => guardarEvaluacionConEstado('Completa')}>Guardar Evaluación</button>
          <button onClick={limpiarCampos}>Limpiar Campos</button>
        </>
      )}
    </div>
    </div>
    
  );

};

export default Evaluaciones;