import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from './App';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from './services/api';

const MySwal = withReactContent(Swal);

const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setUserData(null); return; }

        const { data } = await api.get('/auth/verifyToken'); // Authorization ya va por interceptor
        const user = data.user ?? data;
        setUserData(user);
        console.log('✅ Token verificado:', user.email ?? user.Correo);
      } catch (error) {
        console.error('❌ Error verificando token:', {
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
          url: error.config?.url
        });
        localStorage.removeItem('authToken'); // invalida token roto
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  // Interceptor 401: limpia token y redirige (opcional)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        if (error?.response?.status === 401) {
          localStorage.removeItem('authToken');
          setUserData(null);
          if (!window.location.pathname.includes('/login')) {
            await MySwal.fire({
              icon: 'warning',
              title: 'Sesión Expirada',
              text: 'Por favor, inicia sesión nuevamente.',
              confirmButtonText: 'Aceptar'
            });
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  if (loading) return null;
  return (
    <UserContext.Provider value={{ userData, setUserData, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;