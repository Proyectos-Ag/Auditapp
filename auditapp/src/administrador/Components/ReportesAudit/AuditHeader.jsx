// src/features/auditoria/components/AuditHeader.jsx
import logo from "../assets/img/logoAguida.png";

export default function AuditHeader() {
  return (
    <div className="audit-header">
      <img src={logo} alt="Logo Empresa" className="audit-logo" />
      <div className='audit-title'>
        <h1>REPORTE DE AUDITORÍA</h1>
      </div>
    </div>
  );
}
