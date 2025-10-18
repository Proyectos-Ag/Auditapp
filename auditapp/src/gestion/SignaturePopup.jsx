import React, { useRef, useState, useEffect, useCallback } from 'react';
import Popup from 'reactjs-popup';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import 'reactjs-popup/dist/index.css';
import './css/Signature.css';
import api from '../services/api';

const SignaturePopup = ({ open, role, onSave, onClose }) => {
  const sigPadRef = useRef(null);
  const containerRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // generar nueva sessionId cada vez que se abra el popup
  useEffect(() => {
    if (open) {
      setSessionId(uuidv4());
    } else {
      setSessionId(null);
      setQrUrl('');
    }
  }, [open]);

  // Genera URL de QR para mobile-sign cuando sessionId esté listo
  useEffect(() => {
    if (open && sessionId) {
      const base = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
      setQrUrl(`${base}/mobile-sign?role=${encodeURIComponent(role)}&session=${sessionId}`);
    }
  }, [open, role, sessionId]);

  // Polling a servidor para recibir firma remota — solo si open y sessionId existen
  useEffect(() => {
  if (!open || !sessionId) return;

  let stopped = false; // evita ejecutar después del cleanup
  const id = encodeURIComponent(sessionId);

  const interval = setInterval(async () => {
    if (stopped) return;
    try {
      const { data } = await api.get(`/api/signatures/${id}`);
      const dataURL = data?.dataURL;

      if (dataURL && dataURL[role]) {
        console.log('Firma remota recibida para', role, dataURL[role]);
        onSave(role, dataURL[role]);
        clearInterval(interval);
      }
    } catch (err) {
      console.error('Error polling signature:', err?.response?.data || err);
      // opcional: podrías decidir limpiar el intervalo en ciertos códigos (404/410)
    }
  }, 1500);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}, [open, sessionId, role, onSave]);

  // Ajusta el canvas para que ocupe el ancho del contenedor y tenga buena resolución en DPR alta
  const resizeCanvasToContainer = useCallback(() => {
    const sc = sigPadRef.current;
    const wrap = containerRef.current;
    if (!sc || !wrap) return;
    const canvas = sc.getCanvas();
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(240, Math.floor(rect.width));
    // altura relativa para firma horizontal cómoda
    const height = Math.max(140, Math.floor(width * 0.38));

    // Set display size (css pixels).
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set actual size in memory (scaled to device pixel ratio)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    // Al cambiar tamaño se borra el canvas: esto es aceptable para firma nueva.
    sc.clear();
  }, []);

  useEffect(() => {
    if (!open) return;
    // Recalcula al abrir y en resize/orientationchange
    resizeCanvasToContainer();
    const onResize = () => resizeCanvasToContainer();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [open, resizeCanvasToContainer]);

  const clearSignature = () => sigPadRef.current && sigPadRef.current.clear();

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
    if (right < left || bottom < top) return canvas; // vacío
    const width = right - left + 1;
    const height = bottom - top + 1;
    const trimmed = document.createElement('canvas');
    trimmed.width = width;
    trimmed.height = height;
    trimmed.getContext('2d').drawImage(canvas, left, top, width, height, 0, 0, width, height);
    return trimmed;
  };

  const saveSignatureLocal = () => {
    const sc = sigPadRef.current;
    if (!sc || sc.isEmpty()) return;
    const canvas = sc.getCanvas();
    const trimmed = trimCanvas(canvas);
    const dataURL = trimmed.toDataURL('image/png');
    onSave(role, dataURL);
  };

  const openOnPhone = () => {
    if (!qrUrl) return;
    window.open(qrUrl, '_blank');
  };

  const copyLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      // pequeño feedback visual podría implementarse
    } catch (err) {
      console.warn('No se pudo copiar al portapapeles', err);
    }
  };

  const toggleFullscreen = async () => {
    try {
      const el = containerRef.current;
      if (!el) return;
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
      // recompute size al cambiar fullscreen
      setTimeout(() => resizeCanvasToContainer(), 200);
    } catch (err) {
      console.warn('Error toggling fullscreen', err);
    }
  };

  return (
    <Popup open={open} onClose={onClose} modal nested className={`signature-popup ${isFullscreen ? 'fs' : ''}`} lockScroll>
      <div className="signature-popup-inner">
        <header className="signature-popup-header">
          <div>
            <h3>Capturar Firma</h3>
            <small className="role-label">{role}</small>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={toggleFullscreen} title="Pantalla completa">⛶</button>
            <button className="icon-btn" onClick={onClose} title="Cerrar">✕</button>
          </div>
        </header>

        <main className="signature-popup-main">
          <aside className="qr-panel">
            <div className="qr-box">
              {qrUrl ? <QRCodeCanvas value={qrUrl} size={160} /> : <div className="qr-placeholder">Generando QR…</div>}
            </div>
            <p className="qr-instr">Escanea este QR con tu teléfono para firmar desde el móvil.</p>
            <div className="qr-actions">
              <button onClick={openOnPhone} className="btn-small">Abrir en teléfono</button>
              <button onClick={copyLink} className="btn-small ghost">Copiar enlace</button>
            </div>
            <p className="hint">Si el usuario está en móvil, abrir el enlace mejora la experiencia. El QR caduca con cada apertura del popup.</p>
          </aside>

          <section className="canvas-panel" ref={containerRef}>
            <div className="canvas-wrapper">
              <SignatureCanvas
                ref={sigPadRef}
                penColor="black"
                canvasProps={{ className: 'signature-canvas', style: { backgroundColor: '#fff' } }}
              />
            </div>

            <div className="canvas-actions">
              <button onClick={clearSignature} className="btn-outline">Limpiar</button>
              <button onClick={saveSignatureLocal} className="btn-primary">Guardar</button>
            </div>
          </section>
        </main>

        <footer className="signature-popup-footer">
          <small>Consejo: para mejor experiencia en móviles activa pantalla completa o abre el enlace en el teléfono.</small>
        </footer>
      </div>
    </Popup>
  );
};

export default SignaturePopup;