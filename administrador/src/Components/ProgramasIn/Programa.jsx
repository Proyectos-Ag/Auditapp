import React, { useState } from "react";
import axios from "axios";
import './css/Programa.css';
import Navigation from "../Navigation/Navbar";
import Swal from "sweetalert2";

const Programas = () => {
  const [nombre, setNombre] = useState("");
  const [requisitos, setRequisitos] = useState([""]);

  const handleNombreChange = (e) => {
    setNombre(e.target.value);
  };

  const handleRequisitoChange = (index, value) => {
    const newRequisitos = [...requisitos];
    newRequisitos[index] = value;
    setRequisitos(newRequisitos);
  };

  const handleAddRequisito = () => {
    setRequisitos([...requisitos, ""]);
  };

  const handleRemoveRequisito = (index) => {
    const newRequisitos = requisitos.filter((_, i) => i !== index);
    setRequisitos(newRequisitos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/programas`, {
        Nombre: nombre,
        Descripcion: requisitos
      });
    Swal.fire({
      title: 'Programa registrado con éxito',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3ccc37'
    });
    console.log('Programa creado:', response.data);
    setNombre('');
    setRequisitos([""]);
  } catch (error) {
    console.error('Error al crear el programa:', error);
    Swal.fire({
      title: 'Error',
      text: 'Hubo un error al guardar el programa. Por favor, inténtalo de nuevo más tarde.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
};

  return (
    <div  className="centrado-pro">
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
      <div className="programas-container">
        <h1>Crear Programa</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Programa:</label>
            <input
              type="text"
              value={nombre}
              onChange={handleNombreChange}
              required
            />
          </div>
          {requisitos.map((requisito, index) => (
            <div key={index}>
              <label>Requisito {index + 1}:</label>
              <textarea
                value={requisito}
                onChange={(e) => handleRequisitoChange(index, e.target.value)}
                required
              />
              {index !== 0 && (
                <button type="button" onClick={() => handleRemoveRequisito(index)}>Cancelar</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddRequisito}>Agregar Requisito</button>
          <button type="submit">Crear Programa</button>
        </form>
      </div>
    </div>
  );
};

export default Programas;