import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useLocation, useNavigate } from 'react-router-dom';

// Función para recortar espacios en blanco del canvas
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
  const width = right - left + 1;
  const height = bottom - top + 1;
  const trimmed = document.createElement('canvas');
  trimmed.width = width;
  trimmed.height = height;
  trimmed.getContext('2d').drawImage(canvas, left, top, width, height, 0, 0, width, height);
  return trimmed;
};

export default function MobileSign() {
  const sigRef = useRef();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const session = params.get('session');
  const role = params.get('role');

  const submit = async () => {
    if (sigRef.current.isEmpty()) {
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
      navigate('/'); // o cerrar pestaña
    } catch (err) {
      console.error('Error enviando firma:', err);
      alert('Error enviando la firma');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Firmar como: <em>{role}</em></h2>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 300, height: 200, style: { border: '1px solid #ccc' } }}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={() => sigRef.current.clear()}>Limpiar</button>
        <button onClick={submit} style={{ marginLeft: 8 }}>Enviar Firma</button>
      </div>
    </div>
  );
}