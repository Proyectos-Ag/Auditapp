import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from './App';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from './services/api';

const MySwal = withReactContent(Swal);

// Configurar axios para enviar cookies
axios.defaults.withCredentials = true;

const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        console.log('🔄 Verificando token al cargar...');
        console.log('🌐 URL Backend:', api.defaults.baseURL);
        
        const { data } = await api.get('/auth/verifyToken');
        console.log('✅ Token verificado:', data.user.email);
        
        setUserData({ ...data.user });
      } catch (error) {
        console.error('❌ Error verificando token:', {
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
          url: error.config?.url
        });
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Interceptor para manejar errores 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response) {
          // 401: token inválido/expirado
          if (error.response.status === 401) {
            console.log('🔐 Error 401 - Sesión expirada o inválida');
            setUserData(null);

            // No mostrar alerta si estamos en la página de login
            if (!window.location.pathname.includes('/login')) {
              MySwal.fire({
                icon: 'warning',
                title: 'Sesión Expirada',
                text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                confirmButtonText: 'Aceptar'
              }).then(() => {
                window.location.href = '/login';
              });
            }
          }

          // 403: acceso denegado (modo solo lectura)
          else if (error.response.status === 403) {
            // Mostrar un mensaje amable cuando se intente realizar una operación prohibida
            MySwal.fire({
              icon: 'info',
              title: 'Acceso denegado',
              text: 'No tienes permisos para realizar cambios. Tu sesión es de solo lectura (invitado).',
              confirmButtonText: 'Entendido'
            });
          }
        }
        return Promise.reject(error);
      }
    );

    // Limpiar interceptor al desmontar
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (loading) {
    MySwal.fire({
      title: 'Cargando...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    return null;
  } else {
    Swal.close();
  }

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;
