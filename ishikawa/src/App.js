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

export const UserContext = createContext(null);

function App() {
  const [appVersion] = useState('2.0.0');
  useEffect(() => {
    const interval = setInterval(async () => {
      const hasUpdate = await checkForUpdate(appVersion);
      if (hasUpdate) {
        toast.info('¡Nueva actualización disponible! Recarga la página para obtener la última versión.', {
          position: 'top-right',
          autoClose: false,
          closeOnClick: true,
          draggable: true,
          onClose: () => window.location.reload(), // Recarga la página
        });
        clearInterval(interval); // Detiene la verificación para evitar múltiples notificaciones
      }
    }, 60000); // Verifica cada minuto

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
