import React, { useContext, useState } from 'react';
import axios from 'axios';
import './css/Info.css';
import { UserContext } from '../../App';
import Swal from 'sweetalert2';

const Informacion = () => {
  const { userData } = useContext(UserContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!userData) {
    return <div>No hay información disponible.</div>;
  }

  let tipo = userData.TipoUsuario;

  if (userData.TipoUsuario === 'auditado') {
    tipo = 'Auditado';
  }

  const validatePassword = (password) => {
    const exactLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return password.length === exactLength && hasUpperCase && hasNumber;
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'La contraseña debe tener 8 caracteres, incluir al menos una mayúscula y un número',
      });
      return;
    }

    let _id = userData.ID ? userData.ID : userData._id;

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/usuarios/cambiarPassword/${_id}`, 
        { password: newPassword },
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Contraseña actualizada exitosamente',
      });

      // Limpiar el formulario
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la contraseña',
      });
    }
  };

  return (
    <div>
      <div className='content-inf'>
        <h1 className='inf-usuario'>Información del Usuario</h1>
        <p>Nombre: {userData.Nombre}</p>
        <p>Email: {userData.Correo}</p>
        <p>Tipo de Usuario: {tipo}</p>
        <p>Puesto: {userData.Puesto}</p>
        <p>Departamento: {userData.Departamento}</p>
        
        <h2 className='inf-usuario'>Cambiar Contraseña</h2>
        <div className='inf-contra'>
          <input 
            className='input-inf'
            type="password" 
            placeholder="Nueva Contraseña" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            maxLength="8"
          />
          <input 
            className='input-inf'
            type="password" 
            placeholder="Confirmar Nueva Contraseña" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            maxLength="8"
          />
        </div>
        <div className='inf-contra'>
          <button onClick={handlePasswordChange}>Cambiar Contraseña</button>
        </div>
      </div>
    </div>
  );
};

export default Informacion;