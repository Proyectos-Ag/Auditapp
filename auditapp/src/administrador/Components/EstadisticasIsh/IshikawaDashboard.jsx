import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./css/estadisticas-ish.css";

const IshikawaDashboard = () => {
  const [totalIshikawas, setTotalIshikawas] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ Aprobado: 0, Rechazados: 0, Finalizados: 0 });
  const [topIssues, setTopIssues] = useState([]);
  const [participantsCounts, setParticipantsCounts] = useState({});

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

        const participantCounts = {};
        filteredIshikawas.forEach(ishikawa => {
          const participants = ishikawa.participantes || "Sin especificar";
          participants.split("/").forEach(participant => {
            const trimmed = participant.trim();
            participantCounts[trimmed] = (participantCounts[trimmed] || 0) + 1;
          });
        });

        setParticipantsCounts(participantCounts);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  const renderTable = (headers, rows) => (
    <table className="dashboard-table">
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

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard de Ishikawas (Tipo Vacío)</h1>

      <div className="dashboard-grid">
        {/* Total Ishikawas */}
        <div className="dashboard-section">
          <h3>Total de Ishikawas</h3>
          {renderTable(["Total"], [[totalIshikawas]])}
          <div className="chart-container">
            <Bar
              data={{
                labels: ["Total"],
                datasets: [
                  {
                    label: "Cantidad Total",
                    data: [totalIshikawas],
                    backgroundColor: "#42A5F5",
                  },
                ],
              }}
              options={{ plugins: { legend: { display: false } } }}
            />
          </div>
        </div>

        {/* Estados */}
        <div className="dashboard-section">
          <h3>Cantidad por Estado</h3>
          {renderTable(
            ["Estado", "Cantidad"],
            Object.entries(statusCounts).map(([estado, cantidad]) => [estado, cantidad])
          )}
          <div className="chart-container">
            <Pie
              data={{
                labels: ["Aprobado", "Rechazados", "Finalizados"],
                datasets: [
                  {
                    label: "Estados",
                    data: [statusCounts.Aprobado, statusCounts.Rechazados, statusCounts.Finalizados],
                    backgroundColor: ["#4CAF50", "#FF5722", "#FFC107"],
                  },
                ],
              }}
            />
          </div>
        </div>

        {/* Top 10 problemas */}
        <div className="dashboard-section">
          <h3>Top 10 de Incumplimientos</h3>
          {renderTable(
            ["Problema", "Cantidad"],
            topIssues.map(issue => [issue.problema, issue.count])
          )}
          <div className="chart-container">
            <Bar
              data={{
                labels: topIssues.map(issue => issue.problema),
                datasets: [
                  {
                    label: "Cantidad",
                    data: topIssues.map(issue => issue.count),
                    backgroundColor: "#FF7043",
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        {/* Participantes */}
        <div className="dashboard-section">
          <h3>Participantes</h3>
          {renderTable(
            ["Participante", "Cantidad"],
            Object.entries(participantsCounts).map(([participant, count]) => [participant, count])
          )}
          <div className="chart-container">
            <Bar
              data={{
                labels: Object.keys(participantsCounts),
                datasets: [
                  {
                    label: "Cantidad de Ishikawas",
                    data: Object.values(participantsCounts),
                    backgroundColor: "#AB47BC",
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IshikawaDashboard;