import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { SwipeableDrawer } from '@mui/material';
import Collapse  from '@mui/material/Collapse';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Logo from '../../assets/img/logoAguida.png'
import './css/navbar.css';
import { UserContext } from '../../App';
import { useNavigate } from 'react-router-dom';
//iconos
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SetMealIcon from '@mui/icons-material/SetMeal';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PreviewIcon from '@mui/icons-material/Preview';
import SourceIcon from '@mui/icons-material/Source';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArticleIcon from '@mui/icons-material/Article';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userData} = useContext(UserContext);
  const navigate = useNavigate();
  const [openSubMenuAuditorias, setOpenSubMenuAuditorias] = useState(false);
  const [openSubMenuIshikawa, setOpenSubMenuIshikawa] = useState(false);
  const [openSubMenuAudi, setOpenSubMenuAudi] = useState(false);
  const [openSubMenuGestion, setOpenSubMenuGestion] = useState(false);
  const [openSubMenuCarga, setOpenSubMenuCarga] = useState(false);
  const [openSubMenuAuditorAudi, setOpenSubMenuAuditorAudi] = useState(false);
  const [openSubMenuAuditadoAudi, setOpenSubMenuAuditadoAudi] = useState(false);
  const [openSubMenuIshikawas, setOpenSubMenuIshikawas] = useState(false);

  const handleSubMenuAuditoriasClick = () => {
    setOpenSubMenuAuditorias(!openSubMenuAuditorias);
  };
  
  const handleSubMenuIshikawaClick = () => {
    setOpenSubMenuIshikawa(!openSubMenuIshikawa);
  };

  const handleSubMenuAudiClick = () => {
    setOpenSubMenuAudi(!openSubMenuAudi);
  };

  const handleSubMenuGestionClick = () => {
    setOpenSubMenuGestion(!openSubMenuGestion);
  };

  const handleSubMenuCargaClick = () => {
    setOpenSubMenuCarga(!openSubMenuCarga);
  };

  const handleSubMenuAuditorAuditoriaClick = () => {
    setOpenSubMenuAuditorAudi(!openSubMenuAuditorAudi);
  };

  const handleSubMenuAuditadoAuditoriaClick = () => {
    setOpenSubMenuAuditadoAudi(!openSubMenuAuditadoAudi);
  };

  const handleSubMenuIshikawasClick = () => {
    setOpenSubMenuIshikawas(!openSubMenuIshikawas);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === 'keydown' &&
      (event.key !== 'Escape')
    ) {
      return;
    }    
    setIsOpen(open);
  };


  const handleLogoClick = () => {
    if (!userData?.TipoUsuario) {
      navigate('/'); // Ruta por defecto si no existe TipoUsuario
      return;
    }
    // Invitados ven la UI de administrador (solo lectura) — mapearlos a /admin
    const tipo = (userData.TipoUsuario || '').toLowerCase();
    if (tipo === 'auditado') {
      navigate('/auditado');
    } else if (tipo === 'auditor') {
      navigate('/auditor');
    } else if (tipo === 'administrador' || tipo === 'invitado') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };  

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();  // Evita el cambio de foco
        setIsOpen((prevIsOpen) => !prevIsOpen);  // Alterna el estado de isOpen
      }
    };

    // Agrega el evento al montar el componente
    window.addEventListener('keydown', handleKeyDown);
    
    // Limpia el evento al desmontar el componente
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const list = (
    <div
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
      style={{ width: 250, padding: 20 }}
    >
      <List>
        <img src={Logo} alt="logo aguida" className='logo-nav' onClick={handleLogoClick}
      style={{ cursor: 'pointer' }}/>
        <Divider sx={{backgroundColor:'#000000'}}/>

  {['administrador','invitado'].includes(userData?.TipoUsuario) && (
          <>
        {/*Administrador*/}
        <br />
        <h4>Administrador</h4>
        <Divider sx={{backgroundColor:'#000000'}}/>
        {/* Item con submenu */}
        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuAuditoriasClick();
          }}>
            <ListItemIcon>
              <ContentPasteIcon />
            </ListItemIcon>
            <ListItemText primary="Auditorías" />
            {openSubMenuAuditorias ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuAuditorias} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Generar Auditoría', 'Revisión de Auditoría', 'Revisión de Ishikawa', 'Auditorías Finalizadas'].map((subItem, index) => {
            const routes = [
              "/datos",
              "/revicion",
              "/revish",
              "/vistafin",
            ];

            const icons = [
              <PendingActionsIcon />,
              <ContentPasteSearchIcon />,
              <SetMealIcon/>,
              <AssignmentTurnedInIcon />,
            ];

            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                   {icons[index]}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuIshikawaClick();
          }}>
            <ListItemIcon>
              <SetMealIcon />
            </ListItemIcon>
            <ListItemText primary="Ishikawa"/>
            {openSubMenuIshikawa ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuIshikawa} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Ishikawas Generados'].map((subItem, index) => {
            const routes = [
              "/ishikawasesp"
            ];

            const icons = [
              <InboxIcon/>
            ];

            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                  {icons[index]}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuAudiClick();
          }}>
            <ListItemIcon>
              <ManageAccountsIcon />
            </ListItemIcon>
            <ListItemText primary="Administración"/>
            {openSubMenuAudi ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuAudi} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Realizar Evaluación', 'Ver Evaluaciones', 'Calendario de Auditorías'].map((subItem, index) => {
            const routes = [
              "/evuaauditor",
              "/vereva",
              "/auditcalendar"
            ];

            const icons = [
              <AssessmentIcon/>,
              <PreviewIcon/>,
              <CalendarMonthIcon/>
            ];
            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                  {icons[index]}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuGestionClick();
          }}>
            <ListItemIcon>
              <SourceIcon />
            </ListItemIcon>
            <ListItemText primary="Gestión"/>
            {openSubMenuGestion ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuGestion} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Usuarios', 'Programas', 'Departamento'].map((subItem, index) => {
            const routes = [
              "/usuariosRegistrados",
              "/programa",
              "/departamento"
            ];

            const icons = [
              <PeopleAltIcon />,
              <ArticleIcon />,
              <CorporateFareIcon/>
            ];
          
            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                    {icons[index]}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuCargaClick();
          }}>
            <ListItemIcon>
              <DriveFolderUploadIcon />
            </ListItemIcon>
            <ListItemText primary="Carga y Gráficas"/>
            {openSubMenuCarga ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuCarga} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Carga de Auditorías', 'Estadísticas'].map((subItem, index) => {
            const routes = [
              "/carga",
              "/estadisticas"
            ];
            
            const icons = [
              <UploadFileIcon />,
              <BarChartIcon/>
            ];
            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                    {icons[index]}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>
        </>
        )}

      {['auditor', 'administrador'].includes(userData?.TipoUsuario) && (
          <>
        {/*Auditor*/}
        <br />
        <h4>Auditor</h4>
        <Divider sx={{backgroundColor:'#000000'}}/>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuAuditorAuditoriaClick();
          }}>
            <ListItemIcon>
            <ContentPasteIcon />
            </ListItemIcon>
            <ListItemText primary="Auditorías"/>
            {openSubMenuAuditorAudi ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuAuditorAudi} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Llenado de Checklist', 'Reportes Generados'].map((subItem, index) => {
            const routes = [
              "/pendiente",
              "/reporte"
            ];

            const icons =[
              <PendingActionsIcon />,
              <ChecklistRtlIcon/>
          ]
            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                    {icons[index]}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>
        </>
      )}

      {['auditado', 'auditor', 'administrador'].includes(userData?.TipoUsuario) && (
          <>

        {/*Auditado*/}
        <br />
        <h4>Auditado</h4>
        <Divider sx={{backgroundColor:'#000000'}}/>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuAuditadoAuditoriaClick();
          }}>
            <ListItemIcon>
            <ContentPasteIcon />
            </ListItemIcon>
            <ListItemText primary="Auditorías"/>
            {openSubMenuAuditadoAudi ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuAuditadoAudi} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Ishikawas Asignados'].map((subItem, index) => {
            const routes = [
              "/auditado/vistarep"
            ];
            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                    {index % 2 === 0 ? <SetMealIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>
        </>
        )}


        {/*Ishikawas Vacios*/}
        <br />
        <h4>Ishikawas</h4>
        <Divider sx={{backgroundColor:'#000000'}}/>

        <ListItem disablePadding>
        <ListItemButton onClick={(event) => {
            event.stopPropagation();
            handleSubMenuIshikawasClick();
          }}>
            <ListItemIcon>
            <SetMealIcon />
            </ListItemIcon>
            <ListItemText primary="Ishikawas"/>
            {openSubMenuIshikawas ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubMenuIshikawas} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {['Generar Ishikawa', 'Ishikawas Generados'].map((subItem, index) => {
            const routes = [
              "/diagramas",
              "/ishikawavacio"
            ];
            return(
              <ListItem key={subItem} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} to={routes[index]}>
                  <ListItemIcon>
                    {index % 2 === 0 ? <SetMealIcon /> : <SetMealIcon />}
                  </ListItemIcon>
                  <ListItemText primary={subItem} />
                </ListItemButton>
              </ListItem>
              )
              })}
          </List>
        </Collapse>

      </List>
    </div>
  );

  return (
    <div>
      <SwipeableDrawer
        anchor="left"
        open={isOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
      >
        {list}
      </SwipeableDrawer>
      
    </div>
  );
};

export default Navbar;