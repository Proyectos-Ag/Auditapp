import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from './App';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    // Inicializar userData desde localStorage si está disponible
    const storedUserData = localStorage.getItem('userData');
    return storedUserData ? JSON.parse(storedUserData) : null;
  });
  const [loading, setLoading] = useState(true); // Estado para controlar la carga

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/verifyToken`, { token });
          const data = { ...response.data, token };
          setUserData(data);
          localStorage.setItem('userData', JSON.stringify(data));
        } else {
          setUserData(null);
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setUserData(null);
      } finally {
        setLoading(false); // Finaliza el estado de carga
      }
    };

    verifyToken();
  }, []);

  const mostrarCargando = () => {
    MySwal.fire({
      title: 'Cargando...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  };
  
  const ocultarCargando = () => {
    Swal.close();
  };
  
  if (loading) {
    // Mostrar un indicador de carga mientras se verifica el token
    return mostrarCargando();
  }else{
    ocultarCargando();
  }

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;