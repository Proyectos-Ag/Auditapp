import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './css/Login.css';
import logo from '../../assets/img/logoAguida.png'
import Swal from 'sweetalert2';
import DatosV from './DatosV';

const LoginForm = () => {
  const [formData, setFormData] = useState({ Correo: '', Contraseña: '' });
  const [error] = useState('');
  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); // Estado para controlar el modal

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/login`, formData);
      const { token, usuario } = response.data;

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
       <div className='tipo-usuario'>Auditados</div>
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

export default LoginForm;