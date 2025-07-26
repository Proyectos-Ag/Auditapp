import React, { useState } from 'react';
import axios from 'axios'
import SignaturePopup from './SignaturePopup';
import './css/GestionForm.css';

const GestionCambioForm = () => {
  const [formData, setFormData] = useState({
    // Sección 1
    solicitante: '',
    areaSolicitante: '',
    lugar: '',
    liderProyecto: '',
    fechaSolicitud: '',
    fechaPlaneada: '',
    // Sección 2
    categoria: '',
    tipoCambio: '',
    productos: '',
    sistemasEquipos: '',
    localesProduccion: '',
    programasLimpieza: '',
    sistemasEmbalaje: '',
    nivelesPersonal: '',
    requisitosLegales: '',
    conocimientosPeligros: '',
    requisitosCliente: '',
    consultasPartes: '',
    quejasPeligros: '',
    otrasCondiciones: '',
    // Sección 3
    causa: {
      solicitudCliente: false,
      reparacionDefecto: false,
      accionPreventiva: false,
      actualizacionDocumento: false,
      accionCorrectiva: false,
      otros: '',
    },
    // Sección 4
    descripcionPropuesta: '',
    // Sección 5
    justificacion: '',
    // Sección 6
    implicaciones: {
      riesgos: false,
      recursos: false,
      documentacion: false,
      otros: '',
    },
    // Sección 7
    consecuencias: '',
    // Firmas
    firmadoPor: {
      solicitado: { nombre: '', cargo: '', firma: '' },
      evaluado: { nombre: '', cargo: '', firma: '' },
      aprobado: { nombre: '', cargo: '', firma: '' },
      implementado: { nombre: '', cargo: '', firma: '' },
      validado: { nombre: '', cargo: '', firma: '' },
    },
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [sigRole, setSigRole] = useState(null);
const [signatures, setSignatures] = useState({
  solicitado: null,
  evaluado: null,
  aprobado: null,
  implementado: null,
  validado: null
});

const openSignature = (role) => {
  setSigRole(role);
};

const handleSaveSig = (role, dataURL) => {
  console.log('Guardando firma para', role, dataURL);
  setFormData(prev => ({
    ...prev,
    firmadoPor: {
      ...prev.firmadoPor,
      [role]: {
        ...prev.firmadoPor[role],
        firma: dataURL
      }
    }
  }));
  setSigRole(null);
};
 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckbox = (e, section) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [name]: checked }
    }));
  };

  const handleFirmaChange = (e, role) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      firmadoPor: {
        ...prev.firmadoPor,
        [role]: { ...prev.firmadoPor[role], [name]: value }
      }
    }));
  };

  const validateSection = (section) => {
    const newErrors = {};
    
    switch(section) {
      case 1:
        if (!formData.solicitante) newErrors.solicitante = 'Requerido';
        if (!formData.areaSolicitante) newErrors.areaSolicitante = 'Requerido';
        if (!formData.lugar) newErrors.lugar = 'Requerido';
        if (!formData.fechaSolicitud) newErrors.fechaSolicitud = 'Requerido';
        if (!formData.fechaPlaneada) newErrors.fechaPlaneada = 'Requerido';
        break;
      case 2:
        if (!formData.categoria) newErrors.categoria = 'Requerido';
        if (!formData.tipoCambio) newErrors.tipoCambio = 'Seleccione un tipo';
        break;
      case 3:
        const causasSeleccionadas = Object.values(formData.causa)
          .filter(val => typeof val === 'boolean')
          .some(val => val === true);
        if (!causasSeleccionadas && !formData.causa.otros) {
          newErrors.causa = 'Seleccione al menos una causa';
        }
        break;
      case 4:
        if (!formData.descripcionPropuesta) newErrors.descripcionPropuesta = 'Requerido';
        break;
      case 5:
        if (!formData.justificacion) newErrors.justificacion = 'Requerido';
        break;
      case 6:
        const implicacionesSeleccionadas = Object.values(formData.implicaciones)
          .filter(val => typeof val === 'boolean')
          .some(val => val === true);
        if (!implicacionesSeleccionadas && !formData.implicaciones.otros) {
          newErrors.implicaciones = 'Seleccione al menos una implicación';
        }
        break;
      case 7:
        if (!formData.consecuencias) newErrors.consecuencias = 'Requerido';
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    if (validateSection(activeSection)) {
      if (activeSection < 8) {
        setActiveSection(activeSection + 1);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validar todas las secciones
    let isValid = true;
    for (let i = 1; i <= 7; i++) {
      if (!validateSection(i)) {
        isValid = false;
      }
    }
    
    // Validar firmas
    const firmasValidas = Object.values(formData.firmadoPor).every(
    persona => persona.nombre && persona.cargo && persona.firma
  );
    
    //if (!isValid || !firmasValidas) {
    //  setIsSubmitting(false);
    //  alert('Por favor complete todos los campos requeridos y verifique las firmas');
    //  return;
    //}
    
    try {
    // envía formData directamente al backend
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio`,
      formData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true // si necesitas cookies/autorización
      }
    );  

    console.log('Registro guardado:', response.data);
    setSubmitted(true);
  } catch (error) {
    console.error('Error al guardar en BD:', error.response ?? error);
    alert('Ocurrió un error al guardar. Revisa la consola.');
  } finally {
    setIsSubmitting(false);
  }
};

  const renderSection = () => {
    switch(activeSection) {
      case 1:
        return (
          <div className="form-section">
            <h2>Sección 1: Datos de la solicitud del cambio</h2>
            <div className="form-group">
              <label>Solicitante del cambio*</label>
              <input 
                type="text" 
                name="solicitante" 
                value={formData.solicitante} 
                onChange={handleChange} 
                className={errors.solicitante ? 'error' : ''}
              />
              {errors.solicitante && <span className="error-message">{errors.solicitante}</span>}
            </div>
            
            <div className="form-group">
              <label>Área del solicitante*</label>
              <input 
                type="text" 
                name="areaSolicitante" 
                value={formData.areaSolicitante} 
                onChange={handleChange} 
                className={errors.areaSolicitante ? 'error' : ''}
              />
              {errors.areaSolicitante && <span className="error-message">{errors.areaSolicitante}</span>}
            </div>
            
            <div className="form-group">
              <label>Lugar*</label>
              <input 
                type="text" 
                name="lugar" 
                value={formData.lugar} 
                onChange={handleChange} 
                className={errors.lugar ? 'error' : ''}
              />
              {errors.lugar && <span className="error-message">{errors.lugar}</span>}
            </div>
            
            <div className="form-group">
              <label>Líder del proyecto</label>
              <input 
                type="text" 
                name="liderProyecto" 
                value={formData.liderProyecto} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Fecha de solicitud del cambio*</label>
              <input 
                type="date" 
                name="fechaSolicitud" 
                value={formData.fechaSolicitud} 
                onChange={handleChange} 
                className={errors.fechaSolicitud ? 'error' : ''}
              />
              {errors.fechaSolicitud && <span className="error-message">{errors.fechaSolicitud}</span>}
            </div>
            
            <div className="form-group">
              <label>Fecha planeada para realizar el cambio*</label>
              <input 
                type="date" 
                name="fechaPlaneada" 
                value={formData.fechaPlaneada} 
                onChange={handleChange} 
                className={errors.fechaPlaneada ? 'error' : ''}
              />
              {errors.fechaPlaneada && <span className="error-message">{errors.fechaPlaneada}</span>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="form-section">
            <h2>Sección 2: Notificación de Solicitud de Cambio</h2>
            
            <div className="form-group">
              <label>Tipo de cambio*</label>
              <div className="radio-group">
                {['Permanente', 'De emergencia', 'Temporal'].map(option => (
                  <label key={option} className="radio-option">
                    <input
                      type="radio"
                      name="tipoCambio"
                      value={option}
                      checked={formData.tipoCambio === option}
                      onChange={handleChange}
                    />
                    {option}
                  </label>
                ))}
              </div>
              {errors.tipoCambio && <span className="error-message">{errors.tipoCambio}</span>}
            </div>
            
            {[
              { key: 'productos', label: 'Productos nuevos, MP´S, ingredientes y servicios' },
              { key: 'sistemasEquipos', label: 'Sistemas y equipos de producción' },
              { key: 'localesProduccion', label: 'Locales de producción, ubicación de los equipos, entorno circundante' },
              { key: 'programasLimpieza', label: 'Programas de limpieza y desinfección' },
              { key: 'sistemasEmbalaje', label: 'Sistemas de embalaje, almacenamiento y distribución' },
              { key: 'nivelesPersonal', label: 'Niveles de calificación del personal y/o asignación de responsabilidades  y autorizaciones' },
              { key: 'requisitosLegales', label: 'Requisitos legales y reglamentarios' },
              { key: 'conocimientosPeligros', label: 'Conocimientos relativos a los peligros para la inocuidad de los alimentos y medidas de control' },
              { key: 'requisitosCliente', label: 'Requisitos del cliente, del sector y otros requisitos que la organización tiene en cuenta' },
              { key: 'consultasPartes', label: 'Consultas pertinentes de las partes interesadas externas' },
              { key: 'quejasPeligros', label: 'Quejas indicando peligros relacionados con la inocuidad de los alimentos, asociados al producto' },
              { key: 'otrasCondiciones', label: 'Otras condiciones que tenga impacto en la inocuidad de los alimentos' },
            ].map(({ key, label }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <textarea 
                  name={key} 
                  value={formData[key]} 
                  onChange={handleChange} 
                  rows={3} 
                />
              </div>
            ))}
          </div>
        );
        
      case 3:
        return (
          <div className="form-section">
            <h2>Sección 3: Causa/Origen del cambio</h2>
            {errors.causa && <div className="error-message">{errors.causa}</div>}
            
            {[
              { key: 'solicitudCliente', label: 'Solicitud Cliente' },
              { key: 'reparacionDefecto', label: 'Reparación de defecto' },
              { key: 'accionPreventiva', label: 'Acción preventiva' },
              { key: 'actualizacionDocumento', label: 'Actualización / modificación de documento' },
              { key: 'accionCorrectiva', label: 'Acción correctiva' },
            ].map(({ key, label }) => (
              <div className="form-group checkbox-group" key={key}>
                <label>
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData.causa[key]}
                    onChange={e => handleCheckbox(e, 'causa')}
                  />
                  {label}
                </label>
              </div>
            ))}
            
            <div className="form-group">
              <label>Otros:</label>
              <input 
                type="text" 
                name="otros" 
                value={formData.causa.otros} 
                onChange={e => handleCheckbox(e, 'causa')} 
              />
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="form-section">
            <h2>Sección 4: Descripción de la propuesta de cambio</h2>
            <div className="form-group">
              <textarea 
                name="descripcionPropuesta" 
                value={formData.descripcionPropuesta} 
                onChange={handleChange} 
                rows={6} 
                className={errors.descripcionPropuesta ? 'error' : ''}
                placeholder="Describa detalladamente la propuesta de cambio..."
              />
              {errors.descripcionPropuesta && <span className="error-message">{errors.descripcionPropuesta}</span>}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="form-section">
            <h2>Sección 5: Justificación de la propuesta de cambio</h2>
            <div className="form-group">
              <textarea 
                name="justificacion" 
                value={formData.justificacion} 
                onChange={handleChange} 
                rows={6} 
                className={errors.justificacion ? 'error' : ''}
                placeholder="Explique por qué se propone este cambio..."
              />
              {errors.justificacion && <span className="error-message">{errors.justificacion}</span>}
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="form-section">
            <h2>Sección 6: Implicaciones del cambio</h2>
            {errors.implicaciones && <div className="error-message">{errors.implicaciones}</div>}
            
            {[
              { key: 'riesgos', label: 'Riesgos' },
              { key: 'recursos', label: 'Recursos' },
              { key: 'documentacion', label: 'Documentación' },
            ].map(({ key, label }) => (
              <div className="form-group checkbox-group" key={key}>
                <label>
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData.implicaciones[key]}
                    onChange={e => handleCheckbox(e, 'implicaciones')}
                  />
                  {label}
                </label>
              </div>
            ))}
            
            <div className="form-group">
              <label>Otros:</label>
              <input 
                type="text" 
                name="otros" 
                value={formData.implicaciones.otros} 
                onChange={e => handleCheckbox(e, 'implicaciones')} 
              />
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="form-section">
            <h2>Sección 7: Consecuencias de no realizar el cambio</h2>
            <div className="form-group">
              <textarea 
                name="consecuencias" 
                value={formData.consecuencias} 
                onChange={handleChange} 
                rows={6} 
                className={errors.consecuencias ? 'error' : ''}
                placeholder="Describa las consecuencias de no implementar este cambio..."
              />
              {errors.consecuencias && <span className="error-message">{errors.consecuencias}</span>}
            </div>
          </div>
        );
        
      case 8:
        return (
          <div className="form-section">
            <h2>Firmas</h2>
            {['solicitado', 'evaluado', 'aprobado', 'implementado', 'validado'].map(role => (
              <fieldset key={role} className="signature-group">
                <legend>{role.charAt(0).toUpperCase() + role.slice(1)} por:</legend>
                <div className="form-group">
                  <label>Nombre*</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={formData.firmadoPor[role].nombre} 
                    onChange={e => handleFirmaChange(e, role)} 
                  />
                </div>
                <div className="form-group">
                  <label>Cargo*</label>
                  <input 
                    type="text" 
                    name="cargo" 
                    value={formData.firmadoPor[role].cargo} 
                    onChange={e => handleFirmaChange(e, role)} 
                  />
                </div>
                 <div className="form-group">
            <label>Firma*</label>
            <button 
              type="button" 
              onClick={() => openSignature(role)}
              className="signature-btn"
            >
              {formData.firmadoPor[role].firma ? 'Re-firmar' : 'Firmar'}
            </button>
            {formData.firmadoPor[role].firma && (
              <div className="signature-preview">
                <img 
                  src={formData.firmadoPor[role].firma} 
                  alt={`Firma ${role}`} 
                  height="50" 
                />
                <span>Firma capturada</span>
              </div>
            )}
          </div>
        </fieldset>
      ))}
    </div>
  );
        
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="confirmation">
        <h2>¡Solicitud Enviada con Éxito!</h2>
        <div className="checkmark">✓</div>
        <p>Su solicitud de cambio ha sido registrada correctamente.</p>
        <button onClick={() => {
          setActiveSection(1);
          setSubmitted(false);
          setFormData({ /* estado inicial completo */ });
          setSignatures({
            solicitado: null,
            evaluado: null,
            aprobado: null,
            implementado: null,
            validado: null
          });
        }} className="btn-primary">
          Crear Nueva Solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>Formulario de Gestión de Cambios</h1>
        <p>Complete todas las secciones para registrar una solicitud de cambio</p>
      </div>
      
      <div className="progress-bar">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((section) => (
          <div 
            key={section} 
            className={`progress-step ${section <= activeSection ? 'active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            <div className="step-number">{section}</div>
            <div className="step-label">
              {section === 1 && 'Datos'}
              {section === 2 && 'Notificación'}
              {section === 3 && 'Causa'}
              {section === 4 && 'Descripción'}
              {section === 5 && 'Justificación'}
              {section === 6 && 'Implicaciones'}
              {section === 7 && 'Consecuencias'}
              {section === 8 && 'Firmas'}
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={activeSection === 8 ? handleSubmit : handleSectionSubmit}>
        {renderSection()}
        
        <div className="form-navigation">
          {activeSection > 1 && (
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setActiveSection(activeSection - 1)}
            >
              Anterior
            </button>
          )}
          
          {activeSection < 8 ? (
            <button type="submit" className="btn-primary">
              Siguiente
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          )}
        </div>
      </form>
      <SignaturePopup
        open={!!sigRole}
        role={sigRole}
        onSave={handleSaveSig}
        onClose={() => setSigRole(null)}
      />
    </div>
  );
};

export default GestionCambioForm;