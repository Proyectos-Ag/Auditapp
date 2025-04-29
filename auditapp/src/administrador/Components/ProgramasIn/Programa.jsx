import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box, Button, Card, CardContent, Typography, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Divider, Chip, 
  styled
} from '@mui/material';
import {
  Add, Delete, Edit,
  UploadFile, CloudUpload, Cancel, Save,
  ArrowDropDown, ArrowDropUp, Description
} from '@mui/icons-material';

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

const ProgramaCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
  }
}));

const DropZone = styled(Box)(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: '8px',
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main
  }
}));

const Programas = () => {
  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [programas, setProgramas] = useState([]);
  const [visibleProgramas, setVisibleProgramas] = useState({});
  const [editingRequisito, setEditingRequisito] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const fileInputRef = useRef(null);
  const [requisitos, setRequisitos] = useState([{ ID: "", Requisito: "" }]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState(null);

  const handleNombreChange = (e) => {
    setNombre(e.target.value);
  };

  const getNextID = (previousID) => {
    const parts = previousID.split('.').map(Number);
    parts[1] += 1;
    return parts.join('.');
  };  

  const handleRequisitoChange = (index, key, value) => {
    const newRequisitos = [...requisitos];
    newRequisitos[index][key] = value;
    setRequisitos(newRequisitos);
  };  
  
  const handleAddRequisito = () => {
    const lastRequisito = requisitos[requisitos.length - 1];
    const nextID = getNextID(lastRequisito.ID);
    setRequisitos([...requisitos, { ID: nextID, Requisito: "" }]);
  };  

  const handleRemoveRequisito = (index) => {
    const newRequisitos = requisitos.filter((_, i) => i !== index);
    setRequisitos(newRequisitos);
  }; 
    
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/programas/carga-masiva`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.duplicados && response.data.duplicados.length > 0) {
        Swal.fire({
          title: 'Advertencia',
          html: `<div>
            <p>Archivo cargado con éxito</p>
            <p>Programas no agregados (duplicados):</p>
            <ul style="text-align: left; padding-left: 20px;">
              ${response.data.duplicados.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>`,
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
      } else {
        Swal.fire({
          title: 'Éxito',
          text: 'Archivo cargado con éxito',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
      fetchProgramas();
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al cargar el archivo',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      fileInputRef.current.files = e.dataTransfer.files;
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const fetchProgramas = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/programas`);
      setProgramas(response.data);
      const initialVisibility = response.data.reduce((acc, programa) => {
        acc[programa._id] = false;
        return acc;
      }, {});
      setVisibleProgramas(initialVisibility);
    } catch (error) {
      console.error('Error al obtener los programas:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los programas',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  useEffect(() => {
    fetchProgramas();
  }, []);

  const toggleVisibility = (id) => {
    setVisibleProgramas((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const handleEditClick = (requisito, programaId) => {
    setEditingRequisito({ ...requisito, programaId });
    setEditingValue(requisito.Requisito);
  };

  const handleEditChange = (e) => {
    setEditingValue(e.target.value);
  };

  const handleEditProgram = (programa) => {
    setNombre(programa.Nombre);
    setRequisitos(programa.Descripcion);
    setEditingPrograma(programa._id);
    setShowForm(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrograma) {
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/programas/${editingPrograma}`, {
          Nombre: nombre,
          Descripcion: requisitos
        });
        Swal.fire({
          title: 'Programa actualizado',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } else {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/programas`, {
          Nombre: nombre,
          Descripcion: requisitos
        });
        Swal.fire({
          title: 'Programa creado',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
      
      setNombre('');
      setRequisitos([{ ID: "", Requisito: "" }]);
      setEditingPrograma(null);
      fetchProgramas();
    } catch (error) {
      console.error('Error al guardar el programa:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al guardar el programa',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProgramas = programas.map((programa) => {
        if (programa._id === editingRequisito.programaId) {
          return {
            ...programa,
            Descripcion: programa.Descripcion.map((desc) =>
              desc.ID === editingRequisito.ID ? { ...desc, Requisito: editingValue } : desc
            )
          };
        }
        return programa;
      });

      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/programas/${editingRequisito.programaId}`, {
        Descripcion: updatedProgramas.find(p => p._id === editingRequisito.programaId).Descripcion
      });

      setProgramas(updatedProgramas);
      setEditingRequisito(null);
      Swal.fire({
        title: 'Requisito actualizado',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error al actualizar el requisito:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar el requisito',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleDeleteClick = async (requisito, programaId) => {
    const confirmResult = await Swal.fire({
      title: '¿Eliminar requisito?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmResult.isConfirmed) {
      try {
        const updatedProgramas = programas.map((programa) => {
          if (programa._id === programaId) {
            return {
              ...programa,
              Descripcion: programa.Descripcion.filter((desc) => desc.ID !== requisito.ID)
            };
          }
          return programa;
        });

        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/programas/${programaId}`, {
          Descripcion: updatedProgramas.find(p => p._id === programaId).Descripcion
        });

        setProgramas(updatedProgramas);
        Swal.fire({
          title: 'Requisito eliminado',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } catch (error) {
        console.error('Error al eliminar el requisito:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar el requisito',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  const handleDeleteProgram = async (programaId) => {
    const confirmResult = await Swal.fire({
      title: '¿Eliminar programa?',
      text: "Esta acción eliminará todos los requisitos asociados",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmResult.isConfirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/programas/${programaId}`);
        fetchProgramas();
        Swal.fire({
          title: 'Programa eliminado',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } catch (error) {
        console.error('Error al eliminar el programa:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar el programa',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  return (
    <Box sx={{ padding: '40px', marginTop: '3em' }}>
      <ElegantPaper elevation={3}>
        <HeaderTypography variant="h4" gutterBottom>
          <Description sx={{ verticalAlign: 'middle', mr: 1 }} />
          Gestión de Programas
        </HeaderTypography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Sistema de Gestión para la Calidad - Módulo de Programas
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setNombre('');
                setRequisitos([{ ID: "", Requisito: "" }]);
                setEditingPrograma(null);
              }
            }}
          >
            {showForm ? "Cancelar" : "Nuevo Programa"}
          </Button>
        </Box>

        {showForm && (
          <Card sx={{ mb: 4, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {editingPrograma ? "Editar Programa" : "Crear Nuevo Programa"}
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Nombre del Programa"
                value={nombre}
                onChange={handleNombreChange}
                fullWidth
                required
                sx={{ mb: 3 }}
              />
              
              {requisitos.map((requisito, index) => (
                <Box key={index} sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label={`ID ${index + 1}`}
                    value={requisito.ID}
                    onChange={(e) => handleRequisitoChange(index, "ID", e.target.value)}
                    required
                    sx={{ flex: 1 }}
                  />
                  
                  <TextField
                    label={`Requisito ${index + 1}`}
                    value={requisito.Requisito}
                    onChange={(e) => handleRequisitoChange(index, "Requisito", e.target.value)}
                    required
                    multiline
                    rows={2}
                    sx={{ flex: 3 }}
                  />
                  
                  {index !== 0 && (
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveRequisito(index)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />}
                  onClick={handleAddRequisito}
                >
                  Agregar Requisito
                </Button>
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<Save />}
                >
                  {editingPrograma ? "Actualizar Programa" : "Guardar Programa"}
                </Button>
              </Box>
            </Box>
          </Card>
        )}

        <Card sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Carga Masiva de Programas
          </Typography>
          
          <Box 
            component="form" 
            onSubmit={handleFileUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <DropZone isDragActive={isDragActive} onClick={handleClick}>
              {file ? (
                <Box>
                  <CloudUpload fontSize="large" color="primary" sx={{ mb: 1 }} />
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Archivo seleccionado: <strong>{file.name}</strong>
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<Cancel />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Eliminar archivo
                  </Button>
                </Box>
              ) : (
                <Box>
                  <UploadFile fontSize="large" color="action" sx={{ mb: 1 }} />
                  <Typography variant="body1">
                    Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Solo se aceptan archivos .xlsx
                  </Typography>
                </Box>
              )}
              
              <input 
                ref={fileInputRef} 
                type="file" 
                onChange={handleFileChange} 
                accept=".xlsx" 
                style={{ display: 'none' }} 
                required 
              />
            </DropZone>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                startIcon={<CloudUpload />}
                disabled={!file}
              >
                Cargar Archivo
              </Button>
            </Box>
          </Box>
        </Card>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Listado de Programas
          </Typography>
          
          {programas.length > 0 ? (
            programas.sort((a, b) => a.Nombre.localeCompare(b.Nombre)).map((programa) => (
              <ProgramaCard key={programa._id}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }} onClick={() => toggleVisibility(programa._id)}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {programa.Nombre}
                    </Typography>
                    
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProgram(programa);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProgram(programa._id);
                        }}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      
                      <IconButton size="small">
                        {visibleProgramas[programa._id] ? <ArrowDropUp /> : <ArrowDropDown />}
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {visibleProgramas[programa._id] && (
                    <Box sx={{ mt: 2 }}>
                      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Requisito</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {programa.Descripcion.map((desc, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  <Chip label={desc.ID} size="small" />
                                </TableCell>
                                <TableCell>{desc.Requisito}</TableCell>
                                <TableCell>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEditClick(desc, programa._id)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteClick(desc, programa._id)}
                                    color="error"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </CardContent>
              </ProgramaCard>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay programas registrados
              </Typography>
            </Box>
          )}
        </Box>
      </ElegantPaper>

      <Dialog 
        open={!!editingRequisito} 
        onClose={() => setEditingRequisito(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Requisito</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Requisito"
            fullWidth
            multiline
            rows={4}
            value={editingValue}
            onChange={handleEditChange}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRequisito(null)}>Cancelar</Button>
          <Button onClick={handleEditSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Programas;