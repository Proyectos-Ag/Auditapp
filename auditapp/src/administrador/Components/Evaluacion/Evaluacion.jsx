// components/Evaluaciones.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TextField, Select, MenuItem, Paper, Card, CardContent, Grid, Divider, Checkbox,
  FormControlLabel, Avatar, Chip, LinearProgress, styled, Alert, Snackbar,
  Fade, Zoom, Slide, Grow, Container, useTheme, alpha
} from '@mui/material';
import { 
  Person, School, Work, Assessment, CheckCircle, Cancel, 
  Save, Send, DateRange, HowToReg, Star, StarBorder,
  AutoAwesome, Download, Psychology, EmojiEvents, TrendingUp,
  Palette, Gradient, Animation, TouchApp
} from '@mui/icons-material';

// Estilos personalizados ultra modernos
const GlassPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '24px',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.3)',
  boxShadow: `
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    0 4px 16px 0 rgba(0, 0, 0, 0.1),
    inset 0 0 0.5px 1px rgba(255, 255, 255, 0.8)
  `,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    backgroundSize: '200% 200%',
    animation: 'shimmer 3s ease infinite'
  }
}));

const NeonCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  borderRadius: '20px',
  background: selected 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
    : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
  backdropFilter: 'blur(15px)',
  border: selected 
    ? `2px solid ${theme.palette.primary.main}`
    : '1px solid rgba(255,255,255,0.4)',
  boxShadow: selected
    ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)},
       0 4px 16px ${alpha(theme.palette.primary.main, 0.2)},
       inset 0 0 16px ${alpha(theme.palette.primary.main, 0.1)}`
    : '0 4px 20px rgba(0,0,0,0.08)',
  transform: selected ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.01)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  },
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    transition: 'left 0.6s',
  },
  '&:hover::after': {
    left: '100%',
  }
}));

const HolographicHeader = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 800,
  marginBottom: theme.spacing(3),
  position: 'relative',
  paddingBottom: theme.spacing(2),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '80px',
    height: '4px',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    borderRadius: '2px',
    animation: 'shimmer 2s ease infinite'
  }
}));

const AnimatedProgressBar = styled(LinearProgress)(({ theme, value }) => ({
  height: 16,
  borderRadius: 10,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 10,
    background: value > 85 
      ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
      : value > 70
      ? 'linear-gradient(90deg, #FF9800, #FFC107)'
      : 'linear-gradient(90deg, #F44336, #E91E63)',
    boxShadow: `
      0 0 8px ${value > 85 ? alpha('#4CAF50', 0.6) : value > 70 ? alpha('#FF9800', 0.6) : alpha('#F44336', 0.6)},
      inset 0 2px 4px rgba(255,255,255,0.3)
    `,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      animation: 'shimmer 2s infinite'
    }
  }
}));

const FloatingActionButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '16px',
  padding: theme.spacing(1.5, 3),
  fontWeight: 700,
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: variant === 'contained' 
    ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`
    : '0 4px 16px rgba(0,0,0,0.1)',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: variant === 'contained'
      ? `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
      : '0 8px 24px rgba(0,0,0,0.15)',
  }
}));

const InteractiveTable = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.4)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  '& .MuiTableHead-root': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
    '& .MuiTableCell-head': {
      fontWeight: 700,
      color: theme.palette.primary.dark,
      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      fontSize: '0.95rem'
    }
  },
  '& .MuiTableBody-root .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      transform: 'scale(1.002)',
    }
  }
}));

const GlowingChip = styled(Chip)(({ theme, color = 'default' }) => ({
  borderRadius: '12px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  boxShadow: `0 2px 8px ${alpha(theme.palette[color]?.main || theme.palette.grey[400], 0.3)}`,
  '&:hover': {
    boxShadow: `0 4px 16px ${alpha(theme.palette[color]?.main || theme.palette.grey[400], 0.5)}`,
    transform: 'translateY(-1px)'
  }
}));

const ProgressBarWithLabel = ({ value }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
      <Box sx={{ width: '100%', mr: 2 }}>
        <AnimatedProgressBar variant="determinate" value={value} />
      </Box>
      <Box sx={{ minWidth: 60 }}>
        <Typography 
          variant="h6" 
          fontWeight="800"
          sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

// Componente de partículas animadas de fondo
const AnimatedBackground = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
        `,
        animation: 'float 6s ease-in-out infinite'
      }
    }}
  />
);

const Evaluaciones = () => {
  const theme = useTheme();
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
  const [informacionCapacitacion, setInformacionCapacitacion] = useState(null);
  const [informacionAuditorias, setInformacionAuditorias] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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

        const calcularTiempoLaborando = () => {
          if (!auditor.FechaIngreso) return '';
          
          const fechaIngreso = new Date(auditor.FechaIngreso);
          const ahora = new Date();
          const añosDiferencia = ahora.getFullYear() - fechaIngreso.getFullYear();
          const mesesDiferencia = ahora.getMonth() - fechaIngreso.getMonth();
          const añosExactos = añosDiferencia + (mesesDiferencia / 12);
          
          if (añosExactos < 2) return 'menos de 2 años';
          if (añosExactos >= 2 && añosExactos <= 5) return 'de 2 a 5 años';
          return 'más de 5 años';
        };

        setEvaluacion(prev => ({
          ...prev,
          experiencia: {
            tiempoLaborando: calcularTiempoLaborando(),
            equipoInocuidad: auditor.FormaParteEquipoInocuidad || false,
            auditoriasInternas: prev.experiencia.auditoriasInternas || ''
          }
        }));

        cargarInformacionCapacitacion(auditor.Nombre);
        cargarInformacionAuditorias(auditor.Nombre, auditor.Correo);
      }
    } else {
      setSelectedFolio(null);
      setAuditorDetails(null);
      setInformacionCapacitacion(null);
      setInformacionAuditorias(null);
      setFormacionProfesional({
        nivelEstudios: '',
        especialidad: '',
        puntuacion: 0,
        comentarios: ''
      });
      setEvaluacion(prev => ({
        ...prev,
        experiencia: {
          tiempoLaborando: '',
          equipoInocuidad: false,
          auditoriasInternas: ''
        }
      }));
    }
  }, [selectedAuditor, auditores]);

  useEffect(() => {
    calcularResultadoFinal();
  });

  const cargarInformacionAuditorias = async (nombreAuditor, correoAuditor) => {
    try {
      setSnackbar({ open: true, message: 'Cargando historial de auditorías...', severity: 'info' });
      
      const response = await api.get('/datos/auditorias-por-auditor', {
        params: {
          nombre: nombreAuditor,
          correo: correoAuditor
        }
      });
      
      const data = response.data;
      setInformacionAuditorias(data);
      
      let valorAuditorias = '0';
      if (data.total >= 4) valorAuditorias = '4';
      else if (data.total === 3) valorAuditorias = '3';
      else if (data.total === 2) valorAuditorias = '2';
      else if (data.total === 1) valorAuditorias = '1';
      
      setEvaluacion(prev => ({
        ...prev,
        experiencia: {
          ...prev.experiencia,
          auditoriasInternas: valorAuditorias
        }
      }));
      
      setSnackbar({ 
        open: true, 
        message: `Se encontraron ${data.total} auditorías completadas`, 
        severity: 'success' 
      });
      
    } catch (error) {
      console.error('Error cargando información de auditorías:', error);
      setInformacionAuditorias(null);
      setSnackbar({ 
        open: true, 
        message: 'No se encontró historial de auditorías', 
        severity: 'warning' 
      });
    }
  };

  const cargarInformacionCapacitacion = async (nombreAuditor) => {
    try {
      setSnackbar({ open: true, message: 'Cargando información de capacitación...', severity: 'info' });
      
      const response = await api.get(`/capacitacion/empleado/${encodeURIComponent(nombreAuditor)}`);
      const data = response.data;
      
      setInformacionCapacitacion(data);
      
      if (data.cursosMapeados) {
        setEvaluacion(prev => ({
          ...prev,
          cursos: { ...prev.cursos, ...data.cursosMapeados }
        }));
      }
      
      setSnackbar({ open: true, message: `Información de capacitación cargada: ${data.cursosCompletados} cursos completados`, severity: 'success' });
      
    } catch (error) {
      console.error('Error cargando información de capacitación:', error);
      setInformacionCapacitacion(null);
      setSnackbar({ open: true, message: 'No se encontró información en base de datos de capacitación', severity: 'warning' });
    }
  };

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
    setInformacionCapacitacion(null);
    setInformacionAuditorias(null);
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
      setInformacionCapacitacion(null);
      setInformacionAuditorias(null);
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
        <Star key={i} sx={{ color: '#FFD700', filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.5))' }} fontSize="small" /> : 
        <StarBorder key={i} color="disabled" fontSize="small" />
      );
    }
    return stars;
  };

  return (
    <Box sx={{ 
      padding: '20px', 
      marginTop: '3em',
      minHeight: '100vh',
      position: 'relative'
    }}>
      <AnimatedBackground />
      
      <Container maxWidth="xl">
        <GlassPaper elevation={0}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <HolographicHeader variant="h3" gutterBottom>
              <Assessment sx={{ 
                verticalAlign: 'middle', 
                mr: 2,
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 0 8px rgba(102, 126, 234, 0.5))'
              }} />
              Evaluación de Auditores Internos
            </HolographicHeader>
            
            <Typography variant="h6" sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600,
              mb: 1
            }}>
              GCF070 - Sistema de Gestión para la Calidad
            </Typography>
            
          </Box>
          
          <Divider sx={{ 
            my: 4, 
            background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)',
            height: '2px'
          }} />
          
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Psychology sx={{ 
                mr: 2, 
                color: 'primary.main',
                fontSize: '2rem',
                filter: 'drop-shadow(0 0 6px rgba(102, 126, 234, 0.4))'
              }} />
              <Typography variant="h4" sx={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700
              }}>
                Seleccione un Auditor para Evaluar
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {auditores.map((auditor, index) => {
                const isSelected = selectedAuditor === `${auditor._id}_${auditor.idRegistro}`;
                return (
                  <Grid item xs={12} sm={6} md={4} key={auditor.idRegistro}>
                    <Grow in timeout={800 + (index * 100)}>
                      <NeonCard selected={isSelected} onClick={() => handleAuditorSelect(auditor._id, auditor.idRegistro, auditor.Nombre)}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: isSelected ? 'primary.main' : 'grey.400',
                              mr: 2,
                              width: 56,
                              height: 56,
                              boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                              transition: 'all 0.3s ease'
                            }}>
                              {auditor.Nombre.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" component="div" fontWeight="700">
                                {auditor.Nombre}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {auditor.Departamento}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <GlowingChip 
                              label={auditor.tipoAuditoria} 
                              size="small" 
                              color="primary" 
                            />
                            <GlowingChip 
                              label={`Duración: ${auditor.duracion}`} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                            />
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mt: 2
                          }}>
                            <Typography variant="caption" color="text.secondary">
                              ID: {auditor.idRegistro}
                            </Typography>
                            {isSelected && (
                              <CheckCircle sx={{ 
                                color: 'success.main',
                                filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.6))'
                              }} />
                            )}
                          </Box>
                        </CardContent>
                      </NeonCard>
                    </Grow>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {selectedAuditor && (
            <Fade in timeout={800}>
              <Box>
                {/* Información de Auditorías */}
                {informacionAuditorias && (
                  <Slide direction="down" in timeout={600}>
                    <Box sx={{ 
                      mb: 4, 
                      p: 3, 
                      background: 'linear-gradient(135deg, rgba(179, 229, 252, 0.3) 0%, rgba(179, 229, 252, 0.1) 100%)',
                      borderRadius: '20px',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(33, 150, 243, 0.1)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Assessment sx={{ 
                          mr: 2, 
                          color: 'info.main',
                          fontSize: '2rem',
                          filter: 'drop-shadow(0 0 6px rgba(33, 150, 243, 0.4))'
                        }} />
                        <Typography variant="h5" color="info.dark" fontWeight="700">
                          Historial de Auditorías Automático
                        </Typography>
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            background: 'rgba(255,255,255,0.6)', 
                            borderRadius: '12px',
                            backdropFilter: 'blur(5px)'
                          }}>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                              <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                              Estadísticas Principales
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Total de auditorías completadas:</strong> {informacionAuditorias.total}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Como Auditor Líder:</strong> {informacionAuditorias.comoLider}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Como Miembro del Equipo:</strong> {informacionAuditorias.comoMiembro}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            background: 'rgba(255,255,255,0.6)', 
                            borderRadius: '12px',
                            backdropFilter: 'blur(5px)'
                          }}>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                              <EmojiEvents sx={{ verticalAlign: 'middle', mr: 1 }} />
                              Experiencia Detallada
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Como Auditado:</strong> {informacionAuditorias.comoAuditado}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                              Últimas auditorías:
                            </Typography>
                            {informacionAuditorias.detalles.slice(0, 3).map((aud, idx) => (
                              <Typography key={idx} variant="caption" display="block" sx={{ ml: 2 }}>
                                • {aud.TipoAuditoria} - {new Date(aud.FechaFin).toLocaleDateString()}
                              </Typography>
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                      <FloatingActionButton 
                        startIcon={<Download />}
                        size="small" 
                        sx={{ mt: 2 }}
                        onClick={() => cargarInformacionAuditorias(auditorDetails.Nombre, auditorDetails.Correo)}
                        variant="outlined"
                      >
                        Actualizar historial
                      </FloatingActionButton>
                    </Box>
                  </Slide>
                )}

                {/* Información de Capacitación */}
                {informacionCapacitacion && (
                  <Slide direction="down" in timeout={800}>
                    <Box sx={{ 
                      mb: 4, 
                      p: 3, 
                      background: 'linear-gradient(135deg, rgba(200, 230, 201, 0.3) 0%, rgba(200, 230, 201, 0.1) 100%)',
                      borderRadius: '20px',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(76, 175, 80, 0.1)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AutoAwesome sx={{ 
                          mr: 2, 
                          color: 'success.main',
                          fontSize: '2rem',
                          filter: 'drop-shadow(0 0 6px rgba(76, 175, 80, 0.4))'
                        }} />
                        <Typography variant="h5" color="success.dark" fontWeight="700">
                          Información de Capacitación Automática
                        </Typography>
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            background: 'rgba(255,255,255,0.6)', 
                            borderRadius: '12px',
                            backdropFilter: 'blur(5px)'
                          }}>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                              <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                              Datos del Empleado
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Empleado encontrado:</strong> {informacionCapacitacion.empleado.nombre}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Puesto:</strong> {informacionCapacitacion.empleado.puesto}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Antigüedad:</strong> {informacionCapacitacion.empleado.antiguedad} años
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            background: 'rgba(255,255,255,0.6)', 
                            borderRadius: '12px',
                            backdropFilter: 'blur(5px)'
                          }}>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                              <School sx={{ verticalAlign: 'middle', mr: 1 }} />
                              Progreso de Capacitación
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Total de cursos:</strong> {informacionCapacitacion.totalCursos}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Cursos completados:</strong> {informacionCapacitacion.cursosCompletados}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Porcentaje completado:</strong> {Math.round((informacionCapacitacion.cursosCompletados / informacionCapacitacion.totalCursos) * 100)}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      <FloatingActionButton 
                        startIcon={<Download />}
                        size="small" 
                        sx={{ mt: 2 }}
                        onClick={() => cargarInformacionCapacitacion(auditorDetails.Nombre)}
                        variant="outlined"
                      >
                        Actualizar información
                      </FloatingActionButton>
                    </Box>
                  </Slide>
                )}

                {/* Información del Auditor */}
                <Zoom in timeout={1000}>
                  <Box sx={{ 
                    mb: 4, 
                    p: 4, 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
                    borderRadius: '24px',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Person sx={{ 
                            mr: 2, 
                            color: 'primary.main',
                            fontSize: '2rem'
                          }} />
                          <Typography variant="h5" fontWeight="700" color="primary.dark">
                            Información del Auditor
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 1 }}>
                          <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Typography fontWeight="600"><strong>Nombre:</strong> {auditorDetails?.Nombre || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Typography><strong>Departamento:</strong> {auditorDetails?.Departamento || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Typography><strong>Fecha de Ingreso:</strong> {auditorDetails ? formatearFecha(auditorDetails.FechaIngreso) : 'N/A'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <DateRange sx={{ 
                            mr: 2, 
                            color: 'secondary.main',
                            fontSize: '2rem'
                          }} />
                          <Typography variant="h5" fontWeight="700" color="secondary.dark">
                            Detalles de Evaluación
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 1 }}>
                          <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Typography fontWeight="600"><strong>Folio:</strong> {selectedFolio}</Typography>
                          </Box>
                          <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Typography><strong>Fecha:</strong> {new Date().toLocaleDateString()}</Typography>
                          </Box>
                          <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Typography><strong>Tipo de Auditoría:</strong> {auditorDetails?.tipoAuditoria || 'N/A'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Zoom>

                <Typography variant="body1" paragraph sx={{ 
                  mb: 4, 
                  fontStyle: 'italic', 
                  color: 'text.secondary',
                  textAlign: 'center',
                  p: 3,
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(5px)'
                }}>
                  La siguiente evaluación deberá ser llenada por el Gerente de Gestión para la Calidad y será aplicada 
                  a partir de la ejecución de la primera auditoría con la finalidad de conocer el rango del auditor interno.
                </Typography>

                {/* Evaluación de Cursos */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <School sx={{ 
                      mr: 2, 
                      color: 'primary.main',
                      fontSize: '2rem'
                    }} />
                    <HolographicHeader variant="h5">
                      Evaluación de Cursos
                    </HolographicHeader>
                    {informacionCapacitacion && (
                      <GlowingChip 
                        label="Datos automáticos de capacitación" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 2 }} 
                      />
                    )}
                  </Box>
                  
                  <InteractiveTable component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Curso</TableCell>
                          <TableCell>Calificación (%)</TableCell>
                          <TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.keys(evaluacion.cursos).map((curso) => (
                          <TableRow key={curso} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{curso}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                name={`cursos.${curso}`}
                                value={evaluacion.cursos[curso].calificacion}
                                onChange={manejarCambio}
                                inputProps={{ min: 0, max: 100 }}
                                size="small"
                                fullWidth
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.8)'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {evaluacion.cursos[curso].aprobado ? 
                                <GlowingChip 
                                  icon={<CheckCircle />} 
                                  label="Aprobado" 
                                  color="success" 
                                  size="small" 
                                /> : 
                                <GlowingChip 
                                  icon={<Cancel />} 
                                  label="No aprobado" 
                                  color="error" 
                                  size="small" 
                                />
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </InteractiveTable>
                </Box>

                {/* Conocimientos y Habilidades */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Work sx={{ 
                      mr: 2, 
                      color: 'primary.main',
                      fontSize: '2rem'
                    }} />
                    <HolographicHeader variant="h5">
                      Conocimientos y Habilidades
                    </HolographicHeader>
                  </Box>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Evalúe cada aspecto del 1 al 5, donde 1 es el mínimo y 5 el máximo
                  </Typography>
                  
                  <InteractiveTable component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Conocimiento/Habilidad</TableCell>
                          <TableCell>Puntuación</TableCell>
                          <TableCell>Nivel</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.keys(evaluacion.conocimientos).map((conocimiento) => (
                          <TableRow key={conocimiento} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{conocimiento}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                name={`conocimientos.${conocimiento}`}
                                value={evaluacion.conocimientos[conocimiento]}
                                onChange={manejarCambio}
                                inputProps={{ min: 1, max: 5 }}
                                size="small"
                                fullWidth
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.8)'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {renderStars(evaluacion.conocimientos[conocimiento] || 0)}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </InteractiveTable>
                </Box>

                {/* Atributos y Cualidades Personales */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <HowToReg sx={{ 
                      mr: 2, 
                      color: 'primary.main',
                      fontSize: '2rem'
                    }} />
                    <HolographicHeader variant="h5">
                      Atributos y Cualidades Personales
                    </HolographicHeader>
                  </Box>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Evalúe cada aspecto del 1 al 5, donde 1 es el mínimo y 5 el máximo
                  </Typography>
                  
                  <InteractiveTable component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Atributo/Cualidad</TableCell>
                          <TableCell>Puntuación</TableCell>
                          <TableCell>Nivel</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.keys(evaluacion.atributos).map((atributo) => (
                          <TableRow key={atributo} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{atributo}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                name={`atributos.${atributo}`}
                                value={evaluacion.atributos[atributo]}
                                onChange={manejarCambio}
                                inputProps={{ min: 1, max: 5 }}
                                size="small"
                                fullWidth
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.8)'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {renderStars(evaluacion.atributos[atributo] || 0)}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </InteractiveTable>
                </Box>

                {/* Evaluación de Experiencia */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Work sx={{ 
                      mr: 2, 
                      color: 'primary.main',
                      fontSize: '2rem'
                    }} />
                    <HolographicHeader variant="h5">
                      Evaluación de Experiencia
                    </HolographicHeader>
                    <GlowingChip 
                      label="Datos automáticos del usuario" 
                      size="small" 
                      color="info" 
                      sx={{ ml: 2 }} 
                    />
                  </Box>
                  
                  <InteractiveTable component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow hover sx={{ background: 'linear-gradient(135deg, rgba(179, 229, 252, 0.2) 0%, rgba(179, 229, 252, 0.1) 100%)' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            Tiempo laborando en la planta:
                            <GlowingChip label="Auto" size="small" color="info" sx={{ ml: 1 }} />
                          </TableCell>
                          <TableCell>
                            <Select
                              name="experiencia.tiempoLaborando"
                              value={evaluacion.experiencia.tiempoLaborando}
                              onChange={manejarCambio}
                              fullWidth
                              size="small"
                              disabled
                              sx={{
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.8)'
                              }}
                            >
                              <MenuItem value="">Seleccione una opción</MenuItem>
                              <MenuItem value="menos de 2 años">Menos de 2 años</MenuItem>
                              <MenuItem value="de 2 a 5 años">De 2 a 5 años</MenuItem>
                              <MenuItem value="más de 5 años">Más de 5 años</MenuItem>
                            </Select>
                          </TableCell>
                        </TableRow>
                        
                        <TableRow hover sx={{ background: 'linear-gradient(135deg, rgba(179, 229, 252, 0.2) 0%, rgba(179, 229, 252, 0.1) 100%)' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            Forma parte del equipo de inocuidad:
                            <GlowingChip label="Auto" size="small" color="info" sx={{ ml: 1 }} />
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="experiencia.equipoInocuidad"
                                  checked={evaluacion.experiencia.equipoInocuidad}
                                  onChange={manejarCambio}
                                  color="primary"
                                  disabled
                                  sx={{
                                    '&.Mui-checked': {
                                      color: 'primary.main',
                                    }
                                  }}
                                />
                              }
                              label={evaluacion.experiencia.equipoInocuidad ? "Sí" : "No"}
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                        </TableRow>
                        
                        <TableRow hover sx={{ background: 'linear-gradient(135deg, rgba(179, 229, 252, 0.2) 0%, rgba(179, 229, 252, 0.1) 100%)' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            Participación en auditorías internas:
                            <GlowingChip label="Auto" size="small" color="info" sx={{ ml: 1 }} />
                          </TableCell>
                          <TableCell>
                            <Select
                              name="experiencia.auditoriasInternas"
                              value={evaluacion.experiencia.auditoriasInternas}
                              onChange={manejarCambio}
                              fullWidth
                              size="small"
                              disabled
                              sx={{
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.8)'
                              }}
                            >
                              <MenuItem value="">Seleccione</MenuItem>
                              <MenuItem value="4">4 o más</MenuItem>
                              <MenuItem value="3">3</MenuItem>
                              <MenuItem value="2">2</MenuItem>
                              <MenuItem value="1">1</MenuItem>
                              <MenuItem value="0">0</MenuItem>
                            </Select>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </InteractiveTable>
                </Box>

                {/* Formación Profesional */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <School sx={{ 
                      mr: 2, 
                      color: 'primary.main',
                      fontSize: '2rem'
                    }} />
                    <HolographicHeader variant="h5">
                      Formación Profesional
                    </HolographicHeader>
                    <GlowingChip 
                      label="Datos automáticos del usuario" 
                      size="small" 
                      color="info" 
                      sx={{ ml: 2 }} 
                    />
                  </Box>
                  
                  <InteractiveTable component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Nivel de Estudios</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Especialidad</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Puntuación</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Comentarios</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow hover sx={{ background: 'linear-gradient(135deg, rgba(179, 229, 252, 0.2) 0%, rgba(179, 229, 252, 0.1) 100%)' }}>
                          <TableCell>
                            <Select
                              name="formacionProfesional.nivelEstudios"
                              value={formacionProfesional.nivelEstudios}
                              onChange={manejarCambio}
                              fullWidth
                              disabled
                              sx={{
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.8)'
                              }}
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
                              disabled
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  background: 'rgba(255,255,255,0.8)'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <GlowingChip 
                              label={formacionProfesional.puntuacion} 
                              color="primary" 
                              sx={{ fontSize: '1rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              name="formacionProfesional.comentarios"
                              value={formacionProfesional.comentarios}
                              onChange={manejarCambio}
                              fullWidth
                              placeholder="Añadir comentarios..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  background: 'rgba(255,255,255,0.8)'
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </InteractiveTable>
                </Box>

                {/* Resultado Final */}
                <Box sx={{ 
                  mb: 4, 
                  p: 4, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  borderRadius: '24px',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <Typography variant="h3" sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 800,
                    mb: 2
                  }}>
                    Resultado Final: {resultadoFinal.toFixed(2)}%
                  </Typography>
                  <ProgressBarWithLabel value={resultadoFinal} />
                  
                  <Box sx={{ mt: 4, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <FloatingActionButton
                      variant="outlined"
                      startIcon={<Save />}
                      onClick={() => guardarEvaluacionConEstado('Incompleta')}
                      size="large"
                    >
                      Guardar Cambios
                    </FloatingActionButton>
                    <FloatingActionButton
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => guardarEvaluacionConEstado('Completa')}
                      size="large"
                    >
                      Guardar Evaluación
                    </FloatingActionButton>
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}
        </GlassPaper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert 
          severity={snackbar.severity}
          sx={{
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255,255,255,0.9)',
            fontWeight: 600
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Estilos de animación global */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .MuiButton-contained {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease infinite;
        }
        
        .MuiButton-contained:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
      `}</style>
    </Box>
  );
};

export default Evaluaciones;