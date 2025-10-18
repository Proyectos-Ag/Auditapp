// src/features/auditoria/components/ActionBar.jsx
export default function ActionBar({
  variant,
  onNotaToggle,     // () => void
  notaVisible,
  onRechazar,       // () => void
  onAprobar,        // () => void
  onEliminar,       // () => void
  onFinalizar,      // () => void
  onExportPDF,      // () => void
}) {
  return (
    <div className="action-bar">
      <button className="btn-secondary" onClick={onExportPDF}>Guardar como PDF</button>

      {variant === 'revision' && (
        <>
          <button className="btn-info" onClick={onNotaToggle}>
            {notaVisible ? 'Ocultar nota' : 'Escribir nota'}
          </button>
          <button className="btn-danger" onClick={onRechazar}>Rechazar</button>
          <button className="btn-success" onClick={onAprobar}>Aprobar</button>
          <button className="btn-danger-outline" onClick={onEliminar}>Eliminar</button>
        </>
      )}

      {variant === 'terminada' && (
        <>
          <button className="btn-danger-outline" onClick={onEliminar}>Eliminar</button>
          <button className="btn-success" onClick={onFinalizar}>Finalizar</button>
        </>
      )}

      {variant === 'finalizada' && (
        <>
          {/* Solo lectura, pero dejamos export */}
        </>
      )}
    </div>
  );
}