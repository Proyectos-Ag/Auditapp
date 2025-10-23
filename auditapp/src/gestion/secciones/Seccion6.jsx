import React from 'react';

export default function Seccion6({ formData, errors, handleImplicacionToggle, sectionRef }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 6: Implicaciones del cambio</h2>
      {errors.implicaciones && <div className="error-message">{errors.implicaciones}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { key: 'riesgos', label: 'Riesgos' },
          { key: 'recursos', label: 'Recursos' },
          { key: 'documentacion', label: 'Documentación' },
          { key: 'otros', label: 'Otros' } // ahora es checkbox igual que los demás
        ].map(({ key, label }) => (
          <label key={key} className="checkbox-inline">
            <input
              type="checkbox"
              name={key}
              checked={!!(formData.implicaciones && formData.implicaciones[key])}
              onChange={(e) => handleImplicacionToggle(key, e.target.checked)}
            />{' '}
            {label}
          </label>
        ))}
      </div>

      <p style={{ marginTop: 12, fontStyle: 'italic' }}>
        Nota: Las implicaciones seleccionadas en esta sección generan automáticamente una card en la Sección 8 por tipo (Riesgos, Recursos, Documentación, Otros). No se pueden agregar cards manualmente en la Sección 8.
      </p>
    </div>
  );
}
