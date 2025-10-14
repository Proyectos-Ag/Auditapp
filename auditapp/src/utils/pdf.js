// src/features/auditoria/utils/pdf.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportAuditToPDF() {
  const part1 = document.getElementById('pdf-content-part1');
  const part2 = document.getElementById('pdf-content-part2');
  if (!part1 || !part2) return;

  const pdf = new jsPDF('portrait', 'cm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const addPartAsImage = async (element, yOffset, marginLeft, marginRight, bottomMargin) => {
    const canvas = await html2canvas(element, { scale: 2.5, useCORS: true });
    const imgWidth = pageWidth - marginLeft - marginRight;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (yOffset + imgHeight + bottomMargin > pageHeight) {
      pdf.addPage();
      yOffset = 0.5;
    }
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    pdf.addImage(imgData, 'JPEG', marginLeft, yOffset, imgWidth, imgHeight);
    return yOffset + imgHeight;
  };

  const processTableRows = async (table, yOffset, marginLeft, marginRight, bottomMargin) => {
    const rows = Array.from(table.querySelectorAll('tr')).filter(r =>
      r.style.display !== 'none' && r.offsetParent !== null
    );
    for (const row of rows) {
      const rowCanvas = await html2canvas(row, { scale: 2.5, useCORS: true });
      const rowHeight = (rowCanvas.height * (pageWidth - marginLeft - marginRight)) / rowCanvas.width;
      if (yOffset + rowHeight + bottomMargin > pageHeight) {
        pdf.addPage();
        yOffset = 0.5;
      }
      const rowImgData = rowCanvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(rowImgData, 'JPEG', marginLeft, yOffset, pageWidth - marginLeft - marginRight, rowHeight);
      yOffset += rowHeight;
    }
    return yOffset;
  };

  const addPartWithTables = async (element, yOffset, marginLeft, marginRight, bottomMargin) => {
    const tables = element.querySelectorAll('table');
    for (const table of tables) {
      yOffset = await processTableRows(table, yOffset, marginLeft, marginRight, bottomMargin);
    }
    return yOffset;
  };

  let yOffset = 0.5;
  yOffset = await addPartAsImage(part1, yOffset, 0.7, 0.7, 1.0);
  await addPartWithTables(part2, yOffset, 1.0, 1.0, 1.0);

  pdf.save('auditoría.pdf');
}
