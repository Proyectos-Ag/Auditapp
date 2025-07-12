import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Cargando from '../../../components/cargando/Cargando';
import NewIshikawaFin from '../../../ishikawa-vacio/components/Ishikawa/NewIshikawaFin';
import './css/IshikawaRev.css';
import axios from 'axios';
import Button from '@mui/material/Button';
import Logo from "../assets/img/logoAguida.png";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

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

      // Convertir textareas en divs con saltos de línea
      clonedDoc.querySelectorAll('textarea').forEach(textarea => {
        const div = clonedDoc.createElement('div');
        div.className = textarea.className;
        div.style.cssText = textarea.style.cssText;
        div.style.whiteSpace = 'pre-wrap'; // Mantener saltos de línea
        div.style.overflow = 'hidden';
        div.innerHTML = textarea.value.replace(/\n/g, '<br>'); // Convertir \n a <br>
        
        textarea.parentNode.replaceChild(div, textarea);
      });
    }
  });
};

  const generatePaginatedTable = (doc, headers, rows, startX, startY, columnWidths, pageHeight, margin, headerHeight = 20) => {
  let y = startY;
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  const lineHeight = 21;
  const padding = 4;
  
  // Dibujar encabezado solo en la primera página
  doc.setFillColor('#179e6a');
  doc.rect(startX, y, tableWidth, headerHeight, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(255, 255, 255);
  
  let x = startX;
  headers.forEach((text, i) => {
    const lines = doc.splitTextToSize(text, columnWidths[i] - padding * 2);
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

  // Función para dibujar una fila (o parte de ella)
  const drawRow = (row, isContinuation = false) => {
    const cellLines = row.map((cell, i) => {
      if (i === 4 && typeof cell === 'string' && (cell.startsWith('data:image') || cell.includes('.pdf'))) {
        return [cell];
      }
      return doc.splitTextToSize(cell?.toString() || '', columnWidths[i] - padding * 2);
    });

    // Calcular altura máxima para esta fila
    let maxLines = 1;
    let imgDims = null;
    
    cellLines.forEach((lines, i) => {
      if (i === 4 && cellLines[4][0].startsWith('data:image')) {
        const imgData = cellLines[4][0];
        const props = doc.getImageProperties(imgData);
        const maxW = columnWidths[4] - padding * 2;
        const w = Math.min(props.width, maxW);
        const h = (props.height * w) / props.width;
        imgDims = { w, h };
        maxLines = Math.max(maxLines, Math.ceil(h / lineHeight));
      } else {
        maxLines = Math.max(maxLines, lines.length);
      }
    });

    const rowHeight = maxLines * lineHeight + padding * 2;
    
    // Verificar si necesitamos nueva página
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Dibujar borde de fila
    doc.setDrawColor(0);
    doc.rect(startX, y, tableWidth, rowHeight);

    // Dibujar contenido de celdas
    x = startX;
    cellLines.forEach((lines, i) => {
      doc.setFont('helvetica','normal').setFontSize(14).setTextColor(0, 0, 0);
      
      if (i === 4 && lines[0].startsWith('data:image') && imgDims) {
        try {
          doc.addImage(
            lines[0], 
            'JPEG', 
            x + padding, 
            y + padding, 
            imgDims.w, 
            imgDims.h
          );
        } catch {
          doc.text('⚠️ Error en imagen', x + padding, y + padding + 10);
        }
      } 
      else if (i === 4 && lines[0].includes('.pdf')) {
        const [url, filename] = lines[0].split('||').map(s => s.trim());
        doc.setFontSize(12).setTextColor(0, 0, 255);
        const maxW = columnWidths[i] - padding * 2;
        const textLines = doc.splitTextToSize(filename, maxW);
        
        textLines.forEach((line, idx) => {
          doc.text(
            line,
            x + padding,
            y + padding + idx * lineHeight + 8
          );
        });
        
        doc.link(
          x + padding,
          y + padding,
          maxW,
          textLines.length * lineHeight,
          { url }
        );
        doc.setTextColor(0, 0, 0);
      } 
      else {
        lines.forEach((line, idx) => {
          doc.text(
            line, 
            x + padding,
            y + padding + idx * lineHeight + 8
          );
        });
      }
      
      if (i < cellLines.length - 1) {
        doc.line(x + columnWidths[i], y, x + columnWidths[i], y + rowHeight);
      }
      x += columnWidths[i];
    });

    y += rowHeight;
    return y;
  };

  // Procesar cada fila
  rows.forEach(row => {
    y = drawRow(row);
  });

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
    const margin = 2 * cmToPt; 
    const availableWidth = pageWidth - 2 * margin;

    try { doc.addImage(Logo, 'PNG', margin, yOffset, 100, 40); } catch {};

    doc.setFont('helvetica','normal').setFontSize(10).setTextColor(0)
      .text('GCF015', pageWidth - margin, yOffset + 5, { align: 'right' });

    doc.setFont('helvetica','bold').setFontSize(28).setTextColor(0)
      .text('Ishikawa', pageWidth / 2, yOffset + 30, { align: 'center' });
    yOffset += 80;

    const labelSize = 16;
    const textSize = 14;

    doc.setFont('helvetica','bold').setFontSize(labelSize).setTextColor(0)
      .text('Problema:', margin, yOffset);
    const problemaLines = doc.splitTextToSize(ishikawa.problema || '', pageWidth - 180);
    doc.setFont('helvetica','normal').setFontSize(textSize).setTextColor(0)
      .text(problemaLines, 140, yOffset);

    // Coordenada inicial para Fecha y Folio (alineación vertical al lado derecho)
    const infoX = pageWidth - margin;
    let infoYOffset = yOffset;
    doc.setFontSize(textSize).setTextColor(0)
      .text(`Fecha: ${ishikawa.fecha || ''}`, infoX, infoYOffset, { align: 'right' });
    infoYOffset += textSize + 4;
    if (ishikawa.folio) {
      doc.text(`Folio: ${ishikawa.folio}`, infoX, infoYOffset, { align: 'right' });
      infoYOffset += textSize + 4;
    }

    yOffset += problemaLines.length * (textSize + 2) + 10;

    doc.setFont('helvetica','bold').setFontSize(labelSize).setTextColor(0)
      .text('Afectación:', margin, yOffset);
    // SOLUCIÓN 1: Eliminar espacios innecesarios en afectación
    const afectText = `${id} ${programa.Nombre || programa || ''}`.replace(/\s+/g, ' ');
    const afectLines = doc.splitTextToSize(afectText, pageWidth - 260);
    doc.setFont('helvetica','normal').setFontSize(textSize).setTextColor(0)
      .text(afectLines, 140, yOffset, { align: 'left' });

    yOffset += afectLines.length * (textSize + 2) + 10;
    
    yOffset += textSize - 20;

    if (newIshikawaRef.current) {
      const canvas = await captureNode(newIshikawaRef.current);

      // Crear un nuevo canvas más pequeño (recorte)
      const cropHeight = canvas.height - 100; // ← altura nueva
      const cropCanvas = document.createElement('canvas');
      const ctx = cropCanvas.getContext('2d');

      cropCanvas.width = canvas.width;
      cropCanvas.height = cropHeight;

      // Dibujar el canvas original recortando 100px de arriba
      ctx.drawImage(canvas, 0, 250, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight);

      const imgData = cropCanvas.toDataURL('image/png');
      const imgW = pageWidth - 80;
      const imgH = (cropHeight * imgW) / canvas.width;

      doc.addImage(imgData, 'PNG', margin, yOffset, imgW, imgH);
      yOffset += imgH + 20;
    }

    if (participantes.length > 0 && participantesRef.current) {
      const c = await captureNode(participantesRef.current);
      const imgData = c.toDataURL('image/png');
      const imgW = pageWidth - 80;
      const imgH = (c.height * imgW) / c.width;
      if (yOffset + imgH > pageHeight - 50) { doc.addPage(); yOffset = 40; }
      doc.addImage(imgData,'PNG',margin,yOffset,imgW,imgH);
      yOffset += imgH + 20;
    }

    const fontSize         = 12;
    const lineHeight       = 21;

    const sections = [
      ['No conformidad:', ishikawa.requisito],
      ['Hallazgo:', ishikawa.hallazgo],
      ['Acción inmediata o corrección:', ishikawa.correccion],
      ['Causa del problema (Ishikawa, TGN, W-W, DCR):', ishikawa.causa]
    ];
    sections.forEach(([label, text]) => {
      if (yOffset > pageHeight - 100) { doc.addPage(); yOffset = 40; }
      doc.setFont('helvetica','bold').setFontSize(14).setTextColor(0)
        .text(label, margin, yOffset);
      // SOLUCIÓN 2: Eliminar espacios innecesarios y reducir separación
      const normalized = (text || '').replace(/\s+/g, ' ');
      const lines = doc.splitTextToSize(normalized, availableWidth);
      doc.setFont('helvetica','normal').setFontSize(14).setTextColor(0)
        .text(lines, margin, yOffset + lineHeight, {
          align: 'left',
          maxWidth: availableWidth,
        });
      const blockHeight = lines.length * lineHeight;
      // Reducir espacio entre secciones de 30 a 15
      yOffset += blockHeight + 15;
    });

    yOffset += 20;

    const formatDate = isoString => {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-');
  return `${day}/${month}/${year}`;
};

   // Tabla SOLUCIÓN
if (yOffset > pageHeight - 200) { doc.addPage(); yOffset = 40; }
doc.setFont('helvetica','bold').setFontSize(14).setTextColor(0)
  .text('SOLUCIÓN', margin, yOffset);
yOffset += 20;

const solHeaders = ['Actividad','Responsable','Fecha Compromiso'];
const solRows = ishikawa.actividades?.map(act => {
  const raw = act.fechaCompromiso?.slice(-1)[0] || '';
  return [
    act.actividad,
    getResponsable(act.responsable).join(', '),
    formatDate(raw)
  ];
}) || [];

// SOLUCIÓN 3: Ajustar anchos de columna proporcionalmente
const solCols = [
  availableWidth * 0.4, // Actividad (60%)
  availableWidth * 0.3, // Responsable (20%)
  availableWidth * 0.3  // Fecha Compromiso (20%)
];

yOffset = generatePaginatedTable(
    doc,
    solHeaders,
    solRows,
    margin,
    yOffset,
    solCols,
    pageHeight,
    margin
  ) + 20;

if (ishikawa.correcciones?.length > 0) {

// Tabla EFECTIVIDAD
if (yOffset > pageHeight - 200) { doc.addPage(); yOffset = 40; }
doc.setFont('helvetica','bold').setFontSize(14).setTextColor(0)
  .text('EFECTIVIDAD', margin, yOffset);
yOffset += 20;

const effHeaders = [
  'Actividad',
  'Responsable',
  'Fecha Verificación',
  'Acción Correctiva Cerrada',
  'Evidencia'
];
const effRows = await Promise.all(ishikawa.correcciones.map(async c => {
  let evidenciaContent = 'N/A';

  if (c.evidencia) {
    if (c.evidencia.includes('.pdf')) {
      evidenciaContent = c.evidencia;
    } else {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = reject;
          img.src = c.evidencia;
        });
        evidenciaContent = canvas.toDataURL('image/jpeg', 0.7);
      } catch {
        evidenciaContent = '🚫 Error cargando imagen';
      }
    }
  }

  const rawDate = c.fechaCompromiso?.slice(-1)[0] || '';
  return [
    c.actividad,
    getResponsable(c.responsable).join(', '),
    formatDate(rawDate),
    c.cerrada || '',
    evidenciaContent
  ];
}));

// SOLUCIÓN 3: Ajustar anchos de columna proporcionalmente
const effCols = [
  availableWidth * 0.3, // Actividad
  availableWidth * 0.2, // Responsable
  availableWidth * 0.15, // Fecha Verificación
  availableWidth * 0.15, // Acción Correctiva Cerrada
  availableWidth * 0.2   // Evidencia
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
    30
  ) + 20;

}

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

        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/ishikawa/enviar-pdf-dos`,
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
      <div className="button-pasti">
        <div className="cont-part">
          <div
            className="button-part"
            onClick={generatePDF}
            role="button"
            tabIndex={0}
            onKeyPress={e => { if (e.key === 'Enter') generatePDF(); }}
          >
            ⚇
          </div>
          <div className="part-div">
            {ishikawa.participantes}
          </div>
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