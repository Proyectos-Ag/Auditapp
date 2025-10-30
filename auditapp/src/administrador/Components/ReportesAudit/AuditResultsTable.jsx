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

  if (email && (eq(ish.correo, email))) return true;

  // asignado {correo|email|nombre}
  const asignado = ish.asignadoAuditor || ish.asignadoA || ish.asignado;
  if (asignado) {
    if (email && (eq(asignado.correo, email) || eq(asignado.email, email))) return true;
    if (name  && eq(asignado.nombre, name)) return true;
  }

  // también permitir por correo del propio ishikawa (cuando se asigna por correo)
  if (email && eq(ish.correo, email)) return true;

  console.log('Verificando acceso explícito en ish.acceso:', ish.acceso);

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

// Normalizar acentos y espacios
const stripAccents = (s) =>
  String(s || '')
    .normalize?.('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita diacríticos
    .trim();

const norm = (s) =>
  stripAccents(s)
    .replace(/\r\n|\r/g, '\n')
    .replace(/\s+/g, ' ')
    .toLowerCase();

// Comparar idRep tolerando ObjectId / {$oid}
const sameRep = (a, b) => {
  const ax = String(a && (a.$oid || a));
  const bx = String(b && (b.$oid || b));
  return ax === bx;
};

// Búsqueda robusta en el mapa: clave directa, clave normalizada y barrido por campos
const findIsh = (ishMap, { idRep, idReq, proName }) => {
  if (!ishMap) return undefined;

  // 1) clave directa usada por tu backend
  const rawKey = `${idReq}-${idRep}-${proName}`;
  if (ishMap[rawKey]) return ishMap[rawKey];

  // 2) clave normalizada
  const normKey = `${norm(idReq)}-${String(idRep)}-${norm(proName)}`;
  if (ishMap[normKey]) return ishMap[normKey];

  // 3) barrido por coincidencia de campos
  const vals = Object.values(ishMap);
  return (
    vals.find(
      (it) =>
        sameRep(it?.idRep, idRep) &&
        norm(it?.idReq) === norm(idReq) &&
        norm(it?.proName) === norm(proName)
    ) ||
    // último fallback: ignora proName
    vals.find(
      (it) => sameRep(it?.idRep, idRep) && norm(it?.idReq) === norm(idReq)
    )
  );
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

                const ish = findIsh(ishikawasMap, {
                  idRep: dato?._id,
                  idReq: desc?.ID,
                  proName: programa?.Nombre,
                });

                {console.log('Revisando fila:', { ish });}

                // Filtro "solo asignados" por-reporte
                if (showOnlyAssigned) {
                  const vals = Object.values(ishikawasMap || {});
                  if (filterToAssignedOf) {
                    const userEmail = (currentAuditorEmail || '').toLowerCase();
                    const passesAuditado = ish && (
                      String(ish?.auditado || '').trim().toLowerCase() === String(filterToAssignedOf).trim().toLowerCase() ||
                      String(ish?.correo || '').toLowerCase() === userEmail
                    );
                    if (!passesAuditado) return null;
                  } else {
                    let assignedMatch = false;
                    if (ish) {
                      assignedMatch = isAssignedToAuditor(ish);
                    } else {
                      assignedMatch = vals.some(
                        (it) =>
                          sameRep(it?.idRep, dato?._id) &&
                          norm(it?.idReq) === norm(desc?.ID) &&
                          isAssignedToAuditor(it)
                      );
                    }
                    if (!assignedMatch) return null;
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
                      {!isConforme && (
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