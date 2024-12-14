import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const Historial = () => {
  const [datos, setDatos] = useState([]);
  const [open, setOpen] = useState(false);

  // Obtener los datos del backend
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response =  await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/esp-historial`);
        setDatos(response.data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
    fetchDatos();
  }, []);

  // Abrir/Cerrar el modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      {/* Botón para abrir el modal */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{
            position: 'absolute',
            top: '5%',
            left: '75%',
            transform: 'translate(-50%, -50%)',
        }}
        >
        Historial
        </Button>


      {/* Modal con la tabla */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Auditorías</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Auditor Líder</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Programas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datos.map((dato, index) => (
                  <TableRow key={index}>
                    <TableCell>{dato.AuditorLider}</TableCell>
                    <TableCell>{dato.FechaFin}</TableCell>
                    <TableCell>
                      {dato.Programa.join(', ')} {/* Muestra los programas como texto separado por comas */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Historial;
