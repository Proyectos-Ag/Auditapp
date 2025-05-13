import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from "html2canvas";
import { 
  Backdrop, 
  CircularProgress, 
  Typography, 
  Snackbar, 
  Alert,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControl,
  InputLabel,
  styled
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Delete as DeleteIcon } from '@mui/icons-material';

// Tema profesional con colores corporativos
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Azul oscuro profesional
    },
    secondary: {
      main: '#d32f2f', // Rojo corporativo
    },
    background: {
      default: '#f5f7ff', // Fondo muy claro azulado
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '1.8rem',
      color: '#1a237e',
      marginTop: '0.5rem',
      letterSpacing: '0.5px'
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.4rem',
      color: '#1a237e',
      margin: '10px 0',
      letterSpacing: '0.3px'
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.875rem'
        }
      }
    }
  }
});

// Estilo para celdas de estado con colores vibrantes
const StatusCell = styled(TableCell)(({ status }) => {
  const statusStyles = {
    'Realizada': {
      backgroundColor: '#4caf50', // Verde vibrante
      color: 'white',
    },
    'Programada': {
      backgroundColor: '#2196f3', // Azul brillante
      color: 'white',
    },
    'Por Confirmar': {
      backgroundColor: '#ff9800', // Naranja intenso
      color: 'white',
    },
    'En Curso': {
      backgroundColor: '#9c27b0', // Púrpura vibrante
      color: 'white',
    },
    'No ejecutada': {
      backgroundColor: '#f44336', // Rojo intenso
      color: 'white',
    },
    'CANCELADA': {
      backgroundColor: '#f44336', // Rojo intenso
      color: 'white',
    }
  };

   return {
    ...statusStyles[status],
    fontWeight: 500,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '0.75rem',
    borderLeft: '2px solid rgba(255,255,255,0.2)',
    borderRight: '2px solid rgba(255,255,255,0.2)',
    padding: '8px 16px', // Asegurar el padding adecuado
    '&:hover': {
      opacity: 0.9,
      transform: 'scale(1.02)'
    }
  };
});

// Estilo para filas de la tabla
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    transition: 'background-color 0.3s ease'
  }
}));

const AuditTable = () => {
  const [audits, setAudits] = useState([]);
  const [newAudit, setNewAudit] = useState({
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    modalidad: 'Presencial',
    status: 'Realizada',
  });

  const [editStatus, setEditStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [show2024, setShow2024] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const currentYear = new Date().getFullYear();
  const [confirmOpen, setConfirmOpen] = useState(false);
const [auditToDelete, setAuditToDelete] = useState(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`);
      setAudits(response.data);
    } catch (error) {
      console.error("Error al obtener las auditorías:", error);
      setSuccessMessage('❌ Error al cargar las auditorías');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAudit({
      ...newAudit,
      [name]: value
    });
  };

  const captureTableImage = async () => {
    // Crear un clon de la tabla para manipularlo sin afectar la UI
    const table = document.querySelector(".MuiTableContainer-root");
    if (!table) return null;
    
    const tableClone = table.cloneNode(true);
    tableClone.style.position = 'absolute';
    tableClone.style.left = '-9999px';
    tableClone.style.top = '-9999px';
    tableClone.style.width = table.offsetWidth + 'px';
    document.body.appendChild(tableClone);
    
    // Ocultar columnas de acciones y formulario de agregar
    const actionColumns = tableClone.querySelectorAll('th:nth-last-child(1), td:nth-last-child(1)');
    actionColumns.forEach(col => {
      col.style.display = 'none';
    });
    
    // Ocultar la última fila (formulario de agregar)
    const lastRow = tableClone.querySelector('tbody tr:last-child');
    if (lastRow) {
      lastRow.style.display = 'none';
    }
    
    // Asegurar que los estilos de estado se apliquen correctamente
    tableClone.querySelectorAll('.MuiTableCell-body').forEach(cell => {
      if (cell.textContent === 'Realizada') {
        cell.style.backgroundColor = '#4caf50';
        cell.style.color = 'white';
      } else if (cell.textContent === 'Programada') {
        cell.style.backgroundColor = '#2196f3';
        cell.style.color = 'white';
      } else if (cell.textContent === 'Por Confirmar') {
        cell.style.backgroundColor = '#ff9800';
        cell.style.color = 'white';
      } else if (cell.textContent === 'En Curso') {
        cell.style.backgroundColor = '#9c27b0';
        cell.style.color = 'white';
      } else if (cell.textContent === 'No ejecutada') {
        cell.style.backgroundColor = '#f44336';
        cell.style.color = 'white';
      }
    });
    
    // Capturar la imagen
    const canvas = await html2canvas(tableClone, { 
      scale: 2,
      backgroundColor: '#ffffff',
      logging: true,
      useCORS: true,
      allowTaint: true
    });
    
    // Eliminar el clon
    document.body.removeChild(tableClone);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  };

  const sendAuditEmail = async (auditId) => {
    const tableImageBlob = await captureTableImage();
  
    if (!tableImageBlob) {
      setSuccessMessage('⚠️ No se pudo capturar la tabla para el correo');
      return;
    }
  
    const formData = new FormData();
    formData.append("auditId", auditId);
    formData.append("tablaImagen", tableImageBlob, "auditorias.png");
  
    try {
      setEmailLoading(true);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits/send-email`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccessMessage('📨 Correo enviado exitosamente');
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      setSuccessMessage('❌ Error al enviar el correo');
    } finally {
      setEmailLoading(false);
    }
  };

  const registerAudit = async () => {
  if (!newAudit.cliente || !newAudit.fechaInicio || !newAudit.fechaFin) {
    setSuccessMessage('⚠️ Complete todos los campos requeridos');
    return;
  }

  // Convertir fechas a UTC para evitar problemas de zona horaria
  const fechaInicioUTC = new Date(newAudit.fechaInicio);
  const fechaFinUTC = new Date(newAudit.fechaFin);

  if (fechaInicioUTC > fechaFinUTC) {
    setSuccessMessage('⚠️ Fecha inicio no puede ser posterior a fecha fin');
    return;
  }

  // Ajustar las fechas para que se guarden correctamente en la base de datos
  const auditData = {
    ...newAudit,
    fechaInicio: fechaInicioUTC.toISOString().split('T')[0],
    fechaFin: fechaFinUTC.toISOString().split('T')[0]
  };

  const tempId = Date.now().toString();
  const newAuditEntry = { ...auditData, _id: tempId };
  setAudits([...audits, newAuditEntry]);

  try {
    setLoading(true);
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`,
      auditData
    );
    
    setAudits(prev => prev.map(audit => audit._id === tempId ? response.data : audit));
    setSuccessMessage('✅ Auditoría registrada correctamente');
    
    setNewAudit({
      cliente: "",
      fechaInicio: "",
      fechaFin: "",
      modalidad: "Presencial",
      status: "Realizada",
    });
  } catch (error) {
    console.error("Error al agregar auditoría:", error);
    setAudits(audits.filter(audit => audit._id !== tempId));
    setSuccessMessage('❌ Error al registrar auditoría');
  } finally {
    setLoading(false);
  }
};
  const handleEditClick = (auditId) => {
    const audit = audits.find(a => a._id === auditId);
    setEditStatus({
      ...editStatus,
      [auditId]: { editing: true, newStatus: audit.status }
    });
  };

  const handleSaveStatus = async (auditId) => {
    try {
      const newStatus = editStatus[auditId].newStatus;
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits/${auditId}`, {
        status: newStatus
      });
      
      setAudits(prev => prev.map(audit => 
        audit._id === auditId ? { ...audit, status: newStatus } : audit
      ));
      
      setEditStatus(prev => {
        const newState = { ...prev };
        delete newState[auditId];
        return newState;
      });
      
      setSuccessMessage('✅ Estado actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      setSuccessMessage('❌ Error al actualizar estado');
    }
  };

  const deleteAudit = async (auditId) => {
  try {
    setLoading(true);
    
    const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits/${auditId}`
    );
    
    if (response.data.success) {
      setAudits(audits.filter(audit => audit._id !== auditId));
      setSuccessMessage('✅ Auditoría eliminada correctamente');
    } else {
      setSuccessMessage('⚠️ ' + response.data.message);
    }
    
  } catch (error) {
    console.error("Error al eliminar auditoría:", error);
    setSuccessMessage('❌ Error al eliminar auditoría: ' + 
      (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};
  const handleCancelEdit = (auditId) => {
    setEditStatus(prev => {
      const newState = { ...prev };
      delete newState[auditId];
      return newState;
    });
  };

  const handleOpenDialog = (audit) => {
    setSelectedAudit(audit);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAudit(null);
  };

  const sortAuditsByDate = (auditsArray) => {
    return auditsArray.sort((a, b) => 
      new Date(a.fechaInicio) - new Date(b.fechaInicio)
    );
  };

  const audits2024 = sortAuditsByDate(audits.filter(audit => 
    new Date(audit.fechaInicio).getFullYear() === 2024
  ));
  
  const audits2025 = sortAuditsByDate(audits.filter(audit => 
    new Date(audit.fechaInicio).getFullYear() === 2025
  ));

 const formatDate = (dateString) => {
  // Asegurarse de que la fecha se interpreta correctamente
  const date = new Date(dateString);
  // Ajustar por zona horaria
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(adjustedDate);
};

  return (
    <ThemeProvider theme={theme}>
      <Paper elevation={0} sx={{ 
        padding: '20px 30px', 
        margin: '0 auto', 
        marginTop: 6 ,
        maxWidth: '95%',
        backgroundColor: theme.palette.background.default
      }}>
        {/* Overlay de carga */}
        <Backdrop open={loading || emailLoading} sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          backgroundColor: 'rgba(0,0,0,0.7)'
        }}>
          <CircularProgress color="inherit" size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            {emailLoading ? 'Enviando correo electrónico...' : 'Procesando solicitud...'}
          </Typography>
        </Backdrop>

        {/* Notificaciones */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={5000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity={
              successMessage.includes('✅') ? 'success' :
              successMessage.includes('❌') ? 'error' :
              successMessage.includes('⚠️') ? 'warning' : 'info'
            }
            sx={{ 
              width: '100%',
              boxShadow: theme.shadows[4],
              fontWeight: 500
            }}
          >
            {successMessage.replace(/[✅❌⚠️📨]/g, '')}
          </Alert>
        </Snackbar>

        {/* Encabezado */}
        <Typography variant="h1" sx={{ 
          marginBottom: '20px',
          marginTop: 4,
          paddingBottom: '10px',
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          PROGRAMA ANUAL DE AUDITORÍAS
          <Button
            variant="contained"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={() => sendAuditEmail('all')}
            disabled={emailLoading}
            sx={{ 
              fontSize: '0.75rem',
              padding: '8px 16px',
              borderRadius: '4px'
            }}
          >
            MANDAR CORREO ELECTRONICO
          </Button>
        </Typography>

        {/* Auditorías 2024 (solo visible en 2025) */}
        {currentYear === 2025 && (
          <div style={{ marginBottom: '30px' }}>
            <Button
              variant="outlined"
              startIcon={show2024 ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setShow2024(!show2024)}
              sx={{
                mb: 2,
                borderWidth: '2px',
                '&:hover': { borderWidth: '2px' }
              }}
            >
              {show2024 ? 'OCULTAR 2024' : 'VER AUDITORÍAS 2024'}
            </Button>

            {show2024 && (
              <Paper elevation={2} sx={{ 
                marginBottom: '30px',
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden'
              }}>
                <Typography variant="h2" sx={{ 
                  padding: '12px 16px',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white'
                }}>
                  AUDITORÍAS 2024
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          fontWeight: 600,
                          backgroundColor: theme.palette.grey[100]
                        }}>CLIENTE</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 600,
                          backgroundColor: theme.palette.grey[100]
                        }}>FECHAS</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 600,
                          backgroundColor: theme.palette.grey[100]
                        }}>MODALIDAD</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 600,
                          backgroundColor: theme.palette.grey[100]
                        }}>ESTADO</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {audits2024.map((audit) => (
                        <StyledTableRow key={audit._id} hover>
                          <TableCell>{audit.cliente}</TableCell>
                          <TableCell>
                            <Tooltip title="Ver detalles">
                              <Button
                                startIcon={<CalendarIcon />}
                                onClick={() => handleOpenDialog(audit)}
                                sx={{
                                  textTransform: 'none',
                                  color: theme.palette.primary.main,
                                  fontWeight: 500
                                }}
                              >
                                {formatDate(audit.fechaInicio)} - {formatDate(audit.fechaFin)}
                              </Button>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{audit.modalidad}</TableCell>
                          <StatusCell status={audit.status}>
                            {audit.status}
                          </StatusCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </div>
        )}

        {/* Auditorías del año actual */}
        <Typography variant="h2" sx={{ 
          padding: '12px 16px',
          backgroundColor: theme.palette.primary.main,
        }}>
          AUDITORÍAS {currentYear}
        </Typography>
        
        <TableContainer component={Paper} sx={{ 
          border: `1px solid ${theme.palette.divider}`,
          borderTop: 'none',
          boxShadow: 'none'
        }}>
          <Table className="audit-table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100] }}>CLIENTE</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100] }}>FECHAS</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100] }}>MODALIDAD</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100] }}>ESTADO</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100] }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audits2025.map((audit) => (
                <StyledTableRow key={audit._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{audit.cliente}</TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <Button
                        startIcon={<CalendarIcon />}
                        onClick={() => handleOpenDialog(audit)}
                        sx={{
                          textTransform: 'none',
                          color: theme.palette.primary.main,
                          fontWeight: 500
                        }}
                      >
                        {formatDate(audit.fechaInicio)} - {formatDate(audit.fechaFin)}
                      </Button>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{audit.modalidad}</TableCell>
                 {editStatus[audit._id]?.editing ? (
  <TableCell
    sx={{
      padding: 0, // Quitar padding para que el Select ocupe toda la celda
      backgroundColor: editStatus[audit._id].newStatus === 'Realizada' ? '#4caf50' : 
                      editStatus[audit._id].newStatus === 'Programada' ? '#2196f3' :
                      editStatus[audit._id].newStatus === 'Por Confirmar' ? '#ff9800' :
                      editStatus[audit._id].newStatus === 'En Curso' ? '#9c27b0' : '#f44336',
      color: 'white',
    }}
  >
    <FormControl fullWidth size="small" sx={{ m: 0 }}>
      <Select
        value={editStatus[audit._id].newStatus}
        onChange={(e) => setEditStatus({
          ...editStatus,
          [audit._id]: {
            ...editStatus[audit._id],
            newStatus: e.target.value
          }
        })}
        sx={{
          color: 'white',
          height: '100%',
          '& .MuiSelect-icon': {
            color: 'white'
          },
          '&:before, &:after': {
            borderBottom: 'none'
          },
          '& .MuiSelect-select': {
            padding: '6px 32px 6px 12px',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.75rem',
            fontWeight: 500
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              '& .MuiMenuItem-root': {
                fontSize: '0.75rem',
                fontWeight: 500
              }
            }
          }
        }}
      >
        <MenuItem value="Realizada" sx={{ color: '#4caf50' }}>Realizada</MenuItem>
        <MenuItem value="Programada" sx={{ color: '#2196f3' }}>Programada</MenuItem>
        <MenuItem value="Por Confirmar" sx={{ color: '#ff9800' }}>Por Confirmar</MenuItem>
        <MenuItem value="En Curso" sx={{ color: '#9c27b0' }}>En Curso</MenuItem>
        <MenuItem value="No ejecutada" sx={{ color: '#f44336' }}>No ejecutada</MenuItem>
      </Select>
    </FormControl>
  </TableCell>
) : (
  <StatusCell status={audit.status}>
    {audit.status}
  </StatusCell>
)}
{/* Reemplaza este código en tu celda de tabla */}
<TableCell>
  {editStatus[audit._id]?.editing ? (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Tooltip title="Guardar">
        <IconButton
          onClick={() => handleSaveStatus(audit._id)}
          color="primary"
          size="small"
        >
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancelar">
        <IconButton
          onClick={() => handleCancelEdit(audit._id)}
          color="error"
          size="small"
        >
          <CancelIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  ) : (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Tooltip title="Editar estado">
        <IconButton
          onClick={() => handleEditClick(audit._id)}
          color="primary"
          size="small"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Eliminar auditoría">
        <IconButton
          onClick={() => {
            setAuditToDelete(audit._id);
            setConfirmOpen(true);
          }}
          color="error"
          size="small"
          disabled={loading}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  )}
</TableCell>
                </StyledTableRow>
              ))}

              {/* Fila para nueva auditoría */}
              <StyledTableRow>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    name="cliente"
                    value={newAudit.cliente}
                    onChange={handleInputChange}
                    placeholder="Nombre del cliente"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <TextField
                      size="small"
                      type="date"
                      variant="outlined"
                      name="fechaInicio"
                      value={newAudit.fechaInicio}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: 'white' }}
                    />
                    <TextField
                      size="small"
                      type="date"
                      variant="outlined"
                      name="fechaFin"
                      value={newAudit.fechaFin}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <InputLabel>Modalidad</InputLabel>
                    <Select
                      name="modalidad"
                      value={newAudit.modalidad}
                      onChange={handleInputChange}
                      label="Modalidad"
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value="Presencial">Presencial</MenuItem>
                      <MenuItem value="Virtual">Virtual</MenuItem>
                      <MenuItem value="Mixta">Mixta</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      name="status"
                      value={newAudit.status}
                      onChange={handleInputChange}
                      label="Estado"
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value="Realizada">Realizada</MenuItem>
                      <MenuItem value="Programada">Programada</MenuItem>
                      <MenuItem value="Por Confirmar">Por Confirmar</MenuItem>
                      <MenuItem value="En Curso">En Curso</MenuItem>
                      <MenuItem value="No ejecutada">No ejecutada</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={registerAudit}
                    disabled={loading}
                    sx={{
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}
                  >
                    Agregar
                  </Button>
                </TableCell>
              </StyledTableRow>
            </TableBody>
          </Table>
        </TableContainer>
        {/* Diálogo de confirmación para eliminar */}
<Dialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  aria-labelledby="alert-dialog-title"
  aria-describedby="alert-dialog-description"
>
  <DialogTitle id="alert-dialog-title" sx={{ 
    backgroundColor: theme.palette.error.main,
    color: 'white',
    fontWeight: 600
  }}>
    CONFIRMAR ELIMINACIÓN
  </DialogTitle>
  <DialogContent sx={{ padding: '20px', mt: 2 }}>
    <Typography variant="body1">
      ¿Está seguro que desea eliminar esta auditoría? Esta acción no se puede deshacer.
    </Typography>
  </DialogContent>
  <DialogActions sx={{ padding: '16px 24px' }}>
    <Button 
      onClick={() => setConfirmOpen(false)}
      color="primary"
      variant="outlined"
    >
      CANCELAR
    </Button>
    <Button 
      onClick={() => {
        deleteAudit(auditToDelete);
        setConfirmOpen(false);
      }}
      color="error"
      variant="contained"
      autoFocus
    >
      ELIMINAR
    </Button>
  </DialogActions>
</Dialog>

        {/* Diálogo de detalles */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          {selectedAudit && (
            <>
              <DialogTitle sx={{ 
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600
              }}>
                DETALLES DE AUDITORÍA
              </DialogTitle>
              <DialogContent sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ 
                  marginBottom: '20px',
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}>
                  {selectedAudit.cliente}
                </Typography>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>FECHA DE INICIO:</Typography>
                    <Typography>{formatDate(selectedAudit.fechaInicio)}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>FECHA DE FIN:</Typography>
                    <Typography>{formatDate(selectedAudit.fechaFin)}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>MODALIDAD:</Typography>
                    <Typography>{selectedAudit.modalidad}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>ESTADO:</Typography>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontWeight: 500,
                      ...(selectedAudit.status === 'Realizada' ? {
                        backgroundColor: '#4caf50',
                        color: 'white'
                      } : selectedAudit.status === 'Programada' ? {
                        backgroundColor: '#2196f3',
                        color: 'white'
                      } : selectedAudit.status === 'Por Confirmar' ? {
                        backgroundColor: '#ff9800',
                        color: 'white'
                      } : selectedAudit.status === 'En Curso' ? {
                        backgroundColor: '#9c27b0',
                        color: 'white'
                      } : {
                        backgroundColor: '#f44336',
                        color: 'white'
                      })
                    }}>
                      {selectedAudit.status}
                    </span>
                  </div>
                </div>
              </DialogContent>
              <DialogActions sx={{ padding: '16px 24px' }}>
                <Button 
                  onClick={handleCloseDialog}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  }}
                >
                  CERRAR
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Paper>
    </ThemeProvider>
  );
};

export default AuditTable;
