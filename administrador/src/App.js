// App.js
import React, { createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Usuarios from "./Components/RegistroUsuarios/Usuarios";
import Login from "./Components/login/LoginForm"; // Importa el componente de inicio de sesión
import Inicio from './Components/Home/inicio';
import UsuariosRegis from './Components/UsuariosRegistrados/usuariosRegistro'; // Importa el componente UsuariosRegistrados
import Datos from './Components/DatosGenerales/Datos'
import Programas from './Components/ProgramasIn/Programa';
import AuthProvider from './authProvider';
import Revicion from './Components/Reviciones/Revicion';
import Terminada from './Components/Terminadas/Terminada';
import Ishikawa from './Components/Ishikawa/Ishikawa';
import IshikawaRev from './Components/IshikawaRev/IshikawaRev';
import Finalizada from './Components/Finalizada/Finalizada';
import Calendarioss from './Components/Calendarios/AuditCalendar'
import Calendarios from './Components/Calendarios/CalendarioGeneral'
import Departaments from './Components/Departaments/Departaments';
import Diagrama from './Components/DiagramaRe/Diagrama';
import CargaMasiva from './Components/DatosGenerales/CargaMasiva';
import Estadisticas from './Components/Estadisticas/Estadisticas';
import ProtectedRoute from './ProtectedRoute';
import RevIshi from './Components/Terminadas/VistaRevIsh';
import Evaluacion from './Components/Evaluaciones/evaluaciones';
import Verevaluaciones from './Components/Evaluaciones/verevaluaciones'

export const UserContext = createContext(null);

function App() {
  return (
    <AuthProvider>
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/datos" element={<ProtectedRoute><Datos/></ProtectedRoute>}/>
          <Route path="/programa" element={<ProtectedRoute><Programas/></ProtectedRoute>}/>
          <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Inicio/></ProtectedRoute>}/>
          <Route path="/usuariosRegistrados" element={<ProtectedRoute><UsuariosRegis /></ProtectedRoute>} /> 
          <Route path="/revicion" element={<ProtectedRoute><Revicion /></ProtectedRoute>} />
          <Route path="/terminada/:_id" element={<ProtectedRoute><Terminada /></ProtectedRoute>} />
          <Route path="/ishikawa" element={<ProtectedRoute><Ishikawa/></ProtectedRoute>} />
          <Route path="/ishikawa/:_id/:id/:nombre" element={<ProtectedRoute><IshikawaRev/></ProtectedRoute>}/>
          <Route path="/finalizadas" element={<ProtectedRoute><Finalizada/></ProtectedRoute>}/>
          <Route path="/auditcalendar" element={<ProtectedRoute><Calendarioss/></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><Calendarios /></ProtectedRoute>} />
          <Route path="/departamento" element={<ProtectedRoute><Departaments /></ProtectedRoute>} />
          <Route path="/diagrama" element={<ProtectedRoute><Diagrama /></ProtectedRoute>} />
          <Route path="/carga" element={<ProtectedRoute><CargaMasiva /></ProtectedRoute>} />
          <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
          <Route path="/revish" element={<ProtectedRoute><RevIshi /></ProtectedRoute>} />
          <Route path="/evuaauditor" element={<ProtectedRoute><Evaluacion /></ProtectedRoute>} />
          <Route path="/vereva" element={<ProtectedRoute><Verevaluaciones/></ProtectedRoute>}/>
        </Routes>
      </Router>
    </div>
    </AuthProvider>
  );
}

export default App;
