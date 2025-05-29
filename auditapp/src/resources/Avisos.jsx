// src/components/Avisos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';

// Custom styled alert for announcements
const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  alignItems: 'flex-start',
  backgroundColor: theme.palette.background.paper,
  '& .MuiAlert-icon': {
    paddingTop: theme.spacing(1.2)
  }
}));

const Avisos = ({ open, onClose }) => {
  const [avisos, setAvisos] = useState([]);
  const [error, setError] = useState(false);

  // Fixed announcements (added with improved wording)
  const fixedAnnouncements = [
    {
      id: 1,
      titulo: "Actualización en Diagramas de Ishikawa",
      mensaje: "El formato de los diagramas de Ishikawa ha cambiado. Ya no es necesario agregar 'NA' a las espinas no utilizadas. Ahora puedes agregar únicamente las espinas necesarias usando el botón '+' al lado de cada rama."
    },
    {
      id: 2,
      titulo: "Cambio en la ubicación de generación de Ishikawa",
      mensaje: "Se ha eliminado la sección Ishikawa de la página de inicio. Para generar diagramas de Ishikawa, dirígete a la pestaña 'Auditado' y selecciona la opción 'Generar Ishikawa'."
    }
  ];

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/avisos`)
      .then(res => setAvisos(res.data))
      .catch(err => {
        console.error("Error al cargar avisos:", err);
        setError(true);
      });
  }, []);

  // Combine fixed announcements with backend announcements
  const allAvisos = [...fixedAnnouncements, ...avisos];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      keepMounted
      PaperProps={{
        sx: { 
          borderRadius: 2,
          boxShadow: 12
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <InfoIcon fontSize="large" />
        <Typography variant="h6" fontWeight="bold">
          Avisos Importantes
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3, bgcolor: 'background.default' }}>

        {allAvisos.length === 0 ? (
          <Alert severity="info">
            No hay avisos nuevos en este momento.
          </Alert>
        ) : (
          <Box>
            {allAvisos.map((aviso) => (
              <React.Fragment key={aviso.id}>
                <StyledAlert 
                  severity="info"
                  icon={<InfoIcon color="primary" />}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {aviso.titulo}
                  </Typography>
                  <Typography variant="body2">
                    {aviso.mensaje}
                  </Typography>
                </StyledAlert>
                <Divider sx={{ my: 1 }} />
              </React.Fragment>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          color="primary"
          sx={{ fontWeight: 'bold' }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Avisos;