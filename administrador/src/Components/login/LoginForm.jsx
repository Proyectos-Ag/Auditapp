import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './css/login.css';
import logo from '../assets/img/logoAguida.png';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const LoginForm = () => {
  const [formData, setFormData] = useState({ Correo: '', Contraseña: '' });
  const [error] = useState('');
  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const mostrarCargando = () => {
    MySwal.fire({
      title: 'Verificando Credenciales...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  };
  
  // Función para ocultar el modal de carga
  const ocultarCargando = () => {
    Swal.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Mostrar modal de carga
    mostrarCargando();
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/login`, formData);
      const { token, usuario } = response.data;
  
      if (usuario.TipoUsuario !== 'Administrador') {
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: 'Solo los administradores pueden iniciar sesión.',
        });
        return;
      }
  
      // Guardar el token y los datos del usuario en el almacenamiento local
      localStorage.setItem('token', token);
      setUserData(usuario);
  
      // Redireccionar al usuario a la página de inicio
      navigate('/home');
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Credenciales inválidas. Por favor, intenta de nuevo.',
      });
    } finally {
      // Ocultar modal de carga después de completar la solicitud
      ocultarCargando();
    }
  };

  return (
    <div className='login-container-all'>
    <div className="login-container">
      <div className="form-group">
        <div className='espacio'>
       <img src={logo} alt="Logo Empresa" className="logo-empresa-login" />
       <div className='tipo-usuario'>Administradores</div>
       </div>
      
       </div>
      {error && <p className="error-message">{error}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="Correo"></label>
          <input
            type="email"
            name="Correo"
            value={formData.Correo}
            onChange={handleChange}
            placeholder="Correo electrónico"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="Contraseña"></label>
          <input
            type="password"
            name="Contraseña"
            value={formData.Contraseña}
            onChange={handleChange}
            placeholder="Contraseña"
            required
          />
        </div>
        <button type="submit" className="btn-login">Iniciar Sesión</button>
      </form>
    </div>
    </div>
  );
};

export default LoginForm;
