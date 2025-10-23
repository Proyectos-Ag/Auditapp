import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { storage } from '../../firebase';
import { ref as storageRefFn, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const makeStoragePath = (folder, filename) =>
  `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}_${filename}`;

const FileUploader = forwardRef(function FileUploader(
  {
    accept = 'image/*,.pdf',
    label = 'Subir archivo o imagen',
    folder = 'files',
    maxSizeBytes = 10 * 1024 * 1024, // opcional
    onUploadComplete = null // callback opcional cuando una subida termine (recibe {url,name,type})
  },
  ref
) {
  const inputRef = useRef(null);

  // staged: archivos seleccionados pero NO subidos aún -> { file, preview }
  const [staged, setStaged] = useState([]);

  // uploaded: metadata de archivos ya subidos -> { url, name, type, storagePath }
  const [uploaded, setUploaded] = useState([]);

  // uploading flag / per-file progress (opcional futuro)
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      // liberar object URLs
      staged.forEach(s => s.preview && URL.revokeObjectURL(s.preview));
    };
  }, [staged]);

  // API expuesta al padre via ref
  useImperativeHandle(ref, () => ({
    // sube todos los staged files; retorna array de metadata subidas (las nuevas)
    uploadAll: async () => {
      if (staged.length === 0) return [];
      setUploading(true);
      try {
        // Subir en paralelo y esperar a todas
        const promises = staged.map(s => uploadFileToFirebase(s.file));
        const results = await Promise.all(promises);
        // añadir a uploaded
        setUploaded(prev => {
          const merged = [...prev, ...results];
          return merged;
        });
        // limpiar staged (y revocar previews)
        staged.forEach(s => s.preview && URL.revokeObjectURL(s.preview));
        setStaged([]);
        // opcional callback
        results.forEach(r => onUploadComplete && onUploadComplete(r));
        return results;
      } finally {
        setUploading(false);
      }
    },

    // retorna todas las evidencias que ya están subidas (incluye subidas previas)
    getUploadedFiles: () => uploaded.slice(),

    // elimina de staged (no afecta storage)
    removeStaged: (index) => {
      setStaged(prev => {
        const item = prev[index];
        if (item && item.preview) URL.revokeObjectURL(item.preview);
        return prev.filter((_, i) => i !== index);
      });
    },

    // elimina referencia de uploaded; NO borra el objeto en Firebase (si quieres borrarlo, usar deleteFromStorage)
    removeUploaded: (index) => {
      setUploaded(prev => prev.filter((_, i) => i !== index));
    },

    // borra referencia en storage (requiere path completo)
    deleteFromStorage: async (storagePath) => {
      if (!storagePath) throw new Error('storagePath requerido');
      const sRef = storageRefFn(storage, storagePath);
      await deleteObject(sRef); // puede fallar si ya borrado/permisos
      // quitar de state uploaded si existe
      setUploaded(prev => prev.filter(u => u.storagePath !== storagePath));
    },

    // limpiar todo
    clearAll: () => {
      staged.forEach(s => s.preview && URL.revokeObjectURL(s.preview));
      setStaged([]);
      setUploaded([]);
    }
  }), [staged, uploaded, onUploadComplete]);

  const openFileDialog = () => inputRef.current && inputRef.current.click();

  // sube un File a Firebase y devuelve metadata: { url, name, type, storagePath }
  const uploadFileToFirebase = async (file) => {
    const fileName = makeStoragePath(folder, file.name);
    const sRef = storageRefFn(storage, fileName);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    return { url, name: file.name, type: file.type, storagePath: fileName };
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // validaciones básicas
    if (maxSizeBytes && file.size > maxSizeBytes) {
      alert(`El archivo excede el tamaño máximo de ${Math.round(maxSizeBytes/1024/1024)} MB`);
      e.target.value = '';
      return;
    }

    // evitar duplicados por name+size (ajustable)
    if (staged.some(s => s.file.name === file.name && s.file.size === file.size) ||
        uploaded.some(u => u.name === file.name && u.type === file.type)) {
      alert('Archivo ya añadido');
      e.target.value = '';
      return;
    }

    const preview = file.type && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setStaged(prev => [...prev, { file, preview }]);
    e.target.value = ''; // limpiar input para poder re-subir mismo archivo después
  };

  return (
    <div className="file-uploader">
      <label style={{ display: 'block', marginBottom: 8 }}>{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={openFileDialog} disabled={uploading}>
          <UploadFileIcon /> Seleccionar archivo
        </button>

        {/* muestra estado simple */}
        {uploading && <span>Subiendo...</span>}
      </div>

      {/* previews + lists */}
      <div style={{ marginTop: 12 }}>
        {staged.length > 0 && (
          <>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Pendientes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staged.map((s, i) => (
                <div key={`${s.file.name}-${s.file.size}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {s.preview ? (
                    <img src={s.preview} alt={s.file.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#fff' }}>📎</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.file.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{s.file.type || 'archivo'}</div>
                  </div>
                  <button type="button" onClick={() => {
                    setStaged(prev => {
                      const item = prev[i];
                      if (item && item.preview) URL.revokeObjectURL(item.preview);
                      return prev.filter((_, idx) => idx !== i);
                    });
                  }}>×</button>
                </div>
              ))}
            </div>
          </>
        )}

        {uploaded.length > 0 && (
          <>
            <div style={{ fontSize: 13, marginTop: 12, marginBottom: 8 }}>Subidos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uploaded.map((u, i) => (
                <div key={`${u.url}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {u.type && u.type.startsWith('image/') ? (
                    <img src={u.url} alt={u.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#fff' }}>📎</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <a href={u.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{u.name}</a>
                    <div style={{ fontSize: 12, color: '#666' }}>{u.type || ''}</div>
                  </div>
                  <button type="button" onClick={() => setUploaded(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default FileUploader;