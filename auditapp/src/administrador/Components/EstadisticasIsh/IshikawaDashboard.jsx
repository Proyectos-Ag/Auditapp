import React, { useEffect, useState } from "react";
import axios from "axios";
import "./css/estadisticas-ish.css";
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const IshikawaDashboard = () => {
  const [totalIshikawas, setTotalIshikawas] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ Aprobado: 0, Rechazados: 0, Finalizados: 0, Incompleto: 0 });
  const [topIssues, setTopIssues] = useState([]);
  const [participantsCounts, setParticipantsCounts] = useState({});
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [menuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
        const data = response.data;
        const filteredIshikawas = data.filter(ishikawa => ishikawa.tipo === "vacio");
        setTotalIshikawas(filteredIshikawas.length);

        const statusCount = {
          Aprobado: filteredIshikawas.filter(ishikawa => ishikawa.estado === "Aprobado").length,
          Rechazados: filteredIshikawas.filter(ishikawa => ishikawa.estado === "Rechazado").length,
          Finalizados: filteredIshikawas.filter(ishikawa => ishikawa.estado === "Finalizado").length,
          Incompleto: filteredIshikawas.filter(ishikawa => ishikawa.estado === "Incompleto").length,
        };
        setStatusCounts(statusCount);

        const problemCounts = {};
        filteredIshikawas.forEach(ishikawa => {
          const problema = ishikawa.problema || "No especificado";
          problemCounts[problema] = (problemCounts[problema] || 0) + 1;
        });

        const sortedProblems = Object.entries(problemCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([problema, count]) => ({ problema, count }));

        setTopIssues(sortedProblems);

        // Nueva lógica mejorada para procesar participantes
        const participantCounts = {};
        
        filteredIshikawas.forEach(ishikawa => {
          if (!ishikawa.participantes) return;
          
          // Primero dividimos por "/"
          const participantGroups = ishikawa.participantes.split("/");
          
          participantGroups.forEach(group => {
            // Luego dividimos por comas para manejar entradas como "Ángel Lino, José Granados, Rubén Cruces"
            const individualParticipants = group.split(",");
            
            individualParticipants.forEach(participant => {
              const trimmed = participant.trim();
              if (trimmed) {
                // Normalizar nombres para evitar duplicados por puntos o variaciones menores
                // Por ejemplo: "Rubén Cruces" y "Rubén Cruces." se considerarán el mismo
                const normalizedName = trimmed.endsWith(".") ? 
                  trimmed.substring(0, trimmed.length - 1) : trimmed;
                
                participantCounts[normalizedName] = (participantCounts[normalizedName] || 0) + 1;
              }
            });
          });
        });

        setParticipantsCounts(participantCounts);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  const handleMonthChange = (month) => {
    setSelectedMonths(prevSelected =>
      prevSelected.includes(month) ? prevSelected.filter(m => m !== month) : [...prevSelected, month]
    );
  };

  const renderTable = (headers, rows) => (
    <table>
      <thead>
        <tr>
          {headers.map(header => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, i) => (
              <td key={i}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Preparación de datos para el gráfico de estados (pie)
  const prepareStatusData = () => {
    return Object.entries(statusCounts).map(([id, value]) => ({
      id,
      label: id,
      value,
      color: getColorForStatus(id)
    }));
  };

  // Preparación de datos para el gráfico de top problemas (bar)
  const prepareTopIssuesData = () => {
    return topIssues.map(issue => ({
      problema: issue.problema.length > 20 ? issue.problema.substring(0, 20) + '...' : issue.problema,
      count: issue.count
    }));
  };

  // Preparación de datos para el gráfico de participantes (bar)
  const prepareParticipantsData = () => {
    return Object.entries(participantsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([participant, count]) => ({
        participante: participant.length > 15 ? participant.substring(0, 15) + '...' : participant,
        count: count
      }));
  };

  const getColorForStatus = (status) => {
    switch (status) {
      case 'Aprobado':
        return '#4CAF50';
      case 'Rechazados':
        return '#FF5722';
      case 'Finalizados':
        return '#FFC107';
      case 'Incompleto':
        return '#FF9800';
      default:
        return '#36A2EB';
    }
  };

  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

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

        pdf.save('ishikawa-dashboard.pdf');
    });
  };

  // Obtener la lista única de participantes ordenada por cantidad (de mayor a menor)
  const getUniqueParticipants = () => {
    return Object.entries(participantsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  return (
    <div className="audits-container">
      <h2>Dashboard de Ishikawas (Tipo Vacío)</h2>
      <button onClick={handlePrint} className="print-button">Guardar en PDF</button>
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
        
        <div className="table-chart-container-audits">
          {/* Total Ishikawas */}
          <div className="section">
            <h3>Total de Ishikawas</h3>
            {renderTable(["Total"], [[totalIshikawas]])}
            <div className="chart-container-audits" style={{ height: 300 }}>
              <ResponsiveBar
                data={[{ id: "Total", value: totalIshikawas }]}
                keys={["value"]}
                indexBy="id"
                margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={["#42A5F5"]}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Total',
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
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
                fill={[{ match: '*', id: 'gradient' }]}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
              />
            </div>
          </div>

          {/* Estados */}
          <div className="section">
            <h3>Cantidad por Estado</h3>
            {renderTable(
              ["Estado", "Cantidad"],
              Object.entries(statusCounts).map(([estado, cantidad]) => [estado, cantidad])
            )}
            <div className="pie-chart-container-audits" style={{ height: 400 }}>
              <ResponsiveBar
                data={prepareStatusData()}
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
                  },
                  {
                    id: 'stripes',
                    type: 'patternLines',
                    background: 'inherit',
                    color: 'rgba(255, 255, 255, 0.3)',
                    rotation: 45,
                    lineWidth: 4,
                    spacing: 8
                  }
                ]}
                fill={[
                  { match: { id: 'Aprobado' }, id: 'dots' },
                  { match: { id: 'Rechazados' }, id: 'lines' },
                  { match: { id: 'Finalizados' }, id: 'dots' },
                  { match: { id: 'Incompleto' }, id: 'stripes' }
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

          {/* Top 10 problemas */}
          <div className="section">
            <h3>Top 10 de Incumplimientos</h3>
            {renderTable(
              ["Problema", "Cantidad"],
              topIssues.map(issue => [issue.problema, issue.count])
            )}
            <div className="chart-container-audits" style={{ height: 400 }}>
              <ResponsiveBar
                data={prepareTopIssuesData()}
                keys={['count']}
                indexBy="problema"
                margin={{ top: 50, right: 50, bottom: 100, left: 170 }}
                padding={0.3}
                layout="horizontal"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={["#FF7043"]}
                colorBy="indexValue"
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
                  tickRotation: 0,
                  legend: 'Cantidad',
                  legendPosition: 'middle',
                  legendOffset: 40
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Problema',
                  legendPosition: 'middle',
                  legendOffset: -150
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

          {/* Participantes */}
          <div className="section">
            <h3>Top 10 Participantes</h3>
            <table>
              <thead>
                <tr>
                  <th>PARTICIPANTE</th>
                  <th>CANTIDAD</th>
                </tr>
              </thead>
              <tbody>
                {getUniqueParticipants().map(([participant, count], index) => (
                  <tr key={index}>
                    <td>{participant}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="chart-container-audits" style={{ height: 400 }}>
              <ResponsiveBar
                data={prepareParticipantsData()}
                keys={['count']}
                indexBy="participante"
                margin={{ top: 50, right: 50, bottom: 70, left: 150 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={["#AB47BC"]}
                defs={[
                  {
                    id: 'gradientB',
                    type: 'linearGradient',
                    colors: [
                      { offset: 0, color: '#9966FF' },
                      { offset: 100, color: '#AB47BC' }
                    ]
                  }
                ]}
                fill={[{ match: '*', id: 'gradientB' }]}
                borderRadius={4}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Participante',
                  legendPosition: 'middle',
                  legendOffset: 50
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
        </div>
      </div>
    </div>
  );
};

export default IshikawaDashboard;
