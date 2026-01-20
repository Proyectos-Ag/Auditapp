import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Chip,
  Card,
  CardContent,
  Avatar,
  Alert,
  Button,
  Paper,
  TextField,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  Menu,
  CalendarToday,
  CheckCircle,
  Person,
  Group,
  Home,
  Assessment
} from '@mui/icons-material';
import MobileConformitySelector from './MobileConformitySelector';
import MobilePhotoManager from './MobilePhotoManager';
import { StatusChip, ProgressBar } from './pendientesTheme';

const PendientesMobileView = ({
  datos,
  expandedPeriods,
  onTogglePeriod,
  onGuardarCamb,
  onUpdatePeriod,
  percentages,
  selectedCheckboxes,
  capturedPhotos,
  onOpenPhotoModal,
  onPreviewImage,
  onDeleteTempPhoto,
  onDeletePersistedPhoto,
  mobileNavValue,
  onChangeNav,
  onOpenMenu
}) => (
  <Box sx={{ pb: 7 }}>
    {/* Header Móvil */}
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onOpenMenu}
          sx={{ mr: 2 }}
        >
          <Menu />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Auditorías
        </Typography>
        <Chip label={datos.length} color="secondary" size="small" />
      </Toolbar>
    </AppBar>

    {/* Contenido Principal */}
    <Box sx={{ p: 2 }}>
      {datos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="textSecondary">
            No hay auditorías pendientes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Todas las auditorías asignadas han sido completadas
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {datos.map((dato, periodIdx) => (
            <Card key={periodIdx} elevation={2}>
              <CardContent sx={{ p: 2 }}>
                {/* Header Auditoría */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                    cursor: 'pointer'
                  }}
                  onClick={() => onTogglePeriod(dato._id)}
                >
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <CalendarToday />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600">
                      {dato.Duracion}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {dato.TipoAuditoria}
                    </Typography>
                  </Box>
                  <StatusChip label={dato.Estado} status={dato.Estado} size="small" />
                </Box>

                {/* Info adicional */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    icon={<Person />}
                    label={dato.AuditorLider}
                    size="small"
                    variant="outlined"
                  />
                  {dato.EquipoAuditor.length > 0 && (
                    <Chip
                      icon={<Group />}
                      label={`+${dato.EquipoAuditor.length}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Detalle expandido */}
                {expandedPeriods.includes(dato._id) && (
                  <Box sx={{ mt: 2 }}>
                    {/* Comentario */}
                    {dato.Comentario && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Comentario:</Typography>
                        {dato.Comentario}
                      </Alert>
                    )}

                    {/* Botones acción */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() => onGuardarCamb(periodIdx, dato._id)}
                        fullWidth
                        size="small"
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => onUpdatePeriod(periodIdx, dato._id)}
                        fullWidth
                        size="small"
                      >
                        Reporte
                      </Button>
                    </Box>

                    {/* Programas */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dato.Programa.map((programa, programIdx) => {
                        const programKey = `${periodIdx}_${programIdx}`;
                        const percentage = percentages[programKey] || 0;

                        return (
                          <Paper key={programIdx} elevation={1} sx={{ p: 2 }}>
                            {/* Header Programa */}
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="subtitle1"
                                fontWeight="600"
                                gutterBottom
                              >
                                {programa.Nombre}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  mb: 1
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="500"
                                >
                                  {percentage.toFixed(2)}%
                                </Typography>
                                <ProgressBar
                                  variant="determinate"
                                  value={percentage}
                                  percentage={percentage}
                                  sx={{ flexGrow: 1 }}
                                />
                              </Box>
                            </Box>

                            {/* Requisitos */}
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                              }}
                            >
                              {programa.Descripcion.map((desc, descIdx) => {
                                const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;

                                const tempPhotos = capturedPhotos[fieldKey] || [];
                                const tempSrcs = tempPhotos.map(file =>
                                  typeof file === 'object' && file instanceof File
                                    ? URL.createObjectURL(file)
                                    : file
                                );
                                const persisted = Array.isArray(desc.Hallazgo)
                                  ? desc.Hallazgo
                                  : [];

                                const imageSrcs = [...tempSrcs, ...persisted];

                                return (
                                  <Paper
                                    key={descIdx}
                                    variant="outlined"
                                    sx={{ p: 2 }}
                                  >
                                    {/* ID + Requisito */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography
                                        variant="caption"
                                        color="primary"
                                        fontWeight="600"
                                      >
                                        {desc.ID}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ mt: 0.5 }}
                                      >
                                        {desc.Requisito}
                                      </Typography>
                                    </Box>

                                    {/* Selector conformidad */}
                                    <MobileConformitySelector
                                      selectedValue={selectedCheckboxes[fieldKey]}
                                      onSelect={(value) =>
                                        // misma lógica que antes
                                        // (se delega al padre)
                                        null
                                      }
                                    />

                                    {/* Textos */}
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        mb: 2
                                      }}
                                    >
                                      <TextField
                                        name={`Problemas_${periodIdx}_${programIdx}_${descIdx}`}
                                        defaultValue={desc.Problema}
                                        placeholder="Describa el problema..."
                                        size="small"
                                        multiline
                                        rows={2}
                                        fullWidth
                                      />
                                      <TextField
                                        name={`Observaciones_${periodIdx}_${programIdx}_${descIdx}`}
                                        defaultValue={desc.Observacion}
                                        placeholder="Agregue observaciones..."
                                        size="small"
                                        multiline
                                        rows={2}
                                        fullWidth
                                      />
                                    </Box>

                                    {/* Fotos */}
                                    <MobilePhotoManager
                                      photos={imageSrcs}
                                      onAddPhoto={() =>
                                        onOpenPhotoModal(fieldKey)
                                      }
                                      onDeletePhoto={(index) => {
                                        const src = imageSrcs[index];
                                        if (src.startsWith('blob:')) {
                                          onDeleteTempPhoto(fieldKey, index);
                                        } else {
                                          onDeletePersistedPhoto(
                                            dato._id,
                                            index,
                                            src
                                          );
                                        }
                                      }}
                                      onPreviewPhoto={(image, index) =>
                                        onPreviewImage(
                                          image,
                                          index,
                                          dato._id
                                        )
                                      }
                                    />
                                  </Paper>
                                );
                              })}
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>

    {/* Bottom Nav */}
    <BottomNavigation
      value={mobileNavValue}
      onChange={(_, newValue) => onChangeNav(newValue)}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <BottomNavigationAction label="Inicio" icon={<Home />} />
      <BottomNavigationAction label="Auditorías" icon={<Assessment />} />
      <BottomNavigationAction label="Progreso" icon={<CheckCircle />} />
    </BottomNavigation>
  </Box>
);

export default PendientesMobileView;