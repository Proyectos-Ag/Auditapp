import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../../App';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
  styled,
  Slide,
  Fade,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItemButton
} from '@mui/material';
import {
  Close as CloseIcon,
  VerifiedUser as VerifiedUserIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  GroupWork as GroupWorkIcon,
  Engineering as EngineeringIcon,
  LocalShipping as LocalShippingIcon,
  PestControl as PestControlIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  PrecisionManufacturing as PrecisionManufacturingIcon,
  Scale as ScaleIcon,
  Factory as FactoryIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  FindInPage as FindInPageIcon,
  GppGood as GppGoodIcon,
  People as PeopleIcon,
  Computer as ComputerIcon,
  AllInbox as AllInboxIcon,
  MenuBook as MenuBookIcon,
  FolderSpecial as FolderSpecialIcon,
  CollectionsBookmark as CollectionsBookmarkIcon,
  ExpandLess,
  ExpandMore,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AcUnit as EcoIcon } from '@mui/icons-material';

// ✅ Función para normalizar texto (eliminar acentos, convertir a minúsculas)
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize("NFD") // Descomponer acentos
    .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
    .toLowerCase()
    .trim();
};

// ✅ Función para comparar áreas ignorando mayúsculas/minúsculas y acentos
const compareAreas = (area1, area2) => {
  return normalizeText(area1) === normalizeText(area2);
};

// Íconos personalizados para cada área
const areaIcons = {
  "CONTROL Y CUIDADO AMBIENTAL": <EcoIcon fontSize="medium" />,
  "EMBARQUE": <LocalShippingIcon fontSize="medium" />,
  "MANTENIMIENTO SERVICIOS": <EngineeringIcon fontSize="medium" />,
  "SEGURIDAD E HIGIENE Y SANIDAD": <HealthAndSafetyIcon fontSize="medium" />,
  "INGENIERÍA": <PrecisionManufacturingIcon fontSize="medium" />,
  "COORDINADOR DE MATERIA PRIMA": <AllInboxIcon fontSize="medium" />,
  "GERENCIA PLANEACIÓN Y LOGÍSTICA": <GroupWorkIcon fontSize="medium" />,
  "MANTENIMIENTO TETRA PAK": <EngineeringIcon fontSize="medium" />,
  "CONTROL DE PLAGAS": <PestControlIcon fontSize="medium" />,
  "AGUIDA": <MenuBookIcon fontSize="medium" />,
  "PESADAS": <ScaleIcon fontSize="medium" />,
  "PRODUCCIÓN": <FactoryIcon fontSize="medium" />,
  "ASEGURAMIENTO DE CALIDAD": <CheckCircleIcon fontSize="medium" />,
  "COMPRAS": <ShoppingCartIcon fontSize="medium" />,
  "ADMINISTRADOR": <AdminPanelSettingsIcon fontSize="medium" />,
  "REVISIÓN": <FindInPageIcon fontSize="medium" />,
  "VALIDACIÓN": <GppGoodIcon fontSize="medium" />,
  "LIBERACIÓN DE PT": <AssignmentTurnedInIcon fontSize="medium" />,
  "RECURSOS HUMANOS": <PeopleIcon fontSize="medium" />,
  "SISTEMAS": <ComputerIcon fontSize="medium" />,
  "CALIDAD E INOCUIDAD": <VerifiedUserIcon fontSize="medium" />
};

// Menús estáticos originales - AHORA CON ÁREAS NORMALIZADAS EN LAS COMPARACIONES
const menuItemsEstaticos = [
  { 
    label: "CONTROL Y CUIDADO AMBIENTAL", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["CONTROL Y CUIDADO AMBIENTAL", "CONTROL DE PLAGAS", "Control y Cuidado Ambiental"] 
  },
  { 
    label: "EMBARQUE", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["EMBARQUE", "REVISIÓN", "PRODUCTO TERMINADO", "Planeación y Logística"] 
  },
  { 
    label: "MANTENIMIENTO SERVICIOS", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["MANTENIMIENTO SERVICIOS", "Mantenimiento Procesos"] 
  },
  { 
    label: "SEGURIDAD E HIGIENE Y SANIDAD", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["SEGURIDAD E HIGIENE Y SANIDAD", "CONTROL DE PLAGAS", "Seguridad e Higiene y Sanidad"] 
  },
  { 
    label: "INGENIERÍA", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["INGENIERÍA", "Ingeniería"] 
  },
  { 
    label: "COORDINADOR DE MATERIA PRIMA", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["COORDINADOR DE MATERIA PRIMA", "MATERIA PRIMA"] 
  },
  { 
    label: "GERENCIA PLANEACIÓN Y LOGÍSTICA", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["GERENCIA PLANEACIÓN Y LOGÍSTICA", "Planeación y Logística", "PL MATERIA PRIMA"] 
  },
  { 
    label: "MANTENIMIENTO TETRA PAK", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["MANTENIMIENTO TETRA PAK", "Mantenimiento Tetra"] 
  },
  { 
    label: "CONTROL DE PLAGAS", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["CONTROL DE PLAGAS", "SEGURIDAD E HIGIENE Y SANIDAD", "Seguridad e Higiene y Sanidad"] 
  },
  { 
    label: "AGUIDA", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["AGUIDA"] 
  },
  { 
    label: "PESADAS", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["PESADAS"] 
  },
  { 
    label: "PRODUCCIÓN", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["PRODUCCIÓN","Producción"] 
  },
  { 
    label: "ASEGURAMIENTO DE CALIDAD", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["ASEGURAMIENTO DE CALIDAD", "LIBERACIÓN DE PT"] 
  },
  { 
    label: "COMPRAS", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["COMPRAS", "Compras"] 
  },
  { 
    label: "ADMINISTRADOR", 
    roles: ["administrador"], 
    areas: ["ADMINISTRADOR"] 
  },
  { 
    label: "REVISIÓN", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["REVISIÓN", "EMBARQUE", "PRODUCTO TERMINADO", "Planeación y Logística"] 
  },
  { 
    label: "VALIDACIÓN", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["VALIDACIÓN", "Producción.", "Validación","PRODUCCIÓN."] 
  },
  { 
    label: "LIBERACIÓN DE PT", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["LIBERACIÓN DE PT", "ASEGURAMIENTO DE CALIDAD"] 
  },
  { 
    label: "RECURSOS HUMANOS", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["RECURSOS HUMANOS"] 
  },
  { 
    label: "SISTEMAS", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["SISTEMAS"] 
  },
  { 
    label: "CALIDAD E INOCUIDAD", 
    roles: ["administrador", "auditor", "auditado"], 
    areas: ["CONTROL Y CUIDADO AMBIENTAL", "EMBARQUE", "MANTENIMIENTO SERVICIOS", "SEGURIDAD E HIGIENE Y SANIDAD", "INGENIERÍA", "COORDINADOR DE MATERIA PRIMA", "GERENCIA PLANEACIÓN Y LOGÍSTICA", "MANTENIMIENTO TETRA PAK", "CONTROL DE PLAGAS", "AGUIDA", "PESADAS", "PRODUCCIÓN", "ASEGURAMIENTO DE CALIDAD", "COMPRAS", "ADMINISTRADOR", "REVISIÓN", "VALIDACIÓN", "LIBERACIÓN DE PT", "RECURSOS HUMANOS", "SAFETY GOALS"] 
  }
];

const StyledMenuItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '100px',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.primary.dark 
      : theme.palette.primary.light,
    '& .MuiTypography-root': {
      color: theme.palette.getContrastText(
        theme.palette.mode === 'dark' 
          ? theme.palette.primary.dark 
          : theme.palette.primary.light
      )
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.getContrastText(
        theme.palette.mode === 'dark' 
          ? theme.palette.primary.dark 
          : theme.palette.primary.light
      )
    }
  }
}));

const StyledGroupedMenuItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '120px',
  border: `2px solid ${theme.palette.secondary.main}`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.secondary.dark 
    : theme.palette.secondary.light + '20',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[6],
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.secondary.dark 
      : theme.palette.secondary.light + '40',
  }
}));

// ✅ NUEVO: Dialog centrado en lugar de Drawer lateral
const SubMenuDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.shape.borderRadius * 3,
    maxWidth: 600,
    width: '90%',
    maxHeight: '80vh',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
    boxShadow: theme.shadows[10]
  },
}));

const StyledSubMenuItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: 'translateX(5px)',
    boxShadow: theme.shadows[4],
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.primary.dark + '40'
      : theme.palette.primary.light + '40',
    borderColor: theme.palette.primary.main,
  }
}));

const MenuByRoleAndArea = () => {
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [menuItemsDinamicos, setMenuItemsDinamicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [objetivosAgrupados, setObjetivosAgrupados] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ✅ Cargar objetivos multi-departamento dinámicos
  useEffect(() => {
    const cargarObjetivosMultiDepartamento = async () => {
      if (!userData || !userData.TipoUsuario) {
        setLoading(false);
        return;
      }

      const tipoUsuario = userData.TipoUsuario.toLowerCase();
      const esAdministrador = tipoUsuario === 'administrador' || tipoUsuario === 'invitado';

      try {
        let objetivosMulti = [];

        if (esAdministrador) {
          // ✅ ADMINISTRADOR: Obtener TODOS los objetivos
          console.log('🔍 Administrador: Cargando TODOS los objetivos');
          try {
            const responseTodos = await api.get('/api/objetivos?area=ALL');
            objetivosMulti = responseTodos.data.filter(obj => 
              obj.nombreObjetivoGeneral && obj.objetivosEspecificos
            );
            console.log('✅ Objetivos multi-departamento encontrados para admin:', objetivosMulti.length);
          } catch (error) {
            console.error('❌ Error al obtener objetivos para admin:', error);
            objetivosMulti = [];
          }
        } else {
          // ✅ USUARIO NORMAL: Obtener solo objetivos de su área
          if (!userData.area) {
            console.warn('⚠️ Usuario normal sin área asignada');
            setLoading(false);
            return;
          }
          console.log('🔍 Usuario normal: Buscando objetivos para área:', userData.area);
          try {
            const responseMulti = await api.get(`/api/objetivos/multi/area?area=${userData.area}`);
            objetivosMulti = responseMulti.data.map(item => ({
              nombreObjetivoGeneral: item.objetivoGeneral || item.label,
              objetivosEspecificos: [{
                area: item.area,
                departamento: item.departamento,
                objetivo: item.objetivo,
                recursos: item.recursos,
                metaFrecuencia: item.metaFrecuencia,
                indicadorENEABR: item.indicadorENEABR,
                indicadorFEB: item.indicadorFEB,
                indicadorMAR: item.indicadorMAR,
                indicadorABR: item.indicadorABR,
                indicadorMAYOAGO: item.indicadorMAYOAGO,
                indicadorJUN: item.indicadorJUN,
                indicadorJUL: item.indicadorJUL,
                indicadorAGO: item.indicadorAGO,
                indicadorSEPDIC: item.indicadorSEPDIC,
                indicadorOCT: item.indicadorOCT,
                indicadorNOV: item.indicadorNOV,
                indicadorDIC: item.indicadorDIC,
                observaciones: item.observaciones,
                accionesCorrectivas: item.accionesCorrectivas || [],
                _id: item._id || `especifico-${Date.now()}`
              }],
              _id: item.objetivoIdMulti || item._id
            }));
            console.log('✅ Objetivos multi-departamento encontrados para usuario normal:', objetivosMulti.length);
          } catch (error) {
            console.error('❌ Error al obtener objetivos para usuario normal:', error);
            objetivosMulti = [];
          }
        }

        // ✅ AGRUPAR objetivos multi-departamento por área
        const objetivosPorArea = {};

        objetivosMulti.forEach(objetivo => {
          if (!objetivo.objetivosEspecificos || !Array.isArray(objetivo.objetivosEspecificos)) {
            return;
          }

          objetivo.objetivosEspecificos.forEach(objEspecifico => {
            if (!objEspecifico.area) return;

            const areaKey = objEspecifico.area.toUpperCase().trim();
            
            if (!objetivosPorArea[areaKey]) {
              objetivosPorArea[areaKey] = {
                area: objEspecifico.area,
                label: areaKey,
                roles: ["administrador", "auditor", "auditado"],
                isMultiDepartamento: true,
                isAreaGrouped: true,
                icon: <CollectionsBookmarkIcon fontSize="medium" />,
                objetivos: []
              };
            }

            // ✅ Asegurarnos de que cada objetivo tenga su ID y objetivoEspecifico (módulo)
            const objetivoCompleto = {
              objetivoId: objetivo._id,
              objetivoGeneral: objetivo.nombreObjetivoGeneral || 'Objetivo Multi-Departamento',
              objetivoEspecificoId: objEspecifico._id || `${objetivo._id}-${areaKey}`,
              objetivoEspecifico: objEspecifico.objetivoEspecifico || 'Sin módulo', // ✅ IMPORTANTE: Capturar el módulo
              objetivoDescripcion: objEspecifico.objetivo || 'Sin descripción',
              recursos: objEspecifico.recursos || '',
              metaFrecuencia: objEspecifico.metaFrecuencia || '',
              departamento: objEspecifico.departamento || objEspecifico.area,
              area: objEspecifico.area,
              indicadores: {
                indicadorENEABR: objEspecifico.indicadorENEABR,
                indicadorFEB: objEspecifico.indicadorFEB,
                indicadorMAR: objEspecifico.indicadorMAR,
                indicadorABR: objEspecifico.indicadorABR,
                indicadorMAYOAGO: objEspecifico.indicadorMAYOAGO,
                indicadorJUN: objEspecifico.indicadorJUN,
                indicadorJUL: objEspecifico.indicadorJUL,
                indicadorAGO: objEspecifico.indicadorAGO,
                indicadorSEPDIC: objEspecifico.indicadorSEPDIC,
                indicadorOCT: objEspecifico.indicadorOCT,
                indicadorNOV: objEspecifico.indicadorNOV,
                indicadorDIC: objEspecifico.indicadorDIC
              },
              observaciones: objEspecifico.observaciones || '',
              accionesCorrectivas: objEspecifico.accionesCorrectivas || []
            };

            objetivosPorArea[areaKey].objetivos.push(objetivoCompleto);
          });
        });

        // Convertir a array y ordenar por área
        const menusAgrupados = Object.values(objetivosPorArea)
          .map(areaGroup => ({
            ...areaGroup,
            objetivosCount: areaGroup.objetivos.length
          }))
          .sort((a, b) => a.area.localeCompare(b.area));

        console.log('✅ Menús dinámicos agrupados por área:', menusAgrupados);
        setMenuItemsDinamicos(menusAgrupados);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error al cargar objetivos multi-departamento:', error);
        setLoading(false);
      }
    };

    cargarObjetivosMultiDepartamento();
  }, [userData]);

  // ✅ Función para abrir el submenú con los módulos
  const handleOpenSubMenu = (areaItem) => {
    console.log('📂 Abriendo submenú para área:', areaItem.area);
    
    // Agrupar objetivos por módulo (objetivoEspecifico)
    const objetivosPorModulo = {};
    
    areaItem.objetivos.forEach(objetivo => {
      const moduloKey = objetivo.objetivoEspecifico || 'Sin módulo';
      
      if (!objetivosPorModulo[moduloKey]) {
        objetivosPorModulo[moduloKey] = {
          modulo: moduloKey,
          objetivos: [],
          count: 0
        };
      }
      
      objetivosPorModulo[moduloKey].objetivos.push(objetivo);
      objetivosPorModulo[moduloKey].count++;
    });
    
    // Convertir a array y ordenar
    const modulosArray = Object.values(objetivosPorModulo)
      .sort((a, b) => a.modulo.localeCompare(b.modulo));
    
    console.log('📊 Módulos encontrados:', modulosArray);
    
    setSelectedArea({
      ...areaItem,
      modulos: modulosArray
    });
    setObjetivosAgrupados(modulosArray);
    setOpenSubMenu(true);
  };

  // ✅ Función para seleccionar un módulo y ver sus objetivos
  const handleSelectModulo = (modulo) => {
    console.log('🎯 Módulo seleccionado:', modulo.modulo);
    
    // Filtrar objetivos que pertenecen a este módulo
    const objetivosDelModulo = modulo.objetivos;
    
    // Navegar a la vista unificada con los objetivos de este módulo
    navigate(`/objetivos/multi-area/${encodeURIComponent(selectedArea.area)}`, {
      state: {
        esMultiDepartamentoArea: true,
        area: selectedArea.area,
        modulo: modulo.modulo,
        objetivos: objetivosDelModulo,
        objetivosCount: objetivosDelModulo.length,
        mostrarSoloModulo: true // ✅ Nueva bandera para indicar que solo queremos ver este módulo
      }
    });
    
    // Cerrar el submenú
    setOpenSubMenu(false);
  };

  // ✅ Función para ver TODOS los objetivos del área (sin filtrar por módulo)
  const handleViewAllObjectives = () => {
    console.log('🌐 Ver todos los objetivos del área:', selectedArea.area);
    
    navigate(`/objetivos/multi-area/${encodeURIComponent(selectedArea.area)}`, {
      state: {
        esMultiDepartamentoArea: true,
        area: selectedArea.area,
        objetivos: selectedArea.objetivos,
        objetivosCount: selectedArea.objetivosCount,
        mostrarSoloModulo: false // ✅ Ver todos los objetivos
      }
    });
    
    // Cerrar el submenú
    setOpenSubMenu(false);
  };

  const handleItemClick = (item) => {
    if (item.label === "CALIDAD E INOCUIDAD") {
      setOpenDialog(true);
    } else if (item.isAreaGrouped) {
      // ✅ Abrir submenú con los módulos
      handleOpenSubMenu(item);
    } else if (item.isMultiDepartamento && !item.isAreaGrouped) {
      // ✅ Caso antiguo (objetivo individual)
      navigate(`/objetivos/${item.objetivoId}`, { 
        state: { 
          esMultiDepartamento: true,
          objetivoGeneral: item.objetivoGeneral || item.label,
          area: item.area,
          departamento: item.departamento,
          objetivoId: item.objetivoId
        } 
      });
    } else {
      // ✅ Navegar a objetivo normal (tradicional)
      navigate(`/objetivos/${item.label}`, {
        state: {
          esMultiDepartamento: false,
          area: item.label
        }
      });
    }
  };

  if (!userData || !userData.TipoUsuario) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography variant="h6" color="textSecondary">
          Cargando información del usuario...
        </Typography>
      </Box>
    );
  }

  const tipoUsuario = userData.TipoUsuario.toLowerCase();
  const effectiveTipo = tipoUsuario === 'invitado' ? 'administrador' : tipoUsuario;

  // ✅ Filtrar menús ESTÁTICOS según rol
  let filteredItemsEstaticos = menuItemsEstaticos.filter(item => item.roles.includes(effectiveTipo));

  // ✅ ADMINISTRADOR VE TODOS LOS MENÚS ESTÁTICOS SIN FILTRAR POR ÁREA
  if (effectiveTipo !== 'administrador') {
    if (!userData.area) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography variant="h6" color="error">
            No se ha asignado un área al usuario.
          </Typography>
        </Box>
      );
    }
    // Normalizar el área del usuario para comparación
    const userAreaNormalized = normalizeText(userData.area);
    
    // Filtrar solo los menús que corresponden al área del usuario
    filteredItemsEstaticos = filteredItemsEstaticos.filter(item => 
      item.areas.some(area => normalizeText(area) === userAreaNormalized)
    );
  }

  // ✅ COMBINAR menús estáticos + dinámicos
  const allMenuItems = [...filteredItemsEstaticos, ...menuItemsDinamicos];

  // ✅ Función para ordenar los menús
  const sortedMenuItems = allMenuItems.sort((a, b) => {
    // CALIDAD E INOCUIDAD siempre primero
    if (a.label === "CALIDAD E INOCUIDAD") return -1;
    if (b.label === "CALIDAD E INOCUIDAD") return 1;
    
    // Áreas con multi-departamento después
    if (a.isAreaGrouped && !b.isAreaGrouped) return -1;
    if (!a.isAreaGrouped && b.isAreaGrouped) return 1;
    
    // Luego ordenar alfabéticamente
    return a.label.localeCompare(b.label);
  });

  return (
    <Box sx={{ p: isMobile ? 2 : 6 }}>
      {/* Encabezado */}
      <Box 
        sx={{ 
          pt: 12,
          mb: 6,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}
          >
            Objetivos de {userData.Nombre}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 1 }}>
            Área: {userData.area} | Rol: {userData.TipoUsuario}
          </Typography>
          <Typography variant="caption" color="primary">
            {menuItemsDinamicos.length > 0 && `(${menuItemsDinamicos.length} áreas con objetivos multi-departamento)`}
          </Typography>
        </Box>

        {filteredItemsEstaticos.some(item => item.label === "CALIDAD E INOCUIDAD") && (
          <Tooltip title="Ver información de calidad e inocuidad" arrow>
            <Button
              variant="contained"
              color="secondary"
              size={isMobile ? "medium" : "large"}
              startIcon={<VerifiedUserIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                borderRadius: '50px',
                px: isMobile ? 3 : 4,
                py: 1,
                boxShadow: theme.shadows[3],
                '&:hover': {
                  boxShadow: theme.shadows[6]
                }
              }}
            >
              CALIDAD E INOCUIDAD
            </Button>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ my: 4, borderWidth: 1 }} />

      {/* ✅ Indicador de carga */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando objetivos...
          </Typography>
        </Box>
      )}

      {/* ✅ Mostrar mensaje si no hay menús */}
      {!loading && sortedMenuItems.length === 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <Typography variant="h6" color="textSecondary">
            No hay objetivos disponibles para tu área y rol.
          </Typography>
        </Box>
      )}

      {/* Menú de opciones (Estáticos + Dinámicos) */}
      {sortedMenuItems.length > 0 && (
        <>
          {/* Sección de Objetivos Tradicionales */}
          {sortedMenuItems.filter(item => !item.isMultiDepartamento && item.label !== "CALIDAD E INOCUIDAD").length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2, mt: 4, color: 'primary.main' }}>
                Objetivos Tradicionales
              </Typography>
              <Grid container spacing={2}>
                {sortedMenuItems
                  .filter(item => !item.isMultiDepartamento && item.label !== "CALIDAD E INOCUIDAD")
                  .map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`${item.label}-${index}`}>
                      <Fade in timeout={500 + (index * 100)}>
                        <StyledMenuItem 
                          elevation={3}
                          onClick={() => handleItemClick(item)}
                        >
                          <Avatar
                            sx={{
                              bgcolor: 'transparent',
                              color: theme.palette.primary.main,
                              width: 50,
                              height: 50,
                              mb: 1
                            }}
                          >
                            {areaIcons[item.label] || <AssignmentTurnedInIcon fontSize="medium" />}
                          </Avatar>
                          <Typography 
                            variant="subtitle1"
                            align="center" 
                            sx={{
                              fontWeight: 'medium',
                              wordBreak: 'break-word',
                              fontSize: '0.9rem'
                            }}
                          >
                            {item.label}
                          </Typography>
                          {item.areas && item.areas.length > 0 && (
                            <Typography 
                              variant="caption" 
                              color="textSecondary" 
                              sx={{ mt: 0.5, fontSize: '0.65rem' }}
                            >
                              {item.areas[0]}
                            </Typography>
                          )}
                        </StyledMenuItem>
                      </Fade>
                    </Grid>
                  ))}
              </Grid>
            </>
          )}

          {/* Sección de Objetivos Multi-Departamento Agrupados por Área */}
          {sortedMenuItems.filter(item => item.isAreaGrouped).length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2, mt: 6, color: 'secondary.main' }}>
                Objetivos Multi-Departamento
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Haz clic en un área para ver sus módulos (objetivos específicos)
              </Typography>
              <Grid container spacing={2}>
                {sortedMenuItems
                  .filter(item => item.isAreaGrouped)
                  .map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`grouped-${item.label}-${index}`}>
                      <Fade in timeout={500 + (index * 100)}>
                        <StyledGroupedMenuItem 
                          elevation={3}
                          onClick={() => handleOpenSubMenu(item)}
                        >
                          <Badge 
                            badgeContent={item.objetivosCount} 
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontWeight: 'bold',
                                fontSize: '0.7rem'
                              }
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'transparent',
                                color: theme.palette.secondary.main,
                                width: 50,
                                height: 50,
                                mb: 1
                              }}
                            >
                              <CollectionsBookmarkIcon />
                            </Avatar>
                          </Badge>
                          <Typography 
                            variant="subtitle1"
                            align="center" 
                            sx={{
                              fontWeight: 'bold',
                              wordBreak: 'break-word',
                              fontSize: '0.9rem',
                              color: theme.palette.secondary.main
                            }}
                          >
                            {item.area}
                          </Typography>
                          <Chip
                            label={`${item.objetivosCount} objetivo(s)`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mt: 1, fontSize: '0.65rem' }}
                          />
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            align="center"
                            sx={{ mt: 0.5, fontSize: '0.7rem' }}
                          >
                            Haz clic para ver módulos
                          </Typography>
                        </StyledGroupedMenuItem>
                      </Fade>
                    </Grid>
                  ))}
              </Grid>
            </>
          )}
        </>
      )}

      {/* ✅ NUEVO: Submenú centrado con Dialog */}
      <SubMenuDialog
        open={openSubMenu}
        onClose={() => setOpenSubMenu(false)}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(90deg, ${theme.palette.secondary.main}20, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.secondary.main,
                width: 40,
                height: 40,
                mr: 2
              }}
            >
              <CollectionsBookmarkIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" color="secondary.main" fontWeight="bold">
                {selectedArea?.area}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Selecciona un módulo para ver sus objetivos específicos
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={() => setOpenSubMenu(false)}
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Botón para ver todos los objetivos */}
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<CollectionsBookmarkIcon />}
            onClick={handleViewAllObjectives}
            sx={{ 
              mb: 3,
              py: 1.5,
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            Ver todos los objetivos ({selectedArea?.objetivosCount || 0})
          </Button>

          {/* Lista de módulos */}
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 'bold' }}>
            MÓDULOS DISPONIBLES:
          </Typography>
          
          {objetivosAgrupados.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No hay módulos definidos
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {objetivosAgrupados.map((modulo, index) => (
                <StyledSubMenuItem
                  key={index}
                  elevation={1}
                  onClick={() => handleSelectModulo(modulo)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.secondary.main + '20',
                        color: theme.palette.secondary.main,
                        width: 40,
                        height: 40,
                        mr: 2
                      }}
                    >
                      <FolderSpecialIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {modulo.modulo}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {modulo.count} objetivo{modulo.count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={modulo.count}
                      size="small"
                      color="secondary"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                </StyledSubMenuItem>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.default
        }}>
          <Typography variant="caption" color="textSecondary" sx={{ flex: 1, textAlign: 'center' }}>
            Selecciona un módulo para ver sus objetivos específicos
          </Typography>
        </DialogActions>
      </SubMenuDialog>

      {/* Diálogo de Calidad e Inocuidad */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
        TransitionComponent={Slide}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: theme.palette.getContrastText(theme.palette.primary.main),
          py: 2,
          px: 3
        }}>
          <Box display="flex" alignItems="center">
            <VerifiedUserIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="span">
              CALIDAD E INOCUIDAD
            </Typography>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={() => setOpenDialog(false)}
            sx={{ color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3, px: 4 }}>
          <Typography variant="body1" paragraph>
            <strong>6.2 OBJETIVOS DEL SISTEMA DE ADMINISTRACIÓN DE CALIDAD E INOCUIDAD DE LOS ALIMENTOS Y PLANEACIÓN PARA LOGRARLOS.</strong>
          </Typography>
          <Typography variant="body1" paragraph>
            De acuerdo con la Norma Internacional ISO 22000 - 2018, inciso 6.2.1; La Organización debe establecer objetivos para el Sistema de Gestión de Inocuidad Alimentaria para las funciones y niveles pertinentes.
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 3 }}>
            <strong>Los objetivos del SGIA deben:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            <li><Typography variant="body1">Ser coherentes con la política de inocuidad de los alimentos.</Typography></li>
            <li><Typography variant="body1">Ser medibles (si es posible).</Typography></li>
            <li><Typography variant="body1">Tener en cuenta los requerimientos aplicables de la inocuidad de los alimentos, incluyendo los requerimientos legales, reglamentarios y de los clientes.</Typography></li>
            <li><Typography variant="body1">Ser objeto de seguimiento y verificación.</Typography></li>
            <li><Typography variant="body1">Ser comunicados.</Typography></li>
            <li><Typography variant="body1">Ser mantenidos y actualizados según sea apropiado.</Typography></li>
          </Box>
          
          <Typography variant="body1" paragraph>
            La organización debe conservar la información documentada sobre los objetivos para el SGIA.
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 3 }}>
            <strong>6.2.2 Al planear cómo lograr sus objetivos para el SGIA, la organización debe determinar:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <li><Typography variant="body1">Qué se va a hacer.</Typography></li>
            <li><Typography variant="body1">Qué recursos se requerirán.</Typography></li>
            <li><Typography variant="body1">Quién será responsable.</Typography></li>
            <li><Typography variant="body1">Cuándo se finalizará.</Typography></li>
            <li><Typography variant="body1">Cómo se evaluarán los resultados.</Typography></li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            variant="contained"
            color="primary"
            sx={{ borderRadius: '50px', px: 4 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuByRoleAndArea;