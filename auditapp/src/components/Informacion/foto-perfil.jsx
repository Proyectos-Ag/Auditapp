import { useEffect, useRef, useState } from 'react';

function FotoPerfil({ open, onClose, onCapture }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  // Función que maneja la selección del archivo
  const handleSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Crear URL temporal para la vista previa
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      // Enviar el archivo al componente padre
      onCapture(file);
    }
  };

  // Cuando se abre el modal, se simula el clic en el input para abrir el selector de archivos
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.click();
    } else {
      setPreviewUrl(null); // Limpiar la vista previa al cerrar
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={`modal ${open ? 'open' : 'closed'}`}>
      <div className="fixed-modal">
        <div className="perfil-container">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleSelect}
            style={{ display: 'none' }}
          />

          <h1 style={{ textAlign: 'center', color: '#fff' }}>
            Selecciona una imagen desde tu dispositivo
          </h1>

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

          <button className="salir-button" onClick={onClose}>
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FotoPerfil;