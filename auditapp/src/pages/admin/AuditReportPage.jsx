// src/features/auditoria/pages/AuditReportPage.jsx
import React, { useContext, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { UserContext } from '../../App';

import useAuditData from '../../hooks/useAuditData';
import AuditHeader from '../../administrador/Components/ReportesAudit/AuditHeader.jsx';
import AuditSummary from '../../administrador/Components/ReportesAudit/AuditSummary';
import AuditScope from '../../administrador/Components/ReportesAudit/AuditScope';
import AuditResultsTable from '../../administrador/Components/ReportesAudit/AuditResultsTable';
import ActionBar from '../../administrador/Components/ReportesAudit/ActionBar';

import { exportAuditToPDF } from '../../utils/pdf';
import {
  calcularCumplimientoPonderado,
  contarYCalcularPuntos,
  formatDateES
} from '../../utils/ishikawa';

import './css/audit.css';

export default function AuditReportPage({ variant = 'revision' }) {
  const { _id } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const withIshikawa = variant !== 'revision'; // en revision puedes prescindir si no lo usas
  const { datos, ishikawasMap, loading, error } = useAuditData({ _id, withIshikawa });

  // Estados locales específicos de revision
  const [notaVisibleById, setNotaVisibleById] = useState({});
  const [notas, setNotas] = useState({});
  const [hiddenRows, setHiddenRows] = useState({}); // por tabla (periodIdx) si hay múltiples

  const toggleNota = (id) => {
    setNotaVisibleById(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const onNotaChange = (id, value) => setNotas(prev => ({ ...prev, [id]: value }));

  const onHideRow = (periodIdx, rowId) => {
    setHiddenRows(prev => ({
      ...prev,
      [periodIdx]: { ...(prev[periodIdx]||{}), [rowId]: !(prev[periodIdx]?.[rowId]) }
    }));
  };

  const actualizarEstadoADevuelto = async (id, AuditorLiderEmail) => {
    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/estado/${id}`, {
      Estado: 'Devuelto',
      Comentario: notas[id] || '',
      AuditorLiderEmail
    });
  };

  const actualizarEstadoTerminada = async (id, payload) => {
    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/estado/${id}`, {
      Estado: 'Terminada',
      ...payload
    });
  };

  const actualizarEstadoFinalizado = async (id, porcentaje) => {
    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/estado/${id}`, {
      Estado: 'Finalizado',
      PorcentajeCump: porcentaje
    });
  };

  const eliminarReporte = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar reporte?',
      text: 'Esto no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (confirm.isConfirmed) {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/datos/${id}`);
      Swal.fire('Eliminado', 'El reporte fue eliminado', 'success');
      navigate('/revish');
    }
  };

  const Rechazar = (id, AuditorLiderEmail) => {
    Swal.fire({
      title: '¿Rechazar?',
      text: 'Se devolverá al auditado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    }).then(async (r) => {
      if (r.isConfirmed) {
        await actualizarEstadoADevuelto(id, AuditorLiderEmail);
      }
    });
  };

  const Aprobar = (id, payload) => {
    Swal.fire({
      title: '¿Aprobar?',
      text: 'Se enviará al auditado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    }).then(async (r) => {
      if (r.isConfirmed) {
        await actualizarEstadoTerminada(id, payload);
        Swal.fire('¡Listo!', 'Estado actualizado', 'success').then(() => navigate('/revish'));
      }
    });
  };

  const Finalizar = (id, porcentaje) => {
    Swal.fire({
      title: '¿Finalizar?',
      text: 'Se dará por terminado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then(async (r) => {
      if (r.isConfirmed) {
        await actualizarEstadoFinalizado(id, porcentaje);
      }
    });
  };

  if (!userData?.Correo) return null;

  return (
    <div className="audit-page">
      {loading && <div className="overlay">Cargando…</div>}
      {error && <div className="overlay error">{error}</div>}

      <div className="container">
        <h1 className="page-title">
          {variant === 'revision' ? 'Revisión de Reporte'
          : variant === 'terminada' ? 'Revisión de Ishikawa'
          : 'Reportes Finalizados'}
        </h1>

        {datos.length === 0 && !loading && (
          <div className="empty">
            {variant === 'revision' ? 'No hay reportes por revisar…'
            : variant === 'terminada' ? 'No hay Ishikawas por revisar…'
            : 'No hay reportes finalizados…'}
          </div>
        )}

        {datos.map((dato, periodIdx) => {
          // Métricas base (puntos)
          const { conteo, total, puntos } = contarYCalcularPuntos(dato);

          // “Conformidades externas” (mismo criterio que usabas)
          const confExternas = dato.PuntuacionMaxima ? (dato.PuntuacionMaxima - total) : undefined;

          // Puntuación obtenida y % local (si aún no existen en DB)
          const PuntuacionObtenida = dato.PuntuacionMaxima
            ? (confExternas + Number(puntos)).toFixed(2)
            : Number(puntos);

          const resultado = dato.PuntuacionMaxima
            ? ((Number(PuntuacionObtenida) * 100) / dato.PuntuacionMaxima)
            : (Number(puntos) * 100 / (total || 1));
          const porcentajeTotal = (dato.PorcentajeTotal ?? resultado).toFixed(2);

          // % de cumplimiento ponderado por estados (nuevo)
          // dentro de datos.map(...)
            const { porcentaje: porcentajePonderado } =
                calcularCumplimientoPonderado(dato, ishikawasMap);


          const estatus = resultado >= 90 ? 'Bueno'
                        : resultado >= 80 ? 'Aceptable'
                        : resultado >= 60 ? 'No Aceptable'
                        : 'Crítico';

          const notaVisible = !!notaVisibleById[dato._id];

          return (
            <div key={periodIdx} className="card">
              <div className="card-header" onClick={() => { /* si quieres colapsar */ }}>
                <div className="header-title">Fecha de Elaboración: {formatDateES(dato.FechaElaboracion)}</div>
                <ActionBar
                  variant={variant}
                  notaVisible={notaVisible}
                  onNotaToggle={() => toggleNota(dato._id)}
                  onRechazar={() => Rechazar(dato._id, dato.AuditorLiderEmail)}
                  onAprobar={() => Aprobar(dato._id, {
                    PuntuacionObten: PuntuacionObtenida,
                    PuntuacionConf: confExternas,
                    Estatus: estatus,
                    PorcentajeTotal: porcentajeTotal,
                    AuditorLiderEmail: dato.AuditorLiderEmail
                  })}
                  onEliminar={() => eliminarReporte(dato._id)}
                  onFinalizar={() => Finalizar(dato._id, porcentajePonderado.toFixed(2))}
                  onExportPDF={exportAuditToPDF}
                />
              </div>

              {notaVisible && variant === 'revision' && (
                <textarea
                  className="note-textarea"
                  value={notas[dato._id] || ''}
                  onChange={(e) => onNotaChange(dato._id, e.target.value)}
                  placeholder="Razón del rechazo…"
                />
              )}

              <div id="pdf-content-part1" className="card-body">
                <AuditHeader />
                <AuditSummary
                  dato={dato}
                  puntosObtenidos={puntos}
                  total={total}
                  porcentajeTotal={porcentajeTotal}
                  estatus={estatus}
                  confExternas={confExternas}
                />
                <div className="objective">
                  <table>
                    <thead>
                      <tr><th className="thead-green">Objetivo</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{dato.Objetivo || 'Garantizar que el Sistema cumpla continuamente con los requisitos internacionales...'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <AuditScope dato={dato} />
              </div>

              <div id="pdf-content-part2" className="card-body">
                {(variant === 'terminada' || variant === 'finalizada') && (
                  <div className="compliance-banner">
                    Porcentaje de Cumplimiento (ponderado): <b>{porcentajePonderado.toFixed(2)}%</b>
                  </div>
                )}
                <AuditResultsTable
                  dato={dato}
                  ishikawasMap={ishikawasMap}
                  variant={variant}
                  hiddenRows={hiddenRows[periodIdx]}
                  onHideRow={(rowId) => onHideRow(periodIdx, rowId)}
                  onGoIshikawa={(idRep, idReq, proName) => navigate(`/ishikawa/${idRep}/${idReq}/${encodeURIComponent(proName)}`)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}