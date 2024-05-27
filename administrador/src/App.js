// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Usuarios from "./Components/RegistroUsuarios/Usuarios";
import Login from "./Components/login/LoginForm"; // Importa el componente de inicio de sesión
import Inicio from './Components/Home/inicio';
import UsuariosRegis from './Components/UsuariosRegistrados/usuariosRegistro'; // Importa el componente UsuariosRegistrados
import Datos from './Components/DatosGenerales/Datos'
import Programas from './Components/ProgramasIn/Programa';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> {/* Cambia la ruta raíz a la ruta de inicio de sesión */}
          <Route path="/datos" element={<Datos/>}/>
          <Route path="/programa" element={<Programas/>}/>
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/home" element={<Inicio/>}/>
          <Route path="/usuariosRegistrados" element={<UsuariosRegis />} /> {/* Agrega la ruta para UsuariosRegistrados */}
          
          {/* Agrega más rutas aquí si es necesario */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
