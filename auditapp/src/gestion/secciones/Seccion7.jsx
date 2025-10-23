import React from 'react';

export default function Seccion7({ formData, handleChange, errors, inputClass, sectionRef }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 7: Consecuencias de no realizar el cambio</h2>
      <div className="form-group">
        <textarea name="consecuencias" value={formData.consecuencias} onChange={handleChange} rows={6} className={inputClass('consecuencias')} placeholder="Describa las consecuencias de no implementar este cambio..." />
        {errors.consecuencias && <span className="error-message">{errors.consecuencias}</span>}
      </div>
    </div>
  );
}