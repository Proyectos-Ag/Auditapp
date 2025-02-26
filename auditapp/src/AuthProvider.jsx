import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from './App';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

axios.defaults.withCredentials = true; // Asegura el envío de cookies

const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/verifyToken`);
        setUserData({ ...response.data });
      } catch (error) {
        // Si no se puede verificar el token, aseguramos que no haya datos de usuario
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Ejemplo de interceptor para centralizar la lógica de errores 401
  axios.interceptors.response.use(
    response => response,
    async error => {
      if (error.response && error.response.status === 401) {
        // Aquí podrías implementar la lógica para intentar renovar el token (refresh token)
        // o redirigir al usuario al login.
      }
      return Promise.reject(error);
    }
  );

  if (loading) {
    MySwal.fire({
      title: 'Cargando...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
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