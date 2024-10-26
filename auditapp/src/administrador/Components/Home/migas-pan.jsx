import React, { useEffect, useState } from 'react';
import './css/inicio.css';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useNavigate, useLocation } from 'react-router-dom';

const MigasPan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [breadcrumbHistory, setBreadcrumbHistory] = useState([]);

  const breadcrumbNameMap = {
    '/admin': 'Inicio Administrador',
    '/auditor': 'Inicio Auditor',
    '/auditado': 'Inicio Auditado',
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
    '/ishikawasesp': 'Ishikawas Específicos',
    '/pendiente': 'Pendientes',
    '/reporte': 'Reporte Auditor',
    '/informacion': 'Información Auditor',
    '/auditado/reporte': 'Reporte Auditado',
    '/auditado/ishikawa': 'Ishikawa Auditado',
    '/auditado/diagrama': 'Diagrama Auditado',
    '/auditado/informacion': 'Información Auditado',
    '/auditado/vistarep': 'Vista de Reportes',
  };

  useEffect(() => {
    const currentPath = location.pathname;

    setBreadcrumbHistory((prevHistory) => {
      const pathIndex = prevHistory.indexOf(currentPath);

      // Si la ruta no está en el historial, añadirla
      if (pathIndex === -1) {
        return [...prevHistory, currentPath];
      }
      // Si la ruta ya existe, recortar el historial hasta la posición de esta ruta
      return prevHistory.slice(0, pathIndex + 1);
    });
  }, [location.pathname]);

  const getBreadcrumbLabel = (path, isLast) => {
    const customName = breadcrumbNameMap[path] || decodeURIComponent(path);
    return isLast ? (
      <Typography color="text.primary">{customName}</Typography>
    ) : (
      <Link
        underline="hover"
        color="inherit"
        onClick={() => navigate(path)}
        style={{ cursor: 'pointer' }}
      >
        {customName}
      </Link>
    );
  };

  return (
    <div className='migas-pan'>
    <Breadcrumbs aria-label="breadcrumb">
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
