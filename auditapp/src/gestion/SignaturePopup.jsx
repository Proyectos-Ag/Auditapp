// SignaturePopup.js
import React, { useRef, useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import 'reactjs-popup/dist/index.css';
import './css/Signature.css';

const SignaturePopup = ({ open, role, onSave, onClose }) => {
  const sigPadRef = useRef(null);
  const [sessionId] = useState(() => uuidv4());
  const [qrUrl, setQrUrl] = useState('');

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

  // Genera URL de QR para mobile-sign
  useEffect(() => {
    if (open) {
      const base = process.env.REACT_APP_FRONTEND_URL;
      //const base = 'http://192.168.0.72:3000';
      setQrUrl(`${base}/mobile-sign?role=${encodeURIComponent(role)}&session=${sessionId}`);
    }
  }, [open, role, sessionId]);

  // Polling a servidor para recibir firma remota
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/signatures/${sessionId}`
        );
        if (!res.ok) return;  
        const { dataURL } = await res.json();
        // dataURL es un objeto { solicitado: "...", aprobado:"...", ... }
        if (dataURL && dataURL[role]) {
          console.log('Firma remota recibida para', role, dataURL[role]);
          onSave(role, dataURL[role]);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling signature:', err);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [open, sessionId, role, onSave]);

  const clearSignature = () => sigPadRef.current.clear();

  const saveSignatureLocal = () => {
    if (sigPadRef.current.isEmpty()) {
      return;
    }
    const canvas = sigPadRef.current.getCanvas();
    const trimmed = trimCanvas(canvas);
    const dataURL = trimmed.toDataURL('image/png');
    onSave(role, dataURL);
  };

  return (
    <Popup open={open} onClose={onClose} modal nested className="signature-popup">
      <div className="signature-popup-header">
        <h3>Capturar Firma: {role}</h3>
      </div>

      <div className="signature-popup-qr">
        <p>Escanea para firmar en tu teléfono:</p>
        {qrUrl && <QRCodeCanvas value={qrUrl} size={150} />}
      </div>

      <div className="signature-popup-content">
        <SignatureCanvas
          ref={sigPadRef}
          penColor="black"
          canvasProps={{ className: 'signature-canvas' }}
        />
      </div>

      <div className="signature-popup-actions">
        <button onClick={clearSignature} className="btn-clear">Limpiar</button>
        <button onClick={saveSignatureLocal} className="btn-save">Guardar local</button>
        <button onClick={onClose} className="btn-close">Cerrar</button>
      </div>
    </Popup>
  );
};

export default SignaturePopup;