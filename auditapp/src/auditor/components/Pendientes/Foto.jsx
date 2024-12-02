import { useEffect, useRef, useState } from 'react';
import './css/Camara.css';

function Fotos({ open, onClose, onCapture }) {
  const [previewUrl, setPreviewUrl] = useState(null); // URL para vista previa
  const inputRef = useRef(null); // Referencia al input de archivo

  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Generar URL temporal para vista previa
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Pasar el archivo directamente al padre
      onCapture(file);
    }
  };

  useEffect(() => {
    if (open) {
      inputRef.current.click(); // Simula clic en el input al abrir
    } else {
      setPreviewUrl(null); // Limpiar vista previa al cerrar
    }
  }, [open]);

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
          />

          <h1 style={{ textAlign: 'center', color: '#fff' }}>Accediendo a la cámara</h1>

          {previewUrl && (
            <div className="preview-container">
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
              <button
                className="close-photo-button"
                onClick={() => setPreviewUrl(null)}
              >
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