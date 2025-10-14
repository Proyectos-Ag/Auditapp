import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Autocomplete,
  CircularProgress,
  Typography
} from '@mui/material';

const MySwal = withReactContent(Swal);

const diagramaInicial = [{
  problema: '',
  text1: '', text2: '', text3: '', text4: '',
  text5: '', text6: '', text7: '', text8: '',
  text9: '', text10: '', text11: '', text12: '',
  text13: '', text14: '', text15: ''
}];

export default function AsignarIshikawaModal({
  open,
  onClose,
  idRep,
  idReq,
  proName,
  descripcion,
  onAssigned
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [valorSeleccionado, setValorSeleccionado] = useState('');
  const [correoSeleccionado, setCorreoSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [existente, setExistente] = useState(null);
  const [error, setError] = useState('');
  const scrollYRef = useRef(0);

  const opcionesUsuarios = useMemo(() => {
    if (!usuarios) return [];
    return [...usuarios]
      .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es'))
      .map(u => ({ label: u.Nombre, correo: u.Correo, id: u._id }));
  }, [usuarios]);

  const hallazgoString = useMemo(() => {
    if (!descripcion) return '';
    const h = Array.isArray(descripcion.Hallazgo) ? descripcion.Hallazgo.flat() : (descripcion.Hallazgo ?? []);
    return Array.isArray(h) ? h.join(' ') : String(h);
  }, [descripcion]);

  const mostrarCargando = (mensaje = 'Cargando...') => {
    MySwal.fire({
      title: mensaje,
      text: 'Por favor, espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  };
  const ocultarCargando = () => Swal.close();

  const cargarUsuarios = async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
      setUsuarios(r.data || []);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los usuarios');
    }
  };

  const buscarExistente = async () => {
    try {
      setBuscando(true);
      const r = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
        params: { idRep, idReq, proName }
      });
      const lista = Array.isArray(r.data) ? r.data : [];
      const candidatos = lista.filter(item =>
        item.idRep === idRep &&
        item.idReq === idReq &&
        item.proName === proName &&
        (item.estado === 'Rechazado' || item.estado === 'Revisado' || item.estado === 'Aprobado' || item.estado === 'Asignado')
      );
      setExistente(candidatos[0] || null);
    } catch (e) {
      console.error(e);
      setError('No se pudo verificar si ya existe un Ishikawa para esta NC.');
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setValorSeleccionado('');
    setCorreoSeleccionado('');
    setExistente(null);
    cargarUsuarios();
    buscarExistente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idRep, idReq, proName]);

  const handleReasignar = async (registroId) => {
    await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/asig/${registroId}`, {
      auditado: valorSeleccionado,
      correo: correoSeleccionado
    });
  };

  const handleCrearNuevo = async () => {
    const data = {
      idRep,
      idReq,
      proName,
      fecha: '',
      auditado: valorSeleccionado,
      correo: correoSeleccionado,
      problema: descripcion?.Observacion || '',
      requisito: descripcion?.Requisito || '',
      hallazgo: hallazgoString,
      correccion: '',
      causa: '',
      diagrama: diagramaInicial,
      participantes: '',
      afectacion: '',
      actividades: [[]],
      estado: 'Asignado'
    };
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, data);
  };

  const confirmarAsignacion = () => {
    if (!valorSeleccionado || !correoSeleccionado) {
      setError('Selecciona un usuario antes de asignar.');
      return;
    }

    Swal.fire({
      title: existente ? '¿Reasignar Ishikawa?' : '¿Asignar Ishikawa?',
      text: existente
        ? 'Se notificará al nuevo auditado.'
        : 'Se creará y asignará un nuevo Ishikawa con estado "Asignado".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: existente ? 'Sí, reasignar' : 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        scrollYRef.current = window.scrollY;
        setCargando(true);
        mostrarCargando(existente ? 'Reasignando...' : 'Asignando...');

        if (existente) {
          await handleReasignar(existente._id);
        } else {
          await handleCrearNuevo();
        }

        ocultarCargando();
        setCargando(false);

        Swal.fire({
          icon: 'success',
          title: existente ? 'Reasignado' : 'Asignado',
          text: existente
            ? 'El diagrama ha sido reasignado correctamente.'
            : 'La asignación se realizó exitosamente.'
        });

        await Promise.resolve(onAssigned && onAssigned());

        window.scrollTo({ top: scrollYRef.current, left: 0, behavior: 'auto' });
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollYRef.current, left: 0, behavior: 'auto' });
        });

        onClose && onClose();
      } catch (e) {
        console.error(e);
        ocultarCargando();
        setCargando(false);
        Swal.fire('Error', 'Ocurrió un problema al procesar la asignación.', 'error');
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      keepMounted
      disableScrollLock
    >
      <DialogTitle>Asignar Ishikawa</DialogTitle>

      <DialogContent dividers>
        {/* SOLO títulos y texto normal para idReq y proName */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">ID Requisito</Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>{idReq || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">Programa</Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>{proName || '—'}</Typography>
          </Box>
        </Box>

        {/* Selector de usuario */}
        <Box display="flex" alignItems="center" gap={2}>
          <Autocomplete
            sx={{ minWidth: 320 }}
            options={opcionesUsuarios}
            getOptionLabel={(opt) => opt.label}
            onChange={(e, option) => {
              if (option) {
                setValorSeleccionado(option.label);
                setCorreoSeleccionado(option.correo);
              } else {
                setValorSeleccionado('');
                setCorreoSeleccionado('');
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Asignar/Reasignar a" placeholder="Selecciona un usuario" />
            )}
          />
          {(cargando || buscando) ? <CircularProgress size={24} /> : null}
        </Box>

        {error && (
          <Box sx={{ mt: 2, color: 'error.main' }}>
            {error}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={cargando}>Cancelar</Button>
        <Button variant="contained" onClick={confirmarAsignacion} disabled={cargando || !valorSeleccionado}>
          {existente ? 'Reasignar' : 'Asignar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}