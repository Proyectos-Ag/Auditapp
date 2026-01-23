import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Modal, Divider, Chip, styled, Tooltip, LinearProgress
} from '@mui/material';
import {
  AddCircle, Delete, Edit, Close, 
  Business, MeetingRoom, Add
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import api from '../../../services/api';

// Estilos personalizados
const ElegantPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)',
  border: '1px solid rgba(255,255,255,0.3)'
}));

const HeaderTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px'
  }
}));

const AreaFormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2)
}));

const AreaItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const Departaments = () => {
  const [areas, setAreas] = useState([]);
  const [nuevaArea, setNuevaArea] = useState({ departamento: '', areas: [] });
  const [mostrarFormularioArea, setMostrarFormularioArea] = useState(false);
  const [areaSeleccionadaId, setAreaSeleccionadaId] = useState(null);
  const [valoresAreaSeleccionada, setValoresAreaSeleccionada] = useState({ departamento: '', areas: [] });
  const [mostrarModalActualizar, setMostrarModalActualizar] = useState(false);
  const [filtroArea, setFiltroArea] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true);
      try {
        const response = await api.get('/areas');
        // Eliminar la verificación de response.ok
        // Axios y muchos wrappers lanzan error automáticamente si el status no es 2xx
        const data = response.data || response;
        setAreas(data);
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener la lista de áreas',
          confirmButtonColor: '#1976d2'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNuevaArea((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const agregarAreaInput = () => {
    setNuevaArea(prev => ({
      ...prev,
      areas: [...prev.areas, '']
    }));
  };

  const eliminarAreaInput = (index) => {
    const newAreas = [...nuevaArea.areas];
    newAreas.splice(index, 1);
    setNuevaArea(prev => ({
      ...prev,
      areas: newAreas
    }));
  };

  const handleAreaChange = (event, index) => {
    const newAreas = [...nuevaArea.areas];
    newAreas[index] = event.target.value;
    setNuevaArea(prev => ({
      ...prev,
      areas: newAreas
    }));
  };

  const agregarArea = async () => {
    try {
      const payload = {
        ...nuevaArea,
        areas: (nuevaArea.areas || [])
          .map(a => a.trim())
          .filter(Boolean),
      };

      const response = await api.post('/areas', payload);
      const creada = response.data?.area ?? response.data;

      setAreas(prev => [...prev, creada]);
      setNuevaArea({ departamento: '', areas: [] });
      setMostrarFormularioArea(false);

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Área agregada correctamente',
        confirmButtonColor: '#1976d2',
      });
    } catch (err) {
      console.error('Error al agregar el área:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || 'No se pudo agregar el área',
        confirmButtonColor: '#1976d2',
      });
    }
  };

  const eliminarArea = async (areaId) => {
    const result = await Swal.fire({
      title: '¿Eliminar departamento?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/areas/${areaId}`);

      setAreas(prev => prev.filter(area => area._id !== areaId));

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Departamento eliminado correctamente',
        confirmButtonColor: '#1976d2',
      });
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error;

      const msg =
        status === 409
          ? 'No se puede eliminar: el departamento tiene referencias asociadas.'
          : backendMsg || 'No se pudo eliminar el área';

      console.error('Error al eliminar el área:', err?.response?.data || err);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#1976d2',
      });
    }
  };

  const abrirModalActualizar = (areaId) => {
    const areaSeleccionada = areas.find(area => area._id === areaId);
    setAreaSeleccionadaId(areaId);
    setValoresAreaSeleccionada({
      departamento: areaSeleccionada.departamento,
      areas: [...areaSeleccionada.areas]
    });
    setMostrarModalActualizar(true);
  };

  const actualizarArea = async () => {
    try {
      const payload = {
        ...valoresAreaSeleccionada,
        areas: (valoresAreaSeleccionada.areas || [])
          .map(a => a.trim())
          .filter(Boolean),
      };

      const response = await api.patch(`/areas/${areaSeleccionadaId}`, payload);
      const actualizada = response.data?.area ?? response.data;

      setAreas(prev => prev.map(a => (a._id === areaSeleccionadaId ? actualizada : a)));
      setMostrarModalActualizar(false);

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Área actualizada correctamente',
        confirmButtonColor: '#1976d2',
      });
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error;

      const msg =
        status === 409 ? 'No se puede actualizar: conflicto de datos.'
        : status === 404 ? 'El área ya no existe.'
        : backendMsg || 'No se pudo actualizar el área';

      console.error('Error al actualizar el área:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#1976d2',
      });
    }
  };

  return (
    <Box sx={{ padding: '40px', marginTop: '3em' }}>
      <ElegantPaper elevation={3}>
        <HeaderTypography variant="h4" gutterBottom>
          <Business sx={{ verticalAlign: 'middle', mr: 1 }} />
          Gestión de Departamentos y Áreas
        </HeaderTypography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Administre los departamentos y sus áreas correspondientes
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={() => setMostrarFormularioArea(true)}
          >
            Nuevo Departamento
          </Button>
          
          <TextField
            label="Buscar departamento"
            variant="outlined"
            size="small"
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            sx={{ width: 300 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Departamento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Áreas</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areas
                  .filter((area) => area.departamento.toLowerCase().includes(filtroArea.toLowerCase()))
                  .map((area) => (
                    <TableRow key={area._id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{area.departamento}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {area.areas.map((areaItem, idx) => (
                            <Chip 
                              key={idx} 
                              label={areaItem} 
                              size="small" 
                              icon={<MeetingRoom fontSize="small" />}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => abrirModalActualizar(area._id)}
                            size="small"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => eliminarArea(area._id)}
                            size="small"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Modal para agregar área */}
        <Dialog 
          open={mostrarFormularioArea} 
          onClose={() => setMostrarFormularioArea(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AddCircle color="primary" sx={{ mr: 1 }} />
              Nuevo Departamento
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Nombre del Departamento"
              name="departamento"
              value={nuevaArea.departamento}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            <Typography variant="subtitle1" gutterBottom>
              Áreas del Departamento
            </Typography>
            
            <AreaFormContainer>
              {nuevaArea.areas.map((area, index) => (
                <AreaItem key={index}>
                  <TextField
                    fullWidth
                    label={`Área ${index + 1}`}
                    value={area}
                    onChange={(e) => handleAreaChange(e, index)}
                    variant="outlined"
                    size="small"
                  />
                  <IconButton
                    color="error"
                    onClick={() => eliminarAreaInput(index)}
                    size="small"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </AreaItem>
              ))}
              
              <Button
                onClick={agregarAreaInput}
                variant="outlined"
                startIcon={<Add />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Agregar Área
              </Button>
            </AreaFormContainer>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setMostrarFormularioArea(false);
                setNuevaArea({ departamento: '', areas: [] });
              }}
              color="secondary"
            >
              Cancelar
            </Button>
            <Button 
              onClick={agregarArea} 
              variant="contained"
              disabled={!nuevaArea.departamento || nuevaArea.areas.length === 0}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal para actualizar área */}
        <Modal
          open={mostrarModalActualizar}
          onClose={() => setMostrarModalActualizar(false)}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '600px' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={3} borderBottom={1} borderColor="divider">
              <Typography id="modal-title" variant="h6" component="h2">
                <Edit color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Editar Departamento
              </Typography>
              <IconButton onClick={() => setMostrarModalActualizar(false)}>
                <Close />
              </IconButton>
            </Box>
            
            <Box p={3}>
              <TextField
                fullWidth
                label="Nombre del Departamento"
                name="departamento"
                value={valoresAreaSeleccionada.departamento}
                onChange={(e) =>
                  setValoresAreaSeleccionada({
                    ...valoresAreaSeleccionada,
                    departamento: e.target.value,
                  })
                }
                margin="normal"
                variant="outlined"
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Áreas del Departamento
              </Typography>
              
              <AreaFormContainer>
                {valoresAreaSeleccionada.areas.map((area, index) => (
                  <AreaItem key={index}>
                    <TextField
                      fullWidth
                      label={`Área ${index + 1}`}
                      value={area}
                      onChange={(e) => {
                        const newAreas = [...valoresAreaSeleccionada.areas];
                        newAreas[index] = e.target.value;
                        setValoresAreaSeleccionada({
                          ...valoresAreaSeleccionada,
                          areas: newAreas,
                        });
                      }}
                      variant="outlined"
                      size="small"
                    />
                    <IconButton
                      color="error"
                      onClick={() => {
                        const newAreas = [...valoresAreaSeleccionada.areas];
                        newAreas.splice(index, 1);
                        setValoresAreaSeleccionada({
                          ...valoresAreaSeleccionada,
                          areas: newAreas,
                        });
                      }}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </AreaItem>
                ))}
                
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() =>
                    setValoresAreaSeleccionada({
                      ...valoresAreaSeleccionada,
                      areas: [...valoresAreaSeleccionada.areas, ''],
                    })
                  }
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Agregar Área
                </Button>
              </AreaFormContainer>
            </Box>
            
            <Box display="flex" justifyContent="flex-end" p={2} borderTop={1} borderColor="divider">
              <Button 
                onClick={() => setMostrarModalActualizar(false)} 
                color="secondary" 
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                onClick={actualizarArea}
                disabled={!valoresAreaSeleccionada.departamento || valoresAreaSeleccionada.areas.length === 0}
              >
                Guardar Cambios
              </Button>
            </Box>
          </Box>
        </Modal>
      </ElegantPaper>
    </Box>
  );
};

export default Departaments;