// src/features/auditoria/components/AuditScope.jsx
export default function AuditScope({ dato }) {
  return (
    <div className='audit-scope'>
      <table>
        <thead>
          <tr><th colSpan="2" className="thead-green">Alcance</th></tr>
          <tr>
            <td className="th-cell">Documento de Referencia</td>
            <td className="th-cell">Alcance de Auditoría</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {dato.Referencia ? (
                <div>{dato.Referencia}</div>
              ) : (
                dato.Programa?.map((p, i) => <div key={i}>{p.Nombre}</div>)
              )}
            </td>
            <td>{dato.Alcance ?? dato.AreasAudi}</td>
          </tr>
          <tr>
            <td className="th-cell">Equipo auditor</td>
            <td className="th-cell">Participantes en área del recorrido</td>
          </tr>
          <tr>
            <td>
              <div>Auditor líder: {dato.AuditorLider}</div>
              <div>{dato.EquipoAuditor?.map((e,i) => <div key={i}>Equipo auditor: {e.Nombre}</div>)}</div>
              {dato.NombresObservadores && <div>Observador(es): {dato.NombresObservadores}</div>}
            </td>
            <td>
              <div>{dato.Auditados?.map((a,i) => <div key={i}>{a.Nombre}</div>)}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}