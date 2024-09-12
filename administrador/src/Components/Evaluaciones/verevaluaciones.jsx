import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/auditorEvaluaciones.css'; // CSS específico para este componente
import Navigation from "../Navigation/Navbar";


const AuditorEvaluaciones = () => {
  const [auditores, setAuditores] = useState([]);
  const [selectedAuditor, setSelectedAuditor] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [noEvaluaciones, setNoEvaluaciones] = useState(false); // Nuevo estado para manejar cuando no hay evaluaciones

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
      const obtenerEvaluaciones = async (auditorId) => {
        try {
          console.log(`Llamando a la API con auditorId: ${auditorId}`);
          const respuesta = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/${auditorId}`);
          console.log('Respuesta de la API:', respuesta.data);
          if (respuesta.data.length === 0) {
            setNoEvaluaciones(true);
            setEvaluaciones([]);
          } else {
            setNoEvaluaciones(false);
            setEvaluaciones(respuesta.data);
          }
        } catch (error) {
          console.error('Error al obtener evaluaciones:', error.response ? error.response.data : error.message);
          setNoEvaluaciones(true); // Si hay un error, consideramos que no hay evaluaciones
        }
      };
  
      obtenerEvaluaciones(selectedAuditor);
    }
  }, [selectedAuditor]);

  const handleEvaluar = () => {
    window.location.href = '/evuaauditor'; // Redirige a la ruta para evaluar
  };

  const handleCancelar = () => {
    setSelectedAuditor('');
    setEvaluaciones([]);
    setNoEvaluaciones(false);
  };


  return (
  <div>
    <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <Navigation />
      </div>
    <div className="auditor-evaluaciones-container">
      <h1>Vista para Evaluaciones</h1>
      <div className="auditor-select">
        <label htmlFor="auditor">Selecciona un auditor:</label>
        <select onChange={(e) => setSelectedAuditor(e.target.value)} value={selectedAuditor}>
          <option value="">Selecciona un auditor</option>
          {auditores.map(auditor => (
            <option key={auditor._id} value={auditor._id}>{auditor.Nombre}</option>
          ))}
        </select>
      </div>

      {noEvaluaciones && (
        <div className="no-evaluaciones">
          <p>Este usuario no cuenta con evaluaciones.</p>
          <button onClick={handleEvaluar}>Evaluar</button>
          <button onClick={handleCancelar}>Cancelar</button>
        </div>
      )}

      {evaluaciones.length > 0 && !noEvaluaciones && (
        <div className="evaluaciones">
          <h2>Evaluaciones de {auditores.find(a => a._id === selectedAuditor)?.Nombre}</h2>
          
          {/* Aquí van las tablas informativas */}
          <div className="informativas">
            <h3>INDICADORES DE EVALUACIÓN</h3>
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
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
                  <td>Formación profesional</td>
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

            <h3>CALIFICACIÓN TOTAL OBTENIDA</h3>
            <table>
              <thead>
                <tr>
                  <th>Rango de %</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>80-100%</td>
                  <td>Competente y candidato a ser audítor líder (evaluación anual)</td>
                </tr>
                <tr>
                  <td>80-84%</td>
                  <td>Competente y es candidato a formar parte del equipo de inocuidad (evaluación semestral)</td>
                </tr>
                <tr>
                  <td>60-79%</td>
                  <td>Se puede considerar audítor de entrenamiento (evaluación trimestral)</td>
                </tr>
                <tr>
                  <td>Menor a 59%</td>
                  <td>Se considera no competente y fuera del equipo auditor</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Tablas de evaluaciones */}
          <div className="evaluacion-cursos">
            <h3>Cursos:</h3>
            <table>
              <thead>
                <tr>
                  <th>Nombre del curso</th>
                  <th>Calificación</th>
                  <th>Aprobado</th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones[0]?.cursos.map((curso, index) => (
                  <tr key={index}>
                    <td>{curso.nombreCurso}</td>
                    <td>{curso.calificacion}</td>
                    <td>{curso.aprobado ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="evaluacion-conocimientos">
            <h3>Conocimientos y Habilidades:</h3>
            <table>
              <thead>
                <tr>
                  <th>Conocimiento</th>
                  <th>Puntuación</th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones[0]?.conocimientosHabilidades.map((conocimiento, index) => (
                  <tr key={index}>
                    <td>{conocimiento.conocimiento}</td>
                    <td>{conocimiento.puntuacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="evaluacion-atributos">
            <h3>Atributos y Cualidades Personales:</h3>
            <table>
              <thead>
                <tr>
                  <th>Atributo</th>
                  <th>Puntuación</th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones[0]?.atributosCualidadesPersonales.map((atributo, index) => (
                  <tr key={index}>
                    <td>{atributo.atributo}</td>
                    <td>{atributo.puntuacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="evaluacion-experiencia">
            <h3>Experiencia:</h3>
            <p><strong>Tiempo laborando:</strong> {evaluaciones[0]?.experiencia.tiempoLaborando}</p>
            <p><strong>Miembro del equipo de inocuidad:</strong> {evaluaciones[0]?.experiencia.equipoInocuidad ? 'Sí' : 'No'}</p>
            <p><strong>Auditorías internas:</strong> {evaluaciones[0]?.experiencia.auditoriasInternas}</p>
          </div>

          <div className="evaluacion-formacion">
            <h3>Formación Profesional:</h3>
            <p><strong>Nivel de estudios:</strong> {evaluaciones[0]?.formacionProfesional.nivelEstudios}</p>
            <p><strong>Especialidad:</strong> {evaluaciones[0]?.formacionProfesional.especialidad}</p>
            <p><strong>Puntuación:</strong> {evaluaciones[0]?.formacionProfesional.puntuacion}</p>
            {evaluaciones[0]?.formacionProfesional.comentarios && (
              <p><strong>Comentarios:</strong> {evaluaciones[0]?.formacionProfesional.comentarios}</p>
            )}
          </div>

          <div className="evaluacion-porcentaje">
            <h3>Porcentaje Total: {evaluaciones[0]?.porcentajeTotal}%</h3>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AuditorEvaluaciones;
