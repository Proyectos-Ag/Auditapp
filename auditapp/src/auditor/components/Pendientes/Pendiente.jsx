import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../../App';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Fab,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  AddAPhoto,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info,
  PhotoCamera,
  Delete,
  Save,
  Assignment,
  Dashboard,
  Visibility,
  Close,
  CloudUpload,
  Task,
  CalendarToday,
  Person,
  Group,
  Menu,
  Home,
  Assessment,
  CheckBox,
  CameraAlt
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/pendiente.css';

// Tema profesional personalizado
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
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C'
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00'
    },
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#D32F2F'
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }
      }
    }
  }
});

// Componentes estilizados
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  }
}));

const StatusChip = styled(Chip)(({ status, theme }) => ({
  fontWeight: 600,
  ...(status === 'pendiente' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(status === 'Devuelto' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(status === 'Realizado' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  })
}));

const ProgressBar = styled(LinearProgress)(({ percentage, theme }) => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    ...(percentage >= 90 && { backgroundColor: theme.palette.success.main }),
    ...(percentage >= 80 && percentage < 90 && { backgroundColor: theme.palette.success.light }),
    ...(percentage >= 60 && percentage < 80 && { backgroundColor: theme.palette.warning.main }),
    ...(percentage < 60 && { backgroundColor: theme.palette.error.main }),
  }
}));

const ConformityCell = styled(TableCell)(({ selected, type, theme }) => ({
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ...(selected && type === 'Conforme' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  }),
  ...(selected && type === 'm' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(selected && type === 'M' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(selected && type === 'C' && {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white,
  }),
  ...(selected && type === 'NA' && {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  }),
  '&:hover': {
    backgroundColor: selected ? undefined : theme.palette.action.hover,
  }
}));

const ImageGallery = styled(ImageList)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const ActionButton = styled(Button)(({ theme, varianttype }) => ({
  fontWeight: 600,
  borderRadius: 8,
  textTransform: 'none',
  padding: '8px 16px',
  ...(varianttype === 'save' && {
    backgroundColor: theme.palette.info.main,
    '&:hover': {
      backgroundColor: theme.palette.info.dark,
    }
  }),
  ...(varianttype === 'generate' && {
    backgroundColor: theme.palette.success.main,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    }
  })
}));

// Componente móvil para criterios de conformidad
const MobileConformitySelector = ({ selectedValue, onSelect, fieldKey }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { value: 'Conforme', label: 'Conforme', color: 'success' },
    { value: 'm', label: 'Menor', color: 'warning' },
    { value: 'M', label: 'Mayor', color: 'error' },
    { value: 'C', label: 'Crítico', color: 'error' },
    { value: 'NA', label: 'No Aplica', color: 'info' }
  ];

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <>
      <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Estado del Requisito
        </Typography>
        <Button
          fullWidth
          variant={selectedValue ? "contained" : "outlined"}
          color={selectedOption?.color || 'primary'}
          onClick={() => setOpen(true)}
          startIcon={<CheckBox />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {selectedOption?.label || 'Seleccionar estado'}
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Seleccionar Estado
            </Typography>
          </Toolbar>
        </AppBar>
        <List>
          {options.map((option) => (
            <ListItem
              key={option.value}
              button
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              selected={selectedValue === option.value}
              sx={{
                borderLeft: selectedValue === option.value ? 4 : 0,
                borderColor: `${option.color}.main`,
                backgroundColor: selectedValue === option.value ? `${option.color}.light` : 'transparent'
              }}
            >
              <ListItemIcon>
                <CheckCircle color={selectedValue === option.value ? option.color : 'disabled'} />
              </ListItemIcon>
              <ListItemText 
                primary={option.label} 
                primaryTypographyProps={{
                  fontWeight: selectedValue === option.value ? 600 : 400
                }}
              />
            </ListItem>
          ))}
        </List>
      </Dialog>
    </>
  );
};

// Componente móvil para gestión de fotos
const MobilePhotoManager = ({ photos, onAddPhoto, onDeletePhoto, onPreviewPhoto, fieldKey }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Evidencia Fotográfica ({photos.length}/4)
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {photos.map((photo, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <img
              src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
              alt={`Evidencia ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
              onClick={() => onPreviewPhoto(photo, index)}
            />
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)'
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDeletePhoto(index);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}
        
        {photos.length < 4 && (
          <Box
            sx={{
              width: 80,
              height: 80,
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: 'primary.light',
              '&:hover': {
                backgroundColor: 'primary.main',
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }
            }}
            onClick={onAddPhoto}
          >
            <CameraAlt sx={{ color: 'primary.main', fontSize: 32 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Pendientes = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState([]);
  const [expandedPeriods, setExpandedPeriods] = useState([]);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [percentages, setPercentages] = useState({});
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedImageDocId, setSelectedImageDocId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [mobileNavValue, setMobileNavValue] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width:768px)');

  const checkboxValues = {
    'Conforme': 1,
    'm': 0.7,
    'M': 0.3,
    'C': 0,
    'NA': null
  };

  const navigate = useNavigate();

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const obtenerFechaInicio = (duracion) => {
      const partes = duracion.split(" ");
      let diaInicio = 1;
      let mesInicio = 0;
      let anoInicio = new Date().getFullYear();

      for (const parte of partes) {
        const numero = parseInt(parte);
        if (!isNaN(numero)) {
          diaInicio = numero;
        } else if (parte.length === 4 && !isNaN(parseInt(parte))) {
          anoInicio = parseInt(parte);
        } else {
          const mesNum = obtenerNumeroMes(parte);
          if (mesNum !== -1) mesInicio = mesNum;
        }
      }
      return new Date(anoInicio, mesInicio, diaInicio);
    };

    const obtenerDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
        if (userData && userData.Correo) {
          const datosFiltrados = response.data.filter((dato) => 
            (dato.AuditorLiderEmail === userData.Correo || 
            (dato.EquipoAuditor.length > 0 && dato.EquipoAuditor.some(auditor => auditor.Correo === userData.Correo))) &&
            (dato.Estado === "pendiente" || dato.Estado === "Devuelto")
          );

          datosFiltrados.sort((a, b) => {
            const fechaInicioA = obtenerFechaInicio(a.Duracion);
            const fechaInicioB = obtenerFechaInicio(b.Duracion);
            return fechaInicioA - fechaInicioB;
          });

          setDatos(datosFiltrados);
          
          const initialCheckboxes = {};
          const initialPercentages = {};

          datosFiltrados.forEach((dato, periodIdx) => {
            dato.Programa.forEach((programa, programIdx) => {
              const programKey = `${periodIdx}_${programIdx}`;
              let totalValue = 0;
              let validPrograms = 0;

              programa.Descripcion.forEach((desc, descIdx) => {
                const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                initialCheckboxes[fieldKey] = desc.Criterio;
                const value = checkboxValues[desc.Criterio];
                if (value !== null) {
                  totalValue += value;
                  validPrograms++;
                }
              });

              const percentage = validPrograms > 0 ? (totalValue / validPrograms) * 100 : 0;
              initialPercentages[programKey] = percentage;
            });
          });

          setSelectedCheckboxes(initialCheckboxes);
          setPercentages(initialPercentages);
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        showSnackbar('Error al cargar las auditorías', 'error');
      }
    };

    obtenerDatos();
  }, [userData]);

  const obtenerNumeroMes = (nombreMes) => {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return meses.indexOf(nombreMes.toLowerCase());
  };

  const handlePeriodToggle = (periodId) => {
    setExpandedPeriods(prev =>
      prev.includes(periodId)
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
  };

  const handleCheckboxChange = (periodIdx, programIdx, descIdx, checkboxName) => {
    const key = `${periodIdx}_${programIdx}_${descIdx}`;
    setSelectedCheckboxes(prevState => {
      const updated = { ...prevState, [key]: checkboxName };
      const programKey = `${periodIdx}_${programIdx}`;
      const relevantCheckboxes = Object.keys(updated).filter(k => k.startsWith(`${periodIdx}_${programIdx}_`));
      
      let totalValue = 0;
      let validPrograms = 0;

      relevantCheckboxes.forEach(k => {
        const value = checkboxValues[updated[k]];
        if (value !== null) {
          totalValue += value;
          validPrograms++;
        }
      });

      const percentage = validPrograms > 0 ? (totalValue / validPrograms) * 100 : 0;
      setPercentages(prevPercentages => ({
        ...prevPercentages,
        [programKey]: percentage
      }));

      return updated;
    });
  };

  const handleOpenPhotoModal = (fieldKey) => {
    setSelectedField(fieldKey);
    setPhotoModalOpen(true);
  };

  const handleCapture = (file) => {
    if (selectedField) {
      const rowIdentifier = selectedField;
      setCapturedPhotos((prev) => {
        const updatedPhotos = { ...prev };
        if (updatedPhotos[rowIdentifier]) {
          if (updatedPhotos[rowIdentifier].length < 4) {
            updatedPhotos[rowIdentifier] = [...updatedPhotos[rowIdentifier], file];
          } else {
            showSnackbar('Máximo 4 fotos permitidas por requisito', 'warning');
            return prev;
          }
        } else {
          updatedPhotos[rowIdentifier] = [file];
        }
        return updatedPhotos;
      });
    }
    setPhotoModalOpen(false);
  };

  const handleImagePreview = (imageSrc, index, docId) => {
    setSelectedImage(imageSrc);
    setSelectedImageIndex(index);
    setSelectedImageDocId(docId);
    setImagePreviewOpen(true);
  };

  const handleDeleteImage = async (docId, imageIndex, imageUrl) => {
    if (imageUrl.startsWith("blob:")) {
      setCapturedPhotos(prevState => ({
        ...prevState,
        [selectedField]: prevState[selectedField].filter((_, idx) => idx !== imageIndex)
      }));
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/datos/eliminarImagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, imageUrl })
      });

      const fileName = imageUrl.split('/').pop().split('?')[0];
      const decodedFileName = decodeURIComponent(fileName);
      const imageRef = ref(storage, decodedFileName);
      await deleteObject(imageRef);

      setCapturedPhotos(prev => {
        const updatedPhotos = { ...prev };
        delete updatedPhotos[selectedField];
        return updatedPhotos;
      });

      showSnackbar('Imagen eliminada correctamente', 'success');
      setImagePreviewOpen(false);
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      showSnackbar('Error al eliminar la imagen', 'error');
    }
  };

  const uploadImageToFirebase = async (file, fileName) => {
    try {
      if (!(file instanceof File)) {
        throw new Error('El objeto recibido no es un archivo válido');
      }
      const storageRef = ref(storage, `files/${fileName}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw new Error('No se pudo subir la imagen');
    }
  };

  const areAllCheckboxesFilled = (periodIdx) => {
    const numPrograms = datos[periodIdx].Programa.length;
    for (let programIdx = 0; programIdx < numPrograms; programIdx++) {
      const programa = datos[periodIdx].Programa[programIdx];
      for (let descIdx = 0; descIdx < programa.Descripcion.length; descIdx++) {
        const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
        if (!selectedCheckboxes[fieldKey]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleUpdatePeriod = async (periodIdx, id) => {
    if (!areAllCheckboxesFilled(periodIdx)) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Todos los checkboxes deben estar llenos antes de generar el reporte.',
      });
      return;
    }

    setLoading(true);
    try {
      let totalPorcentage = 0;
      const numPrograms = datos[periodIdx].Programa.length;

      for (let programIdx = 0; programIdx < numPrograms; programIdx++) {
        const programa = datos[periodIdx].Programa[programIdx];
        const observaciones = await Promise.all(
          programa.Descripcion.map(async (desc, descIdx) => {
            const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
            const updatedObservation = { ...desc };
            const files = capturedPhotos[fieldKey] || [];

            if (files.length > 0) {
              const fileUrls = await Promise.all(
                files.map(async (file, index) => {
                  const fileName = `evidencia_${id}_${periodIdx}_${programIdx}_${descIdx}_${index}`;
                  return await uploadImageToFirebase(file, fileName);
                })
              );
              updatedObservation.Hallazgo = fileUrls;
            } else {
              updatedObservation.Hallazgo = Array.isArray(desc.Hallazgo) ? desc.Hallazgo : [];
            }

            return {
              ID: desc.ID,
              Criterio: selectedCheckboxes[fieldKey] || '',
              Observacion: document.querySelector(`textarea[name=Observaciones_${periodIdx}_${programIdx}_${descIdx}]`).value,
              Problema: document.querySelector(`textarea[name=Problemas_${periodIdx}_${programIdx}_${descIdx}]`).value || desc.Problema,
              Hallazgo: updatedObservation.Hallazgo,
            };
          })
        );

        const percentage = percentages[`${periodIdx}_${programIdx}`] || 0;
        totalPorcentage += percentage;

        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
          programIdx,
          observaciones,
          percentage,
        });
      }

      const totalPorcentageAvg = (totalPorcentage / numPrograms).toFixed(2);
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
        PorcentajeTotal: totalPorcentageAvg,
        Estado: 'Realizado',
        usuario: userData.Nombre
      });

      showSnackbar('Reporte generado exitosamente', 'success');
      navigate('/reporte');
    } catch (error) {
      console.error('Error en handleUpdatePeriod:', error);
      showSnackbar('Error al generar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCamb = async (periodIdx, id) => {
    setLoading(true);
    try {
      let totalPorcentage = 0;
      const numPrograms = datos[periodIdx].Programa.length;

      for (let programIdx = 0; programIdx < numPrograms; programIdx++) {
        const programa = datos[periodIdx].Programa[programIdx];
        const observaciones = await Promise.all(
          programa.Descripcion.map(async (desc, descIdx) => {
            const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
            const updatedObservation = { ...desc };
            const files = capturedPhotos[fieldKey] || [];

            if (files.length > 0) {
              const fileUrls = await Promise.all(
                files.map(async (file, index) => {
                  const fileName = `evidencia_${id}_${periodIdx}_${programIdx}_${descIdx}_${index}`;
                  return await uploadImageToFirebase(file, fileName);
                })
              );
              updatedObservation.Hallazgo = fileUrls;
            } else {
              updatedObservation.Hallazgo = Array.isArray(desc.Hallazgo) ? desc.Hallazgo : [];
            }

            return {
              ID: desc.ID,
              Criterio: selectedCheckboxes[fieldKey] || '',
              Observacion: document.querySelector(`textarea[name=Observaciones_${periodIdx}_${programIdx}_${descIdx}]`).value,
              Problema: document.querySelector(`textarea[name=Problemas_${periodIdx}_${programIdx}_${descIdx}]`).value || desc.Problema,
              Hallazgo: updatedObservation.Hallazgo,
            };
          })
        );

        const percentage = percentages[`${periodIdx}_${programIdx}`] || 0;
        totalPorcentage += percentage;

        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
          programIdx,
          observaciones,
          percentage,
        });
      }

      const totalPorcentageAvg = (totalPorcentage / numPrograms).toFixed(2);
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
        PorcentajeTotal: totalPorcentageAvg,
        Estado: 'pendiente',
      });

      showSnackbar('Cambios guardados exitosamente', 'success');
    } catch (error) {
      console.error('Error en handleGuardarCamb:', error);
      showSnackbar('Error al guardar los cambios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const PhotoModal = ({ open, onClose, onCapture }) => {
    const [capturedImage, setCapturedImage] = useState(null);

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        setCapturedImage(URL.createObjectURL(file));
        onCapture(file);
      }
    };

    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile}>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Agregar Evidencia
            </Typography>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <Box textAlign="center" py={3}>
            <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Agregar Evidencia Fotográfica
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Selecciona una imagen para agregar como evidencia
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Formatos soportados: JPG, PNG, GIF • Máximo 4 imágenes por requisito
            </Typography>
          </Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="photo-upload">
            <Button 
              variant="contained" 
              component="span" 
              fullWidth 
              size="large"
              startIcon={<PhotoCamera />}
              sx={{ mb: 2 }}
            >
              Seleccionar Imagen
            </Button>
          </label>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} fullWidth variant="outlined">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const ImagePreviewModal = () => (
    <Dialog 
      open={imagePreviewOpen} 
      onClose={() => setImagePreviewOpen(false)}
      fullScreen={isMobile}
    >
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setImagePreviewOpen(false)}>
            <Close />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Vista Previa
          </Typography>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={() => handleDeleteImage(selectedImageDocId, selectedImageIndex, selectedImage)}
          >
            Eliminar
          </Button>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={selectedImage}
          alt="Vista previa"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            borderRadius: 8,
            objectFit: 'contain'
          }}
        />
      </DialogContent>
    </Dialog>
  );

  // Renderizado móvil
  const renderMobileView = () => (
    <Box sx={{ pb: 7 }}>
      {/* Header Móvil */}

<AppBar
className='elmeroheader' 
  position="sticky" 
  color="primary" 
  elevation={1}
  sx={{ 
    zIndex: (theme) => theme.zIndex.drawer - 10, // Reducir z-index
    position: 'relative' // Cambiar si es necesario
  }}
>
  <Toolbar>
    <IconButton
      edge="start"
      color="inherit"
      onClick={() => setMobileDrawerOpen(true)}
      sx={{ mr: 2 }}
    >
      <Menu />
    </IconButton>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>
      Auditorías
    </Typography>
    <Chip 
      label={datos.length} 
      color="secondary" 
      size="small"
    />
  </Toolbar>
</AppBar>

      {/* Contenido Principal Móvil */}
      <Box sx={{ p: 2 }}>
        {datos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="textSecondary">
              No hay auditorías pendientes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Todas las auditorías asignadas han sido completadas
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {datos.map((dato, periodIdx) => (
              <Card key={periodIdx} elevation={2}>
                <CardContent sx={{ p: 2 }}>
                  {/* Header de Auditoría Móvil */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      mb: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePeriodToggle(dato._id)}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      <CalendarToday />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {dato.Duracion}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dato.TipoAuditoria}
                      </Typography>
                    </Box>
                    <StatusChip
                      label={dato.Estado}
                      status={dato.Estado}
                      size="small"
                    />
                  </Box>

                  {/* Información adicional */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<Person />}
                      label={dato.AuditorLider}
                      size="small"
                      variant="outlined"
                    />
                    {dato.EquipoAuditor.length > 0 && (
                      <Chip
                        icon={<Group />}
                        label={`+${dato.EquipoAuditor.length}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {expandedPeriods.includes(dato._id) && (
                    <Box sx={{ mt: 2 }}>
                      {/* Comentario del Auditor */}
                      {dato.Comentario && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">Comentario:</Typography>
                          {dato.Comentario}
                        </Alert>
                      )}

                      {/* Botones de Acción Móviles */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={() => handleGuardarCamb(periodIdx, dato._id)}
                          fullWidth
                          size="small"
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleUpdatePeriod(periodIdx, dato._id)}
                          fullWidth
                          size="small"
                        >
                          Reporte
                        </Button>
                      </Box>

                      {/* Programas Móviles */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dato.Programa.map((programa, programIdx) => {
                          const programKey = `${periodIdx}_${programIdx}`;
                          const percentage = percentages[programKey] || 0;

                          return (
                            <Paper key={programIdx} elevation={1} sx={{ p: 2 }}>
                              {/* Header del Programa Móvil */}
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                  {programa.Nombre}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Typography variant="body2" fontWeight="500">
                                    {percentage.toFixed(2)}%
                                  </Typography>
                                  <ProgressBar 
                                    variant="determinate" 
                                    value={percentage} 
                                    percentage={percentage}
                                    sx={{ flexGrow: 1 }}
                                  />
                                </Box>
                              </Box>

                              {/* Requisitos Móviles */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {programa.Descripcion.map((desc, descIdx) => {
                                  const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                                  const imageSrcs = (capturedPhotos[fieldKey] || [])
                                    .map(file => typeof file === "object" && file instanceof File ? URL.createObjectURL(file) : file)
                                    .concat(Array.isArray(desc.Hallazgo) ? desc.Hallazgo : []);

                                  return (
                                    <Paper key={descIdx} variant="outlined" sx={{ p: 2 }}>
                                      {/* ID y Requisito */}
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="primary" fontWeight="600">
                                          {desc.ID}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                          {desc.Requisito}
                                        </Typography>
                                      </Box>

                                      {/* Selector de Conformidad Móvil */}
                                      <MobileConformitySelector
                                        selectedValue={selectedCheckboxes[fieldKey]}
                                        onSelect={(value) => handleCheckboxChange(periodIdx, programIdx, descIdx, value)}
                                        fieldKey={fieldKey}
                                      />

                                      {/* Campos de Texto Móviles */}
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                                        <TextField
                                          name={`Problemas_${periodIdx}_${programIdx}_${descIdx}`}
                                          defaultValue={desc.Problema}
                                          placeholder="Describa el problema..."
                                          size="small"
                                          multiline
                                          rows={2}
                                          fullWidth
                                        />
                                        <TextField
                                          name={`Observaciones_${periodIdx}_${programIdx}_${descIdx}`}
                                          defaultValue={desc.Observacion}
                                          placeholder="Agregue observaciones..."
                                          size="small"
                                          multiline
                                          rows={2}
                                          fullWidth
                                        />
                                      </Box>

                                      {/* Gestor de Fotos Móvil */}
                                      <MobilePhotoManager
                                        photos={imageSrcs}
                                        onAddPhoto={() => handleOpenPhotoModal(fieldKey)}
                                        onDeletePhoto={(index) => {
                                          if (imageSrcs[index].startsWith("blob:")) {
                                            setCapturedPhotos(prevState => ({
                                              ...prevState,
                                              [fieldKey]: prevState[fieldKey].filter((_, idx) => idx !== index)
                                            }));
                                          } else {
                                            handleDeleteImage(dato._id, index, imageSrcs[index]);
                                          }
                                        }}
                                        onPreviewPhoto={(image, index) => handleImagePreview(image, index, dato._id)}
                                        fieldKey={fieldKey}
                                      />
                                    </Paper>
                                  );
                                })}
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Navegación Inferior Móvil */}
      <BottomNavigation
        value={mobileNavValue}
        onChange={(event, newValue) => setMobileNavValue(newValue)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <BottomNavigationAction label="Inicio" icon={<Home />} />
        <BottomNavigationAction label="Auditorías" icon={<Assessment />} />
        <BottomNavigationAction label="Progreso" icon={<CheckCircle />} />
      </BottomNavigation>
    </Box>
  );

  // Renderizado desktop (código original)
  const renderDesktopView = () => (
    <Box sx={{ minHeight: '100vh', py: 3 }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 3 }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <Task />
          </Avatar>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Auditorías Pendientes
          </Typography>
          <Chip 
            icon={<Assignment />} 
            label={`${datos.length} Auditorías`} 
            color="primary" 
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 2 }}>
        {datos.length === 0 ? (
          <StyledCard>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="textSecondary">
                No hay auditorías pendientes
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Todas las auditorías asignadas han sido completadas
              </Typography>
            </CardContent>
          </StyledCard>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {datos.map((dato, periodIdx) => (
              <StyledCard key={periodIdx}>
                <CardContent sx={{ p: 0 }}>
                  {/* Header del Período */}
                  <Box
                    sx={{
                      p: 3,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                    onClick={() => handlePeriodToggle(dato._id)}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <CalendarToday />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="h2">
                              Período: {dato.Duracion}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {dato.TipoAuditoria} • {dato.Departamento}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                          <StatusChip
                            label={dato.Estado}
                            status={dato.Estado}
                            size="small"
                          />
                          <Chip
                            icon={<Person />}
                            label={dato.AuditorLider}
                            variant="outlined"
                            size="small"
                          />
                          {dato.EquipoAuditor.length > 0 && (
                            <Chip
                              icon={<Group />}
                              label={`+${dato.EquipoAuditor.length}`}
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Contenido del Período */}
                  {expandedPeriods.includes(dato._id) && (
                    <Box sx={{ p: 3 }}>
                      {/* Barra de Acciones */}
                      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <ActionButton
                          variant="contained"
                          varianttype="save"
                          startIcon={<Save />}
                          onClick={() => handleGuardarCamb(periodIdx, dato._id)}
                        >
                          Guardar Cambios
                        </ActionButton>
                        <ActionButton
                          variant="contained"
                          varianttype="generate"
                          startIcon={<CheckCircle />}
                          onClick={() => handleUpdatePeriod(periodIdx, dato._id)}
                        >
                          Generar Reporte
                        </ActionButton>
                      </Box>

                      {/* Comentario del Auditor */}
                      {dato.Comentario && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          <Typography variant="subtitle2">Comentario:</Typography>
                          {dato.Comentario}
                        </Alert>
                      )}

                      {/* Programas */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {dato.Programa.map((programa, programIdx) => {
                          const programKey = `${periodIdx}_${programIdx}`;
                          const percentage = percentages[programKey] || 0;

                          return (
                            <Paper key={programIdx} variant="outlined" sx={{ p: 3 }}>
                              {/* Header del Programa */}
                              <Box sx={{ mb: 3 }}>
                                <Grid container alignItems="center" spacing={2}>
                                  <Grid item xs={12} md={8}>
                                    <Typography variant="h6" gutterBottom>
                                      {programa.Nombre}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Box textAlign={{ md: 'right' }}>
                                      <Typography variant="subtitle1" gutterBottom>
                                        Cumplimiento: {percentage.toFixed(2)}%
                                      </Typography>
                                      <ProgressBar 
                                        variant="determinate" 
                                        value={percentage} 
                                        percentage={percentage}
                                        sx={{ mt: 1 }}
                                      />
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Box>

                              {/* Tabla de Requisitos */}
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell width="8%"><strong>ID</strong></TableCell>
                                      <TableCell width="32%"><strong>Requisito</strong></TableCell>
                                      <TableCell align="center" width="6%"><strong>Cf</strong></TableCell>
                                      <TableCell align="center" width="6%"><strong>m</strong></TableCell>
                                      <TableCell align="center" width="6%"><strong>M</strong></TableCell>
                                      <TableCell align="center" width="6%"><strong>C</strong></TableCell>
                                      <TableCell align="center" width="6%"><strong>NA</strong></TableCell>
                                      <TableCell width="20%"><strong>Problema/Hallazgos</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {programa.Descripcion.map((desc, descIdx) => {
                                      const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                                      const imageSrcs = (capturedPhotos[fieldKey] || [])
                                        .map(file => typeof file === "object" && file instanceof File ? URL.createObjectURL(file) : file)
                                        .concat(Array.isArray(desc.Hallazgo) ? desc.Hallazgo : []);

                                      return (
                                        <TableRow key={descIdx} hover>
                                          <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                              {desc.ID}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {desc.Requisito}
                                            </Typography>
                                          </TableCell>
                                          {['Conforme', 'm', 'M', 'C', 'NA'].map((checkboxName) => (
                                            <ConformityCell
                                              key={checkboxName}
                                              selected={selectedCheckboxes[fieldKey] === checkboxName}
                                              type={checkboxName}
                                              onClick={() => handleCheckboxChange(periodIdx, programIdx, descIdx, checkboxName)}
                                            >
                                              <Checkbox
                                                checked={selectedCheckboxes[fieldKey] === checkboxName}
                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, checkboxName)}
                                                sx={{ p: 0 }}
                                              />
                                            </ConformityCell>
                                          ))}
                                          <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                              <TextField
                                                name={`Problemas_${periodIdx}_${programIdx}_${descIdx}`}
                                                defaultValue={desc.Problema}
                                                placeholder="Problema..."
                                                size="small"
                                                multiline
                                                rows={2}
                                                fullWidth
                                              />
                                              <TextField
                                                name={`Observaciones_${periodIdx}_${programIdx}_${descIdx}`}
                                                defaultValue={desc.Observacion}
                                                placeholder="Hallazgo..."
                                                size="small"
                                                multiline
                                                rows={2}
                                                fullWidth
                                              />
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                              <Tooltip title="Agregar evidencia fotográfica">
                                                <IconButton
                                                  color="primary"
                                                  onClick={() => handleOpenPhotoModal(fieldKey)}
                                                  size="small"
                                                >
                                                  <AddAPhoto />
                                                </IconButton>
                                              </Tooltip>
                                              
                                              {imageSrcs.length > 0 && (
                                                <ImageGallery cols={2} gap={4}>
                                                  {imageSrcs.slice(0, 4).map((src, idx) => (
                                                    <ImageListItem key={idx}>
                                                      <img
                                                        src={src}
                                                        alt={`Evidencia ${idx + 1}`}
                                                        loading="lazy"
                                                        style={{ 
                                                          cursor: 'pointer',
                                                          borderRadius: 4,
                                                          height: 60,
                                                          objectFit: 'cover'
                                                        }}
                                                        onClick={() => handleImagePreview(src, idx, dato._id)}
                                                      />
                                                      <ImageListItemBar
                                                        position="top"
                                                        actionIcon={
                                                          <IconButton
                                                            size="small"
                                                            sx={{ color: 'white', background: 'rgba(0,0,0,0.5)' }}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleDeleteImage(dato._id, idx, src);
                                                            }}
                                                          >
                                                            <Delete fontSize="small" />
                                                          </IconButton>
                                                        }
                                                      />
                                                    </ImageListItem>
                                                  ))}
                                                </ImageGallery>
                                              )}
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </StyledCard>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      {isMobile ? renderMobileView() : renderDesktopView()}

      {/* Modales */}
      <PhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onCapture={handleCapture}
      />

      <ImagePreviewModal />

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box textAlign="center">
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Procesando...
          </Typography>
        </Box>
      </Backdrop>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default Pendientes;