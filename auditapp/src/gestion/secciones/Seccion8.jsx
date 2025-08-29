import React, { useState, useEffect, useRef } from 'react';

export default function Seccion8({
  formData,
  updateRiesgoCardField,
  toggleInvolucrado,
  updateInvolucradoField,
  addNewCard,
  removeCardById,
  sectionRef
}) {
  const [openMap, setOpenMap] = useState({});
  const prevLenRef = useRef((formData.riesgosCards || []).length);

  useEffect(() => {
    const len = (formData.riesgosCards || []).length;
    if (len > prevLenRef.current) {
      const last = formData.riesgosCards[formData.riesgosCards.length - 1];
      if (last) setOpenMap(p => ({ ...p, [last.id]: true }));
    }
    prevLenRef.current = len;
  }, [formData.riesgosCards]);

  const toggleOpen = (id) => setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));

  const canAddRiesgo = !!(formData.implicaciones && formData.implicaciones.riesgos);
  const canAddRecurso = !!(formData.implicaciones && formData.implicaciones.recursos);
  const canAddDoc = !!(formData.implicaciones && formData.implicaciones.documentacion);

  function computeNivelRiesgo(probabilidadVal, severidadVal) {
    const prob = parseInt(probabilidadVal, 10);
    const sev = (severidadVal || '').toUpperCase();

    if (isNaN(prob) || !sev) return '';

    if (prob === 1) return 'NIVEL DE RIESGO NO SIGNIFICATIVO';
    if (prob === 4) return 'NIVEL DE RIESGO SIGNIFICATIVO';
    if (prob === 2 || prob === 3) {
      if (sev === 'A' || sev === 'B') return 'NIVEL DE RIESGO SIGNIFICATIVO';
      return 'NIVEL DE RIESGO NO SIGNIFICATIVO';
    }

    return '';
  }

  return (
    <div className="form-section" ref={sectionRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2>Sección 8: RIESGOS (auto-generados desde Sección 6)</h2>
          <p className="muted">Las cards se crean desde Sección 6. Complete primero el <strong>Tipo específico</strong> dentro de cada card (p.ej. "Tipo de peligro", "Tipo de recursos" o "Tipo de documento").</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {canAddRiesgo && <button type="button" className="btn-primary" onClick={() => addNewCard('IMPLICACION_DE_RIESGOS')}>+ Agregar Riesgo</button>}
          {canAddRecurso && <button type="button" className="btn-primary" onClick={() => addNewCard('RECURSOS')}>+ Agregar Recurso</button>}
          {canAddDoc && <button type="button" className="btn-primary" onClick={() => addNewCard('DOCUMENTOS')}>+ Agregar Documento</button>}
        </div>
      </div>

      {(formData.riesgosCards || []).length === 0 && <div className="info">No hay cards aún. Seleccione implicaciones en la Sección 6 para generar la card inicial o use los botones para agregar más.</div>}

      <div className="riesgo-grid">
        {(formData.riesgosCards || []).map((card, idx) => {
          const open = !!openMap[card.id];
          const titleSimple = card.tipoImplicacion === 'OTRAS' ? (card.otherLabel || 'OTRAS') : (card.tipoImplicacion || '').replaceAll('_', ' ');
          const isRiesgo = card.tipoImplicacion === 'IMPLICACION_DE_RIESGOS';
          const isRecurso = card.tipoImplicacion === 'RECURSOS';
          const isDocumento = card.tipoImplicacion === 'DOCUMENTOS';

          const implicSel = formData.implicaciones || {};
          const cannotRemoveBecauseImplic =
            (card.tipoImplicacion === 'IMPLICACION_DE_RIESGOS' && implicSel.riesgos) ||
            (card.tipoImplicacion === 'RECURSOS' && implicSel.recursos) ||
            (card.tipoImplicacion === 'DOCUMENTOS' && implicSel.documentacion);

          const miniTipo = isRiesgo ? (card.tipoPeligro || '') : isRecurso ? (card.tipoRecursos || '') : isDocumento ? (card.nombreDocumento || card.tipoDocumento || '') : '';
          const miniNivel = isRiesgo ? (card.nivelRiesgo || '') : '';
          const miniConsecuencias = isRiesgo ? ((card.consecuencias || '').slice(0, 80)) : '';

          return (
            <article key={card.id} className="riesgo-card">
              <header className="riesgo-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="riesgo-pill">{titleSimple}</div>
                  <h4 className="riesgo-title">{titleSimple} #{idx + 1}</h4>

                  {!open && (miniTipo || miniNivel || miniConsecuencias) && (
                    <div className="riesgo-mini-info" style={{ marginTop: 6, fontSize: 13, color: '#444' }}>
                      {miniTipo && <span style={{ marginRight: 10 }}><strong>Tipo:</strong> {miniTipo}</span>}
                      {miniNivel && <span style={{ marginRight: 10 }}><strong>Nivel:</strong> {miniNivel}</span>}
                      {miniConsecuencias && <span><strong>Consecuencias:</strong> {miniConsecuencias}{(card.consecuencias || '').length > 80 ? '…' : ''}</span>}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" className="btn-ghost" onClick={() => toggleOpen(card.id)} aria-expanded={open}>
                    {open ? 'Minimizar' : 'Expandir'}
                  </button>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      if (cannotRemoveBecauseImplic) {
                        alert('No puede eliminar esta card mientras la implicación correspondiente esté marcada en la Sección 6.');
                        return;
                      }
                      if (window.confirm('Eliminar esta card?')) removeCardById(card.id);
                    }}
                    disabled={cannotRemoveBecauseImplic}
                    title={cannotRemoveBecauseImplic ? 'No puede eliminar esta card mientras la implicación esté activa (Sección 6).' : ''}
                  >
                    Eliminar
                  </button>
                </div>
              </header>

              {open && (
                <div className="riesgo-card-body open" style={{ marginTop: 12 }}>
                  {isRiesgo && (
                    <>
                      <div className="grid-3-cols">
                        <div className="form-group compact">
                          <label>TIPO DE PELIGRO *</label>
                          <select value={card.tipoPeligro || ''} onChange={(e) => updateRiesgoCardField(card.id, 'tipoPeligro', e.target.value)}>
                            <option value="">-- Seleccione --</option>
                            <option value="FISICO">FÍSICO</option>
                            <option value="QUIMICO">QUÍMICO</option>
                            <option value="BIOLOGICO">BIOLÓGICO</option>
                            <option value="OTRO">OTRO</option>
                          </select>
                        </div>

                        <div className="form-group compact">
                          <label>PROBABILIDAD</label>
                          <select
                            value={card.probabilidad || ''}
                            onChange={(e) => {
                              const newProb = e.target.value;
                              updateRiesgoCardField(card.id, 'probabilidad', newProb);
                              const nivel = computeNivelRiesgo(newProb, card.severidad);
                              updateRiesgoCardField(card.id, 'nivelRiesgo', nivel);
                            }}
                          >
                            <option value="">-- Seleccione --</option>
                            <option value="1">1 - REMOTA (1 a 2 años)</option>
                            <option value="2">2 - OCASIONAL (1 año)</option>
                            <option value="3">3 - PROBABLE (1 a 6 meses)</option>
                            <option value="4">4 - FRECUENTE (inherente 1-3 sem)</option>
                          </select>
                        </div>

                        <div className="form-group compact">
                          <label>SEVERIDAD</label>
                          <select
                            value={card.severidad || ''}
                            onChange={(e) => {
                              const newSev = e.target.value;
                              updateRiesgoCardField(card.id, 'severidad', newSev);
                              const nivel = computeNivelRiesgo(card.probabilidad, newSev);
                              updateRiesgoCardField(card.id, 'nivelRiesgo', nivel);
                            }}
                          >
                            <option value="">-- Seleccione --</option>
                            <option value="A">A - PONE EN RIESGO LA VIDA EN 1ª EXPOSICIÓN</option>
                            <option value="B">B - CONSECUENCIAS GRAVES IRREVERSIBLES A LA SALUD</option>
                            <option value="C">C - CONSECUENCIAS TEMPORALES REVERSIBLES A LA SALUD</option>
                            <option value="D">D - PUEDE CAUSAR IRRITACIÓN LEVE</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>DESCRIPCIÓN DEL PELIGRO</label>
                        <textarea value={card.descripcionPeligro || ''} onChange={(e) => updateRiesgoCardField(card.id, 'descripcionPeligro', e.target.value)} rows={3} />
                      </div>

                      <div className="form-group">
                        <label>MEDIDAS DE CONTROL</label>
                        <textarea value={card.medidasControl || ''} onChange={(e) => updateRiesgoCardField(card.id, 'medidasControl', e.target.value)} rows={2} />
                      </div>

                      <div className="form-group">
                        <label>CONSECUENCIAS</label>
                        <textarea
                          value={card.consecuencias || ''}
                          onChange={(e) => updateRiesgoCardField(card.id, 'consecuencias', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label>NIVEL DE RIESGO</label>
                        <input type="text" value={card.nivelRiesgo || ''} readOnly />
                      </div>

                      <div className="grid-2-cols">
                        <div className="form-group compact">
                          <label>RESPONSABLE</label>
                          <input type="text" value={card.responsable || ''} onChange={(e) => updateRiesgoCardField(card.id, 'responsable', e.target.value)} />
                        </div>
                        <div className="form-group compact">
                          <label>FECHA COMPROMISO</label>
                          <input type="date" value={card.fechaCompromiso || ''} onChange={(e) => updateRiesgoCardField(card.id, 'fechaCompromiso', e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}

                  {isRecurso && (
                    <>
                      <div className="grid-2-cols">
                        <div className="form-group">
                          <label>TIPO DE RECURSOS *</label>
                          <select value={card.tipoRecursos || ''} onChange={(e) => updateRiesgoCardField(card.id, 'tipoRecursos', e.target.value)}>
                            <option value="">-- Seleccione --</option>
                            <option value="ECONOMICOS">ECONÓMICOS</option>
                            <option value="MANO_DE_OBRA">MANO DE OBRA</option>
                            <option value="MATERIALES">MATERIALES</option>
                            <option value="OTRO">OTRO</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>ORIGEN</label>
                          <select value={card.origenRecursos || ''} onChange={(e) => updateRiesgoCardField(card.id, 'origenRecursos', e.target.value)}>
                            <option value="">-- Seleccione --</option>
                            <option value="INTERNO">INTERNO</option>
                            <option value="EXTERNO">EXTERNO</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-2-cols">
                        <div className="form-group"><label>COSTOS</label><input type="text" value={card.costos || ''} onChange={(e) => updateRiesgoCardField(card.id, 'costos', e.target.value)} /></div>
                        <div className="form-group"><label>TIEMPO DISPONIBLE</label><input type="text" value={card.tiempoDisponible || ''} onChange={(e) => updateRiesgoCardField(card.id, 'tiempoDisponible', e.target.value)} /></div>
                      </div>

                      <div className="grid-2-cols">
                        <div className="form-group"><label>FECHA COMPROMISO</label><input type="date" value={card.fechaCompromisoRec || ''} onChange={(e) => updateRiesgoCardField(card.id, 'fechaCompromisoRec', e.target.value)} /></div>
                        <div className="form-group"><label>RESPONSABLE</label><input type="text" value={card.responsableRec || ''} onChange={(e) => updateRiesgoCardField(card.id, 'responsableRec', e.target.value)} /></div>
                      </div>
                    </>
                  )}

                  {isDocumento && (
                    <>
                      <div className="form-group"><label>TIPO DE DOCUMENTO</label><input type="text" value={card.tipoDocumento || ''} onChange={(e) => updateRiesgoCardField(card.id, 'tipoDocumento', e.target.value)} /></div>
                      <div className="form-group"><label>NOMBRE DOCUMENTO</label><input type="text" value={card.nombreDocumento || ''} onChange={(e) => updateRiesgoCardField(card.id, 'nombreDocumento', e.target.value)} /></div>
                      <div className="form-group"><label>CAMBIO A REALIZAR</label><textarea value={card.cambioRealizar || ''} onChange={(e) => updateRiesgoCardField(card.id, 'cambioRealizar', e.target.value)} rows={2} /></div>

                      <div className="grid-2-cols">
                        <div className="form-group"><label>FECHA COMPROMISO</label><input type="date" value={card.fechaCompromisoDoc || ''} onChange={(e) => updateRiesgoCardField(card.id, 'fechaCompromisoDoc', e.target.value)} /></div>
                        <div className="form-group"><label>RESPONSABLE</label><input type="text" value={card.responsableDoc || ''} onChange={(e) => updateRiesgoCardField(card.id, 'responsableDoc', e.target.value)} /></div>
                      </div>
                    </>
                  )}

                  {card.tipoImplicacion === 'OTRAS' && (
                    <div className="form-group">
                      <label>INVOLUCRADOS</label>

                      <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
                        {['SOCIOS','PROVEEDORES','AUTORIDADES','CLIENTES','OTROS'].map(inv => (
                          <label key={inv} className="inline-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={Array.isArray(card.involucradosSelected) && card.involucradosSelected.includes(inv)}
                              onChange={(e) => toggleInvolucrado(card.id, inv, e.target.checked)}
                            />
                            <span>{inv}</span>
                          </label>
                        ))}
                      </div>

                      <div className="involucrados-subcards" style={{ marginTop: 8 }}>
                        {(card.involucradosSelected || []).map((invKey) => {
                          const invData = (card.involucradosData || {})[invKey] || { tipoAfectacion: '', generaCostos: false, medidasControl: '', fechaCompromiso: '', responsable: '' };
                          return (
                            <div key={invKey} className="involucrado-subcard" style={{ border: '1px solid #e6e6e6', padding: 10, borderRadius: 6, marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <strong>{invKey}</strong>
                                <small style={{ color: '#666' }}>{invData.tipoAfectacion ? invData.tipoAfectacion : 'Sin detalles'}</small>
                              </div>

                              <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div className="form-group">
                                  <label>Tipo de afectación</label>
                                  <input
                                    type="text"
                                    value={invData.tipoAfectacion || ''}
                                    onChange={(e) => updateInvolucradoField(card.id, invKey, 'tipoAfectacion', e.target.value)}
                                  />
                                </div>

                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <label style={{ margin: 0 }}>Genera costos</label>
                                  <input
                                    type="checkbox"
                                    checked={!!invData.generaCostos}
                                    onChange={(e) => updateInvolucradoField(card.id, invKey, 'generaCostos', e.target.checked)}
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label>Medidas de control</label>
                                <textarea
                                  rows={2}
                                  value={invData.medidasControl || ''}
                                  onChange={(e) => updateInvolucradoField(card.id, invKey, 'medidasControl', e.target.value)}
                                />
                              </div>

                              <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div className="form-group">
                                  <label>Fecha compromiso</label>
                                  <input
                                    type="date"
                                    value={invData.fechaCompromiso || ''}
                                    onChange={(e) => updateInvolucradoField(card.id, invKey, 'fechaCompromiso', e.target.value)}
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Responsable</label>
                                  <input
                                    type="text"
                                    value={invData.responsable || ''}
                                    onChange={(e) => updateInvolucradoField(card.id, invKey, 'responsable', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}