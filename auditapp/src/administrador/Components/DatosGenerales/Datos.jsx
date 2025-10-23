import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
  Avatar,
  InputAdornment,
  Fade
} from '@mui/material';
import {
  Add,
  Remove,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Schedule,
  Person,
  Assignment,
  Dashboard,
  Send,
  Visibility
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import Historial from './HistorialAuditorias';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20'
    },
    secondary: {
      main: '#FF6F00',
      light: '#FF9800',
      dark: '#E65100'
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12
  }
});

// Componentes estilizados
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
  }
}));

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: ownerState.active || ownerState.completed 
    ? theme.palette.primary.main 
    : theme.palette.grey[300],
  color: ownerState.active || ownerState.completed ? '#fff' : theme.palette.grey[500],
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 600,
  fontSize: '1rem',
  transition: 'all 0.3s ease',
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'transparent',
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.grey[300],
  }
}));

const StyledTable = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 600,
  }
}));

const ProgressButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
    transition: 'left 0.5s',
  },
  '&:hover::after': {
    left: '100%',
  }
}));

const steps = ['Datos Generales', 'Equipo Auditor', 'Programas', 'Revisión Final'];

const Datos = () => {
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    TipoAuditoria: '',
    Duracion: '',
    FechaInicio: '',
    FechaFin: '',
    Departamento: '',
    AreasAudi: [],
    Auditados: [],
    AuditorLider: '',
    AuditorLiderEmail: '',
    EquipoAuditor: [],
    Observador: false,
    NombresObservadores: '',
    Programa: [],
    Estado: 'pendiente',
    PorcentajeTotal: '0',
    FechaElaboracion: '',
    Comentario: '',
    Estatus: ''
  });

  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [auditorLiderSeleccionado, setAuditorLiderSeleccionado] = useState('');
  const [equipoAuditorDisabled, setEquipoAuditorDisabled] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewOpen, setPreviewOpen] = useState(false);

  // Efectos para cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasRes, programasRes, usuariosRes] = await Promise.all([
          api.get('/areas'),
          api.get('/programas'),
          api.get('/usuarios')
        ]);
        setAreas(areasRes.data);
        setProgramas(programasRes.data);
        setUsuarios(usuariosRes.data);
      } catch (error) {
        console.error("Error al cargar datos", error);
        showSnackbar('Error al cargar datos iniciales', 'error');
      }
    };
    fetchData();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };

    if (name === 'AuditorLider') {
      await handleAuditorLiderChange(value);
      return;
    }

    if (name === 'FechaInicio' || name === 'FechaFin') {
      const { FechaInicio, FechaFin } = newFormData;
      if (FechaInicio && FechaFin) {
        const inicio = new Date(FechaInicio + 'T00:00:00');
        const fin = new Date(FechaFin + 'T00:00:00');
        if (inicio <= fin) {
          const inicioMes = inicio.toLocaleString('es-ES', { month: 'long' });
          const finMes = fin.toLocaleString('es-ES', { month: 'long' });
          if (inicioMes === finMes) {
            newFormData.Duracion = `del ${inicio.getDate()} al ${fin.getDate()} de ${inicioMes} ${inicio.getFullYear()}`;
          } else {
            newFormData.Duracion = `del ${inicio.getDate()} de ${inicioMes} al ${fin.getDate()} de ${finMes} ${inicio.getFullYear()}`;
          }
        } else {
          showSnackbar('La fecha de fin debe ser mayor o igual a la fecha de inicio', 'error');
          return;
        }
      }
    }

    setFormData(newFormData);
  };

  const handleAuditorLiderChange = async (value) => {
    setAuditorLiderSeleccionado(value);
    try {
      const response = await api.get(`/usuarios/nombre/${encodeURIComponent(value)}`);
      const email = response.data.Correo || response.data.email;
      setFormData(prev => ({
        ...prev,
        AuditorLider: value,
        AuditorLiderEmail: email
      }));
    } catch (error) {
      console.error("Error al obtener el correo del auditor líder", error);
      setFormData(prev => ({
        ...prev,
        AuditorLider: value,
        AuditorLiderEmail: ''
      }));
    }
  };

  const handleAreaChange = (e) => {
    const { value } = e.target;
    if (value === 'No aplica') {
      setAreasSeleccionadas([]);
      setFormData(prev => ({ ...prev, AreasAudi: [] }));
    } else if (value && !areasSeleccionadas.includes(value)) {
      const newAreas = [...areasSeleccionadas, value];
      setAreasSeleccionadas(newAreas);
      setFormData(prev => ({ ...prev, AreasAudi: newAreas }));
    }
  };

  const handleAreaRemove = (area) => {
    const newAreas = areasSeleccionadas.filter(a => a !== area);
    setAreasSeleccionadas(newAreas);
    setFormData(prev => ({ ...prev, AreasAudi: newAreas }));
  };

  const handleAuditadosChange = async (e) => {
    const { value } = e.target;
    if (value && !formData.Auditados.some(a => a.Nombre === value)) {
      try {
        const response = await api.get(`/usuarios/nombre/${encodeURIComponent(value)}`);
        const email = response.data.Correo;
        setFormData(prev => ({
          ...prev,
          Auditados: [...prev.Auditados, { Nombre: value, Correo: email }]
        }));
      } catch (error) {
        console.error("Error al obtener el correo del auditado", error);
      }
    }
  };

  const handleAuditadosRemove = (auditado) => {
    setFormData(prev => ({
      ...prev,
      Auditados: prev.Auditados.filter(a => a.Nombre !== auditado.Nombre)
    }));
  };

  const handleEquipChange = async (e) => {
    const { value } = e.target;
    if (value === "No aplica") {
      setEquipoAuditorDisabled(true);
      setFormData(prev => ({ ...prev, EquipoAuditor: [] }));
    } else if (value && !formData.EquipoAuditor.some(e => e.Nombre === value)) {
      try {
        const response = await api.get(`/usuarios/nombre/${encodeURIComponent(value)}`);
        const email = response.data.Correo;
        setFormData(prev => ({
          ...prev,
          EquipoAuditor: [...prev.EquipoAuditor, { Nombre: value, Correo: email }]
        }));
      } catch (error) {
        console.error("Error al obtener el correo del equipo auditor", error);
      }
    }
  };

  const handleEquipRemove = (equip) => {
    setFormData(prev => ({
      ...prev,
      EquipoAuditor: prev.EquipoAuditor.filter(e => e.Nombre !== equip.Nombre)
    }));
  };

  const handleProgramChange = async (e) => {
    const { value } = e.target;
    const selectedProgram = programas.find(programa => programa.Nombre === value);

    if (selectedProgram && !formData.Programa.some(p => p.Nombre === value)) {
      const formattedProgram = {
        Porcentaje: '0',
        Nombre: selectedProgram.Nombre,
        Descripcion: selectedProgram.Descripcion.map(desc => ({
          ID: desc.ID,
          Criterio: desc.Criterio || null,
          Requisito: desc.Requisito,
          Observacion: "",
          Hallazgo: [],
          FechaElaboracion: "",
          Comentario: "",
          Estatus: ""
        }))
      };

      setFormData(prev => ({
        ...prev,
        Programa: [...prev.Programa, formattedProgram]
      }));
    }
  };

  const handleProgramRemove = (program) => {
    setFormData(prev => ({
      ...prev,
      Programa: prev.Programa.filter(p => p.Nombre !== program.Nombre)
    }));
  };

  const handleDepartamentoChange = (e) => {
    const selectedDept = e.target.value;
    setSelectedDepartamento(selectedDept);
    const dept = areas.find(area => area.departamento === selectedDept);
    setFilteredAreas(dept ? dept.areas : []);
    setFormData(prev => ({ ...prev, Departamento: selectedDept }));
  };

  const handleNext = () => {
    if (formStep === steps.length - 1) {
      handleSubmit();
    } else {
      setFormStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setFormStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      if (formData.Programa.length === 0) {
        showSnackbar('Por favor, seleccione al menos un programa', 'error');
        return;
      }

      const formDataWithDefaults = {
        ...formData,
        Estado: "pendiente",
        PorcentajeTotal: "0"
      };

      await api.post('/datos', formDataWithDefaults);
      
      Swal.fire({
        title: '¡Auditoría generada con éxito!',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2E7D32'
      }).then(() => {
        // Reset form
        setFormData({
          TipoAuditoria: '',
          Duracion: '',
          FechaInicio: '',
          FechaFin: '',
          Departamento: '',
          AreasAudi: [],
          Auditados: [],
          AuditorLider: '',
          AuditorLiderEmail: '',
          EquipoAuditor: [],
          Observador: false,
          NombresObservadores: '',
          Programa: [],
          Estado: 'pendiente',
          PorcentajeTotal: '0',
          FechaElaboracion: '',
          Comentario: '',
          Estatus: ''
        });
        setAreasSeleccionadas([]);
        setFormStep(0);
      });
      
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      showSnackbar('Error al guardar los datos', 'error');
    }
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return formData.TipoAuditoria && formData.FechaInicio && formData.FechaFin && 
               formData.Departamento && areasSeleccionadas.length > 0 && formData.Auditados.length > 0;
      case 1:
        return formData.AuditorLider && (!formData.Observador || formData.NombresObservadores);
      case 2:
        return formData.Programa.length > 0;
      default:
        return true;
    }
  };

  const CustomStepIcon = (props) => {
    const { active, completed, icon } = props;
    const icons = {
      1: <Dashboard />,
      2: <Person />,
      3: <Assignment />,
      4: <CheckCircle />
    };

    return (
      <StepIconRoot ownerState={{ active, completed }}>
        {completed ? <CheckCircle /> : icons[icon] || icon}
      </StepIconRoot>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de auditoría</InputLabel>
                  <Select
                    name="TipoAuditoria"
                    value={formData.TipoAuditoria}
                    onChange={handleChange}
                    label="Tipo de auditoría"
                  >
                    <MenuItem value="Interna">Interna</MenuItem>
                    <MenuItem value="Externa">Externa</MenuItem>
                    <MenuItem value="FSSC 22000">FSSC 22000</MenuItem>
                    <MenuItem value="Responsabilidad social">Responsabilidad Social</MenuItem>
                    <MenuItem value="Inspección de autoridades">Inspección de Autoridades</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duración"
                  value={formData.Duracion}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start"><Schedule /></InputAdornment>,
                  }}
                  helperText="Calculado automáticamente"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  name="FechaInicio"
                  label="Fecha de inicio"
                  value={formData.FechaInicio}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  name="FechaFin"
                  label="Fecha de fin"
                  value={formData.FechaFin}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    value={selectedDepartamento}
                    onChange={handleDepartamentoChange}
                    label="Departamento"
                  >
                    {areas.map(area => (
                      <MenuItem key={area.departamento} value={area.departamento}>
                        {area.departamento}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Áreas</InputLabel>
                  <Select
                    value=""
                    onChange={handleAreaChange}
                    label="Áreas"
                  >
                    <MenuItem value="No aplica">No aplica</MenuItem>
                    {filteredAreas.map((area, index) => (
                      <MenuItem key={index} value={area}>{area}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {areasSeleccionadas.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Áreas seleccionadas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {areasSeleccionadas.map((area, index) => (
                      <Chip
                        key={index}
                        label={area}
                        onDelete={() => handleAreaRemove(area)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Auditados</InputLabel>
                  <Select
                    value=""
                    onChange={handleAuditadosChange}
                    label="Auditados"
                  >
                    {usuarios.filter(usuario => usuario.Departamento === selectedDepartamento).map(usuario => (
                      <MenuItem key={usuario._id} value={usuario.Nombre}>
                        {usuario.Nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {formData.Auditados.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Auditados seleccionados:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.Auditados.map((auditado, index) => (
                      <Chip
                        key={index}
                        label={auditado.Nombre}
                        onDelete={() => handleAuditadosRemove(auditado)}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Fade>
        );

      case 1:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Auditor Líder</InputLabel>
                  <Select
                    name="AuditorLider"
                    value={formData.AuditorLider}
                    onChange={(e) => handleAuditorLiderChange(e.target.value)}
                    label="Auditor Líder"
                  >
                    {usuarios.filter(usuario => 
                      ['auditor', 'administrador'].includes(usuario.TipoUsuario)
                    ).map(usuario => (
                      <MenuItem key={usuario._id} value={usuario.Nombre}>
                        {usuario.Nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={equipoAuditorDisabled}>
                  <InputLabel>Equipo Auditor</InputLabel>
                  <Select
                    value=""
                    onChange={handleEquipChange}
                    label="Equipo Auditor"
                  >
                    <MenuItem value="No aplica">No aplica</MenuItem>
                    {usuarios.filter(usuario => 
                      ['auditor', 'administrador'].includes(usuario.TipoUsuario) && 
                      usuario.Nombre !== auditorLiderSeleccionado
                    ).map(usuario => (
                      <MenuItem key={usuario._id} value={usuario.Nombre}>
                        {usuario.Nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {formData.EquipoAuditor.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Equipo auditor seleccionado:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.EquipoAuditor.map((equip, index) => (
                      <Chip
                        key={index}
                        label={equip.Nombre}
                        onDelete={() => handleEquipRemove(equip)}
                        color="primary"
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="Observador"
                      checked={formData.Observador}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Incluir observador"
                />
              </Grid>

              {formData.Observador && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="NombresObservadores"
                    label="Nombre(s) del observador(es)"
                    value={formData.NombresObservadores}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              )}
            </Grid>
          </Fade>
        );

      case 2:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Programas</InputLabel>
                  <Select
                    value=""
                    onChange={handleProgramChange}
                    label="Programas"
                  >
                    {programas
                      .filter(programa => !formData.Programa.some(selected => selected.Nombre === programa.Nombre))
                      .map(programa => (
                        <MenuItem key={programa._id} value={programa.Nombre}>
                          {programa.Nombre}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {formData.Programa.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Programas seleccionados ({formData.Programa.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.Programa.map((program, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper 
                          variant="outlined" 
                          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Typography variant="body1">{program.Nombre}</Typography>
                          <IconButton 
                            color="error" 
                            onClick={() => handleProgramRemove(program)}
                            size="small"
                          >
                            <Remove />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Fade>
        );

      case 3:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Vista previa de la auditoría
                </Typography>
                <Button
                  startIcon={<Visibility />}
                  onClick={() => setPreviewOpen(true)}
                  variant="outlined"
                >
                  Vista completa
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Información general
                    </Typography>
                    <Typography variant="body2"><strong>Tipo:</strong> {formData.TipoAuditoria}</Typography>
                    <Typography variant="body2"><strong>Duración:</strong> {formData.Duracion}</Typography>
                    <Typography variant="body2"><strong>Departamento:</strong> {formData.Departamento}</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Equipo
                    </Typography>
                    <Typography variant="body2"><strong>Auditor Líder:</strong> {formData.AuditorLider}</Typography>
                    <Typography variant="body2"><strong>Equipo:</strong> {formData.EquipoAuditor.length} miembros</Typography>
                    <Typography variant="body2"><strong>Programas:</strong> {formData.Programa.length} seleccionados</Typography>
                  </Paper>
                </Grid>

                {formData.Programa.slice(0, 1).map((program, index) => (
                  <Grid item xs={12} key={index}>
                    <StyledTable component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell colSpan={2} align="center" sx={{ fontWeight: 600 }}>
                              {program.Nombre}
                            </TableCell>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 600 }}>
                              Cumplimiento
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Requisitos</TableCell>
                            <TableCell>Conforme</TableCell>
                            <TableCell>m</TableCell>
                            <TableCell>M</TableCell>
                            <TableCell>C</TableCell>
                            <TableCell>NA</TableCell>
                            <TableCell>Hallazgos/Observaciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {program.Descripcion.slice(0, 3).map((desc, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{desc.ID}</TableCell>
                              <TableCell>{desc.Requisito}</TableCell>
                              <TableCell><Checkbox /></TableCell>
                              <TableCell><Checkbox /></TableCell>
                              <TableCell><Checkbox /></TableCell>
                              <TableCell><Checkbox /></TableCell>
                              <TableCell><Checkbox /></TableCell>
                              <TableCell>
                                <TextField size="small" multiline rows={1} fullWidth />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </StyledTable>
                    {program.Descripcion.length > 3 && (
                      <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                        ... y {program.Descripcion.length - 3} requisitos más
                      </Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  const PreviewDialog = () => (
    <Dialog 
      open={previewOpen} 
      onClose={() => setPreviewOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Vista previa completa - {formData.TipoAuditoria}
      </DialogTitle>
      <DialogContent dividers>
        {formData.Programa.map((program, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {program.Nombre}
            </Typography>
            <StyledTable>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Requisitos</TableCell>
                    <TableCell>Conforme</TableCell>
                    <TableCell>m</TableCell>
                    <TableCell>M</TableCell>
                    <TableCell>C</TableCell>
                    <TableCell>NA</TableCell>
                    <TableCell>Hallazgos/Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {program.Descripcion.map((desc, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{desc.ID}</TableCell>
                      <TableCell>{desc.Requisito}</TableCell>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>
                        <TextField size="small" multiline rows={2} fullWidth />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTable>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', py: 3 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <Assignment />
              </Avatar>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                Nueva Auditoría
              </Typography>
              <Historial />
            </Toolbar>
          </AppBar>

          <Box sx={{ mt: 4 }}>
            {/* Stepper */}
            <StyledCard>
              <CardContent>
                <StyledStepper activeStep={formStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel StepIconComponent={CustomStepIcon}>
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </StyledStepper>
              </CardContent>
            </StyledCard>

            {/* Form Content */}
            <StyledCard sx={{ mt: 3 }}>
              <CardContent sx={{ p: 4 }}>
                {renderStepContent(formStep)}
              </CardContent>
            </StyledCard>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                disabled={formStep === 0}
                variant="outlined"
                size="large"
              >
                Anterior
              </Button>

              <ProgressButton
                endIcon={formStep === steps.length - 1 ? <Send /> : <ArrowForward />}
                onClick={handleNext}
                disabled={!isStepComplete(formStep)}
                variant="contained"
                size="large"
                color={formStep === steps.length - 1 ? "success" : "primary"}
              >
                {formStep === steps.length - 1 ? 'Generar Auditoría' : 'Siguiente'}
              </ProgressButton>
            </Box>
          </Box>
        </Container>

        {/* Preview Dialog */}
        <PreviewDialog />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

// Container component para mantener la estructura
const Container = ({ children, maxWidth = 'lg', ...props }) => (
  <Box
    {...props}
    sx={{
      maxWidth: maxWidth === 'lg' ? 1200 : maxWidth,
      mx: 'auto',
      px: 3,
      ...props.sx
    }}
  >
    {children}
  </Box>
);

export default Datos;