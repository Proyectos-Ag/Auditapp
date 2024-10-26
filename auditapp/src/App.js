import React, { createContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Login from './components/login/login.jsx';
import AuthProvider from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';
//componentes
import MigasPan from './administrador/Components/Home/migas-pan.jsx';
import IconMenu from './administrador/Components/Home/icon-menu.jsx';

//Administrador
import Usuarios from "./administrador/Components/RegistroUsuarios/Usuarios";
import UsuariosRegis from './administrador/Components/UsuariosRegistrados/usuariosRegistro';
import Datos from './administrador/Components/DatosGenerales/Datos'
import Programas from './administrador/Components/ProgramasIn/Programa';
import Revicion from './administrador/Components/Reviciones/Revicion';
import Terminada from './administrador/Components/Terminadas/Terminada';
import Ishikawa from './administrador/Components/Ishikawa/Ishikawa';
import IshikawaRev from './administrador/Components/IshikawaRev/IshikawaRev';
import Finalizada from './administrador/Components/Finalizada/Finalizada';
import Calendarioss from './administrador/Components/Calendarios/AuditCalendar'
import Calendarios from './administrador/Components/Calendarios/CalendarioGeneral'
import Departaments from './administrador/Components/Departaments/Departaments';
import Diagrama from './administrador/Components/DiagramaRe/Diagrama';
import CargaMasiva from './administrador/Components/DatosGenerales/CargaMasiva';
import Estadisticas from './administrador/Components/Estadisticas/Estadisticas';
import RevIshi from './administrador/Components/Terminadas/VistaRevIsh';
import Evaluacion from './administrador/Components/Evaluacion/Evaluacion';
import Verevaluaciones from './administrador/Components/Evaluacion/VerEvaluacion';
import VistaFinalizadas from './administrador/Components/Finalizada/VistaFinalizadas';
import VistaIshikawas from './administrador/Components/DiagramaRe/VistaIshikawas';

//Auditor
import PendienteAuditor from './auditor/components/Pendientes/Pendiente';
import ReporteAuditor from './auditor/components/Reportes/Reporte';
import InformacionAuditor from './auditor/components/Informacion/Informacion';

//Auditado
import ReporteAuditado from './auditado/Components/ReporteF/ReporteF';
import IshikawaAuditado from './auditado/Components/Ishikawa/Ishikawa';
import DiagramaAuditado from './auditado/Components/DiagramaRe/Diagrama';
import InformacionAuditado from './auditado/Components/Informacion/Informacion';
import VistaReportesAuditado from './auditado/Components/ReporteF/VistaReportes';

// Cargar componentes según el rol correspondiente
const Administrador = lazy(() => import('./administrador/Components/Home/inicio.jsx'));
const Auditor = lazy(() => import('./auditor/components/Home/inicio.jsx'));
const Auditado = lazy(() => import('./auditado/Components/Home/Inicio.jsx'));


export const UserContext = createContext(null);


  const MainContent = () => {
    const location = useLocation();
  
    // Rutas donde no queremos que se muestren MigasPan e IconMenu
    const excludedRoutes = ['/'];
  
    return (
      <>
        {!excludedRoutes.includes(location.pathname) && <MigasPan />}
        {!excludedRoutes.includes(location.pathname) && <IconMenu />}
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
          <Route path="/" element={<Login />} /> 
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrador']}><Administrador /></ProtectedRoute>} />
              <Route path="/auditor" element={<ProtectedRoute><Auditor /></ProtectedRoute>} />
              <Route path="/auditado" element={<ProtectedRoute><Auditado /></ProtectedRoute>} />

              {/*Administrador*/}

              <Route path="/datos" element={<ProtectedRoute allowedRoles={['administrador']}><Datos/></ProtectedRoute>}/>
              <Route path="/programa" element={<ProtectedRoute allowedRoles={['administrador']}><Programas/></ProtectedRoute>}/>
              <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['administrador']}><Usuarios /></ProtectedRoute>} />
              <Route path="/usuariosRegistrados" element={<ProtectedRoute allowedRoles={['administrador']}><UsuariosRegis /></ProtectedRoute>} /> 
              <Route path="/revicion" element={<ProtectedRoute allowedRoles={['administrador']}><Revicion /></ProtectedRoute>} />
              <Route path="/terminada/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Terminada /></ProtectedRoute>} />
              <Route path="/finalizadas/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Finalizada/></ProtectedRoute>}/>
              <Route path="/ishikawa" element={<ProtectedRoute allowedRoles={['administrador']}><Ishikawa/></ProtectedRoute>} />
              <Route path="/ishikawa/:_id/:id/:nombre" element={<ProtectedRoute allowedRoles={['administrador']}><IshikawaRev/></ProtectedRoute>}/>
              <Route path="/vistafin" element={<ProtectedRoute allowedRoles={['administrador']}><VistaFinalizadas/></ProtectedRoute>}/>
              <Route path="/auditcalendar" element={<ProtectedRoute allowedRoles={['administrador']}><Calendarioss/></ProtectedRoute>} />

              <Route path="/calendario" element={<ProtectedRoute allowedRoles={['administrador']}><Calendarios /></ProtectedRoute>} />

              <Route path="/departamento" element={<ProtectedRoute allowedRoles={['administrador']}><Departaments /></ProtectedRoute>} />
              <Route path="/diagrama/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Diagrama /></ProtectedRoute>} />
              <Route path="/carga" element={<ProtectedRoute allowedRoles={['administrador']}><CargaMasiva /></ProtectedRoute>} />
              <Route path="/estadisticas" element={<ProtectedRoute allowedRoles={['administrador']}><Estadisticas /></ProtectedRoute>} />
              <Route path="/revish" element={<ProtectedRoute allowedRoles={['administrador']}><RevIshi /></ProtectedRoute>} />
              <Route path="/evuaauditor" element={<ProtectedRoute allowedRoles={['administrador']}><Evaluacion /></ProtectedRoute>} />
              <Route path="/vereva" element={<ProtectedRoute allowedRoles={['administrador']}><Verevaluaciones/></ProtectedRoute>}/>
              <Route path="/ishikawasesp" element={<ProtectedRoute allowedRoles={['administrador']}><VistaIshikawas/></ProtectedRoute>}/>

              {/*Auditor*/}

              <Route path="/pendiente" element={<ProtectedRoute allowedRoles={['auditor', 'administrador']}><PendienteAuditor/></ProtectedRoute>}/> 
              <Route path="/reporte" element={<ProtectedRoute allowedRoles={['auditor', 'administrador']}><ReporteAuditor/></ProtectedRoute>}/> 
              <Route path="/informacion" element={<ProtectedRoute allowedRoles={['auditor', 'administrador']}><InformacionAuditor/></ProtectedRoute>}/>

              {/*Auditado*/}

              <Route path="/auditado/reporte/:_id" element={<ProtectedRoute><ReporteAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/ishikawa/:_id/:id/:nombre" element={<ProtectedRoute><IshikawaAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/diagrama" element={<ProtectedRoute><DiagramaAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/informacion" element={<ProtectedRoute><InformacionAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/vistarep" element={<ProtectedRoute><VistaReportesAuditado/></ProtectedRoute>}/>

          </Routes>
        </Suspense>
      </>
    );
  };

function App() {
  return (
    <>
    <AuthProvider>
      <div className="App">
        <Router>
          <MainContent />
        </Router>
      </div>
    </AuthProvider>
    </>
  );
}

export default App;