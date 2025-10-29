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

  // restringir apertura a asignados (auditor/auditado)
  restrictOpenToAssigned = false,
  currentAuditorEmail,
  currentAuditorName,
}) {
  const firePrefix = 'https://firebasestorage';
  const evidenceHeader = dato?.PuntuacionMaxima ? 'Hallazgo' : 'Evidencia';
  const isApproved = variant === 'terminada' || variant === 'finalizada'; // ⬅️ NUEVO

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

  // actualizado: usa filtros o fallback a currentAuditor*
const isAssignedToAuditor = (ish) => {
  if (!ish) return false;
  const eq = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

  const email = (filterToAssignedAuditorEmail || currentAuditorEmail || '').toLowerCase();
  const name  = (filterToAssignedAuditorName  || currentAuditorName  || '').toLowerCase();

  // campos directos típicos
  if (email && (eq(ish.auditorEmail, email) || eq(ish.auditorAsignadoCorreo, email) || eq(ish.asignadoAuditorCorreo, email))) return true;
  if (name  && (eq(ish.auditor, name) || eq(ish.auditorAsignado, name) || eq(ish.asignadoAuditorNombre, name))) return true;

  // asignado {correo|email|nombre}
  const asignado = ish.asignadoAuditor || ish.asignadoA || ish.asignado;
  if (asignado) {
    if (email && (eq(asignado.correo, email) || eq(asignado.email, email))) return true;
    if (name  && eq(asignado.nombre, name)) return true;
  }

  // ✅ considerar responsables de actividades como asignación válida del AUDITOR
  const responsables = Array.isArray(ish.actividades)
    ? ish.actividades.flatMap(a => Array.isArray(a?.responsable) ? a.responsable : [])
    : [];
  for (const r of responsables) {
    if (email && (eq(r?.correo, email) || eq(r?.email, email))) return true;
    if (name  && eq(r?.nombre, name)) return true;
  }

  // también permitir por correo del propio ishikawa (cuando se asigna por correo)
  if (email && eq(ish.correo, email)) return true;

  // acceso explícito
  if (Array.isArray(ish.acceso)) {
    for (const a of ish.acceso) {
      const acEmail = typeof a === 'string' ? a : (a?.correo || a?.email);
      const acName  = typeof a === 'string' ? '' : (a?.nombre);
      if (email && eq(acEmail, email)) return true;
      if (name  && eq(acName, name)) return true;
    }
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
                const critRaw = (desc?.Criterio || '').toString();
                const crit = critRaw.toLowerCase();
                const isConforme = crit === 'conforme';

                // “Conforme” puede mostrarse solo si showConformes=true (visual), jamás se asigna ni se abre estado
                if (!critRaw || crit === 'na' || (isConforme && !showConformes)) return null;

                const rowId = `${programIdx}-${descIdx}`;
                if (hiddenRows[rowId]) return null;

                // 🔎 Lookup robusto que tolera saltos de línea, mayúsculas, espacios, etc.
                const norm = (s) => String(s || '')
                  .replace(/\r\n|\r/g, '\n')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .toLowerCase();

                const rawKey = `${desc.ID}-${dato._id}-${programa.Nombre}`;
                let ish = ishikawasMap?.[rawKey];

                // Fallbacks: misma clave normalizada o búsqueda por campos (idRep + idReq [+ proName cerca])
                if (!ish && ishikawasMap) {
                  const normKey = `${norm(desc.ID)}-${dato._id}-${norm(programa.Nombre)}`;
                  ish = ishikawasMap?.[normKey];

                  if (!ish) {
                    const vals = Object.values(ishikawasMap);
                    ish =
                      vals.find(it => it?.idRep === dato._id && norm(it?.idReq) === norm(desc.ID) && norm(it?.proName) === norm(programa.Nombre)) ||
                      vals.find(it => it?.idRep === dato._id && norm(it?.idReq) === norm(desc.ID)); // último fallback
                  }
                }


                // Filtro "solo asignados" por-reporte
                if (showOnlyAssigned) {
                  if (filterToAssignedAuditorEmail || filterToAssignedAuditorName) {
                    if (!ish) return null;
                    if (!isAssignedToAuditor(ish)) return null;
                  } else {
                    if (!ish) return null;
                    if (filterToAssignedOf) {
                      const sameName  = String(ish?.auditado || '').trim().toLowerCase() === String(filterToAssignedOf).trim().toLowerCase();
                      const userEmail = (filterToAssignedAuditorEmail || currentAuditorEmail || '').toLowerCase();
                      const sameEmail = String(ish?.correo || '').toLowerCase() === userEmail;
                      if (!sameName && !sameEmail) return null;
                    }
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

                // ⬇️ abrir solo si: existe ish, está aprobado y NO es Conforme
                let canOpen = !!ish && isApproved && !isConforme;
                  if (canOpen && restrictOpenToAssigned && !isAdmin) {
                    if (filterToAssignedOf) {
                      // auditado: solo si su nombre coincide
                      canOpen = ish.auditado === filterToAssignedOf;
                    } else {
                      // auditor: solo si está asignado (no basta con ser del equipo)
                      canOpen = isAssignedToAuditor(ish);
                    }
                  }

                return (
                  <tr key={rowId}>
                    <td>{desc.ID}</td>
                    <td className="left">{programa.Nombre}</td>
                    <td className="justify">{desc.Requisito}</td>
                    <td>{critRaw}</td>
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

                      {/* ⬇️ Mostrar chip de estado y botón Asignar SOLO si está aprobado y NO es Conforme */}
                      {isApproved && !isConforme && (
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
                      )}
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