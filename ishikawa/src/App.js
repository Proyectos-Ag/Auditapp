// App.js
import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Ishikawa from './components/Ishikawa/Ishikawa';
import Login from './components/Login/login';
import Diagrama from './components/DiagramaRe/Diagrama';
import AuthProvider from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { checkForUpdate } from './utils/checkForUpdate';
import DatosV from './components/Login/DatosV';

export const UserContext = createContext(null);

function App() {
  const [appVersion] = useState('2.2.0');
  useEffect(() => {
    const showUpdateNotification = async () => {
      const hasUpdate = await checkForUpdate(appVersion);
      const updateShown = localStorage.getItem('updateShown');

      if (hasUpdate && !updateShown) {
        toast.info(
          <div>
            ¡Nueva actualización disponible!
            <button onClick={() => DatosV(true)}>Ver Novedades</button>
          </div>,
          {
            position: 'top-right',
            autoClose: false,
            closeOnClick: true,
            draggable: true,
            onClose: () => window.location.reload(), // Recarga la página
          }
        );
        localStorage.setItem('updateShown', 'true'); // Evita que se muestre de nuevo
      }
    };

    const interval = setInterval(showUpdateNotification, 60000); // Verifica cada minuto
    return () => clearInterval(interval);
  }, [appVersion]);

  return (
    <AuthProvider>
      <ToastContainer />
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/ishikawavacio"
              element={
                <ProtectedRoute>
                  <Ishikawa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagramas"
              element={
                <ProtectedRoute>
                  <Diagrama />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
