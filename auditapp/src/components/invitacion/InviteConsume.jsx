import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert, Stack, IconButton, Tooltip, TextField } from '@mui/material';
import { UserContext } from '../../App';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function InviteConsume() {
  const { token } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invInfo, setInvInfo] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const { setUserData } = useContext(UserContext);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/invitacion/consume/${token}`, { withCredentials: true });
        setInvInfo(res.data);
      } catch (err) {
        console.error('Error validando invitación', err);
        setError(err.response?.data?.error || 'Error validando invitación');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const aceptar = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/invitacion/consume/${token}/accept`, {}, { withCredentials: true });
      // If backend returned grantId, it's a grant to an existing user
      if (res.data.grantId) {
        setCreatedUser({ message: 'Permisos otorgados a usuario existente', grantId: res.data.grantId });
        // intentar refrescar perfil si el usuario está autenticado en esta sesión
        try {
          const verify = await api.get(`/auth/verifyToken`, { withCredentials: true });
          if (verify.data) {
            setUserData({ ...verify.data });
          }
        } catch (e) {
          // no crítico
          console.warn('No se pudo refrescar perfil tras aceptar grant', e?.response?.data || e.message);
        }
      } else if (res.data.usuario) {
        setCreatedUser(res.data.usuario);
      }
    } catch (err) {
      console.error('Error aceptando invitación', err);
      setError(err.response?.data?.error || 'Error aceptando invitación');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch (e) { console.warn('No se pudo copiar', e); }
  };

  if (loading) return (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );

  if (error) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 720, width: '100%', boxShadow: 6 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Invitación inválida</Typography>
              <Alert severity="error">{error}</Alert>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => nav('/')}>Volver</Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ maxWidth: 820, width: '100%', boxShadow: 6 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleOutlineIcon color="primary" />
              <Typography variant="h5">Invitación válida</Typography>
            </Box>

            <Typography color="text.secondary">Permisos: {invInfo?.permisos}</Typography>
            <Typography color="text.secondary">Expira: {invInfo?.expiracion ? new Date(invInfo.expiracion).toLocaleString() : ' -- '}</Typography>
            {invInfo?.targetUser && (
              <Typography color="text.secondary">Destinado a: {invInfo.targetUser.Nombre} ({invInfo.targetUser.Correo})</Typography>
            )}

            {!createdUser && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                <Button variant="contained" color="primary" onClick={aceptar} disabled={loading}>
                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Aceptar invitación y entrar (solo lectura)'}
                </Button>
                <Button variant="outlined" onClick={() => nav('/')}>Cancelar</Button>
              </Box>
            )}

            {createdUser && (
              <Box sx={{ mt: 1 }}>
                <Alert severity="success">Cuenta temporal creada correctamente. Guarda tus credenciales.</Alert>
                <Box sx={{ mt: 2 }}>
                  <TextField label="Correo" value={createdUser.Correo} fullWidth InputProps={{ readOnly: true }} size="small" />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                    <TextField label="Contraseña" value={createdUser.Contrasena} InputProps={{ readOnly: true }} size="small" sx={{ flex: 1 }} />
                    <Tooltip title="Copiar correo"><IconButton onClick={() => copyToClipboard(createdUser.Correo)}><ContentCopyIcon /></IconButton></Tooltip>
                    <Tooltip title="Copiar contraseña"><IconButton onClick={() => copyToClipboard(createdUser.Contrasena)}><ContentCopyIcon /></IconButton></Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" onClick={() => window.location.href = '/'}>Continuar</Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
