import React, { useState } from 'react';
import axios from 'axios';
import './css/modal.css';
import Swal from 'sweetalert2';

const Modal = ({ handleClose, show, children }) => {
  const showHideClassName = show ? "modal display-block" : "modal display-none";

  return (
    <div className={showHideClassName}>
      <section className="modal-main">
        {children}
        <button className="modal-close" onClick={handleClose}>X</button>
      </section>
    </div>
  );
};

const RegistroUsuarioModal = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    Nombre: '',
    Correo: '',
    Contraseña: '',
    ConfirmarContraseña: '',
    Puesto: '',
    FechaIngreso: '',
    Escolaridad: 'Profesional',
    Carrera: '',
    TipoUsuario: 'auditor',
    AñosExperiencia: ''
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const predefinedAreas = [
    'Calidad', 'Mantenimiento', 'Planta', 'Sistema de Gestión de Calidad e Inocuidad', 
    'Almacenes', 'preparación', 'envasado y embalaje', 'Proceso de Producción', 
    'Aseguramiento de Calidad', 'Áreas de Proceso', 'SGCI Envasadora Aguida'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*\d)[A-Za-z\d]{8}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { Contraseña, ConfirmarContraseña } = formData;

    if (!validatePassword(Contraseña)) {
      setError('La contraseña debe tener exactamente 8 caracteres y al menos un número.');
      return;
    }

    if (Contraseña !== ConfirmarContraseña) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/usuarios`, formData);
      Swal.fire({
        icon: 'success',
        title: 'Usuario registrado con éxito',
        showConfirmButton: false,
        timer: 1500
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

      console.log(response.data);

      setFormData({
        Nombre: '',
        Correo: '',
        Contraseña: '',
        ConfirmarContraseña: '',
        Puesto: '',
        FechaIngreso: '',
        Escolaridad: '',
        TipoUsuario: 'auditor',
        AñosExperiencia: ''
      });

      handleClose();

    } catch (error) {
      console.error(error);
      alert("El correo no puede ser duplicado");
    }
  };

  const renderAdditionalFields = () => {
    if (formData.TipoUsuario === 'auditor') {
      return (
        <div className="additional-fields">
          <div className="form-group">
            <label>Fecha de ingreso:</label>
            <input type="date" name="FechaIngreso" value={formData.FechaIngreso} onChange={handleChange} required />
          </div>
          <div className="form-group">
          <label>Escolaridad:</label>
          <select name="Escolaridad" value={formData.Escolaridad} onChange={handleChange} required>
          <option value="TSU">TSU</option>
                   <option value="Profesional">Profesional</option>
                   <option value="Preparatoria">Preparatoria</option>
          </select>
        </div>
          <div className="form-group">
  <label>Carrera:</label>
  <input type="text" name="Carrera" value={formData.Carrera} onChange={handleChange} required />
</div>
          <div className="form-group">
            <label>Años de Experiencia:</label>
            <input type="number" name="AñosExperiencia" value={formData.AñosExperiencia} onChange={handleChange} required />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Modal show={show} handleClose={handleClose}>
      <form onSubmit={handleSubmit} className="registro-form">
        <h2>Registro de usuario:</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>Tipo de usuario:</label>
          <select name="TipoUsuario" value={formData.TipoUsuario} onChange={handleChange}>
            <option value="auditor">Auditor</option>
            <option value="auditado">Auditado</option>
          </select>
        </div>
        <div className="form-group">
          <label>Nombre completo:</label>
          <input type="text" name="Nombre" value={formData.Nombre} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Puesto:</label>
          <input type="text" name="Puesto" value={formData.Puesto} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Correo:</label>
          <input type="email" name="Correo" value={formData.Correo} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="Contraseña"
            value={formData.Contraseña}
            onChange={handleChange}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div className="form-group">
          <label>Confirmar contraseña:</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="ConfirmarContraseña"
            value={formData.ConfirmarContraseña}
            onChange={handleChange}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div className="form-group">
          <label>Área:</label>
          <select name="Área" value={formData.Área} onChange={handleChange} required>
            <option value="">Seleccione un área</option>
            {predefinedAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
            <option value="custom">Otra</option>
          </select>
          {formData.Área === 'custom' && (
            <input
              type="text"
              name="customArea"
              value={formData.customArea}
              onChange={handleChange}
              placeholder="Ingrese un área personalizada"
              required
            />
          )}
        </div>
        {renderAdditionalFields()}
        <div className="modal-buttons">
          <button type="button" onClick={handleClose} className="btn-cancelar">Cancelar</button>
          <button type="submit" className="btn-registrar">Registrar</button>
        </div>
      </form>
    </Modal>
  );
};

export default RegistroUsuarioModal;