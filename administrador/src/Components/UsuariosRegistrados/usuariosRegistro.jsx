import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Navigation/Navbar';
import './css/usuarios.css';
import './css/editForm.css';
import { format } from 'date-fns';
import RegistroUsuarioModal from './RegistroUsuarioModal';
import CalificacionModal from './CalificacionModal';

const UsuariosRegistro = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Nombre: '',
    Correo: '',
    PromedioEvaluacion: '',
    Puesto: '',
    FechaIngreso: '',
    Escolaridad: '',
    AñosExperiencia: '',
    FormaParteEquipoInocuidad: false,
    calificaciones: [] // Inicializar como un array vacío
  });
  const [editFormError, setEditFormError] = useState('');
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState('');
  const [filtroInocuidad, setFiltroInocuidad] = useState('');
  const [filtroAprobado, setFiltroAprobado] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
        setUsers(response.data);
      } catch (error) {
        setError('Error al obtener los usuarios');
        console.error('Error al obtener los usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateYearsInCompany = (fechaIngreso) => {
    const ingresoDate = new Date(fechaIngreso);
    const currentDate = new Date();
    let yearsInCompany = currentDate.getFullYear() - ingresoDate.getFullYear();
    let monthsDifference = currentDate.getMonth() - ingresoDate.getMonth();

    if (monthsDifference < 0 || (monthsDifference === 0 && currentDate.getDate() < ingresoDate.getDate())) {
      yearsInCompany--;
    }

    return yearsInCompany;
  };

  const handleEditClick = (usuario) => {
    const formattedFechaIngreso = usuario.FechaIngreso ? new Date(usuario.FechaIngreso).toISOString().split('T')[0] : '';
    setUsuarioAEditar(usuario);
    setEditFormData({
      Nombre: usuario.Nombre,
      Correo: usuario.Correo,
      PromedioEvaluacion: usuario.PromedioEvaluacion,
      Puesto: usuario.Puesto || '',
      FechaIngreso: formattedFechaIngreso,
      Escolaridad: usuario.Escolaridad || '',
      AñosExperiencia: usuario.AñosExperiencia || '',
      FormaParteEquipoInocuidad: usuario.FormaParteEquipoInocuidad || false,
      calificaciones: usuario.calificaciones || []
    });
    setShowEditModal(true);
  };

  const handleAgregarCalificaciones = (usuario) => {
    setUsuarioAEditar(usuario);
    setShowCalificacionModal(true);
  };

  const handleGuardarCalificaciones = (calificaciones) => {
    if (!usuarioAEditar || !calificaciones || calificaciones.length === 0) {
      console.error("Usuario o calificaciones inválidas");
      return;
    }
  
    const updatedUser = {
      ...usuarioAEditar,
      calificaciones: [...usuarioAEditar.calificaciones, ...calificaciones]
    };
  
    axios.put(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${usuarioAEditar._id}`, updatedUser)
      .then(response => {
        setUsers(users.map(user => (user._id === usuarioAEditar._id ? response.data : user)));
        setUsuarioAEditar(null);
        setShowCalificacionModal(false);
      })
      .catch(error => {
        console.error('Error al actualizar las calificaciones:', error);
        // Manejar el error adecuadamente y proporcionar retroalimentación al usuario si es necesario
      });
  };
  

  const handleEditFormChange = (e, value) => {
    const { name } = e.target;
    const newValue = e.target.type === 'checkbox' ? value : e.target.value;
    setEditFormData({ ...editFormData, [name]: newValue });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const fechaIngresoDate = new Date(editFormData.FechaIngreso);
    const currentDate = new Date();

    if (fechaIngresoDate > currentDate) {
      setEditFormError('La fecha de ingreso no puede ser mayor a la fecha actual.');
      return;
    } else {
      setEditFormError('');
    }

    try {
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${usuarioAEditar._id}`, editFormData);
      setUsers(users.map(user => (user._id === usuarioAEditar._id ? response.data : user)));
      setShowEditModal(false);
      setUsuarioAEditar(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUsuarioAEditar(null);
    setEditFormData({});
    setEditFormError('');
  };

  const handleDeleteClick = async (userId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
    }
  };

  const handleDegradarClick = async (userId) => {
    try {
      const userToDegradar = users.find(user => user._id === userId);
      if (userToDegradar && userToDegradar.PromedioEvaluacion < 80) {
        const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${userId}`, { TipoUsuario: 'empleado' });
        setUsers(users.map(user => (user._id === userId ? response.data : user)));
        alert('Usuario degradado a empleado exitosamente');
      } else {
        alert('El usuario no puede ser degradado a empleado porque su promedio de evaluación es mayor o igual a 80');
      }
    } catch (error) {
      console.error('Error al degradar el usuario:', error);
    }
  };

  const handlePromocionarClick = async (userId) => {
    try {
      const userToPromote = users.find(user => user._id === userId);
      if (userToPromote && userToPromote.PromedioEvaluacion >= 80) {
        const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/usuarios/${userId}`, { TipoUsuario: 'auditor' });
        setUsers(users.map(user => (user._id === userId ? response.data : user)));
        alert('Usuario promovido a auditor exitosamente');
      } else {
        alert('El usuario no puede ser promovido a auditor porque su promedio de evaluación es menor o igual a 80');
      }
    } catch (error) {
      console.error('Error al promover el usuario:', error);
    }
  };

  
  const filteredUsers = users.filter(user => {
    return (
      (filtroTipoUsuario === '' || user.TipoUsuario === filtroTipoUsuario) &&
      (filtroInocuidad === '' || user.FormaParteEquipoInocuidad.toString() === filtroInocuidad) &&
      (filtroAprobado === '' || user.Aprobado.toString() === filtroAprobado)
    );
  });

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <Navbar />
      <div className="usuarios-container">
        <h1>Registro Y Visualización de Usuarios</h1>
        <button onClick={() => setShowRegistrationForm(true)}>Agregar Usuario</button>
        <div className="filters">
          <select value={filtroTipoUsuario} onChange={(e) => setFiltroTipoUsuario(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="auditado">Auditado</option>
            <option value="auditor">Auditor</option>
            <option value="Administrador">Administrador</option>
          </select>
          <select value={filtroInocuidad} onChange={(e) => setFiltroInocuidad(e.target.value)}>
            <option value="">Inocuidad</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          <select value={filtroAprobado} onChange={(e) => setFiltroAprobado(e.target.value)}>
            <option value="">Aprobado</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="card-grid">
          {filteredUsers.map(user => (
            <UserCard
              key={user._id}
              user={user}
              formatDate={formatDate}
              calculateYearsInCompany={calculateYearsInCompany}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              onDegradarClick={handleDegradarClick}
              onPromocionarClick={handlePromocionarClick}
              onAgregarCalificaciones={() => handleAgregarCalificaciones(user)}
            />
          ))}
        </div>
        <RegistroUsuarioModal
          show={showRegistrationForm}
          handleClose={() => setShowRegistrationForm(false)}
        />
         <CalificacionModal
          show={showCalificacionModal}
          handleClose={() => setShowCalificacionModal(false)}
          onSubmit={handleGuardarCalificaciones}
          usuario={usuarioAEditar}
        />
        {showEditModal && (
          <div className="modal">
            <div className="modal-content edit-modal-content">
              <span className="close" onClick={handleCloseEditModal}>&times;</span>
              <form onSubmit={handleEditSubmit} className="edit-form">
                <div className="form-group">
                  <label>Nombre:</label>
                  <input
                    type="text"
                    name="Nombre"
                    value={editFormData.Nombre}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Correo:</label>
                  <input
                    type="email"
                    name="Correo"
                    value={editFormData.Correo}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Puesto:</label>
                  <input
                    type="text"
                    name="Puesto"
                    value={editFormData.Puesto}
                    onChange={handleEditFormChange}
                  />
                </div>
                {(usuarioAEditar.TipoUsuario === 'auditor' || usuarioAEditar.TipoUsuario === 'Administrador' || usuarioAEditar.TipoUsuario === 'empleado') && (
                  <>
                    <div className="form-group">
                      <label>Fecha de Ingreso:</label>
                      <input
                        type="date"
                        name="FechaIngreso"
                        value={editFormData.FechaIngreso}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Promedio de Evaluación:</label>
                      <input
                        type="number"
                        name="PromedioEvaluacion"
                        value={editFormData.PromedioEvaluacion}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Escolaridad:</label>
                      <input
                        type="text"
                        name="Escolaridad"
                        value={editFormData.Escolaridad}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Años de Experiencia:</label>
                      <input
                        type="number"
                        name="AñosExperiencia"
                        value={editFormData.AñosExperiencia}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Puntuación Especialidad:</label>
                      <input
                        type="number"
                        name="PuntuacionEspecialidad"
                        value={editFormData.PuntuacionEspecialidad}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>¿Forma parte del equipo de Inocuidad?</label>
                      <input
                        type="checkbox"
                        name="FormaParteEquipoInocuidad"
                        checked={editFormData.FormaParteEquipoInocuidad}
                        onChange={(e) => handleEditFormChange(e, e.target.checked)}
                      />
                    </div>
                  </>
                )}

                {editFormError && <p className="error">{editFormError}</p>}
                <button type="submit" className="btn-guardar">Guardar Cambios</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserCard = ({ user, formatDate, calculateYearsInCompany, onEditClick, onDeleteClick, onDegradarClick, onPromocionarClick, onAgregarCalificaciones }) => {
  const [showCalificaciones, setShowCalificaciones] = useState(false);

  return (
    <div className="card">
      <h3>{user.Nombre}</h3>
      <p><strong>Correo:</strong> {user.Correo}</p>
      <p><strong>Tipo de usuario:</strong> {user.TipoUsuario}</p>
      <p><strong>Puesto:</strong> {user.Puesto}</p>
      {(user.TipoUsuario === 'auditor' || user.TipoUsuario === 'Administrador'|| user.TipoUsuario === 'empleado') && (
        <>
          {user.FechaIngreso && (
            <p><strong>Fecha de Ingreso:</strong> {user.FechaIngreso.substring(8, 10)}/{user.FechaIngreso.substring(5, 7)}/{user.FechaIngreso.substring(0, 4)}</p>
          )}
          <p><strong>Años en la Empresa:</strong> {calculateYearsInCompany(user.FechaIngreso)}</p>
          <p><strong>Escolaridad:</strong> {user.Escolaridad}</p>
          <p><strong>Años de Experiencia:</strong> {user.AñosExperiencia}</p>
          <p><strong>Puntuación Especialidad:</strong> {user.PuntuacionEspecialidad}</p>
          <p><strong>Forma Parte del Equipo de Inocuidad:</strong> {user.FormaParteEquipoInocuidad ? 'Sí' : 'No'}</p>
          <p><strong>Aprobado:</strong> {user.Aprobado ? 'Sí' : 'No'}</p>
          <p><strong>Promedio de Evaluación:</strong> {user.PromedioEvaluacion}</p>
          <button className="editar" onClick={() => onEditClick(user)}>Editar</button>
          <button onClick={() => onDeleteClick(user._id)}>Eliminar</button>
          <button onClick={onAgregarCalificaciones}>Agregar Calificaciones</button>

          {(user.TipoUsuario === 'empleado') && (
            <>
              {(user.PromedioEvaluacion >= 80) && <button onClick={() => onPromocionarClick(user._id)}>Promocionar</button>}
            </>
          )}

          {(user.TipoUsuario === 'auditor') && (
            <>
              {(user.PromedioEvaluacion <= 79 ) && <button onClick={() => onDegradarClick(user._id)}>Degradar</button>}
            </>
          )}

          <div className="accordion">
            <button onClick={() => setShowCalificaciones(!showCalificaciones)}>
              Ver Calificaciones
            </button>
            {showCalificaciones && (
              <div className="calificaciones">
                <h4>Calificaciones</h4>
                <ul>
                  {user.calificaciones.map((calificacion, index) => (
                    <li key={index}>
                      <p>
                        Curso: {calificacion.nombreCurso}, Calificación: {calificacion.calificacion}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
      {user.TipoUsuario === 'auditado' && (
        <div className="editar-eliminar">
          <button className="editar" onClick={() => onEditClick(user)}>Editar</button>
          <button onClick={() => onDeleteClick(user._id)}>Eliminar</button>
        </div>
      )}
    </div>
  );
};



export default UsuariosRegistro;