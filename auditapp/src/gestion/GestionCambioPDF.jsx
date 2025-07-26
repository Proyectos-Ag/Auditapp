import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PropTypes from 'prop-types';

const GestionCambioPDF = ({ registro }) => {
  // Carga imagen como DataURL
  const loadImageAsDataUrl = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar imagen');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al leer blob'));
      reader.readAsDataURL(blob);
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;

    // Logo
    try {
      const logoData = await loadImageAsDataUrl('https://via.placeholder.com/150x50?text=LOGO+EMPRESA');
      doc.addImage(logoData, 'PNG', margin, margin - 10, 100, 30);
    } catch (e) {
      console.warn('Logo no disponible:', e);
    }

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('REPORTE DE GESTIÓN DE CAMBIO', pageWidth / 2, margin + 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);

    // Información básica
    autoTable(doc, {
      startY: margin + 40,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
      body: [
        ['ID Solicitud', registro._id || '-', 'Fecha Solicitud', registro.fechaSolicitud ? new Date(registro.fechaSolicitud).toLocaleDateString('es-ES') : '-'],
        ['Solicitante', registro.solicitante || '-', 'Área Solicitante', registro.areaSolicitante || '-'],
        ['Lugar', registro.lugar || '-', 'Fecha Planeada', registro.fechaPlaneada ? new Date(registro.fechaPlaneada).toLocaleDateString('es-ES') : '-']
      ]
    });

    let y = doc.lastAutoTable.finalY + 20;

    const drawSectionHeader = (title) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.setFontSize(12);
      doc.text(title.toUpperCase(), margin, y);
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 5, margin + 150, y + 5);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(10);
    };

    // Datos de la Solicitud
    drawSectionHeader('Datos de la Solicitud');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [230, 244, 249], textColor: [44, 62, 80], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' } },
      body: [
        ['Solicitante', registro.solicitante || '-'],
        ['Área solicitante', registro.areaSolicitante || '-'],
        ['Lugar', registro.lugar || '-'],
        ['Líder de proyecto', registro.liderProyecto || '-'],
        ['Fecha de solicitud', registro.fechaSolicitud ? new Date(registro.fechaSolicitud).toLocaleDateString('es-ES') : '-'],
        ['Fecha planeada',registro.fechaPlaneada ? new Date(registro.fechaPlaneada).toLocaleDateString('es-ES') : '-']
      ]
    });
    y = doc.lastAutoTable.finalY + 15;

    // Alcance del Cambio
    drawSectionHeader('Alcance del Cambio');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [230, 244, 249], textColor: [44, 62, 80], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 150, fontStyle: 'bold' } },
      body: Object.entries({
        'Tipo de cambio': registro.tipoCambio,
        'Productos': registro.productos,
        'Sistemas/Equipos': registro.sistemasEquipos,
        'Locales de producción': registro.localesProduccion,
        'Programas de limpieza': registro.programasLimpieza,
        'Sistemas de embalaje': registro.sistemasEmbajalaje,
        'Niveles de personal': registro.nivelesPersonal,
        'Requisitos legales': registro.requisitosLegales,
        'Conocimientos de peligros': registro.conocimientosPeligros,
        'Requisitos del cliente': registro.requisitosCliente,
        'Consultas a partes': registro.consultasPartes,
        'Quejas de peligros': registro.quejasPeligros,
        'Otras condiciones': registro.otrasCondiciones
      }).map(([k, v]) => [k, v || '-'])
    });
    y = doc.lastAutoTable.finalY + 15;

    // Causa del Cambio
    drawSectionHeader('Causa del Cambio');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [230, 244, 249], textColor: [44, 62, 80], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 150, fontStyle: 'bold' } },
      body: [
        ['Solicitud cliente', registro.causa?.solicitudCliente ? 'Sí' : 'No'],
        ['Reparación defecto', registro.causa?.reparacionDefecto ? 'Sí' : 'No'],
        ['Acción preventiva', registro.causa?.accionPreventiva ? 'Sí' : 'No'],
        ['Actualización documento', registro.causa?.actualizacionDocumento ? 'Sí' : 'No'],
        ['Acción correctiva', registro.causa?.accionCorrectiva ? 'Sí' : 'No'],
        ['Otros', registro.causa?.otros || '-']
      ]
    });
    y = doc.lastAutoTable.finalY + 15;

    // Descripción Propuesta
    drawSectionHeader('Descripción Propuesta');
    const descLines = doc.splitTextToSize(registro.descripcionPropuesta || 'Sin descripción proporcionada', usableWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * doc.getLineHeight();

    // Justificación
    y += 10; // espacio extra
    drawSectionHeader('Justificación');
    const justLines = doc.splitTextToSize(registro.justificacion || 'Sin justificación proporcionada', usableWidth);
    doc.text(justLines, margin, y);
    y += justLines.length * doc.getLineHeight();

    // Implicaciones
    y += 10;
    drawSectionHeader('Implicaciones');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [230, 244, 249], textColor: [44, 62, 80], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 100, fontStyle: 'bold' } },
      body: [
        ['Riesgos', registro.implicaciones?.riesgos ? 'Sí' : 'No'],
        ['Recursos', registro.implicaciones?.recursos ? 'Sí' : 'No'],
        ['Documentación', registro.implicaciones?.documentacion ? 'Sí' : 'No'],
        ['Otros', registro.implicaciones?.otros || '-']
      ]
    });
    y = doc.lastAutoTable.finalY + 15;

    // Consecuencias
    y += 10;
    drawSectionHeader('Consecuencias');
    const consLines = doc.splitTextToSize(registro.consecuencias || 'Sin consecuencias descritas', usableWidth);
    doc.text(consLines, margin, y);
    y += consLines.length * doc.getLineHeight();

    // Firmas Responsables
    y += 10;
    drawSectionHeader('Firmas Responsables');
    const firmas = Object.entries(registro.firmadoPor || {});
    if (firmas.length === 0) {
      doc.text('No hay firmas registradas', margin, y);
      y += doc.getLineHeight();
    } else {
      const rows = [];
      for (const [rol, pers] of firmas) {
        let imgData = '';
        if (pers.firma) {
          try { imgData = await loadImageAsDataUrl(pers.firma); } catch {}
        }
        rows.push([
          rol + ':',
          pers.nombre ? `${pers.nombre}\n${pers.cargo || ''}` : 'Pendiente',
          imgData ? { image: imgData, width: 80, height: 40 } : 'Sin firma'
        ]);
      }
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 100 }, 2: { cellWidth: 100, halign: 'center' } },
        body: rows
      });
      y = doc.lastAutoTable.finalY + 15;
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Reporte generado el ${new Date().toLocaleDateString('es-ES')}`, margin, doc.internal.pageSize.getHeight() - 30);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 30, { align: 'right' });
    }

    doc.save(`gestion_cambio_${registro._id}.pdf`);
  };

  return (
    <button onClick={generatePDF} style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
      Descargar PDF
    </button>
  );
};

GestionCambioPDF.propTypes = { registro: PropTypes.object.isRequired };
export default GestionCambioPDF;
