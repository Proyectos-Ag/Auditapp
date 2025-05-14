import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListSubheader,
  Checkbox,
  Divider,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { UserContext } from '../App';

export default function ActivList({ onNavigate }) {
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
    <List disablePadding>

      {/* ——— PENDIENTES ——— */}
      <ListSubheader sx={{ bgcolor: 'inherit', fontWeight: 'bold', px: 1, py: 0.5 }}>
        Pendientes ({pendingActivities.length})
      </ListSubheader>

      {pendingActivities.map((act, i) => (
        <React.Fragment key={act.actividadId || i}>

          <ListItemButton
            onClick={() => {
              onNavigate();
              const safeProName = encodeURIComponent(act.proName);
              const path = act.tipo === 'vacio'
                ? '/diagramas'
                : `/auditado/ishikawa/${act.idRep}/${act.idReq}/${safeProName}`;
              navigate(path, { state: { ishikawaId: act.ishikawaId } });
            }}
            sx={{ px: 1, py: 0.75 }}
          >
            <Checkbox
              edge="start"
              checked={act.concluido}
              onClick={e => e.stopPropagation()}
              onChange={e => handleCheck(act.ishikawaId, act.actividadId, e, i)}
            />
            <ListItemText
              primary={act.actividad}
              primaryTypographyProps={{ fontWeight: 'medium', color: 'primary.main' }}
              secondary={`Fecha compromiso: ${
                Array.isArray(act.fechaCompromiso)
                  ? act.fechaCompromiso.join(', ')
                  : act.fechaCompromiso
              }`}
            />
          </ListItemButton>

          {/* separador solo entre ítems */}
          {i < pendingActivities.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}

      {/* ——— DIVIDER GENERAL ——— */}
      <Divider sx={{ my: 1 }} component="li" />

      {/* ——— COMPLETADAS ——— */}
      <ListSubheader sx={{ bgcolor: 'inherit', fontWeight: 'bold', px: 1, py: 0.5 }}>
        Completadas ({completedActivities.length})
      </ListSubheader>

      {completedActivities.map((act, i) => (
        <ListItemButton key={act.actividadId || i} disabled sx={{ px: 1, py: 0.75 }}>
          <Checkbox checked disabled edge="start" />
          <ListItemText
            primary={act.actividad}
            primaryTypographyProps={{ sx: { textDecoration: 'line-through', color: 'text.secondary' } }}
            secondary={`Fecha compromiso: ${
              Array.isArray(act.fechaCompromiso)
                ? act.fechaCompromiso.join(', ')
                : act.fechaCompromiso
            }`}
          />
        </ListItemButton>
      ))}

    </List>
  );
}