import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/modal.css';

const Modal = ({ handleClose, show, children }) => {
  const showHideClassName = show ? "modal display-block" : "modal display-none";

  return (
    <div className={showHideClassName}>
      <section className="modal-main">
        {children}
        <button className="modal-close" onClick={handleClose}>×</button>
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
    Escolaridad: 'TSU',
    Carrera: '',
    TipoUsuario: 'auditor',
    AñosExperiencia: '',
    Departamento: '',
    area: '',
    customDepartamento: ''
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/areas`);
        setAreas(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener las áreas", error);
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset error message when user starts typing after an error
    if (error) setError('');
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*\d)[A-Za-z\d]{8}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { Contraseña, ConfirmarContraseña, customDepartamento, Departamento } = formData;

    if (!validatePassword(Contraseña)) {
      setError('La contraseña debe tener exactamente 8 caracteres y al menos un número.');
      return;
    }

    if (Contraseña !== ConfirmarContraseña) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setLoading(true);

    const data = { ...formData };
    if (Departamento === 'otro') {
      data.Departamento = customDepartamento;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/usuarios`, data);
      
      setFormData({
        Nombre: '',
        Correo: '',
        Contraseña: '',
        ConfirmarContraseña: '',
        Puesto: '',
        FechaIngreso: '',
        Escolaridad: 'TSU',
        Carrera: '',
        TipoUsuario: 'auditor',
        AñosExperiencia: '',
        Departamento: '',
        area: '',
        customDepartamento: ''
      });

      setLoading(false);
      handleClose();
      
      // Show success notification
      const successNotification = document.createElement('div');
      successNotification.className = 'success-notification';
      successNotification.textContent = 'Usuario registrado con éxito';
      document.body.appendChild(successNotification);
      
      setTimeout(() => {
        document.body.removeChild(successNotification);
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError('El correo electrónico ya está registrado en el sistema.');
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

  const renderCustomDepartamento = () => {
    if (formData.Departamento === 'otro') {
      return (
        <div className="form-group">
          <label>Especificar departamento:</label>
          <input
            type="text"
            name="customDepartamento"
            value={formData.customDepartamento}
            onChange={handleChange}
            required
          />
        </div>
      );
    }
    return null;
  };

  return (
    <Modal show={show} handleClose={handleClose}>
      <form onSubmit={handleSubmit} className="registro-form">
        <h2>Registro de usuario</h2>
        {error && <p className="error-message">{error}</p>}
        
        <div className="form-group">
          <label>Tipo de usuario</label>
          <select name="TipoUsuario" value={formData.TipoUsuario} onChange={handleChange}>
            <option value="auditor">Auditor</option>
            <option value="auditado">Auditado</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Nombre completo</label>
          <input 
            type="text" 
            name="Nombre" 
            value={formData.Nombre} 
            onChange={handleChange} 
            placeholder="Ingrese nombre completo"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Puesto</label>
          <input 
            type="text" 
            name="Puesto" 
            value={formData.Puesto} 
            onChange={handleChange} 
            placeholder="Ingrese puesto actual"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Correo electrónico</label>
          <input 
            type="email" 
            name="Correo" 
            value={formData.Correo} 
            onChange={handleChange} 
            placeholder="correo@ejemplo.com"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="Contraseña"
            value={formData.Contraseña}
            onChange={handleChange}
            placeholder="8 caracteres, al menos 1 número"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        <div className="form-group">
          <label>Confirmar contraseña</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="ConfirmarContraseña"
            value={formData.ConfirmarContraseña}
            onChange={handleChange}
            placeholder="Repita su contraseña"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        <div className="form-group">
          <label>Departamento</label>
          <select 
            name="Departamento" 
            value={formData.Departamento} 
            onChange={handleChange} 
            required
          >
            <option value="">Seleccione un departamento</option>
            {areas.length > 0 ? (
              areas.map(area => (
                <option key={area.departamento} value={area.departamento}>
                  {area.departamento}
                </option>
              ))
            ) : (
              <option value="" disabled>Cargando departamentos...</option>
            )}
            <option value="otro">Otro departamento</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Área</label>
          <input 
            type="text" 
            name="area" 
            value={formData.area} 
            onChange={handleChange} 
            placeholder="Especifique el área"
            required 
          />
        </div>
        
        {renderCustomDepartamento()}
        {renderAdditionalFields()}
        
        <div className="modal-buttons">
          <button type="button" onClick={handleClose} className="btn-cancelar">
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-registrar"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RegistroUsuarioModal;