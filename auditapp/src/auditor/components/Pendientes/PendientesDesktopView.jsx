import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Chip,
  CardContent,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Tooltip,
  IconButton,
  Alert,
  Checkbox,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Task,
  Assignment,
  CalendarToday,
  Person,
  Group,
  AddAPhoto,
  Delete,
  CheckCircle
} from '@mui/icons-material';
import {
  StyledCard,
  StatusChip,
  ProgressBar,
  ConformityCell,
  ImageGallery,
  ActionButton
} from './pendientesTheme';

const PendientesDesktopView = ({
  datos,
  expandedPeriods,
  onTogglePeriod,
  onGuardarCamb,
  onUpdatePeriod,
  percentages,
  selectedCheckboxes,
  onCheckboxChange,
  capturedPhotos,
  onOpenPhotoModal,
  onPreviewImage,
  onDeleteImage
}) => (
  <Box sx={{ minHeight: '100vh', py: 3 }}>
    {/* Header */}
    <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 3 }}>
      <Toolbar>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
          <Task />
        </Avatar>
        <Typography
          variant="h4"
          component="h1"
          sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          Auditorías Pendientes
        </Typography>
        <Chip
          icon={<Assignment />}
          label={`${datos.length} Auditorías`}
          color="primary"
          variant="outlined"
        />
      </Toolbar>
    </AppBar>

    <Box sx={{ maxWidth: 1400, mx: 'auto', px: 2 }}>
      {datos.length === 0 ? (
        <StyledCard>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircle
              sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom color="textSecondary">
              No hay auditorías pendientes
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Todas las auditorías asignadas han sido completadas
            </Typography>
          </CardContent>
        </StyledCard>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {datos.map((dato, periodIdx) => (
            <StyledCard key={periodIdx}>
              <CardContent sx={{ p: 0 }}>
                {/* Header período */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => onTogglePeriod(dato._id)}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <CalendarToday />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h2">
                            Período: {dato.Duracion}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                          >
                            {dato.TipoAuditoria} • {dato.Departamento}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box
                        display="flex"
                        gap={1}
                        justifyContent="flex-end"
                        flexWrap="wrap"
                      >
                        <StatusChip
                          label={dato.Estado}
                          status={dato.Estado}
                          size="small"
                        />
                        <Chip
                          icon={<Person />}
                          label={dato.AuditorLider}
                          variant="outlined"
                          size="small"
                        />
                        {dato.EquipoAuditor.length > 0 && (
                          <Chip
                            icon={<Group />}
                            label={`+${dato.EquipoAuditor.length}`}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Contenido período */}
                {expandedPeriods.includes(dato._id) && (
                  <Box sx={{ p: 3 }}>
                    {/* Acciones */}
                    <Box
                      sx={{
                        mb: 3,
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap'
                      }}
                    >
                      <ActionButton
                        variant="contained"
                        varianttype="save"
                        startIcon={<CheckCircle />}
                        onClick={() => onGuardarCamb(periodIdx, dato._id)}
                      >
                        Guardar Cambios
                      </ActionButton>
                      <ActionButton
                        variant="contained"
                        varianttype="generate"
                        startIcon={<CheckCircle />}
                        onClick={() => onUpdatePeriod(periodIdx, dato._id)}
                      >
                        Generar Reporte
                      </ActionButton>
                    </Box>

                    {/* Comentario */}
                    {dato.Comentario && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">
                          Comentario:
                        </Typography>
                        {dato.Comentario}
                      </Alert>
                    )}

                    {/* Programas */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                      }}
                    >
                      {dato.Programa.map((programa, programIdx) => {
                        const programKey = `${periodIdx}_${programIdx}`;
                        const percentage = percentages[programKey] || 0;

                        return (
                          <Paper
                            key={programIdx}
                            variant="outlined"
                            sx={{ p: 3 }}
                          >
                            {/* Header programa */}
                            <Box sx={{ mb: 3 }}>
                              <Grid
                                container
                                alignItems="center"
                                spacing={2}
                              >
                                <Grid item xs={12} md={8}>
                                  <Typography variant="h6" gutterBottom>
                                    {programa.Nombre}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Box textAlign={{ md: 'right' }}>
                                    <Typography
                                      variant="subtitle1"
                                      gutterBottom
                                    >
                                      Cumplimiento:{' '}
                                      {percentage.toFixed(2)}%
                                    </Typography>
                                    <ProgressBar
                                      variant="determinate"
                                      value={percentage}
                                      percentage={percentage}
                                      sx={{ mt: 1 }}
                                    />
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>

                            {/* Tabla requisitos */}
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell width="8%">
                                      <strong>ID</strong>
                                    </TableCell>
                                    <TableCell width="32%">
                                      <strong>Requisito</strong>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      width="6%"
                                    >
                                      <strong>Cf</strong>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      width="6%"
                                    >
                                      <strong>m</strong>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      width="6%"
                                    >
                                      <strong>M</strong>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      width="6%"
                                    >
                                      <strong>C</strong>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      width="6%"
                                    >
                                      <strong>NA</strong>
                                    </TableCell>
                                    <TableCell width="20%">
                                      <strong>
                                        Problema/Hallazgos
                                      </strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>
                                        Evidencia
                                      </strong>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {programa.Descripcion.map(
                                    (desc, descIdx) => {
                                      const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;

                                      const tempPhotos =
                                        capturedPhotos[fieldKey] ||
                                        [];
                                      const tempSrcs =
                                        tempPhotos.map((file) =>
                                          typeof file ===
                                            'object' &&
                                          file instanceof File
                                            ? URL.createObjectURL(
                                                file
                                              )
                                            : file
                                        );
                                      const persisted =
                                        Array.isArray(
                                          desc.Hallazgo
                                        )
                                          ? desc.Hallazgo
                                          : [];
                                      const imageSrcs = [
                                        ...tempSrcs,
                                        ...persisted
                                      ];

                                      return (
                                        <TableRow
                                          key={descIdx}
                                          hover
                                        >
                                          <TableCell>
                                            <Typography
                                              variant="body2"
                                              fontWeight="medium"
                                            >
                                              {desc.ID}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {desc.Requisito}
                                            </Typography>
                                          </TableCell>

                                          {[
                                            'Conforme',
                                            'm',
                                            'M',
                                            'C',
                                            'NA'
                                          ].map(
                                            (checkboxName) => (
                                              <ConformityCell
                                                key={
                                                  checkboxName
                                                }
                                                selected={
                                                  selectedCheckboxes[
                                                    fieldKey
                                                  ] ===
                                                  checkboxName
                                                }
                                                type={
                                                  checkboxName
                                                }
                                                onClick={() =>
                                                  onCheckboxChange(
                                                    periodIdx,
                                                    programIdx,
                                                    descIdx,
                                                    checkboxName
                                                  )
                                                }
                                              >
                                                <Checkbox
                                                  checked={
                                                    selectedCheckboxes[
                                                      fieldKey
                                                    ] ===
                                                    checkboxName
                                                  }
                                                  onChange={() =>
                                                    onCheckboxChange(
                                                      periodIdx,
                                                      programIdx,
                                                      descIdx,
                                                      checkboxName
                                                    )
                                                  }
                                                  sx={{ p: 0 }}
                                                />
                                              </ConformityCell>
                                            )
                                          )}

                                          <TableCell>
                                            <Box
                                              sx={{
                                                display:
                                                  'flex',
                                                flexDirection:
                                                  'column',
                                                gap: 1
                                              }}
                                            >
                                              <TextField
                                                name={`Problemas_${periodIdx}_${programIdx}_${descIdx}`}
                                                defaultValue={
                                                  desc.Problema
                                                }
                                                placeholder="Problema..."
                                                size="small"
                                                multiline
                                                rows={2}
                                                fullWidth
                                              />
                                              <TextField
                                                name={`Observaciones_${periodIdx}_${programIdx}_${descIdx}`}
                                                defaultValue={
                                                  desc.Observacion
                                                }
                                                placeholder="Hallazgo..."
                                                size="small"
                                                multiline
                                                rows={2}
                                                fullWidth
                                              />
                                            </Box>
                                          </TableCell>

                                          <TableCell>
                                            <Box
                                              sx={{
                                                display:
                                                  'flex',
                                                flexDirection:
                                                  'column',
                                                gap: 1
                                              }}
                                            >
                                              <Tooltip title="Agregar evidencia fotográfica">
                                                <IconButton
                                                  color="primary"
                                                  onClick={() =>
                                                    onOpenPhotoModal(
                                                      fieldKey
                                                    )
                                                  }
                                                  size="small"
                                                >
                                                  <AddAPhoto />
                                                </IconButton>
                                              </Tooltip>

                                              {imageSrcs.length >
                                                0 && (
                                                <ImageGallery
                                                  cols={2}
                                                  gap={4}
                                                >
                                                  {imageSrcs
                                                    .slice(
                                                      0,
                                                      4
                                                    )
                                                    .map(
                                                      (
                                                        src,
                                                        idx
                                                      ) => (
                                                        <ImageListItem
                                                          key={
                                                            idx
                                                          }
                                                        >
                                                          <img
                                                            src={
                                                              src
                                                            }
                                                            alt={`Evidencia ${
                                                              idx +
                                                              1
                                                            }`}
                                                            loading="lazy"
                                                            style={{
                                                              cursor:
                                                                'pointer',
                                                              borderRadius: 4,
                                                              height: 60,
                                                              objectFit:
                                                                'cover'
                                                            }}
                                                            onClick={() =>
                                                              onPreviewImage(
                                                                src,
                                                                idx,
                                                                dato._id
                                                              )
                                                            }
                                                          />
                                                          <ImageListItemBar
                                                            position="top"
                                                            actionIcon={
                                                              <IconButton
                                                                size="small"
                                                                sx={{
                                                                  color:
                                                                    'white',
                                                                  background:
                                                                    'rgba(0,0,0,0.5)'
                                                                }}
                                                                onClick={(
                                                                  e
                                                                ) => {
                                                                  e.stopPropagation();
                                                                  onDeleteImage(
                                                                    dato._id,
                                                                    idx,
                                                                    src
                                                                  );
                                                                }}
                                                              >
                                                                <Delete fontSize="small" />
                                                              </IconButton>
                                                            }
                                                          />
                                                        </ImageListItem>
                                                      )
                                                    )}
                                                </ImageGallery>
                                              )}
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </StyledCard>
          ))}
        </Box>
      )}
    </Box>
  </Box>
);

export default PendientesDesktopView;