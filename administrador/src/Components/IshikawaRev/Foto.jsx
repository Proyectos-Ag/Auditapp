import { useState } from 'react';
import './css/Camara.css';

function Fotos({ open, onClose, onCapture }) {
  const [hayFoto, setHayFoto] = useState(false);

  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHayFoto(true);
        onCapture(reader.result); // Envía la imagen capturada en formato base64
      };
      reader.readAsDataURL(file);
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