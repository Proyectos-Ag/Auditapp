import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListSubheader,
  ListItem,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import { UserContext } from '../App';

export default function ActivList() {
  const { userData } = useContext(UserContext);
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?.Nombre) return;
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/activities/${userData.Nombre}`)
      .then(({ data }) => {
        console.log('Data received:', data);
        setActivities(data);
      })
      .catch(error => console.error('Error al obtener las actividades:', error));
  }, [userData]);

  const handleCheck = async (ishikawaId, actividadId, event, index) => {
    if (!event.target.checked) return;
    const result = await Swal.fire({
      title: 'Confirmar acción',
      text: '¿Deseas marcar esta actividad como completada?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/ishikawa/actividad/concluido`,
        { ishikawaId, actividadId, user: userData.Nombre, concluido: true }
      );
      setActivities(prev => {
        const updated = [...prev];
        updated[index].concluido = true;
        return updated;
      });
      Swal.fire('Actualizado', 'Actividad completada con éxito.', 'success');
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      Swal.fire('Error', 'No se pudo actualizar la actividad.', 'error');
    }
  };

  const pendingActivities = activities.filter(a => !a.concluido);
  const completedActivities = activities.filter(a => a.concluido);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Mis Actividades Ishikawa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Una vez completes una actividad, márcala como completada. El administrador recibirá una notificación para su verificación.
        </Typography>
      </Box>

      {activities.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No tienes actividades asignadas.
        </Typography>
      ) : (
        <>
          <List
            component="nav"
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'background.paper', fontWeight: 'bold' }}>
                Pendientes ({pendingActivities.length})
              </ListSubheader>
            }
          >
            {pendingActivities.map((act, i) => (
              <ListItem
                key={act.actividadId || i}
                sx={{ pl: 0 }}
                secondaryAction={
                  <Checkbox
                    checked={act.concluido}
                    onChange={e => handleCheck(act.ishikawaId, act.actividadId, e, activities.indexOf(act))}
                  />
                }
              >
                <Box
                  onClick={() => {
                    if (act.tipo === 'vacio') {
                      navigate('/new2', { state: { ishikawaId: act.ishikawaId } });
                    } else {
                      navigate(
                        `/auditado/ishikawa/${act.idRep}/${act.idReq}/${act.proName}`,
                        { state: { ishikawaId: act.ishikawaId } }
                      );
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography variant="body1" fontWeight="medium" color="primary.main">
                    {act.actividad}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fecha compromiso: {Array.isArray(act.fechaCompromiso)
                      ? act.fechaCompromiso.join(', ')
                      : act.fechaCompromiso}
                  </Typography>
                </Box>
              </ListItem>

            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <List
            component="nav"
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'background.paper', fontWeight: 'bold' }}>
                Completadas ({completedActivities.length})
              </ListSubheader>
            }
          >
            {completedActivities.map((act, i) => (
              <ListItem key={act.actividadId || i} sx={{ pl: 0 }}>
                <FormControlLabel
                  control={<Checkbox checked disabled />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                        {act.actividad}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fecha compromiso: {Array.isArray(act.fechaCompromiso)
                          ? act.fechaCompromiso.join(', ')
                          : act.fechaCompromiso}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
}