import React, { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { UserContext } from "../../../App";

const AccesoModal = ({ open, handleClose, idIshikawa, problemaIshikawa, estado }) => {
  const { userData } = useContext(UserContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [accesos, setAccesos] = useState([]);

  useEffect(() => {
    if (!open) return;
    // resetear estados
    setSearchTerm("");
    setSelectedUser(null);
    setAccesos([]);

    if (idIshikawa) {
      // 2. cargar accesos existentes
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/acceso/${idIshikawa}`)
        .then(res => {
          // asumo que el backend devuelve { acceso: [...] }
          setAccesos(res.data.acceso || []);
        })
        .catch(err => {
          console.error("Error cargando accesos:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No fue posible cargar los accesos existentes."
          });
        });
    }
  }, [open, idIshikawa]);

  // Cuando el estado es Finalizado/Aprobado, forzamos Solo Lectura
  const soloLectura = ["Finalizado", "Aprobado"].includes(estado);

  useEffect(() => { 
    if (selectedUser || searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    const delay = setTimeout(() => {
      axios
        .get(
          `${process.env.REACT_APP_BACKEND_URL}/usuarios/search?search=${encodeURIComponent(
            searchTerm
          )}`
        )
        .then((res) => setSuggestions(res.data))
        .catch((err) => console.error(err));
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, selectedUser]);

  // Agrega o actualiza permiso
  const handleAddAcceso = (user) => {
    const nivel = soloLectura ? 1 : 2;
    setAccesos((prev) => {
      const idx = prev.findIndex((a) => a.correo === user.Correo);
      if (idx !== -1) {
        // actualiza nivel existente
        const updated = [...prev];
        updated[idx].nivelAcceso = nivel;
        return updated;
      }
      // agrega nuevo
      return [
        ...prev,
        {
          nombre: user.Nombre,
          correo: user.Correo,
          nivelAcceso: nivel,
          problema: problemaIshikawa,
        },
      ];
    });
    setSelectedUser(user);
    setSearchTerm("");
  };

  const handleRemoveAcceso = (correo) => {
    setAccesos((prev) => prev.filter((a) => a.correo !== correo));
  };

  const handleNivelChange = (correo, nuevoNivel) => {
    if (soloLectura) return;
    setAccesos((prev) =>
      prev.map((a) =>
        a.correo === correo ? { ...a, nivelAcceso: Number(nuevoNivel) } : a
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idIshikawa) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un Ishikawa",
        text: "Debes seleccionar un Ishikawa antes de asignar accesos.",
      });
      return;
    }
    if (accesos.some((a) => a.correo === userData.Correo)) {
      Swal.fire({
        icon: "warning",
        title: "Acceso denegado",
        text: "No puede darse acceso a sí mismo.",
      });
      return;
    }
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/ishikawa/acceso/${idIshikawa}`,
        { acceso: accesos }
      );
      Swal.fire({
        icon: "success",
        title: "Acceso actualizado",
        text: "Los permisos fueron asignados correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
      handleClose();
    } catch (error) {
      console.error(error);
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
          width: 500,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" mb={2}>
          Asignar Acceso
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Buscar usuario"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedUser(null);
            }}
            margin="normal"
          />

          {suggestions.length > 0 && (
            <Paper
              sx={{ maxHeight: 200, overflowY: "auto", my: 1, cursor: "pointer" }}
            >
              <List>
                {suggestions.map((u) => (
                  <ListItem
                    button
                    key={u.Correo}
                    onClick={() => handleAddAcceso(u)}
                  >
                    <ListItemText primary={u.Nombre} secondary={u.Correo} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Lista de accesos */}
          {accesos.length > 0 && (
            <>
              <Typography variant="subtitle1" mt={2}>
                Usuarios con acceso
              </Typography>
              <List>
                {accesos.map((a) => (
                  <ListItem
                    key={a.correo}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveAcceso(a.correo)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={a.nombre}
                      secondary={a.correo}
                    />
                    <FormControl sx={{ minWidth: 140 }}>
                      <InputLabel>Permiso</InputLabel>
                      <Select
                        value={a.nivelAcceso}
                        label="Permiso"
                        disabled={soloLectura}
                        onChange={(e) =>
                          handleNivelChange(a.correo, e.target.value)
                        }
                      >
                        <MenuItem value={1}>Solo Lectura</MenuItem>
                        <MenuItem value={2}>Editar</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={accesos.length === 0}
            >
              Guardar
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default AccesoModal;