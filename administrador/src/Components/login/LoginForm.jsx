// LoginForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import './css/login.css';
import logo from '../assets/img/logoAguida.png';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    Correo: '',
    Contraseña: '',
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/login`, formData);
      alert("Inicio de sesión exitoso como administrador");
      console.log(response.data);
      setLoggedIn(true);
    } catch (error) {
      console.error(error);
      setError("Credenciales inválidas. Por favor, intenta de nuevo.");
    }
  };

  if (loggedIn) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logo" />
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="Correo">Correo:</label>
          <input
            type="email"
            name="Correo"
            value={formData.Correo}
            onChange={handleChange}
            placeholder="Correo"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="Contraseña">Contraseña:</label>
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
  );
};

export default LoginForm;
