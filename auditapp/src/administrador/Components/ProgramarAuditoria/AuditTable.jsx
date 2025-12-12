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
  styled,
  Collapse,
  Box,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Chip
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
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
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentAuditId, setCurrentAuditId] = useState('');
  const [currentAuditClient, setCurrentAuditClient] = useState('');
  const [expandedYears, setExpandedYears] = useState({});
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchAudits();
    fetchAvailableYears();
  }, []);

  // Función para obtener años disponibles del backend
  const fetchAvailableYears = async () => {
    try {
      const response = await api.get('/programas-anuales/audits/years');
      setAvailableYears(response.data);
      
      // Seleccionar el año actual por defecto
      const currentYear = new Date().getFullYear();
      if (response.data && response.data.includes(currentYear)) {
        setSelectedYears([currentYear.toString()]);
      } else if (response.data && response.data.length > 0) {
        setSelectedYears([response.data[0].toString()]);
      }
    } catch (error) {
      console.error("Error al obtener años disponibles:", error);
    }
  };

  // Función para inicializar los años expandidos
  useEffect(() => {
    if (audits.length > 0) {
      const years = getAvailableYears();
      const initialExpanded = {};
      
      // Por defecto, expandir el año actual y contraer los demás
      years.forEach(year => {
        initialExpanded[year] = year === new Date().getFullYear();
      });
      
      setExpandedYears(initialExpanded);
    }
  }, [audits]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/programas-anuales/audits`);
      setAudits(response.data || []);
    } catch (error) {
      console.error("Error al obtener las auditorías:", error);
      setSuccessMessage('❌ Error al cargar las auditorías');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener todos los años disponibles en las auditorías (con validación)
  const getAvailableYears = () => {
    const yearsSet = new Set();
    
    // Filtrar auditorías que tengan fechaInicio válida
    const validAudits = audits.filter(audit => audit && audit.fechaInicio);
    
    validAudits.forEach(audit => {
      try {
        if (audit && audit.fechaInicio) {
          const date = new Date(audit.fechaInicio);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            yearsSet.add(year);
          }
        }
      } catch (error) {
        console.warn('Error al procesar fecha de auditoría:', error);
      }
    });
    
    // Ordenar años de más reciente a más antiguo
    return Array.from(yearsSet).sort((a, b) => b - a);
  };

  // Función para alternar la expansión de un año
  const toggleYearExpansion = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  // Función para obtener auditorías por año (con validación)
  const getAuditsByYear = (year) => {
    const filteredAudits = audits.filter(audit => {
      if (!audit || !audit.fechaInicio) return false;
      
      try {
        const auditYear = new Date(audit.fechaInicio).getFullYear();
        return auditYear === year;
      } catch (error) {
        console.warn('Error al obtener año de auditoría:', error);
        return false;
      }
    });
    
    return sortAuditsByDate(filteredAudits);
  };

  // Función para capturar tabla específica de años seleccionados
  const captureSelectedYearsTable = async () => {
    if (selectedYears.length === 0) return null;
    
    // Primero, expandir todos los años seleccionados temporalmente
    const originalExpandedState = { ...expandedYears };
    const updatedExpandedState = { ...expandedYears };
    
    availableYears.forEach(year => {
      updatedExpandedState[year] = selectedYears.includes(year.toString());
    });
    
    setExpandedYears(updatedExpandedState);
    
    // Esperar un momento para que se rendericen las tablas
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Crear un contenedor temporal para capturar solo los años seleccionados
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20px';
    
    // Agregar título
    const title = document.createElement('h2');
    title.textContent = `PROGRAMA ANUAL DE AUDITORÍAS - AÑOS: ${selectedYears.sort((a, b) => b - a).join(', ')}`;
    title.style.color = '#1a237e';
    title.style.fontFamily = '"Montserrat", "Arial", sans-serif';
    title.style.fontSize = '1.5rem';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    container.appendChild(title);
    
    // Agregar cada tabla de año seleccionado
    selectedYears.sort((a, b) => b - a).forEach(year => {
      const yearAudits = getAuditsByYear(parseInt(year));
      if (yearAudits.length === 0) return;
      
      // Crear encabezado del año
      const yearHeader = document.createElement('h3');
      yearHeader.textContent = `AUDITORÍAS ${year}`;
      yearHeader.style.backgroundColor = '#1a237e';
      yearHeader.style.color = 'white';
      yearHeader.style.padding = '12px 16px';
      yearHeader.style.margin = '20px 0 0 0';
      yearHeader.style.borderRadius = '4px 4px 0 0';
      container.appendChild(yearHeader);
      
      // Crear tabla para este año
      const yearTable = document.createElement('table');
      yearTable.style.width = '100%';
      yearTable.style.borderCollapse = 'collapse';
      yearTable.style.border = '1px solid #ddd';
      yearTable.style.marginBottom = '30px';
      
      // Crear encabezados de tabla
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      ['CLIENTE', 'FECHAS', 'MODALIDAD', 'ESTADO'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.backgroundColor = '#f5f5f5';
        th.style.padding = '12px';
        th.style.border = '1px solid #ddd';
        th.style.fontWeight = '600';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      yearTable.appendChild(thead);
      
      // Crear cuerpo de tabla
      const tbody = document.createElement('tbody');
      
      yearAudits.forEach(audit => {
        if (!audit) return;
        
        const row = document.createElement('tr');
        
        // Cliente
        const cellCliente = document.createElement('td');
        cellCliente.textContent = audit.cliente || 'N/A';
        cellCliente.style.padding = '12px';
        cellCliente.style.border = '1px solid #ddd';
        row.appendChild(cellCliente);
        
        // Fechas
        const cellFechas = document.createElement('td');
        cellFechas.textContent = `${formatDate(audit.fechaInicio)} - ${formatDate(audit.fechaFin)}`;
        cellFechas.style.padding = '12px';
        cellFechas.style.border = '1px solid #ddd';
        row.appendChild(cellFechas);
        
        // Modalidad
        const cellModalidad = document.createElement('td');
        cellModalidad.textContent = audit.modalidad || 'N/A';
        cellModalidad.style.padding = '12px';
        cellModalidad.style.border = '1px solid #ddd';
        row.appendChild(cellModalidad);
        
        // Estado
        const cellEstado = document.createElement('td');
        cellEstado.textContent = audit.status || 'N/A';
        cellEstado.style.padding = '8px 12px';
        cellEstado.style.border = '1px solid #ddd';
        cellEstado.style.textAlign = 'center';
        cellEstado.style.fontWeight = '500';
        cellEstado.style.textTransform = 'uppercase';
        cellEstado.style.borderRadius = '4px';
        cellEstado.style.minWidth = '100px';
        cellEstado.style.display = 'inline-block';
        
        // Aplicar color según estado
        const statusColors = {
          'Realizada': '#4caf50',
          'Programada': '#2196f3',
          'Por Confirmar': '#ff9800',
          'En Curso': '#9c27b0',
          'No ejecutada': '#f44336',
          'CANCELADA': '#f44336'
        };
        
        if (audit.status && statusColors[audit.status]) {
          cellEstado.style.backgroundColor = statusColors[audit.status];
          cellEstado.style.color = 'white';
        }
        
        row.appendChild(cellEstado);
        tbody.appendChild(row);
      });
      
      yearTable.appendChild(tbody);
      container.appendChild(yearTable);
    });
    
    document.body.appendChild(container);
    
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      removeContainer: true,
      imageTimeout: 0
    });
    
    document.body.removeChild(container);
    
    // Restaurar estado original de expansión
    setExpandedYears(originalExpandedState);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  };

  const sendAuditEmail = async () => {
    if (selectedYears.length === 0) {
      setSuccessMessage('⚠️ Debe seleccionar al menos un año');
      return;
    }

    const tableImageBlob = await captureSelectedYearsTable();
  
    if (!tableImageBlob) {
      setSuccessMessage('⚠️ No se pudo capturar la tabla para el correo');
      return;
    }
  
    const formData = new FormData();
    formData.append("selectedYears", JSON.stringify(selectedYears));
    formData.append("emailSubject", emailSubject || `Programa Anual de Auditorías ${selectedYears.sort((a, b) => b - a).join(', ')}`);
    formData.append("customMessage", customMessage || 'Se ha actualizado el programa anual de auditorías.');
    formData.append("tablaImagen", tableImageBlob, "auditorias.png");
  
    try {
      setEmailLoading(true);
      const response = await api.post(
        `/programas-anuales/audits/send-email`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccessMessage(`📨 Correo enviado exitosamente para los años: ${selectedYears.sort((a, b) => b - a).join(', ')}`);
      setEmailDialogOpen(false);
      setEmailSubject('');
      setCustomMessage('');
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
      
      // Actualizar años disponibles
      fetchAvailableYears();
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
      
      // Actualizar años disponibles
      fetchAvailableYears();
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
        
        // Actualizar años disponibles
        fetchAvailableYears();
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
    return auditsArray.sort((a, b) => {
      if (!a.fechaInicio || !b.fechaInicio) return 0;
      return new Date(a.fechaInicio) - new Date(b.fechaInicio);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAudit({
      ...newAudit,
      [name]: value
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(adjustedDate);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Manejar selección de años para correo
  const handleYearSelection = (year) => {
    const yearStr = year.toString();
    if (selectedYears.includes(yearStr)) {
      setSelectedYears(selectedYears.filter(y => y !== yearStr));
    } else {
      setSelectedYears([...selectedYears, yearStr]);
    }
  };

  const selectAllYears = () => {
    if (availableYears && availableYears.length > 0) {
      setSelectedYears(availableYears.map(year => year.toString()));
    }
  };

  const clearAllYears = () => {
    setSelectedYears([]);
  };

  // Función para renderizar la tabla de auditorías para un año específico
  const renderAuditTable = (year, auditsForYear) => {
    const isCurrentYear = year === new Date().getFullYear();
    const isExpanded = expandedYears[year] || false;

    return (
      <Box key={year} sx={{ marginBottom: '20px' }}>
        <Paper 
          elevation={2} 
          sx={{ 
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            '&:hover': {
              boxShadow: theme.shadows[4]
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: isCurrentYear ? theme.palette.primary.main : theme.palette.grey[200],
              color: isCurrentYear ? 'white' : theme.palette.text.primary,
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              '&:hover': {
                backgroundColor: isCurrentYear 
                  ? theme.palette.primary.dark 
                  : theme.palette.grey[300]
              }
            }}
            onClick={() => toggleYearExpansion(year)}
          >
            <Typography variant="h2" sx={{ 
              margin: 0,
              fontWeight: 600,
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              AUDITORÍAS {year}
              <Typography component="span" sx={{ 
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '12px',
                marginLeft: '10px'
              }}>
                {auditsForYear.length} auditoría{auditsForYear.length !== 1 ? 's' : ''}
              </Typography>
            </Typography>
            
            {selectedYears.includes(year.toString()) && (
              <Chip 
                label="Seleccionado"
                size="small"
                sx={{ 
                  backgroundColor: 'white',
                  color: theme.palette.primary.main,
                  fontWeight: 'bold'
                }}
              />
            )}
          </Box>
          
          <Collapse in={isExpanded}>
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
                    {isCurrentYear && (
                      <TableCell sx={{ 
                        fontWeight: 600,
                        backgroundColor: theme.palette.grey[100]
                      }}>ACCIONES</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditsForYear.map((audit) => (
                    <StyledTableRow key={audit._id || audit.id} hover>
                      {/* Cliente */}
                      <TableCell sx={{ fontWeight: 500 }}>
                        {editingAudit?._id === audit._id ? (
                          <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            name="cliente"
                            value={editingAudit.cliente || ''}
                            onChange={handleEditChange}
                          />
                        ) : (
                          audit.cliente || 'N/A'
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
                              value={editingAudit.fechaInicio || ''}
                              onChange={handleEditChange}
                              InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                              size="small"
                              type="date"
                              variant="outlined"
                              name="fechaFin"
                              value={editingAudit.fechaFin || ''}
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
                              disabled={!audit.fechaInicio || !audit.fechaFin}
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
                              value={editingAudit.modalidad || 'Presencial'}
                              onChange={handleEditChange}
                            >
                              <MenuItem value="Presencial">Presencial</MenuItem>
                              <MenuItem value="Virtual">Virtual</MenuItem>
                              <MenuItem value="Mixta">Mixta</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          audit.modalidad || 'N/A'
                        )}
                      </TableCell>
                      
                      {/* Estado */}
                      <TableCell>
                        {editingAudit?._id === audit._id ? (
                          <FormControl fullWidth size="small">
                            <Select
                              name="status"
                              value={editingAudit.status || 'Realizada'}
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
                          <StatusCell status={audit.status || 'N/A'}>
                            {audit.status || 'N/A'}
                          </StatusCell>
                        )}
                      </TableCell>
                      
                      {/* Acciones (solo para el año actual) */}
                      {isCurrentYear && (
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
                      )}
                    </StyledTableRow>
                  ))}
                  
                  {/* Fila para nueva auditoría (solo para el año actual) */}
                  {isCurrentYear && (
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
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      </Box>
    );
  };

  // Obtener todos los años disponibles
  const currentYear = new Date().getFullYear();
  const availableYearsList = getAvailableYears();

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
            onClick={() => setEmailDialogOpen(true)}
            disabled={emailLoading}
            sx={{ 
              fontSize: '0.75rem',
              padding: '8px 16px',
              borderRadius: '4px'
            }}
          >
            ENVIAR POR CORREO
          </Button>
        </Typography>

        {/* Controles para expandir/contraer todos */}
        <Box sx={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExpandMoreIcon />}
            onClick={() => {
              const allExpanded = {};
              availableYearsList.forEach(year => {
                allExpanded[year] = true;
              });
              setExpandedYears(allExpanded);
            }}
            disabled={availableYearsList.length === 0}
          >
            Expandir todo
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExpandLessIcon />}
            onClick={() => {
              const allCollapsed = {};
              availableYearsList.forEach(year => {
                allCollapsed[year] = false;
              });
              setExpandedYears(allCollapsed);
            }}
            disabled={availableYearsList.length === 0}
          >
            Contraer todo
          </Button>
          
          {/* Indicador de años seleccionados para correo */}
          {selectedYears.length > 0 && (
            <Chip 
              label={`${selectedYears.length} año(s) seleccionado(s)`}
              color="primary"
              variant="outlined"
              sx={{ marginLeft: 'auto' }}
            />
          )}
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total: {audits.length} auditoría{audits.length !== 1 ? 's' : ''} en {availableYearsList.length} año{availableYearsList.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Renderizar tablas por año */}
        {availableYearsList.length > 0 ? (
          availableYearsList.map(year => renderAuditTable(year, getAuditsByYear(year)))
        ) : (
          <Paper sx={{ 
            padding: '40px', 
            textAlign: 'center',
            backgroundColor: theme.palette.grey[50]
          }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
              No hay auditorías registradas
            </Typography>
            <Typography variant="body2" sx={{ marginTop: '10px', color: theme.palette.text.secondary }}>
              Comienza agregando una nueva auditoría
            </Typography>
          </Paper>
        )}

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
                  {selectedAudit.cliente || 'N/A'}
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
                    <Typography>{selectedAudit.modalidad || 'N/A'}</Typography>
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
                      {selectedAudit.status || 'N/A'}
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

        {/* Diálogo de envío de correo */}
        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <EmailIcon />
            ENVIAR PROGRAMA POR CORREO
          </DialogTitle>
          <DialogContent sx={{ padding: '20px', mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: '15px' }}>
              Seleccione los años a incluir en el correo:
            </Typography>
            
            <Box sx={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '10px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <FormGroup>
                {availableYears && availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <FormControlLabel
                      key={year}
                      control={
                        <Checkbox
                          checked={selectedYears.includes(year.toString())}
                          onChange={() => handleYearSelection(year)}
                          icon={<CheckBoxOutlineBlankIcon />}
                          checkedIcon={<CheckBoxIcon />}
                        />
                      }
                      label={`Año ${year}`}
                      sx={{ 
                        marginRight: 0,
                        '& .MuiTypography-root': {
                          fontWeight: selectedYears.includes(year.toString()) ? 600 : 400
                        }
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', padding: '10px' }}>
                    No hay años disponibles
                  </Typography>
                )}
              </FormGroup>
            </Box>
            
            <Box sx={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={selectAllYears}
                sx={{ flex: 1 }}
                disabled={!availableYears || availableYears.length === 0}
              >
                Seleccionar todos
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={clearAllYears}
                sx={{ flex: 1 }}
                color="error"
              >
                Limpiar selección
              </Button>
            </Box>
            
            {selectedYears.length > 0 && (
              <Box sx={{ 
                backgroundColor: '#e8f5e9', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Años seleccionados: {selectedYears.sort((a, b) => b - a).join(', ')}
                </Typography>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Asunto del correo"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`Ej: Programa Anual de Auditorías ${selectedYears.sort((a, b) => b - a).join(', ')}`}
              sx={{ marginBottom: '15px' }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mensaje personalizado"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ej: Se ha actualizado el programa anual de auditorías..."
            />
            
            <Typography variant="caption" sx={{ display: 'block', marginTop: '10px', color: 'text.secondary' }}>
              La tabla incluirá todas las auditorías de los años seleccionados
            </Typography>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button 
              onClick={() => {
                setEmailDialogOpen(false);
                setEmailSubject('');
                setCustomMessage('');
              }}
              color="primary"
              variant="outlined"
            >
              CANCELAR
            </Button>
            <Button 
              onClick={sendAuditEmail}
              color="primary"
              variant="contained"
              disabled={selectedYears.length === 0 || emailLoading}
              startIcon={emailLoading ? <CircularProgress size={20} /> : <EmailIcon />}
            >
              {emailLoading ? 'ENVIANDO...' : 'ENVIAR CORREO'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </ThemeProvider>
  );
};

export default AuditTable;
