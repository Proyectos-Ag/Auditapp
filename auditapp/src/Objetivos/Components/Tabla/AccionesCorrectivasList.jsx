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
  InputAdornment,
  Grid,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
  AppBar,
  Toolbar,
  Divider,
  LinearProgress,
  Avatar
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
  Assignment,
  DateRange,
  Group,
  ExpandMore,
  ViewModule,
  ViewList,
  Download,
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
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('fecha');

  // Función para manejar fechas
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
      case '0%': return { main: '#dc2626', light: '#fef2f2' };
      case '25%': return { main: '#d97706', light: '#fffbeb' };
      case '50%': return { main: '#16a34a', light: '#f0fdf4' };
      case '75%': return { main: '#0284c7', light: '#eff6ff' };
      case '100%': return { main: '#065f46', light: '#f0fdf9' };
      default: return { main: '#475569', light: '#f8fafc' };
    }
  };

  // Componente para la vista móvil en Grid
  const MobileGridView = () => (
    <Grid container spacing={2}>
      {loading ? (
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>
              Cargando acciones...
            </Typography>
          </Box>
        </Grid>
      ) : paginatedAcciones.length === 0 ? (
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              No se encontraron acciones
            </Typography>
          </Box>
        </Grid>
      ) : (
        paginatedAcciones.map((accion) => {
          const statusColors = getStatusColor(accion.efectividad);
          return (
            <Grid item xs={12} key={accion._id}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        #{accion.noObjetivo || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {accion.periodo || 'N/A'}
                      </Typography>
                    </Box>
                    <Chip
                      label={accion.efectividad?.replace('indicador', '') || '0%'}
                      size="small"
                      sx={{
                        backgroundColor: statusColors.light,
                        color: statusColors.main,
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 2 }}>
                    {accion.acciones?.substring(0, 100) || 'Sin descripción'}...
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {accion.fecha || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: 'success.main' }} />
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                          {accion.fichaCompromiso || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {accion.responsable?.nombre || 'Sin responsable'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(accion)}
                      sx={{ flex: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={() => handleOpenReschedule(accion)}
                      sx={{ flex: 1 }}
                    >
                      Reprogramar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })
      )}
    </Grid>
  );

  // Componente para la vista móvil en Lista (Acordeón)
  const MobileListView = () => (
    <Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Cargando acciones...
          </Typography>
        </Box>
      ) : paginatedAcciones.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: 'text.secondary' }}>
            No se encontraron acciones
          </Typography>
        </Box>
      ) : (
        paginatedAcciones.map((accion) => {
          const statusColors = getStatusColor(accion.efectividad);
          return (
            <Card key={accion._id} sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: statusColors.main 
                    }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        #{accion.noObjetivo} - {accion.periodo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 12 }} />
                        {accion.fecha}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={accion.efectividad?.replace('indicador', '') || '0%'}
                    size="small"
                    sx={{
                      backgroundColor: statusColors.light,
                      color: statusColors.main,
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: 'text.primary', mb: 2 }}>
                  {accion.acciones}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Compromiso
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                        {accion.fichaCompromiso || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Responsable
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {accion.responsable?.nombre || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(accion)}
                    sx={{ flex: 1 }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                    onClick={() => handleOpenReschedule(accion)}
                    sx={{ flex: 1 }}
                  >
                    Reprogramar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );

  useEffect(() => {
    fetchAcciones();
  }, [label]);

  return (
    <Box sx={{ minHeight: '100vh', pb: isMobile ? 8 : 4 }}>
      

      {/* Main Content */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
            Panel de Control
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Gestión y seguimiento de acciones del área {label}
          </Typography>
        </Box>

       {/* Stats Grid */}
<Grid container spacing={1.5} sx={{ mb: { xs: 2, md: 3 } }}>
  <Grid item xs={6} sm={3}>
    <Card sx={{ borderRadius: 1, boxShadow: 0, border: '1px solid #e2e8f0', p: 1.5, minHeight: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>
          Total
        </Typography>
        <Assignment sx={{ color: '#3b82f6', fontSize: 18 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem', lineHeight: 1.2 }}>
        {stats.total}
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={100} 
        sx={{ height: 1.5, borderRadius: 0.5, backgroundColor: '#f1f5f9', mt: 1 }}
      />
    </Card>
  </Grid>

  <Grid item xs={6} sm={3}>
    <Card sx={{ borderRadius: 1, boxShadow: 0, border: '1px solid #e2e8f0', p: 1.5, minHeight: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>
          Hechas
        </Typography>
        <CheckCircle sx={{ color: '#10b981', fontSize: 18 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem', lineHeight: 1.2 }}>
        {stats.completadas}
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={stats.total ? (stats.completadas / stats.total) * 100 : 0} 
        sx={{ 
          height: 1.5, 
          borderRadius: 0.5,
          backgroundColor: '#f1f5f9',
          mt: 1,
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#10b981'
          }
        }}
      />
    </Card>
  </Grid>

  <Grid item xs={6} sm={3}>
    <Card sx={{ borderRadius: 1, boxShadow: 0, border: '1px solid #e2e8f0', p: 1.5, minHeight: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>
          Reprog.
        </Typography>
        <Refresh sx={{ color: '#f59e0b', fontSize: 18 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem', lineHeight: 1.2 }}>
        {stats.reprogramadas}
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={stats.total ? (stats.reprogramadas / stats.total) * 100 : 0} 
        sx={{ 
          height: 1.5, 
          borderRadius: 0.5,
          backgroundColor: '#f1f5f9',
          mt: 1,
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#f59e0b'
          }
        }}
      />
    </Card>
  </Grid>

  <Grid item xs={6} sm={3}>
    <Card sx={{ borderRadius: 1, boxShadow: 0, border: '1px solid #e2e8f0', p: 1.5, minHeight: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>
          Pendientes
        </Typography>
        <Schedule sx={{ color: '#ef4444', fontSize: 18 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem', lineHeight: 1.2 }}>
        {stats.pendientes}
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={stats.total ? (stats.pendientes / stats.total) * 100 : 0} 
        sx={{ 
          height: 1.5, 
          borderRadius: 0.5,
          backgroundColor: '#f1f5f9',
          mt: 1,
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#ef4444'
          }
        }}
      />
    </Card>
  </Grid>
</Grid>

        {/* Controls */}
        <Card sx={{ borderRadius: 2, boxShadow: 1, p: 3, mb: { xs: 3, md: 4 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar acciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="fecha">Por Fecha</MenuItem>
                  <MenuItem value="efectividad">Por Efectividad</MenuItem>
                  <MenuItem value="responsable">Por Responsable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={3}>
              {isMobile && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('grid')}
                    size="small"
                    startIcon={<ViewModule />}
                    sx={{ flex: 1 }}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('list')}
                    size="small"
                    startIcon={<ViewList />}
                    sx={{ flex: 1 }}
                  >
                    Lista
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Card>

        {/* Content */}
        <Card sx={{ borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          {/* Desktop Table */}
          {!isMobile ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                        ID & Periodo
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                        Acciones
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                        Fechas
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                        Responsable
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                        Estado
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                            Cargando acciones...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginatedAcciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography sx={{ color: 'text.secondary' }}>
                            No se encontraron acciones
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAcciones.map((accion) => {
                        const statusColors = getStatusColor(accion.efectividad);
                        return (
                          <TableRow key={accion._id} hover>
                            <TableCell sx={{ py: 3 }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                                  #{accion.noObjetivo || 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {accion.periodo || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 3 }}>
                              <Typography variant="body2" sx={{ color: '#475569' }}>
                                {accion.acciones || 'Sin descripción'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 3 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarToday sx={{ fontSize: 14, color: '#94a3b8' }} />
                                  <Typography variant="body2" sx={{ color: '#475569' }}>
                                    {accion.fecha || 'N/A'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarToday sx={{ fontSize: 14, color: '#10b981' }} />
                                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }}>
                                    {accion.fichaCompromiso || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 3 }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', mb: 0.5 }}>
                                  {accion.responsable?.nombre || 'Sin responsable'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {accion.responsable?.email || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 3 }}>
                              <Chip
                                label={accion.efectividad?.replace('indicador', '') || '0%'}
                                size="small"
                                sx={{
                                  backgroundColor: statusColors.light,
                                  color: statusColors.main,
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 3 }}>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(accion)}
                                  sx={{ color: '#3b82f6' }}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenReschedule(accion)}
                                  sx={{ color: '#10b981' }}
                                >
                                  <Refresh />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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
                sx={{ borderTop: '1px solid #e2e8f0' }}
              />
            </>
          ) : (
            // Mobile View
            <Box sx={{ p: 2 }}>
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
                />
              )}
            </Box>
          )}
        </Card>
      </Box>

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => !saving && setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Edit sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Editar Acción #{selectedAccion?.noObjetivo}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => !saving && setEditModalOpen(false)}
              disabled={saving}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Responsable"
                value={editData.responsable?.nombre || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  responsable: { ...editData.responsable, nombre: e.target.value }
                })}
                disabled={saving}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editData.responsable?.email || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  responsable: { ...editData.responsable, email: e.target.value }
                })}
                disabled={saving}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Efectividad</InputLabel>
                <Select
                  value={editData.efectividad || '0%'}
                  onChange={(e) => setEditData({...editData, efectividad: e.target.value})}
                  disabled={saving}
                  label="Efectividad"
                >
                  <MenuItem value="0%">0% - No iniciado</MenuItem>
                  <MenuItem value="25%">25% - En progreso</MenuItem>
                  <MenuItem value="50%">50% - A la mitad</MenuItem>
                  <MenuItem value="75%">75% - Casi terminado</MenuItem>
                  <MenuItem value="100%">100% - Completado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Periodo"
                value={selectedAccion?.periodo || ''}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Acciones"
                multiline
                rows={3}
                value={editData.acciones || ''}
                onChange={(e) => setEditData({...editData, acciones: e.target.value})}
                disabled={saving}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={editData.observaciones || ''}
                onChange={(e) => setEditData({...editData, observaciones: e.target.value})}
                disabled={saving}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button 
            variant="outlined"
            onClick={() => setEditModalOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained"
            onClick={handleSaveEdit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog
        open={rescheduleModalOpen}
        onClose={() => !saving && setRescheduleModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Refresh sx={{ color: '#10b981' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Reprogramar Fecha
              </Typography>
            </Box>
            <IconButton 
              onClick={() => !saving && setRescheduleModalOpen(false)}
              disabled={saving}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
              Fecha Actual de Compromiso
            </Typography>
            <Typography variant="body1" sx={{ color: '#059669', fontWeight: 500 }}>
              {selectedAccion?.fichaCompromiso || 'N/A'}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Nueva Fecha de Compromiso"
            type="date"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            disabled={saving}
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
          />

          {selectedAccion?.historialFechas && selectedAccion.historialFechas.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2 }}>
                Historial de Reprogramaciones
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedAccion.historialFechas.map((fecha, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      py: 1,
                      px: 2,
                      borderRadius: 1,
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {fecha}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small"
                      sx={{ backgroundColor: '#e2e8f0', color: '#475569' }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button 
            variant="outlined"
            onClick={() => setRescheduleModalOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained"
            onClick={handleReprogramar}
            disabled={!nuevaFecha || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {saving ? 'Reprogramando...' : 'Confirmar Reprogramación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaAccionFrecu;