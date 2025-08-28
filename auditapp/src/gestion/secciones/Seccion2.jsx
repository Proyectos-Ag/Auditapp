import React from 'react';

export default function Seccion2({ formData, handleChange, errors, inputClass, sectionRef, impactoOptions, handleImpactoTextareaChange }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 2: Notificación de Solicitud de Cambio</h2>
      <div className="form-group">
        <label>Tipo de cambio*</label>
        <select name="tipoCambio" value={formData.tipoCambio} onChange={handleChange} className={inputClass('tipoCambio')}>
          <option value="">-- Seleccione --</option>
          <option value="Permanente">Permanente</option>
          <option value="De emergencia">De emergencia</option>
          <option value="Temporal">Temporal</option>
        </select>
        {errors.tipoCambio && <span className="error-message">{errors.tipoCambio}</span>}
      </div>

      <div className="form-group">
        <label>Impactos (seleccione uno o varios):</label>
        <select multiple value={formData.impactosSeleccionados} onChange={handleChange} style={{ minHeight: 120 }}>
          {impactoOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
        </select>
        <small>Puede mantener Ctrl/Cmd para seleccionar varios.</small>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {formData.impactosSeleccionados.map(key => {
          const opt = impactoOptions.find(o => o.key === key);
          return (
            <div className="form-group" key={key}>
              <label style={{ fontSize: 14 }}>{opt ? opt.label : key}</label>
              <textarea rows={3} value={formData.impactosData[key] || ''} onChange={(e) => handleImpactoTextareaChange(key, e.target.value)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}