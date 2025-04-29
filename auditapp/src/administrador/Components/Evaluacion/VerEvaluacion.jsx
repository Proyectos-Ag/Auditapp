import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, Button, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Grid, Box, Paper, Avatar, 
  Divider, Chip, LinearProgress, styled 
} from '@mui/material';
import {
  Person, School, Work, Assessment, CheckCircle, Cancel,
  HowToReg, Star, StarBorder, ArrowBack
} from '@mui/icons-material';

// Estilos personalizados
const ElegantPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)',
  border: '1px solid rgba(255,255,255,0.3)'
}));

const HeaderTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px'
  }
}));

const AuditorCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6]
  }
}));

const ProgressBarWithLabel = ({ value }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={value} 
          sx={{ 
            height: 12, 
            borderRadius: 6,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
              backgroundColor: value > 70 ? '#4caf50' : value > 40 ? '#ff9800' : '#f44336'
            }
          }} 
        />
      </Box>
      <Box sx={{ minWidth: 45 }}>
        <Typography variant="body1" fontWeight="bold">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
};

const renderStars = (value) => {
  const stars = [];
  const maxStars = 5;
  for (let i = 1; i <= maxStars; i++) {
    stars.push(
      i <= value ? 
      <Star key={i} color="primary" fontSize="small" /> : 
      <StarBorder key={i} color="primary" fontSize="small" />
    );
  }
  return stars;
};

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

  const getAuditorData = () => {
    return evaluacionesDisp.find(a => a.folio === selectedFolio) || {};
  };

  return (
    <Box sx={{ padding: '40px', marginTop: '3em' }}>
      <ElegantPaper elevation={3}>
        <HeaderTypography variant="h4" gutterBottom>
          <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
          Vista de Evaluaciones de Auditores
        </HeaderTypography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Sistema de Gestión para la Calidad - Módulo de Evaluaciones
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {!selectedFolio ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Seleccione un Auditor para Ver su Evaluación
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {Array.isArray(evaluacionesDisp) && evaluacionesDisp.map((auditor) => (
                <Grid item xs={12} sm={6} md={4} key={auditor.folio}>
                  <AuditorCard 
                    selected={selectedFolio === auditor.folio}
                    onClick={() => handleAuditorSelect(auditor.folio)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {auditor.nombre.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {auditor.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Folio: {auditor.folio}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label="Ver evaluación" 
                        color="primary" 
                        size="small" 
                        variant="outlined"
                      />
                    </CardContent>
                  </AuditorCard>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleFolioSelect}
              variant="outlined"
              sx={{ mb: 3 }}
            >
              Volver a la lista
            </Button>
            
            <Box sx={{ mb: 4, p: 3, backgroundColor: '#f0f4f8', borderRadius: '12px' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} /> Información del Auditor
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography><strong>Nombre:</strong> {getAuditorData().nombre || 'N/A'}</Typography>
                    <Typography><strong>Folio:</strong> {getAuditorData().folio || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, color: 'primary.main' }} /> Resultado de Evaluación
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="h5" color="primary">
                      <strong>Puntuación Total: {evaluaciones[0]?.porcentajeTotal || 0}%</strong>
                    </Typography>
                    <ProgressBarWithLabel value={evaluaciones[0]?.porcentajeTotal || 0} />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 4 }}>
              <HeaderTypography variant="h5">
                <School sx={{ verticalAlign: 'middle', mr: 1 }} />
                Cursos Evaluados
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Nombre del Curso</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Calificación</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluaciones[0]?.cursos?.map((curso, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{curso.nombreCurso}</TableCell>
                        <TableCell>{curso.calificacion || 'N/A'}</TableCell>
                        <TableCell>
                          {curso.aprobado ? 
                            <Chip icon={<CheckCircle />} label="Aprobado" color="success" size="small" /> : 
                            <Chip icon={<Cancel />} label="No aprobado" color="error" size="small" />
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 4 }}>
              <HeaderTypography variant="h5">
                <Work sx={{ verticalAlign: 'middle', mr: 1 }} />
                Conocimientos y Habilidades
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Conocimiento/Habilidad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Puntuación</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Nivel</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluaciones[0]?.conocimientosHabilidades?.map((conocimiento, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{conocimiento.conocimiento}</TableCell>
                        <TableCell>{conocimiento.puntuacion || 'N/A'}</TableCell>
                        <TableCell>
                          {renderStars(conocimiento.puntuacion || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 4 }}>
              <HeaderTypography variant="h5">
                <HowToReg sx={{ verticalAlign: 'middle', mr: 1 }} />
                Atributos y Cualidades Personales
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Atributo/Cualidad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Puntuación</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Nivel</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluaciones[0]?.atributosCualidadesPersonales?.map((atributo, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{atributo.atributo}</TableCell>
                        <TableCell>{atributo.puntuacion || 'N/A'}</TableCell>
                        <TableCell>
                          {renderStars(atributo.puntuacion || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 4 }}>
              <HeaderTypography variant="h5">
                <Work sx={{ verticalAlign: 'middle', mr: 1 }} />
                Experiencia Laboral
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>Tiempo laborando en la planta:</TableCell>
                      <TableCell>{evaluaciones[0]?.experiencia?.tiempoLaborando || 'N/A'}</TableCell>
                    </TableRow>
                    
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>Forma parte del equipo de inocuidad:</TableCell>
                      <TableCell>
                        {evaluaciones[0]?.experiencia?.equipoInocuidad ? 
                          <Chip label="Sí" color="success" size="small" /> : 
                          <Chip label="No" color="error" size="small" />
                        }
                      </TableCell>
                    </TableRow>
                    
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>Participación en auditorías internas:</TableCell>
                      <TableCell>{evaluaciones[0]?.experiencia?.auditoriasInternas || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 4 }}>
              <HeaderTypography variant="h5">
                <School sx={{ verticalAlign: 'middle', mr: 1 }} />
                Formación Profesional
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Nivel de Estudios</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Especialidad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Puntuación</TableCell>
                      {evaluaciones[0]?.formacionProfesional?.comentarios && (
                        <TableCell sx={{ fontWeight: 600 }}>Comentarios</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>{evaluaciones[0]?.formacionProfesional?.nivelEstudios || 'N/A'}</TableCell>
                      <TableCell>{evaluaciones[0]?.formacionProfesional?.especialidad || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={evaluaciones[0]?.formacionProfesional?.puntuacion || 'N/A'} 
                          color="primary" 
                        />
                      </TableCell>
                      {evaluaciones[0]?.formacionProfesional?.comentarios && (
                        <TableCell>{evaluaciones[0]?.formacionProfesional?.comentarios}</TableCell>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mt: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: '12px', borderLeft: '4px solid #1976d2' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Indicadores de Evaluación
              </Typography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Indicador</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Puntuación Máxima</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Valor en %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>Experiencia</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>10%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Capacitación</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell>30%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Conocimiento y habilidades</TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>30%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Formación profesional</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>10%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Atributos y cualidades personales</TableCell>
                      <TableCell>40</TableCell>
                      <TableCell>20%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </ElegantPaper>
    </Box>
  );
};

export default AuditorEvaluaciones;