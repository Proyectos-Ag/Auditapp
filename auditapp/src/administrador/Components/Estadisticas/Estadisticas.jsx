import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './css/Estadisticas.css';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { Api } from '@mui/icons-material';

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
  const [aprobadosByYear, setAprobadosByYear] = useState({});

  // useEffect inicial corregido
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/datos');
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
              ['M', 'C', 'm', 'O'].includes(desc.Criterio)
            )
          )
        );
        setObservations(observationsData);

        // CORRECCIÓN: Usar idRep consistentemente
        const ishikawaResponse = await api.get('/ishikawa');
        const reviewedObservationsData = ishikawaResponse.data.filter(
          ishikawa => 
            (ishikawa.estado === 'Revisado' || 
             ishikawa.estado === 'Aprobado' || 
             ishikawa.estado === 'Rechazados' || 
             ishikawa.estado === 'Pendiente') &&
            filteredAudits.map(audit => audit._id).includes(ishikawa.idRep)
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

  // Función de debug para ver hallazgos detallados
  const debugHallazgosByYear = (year) => {
    const yearAudits = filteredAuditsByYear[year] || [];
    const hallazgosDetallados = [];
    
    yearAudits.forEach(audit => {
      audit.Programa.forEach(program => {
        program.Descripcion.forEach(desc => {
          if (['C', 'M', 'm', 'O'].includes(desc.Criterio)) {
            hallazgosDetallados.push({
              auditId: audit._id,
              programaNombre: program.Nombre,
              requisito: desc.Requisito,
              criterio: desc.Criterio,
              observacion: desc.Observacion,
              hallazgo: desc.Hallazgo
            });
          }
        });
      });
    });
    
    console.log(`Hallazgos detallados año ${year}:`, hallazgosDetallados);
    console.log(`Total hallazgos calculados: ${hallazgosDetallados.length}`);
    
    return hallazgosDetallados;
  };

  // Función corregida para contar observaciones por año
  const countObservationsByYear = (year) => {
    const yearAudits = filteredAuditsByYear[year] || [];
    const hallazgosDetallados = debugHallazgosByYear(year);
    return hallazgosDetallados.length;
  };

  // useEffect corregido para calcular hallazgos revisados por año
  useEffect(() => {
    const fetchReviewed = async () => {
      const years = Object.keys(filteredAuditsByYear);
      if (years.length === 0) return;

      const reviewedData = {};
      const aprobadosData = {};

      for (const year of years) {
        const yearAudits = filteredAuditsByYear[year] || [];
        const yearAuditIds = yearAudits.map(audit => audit._id);

        try {
          const ishikawaResponse = await api.get('/ishikawa');

          // Solo los que están actualmente en estado 'Aprobado'
          const aprobados = ishikawaResponse.data.filter(
            ishikawa =>
              ishikawa.estado === 'Aprobado' &&
              yearAuditIds.includes(ishikawa.idRep)
          );
          aprobadosData[year] = aprobados.length;

          // Solo los que están actualmente en estado 'Revisado'
          const revisados = ishikawaResponse.data.filter(
            ishikawa =>
              ishikawa.estado === 'Revisado' &&
              yearAuditIds.includes(ishikawa.idRep)
          );
          reviewedData[year] = revisados.length;

        } catch (error) {
          console.error('Error fetching ishikawa data:', error);
          reviewedData[year] = 0;
          aprobadosData[year] = 0;
        }
      }

      setReviewedByYear(reviewedData);
      setAprobadosByYear(aprobadosData);
    };

    fetchReviewed();
  }, [JSON.stringify(filteredAuditsByYear)]);

  const criteriaCountByYear = Object.keys(filteredAuditsByYear).reduce((acc, year) => {
    const criteriaCount = filteredAuditsByYear[year].reduce((countAcc, audit) => {
      audit.Programa.forEach(program => {
        program.Descripcion.forEach(desc => {
          if (['C', 'M', 'm','O'].includes(desc.Criterio)) {
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

  // Agrupar por TipoAuditoria y Cliente
  const auditTypeClientCountByYear = Object.keys(filteredAuditsByYear).reduce((acc, year) => {
    const auditTypeClientCount = {};
    filteredAuditsByYear[year].forEach(audit => {
      const key = `${audit.TipoAuditoria} - ${audit.Cliente || 'Sin Cliente'}`;
      if (!auditTypeClientCount[key]) {
        auditTypeClientCount[key] = { cantidad: 0, estado: audit.Estado };
      }
      auditTypeClientCount[key].cantidad++;
      auditTypeClientCount[key].estado = audit.Estado;
    });
    acc[year] = auditTypeClientCount;
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
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
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
    const monthsInYear = Object.keys(auditsByMonthAndYear[year] || {});
    if (monthsInYear.length === 0) return [];
    
    return [
      {
        id: "Porcentaje Mensual",
        color: "#FF5252",
        data: monthsInYear
          .filter(month => month !== 'Promedio')
          .map(month => ({
            x: month,
            y: parseFloat(calculateAverage(auditsByMonthAndYear[year][month])) || 0
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

  // ORDENAR AÑOS DE FORMA DESCENDENTE (2025 primero, luego 2024, etc.)
  const sortedYears = Object.keys(filteredAuditsByYear).sort((a, b) => b - a);

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

        {sortedYears.map(year => (
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
                    <div className="chart-container-audits" style={{ height: 450, width: '100%' }}>
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                          <ResponsiveBar
                            data={prepareAuditsBarData(year)}
                            keys={["Porcentaje Total"]}
                            indexBy="month"
                            margin={{ top: 60, right: 140, bottom: 80, left: 80 }}
                            padding={0.35}
                            valueScale={{ type: 'linear', min: 0, max: 100 }}
                            indexScale={{ type: 'band', round: true }}
                            colors={['#4FC3F7']}
                            defs={[
                              {
                                id: 'gradient',
                                type: 'linearGradient',
                                colors: [
                                  { offset: 0, color: '#2196F3' },
                                  { offset: 100, color: '#4FC3F7' }
                                ]
                              }
                            ]}
                            fill={[{ match: { id: 'Porcentaje Total' }, id: 'gradient' }]}
                            borderRadius={6}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                              tickSize: 8,
                              tickPadding: 8,
                              tickRotation: -45,
                              legend: 'Mes',
                              legendPosition: 'middle',
                              legendOffset: 65,
                              renderTick: (tick) => (
                                <g transform={`translate(${tick.x},${tick.y})`}>
                                  <text
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    transform="rotate(-45)"
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 500,
                                      fill: '#334155'
                                    }}
                                  >
                                    {tick.value}
                                  </text>
                                </g>
                              )
                            }}
                            axisLeft={{
                              tickSize: 8,
                              tickPadding: 10,
                              tickRotation: 0,
                              legend: 'Porcentaje',
                              legendPosition: 'middle',
                              legendOffset: -60,
                              format: value => `${value}%`
                            }}
                            enableLabel={true}
                            label={d => `${d.value.toFixed(1)}%`}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor="#ffffff"
                            animate={true}
                            motionConfig="gentle"
                            theme={{
                              axis: {
                                ticks: {
                                  text: {
                                    fontSize: 13,
                                    fill: '#475569',
                                    fontWeight: 500
                                  }
                                },
                                legend: {
                                  text: {
                                    fontSize: 14,
                                    fill: '#1e293b',
                                    fontWeight: 600
                                  }
                                }
                              },
                              grid: {
                                line: {
                                  stroke: '#e2e8f0',
                                  strokeWidth: 1
                                }
                              }
                            }}
                            legends={[
                              {
                                dataFrom: 'keys',
                                anchor: 'top-right',
                                direction: 'column',
                                justify: false,
                                translateX: 120,
                                translateY: -40,
                                itemsSpacing: 4,
                                itemWidth: 100,
                                itemHeight: 24,
                                itemDirection: 'left-to-right',
                                itemOpacity: 0.9,
                                symbolSize: 16,
                                symbolShape: 'circle',
                                effects: [
                                  {
                                    on: 'hover',
                                    style: {
                                      itemOpacity: 1,
                                      itemTextColor: '#000'
                                    }
                                  }
                                ]
                              }
                            ]}
                            role="application"
                            ariaLabel="Auditorías por mes"
                          />
                        </div>
                        
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
                          <ResponsiveLine
                            data={prepareMonthlyLineData(year)}
                            margin={{ top: 60, right: 140, bottom: 80, left: 80 }}
                            xScale={{ type: 'point' }}
                            yScale={{
                              type: 'linear',
                              min: 0,
                              max: 100,
                              stacked: false,
                              reverse: false
                            }}
                            yFormat=" >-.2f"
                            curve="catmullRom"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={null}
                            axisLeft={null}
                            enableGridX={false}
                            enableGridY={false}
                            pointSize={12}
                            pointColor="#FF5252"
                            pointBorderWidth={3}
                            pointBorderColor="#ffffff"
                            lineWidth={4}
                            colors={["#FF5252"]}
                            enableArea={false}
                            areaOpacity={0.1}
                            enableSlices={false}
                            useMesh={false}
                            isInteractive={false}
                            animate={true}
                            motionConfig="gentle"
                            legends={[
                              {
                                anchor: 'top-right',
                                direction: 'column',
                                justify: false,
                                translateX: 120,
                                translateY: 0,
                                itemsSpacing: 4,
                                itemWidth: 100,
                                itemHeight: 24,
                                itemDirection: 'left-to-right',
                                itemOpacity: 0.9,
                                symbolSize: 16,
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
                    <div className="chart-container-audits" style={{ height: 450, width: '100%' }}>
                      <ResponsiveBar
                        data={prepareAuditsBarData(year)}
                        keys={["Porcentaje Total"]}
                        indexBy="month"
                        margin={{ top: 60, right: 140, bottom: 80, left: 80 }}
                        padding={0.35}
                        valueScale={{ type: 'linear', min: 0, max: 100 }}
                        indexScale={{ type: 'band', round: true }}
                        colors={['#4FC3F7']}
                        defs={[
                          {
                            id: 'gradient',
                            type: 'linearGradient',
                            colors: [
                              { offset: 0, color: '#2196F3' },
                              { offset: 100, color: '#4FC3F7' }
                            ]
                          }
                        ]}
                        fill={[{ match: { id: 'Porcentaje Total' }, id: 'gradient' }]}
                        borderRadius={6}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                          tickSize: 8,
                          tickPadding: 8,
                          tickRotation: -45,
                          legend: 'Mes',
                          legendPosition: 'middle',
                          legendOffset: 65
                        }}
                        axisLeft={{
                          tickSize: 8,
                          tickPadding: 10,
                          tickRotation: 0,
                          legend: 'Porcentaje',
                          legendPosition: 'middle',
                          legendOffset: -60,
                          format: value => `${value}%`
                        }}
                        enableLabel={true}
                        label={d => `${d.value.toFixed(1)}%`}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor="#ffffff"
                        animate={true}
                        motionConfig="gentle"
                        theme={{
                          axis: {
                            ticks: {
                              text: {
                                fontSize: 13,
                                fill: '#475569',
                                fontWeight: 500
                              }
                            },
                            legend: {
                              text: {
                                fontSize: 14,
                                fill: '#1e293b',
                                fontWeight: 600
                              }
                            }
                          },
                          grid: {
                            line: {
                              stroke: '#e2e8f0',
                              strokeWidth: 1
                            }
                          },
                          crosshair: {
                            line: {
                              stroke: '#FF5252',
                              strokeWidth: 2,
                              strokeOpacity: 0.5
                            }
                          }
                        }}
                        legends={[
                          {
                            anchor: 'top-right',
                            direction: 'column',
                            justify: false,
                            translateX: 120,
                            translateY: -40,
                            itemsSpacing: 4,
                            itemWidth: 100,
                            itemHeight: 24,
                            itemDirection: 'left-to-right',
                            itemOpacity: 0.9,
                            symbolSize: 16,
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
                  )}
                </div>
              </div>
              
              <div className="section">
                <h4 className="section-title">Cantidad de Auditorías por Tipo</h4>
                <div className="table-responsive">
                  <table className="professional-table audit-type-table">
                    <thead>
                      <tr>
                        <th>Tipo / Cliente</th>
                        <th>Cantidad</th>
                        <th>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(auditTypeClientCountByYear[year]).map(([key, data], index) => (
                        <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                          <td>{key}</td>
                          <td className="count-cell">{data.cantidad}</td>
                          <td className={`status-cell status-${data.estado?.toLowerCase()}`}>{data.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="chart-container-audits" style={{ height: 450 }}>
                  <ResponsiveBar
                    data={Object.entries(auditTypeClientCountByYear[year]).map(([key, data]) => ({
                      tipo_cliente: key,
                      cantidad: data.cantidad
                    }))}
                    keys={['cantidad']}
                    indexBy="tipo_cliente"
                    margin={{ top: 60, right: 140, bottom: 120, left: 80 }}
                    padding={0.4}
                    layout="vertical"
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={['#26C6DA']}
                    defs={[
                      {
                        id: 'gradientA',
                        type: 'linearGradient',
                        colors: [
                          { offset: 0, color: '#00ACC1' },
                          { offset: 100, color: '#26C6DA' }
                        ]
                      }
                    ]}
                    fill={[{ match: '*', id: 'gradientA' }]}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 0,
                      tickPadding: 15,
                      tickRotation: -35,
                      legend: '',
                      legendPosition: 'middle',
                      legendOffset: 100,
                      renderTick: (tick) => {
                        const maxLength = 20;
                        const text = tick.value.length > maxLength 
                          ? tick.value.substring(0, maxLength) + '...' 
                          : tick.value;
                        
                        return (
                          <g transform={`translate(${tick.x},${tick.y + 10})`}>
                            <text
                              textAnchor="end"
                              dominantBaseline="middle"
                              transform="rotate(-35)"
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                fill: '#475569'
                              }}
                            >
                              {text}
                            </text>
                          </g>
                        );
                      }
                    }}
                    axisLeft={{
                      tickSize: 8,
                      tickPadding: 10,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendPosition: 'middle',
                      legendOffset: -60
                    }}
                    enableLabel={true}
                    label={d => d.value}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor="#ffffff"
                    animate={true}
                    motionConfig="gentle"
                    tooltip={({ id, value, color, indexValue }) => (
                      <div
                        style={{
                          background: 'white',
                          padding: '12px 16px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          maxWidth: '300px'
                        }}
                      >
                        <div style={{ 
                          color: '#1e293b', 
                          fontWeight: 600, 
                          marginBottom: '6px',
                          wordWrap: 'break-word'
                        }}>
                          {indexValue}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: '#475569'
                        }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: color,
                              marginRight: '8px'
                            }}
                          />
                          <span><strong>Cantidad:</strong> {value}</span>
                        </div>
                      </div>
                    )}
                    theme={{
                      axis: {
                        ticks: {
                          text: {
                            fontSize: 12,
                            fill: '#475569',
                            fontWeight: 500
                          }
                        },
                        legend: {
                          text: {
                            fontSize: 14,
                            fill: '#1e293b',
                            fontWeight: 600
                          }
                        }
                      },
                      grid: {
                        line: {
                          stroke: '#e2e8f0',
                          strokeWidth: 1
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="section">
                <h3>Total de hallazgos de las auditorías</h3>
                <table className="professional-table">
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
                      <td>{countObservationsByYear(year)}</td>
                      <td>100%</td>
                    </tr>
                    <tr>
                      <td>Hallazgos Abiertos</td>
                      <td>{aprobadosByYear[year] ?? 0}</td>
                      <td>{countObservationsByYear(year) > 0 ? (((aprobadosByYear[year] ?? 0) / countObservationsByYear(year)) * 100).toFixed(2) + '%' : '0%'}</td>
                    </tr>
                    <tr>
                      <td>Hallazgos Cerrados</td>
                      <td>{reviewedByYear[year] ?? 0}</td>
                      <td>{countObservationsByYear(year) > 0 ? (((reviewedByYear[year] ?? 0) / countObservationsByYear(year)) * 100).toFixed(2) + '%' : '0%'}</td>
                    </tr>
                    <tr>
                      <td>Hallazgos Faltantes</td>
                      <td>{Math.max(0, countObservationsByYear(year) - ((aprobadosByYear[year] ?? 0) + (reviewedByYear[year] ?? 0)) )}</td>
                      <td>{countObservationsByYear(year) > 0 ? ((Math.max(0, countObservationsByYear(year) - ((aprobadosByYear[year] ?? 0) + (reviewedByYear[year] ?? 0)) ) / countObservationsByYear(year) * 100).toFixed(2) + '%') : '0%'}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="chart-container-audits" style={{ height: 400 }}>
                  <ResponsiveBar
                    data={[
                      { 
                        categoria: 'Hallazgos Totales', 
                        cantidad: countObservationsByYear(year), 
                        color: '#64B5F6' 
                      },
                      { 
                        categoria: 'Hallazgos Abiertos', 
                        cantidad: aprobadosByYear[year] ?? 0, 
                        color: '#4CAF50' 
                      },
                      { 
                        categoria: 'Hallazgos Cerrados', 
                        cantidad: reviewedByYear[year] ?? 0, 
                        color: '#AB47BC' 
                      },
                      { 
                        categoria: 'Hallazgos Pendientes', 
                        cantidad: Math.max(0, countObservationsByYear(year) - ((aprobadosByYear[year] ?? 0) + (reviewedByYear[year] ?? 0)) ), 
                        color: '#FF7043' 
                      }
                    ]}
                    keys={['cantidad']}
                    indexBy="categoria"
                    margin={{ top: 60, right: 60, bottom: 80, left: 200 }}
                    padding={0.35}
                    layout="horizontal"
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={d => d.data.color}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 8,
                      tickPadding: 8,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 8,
                      tickPadding: 10,
                      tickRotation: 0,
                      legend: 'Categoría',
                      legendPosition: 'middle',
                      legendOffset: -180
                    }}
                    enableLabel={true}
                    label={d => d.value}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor="#ffffff"
                    animate={true}
                    motionConfig="gentle"
                    theme={{
                      axis: {
                        ticks: {
                          text: {
                            fontSize: 13,
                            fill: '#475569',
                            fontWeight: 500
                          }
                        },
                        legend: {
                          text: {
                            fontSize: 14,
                            fill: '#1e293b',
                            fontWeight: 600
                          }
                        }
                      },
                      grid: {
                        line: {
                          stroke: '#e2e8f0',
                          strokeWidth: 1
                        }
                      }
                    }}
                    tooltip={({ data }) => (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px 16px', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}>
                        <strong style={{ color: '#1e293b' }}>{data.categoria}:</strong> 
                        <span style={{ marginLeft: '8px', color: data.color, fontWeight: 600 }}>{data.cantidad}</span>
                      </div>
                    )}
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
                <div className="bar-chart-container-audits" style={{ height: 450 }}>
                  <ResponsivePie
                    data={prepareCriteriaData(year)}
                    margin={{ top: 60, right: 120, bottom: 80, left: 120 }}
                    innerRadius={0.6}
                    padAngle={1.5}
                    cornerRadius={6}
                    activeOuterRadiusOffset={12}
                    borderWidth={2}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#334155"
                    arcLinkLabelsThickness={3}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#ffffff"
                    colors={{ datum: 'data.color' }}
                    animate={true}
                    motionConfig="gentle"
                    theme={{
                      labels: {
                        text: {
                          fontSize: 14,
                          fontWeight: 600
                        }
                      },
                      legends: {
                        text: {
                          fontSize: 13,
                          fill: '#475569'
                        }
                      }
                    }}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 70,
                        itemsSpacing: 20,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemTextColor: '#334155',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 20,
                        symbolShape: 'circle',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemTextColor: '#000',
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                    tooltip={({ datum }) => (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px 16px', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}>
                        <strong style={{ color: datum.color }}>{datum.id}:</strong> 
                        <span style={{ marginLeft: '8px', color: '#1e293b', fontWeight: 600 }}>{datum.value}</span>
                      </div>
                    )}
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
                       