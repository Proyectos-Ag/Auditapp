import React, { useState } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Close, CloudUpload, PhotoCamera } from '@mui/icons-material';

const PhotoModal = ({ open, onClose, onCapture, isMobile }) => {
  const [capturedImage, setCapturedImage] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCapturedImage(URL.createObjectURL(file));
      onCapture(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isMobile}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <Close />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Agregar Evidencia
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <Box textAlign="center" py={3}>
          <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Agregar Evidencia Fotográfica
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Selecciona una imagen para agregar como evidencia
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Formatos soportados: JPG, PNG, GIF • Máximo 4 imágenes por requisito
          </Typography>
        </Box>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="photo-upload"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="photo-upload">
          <Button
            variant="contained"
            component="span"
            fullWidth
            size="large"
            startIcon={<PhotoCamera />}
            sx={{ mb: 2 }}
          >
            Seleccionar Imagen
          </Button>
        </label>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} fullWidth variant="outlined">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoModal;