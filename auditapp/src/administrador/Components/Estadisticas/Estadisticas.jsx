import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './css/Estadisticas.css';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Estadisticas = () => {
  const [audits, setAudits] = useState([]);
  const [observations, setObservations] = useState([]);
  const [reviewedObservations, setReviewedObservations] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState('bar');
  const [auditIds, setAuditIds] = useState([]);
  const [reviewedByYear, setReviewedByYear] = useState({});

  // useEffect inicial corregido
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
        const filteredAudits = response.data.filter(audit => 
          audit.Estado === 'Finalizado' || 
          audit.Estado === 'Terminada' || 
          audit.Estado === 'Realizada' || 
          audit.Estado === 'Devuelto'
        );
        
        setAudits(filteredAudits);
        setAuditIds(filteredAudits.map(audit => audit._id));

        // Extraer observaciones solo de auditorías existentes
        const observationsData = filteredAudits.flatMap(audit =>
          audit.Programa.flatMap(program =>
            program.Descripcion.filter(desc => 
              ['M', 'C', 'm'].includes(desc.Criterio)
            )
          )
        );
        setObservations(observationsData);

        // CORRECCIÓN: Usar idRep consistentemente
        const ishikawaResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
        const reviewedObservationsData = ishikawaResponse.data.filter(
          ishikawa => 
            (ishikawa.estado === 'Revisado' || 
             ishikawa.estado === 'Aprobado' || 
             ishikawa.estado === 'Rechazados' || 
             ishikawa.estado === 'Pendiente') &&
            filteredAudits.map(audit => audit._id).includes(ishikawa.idRep) // <- CAMBIO AQUÍ
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

  const toggleVisualization = (type) => {
    setActiveVisualization(type);
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

  // CORRECCIÓN: Función para contar hallazgos únicos por año
  const countUniqueObservationsByYear = (year) => {
    const yearAudits = filteredAuditsByYear[year] || [];
    
    // Obtener todos los IDs únicos de hallazgos
    const uniqueObservationIds = new Set();
    
    yearAudits.forEach(audit => {
      audit.Programa.forEach(program => {
        program.Descripcion.forEach(desc => {
          if (['C', 'M', 'm'].includes(desc.Criterio)) {
            // Crear un ID único para cada hallazgo
            const observationId = `${audit._id}-${program.Nombre}-${desc.Requisito}-${desc.Observacion}`;
            uniqueObservationIds.add(observationId);
          }
        });
      });
    });
    
    return uniqueObservationIds.size;
  };

  // CORRECCIÓN: Función para contar hallazgos revisados únicos por año
  const countUniqueReviewedObservationsByYear = async (year) => {
    const yearAudits = filteredAuditsByYear[year] || [];
    const yearAuditIds = yearAudits.map(audit => audit._id);

    try {
      const ishikawaResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
      
      // Filtrar por auditorías del año y estados válidos
      const reviewedIshikawas = ishikawaResponse.data.filter(
        ishikawa =>
          (ishikawa.estado === 'Revisado' || 
           ishikawa.estado === 'Aprobado') &&
          yearAuditIds.includes(ishikawa.idRep)
      );
      
      // Crear un Set de hallazgos únicos revisados
      const uniqueReviewedIds = new Set();
      
      reviewedIshikawas.forEach(ishikawa => {
        // Crear ID único basado en la misma lógica que los hallazgos originales
        const observationId = `${ishikawa.idRep}-${ishikawa.programaNombre}-${ishikawa.requisito}-${ishikawa.observacion}`;
        uniqueReviewedIds.add(observationId);
      });
      
      return uniqueReviewedIds.size;
      
    } catch (error) {
      console.error('Error fetching ishikawa data:', error);
      return 0;
    }
  };

  // CORRECCIÓN: useEffect para calcular hallazgos revisados únicos
  useEffect(() => {
    const fetchReviewed = async () => {
      const years = Object.keys(filteredAuditsByYear);
      if (years.length === 0) return;
      
      const reviewedData = {};
      
      for (const year of years) {
        const uniqueReviewedCount = await countUniqueReviewedObservationsByYear(year);
        reviewedData[year] = uniqueReviewedCount;
        
        console.log(`Año ${year}:`, {
          hallazgosTotales: countUniqueObservationsByYear(year),
          hallazgosRevisadosUnicos: uniqueReviewedCount,
          porcentaje: uniqueReviewedCount > 0 ? 
            ((uniqueReviewedCount / countUniqueObservationsByYear(year)) * 100).toFixed(2) + '%' : 
            '0%'
        });
      }
      
      setReviewedByYear(reviewedData);
    };

    fetchReviewed();
  }, [JSON.stringify(filteredAuditsByYear)]);

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
        return '#FF6384';
      case 'M':
        return '#FFA500';
      case 'm':
        return '#FFCE56';
      case 'Conforme':
        return '#4BC0C0';
      default:
        return '#36A2EB';
    }
  };

  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
    'julio', 'agusto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const hasData = audits.length > 0;

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

  // Convert audit data to Nivo format
  const prepareAuditsBarData = (year) => {
    const data = Object.keys(auditsByMonthAndYear[year]).map(month => {
      const monthlyAverage = parseFloat(calculateAverage(auditsByMonthAndYear[year][month]));
      return {
        month,
        "Porcentaje Total": monthlyAverage
      };
    });
    // Add average entry
    data.push({
      month: 'Promedio',
      "Porcentaje Total": parseFloat(averageByYear[year])
    });
    return data;
  };

  // Convert criteria data to Nivo format
  const prepareCriteriaData = (year) => {
    return Object.entries(criteriaCountByYear[year].criteriaCount).map(([id, value]) => ({
      id,
      label: id,
      value,
      color: getColorForCriteria(id)
    }));
  };

  // Convert monthly data to line chart format
  const prepareMonthlyLineData = (year) => {
    return [
      {
        id: "Porcentaje Mensual",
        color: "hsl(211, 70%, 50%)",
        data: Object.keys(auditsByMonthAndYear[year])
          .filter(month => month !== 'Promedio')
          .map(month => ({
            x: month,
            y: parseFloat(calculateAverage(auditsByMonthAndYear[year][month]))
          }))
      }
    ];
  };

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
            const imgWidth = pdfWidth - 20;
            const imgHeight = (imgWidth / canvas.width) * canvas.height;

            if (position + imgHeight > pdfHeight - 20) {
                pdf.addPage();
                position = 10;
            }

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            position += imgHeight + 10;
        });

        pdf.save('audits.pdf');
    });
  };

  return (
    <div className="audits-container">
      <h2 className="audits-title">Auditorías Finalizadas</h2>
      <div id="print-content">
        <div className="dropdown">
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
        
        <div className="visualization-controls">
          <button 
            onClick={() => toggleVisualization('bar')} 
            className={activeVisualization === 'bar' ? 'active' : ''}
          >
            Gráfico de Barras
          </button>

          <button 
            onClick={() => toggleVisualization('line')} 
            className={activeVisualization === 'line' ? 'active' : ''}
          >
            Gráfico de Línea
          </button>
         
          <button 
            onClick={() => toggleVisualization('both')} 
            className={activeVisualization === 'both' ? 'active' : ''}
          >
            Ambos
          </button>
          <button onClick={handlePrint} className="print-button">Guardar en PDF</button>
          <button onClick={toggleMenu} className="dropdown-togglede">
            Seleccionar Meses
          </button>
        </div>

        {Object.keys(filteredAuditsByYear).map(year => (
          <div key={year} className="year-container">
            <h3 className="year-title">Año: {year}</h3>
            <div className="table-chart-container-audits">
              <div className="section">
                <h3 className="section-title">Auditorías Realizadas en el año</h3>
                <div className="table-responsive">
                  <table className="professional-table">
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
                          <tr key={month} className={monthIndex % 2 === 0 ? 'even-row' : 'odd-row'}>
                            <td className="month-cell">{month}</td>
                            <td>{auditTypes}</td>
                            <td className="percentage-cell">{monthAverage}%</td>
                            {monthIndex === 0 && (
                              <td rowSpan={Object.keys(auditsByMonthAndYear[year]).length + 1} className="average-cell">
                                {averageByYear[year]}%
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      <tr className="summary-row">
                        <td colSpan="3"><strong>Promedio</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="combined-charts-container">
                  {activeVisualization === 'both' && (
                    <div className="chart-container-audits" style={{ height: 400, width: '100%' }}>
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                          <ResponsiveBar
                            data={prepareAuditsBarData(year)}
                            keys={["Porcentaje Total"]}
                            indexBy="month"
                            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={{ scheme: 'nivo' }}
                            defs={[
                              {
                                id: 'gradient',
                                type: 'linearGradient',
                                colors: [
                                  { offset: 0, color: '#36A2EB' },
                                  { offset: 100, color: '#4BC0C0' }
                                ]
                              }
                            ]}
                            fill={[{ match: { id: 'Porcentaje Total' }, id: 'gradient' }]}
                            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: -45,
                              legend: 'Mes',
                              legendPosition: 'middle',
                              legendOffset: 40
                            }}
                            axisLeft={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0,
                              legend: 'Porcentaje',
                              legendPosition: 'middle',
                              legendOffset: -40
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            legends={[
                              {
                                dataFrom: 'keys',
                                anchor: 'bottom-right',
                                direction: 'column',
                                justify: false,
                                translateX: 120,
                                translateY: 0,
                                itemsSpacing: 2,
                                itemWidth: 100,
                                itemHeight: 20,
                                itemDirection: 'left-to-right',
                                itemOpacity: 0.85,
                                symbolSize: 20,
                                symbolShape: 'square',
                                effects: [
                                  {
                                    on: 'hover',
                                    style: {
                                      itemOpacity: 1
                                    }
                                  }
                                ]
                              }
                            ]}
                            role="application"
                            ariaLabel="Auditorías por mes"
                            barAriaLabel={e => e.id + ": " + e.formattedValue + " en mes: " + e.indexValue}
                          />
                        </div>
                        
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
                          <ResponsiveLine
                            data={prepareMonthlyLineData(year)}
                            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{
                              type: 'linear',
                              min: 0,
                              max: 100,
                              stacked: false,
                              reverse: false
                            }}
                            yFormat=" >-.2f"
                            curve="cardinal"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={null}
                            axisLeft={null}
                            enableGridX={false}
                            enableGridY={false}
                            pointSize={10}
                            pointColor="#FF6384"
                            pointBorderWidth={2}
                            pointBorderColor="#FF6384"
                            lineWidth={3}
                            colors={["#FF6384"]}
                            enableSlices="x"
                            useMesh={true}
                            legends={[
                              {
                                anchor: 'bottom-right',
                                direction: 'column',
                                justify: false,
                                translateX: 120,
                                translateY: 40,
                                itemsSpacing: 2,
                                itemWidth: 100,
                                itemHeight: 20,
                                itemDirection: 'left-to-right',
                                itemOpacity: 0.85,
                                symbolSize: 20,
                                symbolShape: 'circle',
                                effects: [
                                  {
                                    on: 'hover',
                                    style: {
                                      itemOpacity: 1
                                    }
                                  }
                                ]
                              }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeVisualization === 'bar' && (
                    <div className="chart-container-audits" style={{ height: 400, width: '100%' }}>
                      <ResponsiveBar
                        data={prepareAuditsBarData(year)}
                        keys={["Porcentaje Total"]}
                        indexBy="month"
                        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                        padding={0.3}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={{ scheme: 'nivo' }}
                        defs={[
                          {
                            id: 'dots',
                            type: 'patternDots',
                            background: 'inherit',
                            color: '#38bcb2',
                            size: 4,
                            padding: 1,
                            stagger: true
                          },
                          {
                            id: 'gradient',
                            type: 'linearGradient',
                            colors: [
                              { offset: 0, color: '#36A2EB' },
                              { offset: 100, color: '#4BC0C0' }
                            ]
                          }
                        ]}
                        fill={[{ match: { id: 'Porcentaje Total' }, id: 'gradient' }]}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          legend: 'Mes',
                          legendPosition: 'middle',
                          legendOffset: 40
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Porcentaje',
                          legendPosition: 'middle',
                          legendOffset: -40
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        legends={[
                          {
                            dataFrom: 'keys',
                            anchor: 'bottom-right',
                            direction: 'column',
                            justify: false,
                            translateX: 120,
                            translateY: 0,
                            itemsSpacing: 2,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: 'left-to-right',
                            itemOpacity: 0.85,
                            symbolSize: 20,
                            effects: [
                              {
                                on: 'hover',
                                style: {
                                  itemOpacity: 1
                                }
                              }
                            ]
                          }
                        ]}
                        role="application"
                        ariaLabel="Auditorías por mes"
                        barAriaLabel={e => e.id + ": " + e.formattedValue + " en mes: " + e.indexValue}
                      />
                    </div>
                  )}
                  
                  {activeVisualization === 'line' && (
                    <div className="chart-container-audits" style={{ height: 400, width: '100%' }}>
                      <ResponsiveLine
                        data={prepareMonthlyLineData(year)}
                        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                        xScale={{ type: 'point' }}
                        yScale={{
                          type: 'linear',
                          min: 0,
                          max: 100,
                          stacked: false,
                          reverse: false
                        }}
                        yFormat=" >-.2f"
                        curve="cardinal"
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          legend: 'Mes',
                          legendOffset: 40,
                          legendPosition: 'middle'
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Porcentaje',
                          legendOffset: -40,
                          legendPosition: 'middle'
                        }}
                        colors={{ scheme: 'category10' }}
                        pointSize={10}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        legends={[
                          {
                            anchor: 'bottom-right',
                            direction: 'column',
                            justify: false,
                            translateX: 100,
                            translateY: 0,
                            itemsSpacing: 0,
                            itemDirection: 'left-to-right',
                            itemWidth: 80,
                            itemHeight: 20,
                            itemOpacity: 0.75,
                            symbolSize: 12,
                            symbolShape: 'circle',
                            symbolBorderColor: 'rgba(0, 0, 0, .5)',
                            effects: [
                              {
                                on: 'hover',
                                style: {
                                  itemBackground: 'rgba(0, 0, 0, .03)',
                                  itemOpacity: 1
                                }
                              }
                            ]
                          }
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="section">
                <h4 className="section-title">Cantidad de Auditorías por Tipo</h4>
                <div className="table-responsive">
                  <table className="professional-table audit-type-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(auditTypeCountByYear[year].auditTypeCount).map(([tipo, cantidad], index) => {
                        const audit = filteredAuditsByYear[year].find(a => a.TipoAuditoria === tipo);
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                            <td>{tipo}</td>
                            <td className="count-cell">{cantidad}</td>
                            <td className={`status-cell status-${audit?.Estado?.toLowerCase()}`}>{audit?.Estado}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="chart-container-audits" style={{ height: 400 }}>
                  <ResponsiveBar
                    data={Object.entries(auditTypeCountByYear[year].auditTypeCount).map(([tipo, cantidad]) => ({
                      tipo,
                      cantidad
                    }))}
                    keys={['cantidad']}
                    indexBy="tipo"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    layout="vertical"
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'category10' }}
                    defs={[
                      {
                        id: 'gradientA',
                        type: 'linearGradient',
                        colors: [
                          { offset: 0, color: '#FF6384' },
                          { offset: 100, color: '#FF9F40' }
                        ]
                      }
                    ]}
                    fill={[{ match: '*', id: 'gradientA' }]}
                    borderRadius={4}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Tipo de Auditoría',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
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
                      <td>{countUniqueObservationsByYear(year)}</td>
                      <td>100%</td>
                    </tr>
                    <tr>
                      <td>Hallazgos Revisados</td>
                      <td>{reviewedByYear[year] ?? '...'}</td>
                      <td>{countUniqueObservationsByYear(year) > 0 ? 
                          (((reviewedByYear[year] ?? 0) / countUniqueObservationsByYear(year)) * 100).toFixed(2) + '%' : 
                          '0%'}</td>
                    </tr>
                    <tr>
                      <td>Hallazgos Faltantes</td>
                      <td>{Math.max(0, countUniqueObservationsByYear(year) - (reviewedByYear[year] ?? 0))}</td>
                      <td>{countUniqueObservationsByYear(year) > 0 ? 
                          ((Math.max(0, countUniqueObservationsByYear(year) - (reviewedByYear[year] ?? 0)) / countUniqueObservationsByYear(year) * 100).toFixed(2) + '%') :
                          '0%'}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="chart-container-audits" style={{ height: 300 }}>
                  <ResponsiveBar
                    data={[
                      { 
                        id: 'Hallazgos Faltantes', 
                        value: Math.max(0, countUniqueObservationsByYear(year) - (reviewedByYear[year] ?? 0)), 
                        color: '#FF9F40' 
                      },
                      { 
                        id: 'Hallazgos Revisadas', 
                        value: reviewedByYear[year] ?? 0, 
                        color: '#9966FF' 
                      },
                      { 
                        id: 'Hallazgos Totales', 
                        value: countUniqueObservationsByYear(year), 
                        color: '#4BC0C0' 
                      }
                    ]}
                    keys={['value']}
                    indexBy="id"
                    margin={{ top: 50, right: 50, bottom: 50, left: 170 }}
                    padding={0.3}
                    layout="horizontal"
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'category10' }}
                    colorBy="indexValue"
                    borderRadius={4}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Categoría',
                      legendPosition: 'middle',
                      legendOffset: -140
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor="#ffffff"
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
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
                <div className="bar-chart-container-audits" style={{ height: 400 }}>
                  <ResponsiveBar
                    data={prepareCriteriaData(year)}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#ffffff"
                    defs={[
                      {
                        id: 'dots',
                        type: 'patternDots',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        size: 4,
                        padding: 1,
                        stagger: true
                      },
                      {
                        id: 'lines',
                        type: 'patternLines',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10
                      }
                    ]}
                    fill={[
                      { match: { id: 'C' }, id: 'dots' },
                      { match: { id: 'M' }, id: 'lines' },
                      { match: { id: 'm' }, id: 'dots' }
                    ]}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemTextColor: '#000'
                            }
                          }
                        ]
                      }
                    ]}
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
