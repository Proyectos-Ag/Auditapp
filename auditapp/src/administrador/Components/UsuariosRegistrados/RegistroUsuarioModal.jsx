import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Slide,
  Paper,
  Divider,
  Grid,
  useTheme,
  alpha,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Chip,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Close,
  Work,
  Email,
  Security,
  Business,
  School,
  CalendarToday,
  TrendingUp,
  CorporateFare,
  CheckCircle,
  Person,
  Badge,
  Group,
  AdminPanelSettings,
  Engineering
} from '@mui/icons-material';

const ProfessionalUserModal = ({ show, handleClose }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    Nombre: '',
    Correo: '',
    Contraseña: '',
    ConfirmarContraseña: '',
    Puesto: '',
    FechaIngreso: '',
    Escolaridad: 'TSU',
    Carrera: '',
    TipoUsuario: 'auditor',
    AñosExperiencia: '',
    Departamento: '',
    area: '',
    customDepartamento: ''
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Steps para el stepper
  const steps = ['Tipo de Usuario', 'Información Básica', 'Seguridad', 'Ubicación Organizacional'];

  // Estilos mejorados y modernos
  const styles = {
    modalContainer: {
      backdropFilter: 'blur(15px)',
      backgroundColor: alpha('#000', 0.6),
    },
    modalPaper: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 50%, #f0f4ff 100%)',
      borderRadius: '20px',
      boxShadow: '0 32px 64px rgba(0,0,0,0.2), 0 16px 32px rgba(102, 126, 234, 0.1)',
      overflow: 'hidden',
      maxWidth: 900,
      width: '95vw',
      maxHeight: '95vh',
      overflowY: 'auto',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    modalHeader: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
      color: 'white',
      padding: '30px 40px 20px 40px',
      position: 'relative',
      textAlign: 'center',
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      fontWeight: 800,
      fontSize: '2rem',
      letterSpacing: '-0.5px',
      marginBottom: 2,
    },
    modalSubtitle: {
      opacity: 0.9,
      fontSize: '1.1rem',
      fontWeight: 400,
    },
    closeButton: {
      position: 'absolute',
      right: 20,
      top: 20,
      color: 'white',
      background: alpha('#fff', 0.15),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${alpha('#fff', 0.2)}`,
      borderRadius: '12px',
      padding: '8px',
      transition: 'all 0.3s ease',
      '&:hover': {
        background: alpha('#fff', 0.25),
        transform: 'scale(1.1) rotate(90deg)',
      },
    },
    formContainer: {
      padding: '40px',
    },
    stepperContainer: {
      padding: '30px 40px 0 40px',
      background: alpha(theme.palette.primary.main, 0.03),
    },
    stepConnector: {
      '& .MuiStepConnector-line': {
        borderColor: alpha(theme.palette.primary.main, 0.3),
        borderWidth: 2,
      },
    },
    stepIcon: {
      color: alpha(theme.palette.primary.main, 0.3),
      '&.Mui-active': {
        color: theme.palette.primary.main,
      },
      '&.Mui-completed': {
        color: theme.palette.success.main,
      },
    },
    userTypeCard: {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: '16px',
      padding: '25px',
      textAlign: 'center',
      background: 'white',
      '&:hover': {
        transform: 'translateY(-5px)',
        borderColor: theme.palette.primary.main,
        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.15)',
      },
      '&.selected': {
        borderColor: theme.palette.primary.main,
        background: alpha(theme.palette.primary.main, 0.05),
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.2)',
      },
    },
    formGrid: {
      gap: 3,
    },
    formGroup: {
      marginBottom: 3,
    },
    inputField: {
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        background: 'white',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
        },
        '&.Mui-focused': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
          background: 'white',
        },
      },
      '& .MuiInputLabel-root': {
        fontWeight: 600,
      },
    },
    selectField: {
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        background: 'white',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    },
    passwordToggle: {
      color: theme.palette.primary.main,
      background: alpha(theme.palette.primary.main, 0.1),
      borderRadius: '8px',
      marginRight: '8px',
      '&:hover': {
        background: alpha(theme.palette.primary.main, 0.2),
        color: theme.palette.primary.dark,
      },
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      color: theme.palette.primary.main,
      marginBottom: 3,
      marginTop: 4,
      paddingBottom: 2,
      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      fontWeight: 700,
      fontSize: '1.3rem',
    },
    additionalFields: {
      padding: '30px',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      borderRadius: '16px',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      marginTop: 3,
      boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
    },
    modalActions: {
      padding: '30px 40px',
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      gap: 3,
    },
    cancelButton: {
      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      color: 'white',
      fontWeight: 700,
      borderRadius: '12px',
      padding: '15px 35px',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 12px 25px rgba(107, 114, 128, 0.4)',
      },
    },
    submitButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontWeight: 700,
      borderRadius: '12px',
      padding: '15px 35px',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 15px 30px rgba(102, 126, 234, 0.4)',
        '&::before': {
          transform: 'translateX(100%)',
        },
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        transform: 'translateX(-100%)',
        transition: 'transform 0.6s',
      },
      '&:disabled': {
        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
        transform: 'none',
        boxShadow: 'none',
      },
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: alpha('#fff', 0.95),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      borderRadius: '20px',
      backdropFilter: 'blur(5px)',
    },
    successAnimation: {
      textAlign: 'center',
      padding: 4,
      color: theme.palette.success.main,
    },
    userTypeIcon: {
      fontSize: '4rem',
      marginBottom: 2,
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    chip: {
      borderRadius: '8px',
      fontWeight: 700,
      marginTop: 2,
    },
  };

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/areas`);
        setAreas(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener las áreas", error);
        setLoading(false);
      }
    };

    if (show) {
      fetchAreas();
      setActiveStep(0);
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (error) setError('');
  };

  const handleUserTypeSelect = (type) => {
    setFormData({
      ...formData,
      TipoUsuario: type
    });
    handleNext();
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*\d)[A-Za-z\d]{8}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { Contraseña, ConfirmarContraseña, customDepartamento, Departamento } = formData;

    if (!validatePassword(Contraseña)) {
      setError('La contraseña debe tener exactamente 8 caracteres y al menos un número.');
      return;
    }

    if (Contraseña !== ConfirmarContraseña) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setLoading(true);

    const data = { ...formData };
    if (Departamento === 'otro') {
      data.Departamento = customDepartamento;
    }

    try {
      await api.post(`/usuarios`, data);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          Nombre: '',
          Correo: '',
          Contraseña: '',
          ConfirmarContraseña: '',
          Puesto: '',
          FechaIngreso: '',
          Escolaridad: 'TSU',
          Carrera: '',
          TipoUsuario: 'auditor',
          AñosExperiencia: '',
          Departamento: '',
          area: '',
          customDepartamento: ''
        });
        setActiveStep(0);
        handleClose();
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setError('El correo electrónico ya está registrado en el sistema.');
    } finally {
      setLoading(false);
    }
  };

  const renderUserTypeSelection = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom>
        Selecciona el Tipo de Usuario
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
        Elige el perfil que mejor se adapte al nuevo usuario
      </Typography>
      
      <Grid container spacing={4} sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={styles.userTypeCard}
            className={formData.TipoUsuario === 'auditor' ? 'selected' : ''}
            onClick={() => handleUserTypeSelect('auditor')}
          >
            <AdminPanelSettings sx={styles.userTypeIcon} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Auditor
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Usuario con permisos para realizar auditorías y evaluaciones del sistema
            </Typography>
            <Chip 
              icon={<TrendingUp />} 
              label="Acceso Completo" 
              color="primary" 
              variant="outlined"
              sx={styles.chip}
            />
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            sx={styles.userTypeCard}
            className={formData.TipoUsuario === 'auditado' ? 'selected' : ''}
            onClick={() => handleUserTypeSelect('auditado')}
          >
            <Engineering sx={styles.userTypeIcon} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Auditado
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Usuario que será evaluado en las auditorías del sistema
            </Typography>
            <Chip 
              icon={<Group />} 
              label="Acceso Básico" 
              color="secondary" 
              variant="outlined"
              sx={styles.chip}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderBasicInfo = () => (
    <Box>
      <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Información Básica del Usuario
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre Completo"
            name="Nombre"
            value={formData.Nombre}
            onChange={handleChange}
            placeholder="Ingrese nombre completo"
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Puesto"
            name="Puesto"
            value={formData.Puesto}
            onChange={handleChange}
            placeholder="Ingrese puesto actual"
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Work color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Correo Electrónico"
            name="Correo"
            type="email"
            value={formData.Correo}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderSecurity = () => (
    <Box>
      <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Configuración de Seguridad
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contraseña"
            name="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={formData.Contraseña}
            onChange={handleChange}
            placeholder="8 caracteres, al menos 1 número"
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Security color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={styles.passwordToggle}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            name="ConfirmarContraseña"
            type={showPassword ? 'text' : 'password'}
            value={formData.ConfirmarContraseña}
            onChange={handleChange}
            placeholder="Repita su contraseña"
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Security color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={styles.passwordToggle}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderLocation = () => (
    <Box>
      <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Ubicación Organizacional
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={styles.selectField}>
            <InputLabel>Departamento</InputLabel>
            <Select
              name="Departamento"
              value={formData.Departamento}
              onChange={handleChange}
              label="Departamento"
              required
              startAdornment={
                <InputAdornment position="start">
                  <Business color="primary" />
                </InputAdornment>
              }
            >
              <MenuItem value="">Seleccione un departamento</MenuItem>
              {areas.length > 0 ? (
                areas.map(area => (
                  <MenuItem key={area.departamento} value={area.departamento}>
                    {area.departamento}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  Cargando departamentos...
                </MenuItem>
              )}
              <MenuItem value="otro">Otro departamento</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Área"
            name="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="Especifique el área"
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CorporateFare color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {renderCustomDepartamento()}
      </Grid>

      {renderAdditionalFields()}
    </Box>
  );

  const renderAdditionalFields = () => {
    if (formData.TipoUsuario === 'auditor') {
      return (
        <Box sx={styles.additionalFields}>
          <Typography variant="h5" sx={{ ...styles.sectionTitle, justifyContent: 'center' }}>
            <TrendingUp sx={{ fontSize: 28 }} />
            Información Profesional del Auditor
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Ingreso"
                name="FechaIngreso"
                type="date"
                value={formData.FechaIngreso}
                onChange={handleChange}
                required
                sx={styles.inputField}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={styles.selectField}>
                <InputLabel>Escolaridad</InputLabel>
                <Select
                  name="Escolaridad"
                  value={formData.Escolaridad}
                  onChange={handleChange}
                  label="Escolaridad"
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <School color="primary" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="TSU">TSU</MenuItem>
                  <MenuItem value="Profesional">Profesional</MenuItem>
                  <MenuItem value="Preparatoria">Preparatoria</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Carrera"
                name="Carrera"
                value={formData.Carrera}
                onChange={handleChange}
                required
                sx={styles.inputField}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Años de Experiencia"
                name="AñosExperiencia"
                type="number"
                value={formData.AñosExperiencia}
                onChange={handleChange}
                required
                sx={styles.inputField}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Work color="primary" />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      );
    }
    return null;
  };

  const renderCustomDepartamento = () => {
    if (formData.Departamento === 'otro') {
      return (
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Especificar Departamento"
            name="customDepartamento"
            value={formData.customDepartamento}
            onChange={handleChange}
            required
            sx={styles.inputField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      );
    }
    return null;
  };

  const handleCloseModal = () => {
    setError('');
    setSuccess(false);
    setActiveStep(0);
    handleClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderUserTypeSelection();
      case 1:
        return renderBasicInfo();
      case 2:
        return renderSecurity();
      case 3:
        return renderLocation();
      default:
        return renderUserTypeSelection();
    }
  };

  return (
    <Dialog
      open={show}
      onClose={handleCloseModal}
      maxWidth={false}
      PaperProps={{ sx: styles.modalPaper }}
      BackdropProps={{ sx: styles.modalContainer }}
      TransitionComponent={Slide}
      transitionDuration={500}
    >
      {loading && (
        <Box sx={styles.loadingOverlay}>
          <Fade in={loading} timeout={500}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={70} thickness={4} sx={{ color: 'primary.main', mb: 3 }} />
              <Typography variant="h5" color="primary.main" fontWeight={700}>
                Registrando Usuario...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Por favor espere un momento
              </Typography>
            </Box>
          </Fade>
        </Box>
      )}

      {success && (
        <Box sx={styles.loadingOverlay}>
          <Fade in={success} timeout={500}>
            <Box sx={styles.successAnimation}>
              <CheckCircle sx={{ fontSize: 80, mb: 3 }} />
              <Typography variant="h4" color="success.main" fontWeight={800} gutterBottom>
                ¡Usuario Registrado Exitosamente!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Redirigiendo al sistema...
              </Typography>
            </Box>
          </Fade>
        </Box>
      )}

      <DialogTitle sx={styles.modalHeader}>
        <Box sx={styles.modalTitle}>
          <PersonAdd sx={{ fontSize: 40 }} />
          Registro de Usuario
        </Box>
        <Typography variant="h6" sx={styles.modalSubtitle}>
          Complete la información para registrar un nuevo usuario en el sistema
        </Typography>
        <IconButton onClick={handleCloseModal} sx={styles.closeButton}>
          <Close />
        </IconButton>
      </DialogTitle>

      <Box sx={styles.stepperContainer}>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          connector={<StepConnector sx={styles.stepConnector} />}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel 
                StepIconProps={{ sx: styles.stepIcon }}
                sx={{ '& .MuiStepLabel-label': { fontWeight: 600, fontSize: '0.9rem' } }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={styles.formContainer}>
        <Fade in={!loading && !success} timeout={600}>
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 4, 
                  borderRadius: 3,
                  fontSize: '1rem',
                  '& .MuiAlert-message': { fontWeight: 600 }
                }}
              >
                {error}
              </Alert>
            )}

            {renderStepContent()}
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={styles.modalActions}>
        <Button
          onClick={activeStep === 0 ? handleCloseModal : handleBack}
          sx={styles.cancelButton}
          disabled={loading || success}
        >
          {activeStep === 0 ? 'Cancelar' : 'Atrás'}
        </Button>
        
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            sx={styles.submitButton}
            disabled={loading || success}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={handleSubmit}
            sx={styles.submitButton}
            disabled={loading || success}
            startIcon={<CheckCircle />}
          >
            {loading ? 'Registrando...' : 'Completar Registro'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProfessionalUserModal;