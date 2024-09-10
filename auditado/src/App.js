// App.js
import React, { createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './Components/Login/LoginForm';
import Inicio from './Components/Home/Inicio';
import Reporte from './Components/ReporteF/ReporteF';
import AuthProvider from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';
import Ishikawa from './Components/Ishikawa/Ishikawa';
import Diagrama from './Components/DiagramaRe/Diagrama';
import Informacion from './Components/Informacion/Informacion';
import VistaReportes from './Components/ReporteF/VistaReportes';

export const UserContext = createContext(null);

function App() {
  return (
    <AuthProvider>
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/reporte/:_id" element={<ProtectedRoute><Reporte/></ProtectedRoute>}/>
          <Route path="/home" element={<ProtectedRoute><Inicio/></ProtectedRoute>}/>
          <Route path="/ishikawa/:_id/:id/:nombre" element={<ProtectedRoute><Ishikawa/></ProtectedRoute>}/>
          <Route path="/diagrama" element={<ProtectedRoute><Diagrama/></ProtectedRoute>}/>
          <Route path="/informacion" element={<ProtectedRoute><Informacion/></ProtectedRoute>}/>
          <Route path="/vistarep" element={<ProtectedRoute><VistaReportes/></ProtectedRoute>}/>
        </Routes>
      </Router>
    </div>
    </AuthProvider>
  );
}

export default App;
