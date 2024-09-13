import { useEffect, useRef, useState } from 'react';
import './css/Camara.css';

function Fotos({ open, onClose, onCapture }) {
  const [hayFoto, setHayFoto] = useState(false);
  const inputRef = useRef(null);  // Referencia al input de archivo

  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        let base64String = reader.result;

        // Verifica si el prefijo ya está en base64String (png, jpeg, etc.)
        const prefijosBase64 = ['data:image/png;base64,', 'data:image/jpeg;base64,'];

        // Solo añade el prefijo si no empieza con uno de los prefijos conocidos
        if (!prefijosBase64.some(prefijo => base64String.startsWith(prefijo))) {
          base64String = `data:image/png;base64,${base64String}`;
        }

        setHayFoto(true);
        onCapture(base64String); // Envía la imagen capturada en formato base64 con el prefijo adecuado
      };
      reader.readAsDataURL(file);  // Esto ya incluye 'data:image/png;base64,' o 'data:image/jpeg;base64,'
    }
  };

  useEffect(() => {
    if (open) {
      inputRef.current.click();  // Dispara automáticamente el clic en el input de archivo
    }
  }, [open]);  // Se ejecuta cuando el modal se abre

  const cerrarFoto = () => {
    setHayFoto(false);
  };

  if (!open) return null;

  return (
    <div className={`modal ${open ? 'open' : 'closed'}`}>
      <div className="fixed-modal">
        <div className="camera-container">
          <input
            ref={inputRef}  // Asigna la referencia al input de archivo
            type="file"
            accept="image/*"
            capture="environment" // "environment" para cámara trasera, "user" para la frontal
            onChange={handleCapture}
            style={{ display: 'none' }} // Oculta el input
            id="cameraInput"
          />
          
          <h1 style={{ textAlign: 'center', color: '#fff' }}>Accediendo a la cámara</h1>

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