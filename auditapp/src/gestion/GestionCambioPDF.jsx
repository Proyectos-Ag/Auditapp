import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PropTypes from 'prop-types';
import Cargando from '../components/cargando/Cargando';
import api from '../services/api';

const Logo = 'https://firebasestorage.googleapis.com/v0/b/imagenes-auditapp.appspot.com/o/assets%2FlogoAguida.png?alt=media&token=8e2f91d8-78cf-4a0a-888b-64d2e3e26fb1';

/**
 * GestionCambioPDF
 * Props:
 *  - registroId: string (ID del registro en la DB)
 */
const GestionCambioPDF = ({ registroId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carga una URL (img) y devuelve dataURL (útil para URLs públicas)
  const loadImageAsDataUrl = async (url) => {
    if (!url) throw new Error('URL vacía');
    if (typeof url === 'string' && url.startsWith('data:')) return url;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar imagen');
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al leer blob'));
      reader.readAsDataURL(blob);
    });
  };

  // Normaliza/convierte posibles formas de firma a dataURL
  const toDataUrlOrEmpty = async (firma) => {
    if (!firma) return '';
    if (typeof firma !== 'string') return '';
    const trimmed = firma.trim();

    try {
      if (trimmed.startsWith('data:')) {
        return trimmed;
      }
      if (/^https?:\/\//i.test(trimmed)) {
        return await loadImageAsDataUrl(trimmed);
      }
      const base64clean = trimmed.replace(/\s/g, '');
      return `data:image/png;base64,${base64clean}`;
    } catch (e) {
      console.warn('No se pudo convertir firma a dataURL:', e);
      return '';
    }
  };

  // Obtiene registro desde API por id
  const fetchRegistro = async () => {
  try {
    const id = encodeURIComponent(registroId);
    // OJO: este endpoint en tu back está montado con prefijo /api
    const { data } = await api.get(`/api/gestion-cambio/completa/${id}`);
    console.log('Registro obtenido para PDF:', data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;
    const msg =
      (typeof payload === 'string' && payload) ||
      payload?.message ||
      payload?.error ||
      err.message ||
      `Error ${status || ''}`.trim();

    // Re-lanzamos un Error para que el caller lo maneje igual que antes
    throw new Error(msg);
  }
};

  // Helper: convierte booleanos a SI/NO y fechas a string local
  const fmt = (v) => {
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return '';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)))) {
      try {
        return new Date(v).toLocaleDateString('es-ES');
      } catch { return String(v); }
    }
    return String(v);
  };

  // Convierte strings tipo_imlicacion -> "Tipo Implicacion" (Title Case con espacios)
  const tipoImplicacionToTitle = (s) => {
    if (!s) return '';
    return String(s)
      .replace(/_/g, ' ')
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const ensureSpaceFactory = (docRef, pageHeightRef, marginRef, stateRef) => (height) => {
    if (stateRef.y + height > pageHeightRef - marginRef) {
      docRef.addPage();
      stateRef.y = marginRef;
    }
  };

  const generatePDF = async () => {
    if (!registroId) {
      setError('No hay ID de registro para generar el PDF.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const registro = await fetchRegistro();

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const cmToPt = (cm) => cm * 28.346456692913385;
      const margin = cmToPt(2);
      doc.setLineHeightFactor(1.5);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;

      // Helpers para salto de página
      const baseFontSize = 10;
      const lineHeight = baseFontSize * 1.4; // pt

      // HEADER: logo + código + título
      const headerPadding = 20;
      const headerY = 18;
      const headerLogoWidth = 110;
      const headerLogoHeight = 36;

      try {
        const logoData = await loadImageAsDataUrl(Logo);
        doc.addImage(logoData, 'PNG', headerPadding, headerY, headerLogoWidth, headerLogoHeight);
      } catch (e) {
        console.warn('Logo no disponible:', e);
      }

      const codigo = 'GCF066';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text(codigo, pageWidth - headerPadding, headerY + headerLogoHeight / 2 + 4, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(41, 128, 185);
      const titleY = headerY + headerLogoHeight + 12;
      doc.text('REPORTE DE GESTIÓN DE CAMBIO', pageWidth / 2, titleY, { align: 'center' });

      let y = Math.max(margin, titleY + 14);

      const state = { y, margin, usableWidth, labelWidth: 140, lineHeight: doc.getLineHeight() * 1.5 };
      const ensureSpace = ensureSpaceFactory(doc, pageHeight, margin, state);

      // --- Info principal (columna izquierda y derecha) ---
      const leftLines = [];
      if (registro.solicitante) leftLines.push(`Solicitante: ${registro.solicitante}`);
      if (registro.areaSolicitante) leftLines.push(`Área solicitante: ${registro.areaSolicitante}`);
      if (registro.lugar) leftLines.push(`Lugar: ${registro.lugar}`);
      const leftText = leftLines.join('\n');

      const rightLines = [];
      if (registro.fechaSolicitud) rightLines.push(`Fecha Solicitud: ${fmt(registro.fechaSolicitud)}`);
      if (registro.fechaPlaneada) rightLines.push(`Fecha Planeada: ${fmt(registro.fechaPlaneada)}`);
      const rightText = rightLines.join('\n');

      autoTable(doc, {
        startY: state.y,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: baseFontSize, cellPadding: 6, lineHeight: 1.5, textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: usableWidth - 200 },
          1: { cellWidth: 200, halign: 'right' }
        },
        body: [[leftText || '', rightText || '']]
      });

      state.y = doc.lastAutoTable.finalY + 18; // espacio extra

      // --- Alcance / impactos ---
      const addMapAsRows = (mapObj) =>
        Object.entries(mapObj || {})
          .filter(([k, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
          .map(([k, v]) => [k, fmt(v)]);

      const alcanceMap = {
        'Tipo de cambio': registro.tipoCambio,
        'Productos': registro.impactosData?.productos || registro.productos,
        'Sistemas/Equipos': registro.impactosData?.sistemasEquipos || registro.sistemasEquipos,
        'Locales de producción': registro.impactosData?.localesProduccion || registro.localesProduccion,
        'Programas de limpieza': registro.impactosData?.programasLimpieza || registro.programasLimpieza,
        'Sistemas de embalaje': registro.impactosData?.sistemasEmbalaje || registro.sistemasEmbajalaje,
        'Niveles de personal': registro.impactosData?.nivelesPersonal || registro.nivelesPersonal,
        'Requisitos legales': registro.impactosData?.requisitosLegales || registro.requisitosLegales,
        'Conocimientos de peligros': registro.impactosData?.conocimientosPeligros || registro.conocimientosPeligros,
        'Requisitos del cliente': registro.impactosData?.requisitosCliente || registro.requisitosCliente,
        'Consultas a partes': registro.impactosData?.consultasPartes || registro.consultasPartes,
        'Quejas de peligros': registro.impactosData?.quejasPeligros || registro.quejasPeligros,
        'Otras condiciones': registro.impactosData?.otrasCondiciones || registro.otrasCondiciones
      };

      const alcanceBody = addMapAsRows(alcanceMap);

      if (alcanceBody.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(41, 128, 185);
        doc.text('ALCANCE DEL CAMBIO', margin, state.y);
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, state.y + 6, margin + 160, state.y + 6);
        state.y += 16;

        autoTable(doc, {
          startY: state.y,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: baseFontSize, cellPadding: 6, lineHeight: 1.5 },
          headStyles: { fillColor: [245, 245, 245], textColor: [44, 62, 80], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 140, fontStyle: 'bold' }, 1: { cellWidth: usableWidth - 140, halign: 'justify' } },
          body: alcanceBody
        });

        state.y = doc.lastAutoTable.finalY + 20; // más espacio al final de la tabla
      }

      // --- Causa ---
      const causaMap = {
        'Solicitud cliente': registro.causa?.solicitudCliente,
        'Reparación defecto': registro.causa?.reparacionDefecto,
        'Acción preventiva': registro.causa?.accionPreventiva,
        'Actualización documento': registro.causa?.actualizacionDocumento,
        'Acción correctiva': registro.causa?.accionCorrectiva,
        'Otros': registro.causa?.otros
      };

      const causaBody = Object.entries(causaMap)
        .filter(([k, v]) => v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === ''))
        .map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'Sí' : 'No') : fmt(v)]);

      if (causaBody.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(41, 128, 185);
        doc.text('CAUSA DEL CAMBIO', margin, state.y);
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, state.y + 6, margin + 160, state.y + 6);
        state.y += 16;

        autoTable(doc, {
          startY: state.y,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: baseFontSize, cellPadding: 6, lineHeight: 1.5 },
          headStyles: { fillColor: [245, 245, 245], textColor: [44, 62, 80], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 140, fontStyle: 'bold' }, 1: { cellWidth: usableWidth - 140 } },
          body: causaBody
        });

        state.y = doc.lastAutoTable.finalY + 20;
      }

      // --- Descripciones largas: ahora en negro y sin tablas (solo título + contenido) ---
      const addLongTextSection = (label, text) => {
        if (!text) return;
        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(41, 128, 185);
        doc.text(label.toUpperCase(), margin, state.y);
        // Línea decorativa corta
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, state.y + 6, margin + 200, state.y + 6);
        state.y += 16;

        // Contenido (en color negro)
        const contentWidth = usableWidth;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(0, 0, 0); // <-- negro solicitado
        const lines = doc.splitTextToSize(text || '-', contentWidth);
        const needed = lines.length * lineHeight + 6;
        ensureSpace(needed + 8);

        doc.text(lines, margin, state.y);
        state.y += needed + 12; // espacio extra después del texto (cumple "agrega un espacio entre el final de las tablas y el siguiente titulo")
      };

      addLongTextSection('DESCRIPCIÓN PROPUESTA', registro.descripcionPropuesta);
      addLongTextSection('JUSTIFICACIÓN', registro.justificacion);
      addLongTextSection('CONSECUENCIAS', registro.consecuencias);

      // --- IMPLICACIONES (corto) ---
      const implicacionesMap = {
        'Riesgos': registro.implicaciones?.riesgos,
        'Recursos': registro.implicaciones?.recursos,
        'Documentación': registro.implicaciones?.documentacion,
        'Otros': registro.implicaciones?.otros
      };

      const implicacionesBody = Object.entries(implicacionesMap)
        .filter(([k, v]) => v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === ''))
        .map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'Sí' : 'No') : fmt(v)]);

      if (implicacionesBody.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(41, 128, 185);
        doc.text('IMPLICACIONES', margin, state.y);
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, state.y + 6, margin + 120, state.y + 6);
        state.y += 16;

        autoTable(doc, {
          startY: state.y,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: baseFontSize, cellPadding: 6, lineHeight: 1.5 },
          headStyles: { fillColor: [245, 245, 245], textColor: [44, 62, 80], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 140, fontStyle: 'bold' }, 1: { cellWidth: usableWidth - 140 } },
          body: implicacionesBody
        });

        state.y = doc.lastAutoTable.finalY + 20;
      }

      // --- OBJETOS - RIESGOS: usar tipoImplicacion como título (sin _, con espacios, Title Case) ---
      const addRiskCards = (cards) => {
        if (!Array.isArray(cards) || cards.length === 0) return;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(41, 128, 185);
        doc.text('OBJETOS - RIESGOS', margin, state.y);
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, state.y + 6, margin + 160, state.y + 6);
        state.y += 16;

        cards.forEach((card, idx) => {
          // título por card: preferimos tipoImplicacion si existe
          const rawTipo = card.tipoImplicacion || card.tipo_implicacion || card.tipo || '';
          const title = rawTipo ? tipoImplicacionToTitle(rawTipo) : (card.titulo || card.objeto || card.nombre || `Objeto ${idx + 1}`);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(44, 62, 80);
          ensureSpace(lineHeight + 8);
          doc.text(title, margin, state.y);
          state.y += 12;

          // convertir objeto a filas clave/valor, pero excluir campos no deseados
          const rows = Object.entries(card || {})
            .filter(([k, v]) =>
              !['titulo', 'objeto', 'nombre', 'id', '_id', 'involucradosData'].includes(k) &&
              v !== undefined && v !== null &&
              !(Array.isArray(v) && v.length === 0) &&
              !(typeof v === 'string' && v.trim() === '')
            )
            .map(([k, v]) => {
              // probabilidad no es fecha: mantenemos como texto
              const lower = k.toLowerCase();
              let value;
              if (lower.includes('probabil')) value = String(v); // no formatear fecha
              else value = Array.isArray(v) ? v.join(', ') : fmt(v);

              // humanizar clave: reemplazar _ y camelCase por palabras
              const label = k
                .replace(/_/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .split(/\s+/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

              return [label, value];
            });

          if (rows.length === 0) {
            ensureSpace(lineHeight + 6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(baseFontSize);
            doc.setTextColor(0, 0, 0);
            doc.text('-', margin + 6, state.y);
            state.y += lineHeight + 8;
            return;
          }

          ensureSpace(rows.length * (lineHeight + 6) + 12);
          autoTable(doc, {
            startY: state.y,
            margin: { left: margin, right: margin },
            theme: 'grid',
            styles: { font: 'helvetica', fontSize: baseFontSize, cellPadding: 6, lineHeight: 1.5 },
            headStyles: { fillColor: [250, 250, 250], textColor: [44, 62, 80], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 160, fontStyle: 'bold' }, 1: { cellWidth: usableWidth - 160, halign: 'left' } },
            body: rows
          });

          state.y = doc.lastAutoTable.finalY + 18; // espacio extra entre tabla y siguiente título
        });

        state.y += 12;
      };

      addRiskCards(registro.riesgosCards || registro.riesgos || []);

      // ---------- Sección FIRMAS: 3 firmas en línea (sin tabla) ----------
      // Recolectar hasta 3 firmas disponibles (ordenadas por rolesOrder)
      const normalizeFirma = (sig) => {
        if (!sig) return { nombre: '-', cargo: '-', firma: '' };
        const read = (o, keys) => {
          for (const k of keys) {
            if (!o) continue;
            if (typeof o[k] === 'string' && o[k].trim() !== '') return o[k];
            if (typeof o[k] === 'object' && o[k] !== null) {
              if (typeof o[k].nombre === 'string') return o[k].nombre;
              if (typeof o[k].name === 'string') return o[k].name;
            }
          }
          return '';
        };
        const nombre = read(sig, ['nombre', 'name', 'Nombre', 'Name']) || '-';
        const cargo = read(sig, ['cargo', 'position', 'puesto', 'Cargo']) || '-';
        const firmaRaw = (sig.firma || sig.data || sig.signature || '').toString();
        return { nombre: String(nombre), cargo: String(cargo), firma: firmaRaw };
      };

      // Recolectar firmas: intento por rolesOrder, tomamos los primeros 3 encontrados
      const rolesOrder = ['solicitado', 'evaluado', 'aprobado', 'implementado', 'validado'];
      const collected = [];
      rolesOrder.forEach(role => {
        if (collected.length >= 3) return;
        const arr = Array.isArray(registro.firmadoPor?.[role]) ? registro.firmadoPor[role] : (registro.firmadoPor?.[role] ? [registro.firmadoPor[role]] : []);
        if (!arr || arr.length === 0) return;
        arr.forEach(raw => {
          if (collected.length >= 3) return;
          collected.push({ role, raw });
        });
      });

      // Normalizar y convertir a dataUrls
      const firmaObjs = [];
      for (let i = 0; i < collected.length; i++) {
        const normalized = normalizeFirma(collected[i].raw);
        firmaObjs.push({ nombre: normalized.nombre, cargo: normalized.cargo, rawFirma: normalized.firma, imgData: '' });
      }

      // Convertir firmas a data URLs
      const firmaPromises = firmaObjs.map(async (f) => {
        try {
          const d = await toDataUrlOrEmpty(f.rawFirma);
          return d || '';
        } catch {
          return '';
        }
      });

      const firmaDataUrls = await Promise.all(firmaPromises);
      for (let i = 0; i < firmaObjs.length; i++) {
        firmaObjs[i].imgData = firmaDataUrls[i] || '';
      }

      // Calcular dimensiones de imágenes y escalar
      const maxW = 140;
      const maxH = 60;
      const dimPromises = firmaObjs.map(fr => new Promise(resolve => {
        if (!fr.imgData) {
          fr.scaledW = 0; fr.scaledH = 0; return resolve(fr);
        }
        const img = new Image();
        img.onload = () => {
          const natW = img.naturalWidth || img.width;
          const natH = img.naturalHeight || img.height;
          const scale = Math.min(1, maxW / natW, maxH / natH);
          fr.scaledW = Math.round(natW * scale);
          fr.scaledH = Math.round(natH * scale);
          resolve(fr);
        };
        img.onerror = () => {
          fr.scaledW = Math.min(maxW, 100);
          fr.scaledH = Math.min(maxH, 40);
          resolve(fr);
        };
        img.src = fr.imgData;
      }));

      await Promise.all(dimPromises);

      // Preparar layout: 3 columnas (si hay menos, centramos los existentes ocupando el ancho)
      const sigCount = Math.max(0, Math.min(3, firmaObjs.length));
      if (sigCount > 0) {
        ensureSpace(maxH + 80); // reservar espacio para las firmas, líneas y nombres
        const columns = sigCount;
        const colWidth = usableWidth / 3;
        const startX = margin;
        const sigTopY = state.y;

        // Ajustamos posición horizontal según cuántas firmas: si < 3 las centramos
        const offsetLeft = sigCount === 3 ? 0 : (usableWidth - colWidth * sigCount) / 2;

        for (let i = 0; i < sigCount; i++) {
          const fr = firmaObjs[i];
          const colIndex = i;
          const centerX = startX + offsetLeft + colIndex * colWidth + colWidth / 2;

          // Dibujar la imagen centrada en la columna
          if (fr.imgData && fr.scaledW > 0 && fr.scaledH > 0) {
            const imgX = centerX - fr.scaledW / 2;
            const imgY = sigTopY;
            try {
              doc.addImage(fr.imgData, 'PNG', imgX, imgY, fr.scaledW, fr.scaledH);
            } catch (e) {
              try { doc.addImage(fr.imgData, 'JPEG', imgX, imgY, fr.scaledW, fr.scaledH); }
              catch (err) { /* ignore */ }
            }
          } else {
            // placeholder "sin firma"
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(120);
            doc.text('Sin firma', centerX, sigTopY + 18, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(baseFontSize);
            doc.setTextColor(0, 0, 0);
          }

          // Línea debajo de donde estaría la firma (si hay imagen usamos su altura, si no, fija)
          const usedH = fr.scaledH > 0 ? fr.scaledH : 30;
          const lineY = sigTopY + usedH + 8;
          const lineW = Math.min(160, colWidth - 20);
          const lineX1 = centerX - lineW / 2;
          const lineX2 = centerX + lineW / 2;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.6);
          doc.line(lineX1, lineY, lineX2, lineY);

          // Nombre y cargo centrados debajo de la línea
          const nameY = lineY + 12;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(firmaObjs[i].nombre || '-', centerX, nameY, { align: 'center' });

          const cargoY = nameY + 12;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.text(firmaObjs[i].cargo || '-', centerX, cargoY, { align: 'center' });
        }

        // mover cursor Y por debajo de las firmas
        state.y = sigTopY + maxH + 48;
      } else {
        state.y += 12;
      }

      // FOOTER: fecha + paginado
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100);
        const footerY = pageHeight - 20;
        doc.text(`Reporte generado el ${new Date().toLocaleDateString('es-ES')}`, 20, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
      }

      doc.save(`gestion_cambio_${registroId}.pdf`);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al generar PDF');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      {loading && <Cargando fullScreen message="Generando PDF..." />}

      <button
        type="button"
        onClick={generatePDF}
        disabled={loading || !registroId}
        style={{
          padding: '8px 16px',
          backgroundColor: '#2c3e50',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generando PDF...' : 'Descargar PDF'}
      </button>

      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
    </div>
  );
};

GestionCambioPDF.propTypes = {
  registroId: PropTypes.string.isRequired
};

export default GestionCambioPDF;