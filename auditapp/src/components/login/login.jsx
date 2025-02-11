import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './css/Login.css';
import logo from '../../assets/img/logoAguida.png';
import Swal from 'sweetalert2';

const Login = () => {
  const [formData, setFormData] = useState({ Correo: '', Contraseña: '' });
  const [mostrarContrasena, setMostrarContrasena] = useState(false); // Estado para mostrar u ocultar la contraseña
  const [error] = useState('');
  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const mostrarCargando = () => {
    Swal.fire({
      title: 'Verificando Credenciales...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const ocultarCargando = () => {
    Swal.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    mostrarCargando();

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/login`, formData);
      const { token, usuario } = response.data;

      localStorage.setItem('token', token);
      setUserData(usuario);
      console.log(usuario);

      if (usuario.TipoUsuario === 'administrador') {
        navigate('/admin');
      } else if (usuario.TipoUsuario === 'auditado') {
        navigate('/auditado');
      } else if (usuario.TipoUsuario === 'auditor') {
        navigate('/auditor');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Rol no permitido.',
        });
      }
      ocultarCargando();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Credenciales inválidas. Por favor, intente de nuevo.',
        timer: null,
        allowOutsideClick: false,
      });
    }
  };

  return (
    <div className='login-container-all'>
      <div className="login-container">
        <div className="form-group">
          <div className='espacio'>
            <img src={logo} alt="Logo Empresa" className="logo-empresa-login" />
            <div className='tipo-usuario'>Auditapp</div>
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
              type={mostrarContrasena ? 'text' : 'password'} // Cambiar entre 'text' y 'password'
              name="Contraseña"
              value={formData.Contraseña}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>
          <div className="pass-vew">
            <p>ver contraseña</p>
            <input
              type="checkbox"
              id="mostrarContrasena"
              checked={mostrarContrasena}
              onChange={() => setMostrarContrasena(!mostrarContrasena)} // Actualizar estado
            />
          </div>
          
          <button type="submit" className="btn-login">Iniciar Sesión</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span>
            <br />
            v2.1.4(Beta)
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;