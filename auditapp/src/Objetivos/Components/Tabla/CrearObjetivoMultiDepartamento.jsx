import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';
import {
  Box,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
  Divider,
  Grid,
  Fade,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Alert
} from '@mui/material';
import {
  ArrowForward,
  ArrowBack,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Description,
  BusinessCenter,
  Assignment
} from '@mui/icons-material';
import './CrearObjetivoMultiDepto.css';

const CrearObjetivoMultiDepartamento = () => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  const [pasoActual, setPasoActual] = useState(0);
  const [departamentosConAreas, setDepartamentosConAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const topRef = useRef(null);
  
  const [nombreObjetivoGeneral, setNombreObjetivoGeneral] = useState('');
  const [departamentosSeleccionados, setDepartamentosSeleccionados] = useState([]);
  const [objetivosEspecificos, setObjetivosEspecificos] = useState([]);
  const [objetivosPorModulo, setObjetivosPorModulo] = useState([]);
  
  // Diálogos
  const [dialogObjetivoEspecifico, setDialogObjetivoEspecifico] = useState(false);
  const [dialogObjetivoDetallado, setDialogObjetivoDetallado] = useState(false);
  const [objetivoEspecificoSeleccionado, setObjetivoEspecificoSeleccionado] = useState(null);
  
  // Formularios temporales
  const [formObjEspecifico, setFormObjEspecifico] = useState({
    areaIndex: 0,
    nombre: '',
    descripcion: ''
  });
  
  const [formObjDetallado, setFormObjDetallado] = useState({
    descripcion: '',
    recursos: '',
    meta: ''
  });
  
  const pasos = ['Objetivo General', 'Seleccionar Áreas', 'Estructura Jerárquica'];
  
  useEffect(() => {
    const cargarDepartamentosConAreas = async () => {
      try {
        const response = await api.get('/areas');
        const data = response.data;
        
        const deptosConAreas = data.map(item => ({
          departamento: item.departamento,
          areas: item.areas || []
        }));
        
        setDepartamentosConAreas(deptosConAreas);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los departamentos y áreas'
        });
      }
    };
    
    cargarDepartamentosConAreas();
  }, []);
  
  // Scroll al inicio al cambiar de paso
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pasoActual]);
  
  const handleSeleccionDepartamentoArea = (departamento, area) => {
    const areaMayusculas = area.toUpperCase().trim();
    
    const existe = departamentosSeleccionados.find(
      item => item.departamento === departamento && item.area === areaMayusculas
    );
    
    if (existe) {
      const nuevosSeleccionados = departamentosSeleccionados.filter(item => 
        !(item.departamento === departamento && item.area === areaMayusculas)
      );
      setDepartamentosSeleccionados(nuevosSeleccionados);
      
      const nuevosObjetivosEspecificos = objetivosEspecificos.filter(obj => 
        !(obj.departamento === departamento && obj.area === areaMayusculas)
      );
      setObjetivosEspecificos(nuevosObjetivosEspecificos);
      
      const nuevosObjetivosPorModulo = objetivosPorModulo.filter(obj => 
        !(obj.departamento === departamento && obj.area === areaMayusculas)
      );
      setObjetivosPorModulo(nuevosObjetivosPorModulo);
    } else {
      setDepartamentosSeleccionados([
        ...departamentosSeleccionados,
        { departamento, area: areaMayusculas }
      ]);
    }
  };
  
  const abrirDialogObjetivoEspecifico = () => {
    if (departamentosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin áreas seleccionadas',
        text: 'Primero selecciona al menos un área en el Paso 2'
      });
      return;
    }
    
    setFormObjEspecifico({
      areaIndex: 0,
      nombre: '',
      descripcion: ''
    });
    setDialogObjetivoEspecifico(true);
  };
  
  const guardarObjetivoEspecifico = () => {
    if (!formObjEspecifico.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del objetivo específico es requerido'
      });
      return;
    }
    
    const selectedArea = departamentosSeleccionados[formObjEspecifico.areaIndex];
    
    const nuevoObjetivoEspecifico = {
      id: Date.now() + Math.random(),
      departamento: selectedArea.departamento,
      area: selectedArea.area,
      nombre: formObjEspecifico.nombre,
      descripcion: formObjEspecifico.descripcion,
      objetivosDetallados: []
    };
    
    setObjetivosEspecificos(prev => [...prev, nuevoObjetivoEspecifico]);
    setDialogObjetivoEspecifico(false);
    
    Swal.fire({
      icon: 'success',
      title: 'Objetivo específico creado',
      text: `Se agregó "${formObjEspecifico.nombre}"`,
      timer: 1500,
      showConfirmButton: false
    });
  };
  
  const abrirDialogObjetivoDetallado = (objetivoEspecificoId) => {
    const objetivoEspecifico = objetivosEspecificos.find(obj => obj.id === objetivoEspecificoId);
    
    if (!objetivoEspecifico) return;
    
    setObjetivoEspecificoSeleccionado(objetivoEspecifico);
    setFormObjDetallado({
      descripcion: '',
      recursos: '',
      meta: ''
    });
    setDialogObjetivoDetallado(true);
  };
  
  const guardarObjetivoDetallado = () => {
    if (!formObjDetallado.descripcion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'La descripción del objetivo es requerida'
      });
      return;
    }
    
    const nuevoObjetivoDetallado = {
      id: Date.now() + Math.random(),
      objetivoEspecificoId: objetivoEspecificoSeleccionado.id,
      departamento: objetivoEspecificoSeleccionado.departamento,
      area: objetivoEspecificoSeleccionado.area,
      objetivoEspecificoNombre: objetivoEspecificoSeleccionado.nombre,
      descripcion: formObjDetallado.descripcion,
      recursos: formObjDetallado.recursos,
      metaFrecuencia: formObjDetallado.meta
    };
    
    setObjetivosPorModulo(prev => [...prev, nuevoObjetivoDetallado]);
    setDialogObjetivoDetallado(false);
    
    Swal.fire({
      icon: 'success',
      title: 'Objetivo agregado',
      text: 'El objetivo detallado ha sido agregado correctamente',
      timer: 1500,
      showConfirmButton: false
    });
  };
  
  const eliminarObjetivoEspecifico = (id) => {
    Swal.fire({
      title: '¿Eliminar este objetivo específico?',
      text: 'Se eliminarán todos los objetivos detallados asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevosObjetivosEspecificos = objetivosEspecificos.filter(obj => obj.id !== id);
        setObjetivosEspecificos(nuevosObjetivosEspecificos);
        
        const nuevosObjetivosDetallados = objetivosPorModulo.filter(obj => obj.objetivoEspecificoId !== id);
        setObjetivosPorModulo(nuevosObjetivosDetallados);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Objetivo específico eliminado',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };
  
  const eliminarObjetivoDetallado = (id) => {
    Swal.fire({
      title: '¿Eliminar este objetivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevosObjetivos = objetivosPorModulo.filter(obj => obj.id !== id);
        setObjetivosPorModulo(nuevosObjetivos);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };
  
  const validarPaso = () => {
    switch(pasoActual) {
      case 0:
        if (!nombreObjetivoGeneral.trim()) {
          Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Debes ingresar un nombre para el objetivo general'
          });
          return false;
        }
        return true;
        
      case 1:
        if (departamentosSeleccionados.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Selección requerida',
            text: 'Debes seleccionar al menos un departamento y área'
          });
          return false;
        }
        return true;
        
      case 2:
        if (objetivosEspecificos.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin objetivos específicos',
            text: 'Debes agregar al menos un objetivo específico (módulo)'
          });
          return false;
        }
        
        for (const objetivoEspecifico of objetivosEspecificos) {
          const objetivosDetallados = objetivosPorModulo.filter(
            obj => obj.objetivoEspecificoId === objetivoEspecifico.id
          );
          
          if (objetivosDetallados.length === 0) {
            Swal.fire({
              icon: 'warning',
              title: 'Objetivos incompletos',
              text: `El objetivo específico "${objetivoEspecifico.nombre}" no tiene objetivos detallados.`
            });
            return false;
          }
        }
        
        return true;
        
      default:
        return true;
    }
  };
  
  const siguientePaso = () => {
    if (validarPaso()) {
      if (pasoActual < 2) {
        setPasoActual(pasoActual + 1);
      }
    }
  };
  
  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };
  
  const guardarObjetivo = async () => {
    if (!validarPaso()) return;
    
    try {
      const usuarioInfo = {
        id: userData?._id,
        nombre: userData?.Nombre || userData?.nombre || 'Administrador'
      };
      
      const estructuraJerarquica = {
        objetivosEspecificos: objetivosEspecificos.map(objEsp => {
          const objetivosDetalladosDeEsteModulo = objetivosPorModulo.filter(
            obj => obj.objetivoEspecificoId === objEsp.id
          );
          
          return {
            nombre: objEsp.nombre,
            descripcion: objEsp.descripcion || '',
            departamento: objEsp.departamento,
            area: objEsp.area,
            objetivosDetallados: objetivosDetalladosDeEsteModulo.map(objDet => ({
              descripcion: objDet.descripcion,
              recursos: objDet.recursos || '',
              metaFrecuencia: objDet.metaFrecuencia || ''
            }))
          };
        }),
        objetivosDetalladosPorModulo: objetivosEspecificos.map(objEsp => {
          const objetivosDetalladosDeEsteModulo = objetivosPorModulo.filter(
            obj => obj.objetivoEspecificoId === objEsp.id
          );
          
          return {
            objetivoEspecificoId: objEsp.id.toString(),
            objetivoEspecificoNombre: objEsp.nombre,
            cantidadObjetivosDetallados: objetivosDetalladosDeEsteModulo.length
          };
        })
      };
      
      const objetivosTransformados = [];
      
      objetivosEspecificos.forEach(objetivoEspecifico => {
        const objetivosDetalladosDeEsteModulo = objetivosPorModulo.filter(
          obj => obj.objetivoEspecificoId === objetivoEspecifico.id
        );
        
        objetivosDetalladosDeEsteModulo.forEach(objetivoDetallado => {
          objetivosTransformados.push({
            departamento: objetivoDetallado.departamento,
            area: objetivoDetallado.area.toUpperCase().trim(),
            objetivoEspecifico: objetivoEspecifico.nombre,
            objetivo: objetivoDetallado.descripcion,
            recursos: objetivoDetallado.recursos || "",
            metaFrecuencia: objetivoDetallado.metaFrecuencia || "",
            observaciones: "",
            indicadorENEABR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorFEB: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorMAR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorABR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorMAYOAGO: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorJUN: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorJUL: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorAGO: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorSEPDIC: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorOCT: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorNOV: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorDIC: { S1: "", S2: "", S3: "", S4: "", S5: "" },
            accionesCorrectivas: [],
            historialAnual: []
          });
        });
      });
      
      const departamentosUnicos = [...new Set(objetivosTransformados.map(item => item.departamento))];
      const areasUnicas = [...new Set(objetivosTransformados.map(item => item.area))];
      
      const objetivoData = {
        nombreObjetivoGeneral,
        departamentosAsignados: departamentosUnicos,
        objetivosEspecificos: objetivosTransformados,
        estructuraJerarquica,
        usuario: usuarioInfo,
        activo: true,
        añoActual: new Date().getFullYear()
      };
      
      const response = await api.post('/api/objetivos/multi-departamento', objetivoData);
      
      Swal.fire({
        icon: 'success',
        title: '¡Objetivo creado!',
        html: `
          <p>Se ha creado el objetivo: <strong>${nombreObjetivoGeneral}</strong></p>
          <p>Objetivos específicos: <strong>${objetivosEspecificos.length}</strong></p>
          <p>Objetivos detallados: <strong>${objetivosPorModulo.length}</strong></p>
          <p>Áreas involucradas: <strong>${areasUnicas.length}</strong></p>
        `
      }).then(() => {
        navigate('/objetivos');
      });
      
    } catch (error) {
      console.error('Error al crear objetivo:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `
          <p>${error.response?.data?.error || 'No se pudo crear el objetivo.'}</p>
          ${error.response?.data?.validationErrors ? 
            `<p><small>Detalles: ${JSON.stringify(error.response.data.validationErrors)}</small></p>` : 
            ''}
        `
      });
    }
  };
  
  const estaSeleccionado = (departamento, area) => {
    const areaMayusculas = area.toUpperCase().trim();
    return departamentosSeleccionados.some(
      item => item.departamento === departamento && item.area === areaMayusculas
    );
  };
  
  const contarObjetivosEspecificosPorArea = (departamento, area) => {
    return objetivosEspecificos.filter(obj => 
      obj.departamento === departamento && obj.area === area.toUpperCase().trim()
    ).length;
  };
  
  const contarObjetivosDetalladosPorArea = (departamento, area) => {
    return objetivosPorModulo.filter(obj => 
      obj.departamento === departamento && obj.area === area.toUpperCase().trim()
    ).length;
  };
  
  const renderPaso = () => {
    switch(pasoActual) {
      case 0:
        return (
          <Fade in={true} timeout={600}>
            <Box>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Description sx={{ fontSize: 60, color: '#4a6fa5', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
                    Define el Objetivo General
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este será el objetivo principal que guiará todos los objetivos específicos
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ej: Mejorar la eficiencia operativa de la empresa"
                  value={nombreObjetivoGeneral}
                  onChange={(e) => setNombreObjetivoGeneral(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.1rem',
                      padding: '8px',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                        borderWidth: 2
                      },
                      '&:hover fieldset': {
                        borderColor: '#4a6fa5',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4a6fa5',
                        borderWidth: 2
                      },
                    },
                  }}
                />
              </Paper>
            </Box>
          </Fade>
        );
        
      case 1:
        return (
          <Fade in={true} timeout={600}>
            <Box>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <BusinessCenter sx={{ color: '#4a6fa5', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Selecciona las Áreas Involucradas
                  </Typography>
                </Box>
                
                {departamentosSeleccionados.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {departamentosSeleccionados.length} área{departamentosSeleccionados.length !== 1 ? 's' : ''} seleccionada{departamentosSeleccionados.length !== 1 ? 's' : ''}
                  </Alert>
                )}
              </Paper>
              
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>Cargando áreas...</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {departamentosConAreas.map((depto, deptoIndex) => (
                    <Paper key={deptoIndex} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                        {depto.departamento}
                      </Typography>
                      
                      {depto.areas.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Sin áreas definidas
                        </Typography>
                      ) : (
                        <Grid container spacing={2}>
                          {depto.areas.map((area, areaIndex) => {
                            const seleccionada = estaSeleccionado(depto.departamento, area);
                            const cantObjEsp = contarObjetivosEspecificosPorArea(depto.departamento, area);
                            const cantObjDet = contarObjetivosDetalladosPorArea(depto.departamento, area);
                            
                            return (
                              <Grid item xs={12} sm={6} md={4} key={areaIndex}>
                                <Card 
                                  onClick={() => handleSeleccionDepartamentoArea(depto.departamento, area)}
                                  sx={{
                                    cursor: 'pointer',
                                    border: seleccionada ? '2px solid #4a6fa5' : '1px solid #e0e0e0',
                                    backgroundColor: seleccionada ? '#f0f7ff' : 'white',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: 3
                                    }
                                  }}
                                >
                                  <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                      {seleccionada && (
                                        <CheckCircle sx={{ color: '#4a6fa5', fontSize: 20, mt: 0.3 }} />
                                      )}
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                          {area}
                                        </Typography>
                                        {seleccionada && (cantObjEsp > 0 || cantObjDet > 0) && (
                                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            {cantObjEsp > 0 && (
                                              <Chip label={`${cantObjEsp} módulo${cantObjEsp !== 1 ? 's' : ''}`} size="small" color="primary" />
                                            )}
                                            {cantObjDet > 0 && (
                                              <Chip label={`${cantObjDet} objetivo${cantObjDet !== 1 ? 's' : ''}`} size="small" />
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Fade>
        );
        
      case 2:
        return (
          <Fade in={true} timeout={600}>
            <Box>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Assignment sx={{ color: '#4a6fa5', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      Estructura Jerárquica
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={abrirDialogObjetivoEspecifico}
                    disabled={departamentosSeleccionados.length === 0}
                    sx={{
                      bgcolor: '#4a6fa5',
                      '&:hover': { bgcolor: '#3a5a80' },
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Nuevo Objetivo Específico
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Chip 
                    label={`${objetivosEspecificos.length} Objetivos Específicos`} 
                    color="primary" 
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip 
                    label={`${objetivosPorModulo.length} Objetivos Detallados`}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Paper>
              
              {objetivosEspecificos.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed #e0e0e0' }}>
                  <Assignment sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#757575', mb: 1 }}>
                    No hay objetivos específicos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Crea tu primer objetivo específico para comenzar
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={abrirDialogObjetivoEspecifico}
                    disabled={departamentosSeleccionados.length === 0}
                    sx={{
                      bgcolor: '#4a6fa5',
                      '&:hover': { bgcolor: '#3a5a80' },
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Crear Primer Objetivo
                  </Button>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {objetivosEspecificos.map((objetivoEspecifico, index) => {
                    const objetivosDetallados = objetivosPorModulo.filter(
                      obj => obj.objetivoEspecificoId === objetivoEspecifico.id
                    );
                    
                    return (
                      <Card key={objetivoEspecifico.id} elevation={2} sx={{ borderRadius: 3, overflow: 'visible' }}>
                        <CardContent sx={{ p: 0 }}>
                          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderBottom: '1px solid #e0e0e0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                <Box sx={{
                                  bgcolor: '#4a6fa5',
                                  color: 'white',
                                  width: 45,
                                  height: 45,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '1.2rem'
                                }}>
                                  {index + 1}
                                </Box>
                                
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
                                    {objetivoEspecifico.nombre}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label={objetivoEspecifico.area} size="small" color="primary" />
                                    <Chip label={objetivoEspecifico.departamento} size="small" variant="outlined" />
                                    {objetivosDetallados.length > 0 && (
                                      <Chip 
                                        label={`${objetivosDetallados.length} objetivo${objetivosDetallados.length !== 1 ? 's' : ''}`} 
                                        size="small" 
                                        sx={{ bgcolor: '#e8f5e9' }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  onClick={() => abrirDialogObjetivoDetallado(objetivoEspecifico.id)}
                                  sx={{ bgcolor: '#4caf50', color: 'white', '&:hover': { bgcolor: '#388e3c' } }}
                                  size="small"
                                >
                                  <Add />
                                </IconButton>
                                <IconButton
                                  onClick={() => eliminarObjetivoEspecifico(objetivoEspecifico.id)}
                                  sx={{ bgcolor: '#f44336', color: 'white', '&:hover': { bgcolor: '#d32f2f' } }}
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </Box>
                            
                            {objetivoEspecifico.descripcion && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 7 }}>
                                {objetivoEspecifico.descripcion}
                              </Typography>
                            )}
                          </Box>
                          
                          {objetivosDetallados.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                No hay objetivos detallados en este módulo
                              </Typography>
                              <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={() => abrirDialogObjetivoDetallado(objetivoEspecifico.id)}
                                sx={{ textTransform: 'none' }}
                              >
                                Agregar Objetivo Detallado
                              </Button>
                            </Box>
                          ) : (
                            <Box sx={{ p: 3 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                                Objetivos Detallados ({objetivosDetallados.length})
                              </Typography>
                              
                              <Stack spacing={2}>
                                {objetivosDetallados.map((objDetallado, detIndex) => (
                                  <Paper 
                                    key={objDetallado.id} 
                                    elevation={0}
                                    sx={{ 
                                      p: 2, 
                                      bgcolor: '#fafafa',
                                      border: '1px solid #e0e0e0',
                                      borderRadius: 2
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
                                          {index + 1}.{detIndex + 1} - {objDetallado.descripcion}
                                        </Typography>
                                        
                                        {(objDetallado.recursos || objDetallado.metaFrecuencia) && (
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                                            {objDetallado.recursos && (
                                              <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                  Recursos:
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                  {objDetallado.recursos}
                                                </Typography>
                                              </Box>
                                            )}
                                            {objDetallado.metaFrecuencia && (
                                              <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                  Meta:
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                  {objDetallado.metaFrecuencia}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                      
                                      <IconButton
                                        onClick={() => eliminarObjetivoDetallado(objDetallado.id)}
                                        size="small"
                                        sx={{ color: '#f44336' }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Paper>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Fade>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box className="crear-objetivo-wrapper" ref={topRef}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 4, color: 'white', background: 'linear-gradient(135deg, #4a6fa5 0%, #2c3e50 100%)' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Crear Nuevo Objetivo Multi-Departamento
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Define objetivos colaborativos entre diferentes áreas de la empresa
            </Typography>
          </Box>
          
          {/* Stepper */}
          <Box sx={{ px: 4, pt: 4 }}>
            <Stepper activeStep={pasoActual} alternativeLabel>
              {pasos.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          {/* Contenido */}
          <Box sx={{ p: 4 }}>
            {renderPaso()}
          </Box>
          
          {/* Navegación */}
          <Divider />
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={pasoAnterior}
              disabled={pasoActual === 0}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none' }}
            >
              Anterior
            </Button>
            
            {pasoActual < 2 ? (
              <Button
                onClick={siguientePaso}
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: '#4a6fa5',
                  '&:hover': { bgcolor: '#3a5a80' },
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={guardarObjetivo}
                variant="contained"
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#388e3c' },
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Guardar Objetivo Completo
              </Button>
            )}
          </Box>
        </Paper>
        
        {/* Resumen inferior */}
        <Paper elevation={1} sx={{ mt: 3, p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Resumen
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4a6fa5' }}>
                  {nombreObjetivoGeneral ? '✓' : '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Objetivo General
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4a6fa5' }}>
                  {departamentosSeleccionados.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Áreas Seleccionadas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4a6fa5' }}>
                  {objetivosEspecificos.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Objetivos Específicos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4a6fa5' }}>
                  {objetivosPorModulo.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Objetivos Detallados
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
      
      {/* Dialog para Objetivo Específico */}
      <Dialog 
        open={dialogObjetivoEspecifico} 
        onClose={() => setDialogObjetivoEspecifico(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#4a6fa5', color: 'white', fontWeight: 600 }}>
          Nuevo Objetivo Específico
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <TextField
            select
            fullWidth
            label="Selecciona el área"
            value={formObjEspecifico.areaIndex}
            onChange={(e) => setFormObjEspecifico({ ...formObjEspecifico, areaIndex: parseInt(e.target.value) })}
            sx={{ mb: 3 }}
            SelectProps={{
              native: true,
            }}
          >
            {departamentosSeleccionados.map((item, index) => (
              <option key={index} value={index}>
                {item.departamento} - {item.area}
              </option>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            label="Nombre del Objetivo Específico"
            placeholder="Ej: Optimizar procesos de compras"
            value={formObjEspecifico.nombre}
            onChange={(e) => setFormObjEspecifico({ ...formObjEspecifico, nombre: e.target.value })}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Descripción (opcional)"
            placeholder="Describe brevemente este objetivo específico"
            value={formObjEspecifico.descripcion}
            onChange={(e) => setFormObjEspecifico({ ...formObjEspecifico, descripcion: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogObjetivoEspecifico(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarObjetivoEspecifico} 
            variant="contained"
            sx={{
              bgcolor: '#4a6fa5',
              '&:hover': { bgcolor: '#3a5a80' },
              textTransform: 'none'
            }}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog para Objetivo Detallado */}
      <Dialog 
        open={dialogObjetivoDetallado} 
        onClose={() => setDialogObjetivoDetallado(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#4a6fa5', color: 'white', fontWeight: 600 }}>
          Nuevo Objetivo Detallado
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {objetivoEspecificoSeleccionado && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Área
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {objetivoEspecificoSeleccionado.area}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Objetivo Específico
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {objetivoEspecificoSeleccionado.nombre}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Descripción del Objetivo"
            placeholder="Describe el objetivo detallado"
            value={formObjDetallado.descripcion}
            onChange={(e) => setFormObjDetallado({ ...formObjDetallado, descripcion: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Recursos (opcional)"
            placeholder="Recursos necesarios"
            value={formObjDetallado.recursos}
            onChange={(e) => setFormObjDetallado({ ...formObjDetallado, recursos: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Meta / Frecuencia (opcional)"
            placeholder="Ej: 95% mensual"
            value={formObjDetallado.meta}
            onChange={(e) => setFormObjDetallado({ ...formObjDetallado, meta: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogObjetivoDetallado(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarObjetivoDetallado} 
            variant="contained"
            sx={{
              bgcolor: '#4a6fa5',
              '&:hover': { bgcolor: '#3a5a80' },
              textTransform: 'none'
            }}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrearObjetivoMultiDepartamento;