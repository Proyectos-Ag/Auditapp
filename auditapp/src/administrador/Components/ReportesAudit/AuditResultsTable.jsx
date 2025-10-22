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
  showConformes = false,

  // filtros
  showOnlyAssigned = false,
  filterToAssignedOf,
  filterToAssignedAuditorEmail,
  filterToAssignedAuditorName,

  // ⬅️ NUEVO: restringir apertura a asignados (auditor/auditado)
  restrictOpenToAssigned = false,
  currentAuditorEmail,
  currentAuditorName,
}) {
  const firePrefix = 'https://firebasestorage';
  const evidenceHeader = dato?.PuntuacionMaxima ? 'Hallazgo' : 'Evidencia';

  const formatDateLocal = (input) => {
    if (!input) return '';
    const v = Array.isArray(input) ? input.at(-1) : input;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      const local = new Date(y, m - 1, d);
      return local.toLocaleDateString('es-ES');
    }
    const dt = new Date(v);
    return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('es-ES');
  };

  // ⬅️ actualizado: usa filtros o fallback a currentAuditor*
  const isAssignedToAuditor = (ish) => {
    if (!ish) return false;
    const eq = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

    const email = (filterToAssignedAuditorEmail || currentAuditorEmail || '').toLowerCase();
    const name  = (filterToAssignedAuditorName  || currentAuditorName  || '').toLowerCase();

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
              <th>Problema / Hallazgo</th>
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
                const isConforme = crit === 'Conforme';
                if (!crit || crit === 'NA' || (isConforme && !showConformes)) return null;

                const rowId = `${programIdx}-${descIdx}`;
                if (hiddenRows[rowId]) return null;

                const key = `${desc.ID}-${dato._id}-${programa.Nombre}`;
                const ish = ishikawasMap?.[key];

                // Filtro "solo asignados" por-reporte
                if (showOnlyAssigned) {
                  if (filterToAssignedAuditorEmail || filterToAssignedAuditorName) {
                    if (!ish) return null;
                    if (!isAssignedToAuditor(ish)) return null;
                  } else {
                    if (!ish) return null;
                    if (filterToAssignedOf && ish.auditado !== filterToAssignedOf) return null;
                  }
                }

                const textCell = (
                  <>
                    {desc.Problema && <>Problema: {desc.Problema}<br/><br/></>}
                    <>Hallazgo: {desc.Observacion}</>
                  </>
                );

                const evidenciaCell = Array.isArray(desc.Hallazgo)
                  ? desc.Hallazgo.map((url, i) =>
                      url.includes(firePrefix)
                        ? <img key={i} src={url} alt={`Evidencia ${i+1}`} className="ev-img"/>
                        : <span key={i} className="ev-text">{url}</span>
                    )
                  : (desc.Hallazgo
                      ? (desc.Hallazgo.includes(firePrefix)
                          ? <img src={desc.Hallazgo} alt="Evidencia" className="ev-img"/>
                          : <span className="ev-text">{desc.Hallazgo}</span>)
                      : <span className="muted">Sin evidencia</span>
                    );

                const estadoTxt = ish ? ish.estado : 'Pendiente';
                const estadoColor = ish ? estadoToColor(ish.estado) : '#6e6e6e';

                // ⬅️ NUEVO: abrir sólo si corresponde
                let canOpen = !!ish;
                if (canOpen && restrictOpenToAssigned && !isAdmin) {
                  if (filterToAssignedOf) {
                    canOpen = ish.auditado === filterToAssignedOf;
                  } else {
                    canOpen = isAssignedToAuditor(ish);
                  }
                }

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
                        <button
                          className="ish-state-chip"
                          style={{ backgroundColor: estadoColor, cursor: canOpen ? 'pointer' : 'not-allowed' }}
                          title={ish ? (canOpen ? 'Abrir Ishikawa' : 'No asignado a ti') : 'Sin Ishikawa (pendiente)'}
                          onClick={() => canOpen && onGoIshikawa?.(dato._id, desc.ID, programa.Nombre)}
                          disabled={!canOpen}
                          aria-disabled={!canOpen}
                        >
                          {estadoTxt}
                        </button>

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