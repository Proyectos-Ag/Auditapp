import React, { useState, useEffect, useContext } from 'react';
import api from '../../../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Button,
  Autocomplete,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { UserContext } from '../../../App';

export default function GestorIsh({ open, onClose, onSelect }) {
  const { userData } = useContext(UserContext);
  const nombre = userData?.Nombre;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(1); // default to first real tab

  useEffect(() => {
    if (!nombre || !open) return;
    const fetchIshikawas = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(
          `/ishikawa/ishesp-vac`,
          { params: { nombre } }
        );
        const filtered = data.filter(item => 
          item.auditado?.toLowerCase() === nombre.toLowerCase() ||
          (Array.isArray(item.acceso) && item.acceso.some(acc => acc.nombre?.toLowerCase() === nombre.toLowerCase()))
        );
        setRecords(filtered);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIshikawas();
  }, [nombre, open]);

  // Autocomplete options: map problemas
  const autoOptions = records.map(r => ({ label: r.problema, id: r._id }));

  // Filtrar registros según inputValue
  const filtered = records;

  // Agrupar por estado
  const estadosMap = { Rechazado: [], Incompleto: [], Hecho: [], Aprobado: [], Finalizado: [] };
  filtered.forEach(r => (estadosMap[r.estado] || []).push(r));

  const tabsConfig = [
    { label: `Rechazados (${estadosMap.Rechazado.length})`, items: estadosMap.Rechazado, color: 'error.main' },
    { label: `Incompletos (${estadosMap.Incompleto.length})`, items: estadosMap.Incompleto, color: 'primary.main' },
    { label: `En Revisión (${estadosMap.Hecho.length})`, items: estadosMap.Hecho, color: 'warning.main' },
    { label: `Aprobados (${estadosMap.Aprobado.length})`, items: estadosMap.Aprobado, color: 'success.main' },
    { label: `Finalizados (${estadosMap.Finalizado.length})`, items: estadosMap.Finalizado, color: 'text.secondary' }
  ];

  const renderList = items => (
    <List>
      {items.map(({ _id, problema, createdAt, auditado }) => {
        const esPropio = auditado?.toLowerCase() === nombre.toLowerCase();
        return (
          <ListItemButton key={_id} onClick={() => onSelect(_id)}>
            <ListItemIcon>
              <FiberManualRecordIcon fontSize="small" sx={{ color: esPropio ? 'info.main' : 'disabled' }} />
            </ListItemIcon>
            <ListItemText
              primary={problema}
              secondary={`${new Date(createdAt).toLocaleDateString()}${
                !esPropio ? ` • Compartido por ${auditado}` : ''
              }`}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  const renderFinalizados = items => (
    <Box>
      {items.map(item => (
        <Accordion key={item._id} onChange={() => onSelect(item._id)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography noWrap>{item.problema}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption">
              Creado: {new Date(item.createdAt).toLocaleString()}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Gestor de Ishikawa
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {loading && (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        )}
        {error && <Typography color="error">Error: {error.message}</Typography>}
        {!loading && !error && (
          <>
            {/* Botón Crear Nuevo */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" onClick={() => onSelect(null)}>
                Crear nuevo Ishikawa
              </Button>
            </Box>
            {/* Autocomplete de búsqueda */}
            <Autocomplete
              freeSolo
              options={autoOptions}
              onChange={(e, val) => val?.id && onSelect(val.id)}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Buscar Ishikawas..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />
            {/* Pestañas por estado */}
            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {tabsConfig.map((t, i) => (
                <Tab key={i} label={t.label} sx={t.color ? { color: t.color } : undefined} />
              ))}
            </Tabs>
            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {tabsConfig[tab].items.length === 0 ? (
                <Typography>No hay registros en este estado.</Typography>
              ) : tab === tabsConfig.length - 1 ? (
                renderFinalizados(tabsConfig[tab].items)
              ) : (
                renderList(tabsConfig[tab].items)
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}