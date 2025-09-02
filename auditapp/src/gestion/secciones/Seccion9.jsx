import React from 'react';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export default function Seccion9({
  formData,
  setFormData,
  setAddTemp,
  errors,
  inputClass,
  openSignature,
  userNames,
  addMode,
  addTemp,
  startAdd,
  cancelAdd,
  confirmAdd,
  removeFirmaRole,
  sectionRefs
}) {
  // Copia aquí el contenido de la sección 9 de tu renderSection, usando los mismos props.
  // Puedes copiar el bloque de tu renderSection case 9 aquí.
  return (
    <div className="form-section" ref={el => sectionRefs.current[8] = el}>
                <h2>Firmas</h2>
                <p className="muted">Solo el <strong>Solicitante</strong> puede firmar desde este formulario. Los demás roles registran nombre/cargo (no firma aquí).</p>
    
                <Grid container spacing={2}>
    
                  {/* SOLICITANTE: OBJETO, no eliminable, puede firmar */}
                  <Grid item xs={12} md={6}>
                    {(() => {
                      // ahora: solicitante es el primer elemento del array
    const s = (formData.firmadoPor && Array.isArray(formData.firmadoPor.solicitado) && formData.firmadoPor.solicitado[0]) || { nombre: '', cargo: '', firma: '' };
    
                      return (
                        <fieldset className={`signature-group ${(errors['firma_solicitado_nombre'] || errors['firma_solicitado_cargo'] || errors['firma_solicitado_firma']) ? 'field-error' : ''}`}>
                          <legend>Solicitado por (único)</legend>
    
                          <div className="form-group">
                            <label>Nombre*</label>
                            <Autocomplete
                              freeSolo
                              options={userNames}
                              getOptionLabel={(option) => {
                                if (!option) return '';
                                return typeof option === 'string' ? option : (option.Nombre || '');
                              }}
                              value={s.nombre || ''}
                              onChange={(e, newValue) => {
                              setFormData(prev => {
                                const fp = { ...(prev.firmadoPor || {}) };
                                const arr = Array.isArray(fp.solicitado) ? [...fp.solicitado] : [];
                                if (arr.length === 0) arr.push({ nombre: '', cargo: '', firma: '', email: '' });
                                if (!newValue) {
                                  arr[0].nombre = '';
                                } else if (typeof newValue === 'string') {
                                  arr[0].nombre = newValue;
                                } else {
                                  arr[0] = {
                                    nombre: newValue.Nombre || newValue.nombre || '',
                                    cargo: newValue.Puesto || newValue.cargo || newValue.puesto || '',
                                    email: newValue.Correo || newValue.correo || newValue.email || '',
                                    firma: arr[0].firma || ''
                                  };
                                }
                                fp.solicitado = arr;
                                return { ...prev, solicitante: arr[0].nombre || prev.solicitante, firmadoPor: fp };
                              });
                            }}
    
                            renderInput={(params) => <TextField {...params} variant="outlined" size="small" error={!!errors['firma_solicitado_nombre']} />}
                          />
    
                        </div>
    
                        <div className="form-group">
                          <label>Cargo*</label>
                          <input type="text" value={s.cargo || ''} 
                          onChange={(e) => setFormData(prev => {
                            const fp = { ...(prev.firmadoPor || {}) };
                            fp.solicitado = fp.solicitado ? [...fp.solicitado] : [{ nombre: '', cargo: '', firma: '' }];
                            fp.solicitado[0] = { ...fp.solicitado[0], cargo: e.target.value };
                            return { ...prev, firmadoPor: fp };
                          })}
                          className={errors['firma_solicitado_cargo'] ? 'error' : ''} />
                        </div>
    
                        <div className="form-group">
                          <label>Firma*</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button type="button" className="signature-btn" onClick={() => openSignature('solicitado', 0)}>{s.firma ? 'Re-firmar' : 'Firmar'}</button>
                            {s.firma && (
                              <div className="signature-preview">
                                <img src={s.firma} alt="Firma solicitante" height="50" />
                                <span>Firma capturada</span>
                              </div>
                            )}
                            <small style={{ marginLeft: 8 }} className="muted">El solicitante no puede eliminarse.</small>
                          </div>
                        </div>
                      </fieldset>
                    );
                  })()}
                  </Grid>
    
                  {/* BLOQUES: evaluado / implementado / validado / aprobado */}
                  {['evaluado','implementado','validado','aprobado'].map(role => (
                    <Grid item xs={12} md={6} key={`role-block-${role}`}>
                      <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
                        <h4 style={{ marginTop: 0, textTransform: 'capitalize' }}>{role === 'aprobado' ? 'Aprobado' : (role.charAt(0).toUpperCase() + role.slice(1))}</h4>
    
                        {/* lista de entradas existentes */}
                        {(formData.firmadoPor?.[role] || []).map((entry, idx) => (
                          <div key={`${role}-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: '#333' }}>{entry.nombre || <em className="muted">Sin nombre</em>}</div>
                              <div style={{ fontSize: 12, color: '#666' }}>{entry.cargo || <em className="muted">Sin cargo</em>}</div>
                            </div>
    
                            <div style={{ display: 'flex', gap: 6 }}>
                              {/* Edit rápido: abrir prompts (mantengo por simplicidad) */}
                              <button type="button" className="btn-secondary" onClick={() => {
                                const nombre = prompt('Editar nombre', entry.nombre || '');
                                const cargo = prompt('Editar cargo', entry.cargo || '');
                                if (nombre !== null && cargo !== null) {
                                  setFormData(prev => ({
                                    ...prev,
                                    firmadoPor: {
                                      ...prev.firmadoPor,
                                      [role]: (prev.firmadoPor[role] || []).map((it, i) => i === idx ? { ...it, nombre: nombre, cargo: cargo } : it)
                                    }
                                  }));
                                }
                              }}>Editar</button>
    
                              <button type="button" className="btn-danger" onClick={() => {
                                const current = formData.firmadoPor?.[role] || [];
                                if (current.length <= 1) {
                                  alert('Debe existir al menos una entrada para este rol.');
                                  return;
                                }
                                if (window.confirm('Eliminar esta entrada?')) removeFirmaRole(role, idx);
                              }}>Eliminar</button>
                            </div>
                          </div>
                        ))}
    
                        {/* area para agregar: usamos Autocomplete para nombre y text input para cargo */}
                        {addMode[role] ? (
                          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                            <Autocomplete
                              freeSolo
                              options={userNames}
                              getOptionLabel={(option) => (typeof option === 'string' ? option : (option.Nombre || ''))}
                              value={addTemp[role].nombre}
                              onChange={(e, newValue) => {
                                setAddTemp(prev => {
                                  const next = { ...prev };
                                  if (!newValue) {
                                    next[role] = { ...next[role], nombre: '', cargo: '', email: '' };
                                  } else if (typeof newValue === 'string') {
                                    next[role] = { ...next[role], nombre: newValue };
                                  } else {
                                    next[role] = {
                                      nombre: newValue.Nombre || '',
                                      cargo: newValue.Puesto || newValue.cargo || '',
                                      email: newValue.Correo || newValue.correo || newValue.email || ''
                                    };
                                  }
                                  return next;
                                });
                              }}
                              renderInput={(params) => <TextField {...params} placeholder="Nombre" size="small" />}
                            />
    
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button type="button" className="btn-secondary" onClick={() => cancelAdd(role)}>Cancelar</button>
                              <button type="button" className="btn-primary" onClick={() => confirmAdd(role)}>Agregar</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            <button type="button" className="btn-primary" onClick={() => startAdd(role)}>Agregar {role === 'aprobado' ? 'aprobador' : role}</button>
                          </div>
                        )}
    
                      </div>
                    </Grid>
                  ))}
    
                </Grid>
              </div>
  );
}