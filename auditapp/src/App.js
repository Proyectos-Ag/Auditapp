import React, { createContext, Suspense, lazy, useState, useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation} from "react-router-dom";
import axios from 'axios';
import Login from './components/login/login.jsx';
import AuthProvider from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { checkForUpdate } from './utils/checkForUpdate.js';
//componentes
import MigasPan from './resources/migas-pan.jsx';
import IconMenu from './resources/icon-menu.jsx';
import Navbar from './components/navbar/navbar.jsx';
import InformacionAuditor from './components/Informacion/Informacion.jsx';

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
import ProgramarAuditoria from './administrador/Components/ProgramarAuditoria/AuditTable.jsx';
import IshikawaDashboard from './administrador/Components/EstadisticasIsh/IshikawaDashboard.jsx';
import VistaRevicion from './administrador/Components/Reviciones/VistaRevicion.jsx';
import EstaUsi from './administrador/Components/EstaUni.jsx';

//Auditor
import PendienteAuditor from './auditor/components/Pendientes/Pendiente';
import ReporteAuditor from './auditor/components/Reportes/Reporte';

//Auditado
import ReporteAuditado from './auditado/Components/ReporteF/ReporteF';
import IshikawaAuditado from './auditado/Components/Ishikawa/Ishikawa';
import DiagramaAuditado from './auditado/Components/DiagramaRe/Diagrama';
import VistaReportesAuditado from './auditado/Components/ReporteF/VistaReportes';
import Reporte from './auditado/Components/Reportes/Reporte.jsx';

//Ishikawas Vacios
import DiagramaIshVac from './ishikawa-vacio/components/DiagramaRe/Diagrama.jsx';
//import IshikawaVac from './ishikawa-vacio/components/Ishikawa/Ishikawa.jsx';
import InicioIsh from './ishikawa-vacio/components/Home/inicio.jsx';
import GestorIsh from './ishikawa-vacio/components/Ishikawa/GestorIsh.jsx';
import NewIshikawa from './ishikawa-vacio/components/Ishikawa/NewIshikawa.jsx';
import CreacionIshikawa2 from './ishikawa-vacio/components/Ishikawa/IshikawaNewBeta.jsx';

//Objetivos 
import Menu from './Objetivos/Components/Menu/elmenu.jsx';
import Objetivos from './Objetivos/Components/Home/Inicio.jsx';
import Tabla from './Objetivos/Components/Tabla/ObjetivosTabla.jsx'
import Frecuencia from './Objetivos/Components/Tabla/frecuencia.jsx'
import AccionesCorrectivas from './Objetivos/Components/Tabla/AccionesCorrectivas.jsx';
import AccionesCorrectivasList from './Objetivos/Components/Tabla/AccionesCorrectivasList.jsx';
import SaeftyGoals from './Objetivos/Components/Tabla/objetivoslistsaeftygoals.jsx'
import Concentrado from './Objetivos/Components/Tabla/concentrado.jsx'
import RegistroAccionCorrectiva from './Objetivos/Components/Tabla/AccionesCorrectivas.jsx'

//Gestion de Cambios
import GestionCambioForm from './gestion/GestionCambioForm.jsx';
import MobileSign from './gestion/MobileSign.jsx';
import GestionList from './gestion/GestionCambioList.jsx'
import Home from './gestion/home/Home.jsx';
import VistaSolicitudesCambios from './gestion/VistaSolicitudesCambios.jsx';
import RevisionSolicitudesCambios from './gestion/RevisionSolicitudesCambios.jsx';
import ValidacionForm from './gestion/validacion/ValidacionForm.jsx';

//Paginas de error
import UnauthorizedPage from './components/Pag-error/UnauthorizedPage.jsx';
import NotFoundPage from './components/Pag-error/NotFoundPage.jsx';

// Cargar componentes según el rol correspondiente
const Administrador = lazy(() => import('./administrador/Components/Home/inicio.jsx'));
const Auditor = lazy(() => import('./auditor/components/Home/inicio.jsx'));
const Auditado = lazy(() => import('./auditado/Components/Home/Inicio.jsx'));

//Axios
axios.defaults.withCredentials = true;


export const UserContext = createContext(null);


  const MainContent = () => {
    const location = useLocation();
  
    // Rutas donde no queremos que se muestren MigasPan e IconMenu
    const excludedRoutes = ['/','/correo-prog-audi', '/mobile-sign'];
  
    return (
      <>
        {!excludedRoutes.includes(location.pathname)&& UserContext && <Navbar />}
        {!excludedRoutes.includes(location.pathname)&& UserContext && <MigasPan />}
        {!excludedRoutes.includes(location.pathname)&& UserContext &&<IconMenu />}
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/correo-prog-audi" element={<ProgramarAuditoria/>}/>
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrador']}><Administrador /></ProtectedRoute>} />
              <Route path="/auditor" element={<ProtectedRoute><Auditor /></ProtectedRoute>} />
              <Route path="/auditado" element={<ProtectedRoute><Auditado /></ProtectedRoute>} />

              {/*Administrador*/}

              <Route path="/datos" element={<ProtectedRoute allowedRoles={['administrador']}><Datos/></ProtectedRoute>}/>
              <Route path="/programa" element={<ProtectedRoute allowedRoles={['administrador']}><Programas/></ProtectedRoute>}/>
              <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['administrador']}><Usuarios /></ProtectedRoute>} />
              <Route path="/usuariosRegistrados" element={<ProtectedRoute allowedRoles={['administrador']}><UsuariosRegis /></ProtectedRoute>} /> 
              <Route path="/revicion/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Revicion /></ProtectedRoute>} />
              <Route path="/terminada/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Terminada /></ProtectedRoute>} />
              <Route path="/finalizadas/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Finalizada/></ProtectedRoute>}/>
              <Route path="/ishikawa" element={<ProtectedRoute allowedRoles={['administrador']}><Ishikawa/></ProtectedRoute>} />
              <Route path="/ishikawa/:_id/:id/:nombre" element={<ProtectedRoute allowedRoles={['administrador']}><IshikawaRev/></ProtectedRoute>}/>
              <Route path="/vistafin" element={<ProtectedRoute allowedRoles={['administrador']}><VistaFinalizadas/></ProtectedRoute>}/>
              <Route path="/auditcalendar" element={<ProtectedRoute allowedRoles={['administrador']}><Calendarioss/></ProtectedRoute>} />

              <Route path="/calendario" element={<ProtectedRoute allowedRoles={['administrador']}><Calendarios /></ProtectedRoute>} />
              <Route path="/estadousuario" element={<ProtectedRoute allowedRoles={['administrador']}><EstaUsi /></ProtectedRoute>} />

              <Route path="/departamento" element={<ProtectedRoute allowedRoles={['administrador']}><Departaments /></ProtectedRoute>} />
              <Route path="/diagrama/:_id" element={<ProtectedRoute allowedRoles={['administrador']}><Diagrama /></ProtectedRoute>} />
              <Route path="/carga" element={<ProtectedRoute allowedRoles={['administrador']}><CargaMasiva /></ProtectedRoute>} />
              <Route path="/estadisticas" element={<ProtectedRoute allowedRoles={['administrador']}><Estadisticas /></ProtectedRoute>} />
              <Route path="/revish" element={<ProtectedRoute allowedRoles={['administrador']}><RevIshi /></ProtectedRoute>} />
              <Route path="/evuaauditor" element={<ProtectedRoute allowedRoles={['administrador']}><Evaluacion /></ProtectedRoute>} />
              <Route path="/vereva" element={<ProtectedRoute allowedRoles={['administrador']}><Verevaluaciones/></ProtectedRoute>}/>
              <Route path="/ishikawasesp" element={<ProtectedRoute allowedRoles={['administrador']}><VistaIshikawas/></ProtectedRoute>}/>
              <Route path="/prog-audi" element={<ProtectedRoute allowedRoles={['administrador']}><ProgramarAuditoria/></ProtectedRoute>}/>
              <Route path="/ishikawas-estadisticas" element={<ProtectedRoute allowedRoles={['administrador']}><IshikawaDashboard/></ProtectedRoute>}/>
              <Route path="/ver-reali" element={<ProtectedRoute allowedRoles={['administrador']}><VistaRevicion/></ProtectedRoute>}/>

              {/*Auditor*/}

              <Route path="/pendiente" element={<ProtectedRoute allowedRoles={['auditor', 'administrador']}><PendienteAuditor/></ProtectedRoute>}/> 
              <Route path="/reporte" element={<ProtectedRoute allowedRoles={['auditor', 'administrador']}><ReporteAuditor/></ProtectedRoute>}/> 
              <Route path="/informacion" element={<ProtectedRoute><InformacionAuditor/></ProtectedRoute>}/>

              {/*Auditado*/}

              <Route path="/auditado/reporte/:_id" element={<ProtectedRoute><ReporteAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/ishikawa/:_id/:id/:nombre" element={<ProtectedRoute><IshikawaAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/diagrama" element={<ProtectedRoute><DiagramaAuditado/></ProtectedRoute>}/>
              <Route path="/auditado/vistarep" element={<ProtectedRoute><VistaReportesAuditado/></ProtectedRoute>}/>
              <Route path="/reportes-auditado" element={<ProtectedRoute><Reporte/></ProtectedRoute>}/>

              {/*Ishikawas vacios*/}

              <Route path="/ishikawavacio" element={<ProtectedRoute><DiagramaIshVac/></ProtectedRoute>}/>
              <Route path="/diagramas" element={<ProtectedRoute><CreacionIshikawa2/></ProtectedRoute>}/>
              <Route path="/inicio-ishvac" element={<ProtectedRoute><InicioIsh/></ProtectedRoute>}/>
              <Route path="/ish-vac-esp" element={<ProtectedRoute><GestorIsh/></ProtectedRoute>}/>
              <Route path="/new" element={<ProtectedRoute><NewIshikawa/></ProtectedRoute>}/>

                {/*Objetivos*/}

              <Route path="/objetivos" element={<ProtectedRoute><Objetivos/></ProtectedRoute>}/>
              <Route path="/menu" element={<ProtectedRoute><Menu/></ProtectedRoute>}/>
              <Route path="/objetivos/:label" element={<ProtectedRoute><Tabla/></ProtectedRoute>}/>
              <Route path="/objetivos/:label/frecuencia/:label" element={<Frecuencia />} />
              <Route path="/acciones" element={<AccionesCorrectivas />} />
              <Route path="/acciones-list/:label" element={<AccionesCorrectivasList />} />
              <Route path="/registro-accion" element={<ProtectedRoute><RegistroAccionCorrectiva/></ProtectedRoute>}/>
              <Route path="/saefty-goals2" element={<SaeftyGoals />} />
              <Route path="/concentradon" element={<Concentrado />} />

              {/*Gestion de Cambios*/}
              <Route path="/gestion-cambio/:id" element={<ProtectedRoute><GestionCambioForm/></ProtectedRoute>}/>
              <Route path="/gestion-cambio" element={<ProtectedRoute><GestionCambioForm/></ProtectedRoute>}/>
              <Route path="/solicitud-cambio/:id" element={<ProtectedRoute><GestionList/></ProtectedRoute>}/>
              <Route path="/gestion" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
              <Route path="/vista-solictudes" element={<ProtectedRoute><VistaSolicitudesCambios/></ProtectedRoute>}/>
              <Route path="/vista-solictudes-rev" element={<ProtectedRoute><RevisionSolicitudesCambios/></ProtectedRoute>}/>
              <Route path="/validacion-form" element={<ProtectedRoute><ValidacionForm/></ProtectedRoute>}/>
              <Route path="/mobile-sign" element={<MobileSign />} />

              {/* Rutas protegidas para los componentes de usuario */}

              {/*Paginas de error*/}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Ruta comodín para rutas no encontradas */}
              <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </Suspense>
      </>
    );
  };

function App() {
  const [appVersion] = useState('2.1.8');


  useEffect(() => {
    const showUpdateNotification = async () => {
      const hasUpdate = await checkForUpdate(appVersion);
      const storedVersion = localStorage.getItem('updateShownVersion');
  
      // Mostrar notificación si hay una nueva versión o si la versión no coincide con la guardada
      if (hasUpdate || storedVersion !== appVersion) {
        toast.info(
          <div>
            ¡Nueva actualización disponible! Recargue la página para obtener la última versión.
          </div>,
          {
            position: 'top-right',
            autoClose: false,
            closeOnClick: true,
            draggable: true
          }
        );
        // Almacena la versión actual para que no se vuelva a mostrar
        localStorage.setItem('updateShownVersion', appVersion);
      }
    };
  
    const interval = setInterval(showUpdateNotification, 60000); // Verifica cada minuto
    return () => clearInterval(interval);
  }, [appVersion]);

  return (
    <>
    <AuthProvider>
    <ToastContainer />
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
