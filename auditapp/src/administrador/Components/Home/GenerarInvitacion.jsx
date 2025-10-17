import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Chip,
  InputAdornment,
  Alert
} from '@mui/material';
import { 
  Close, 
  ContentCopy, 
  Email, 
  Link as LinkIcon,
  AccessTime,
  Person
} from '@mui/icons-material';

const GenerarInvitacion = ({ open, onClose, auditoriaId = null }) => {
  const [formData, setFormData] = useState({
    nombreInvitado: '',
    emailInvitado: '',
    descripcion: '',
    duracionHoras: 72,
    enviarEmail: true
  });
  const [enlaceGenerado, setEnlaceGenerado] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerarEnlace = async () => {
    if (!formData.emailInvitado && formData.enviarEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Email requerido',
        text: 'Debes proporcionar un email si deseas enviar la invitación'
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = auditoriaId 
        ? `/api/invitaciones/crear-especifica/${auditoriaId}`
        : '/api/invitaciones/crear-general';

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}${endpoint}`,
        formData,
        { withCredentials: true }
      );

      setEnlaceGenerado(response.data.enlace);

      Swal.fire({
        icon: 'success',
        title: '¡Invitación creada!',
        html: `
          <p>El enlace ha sido generado exitosamente</p>
          ${formData.enviarEmail ? '<p>Se ha enviado un email al invitado</p>' : ''}
        `,
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al generar invitación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo generar la invitación'
      });
    } finally {
      setLoading(false);
    }
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(enlaceGenerado);
    Swal.fire({
      icon: 'success',
      title: '¡Copiado!',
      text: 'El enlace ha sido copiado al portapapeles',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleCerrar = () => {
    setFormData({
      nombreInvitado: '',
      emailInvitado: '',
      descripcion: '',
      duracionHoras: 72,
      enviarEmail: true
    });
    setEnlaceGenerado(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCerrar} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <LinkIcon color="primary" />
            <Typography variant="h6">
              Generar Enlace de Invitación
            </Typography>
          </Box>
          <IconButton onClick={handleCerrar} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {!enlaceGenerado ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="info">
              {auditoriaId 
                ? 'El enlace dará acceso solo a esta auditoría específica'
                : 'El enlace dará acceso de solo lectura a todas las auditorías terminadas'
              }
            </Alert>

            <TextField
              fullWidth
              label="Nombre del Invitado"
              name="nombreInvitado"
              value={formData.nombreInvitado}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez (Director)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email del Invitado"
              name="emailInvitado"
              type="email"
              value={formData.emailInvitado}
              onChange={handleChange}
              placeholder="ejemplo@empresa.com"
              required={formData.enviarEmail}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Descripción (opcional)"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Propósito de la invitación..."
            />

            <FormControl fullWidth>
              <InputLabel>Duración del Enlace</InputLabel>
              <Select
                name="duracionHoras"
                value={formData.duracionHoras}
                onChange={handleChange}
                label="Duración del Enlace"
                startAdornment={
                  <InputAdornment position="start">
                    <AccessTime />
                  </InputAdornment>
                }
              >
                <MenuItem value={24}>24 horas (1 día)</MenuItem>
                <MenuItem value={48}>48 horas (2 días)</MenuItem>
                <MenuItem value={72}>72 horas (3 días)</MenuItem>
                <MenuItem value={168}>1 semana</MenuItem>
                <MenuItem value={336}>2 semanas</MenuItem>
                <MenuItem value={720}>1 mes</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" alignItems="center" gap={1}>
              <input
                type="checkbox"
                id="enviarEmail"
                name="enviarEmail"
                checked={formData.enviarEmail}
                onChange={handleChange}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="enviarEmail" style={{ cursor: 'pointer', userSelect: 'none' }}>
                Enviar enlace por email automáticamente
              </label>
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="success">
              ¡Enlace generado exitosamente!
            </Alert>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Enlace de Invitación:
              </Typography>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1}
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1, 
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}
                >
                  {enlaceGenerado}
                </Typography>
                <IconButton 
                  onClick={copiarEnlace}
                  color="primary"
                  size="small"
                  title="Copiar enlace"
                >
                  <ContentCopy />
                </IconButton>
              </Box>
            </Box>

            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                icon={<Person />}
                label={formData.nombreInvitado || 'Sin nombre'}
                size="small"
              />
              <Chip 
                icon={<AccessTime />}
                label={`Válido por ${formData.duracionHoras}h`}
                size="small"
                color="primary"
              />
            </Box>

            {formData.enviarEmail && (
              <Alert severity="info">
                Se ha enviado un email a <strong>{formData.emailInvitado}</strong> con el enlace de acceso
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!enlaceGenerado ? (
          <>
            <Button onClick={handleCerrar}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={handleGenerarEnlace}
              disabled={loading}
              startIcon={<LinkIcon />}
            >
              {loading ? 'Generando...' : 'Generar Enlace'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={copiarEnlace} startIcon={<ContentCopy />}>
              Copiar Enlace
            </Button>
            <Button variant="contained" onClick={handleCerrar}>
              Cerrar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GenerarInvitacion;