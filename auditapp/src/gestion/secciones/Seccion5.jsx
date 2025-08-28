import React from 'react';

export default function Seccion5({ formData, handleChange, errors, inputClass, sectionRef }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 5: Justificación de la propuesta de cambio</h2>
      <div className="form-group">
        <textarea name="justificacion" value={formData.justificacion} onChange={handleChange} rows={6} className={inputClass('justificacion')} placeholder="Explique por qué se propone este cambio..." />
        {errors.justificacion && <span className="error-message">{errors.justificacion}</span>}
      </div>
    </div>
  );
}