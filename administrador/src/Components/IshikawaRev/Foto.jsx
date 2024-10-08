import { useEffect, useRef, useState } from 'react';
import './css/Camara.css';

function Fotos({ open, onClose, onCapture }) {
  const [hayFoto, setHayFoto] = useState(false);
  const inputRef = useRef(null);  

  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result; 

        // Generar un identificador único para cada imagen
        const imageId = `capturedImage_${new Date().getTime()}`;

        // Almacenar cada imagen con una clave única
        localStorage.setItem(imageId, imageData);

        setHayFoto(true);
        onCapture(imageData); 
      };
      reader.readAsDataURL(file);  
    }
  };

  // Limpiar el localStorage cuando la página se refresque o cierre
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Recorre todas las claves en el localStorage
      Object.keys(localStorage).forEach((key) => {
        // Elimina solo las claves que empiezan con 'capturedImage_'
        if (key.startsWith('capturedImage_')) {
          localStorage.removeItem(key);
        }
      });
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  

  useEffect(() => {
    if (open) {
      inputRef.current.click();  
    }
  }, [open]);

  const cerrarFoto = () => {
    setHayFoto(false);
  };

  if (!open) return null;

  return (
    <div className={`modal ${open ? 'open' : 'closed'}`}>
      <div className="fixed-modal">
        <div className="camera-container">
          <input
            ref={inputRef}  
            type="file"
            accept="image/*"
            capture="environment" 
            onChange={handleCapture}
            style={{ display: 'none' }} 
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
