import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Grid, 
  Box 
} from '@mui/material';

const AuditorEvaluaciones = () => {
  const [selectedFolio, setSelectedFolio] = useState('');
  const [evaluacionesDisp, setEvaluacionesDisp] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);

  useEffect(() => {
    const obtenerAuditores = async () => {
      try {
        const responseEvaluaciones = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/evaluacion/eva-esp`);
        setEvaluacionesDisp(responseEvaluaciones.data);
      } catch (error) {
        console.error('Error al obtener auditores:', error);
      }
    };

    obtenerAuditores();
  }, []);

  useEffect(() => {
    const fetchEvaluaciones = async () => {
      if (selectedFolio) {
        try {
          const responseEvaluacion = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/evaluacion/${selectedFolio}`
          );
          setEvaluaciones(responseEvaluacion.data);
        } catch (error) {
          console.error("Error al obtener las evaluaciones:", error);
        }
      }
    };

    fetchEvaluaciones();
  }, [selectedFolio]);

  const handleFolioSelect = () => {
    setSelectedFolio(null);
    setEvaluaciones([]);
  };

  const handleAuditorSelect = (folio) => {
    setSelectedFolio(selectedFolio === folio ? null : folio);
  };

  return (
    <Box sx={{ padding: '20px', marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Vista para Evaluaciones
      </Typography>

      <Typography variant="h5" gutterBottom>
        Seleccione un Auditor
      </Typography>
      
      <Grid container spacing={2}>
        {Array.isArray(evaluacionesDisp) &&
          evaluacionesDisp.map((auditor) => (
            <Grid item xs={12} sm={6} md={4} key={auditor.folio}>
              <Card
                onClick={() => handleAuditorSelect(auditor.folio)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedFolio === auditor.folio ? '#f0f8ff' : '#fff',
                  border: selectedFolio === auditor.folio ? '2px solid #007bff' : '1px solid #ccc',
                  boxShadow: selectedFolio === auditor.folio ? '0px 0px 8px rgba(0, 123, 255, 0.5)' : 'none',
                  display: selectedFolio && selectedFolio !== auditor.folio ? 'none' : 'block',
                }}
              >
                <CardContent>
                  <Typography variant="h6">{auditor.nombre}</Typography>
                  <Typography variant="body2" color="textSecondary">{auditor.folio}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {selectedFolio && (
        <Button
          onClick={handleFolioSelect}
          variant="contained"
          color="primary"
          sx={{ marginTop: '20px' }}
        >
          Mostrar todos
        </Button>
      )}


      {evaluaciones.length > 0 && (
        <Box sx={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="h6" gutterBottom>
            Evaluación de {evaluacionesDisp.find(a => a.folio === selectedFolio)?.nombre}
          </Typography>

          <Box sx={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f4ff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" align="center">
              Porcentaje Obtenido: {evaluaciones[0]?.porcentajeTotal}%
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Folio: {evaluacionesDisp.find(a => a.folio === selectedFolio)?.folio}
          </Typography>

          {/* Indicadores de evaluación */}
          <TableContainer sx={{ marginTop: '20px' }}>
            <Table sx={{backgroundColor: '#ffff'}}>
              <TableHead>
                <TableRow>
                  <TableCell>Indicador</TableCell>
                  <TableCell>Puntuación Máxima</TableCell>
                  <TableCell>Valor en %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Experiencia</TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>10%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Capacitación</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>30%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Conocimiento y habilidades</TableCell>
                  <TableCell>25</TableCell>
                  <TableCell>30%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Formación profesional</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>10%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Atributos y cualidades personales</TableCell>
                  <TableCell>40</TableCell>
                  <TableCell>20%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Tablas dinámicas */}
          {evaluaciones[0]?.cursos && (
            <Box sx={{ marginTop: '20px' }}>
              <Typography variant="h6">Cursos:</Typography>
              <TableContainer>
                <Table sx={{backgroundColor: '#ffff'}}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre del curso</TableCell>
                      <TableCell>Calificación</TableCell>
                      <TableCell>Aprobado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluaciones[0]?.cursos.map((curso, index) => (
                      <TableRow key={index}>
                        <TableCell>{curso.nombreCurso}</TableCell>
                        <TableCell>{curso.calificacion}</TableCell>
                        <TableCell>{curso.aprobado ? 'Sí' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </TableContainer>
            </Box>
          )}

          {evaluaciones[0]?.conocimientosHabilidades && (
            <Box sx={{ marginTop: '20px' }}>
              <Typography variant="h6">Conocimientos y Habilidades:</Typography>
                <Table sx={{backgroundColor: '#ffff'}}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Conocimiento</TableCell>
                      <TableCell>Puntuación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluaciones[0]?.conocimientosHabilidades.map((conocimiento, index) => (
                      <TableRow key={index}>
                        <TableCell>{conocimiento.conocimiento}</TableCell>
                        <TableCell>{conocimiento.puntuacion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </Box>
          )}

          {evaluaciones[0]?.atributosCualidadesPersonales && (
            <Box sx={{ marginTop: '20px' }}>
              <Typography variant="h6">Atributos y Cualidades Personales:</Typography>
             
                <Table sx={{backgroundColor: '#ffff'}}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Atributo</TableCell>
                      <TableCell>Puntuación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluaciones[0]?.atributosCualidadesPersonales.map((atributo, index) => (
                      <TableRow key={index}>
                        <TableCell>{atributo.atributo}</TableCell>
                        <TableCell>{atributo.puntuacion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              
            </Box>
          )}

          
            <Box sx={{ marginTop: '20px'}}>
              <Typography variant="h6" gutterBottom>
                Experiencia
              </Typography>
              <Table sx={{ minWidth: 300, backgroundColor: '#ffff' }} aria-label="table-experiencia">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Tiempo laborando</strong></TableCell>
                    <TableCell>{evaluaciones[0]?.experiencia.tiempoLaborando}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Miembro del equipo de inocuidad</strong></TableCell>
                    <TableCell>{evaluaciones[0]?.experiencia.equipoInocuidad ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Auditorías internas</strong></TableCell>
                    <TableCell>{evaluaciones[0]?.experiencia.auditoriasInternas}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ marginTop: '20px'}}>
              <Typography variant="h6" gutterBottom>
                Formación Profesional
              </Typography>
              <Table sx={{ minWidth: 300, backgroundColor: '#ffff' }} aria-label="table-formacion">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Nivel de estudios</strong></TableCell>
                    <TableCell>{evaluaciones[0]?.formacionProfesional.nivelEstudios}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Especialidad</strong></TableCell>
                    <TableCell>{evaluaciones[0]?.formacionProfesional.especialidad}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Puntuación</strong></TableCell>
                    <TableCell>{evaluaciones[0]?.formacionProfesional.puntuacion}</TableCell>
                  </TableRow>
                  {evaluaciones[0]?.formacionProfesional.comentarios && (
                    <TableRow>
                      <TableCell><strong>Comentarios</strong></TableCell>
                      <TableCell>{evaluaciones[0]?.formacionProfesional.comentarios}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

          {/* Similar lógica para conocimientos, atributos y demás secciones */}
        </Box>
      )}
    </Box>
  );
};

export default AuditorEvaluaciones;