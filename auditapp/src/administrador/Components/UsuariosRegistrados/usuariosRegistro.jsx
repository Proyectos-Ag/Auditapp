import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Chip,
  Paper,
  Collapse,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';

// Importar iconos
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  BusinessCenter as BusinessCenterIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarTodayIcon,
  Grading as GradingIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Key as KeyIcon
} from '@mui/icons-material';

import RegistroUsuarioModal from './RegistroUsuarioModal';
import CalificacionModal from './CalificacionModal';

// Estilos personalizados
const styles = {
  container: {
    padding: 3,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 4,
    alignItems: 'center',
    marginBottom: 3,
  },
  filtersContainer: {
    display: 'flex',
    gap: 2,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 3,
  },
  userCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    },
  },
  avatar: {
    width: 56,
    height: 56,
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  },
  chip: {
    margin: 0.5,
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 1,
  },
  infoIcon: {
    marginRight: 1,
    fontSize: '1rem',
  },
  detailsContainer: {
    marginTop: 2,
  },
  calificacionesItem: {
    padding: 1,
    marginTop: 1,
    borderRadius: 1,
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  calificacionesList: {
    maxHeight: '200px',
    overflow: 'auto',
    marginTop: 1,
    padding: 1,
    backgroundColor: alpha('#fff', 0.05),
    borderRadius: 1,
  },
  addButton: {
    margin: 1,
  },
  userTypeChip: (theme, type) => {
     const colorMap = {
    auditor: 'primary',
    auditado: 'secondary',
    Administrador: 'success',
    empleado: 'info'
  };
  
    let color = 'default';
    switch (type) {
      case 'auditor':
        color = 'primary';
        break;
      case 'auditado':
        color = 'secondary';
        break;
      case 'Administrador':
        color = 'success';
        break;
      case 'empleado':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    return {
      backgroundColor: alpha(theme.palette[color].main, 0.1),
      color: theme.palette[color].main,
      fontWeight: 'bold',
      border: `1px solid ${theme.palette[color].main}`,
    };
  },
  promedioBadge: (theme, promedio) => {
    let color = 'error';
    if (promedio >= 80) {
      color = 'success';
    } else if (promedio >= 60) {
      color = 'warning';
    }
    return {
      backgroundColor: alpha(theme.palette[color].main, 0.1),
      color: theme.palette[color].main,
      fontWeight: 'bold',
      padding: '4px 8px',
      borderRadius: '12px',
      display: 'inline-flex',
      alignItems: 'center',
    };
  },
  inocuidadIcon: {
    marginLeft: 1,
  },
  calificacionItem: {
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
    margin: '4px 0',
    borderRadius: '4px',
    padding: '4px 8px',
  },
  statChip: {
    margin: '4px',
  },
  filterFormControl: {
    minWidth: 120,
  },
  filterContainer: {
    padding: 2,
    marginBottom: 3,
  },
};

const UsuariosRegistro = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  
  // Estados para el modal de edición
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    Nombre: '',
    Correo: '',
    PromedioEvaluacion: '',
    Puesto: '',
    FechaIngreso: '',
    Escolaridad: '',
    Departamento: '',
    Carrera: '',
    AñosExperiencia: '',
    FormaParteEquipoInocuidad: false,
    PuntuacionEspecialidad: '',
    area: '',
    calificaciones: []
  });
  const [editFormError, setEditFormError] = useState('');
  
  // Estados para el modal de contraseña
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  // Estados para filtros
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState('');
  const [filtroInocuidad, setFiltroInocuidad] = useState('');
  const [filtroAprobado, setFiltroAprobado] = useState('');
  const [filtroEscolaridad, setFiltroEscolaridad] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
        setUsers(response.data);
      } catch (error) {
        setError('Error al obtener los usuarios');
        console.error('Error al obtener los usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateYearsInCompany = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    
    const ingresoDate = new Date(fechaIngreso);
    const currentDate = new Date();
    let yearsInCompany = currentDate.getFullYear() - ingresoDate.getFullYear();
    let monthsDifference = currentDate.getMonth() - ingresoDate.getMonth();

    if (monthsDifference < 0 || (monthsDifference === 0 && currentDate.getDate() < ingresoDate.getDate())) {
      yearsInCompany--;
    }

    return yearsInCompany;
  };

  const handlePasswordChange = (userId) => {
    setUsuarioAEditar(users.find(user => user._id === userId));
    setPasswordFormData({ password: '', confirmPassword: '' });
    setPasswordError('');
    setOpenPasswordModal(true);
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (passwordFormData.password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/usuarios/cambiarPassword/${usuarioAEditar._id}`, {
        password: passwordFormData.password
      });
      setOpenPasswordModal(false);
      setPasswordFormData({ password: '', confirmPassword: '' });
      alert('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setPasswordError('Error al cambiar la contraseña');
    }
  };

  const handleEditClick = (usuario) => {
    const formattedFechaIngreso = usuario.FechaIngreso ? new Date(usuario.FechaIngreso).toISOString().split('T')[0] : '';
    setUsuarioAEditar(usuario);
    setEditFormData({
      Nombre: usuario.Nombre || '',
      Correo: usuario.Correo || '',
      PromedioEvaluacion: usuario.PromedioEvaluacion || '',
      Puesto: usuario.Puesto || '',
      FechaIngreso: formattedFechaIngreso,
      Escolaridad: usuario.Escolaridad || '',
      Carrera: usuario.Carrera || '',
      Departamento: usuario.Departamento || '',
      AñosExperiencia: usuario.AñosExperiencia || '',
      FormaParteEquipoInocuidad: usuario.FormaParteEquipoInocuidad || false,
      PuntuacionEspecialidad: usuario.PuntuacionEspecialidad || '',
      area: usuario.area || '',
      calificaciones: usuario.calificaciones || []
    });
    setOpenEditModal(true);
  };

  const handleAgregarCalificaciones = (usuario) => {
    setUsuarioAEditar(usuario);
    setShowCalificacionModal(true);
  };

  const handleGuardarCalificaciones = (calificaciones) => {
    if (!usuarioAEditar || !calificaciones || calificaciones.length === 0) {
      console.error("Usuario o calificaciones inválidas");
      return;
    }

    const updatedUser = {
      ...usuarioAEditar,
      calificaciones: [...usuarioAEditar.calificaciones, ...calificaciones]
    };

    axios.put(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${usuarioAEditar._id}`, updatedUser)
      .then(response => {
        setUsers(users.map(user => (user._id === usuarioAEditar._id ? response.data : user)));
        setUsuarioAEditar(null);
        setShowCalificacionModal(false);
      })
      .catch(error => {
        console.error('Error al actualizar las calificaciones:', error);
      });
  };

  const handleEditFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    setEditFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (editFormData.FechaIngreso) {
      const fechaIngresoDate = new Date(editFormData.FechaIngreso);
      const currentDate = new Date();

      if (fechaIngresoDate > currentDate) {
        setEditFormError('La fecha de ingreso no puede ser mayor a la fecha actual.');
        return;
      }
    }
    
    setEditFormError('');

    try {
      const updatedFormData = { ...editFormData };
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/usuarios/${usuarioAEditar._id}`, 
        updatedFormData
      );
      setUsers(users.map(user => (user._id === usuarioAEditar._id ? response.data : user)));
      setOpenEditModal(false);
      setUsuarioAEditar(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
    }
  };

  const handleDeleteClick = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
      }
    }
  };

  const handleDegradarClick = async (userId) => {
    try {
      const userToDegradar = users.find(user => user._id === userId);
      if (userToDegradar && userToDegradar.PromedioEvaluacion < 80) {
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/usuarios/${userId}`, 
          { TipoUsuario: 'auditado' }
        );
        setUsers(users.map(user => (user._id === userId ? response.data : user)));
        alert('Usuario degradado a auditado exitosamente');
      } else {
        alert('El usuario no puede ser degradado porque su promedio de evaluación es mayor o igual a 80');
      }
    } catch (error) {
      console.error('Error al degradar el usuario:', error);
    }
  };

  const handlePromocionarClick = async (userId) => {
    try {
      const userToPromote = users.find(user => user._id === userId);
      if (userToPromote && userToPromote.PromedioEvaluacion >= 80) {
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/usuarios/${userId}`, 
          { TipoUsuario: 'auditor' }
        );
        setUsers(users.map(user => (user._id === userId ? response.data : user)));
        alert('Usuario promovido a auditor exitosamente');
      } else {
        alert('El usuario no puede ser promovido a auditor porque su promedio de evaluación es menor a 80');
      }
    } catch (error) {
      console.error('Error al promover el usuario:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    return (
      (filtroTipoUsuario === '' || user.TipoUsuario === filtroTipoUsuario) &&
      (filtroInocuidad === '' || user.FormaParteEquipoInocuidad?.toString() === filtroInocuidad) &&
      (filtroAprobado === '' || user.Aprobado?.toString() === filtroAprobado) &&
      (filtroEscolaridad === '' || user.Escolaridad === filtroEscolaridad)
    );
  });

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',marginTop:4, height: '100vh' }}>
      <Typography variant="h5">Cargando usuarios...</Typography>
    </Box>
  );
  
  if (error) return (
    <Box sx={{ display: 'flex', justifyContent: 'center',marginTop: 4, alignItems: 'center', height: '100vh' }}>
      <Typography variant="h5" color="error">{error}</Typography>
    </Box>
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Usuarios
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setShowRegistrationForm(true)}
        >
          Agregar Usuario
        </Button>
      </Box>

      <Paper sx={styles.filterContainer} elevation={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" sx={styles.filterFormControl}>
              <InputLabel>Tipo de Usuario</InputLabel>
              <Select
                value={filtroTipoUsuario}
                onChange={(e) => setFiltroTipoUsuario(e.target.value)}
                label="Tipo de Usuario"
              >
                <MenuItem value="">Todos los tipos</MenuItem>
                <MenuItem value="auditado">Auditado</MenuItem>
                <MenuItem value="auditor">Auditor</MenuItem>
                <MenuItem value="Administrador">Administrador</MenuItem>
                <MenuItem value="empleado">Empleado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" sx={styles.filterFormControl}>
              <InputLabel>Escolaridad</InputLabel>
              <Select
                value={filtroEscolaridad}
                onChange={(e) => setFiltroEscolaridad(e.target.value)}
                label="Escolaridad"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="TSU">TSU</MenuItem>
                <MenuItem value="Profesional">Profesional</MenuItem>
                <MenuItem value="Preparatoria">Preparatoria</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" sx={styles.filterFormControl}>
              <InputLabel>Equipo de Inocuidad</InputLabel>
              <Select
                value={filtroInocuidad}
                onChange={(e) => setFiltroInocuidad(e.target.value)}
                label="Equipo de Inocuidad"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Sí</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" sx={styles.filterFormControl}>
              <InputLabel>Aprobado</InputLabel>
              <Select
                value={filtroAprobado}
                onChange={(e) => setFiltroAprobado(e.target.value)}
                label="Aprobado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Sí</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={styles.cardGrid}>
        {filteredUsers.map(user => (
          <UserCard
            key={user._id}
            user={user}
            formatDate={formatDate}
            calculateYearsInCompany={calculateYearsInCompany}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onDegradarClick={handleDegradarClick}
            onPromocionarClick={handlePromocionarClick}
            onAgregarCalificaciones={() => handleAgregarCalificaciones(user)}
            onPasswordChange={handlePasswordChange}
            theme={theme}
          />
        ))}
      </Box>

      {/* Modales */}
      <RegistroUsuarioModal
        show={showRegistrationForm}
        handleClose={() => setShowRegistrationForm(false)}
      />

      <CalificacionModal
        show={showCalificacionModal}
        handleClose={() => setShowCalificacionModal(false)}
        onSubmit={handleGuardarCalificaciones}
        usuario={usuarioAEditar}
      />

      {/* Modal de Edición */}
      <Dialog 
        open={openEditModal} 
        onClose={() => setOpenEditModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Editar Usuario: {usuarioAEditar?.Nombre}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleEditSubmit} style={styles.modalForm}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="Nombre"
                  value={editFormData.Nombre}
                  onChange={handleEditFormChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo"
                  name="Correo"
                  type="email"
                  value={editFormData.Correo}
                  onChange={handleEditFormChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Puesto"
                  name="Puesto"
                  value={editFormData.Puesto}
                  onChange={handleEditFormChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    name="Departamento"
                    value={editFormData.Departamento}
                    onChange={handleEditFormChange}
                    label="Departamento"
                  >
                    <MenuItem value="">Selecciona el departamento</MenuItem>
                    <MenuItem value="Administración">Administración</MenuItem>
                    <MenuItem value="Aseguramiento de calidad">Aseguramiento de calidad</MenuItem>
                    <MenuItem value="Gestión para la calidad">Gestión para la calidad</MenuItem>
                    <MenuItem value="Gestión para la productividad">Gestión para la productividad</MenuItem>
                    <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                    <MenuItem value="Ingeniería">Ingeniería</MenuItem>
                    <MenuItem value="Planeación y Logística">Planeación y Logística</MenuItem>
                    <MenuItem value="Producción">Producción</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Área"
                  name="area"
                  value={editFormData.area}
                  onChange={handleEditFormChange}
                  variant="outlined"
                  required
                />
              </Grid>

              {(usuarioAEditar?.TipoUsuario === 'auditor' || usuarioAEditar?.TipoUsuario === 'Administrador' || usuarioAEditar?.TipoUsuario === 'auditado') && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de Ingreso"
                      name="FechaIngreso"
                      type="date"
                      value={editFormData.FechaIngreso}
                      onChange={handleEditFormChange}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Promedio de Evaluación"
                      name="PromedioEvaluacion"
                      type="number"
                      value={editFormData.PromedioEvaluacion}
                      onChange={handleEditFormChange}
                      variant="outlined"
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Escolaridad</InputLabel>
                      <Select
                        name="Escolaridad"
                        value={editFormData.Escolaridad}
                        onChange={handleEditFormChange}
                        label="Escolaridad"
                        required
                      >
                        <MenuItem value="">Seleccione una opción</MenuItem>
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
                      value={editFormData.Carrera}
                      onChange={handleEditFormChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Años de Experiencia"
                      name="AñosExperiencia"
                      type="number"
                      value={editFormData.AñosExperiencia}
                      onChange={handleEditFormChange}
                      variant="outlined"
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Puntuación Especialidad"
                      name="PuntuacionEspecialidad"
                      type="number"
                      value={editFormData.PuntuacionEspecialidad}
                      onChange={handleEditFormChange}
                      variant="outlined"
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editFormData.FormaParteEquipoInocuidad}
                          onChange={handleEditFormChange}
                          name="FormaParteEquipoInocuidad"
                          color="primary"
                        />
                      }
                      label="Forma parte del equipo de Inocuidad"
                    />
                  </Grid>
                </>
              )}
            </Grid>
            {editFormError && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {editFormError}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleEditSubmit} color="primary" variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cambio de Contraseña */}
      <Dialog
        open={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
      >
        <DialogTitle>
          Cambiar Contraseña
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingrese la nueva contraseña para el usuario {usuarioAEditar?.Nombre}
          </DialogContentText>
          <form onSubmit={handlePasswordSubmit} style={styles.modalForm}>
            <TextField
              fullWidth
              margin="dense"
              label="Nueva Contraseña"
              type="password"
              name="password"
              value={passwordFormData.password}
              onChange={handlePasswordFormChange}
              variant="outlined"
            />
            <TextField
              fullWidth
              margin="dense"
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={passwordFormData.confirmPassword}
              onChange={handlePasswordFormChange}
              variant="outlined"
            />
            {passwordError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {passwordError}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handlePasswordSubmit} color="primary" variant="contained">
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const UserCard = ({ 
  user, 
  formatDate, 
  calculateYearsInCompany, 
  onEditClick, 
  onDeleteClick, 
  onDegradarClick, 
  onPromocionarClick, 
  onAgregarCalificaciones, 
  onPasswordChange,
  theme 
}) => {
  const [showCalificaciones, setShowCalificaciones] = useState(false);
  const [showDetallesAuditor, setShowDetallesAuditor] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleCalificaciones = () => {
    setShowCalificaciones(!showCalificaciones);
  };

  const handleToggleDetallesAuditor = () => {
    setShowDetallesAuditor(!showDetallesAuditor);
  };

  // Determinar si el usuario es auditor/administrador/empleado y tiene información adicional
  const tieneInfoAdicional = ['auditor', 'Administrador', 'empleado'].includes(user.TipoUsuario);

  return (
    <Card sx={styles.userCard}>
      <CardHeader
        avatar={
          <Avatar sx={styles.avatar}>
            {user.Nombre ? user.Nombre.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        }
        action={
          <IconButton aria-label="settings" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        }
        title={user.Nombre}
        subheader={
          <Chip 
            label={user.TipoUsuario} 
            sx={{
              backgroundColor: user.TipoUsuario === 'auditor' ? 'rgba(25, 118, 210, 0.1)' :
                            user.TipoUsuario === 'auditado' ? 'rgba(156, 39, 176, 0.1)' :
                            user.TipoUsuario === 'Administrador' ? 'rgba(46, 125, 50, 0.1)' :
                            user.TipoUsuario === 'empleado' ? 'rgba(2, 136, 209, 0.1)' : '#f5f5f5',
              color: user.TipoUsuario === 'auditor' ? '#1976d2' :
                  user.TipoUsuario === 'auditado' ? '#9c27b0' :
                  user.TipoUsuario === 'Administrador' ? '#2e7d32' :
                  user.TipoUsuario === 'empleado' ? '#0288d1' : '#000',
              fontWeight: 'bold',
              border: `1px solid ${
                user.TipoUsuario === 'auditor' ? '#1976d2' :
                user.TipoUsuario === 'auditado' ? '#9c27b0' :
                user.TipoUsuario === 'Administrador' ? '#2e7d32' :
                user.TipoUsuario === 'empleado' ? '#0288d1' : '#ddd'
              }`
            }} 
            size="small"
          />
        }
      />
      
      <CardContent>
        <Box sx={styles.infoItem}>
          <EmailIcon sx={styles.infoIcon} />
          <Typography variant="body2" sx={{overflowWrap: 'break-word'}}>
            {user.Correo}
          </Typography>
        </Box>
        
        <Box sx={styles.infoItem}>
          <WorkIcon sx={styles.infoIcon} />
          <Typography variant="body2">{user.Puesto}</Typography>
        </Box>
        
        <Box sx={styles.infoItem}>
          <BusinessCenterIcon sx={styles.infoIcon} />
          <Typography variant="body2">{user.Departamento}</Typography>
        </Box>
        
        <Box sx={styles.infoItem}>
          <BadgeIcon sx={styles.infoIcon} />
          <Typography variant="body2">{user.area}</Typography>
        </Box>

        {tieneInfoAdicional && (
          <>
            {user.FechaIngreso && (
              <Box sx={styles.infoItem}>
                <CalendarTodayIcon sx={styles.infoIcon} />
                <Typography variant="body2">
                  Fecha de Ingreso: {formatDate(user.FechaIngreso)}
                </Typography>
              </Box>
            )}
            
            {/* Botón para mostrar/ocultar detalles adicionales */}
            <Button 
              size="small" 
              startIcon={showDetallesAuditor ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={handleToggleDetallesAuditor}
              sx={{ 
                mt: 1,
                color: theme.palette.primary.main,
                textTransform: 'none',
                justifyContent: 'flex-start',
                pl: 0
              }}
            >
              {showDetallesAuditor ? 'Ocultar detalles' : 'Mostrar más detalles'}
            </Button>
            
            {/* Detalles adicionales que se muestran/ocultan */}
            <Collapse in={showDetallesAuditor} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1 }}>
                <Box sx={styles.infoItem}>
                  <StarIcon sx={styles.infoIcon} />
                  <Typography variant="body2">
                    Años en la Empresa: {calculateYearsInCompany(user.FechaIngreso)}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <SchoolIcon sx={styles.infoIcon} />
                  <Typography variant="body2">
                    Escolaridad: {user.Escolaridad}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <AssignmentIcon sx={styles.infoIcon} />
                  <Typography variant="body2">
                    Carrera: {user.Carrera}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <GradingIcon sx={styles.infoIcon} />
                  <Typography variant="body2">
                    Años de Experiencia: {user.AñosExperiencia}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <SecurityIcon sx={styles.infoIcon} />
                  <Typography variant="body2">
                    Puntuación Especialidad: {user.PuntuacionEspecialidad}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  {user.FormaParteEquipoInocuidad ? (
                    <CheckIcon color="success" sx={styles.infoIcon} />
                  ) : (
                    <CloseIcon color="error" sx={styles.infoIcon} />
                  )}
                  <Typography variant="body2">
                    Equipo de Inocuidad: {user.FormaParteEquipoInocuidad ? 'Sí' : 'No'}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  {user.Aprobado ? (
                    <CheckIcon color="success" sx={styles.infoIcon} />
                  ) : (
                    <CloseIcon color="error" sx={styles.infoIcon} />
                  )}
                  <Typography variant="body2">
                    Aprobado: {user.Aprobado ? 'Sí' : 'No'}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <StarIcon sx={styles.infoIcon} />
                  <Typography variant="body2">
                    Promedio: {user.PromedioEvaluacion}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>

      {/* Resto del componente UserCard sin cambios */}
      <CardActions sx={{ flexDirection: 'column', padding: 1, gap: 1 }}>
        {/* Primera fila con botones de acción principales */}
        <Box sx={{ 
          display: 'flex', 
          width: '100%', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap',
          gap: 1
        }}>
         
          <Button 
            variant="contained"
            size="small" 
            startIcon={<GradingIcon />} 
            onClick={() => onAgregarCalificaciones(user)}
            sx={{ 
              bgcolor: '#2e7d32', 
              color: 'white',
              '&:hover': { bgcolor: '#2e7d32' },
              flex: '1'
            }}
          >
            CALIFICACIONES
          </Button>
        </Box>
        
        {/* Botones condicionales de Promover/Degradar (se mostrarán en la misma línea si aparecen) */}
        {(user.TipoUsuario === 'auditado' && user.PromedioEvaluacion >= 80) || 
         (user.TipoUsuario === 'auditor' && user.PromedioEvaluacion < 80) ? (
          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
            {user.TipoUsuario === 'auditado' && user.PromedioEvaluacion >= 80 && (
              <Button 
                variant="contained"
                size="small" 
                startIcon={<ArrowUpwardIcon />} 
                onClick={() => onPromocionarClick(user._id)}
                sx={{ 
                  bgcolor: '#2e7d32', 
                  color: 'white',
                  '&:hover': { bgcolor: '#2e7d32' },
                  flex: '1'
                }}
              >
                PROMOVER
              </Button>
            )}
            
            {user.TipoUsuario === 'auditor' && user.PromedioEvaluacion < 80 && (
              <Button 
                variant="contained"
                size="small" 
                startIcon={<ArrowDownwardIcon />} 
                onClick={() => onDegradarClick(user._id)}
                sx={{ 
                  bgcolor: '#ed6c02', 
                  color: 'white',
                  '&:hover': { bgcolor: '#e65100' },
                  flex: '1'
                }}
              >
                DEGRADAR
              </Button>
            )}
          </Box>
        ) : null}
        
        {/* Botón Ver Calificaciones en una fila separada */}
        <Button 
          variant="outlined"
          size="small" 
          fullWidth
          startIcon={showCalificaciones ? <ExpandLessIcon /> : <ExpandMoreIcon />} 
          onClick={handleToggleCalificaciones}
          sx={{ 
            borderColor: '#0288d1', 
            color: '#0288d1',
            textTransform: 'uppercase',
            '&:hover': { 
              bgcolor: 'rgba(2, 136, 209, 0.04)',
              borderColor: '#01579b'
            }
          }}
        >
          {showCalificaciones ? 'OCULTAR' : 'VER'} CALIFICACIONES
        </Button>
      </CardActions>
      <Collapse in={showCalificaciones} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calificaciones
          </Typography>
          <List>
            {user.calificaciones.map((calificacion, index) => (
              <ListItem key={index} sx={styles.calificacionItem}>
                <ListItemText 
                  primary={calificacion.nombreCurso} 
                  secondary={`Calificación: ${calificacion.calificacion}`} 
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Collapse>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEditClick(user); handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={() => { onDeleteClick(user._id); handleMenuClose(); }}>
          <DeleteIcon sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
        <MenuItem onClick={() => { onPasswordChange(user._id); handleMenuClose(); }}>
          <KeyIcon sx={{ mr: 1 }} /> Cambiar Contraseña
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default UsuariosRegistro;