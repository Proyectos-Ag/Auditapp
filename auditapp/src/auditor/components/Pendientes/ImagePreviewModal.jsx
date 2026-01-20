import React from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  DialogContent
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material';

const ImagePreviewModal = ({ open, image, onClose, onDelete, isMobile }) => (
  <Dialog open={open} onClose={onClose} fullScreen={isMobile}>
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <Close />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Vista Previa
        </Typography>
        <Button color="error" startIcon={<Delete />} onClick={onDelete}>
          Eliminar
        </Button>
      </Toolbar>
    </AppBar>
    <DialogContent
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {image && (
        <img
          src={image}
          alt="Vista previa"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: 8,
            objectFit: 'contain'
          }}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default ImagePreviewModal;