import React, { useState } from 'react';
import axios from 'axios';
import './css/Area.css';
import Navigation from "../Navigation/Navbar";

const Area = () => {
  const [formData, setFormData] = useState({
    NombreArea: '',
    Descripcion: '',
    Ubicacion: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/areas`, formData);
      alert("Guardado con éxito");
      console.log(response.data);

      // Limpiar los campos del formulario después de agregar un área exitosamente
      setFormData({
        NombreArea: '',
        Descripcion: '',
        Ubicacion: ''
      });
    } catch (error) {
      console.error(error);
      alert("Error al guardar los datos");
    }
  };

  return (
    <div className="registro-container">
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
      <form onSubmit={handleSubmit}>
        <h2>Agregar área:</h2>
        <div className="form-group">
          <label>Nombre del área:</label>
          <input 
            type="text" 
            name="NombreArea" 
            value={formData.NombreArea} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Descripción:</label>
          <input 
            type="text" 
            name="Descripcion" 
            value={formData.Descripcion} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Ubicación:</label>
          <input 
            type="text" 
            name="Ubicacion" 
            value={formData.Ubicacion} 
            onChange={handleChange} 
            required 
          />
        </div>
        <button type="submit" className="btn-registrar">Generar</button>
      </form>
    </div>
  );
};

export default Area;