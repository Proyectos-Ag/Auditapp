import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Datos.css';
import Navigation from "../Navigation/Navbar";
import logo from "../../assets/img/logoAguida.png";

const Datos = () => {
  const [formData, setFormData] = useState({
    TipoAuditoria: '',
    Duracion: '',
    FechaInicio: '',
    FechaFin: '',
    AreasAudi: '',
    Auditados: '',
    AuditorLider: '',
    EquipoAuditor: [],
    Observador: false,
    NombresObservadores: '',
    Programa: [],
    Estado: '',
    Observaciones: ''
  });

  const [formStep, setFormStep] = useState(1);
  const [areas, setAreas] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showOtherAreaInput, setShowOtherAreaInput] = useState(false);
  const [auditorLiderSeleccionado, setAuditorLiderSeleccionado] = useState('');
  const [equipoAuditorDisabled, setEquipoAuditorDisabled] = useState(false);
  

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/areas`);
        setAreas(response.data);
      } catch (error) {
        console.error("Error al obtener las áreas", error);
      }
    };

    fetchAreas();
  }, []);

  useEffect(() => {
    const fetchProgramas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/programas`);
        setProgramas(response.data);
      } catch (error) {
        console.error("Error al obtener los programas", error);
      }
    };

    fetchProgramas();
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
        setUsuarios(response.data);
      } catch (error) {
        console.error("Error al obtener los usuarios", error);
      }
    };
  
    fetchUsuarios();
  }, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };
  
    if (type === 'checkbox') {
      if (name === 'Observador' && !checked) {
        newFormData = {
          ...newFormData,
          NombresObservadores: ''
        };
      }
    } else {
      if (name === 'AuditorLider') {
        setAuditorLiderSeleccionado(value);
      } else if (name === 'EquipoAuditor') {
        if (value === 'No aplica') {
          newFormData = {
            ...newFormData,
            EquipoAuditor: []
          };
          setEquipoAuditorDisabled(true);
        } else {
          setEquipoAuditorDisabled(false);
          newFormData = {
            ...newFormData,
            EquipoAuditor: newFormData.EquipoAuditor.includes(value)
              ? newFormData.EquipoAuditor.filter(e => e !== value)
              : [...newFormData.EquipoAuditor, value]
          };
        }
      }
    }
  
    if (name === 'FechaInicio' || name === 'FechaFin') {
      const { FechaInicio, FechaFin } = newFormData;
      if (FechaInicio && FechaFin) {
        const inicio = new Date(FechaInicio + 'T00:00:00');
        const fin = new Date(FechaFin + 'T00:00:00');
        if (inicio <= fin) {
          const inicioMes = inicio.toLocaleString('es-ES', { month: 'long' });
          const finMes = fin.toLocaleString('es-ES', { month: 'long' });
          if (inicioMes === finMes) {
            newFormData.Duracion = `del ${inicio.getDate()} al ${fin.getDate()} de ${inicioMes} ${inicio.getFullYear()}`;
          } else {
            newFormData.Duracion = `del ${inicio.getDate()} de ${inicioMes} al ${fin.getDate()} de ${finMes} ${inicio.getFullYear()}`;
          }
        } else {
          alert("La fecha de fin debe ser mayor o igual a la fecha de inicio.");
          // Restaurar los valores anteriores de las fechas
          newFormData[name] = formData[name];
        }
      }
    }
  
    if (name === 'AreasAudi' && value === 'Otro') {
      setShowOtherAreaInput(true);
      newFormData.AreasAudi = '';
    } else if (name === 'AreasAudi' && showOtherAreaInput) {
      setShowOtherAreaInput(false);
    }
  
    setFormData(newFormData);
  };
  
  

  const handleAreaChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePrevious = () => {
    setFormStep(prevStep => prevStep - 1);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (showOtherAreaInput) {
    }
    setFormStep(prevStep => prevStep + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const defaultEstado = "pendiente";
      const defaultObservaciones = "";

      const formDataWithDefaults = {
        ...formData,
        Estado: defaultEstado,
        Observaciones: defaultObservaciones
      };
  
      if (formData.Programa.length === 0) {
        alert("Por favor, seleccione al menos un programa.");
        return; // Detener el envío del formulario si no se ha seleccionado ningún programa
      }
  
      if (showOtherAreaInput) {
        const newArea = { NombreArea: formData.AreasAudi };
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/areas`, newArea);
        alert("Nueva área agregada con éxito");
        const addedArea = response.data;
  
        setAreas(prevAreas => [...prevAreas, addedArea]); // Update the areas list with the new area
  
        setFormData({
          ...formData,
          AreasAudi: addedArea._id // Update AreasAudi with the new area's ID
        });
  
        setShowOtherAreaInput(false);
      }
  
      console.log('Datos a enviar:', formDataWithDefaults);
  
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/datos`, formDataWithDefaults);
      alert("Guardado con éxito");
      console.log(response.data);
  
      // Limpiar los campos del formulario después de agregar un usuario exitosamente
      setFormData({
        TipoAuditoria: '',
        Duracion: '',
        AreasAudi: '',
        Auditados: '',
        AuditorLider: '',
        EquipoAuditor: '',
        Observador: false,
        NombresObservadores: '',
        Programa: []
      });
      setFormStep(1);
      window.location.reload();
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      alert("Error al guardar los datos");
    }
  };
  
  const handleEquipChange = (e) => {
    const { value } = e.target;
    if (value === "No aplica") {
      setEquipoAuditorDisabled(true);
      setFormData({
        ...formData,
        EquipoAuditor: []
      });
    } else {
      setEquipoAuditorDisabled(false);
      if (!equipoAuditorDisabled) {
        if (value && !formData.EquipoAuditor.includes(value)) {
          setFormData({
            ...formData,
            EquipoAuditor: [...formData.EquipoAuditor, value]
          });
  }
      }
    }
  };
  
  const handleCancel = () => {
    setEquipoAuditorDisabled(false);
    setFormData({
      ...formData,
      EquipoAuditor: []
    });
  };

  const handleEquipRemove = (equip) => {
    setFormData({
      ...formData,
      EquipoAuditor: formData.EquipoAuditor.filter(e => e !== equip)
    });
  };

  const handleProgramChange = async (e) => {
    const { value } = e.target;
    const selectedProgram = programas.find(programa => programa.Nombre === value);
  
    if (selectedProgram) {
      // Modificar el objeto seleccionado para que tenga la estructura esperada por el esquema
      const formattedProgram = {
        Nombre: selectedProgram.Nombre,
        Descripcion: selectedProgram.Descripcion.map(desc => ({
          Programas: desc,
          Observacion: desc.Observacion || 'Ninguna',
          Hallazgo: desc.Hallazgo || 'Ninguno'
        }))
      };
  
      setFormData(prevFormData => ({
        ...prevFormData,
        Programa: [
          ...prevFormData.Programa,
          formattedProgram
        ]
      }));
    }
  };
  
  const handleProgramRemove = (program) => {
    setFormData({
      ...formData,
      Programa: formData.Programa.filter(p => p !== program)
    });
  };

  return (
    <div>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
      {formStep === 1 && (
        <div className="registro-container">
        <form onSubmit={handleNext}>
          <h2>Datos generales</h2> 
          <div className="registro-form">
          <div className="form-group" >
            <label>Tipo de auditoria:</label>
            <select name="TipoAuditoria" value={formData.TipoAuditoria} onChange={handleChange} required>
              <option value="">Seleccione...</option>
              <option value="Interna">Interna</option>
              <option value="Externa">Externa</option>
              <option value="FSSC 22000">FSSC 22000</option>
              <option value="Responsabilidad social">Responsabilidad social</option>
              <option value="Inspección de autoridades">Inspección de autoridades</option>
            </select>
          </div>
          <div className="form-dates">
              <div className="form-group">
                <label>Fecha de inicio:</label>
                <input type="date" name="FechaInicio" value={formData.FechaInicio} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Fecha de fin:</label>
                <input type="date" name="FechaFin" value={formData.FechaFin} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Duración de la auditoria:</label>
              <input type="text" name="Duracion" value={formData.Duracion} onChange={handleChange} required/>
            </div>
          
          <div className="form-group">
            <label>Áreas auditadas:</label>
            {showOtherAreaInput ? (
              <div>
                <input
                  type="text"
                  name="AreasAudi"
                  value={formData.AreasAudi}
                  onChange={handleAreaChange}
                  placeholder="Escribe el nombre del área"
                  required
                />
                <button type="button" onClick={() => setShowOtherAreaInput(false)}>Cancelar</button>
              </div>
            ) : (
              <select name="AreasAudi" value={formData.AreasAudi} onChange={handleChange} required>
  <option value="">Seleccione...</option>
  {areas.map(area => (
    <option key={area._id} value={area.NombreArea}>{area.NombreArea}</option>
  ))}
  <option value="Otro">Otra...</option>
</select>
            )}
          </div>
          <div className="form-group">
            <label>Auditados:</label>
            <select name="Auditados" value={formData.Auditados} onChange={handleChange} required>
              <option value="">Seleccione...</option>
              {usuarios && usuarios.filter(usuario => usuario.TipoUsuario === 'auditado').map(usuario =>(
                <option key={usuario._id} value={usuario.Nombre}>{usuario.Nombre}</option>
              ))}
            </select>
          </div>
          </div>
          <div className="header-container2">
          <div className="button-group">
          <button type="submit" className="btn-registrar">Siguiente</button>
          </div>
          </div>
        </form>
        </div>
      )}

{formStep === 2 && (
  <div className="registro-container">
    <form onSubmit={handleNext}>
      <h2>Datos del Auditor:</h2>
      <div className="registro-form">
      <div className="form-group">
        <label>Auditor Líder:</label>
        <select name="AuditorLider" value={formData.AuditorLider} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {usuarios && usuarios.filter(usuario => usuario.TipoUsuario === 'auditor').map(usuario => (
            <option key={usuario._id} value={usuario.Nombre}>{usuario.Nombre}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Equipo Auditor:</label>
        <select name="Equipo Auditor" value="" onChange={handleEquipChange} disabled={equipoAuditorDisabled}>
          <option value="">Seleccione...</option>
          <option value="No aplica">No aplica</option>
          {usuarios && usuarios.filter(usuario => usuario.TipoUsuario === 'auditor' && usuario.Nombre !== auditorLiderSeleccionado).map(usuario => (
            <option key={usuario._id} value={usuario.Nombre}>{usuario.Nombre}</option>
          ))}
        </select>
      </div>
      <div className="selected-programs">
        {formData.EquipoAuditor.map((equip, index) => (
          <div key={index} className="selected-program">
            {equip}
            <button type="button" onClick={() => handleEquipRemove(equip)}>X</button>
          </div>
        ))}
      </div>
      {equipoAuditorDisabled && (
        <div className="form-group">
          <button type="button" onClick={handleCancel}>Cancelar</button>
        </div>
      )}
      <div className="form-group">
        <label>
          Observador
          <input type="checkbox" name="Observador" checked={formData.Observador} onChange={handleChange} />
        </label>
      </div>
      {formData.Observador && (
        <div className="form-group">
          <label>Nombre(s) observador(es):</label>
          <input type="text" name="NombresObservadores" value={formData.NombresObservadores} onChange={handleChange} />
        </div>
      )}
      </div>
      <div className="header-container2">
      <div className="button-group">
      <button type="button" className="btn-registrar" onClick={handlePrevious}>Regresar</button>
      <button type="submit" className="btn-registrar">Siguiente</button>
      </div>
      </div>
    </form>
  </div>
)}

{formStep === 3 && (
  <div className="registro-container">
    <form onSubmit={handleNext}>
      <h2>Programas:</h2>
      <div className="form-group">
        <label>Programa:</label>
        <select name="Programa" value="" onChange={handleProgramChange}>
          <option value="">Seleccione...</option>
          {programas
            .filter(programa => !formData.Programa.some(selected => selected.Nombre === programa.Nombre))
            .map(programa => (
              <option key={programa._id} value={programa.Nombre}>{programa.Nombre}</option>
            ))}
        </select>
      </div>
      <div className="selected-programs">
        {formData.Programa.map((program, index) => (
          <div key={index} className="selected-program">
            <p>{program.Nombre}</p>
            <button type="button" onClick={() => handleProgramRemove(program)}>X</button>
          </div>
        ))}
      </div>
      <div className="header-container2">
        <div className="button-group">
          <button type="button" className="btn-registrar" onClick={handlePrevious}>Regresar</button>
          <button type="submit" className="btn-registrar" disabled={formData.Programa.length === 0}>Siguiente</button>
        </div>
      </div>
    </form>
  </div>
)}

{formStep === 4 && (
  <div className="registro-container2">
    <form onSubmit={handleSubmit}>
      <div className="header-container">
        <img src={logo} alt="Logo Empresa" className="logo-empresa" />
        <div className="button-group">
          <button type="button" className="btn-registrar" onClick={handlePrevious}>Regresar</button>
          <button type="submit" className="btn-registrar">Generar</button>
        </div>
      </div>
      <div className="form-group">
        {formData.Programa.map((program, index) => (
          <div key={index}>
            <table key={index}>
              <thead>
                <tr>
                  <th colSpan="1">{program.Nombre}</th>
                  <th colSpan="4" className="conformity-header">Conformidad</th> 
                  <th colSpan="3"></th>
                </tr>
                <tr>
                  <th>Requisitos</th>
                  <th>Conforme</th>
                  <th>m</th>
                  <th>M</th>
                  <th>C</th>
                  <th>NA</th>
                  <th>Hallazgos/Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {program.Descripcion.map((desc, idx) => (
                  <tr key={idx}>
                    <td>{desc.Programas}</td>
                    <td><input type="checkbox" name={`Conforme_${index}`} /></td>
                    <td><input type="checkbox" name={`m_${index}`} /></td>
                    <td><input type="checkbox" name={`M_${index}`} /></td>
                    <td><input type="checkbox" name={`C_${index}`} /></td>
                    <td><input type="checkbox" name={`NA_${index}`} /></td>
                    <td><input type="text" name={`Observaciones_${index}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </form>
  </div>
)}


    </div>
  );
};

export default Datos;