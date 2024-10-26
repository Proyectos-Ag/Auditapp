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
        const arrayBuffer = reader.result;
        const blob = new Blob([arrayBuffer], { type: file.type });
        
        setHayFoto(true);
        onCapture(blob); // Envía el BLOB capturado
      };
      reader.readAsArrayBuffer(file);  // Lee el archivo como ArrayBuffer
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