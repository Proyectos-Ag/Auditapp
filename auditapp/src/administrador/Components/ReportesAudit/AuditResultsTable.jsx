import { estadoToColor } from '../../../utils/ishikawa';

export default function AuditResultsTable({
  dato,
  ishikawasMap,
  variant,
  onHideRow,
  hiddenRows = {},
  onAssignIshikawa,
  onGoIshikawa,
  isAdmin = false,
  showOnlyAssigned = false,
  filterToAssignedOf,
}) {
  const firePrefix = 'https://firebasestorage';
  const evidenceHeader = dato?.PuntuacionMaxima ? 'Hallazgo' : 'Evidencia';

const formatDateLocal = (input) => {
  if (!input) return '';
  const v = Array.isArray(input) ? input.at(-1) : input;

  // Caso "YYYY-MM-DD" -> construir Date local (sin shift de zona)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    const local = new Date(y, m - 1, d);   // <-- local
    return local.toLocaleDateString('es-ES');
  }

  // Para ISO con hora, timestamps, etc.
  const dt = new Date(v);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('es-ES');
};


  return (
    <div className="audit-results">
      <div className="table-x-scroll">
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
            <th>{evidenceHeader}</th>
            <th>Acciones</th>
            <th>Fecha</th>
            <th>Responsable</th>
            <th>Efectividad</th>
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

              // 🚦 Si es vista de auditado, solo debe ver SUS filas asignadas
              if (showOnlyAssigned) {
                // si no hay ish o no coincide el auditado, no se muestra la fila
                if (!ish) return null;
                if (filterToAssignedOf && ish.auditado !== filterToAssignedOf) return null;
              }

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

              const estadoTxt = ish ? ish.estado : 'Pendiente';
              const estadoColor = ish ? estadoToColor(ish.estado) : '#6e6e6e';

              return (
                <tr key={rowId}>
                  <td>{desc.ID}</td>
                  <td className="left">{programa.Nombre}</td>
                  <td className="justify">{desc.Requisito}</td>
                  <td>{crit}</td>
                  <td className="justify">{textCell}</td>
                  <td className="ev-cell">{evidenciaCell}</td>

                  <td>
                    {variant === 'revision' && isAdmin && (
                      <button className="link-btn" onClick={() => onHideRow?.(rowId)}>Ocultar</button>
                    )}
                    {(variant === 'terminada' || variant === 'finalizada') && (
                      ish?.actividades?.length > 0 ? ish.actividades[0].actividad : ''
                    )}
                  </td>

                  <td>
                    {ish?.actividades?.length > 0
                      ? formatDateLocal(ish.actividades[0].fechaCompromiso)
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

                    <div className="ish-actions">
                      {/* Indicador + navegación */}
                      <button
                        className="ish-state-chip"
                        style={{ backgroundColor: estadoColor }}
                        title={ish ? 'Abrir Ishikawa' : 'Sin Ishikawa (pendiente)'}
                        onClick={() => ish && onGoIshikawa?.(dato._id, desc.ID, programa.Nombre)}
                        disabled={!ish}
                        aria-disabled={!ish}
                      >
                        {estadoTxt}
                      </button>

                      {/* Asignar/Reasignar solo para admin */}
                      {isAdmin && (
                        <button
                          className={`assign-btn ${ish ? 'assign-btn--secondary' : 'assign-btn--primary'}`}
                          onClick={() => onAssignIshikawa?.(dato._id, desc.ID, programa.Nombre, desc)}
                          title={ish ? 'Reasignar Ishikawa' : 'Asignar Ishikawa'}
                        >
                          {ish ? 'Reasignar' : 'Asignar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}