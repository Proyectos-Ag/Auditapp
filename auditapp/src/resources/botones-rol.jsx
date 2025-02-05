import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { UserContext } from '../App';

const BotonesRol = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useContext(UserContext);

  // Mantener la ruta actual como valor seleccionado
  const [value, setValue] = useState(location.pathname);

  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(newValue);  // Navegar a la ruta seleccionada
  };

  return (
    <Box sx={{ maxWidth: { xs: 320, sm: 780 }, bgcolor: 'background.paper', margin: '0 auto' }}>
      {userData && userData.TipoUsuario === 'administrador' && (
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Tabs de navegación para administrador"
          sx={{
            "& .MuiTab-root": { // Estilos para cada Tab
              fontSize: '1em', // Tamaño de la fuente de las pestañas
              padding: '12px 24px', // Espaciado interno de cada pestaña
              minWidth: '160px', // Ancho mínimo de cada pestaña
            },
            "& .Mui-selected": { // Estilos para la pestaña seleccionada
              color: '#1b70df', // Color del texto para la pestaña seleccionada
              fontWeight: 'bold',
            },
            "& .MuiTabs-flexContainer": { // Contenedor de pestañas para alinear
              justifyContent: 'center',
            },
          }}
        >
          <Tab label="Administrador" value="/admin" />
          <Tab label="Auditor" value="/auditor" />
          <Tab label="Auditado" value="/auditado" />
          <Tab label="Ishikawas" value="/diagramas" />
          <Tab label="Objetivos" value="/objetivos" />
        </Tabs>
      )}
      
      {userData && userData.TipoUsuario === 'auditor' && (
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Tabs de navegación para auditor"
          sx={{
            "& .MuiTab-root": { // Estilos para cada Tab
              fontSize: '1em', // Tamaño de la fuente de las pestañas
              padding: '12px 24px', // Espaciado interno de cada pestaña
              minWidth: '160px', // Ancho mínimo de cada pestaña
            },
            "& .Mui-selected": { // Estilos para la pestaña seleccionada
              color: '#1b70df', // Color del texto para la pestaña seleccionada
              fontWeight: 'bold',
            },
            "& .MuiTabs-flexContainer": { // Contenedor de pestañas para alinear
              justifyContent: 'center',
            },
          }}
        >
          <Tab label="Auditor" value="/auditor" />
          <Tab label="Auditado" value="/auditado" />
          <Tab label="Ishikawas" value="/diagramas" />
          <Tab label="Objetivos" value="/objetivos" />
        </Tabs>
      )}

      {userData && userData.TipoUsuario === 'auditado' && (
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Tabs de navegación para auditado"
          sx={{
            "& .MuiTab-root": { // Estilos para cada Tab
              fontSize: '1em', // Tamaño de la fuente de las pestañas
              padding: '12px 24px', // Espaciado interno de cada pestaña
              minWidth: '160px', // Ancho mínimo de cada pestaña
            },
            "& .Mui-selected": { // Estilos para la pestaña seleccionada
              color: '#1b70df', // Color del texto para la pestaña seleccionada
              fontWeight: 'bold',
            },
            "& .MuiTabs-flexContainer": { // Contenedor de pestañas para alinear
              justifyContent: 'center',
            },
          }}
        >
          <Tab label="Auditado" value="/auditado" />
          <Tab label="Ishikawas" value="/diagramas" />
          <Tab label="Objetivos" value="/objetivos" />
        </Tabs>
      )}
    </Box>
  );
};

export default BotonesRol;