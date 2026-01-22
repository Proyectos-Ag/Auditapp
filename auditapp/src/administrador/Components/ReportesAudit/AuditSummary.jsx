import React, { useMemo } from 'react';
import { formatDateES } from '../../../utils/ishikawa';
import './css/audit_summary.css';

export default function AuditSummary({ dato, puntosObtenidos, total, porcentajeTotal, estatus, confExternas }) {
  const max = dato?.PuntuacionMaxima ?? total;
  const obtenida = dato?.PuntuacionObten ?? puntosObtenidos;

  // === NUEVO: conteos de criterios ===
  const { conforme, menor, mayor, critica } = useMemo(() => {
    const out = { conforme: 0, menor: 0, mayor: 0, critica: 0 };
    if (!dato?.Programa) return out;

    for (const prog of dato.Programa || []) {
      for (const desc of prog?.Descripcion || []) {
        const raw = (desc?.Criterio ?? '').toString();
        if (!raw || raw === 'NA' || raw.toLowerCase() === 'o') continue;

        const c = raw;
        if (c === 'Conforme') out.conforme += 1;
        else if (c === 'm' || c === 'nc menor') out.menor += 1;
        else if (c === 'M' || c === 'nc mayor') out.mayor += 1;
        else if (c === 'c' || c === 'nc critica' || c === 'nc crítica') out.critica += 1;
      }
    }
    return out;
  }, [dato]);

  return (
    <div className='audit-summary'>
      <div className="audit-meta">
        <div className="left">
          <div className="item"><span className="bold">Duración:</span> {dato.Duracion}</div>
          <div className="item"><span className="bold">Tipo:</span> {dato.TipoAuditoria}</div>
          {dato.Cliente && <div className="item"><span className="bold">Cliente:</span> {dato.Cliente}</div>}
        </div>
        <div className="right">
          {dato.Cliente && <div className="item"><span className="bold">Fecha auditoría:</span> {formatDateES(dato.FechaInicio)}</div>}
          <div className="item"><span className="bold">Fecha elaboración:</span> {formatDateES(dato.FechaElaboracion)}</div>
        </div>
      </div>

      <div className="audit-stats">
        {/* Fila 1: métricas principales en orden fijo */}
        <div className="stats-row metrics">
          <div className="metric-pill">Puntuación máxima: <b>{max}</b></div>
          <div className="metric-pill">Puntuación obtenida: <b>{obtenida}</b></div>
          <div className="metric-pill">Porcentaje: <b>{dato.PorcentajeTotal ?? porcentajeTotal ?? 0}%</b></div>
          <div className="metric-pill">Estatus: <b>{dato.Estatus ?? estatus ?? '-'}</b></div>
        </div>

        {/* (Opcional) Fila 1.5: conformidades externas si aplica */}
        {typeof confExternas === 'number' && (
          <div className="stats-row extras">
            <div className="metric-pill">Conformidades externas: <b>{confExternas}</b></div>
          </div>
        )}

        {/* Fila 2: conteos de criterios (chips) */}
        <div className="stats-row counts">
          <div className="metric-chip ok">Conforme: <b>{conforme}</b></div>
          <div className="metric-chip minor">NC Menor: <b>{menor}</b></div>
          <div className="metric-chip major">NC Mayor: <b>{mayor}</b></div>
          <div className="metric-chip critical">NC Crítica: <b>{critica}</b></div>
        </div>
      </div>
    </div>
  );
}