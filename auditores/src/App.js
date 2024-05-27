// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login/loginForm" // Importa el componente de inicio de sesión
import Inicio from './components/Home/inicio';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> {/* Cambia la ruta raíz a la ruta de inicio de sesión */}

          <Route path="/home" element={<Inicio/>}/>
          
          {/* Agrega más rutas aquí si es necesario */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
