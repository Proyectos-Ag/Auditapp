import { useState } from 'react';
import './css/Camara.css';

function Fotos({ open, onClose, onCapture }) {
  const [hayFoto, setHayFoto] = useState(false);

  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        let base64String = reader.result;  // Aquí el prefijo ya está incluido

        // Verifica si el prefijo ya está en base64String (png, jpeg, etc.)
        const prefijosBase64 = ['data:image/png;base64,', 'data:image/jpeg;base64,'];

        // Solo añade el prefijo si no empieza con uno de los prefijos conocidos
        if (!prefijosBase64.some(prefijo => base64String.startsWith(prefijo))) {
          base64String = `data:image/png;base64,${base64String}`;  // Agrega el prefijo en caso de ser necesario
        }

        setHayFoto(true);
        onCapture(base64String); // Envía la imagen capturada en formato base64 con el prefijo adecuado
      };
      reader.readAsDataURL(file);  // Esto ya incluye 'data:image/png;base64,' o 'data:image/jpeg;base64,'
    }
  };

  const cerrarFoto = () => {
    setHayFoto(false);
  };

  if (!open) return null;

  return (
    <div className={`modal ${open ? 'open' : 'closed'}`}>
      <div className="fixed-modal">
        <div className="camera-container">
          <input
            type="file"
            accept="image/*"
            capture="environment" // "environment" para cámara trasera, "user" para la frontal
            onChange={handleCapture}
            style={{ display: 'none' }} // Oculta el input
            id="cameraInput"
          />
          <label htmlFor="cameraInput" className="camera-button">
            <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>photo_camera</span>
          </label>

          {hayFoto && (
            <div className="preview-container">
              <button className="close-photo-button" onClick={cerrarFoto}>
                <span className="material-symbols-outlined">close</span> Cerrar Foto
              </button>
            </div>
          )}

          <button className="camera-button-salir" onClick={onClose}>
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Fotos;