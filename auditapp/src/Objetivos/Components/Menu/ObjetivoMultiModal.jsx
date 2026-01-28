import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Divider,
  Container,
  Stack
} from '@mui/material';
import {
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Folder as FolderIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const ObjetivosMultiTabla = () => {
  const location = useLocation();
  const { area } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredObjetivos, setFilteredObjetivos] = useState([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  const [showOnlySelectedModule, setShowOnlySelectedModule] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const areaFromState = location.state?.area;
  const objetivosFromState = location.state?.objetivos || [];
  const moduloFromState = location.state?.modulo;
  const mostrarSoloModulo = location.state?.mostrarSoloModulo || false;
  
  console.log('📥 Estado recibido:', {
    areaFromState,
    moduloFromState,
    mostrarSoloModulo,
    objetivosCount: objetivosFromState.length
  });

  useEffect(() => {
    const cargarObjetivos = async () => {
      setLoading(true);
      try {
        // Si ya tenemos objetivos en el estado, usarlos
        if (objetivosFromState && objetivosFromState.length > 0) {
          console.log('📊 Usando objetivos del estado:', objetivosFromState.length);
          setObjetivos(objetivosFromState);
          setFilteredObjetivos(objetivosFromState);
          
          // Si hay un módulo específico en el estado, aplicamos filtro
          if (moduloFromState && mostrarSoloModulo) {
            console.log('🎯 Filtrando por módulo:', moduloFromState);
            const filtered = objetivosFromState.filter(obj => 
              obj.objetivoEspecifico === moduloFromState
            );
            setFilteredObjetivos(filtered);
            setModuloSeleccionado(moduloFromState);
            setShowOnlySelectedModule(true);
          }
        } else {
          // Si no hay objetivos en el estado, cargarlos del servidor
          console.log('🔍 Cargando objetivos del servidor para área:', area);
          const response = await api.get(`/api/objetivos/multi/area?area=${area}`);
          const data = response.data || [];
          console.log('✅ Objetivos cargados:', data.length);
          
          setObjetivos(data);
          setFilteredObjetivos(data);
        }
      } catch (error) {
        console.error('❌ Error al cargar objetivos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarObjetivos();
  }, [area, objetivosFromState, moduloFromState, mostrarSoloModulo]);

  // Efecto para búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar según filtro de módulo
      if (moduloSeleccionado) {
        const filtered = objetivos.filter(obj => obj.objetivoEspecifico === moduloSeleccionado);
        setFilteredObjetivos(filtered);
      } else {
        setFilteredObjetivos(objetivos);
      }
    } else {
      // Filtrar por término de búsqueda
      const searchLower = searchTerm.toLowerCase();
      let filtered = objetivos;
      
      // Aplicar filtro de módulo primero si existe
      if (moduloSeleccionado) {
        filtered = filtered.filter(obj => obj.objetivoEspecifico === moduloSeleccionado);
      }
      
      // Luego aplicar búsqueda
      filtered = filtered.filter(obj => 
        (obj.objetivoGeneral && obj.objetivoGeneral.toLowerCase().includes(searchLower)) ||
        (obj.objetivoEspecifico && obj.objetivoEspecifico.toLowerCase().includes(searchLower)) ||
        (obj.objetivoDescripcion && obj.objetivoDescripcion.toLowerCase().includes(searchLower)) ||
        (obj.departamento && obj.departamento.toLowerCase().includes(searchLower))
      );
      
      setFilteredObjetivos(filtered);
    }
  }, [searchTerm, objetivos, moduloSeleccionado]);

  // Extraer módulos únicos de los objetivos
  const modulosUnicos = [...new Set(objetivos.map(obj => obj.objetivoEspecifico || 'Sin módulo'))]
    .filter(modulo => modulo)
    .sort();

  const handleFilterByModule = (modulo) => {
    if (moduloSeleccionado === modulo) {
      // Si ya está seleccionado, quitar filtro
      setModuloSeleccionado(null);
      setShowOnlySelectedModule(false);
      setSearchTerm(''); // Limpiar búsqueda también
    } else {
      // Aplicar filtro
      setModuloSeleccionado(modulo);
      setShowOnlySelectedModule(true);
      setSearchTerm(''); // Limpiar búsqueda también
    }
  };

  const handleClearFilter = () => {
    setModuloSeleccionado(null);
    setShowOnlySelectedModule(false);
    setSearchTerm('');
  };

  const handleNavigateToObjective = (objetivo) => {
    navigate(`/objetivos/${objetivo._id}`, {
      state: {
        esMultiDepartamento: true,
        objetivoGeneral: objetivo.objetivoGeneral,
        area: objetivo.area,
        departamento: objetivo.departamento,
        objetivoId: objetivo._id,
        objetivoEspecificoId: objetivo.objetivoEspecificoId
      }
    });
  };

  const handleGoBack = () => {
    navigate('/menu');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando objetivos...
        </Typography>
      </Box>
    );
  }

  const effectiveArea = areaFromState || area;

  return (
    <Container maxWidth="xl" sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header centrado */}
      <Box sx={{ 
        mb: 4, 
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Botón de regreso centrado arriba */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mb: 2 
        }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            variant="outlined"
            size="small"
            sx={{ borderRadius: '20px', px: 3 }}
          >
            Volver al Menú
          </Button>
        </Box>

        {/* Título principal */}
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          gutterBottom
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}
        >
          Objetivos Multi-Departamento
        </Typography>

        {/* Área actual */}
        <Typography variant="h6" color="primary" gutterBottom>
          <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Área: {effectiveArea}
        </Typography>

        {/* Contadores y filtros centrados */}
        <Stack 
          direction="row" 
          spacing={2} 
          justifyContent="center" 
          alignItems="center"
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >
          <Chip
            icon={<ViewListIcon />}
            label={`Total: ${objetivos.length}`}
            color="primary"
            variant="outlined"
          />
          
          {filteredObjetivos.length !== objetivos.length && (
            <Chip
              icon={<ViewModuleIcon />}
              label={`Mostrando: ${filteredObjetivos.length}`}
              color="secondary"
              onDelete={handleClearFilter}
            />
          )}
        </Stack>

        {/* Barra de búsqueda centrada */}
        <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '30px',
              boxShadow: 2,
              overflow: 'hidden'
            }}
          >
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <TextField
              fullWidth
              placeholder="Buscar en objetivos..."
              variant="standard"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                disableUnderline: true,
                style: { fontSize: '0.95rem' }
              }}
              sx={{ ml: 1, flex: 1 }}
            />
            {searchTerm && (
              <IconButton onClick={() => setSearchTerm('')}>
                <FilterListOffIcon />
              </IconButton>
            )}
          </Paper>
        </Box>

        {/* Filtros por módulo - CENTRADO */}
        {modulosUnicos.length > 0 && (
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            maxWidth: '100%',
            mx: 'auto',
            background: theme.palette.background.default,
            borderRadius: 2,
            boxShadow: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
              <FilterListIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" color="textSecondary" fontWeight="medium">
                Filtrar por Módulo:
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              justifyContent: 'center'
            }}>
              {modulosUnicos.map((modulo, index) => (
                <Chip
                  key={index}
                  label={modulo}
                  color={moduloSeleccionado === modulo ? "secondary" : "default"}
                  variant={moduloSeleccionado === modulo ? "filled" : "outlined"}
                  onClick={() => handleFilterByModule(modulo)}
                  sx={{ 
                    mb: 0.5,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                />
              ))}
              
              {(moduloSeleccionado || searchTerm) && (
                <Chip
                  label="Limpiar filtros"
                  color="default"
                  variant="outlined"
                  onClick={handleClearFilter}
                  icon={<FilterListOffIcon />}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                />
              )}
            </Box>

            {/* Indicador de filtro activo */}
            {(moduloSeleccionado || searchTerm) && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
              >
                <Typography variant="body2">
                  {moduloSeleccionado && `Filtrado por módulo: "${moduloSeleccionado}"`}
                  {moduloSeleccionado && searchTerm && ' y '}
                  {searchTerm && `Búsqueda: "${searchTerm}"`}
                  {` (${filteredObjetivos.length} resultados)`}
                </Typography>
              </Alert>
            )}
          </Paper>
        )}
      </Box>

      {/* Tabla de objetivos */}
      {filteredObjetivos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Alert 
            severity="info" 
            sx={{ 
              maxWidth: 500, 
              mx: 'auto',
              borderRadius: 2
            }}
          >
            <Typography variant="body1">
              {moduloSeleccionado 
                ? `No hay objetivos en el módulo "${moduloSeleccionado}"`
                : searchTerm
                ? `No se encontraron resultados para "${searchTerm}"`
                : 'No hay objetivos disponibles para esta área'}
            </Typography>
            {(moduloSeleccionado || searchTerm) && (
              <Button 
                variant="text" 
                onClick={handleClearFilter}
                sx={{ mt: 1 }}
              >
                Limpiar filtros
              </Button>
            )}
          </Alert>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.dark 
                  : theme.palette.primary.light,
                '& th': {
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.contrastText,
                  borderBottom: 'none'
                }
              }}>
                <TableCell align="center">#</TableCell>
                <TableCell>Objetivo General</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Objetivo Específico</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredObjetivos.map((objetivo, index) => (
                <TableRow 
                  key={index}
                  hover
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: theme.palette.action.hover,
                      cursor: 'pointer'
                    },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                  onClick={() => handleNavigateToObjective(objetivo)}
                >
                  <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {objetivo.objetivoGeneral || 'Sin nombre'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={objetivo.objetivoEspecifico || 'Sin módulo'}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={objetivo.objetivoDescripcion || ''}>
                      <Typography variant="body2" noWrap>
                        {objetivo.objetivoDescripcion?.substring(0, 80) || 'Sin descripción'}...
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={objetivo.departamento || objetivo.area}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToObjective(objetivo);
                      }}
                      sx={{ 
                        borderRadius: '20px',
                        px: 2,
                        textTransform: 'none',
                        fontWeight: 'medium'
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Resumen estadístico centrado */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.action.hover} 100%)`,
        maxWidth: '100%',
        mx: 'auto'
      }}>
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          gutterBottom
          align="center"
          sx={{ color: theme.palette.primary.main }}
        >
          Resumen Estadístico
        </Typography>
        
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: theme.palette.primary.light + '20',
                border: `1px solid ${theme.palette.primary.light}`
              }}
            >
              <Typography variant="caption" color="textSecondary" display="block">
                Total de Objetivos
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {objetivos.length}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: theme.palette.secondary.light + '20',
                border: `1px solid ${theme.palette.secondary.light}`
              }}
            >
              <Typography variant="caption" color="textSecondary" display="block">
                Módulos Distintos
              </Typography>
              <Typography variant="h5" color="secondary" fontWeight="bold">
                {modulosUnicos.length}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: theme.palette.success.light + '20',
                border: `1px solid ${theme.palette.success.light}`
              }}
            >
              <Typography variant="caption" color="textSecondary" display="block">
                Mostrando
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {filteredObjetivos.length}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: moduloSeleccionado 
                  ? theme.palette.warning.light + '20' 
                  : theme.palette.grey[100],
                border: `1px solid ${moduloSeleccionado ? theme.palette.warning.light : theme.palette.grey[300]}`
              }}
            >
              <Typography variant="caption" color="textSecondary" display="block">
                Filtro Activo
              </Typography>
              <Typography 
                variant="h5" 
                color={moduloSeleccionado ? "warning.main" : "text.secondary"} 
                fontWeight="bold"
              >
                {moduloSeleccionado ? 'Sí' : 'No'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer con botón centrado */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          variant="outlined"
          sx={{ 
            borderRadius: '20px', 
            px: 4,
            py: 1,
            fontWeight: 'medium'
          }}
        >
          Volver al Menú Principal
        </Button>
        
        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 2 }}>
          {moduloSeleccionado 
            ? `Viendo objetivos del módulo: "${moduloSeleccionado}"`
            : 'Viendo todos los objetivos del área'}
        </Typography>
      </Box>
    </Container>
  );
};

export default ObjetivosMultiTabla;