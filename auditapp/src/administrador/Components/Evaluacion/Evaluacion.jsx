import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TextField, Select, MenuItem, Paper, Card, CardContent, Grid, Divider, Checkbox,
  FormControlLabel, Avatar, Chip, LinearProgress, styled
} from '@mui/material';
import { 
  Person, School, Work, Assessment, CheckCircle, Cancel, 
  Save, Send, DateRange, HowToReg, Star, StarBorder 
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
            height: 10, 
            borderRadius: 5,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundColor: value > 70 ? '#4caf50' : value > 40 ? '#ff9800' : '#f44336'
            }
          }} 
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
};

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
  const [auditorDetails, setAuditorDetails] = useState(null);
  const [formacionProfesional, setFormacionProfesional] = useState({
    nivelEstudios: '',
    especialidad: '',
    puntuacion: 0,
    comentarios: ''
  });

  useEffect(() => {
    if (selectedFolio && evaluacionExistente.length > 0) {
      const registro = evaluacionExistente.find((item) => item.folio === selectedFolio);
      if (registro) {
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
        const responseEvaluacion = await api.get('/evaluacion');
        setEvaluacionEx(responseEvaluacion.data);
        const responseDatos = await api.get('/datos/aud-lid');
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
        
        const responseUsuarios = await api.get('/usuarios');
        const auditoresFiltrados = auditoresLider.map(({ idRegistro, nombreLider, duracion, tipoAuditoria }) => {
          const usuarioEncontrado = responseUsuarios.data.find(usuario => usuario.Nombre === nombreLider);
          if (usuarioEncontrado) {
            return { ...usuarioEncontrado, idRegistro, nombreLider, duracion, tipoAuditoria };
          }
          return null;
        }).filter(Boolean);
        
        const filteredAuditores = auditoresFiltrados.filter(auditor => {
          return !responseEvaluacion.data.some(evaluacion => {
            return evaluacion.auditoriaId === auditor.idRegistro && evaluacion.estado !== "Incompleta";
          });
        });
        
        setAuditores(filteredAuditores);
      } catch (error) {
        console.error('Error al obtener auditores:', error);
      }
    };
    
    obtenerAuditores();
  }, []);  

  useEffect(() => {
    if (selectedAuditor) {
      const auditor = auditores.find(a => `${a._id}_${a.idRegistro}` === selectedAuditor);
      setAuditorDetails(auditor);
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
  });

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

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const calcularResultadoFinal = () => {
    const totalCursos = Object.keys(evaluacion.cursos).length;
    const cursosAprobados = Object.values(evaluacion.cursos).filter(curso => curso.aprobado).length;
    const puntosCursos = (cursosAprobados / totalCursos) * 5;
    const porcentajeCursos = (puntosCursos / 5) * 30;
    const puntosConocimientos = Object.values(evaluacion.conocimientos).reduce((a, b) => a + b, 0);
    const porcentajeConocimientos = (puntosConocimientos / (5 * Object.keys(evaluacion.conocimientos).length)) * 30;
    const puntosAtributos = Object.values(evaluacion.atributos).reduce((a, b) => a + b, 0);
    const porcentajeAtributos = (puntosAtributos / 40) * 20;
    let puntosExperiencia = 0;
    
    switch (evaluacion.experiencia.tiempoLaborando) {
      case 'menos de 2 años': puntosExperiencia += 1; break;
      case 'de 2 a 5 años': puntosExperiencia += 4; break;
      case 'más de 5 años': puntosExperiencia += 5; break;
      default: puntosExperiencia += 0; break;
    }
    
    if (evaluacion.experiencia.equipoInocuidad) puntosExperiencia += 2;
    
    const auditorias = evaluacion.experiencia.auditoriasInternas;
    switch (auditorias) {
      case '4': puntosExperiencia += 3; break;
      case '3': puntosExperiencia += 2; break;
      case '2': puntosExperiencia += 1; break;
      case '1': puntosExperiencia += 1; break;
      case '0': puntosExperiencia += 0; break;
      default: puntosExperiencia += 0; break;
    }
    
    const porcentajeExperiencia = (puntosExperiencia / 10) * 10;
    let puntosFormacionProfesional = 0;
    
    switch (formacionProfesional.nivelEstudios) {
      case 'Profesional': puntosFormacionProfesional = 3; break;
      case 'TSU': puntosFormacionProfesional = 2; break;
      case 'Preparatoria': puntosFormacionProfesional = 1; break;
      default: puntosFormacionProfesional = 0;
    }
    
    const porcentajeFormacionProfesional = (puntosFormacionProfesional / 3) * 10;
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
        calificacion: Number(datos.calificacion) || null,
        aprobado: datos.aprobado !== undefined ? datos.aprobado : null,
      }));
  
      const conocimientosHabilidadesArray = Object.entries(evaluacion.conocimientos).map(([conocimiento, puntuacion]) => ({
        conocimiento,
        puntuacion: puntuacion !== undefined ? puntuacion : null,
      }));
  
      const atributosArray = Object.entries(evaluacion.atributos).map(([atributo, puntuacion]) => ({
        atributo,
        puntuacion: puntuacion !== undefined ? puntuacion : null,
      }));
  
      let evaluacionExistente = null;
      try {
        const response = await api.get(`/evaluacion/${selectedFolio}`);
        evaluacionExistente = response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('Registro no encontrado, se creará uno nuevo.');
        } else {
          console.error('Error al verificar la existencia de la evaluación:', error);
          throw error;
        }
      }
  
      if (evaluacionExistente) {
        await api.put(`/evaluacion/folio/${selectedFolio}`, {
          folio: selectedFolio,
          cursos: cursosArray,
          conocimientosHabilidades: conocimientosHabilidadesArray,
          atributosCualidadesPersonales: atributosArray,
          experiencia: evaluacion.experiencia !== undefined ? evaluacion.experiencia : null,
          formacionProfesional: formacionProfesional !== undefined ? formacionProfesional : null,
          porcentajeTotal: resultadoFinal !== undefined ? resultadoFinal : null,
          estado,
        });
        alert(`Evaluación actualizada como ${estado}`);
      } else {
        await api.post('/evaluacion', {
          folio: selectedFolio,
          auditoriaId: selectedAuditoria,
          auditorId: selectedAudi,
          nombre: auditorDetails.Nombre,
          cursos: cursosArray,
          conocimientosHabilidades: conocimientosHabilidadesArray,
          atributosCualidadesPersonales: atributosArray,
          experiencia: evaluacion.experiencia !== undefined ? evaluacion.experiencia : null,
          formacionProfesional: formacionProfesional !== undefined ? formacionProfesional : null,
          porcentajeTotal: resultadoFinal !== undefined ? resultadoFinal : null,
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
    const iniciales = Nombre.split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('');
  
    const auditorKey = `${auditorId}_${idRegistro}`;
    const folioKey = `${idRegistro}${iniciales}`;
  
    if (selectedAuditor === auditorKey) {
      setSelectedAuditor(null);
      setSelectedFolio(null);
      setSelectedAuditoria(null);
      setSelectedAudi(null);
    } else {
      setSelectedAuditor(auditorKey);
      setSelectedFolio(folioKey);
      setSelectedAuditoria(idRegistro);
      setSelectedAudi(auditorId);
    }
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

  return (
    <Box sx={{ padding: '40px', marginTop: '3em' }}>
      <ElegantPaper elevation={3}>
        <HeaderTypography variant="h4" gutterBottom>
          <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
          Evaluación de Auditores Internos
        </HeaderTypography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          GCF070 - Sistema de Gestión para la Calidad
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            Seleccione un Auditor para Evaluar
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {auditores.map((auditor) => {
              const isSelected = selectedAuditor === `${auditor._id}_${auditor.idRegistro}`;
              return (
                <Grid item xs={12} sm={6} md={4} key={auditor.idRegistro}>
                  <AuditorCard selected={isSelected} onClick={() => handleAuditorSelect(auditor._id, auditor.idRegistro, auditor.Nombre)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.300', mr: 2 }}>
                          {auditor.Nombre.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {auditor.Nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {auditor.Departamento}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={auditor.tipoAuditoria} 
                        size="small" 
                        color="secondary" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                      <Chip 
                        label={`Duración: ${auditor.duracion}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mb: 1 }} 
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        ID: {auditor.idRegistro}
                      </Typography>
                    </CardContent>
                  </AuditorCard>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {selectedAuditor && (
          <>
            <Box sx={{ mb: 4, p: 3, backgroundColor: '#f0f4f8', borderRadius: '12px' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} /> Información del Auditor
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography><strong>Nombre:</strong> {auditorDetails?.Nombre || 'N/A'}</Typography>
                    <Typography><strong>Departamento:</strong> {auditorDetails?.Departamento || 'N/A'}</Typography>
                    <Typography><strong>Fecha de Ingreso:</strong> {auditorDetails ? formatearFecha(auditorDetails.FechaIngreso) : 'N/A'}</Typography>
                    <Typography><strong>Escolaridad:</strong> {auditorDetails?.Escolaridad || 'N/A'}</Typography>
                    <Typography><strong>Carrera:</strong> {auditorDetails?.Carrera || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <DateRange sx={{ mr: 1, color: 'primary.main' }} /> Detalles de Evaluación
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography><strong>Folio:</strong> {selectedFolio}</Typography>
                    <Typography><strong>Fecha:</strong> {new Date().toLocaleDateString()}</Typography>
                    <Typography><strong>Tipo de Auditoría:</strong> {auditorDetails?.tipoAuditoria || 'N/A'}</Typography>
                    <Typography><strong>Duración:</strong> {auditorDetails?.duracion || 'N/A'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="body1" paragraph sx={{ mb: 4, fontStyle: 'italic', color: 'text.secondary' }}>
              La siguiente evaluación deberá ser llenada por el Gerente de Gestión para la Calidad y será aplicada 
              a partir de la ejecución de la primera auditoría con la finalidad de conocer el rango del auditor interno.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <HeaderTypography variant="h5">
                <School sx={{ verticalAlign: 'middle', mr: 1 }} />
                Evaluación de Cursos
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Curso</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Calificación (%)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(evaluacion.cursos).map((curso) => (
                      <TableRow key={curso} hover>
                        <TableCell>{curso}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            name={`cursos.${curso}`}
                            value={evaluacion.cursos[curso].calificacion}
                            onChange={manejarCambio}
                            inputProps={{ min: 0, max: 100 }}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          {evaluacion.cursos[curso].aprobado ? 
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
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Evalúe cada aspecto del 1 al 5, donde 1 es el mínimo y 5 el máximo
              </Typography>
              
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
                    {Object.keys(evaluacion.conocimientos).map((conocimiento) => (
                      <TableRow key={conocimiento} hover>
                        <TableCell>{conocimiento}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            name={`conocimientos.${conocimiento}`}
                            value={evaluacion.conocimientos[conocimiento]}
                            onChange={manejarCambio}
                            inputProps={{ min: 1, max: 5 }}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          {renderStars(evaluacion.conocimientos[conocimiento] || 0)}
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
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Evalúe cada aspecto del 1 al 5, donde 1 es el mínimo y 5 el máximo
              </Typography>
              
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
                    {Object.keys(evaluacion.atributos).map((atributo) => (
                      <TableRow key={atributo} hover>
                        <TableCell>{atributo}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            name={`atributos.${atributo}`}
                            value={evaluacion.atributos[atributo]}
                            onChange={manejarCambio}
                            inputProps={{ min: 1, max: 5 }}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          {renderStars(evaluacion.atributos[atributo] || 0)}
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
                Evaluación de Experiencia
              </HeaderTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>Tiempo laborando en la planta:</TableCell>
                      <TableCell>
                        <Select
                          name="experiencia.tiempoLaborando"
                          value={evaluacion.experiencia.tiempoLaborando}
                          onChange={manejarCambio}
                          fullWidth
                          size="small"
                        >
                          <MenuItem value="">Seleccione una opción</MenuItem>
                          <MenuItem value="menos de 2 años">Menos de 2 años</MenuItem>
                          <MenuItem value="de 2 a 5 años">De 2 a 5 años</MenuItem>
                          <MenuItem value="más de 5 años">Más de 5 años</MenuItem>
                        </Select>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>Forma parte del equipo de inocuidad:</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="experiencia.equipoInocuidad"
                              checked={evaluacion.experiencia.equipoInocuidad}
                              onChange={manejarCambio}
                              color="primary"
                            />
                          }
                          label={evaluacion.experiencia.equipoInocuidad ? "Sí" : "No"}
                        />
                      </TableCell>
                    </TableRow>
                    
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>Participación en auditorías internas:</TableCell>
                      <TableCell>
                        <Select
                          name="experiencia.auditoriasInternas"
                          value={evaluacion.experiencia.auditoriasInternas}
                          onChange={manejarCambio}
                          fullWidth
                          size="small"
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
                      <TableCell sx={{ fontWeight: 600 }}>Comentarios</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>
                        <Select
                          name="formacionProfesional.nivelEstudios"
                          value={formacionProfesional.nivelEstudios}
                          onChange={manejarCambio}
                          fullWidth
                        >
                          <MenuItem value="">Selecciona</MenuItem>
                          <MenuItem value="Profesional">Profesional</MenuItem>
                          <MenuItem value="TSU">TSU</MenuItem>
                          <MenuItem value="Preparatoria">Preparatoria</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="formacionProfesional.especialidad"
                          value={formacionProfesional.especialidad}
                          onChange={manejarCambio}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={formacionProfesional.puntuacion} color="primary" />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="formacionProfesional.comentarios"
                          value={formacionProfesional.comentarios}
                          onChange={manejarCambio}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ mb: 4 }}>
  <Typography variant="h4">Resultado Final: {resultadoFinal.toFixed(2)}%</Typography>
  <ProgressBarWithLabel value={resultadoFinal} />
  
  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
    <Button
      variant="outlined"
      startIcon={<Save />}
      onClick={() => guardarEvaluacionConEstado('Incompleta')}
    >
      Guardar Cambios
    </Button>
    <Button
      variant="contained"
      startIcon={<Send />}
      onClick={() => guardarEvaluacionConEstado('Completa')}
    >
      Guardar Evaluación
    </Button>
  </Box>
</Box>
          </>
        )}
      </ElegantPaper>
    </Box>
  );
};

export default Evaluaciones;