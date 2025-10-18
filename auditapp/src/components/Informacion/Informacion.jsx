import React, { useContext, useState } from 'react';
import api from '../../services/api';
import './css/Info.css';
import { UserContext } from '../../App';
import Swal from 'sweetalert2';
import FotoPerfil from './foto-perfil.jsx'; 
import { storage } from '../../firebase.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const Informacion = () => {
  const { userData } = useContext(UserContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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

    const _id = userData.ID;

    try {
      await api.put(
        `/usuarios/cambiarPassword/${_id}`,
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

  const uploadImageToFirebase = async (file, fileName) => {
    try {
      if (!(file instanceof File)) {
        throw new Error("El objeto recibido no es un archivo válido");
      }

      const storageRef = ref(storage, `perfil-usuarios/${fileName}`);
      await uploadBytes(storageRef, file); // Sube el archivo al almacenamiento
      return await getDownloadURL(storageRef); // Obtiene la URL del archivo subido
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      throw new Error("No se pudo subir la imagen");
    }
  };

  const handleFirebaseImageUpload = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'Por favor, seleccione un archivo de imagen.',
      });
      return;
    }
    
    const _id = userData.ID;
    console.log("ID: ", userData.ID);
    try {
      // Si existe una imagen anterior en Firebase, se intenta eliminar
      if (userData.Foto) {
        try {
          // Se crea una referencia a la imagen anterior utilizando la URL almacenada
          const oldImageRef = ref(storage, userData.Foto);
          await deleteObject(oldImageRef);
          console.log("Imagen antigua eliminada correctamente.");
        } catch (error) {
          console.error("Error al eliminar la imagen anterior:", error);
          // Aquí podrías decidir si abortar o continuar, según tu lógica
        }
      }
      
      // Genera un nombre único para el archivo (por ejemplo, combinando el id del usuario y la fecha actual)
      const fileName = `${_id}_${Date.now()}`;
      
      // Sube la imagen a Firebase y obtiene la URL
      const imageUrl = await uploadImageToFirebase(selectedFile, fileName);
      
      // Envía la URL al backend para actualizar el campo Foto del usuario
      await api.put(
        `/usuarios/actualizarFoto/${_id}`,
        { url: imageUrl },
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Foto de perfil actualizada exitosamente',
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al subir la foto de perfil',
      });
    }
  };

  return (
    <div className="info-container">
      <div className="content-inf">
        <h1 className="inf-usuario">Información del Usuario</h1>
        
        <div className="profile-picture-section">
          <h2>Foto de Perfil</h2>
          {previewImage ? (
            <img src={previewImage} alt="Vista previa" className="profile-picture" />
          ) : userData.Foto ? (
            <img src={userData.Foto} alt="Foto de Perfil" className="profile-picture" />
          ) : (
            <div className="profile-picture-placeholder">No hay imagen</div>
          )}
          <button onClick={() => setModalOpen(true)} className="upload-button">
            Cambiar Foto
          </button>
          {selectedFile && (
            <button onClick={handleFirebaseImageUpload} className="upload-button">
              Subir Foto
            </button>
          )}
        </div>

        <div className="user-details">
          <p><strong>Nombre:</strong> {userData.Nombre}</p>
          <p><strong>Email:</strong> {userData.Correo}</p>
          <p><strong>Tipo de Usuario:</strong> {tipo}</p>
          <p><strong>Puesto:</strong> {userData.Puesto}</p>
          <p><strong>Departamento:</strong> {userData.Departamento}</p>
        </div>

        <h2 className="inf-usuario">Cambiar Contraseña</h2>
        <div className="inf-contra">
          <input 
            className="input-inf"
            type="password" 
            placeholder="Nueva Contraseña" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            maxLength="8"
          />
          <input 
            className="input-inf"
            type="password" 
            placeholder="Confirmar Nueva Contraseña" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            maxLength="8"
          />
        </div>
        <div className="inf-contra">
          <button onClick={handlePasswordChange} className="change-password-button">
            Cambiar Contraseña
          </button>
        </div>
      </div>

      {/* Modal para seleccionar foto desde el almacenamiento */}
      <FotoPerfil 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onCapture={(file) => {
          setSelectedFile(file);
          setPreviewImage(URL.createObjectURL(file));
          setModalOpen(false);
        }} 
      />
    </div>
  );
};

export default Informacion;