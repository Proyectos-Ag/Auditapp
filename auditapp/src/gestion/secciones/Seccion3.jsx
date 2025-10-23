import React from 'react';

export default function Seccion3({ formData, errors, handleNestedChange, sectionRef }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 3: Causa/Origen del cambio</h2>
      {errors.causa && <div className="error-message">{errors.causa}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { key: 'solicitudCliente', label: 'Solicitud Cliente' },
          { key: 'reparacionDefecto', label: 'Reparación de defecto' },
          { key: 'accionPreventiva', label: 'Acción preventiva' },
          { key: 'actualizacionDocumento', label: 'Actualización / modificación de documento' },
          { key: 'accionCorrectiva', label: 'Acción correctiva' },
        ].map(({ key, label }) => (
          <label key={key} className="checkbox-inline">
            <input type="checkbox" name={key} checked={formData.causa[key]} onChange={(e) => handleNestedChange('causa', key, e.target.checked)} /> {label}
          </label>
        ))}
      </div>
      <div className="form-group" style={{ marginTop: 12 }}>
        <label>Otros:</label>
        <input type="text" value={formData.causa.otros} onChange={(e) => handleNestedChange('causa', 'otros', e.target.value)} />
      </div>
    </div>
  );
}