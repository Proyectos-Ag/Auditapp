import React, { useState, useEffect } from 'react';
import html2canvas from "html2canvas";
import api from '../../../services/api';
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
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

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
      backgroundColor: '#4caf50', // Verde
      color: 'white',
    },
    'Programada': {
      backgroundColor: '#2196f3', // Azul
      color: 'white',
    },
    'Por Confirmar': {
      backgroundColor: '#ff9800', // Naranja
      color: 'white',
    },
    'En Curso': {
      backgroundColor: '#9c27b0', // Morado
      color: 'white',
    },
    'No ejecutada': {
      backgroundColor: '#f44336', // Rojo
      color: 'white',
    },
    'CANCELADA': {
      backgroundColor: '#f44336', // Rojo
      color: 'white',
    }
  };

  return {
    ...(statusStyles[status] || {}), // Aplica estilos según el estado
    fontWeight: 500,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '0.75rem',
    borderRadius: '4px',
    padding: '8px 12px',
    display: 'inline-block',
    minWidth: '100px'
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
    notas: ''
  });

  const [editingAudit, setEditingAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [show2024, setShow2024] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const currentYear = new Date().getFullYear();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentAuditId, setCurrentAuditId] = useState('');
  const [currentAuditClient, setCurrentAuditClient] = useState('');

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/programas-anuales/audits`);
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
    const table = document.querySelector(".MuiTableContainer-root");
    if (!table) return null;
    
    const tableClone = table.cloneNode(true);
    tableClone.style.position = 'absolute';
    tableClone.style.left = '-9999px';
    tableClone.style.width = table.offsetWidth + 'px';
    tableClone.style.backgroundColor = '#ffffff';
    document.body.appendChild(tableClone);
    
    const actionColumns = tableClone.querySelectorAll('th:last-child, td:last-child');
    actionColumns.forEach(col => col.style.display = 'none');
    
    const lastRow = tableClone.querySelector('tbody tr:last-child');
    if (lastRow) lastRow.style.display = 'none';
    
    const statusCells = tableClone.querySelectorAll('tbody tr');
    statusCells.forEach((row, index) => {
      if (index === statusCells.length - 1) return;
      
      const statusCell = row.querySelector('td:nth-child(4)');
      if (statusCell) {
        const status = statusCell.textContent.trim();
        
        statusCell.style.cssText = '';
        statusCell.style.fontWeight = '500';
        statusCell.style.textAlign = 'center';
        statusCell.style.textTransform = 'uppercase';
        statusCell.style.letterSpacing = '0.5px';
        statusCell.style.fontSize = '0.75rem';
        statusCell.style.borderRadius = '4px';
        statusCell.style.padding = '8px 12px';
        statusCell.style.minWidth = '100px';
        statusCell.style.color = 'white';
        statusCell.style.border = '1px solid #ddd';
        
        const colorMap = {
          'Realizada': '#4caf50',
          'Programada': '#2196f3', 
          'Por Confirmar': '#ff9800',
          'En Curso': '#9c27b0',
          'No ejecutada': '#f44336',
          'CANCELADA': '#f44336'
        };
        
        if (colorMap[status]) {
          statusCell.style.backgroundColor = colorMap[status];
          statusCell.innerHTML = `<span style="color: white; font-weight: 500;">${status}</span>`;
        }
      }
    });
    
    const tableElement = tableClone.querySelector('table');
    if (tableElement) {
      tableElement.style.borderCollapse = 'collapse';
      tableElement.style.width = '100%';
      tableElement.style.backgroundColor = '#ffffff';
    }
    
    const headers = tableClone.querySelectorAll('th');
    headers.forEach(header => {
      header.style.backgroundColor = '#1a237e';
      header.style.color = 'white';
      header.style.fontWeight = '600';
      header.style.padding = '12px';
      header.style.border = '1px solid #ddd';
    });

    const cells = tableClone.querySelectorAll('td');
    cells.forEach(cell => {
      if (!cell.querySelector('span')) {
        cell.style.padding = '12px';
        cell.style.border = '1px solid #ddd';
        cell.style.backgroundColor = '#ffffff';
      }
    });

    const canvas = await html2canvas(tableClone, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      removeContainer: true,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const clonedStatusCells = clonedDoc.querySelectorAll('tbody tr td:nth-child(4)');
        clonedStatusCells.forEach(cell => {
          const status = cell.textContent.trim();
          const colorMap = {
            'Realizada': '#4caf50',
            'Programada': '#2196f3',
            'Por Confirmar': '#ff9800', 
            'En Curso': '#9c27b0',
            'No ejecutada': '#f44336',
            'CANCELADA': '#f44336'
          };
          
          if (colorMap[status]) {
            cell.style.backgroundColor = colorMap[status];
            cell.style.color = 'white';
            cell.style.fontWeight = '500';
            cell.style.textAlign = 'center';
          }
        });
      }
    });
    
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
      await api.post(
        `/programas-anuales/audits/send-email`,
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

    const fechaInicioUTC = new Date(newAudit.fechaInicio);
    const fechaFinUTC = new Date(newAudit.fechaFin);

    if (fechaInicioUTC > fechaFinUTC) {
      setSuccessMessage('⚠️ Fecha inicio no puede ser posterior a fecha fin');
      return;
    }

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
      const response = await api.post(
        `/programas-anuales/audits`,
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
        notas: ""
      });
    } catch (error) {
      console.error("Error al agregar auditoría:", error);
      setAudits(audits.filter(audit => audit._id !== tempId));
      setSuccessMessage('❌ Error al registrar auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setAuditToDelete(id);
    setConfirmOpen(true);
  };

  const handleEditClick = (audit) => {
    setEditingAudit({ ...audit });
  };

  const handleSaveEdit = async () => {
    if (!editingAudit.cliente || !editingAudit.fechaInicio || !editingAudit.fechaFin) {
      setSuccessMessage('⚠️ Complete todos los campos requeridos');
      return;
    }

    if (new Date(editingAudit.fechaInicio) > new Date(editingAudit.fechaFin)) {
      setSuccessMessage('⚠️ Fecha inicio no puede ser posterior a fecha fin');
      return;
    }

    try {
      setLoading(true);
      await api.put(
        `/programas-anuales/audits/${editingAudit._id}`,
        editingAudit
      );
      
      setAudits(prev => prev.map(audit => 
        audit._id === editingAudit._id ? editingAudit : audit
      ));
      
      setEditingAudit(null);
      setSuccessMessage('✅ Auditoría actualizada correctamente');
    } catch (error) {
      console.error("Error al actualizar auditoría:", error);
      setSuccessMessage('❌ Error al actualizar auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAudit(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingAudit({
      ...editingAudit,
      [name]: value
    });
  };

  const deleteAudit = async (auditId) => {
    try {
      setLoading(true);
      
      const response = await api.delete(
        `/programas-anuales/audits/${auditId}`
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

  const handleOpenDialog = (audit) => {
    setSelectedAudit(audit);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAudit(null);
  };

  // Funciones para manejar las notas
  const handleOpenNotesDialog = async (auditId, cliente) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/programas-anuales/audits/${auditId}/notas`
      );
      
      setCurrentNotes(response.data.notas || '');
      setCurrentAuditId(auditId);
      setCurrentAuditClient(cliente);
      setNotesDialogOpen(true);
    } catch (error) {
      console.error("Error al obtener notas:", error);
      setSuccessMessage('❌ Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotesDialog = () => {
    setNotesDialogOpen(false);
    setCurrentNotes('');
    setCurrentAuditId('');
    setCurrentAuditClient('');
  };

  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      await api.put(
        `/programas-anuales/audits/${currentAuditId}/notas`,
        { notas: currentNotes }
      );
      
      // Actualizar el estado local con las nuevas notas
      setAudits(prev => prev.map(audit => 
        audit._id === currentAuditId ? { ...audit, notas: currentNotes } : audit
      ));
      
      setSuccessMessage('✅ Notas guardadas correctamente');
      setNotesDialogOpen(false);
    } catch (error) {
      console.error("Error al guardar notas:", error);
      setSuccessMessage('❌ Error al guardar las notas');
    } finally {
      setLoading(false);
    }
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
    const date = new Date(dateString);
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
        marginTop: 6,
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
                  {/* Cliente */}
                  <TableCell sx={{ fontWeight: 500 }}>
                    {editingAudit?._id === audit._id ? (
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        name="cliente"
                        value={editingAudit.cliente}
                        onChange={handleEditChange}
                      />
                    ) : (
                      audit.cliente
                    )}
                  </TableCell>
                  
                  {/* Fechas */}
                  <TableCell>
                    {editingAudit?._id === audit._id ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <TextField
                          size="small"
                          type="date"
                          variant="outlined"
                          name="fechaInicio"
                          value={editingAudit.fechaInicio}
                          onChange={handleEditChange}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          size="small"
                          type="date"
                          variant="outlined"
                          name="fechaFin"
                          value={editingAudit.fechaFin}
                          onChange={handleEditChange}
                          InputLabelProps={{ shrink: true }}
                        />
                      </div>
                    ) : (
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
                    )}
                  </TableCell>
                  
                  {/* Modalidad */}
                  <TableCell>
                    {editingAudit?._id === audit._id ? (
                      <FormControl fullWidth size="small">
                        <Select
                          name="modalidad"
                          value={editingAudit.modalidad}
                          onChange={handleEditChange}
                        >
                          <MenuItem value="Presencial">Presencial</MenuItem>
                          <MenuItem value="Virtual">Virtual</MenuItem>
                          <MenuItem value="Mixta">Mixta</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      audit.modalidad
                    )}
                  </TableCell>
                  
                  {/* Estado */}
                  <TableCell>
                    {editingAudit?._id === audit._id ? (
                      <FormControl fullWidth size="small">
                        <Select
                          name="status"
                          value={editingAudit.status}
                          onChange={handleEditChange}
                          sx={{
                            backgroundColor: 
                              editingAudit.status === 'Realizada' ? '#4caf50' : 
                              editingAudit.status === 'Programada' ? '#2196f3' :
                              editingAudit.status === 'Por Confirmar' ? '#ff9800' :
                              editingAudit.status === 'En Curso' ? '#9c27b0' : '#f44336',
                            color: 'white',
                            '& .MuiSelect-icon': {
                              color: 'white'
                            }
                          }}
                        >
                          <MenuItem value="Realizada">Realizada</MenuItem>
                          <MenuItem value="Programada">Programada</MenuItem>
                          <MenuItem value="Por Confirmar">Por Confirmar</MenuItem>
                          <MenuItem value="En Curso">En Curso</MenuItem>
                          <MenuItem value="No ejecutada">No ejecutada</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <StatusCell status={audit.status}>
                        {audit.status}
                      </StatusCell>
                    )}
                  </TableCell>
                  
                  {/* Acciones */}
                  <TableCell>
                    {editingAudit?._id === audit._id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Tooltip title="Guardar">
                          <IconButton
                            onClick={handleSaveEdit}
                            color="primary"
                            size="small"
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton
                            onClick={handleCancelEdit}
                            color="error"
                            size="small"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Tooltip title="Editar auditoría">
                          <IconButton
                            onClick={() => handleEditClick(audit)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Agregar/Ver notas">
                          <IconButton
                            onClick={() => handleOpenNotesDialog(audit._id, audit.cliente)}
                            color="info"
                            size="small"
                          >
                            <NotesIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar auditoría">
                          <IconButton
                            onClick={() => handleDeleteClick(audit._id)}
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

        {/* Diálogo de notas */}
        <Dialog open={notesDialogOpen} onClose={handleCloseNotesDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <NotesIcon />
            NOTAS PARA: {currentAuditClient}
          </DialogTitle>
          <DialogContent sx={{ padding: '20px', mt: 2 }}>
            <TextField
              multiline
              rows={8}
              fullWidth
              variant="outlined"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Escribe aquí las notas para esta auditoría..."
              inputProps={{ maxLength: 1000 }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
              {currentNotes.length}/1000 caracteres
            </Typography>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button 
              onClick={handleCloseNotesDialog}
              color="primary"
              variant="outlined"
            >
              CANCELAR
            </Button>
            <Button 
              onClick={handleSaveNotes}
              color="primary"
              variant="contained"
              disabled={loading}
            >
              GUARDAR NOTAS
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </ThemeProvider>
  );
};

export default AuditTable;
