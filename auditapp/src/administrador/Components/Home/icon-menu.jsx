import React, { useContext} from "react";
import './css/inicio.css';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Swal from "sweetalert2";
import { UserContext } from '../../../App';
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

  const handleLogout = () => {
    Swal.fire({
      title: '¿Está seguro de querer cerrar sesión?',
      text: '¡Tu sesión actual se cerrará!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('breadcrumbHistory');
        setUserData(null);
        setOpen(false);
        navigate('/');
      }
    });
  };

  const handleNavigateToPerfil = () => {
    navigate('/auditado/informacion'); 
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
          <AccountCircleIcon
            ref={anchorRef}
            onClick={handleToggle}
            color="primary"
            sx={{ fontSize: 50, marginLeft: '10px' }} // Añade margen entre el nombre y el ícono
          />
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