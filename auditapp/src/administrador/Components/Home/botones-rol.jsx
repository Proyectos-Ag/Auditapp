import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { UserContext } from '../../../App';

const BotonesRol = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Obtener la ruta actual
  const { userData } = useContext(UserContext);

  const [alignment, setAlignment] = useState(location.pathname);

  useEffect(() => {
    setAlignment(location.pathname);
  }, [location.pathname]);

  const handleChange = (event, newAlignment) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment);
      navigate(newAlignment);  // Navegar a la ruta seleccionada
    }
  };

  return (
    <div className="botones-rol">
      {userData && userData.TipoUsuario === 'administrador' && (
        <ToggleButtonGroup
          sx={{backgroundColor:'#1b70df'}}
          value={alignment}
          exclusive
          onChange={handleChange}
          aria-label="Navigation"
        >
          <ToggleButton value="/admin">Administrador</ToggleButton>
          <ToggleButton value="/auditor">Auditor</ToggleButton>
          <ToggleButton value="/auditado">Auditado</ToggleButton>
        </ToggleButtonGroup>
      )}
      
      {userData && userData.TipoUsuario === 'auditor' && (
        <ToggleButtonGroup
          sx={{backgroundColor:'#1b70df'}}
          value={alignment}
          exclusive
          onChange={handleChange}
          aria-label="Navigation"
        >
          <ToggleButton value="/auditor">Auditor</ToggleButton>
          <ToggleButton value="/auditado">Auditado</ToggleButton>
        </ToggleButtonGroup>
      )}

      {userData && userData.TipoUsuario === 'auditado' && (
        <button onClick={() => navigate("/auditado")}>Auditado</button>
      )}
    </div>
  );
};

export default BotonesRol;