import React, { useState } from "react";
import axios from "axios";
import './css/Programa.css';
import Navigation from "../Navigation/Navbar";

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
      alert("Guardado con éxito");
      console.log('Programa creado:', response.data);
      setNombre('');
      setRequisitos([""]);
    } catch (error) {
      console.error('Error al crear el programa:', error);
    }
  };

  return (
    <div>
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
            <button type="button" onClick={() => handleRemoveRequisito(index)}>Cancelar</button>
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