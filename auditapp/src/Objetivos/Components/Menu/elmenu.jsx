import React, { useContext, useState } from 'react';
import { UserContext } from '../../../App'; // Ajusta la ruta según tu proyecto
import { useNavigate } from 'react-router-dom';
import './css/menu.css';

const menuItems = [
  { label: "CONTROL Y CUIDADO AMBIENTAL", roles: ["administrador", "auditor", "auditado"], areas: ["CONTROL Y CUIDADO AMBIENTAL"] },
  { label: "EMBARQUE", roles: ["administrador", "auditor", "auditado"], areas: ["EMBARQUE"] },
  { label: "MANTENIMIENTO SERVICIOS", roles: ["administrador", "auditor", "auditado"], areas: ["MANTENIMIENTO SERVICIOS"] },
  { label: "SEGURIDAD E HIGIENE Y SANIDAD", roles: ["administrador", "auditor", "auditado"], areas: ["SEGURIDAD E HIGIENE Y SANIDAD"] },
  { label: "INGENIERÍA", roles: ["administrador", "auditor", "auditado"], areas: ["INGENIERÍA"] },
  { label: "COORDINADOR DE MATERIA PRIMA", roles: ["administrador", "auditor", "auditado"], areas: ["COORDINADOR DE MATERIA PRIMA"] },
  { label: "GERENCIA PLANEACIÓN Y LOGÍSTICA", roles: ["administrador", "auditor", "auditado"], areas: ["GERENCIA PLANEACIÓN Y LOGÍSTICA"] },
  { label: "MANTENIMIENTO TETRA PAK", roles: ["administrador", "auditor", "auditado"], areas: ["MANTENIMIENTO TETRA PAK"] },
  { label: "CONTROL DE PLAGAS", roles: ["administrador", "auditor", "auditado"], areas: ["CONTROL DE PLAGAS"] },
  { label: "AGUJA", roles: ["administrador", "auditor", "auditado"], areas: ["AGUJA"] },
  { label: "PESADAS", roles: ["administrador", "auditor", "auditado"], areas: ["PESADAS"] },
  { label: "PRODUCCIÓN", roles: ["administrador", "auditor", "auditado"], areas: ["PRODUCCIÓN"] },
  { label: "ASEGURAMIENTO DE CALIDAD", roles: ["administrador", "auditor", "auditado"], areas: ["ASEGURAMIENTO DE CALIDAD"] },
  { label: "COMPRAS", roles: ["administrador", "auditor", "auditado"], areas: ["COMPRAS"] },
  { label: "ADMINISTRADOR", roles: ["administrador"], areas: ["ADMINISTRADOR"] },
  { label: "REVISIÓN", roles: ["administrador", "auditor", "auditado"], areas: ["REVISIÓN"] },
  { label: "VALIDACIÓN", roles: ["administrador", "auditor", "auditado"], areas: ["VALIDACIÓN"] },
  { label: "LIBERACIÓN DE PT", roles: ["administrador", "auditor", "auditado"], areas: ["LIBERACIÓN DE PT"] },
  { label: "RECURSOS HUMANOS", roles: ["administrador", "auditor", "auditado"], areas: ["RECURSOS HUMANOS"] },
  { label: "SAFETY GOALS", roles: ["administrador", "auditor", "auditado"], areas: ["SAFETY GOALS"] },
  { label: "CALIDAD E INOCUIDAD", roles: ["administrador", "auditor", "auditado"], areas: ["CONTROL Y CUIDADO AMBIENTAL", "EMBARQUE", "MANTENIMIENTO SERVICIOS", "SEGURIDAD E HIGIENE Y SANIDAD", "INGENIERÍA", "COORDINADOR DE MATERIA PRIMA", "GERENCIA PLANEACIÓN Y LOGÍSTICA", "MANTENIMIENTO TETRA PAK", "CONTROL DE PLAGAS", "AGUJA", "PESADAS", "PRODUCCIÓN", "ASEGURAMIENTO DE CALIDAD", "COMPRAS", "ADMINISTRADOR", "REVISIÓN", "VALIDACIÓN", "LIBERACIÓN DE PT", "RECURSOS HUMANOS", "SAFETY GOALS"] }
];


const MenuByRoleAndArea = () => {
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const [showMessage, setShowMessage] = useState(false);

  if (!userData || !userData.TipoUsuario) {
    return <div className="menu-container">Cargando...</div>;
  }

  const tipoUsuario = userData.TipoUsuario.toLowerCase();
  let filteredItems = menuItems.filter(item => item.roles.includes(tipoUsuario));

  if (tipoUsuario !== 'administrador') {
    if (!userData.area) {
      return <div className="menu-container">No se ha asignado un área al usuario.</div>;
    }
    const areaUpper = userData.area.toUpperCase();
    filteredItems = filteredItems.filter(item => item.areas.includes(areaUpper));
  }

  const handleItemClick = (label) => {
    if (label === "CALIDAD E INOCUIDAD") {
      setShowMessage(!showMessage);
    } else {
      navigate(`/objetivos/${label}`);
    }
  };

  return (
    <div>
      <div className="header-container">
        <h2 className="titulo-objetivos">
          Objetivos de {userData.Nombre} - {userData.area}
        </h2>
        {filteredItems.some(item => item.label === "CALIDAD E INOCUIDAD") && (
          <button 
            className="btn-calidad"
            onClick={() => handleItemClick("CALIDAD E INOCUIDAD")}
          >
            CALIDAD E INOCUIDAD
          </button>
        )}
      </div>
  
      <div className="menu-container">
        {filteredItems
          .filter(item => item.label !== "CALIDAD E INOCUIDAD")
          .map((item, index) => (
            <div 
              key={index} 
              className="menu-item" 
              onClick={() => handleItemClick(item.label)}
              style={{ cursor: 'pointer' }}
            >
              <span>{item.label}</span>
            </div>
          ))}
      </div>
      {showMessage && (
        <div className="floating-message">
          <p>
            <strong>6.2 OBJETIVOS DEL SISTEMA DE ADMINISTRACIÓN DE CALIDAD E INOCUIDAD DE LOS ALIMENTOS Y PLANEACIÓN PARA LOGRARLOS.</strong><br/>
            De acuerdo con la Norma Internacional ISO 22000 - 2018, inciso 6.2.1; La Organización debe establecer objetivos para el Sistema de Gestión de Inocuidad Alimentaria para las funciones y niveles pertinentes.<br/>
            <br/>
            Los objetivos del SGIA deben:
            <ul>
              <li>Ser coherentes con la política de inocuidad de los alimentos.</li>
              <li>Ser medibles (si es posible).</li>
              <li>Tener en cuenta los requerimientos aplicables de la inocuidad de los alimentos, incluyendo los requerimientos legales, reglamentarios y de los clientes.</li>
              <li>Ser objeto de seguimiento y verificación.</li>
              <li>Ser comunicados.</li>
              <li>Ser mantenidos y actualizados según sea apropiado.</li>
            </ul>
            La organización debe conservar la información documentada sobre los objetivos para el SGIA.<br/>
            <br/>
            <strong>6.2.2 Al planear cómo lograr sus objetivos para el SGIA, la organización debe determinar:</strong>
            <ul>
              <li>Qué se va a hacer.</li>
              <li>Qué recursos se requerirán.</li>
              <li>Quién será responsable.</li>
              <li>Cuándo se finalizará.</li>
              <li>Cómo se evaluarán los resultados.</li>
            </ul>
          </p>
          <button onClick={() => setShowMessage(false)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default MenuByRoleAndArea;
