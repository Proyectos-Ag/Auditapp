import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
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

function ActivList() {
  const { userData } = useContext(UserContext);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!userData?.Nombre) return;
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/activities/${userData.Nombre}`)
      .then(({ data }) => setActivities(data))
      .catch(error => console.error('Error al obtener las actividades:', error));
  }, [userData]);

  const handleCheck = async (ishikawaId, actividadId, event, index, actividad) => {
    if (!event.target.checked) return;
    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se marcará la actividad como concluida.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/ishikawa/actividad/concluido`,
        { ishikawaId, actividadId, actividad, user: userData.Nombre, concluido: true }
      );
      setActivities(prev => {
        const updated = [...prev];
        updated[index].concluido = true;
        return updated;
      });
      Swal.fire('Actualizado', 'La actividad se marcó como concluida', 'success');
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      Swal.fire('Error', 'No se pudo actualizar la actividad', 'error');
    }
  };

  const pendingActivities = activities.filter(a => !a.concluido);
  const completedActivities = activities.filter(a => a.concluido);

  return (
    <Paper
      sx={{
        p: 3,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Lista de Actividades</Typography>
        <Typography variant="body2" color="text.secondary">
          Concluye una actividad y márquela como completada.
        </Typography>
      </Box>

      {activities.length === 0 ? (
        <Typography>No se encontraron actividades.</Typography>
      ) : (
        <>
          <List
            component="nav"
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'background.paper' }}>
                Pendientes ({pendingActivities.length})
              </ListSubheader>
            }
          >
            {pendingActivities.map((act, i) => (
              <ListItem key={act.actividadId || i} sx={{ pl: 0 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={act.concluido}
                      onChange={e => handleCheck(act.ishikawaId, act.actividadId, e, activities.indexOf(act), act.actividad)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {act.actividad}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fecha compromiso:{' '}{act.fechaCompromiso.join(', ')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <List
            component="nav"
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'background.paper' }}>
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
                        Fecha compromiso:{' '}{act.fechaCompromiso.join(', ')}
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

export default ActivList;
