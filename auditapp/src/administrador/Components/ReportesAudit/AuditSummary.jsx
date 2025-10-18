// src/features/auditoria/components/AuditSummary.jsx
import { formatDateES } from '../../../utils/ishikawa';

export default function AuditSummary({ dato, puntosObtenidos, total, porcentajeTotal, estatus, confExternas }) {
  const max = dato.PuntuacionMaxima ?? total;
  const obtenida = dato.PuntuacionObten ?? puntosObtenidos;

  return (
    <div className='audit-summary'>
      <div className="audit-meta">
        <div className="left">
          <div className="item"><span className="bold">Duración:</span> {dato.Duracion}</div>
          <div className="item"><span className="bold">Tipo:</span> {dato.TipoAuditoria}</div>
          {dato.Cliente && <div className="item"><span className="bold">Cliente:</span> {dato.Cliente}</div>}
        </div>
        <div className="right">
          {dato.Cliente && <div className="item"><span className="bold">Fecha auditoría:</span> {dato.FechaEvaluacion}</div>}
          <div className="item"><span className="bold">Fecha elaboración:</span> {formatDateES(dato.FechaElaboracion)}</div>
        </div>
      </div>

      <div className="audit-stats">
        <div className="group">
          <div className="metric">Puntuación máxima: <b>{max}</b></div>
          <div className="metric">Puntuación obtenida: <b>{obtenida}</b></div>
        </div>
        <div className="group">
          <div className="metric">%: <b>{dato.PorcentajeTotal ?? porcentajeTotal ?? 0}%</b></div>
          <div className="metric">Estatus: <b>{dato.Estatus ?? estatus ?? '-'}</b></div>
        </div>
        {typeof confExternas === 'number' && (
          <div className="group">
            <div className="metric">Conformidades externas: <b>{confExternas}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}
