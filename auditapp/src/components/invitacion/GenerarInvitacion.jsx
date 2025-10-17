import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from '../../App';
import { Box, Card, CardContent, Typography, Button, TextField, IconButton, Tooltip, CircularProgress } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';

export default function GenerarInvitacion() {
  const { userData } = useContext(UserContext);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [duration, setDuration] = useState(8);

  const searchUsers = async (q) => {
    if (!q || q.length < 3) return setSearchResults([]);
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios/search?search=${encodeURIComponent(q)}`, { withCredentials: true });
      setSearchResults(res.data);
    } catch (err) {
      console.warn('Error buscando usuarios', err);
      setSearchResults([]);
    }
  };

  const generar = async () => {
    try {
      setError(null);
      setLoading(true);
      const payload = {};
      if (selectedUser) payload.targetUserId = selectedUser._id || selectedUser.id;
      if (duration) payload.durationHours = duration;
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/invitacion/generar`, payload, { withCredentials: true });
      const token = res.data.token;
      const inviteLink = `${process.env.REACT_APP_FRONTEND_URL}/invite/${token}`;
      setLink(inviteLink);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error generando invitación');
    } finally {
      setLoading(false);
    }
  };

  const [grants, setGrants] = useState([]);
  const [loadingGrants, setLoadingGrants] = useState(false);

  const fetchGrants = async () => {
    try {
      setLoadingGrants(true);
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/invitacion/grants`, { withCredentials: true });
      setGrants(res.data || []);
    } catch (err) {
      console.warn('Error obteniendo grants', err);
    } finally {
      setLoadingGrants(false);
    }
  };

  const revoke = async (grantId) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/invitacion/grants/${grantId}/revoke`, {}, { withCredentials: true });
      if (res.data && res.data.success) {
        // refresh list
        await fetchGrants();
        alert('Permisos revocados correctamente');
      } else {
        console.warn('Respuesta inesperada al revocar', res.data);
        alert('No se pudo revocar el grant');
      }
    } catch (err) {
      console.warn('Error revocando grant', err);
      alert('Error revocando grant');
    }
  };

  useEffect(()=>{ fetchGrants(); }, []);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      console.warn('No se pudo copiar al portapapeles', e);
    }
  };

  if (!userData || userData.TipoUsuario !== 'administrador') return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6">No autorizado</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 720, borderRadius: 2, boxShadow: 6 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <LinkIcon color="primary" />
            <Typography variant="h5" component="div">Generar invitación (solo lectura)</Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Genera un enlace de invitación que permite ver todo el sistema en modo sólo lectura.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <TextField label="Buscar usuario (dejar vacío = crear invitado)" value={searchTerm} onChange={(e)=>{ setSearchTerm(e.target.value); searchUsers(e.target.value); }} size="small" sx={{ minWidth: 240 }} />
            {searchResults.length > 0 && (
              <Box sx={{ maxHeight: 160, overflow: 'auto', bgcolor: '#fafafa', p:1, borderRadius:1 }}>
                {searchResults.map(u => (
                  <Box key={u._id || u.id} onClick={()=>{ setSelectedUser(u); setSearchResults([]); setSearchTerm(u.Nombre); }} sx={{ p:1, cursor:'pointer', '&:hover':{ background:'#eee' } }}>{u.Nombre} — {u.Correo}</Box>
                ))}
              </Box>
            )}

            <TextField label="Duración (horas)" type="number" value={duration} onChange={(e)=>setDuration(Number(e.target.value))} size="small" sx={{ width: 160 }} />

            <Button variant="contained" color="primary" onClick={generar} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
              {loading ? 'Generando...' : 'Generar enlace'}
            </Button>
            {link && (
              <TextField
                value={link}
                fullWidth
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ maxWidth: 560 }}
              />
            )}
            {link && (
              <Tooltip title="Copiar enlace">
                <IconButton onClick={handleCopy} aria-label="copiar">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>
          )}

          {link && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Comparte este enlace con la persona invitada. El enlace es válido por el periodo configurado.
            </Typography>
          )}
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={fetchGrants} disabled={loadingGrants}>Ver grants activos</Button>
            {grants.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {grants.map(g => (
                  <Box key={g._id} sx={{ p:1, borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <Box>
                      <div>{g.usuario?.Nombre} — {g.usuario?.Correo}</div>
                      <div style={{ fontSize:12, color:'#666' }}>Expira: {new Date(g.expiracion).toLocaleString()}</div>
                    </Box>
                    <Button size="small" color="error" variant="outlined" onClick={()=>revoke(g._id)}>Revocar</Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
