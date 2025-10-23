import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './css/Login.css';
import logo from '../../assets/img/logoAguida.png';
import Swal from 'sweetalert2';
import api from '../../services/api';

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
      const base = sessionStorage.getItem('AUTH_BASE') || api.defaults.baseURL;
      sessionStorage.setItem('AUTH_BASE', base);

      const { data } = await api.post('/login', formData, { baseURL: base });
      // Guarda token
      localStorage.setItem('authToken', data.token);

      // Guarda usuario
      const user = data.user ?? data.usuario ?? {};
      setUserData(user);

      const tipo = (user.tipoUsuario ?? user.TipoUsuario ?? '').toLowerCase();
      if (tipo === 'administrador' || tipo === 'invitado') {
        navigate('/admin', { state: { showModal: true } });
      } else if (tipo === 'auditado') {
        navigate('/auditado', { state: { showModal: true } });
      } else if (tipo === 'auditor') {
        navigate('/auditor', { state: { showModal: true } });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Rol no permitido.' });
      }

      ocultarCargando();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Credenciales inválidas. Por favor, intente de nuevo.',
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
            v2.1.9(Beta)
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;