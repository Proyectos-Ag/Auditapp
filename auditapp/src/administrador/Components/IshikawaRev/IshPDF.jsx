import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Cargando from '../../../components/cargando/Cargando';
import NewIshikawaFin from '../../../ishikawa-vacio/components/Ishikawa/NewIshikawaFin';
import './css/IshikawaRev.css';
import api from '../../../services/api';
import Button from '@mui/material/Button';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GroupIcon from '@mui/icons-material/Group';

// IMPORT CAMBIADO: ahora usamos la URL pública de Firebase en lugar de la carpeta assets
const Logo = 'https://firebasestorage.googleapis.com/v0/b/imagenes-auditapp.appspot.com/o/assets%2FlogoAguida.png?alt=media&token=8e2f91d8-78cf-4a0a-888b-64d2e3e26fb1';

// Función auxiliar para procesar responsable
const getResponsable = (responsable) => {
  const processObject = (obj) => {
    if (obj.nombre) {
      return obj.nombre;
    }
    return Object.keys(obj)
      .filter(key => !isNaN(key))
      .sort((a, b) => a - b)
      .map(key => obj[key])
      .join(', ');
  };

  if (Array.isArray(responsable)) {
    return responsable.flatMap(item =>
      typeof item === 'object' ? processObject(item) : item.toString()
    );
  }

  if (typeof responsable === 'object' && responsable !== null) {
    return [processObject(responsable)];
  }

  return [responsable?.toString() || ''];
};

// ---------- CONSTANTES DE ESTILO (fácil ajuste) ----------
const BASE_FONT = 'helvetica';
const LABEL_SIZE = 14; // tamaño de label (bold)
const TEXT_SIZE = 12;  // tamaño del texto normal
const PAGE_LINE_SPACING = 1.5; // factor 1.5 (equivalente word)
const DEFAULT_MARGIN_CM = 2; // centímetros
// ---------------------------------------------------------

// ---------- HELPERS GENERALES para JUSTIFICAR y PARÁGRAFOS ----------
function drawJustifiedTextGlobal(doc, text, x, y, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  let wordsWidth = 0;
  for (const w of words) {
    wordsWidth += (typeof doc.getTextWidth === 'function')
      ? doc.getTextWidth(w)
      : doc.getStringUnitWidth(w) * doc.internal.getFontSize();
  }

  if (words.length === 1) {
    if (wordsWidth < maxWidth) {
      const offset = (maxWidth - wordsWidth) / 2;
      doc.text(words[0], x + offset, y, { align: 'left' });
    } else {
      doc.text(words[0], x, y, { align: 'left' });
    }
    return;
  }

  if (words.length <= 2) {
    let cursorX = x;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      doc.text(w, cursorX, y, { align: 'left' });
      const wWidth = (typeof doc.getTextWidth === 'function')
        ? doc.getTextWidth(w)
        : doc.getStringUnitWidth(w) * doc.internal.getFontSize();
      cursorX += wWidth + doc.getTextWidth(' ');
    }
    return;
  }

  const spaceCount = words.length - 1;
  const extraSpace = Math.max(0, (maxWidth - wordsWidth) / spaceCount);

  let cursorX = x;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    doc.text(w, cursorX, y, { align: 'left' });
    const wWidth = (typeof doc.getTextWidth === 'function')
      ? doc.getTextWidth(w)
      : doc.getStringUnitWidth(w) * doc.internal.getFontSize();
    cursorX += wWidth + extraSpace;
  }
}

function drawParagraphGlobal(doc, paragraphText, x, y, maxWidth, fontSize = TEXT_SIZE, lineSpacingFactor = PAGE_LINE_SPACING) {
  if (!paragraphText) return y;
  // normalizar espacios internos (ya lo hicimos fuera, pero por seguridad)
  const normalized = paragraphText.replace(/\s+/g, ' ').trim();
  doc.setFontSize(fontSize);

  // splitTextToSize usa la fontSize actual internamente, así que nos aseguramos
  const lines = doc.splitTextToSize(normalized, maxWidth);

  const lineHeight = fontSize * lineSpacingFactor;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLastLine = i === lines.length - 1;
    const yLine = y + i * lineHeight;

    // Si la línea no tiene espacios (palabra partida) o es la última, NO justificar
    const hasSpace = /\s/.test(line);

    if (isLastLine || !hasSpace) {
      doc.text(line, x, yLine, { align: 'left' });
    } else {
      // Línea intermedia con espacios: justificar
      drawJustifiedTextGlobal(doc, line, x, yLine, maxWidth);
    }
  }
  return y + lines.length * lineHeight;
}
// ------------------------------------------------------------------

const IshPDF = forwardRef(({
  ishikawa = {},
  programa = {},
  id = '',
  download,
  participantesC = []
}, ref) =>{
  const newIshikawaRef = useRef();
  const participantesRef = useRef();
  const [loading, setLoading] = useState(false);

  const participantes = typeof ishikawa.participantes === 'string'
    ? ishikawa.participantes.split('/').map(p => p.trim()).filter(p => p)
    : Array.isArray(ishikawa.participantes)
      ? ishikawa.participantes
      : [];

  const captureNode = async (node) => {
    if (!node) return null;
    return html2canvas(node, {
      useCORS: true,
      scale: 2,
      logging: true,
      backgroundColor: '#ffffff',
      ignoreElements: el => el.tagName === 'BUTTON',
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('*').forEach(el => {
          el.style.visibility = 'visible';
          el.style.boxShadow = 'none';
        });

        clonedDoc.querySelectorAll('textarea').forEach(textarea => {
          const div = clonedDoc.createElement('div');
          div.className = textarea.className;
          div.style.cssText = textarea.style.cssText;
          div.style.whiteSpace = 'pre-wrap';
          div.style.overflow = 'hidden';
          div.innerHTML = textarea.value.replace(/\n/g, '<br>');

          textarea.parentNode.replaceChild(div, textarea);
        });
      }
    });
  };

  // --- drawIshikawaDiagram: (mantengo tu lógica tal cual, salvo NO JUSTIFICAR causas) ---
  const drawIshikawaDiagram = (doc, yOffset, diagrama, problema, pageWidth, pageHeight, margin, causaTexto = '', scale = 1, measureOnly = false) => {
    const centerY    = yOffset + 20;
    const usableW    = pageWidth - 2 * margin;
    const startX     = margin + usableW * 0.10;
    const endX       = margin + usableW * 0.87;
    // Paleta y acabado global
    const green     = '#179e6a';
    const greenDark = '#0e7f51';
    const grayLight = '#e9eef0';
    const lineColor = green;           // seguimos usando lineColor como antes

    // Bordes/uniones redondeadas en todos los trazos
    doc.setLineCap('round');
    doc.setLineJoin('round');



    // Valores base
    const baseTailSide    = 100;
    const baseHeadSize    = 120;
    const baseSpineLength = usableW * 0.33;

    // Aplicar escala
    const tailSide    = baseTailSide * scale;
    const triangleDepth = Math.sqrt(3) / 2 * tailSide;
    const triangleShift = 6 * scale;
    const headSize    = baseHeadSize * scale;
    const spineLength = baseSpineLength * scale;

    // --- NUEVO: tamaño de fuente y helper para justificar ---
    const causeFontSize = Math.max(8, Math.round(10 * scale)); // tamaño de fuente para causas
    const causeLineHeight = Math.round(causeFontSize * 1.25);   // altura base de línea (ligeramente mayor)
    const causeLineSpacing = 1.25; // factor para separar renglones (1.0 = sin separación extra)

    const causaRaices = (causaTexto && causaTexto.toString().trim())
      ? causaTexto.toString().split(';').map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase())
      : [];

    // —— Espina central (misma geometría) ——
    doc.setDrawColor(lineColor).setLineWidth(Math.max(2, 7 * scale));
    doc.line(startX, centerY, endX, centerY);

    // —— Cola (misma geometría) con ligero borde ——
    const tipX = startX + triangleShift;
    const tip = [tipX, centerY];
    const baseLeftX = tipX - triangleDepth;
    const halfBase = tailSide / 2;
    const baseTop    = [baseLeftX, centerY - halfBase];
    const baseBottom = [baseLeftX, centerY + halfBase];

    doc.setFillColor(lineColor);
    try {
      if (typeof doc.triangle === 'function') {
        doc.triangle(tip[0], tip[1], baseTop[0], baseTop[1], baseBottom[0], baseBottom[1], 'F');
      } else {
        doc.rect(baseLeftX, centerY - halfBase, triangleDepth, tailSide, 'F');
      }
    } catch {}
    // Borde sutil de la cola
    doc.setDrawColor(greenDark).setLineWidth(Math.max(0.6, 1.2 * scale));
    doc.line(tip[0], tip[1], baseTop[0], baseTop[1]);
    doc.line(baseTop[0], baseTop[1], baseBottom[0], baseBottom[1]);
    doc.line(baseBottom[0], baseBottom[1], tip[0], tip[1]);

    // —— Cabeza (misma posición/tamaño) con borde sutil ——
    doc.setFillColor(lineColor);
    const headRoundedRadius = Math.max(6, 55 * scale);
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(endX, centerY - headSize / 2, headSize, headSize, headRoundedRadius, headRoundedRadius, 'F');
    } else {
      doc.rect(endX, centerY - headSize / 2, headSize, headSize, 'F');
    }
    // “tapa” izquierda (igual que antes)
    const leftCoverWidth = headSize * 0.55;
    doc.rect(endX, centerY - headSize / 2, leftCoverWidth, headSize, 'F');

    // —— Texto del problema (mismo centrado) ——
    const problemFontSize = Math.max(10, Math.round(14 * scale));
    doc.setFont('helvetica','bold').setFontSize(problemFontSize).setTextColor('#FFFFFF');
    const problemText = 'Problema';
    const problemLines = doc.splitTextToSize(problemText, headSize - 10);
    const lineSpacing = problemFontSize + 2;
    const textBlockHeight = problemLines.length * lineSpacing;
    let startTextY = centerY - (textBlockHeight / 2) + (problemFontSize * 0.35);
    problemLines.forEach((ln, idx) => {
      doc.text(ln, endX + headSize / 2, startTextY + idx * lineSpacing, { align: 'center' });
    });


    // Espinas y causas (mantuve la lógica original para no alterar el diagrama)
    const labels = ['Medio ambiente','Métodos','Materiales','Mano de obra','Maquinaria'];
    const spineKeys = [
      ['text10','text12','text14'],
      ['text11','text13','text15'],
      ['text7', 'text4' ,'text1' ],
      ['text8', 'text5' ,'text2' ],
      ['text9', 'text6' ,'text3' ],
    ];
    const record = Array.isArray(diagrama) && diagrama.length ? diagrama[0] : {};

    const specs = [
      { pct: 0.30, ang: 120, top: false }, // Medio ambiente
      { pct: 0.70, ang: 120, top: false }, // Métodos
      { pct: 0.25, ang: 120, top: true },  // Materiales
      { pct: 0.50, ang: 120, top: true },  // Mano de obra
      { pct: 0.75, ang: 120, top: true },  // Maquinaria
    ];

    const smallRightShiftFor012 = Math.round(12 * scale);
    const smallRightShiftFor234 = Math.round(6 * scale);

    specs.forEach(({pct, ang, top}, i) => {
      const baseX = startX + usableW * pct;
      const baseY = centerY;

      const rad = ang * Math.PI/180;
      const x2  = baseX + Math.cos(rad) * spineLength;
      const y2  = baseY + Math.sin(rad) * spineLength * (top ? -1 : 1);

      // —— Línea de espina (misma geometría) ——
doc.setDrawColor(lineColor).setLineWidth(Math.max(1.2, 4 * scale));
doc.line(baseX, baseY, x2, y2);

// Unión “cápsula” en la espina central (decorativo, no mueve nada)
doc.setFillColor(lineColor);
doc.circle(baseX, baseY, Math.max(2.2, 3 * scale), 'F');

// —— Chip de categoría (misma posición/tamaño) con borde y sombra ——
const label = labels[i];
const paddingX = Math.max(6, 8 * scale);
const paddingY = Math.max(4, 6 * scale);

const labelFontSize = Math.max(10, Math.round(14 * scale));
doc.setFontSize(labelFontSize);
const textWidth = (typeof doc.getTextWidth === 'function')
  ? doc.getTextWidth(label)
  : doc.getStringUnitWidth(label) * doc.internal.getFontSize();

const bgW = textWidth + paddingX * 2;
const bgH = Math.max(labelFontSize + paddingY * 2, (10 * scale) + paddingY * 2);

let bgX;
if (i === 0 || i === 1) {
  const originalLeft = x2 - bgW - 8;
  bgX = originalLeft + smallRightShiftFor012; // misma lógica
} else {
  bgX = top ? (x2 - bgW - 2 + smallRightShiftFor234) : (x2 + 2 + smallRightShiftFor234);
}
const bgY = y2 - bgH / 2;

// Sombra sutil (si GState existe)
if (doc.GState) {
  const gs = new doc.GState({ opacity: 0.15 });
  doc.setGState(gs);
  if (typeof doc.roundedRect === 'function') {
    doc.setFillColor(0,0,0);
    doc.roundedRect(bgX + 1, bgY + 1, bgW, bgH, Math.max(4, 6 * scale), Math.max(4, 6 * scale), 'F');
  }
  doc.setGState(new doc.GState({ opacity: 1 }));
}

// Relleno y borde del chip
doc.setFillColor(lineColor);
if (typeof doc.roundedRect === 'function') {
  doc.roundedRect(bgX, bgY, bgW, bgH, Math.max(4, 6 * scale), Math.max(4, 6 * scale), 'F');
} else {
  doc.rect(bgX, bgY, bgW, bgH, 'F');
}
doc.setDrawColor(greenDark).setLineWidth(Math.max(0.6, 1 * scale));
if (typeof doc.roundedRect === 'function') {
  doc.roundedRect(bgX, bgY, bgW, bgH, Math.max(4, 6 * scale), Math.max(4, 6 * scale), 'S');
} else {
  doc.rect(bgX, bgY, bgW, bgH, 'S');
}

// Texto del chip
doc.setFont('helvetica','bold').setTextColor('#FFFFFF');
const textXcenter = bgX + bgW / 2;
const textYcenter = bgY + bgH / 2 + (labelFontSize * 0.35);
doc.text(label, textXcenter, textYcenter, { align: 'center' });


      // --- Causas ---
      const causes = (spineKeys[i] || []).map(k => record[k]).filter(Boolean);
      const causeCount = causes.length;

      causes.forEach((cause, idx) => {
        const t = (idx + 1) / (causeCount + 1);
        const causeX = baseX + (x2 - baseX) * t;
        const causeY = baseY + (y2 - baseY) * t;

        const dashLen = Math.max(6, Math.round(spineLength * 0.08));
        const lineToX = causeX - dashLen;

        // Punto de anclaje
        doc.setFillColor(lineColor);
        doc.circle(causeX, causeY, Math.max(1.6, 2 * scale), 'F');

        // Conector punteado fino en verde
        doc.setLineDashPattern([2 * scale, 2 * scale], 0);
        doc.setLineWidth(Math.max(0.3, 0.5 * scale)).setDrawColor('#1aa774');
        doc.line(causeX, causeY, lineToX, causeY);
        doc.setLineDashPattern([], 0);

        // Fuente de las causas
        doc.setFont('helvetica','normal')
          .setFontSize(causeFontSize)
          .setTextColor(0, 0, 0);


        const desiredMax = Math.round(spineLength * 0.80); // más ancho por defecto
        const pad = Math.max(4, 6 * scale); // padding dentro del rectángulo
        const availableLeft = Math.floor(lineToX - margin - pad - 4); // espacio real hasta el margen izquierdo
        const maxTextW = Math.max(40, Math.min(desiredMax, availableLeft));

        let placeOnRight = false;
        if (availableLeft < 60) {
          const spaceToHead = Math.floor((endX) - (lineToX + pad + 4));
          if (spaceToHead > availableLeft) {
            placeOnRight = true;
          }
        }

        const causeStr = cause.toString().trim();
        const causeLower = causeStr.toLowerCase();
        const isRootCause = causaRaices.length ? causaRaices.some(r => causeLower.includes(r)) : false;

        // NOTA IMPORTANTE: AQUÍ YA NO JUSTIFICAMOS LAS CAUSAS (petición explícita)
        const lines = doc.splitTextToSize(cause, maxTextW);

        lines.forEach((line, ii) => {
          let lw;
          if (typeof doc.getTextWidth === 'function') {
            lw = doc.getTextWidth(line);
          } else {
            lw = doc.getStringUnitWidth(line) * doc.internal.getFontSize();
          }

          const rectW = Math.max(lw + pad * 2, Math.min(maxTextW + pad * 2, desiredMax));
          const rectH = Math.max(Math.round(causeLineHeight), (10 * scale));

          let textRightX, rectX, textStartX;
          if (!placeOnRight) {
            rectX = lineToX - rectW - Math.max(1, 2 * scale);
            if (rectX < margin + 2) {
              rectX = margin + 2;
            }
            textStartX = rectX + pad;
          } else {
            rectX = lineToX + Math.max(1, 2 * scale);
            if (rectX + rectW > endX - 4) {
              rectX = Math.max(margin + 2, endX - 4 - rectW);
            }
            textStartX = rectX + pad;
          }

          const rectY = causeY + (ii * (rectH * causeLineSpacing)) - ((lines.length - 1) * (rectH * causeLineSpacing) / 2);

          if (isRootCause) {
            // fondo destacado + borde suave
            doc.setFillColor('#fff4a8');
            if (typeof doc.roundedRect === 'function') {
              doc.roundedRect(rectX, rectY - 2, rectW, rectH, Math.max(3, 4 * scale), Math.max(3, 4 * scale), 'F');
            } else {
              doc.rect(rectX, rectY - 2, rectW, rectH, 'F');
            }
            doc.setDrawColor('#c7b24e').setLineWidth(Math.max(0.5, 0.8 * scale));
            if (typeof doc.roundedRect === 'function') {
              doc.roundedRect(rectX, rectY - 2, rectW, rectH, Math.max(3, 4 * scale), Math.max(3, 4 * scale), 'S');
            } else {
              doc.rect(rectX, rectY - 2, rectW, rectH, 'S');
            }
          }


          const innerMaxWidth = rectW - pad * 2;
          const textY = rectY + rectH * 0.6;

          // AQUÍ NO JUSTIFICAMOS: texto alineado a la izquierda para las causas
          doc.setTextColor(0, 0, 0);
          const rightX = rectX + rectW - pad; // coordenada para el borde derecho interno
          doc.text(line, rightX, textY, { align: 'right' });
        });
      });
      // Tapón en el extremo de la espina (detalle visual)
      doc.setFillColor(lineColor);
      doc.circle(x2, y2, Math.max(1.6, 2 * scale), 'F');

    });

    const estimatedHeight = (headSize / 2) + 50 * scale + (Math.max(0, spineLength * 0.15));
    if (measureOnly) {
      return estimatedHeight;
    }
  };

  // Función de tablas paginadas
  // Función de tablas paginadas (MODIFICADA):
  // - Soporta evidencia como array (varias imágenes / pdfs / textos)
  // - Permite NO repetir encabezado de tabla en nuevas páginas
  const generatePaginatedTable = (
    doc,
    headers,
    rows,
    startX,
    startY,
    columnWidths,
    pageHeight,
    margin,
    headerHeight = 20,
    repeatHeaderOnNewPage = true,     // 👈 NUEVO
    evidenceColIndex = 4              // 👈 NUEVO (por defecto col 4 = Evidencia)
  ) => {
    let y = startY;
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

    const lineHeight = 12;
    const padding = 4;
    const itemGap = 4; // separación entre evidencias dentro de la celda

    const isDataImage = (s) => typeof s === "string" && s.startsWith("data:image");
    const isPdfUrl = (s) => typeof s === "string" && /\.pdf(\?|#|$)/i.test(s);

    const normalizeEvidenceItems = (cell) => {
      if (cell === null || cell === undefined) return [];
      if (Array.isArray(cell)) return cell.map(String).map(s => s.trim()).filter(Boolean);
      const s = String(cell).trim();
      return s ? [s] : [];
    };

    const parsePdfToken = (s, idx) => {
      // Soporta "url||filename" o solo "url"
      if (s.includes("||")) {
        const [url, filename] = s.split("||");
        return {
          url: (url || "").trim(),
          filename: (filename || `Evidencia ${idx + 1}.pdf`).trim(),
        };
      }
      return { url: s, filename: `Evidencia ${idx + 1}.pdf` };
    };

    const drawTableHeader = () => {
      doc.setFillColor("#179e6a");
      doc.rect(startX, y, tableWidth, headerHeight, "F");
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);

      let x = startX;
      headers.forEach((text, i) => {
        const lines = doc.splitTextToSize(String(text || ""), columnWidths[i] - padding * 2);
        lines.forEach((line, lineIdx) => {
          doc.text(line, x + padding, y + padding + (lineIdx * lineHeight) + 8);
        });

        if (i < headers.length - 1) {
          doc.setDrawColor(0);
          doc.line(x + columnWidths[i], y, x + columnWidths[i], y + headerHeight);
        }
        x += columnWidths[i];
      });

      y += headerHeight;
    };

    const newPageForTable = () => {
      doc.addPage();
      y = margin;

      // 👇 aquí controlas si se repite o no el encabezado de tabla
      if (repeatHeaderOnNewPage) drawTableHeader();
    };

    // Dibuja header de tabla SOLO al inicio (siempre)
    drawTableHeader();

    const buildEvidenceDraw = (rawEvidenceItems, maxW) => {
      const items = [];
      let innerH = 0;

      rawEvidenceItems.forEach((ev, idx) => {
        if (!ev) return;

        if (isDataImage(ev)) {
          try {
            const props = doc.getImageProperties(ev);
            const w = Math.min(props.width, maxW);
            const h = (props.height * w) / props.width;
            items.push({ kind: "img", data: ev, w, h });
            innerH += h + itemGap;
          } catch {
            const lines = doc.splitTextToSize(`🚫 Error imagen ${idx + 1}`, maxW);
            items.push({ kind: "text", lines });
            innerH += lines.length * lineHeight + itemGap;
          }
          return;
        }

        if (ev.includes("||") || isPdfUrl(ev)) {
          const { url, filename } = parsePdfToken(ev, idx);
          const lines = doc.splitTextToSize(filename, maxW);
          items.push({ kind: "pdf", url, filename, lines });
          innerH += lines.length * lineHeight + itemGap;
          return;
        }

        // texto normal
        const lines = doc.splitTextToSize(String(ev), maxW);
        items.push({ kind: "text", lines });
        innerH += lines.length * lineHeight + itemGap;
      });

      if (items.length > 0) innerH -= itemGap; // quita gap final
      return { items, innerH };
    };

    const drawRow = (cellLines, evidenceDraw, rowHeight) => {
      doc.setDrawColor(0);
      doc.rect(startX, y, tableWidth, rowHeight);

      let x = startX;

      cellLines.forEach((cl, i) => {
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0, 0, 0);

        if (i === evidenceColIndex) {
          const maxW = columnWidths[i] - padding * 2;
          let cy = y + padding;

          (evidenceDraw?.items || []).forEach((it) => {
            if (it.kind === "img") {
              try {
                doc.addImage(it.data, "JPEG", x + padding, cy, it.w, it.h);
                cy += it.h + itemGap;
              } catch {
                doc.text("⚠️ Error en imagen", x + padding, cy + 10);
                cy += lineHeight + itemGap;
              }
              return;
            }

            if (it.kind === "pdf") {
              doc.setTextColor(0, 0, 255);
              it.lines.forEach((ln, li) => {
                doc.text(ln, x + padding, cy + li * lineHeight + 8);
              });

              const linkH = it.lines.length * lineHeight;
              doc.link(x + padding, cy, maxW, linkH, { url: it.url });
              doc.setTextColor(0, 0, 0);
              cy += linkH + itemGap;
              return;
            }

            // text
            (it.lines || []).forEach((ln, li) => {
              doc.text(ln, x + padding, cy + li * lineHeight + 8);
            });
            cy += (it.lines?.length || 1) * lineHeight + itemGap;
          });
        } else {
          (cl || []).forEach((line, idx) => {
            doc.text(line, x + padding, y + padding + idx * lineHeight + 8);
          });
        }

        if (i < cellLines.length - 1) {
          doc.line(x + columnWidths[i], y, x + columnWidths[i], y + rowHeight);
        }
        x += columnWidths[i];
      });

      y += rowHeight;
    };

    let i = 0;
    while (i < rows.length) {
      const row = rows[i];

      // 1) líneas de texto normales
      const cellLines = row.map((cell, idx) => {
        if (idx === evidenceColIndex) return [""]; // se dibuja aparte
        return doc.splitTextToSize(String(cell || ""), columnWidths[idx] - padding * 2);
      });

      // 2) evidencia (varias)
      const evidenceRaw = normalizeEvidenceItems(row[evidenceColIndex]);
      const evidenceMaxW = columnWidths[evidenceColIndex] - padding * 2;
      let evidenceDraw = buildEvidenceDraw(evidenceRaw.length ? evidenceRaw : ["N/A"], evidenceMaxW);

      // 3) calcular altura de fila
      const maxTextLines = Math.max(
        1,
        ...cellLines.map((cl, idx) => (idx === evidenceColIndex ? 1 : (cl?.length || 1)))
      );
      const textInnerH = maxTextLines * lineHeight;
      const evidenceInnerH = evidenceDraw.innerH || lineHeight;

      const innerH = Math.max(textInnerH, evidenceInnerH);
      const rowHeight = innerH + padding * 2;

      // 4) Si no cabe en la página actual:
      if (y + rowHeight > pageHeight - margin) {
        // Si la evidencia es grande (imágenes), mover la fila completa
        const hasImages = (evidenceDraw.items || []).some(it => it.kind === "img");
        const availableInnerH = (pageHeight - margin - y - padding * 2);

        // Si ni siquiera cabe el bloque de evidencia en el espacio restante, página nueva
        if (hasImages || evidenceInnerH > availableInnerH) {
          newPageForTable();
          continue; // reintentar misma fila
        }

        // Intentar partir SOLO texto (manteniendo evidencia solo en la primera parte)
        const availableLines = Math.floor(availableInnerH / lineHeight);
        if (availableLines <= 0) {
          newPageForTable();
          continue;
        }

        const firstPartCellLines = cellLines.map((cl, idx) => {
          if (idx === evidenceColIndex) return cl;
          return (cl || []).slice(0, availableLines);
        });

        const remainderRow = row.map((cell, idx) => {
          if (idx === evidenceColIndex) return ""; // evidencia solo en la primera parte
          const full = doc.splitTextToSize(String(cell || ""), columnWidths[idx] - padding * 2);
          const rem = (full || []).slice(availableLines);
          return rem.join("\n");
        });

        // altura de la primera parte
        const firstMaxTextLines = Math.max(
          1,
          ...firstPartCellLines.map((cl, idx) => (idx === evidenceColIndex ? 1 : (cl?.length || 1)))
        );
        const firstTextH = firstMaxTextLines * lineHeight;
        const firstInnerH = Math.max(firstTextH, evidenceInnerH);
        const firstRowH = firstInnerH + padding * 2;

        drawRow(firstPartCellLines, evidenceDraw, firstRowH);

        const hasRemainder = remainderRow.some((r, idx) => idx !== evidenceColIndex && String(r || "").trim());
        if (hasRemainder) rows[i] = remainderRow;
        else i += 1;

        newPageForTable();
        continue;
      }

      // 5) Dibujar fila normal
      drawRow(cellLines, evidenceDraw, rowHeight);
      i += 1;
    }

    return y;
  };

  const generatePDF = async ({ download: dl = download, participantes: part = participantesC } = {}) => {
    try {
      setLoading(true);
      const doc = new jsPDF('l', 'pt', 'a4');
      const { internal: { pageSize: { getWidth, getHeight } } } = doc;
      const pageWidth = getWidth();
      const pageHeight = getHeight();
      let yOffset = 40;
      const cmToPt = 28.35;
      const margin = DEFAULT_MARGIN_CM * cmToPt;
      const availableWidth = pageWidth - 2 * margin;

        console.log('Informacion de ishikawa:', ishikawa)

      // Intentar cargar el logo desde la URL pública (Firebase) y añadirlo al PDF.
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = Logo;
        });
        const canvasLogo = document.createElement('canvas');
        canvasLogo.width = logoImg.width;
        canvasLogo.height = logoImg.height;
        const ctx = canvasLogo.getContext('2d');
        ctx.drawImage(logoImg, 0, 0);
        const logoData = canvasLogo.toDataURL('image/png');
        doc.addImage(logoData, 'PNG', margin, yOffset, 100, 40);
      } catch (e) {
        // fallback silencioso si no se puede cargar
      }

      doc.setFont(BASE_FONT,'normal').setFontSize(10).setTextColor(0)
        .text('GCF015', pageWidth - margin, yOffset + 5, { align: 'right' });

      doc.setFont(BASE_FONT,'bold').setFontSize(28).setTextColor(0)
        .text('Ishikawa', pageWidth / 2, yOffset + 30, { align: 'center' });
      yOffset += 80;

      // --- Alinear y formatear PROBLEMA | FECHA & FOLIO (en la misma franja) ---
      const labelSize = 16;
      const textSize = 14;

      // --- SECCIÓN PROBLEMA ---
// --- SECCIÓN PROBLEMA + FECHA (dos columnas con gap) ---
const PROBLEMA_LABEL_X = margin;
const PROBLEMA_TEXT_X  = 140;     // igual que tenías
const RIGHT_BOX_W      = 170;     // ancho fijo p/ Fecha/Folio (ajustable)
const COL_GAP          = 12;      // separación entre columnas (ajustable)

// 1) Columna derecha: FECHA / FOLIO (ancho fijo y alineado a la derecha)
const rightX = pageWidth - margin - RIGHT_BOX_W;
let infoY = yOffset;
doc.setFont(BASE_FONT, 'normal').setFontSize(TEXT_SIZE).setTextColor(0);

const fechaStr = `Fecha: ${ishikawa.fecha || ''}`;
const folioStr = ishikawa.folio ? `Folio: ${ishikawa.folio}` : '';
const infoLines = [fechaStr, folioStr].filter(Boolean);

// pintar con wrapping dentro de RIGHT_BOX_W y alineado a la derecha
let infoPaintedLines = 0;
infoLines.forEach((ln) => {
  const wrapped = doc.splitTextToSize(ln, RIGHT_BOX_W);
  wrapped.forEach((wln, j) => {
    doc.text(wln, rightX + RIGHT_BOX_W, infoY + (infoPaintedLines + j) * (TEXT_SIZE + 4), { align: 'right' });
  });
  infoPaintedLines += wrapped.length;
});
const infoHeight = infoPaintedLines * (TEXT_SIZE + 4);

// 2) Columna izquierda: PROBLEMA (el ancho descuenta la caja derecha + gap)
doc.setFont(BASE_FONT, 'bold').setFontSize(LABEL_SIZE).setTextColor(0)
   .text('Problema:', PROBLEMA_LABEL_X, yOffset);

doc.setFont(BASE_FONT, 'normal').setFontSize(TEXT_SIZE).setTextColor(0);
// ancho máx = (ancho total útil) - caja derecha - gap - ( offset ya usado por PROBLEMA_TEXT_X )
const problemaMaxW = (pageWidth - 2 * margin) - RIGHT_BOX_W - COL_GAP - (PROBLEMA_TEXT_X - margin);

// drawParagraphGlobal regresa el y final → restamos yOffset para obtener la altura
const problemaEndY = drawParagraphGlobal(
  doc,
  (ishikawa.problema || '').toString(),
  PROBLEMA_TEXT_X,
  yOffset,
  Math.max(40, problemaMaxW),      // evita valores negativos en bordes
  TEXT_SIZE,
  PAGE_LINE_SPACING
);
const problemaHeight = problemaEndY - yOffset;

// 3) Avanzar yOffset por la altura mayor de ambas columnas
yOffset += Math.max(problemaHeight, infoHeight) + 12;


      // --- SECCIÓN AFECTACIÓN ---
doc.setFont(BASE_FONT, 'bold').setFontSize(LABEL_SIZE).setTextColor(0);
      doc.text('Afectación:', margin, yOffset);

      // helper de limpieza
function cleanForPdf(s) {
  if (!s && s !== 0) return '';
  return s.toString()
    // quitar soft-hyphen, zero-width, NBSP, etc
    .replace(/[\u00AD\u200B\uFEFF\u00A0]/g, '')
    // convertir saltos de línea y tabs a espacios
    .replace(/[\r\n\t]+/g, ' ')
    // colapsar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
}

const programaNombreLimpio = cleanForPdf(programa?.Nombre || programa?.nombre || '');
const afectText = [
  cleanForPdf(ishikawa.afectacion || ''),
  `${id || ''}`,
  `${programaNombreLimpio}`
].filter(Boolean).join(' | ');


      doc.setFont(BASE_FONT, 'normal').setFontSize(TEXT_SIZE).setTextColor(0);
      const afectStartX = margin + 90;
      const afectMaxW = availableWidth - 90;
      yOffset = drawParagraphGlobal(doc, afectText || afectText, afectStartX, yOffset, afectMaxW, TEXT_SIZE, PAGE_LINE_SPACING) - 30;


      // Pre-calculamos líneas para conservar la altura vertical original
const afectLines = doc.splitTextToSize(afectText, pageWidth - margin * 2);
        
      // Calcular altura ocupada por la afectación
      const afectacionHeight = afectLines.length * (textSize + 2);
      yOffset += afectacionHeight + 30;

      // --- MARGEN EXTRA para evitar empalme ---
      yOffset += 125; // Puedes ajustar este valor si quieres más o menos espacio


// <- AJUSTE PRINCIPAL: reducir padding previo para colocar diagrama como en la versión buena
const PRE_DIAGRAM_PADDING = 10; // reducido respecto al valor anterior (185)
yOffset += PRE_DIAGRAM_PADDING;
      const espacioDisponible = pageHeight - yOffset - margin - 1; // margen de seguridad
      const alturaDiagramaBase = 285; // altura base estimada a escala 1.0

      // calcular escala automática si es necesario
      let escala = 1.0;
      if (espacioDisponible < alturaDiagramaBase) {
        // Permitir reducir más; prueba 0.45 (antes 0.6)
        escala = Math.max(0.45, espacioDisponible / alturaDiagramaBase);
      }


      // <- AJUSTE PRINCIPAL: reducir padding previo para colocar diagrama como en la versión buena
      yOffset += PRE_DIAGRAM_PADDING;

      // MEDIR altura real que ocupará el diagrama (draw en modo measureOnly)
      const medidaDiagrama = drawIshikawaDiagram(
        doc,
        yOffset,
        ishikawa.diagrama,
        ishikawa.problema,
        pageWidth,
        pageHeight,
        margin,
        ishikawa.causa,
        escala,
        true // measureOnly = true
      );

      // Si no cabe entero en la página, crear página nueva antes de dibujar
      if (yOffset + medidaDiagrama > pageHeight - margin) {
        doc.addPage();
        yOffset = margin;
      }

      // Ahora dibujamos el diagrama REAL en la posición yOffset con la escala ya decidida
      drawIshikawaDiagram(
        doc,
        yOffset,
        ishikawa.diagrama,
        ishikawa.problema,
        pageWidth,
        pageHeight,
        margin,
        ishikawa.causa,
        escala,
        false
      );

      // Avanzar yOffset usando la medida exacta (añade pequeño padding)
      yOffset += medidaDiagrama + 90;

      // --- PARTICIPANTES: ajustado para coincidir con la versión correcta (mismo estilo/posición) ---
      if (participantes && participantes.length > 0) {
        let iconData = null;
        if (participantesRef.current) {
          try {
            const c = await captureNode(participantesRef.current);
            if (c) iconData = c.toDataURL('image/png');
          } catch (e) {
            iconData = null;
          }
        }
// --- Ajuste para reducir espacio entre renglones de PARTICIPANTES ---
const namesText = participantes.join(', ');
const iconWidthPt = 14;
const textStartX = margin + iconWidthPt;

// ancho máximo disponible respetando el MARGEN derecho del documento
const textAreaWidth = Math.max(0, pageWidth - 1 );

// dividir en líneas que caben en textAreaWidth
const nameLines = doc.splitTextToSize(namesText, textAreaWidth);

// CONTROL DE ESPACIADO: reduce estos valores para acercar renglones
const fontSizePt = 8;               // tamaño de fuente usado para participantes
const lineHeightPt = 8;             // altura entre renglones (menor = renglones más juntos)
const paddingVert = 4;               // padding vertical dentro del bloque
const iconHeightPt = iconWidthPt;

let remaining = [...nameLines];
let firstChunk = true;

while (remaining.length > 0) {
  // calcular cuántas líneas caben en la página actual (respetando margen inferior)
  const availableHeight = pageHeight - margin - yOffset - paddingVert;
  // no crear página nueva: si no entra ninguna línea, forzamos 1 y la colocamos en la misma página
  let maxLinesThatFit = Math.floor(availableHeight / lineHeightPt);
  if (maxLinesThatFit <= 0) maxLinesThatFit = 1;

  const chunk = remaining.splice(0, maxLinesThatFit);
  const chunkHeight = chunk.length * lineHeightPt;
  const blockHeight = Math.max(chunkHeight + paddingVert, iconHeightPt);

  // dibujar icono solo en el primer bloque (si se capturó)
  if (firstChunk && iconData) {
    try {
      doc.addImage(iconData, 'PNG', margin, yOffset + (blockHeight - iconHeightPt) / 2, iconWidthPt, iconHeightPt);
    } catch (e) {
      /* fallback silencioso */
    }
  }

  // escribir PARTICIPANTES línea a línea con control de espaciado
  doc.setFont(BASE_FONT, 'normal').setFontSize(fontSizePt);
  doc.setTextColor(0, 0, 0);
  chunk.forEach((ln, idx) => {
    // la posición Y inicia en yOffset + smallOffset; luego sumamos idx * lineHeightPt
    const smallOffset = fontSizePt * 0.75; // corrección vertical fina
    doc.text(ln, textStartX, yOffset + smallOffset + idx * lineHeightPt);
  });

  // avanzar cursor vertical (reduce el gap extra si quieres menos separación)
  yOffset += blockHeight + 1; // <- aquí reduje el +12 a +6 para menos espacio vertical entre bloques
  firstChunk = false;
}

      }

      // --- Solo crear nueva página si no queda espacio suficiente para las secciones textuales ---
const espacioRestanteParaSecciones = pageHeight - margin - yOffset;
const umbralSecciones = 160; // espacio mínimo estimado para empezar las secciones (ajusta si quieres)
if (espacioRestanteParaSecciones < umbralSecciones) {
  doc.addPage();
  yOffset = margin;
}


      // ahora procesamos secciones (No conformidad, Hallazgo,...)
      const sections = [
        ['No conformidad:', ishikawa.requisito],
        ['Hallazgo:', ishikawa.hallazgo],
        ['Acción inmediata o corrección:', ishikawa.correccion],
        ['Causa del problema (Ishikawa, TGN, W-W, DCR):', ishikawa.causa]
      ];

      for (const [label, text] of sections) {
        if (yOffset > pageHeight - 120) {
          doc.addPage();
          yOffset = margin;
        }
        doc.setFont(BASE_FONT,'bold').setFontSize(LABEL_SIZE).setTextColor(0);
        doc.text(label, margin, yOffset);

        doc.setFont(BASE_FONT,'normal').setFontSize(TEXT_SIZE).setTextColor(0);
        yOffset = drawParagraphGlobal(doc, (text || '').toString(), margin, yOffset + 18, availableWidth - 6, TEXT_SIZE, PAGE_LINE_SPACING) + 18;
      }

      // Tabla SOLUCIÓN: solo saltar de página si no hay espacio para el encabezado + una fila aproximada
const espacioRestanteParaTabla = pageHeight - margin - yOffset;
const headerHeightEstimado = 20; // coincide con headerHeight por defecto
const filaMinimaEstimado = 24; // altura aproximada de una fila
if (espacioRestanteParaTabla < (headerHeightEstimado + filaMinimaEstimado + 6)) {
  doc.addPage();
  yOffset = margin;
}


      doc.setFont(BASE_FONT,'bold').setFontSize(LABEL_SIZE).setTextColor(0)
        .text('SOLUCIÓN', margin, yOffset);
      yOffset += 20;

      const solHeaders = ['Actividad','Responsable','Fecha Compromiso'];
      const solRows = (ishikawa.actividades || []).map(act => {
        const raw = (act.fechaCompromiso?.slice?.(-1) || '') || '';
        return [
          act.actividad,
          getResponsable(act.responsable).join(', '),
          raw ? raw : ''
        ];
      });

      const solCols = [
        availableWidth * 0.50, // Actividad (50%)
        availableWidth * 0.25, // Responsable (25%)
        availableWidth * 0.25  // Fecha Compromiso (25%)
      ];

      yOffset = generatePaginatedTable(
        doc,
        solHeaders,
        solRows,
        margin,
        yOffset,
        solCols,
        pageHeight,
        margin,
        20, 
        false  
      ) + 20;


      if (ishikawa.correcciones?.length > 0) {
        // EFECTIVIDAD: solo saltar si no hay espacio mínimo para header + al menos una fila
        const espacioRestanteParaEfect = pageHeight - margin - yOffset;
        const headerHeightEfect = 30; // en tu llamada a generatePaginatedTable pasas 30 como headerHeight por defecto
        const filaMinimaEfect = 24;
        if (espacioRestanteParaEfect < (headerHeightEfect + filaMinimaEfect + 6)) {
          doc.addPage();
          yOffset = margin;
        }


                doc.setFont(BASE_FONT,'bold').setFontSize(LABEL_SIZE).setTextColor(0)
                  .text('EFECTIVIDAD', margin, yOffset);
                yOffset += 20;

                const effHeaders = [
                  'Actividad',
                  'Responsable',
                  'Fecha Verificación',
                  'Acción Correctiva Cerrada',
                  'Evidencia'
                ];

                const isPdfUrl = (url) => /\.pdf(\?|#|$)/i.test(String(url || ""));

        const toPdfToken = (url, idx) => {
          // "url||nombreVisible" para que la tabla lo dibuje como link
          return `${url}||Evidencia ${idx + 1}.pdf`;
        };

        const effRows = await Promise.all(
          (ishikawa.correcciones || []).map(async (c) => {
            // ✅ normaliza evidencia a array
            const evidArr = Array.isArray(c.evidencia)
              ? c.evidencia.filter(Boolean)
              : (c.evidencia ? [c.evidencia] : []);

            // ✅ construye múltiples evidencias (dataURL para imágenes, token para pdf)
            const evidenciasCell = [];

            for (let j = 0; j < evidArr.length; j++) {
              const evUrl = evidArr[j];

              if (!evUrl) continue;

              // PDF → link
              if (isPdfUrl(evUrl)) {
                evidenciasCell.push(toPdfToken(evUrl, j));
                continue;
              }

              // Imagen → dataURL
              try {
                const img = new Image();
                img.crossOrigin = "Anonymous";

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                await new Promise((resolve, reject) => {
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve();
                  };
                  img.onerror = reject;
                  img.src = evUrl;
                });

                evidenciasCell.push(canvas.toDataURL("image/jpeg", 0.7));
              } catch {
                evidenciasCell.push(`🚫 Error cargando imagen ${j + 1}`);
              }
            }

            if (evidenciasCell.length === 0) evidenciasCell.push("N/A");

            const rawDate = (c.fechaCompromiso?.slice?.(-1) || "") || "";

            return [
              c.actividad,
              getResponsable(c.responsable).join(", "),
              rawDate ? rawDate : "",
              c.cerrada || "",
              evidenciasCell, // ✅ ahora mandamos ARRAY a la tabla
            ];
          })
        );

        const effCols = [
          availableWidth * 0.25, // Actividad (25%)
          availableWidth * 0.15, // Responsable (15%)
          availableWidth * 0.15, // Fecha Verificación (15%)
          availableWidth * 0.15, // Acción Correctiva Cerrada (15%)
          availableWidth * 0.30  // Evidencia (30%)
        ];

        yOffset = generatePaginatedTable(
          doc,
          effHeaders,
          effRows,
          margin,
          yOffset,
          effCols,
          pageHeight,
          margin,
          30, 
          false 
        ) + 20;

      }

      // Guardar o enviar
      if (dl === true) {
        doc.save(`Ishikawa-${id}.pdf`);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], `Ishikawa-${id}.pdf`, { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('participantes', participantesC.join('/'));

        (ishikawa.actividades || []).forEach(act => {
          if (Array.isArray(act.responsable)) {
            act.responsable.forEach(resp => {
              if (resp.correo) {
                formData.append('correoResponsable', resp.correo);
              }
            });
          }
        });

        await api.post(
          `/ishikawa/enviar-pdf-dos`,
          formData
        );
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
      generatePDF
    }));

  return (
    <div>
      {loading && <Cargando fullScreen message="Generando PDF..." />}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={newIshikawaRef}>
        <NewIshikawaFin
          diagrama={ishikawa.diagrama}
          problema={ishikawa.problema}
          causa={ishikawa.causa}
          ID={id}
        />

        {/* BLOQUE OCULTO: contenedor que será capturado y pegado _después_ del diagrama */}
        <div style={{ padding: 4 }}>
          <div
            ref={participantesRef}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              background: 'transparent'
            }}
          >
            <GroupIcon sx={{ color: '#179e6a', fontSize: 28 }} />
          </div>
        </div>

      </div>

      <Button
        variant="text"
        sx={{ color: 'white' }}
        startIcon={<PictureAsPdfIcon sx={{ color: 'white' }} />}
        onClick={generatePDF}
      >
        Generar PDF
      </Button>
    </div>
  );
});

export default IshPDF;