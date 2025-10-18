// src/features/auditoria/components/AuditResultsTable.jsx
import { estadoToColor } from '../../../utils/ishikawa';

export default function AuditResultsTable({
  dato,
  ishikawasMap,
  variant,
  onHideRow,           // (rowId) => void
  hiddenRows = {},     // { [rowId]: true }
  onGoIshikawa,        // (idRep, idReq, programaNombre) => void
}) {
  const firePrefix = 'https://firebasestorage';

  return (
    <div className="audit-results">
      <table className="results-table">
        <thead>
          <tr>
            <th colSpan="10" className="thead-green">Resultados</th>
          </tr>
          <tr>
            <th>ID</th>
            <th>Programa</th>
            <th>Lineamiento/Requerimiento</th>
            <th>Criterio</th>
            <th>Problema / Observación</th>
            <th>Evidencia</th>
            <th>Acciones</th>
            <th>Fecha</th>
            <th>Responsable</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {dato?.Programa?.map((programa, programIdx) =>
            programa?.Descripcion?.map((desc, descIdx) => {
              const crit = (desc?.Criterio || '').toString();
              if (!crit || crit === 'NA' || crit === 'Conforme') return null;

              const rowId = `${programIdx}-${descIdx}`;
              if (hiddenRows[rowId]) return null;

              const key = `${desc.ID}-${dato._id}-${programa.Nombre}`;
              const ish = ishikawasMap?.[key];

              // contenido observación/problema
              const textCell = (
                <>
                  {desc.Problema && <>Problema: {desc.Problema}<br/><br/></>}
                  {desc.Observacion}
                </>
              );

              const evidenciaCell = Array.isArray(desc.Hallazgo)
                ? desc.Hallazgo.map((url, i) => (
                    url.includes(firePrefix)
                      ? <img key={i} src={url} alt={`Evidencia ${i+1}`} className="ev-img"/>
                      : <span key={i} className="ev-text">{url}</span>
                  ))
                : (desc.Hallazgo
                    ? (desc.Hallazgo.includes(firePrefix)
                        ? <img src={desc.Hallazgo} alt="Evidencia" className="ev-img"/>
                        : <span className="ev-text">{desc.Hallazgo}</span>)
                    : <span className="muted">Sin evidencia</span>
                  );

              return (
                <tr key={rowId}>
                  <td>{desc.ID}</td>
                  <td className="left">{programa.Nombre}</td>
                  <td className="justify">{desc.Requisito}</td>
                  <td>{crit}</td>
                  <td className="justify">{textCell}</td>
                  <td className="ev-cell">{evidenciaCell}</td>
                  <td>
                    {variant === 'revision' && (
                      <button className="link-btn" onClick={() => onHideRow?.(rowId)}>Ocultar</button>
                    )}
                    {(variant === 'terminada' || variant === 'finalizada') && (
                      <button
                        className="chip-btn"
                        style={{ backgroundColor: ish ? estadoToColor(ish.estado) : '#6e6e6e' }}
                        onClick={() => onGoIshikawa?.(dato._id, desc.ID, programa.Nombre)}
                      >
                        {ish ? ish.estado : 'Pendiente'}
                      </button>
                    )}
                  </td>
                  <td>
                    {ish?.actividades?.length > 0 && ish.actividades[0].fechaCompromiso
                      ? new Date(
                          Array.isArray(ish.actividades[0].fechaCompromiso)
                            ? ish.actividades[0].fechaCompromiso.slice(-1)[0]
                            : ish.actividades[0].fechaCompromiso
                        ).toLocaleDateString('es-ES')
                      : ''
                    }
                  </td>
                  <td>
                    {ish?.actividades?.length > 0 && ish.actividades[0].responsable?.length > 0
                      ? ish.actividades[0].responsable[0].nombre
                      : ''
                    }
                  </td>
                  <td>
                    <div className="muted small">{ish?.auditado ?? ''}</div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}