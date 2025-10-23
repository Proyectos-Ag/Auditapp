import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';

// Logo público (puedes cambiar por el tuyo)
const Logo = 'https://firebasestorage.googleapis.com/v0/b/imagenes-auditapp.appspot.com/o/assets%2FlogoAguida.png?alt=media&token=8e2f91d8-78cf-4a0a-888b-64d2e3e26fb1';

/**
 * ValidacionPDF
 * Props:
 *  - validationId: string (id para obtener la validación desde tu backend)
 *  - form: objeto (si ya tienes los datos en memoria, pásalo para evitar fetch)
 *
 * Uso:
 *  <ValidacionPDF validationId={id} />
 *  o
 *  <ValidacionPDF form={form} />
 */
const ValidacionPDF = ({ validationId, form: formProp }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Formatea valores simples
  const fmt = (v) => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)))) {
      try { return new Date(v).toLocaleDateString('es-ES'); } catch { return String(v); }
    }
    return String(v);
  };

  const loadImageAsDataUrl = async (url) => {
  if (!url) throw new Error('URL vacía');
  if (typeof url === 'string' && url.startsWith('data:')) return url;

  // Usa tu cliente axios. Como es URL absoluta, NO se antepone baseURL.
  // Forzamos withCredentials:false para no mandar cookies a dominios externos (Firebase, etc.).
  const { data: blob } = await api.get(url, {
    responseType: 'blob',
    withCredentials: false,
    headers: { Accept: 'image/*' },
  });

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Error leyendo blob'));
    reader.readAsDataURL(blob);
  });
};

// --- sin fetch, mismo comportamiento ---
const toDataUrlOrEmpty = async (firma) => {
  if (!firma) return '';
  const s = String(firma || '').trim();
  try {
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    if (/^https?:\/\//i.test(s)) {
      return await loadImageAsDataUrl(s);
    }
    // asumir base64 cruda
    const clean = s.replace(/\s/g, '');
    return `data:image/png;base64,${clean}`;
  } catch (err) {
    console.warn('toDataUrlOrEmpty err', err);
    return '';
  }
};

// --- reemplaza fetchValidation para usar tu API client ---
const fetchValidation = async () => {
  if (formProp) return formProp;
  if (!validationId) throw new Error('No se proporcionó validationId ni form');

  // Usa ruta relativa; tu api ya resuelve baseURL (/api o el host que tengas configurado)
  const { data } = await api.get(`/validaciones/${validationId}`);
  // por si el backend devuelve array
  return Array.isArray(data) ? (data[0] || {}) : data;
};

  // Genera el PDF
  const generatePDF = async () => {
    setError(null);
    setLoading(true);
    try {
      const registro = await fetchValidation();

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const cmToPt = (cm) => cm * 28.346456692913385; // 1 cm = 28.3464567 pt
      const margin = cmToPt(2);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;

      // tamaños de fuente requeridos
      const titleFontSize = 12; // en negrita para títulos
      const baseFontSize = 10; // texto normal

      doc.setLineHeightFactor(1.4);

      // HEADER: logo + código/título
      const headerY = margin - 6; // un poco arriba del margen para que se vea integrado
      const headerLogoW = 110;
      const headerLogoH = 36;

      try {
        const logoData = await loadImageAsDataUrl(Logo);
        doc.addImage(logoData, 'PNG', margin, headerY, headerLogoW, headerLogoH);
      } catch (e) {
        // si falla, no es crítico
        console.warn('No se pudo cargar logo:', e);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(titleFontSize);
      const codigo = registro.codigo || 'VALID-001';
      doc.text(codigo, pageWidth - margin, headerY + headerLogoH / 2 + 4, { align: 'right' });

      doc.setFontSize(titleFontSize);
      doc.setTextColor(34, 106, 179);
      doc.text('FORMATO DE VALIDACIÓN', pageWidth / 2, headerY + headerLogoH + 18, { align: 'center' });

      // estado de impresión
      let y = Math.max(margin + headerLogoH + 22, headerY + headerLogoH + 22);

      // helpers para control de salto de página
      const lineHeight = baseFontSize * 1.4; // pt
      const ensureSpace = (height) => {
        if (y + height > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // --- Información clave en dos columnas ---
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(baseFontSize);

      const left = [];
      left.push(['Etapa/Proceso', fmt(registro.etapaProceso || registro.etapaProceso)]);
      left.push(['Punto a validar', fmt(registro.puntoValidar || registro.puntoValidar)]);
      left.push(['Fecha validación', fmt(registro.fechaValidacion || registro.fechaValidacion)]);
      left.push(['Peligro', fmt(registro.peligro)]);

      const right = [];
      right.push(['Medida de control', fmt(registro.medidaControl)]);
      right.push(['Parámetros / límites', fmt(registro.parametrosValoresLimite)]);
      right.push(['Requiere cambio', fmt(registro.requiereCambio)]);

      // usar autoTable para presentar dos columnas (col 0 = left block, col1 = right block)
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: baseFontSize, cellPadding: 6, lineHeight: 1.4 },
        columnStyles: { 0: { cellWidth: usableWidth - 220 }, 1: { cellWidth: 220, halign: 'left' } },
        body: [[
          left.map(it => `${it[0]}: ${it[1]}`).join('\n'),
          right.map(it => `${it[0]}: ${it[1]}`).join('\n')
        ]]
      });

      y = doc.lastAutoTable.finalY + 12;

      // --- Elementos (varios textarea) ---
      const elementos = registro.elementos || registro.elementos || {};
      const longSections = [
        { label: 'QUÉ VALIDAR', text: elementos.queValidar },
        { label: 'CÓMO VALIDARLO', text: elementos.comoValidarlo },
        { label: 'QUIÉN PARTICIPA', text: elementos.quienParticipa },
        { label: 'CUÁNDO Y CUÁNTAS VECES', text: elementos.cuandoCuantasVeces },
        { label: 'RIESGO INICIAL', text: elementos.riesgoInicial },
        { label: 'QUÉ ESPERAMOS COMO RESULTADO', text: elementos.queEsperamosResultado }
      ];

      const addLongText = (label, text) => {
        if (!text || String(text).trim() === '') return;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(titleFontSize);
        doc.setTextColor(34, 106, 179);
        ensureSpace(lineHeight * 2 + 8);
        doc.text(label, margin, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);
        const lines = doc.splitTextToSize(String(text), usableWidth);
        const needed = lines.length * lineHeight + 6;
        ensureSpace(needed + 4);
        doc.text(lines, margin, y);
        y += needed + 8;
      };

      longSections.forEach(s => addLongText(s.label, s.text));

      // desarrolloValidacion
      addLongText('DESARROLLO DE LA VALIDACIÓN', registro.desarrolloValidacion);
      addLongText('RESULTADOS DE LA VALIDACIÓN', registro.resultadosValidacion);
      addLongText('MEDIDA DE CONTROL INICIAL', registro.medidaControlInicial);
      addLongText('OBSERVACIONES', registro.observaciones);

      // --- Evidencias (lista de URLs) ---
      const evidencias = registro.evidencias || registro.evidenciasValidacion || registro.evidencias || [];
      if (Array.isArray(evidencias) && evidencias.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(titleFontSize);
        doc.setTextColor(34, 106, 179);
        ensureSpace(18);
        doc.text('EVIDENCIAS', margin, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);
        const evLines = evidencias.map((e, i) => `${i + 1}. ${e.name || e.url || e}`);
        const evWrapped = doc.splitTextToSize(evLines.join('\n'), usableWidth);
        ensureSpace(evWrapped.length * lineHeight + 6);
        doc.text(evWrapped, margin, y);
        y += evWrapped.length * lineHeight + 8;
      }

      // --- Firmas: elaboró / revisó ---
      // Normalizar objetos: pueden estar en registro.firmas, registro.elaboro, registro.reviso, etc.
      const firmasObj = registro.firmas || {};
      const elaboro = firmasObj.elaboro || registro.elaboro || {};
      const reviso = firmasObj.reviso || registro.reviso || {};

      // convertir a dataURLs
      const firmaPromises = [
        toDataUrlOrEmpty(elaboro.firma || elaboro.signature || ''),
        toDataUrlOrEmpty(reviso.firma || reviso.signature || '')
      ];

      const [elaboroData, revisoData] = await Promise.all(firmaPromises);

      // medir imágenes para escalar
      const measureImage = (dataUrl) => new Promise((resolve) => {
        if (!dataUrl) return resolve({ w: 0, h: 0, data: '' });
        const img = new Image();
        img.onload = () => {
          resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height, data: dataUrl });
        };
        img.onerror = () => resolve({ w: 0, h: 0, data: '' });
        img.src = dataUrl;
      });

      const [mEl, mRe] = await Promise.all([measureImage(elaboroData), measureImage(revisoData)]);

      // dibujar area de firmas en una sola fila con dos columnas
      ensureSpace(100);
      const sigY = y;
      const sigAreaH = 80;
      const colW = (usableWidth - 12) / 2;

      // etiqueta y nombre/cargo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(baseFontSize);
      doc.setTextColor(44, 62, 80);
      doc.text('ELABORÓ', margin, sigY);
      doc.text('REVISÓ', margin + colW + 12, sigY);

      const sigImgMaxW = Math.min(160, colW - 20);
      const sigImgMaxH = 60;

      // dibujar firma imagen centrada en cada columna
      const drawSignature = (m, leftX) => {
        const imgData = m.data;
        if (imgData) {
          const natW = m.w || sigImgMaxW;
          const natH = m.h || sigImgMaxH;
          const scale = Math.min(1, sigImgMaxW / natW, sigImgMaxH / natH);
          const drawW = (natW * scale) || sigImgMaxW;
          const drawH = (natH * scale) || sigImgMaxH;
          const x = leftX + (colW - drawW) / 2;
          const yImg = sigY + 8;
          try {
            doc.addImage(imgData, 'PNG', x, yImg, drawW, drawH);
          } catch (e) {
            try { doc.addImage(imgData, 'JPEG', x, yImg, drawW, drawH); } catch (_) { /* ignore */ }
          }
        } else {
          // si no hay imagen, dejar espacio en blanco
        }
      };

      drawSignature(mEl, margin);
      drawSignature(mRe, margin + colW + 12);

      // debajo de cada firma imprimir nombre y cargo
      const nameY = sigY + sigAreaH - 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(baseFontSize);

      const elaboroName = `${elaboro.nombre || elaboro.Name || elaboro.Nombre || ''}`;
      const elaboroCargo = `${elaboro.cargo || elaboro.position || elaboro.Puesto || ''}`;
      const revisoName = `${reviso.nombre || reviso.Name || reviso.Nombre || ''}`;
      const revisoCargo = `${reviso.cargo || reviso.position || reviso.Puesto || ''}`;

      doc.text(elaboroName || '-', margin + 6, nameY);
      doc.text(elaboroCargo || '-', margin + 6, nameY + 12);

      doc.text(revisoName || '-', margin + colW + 18, nameY);
      doc.text(revisoCargo || '-', margin + colW + 18, nameY + 12);

      y = nameY + 28;

      // FOOTER: fecha y paginado
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100);
        const footerY = pageHeight - margin / 2;
        doc.text(`Reporte generado el ${new Date().toLocaleDateString('es-ES')}`, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      }

      // guardar
      const idForName = validationId || (registro._id || 'sin-id');
      doc.save(`validacion_${String(idForName).slice(0, 12)}.pdf`);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error generando PDF');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={generatePDF}
        disabled={loading}
        style={{
          padding: '8px 14px',
          backgroundColor: '#2c3e50',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generando PDF...' : 'Descargar PDF'}
      </button>
      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
    </div>
  );
};

ValidacionPDF.propTypes = {
  validationId: PropTypes.string,
  form: PropTypes.object
};

export default ValidacionPDF;