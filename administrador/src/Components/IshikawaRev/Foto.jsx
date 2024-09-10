import { useEffect, useRef, useState } from 'react';
import './css/Camara.css';

function Fotos({ open, onClose, onCapture }) {
  const videoDiv = useRef(null);
  const fotoDiv = useRef(null);
  const [hayFoto, setHayFoto] = useState(false);
  const [stream, setStream] = useState(null);
  const [camera, setCamera] = useState('user');
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState(0);

  const aplicarMejoras = () => {
    const track = stream?.getVideoTracks()[0];
    const capabilities = track?.getCapabilities();
    const settings = track?.getSettings();
    
    const constraints = {
      advanced: []
    };

    if (capabilities?.brightness) {
      constraints.advanced.push({ brightness: 1.0 }); // Ajuste de brillo
    }
    if (capabilities?.contrast) {
      constraints.advanced.push({ contrast: 1.0 }); // Ajuste de contraste
    }
    if (capabilities?.exposureMode && settings?.exposureMode !== 'continuous') {
      constraints.advanced.push({ exposureMode: 'continuous' }); // Exposición continua
    }
    if (capabilities?.whiteBalanceMode && settings?.whiteBalanceMode !== 'continuous') {
      constraints.advanced.push({ whiteBalanceMode: 'continuous' }); // Balance de blancos continuo
    }

    track?.applyConstraints(constraints);
  };

  const verCamara = async () => {
    try {
      if (stream) {
        detenerCamara();
      }
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: camera }
      });
      setStream(currentStream);
      if (videoDiv.current) {
        videoDiv.current.srcObject = currentStream;
        videoDiv.current.play();
      }
      aplicarMejoras(); // Aplicar mejoras de calidad de imagen
    } catch (err) {
      console.log(err);
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const tomarFoto = () => {
    const w = 1080;
    const h = w / (16 / 9);

    const video = videoDiv.current;
    const foto = fotoDiv.current;

    if (foto && video) {
      foto.width = w;
      foto.height = h;
      const context = foto.getContext('2d');

      // Habilitar suavizado de imagen para mejorar la calidad
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      context.drawImage(video, 0, 0, w, h);
      setHayFoto(true);

      // Generar imagen con máxima calidad
      const dataUrl = foto.toDataURL('image/png', 1.0); // Calidad máxima (1.0)
      onCapture(dataUrl);
    }
  };

  const cerrarFoto = () => {
    const f = fotoDiv.current;
    if (f) {
      const context = f.getContext('2d');
      context.clearRect(0, 0, f.width, f.height);
      setHayFoto(false);
    }
  };

  const cambiarCamara = () => {
    setCamera(prevCamera => (prevCamera === 'user' ? 'environment' : 'user'));
  };

  const handleZoomChange = (event) => {
    const newZoom = event.target.value;
    setZoom(newZoom);

    const track = stream?.getVideoTracks()[0];
    const capabilities = track?.getCapabilities();

    if (capabilities?.zoom) {
      const maxZoom = capabilities.zoom.max;
      const minZoom = capabilities.zoom.min;
      track.applyConstraints({
        advanced: [{ zoom: Math.min(Math.max(newZoom, minZoom), maxZoom) }]
      });
    }
  };

  const handleFocusChange = (event) => {
    const newFocus = event.target.value;
    setFocus(newFocus);

    const track = stream?.getVideoTracks()[0];
    const capabilities = track?.getCapabilities();

    if (capabilities?.focusDistance) {
      const maxFocus = capabilities.focusDistance.max;
      const minFocus = capabilities.focusDistance.min;
      track.applyConstraints({
        advanced: [{ focusDistance: Math.min(Math.max(newFocus, minFocus), maxFocus) }]
      });
    }
  };

  useEffect(() => {
    if (open) {
      verCamara();
    } else {
      detenerCamara();
    }

    return () => {
      detenerCamara();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, camera]);

  if (!open) return null;

  return (
    <div className={`modal ${open ? 'open' : 'closed'}`}>
      <div className="fixed-modal">
        <div className="camera-container">
          <video ref={videoDiv} style={{ width: '100%', height: 'auto' }}></video>

          <div className="controls">
            <input
              className='funciones-2'
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={handleZoomChange}
            />
            <input
            className='funciones'
              type="range"
              min="0"
              max="100"
              step="1"
              value={focus}
              onChange={handleFocusChange}
            />

            <button className="camera-button" onClick={tomarFoto} disabled={!open}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>photo_camera</span>
            </button>

            <button className="camera-switch-button" onClick={cambiarCamara}>
              <span className="material-symbols-outlined">switch_camera</span>
            </button>

            <button className="camera-button-salir" onClick={() => { detenerCamara(); onClose(); }}>
              <span>Salir</span>
            </button>
          </div>

          <canvas ref={fotoDiv} className="foto-canvas"></canvas>
          {hayFoto && (
            <button className="close-photo-button" onClick={cerrarFoto}>
              <span className="material-symbols-outlined">close</span> Cerrar Foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Fotos;