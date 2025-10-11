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
  Chip,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
  Container,
  Fade,
  Zoom,
  Slide,
  Divider,
  Badge,
  Tooltip,
  CardMedia,
  LinearProgress,
  useMediaQuery
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
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  BusinessCenter as BusinessCenterIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarTodayIcon,
  Grading as GradingIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  CorporateFare as CorporateFareIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  VerifiedUser as VerifiedUserIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  AutoAwesome as AutoAwesomeIcon,
  WorkspacePremium as WorkspacePremiumIcon
} from '@mui/icons-material';

import RegistroUsuarioModal from './RegistroUsuarioModal';
import CalificacionModal from './CalificacionModal';

// Estilos personalizados mejorados
const styles = {
  container: {
    padding: { xs: 2, md: 4 },
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    padding: { xs: 2, md: 3 },
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 4,
    color: 'white',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    }
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
  filtersContainer: {
    padding: 3,
    marginBottom: 4,
    background: 'white',
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)'
    },
    gap: 3,
  },
  userCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: `
      0 4px 20px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.6)
    `,
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 3s ease-in-out infinite',
    },
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: `
        0 20px 40px rgba(0,0,0,0.15),
        0 8px 16px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.8)
      `,
    },
  },
  avatarContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  avatar: {
    width: 70,
    height: 70,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '3px solid white',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    },
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  chip: {
    margin: 0.5,
    fontWeight: 600,
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 1.5,
    padding: '8px 12px',
    borderRadius: 2,
    background: 'rgba(255,255,255,0.5)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.8)',
      transform: 'translateX(4px)',
    },
  },
  infoIcon: {
    marginRight: 2,
    fontSize: '1.2rem',
    color: '#667eea',
  },
  detailsContainer: {
    marginTop: 2,
    padding: 2,
    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
    borderRadius: 2,
    border: '1px solid rgba(102,126,234,0.1)',
  },
  calificacionesItem: {
    padding: 2,
    marginTop: 1,
    borderRadius: 2,
    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
    border: '1px solid rgba(102,126,234,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  calificacionesList: {
    maxHeight: '300px',
    overflow: 'auto',
    marginTop: 2,
    padding: 2,
    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
    borderRadius: 2,
    border: '1px solid rgba(102,126,234,0.1)',
  },
  addButton: {
    margin: 1,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: 3,
    padding: '12px 24px',
    boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    },
  },
  userTypeChip: (theme, type) => {
    const colors = {
      auditor: { main: '#1976d2', light: 'rgba(25, 118, 210, 0.1)' },
      auditado: { main: '#9c27b0', light: 'rgba(156, 39, 176, 0.1)' },
      Administrador: { main: '#2e7d32', light: 'rgba(46, 125, 50, 0.1)' },
      empleado: { main: '#ed6c02', light: 'rgba(237, 108, 2, 0.1)' }
    };
    
    const color = colors[type] || { main: '#6b7280', light: 'rgba(107, 114, 128, 0.1)' };
    
    return {
      background: `linear-gradient(135deg, ${color.light} 0%, ${alpha(color.main, 0.2)} 100%)`,
      color: color.main,
      fontWeight: 700,
      borderRadius: 3,
      border: `2px solid ${alpha(color.main, 0.3)}`,
      padding: '6px 12px',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backdropFilter: 'blur(10px)',
    };
  },
  promedioBadge: (theme, promedio) => {
    let color = '#f44336';
    if (promedio >= 80) color = '#4caf50';
    else if (promedio >= 60) color = '#ff9800';
    
    return {
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.2)} 100%)`,
      color: color,
      fontWeight: 700,
      padding: '8px 16px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      border: `2px solid ${alpha(color, 0.3)}`,
      backdropFilter: 'blur(10px)',
    };
  },
  inocuidadIcon: {
    marginLeft: 1,
    color: '#4caf50',
  },
  calificacionItem: {
    background: 'linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.08) 100%)',
    margin: '8px 0',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid rgba(102,126,234,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(4px)',
      background: 'linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.12) 100%)',
    },
  },
  statChip: {
    margin: '6px',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
    border: '1px solid rgba(102,126,234,0.2)',
    fontWeight: 600,
  },
  filterFormControl: {
    minWidth: 140,
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(10px)',
    },
  },
  filterContainer: {
    padding: 3,
    marginBottom: 4,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.9) 100%)',
    borderRadius: 3,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    backdropFilter: 'blur(20px)',
  },
  actionButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: 3,
    padding: '10px 20px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
    },
  },
  secondaryButton: {
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
    color: '#667eea',
    fontWeight: 600,
    borderRadius: 3,
    border: '2px solid rgba(102,126,234,0.3)',
    padding: '10px 20px',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)',
      transform: 'translateY(-2px)',
    },
  },
  statsContainer: {
    display: 'flex',
    gap: 2,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    padding: 2,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.9) 100%)',
    borderRadius: 3,
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
  },
};

// Animación CSS para el shimmer effect
const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const UsuariosRegistro = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  // Estadísticas
  const stats = {
    total: users.length,
    auditores: users.filter(u => u.TipoUsuario === 'auditor').length,
    auditados: users.filter(u => u.TipoUsuario === 'auditado').length,
    administradores: users.filter(u => u.TipoUsuario === 'Administrador').length,
    inocuidad: users.filter(u => u.FormaParteEquipoInocuidad).length,
  };

  if (loading) return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Box sx={{ textAlign: 'center' }}>
        <AutoAwesomeIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
        <Typography variant="h5" color="#667eea" fontWeight="600">
          Cargando usuarios...
        </Typography>
        <LinearProgress sx={{ mt: 2, height: 6, borderRadius: 3, background: 'rgba(102,126,234,0.2)' }} />
      </Box>
    </Box>
  );
  
  if (error) return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Typography variant="h5" color="error" fontWeight="6000">
        {error}
      </Typography>
    </Box>
  );

  return (
    <Box sx={styles.container}>
      <style>{shimmerAnimation}</style>
      
      {/* Header Mejorado */}
      <Slide direction="down" in={true} timeout={800}>
        <Box sx={styles.header}>
          <Box sx={styles.headerContent}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h3" component="h1" fontWeight="800" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  Gestión de Usuarios
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
                  Administra y supervisa el equipo de trabajo
                </Typography>
              </Box>
              <Zoom in={true} timeout={1000}>
                <Button 
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowRegistrationForm(true)}
                  sx={styles.addButton}
                  size="large"
                >
                  Nuevo Usuario
                </Button>
              </Zoom>
            </Box>
          </Box>
        </Box>
      </Slide>

      {/* Estadísticas */}
      <Fade in={true} timeout={1200}>
        <Box sx={styles.statsContainer}>
          <Paper sx={styles.statCard}>
            <GroupIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
            <Typography variant="h4" fontWeight="700" color="#667eea">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Usuarios
            </Typography>
          </Paper>
          <Paper sx={styles.statCard}>
            <VerifiedUserIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4" fontWeight="700" color="#1976d2">
              {stats.auditores}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Auditores
            </Typography>
          </Paper>
          <Paper sx={styles.statCard}>
            <PersonIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
            <Typography variant="h4" fontWeight="700" color="#9c27b0">
              {stats.auditados}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Auditados
            </Typography>
          </Paper>
          <Paper sx={styles.statCard}>
            <AdminPanelSettingsIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
            <Typography variant="h4" fontWeight="700" color="#2e7d32">
              {stats.administradores}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administradores
            </Typography>
          </Paper>
          <Paper sx={styles.statCard}>
            <SecurityIcon sx={{ fontSize: 40, color: '#ed6c02', mb: 1 }} />
            <Typography variant="h4" fontWeight="700" color="#ed6c02">
              {stats.inocuidad}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Equipo Inocuidad
            </Typography>
          </Paper>
        </Box>
      </Fade>

      {/* Filtros Mejorados */}
      <Fade in={true} timeout={1400}>
        <Paper sx={styles.filterContainer}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ mr: 1, color: '#667eea' }} />
            <Typography variant="h6" fontWeight="600" color="#667eea">
              Filtros Avanzados
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="medium" sx={styles.filterFormControl}>
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
              <FormControl fullWidth variant="outlined" size="medium" sx={styles.filterFormControl}>
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
              <FormControl fullWidth variant="outlined" size="medium" sx={styles.filterFormControl}>
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
              <FormControl fullWidth variant="outlined" size="medium" sx={styles.filterFormControl}>
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
      </Fade>

      {/* Grid de Usuarios */}
      <Box sx={styles.cardGrid}>
        {filteredUsers.map((user, index) => (
          <Zoom in={true} timeout={800 + index * 100} key={user._id}>
            <div>
              <UserCard
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
            </div>
          </Zoom>
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            Editar Usuario: {usuarioAEditar?.Nombre}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <form onSubmit={handleEditSubmit} style={styles.modalForm}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="Nombre"
                  value={editFormData.Nombre}
                  onChange={handleEditFormChange}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
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
                  sx={{ borderRadius: 2 }}
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
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
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
                    <MenuItem value="Gestión para la Productividad / Operaciones">Gestión para la Productividad / Operaciones</MenuItem>
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
                  sx={{ borderRadius: 2 }}
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
                      sx={{ borderRadius: 2 }}
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
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
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
                      sx={{ borderRadius: 2 }}
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
                      sx={{ borderRadius: 2 }}
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
                      sx={{ borderRadius: 2 }}
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
              <Typography color="error" variant="body2" sx={{ mt: 2, p: 2, background: 'rgba(244,67,54,0.1)', borderRadius: 2 }}>
                {editFormError}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenEditModal(false)} 
            color="inherit"
            sx={styles.secondaryButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            color="primary" 
            variant="contained"
            sx={styles.actionButton}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cambio de Contraseña */}
      <Dialog
        open={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <KeyIcon sx={{ mr: 1 }} />
            Cambiar Contraseña
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <DialogContentText sx={{ mb: 3, fontSize: '1.1rem' }}>
            Ingrese la nueva contraseña para el usuario <strong>{usuarioAEditar?.Nombre}</strong>
          </DialogContentText>
          <form onSubmit={handlePasswordSubmit} style={styles.modalForm}>
            <TextField
              fullWidth
              margin="normal"
              label="Nueva Contraseña"
              type="password"
              name="password"
              value={passwordFormData.password}
              onChange={handlePasswordFormChange}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={passwordFormData.confirmPassword}
              onChange={handlePasswordFormChange}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            {passwordError && (
              <Typography color="error" variant="body2" sx={{ mt: 2, p: 2, background: 'rgba(244,67,54,0.1)', borderRadius: 2 }}>
                {passwordError}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenPasswordModal(false)} 
            color="inherit"
            sx={styles.secondaryButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePasswordSubmit} 
            color="primary" 
            variant="contained"
            sx={styles.actionButton}
          >
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

  const [openFoto, setOpenFoto] = useState(false);

  const handleAvatarClick = () => {
    if (user.Foto) {
      setOpenFoto(true);
    }
  };
  const handleClose = () => setOpenFoto(false);

  // Color del badge de estado
  const getStatusColor = () => {
    if (user.Aprobado) return '#4caf50';
    if (user.PromedioEvaluacion >= 80) return '#ff9800';
    return '#f44336';
  };

  return (
    <Card sx={styles.userCard}>
      <CardHeader
        avatar={
          <Box sx={styles.avatarContainer}>
            {user.Foto ? (
              <Avatar
                src={user.Foto}
                alt={user.Nombre}
                sx={{ ...styles.avatar, cursor: 'pointer' }}
                onClick={handleAvatarClick}
              />
            ) : (
              <Avatar sx={styles.avatar}>
                {user.Nombre ? user.Nombre.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            )}
            <Box 
              sx={{ 
                ...styles.statusBadge, 
                backgroundColor: getStatusColor() 
              }} 
            />
          </Box>
        }
        action={
          <Tooltip title="Más opciones">
            <IconButton 
              aria-label="settings" 
              onClick={handleMenuClick}
              sx={{
                background: 'rgba(102,126,234,0.1)',
                '&:hover': {
                  background: 'rgba(102,126,234,0.2)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        }
        title={
          <Typography variant="h6" fontWeight="700" color="#2d3748">
            {user.Nombre}
          </Typography>
        }
        subheader={
          <Chip 
            label={user.TipoUsuario} 
            sx={styles.userTypeChip(theme, user.TipoUsuario)}
            size="small"
          />
        }
      />

      <Dialog
        open={openFoto}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <img
            src={user.Foto}
            alt={`Foto de ${user.Nombre}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </DialogContent>
      </Dialog>
      
      <CardContent>
        <Box sx={styles.infoItem}>
          <EmailIcon sx={styles.infoIcon} />
          <Typography variant="body2" sx={{ overflowWrap: 'break-word', fontWeight: 500 }}>
            {user.Correo}
          </Typography>
        </Box>
        
        <Box sx={styles.infoItem}>
          <WorkIcon sx={styles.infoIcon} />
          <Typography variant="body2" fontWeight="500">{user.Puesto}</Typography>
        </Box>
        
        <Box sx={styles.infoItem}>
          <BusinessCenterIcon sx={styles.infoIcon} />
          <Typography variant="body2" fontWeight="500">{user.Departamento}</Typography>
        </Box>
        
        <Box sx={styles.infoItem}>
          <BadgeIcon sx={styles.infoIcon} />
          <Typography variant="body2" fontWeight="500">{user.area}</Typography>
        </Box>

        {tieneInfoAdicional && (
          <>
            {user.FechaIngreso && (
              <Box sx={styles.infoItem}>
                <CalendarTodayIcon sx={styles.infoIcon} />
                <Typography variant="body2" fontWeight="500">
                  Ingreso: {formatDate(user.FechaIngreso)}
                </Typography>
              </Box>
            )}
            
            {/* Botón para mostrar/ocultar detalles adicionales */}
            <Button 
              size="small" 
              startIcon={showDetallesAuditor ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={handleToggleDetallesAuditor}
              sx={{ 
                mt: 2,
                color: '#667eea',
                textTransform: 'none',
                justifyContent: 'flex-start',
                pl: 0,
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(102,126,234,0.1)',
                }
              }}
            >
              {showDetallesAuditor ? 'Ocultar detalles' : 'Mostrar más detalles'}
            </Button>
            
            {/* Detalles adicionales que se muestran/ocultan */}
            <Collapse in={showDetallesAuditor} timeout="auto" unmountOnExit>
              <Box sx={styles.detailsContainer}>
                <Box sx={styles.infoItem}>
                  <TrendingUpIcon sx={styles.infoIcon} />
                  <Typography variant="body2" fontWeight="500">
                    Años en la Empresa: {calculateYearsInCompany(user.FechaIngreso)}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <SchoolIcon sx={styles.infoIcon} />
                  <Typography variant="body2" fontWeight="500">
                    Escolaridad: {user.Escolaridad}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <AssignmentIcon sx={styles.infoIcon} />
                  <Typography variant="body2" fontWeight="500">
                    Carrera: {user.Carrera}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <GradingIcon sx={styles.infoIcon} />
                  <Typography variant="body2" fontWeight="500">
                    Experiencia: {user.AñosExperiencia} años
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <WorkspacePremiumIcon sx={styles.infoIcon} />
                  <Typography variant="body2" fontWeight="500">
                    Especialidad: {user.PuntuacionEspecialidad}%
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  {user.FormaParteEquipoInocuidad ? (
                    <CheckIcon color="success" sx={styles.infoIcon} />
                  ) : (
                    <CloseIcon color="error" sx={styles.infoIcon} />
                  )}
                  <Typography variant="body2" fontWeight="500">
                    Equipo Inocuidad: {user.FormaParteEquipoInocuidad ? 'Sí' : 'No'}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  {user.Aprobado ? (
                    <CheckIcon color="success" sx={styles.infoIcon} />
                  ) : (
                    <CloseIcon color="error" sx={styles.infoIcon} />
                  )}
                  <Typography variant="body2" fontWeight="500">
                    Aprobado: {user.Aprobado ? 'Sí' : 'No'}
                  </Typography>
                </Box>
                
                <Box sx={styles.infoItem}>
                  <StarIcon sx={styles.infoIcon} />
                  <Typography variant="body2" fontWeight="500">
                    Promedio: {user.PromedioEvaluacion}%
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>

      <CardActions sx={{ flexDirection: 'column', padding: 3, gap: 2, mt: 'auto' }}>
        {/* Primera fila con botones de acción principales */}
        <Box sx={{ 
          display: 'flex', 
          width: '100%', 
          gap: 2
        }}>
          <Button 
            variant="contained"
            size="medium" 
            startIcon={<GradingIcon />} 
            onClick={() => onAgregarCalificaciones(user)}
            sx={styles.actionButton}
            fullWidth
          >
            CALIFICACIONES
          </Button>
        </Box>
        
        {/* Botones condicionales de Promover/Degradar */}
        {(user.TipoUsuario === 'auditado' && user.PromedioEvaluacion >= 80) || 
         (user.TipoUsuario === 'auditor' && user.PromedioEvaluacion < 80) ? (
          <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
            {user.TipoUsuario === 'auditado' && user.PromedioEvaluacion >= 80 && (
              <Button 
                variant="contained"
                size="medium" 
                startIcon={<ArrowUpwardIcon />} 
                onClick={() => onPromocionarClick(user._id)}
                sx={{
                  ...styles.actionButton,
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                  flex: 1
                }}
              >
                PROMOVER
              </Button>
            )}
            
            {user.TipoUsuario === 'auditor' && user.PromedioEvaluacion < 80 && (
              <Button 
                variant="contained"
                size="medium" 
                startIcon={<ArrowDownwardIcon />} 
                onClick={() => onDegradarClick(user._id)}
                sx={{
                  ...styles.actionButton,
                  background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
                  flex: 1
                }}
              >
                DEGRADAR
              </Button>
            )}
          </Box>
        ) : null}
        
        {/* Botón Ver Calificaciones */}
        <Button 
          variant="outlined"
          size="medium" 
          fullWidth
          startIcon={showCalificaciones ? <ExpandLessIcon /> : <ExpandMoreIcon />} 
          onClick={handleToggleCalificaciones}
          sx={styles.secondaryButton}
        >
          {showCalificaciones ? 'OCULTAR' : 'VER'} CALIFICACIONES
        </Button>
      </CardActions>

      {/* Lista de Calificaciones */}
      <Collapse in={showCalificaciones} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="600" color="#667eea">
            <GradingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Calificaciones
          </Typography>
          <List sx={styles.calificacionesList}>
            {user.calificaciones && user.calificaciones.length > 0 ? (
              user.calificaciones.map((calificacion, index) => (
                <ListItem key={index} sx={styles.calificacionItem}>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1" fontWeight="600">
                        {calificacion.nombreCurso}
                      </Typography>
                    } 
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Calificación: <strong>{calificacion.calificacion}</strong>
                      </Typography>
                    } 
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No hay calificaciones registradas
              </Typography>
            )}
          </List>
        </CardContent>
      </Collapse>

      {/* Menú de Opciones */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            minWidth: 180,
          }
        }}
      >
        <MenuItem 
          onClick={() => { onEditClick(user); handleMenuClose(); }}
          sx={{ fontWeight: 600 }}
        >
          <EditIcon sx={{ mr: 1, color: '#667eea' }} /> Editar
        </MenuItem>
        <MenuItem 
          onClick={() => { onPasswordChange(user._id); handleMenuClose(); }}
          sx={{ fontWeight: 600 }}
        >
          <KeyIcon sx={{ mr: 1, color: '#ff9800' }} /> Cambiar Contraseña
        </MenuItem>
        <MenuItem 
          onClick={() => { onDeleteClick(user._id); handleMenuClose(); }}
          sx={{ fontWeight: 600, color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default UsuariosRegistro;