import React from 'react';

export default function Seccion4({ formData, handleChange, errors, inputClass, sectionRef }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 4: Descripción de la propuesta de cambio</h2>
      <div className="form-group">
        <textarea name="descripcionPropuesta" value={formData.descripcionPropuesta} onChange={handleChange} rows={6} className={inputClass('descripcionPropuesta')} placeholder="Describa detalladamente la propuesta de cambio..." />
        {errors.descripcionPropuesta && <span className="error-message">{errors.descripcionPropuesta}</span>}
      </div>
    </div>
  );
}