import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Badge,
  Fab,
  useTheme,
  useMediaQuery,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Collapse
} from '@mui/material';
import {
  FilterList,
  Search,
  CalendarToday,
  Person,
  Business,
  Assignment,
  Schedule,
  CheckCircle,
  Pending,
  Warning,
  TrendingUp,
  BarChart,
  ViewModule,
  ViewWeek,
  Add,
  ExpandMore,
  ChevronRight,
  ChevronLeft,
  Today,
  EventAvailable,
  EventBusy,
  Group,
  Visibility,
  Close,
  Menu,
  ExpandLess
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Componentes estilizados
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
  },
  [theme.breakpoints.down('md')]: {
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  }
}));

const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  backdropFilter: 'blur(10px)',
  [theme.breakpoints.down('md')]: {
    borderRadius: 16,
  }
}));

const StatusChip = styled(Chip)(({ status, theme }) => ({
  fontWeight: 600,
  borderRadius: 8,
  ...(status === 'Finalizado' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  }),
  ...(status === 'pendiente' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(status === 'Devuelto' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(status === 'Terminada' && {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  })
}));

const AcceptabilityChip = styled(Chip)(({ acceptability, theme }) => ({
  fontWeight: 600,
  borderRadius: 8,
  ...(acceptability === 'Bueno' && {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  }),
  ...(acceptability === 'Aceptable' && {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  }),
  ...(acceptability === 'No aceptable' && {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  }),
  ...(acceptability === 'Critico' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  })
}));

const CalendarDay = styled(Paper)(({ theme, selected, hasEvent }) => ({
  width: '100%',
  height: 120,
  padding: theme.spacing(1),
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: `2px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
  backgroundColor: hasEvent ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'scale(1.02)',
  },
  [theme.breakpoints.down('md')]: {
    height: 80,
    padding: theme.spacing(0.5),
    borderRadius: 8,
  }
}));

const MobileCalendarDay = styled(Paper)(({ theme, selected, hasEvent }) => ({
  width: '100%',
  minHeight: 60,
  padding: theme.spacing(1),
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: `2px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
  backgroundColor: hasEvent ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper,
  '&:active': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    transform: 'scale(0.98)',
  }
}));

const ProgressBar = styled(LinearProgress)(({ percentage, theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    ...(percentage >= 90 && { backgroundColor: theme.palette.success.main }),
    ...(percentage >= 80 && percentage < 90 && { backgroundColor: theme.palette.info.main }),
    ...(percentage >= 60 && percentage < 80 && { backgroundColor: theme.palette.warning.main }),
    ...(percentage < 60 && { backgroundColor: theme.palette.error.main }),
  }
}));

const MobileStatCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  padding: theme.spacing(2),
}));

const AuditCalendar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Estados principales
  const [auditorias, setAuditorias] = useState([]);
  const [pendingAudits, setPendingAudits] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState(false);

  // Filtros para auditorías finalizadas
  const [filters, setFilters] = useState({
    auditorLider: '',
    tipoAuditoria: '',
    departamento: '',
    aceptibilidad: '',
    year: new Date().getFullYear().toString()
  });

  // Filtros para auditorías pendientes
  const [pendingFilters, setPendingFilters] = useState({
    auditorLider: '',
    tipoAuditoria: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    critical: 0,
    averageScore: 0
  });

  useEffect(() => {
    const fetchAuditorias = async () => {
      try {
        // traer datos de ambos endpoints
        const [datosRes, progRes] = await Promise.all([
          api.get('/datos'),
          api.get('/programas-anuales/audits')
        ]);

        const datos = Array.isArray(datosRes.data) ? datosRes.data : [];
        const prog = Array.isArray(progRes.data) ? progRes.data : [];

        // Normalizar estados entre ambas fuentes
        const normalizeStatus = (item, source) => {
          // source: 'datos' or 'program'
          let status = 'Desconocido';
          if (source === 'program') {
            // programar-audi status enums: Realizada, Programada, No ejecutada, Por Confirmar, En Curso
            switch ((item.status || '').toString()) {
              case 'Realizada': status = 'Realizada'; break;
              case 'Programada': status = 'Programada'; break;
              case 'No ejecutada': status = 'No ejecutada'; break;
              case 'Por Confirmar': status = 'Por Confirmar'; break;
              case 'En Curso': status = 'En Curso'; break;
              default: status = item.status || 'Desconocido';
            }
          } else {
            // datos.Estado possible values used across app: pendiente, Terminada, Devuelto, etc.
            const e = (item.Estado || item.Estatus || '').toString().toLowerCase();
            if (e.includes('pend') || e.includes('pendiente')) status = 'Programada';
            else if (e.includes('termin') || e.includes('finaliz')) status = 'Realizada';
            else if (e.includes('devuelto')) status = 'Devuelto';
            else if (e.includes('cancel')) status = 'Cancelada';
            else if (e.includes('no ejecutada') || e.includes('no ejecutado')) status = 'No ejecutada';
            else status = item.Estado || item.Estatus || 'Desconocido';
          }
          return status;
        };

        // Mapear cada fuente a una estructura común, manteniendo campos originales
        const mappedDatos = datos.map(d => ({
          ...d,
          _source: 'datos',
          normalizedStatus: normalizeStatus(d, 'datos'),
          start: d.FechaInicio || d.FechaElaboracion || null,
          end: d.FechaFin || null,
        }));

        const mappedProg = prog.map(p => ({
          ...p,
          _source: 'program',
          normalizedStatus: normalizeStatus(p, 'program'),
          start: p.fechaInicio || null,
          end: p.fechaFin || null,
        }));

        const combined = [...mappedDatos, ...mappedProg];

        setAuditorias(combined);

        // pendingAudits: aquellos que aún no están realizados (Programada, Por Confirmar, En Curso)
        const pending = combined.filter(a => ['Programada', 'Por Confirmar', 'En Curso'].includes(a.normalizedStatus));
        setPendingAudits(pending);

        calculateStats(combined);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAuditorias();
  }, []);

  const calculateStats = (data) => {
    const total = data.length;
    const completed = data.filter(audit => audit.Estado === 'Finalizado').length;
    const pending = data.filter(audit => audit.Estado === 'pendiente' || audit.Estado === 'Devuelto').length;
    const critical = data.filter(audit => {
      const percentage = parseFloat(audit.PorcentajeTotal) || 0;
      return percentage < 60;
    }).length;
    
    const completedAudits = data.filter(audit => audit.Estado === 'Finalizado');
    const averageScore = completedAudits.length > 0 
      ? completedAudits.reduce((sum, audit) => sum + (parseFloat(audit.PorcentajeTotal) || 0), 0) / completedAudits.length
      : 0;

    setStats({ total, completed, pending, critical, averageScore });
  };

  const getAcceptability = (percentage) => {
    const perc = parseFloat(percentage) || 0;
    if (perc < 61) return 'Critico';
    if (perc < 80) return 'No aceptable';
    if (perc < 90) return 'Aceptable';
    return 'Bueno';
  };

  const getFilteredAudits = () => {
    // Map tabValue to normalizedStatus filter (tab 0 = all)
    const statusByTab = {
      1: 'Realizada',
      2: 'Programada',
      3: 'No ejecutada',
      4: 'En Curso',
      5: 'Por Confirmar'
    };

    const desiredStatus = statusByTab[tabValue] || null; // null => todas

    return auditorias.filter(audit => {
      // If a specific status is selected, filter by normalizedStatus
      if (desiredStatus && audit.normalizedStatus !== desiredStatus) return false;

  const acceptability = getAcceptability(audit.PorcentajeTotal);
  const startDate = getStartDate(audit);
  const year = startDate ? startDate.getFullYear().toString() : '';

      return (
        (filters.auditorLider === '' || (audit.AuditorLider && audit.AuditorLider === filters.auditorLider)) &&
        (filters.tipoAuditoria === '' || (audit.TipoAuditoria && audit.TipoAuditoria === filters.tipoAuditoria)) &&
        (filters.departamento === '' || (audit.Departamento && audit.Departamento === filters.departamento)) &&
        (filters.aceptibilidad === '' || acceptability === filters.aceptibilidad) &&
        (filters.year === '' || year === filters.year)
      );
    });
  };

  const getFilteredPendingAudits = () => {
    return pendingAudits.filter(audit => {
      if (pendingFilters.auditorLider && !audit.AuditorLider.toLowerCase().includes(pendingFilters.auditorLider.toLowerCase())) {
        return false;
      }
      if (pendingFilters.tipoAuditoria && audit.TipoAuditoria !== pendingFilters.tipoAuditoria) {
        return false;
      }
      if (pendingFilters.fechaInicio) {
        const s = getStartDate(audit);
        if (!s || s < new Date(pendingFilters.fechaInicio)) return false;
      }
      if (pendingFilters.fechaFin) {
        const e = getEndDate(audit);
        if (!e || e > new Date(pendingFilters.fechaFin)) return false;
      }
      return true;
    });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Normalized date helpers: prefer mapped `start`/`end`, then legacy fields
  const getStartDate = (audit) => {
    if (!audit) return null;
    const s = audit.start || audit.FechaInicio || audit.fechaInicio || audit.FechaElaboracion;
    return s ? new Date(s) : null;
  };

  const getEndDate = (audit) => {
    if (!audit) return null;
    const e = audit.end || audit.FechaFin || audit.fechaFin;
    return e ? new Date(e) : null;
  };

  // Display helpers to provide sensible fallbacks for program-scheduled audits
  const getDisplayTitle = (audit) => {
    if (!audit) return '';
    if (audit._source === 'program') return audit.cliente || `Auditoría programada`;
    return audit.TipoAuditoria || audit.cliente || 'Auditoría';
  };

  const getDisplaySubtitle = (audit) => {
    if (!audit) return '';
    if (audit._source === 'program') return audit.modalidad || audit.status || '';
    return audit.Departamento || '';
  };

  const getDisplayLeader = (audit) => {
    if (!audit) return 'N/A';
    return audit.AuditorLider || audit.auditorLider || 'N/A';
  };

  const getDisplayDuration = (audit) => {
    if (!audit) return '';
    // For program entries, show fecha range if available
    if (audit._source === 'program') {
      const s = audit.fechaInicio || audit.start;
      const e = audit.fechaFin || audit.end;
      if (s && e) {
        try {
          return `${new Date(s).toLocaleDateString()} - ${new Date(e).toLocaleDateString()}`;
        } catch (err) {
          return `${s} - ${e}`;
        }
      }
      return `${s || ''}`;
    }
    return audit.Duracion || '';
  };

  const getDisplayPercentage = (audit) => {
    if (!audit) return '';
    return audit.PorcentajeTotal ? `${audit.PorcentajeTotal}%` : '';
  };

  const getDisplayStatus = (audit) => {
    if (!audit) return '';
    return audit.normalizedStatus || audit.status || audit.Estado || '';
  };

  const getAuditsForDate = (date) => {
    return auditorias.filter(audit => {
      const auditDate = getStartDate(audit);
      return auditDate && auditDate.toDateString() === date.toDateString();
    });
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const calendar = [];

    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      calendar.push(date);
    }

    return calendar;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const auditsOnDate = getAuditsForDate(date);
    if (auditsOnDate.length > 0) {
      setSelectedAudit(auditsOnDate[0]);
      setDetailDialogOpen(true);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handlePendingFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingFilters({ ...pendingFilters, [name]: value });
  };

  const handleAuditClick = (audit) => {
    setSelectedAudit(audit);
    setDetailDialogOpen(true);
  };

  // Versión Mobile del Dialog de Detalles
  const AuditDetailDialog = () => (
    <Dialog 
      open={detailDialogOpen} 
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          m: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}>
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="600">
                {selectedAudit?.TipoAuditoria}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedAudit?.Departamento}
              </Typography>
            </Box>
          </Box>
          {isMobile && (
            <IconButton onClick={() => setDetailDialogOpen(false)} edge="end">
              <Close />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                INFORMACIÓN GENERAL
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Auditor Líder
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {selectedAudit?.AuditorLider}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Equipo Auditor
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {Array.isArray(selectedAudit?.EquipoAuditor) 
                      ? selectedAudit.EquipoAuditor.map(e => e.Nombre).join(', ') 
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Áreas Auditadas
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {selectedAudit?.AreasAudi}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Duración
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {selectedAudit?.Duracion}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                RESULTADOS
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Porcentaje Total
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Typography variant="h5" fontWeight="700" color="primary">
                      {selectedAudit?.PorcentajeTotal}%
                    </Typography>
                    <ProgressBar 
                      variant="determinate" 
                      value={parseFloat(selectedAudit?.PorcentajeTotal) || 0} 
                      percentage={parseFloat(selectedAudit?.PorcentajeTotal) || 0}
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Aceptabilidad
                  </Typography>
                  <AcceptabilityChip 
                    label={getAcceptability(selectedAudit?.PorcentajeTotal)} 
                    acceptability={getAcceptability(selectedAudit?.PorcentajeTotal)}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Estado
                  </Typography>
                  <StatusChip 
                    label={selectedAudit?.Estado} 
                    status={selectedAudit?.Estado}
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
        <Button 
          onClick={() => setDetailDialogOpen(false)} 
          variant="contained"
          fullWidth={isMobile}
          size={isMobile ? "large" : "medium"}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Vista Mobile del Calendario
  const MobileCalendarView = () => {
    const calendar = generateCalendar();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    return (
      <Box sx={{ mb: 2 }}>
        {/* Header del Calendario Mobile */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <IconButton 
              onClick={handlePreviousMonth}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <ChevronLeft />
            </IconButton>
            
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="700" color="primary.main">
                {monthNames[currentMonth.getMonth()]}
              </Typography>
              <Typography variant="caption" color="textSecondary" fontWeight="600">
                {currentMonth.getFullYear()}
              </Typography>
            </Box>
            
            <IconButton 
              onClick={handleNextMonth}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          <Button 
            startIcon={<Today />}
            onClick={() => setCurrentMonth(new Date())}
            variant="contained"
            fullWidth
            size="small"
          >
            Ir a Hoy
          </Button>
        </Paper>

        {/* Contenedor del Calendario */}
        <Paper sx={{ p: 1.5, borderRadius: 3, overflow: 'hidden' }}>
          {/* Encabezado de días */}
          <Box 
            display="grid" 
            gridTemplateColumns="repeat(7, 1fr)" 
            gap={0.5} 
            mb={0.5}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 1.5,
              p: 1
            }}
          >
            {dayNames.map(day => (
              <Box key={day} textAlign="center">
                <Typography 
                  variant="caption" 
                  fontWeight="700" 
                  color="primary.main"
                  sx={{ 
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Grid del Calendario */}
          <Box 
            display="grid" 
            gridTemplateColumns="repeat(7, 1fr)" 
            gap={0.5}
          >
            {calendar.map((date, index) => {
              const isToday = date && date.toDateString() === new Date().toDateString();
              const auditsOnDate = date ? getAuditsForDate(date) : [];
              
              return (
                <Box key={index} sx={{ position: 'relative' }}>
                  {date ? (
                    <Paper
                      elevation={auditsOnDate.length > 0 ? 2 : 0}
                      sx={{
                        height: 70,
                        p: 0.5,
                        borderRadius: 1.5,
                        cursor: auditsOnDate.length > 0 ? 'pointer' : 'default',
                        border: isToday ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: auditsOnDate.length > 0 
                          ? alpha(theme.palette.primary.main, 0.05) 
                          : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:active': auditsOnDate.length > 0 ? {
                          transform: 'scale(0.95)',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        } : {},
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}
                      onClick={() => auditsOnDate.length > 0 && handleDateClick(date)}
                    >
                      {/* Número del día */}
                      <Box
                        sx={{
                          width: isToday ? 24 : 20,
                          height: isToday ? 24 : 20,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isToday ? 'primary.main' : 'transparent',
                          color: isToday ? 'white' : 'text.primary',
                          fontWeight: isToday ? 700 : 600,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" fontWeight="inherit" sx={{ fontSize: '0.7rem' }}>
                          {date.getDate()}
                        </Typography>
                      </Box>

                      {/* Indicadores de auditorías */}
                      {auditsOnDate.length > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.3,
                          width: '100%',
                          px: 0.3
                        }}>
                          {/* Primera auditoría como barra */}
                          <Box
                            sx={{
                              width: '100%',
                              height: 4,
                              bgcolor: theme.palette.primary.main,
                              borderRadius: 1,
                            }}
                          />
                          
                          {/* Segunda auditoría como barra */}
                          {auditsOnDate.length > 1 && (
                            <Box
                              sx={{
                                width: '100%',
                                height: 4,
                                bgcolor: alpha(theme.palette.primary.main, 0.6),
                                borderRadius: 1,
                              }}
                            />
                          )}
                          
                          {/* Contador si hay más */}
                          {auditsOnDate.length > 2 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: 'primary.main',
                                mt: 0.2
                              }}
                            >
                              +{auditsOnDate.length - 2}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ) : (
                    <Box sx={{ height: 70 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Leyenda Mobile */}
        <Box sx={{ mt: 2, px: 1 }}>
          <Typography variant="caption" color="textSecondary" gutterBottom display="block" fontWeight="600">
            Toca cualquier día con eventos para ver detalles
          </Typography>
        </Box>
      </Box>
    );
  };

  // Vista Desktop del Calendario
  const CalendarView = () => {
    const calendar = generateCalendar();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    return (
      <Box sx={{ mb: 4 }}>
        {/* Header del Calendario */}
        <Paper sx={{ p: 3, mb: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <CalendarToday />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="700" color="primary.main">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Calendario de Auditorías Programadas
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <IconButton 
                onClick={handlePreviousMonth}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <ChevronLeft />
              </IconButton>
              <Button 
                startIcon={<Today />}
                onClick={() => setCurrentMonth(new Date())}
                variant="contained"
                sx={{ minWidth: 120 }}
              >
                Hoy
              </Button>
              <IconButton 
                onClick={handleNextMonth}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Contenedor del Calendario */}
        <Paper sx={{ p: 2, borderRadius: 3, overflow: 'hidden' }}>
          {/* Encabezado de días */}
          <Box 
            display="grid" 
            gridTemplateColumns="repeat(7, 1fr)" 
            gap={1} 
            mb={1}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              p: 1.5
            }}
          >
            {dayNames.map(day => (
              <Box key={day} textAlign="center">
                <Typography 
                  variant="subtitle2" 
                  fontWeight="700" 
                  color="primary.main"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Grid del Calendario */}
          <Box 
            display="grid" 
            gridTemplateColumns="repeat(7, 1fr)" 
            gap={2}
            sx={{ minHeight: 600 }}
          >
            {calendar.map((date, index) => {
              const isToday = date && date.toDateString() === new Date().toDateString();
              const auditsOnDate = date ? getAuditsForDate(date) : [];
              
              return (
                <Box key={index} sx={{ position: 'relative' }}>
                  {date ? (
                    <Paper
                      elevation={auditsOnDate.length > 0 ? 3 : 1}
                      sx={{
                        height: '100%',
                        minHeight: 140,
                        p: 1.5,
                        borderRadius: 2,
                        cursor: auditsOnDate.length > 0 ? 'pointer' : 'default',
                        border: isToday ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: auditsOnDate.length > 0 
                          ? alpha(theme.palette.primary.main, 0.03) 
                          : 'background.paper',
                        transition: 'all 0.3s ease',
                        '&:hover': auditsOnDate.length > 0 ? {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        } : {},
                      }}
                      onClick={() => auditsOnDate.length > 0 && handleDateClick(date)}
                    >
                      {/* Número del día */}
                      <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center"
                        mb={1}
                      >
                        <Box
                          sx={{
                            width: isToday ? 32 : 28,
                            height: isToday ? 32 : 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isToday ? 'primary.main' : 'transparent',
                            color: isToday ? 'white' : 'text.primary',
                            fontWeight: isToday ? 700 : 600,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Typography variant="body2" fontWeight="inherit">
                            {date.getDate()}
                          </Typography>
                        </Box>
                        {auditsOnDate.length > 0 && (
                          <Chip
                            label={auditsOnDate.length}
                            size="small"
                            color="primary"
                            sx={{ 
                              height: 20, 
                              minWidth: 20,
                              '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 700 }
                            }}
                          />
                        )}
                      </Box>

                      {/* Lista de auditorías */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 0.5,
                        maxHeight: 90,
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.3),
                          borderRadius: 2,
                        }
                      }}>
                        {auditsOnDate.slice(0, 3).map((audit, idx) => (
                          <Tooltip 
                            key={idx} 
                            title={`${getDisplayTitle(audit)} - ${getDisplaySubtitle(audit)} - ${getDisplayLeader(audit)}`}
                            placement="top"
                          >
                            <Box
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  transform: 'translateX(2px)',
                                }
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                fontWeight="600"
                                sx={{ 
                                  display: 'block',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {getDisplayTitle(audit)}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ 
                                  display: 'block',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontSize: '0.65rem'
                                }}
                              >
                                {getDisplaySubtitle(audit)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ))}
                        {auditsOnDate.length > 3 && (
                          <Typography 
                            variant="caption" 
                            color="primary"
                            fontWeight="600"
                            sx={{ 
                              textAlign: 'center',
                              mt: 0.5,
                              fontSize: '0.7rem'
                            }}
                          >
                            +{auditsOnDate.length - 3} más
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  ) : (
                    <Box sx={{ height: '100%', minHeight: 140 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    );
  };

  // Estadísticas Mobile
  const MobileStatsOverview = () => (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <MobileStatCard>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Assignment fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {stats.total}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Total
                </Typography>
              </Box>
            </Box>
          </MobileStatCard>
        </Grid>
        <Grid item xs={6}>
          <MobileStatCard>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                <CheckCircle fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {stats.completed}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Completadas
                </Typography>
              </Box>
            </Box>
          </MobileStatCard>
        </Grid>
        <Grid item xs={6}>
          <MobileStatCard>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                <Pending fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {stats.pending}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Pendientes
                </Typography>
              </Box>
            </Box>
          </MobileStatCard>
        </Grid>
        <Grid item xs={6}>
          <MobileStatCard>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                <TrendingUp fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {stats.averageScore.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Promedio
                </Typography>
              </Box>
            </Box>
          </MobileStatCard>
        </Grid>
      </Grid>
    </Box>
  );

  // Estadísticas Desktop
  const StatsOverview = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <StyledCard>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
              <Assignment />
            </Avatar>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Auditorías
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StyledCard>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
              <CheckCircle />
            </Avatar>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Completadas
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StyledCard>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
              <Pending />
            </Avatar>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              {stats.pending}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pendientes
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StyledCard>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2 }}>
              <Warning />
            </Avatar>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              {stats.critical}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Críticas
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StyledCard>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
              <TrendingUp />
            </Avatar>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              {stats.averageScore.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Puntuación Media
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );

  // Card de Auditoría para Mobile
  const MobileAuditCard = ({ audit, onClick }) => (
    <StyledCard sx={{ mb: 2 }} onClick={() => onClick(audit)}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={1.5} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <Business fontSize="small" />
          </Avatar>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              {getDisplayTitle(audit)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {getDisplaySubtitle(audit)}
            </Typography>
          </Box>
          <IconButton size="small" color="primary">
            <ChevronRight />
          </IconButton>
        </Box>

        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Person fontSize="small" color="action" />
              <Typography variant="caption">
                {getDisplayLeader(audit)}
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              {getDisplayDuration(audit)}
            </Typography>
          </Box>

                  {audit._source === 'program' ? (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="textSecondary">
                        Estado
                      </Typography>
                      <StatusChip 
                        label={getDisplayStatus(audit)} 
                        status={getDisplayStatus(audit)}
                        size="small"
                      />
                    </Box>
                  ) : (
                    <>
                      {(audit.Estado === 'Finalizado' || audit.normalizedStatus === 'Realizada') && (
                        <>
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Typography variant="caption" color="textSecondary">
                                Resultado
                              </Typography>
                              <Typography variant="body2" fontWeight="700">
                                {getDisplayPercentage(audit)}
                              </Typography>
                            </Box>
                            <ProgressBar 
                              variant="determinate" 
                              value={parseFloat(audit.PorcentajeTotal) || 0} 
                              percentage={parseFloat(audit.PorcentajeTotal) || 0}
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="textSecondary">
                              Aceptabilidad
                            </Typography>
                            <AcceptabilityChip 
                              label={getAcceptability(audit.PorcentajeTotal)} 
                              acceptability={getAcceptability(audit.PorcentajeTotal)}
                              size="small"
                            />
                          </Box>
                        </>
                      )}

                      {audit.Estado !== 'Finalizado' && (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="textSecondary">
                            Estado
                          </Typography>
                          <StatusChip 
                            label={audit.Estado} 
                            status={audit.Estado}
                            size="small"
                          />
                        </Box>
                      )}
                    </>
                  )}
        </Box>
      </CardContent>
    </StyledCard>
  );

  // Drawer de Filtros Mobile
  const FilterDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80vh'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="700">
            Filtros
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>

        {tabValue === 1 ? (
          <Box display="flex" flexDirection="column" gap={2}>
                <FormControl fullWidth size="small">
                    <InputLabel>Año</InputLabel>
                    <Select
                      value={filters.year}
                      onChange={handleFilterChange}
                      label="Año"
                      name="year"
                    >
                      {[...new Set(auditorias.map(audit => {
                        const s = getStartDate(audit);
                        return s ? s.getFullYear() : null;
                      }).filter(Boolean))].map((year, index) => (
                        <MenuItem key={index} value={year.toString()}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Auditor Líder</InputLabel>
              <Select
                value={filters.auditorLider}
                onChange={handleFilterChange}
                label="Auditor Líder"
                name="auditorLider"
              >
                <MenuItem value="">Todos</MenuItem>
                {[...new Set(auditorias.map(audit => audit.AuditorLider))].map((auditorLider, index) => (
                  <MenuItem key={index} value={auditorLider}>
                    {auditorLider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Auditoría</InputLabel>
              <Select
                value={filters.tipoAuditoria}
                onChange={handleFilterChange}
                label="Tipo de Auditoría"
                name="tipoAuditoria"
              >
                <MenuItem value="">Todos</MenuItem>
                {[...new Set(auditorias.map(audit => audit.TipoAuditoria))].map((tipoAuditoria, index) => (
                  <MenuItem key={index} value={tipoAuditoria}>
                    {tipoAuditoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Aceptibilidad</InputLabel>
              <Select
                value={filters.aceptibilidad}
                onChange={handleFilterChange}
                label="Aceptibilidad"
                name="aceptibilidad"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Critico">Crítico</MenuItem>
                <MenuItem value="No aceptable">No aceptable</MenuItem>
                <MenuItem value="Aceptable">Aceptable</MenuItem>
                <MenuItem value="Bueno">Bueno</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Auditor Líder</InputLabel>
              <Select
                value={pendingFilters.auditorLider}
                onChange={handlePendingFilterChange}
                label="Auditor Líder"
                name="auditorLider"
              >
                <MenuItem value="">Todos</MenuItem>
                {[...new Set(pendingAudits.map(audit => audit.AuditorLider))].map((auditorLider, index) => (
                  <MenuItem key={index} value={auditorLider}>
                    {auditorLider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Auditoría</InputLabel>
              <Select
                value={pendingFilters.tipoAuditoria}
                onChange={handlePendingFilterChange}
                label="Tipo de Auditoría"
                name="tipoAuditoria"
              >
                <MenuItem value="">Todos</MenuItem>
                {[...new Set(pendingAudits.map(audit => audit.TipoAuditoria))].map((tipoAuditoria, index) => (
                  <MenuItem key={index} value={tipoAuditoria}>
                    {tipoAuditoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Inicio"
              value={pendingFilters.fechaInicio}
              onChange={(e) => setPendingFilters({...pendingFilters, fechaInicio: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Fin"
              value={pendingFilters.fechaFin}
              onChange={(e) => setPendingFilters({...pendingFilters, fechaFin: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}

        <Box display="flex" gap={2} mt={3}>
          <Button 
            variant="outlined" 
            fullWidth
            onClick={() => {
              if (tabValue === 1) {
                setFilters({
                  auditorLider: '',
                  tipoAuditoria: '',
                  departamento: '',
                  aceptibilidad: '',
                  year: new Date().getFullYear().toString()
                });
              } else {
                setPendingFilters({
                  auditorLider: '',
                  tipoAuditoria: '',
                  fechaInicio: '',
                  fechaFin: ''
                });
              }
            }}
          >
            Limpiar
          </Button>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => setFilterDrawerOpen(false)}
          >
            Aplicar
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: isMobile ? 2 : 4,
        px: isMobile ? 1 : 3,
        pb: isMobile ? 10 : 4
      }}
    >
      {/* Header Principal */}
      <Box sx={{ mb: isMobile ? 2 : 4, px: isMobile ? 1 : 0 }}>
        <Typography variant={isMobile ? "h4" : "h3"} fontWeight="700" gutterBottom>
          {isMobile ? "Auditorías" : "Calendario de Auditorías"}
        </Typography>
        <Typography variant={isMobile ? "body2" : "h6"} color="textSecondary">
          {isMobile ? "Gestión y seguimiento" : "Gestión y seguimiento de auditorías programadas"}
        </Typography>
      </Box>

      {/* Estadísticas */}
      {isMobile ? <MobileStatsOverview /> : <StatsOverview />}

      {/* Pestañas */}
      {!isMobile && (
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ px: 2 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<CalendarToday />} label="Calendario" iconPosition="start" />
              <Tab icon={<CheckCircle />} label="Realizadas" iconPosition="start" />
              <Tab icon={<Schedule />} label="Programadas" iconPosition="start" />
              <Tab icon={<EventBusy />} label="No ejecutada" iconPosition="start" />
              <Tab icon={<EventAvailable />} label="En Curso" iconPosition="start" />
              <Tab icon={<Pending />} label="Por Confirmar" iconPosition="start" />
            </Tabs>
          </Box>

          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {tabValue === 0 && (
              <Box display="flex" gap={1}>
                <Button
                  variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                  startIcon={<ViewModule />}
                  onClick={() => setViewMode('calendar')}
                >
                  Calendario
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  startIcon={<ViewWeek />}
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </Button>
              </Box>
            )}
            
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Buscar..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton>
                <FilterList />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Contenido según pestaña seleccionada */}
      {tabValue === 0 && (
        <>
          {isMobile ? <MobileCalendarView /> : (
            viewMode === 'calendar' ? <CalendarView /> : (
              <Typography variant="h6" textAlign="center" color="textSecondary" sx={{ py: 8 }}>
                Vista de lista en desarrollo...
              </Typography>
            )
          )}
        </>
      )}

      {tabValue === 1 && (
        <Box>
          {!isMobile && (
            <GradientCard sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros de Auditorías Realizadas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Año</InputLabel>
                    <Select
                      value={filters.year}
                      onChange={handleFilterChange}
                      label="Año"
                      name="year"
                    >
                      {[...new Set(auditorias.map(audit => {
                        const s = getStartDate(audit);
                        return s ? s.getFullYear() : null;
                      }).filter(Boolean))].map((year, index) => (
                        <MenuItem key={index} value={year.toString()}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Auditor Líder</InputLabel>
                    <Select
                      value={filters.auditorLider}
                      onChange={handleFilterChange}
                      label="Auditor Líder"
                      name="auditorLider"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {[...new Set(auditorias.map(audit => audit.AuditorLider))].map((auditorLider, index) => (
                        <MenuItem key={index} value={auditorLider}>
                          {auditorLider}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Auditoría</InputLabel>
                    <Select
                      value={filters.tipoAuditoria}
                      onChange={handleFilterChange}
                      label="Tipo de Auditoría"
                      name="tipoAuditoria"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {[...new Set(auditorias.map(audit => audit.TipoAuditoria))].map((tipoAuditoria, index) => (
                        <MenuItem key={index} value={tipoAuditoria}>
                          {tipoAuditoria}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Aceptibilidad</InputLabel>
                    <Select
                      value={filters.aceptibilidad}
                      onChange={handleFilterChange}
                      label="Aceptibilidad"
                      name="aceptibilidad"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="Critico">Crítico</MenuItem>
                      <MenuItem value="No aceptable">No aceptable</MenuItem>
                      <MenuItem value="Aceptable">Aceptable</MenuItem>
                      <MenuItem value="Bueno">Bueno</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </GradientCard>
          )}

          {isMobile ? (
            <Box>
              {getFilteredAudits().map((audit, index) => (
                <MobileAuditCard key={index} audit={audit} onClick={handleAuditClick} />
              ))}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {getFilteredAudits().map((audit, index) => (
                <Grid item xs={12} key={index}>
                  <StyledCard>
                    <CardContent>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <Business />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {getDisplayTitle(audit)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {getDisplaySubtitle(audit)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2" gutterBottom>
                            {getDisplayDuration(audit)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Duración
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                              <Person />
                            </Avatar>
                            <Typography variant="body2">
                              {getDisplayLeader(audit)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Box>
                            <Typography variant="body2" fontWeight="600" gutterBottom>
                              {getDisplayPercentage(audit)}
                            </Typography>
                            <ProgressBar 
                              variant="determinate" 
                              value={parseFloat(audit.PorcentajeTotal) || 0} 
                              percentage={parseFloat(audit.PorcentajeTotal) || 0}
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <AcceptabilityChip 
                            label={getAcceptability(audit.PorcentajeTotal)} 
                            acceptability={getAcceptability(audit.PorcentajeTotal)}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton 
                            color="primary"
                            onClick={() => handleAuditClick(audit)}
                          >
                            <Visibility />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          {!isMobile && (
            <GradientCard sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros de Auditorías Pendientes
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Auditor Líder</InputLabel>
                    <Select
                      value={pendingFilters.auditorLider}
                      onChange={handlePendingFilterChange}
                      label="Auditor Líder"
                      name="auditorLider"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {[...new Set(pendingAudits.map(audit => audit.AuditorLider))].map((auditorLider, index) => (
                        <MenuItem key={index} value={auditorLider}>
                          {auditorLider}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Auditoría</InputLabel>
                    <Select
                      value={pendingFilters.tipoAuditoria}
                      onChange={handlePendingFilterChange}
                      label="Tipo de Auditoría"
                      name="tipoAuditoria"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {[...new Set(pendingAudits.map(audit => audit.TipoAuditoria))].map((tipoAuditoria, index) => (
                        <MenuItem key={index} value={tipoAuditoria}>
                          {tipoAuditoria}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Fecha Inicio"
                    value={pendingFilters.fechaInicio}
                    onChange={(e) => setPendingFilters({...pendingFilters, fechaInicio: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Fecha Fin"
                    value={pendingFilters.fechaFin}
                    onChange={(e) => setPendingFilters({...pendingFilters, fechaFin: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </GradientCard>
          )}

          {isMobile ? (
            <Box>
              {getFilteredPendingAudits().map((audit, index) => (
                <MobileAuditCard key={index} audit={audit} onClick={handleAuditClick} />
              ))}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {getFilteredPendingAudits().map((audit, index) => (
                <Grid item xs={12} key={index}>
                  <StyledCard>
                    <CardContent>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              <Schedule />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {getDisplayTitle(audit)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {getDisplaySubtitle(audit)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2" gutterBottom>
                            {getDisplayDuration(audit)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Programada
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                              <Person />
                            </Avatar>
                            <Typography variant="body2">
                              {getDisplayLeader(audit)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <StatusChip 
                            label={getDisplayStatus(audit)} 
                            status={getDisplayStatus(audit)}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2" gutterBottom>
                            {getStartDate(audit) ? getStartDate(audit).toLocaleDateString() : ''}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Inicio
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton 
                            color="primary"
                            onClick={() => handleAuditClick(audit)}
                          >
                            <Visibility />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Navegación inferior para móvil */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={tabValue}
            onChange={(event, newValue) => setTabValue(newValue)}
            showLabels
            sx={{ height: 70, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          >
            <BottomNavigationAction 
              label="Calendario" 
              icon={<CalendarToday />}
            />
            <BottomNavigationAction 
              label="Realizadas" 
              icon={<CheckCircle />}
            />
            <BottomNavigationAction 
              label="Pendientes" 
              icon={<Pending />}
            />
          </BottomNavigation>
        </Paper>
      )}

      {/* Botón flotante */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 90 : 24,
          right: isMobile ? 16 : 24,
          zIndex: 999
        }}
        size={isMobile ? "medium" : "large"}
      >
        <Add />
      </Fab>

      {/* Botón de filtro flotante para móvil */}
      {isMobile && (tabValue === 1 || tabValue === 2) && (
        <Fab
          color="secondary"
          aria-label="filter"
          sx={{
            position: 'fixed',
            bottom: isMobile ? 90 : 24,
            left: isMobile ? 16 : 24,
            zIndex: 999
          }}
          size="medium"
          onClick={() => setFilterDrawerOpen(true)}
        >
          <FilterList />
        </Fab>
      )}

      {/* Drawer de filtros */}
      <FilterDrawer />

      {/* Diálogo de detalle */}
      <AuditDetailDialog />
    </Container>
  );
};

export default AuditCalendar;