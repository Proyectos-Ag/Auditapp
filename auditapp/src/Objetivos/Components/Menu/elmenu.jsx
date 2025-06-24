import React, { useContext, useState } from 'react';
import { UserContext } from '../../../App';
import { useNavigate } from 'react-router-dom';
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
  Tooltip
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
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { AcUnit as EcoIcon } from '@mui/icons-material';

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

const menuItems = [
  { label: "CONTROL Y CUIDADO AMBIENTAL", roles: ["administrador", "auditor", "auditado"], areas: ["CONTROL Y CUIDADO AMBIENTAL", "CONTROL DE PLAGAS", "Control y Cuidado Ambiental"] },
  { label: "EMBARQUE", roles: ["administrador", "auditor", "auditado"], areas: ["EMBARQUE", "REVISIÓN", "PRODUCTO TERMINADO", "Planeación y Logística"] },
  { label: "MANTENIMIENTO SERVICIOS", roles: ["administrador", "auditor", "auditado"], areas: ["MANTENIMIENTO SERVICIOS", "Mantenimiento Procesos"] },
  { label: "SEGURIDAD E HIGIENE Y SANIDAD", roles: ["administrador", "auditor", "auditado"], areas: ["SEGURIDAD E HIGIENE Y SANIDAD", "CONTROL DE PLAGAS", "Seguridad e Higiene y Sanidad"] },
  { label: "INGENIERÍA", roles: ["administrador", "auditor", "auditado"], areas: ["INGENIERÍA", "Ingeniería"] },
  { label: "COORDINADOR DE MATERIA PRIMA", roles: ["administrador", "auditor", "auditado"], areas: ["COORDINADOR DE MATERIA PRIMA", "MATERIA PRIMA"] },
  { label: "GERENCIA PLANEACIÓN Y LOGÍSTICA", roles: ["administrador", "auditor", "auditado"], areas: ["GERENCIA PLANEACIÓN Y LOGÍSTICA", "Planeación y Logística", "PL MATERIA PRIMA"] },
  { label: "MANTENIMIENTO TETRA PAK", roles: ["administrador", "auditor", "auditado"], areas: ["MANTENIMIENTO TETRA PAK", "Mantenimiento Tetra"] },
  { label: "CONTROL DE PLAGAS", roles: ["administrador", "auditor", "auditado"], areas: ["CONTROL DE PLAGAS", "SEGURIDAD E HIGIENE Y SANIDAD", "Seguridad e Higiene y Sanidad"] },
  { label: "AGUIDA", roles: ["administrador", "auditor", "auditado"], areas: ["AGUIDA"] },
  { label: "PESADAS", roles: ["administrador", "auditor", "auditado"], areas: ["PESADAS"] },
  { label: "PRODUCCIÓN", roles: ["administrador", "auditor", "auditado"], areas: ["PRODUCCIÓN","Producción"] },
  { label: "ASEGURAMIENTO DE CALIDAD", roles: ["administrador", "auditor", "auditado"], areas: ["ASEGURAMIENTO DE CALIDAD", "LIBERACIÓN DE PT"] },
  { label: "COMPRAS", roles: ["administrador", "auditor", "auditado"], areas: ["COMPRAS", "Compras"] },
  { label: "ADMINISTRADOR", roles: ["administrador"], areas: ["ADMINISTRADOR"] },
  { label: "REVISIÓN", roles: ["administrador", "auditor", "auditado"], areas: ["REVISIÓN", "EMBARQUE", "PRODUCTO TERMINADO", "Planeación y Logística"] },
  { label: "VALIDACIÓN", roles: ["administrador", "auditor", "auditado"], areas: ["VALIDACIÓN", "Producción.", "Validación","PRODUCCIÓN."] },
  { label: "LIBERACIÓN DE PT", roles: ["administrador", "auditor", "auditado"], areas: ["LIBERACIÓN DE PT", "ASEGURAMIENTO DE CALIDAD"] },
  { label: "RECURSOS HUMANOS", roles: ["administrador", "auditor", "auditado"], areas: ["RECURSOS HUMANOS"] },
  { label: "SISTEMAS", roles: ["administrador", "auditor", "auditado"], areas: ["SISTEMAS"] },
  { label: "CALIDAD E INOCUIDAD", roles: ["administrador", "auditor", "auditado"], areas: ["CONTROL Y CUIDADO AMBIENTAL", "EMBARQUE", "MANTENIMIENTO SERVICIOS", "SEGURIDAD E HIGIENE Y SANIDAD", "INGENIERÍA", "COORDINADOR DE MATERIA PRIMA", "GERENCIA PLANEACIÓN Y LOGÍSTICA", "MANTENIMIENTO TETRA PAK", "CONTROL DE PLAGAS", "AGUIDA", "PESADAS", "PRODUCCIÓN", "ASEGURAMIENTO DE CALIDAD", "COMPRAS", "ADMINISTRADOR", "REVISIÓN", "VALIDACIÓN", "LIBERACIÓN DE PT", "RECURSOS HUMANOS", "SAFETY GOALS"] }
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

const MenuByRoleAndArea = () => {
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  let filteredItems = menuItems.filter(item => item.roles.includes(tipoUsuario));

  if (tipoUsuario !== 'administrador') {
    if (!userData.area) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography variant="h6" color="error">
            No se ha asignado un área al usuario.
          </Typography>
        </Box>
      );
    }
    const areaUpper = userData.area.toUpperCase();
    filteredItems = filteredItems.filter(item => item.areas.some(area => area.toUpperCase() === areaUpper));
  }

  const handleItemClick = (label) => {
    if (label === "CALIDAD E INOCUIDAD") {
      setOpenDialog(true);
    } else {
      navigate(`/objetivos/${label}`);
    }
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 6 }}>
      {/* Encabezado */}
      <Box 
        sx={{ 
          pt: 12, // Añadido padding top de 12 (aproximadamente 3-4 pulgadas)
          mb: 6, // Aumenté el margen inferior para más separación
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
        </Box>

        {filteredItems.some(item => item.label === "CALIDAD E INOCUIDAD") && (
          <Tooltip title="Ver información de calidad e inocuidad" arrow>
            <Button
              variant="contained"
              color="secondary"
              size={isMobile ? "medium" : "large"}
              startIcon={<VerifiedUserIcon />}
              onClick={() => handleItemClick("CALIDAD E INOCUIDAD")}
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

      {/* Menú de opciones */}
      <Grid container spacing={2}> {/* Reduje el espaciado entre tarjetas */}
        {filteredItems
          .filter(item => item.label !== "CALIDAD E INOCUIDAD")
          .map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Fade in timeout={500 + (index * 100)}>
                <StyledMenuItem 
                  elevation={3}
                  onClick={() => handleItemClick(item.label)}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'transparent',
                      color: theme.palette.primary.main,
                      width: 50,
                      height: 20,
                      mb: 1
                    }}
                  >
                    {areaIcons[item.label] || <AssignmentTurnedInIcon fontSize="medium" />}
                  </Avatar>
                  <Typography 
                    variant="subtitle1" // Cambié a subtitle1 para texto más compacto
                    align="center" 
                    sx={{
                      fontWeight: 'medium',
                      wordBreak: 'break-word',
                      fontSize: '0.9rem' // Tamaño de fuente más pequeño
                    }}
                  >
                    {item.label}
                  </Typography>
                </StyledMenuItem>
              </Fade>
            </Grid>
          ))}
      </Grid>

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
