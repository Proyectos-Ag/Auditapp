import React from 'react';
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

/**
 * Avisos component
 * @param {boolean} open - controla si el diálogo está abierto
 * @param {() => void} onClose - función para cerrar el diálogo y marcar avisos leídos
 * @param {Array} avisos - lista de objetos { id, titulo, mensaje }
 */
const Avisos = ({ open, onClose, avisos }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      keepMounted
      PaperProps={{ sx: { borderRadius: 2, boxShadow: 12 } }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <InfoIcon fontSize="large" />
        <Typography variant="h6" fontWeight="bold">
          Avisos Importantes
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: 'background.default' }}>
        {avisos.length === 0 ? (
          <Alert severity="info">
            No hay avisos nuevos en este momento.
          </Alert>
        ) : (
          <Box>
            {avisos.map((aviso) => (
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