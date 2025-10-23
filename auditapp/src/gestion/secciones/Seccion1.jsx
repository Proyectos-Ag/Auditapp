import React from 'react';

export default function Seccion1({ formData, handleChange, errors, inputClass, sectionRef }) {
  return (
    <div className="form-section" ref={sectionRef}>
      <h2>Sección 1: Datos de la solicitud del cambio</h2>
      <div className="form-group">
        <label>Solicitante del cambio*</label>
        <input type="text" name="solicitante" value={formData.solicitante} onChange={handleChange} className={inputClass('solicitante')} />
        {errors.solicitante && <span className="error-message">{errors.solicitante}</span>}
      </div>
      <div className="form-group">
        <label>Área del solicitante*</label>
        <input type="text" name="areaSolicitante" value={formData.areaSolicitante} onChange={handleChange} className={inputClass('areaSolicitante')} />
        {errors.areaSolicitante && <span className="error-message">{errors.areaSolicitante}</span>}
      </div>
      <div className="form-group">
        <label>Lugar*</label>
        <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} className={inputClass('lugar')} />
        {errors.lugar && <span className="error-message">{errors.lugar}</span>}
      </div>
      <div className="form-group">
        <label>Líder del proyecto</label>
        <input type="text" name="liderProyecto" value={formData.liderProyecto} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Fecha de solicitud del cambio*</label>
        <input type="date" name="fechaSolicitud" value={formData.fechaSolicitud} onChange={handleChange} className={inputClass('fechaSolicitud')} />
        {errors.fechaSolicitud && <span className="error-message">{errors.fechaSolicitud}</span>}
      </div>
      <div className="form-group">
        <label>Fecha planeada para realizar el cambio*</label>
        <input type="date" name="fechaPlaneada" value={formData.fechaPlaneada} onChange={handleChange} className={inputClass('fechaPlaneada')} />
        {errors.fechaPlaneada && <span className="error-message">{errors.fechaPlaneada}</span>}
      </div>
    </div>
  );
}