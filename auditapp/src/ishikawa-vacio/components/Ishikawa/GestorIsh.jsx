import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { UserContext } from '../../../App';

function GestorIsh({ open, onClose, onSelect }) {
  const { userData } = useContext(UserContext);
  const nombre = userData?.Nombre;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!nombre || !open) return;
    const fetchIshikawas = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/ishikawa/ishesp-vac`,
          { params: { nombre } }
        );
  
        // (Opcional) refiltro por si acaso:
        const filtered = data.filter(item => 
          item.auditado?.toLowerCase() === nombre.toLowerCase()
          || (Array.isArray(item.acceso)
              && item.acceso.some(acc => acc.nombre?.toLowerCase() === nombre.toLowerCase()))
        );

        console.log('Ishikawas:', filtered); 
  
        setRecords(filtered);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIshikawas();
  }, [nombre, open]);  

  // Filtrar por estado
  const rechazados = records.filter(r => r.estado === 'Rechazado');
  const incompletos = records.filter(r => r.estado === 'Incompleto');
  const enRevision = records.filter(r => r.estado === 'Hecho');
  const aprobado = records.filter(r => r.estado === 'Aprobado');
  const finalizados = records.filter(r => r.estado === 'Finalizado');
  const total = rechazados.length + incompletos.length + enRevision.length + aprobado.length + finalizados.length;

  // Helper para renderizar cada registro clickeable
const renderItem = ({ _id, problema, createdAt, auditado }) => {
  const esPropio = auditado?.toLowerCase() === nombre.toLowerCase();
  return (
    <Typography
      key={_id}
      sx={{ mt: 1, cursor: 'pointer' }}
      onClick={() => onSelect(_id)}
    >
      • {problema}
      {' — '}{new Date(createdAt).toLocaleDateString()}
      { !esPropio && (
        <em style={{ marginLeft: 8, color: 'gray' }}>
          (Compartido por {auditado})
        </em>
      )}
    </Typography>
  );
};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle
        sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        Gestor de Ishikawa
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {loading && <Typography>Cargando registros…</Typography>}
        {error && <Typography color="error">Error: {error.message}</Typography>}

        {!loading && !error && (
          total === 0 ? (
            <Typography>No hay Ishikawas en ningún estado.</Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {(rechazados.length || incompletos.length || enRevision.length) > 0 && (
                <Box
                  component={Paper}
                  variant="outlined"
                  sx={{ p: 2, flex: '1 1 60%', minWidth: 300, maxHeight: '500px', overflowY: 'auto' }}
                >
                  {rechazados.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: 'error.main', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}
                      >
                        Rechazados ({rechazados.length})
                      </Typography>
                      {rechazados.map(item => renderItem(item))}
                    </Box>
                  )}

                  {incompletos.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: 'primary.main', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}
                      >
                        Incompletos ({incompletos.length})
                      </Typography>
                      {incompletos.map(item => renderItem(item))}
                    </Box>
                  )}

                  {enRevision.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: 'warning.main', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}
                      >
                        En Revisión ({enRevision.length})
                      </Typography>
                      {enRevision.map(item => renderItem(item))}
                    </Box>
                  )}

                  {aprobado.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: 'success.main', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}
                      >
                        Aprobados ({aprobado.length})
                      </Typography>
                      {aprobado.map(item => renderItem(item))}
                    </Box>
                  )}
                </Box>
              )}

              {finalizados.length > 0 && (
                <Box
                  component={Paper}
                  variant="outlined"
                  sx={{ p: 2, flex: '1 1 35%', minWidth: 250, maxHeight: '500px', overflowY: 'auto' }}
                > 
                  <Typography variant="h6" gutterBottom>
                    Finalizados ({finalizados.length})
                  </Typography>
                  {finalizados.map(({ _id, problema, createdAt }) => (
                    <Paper
                      key={_id}
                      variant="outlined"
                      sx={{ p: 1, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                      onClick={() => onSelect(_id)}
                    >
                      <Typography variant="subtitle2" noWrap>
                        {problema}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(createdAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

export default GestorIsh;