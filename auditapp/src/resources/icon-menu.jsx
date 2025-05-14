import React, { useContext, useState, useEffect, useRef } from "react";
import axios from 'axios';
import './css/estilos.css';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import {IconButton, Stack, Badge } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Swal from "sweetalert2";
import { UserContext } from '../App';
import { useNavigate, useLocation } from "react-router-dom";
import ActivList from './activ-list';
import logo from '../assets/img/logoAguida.png';

const IconMenu = () => {
  const [open, setOpen] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnLogin, setShowOnLogin] = useState(false);
  const { userData, setUserData } = useContext(UserContext);

  useEffect(() => {
    if (location.state?.showModal) {
      setShowOnLogin(true);
      window.history.replaceState({}, document.title);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // sólo al montar

  // Obtener conteo de actividades pendientes
  useEffect(() => {
    if (!userData?.Nombre) return;
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/activities/${userData.Nombre}`)
      .then(res => {
        const pendientes = res.data.filter(a => !a.concluido).length;
        setPendingCount(pendientes);
      })
      .catch(console.error);
  }, [userData]);

  useEffect(() => {
    if (showOnLogin && pendingCount > 0) {
      setOpenList(true);
      // opcional: resetear showOnLogin para que no vuelva a dispararse
      setShowOnLogin(false);
    }
  }, [showOnLogin, pendingCount]);

  const handleOpen = () => setOpenList(true);
  const handleCloseList = () => setOpenList(false);

  const handleToggle = () => setOpen(prev => !prev);
  const handleClose = event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleListKeyDown = event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  // Redirecciones dinámicas según TipoUsuario
  const handleNavigateToInicio = () => {
    if (!userData?.TipoUsuario) {
      navigate('/');
    } else if (userData.TipoUsuario === 'administrador') {
      navigate('/admin', { state: { showModal: true } });
    } else if (userData.TipoUsuario === 'auditado') {
      navigate('/auditado', { state: { showModal: true } });
    } else if (userData.TipoUsuario === 'auditor') {
      navigate('/auditor', { state: { showModal: true } });
    } else {
      navigate('/');
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Está seguro de querer cerrar sesión?',
      text: '¡Tu sesión actual se cerrará!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`);
      } catch (error) {
        console.error('Error al cerrar sesión en el servidor', error);
      }
      localStorage.removeItem('breadcrumbHistory');
      setUserData(null);
      setOpen(false);
      navigate('/');
    }
  };

  const handleNavigateToPerfil = () => {
    navigate('/informacion');
    setOpen(false);
  };

  return (
    <div className="unique-header">
      <div className="logo-container">
        <img src={logo} alt="Logo" onClick={handleNavigateToInicio} className="logo" />
      </div>

      <Stack direction="row" spacing={2}>
        <div className="superposicion">
          <div className="user-icon">
            <span>{userData?.Nombre || "Usuario"}</span>

            {userData?.Foto ? (
              <img
                src={userData.Foto}
                alt="Foto de usuario"
                onClick={handleToggle}
                ref={anchorRef}
                style={{ width: 50, height: 50, borderRadius: '50%', marginLeft: 10, cursor: 'pointer', border: '2px solid #3498db' }}
              />
            ) : (
              <AccountCircleIcon
                onClick={handleToggle}
                ref={anchorRef}
                color="primary"
                sx={{ fontSize: 50, marginLeft: 1 }}
              />
            )}

            {/* Badge en el icono de lista */}
            <Badge badgeContent={pendingCount} color="error">
              <IconButton onClick={handleOpen}>
                <ListIcon />
              </IconButton>
            </Badge>

            {/* Modal con ActivList */}
            {openList && (
              <Dialog
                open={openList}
                onClose={handleCloseList}
                TransitionComponent={Grow}           // animación popup
                transitionDuration={300}
                keepMounted                         // mejora performance
                fullWidth
                maxWidth="sm"
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    p: 2,
                    boxShadow: 6
                  }
                }}
              >
                <DialogTitle>Mis Actividades</DialogTitle>

                <DialogContent dividers sx={{ p: 1 }}>
                  {/*  ⚠️ Alerta informativa */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Haz clic en cualquier actividad para navegar directamente al diagrama.
                  </Alert>

                  <ActivList onNavigate={handleCloseList} />
                </DialogContent>

                <DialogActions>
                  <Button onClick={handleCloseList}>Cerrar</Button>
                </DialogActions>
              </Dialog>
            )}
          </div>
        </div>

        {/* Popper para menú de cuenta */}
        <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'left bottom' }}>
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList autoFocusItem={open} onKeyDown={handleListKeyDown}>
                    <MenuItem onClick={handleNavigateToPerfil}>Mi Cuenta</MenuItem>
                    <MenuItem onClick={handleNavigateToInicio}>Volver a Inicio</MenuItem>
                    <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Stack>
    </div>
  );
};

export default IconMenu;