import React, { useState, useEffect, useMemo, useRef } from 'react';
import './css/NewIsh.css';
import AutoGrowTextarea from '../../../resources/AutoGrowTextarea';

export default function NewIshikawaFin({ diagrama, problema, ID, causa }) {
  // Memoiza las claves de cada espina
  const spineKeys = useMemo(
    () => [
      ['text10','text12','text14'],
      ['text11','text13','text15'],
      ['text7','text4','text1'],
      ['text8','text5','text2'],
      ['text9','text6','text3'],
    ],
    []
  );

  const [causes, setCauses] = useState(spineKeys.map(() => []));
  const [formData, setFormData] = useState({ problema: problema || '', causa: '' });
  const [selectedTextareas, setSelectedTextareas] = useState(new Set());
  const wrapperRef = useRef(null);

  // Handler de doble clic para seleccionar/deseleccionar causa
  useEffect(() => {
    if (!wrapperRef.current) return;
    // Limpia selección anterior
    selectedTextareas.forEach(txt => {
      txt.style.backgroundColor = '';
      txt.style.borderRadius = '';
    });
    const nuevaSeleccion = new Set();
    console.log('Causa:', causa);

    // Asegura que causa sea string antes de split
    const valores = (causa || '')
      .split(';')
      .map(v => v.trim())
      .filter(v => v);

    const nodes = wrapperRef.current.querySelectorAll('textarea.cause-input');
    nodes.forEach(node => {
      if (valores.includes(node.value.trim())) {
        node.style.backgroundColor = '#f1fc5e9f';
        node.style.borderRadius = '10px';
        nuevaSeleccion.add(node);
      }
    });

    setSelectedTextareas(nuevaSeleccion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [causes, causa]);

  // Sincroniza cambios de diagrama al cambiar ID o diagrama
  // En NewIshikawaFin.jsx
// Sólo inicializa las causas
useEffect(() => {
    if (!diagrama?.length) return;
    const record = diagrama[0];
    const init = spineKeys.map(keys =>
      keys.map(key => (record[key]||'').trim()).filter(v => v)
    );
    setCauses(init);
    // limpia la selección visual
    setSelectedTextareas(new Set());
  }, [diagrama, spineKeys]);
  
  

  useEffect(() => {
    setFormData(fd => ({ ...fd, problema: problema || '' }));
  }, [problema]);
  

  function syncSpineToDiagrama(spineIdx, newCauses) {
    if (!diagrama?.[0]) return;
    const updated = { ...diagrama[0] };
    spineKeys[spineIdx].forEach((key, ci) => {
      updated[key] = newCauses[ci] || '';
    });
    diagrama([updated]);
  }

  const spinePositions = [
    { position: 'bottom', angle: -60, left: '30%' },
    { position: 'bottom', angle: -60, left: '70%' },
    { position: 'top',    angle:  60, left: '25%' },
    { position: 'top',    angle:  60, left: '50%' },
    { position: 'top',    angle:  60, left: '75%' },
  ];

  const spineNames = ['Medio ambiente', 'Métodos', 'Materiales', 'Mano de obra', 'Maquinaria'];

  return (
      <div className="ishikawa-wrapper" ref={wrapperRef}>
        <div className="fishbone-container">
          <div className="fish-tail" />
          <div className="central-line" />
          <div className="fish-head">
          <div className="problema-display" style={{ fontSize: '15px' }}>
              {formData.problema}
            </div>
          </div>
  
          {spinePositions.map((pos, i) => {
            const group = causes[i] || [];
            const count = group.length;
            const spacing = 100 / (Math.max(count, 1) + 1);
  
  
            return (
              <div key={i} className={`spine-group ${pos.position}`} style={{ left: pos.left }}>
                <div className="main-spine">
                  <div className="diagonal-line" style={{ transform: `rotate(${pos.angle}deg)` }}>
                    <div className="causes-wrapper">
                      {group.map((text, ci) => (
                        <div
                          key={ci}
                          className="cause-line"
                          style={{
                              /* centrar antes de rotar */
                              transform: `translateY(-50%) rotate(${-pos.angle}deg)`,
                              right: `${(ci + 1) * spacing}%`
                            }}
                        >
                          <AutoGrowTextarea
                            className="cause-input"
                            placeholder={`Causa ${ci+1}`}
                            maxLength={145}
                            value={text}
                            onChange={e => {
                              const v = e.target.value;
                              setCauses(prev => {
                                const nxt = [...prev];
                                nxt[i][ci] = v;
                                syncSpineToDiagrama(i, nxt[i]);
                                return nxt;
                              });
                            }}
                            readOnly
                            shrinkable={count > 1}
                            expandable={count === 1}
                            maxHeight={count === 1 ? null : 45}
                            minFontSize={8}
                            baseFontIncrement={1}
                            style={{ height: count === 1 ? 'auto' : '45px', outline: 'none', resize: 'none' }}
                          />
                          <div className="sub-line" />
                        </div>
                      ))}
                    </div>
  
                    <div
                      className="spine-end-label"
                      style={{
                        position: 'absolute',
                        left: 0,
                        transform: `translate(-50%, -50%) rotate(${-pos.angle}deg)`
                      }}
                    >
                      {spineNames[i]}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
  
        </div>
      </div>
    );
}
