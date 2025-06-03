import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { UserContext } from '../App';

const BotonesRol = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useContext(UserContext);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // Mantener la ruta actual como valor seleccionado
  const [value, setValue] = useState(location.pathname);
  useEffect(() => setValue(location.pathname), [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(newValue);
  };

  const tabsByRole = {
    administrador: [
      { label: "Administrador", path: "/admin" },
      { label: "Auditor", path: "/auditor" },
      { label: "Auditado", path: "/auditado" },
      { label: "Objetivos", path: "/objetivos" }
    ],
    auditor: [
      { label: "Auditor", path: "/auditor" },
      { label: "Auditado", path: "/auditado" },
      { label: "Objetivos", path: "/objetivos" }
    ],
    auditado: [
      { label: "Auditado", path: "/auditado" },
      { label: "Objetivos", path: "/objetivos" }
    ]
  };

  const currentTabs = userData ? tabsByRole[userData?.TipoUsuario] || [] : [];
  if (!currentTabs.length) return null;

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 2, overflowX: isSmall ? 'auto' : 'hidden' }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant={isSmall ? 'scrollable' : 'fullWidth'}
        scrollButtons={isSmall ? 'auto' : false}
        allowScrollButtonsMobile={isSmall}
        aria-label="Tabs de navegación según rol"
        sx={{
          '& .MuiTabs-flexContainer': {
            width: '100%',
            justifyContent: isSmall ? 'flex-start' : 'space-around'
          },
          '& .MuiTab-root': {
            fontSize: '1em',
            padding: isSmall ? '12px 24px' : '12px 0',
            minWidth: isSmall ? '160px' : 0,
            flex: isSmall ? 'none' : 1,
            textAlign: 'center'
          },
          '& .Mui-selected': {
            color: '#1b70df',
            fontWeight: 'bold'
          }
        }}
      >
        {currentTabs.map(({ label, path }) => (
          <Tab key={path} label={label} value={path} />
        ))}
      </Tabs>
    </Box>
  );
};

export default BotonesRol;