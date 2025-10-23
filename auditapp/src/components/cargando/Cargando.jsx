import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente reutilizable de carga.
 *
 * Props:
 * - message: Texto que se muestra bajo el spinner (default: "Cargando...").
 * - fullScreen: Si es true, ocupa toda la pantalla con un overlay semitransparente (default: false).
 * - size: Tamaño del spinner (default: 40).
 * - thickness: Grosor del spinner (default: 4).
 *
 * Uso en otros componentes:
 *  - Spinner en línea dentro de un contenedor:
 *      <Cargando message="Obteniendo datos..." />
 *
 *  - Spinner fullScreen con overlay:
 *      <Cargando fullScreen message="Cargando vista completa" />
 */
const Cargando = ({
  message = 'Cargando...',
  fullScreen = false,
  size = 40,
  thickness = 4,
}) => (
  <Box
    sx={(theme) => ({
      // Overlay container si fullScreen
      position: fullScreen ? 'fixed' : 'relative',
      top: fullScreen ? 0 : 'auto',
      left: fullScreen ? 0 : 'auto',
      width: fullScreen ? '100vw' : '100%',
      height: fullScreen ? '100vh' : 'auto',
      backgroundColor: fullScreen ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
      zIndex: fullScreen ? theme.zIndex.modal : 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: fullScreen ? 0 : 2,
    })}
  >
    <CircularProgress size={size} thickness={thickness} />
    {message && (
      <Typography variant="body1" sx={{ mt: 1, color: fullScreen ? '#fff' : 'inherit' }}>
        {message}
      </Typography>
    )}
  </Box>
);

export default Cargando;