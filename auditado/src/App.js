// App.js
import React, { createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './Components/Login/LoginForm';
import Inicio from './Components/Home/Inicio';
import Reporte from './Components/ReporteF/ReporteF';
import AuthProvider from './AuthProvider';
import Ishikawa from './Components/Ishikawa/Ishikawa';
import Diagrama from './Components/DiagramaRe/Diagrama';

export const UserContext = createContext(null);

function App() {
  return (
    <AuthProvider>
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/reporte" element={<Reporte/>}/>
          <Route path="/home" element={<Inicio/>}/>
          <Route path="/ishikawa/:_id/:id" element={<Ishikawa/>}/>
          <Route path="/diagrama" element={<Diagrama/>}/>
        </Routes>
      </Router>
    </div>
    </AuthProvider>
  );
}

export default App;
