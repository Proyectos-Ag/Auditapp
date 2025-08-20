import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useLocation, useNavigate } from 'react-router-dom';

// recorta espacios en blanco (tu función original)
const trimCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let top = canvas.height, bottom = 0, left = canvas.width, right = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (imgData[idx + 3] !== 0) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  // Si no hay píxeles, devolver canvas original
  if (right < left || bottom < top) return canvas;
  const width = right - left + 1;
  const height = bottom - top + 1;
  const trimmed = document.createElement('canvas');
  trimmed.width = width;
  trimmed.height = height;
  trimmed.getContext('2d').drawImage(canvas, left, top, width, height, 0, 0, width, height);
  return trimmed;
};

export default function MobileSign() {
  const sigRef = useRef(null);
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const session = params.get('session');
  const role = params.get('role');

  // preferLandscape: si true intentamos usar la dimensión mayor como ancho
  const [preferLandscape, setPreferLandscape] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
  // key para forzar remount cuando cambie tamaño
  const canvasKey = `${canvasSize.width}x${canvasSize.height}-${preferLandscape ? 'L' : 'P'}`;

  const HEADER_HEIGHT = 120; // ajustar si el header ocupa más/menos

  const computeSize = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (preferLandscape) {
      // Usar la dimensión mayor como ancho para "horizontal"
      const width = Math.max(w, h) - 16; // dejar algo de padding
      // alto útil: usar la dimensión menor menos header/botones, mínimo 160
      const height = Math.max(160, Math.min(Math.min(w, h) - 80, Math.floor((Math.min(w, h) * 0.75))));
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    } else {
      // modo normal: full width, alto 45% viewport (ajustable)
      const width = Math.max(300, w - 16);
      const height = Math.max(160, Math.floor(h * 0.45));
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    }
  }, [preferLandscape]);

  useEffect(() => {
    computeSize();
    const onResize = () => {
      computeSize();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [computeSize]);

  // boton pantalla completa
  const openFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
      // Recomputar (fullscreen cambia dimensiones)
      setTimeout(() => computeSize(), 250);
    } catch (err) {
      console.warn('No se pudo activar pantalla completa:', err);
    }
  };

  const submit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      return alert('Firma vacía');
    }
    // Obtenemos el canvas completo y lo recortamos
    const fullCanvas = sigRef.current.getCanvas();
    const trimmedCanvas = trimCanvas(fullCanvas);
    const dataURL = trimmedCanvas.toDataURL('image/png');

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, role, dataURL })
      });
      alert('Firma enviada correctamente');
      // opcional: navegar a inicio o cerrar
      navigate('/');
    } catch (err) {
      console.error('Error enviando firma:', err);
      alert('Error enviando la firma');
    }
  };

  // estilos inline mínimos; te recomiendo extraerlos a CSS si prefieres
  const containerStyle = {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    boxSizing: 'border-box',
    background: '#fafafa'
  };

  const headerStyle = {
    width: '100%',
    maxWidth: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  };

  const canvasWrapperStyle = {
    width: '100%',
    maxWidth: 1100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // permitimos overflow cuando en modo landscape forzado el canvas pueda ser mayor
    overflow: 'auto',
    padding: 8,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)'
  };

  const controlsStyle = { marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Firmar como: <em>{role}</em></h3>
          <small style={{ color: '#555' }}>{session ? `session: ${session}` : 'No session'}</small>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => { setPreferLandscape(p => !p); /* recompute */ setTimeout(() => computeSize(), 80); }}>
            {preferLandscape ? 'Modo horizontal ✓' : 'Activar modo horizontal'}
          </button>
          <button type="button" onClick={openFullscreen}>Pantalla completa</button>
        </div>
      </div>

      <div style={canvasWrapperStyle}>
        {/* key fuerza remount cuando cambia tamaño */}
        <SignatureCanvas
          key={canvasKey}
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            style: {
              border: '1px solid #ccc',
              borderRadius: 6,
              touchAction: 'none', // ayuda a evitar scroll mientras dibujan en algunos dispositivos
              backgroundColor: '#fff',
              // Escalar el canvas automáticamente en pantallas con DPR alto se maneja internamente por la librería,
              // pero si necesitas una mejor nitidez puedes adaptar aquí.
            }
          }}
        />
      </div>

      <div style={controlsStyle}>
        <button onClick={() => sigRef.current && sigRef.current.clear()}>Limpiar</button>
        <button onClick={submit}>Enviar Firma</button>
        <button onClick={() => {
          // descarga preview (debug)
          if (!sigRef.current || sigRef.current.isEmpty()) return alert('Firma vacía');
          const data = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
          const a = document.createElement('a');
          a.href = data;
          a.download = `firma-${role || 'anon'}.png`;
          a.click();
        }}>Descargar (preview)</button>
      </div>

      <div style={{ marginTop: 12, color: '#666', fontSize: 13, maxWidth: 900 }}>
        <p style={{ margin: 6 }}>
          Consejo: para una experiencia óptima en móviles activa <strong>Modo horizontal</strong> y/o <strong>Pantalla completa</strong>. Si el dispositivo está en vertical y quieres usar toda la pantalla como lienzo, activa "Modo horizontal" para que el canvas use la dimensión mayor como ancho.
        </p>
      </div>
    </div>
  );
}