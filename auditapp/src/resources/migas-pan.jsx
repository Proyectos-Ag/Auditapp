import React, { useEffect, useState } from 'react';
import './css/estilos.css';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { emphasize, styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation } from 'react-router-dom';

const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === 'light'
      ? theme.palette.grey[100]
      : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    '&:hover, &:focus': {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    '&:active': {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const MigasPan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [breadcrumbHistory, setBreadcrumbHistory] = useState(
    () => JSON.parse(localStorage.getItem('breadcrumbHistory')) || [] // Recupera desde localStorage
  );

  const breadcrumbNameMap = {
    '/admin': 'Administrador',
    '/auditor': 'Auditor',
    '/auditado': 'Auditado',
    '/datos': 'Datos',
    '/programa': 'Programas',
    '/usuarios': 'Usuarios',
    '/usuariosRegistrados': 'Usuarios Registrados',
    '/revicion': 'Revisión',
    '/terminada': 'Terminada',
    '/finalizadas': 'Finalizadas',
    '/ishikawa': 'Ishikawa',
    '/vistafin': 'Vista Finalizadas',
    '/auditcalendar': 'Calendario de Auditorías',
    '/calendario': 'Calendario',
    '/departamento': 'Departamento',
    '/diagrama': 'Diagrama',
    '/carga': 'Carga Masiva',
    '/estadisticas': 'Estadísticas',
    '/revish': 'Revisión Ishikawa',
    '/evuaauditor': 'Evaluación de Auditores',
    '/vereva': 'Ver Evaluaciones',
    '/ishikawasesp': 'Ishikawas',
    '/pendiente': 'Pendientes',
    '/reporte': 'Reporte Auditor',
    '/informacion': 'Información Auditor',
    '/auditado/reporte': 'Reporte Auditado',
    '/auditado/ishikawa': 'Ishikawa Auditado',
    '/auditado/diagrama': 'Diagrama Auditado',
    '/auditado/informacion': 'Información Auditado',
    '/auditado/vistarep': 'Vista de Reportes',
    '/ver-reali':'Reportes en Revisión',
    '/ishikawas-estadisticas':'Estadísticas de Ishikawas',
    '/objetivos':'Objetivos',
    '/menu':'Menú',
    '/acciones':'Agregar Acción',
    '/inicio-ishvac': 'Ishikawa Independientes',
    '/diagramas': 'Generar Ishikawa',
    '/concentradon': 'Concentrado',
    '/saefty-goals2': 'Safety Goals',
  };

  const getDynamicBreadcrumbName = (path) => {
    const dynamicRoutes = [
      { pattern: /^\/ishikawa\/[\w-]+/, name: 'Ishikawa Auditoría' },
      { pattern: /^\/auditado\/ishikawa\/[\w-]+/, name: 'Ishikawa Auditoría' },
      { pattern: /^\/auditado\/reporte\/[\w-]+/, name: 'Reporte Auditoría' },
      { pattern: /^\/terminada\/[\w-]+/, name: 'Reporte Auditoría' },
      { pattern: /^\/revicion\/[\w-]+/, name: 'Reporte' },
      { pattern: /^\/finalizadas\/[\w-]+/, name: 'Reporte Finalizado' },
      { pattern: /^\/objetivos\/[\w-]+/, name: 'Objetivos Área' },
      { pattern: /^\/acciones-list\/[\w-]+/, name: 'Acciones' },
      { pattern: /^\/diagrama\/[\w-]+/, name: 'Ishikawa Específico' }
    ];
  
    // Busca si el path coincide con algún patrón
    for (const route of dynamicRoutes) {
      if (route.pattern.test(path)) {
        return route.name;
      }
    }
  
    return null; // Si no coincide con ningún patrón
  };

  useEffect(() => {
    const currentPath = location.pathname;
    setBreadcrumbHistory((prevHistory) => {
      const pathIndex = prevHistory.indexOf(currentPath);
      if (pathIndex === -1) {
        const newHistory = [...prevHistory, currentPath];
        localStorage.setItem('breadcrumbHistory', JSON.stringify(newHistory)); // Almacena en localStorage
        return newHistory;
      }
      const updatedHistory = prevHistory.slice(0, pathIndex + 1);
      localStorage.setItem('breadcrumbHistory', JSON.stringify(updatedHistory)); // Actualiza en localStorage
      return updatedHistory;
    });
  }, [location.pathname]);

  const getBreadcrumbLabel = (path, isLast) => {
    const customName = breadcrumbNameMap[path] || getDynamicBreadcrumbName(path) || decodeURIComponent(path);
    const showHomeIcon = ['/admin', '/auditor', '/auditado'].includes(path);

    return (
      <StyledBreadcrumb
        component="a"
        onClick={() => !isLast && navigate(path)}
        label={customName}
        icon={showHomeIcon ? <HomeIcon fontSize="small" /> : null}
      />
    );
  };

  return (
    <div >
      <Breadcrumbs className="migas-pan" aria-label="breadcrumb">
        {breadcrumbHistory.map((path, index) => {
          const isLast = index === breadcrumbHistory.length - 1;
          return (
            <span key={path}>
              {getBreadcrumbLabel(path, isLast)}
            </span>
          );
        })}
      </Breadcrumbs>
    </div>
  );
};

export default MigasPan;