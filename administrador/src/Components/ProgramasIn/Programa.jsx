import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import './css/Programa.css';
import Navigation from "../Navigation/Navbar";
import Swal from "sweetalert2";

const Programas = () => {
  const [nombre, setNombre] = useState("");
  const [requisitos, setRequisitos] = useState([""]);
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [programas, setProgramas] = useState([]);
  const [visibleProgramas, setVisibleProgramas] = useState({});
  const fileInputRef = useRef(null);

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
      fetchProgramas(); // Actualizar la lista de programas después de crear uno nuevo
    } catch (error) {
      console.error('Error al crear el programa:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Hubo un error al guardar el programa. Por favor, inténtalo de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/programas/carga-masiva`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.duplicados && response.data.duplicados.length > 0) {
        Swal.fire({
          title: 'Advertencia',
          text: `Algunos programas ya existen y no fueron añadidos: ${response.data.duplicados.join(', ')}`,
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
      } else {
        Swal.fire({
          title: 'Éxito',
          text: 'Archivo cargado con éxito',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
      console.log('Respuesta de carga masiva:', response.data);
      fetchProgramas(); // Actualizar la lista de programas después de la carga masiva
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Hubo un error al cargar el archivo. Por favor, inténtalo de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      fileInputRef.current.files = e.dataTransfer.files;
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const fetchProgramas = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/programas`);
      setProgramas(response.data);
      // Inicializar la visibilidad de los programas
      const initialVisibility = response.data.reduce((acc, programa) => {
        acc[programa._id] = false;
        return acc;
      }, {});
      setVisibleProgramas(initialVisibility);
    } catch (error) {
      console.error('Error al obtener los programas:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al obtener los programas. Por favor, inténtalo de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  useEffect(() => {
    fetchProgramas();
  }, []);

  const toggleVisibility = (id) => {
    setVisibleProgramas((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  return (
    <div>
    <div className="centrado-pro">
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
      <div className="programas-container-ext">
        <div className="programas-container">
          <h1>Programas</h1>
          <div className="align-right">
            <button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Ocultar" : "Agregar"}
            </button>
          </div>
          {showForm && (
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
          )}
          <h2>Cargar archivo</h2>
          <form onSubmit={handleFileUpload} onDragOver={handleDragOver} onDrop={handleDrop}>
            <div className="file-drag-drop" onClick={handleClick}>
              {file ? file.name : "Arrastra y suelta el archivo aquí, o haz clic para seleccionar"}
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              onChange={handleFileChange} 
              accept=".xlsx" 
              style={{ display: 'none' }} 
              required 
            />
            <button type="submit">Cargar</button>
          </form>
          </div>
          </div>
         
          <div className="datos-container-prog-2">
          <h2 className="list-programa">Lista de Programas</h2>
          {programas.length > 0 ? (
            programas.sort((a, b) => a.Nombre.localeCompare(b.Nombre)).map((programa) => (
              <div key={programa._id}>
                <div className="header-container-datos-prog">
                  <button onClick={() => toggleVisibility(programa._id)}>
                    {visibleProgramas[programa._id]} {programa.Nombre}
                  </button>
                </div>
                <div className="tabla-programa">
                {visibleProgramas[programa._id] && (
                  <table>
                    <thead>
                      <tr>
                        <th colSpan="2">{programa.Nombre}</th>
                      </tr>
                      <tr>
                        <th>ID</th>
                        <th>Requisitos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programa.Descripcion.map((desc, idx) => (
                        <tr key={idx}>
                          <td>{desc.ID}</td>
                          <td>{desc.Requisito}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                </div>
              </div>
            ))
          ) : (
            <p>No hay programas disponibles.</p>
          )}
          </div>
        </div>
    </div>
  );
};

export default Programas;