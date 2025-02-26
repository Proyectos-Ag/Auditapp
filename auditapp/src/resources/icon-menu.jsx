import React, { useContext} from "react";
import axios from 'axios';
import './css/estilos.css';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Swal from "sweetalert2";
import { UserContext } from '../App';
import { useNavigate } from "react-router-dom";

const IconMenu = () => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(UserContext);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  const handleLogout = async () => {
    Swal.fire({
      title: '¿Está seguro de querer cerrar sesión?',
      text: '¡Tu sesión actual se cerrará!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Llama al endpoint de logout para borrar la cookie del token
          await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`);
        } catch (error) {
          console.error('Error al cerrar sesión en el servidor', error);
        }
  
        // Limpia cualquier otro dato que ya no necesites en el front end
        localStorage.removeItem('breadcrumbHistory'); // Si aún lo usas
        // Actualiza el contexto para remover la información del usuario
        setUserData(null);
        // Si tienes algún modal abierto, ciérralo
        setOpen(false);
        // Redirige al usuario a la página de inicio o login
        navigate('/');
      }
    });
  };

  const handleNavigateToPerfil = () => {
    navigate('/informacion'); 
    setOpen(false);  
  };

  const handleNavigateToInicio = () => {
    navigate('/admin');  
    setOpen(false);  
  };

  return (
    <Stack direction="row" spacing={2}>
      <div className="superposicion">
        {/* ícono */}

        <div className="user-icon">
         <span>{userData.Nombre}</span>
          
          {/* Ícono */}
          {userData.Foto ? (
  <img
    src={userData.Foto}
    alt="Foto de usuario"
    onClick={handleToggle}
    ref={anchorRef}
    style={{
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      marginLeft: '10px',
      cursor: 'pointer'
    }}
  />
) : (
  <AccountCircleIcon
    onClick={handleToggle}
    ref={anchorRef}
    color="primary"
    sx={{ fontSize: 50, marginLeft: '10px' }}
  />
)}

        </div>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom-start' ? 'left top' : 'left bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem onClick={handleNavigateToPerfil}>Mi Cuenta</MenuItem>
                    <MenuItem onClick={handleNavigateToInicio}>Volver a Inicio</MenuItem>
                    <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </Stack>
  );
}

export default IconMenu;