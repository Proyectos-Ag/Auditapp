// App.js
import React, { createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login/loginForm" 
import Inicio from './components/Home/inicio';
import AuthProvider from './authProvider';
import Pendiente from './components/Pendientes/Pendiente';
import Fotos from './components/Pendientes/Foto';
import Reporte from './components/Reportes/Reporte';
import Informacion from './components/Informacion/Informacion';
import ProtectedRoute from './ProtectedRoute';

export const UserContext = createContext(null);

function App() {
  return (
    <AuthProvider>
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/home" element={<ProtectedRoute><Inicio/></ProtectedRoute>}/> 
          <Route path="/pendiente" element={<ProtectedRoute><Pendiente/></ProtectedRoute>}/> 
          <Route path="/foto" element={<Fotos/>}/> 
          <Route path="/reporte" element={<ProtectedRoute><Reporte/></ProtectedRoute>}/> 
          <Route path="/informacion" element={<ProtectedRoute><Informacion/></ProtectedRoute>}/> 
        </Routes>
      </Router>
    </div>
  </AuthProvider>
  );
}

export default App;
