import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Swal from 'sweetalert2';
import './css/Departaments.css';
import './css/areaModals.css'; // Nueva hoja de estilos para los modales

const AreaForm = ({ nuevaArea, handleInputChange, handleAreaChange, areasInput, agregarAreaInput, eliminarAreaInput }) => (
  <form>
    <TextField
      fullWidth
      label="Departamento"
      name="departamento"
      value={nuevaArea.departamento}
      onChange={handleInputChange}
      margin="normal"
      variant="outlined"
    />
    <div>
      {areasInput.map((area, index) => (
        <div key={index} className="area-input-group">
          <TextField
            fullWidth
            label={`Área ${index + 1}`}
            value={area}
            onChange={(e) => handleAreaChange(e, index)}
            margin="normal"
            variant="outlined"
          />
          <IconButton
            color="error"
            onClick={() => eliminarAreaInput(index)}
            size="small"
            style={{ marginLeft: '10px' }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ))}
      <Button
        onClick={agregarAreaInput}
        variant="contained"
        startIcon={<AddCircleIcon />}
        style={{ marginTop: '10px' }}
      >
        Agregar otra área
      </Button>
    </div>
  </form>
);

const Departaments = () => {
  const [areas, setAreas] = useState([]);
  const [nuevaArea, setNuevaArea] = useState({ departamento: '', areas: [] });
  const [mostrarFormularioArea, setMostrarFormularioArea] = useState(false);
  const [areaSeleccionadaId, setAreaSeleccionadaId] = useState(null);
  const [valoresAreaSeleccionada, setValoresAreaSeleccionada] = useState({ departamento: '', areas: [] });
  const [mostrarModalActualizar, setMostrarModalActualizar] = useState(false);
  const [filtroArea, setFiltroArea] = useState('');
  const [areasInput, setAreasInput] = useState(['']); // Inicializa con un área

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/areas`);
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de áreas');
        }
        const data = await response.json();
        setAreas(data);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo obtener la lista de áreas', 'error');
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

  const handleAreaChange = (event, index) => {
    const newAreas = [...areasInput];
    newAreas[index] = event.target.value;
    setAreasInput(newAreas);
  };

  const agregarAreaInput = () => {
    setAreasInput([...areasInput, '']);
  };

  const eliminarAreaInput = (index) => {
    const newAreas = [...areasInput];
    newAreas.splice(index, 1);
    setAreasInput(newAreas);
  };

  const agregarArea = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nuevaArea,
          areas: areasInput.filter(area => area.trim() !== '') // Eliminar áreas vacías
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo agregar el área');
      }

      const data = await response.json();
      setAreas([...areas, data]);
      setNuevaArea({ departamento: '', areas: [] });
      setAreasInput(['']); // Reinicia el área input
      setMostrarFormularioArea(false);
      Swal.fire('Éxito', 'Área agregada correctamente', 'success');
    } catch (error) {
      console.error('Error al agregar el área:', error);
      Swal.fire('Error', 'No se pudo agregar el área', 'error');
    }
  };

  const eliminarArea = async (areaId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/areas/${areaId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('No se pudo eliminar el área');
      }
      const nuevasAreas = areas.filter((area) => area._id !== areaId);
      setAreas(nuevasAreas);
      Swal.fire('Éxito', 'Departamento eliminado correctamente', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo eliminar el área', 'error');
    }
  };

  const abrirModalActualizar = (areaId) => {
    setAreaSeleccionadaId(areaId);
    const areaSeleccionada = areas.find(area => area._id === areaId);
    setValoresAreaSeleccionada(areaSeleccionada);
    setMostrarModalActualizar(true);
  };

  const cerrarModalActualizar = () => {
    setMostrarModalActualizar(false);
  };

  const actualizarArea = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/areas/${areaSeleccionadaId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...valoresAreaSeleccionada,
            areas: valoresAreaSeleccionada.areas.filter(area => area.trim() !== '') // Eliminar áreas vacías
          }),
        }
      );
      if (!response.ok) {
        throw new Error('No se pudo actualizar el área');
      }
      const data = await response.json();
      const index = areas.findIndex((a) => a._id === areaSeleccionadaId);
      const nuevasAreas = [...areas];
      nuevasAreas[index] = data;
      setAreas(nuevasAreas);
      cerrarModalActualizar();
      Swal.fire('Éxito', 'Área actualizada correctamente', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el área', 'error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Gestión de Departamentos y Áreas</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setMostrarFormularioArea(true)}
          startIcon={<AddCircleIcon />}
        >
          Agregar Departamento
        </Button>
        <TextField
          label="Filtrar Departamentos"
          variant="outlined"
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          size="small"
        />
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Departamento</TableCell>
              <TableCell>Áreas</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {areas
              .filter((area) => area.departamento.toLowerCase().includes(filtroArea.toLowerCase()))
              .map((area) => (
                <TableRow key={area._id}>
                  <TableCell>{area.departamento}</TableCell>
                  <TableCell>{area.areas.join(', ')}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => abrirModalActualizar(area._id)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => eliminarArea(area._id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para agregar área */}
      <Dialog open={mostrarFormularioArea} onClose={() => setMostrarFormularioArea(false)}>
        <DialogTitle>Agregar Departamento</DialogTitle>
        <DialogContent>
          <AreaForm
            nuevaArea={nuevaArea}
            handleInputChange={handleInputChange}
            areasInput={areasInput}
            handleAreaChange={handleAreaChange}
            agregarAreaInput={agregarAreaInput}
            eliminarAreaInput={eliminarAreaInput}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarFormularioArea(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={agregarArea} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/*Actualizar Area*/}
      <Modal
      open={mostrarModalActualizar}
      onClose={cerrarModalActualizar}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography id="modal-title" variant="h6" component="h2">
            Actualizar Departamento
          </Typography>
          <IconButton onClick={cerrarModalActualizar}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" mt={2}>
          <Typography variant="subtitle1" mb={1}>
            Departamento
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            name="departamento"
            value={valoresAreaSeleccionada.departamento}
            onChange={(e) =>
              setValoresAreaSeleccionada({
                ...valoresAreaSeleccionada,
                departamento: e.target.value,
              })
            }
          />
          <Typography variant="subtitle1" mt={2} mb={1}>
            Áreas
          </Typography>
          {valoresAreaSeleccionada.areas.map((area, index) => (
            <Box display="flex" alignItems="center" mb={2} key={index}>
              <TextField
                fullWidth
                variant="outlined"
                name={`area-${index}`}
                value={area}
                onChange={(e) => {
                  const newAreas = [...valoresAreaSeleccionada.areas];
                  newAreas[index] = e.target.value;
                  setValoresAreaSeleccionada({
                    ...valoresAreaSeleccionada,
                    areas: newAreas,
                  });
                }}
                placeholder={`Área ${index + 1}`}
              />
              <Button
                color="error"
                onClick={() => {
                  const newAreas = [...valoresAreaSeleccionada.areas];
                  newAreas.splice(index, 1);
                  setValoresAreaSeleccionada({
                    ...valoresAreaSeleccionada,
                    areas: newAreas,
                  });
                }}
                sx={{ ml: 2 }}
              >
                Eliminar
              </Button>
            </Box>
          ))}
          <Button
            variant="contained"
            color="secondary"
            onClick={() =>
              setValoresAreaSeleccionada({
                ...valoresAreaSeleccionada,
                areas: [...valoresAreaSeleccionada.areas, ''],
              })
            }
          >
            Agregar otra área
          </Button>
        </Box>
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button onClick={cerrarModalActualizar} color="secondary" sx={{ mr: 2 }}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={actualizarArea}>
            Actualizar
          </Button>
        </Box>
      </Box>
    </Modal>
    </div>
  );
};

export default Departaments;