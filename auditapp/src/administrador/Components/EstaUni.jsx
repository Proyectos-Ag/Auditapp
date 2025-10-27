import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './EstaUsuarios.css';

const EstadisticasPersonas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [ishikawas, setIshikawas] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'year', 'month'

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener usuarios
        const usuariosResponse = await api.get(`/usuarios`);
        setUsuarios(usuariosResponse.data);

        // Obtener auditorías
        const auditoriasResponse = await api.get(`/datos`);
        const filteredAudits = auditoriasResponse.data.filter(audit => 
          ['Finalizado', 'Terminada', 'Realizada', 'Devuelto'].includes(audit.Estado)
        );
        setAuditorias(filteredAudits);

        // Obtener ishikawa
        const ishikawaResponse = await api.get(`/ishikawa`);
        setIshikawas(ishikawaResponse.data);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Calcular estadísticas del usuario seleccionado
  useEffect(() => {
    if (!selectedUser) return;

    const calculateUserStats = () => {
      const user = usuarios.find(u => u._id === selectedUser);
      if (!user) return;

      const userEmail = user.Correo;
      const userName = user.Nombre;

      // Auditorías como Auditor Líder
      const auditoriasComoLider = auditorias.filter(audit => 
        audit.AuditorLiderEmail === userEmail
      );

      // Auditorías como miembro del equipo
      const auditoriasComoMiembro = auditorias.filter(audit => 
        audit.EquipoAuditor?.some(miembro => miembro.Correo === userEmail)
      );

      // Auditorías como auditado
      const auditoriasComoAuditado = auditorias.filter(audit => 
        audit.Auditados?.some(auditado => auditado.Correo === userEmail)
      );

      // Ishikawas donde participa
      const ishikawasParticipados = ishikawas.filter(ishikawa => {
        if (!ishikawa.participantes) return false;
        
        const participantGroups = ishikawa.participantes.split("/");
        return participantGroups.some(group => {
          const individualParticipants = group.split(",");
          return individualParticipants.some(participant => 
            participant.trim().toLowerCase().includes(userName.toLowerCase())
          );
        });
      });

      // Ishikawas aprobados/revisados
      const ishikawasAprobados = ishikawasParticipados.filter(i => i.estado === 'Aprobado');
      const ishikawasRevisados = ishikawasParticipados.filter(i => i.estado === 'Revisado');

      // Calcular eficiencia en auditorías
      const totalAuditorias = auditoriasComoLider.length + auditoriasComoMiembro.length;
      const auditoriasCompletadas = auditoriasComoLider.filter(a => 
        ['Finalizado', 'Terminada'].includes(a.Estado)
      ).length;

      const eficienciaAuditorias = totalAuditorias > 0 ? 
        (auditoriasCompletadas / totalAuditorias) * 100 : 0;

      // Calcular eficiencia en ishikawas
      const eficienciaIshikawas = ishikawasParticipados.length > 0 ? 
        ((ishikawasAprobados.length + ishikawasRevisados.length) / ishikawasParticipados.length) * 100 : 0;

      // Promedio de porcentaje en auditorías como líder
      const porcentajesAuditorias = auditoriasComoLider
        .map(a => parseFloat(a.PorcentajeTotal) || 0)
        .filter(p => p > 0);
      
      const promedioPorcentaje = porcentajesAuditorias.length > 0 ? 
        porcentajesAuditorias.reduce((a, b) => a + b, 0) / porcentajesAuditorias.length : 0;

      // Estadísticas por mes/año
      const statsByTime = calculateTimeBasedStats(auditoriasComoLider, ishikawasParticipados);

      setUserStats({
        userInfo: user,
        auditorias: {
          comoLider: auditoriasComoLider.length,
          comoMiembro: auditoriasComoMiembro.length,
          comoAuditado: auditoriasComoAuditado.length,
          total: totalAuditorias,
          completadas: auditoriasCompletadas,
          eficiencia: eficienciaAuditorias,
          promedioPorcentaje: promedioPorcentaje
        },
        ishikawas: {
          total: ishikawasParticipados.length,
          aprobados: ishikawasAprobados.length,
          revisados: ishikawasRevisados.length,
          eficiencia: eficienciaIshikawas
        },
        tiempo: statsByTime,
        eficienciaGeneral: (eficienciaAuditorias + eficienciaIshikawas) / 2
      });
    };

    calculateUserStats();
  }, [selectedUser, usuarios, auditorias, ishikawas]);

  const calculateTimeBasedStats = (auditoriasLider, ishikawasParticipados) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const auditoriasEsteAnio = auditoriasLider.filter(audit => {
      const auditYear = new Date(audit.FechaInicio).getFullYear();
      return auditYear === currentYear;
    });

    const auditoriasEsteMes = auditoriasEsteAnio.filter(audit => {
      const auditMonth = new Date(audit.FechaInicio).getMonth();
      return auditMonth === currentMonth;
    });

    const ishikawasEsteAnio = ishikawasParticipados.filter(ishikawa => {
      const ishikawaYear = new Date(ishikawa.fechaCreacion || ishikawa.createdAt).getFullYear();
      return ishikawaYear === currentYear;
    });

    return {
      auditoriasEsteAnio: auditoriasEsteAnio.length,
      auditoriasEsteMes: auditoriasEsteMes.length,
      ishikawasEsteAnio: ishikawasEsteAnio.length
    };
  };

  const prepareAuditTimelineData = () => {
    if (!userStats) return [];
    
    const monthlyData = {};
    userStats.auditorias.comoLiderAuditorias.forEach(audit => {
      const month = new Date(audit.FechaInicio).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month]++;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      mes: month,
      auditorias: count
    }));
  };

  const prepareEfficiencyData = () => {
    if (!userStats) return [];
    
    return [
      {
        "categoria": "Eficiencia Auditorías",
        "porcentaje": userStats.auditorias.eficiencia
      },
      {
        "categoria": "Eficiencia Ishikawas",
        "porcentaje": userStats.ishikawas.eficiencia
      },
      {
        "categoria": "Promedio Cumplimiento",
        "porcentaje": userStats.auditorias.promedioPorcentaje
      }
    ];
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-content-personas');
    html2canvas(printContent, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`estadisticas-${userStats.userInfo.Nombre}.pdf`);
    });
  };

  return (
    <div className="estadisticas-personas-container">
      <h2>Estadísticas por Persona</h2>
      
      <div className="controls-container">
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          className="user-select"
        >
          <option value="">Seleccionar usuario</option>
          {usuarios.map(usuario => (
            <option key={usuario._id} value={usuario._id}>
              {usuario.Nombre} - {usuario.Puesto}
            </option>
          ))}
        </select>

        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-select"
        >
          <option value="all">Todo el tiempo</option>
          <option value="year">Este año</option>
          <option value="month">Este mes</option>
        </select>

        <button onClick={handlePrint} className="print-button">
          Guardar en PDF
        </button>
      </div>

      {userStats && (
        <div id="print-content-personas">
          {/* Header con información del usuario */}
          <div className="user-header section">
            <div className="user-info">
              <h3>{userStats.userInfo.Nombre}</h3>
              <p><strong>Puesto:</strong> {userStats.userInfo.Puesto}</p>
              <p><strong>Correo:</strong> {userStats.userInfo.Correo}</p>
              <div className="efficiency-badge">
                Eficiencia General: {userStats.eficienciaGeneral.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Resumen general */}
          <div className="summary-cards section">
            <div className="stat-card">
              <h4>Auditorías Totales</h4>
              <div className="stat-number">{userStats.auditorias.total}</div>
              <div className="stat-detail">
                <span>Líder: {userStats.auditorias.comoLider}</span>
                <span>Miembro: {userStats.auditorias.comoMiembro}</span>
              </div>
            </div>

            <div className="stat-card">
              <h4>Ishikawas Participados</h4>
              <div className="stat-number">{userStats.ishikawas.total}</div>
              <div className="stat-detail">
                <span>Aprobados: {userStats.ishikawas.aprobados}</span>
                <span>Revisados: {userStats.ishikawas.revisados}</span>
              </div>
            </div>

            <div className="stat-card">
              <h4>Eficiencia</h4>
              <div className="stat-number">{userStats.auditorias.eficiencia.toFixed(1)}%</div>
              <div className="stat-detail">
                <span>Auditorías: {userStats.auditorias.eficiencia.toFixed(1)}%</span>
                <span>Ishikawas: {userStats.ishikawas.eficiencia.toFixed(1)}%</span>
              </div>
            </div>

            <div className="stat-card">
              <h4>Este Año</h4>
              <div className="stat-number">{userStats.tiempo.auditoriasEsteAnio}</div>
              <div className="stat-detail">
                <span>Auditorías: {userStats.tiempo.auditoriasEsteAnio}</span>
                <span>Ishikawas: {userStats.tiempo.ishikawasEsteAnio}</span>
              </div>
            </div>
          </div>

          {/* Gráficas de eficiencia */}
          <div className="charts-section section">
            <h4>Métricas de Eficiencia</h4>
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsiveBar
                data={prepareEfficiencyData()}
                keys={['porcentaje']}
                indexBy="categoria"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'set3' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
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
                animate={true}
              />
            </div>
          </div>

          {/* Timeline de auditorías */}
          <div className="timeline-section section">
            <h4>Linea de Tiempo de Auditorías</h4>
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsiveLine
                data={[
                  {
                    id: "Auditorías",
                    data: prepareAuditTimelineData().map(item => ({
                      x: item.mes,
                      y: item.auditorias
                    }))
                  }
                ]}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 0,
                  max: 'auto',
                  stacked: false,
                }}
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Cantidad',
                  legendOffset: -40,
                }}
                colors={{ scheme: 'category10' }}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableSlices="x"
                useMesh={true}
              />
            </div>
          </div>

          {/* Distribución de roles */}
          <div className="roles-section section">
            <h4>Distribución de Roles</h4>
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsivePie
                data={[
                  {
                    id: "Auditor Líder",
                    label: "Auditor Líder",
                    value: userStats.auditorias.comoLider,
                    color: "#FF6384"
                  },
                  {
                    id: "Equipo Auditor",
                    label: "Equipo Auditor",
                    value: userStats.auditorias.comoMiembro,
                    color: "#36A2EB"
                  },
                  {
                    id: "Auditado",
                    label: "Auditado",
                    value: userStats.auditorias.comoAuditado,
                    color: "#FFCE56"
                  }
                ]}
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
                    symbolShape: 'circle'
                  }
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstadisticasPersonas;
