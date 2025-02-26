import React, { useEffect,useState } from "react";
import {Paper, List, ListItem,Select, MenuItem, FormControl, 
    InputLabel, Modal, Box, TextField, Button, Typography } from "@mui/material";
import axios from "axios";

const AccesoModal = ({ open, handleClose, idIshikawa }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");

    const [formData, setFormData] = useState({
        acceso: "",
        nivelAcceso: 1,
      });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/acceso/${idIshikawa}`, formData);
      handleClose(); // Cierra el modal después de guardar
    } catch (error) {
      console.error("Error al actualizar el acceso:", error);
    }
  };

  useEffect(() => {
    // Evita buscar si ya se seleccionó un usuario
    if (selectedUser) {
      setSuggestions([]);
      return;
    }
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios/search?search=${encodeURIComponent(searchTerm)}`)
        .then(response => {
          setSuggestions(response.data);
        })
        .catch(error => {
          console.error("Error al buscar participantes:", error);
        });
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedUser]);

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
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Asignar Acceso
        </Typography>
        <form onSubmit={handleSubmit}>
        <TextField
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar nombre..."
            margin="normal"
        />

            {suggestions.length > 0 && (
            <Paper style={{ maxHeight: '10rem', overflowY: 'auto', marginBottom: '1rem', cursor:'pointer' }}>
                <List>
                {suggestions.map((participant, index) => (
                    <ListItem
                    button
                    key={index}
                    onClick={() => {
                      setFormData({ ...formData, acceso: participant.Nombre });
                      setSelectedUser(participant.Nombre);
                      setSearchTerm(participant.Nombre);
                      setSuggestions([]);
                    }}
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
                value={formData.nivelAcceso}
                onChange={handleChange}
                // Elimina "disabled" para que sea interactivo
            >
                <MenuItem value={1}>Solo Lectura</MenuItem>
                <MenuItem value={2}>Editar</MenuItem>
            </Select>
            </FormControl>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Guardar
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default AccesoModal;
