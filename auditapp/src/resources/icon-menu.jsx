import React, { useContext, useState, useEffect, useRef } from "react";
import api from '../services/api';
import './css/estilos.css';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { IconButton, Stack, Badge } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Swal from "sweetalert2";
import { UserContext } from '../App';
import { useNavigate, useLocation } from "react-router-dom";
import ActivList from './activ-list';
import Avisos from "./Avisos";
import logo from '../assets/img/logoAguida.png';
import { useTheme } from "./ThemeContext";
import { Switch, FormControlLabel } from "@mui/material"; 

// Fixed announcements array should match source in Avisos component
const fixedAnnouncements = [
  {
    id: 1,
    titulo: "Actualización en Diagramas de Ishikawa",
    mensaje: "El formato de los diagramas de Ishikawa ha cambiado. Ya no es necesario agregar 'NA' a las espinas no utilizadas. Ahora puedes agregar únicamente las espinas necesarias usando el botón '+' al lado de cada rama."
  },
  {
    id: 2,
    titulo: "Cambio en la ubicación de generación de Ishikawa",
    mensaje: "Se ha eliminado la sección Ishikawa de la página de inicio. Para generar diagramas de Ishikawa, dirígete a la pestaña 'Auditado' y selecciona la opción 'Generar Ishikawa'."
  }
];

const IconMenu = () => {
  const [openAccountMenu, setOpenAccountMenu] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [openAvisos, setOpenAvisos] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [allAvisos, setAllAvisos] = useState([]);
  const [unseenAvisos, setUnseenAvisos] = useState([]);
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnLogin, setShowOnLogin] = useState(false);
  const { userData, setUserData } = useContext(UserContext);
  const { darkMode, toggleTheme } = useTheme(); 

  // Detect showModal flag on first mount
  useEffect(() => {
    if (location.state?.showModal) {
      setShowOnLogin(true);
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Fetch pending activities count
  useEffect(() => {
    if (!userData?.Nombre) return;
    api.get(`/ishikawa/activities/${userData.Nombre}`)
      .then(res => {
        const pendientes = res.data.filter(a => !a.concluido).length;
        setPendingCount(pendientes);
      })
      .catch(console.error);
  }, [userData]);

  // **Abrir lista de actividades automáticamente si hay pendientes**
  useEffect(() => {
    if (pendingCount > 0) {
      setOpenList(true);
    }
  }, [pendingCount]);

  // Fetch avisos once and compute unseen
  /*useEffect(() => {
    api.get(`/avisos`)
      .then(res => {
        const combined = [...fixedAnnouncements, ...res.data];
        setAllAvisos(combined);
        const seen = JSON.parse(localStorage.getItem('seenAvisos') || '[]');
        const pendientes = combined.filter(a => !seen.includes(a.id));
        setUnseenAvisos(pendientes);
        // open automatically only once after login or initial mount
        if ((showOnLogin || seen.length === 0) && pendientes.length > 0) {
          setOpenAvisos(true);
        }
      })
      .catch(console.error);
  }, [showOnLogin]);*/

  // After showOnLogin handled, reset flag
  useEffect(() => {
    if (openAvisos && showOnLogin) {
      setShowOnLogin(false);
    }
  }, [openAvisos]);

  // Handlers
  const handleOpenList = () => setOpenList(true);
  const handleCloseList = () => setOpenList(false);

  const handleCloseAvisos = () => {
    setOpenAvisos(false);
    // Mark all avisos as seen
    const allIds = allAvisos.map(a => a.id);
    localStorage.setItem('seenAvisos', JSON.stringify(allIds));
    setUnseenAvisos([]);
    // Si hay actividades pendientes, abre lista (adicional al auto-open de useEffect)
    if (pendingCount > 0) {
      setOpenList(true);
    }
  };

  const handleToggleAccount = () => setOpenAccountMenu(prev => !prev);
  const handleCloseAccount = event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpenAccountMenu(false);
  };

  const handleNavigateToInicio = () => {
    const tipo = (userData?.TipoUsuario || '').toLowerCase();
    const ruta = (tipo === 'administrador' || tipo === 'invitado') ? '/admin'
      : tipo === 'auditado' ? '/auditado'
      : tipo === 'auditor' ? '/auditor'
      : '/';
    navigate(ruta, { state: { showModal: true } });
    setOpenAccountMenu(false);
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('breadcrumbHistory');
    setUserData(null);
    navigate('/');
  }
  };

  const handleNavigateToPerfil = () => {
    navigate('/informacion');
    setOpenAccountMenu(false);
  };

  return (
    <div className="unique-header">
      <div className="logo-container">
        <img src={logo} alt="Logo" onClick={handleNavigateToInicio} className="logo" />
      </div>

      

      <Stack direction="row" spacing={2} alignItems="center">
        {/* === NUEVO SWITCH DE TEMA === */}
        {/*<FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={toggleTheme}
              color="default"
            />
          }
          label={darkMode ? "Modo Claro" : "Modo Oscuro"}
        />*/}
        {/* Usuario */}
        <div className="user-icon">
          <span>{userData?.Nombre || "Usuario"}</span>
          {userData?.Foto ? (
            <img src={userData.Foto} alt="Foto" onClick={handleToggleAccount}
              ref={anchorRef} style={{ width:50, height:50, borderRadius:'50%', marginLeft:10, cursor:'pointer', border:'2px solid #3498db' }} />
          ) : (
            <AccountCircleIcon onClick={handleToggleAccount} ref={anchorRef} color="primary" sx={{ fontSize:50, ml:1 }} />
          )}
        </div>

        {/* Icono de avisos */}
        <Badge badgeContent={unseenAvisos.length} color="error">
          <IconButton onClick={() => setOpenAvisos(true)}>
            <NotificationsIcon />
          </IconButton>
        </Badge>

        {/* Icono de lista */}
        <Badge badgeContent={pendingCount} color="error">
          <IconButton onClick={handleOpenList}>
            <ListIcon />
          </IconButton>
        </Badge>

        {/* Avisos */}
        {openAvisos && (
          <Avisos open={openAvisos} onClose={handleCloseAvisos} avisos={allAvisos} />
        )}

        {/* Lista de actividades */}
        {openList && (
          <Dialog open={openList} onClose={handleCloseList} TransitionComponent={Grow} transitionDuration={300}
            keepMounted fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius:2, p:2, boxShadow:6 } }}>
            <DialogTitle>Mis Actividades</DialogTitle>
            <DialogContent dividers sx={{ p:1 }}>
              <Alert severity="info" sx={{ mb:2 }}>
                Haz clic en cualquier actividad para navegar directamente al diagrama.
              </Alert>
              <ActivList onNavigate={handleCloseList} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseList}>Cerrar</Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Menú de cuenta */}
        <Popper open={openAccountMenu} anchorEl={anchorRef.current} placement="bottom-start"
          transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'left bottom' }}>
              <Paper>
                <ClickAwayListener onClickAway={handleCloseAccount}>
                  <MenuList autoFocusItem={openAccountMenu} onKeyDown={e => { if (e.key==='Tab'||e.key==='Escape') setOpenAccountMenu(false); }}>
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