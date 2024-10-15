import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './css/Login.css';
import logo from '../../assets/img/logoAguida.png';
import Swal from 'sweetalert2';
import DatosV from './DatosV';

const Login = () => {
  const [formData, setFormData] = useState({ Correo: '', Contraseña: '', Nombre: '' });
  const [isRegister, setIsRegister] = useState(false);
  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister
      ? `${process.env.REACT_APP_BACKEND_URL}/usuarios`
      : `${process.env.REACT_APP_BACKEND_URL}/login`;

    const data = {
      Correo: formData.Correo,
      Contraseña: formData.Contraseña,
      ...(isRegister && { Nombre: formData.Nombre }), // Solo incluir Nombre si es registro
    };

    try {
      const response = await axios.post(url, data);

      if (isRegister) {
        Swal.fire({
          title: 'Registro Exitoso',
          text: 'Usuario registrado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          setIsRegister(false); // Cambiar a modo de inicio de sesión después del registro
        });
      } else {
        const { token, usuario } = response.data;

        // Guardar el token y los datos del usuario en el almacenamiento local
        localStorage.setItem('token', token);
        setUserData(usuario);

        // Mostrar mensaje de bienvenida
        const nombreUsuario = usuario.Nombre || 'Usuario';
        Swal.fire({
          title: 'Bienvenido',
          text: `Hola ${nombreUsuario}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate('/ishikawavacio');
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response ? error.response.data : 'Ha ocurrido un error',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleOpenModal = () => {
    setShowModal(true); // Mostrar modal
  };

  const handleCloseModal = () => {
    setShowModal(false); // Ocultar modal
  };

  const handleOverlayClick = (e) => {
    // Si el clic es en el overlay (no dentro del contenido), cerramos el modal
    if (e.target.classList.contains('modal-overlay')) {
      handleCloseModal();
    }
  };

  return (
    <div className='login-container-all'>
      <div className="login-container">
        <div className="form-group">
          <div className='espacio'>
            <img src={logo} alt="Logo Empresa" className="logo-empresa-login" />
            <div className='tipo-usuario'>Ishikawas</div>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="Nombre"></label>
              <input
                type="text"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleChange}
                placeholder="Nombre"
                required={isRegister}
              />
            </div>
          )}
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
          <button type="submit" className="btn-login">
            {isRegister ? 'Registrar' : 'Iniciar Sesión'}
          </button>
          <button
            type="button"
            className="btn-switch"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Iniciar sesión' : '¿No tienes una cuenta?; Registrar'}
          </button>
        </form>

        {/* Texto que abre el modal */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span 
            style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }} 
            onClick={handleOpenModal}
          >
            <br />
            v1.1(Beta)
          </span>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleOverlayClick}>
            <div onClick={(e) => e.stopPropagation()}>
              {/* El clic dentro del modal no lo cierra */}
              <DatosV />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;