import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useParams } from 'react-router-dom';
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
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputBase,
  Grid,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  SwipeableDrawer,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  FilterList,
  Edit,
  CalendarToday,
  Person,
  Email,
  BarChart,
  CheckCircle,
  Close,
  Refresh,
  TrendingUp,
  Schedule,
  Menu,
  Add,
  Notifications,
  Dashboard,
  Assignment,
  DateRange,
  Group,
  ExpandMore,
  PhoneIphone,
  Computer,
  ViewModule,
  ViewList,
  Sort,
  MoreVert
} from '@mui/icons-material';

const ListaAccionFrecu = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { label } = useParams();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAccion, setSelectedAccion] = useState(null);
  const [editData, setEditData] = useState({});
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNavValue, setMobileNavValue] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('fecha');

  // Estilos premium para desktop y mobile
  const styles = {
    // Estilos base que se comparten
    container: {
      maxWidth: '1800px',
      margin: '0 auto',
      padding: isMobile ? '16px 12px' : '40px 24px',
      background: 'transparent',
      minHeight: '100vh',
      paddingBottom: isMobile ? '80px' : '40px',
    },
    header: {
      marginTop: isMobile ? '60px' : '96px',
      marginBottom: isMobile ? '24px' : '48px',
      textAlign: 'center',
    },
    mainTitle: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 800,
      fontSize: isMobile ? '2rem' : '3rem',
      mb: 2,
      lineHeight: 1.2,
    },
    subtitle: {
      color: alpha(theme.palette.text.secondary, 0.8),
      fontSize: isMobile ? '0.9rem' : '1.2rem',
      fontWeight: 400,
    },
    areaTag: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '25px',
      padding: isMobile ? '8px 16px' : '12px 24px',
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      fontWeight: 600,
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      mt: 2,
    },

    // Mobile App Bar
    mobileAppBar: {
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    },
    mobileToolbar: {
      minHeight: '60px',
      justifyContent: 'space-between',
    },
    mobileTitle: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 700,
      fontSize: '1.1rem',
    },

    // Stats Grid - Versión Mobile
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: isMobile ? '12px' : '24px',
      mb: isMobile ? '24px' : '48px',
    },
    statCard: {
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '16px 12px' : '32px 24px',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      '&:hover': {
        transform: isMobile ? 'translateY(-4px)' : 'translateY(-8px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
    },
    statValue: {
      fontSize: isMobile ? '1.5rem' : '3rem',
      fontWeight: 800,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      mb: 1,
    },

    // Controls Section - Mobile
    controlsSection: {
      display: 'flex',
      gap: isMobile ? '8px' : '16px',
      mb: isMobile ? '16px' : '32px',
      alignItems: 'center',
      flexDirection: isMobile ? 'column' : 'row',
    },
    searchBox: {
      flex: 1,
      maxWidth: isMobile ? '100%' : '400px',
      position: 'relative',
      width: '100%',
    },
    searchInput: {
      width: '100%',
      padding: isMobile ? '12px 12px 12px 40px' : '16px 16px 16px 48px',
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(20px)',
      border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: isMobile ? '12px' : '16px',
      fontSize: isMobile ? '0.8rem' : '0.875rem',
      transition: 'all 0.3s ease',
      '&:focus': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
      '&::placeholder': {
        color: alpha(theme.palette.text.secondary, 0.6),
      },
    },
    searchIcon: {
      position: 'absolute',
      left: isMobile ? '12px' : '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: alpha(theme.palette.text.secondary, 0.6),
      fontSize: isMobile ? '18px' : '20px',
    },
    filterButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: isMobile ? '12px 16px' : '16px 24px',
      borderRadius: isMobile ? '12px' : '16px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      minWidth: isMobile ? '100%' : '120px',
      justifyContent: 'center',
      fontSize: isMobile ? '0.8rem' : '0.875rem',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
      },
    },

    // View Controls Mobile
    viewControls: {
      display: 'flex',
      gap: '8px',
      mb: '16px',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewToggle: {
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: '12px',
      padding: '8px',
      display: 'flex',
      gap: '4px',
    },
    viewButton: {
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '0.75rem',
      fontWeight: 600,
      transition: 'all 0.3s ease',
      minWidth: 'auto',
      '&.active': {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      },
    },

    // Mobile Grid View
    mobileGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    mobileCard: {
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: '16px',
      padding: '16px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
      },
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      mb: 2,
    },
    cardTitle: {
      fontWeight: 700,
      fontSize: '0.9rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    cardContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    cardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.8rem',
    },
    cardLabel: {
      color: theme.palette.text.secondary,
      fontWeight: 500,
    },
    cardValue: {
      fontWeight: 600,
      textAlign: 'right',
    },
    cardActions: {
      display: 'flex',
      gap: '8px',
      mt: 2,
      justifyContent: 'space-between',
    },

    // Table Styles (para desktop)
    tableContainer: {
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: isMobile ? '12px' : '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.1)',
      display: isMobile ? 'none' : 'block',
    },
    tableHead: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    tableHeaderCell: {
      color: 'white',
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: isMobile ? '12px 8px' : '20px 16px',
    },
    tableRow: {
      transition: 'all 0.3s ease',
      '&:hover': {
        background: alpha(theme.palette.primary.main, 0.02),
      },
    },
    tableCell: {
      padding: isMobile ? '16px 8px' : '24px 16px',
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      fontSize: isMobile ? '0.75rem' : '0.875rem',
    },

    // Status Chip
    statusChip: {
      padding: isMobile ? '6px 12px' : '8px 16px',
      borderRadius: isMobile ? '8px' : '12px',
      fontWeight: 600,
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'scale(1.05)',
      },
    },

    // Action Buttons
    actionButtons: {
      display: 'flex',
      gap: isMobile ? '4px' : '8px',
      flexDirection: isMobile ? 'column' : 'row',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: isMobile ? '8px 12px' : '12px 16px',
      borderRadius: isMobile ? '8px' : '12px',
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '6px',
      transition: 'all 0.3s ease',
      minWidth: 'auto',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
      },
    },
    secondaryButton: {
      background: 'transparent',
      color: theme.palette.text.secondary,
      border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
      padding: isMobile ? '8px 12px' : '12px 16px',
      borderRadius: isMobile ? '8px' : '12px',
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '6px',
      transition: 'all 0.3s ease',
      minWidth: 'auto',
      '&:hover': {
        background: alpha(theme.palette.primary.main, 0.05),
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
      },
    },

    // Modal Styles
    modalContainer: {
      backdropFilter: 'blur(20px)',
      backgroundColor: alpha('#000', 0.7),
    },
    modalPaper: {
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
      backdropFilter: 'blur(40px)',
      borderRadius: isMobile ? '16px' : '24px',
      boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
      maxWidth: isMobile ? '95vw' : '600px',
      width: '95vw',
      maxHeight: '90vh',
      overflowY: 'auto',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      margin: isMobile ? '16px' : '0',
    },
    modalHeader: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: isMobile ? '20px' : '32px',
      position: 'relative',
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: 700,
      fontSize: isMobile ? '1.2rem' : '1.5rem',
      margin: 0,
    },
    modalSubtitle: {
      opacity: 0.9,
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      margin: '8px 0 0 0',
    },
    closeButton: {
      position: 'absolute',
      right: isMobile ? '16px' : '24px',
      top: isMobile ? '16px' : '24px',
      color: 'white',
      background: alpha('#fff', 0.2),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${alpha('#fff', 0.2)}`,
      borderRadius: '12px',
      padding: '8px',
      transition: 'all 0.3s ease',
      '&:hover': {
        background: alpha('#fff', 0.3),
        transform: 'scale(1.1) rotate(90deg)',
      },
    },
    modalContent: {
      padding: isMobile ? '20px' : '32px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '16px' : '20px',
      mb: isMobile ? '16px' : '24px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    fullWidthGroup: {
      gridColumn: '1 / -1',
    },
    formLabel: {
      fontWeight: 600,
      fontSize: isMobile ? '0.8rem' : '0.875rem',
      color: theme.palette.text.primary,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formInput: {
      '& .MuiOutlinedInput-root': {
        borderRadius: isMobile ? '8px' : '12px',
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
      },
    },
    modalActions: {
      padding: isMobile ? '16px 20px' : '24px 32px',
      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      gap: '12px',
      flexDirection: isMobile ? 'column' : 'row',
    },
    dateDisplay: {
      background: `linear-gradient(135deg, ${alpha('#dcfce7', 0.3)} 0%, ${alpha('#bbf7d0', 0.3)} 100%)`,
      border: `1px solid ${alpha('#16a34a', 0.2)}`,
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '16px' : '20px',
      mb: isMobile ? '16px' : '24px',
    },
    historySection: {
      background: alpha(theme.palette.background.default, 0.5),
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '16px' : '20px',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    },

    // Mobile Bottom Navigation
    bottomNav: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      zIndex: 1000,
    },
    fabButton: {
      position: 'fixed',
      bottom: isMobile ? '80px' : '40px',
      right: isMobile ? '20px' : '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      '&:hover': {
        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
        transform: 'scale(1.1)',
      },
    },

    // Mobile Accordion
    mobileAccordion: {
      background: 'transparent',
      boxShadow: 'none',
      '&:before': {
        display: 'none',
      },
      '&.Mui-expanded': {
        margin: 0,
      },
    },
    accordionSummary: {
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: '12px',
      marginBottom: '8px',
      minHeight: '60px',
      '&.Mui-expanded': {
        minHeight: '60px',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
    },
    accordionDetails: {
      background: alpha(theme.palette.background.default, 0.5),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderTop: 'none',
      borderBottomLeftRadius: '12px',
      borderBottomRightRadius: '12px',
      padding: '16px',
    },
  };

  // Función corregida para manejar fechas sin problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateString;
    
    try {
      const date = new Date(dateString);
      
      if (!isNaN(date.getTime())) {
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        
        return `${day}/${month}/${year}`;
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateString;
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return '';
    } catch (error) {
      console.error('Error formateando fecha para input:', error);
      return '';
    }
  };

  const formatDateFromInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const [year, month, day] = dateString.split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    } catch (error) {
      console.error('Error convirtiendo fecha desde input:', error);
      return dateString;
    }
  };

  const getFullMonthName = (abbreviation) => {
    const months = {
      ENE: 'Enero', FEB: 'Febrero', MAR: 'Marzo', ABR: 'Abril', MAY: 'Mayo', JUN: 'Junio',
      JUL: 'Julio', AGO: 'Agosto', SEP: 'Septiembre', OCT: 'Octubre', NOV: 'Noviembre', DIC: 'Diciembre'
    };
    const cleanAbbr = abbreviation?.replace('indicador', '').trim() || '';
    return months[cleanAbbr] || cleanAbbr;
  };

  const fetchAcciones = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/objetivos/acciones`,
        { params: { area: label } }
      );
      
      const accionesFormateadas = response.data.map(accion => ({
        ...accion,
        fecha: formatDate(accion.fecha),
        fichaCompromiso: formatDate(accion.fichaCompromiso),
        historialFechas: accion.historialFechas?.map(formatDate) || [],
        periodo: getFullMonthName(accion.periodo)
      }));
      
      setAcciones(accionesFormateadas);
    } catch (error) {
      console.error("Error al cargar acciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (accion) => {
    setSelectedAccion(accion);
    setEditData({
      responsable: {
        nombre: accion.responsable?.nombre || '',
        email: accion.responsable?.email || ''
      },
      efectividad: accion.efectividad?.replace('indicador', '').trim() || '0%',
      observaciones: accion.observaciones || '',
      acciones: accion.acciones || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAccion) return;
    
    setSaving(true);
    try {
      await api.put(
        `/api/objetivos/acciones/${selectedAccion._id}`,
        {
          responsable: editData.responsable,
          efectividad: editData.efectividad + ' indicador',
          observaciones: editData.observaciones,
          acciones: editData.acciones
        }
      );
      await fetchAcciones();
      setEditModalOpen(false);
      setSelectedAccion(null);
    } catch (error) {
      console.error("Error al actualizar acción:", error);
      alert("Error al actualizar la acción");
    } finally {
      setSaving(false);
    }
  };

  const handleReprogramar = async () => {
    if (!selectedAccion || !nuevaFecha) {
      alert("Por favor selecciona una fecha válida");
      return;
    }

    setSaving(true);
    try {
      const [year, month, day] = nuevaFecha.split('-');
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      
      await api.put(
        `/api/objetivos/acciones/${selectedAccion._id}/reprogramar`,
        { 
          nuevaFecha: utcDate.toISOString(),
          nuevaFechaLocal: formatDateFromInput(nuevaFecha)
        }
      );
      await fetchAcciones();
      setRescheduleModalOpen(false);
      setSelectedAccion(null);
      setNuevaFecha('');
    } catch (error) {
      console.error("Error al reprogramar fecha:", error);
      alert("Error al reprogramar la fecha");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenReschedule = (accion) => {
    setSelectedAccion(accion);
    setNuevaFecha(formatDateForInput(accion.fichaCompromiso) || '');
    setRescheduleModalOpen(true);
  };

  const filteredAcciones = acciones.filter(accion =>
    Object.values(accion).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedAcciones = filteredAcciones.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const stats = {
    total: acciones.length,
    completadas: acciones.filter(a => a.efectividad?.includes('100%')).length,
    reprogramadas: acciones.filter(a => a.historialFechas?.length > 0).length,
    pendientes: acciones.filter(a => a.efectividad?.includes('0%')).length
  };

  const getStatusColor = (status) => {
    const cleanStatus = status?.replace('indicador', '').trim() || '0%';
    switch(cleanStatus) {
      case '0%': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case '25%': return { bg: '#fffbeb', color: '#d97706', border: '#fed7aa' };
      case '50%': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      case '75%': return { bg: '#eff6ff', color: '#0284c7', border: '#bae6fd' };
      case '100%': return { bg: '#f0fdf9', color: '#065f46', border: '#a7f3d0' };
      default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  // Componente para la vista móvil en Grid
  const MobileGridView = () => (
    <Box sx={styles.mobileGrid}>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, fontSize: '0.9rem' }}>Cargando acciones...</Typography>
        </Box>
      ) : paginatedAcciones.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>No se encontraron acciones</Typography>
        </Box>
      ) : (
        paginatedAcciones.map((accion) => {
          const statusColors = getStatusColor(accion.efectividad);
          return (
            <Card key={accion._id} sx={styles.mobileCard}>
              <Box sx={styles.cardHeader}>
                <Typography sx={styles.cardTitle}>
                  #{accion.noObjetivo || 'N/A'} - {accion.periodo || 'N/A'}
                </Typography>
                <Chip
                  label={accion.efectividad?.replace('indicador', '') || '0%'}
                  sx={{
                    ...styles.statusChip,
                    background: statusColors.bg,
                    color: statusColors.color,
                    border: `1px solid ${statusColors.border}`,
                  }}
                />
              </Box>
              
              <Box sx={styles.cardContent}>
                <Box sx={styles.cardRow}>
                  <Typography sx={styles.cardLabel}>Fecha:</Typography>
                  <Typography sx={styles.cardValue}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 14 }} />
                      {accion.fecha || 'N/A'}
                    </Box>
                  </Typography>
                </Box>
                
                <Box sx={styles.cardRow}>
                  <Typography sx={styles.cardLabel}>Compromiso:</Typography>
                  <Typography sx={styles.cardValue}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 14, color: 'success.main' }} />
                      {accion.fichaCompromiso || 'N/A'}
                    </Box>
                  </Typography>
                </Box>
                
                <Box sx={styles.cardRow}>
                  <Typography sx={styles.cardLabel}>Responsable:</Typography>
                  <Typography sx={styles.cardValue}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: 14 }} />
                      {accion.responsable?.nombre || 'N/A'}
                    </Box>
                  </Typography>
                </Box>
                
                {accion.acciones && (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ ...styles.cardLabel, mb: 0.5 }}>Acciones:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {accion.acciones.length > 100 ? accion.acciones.substring(0, 100) + '...' : accion.acciones}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={styles.cardActions}>
                <Button 
                  sx={styles.primaryButton}
                  onClick={() => handleEdit(accion)}
                  size="small"
                >
                  <Edit sx={{ fontSize: 16 }} />
                  Editar
                </Button>
                <Button 
                  sx={styles.secondaryButton}
                  onClick={() => handleOpenReschedule(accion)}
                  size="small"
                >
                  <Refresh sx={{ fontSize: 16 }} />
                  Reprogramar
                </Button>
              </Box>
            </Card>
          );
        })
      )}
    </Box>
  );

  // Componente para la vista móvil en Lista (Acordeón)
  const MobileListView = () => (
    <Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, fontSize: '0.9rem' }}>Cargando acciones...</Typography>
        </Box>
      ) : paginatedAcciones.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>No se encontraron acciones</Typography>
        </Box>
      ) : (
        paginatedAcciones.map((accion) => {
          const statusColors = getStatusColor(accion.efectividad);
          return (
            <Accordion key={accion._id} sx={styles.mobileAccordion}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={styles.accordionSummary}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip
                    label={accion.efectividad?.replace('indicador', '') || '0%'}
                    sx={{
                      ...styles.statusChip,
                      background: statusColors.bg,
                      color: statusColors.color,
                      border: `1px solid ${statusColors.border}`,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      #{accion.noObjetivo} - {accion.periodo}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      {accion.fecha}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={styles.accordionDetails}>
                <Box sx={styles.cardContent}>
                  <Box sx={styles.cardRow}>
                    <Typography sx={styles.cardLabel}>Compromiso:</Typography>
                    <Typography sx={styles.cardValue}>
                      {accion.fichaCompromiso || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={styles.cardRow}>
                    <Typography sx={styles.cardLabel}>Responsable:</Typography>
                    <Typography sx={styles.cardValue}>
                      {accion.responsable?.nombre || 'N/A'}
                    </Typography>
                  </Box>
                  
                  {accion.responsable?.email && (
                    <Box sx={styles.cardRow}>
                      <Typography sx={styles.cardLabel}>Email:</Typography>
                      <Typography sx={{ ...styles.cardValue, fontSize: '0.75rem' }}>
                        {accion.responsable.email}
                      </Typography>
                    </Box>
                  )}
                  
                  {accion.acciones && (
                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ ...styles.cardLabel, mb: 0.5 }}>Acciones:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {accion.acciones}
                      </Typography>
                    </Box>
                  )}
                  
                  {accion.observaciones && (
                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ ...styles.cardLabel, mb: 0.5 }}>Observaciones:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {accion.observaciones}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ ...styles.cardActions, mt: 2 }}>
                    <Button 
                      sx={styles.primaryButton}
                      onClick={() => handleEdit(accion)}
                      size="small"
                    >
                      <Edit sx={{ fontSize: 16 }} />
                      Editar
                    </Button>
                    <Button 
                      sx={styles.secondaryButton}
                      onClick={() => handleOpenReschedule(accion)}
                      size="small"
                    >
                      <Refresh sx={{ fontSize: 16 }} />
                      Reprogramar
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );

  useEffect(() => {
    fetchAcciones();
  }, [label]);

  return (
    <Box sx={styles.container}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed" sx={styles.mobileAppBar} elevation={0}>
          <Toolbar sx={styles.mobileToolbar}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu />
            </IconButton>
            
            <Typography sx={styles.mobileTitle}>
              Gestión de Acciones
            </Typography>
            
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h1" sx={styles.mainTitle}>
          Gestión de Acciones
        </Typography>
        <Typography sx={styles.subtitle}>
          Monitorea y gestiona todas las acciones del área
        </Typography>
        <Chip 
          label={label || "Área"}
          sx={styles.areaTag}
        />
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={styles.statsGrid}>
        <Grid item xs={12} sm={6} md={30}>
          <Card sx={styles.statCard}>
            <Typography sx={styles.statValue}>{stats.total}</Typography>
            <Typography sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              {isMobile ? 'Total' : 'Total de Acciones'}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={30}>
          <Card sx={styles.statCard}>
            <Typography sx={styles.statValue}>{stats.completadas}</Typography>
            <Typography sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              <CheckCircle fontSize={isMobile ? "small" : "medium"} />
              {isMobile ? 'Hechas' : 'Completadas'}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={30}>
          <Card sx={styles.statCard}>
            <Typography sx={styles.statValue}>{stats.reprogramadas}</Typography>
            <Typography sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              <Refresh fontSize={isMobile ? "small" : "medium"} />
              {isMobile ? 'Reprog.' : 'Reprogramadas'}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={30}>
          <Card sx={styles.statCard}>
            <Typography sx={styles.statValue}>{stats.pendientes}</Typography>
            <Typography sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              <Schedule fontSize={isMobile ? "small" : "medium"} />
              {isMobile ? 'Pend.' : 'Pendientes'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box sx={styles.controlsSection}>
        <Box sx={styles.searchBox}>
          <Search sx={styles.searchIcon} />
          <InputBase
            placeholder={isMobile ? "Buscar acciones..." : "Buscar en acciones..."}
            sx={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <Button sx={styles.filterButton}>
          <FilterList />
          {isMobile ? "FILTRAR" : "FILTRAR"}
        </Button>
      </Box>

      {/* Mobile View Controls */}
      {isMobile && (
        <Box sx={styles.viewControls}>
          <Box sx={styles.viewToggle}>
            <Button 
              sx={{
                ...styles.viewButton,
                ...(viewMode === 'grid' ? { '&.active': styles.viewButton.active } : {})
              }}
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <ViewModule sx={{ fontSize: 16 }} />
            </Button>
            <Button 
              sx={{
                ...styles.viewButton,
                ...(viewMode === 'list' ? { '&.active': styles.viewButton.active } : {})
              }}
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <ViewList sx={{ fontSize: 16 }} />
            </Button>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={styles.formInput}
            >
              <MenuItem value="fecha">Por Fecha</MenuItem>
              <MenuItem value="efectividad">Por Efectividad</MenuItem>
              <MenuItem value="responsable">Por Responsable</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Content - Desktop Table or Mobile View */}
      {!isMobile ? (
        // Desktop Table View
        <TableContainer component={Paper} sx={styles.tableContainer}>
          <Table>
            <TableHead sx={styles.tableHead}>
              <TableRow>
                <TableCell sx={styles.tableHeaderCell}>Fecha</TableCell>
                <TableCell sx={styles.tableHeaderCell}>No. Objetivo</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Periodo</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Acciones</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Compromiso</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Responsable</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Efectividad</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Observaciones</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={styles.tableCell}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Cargando acciones...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedAcciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={styles.tableCell}>
                    <Typography>No se encontraron acciones</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAcciones.map((accion) => {
                  const statusColors = getStatusColor(accion.efectividad);
                  return (
                    <TableRow key={accion._id} sx={styles.tableRow}>
                      <TableCell sx={styles.tableCell}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
                          {accion.fecha || 'N/A'}
                        </Box>
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        <Typography fontWeight={600}>#{accion.noObjetivo || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell sx={styles.tableCell}>{accion.periodo || 'N/A'}</TableCell>
                      <TableCell sx={styles.tableCell}>{accion.acciones || 'N/A'}</TableCell>
                      <TableCell sx={styles.tableCell}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography fontWeight={600}>{accion.fichaCompromiso || 'N/A'}</Typography>
                          </Box>
                          {accion.historialFechas?.slice(0, 2).map((fecha, idx) => (
                            <Typography key={idx} variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              {fecha}
                            </Typography>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        <Box>
                          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                            <Person sx={{ fontSize: 16 }} />
                            {accion.responsable?.nombre || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                            <Email sx={{ fontSize: 14 }} />
                            {accion.responsable?.email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        <Chip
                          icon={<BarChart sx={{ fontSize: 14 }} />}
                          label={accion.efectividad?.replace('indicador', '') || '0%'}
                          sx={{
                            ...styles.statusChip,
                            background: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`,
                          }}
                          onClick={() => handleEdit(accion)}
                        />
                      </TableCell>
                      <TableCell sx={styles.tableCell}>{accion.observaciones || 'N/A'}</TableCell>
                      <TableCell sx={styles.tableCell}>
                        <Box sx={styles.actionButtons}>
                          <Button sx={styles.primaryButton} onClick={() => handleEdit(accion)}>
                            <Edit />
                            Editar
                          </Button>
                          <Button sx={styles.secondaryButton} onClick={() => handleOpenReschedule(accion)}>
                            <Refresh />
                            Reprogramar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAcciones.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      ) : (
        // Mobile View
        <Box>
          {viewMode === 'grid' ? <MobileGridView /> : <MobileListView />}
          
          {!loading && paginatedAcciones.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAcciones.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  padding: '8px',
                  flexWrap: 'wrap',
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem',
                  margin: 0,
                },
              }}
            />
          )}
        </Box>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab 
          sx={styles.fabButton} 
          size="medium"
          onClick={() => {/* Aquí puedes agregar funcionalidad para crear nueva acción */}}
        >
          <Add />
        </Fab>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={mobileNavValue}
          onChange={(event, newValue) => setMobileNavValue(newValue)}
          sx={styles.bottomNav}
          showLabels
        >
          <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
          <BottomNavigationAction label="Acciones" icon={<Assignment />} />
          <BottomNavigationAction label="Calendario" icon={<DateRange />} />
          <BottomNavigationAction label="Equipo" icon={<Group />} />
        </BottomNavigation>
      )}

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => !saving && setEditModalOpen(false)}
        maxWidth={false}
        PaperProps={{ sx: styles.modalPaper }}
        BackdropProps={{ sx: styles.modalContainer }}
        fullScreen={isMobile}
      >
        <DialogTitle sx={styles.modalHeader}>
          <Box sx={styles.modalTitle}>
            <Edit />
            Editor de Acción #{selectedAccion?.noObjetivo}
          </Box>
          <Typography sx={styles.modalSubtitle}>
            Modifica la información de esta acción
          </Typography>
          <IconButton 
            sx={styles.closeButton} 
            onClick={() => !saving && setEditModalOpen(false)}
            disabled={saving}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={styles.modalContent}>
          <Grid container spacing={4} sx={styles.formGrid}>
            <Grid item xs={12} md={6}>
              <Box sx={styles.formGroup}>
                <Typography sx={styles.formLabel}>
                  <Person />
                  Responsable
                </Typography>
                <TextField
                  fullWidth
                  value={editData.responsable?.nombre || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    responsable: { ...editData.responsable, nombre: e.target.value }
                  })}
                  disabled={saving}
                  sx={styles.formInput}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={styles.formGroup}>
                <Typography sx={styles.formLabel}>
                  <Email />
                  Email
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  value={editData.responsable?.email || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    responsable: { ...editData.responsable, email: e.target.value }
                  })}
                  disabled={saving}
                  sx={styles.formInput}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={styles.formGroup}>
                <Typography sx={styles.formLabel}>
                  <BarChart />
                  Efectividad
                </Typography>
                <FormControl fullWidth sx={styles.formInput} size={isMobile ? "small" : "medium"}>
                  <Select
                    value={editData.efectividad || '0%'}
                    onChange={(e) => setEditData({...editData, efectividad: e.target.value})}
                    disabled={saving}
                  >
                    <MenuItem value="0%">0% - No iniciado</MenuItem>
                    <MenuItem value="25%">25% - En progreso</MenuItem>
                    <MenuItem value="50%">50% - A la mitad</MenuItem>
                    <MenuItem value="75%">75% - Casi terminado</MenuItem>
                    <MenuItem value="100%">100% - Completado</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={styles.formGroup}>
                <Typography sx={styles.formLabel}>
                  Periodo
                </Typography>
                <TextField
                  fullWidth
                  value={selectedAccion?.periodo || ''}
                  disabled
                  sx={styles.formInput}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={styles.formGroup}>
                <Typography sx={styles.formLabel}>
                  Acciones
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={isMobile ? 2 : 3}
                  value={editData.acciones || ''}
                  onChange={(e) => setEditData({...editData, acciones: e.target.value})}
                  disabled={saving}
                  sx={styles.formInput}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={styles.formGroup}>
                <Typography sx={styles.formLabel}>
                  Observaciones
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={isMobile ? 2 : 3}
                  value={editData.observaciones || ''}
                  onChange={(e) => setEditData({...editData, observaciones: e.target.value})}
                  disabled={saving}
                  sx={styles.formInput}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={styles.modalActions}>
          <Button 
            sx={styles.secondaryButton}
            onClick={() => setEditModalOpen(false)}
            disabled={saving}
            fullWidth={isMobile}
          >
            <Close />
            Cancelar
          </Button>
          <Button 
            sx={styles.primaryButton}
            onClick={handleSaveEdit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}
            fullWidth={isMobile}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog
        open={rescheduleModalOpen}
        onClose={() => !saving && setRescheduleModalOpen(false)}
        maxWidth={false}
        PaperProps={{ sx: styles.modalPaper }}
        BackdropProps={{ sx: styles.modalContainer }}
        fullScreen={isMobile}
      >
        <DialogTitle sx={styles.modalHeader}>
          <Box sx={styles.modalTitle}>
            <Refresh />
            Reprogramar Fecha
          </Box>
          <Typography sx={styles.modalSubtitle}>
            Establece una nueva fecha de compromiso
          </Typography>
          <IconButton 
            sx={styles.closeButton} 
            onClick={() => !saving && setRescheduleModalOpen(false)}
            disabled={saving}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={styles.modalContent}>
          <Box sx={styles.dateDisplay}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'success.main', mb: 1, fontSize: isMobile ? '0.9rem' : '1rem' }}>
              <CalendarToday />
              Fecha Actual: {selectedAccion?.fichaCompromiso || 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Compromiso vigente
            </Typography>
          </Box>

          <Box sx={styles.formGroup}>
            <Typography sx={styles.formLabel}>
              <CalendarToday />
              Nueva Fecha de Compromiso
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              disabled={saving}
              sx={styles.formInput}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
              size={isMobile ? "small" : "medium"}
            />
          </Box>

          {selectedAccion?.historialFechas && selectedAccion.historialFechas.length > 0 && (
            <Box sx={styles.historySection}>
              <Typography sx={{ ...styles.formLabel, mb: 2 }}>
                <TrendingUp />
                Historial de Reprogramaciones
              </Typography>
              {selectedAccion.historialFechas.map((fecha, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    <CalendarToday sx={{ fontSize: 14 }} />
                    {fecha}
                  </Typography>
                  <Chip label={`#${index + 1}`} size="small" color="primary" />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={styles.modalActions}>
          <Button 
            sx={styles.secondaryButton}
            onClick={() => setRescheduleModalOpen(false)}
            disabled={saving}
            fullWidth={isMobile}
          >
            <Close />
            Cancelar
          </Button>
          <Button 
            sx={styles.primaryButton}
            onClick={handleReprogramar}
            disabled={!nuevaFecha || saving}
            startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}
            fullWidth={isMobile}
          >
            {saving ? 'Reprogramando...' : 'Confirmar Reprogramación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaAccionFrecu;