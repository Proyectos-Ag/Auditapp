import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './css/Estadisticas.css';

const Estadisticas = () => {
  const [audits, setAudits] = useState([]);
  const [observations, setObservations] = useState([]);
  const [reviewedObservations, setReviewedObservations] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
        setAudits(response.data.filter(audit => audit.Estado === 'Finalizado' || audit.Estado === 'Terminada' || audit.Estado === 'Realizada' || audit.Estado === 'Devuelto'));
        const observationsData = response.data.flatMap(audit =>
          audit.Programa.flatMap(program =>
            program.Descripcion.filter(desc => (desc.Criterio === 'M'|| desc.Criterio === 'C' || desc.Criterio === 'm')
          ))
        );
        setObservations(observationsData);

        const ishikawaResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
        const reviewedObservationsData = ishikawaResponse.data.filter(
            ishikawa => (ishikawa.estado === 'Revisado' || ishikawa.estado === 'Aprobado' || ishikawa.estado === 'Rechazados' || ishikawa.estado === 'Pendiente' || ishikawa.estado === 'Rechazados')
        );
        setReviewedObservations(reviewedObservationsData);        
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', locale: 'es' });
  };

  const handleMonthChange = (month) => {
    setSelectedMonths(prevSelected =>
      prevSelected.includes(month) ? prevSelected.filter(m => m !== month) : [...prevSelected, month]
    );
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const auditsByYear = audits.reduce((acc, audit) => {
    const year = new Date(audit.FechaInicio).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(audit);
    return acc;
  }, {});

  const filteredAuditsByYear = Object.keys(auditsByYear).reduce((acc, year) => {
    acc[year] = selectedMonths.length
      ? auditsByYear[year].filter(audit => selectedMonths.includes(getMonthName(audit.FechaElaboracion)))
      : auditsByYear[year];
    return acc;
  }, {});

 

  const criteriaCountByYear = Object.keys(filteredAuditsByYear).reduce((acc, year) => {
    const criteriaCount = filteredAuditsByYear[year].reduce((countAcc, audit) => {
      audit.Programa.forEach(program => {
        program.Descripcion.forEach(desc => {
          if (['C', 'M', 'm'].includes(desc.Criterio)) {
            if (!countAcc[desc.Criterio]) {
              countAcc[desc.Criterio] = 0;
            }
            countAcc[desc.Criterio]++;
          }
        });
      });
      return countAcc;
    }, {});

    const totalCount = Object.values(criteriaCount).reduce((sum, count) => sum + count, 0);
    acc[year] = { criteriaCount, totalCount };
    return acc;
  }, {});

  const auditTypeCountByYear = Object.keys(filteredAuditsByYear).reduce((acc, year) => {
    const auditTypeCount = filteredAuditsByYear[year].reduce((countAcc, audit) => {
      const type = audit.TipoAuditoria;
      if (!countAcc[type]) {
        countAcc[type] = 0;
      }
      countAcc[type]++;
      return countAcc;
    }, {});
    const totalCount = Object.values(auditTypeCount).reduce((sum, count) => sum + count, 0);
    acc[year] = { auditTypeCount, totalCount };
    return acc;
  }, {});

  const getColorForCriteria = (criterio) => {
    switch (criterio) {
      case 'C':
        return 'rgba(255, 99, 132, 0.6)';
      case 'M':
        return 'rgba(255, 165, 0, 0.6)';
      case 'm':
        return 'rgba(255, 255, 0, 0.6)';
      case 'Conforme':
        return 'rgba(75, 192, 192, 0.6)';
      default:
        return 'rgba(75, 192, 192, 0.6)';
    }
  };

  const getBorderColorForCriteria = (criterio) => {
    switch (criterio) {
      case 'C':
        return 'rgba(255, 99, 132, 1)';
      case 'M':
        return 'rgba(255, 165, 0, 1)';
      case 'm':
        return 'rgba(255, 255, 0, 1)';
      case 'Conforme':
        return 'rgba(75, 192, 192, 1)';
      default:
        return 'rgba(75, 192, 192, 1)';
    }
  };

  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const hasData = audits.length > 0;
  const totalObservations = observations.length;
  const reviewedObservationsCount = reviewedObservations.length;
  const pendingObservationsCount = totalObservations - reviewedObservationsCount;

  const calculateAverage = (audits) => {
    if (audits.length === 0) return 0;
    const totalPercentage = audits.reduce((acc, audit) => acc + parseFloat(audit.PorcentajeTotal), 0);
    return (totalPercentage / audits.length).toFixed(2);
  };

  const averageByYear = Object.keys(filteredAuditsByYear).reduce((acc, year) => {
    acc[year] = calculateAverage(filteredAuditsByYear[year]);
    return acc;
  }, {});

  const auditsByMonth = filteredAuditsByYear => {
    const auditsGroupedByMonth = {};
    filteredAuditsByYear.forEach(audit => {
      const month = getMonthName(audit.FechaElaboracion);
      if (!auditsGroupedByMonth[month]) {
        auditsGroupedByMonth[month] = [];
      }
      auditsGroupedByMonth[month].push(audit);
    });
    return auditsGroupedByMonth;
  };

  const auditsByMonthAndYear = Object.keys(filteredAuditsByYear).reduce((acc, year) => {
    acc[year] = auditsByMonth(filteredAuditsByYear[year]);
    return acc;
  }, {});

  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    const sections = printContent.querySelectorAll('.section');
    const canvasPromises = Array.from(sections).map(section =>
        html2canvas(section, { scale: 2 })
    );

    Promise.all(canvasPromises).then((canvases) => {
        const pdf = new jsPDF('p', 'mm', 'letter');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        let position = 0;

        canvases.forEach((canvas, index) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdfWidth - 20; // Ajustar ancho de imagen para márgenes
            const imgHeight = (imgWidth / canvas.width) * canvas.height;

            if (position + imgHeight > pdfHeight - 20) { // Ajustar altura disponible para márgenes
                pdf.addPage();
                position = 10; // Márgen superior en nueva página
            }

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight); // Márgenes izquierdo y superior
            position += imgHeight + 10; // Espacio entre imágenes
        });

        pdf.save('audits.pdf');
    });
};


  return (
    <div className="audits-container">
      <h2>Auditorías Finalizadas</h2>
      <button onClick={handlePrint} className="print-button">Guardar en PDF</button>
      <div id="print-content">
        <div className="dropdown">
          <button onClick={toggleMenu} className="dropdown-togglede">
            Seleccionar Meses
          </button>
          <div className={`dropdown-menu ${menuOpen ? 'show' : ''}`}>
            {months.map((month, index) => (
              <label key={index} className={`month-option ${selectedMonths.includes(month) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(month)}
                  onChange={() => handleMonthChange(month)}
                />
                {month}
              </label>
            ))}
          </div>
        </div>
        {Object.keys(filteredAuditsByYear).map(year => (
          <div key={year} className="year-container">
            <h3>Año: {year}</h3>
            <div className="table-chart-container-audits">
            <div className="section">
                    <h3>Auditorías Realizadas en el año</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th>Tipo de Auditoría</th>
                          <th>Porcentaje Total</th>
                          <th>Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(auditsByMonthAndYear[year]).map((month, monthIndex) => {
                          const auditsInMonth = auditsByMonthAndYear[year][month];
                          const monthAverage = calculateAverage(auditsInMonth);
                          const auditTypes = auditsInMonth.map(audit => audit.TipoAuditoria).join(', ');

                          return (
                            <tr key={month}>
                              <td>{month}</td>
                              <td>{auditTypes}</td>
                              <td>{monthAverage}</td>
                              {monthIndex === 0 && (
                                <td rowSpan={Object.keys(auditsByMonthAndYear[year]).length + 1}>
                                  {averageByYear[year]}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        <tr>
                          <td colSpan="3"><strong>Promedio</strong></td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="chart-container-audits">
                      <Bar
                        data={{
                          labels: [...Object.keys(auditsByMonthAndYear[year]), 'Promedio'],
                          datasets: [
                            {
                              label: 'Porcentaje Total',
                              data: [...Object.keys(auditsByMonthAndYear[year]).map(month => parseFloat(calculateAverage(auditsByMonthAndYear[year][month]))), parseFloat(averageByYear[year])],
                              backgroundColor: [...new Array(Object.keys(auditsByMonthAndYear[year]).length).fill('rgba(75, 192, 192, 0.6)'), 'rgba(153, 102, 255, 0.6)'],
                              borderColor: [...new Array(Object.keys(auditsByMonthAndYear[year]).length).fill('rgba(75, 192, 192, 1)'), 'rgba(153, 102, 255, 1)'],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
              <div className="section">
              <h4>Cantidad de Auditorías por Tipo</h4>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
            {filteredAuditsByYear[year].map((audit, index) => (
              <tr key={index}>
                <td>{audit.TipoAuditoria}</td>
                <td>{auditTypeCountByYear[year].auditTypeCount[audit.TipoAuditoria]}</td>
                <td>{audit.Estado}</td> {/* Aquí se muestra el Estatus de cada auditoría */}
              </tr>
            ))}
          </tbody>
                </table>
                <div className="chart-container-audits">
                  <Bar
                    data={{
                      labels: Object.keys(auditTypeCountByYear[year].auditTypeCount),
                      datasets: [{
                        label: 'Cantidad de Auditorías',
                        data: Object.values(auditTypeCountByYear[year].auditTypeCount),
                        backgroundColor: Object.keys(auditTypeCountByYear[year].auditTypeCount).map(type => getColorForCriteria(type)),
                        borderColor: Object.keys(auditTypeCountByYear[year].auditTypeCount).map(type => getBorderColorForCriteria(type)),
                        borderWidth: 1
                      }]
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>
              <div className="section">
                    <h3>Total de hallazgos de las auditorías</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Hallazgos</th>
                          <th>Cantidad</th>
                          <th>Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Hallazgos Totales</td>
                          <td>{totalObservations}</td>
                          <td>100%</td>
                        </tr>
                        <tr>
                          <td>Hallazgos Revisados</td>
                          <td>{reviewedObservationsCount}</td>
                          <td>{((reviewedObservationsCount / totalObservations) * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                          <td>Hallazgos Faltantes</td>
                          <td>{pendingObservationsCount}</td>
                          <td>{((pendingObservationsCount / totalObservations) * 100).toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="chart-container-audits">
                      <Bar
                        data={{
                          labels: ['Observaciones Totales', 'Observaciones Revisadas', 'Observaciones Faltantes'],
                          datasets: [
                            {
                              label: 'Cantidad',
                              data: [totalObservations, reviewedObservationsCount, pendingObservationsCount],
                              backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'],
                              borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
              <div className="section">
                <h4>Cantidad de Criterios en las auditorías</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Criterio</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(criteriaCountByYear[year].criteriaCount).map(([criteria, count]) => (
                      <tr key={criteria}>
                        <td>{criteria}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pie-chart-container-audits">
                  <Pie
                    data={{
                      labels: Object.keys(criteriaCountByYear[year].criteriaCount),
                      datasets: [{
                        label: 'Cantidad de Criterios',
                        data: Object.values(criteriaCountByYear[year].criteriaCount),
                        backgroundColor: Object.keys(criteriaCountByYear[year].criteriaCount).map(criteria => getColorForCriteria(criteria)),
                        borderColor: Object.keys(criteriaCountByYear[year].criteriaCount).map(criteria => getBorderColorForCriteria(criteria)),
                        borderWidth: 1
                      }]
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        {!hasData && (
          <div className="no-data-container">
            <p>No hay datos disponibles para los criterios seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estadisticas;