// src/features/auditoria/pages/AuditReportPage.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../services/api';
import { UserContext } from '../../App';

import useAuditData from '../../hooks/useAuditData';
import AuditHeader from '../../administrador/Components/ReportesAudit/AuditHeader.jsx';
import AuditSummary from '../../administrador/Components/ReportesAudit/AuditSummary';
import AuditScope from '../../administrador/Components/ReportesAudit/AuditScope';
import AuditResultsTable from '../../administrador/Components/ReportesAudit/AuditResultsTable';
import ActionBar from '../../administrador/Components/ReportesAudit/ActionBar';
import AsignarIshikawaModal from '../../administrador/Components/ReportesAudit/AsignarIshikawaModal.jsx';

import { exportAuditToPDF } from '../../utils/pdf';
import {
  calcularCumplimientoPonderado,
  contarYCalcularPuntos,
  formatDateES
} from '../../utils/ishikawa';

import './css/audit.css';

const DraggableNoteModal = React.forwardRef(function DraggableNoteModal(
  {
    open,
    title = 'Nota para rechazo',
    value,
    onChange,     // (texto) => void
    onClose,      // () => void
    pos,          // {x, y}
    onMove,       // (nextPos) => void
  },
  textAreaRef
) {
  const modalRef = useRef(null);
  const dragState = useRef({ dragging: false, dx: 0, dy: 0 });

  useEffect(() => {
    if (!open) return;

    const onPointerMove = (e) => {
      if (!dragState.current.dragging) return;
      const nx = e.clientX - dragState.current.dx;
      const ny = e.clientY - dragState.current.dy;

      const vw = window.innerWidth, vh = window.innerHeight;
      const el = modalRef.current;
      const mw = el?.offsetWidth ?? 360;
      const mh = el?.offsetHeight ?? 220;

      const clampX = Math.max(8, Math.min(nx, vw - mw - 8));
      const clampY = Math.max(8, Math.min(ny, vh - mh - 8));

      onMove?.({ x: clampX, y: clampY });
    };

    const onPointerUp = () => {
      dragState.current.dragging = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [open, onMove]);

  const startDrag = (e) => {
    if (!modalRef.current) return;
    dragState.current.dragging = true;
    dragState.current.dx = e.clientX - (pos?.x ?? 24);
    dragState.current.dy = e.clientY - (pos?.y ?? 120);
    e.preventDefault();
  };

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      className="note-modal"
      style={{ left: (pos?.x ?? 24), top: (pos?.y ?? 120) }}
    >
      <div className="note-modal__header" onPointerDown={startDrag}>
        <span className="note-modal__title">{title}</span>
        <button className="note-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
      </div>

      <div className="note-modal__body">
        <textarea
          ref={textAreaRef}
          className="note-modal__textarea"
          placeholder="Escribe la razón del rechazo…"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
      <div className="note-modal__footer">
        <span className="note-modal__hint">Obligatoria para rechazar</span>
        <button className="note-modal__btn" onClick={onClose}>Listo</button>
      </div>
    </div>
  );
});

// helper para mapear estado -> variant (por tarjeta)
const estadoToVariant = (estado) => {
  const v = String(estado || '').toLowerCase();
  if (v.includes('finaliz')) return 'finalizada';
  if (v.includes('termin')) return 'terminada';
  // Realizada / En revisión / Revisando -> revision
  return 'revision';
};

export default function AuditReportPage({ variant = 'revision' }) {
  const { _id } = useParams();
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const withIshikawa = true;
  const { datos, ishikawasMap, loading, error } = useAuditData({ _id, withIshikawa });

  // === Roles
  const tipo = String(userData?.TipoUsuario || '').toLowerCase();
  const isAdmin = tipo === 'administrador';
  const isAuditor = tipo === 'auditor';
  const isAuditado = tipo === 'auditado';

  // Estados locales específicos de revision
  const [notaVisibleById, setNotaVisibleById] = useState({});
  const [notas, setNotas] = useState({});
  const [hiddenRows, setHiddenRows] = useState({}); // por tabla (periodIdx) si hay múltiples

  const [notaModalPos, setNotaModalPos] = useState({}); // { [id]: {x,y} }
  const noteRefs = React.useRef({}); // para enfocar el textarea

  // Mapa local para refrescar tras asignar (sin recargar toda la página)
  const [ishMapOverride, setIshMapOverride] = useState(null);
  const combinedIshMap = ishMapOverride || ishikawasMap || {};

   const isInTeam = React.useCallback((d) => {
    const email = userData?.Correo;
    if (!email) return false;
    const inLeader = d?.AuditorLiderEmail === email;
    const inTeamArr = Array.isArray(d?.EquipoAuditor) && d.EquipoAuditor.some(a => a?.Correo === email);
    return inLeader || inTeamArr;
  }, [userData?.Correo]);

  // ¿Tiene asignaciones como AUDITOR en un reporte específico?
  const isAssignedToCurrentAuditor = React.useCallback((ish) => {
    if (!ish) return false;
    const eq = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    const email = (userData?.Correo || '').toLowerCase();
    const name  = (userData?.Nombre || '').toLowerCase();

    if (email && (eq(ish.auditorEmail, email) || eq(ish.auditorAsignadoCorreo, email) || eq(ish.asignadoAuditorCorreo, email))) return true;
    if (name  && (eq(ish.auditor, name) || eq(ish.auditorAsignado, name) || eq(ish.asignadoAuditorNombre, name))) return true;

    const asignado = ish.asignadoAuditor || ish.asignadoA || ish.asignado;
    if (asignado) {
      if (email && (eq(asignado.correo, email) || eq(asignado.email, email))) return true;
      if (name  && eq(asignado.nombre, name)) return true;
    }

    const responsables = Array.isArray(ish.actividades)
      ? ish.actividades.flatMap(a => Array.isArray(a?.responsable) ? a.responsable : [])
      : [];
    for (const r of responsables) {
      if (email && (eq(r?.correo, email) || eq(r?.email, email))) return true;
      if (name  && eq(r?.nombre, name)) return true;
    }
    return false;
  }, [userData?.Correo, userData?.Nombre]);

  // ⬅️ lista de ishikawas para búsquedas por reporte
  const values = Object.values(combinedIshMap || {});
  const reportHasAssignmentsForAuditor = React.useCallback((d) => {
    return values.some((ish) => ish?.idRep === d._id && isAssignedToCurrentAuditor(ish));
  }, [values, isAssignedToCurrentAuditor]);

  // visibleDatos (quién puede ver el reporte completo)
  const visibleDatos = isAdmin
    ? (datos || [])
    : isAuditado
    ? (datos || [])
    : (datos || []).filter(d => {
        const inTeam = isInTeam(d);
        const hasMine = reportHasAssignmentsForAuditor(d);
        const notHiddenState = !['pendiente','devuelto'].includes(String(d.Estado || '').toLowerCase());
        return (inTeam || hasMine) && notHiddenState;
      });

  const hasAssignedAsAuditor  = values.some((ish) => isAssignedToCurrentAuditor(ish));

  // ⬅️ SOLO auditado o auditor entran a "solo asignados" (admin no)
  const assignedOnly = isAuditado || (isAuditor && hasAssignedAsAuditor);


  const variantForCard = estadoToVariant(visibleDatos[0]?.Estado);

  // Modal Asignar Ishikawa (solo admin y fuera de “solo asignados”)
  const [assignCtx, setAssignCtx] = useState({
    open: false,
    idRep: '',
    idReq: '',
    proName: '',
    descripcion: null,
  });

  const openAssignModal = (idRep, idReq, proName, descripcion) => {
    if (!isAdmin || assignedOnly) return;
    setAssignCtx({ open: true, idRep, idReq, proName, descripcion });
  };
  const closeAssignModal = () => setAssignCtx((p) => ({ ...p, open: false }));

  // Refrescar sólo Ishikawas después de asignar
  const refetchIshikawas = async () => {
    try {
      const r = await api.get(`/ishikawa/por/${_id}`);
      const list = Array.isArray(r.data) ? r.data : (r.data ? [r.data] : []);
      const map = list.reduce((acc, ish) => {
        const k = `${ish.idReq}-${ish.idRep}-${ish.proName}`;
        acc[k] = ish;
        return acc;
      }, {});
      setIshMapOverride(map);
    } catch (e) {
      console.error('No se pudo refrescar Ishikawas', e);
    }
  };

  // Map filtrado para cálculo/tabla cuando es “solo asignados”
   const assignedMap = React.useMemo(() => {
    if (!assignedOnly) return combinedIshMap;
    const entries = Object.entries(combinedIshMap || {}).filter(([, ish]) => {
      if (isAuditado) return ish?.auditado === userData?.Nombre;
      if (isAuditor)  return isAssignedToCurrentAuditor(ish);
      return true;
    });
    return Object.fromEntries(entries);
  }, [assignedOnly, combinedIshMap, isAuditado, isAuditor, userData?.Nombre, isAssignedToCurrentAuditor]);

  const getPosFor = (id) => (notaModalPos[id] || { x: 24, y: 120 });
  const setPosFor = (id, next) => setNotaModalPos((prev) => ({ ...prev, [id]: next }));

  const toggleNota = (id) => setNotaVisibleById(prev => ({ ...prev, [id]: !prev[id] }));
  const onNotaChange = (id, value) => setNotas(prev => ({ ...prev, [id]: value }));

  const onHideRow = (periodIdx, rowId) => {
    setHiddenRows(prev => ({
      ...prev,
      [periodIdx]: { ...(prev[periodIdx]||{}), [rowId]: !(prev[periodIdx]?.[rowId]) }
    }));
  };

  const actualizarEstadoADevuelto = async (id, AuditorLiderEmail) => {
    if (!isAdmin || assignedOnly) return;
    await api.put(`/datos/estado/${id}`, {
      Estado: 'Devuelto',
      Comentario: notas[id] || '',
      AuditorLiderEmail
    });
  };

  const actualizarEstadoTerminada = async (id, payload) => {
    if (!isAdmin || assignedOnly) return;
    await api.put(`/datos/estado/${id}`, {
      Estado: 'Terminada',
      ...payload
    });
  };

  const actualizarEstadoFinalizado = async (id, porcentaje) => {
    if (!isAdmin || assignedOnly) return;
    await api.put(`/datos/estado/${id}`, {
      Estado: 'Finalizado',
      PorcentajeCump: porcentaje
    });
  };

  const eliminarReporte = async (id) => {
    if (!isAdmin || assignedOnly) return;
    const confirm = await Swal.fire({
      title: '¿Eliminar reporte?',
      text: 'Esto no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (confirm.isConfirmed) {
      await api.delete(`/datos/${id}`);
      Swal.fire('Eliminado', 'El reporte fue eliminado', 'success');
      navigate('/revish');
    }
  };

  const Rechazar = (id, AuditorLiderEmail) => {
    if (!isAdmin || assignedOnly) return;
    const note = (notas[id] || '').trim();

    if (!note) {
      setNotaVisibleById(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        const ta = noteRefs.current[id];
        if (ta) ta.focus();
      }, 0);

      Swal.fire({
        icon: 'info',
        title: 'Nota requerida',
        text: 'Escriba una nota antes de rechazar el reporte.',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

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
        setNotaVisibleById(prev => ({ ...prev, [id]: false }));
      }
    });
  };

  const Aprobar = (id, payload) => {
    if (!isAdmin || assignedOnly) return;
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
    if (!isAdmin || assignedOnly) return;
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

  const toNum = (v) => {
    if (v == null) return NaN;
    if (typeof v === 'string') return Number(v.replace('%','').trim());
    return Number(v);
  };
  const n0 = (v) => {
    const n = toNum(v);
    return Number.isFinite(n) ? n : 0;
  };
  const fmt2 = (v) => Number.isFinite(v) ? v.toFixed(2) : '0.00';

  // ActionBar en solo lectura cuando es “solo asignados”
  const actionVariant = isAdmin ? variantForCard : 'finalizada';

  // Navegación a Ishikawa: ruta normal o ruta de auditado
  const goIshikawa = (idRep, idReq, proName) => {
    const useAuditadoRoute = !isAdmin && (assignedOnly || isAuditado);
    const base = useAuditadoRoute ? '/auditado/ishikawa' : '/ishikawa';
    navigate(`${base}/${idRep}/${idReq}/${encodeURIComponent(proName)}`);
  };

  return (
    <div className="audit-page">
      {loading && <div className="overlay">Cargando…</div>}
      {error && <div className="overlay error">{error}</div>}

      <div className="container">
        <h1 className="page-title">
          {assignedOnly
            ? 'Puntos Asignados'
            : (variant === 'revision' ? 'Revisión de Reporte'
              : variant === 'terminada' ? 'Revisión de Ishikawa'
              : 'Reportes Finalizados')}
        </h1>

        {visibleDatos.length === 0 && !loading && (
          <div className="empty">
            {assignedOnly ? 'No tienes puntos asignados en este reporte…'
            : (variant === 'revision' ? 'No hay reportes por revisar…'
              : variant === 'terminada' ? 'No hay Ishikawas por revisar…'
              : 'No hay reportes finalizados…')}
          </div>
        )}

        {visibleDatos.map((dato, periodIdx) => {

          const inTeam = isInTeam(dato);
          const hasMine = reportHasAssignmentsForAuditor(dato);
          // Solo asignados SI: auditado, o auditor que NO está en equipo pero sí tiene asignaciones en ese reporte
          const showOnlyAssignedThis = isAuditado || (isAuditor && !inTeam && hasMine);
          // Métricas base (puntos)
          const { conteo, total, puntos } = contarYCalcularPuntos(dato);

          // “Conformidades externas”
          const confExternas = dato.PuntuacionMaxima ? (dato.PuntuacionMaxima - total) : undefined;

          // Puntuación obtenida y %
          const PuntuacionObtenida = dato.PuntuacionMaxima
            ? (confExternas + Number(puntos)).toFixed(2)
            : Number(puntos);

          const resultado = dato.PuntuacionMaxima
            ? ((Number(PuntuacionObtenida) * 100) / dato.PuntuacionMaxima)
            : (Number(puntos) * 100 / (total || 1));
          const porcentajeTotal = fmt2( toNum(dato.PorcentajeTotal ?? resultado) );

          // % de cumplimiento ponderado (usa mapa filtrado cuando “solo asignados”)
            const { porcentaje: porcentajePonderadoRaw } = calcularCumplimientoPonderado(
              dato,
              showOnlyAssignedThis ? assignedMap : combinedIshMap
            );
          const porcentajePonderado = n0(porcentajePonderadoRaw);

          const estatus = resultado >= 90 ? 'Bueno'
                        : resultado >= 80 ? 'Aceptable'
                        : resultado >= 60 ? 'No Aceptable'
                        : 'Crítico';

          const notaVisible = !!notaVisibleById[dato._id];

          return (
            <div key={periodIdx} className="reporte-cont">
              <div className="card-header" onClick={() => { /* si quieres colapsar */ }}>
                <div className="header-title">Fecha de Elaboración: {formatDateES(dato.FechaElaboracion)}</div>
                <ActionBar
                  variant={actionVariant}
                  notaVisible={notaVisible}
                  onNotaToggle={() => (!assignedOnly && isAdmin) && toggleNota(dato._id)}
                  onRechazar={() => (!assignedOnly && isAdmin) && Rechazar(dato._id, dato.AuditorLiderEmail)}
                  onAprobar={() => (!assignedOnly && isAdmin) && (Aprobar(dato._id, {
                    PuntuacionObten: PuntuacionObtenida,
                    PuntuacionConf: confExternas,
                    Estatus: estatus,
                    PorcentajeTotal: porcentajeTotal,
                    AuditorLiderEmail: dato.AuditorLiderEmail
                  }))}
                  onEliminar={() => (!assignedOnly && isAdmin) && eliminarReporte(dato._id)}
                  onFinalizar={() => (!assignedOnly && isAdmin) && Finalizar(dato._id, porcentajePonderado.toFixed(2))}
                  onExportPDF={exportAuditToPDF}
                />
              </div>

              {notaVisible && variant === 'revision' && isAdmin && !assignedOnly && (
                <DraggableNoteModal
                  open={notaVisible}
                  value={notas[dato._id] || ''}
                  onChange={(v) => onNotaChange(dato._id, v)}
                  onClose={() => setNotaVisibleById(prev => ({ ...prev, [dato._id]: false }))}
                  pos={getPosFor(dato._id)}
                  onMove={(next) => setPosFor(dato._id, next)}
                  ref={(el) => { noteRefs.current[dato._id] = el; }}
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
                {(variantForCard === 'terminada' || variantForCard === 'finalizada' || showOnlyAssignedThis) && (
                  <div className="compliance-banner">
                    Porcentaje de Cumplimiento (ponderado): <b>{porcentajePonderado.toFixed(2)}%</b>
                  </div>
                )}
                <AuditResultsTable
                  dato={dato}
                  ishikawasMap={combinedIshMap}
                  variant={variantForCard}
                  hiddenRows={hiddenRows[periodIdx]}
                  onHideRow={(rowId) => isAdmin && onHideRow(periodIdx, rowId)}
                  onAssignIshikawa={(idRep, idReq, proName, descripcion) =>
                    isAdmin && openAssignModal(idRep, idReq, proName, descripcion)
                  }
                  onGoIshikawa={(idRep, idReq, proName) => goIshikawa(idRep, idReq, proName)}
                  isAdmin={isAdmin}
                  showConformes={isAdmin || inTeam}
                  //Solo el AUDITADO ve únicamente sus filas
                  showOnlyAssigned={showOnlyAssignedThis}
                  filterToAssignedOf={isAuditado ? userData?.Nombre : undefined}
                  filterToAssignedAuditorEmail={isAuditor && !inTeam && hasMine ? userData?.Correo : undefined}
                  filterToAssignedAuditorName={isAuditor && !inTeam && hasMine ? userData?.Nombre : undefined}

                  // 👇 restringe apertura a asignados (aunque el auditor vea todas las filas)
                  restrictOpenToAssigned={isAuditado || isAuditor}
                  currentAuditorEmail={isAuditor ? userData?.Correo : undefined}
                  currentAuditorName={isAuditor ? userData?.Nombre : undefined}
                />

              </div>
            </div>
          );
        })}
      </div>

      <AsignarIshikawaModal
        open={assignCtx.open && isAdmin && !assignedOnly}
        onClose={closeAssignModal}
        idRep={assignCtx.idRep}
        idReq={assignCtx.idReq}
        proName={assignCtx.proName}
        descripcion={assignCtx.descripcion}
        onAssigned={async () => {
          await refetchIshikawas();
        }}
      />
    </div>
  );
}