import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Paper,
  List,
  ListItem,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Chip
} from "@mui/material";
import axios from "axios";

const AccesoModal = ({ open, handleClose, idIshikawa, problemaIshikawa}) => {
  // Estado para manejar la búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Estado para el nivel de acceso (se aplica al usuario que se selecciona)
  const [nivelAcceso, setNivelAcceso] = useState(1);
  // Array para almacenar los accesos a enviar (cada objeto contiene nombre, correo y nivelAcceso)
  const [accesos, setAccesos] = useState([]);

  // Efecto para buscar usuarios cuando se escribe en el input
  useEffect(() => {
    // Si ya se seleccionó un usuario, no mostrar sugerencias
    if (selectedUser) {
      setSuggestions([]);
      return;
    }
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      axios
        .get(
          `${process.env.REACT_APP_BACKEND_URL}/usuarios/search?search=${encodeURIComponent(
            searchTerm
          )}`
        )
        .then((response) => {
          setSuggestions(response.data);
        })
        .catch((error) => {
          console.error("Error al buscar participantes:", error);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedUser]);

  // Función para agregar un acceso al array cuando se selecciona un usuario
  const handleAddAcceso = (user) => {
    const newAcceso = {
      nombre: user.Nombre,
      correo: user.Correo,
      nivelAcceso: Number(nivelAcceso),
      problema: problemaIshikawa
    };

    setAccesos([...accesos, newAcceso]);
    setSelectedUser(user);
    setSearchTerm(user.Nombre);
    setSuggestions([]);
  };

  // Permite remover un acceso del array
  const handleRemoveAcceso = (indexToRemove) => {
    const updatedAccesos = accesos.filter((_, index) => index !== indexToRemove);
    setAccesos(updatedAccesos);
  };

  // En el submit se envía el array de accesos
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/ishikawa/acceso/${idIshikawa}`,
        { acceso: accesos }
      );

      // Notificación de éxito
      Swal.fire({
        icon: "success",
        title: "Acceso actualizado",
        text: "Los permisos fueron asignados correctamente.",
        timer: 3000,
        showConfirmButton: false,
      });

      handleClose(); // Cierra el modal después de guardar
    } catch (error) {
      console.error("Error al actualizar el acceso:", error);

      // Notificación de error
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al actualizar el acceso.",
      });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Asignar Acceso
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedUser(null); // Resetea el usuario seleccionado al cambiar el input
            }}
            placeholder="Buscar nombre..."
            margin="normal"
          />

          {suggestions.length > 0 && (
            <Paper
              style={{
                maxHeight: "10rem",
                overflowY: "auto",
                marginBottom: "1rem",
                cursor: "pointer"
              }}
            >
              <List>
                {suggestions.map((participant, index) => (
                  <ListItem
                    button
                    key={index}
                    onClick={() => handleAddAcceso(participant)}
                  >
                    {participant.Nombre}
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Nivel de Acceso</InputLabel>
            <Select
              name="nivelAcceso"
              value={nivelAcceso}
              onChange={(e) => setNivelAcceso(e.target.value)}
            >
              <MenuItem value={1}>Solo Lectura</MenuItem>
              <MenuItem value={2}>Editar</MenuItem>
            </Select>
          </FormControl>

          {/* Mostrar accesos acumulados como chips */}
          <Box sx={{ mt: 2, mb: 2 }}>
            {accesos.map((acc, index) => (
              <Chip
              key={index}
              label={`${acc.nombre} (${acc.nivelAcceso === 1 ? 'Solo Lectura' : 'Editar'})`}
              onDelete={() => handleRemoveAcceso(index)}
              sx={{ mr: 1, mb: 1 }}
            />            
            ))}
          </Box>

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Guardar
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default AccesoModal;