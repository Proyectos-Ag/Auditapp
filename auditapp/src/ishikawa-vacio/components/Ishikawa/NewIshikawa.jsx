import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AutoGrowTextarea from '../../../resources/AutoGrowTextarea';
import './css/NewIsh.css';

export default function NewIshikawa({ diagrama, setDiagrama, problema, ID, onCausaChange, causa }) {
  const MAX_CAUSES = 4;

  // Memoiza las claves de cada espina para que su identidad no cambie en cada render
  const spineKeys = useMemo(
   () => [
     ['text10','text12','text14','text16'],   // Materiales
     ['text11','text13','text15','text17'],   // Mano de obra
     ['text7','text4','text1','text18'],      // Máquinas
     ['text8','text5','text2','text19'],      // Medio ambiente
     ['text9','text6','text3','text20'],      // Métodos
   ],
   []
 );

  // Estado local de listados de causas por espina
  const [causes, setCauses] = useState(spineKeys.map(() => []));
  const [formData, setFormData] = useState({ problema: problema || '', causa: '' });
  const [currentId, setCurrentId] = useState(null);
  // Para almacenar textareas seleccionados
  const [selectedTextareas, setSelectedTextareas] = useState(new Set());
  const wrapperRef = useRef(null);

  // Handler de doble clic para seleccionar/deseleccionar causa
  useEffect(() => {
    if (!wrapperRef.current) return;

    // Primero desenfondo todo lo marcado antes
    selectedTextareas.forEach(txt => {
      txt.style.backgroundColor = '';
      txt.style.borderRadius = '';
    });
    const nuevaSeleccion = new Set();
    console.log('Causa: ', causa);

    // Partimos el string recibido
    const valores = causa
      .split(';')
      .map(v => v.trim())
      .filter(v => v);

    // Recorremos todos los inputs de causa
    const nodes = wrapperRef.current.querySelectorAll('textarea.cause-input');
    nodes.forEach(node => {
      if (valores.includes(node.value.trim())) {
        node.style.backgroundColor = '#f1fc5e9f';
        node.style.borderRadius = '10px';
        nuevaSeleccion.add(node);
      }
    });

    // Actualizamos el set para que tu handleDoubleClick respete la selección
    setSelectedTextareas(nuevaSeleccion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [causes, causa]);

  const handleDoubleClick = (e) => {
    const textarea = e.target;

    setSelectedTextareas(prev => {
      const nuevoSet = new Set(prev);

      if (nuevoSet.has(textarea)) {
        nuevoSet.delete(textarea);
        textarea.style.backgroundColor = '';
        textarea.style.borderRadius = '';
      } else {
        nuevoSet.add(textarea);
        textarea.style.backgroundColor = '#f1fc5e9f';
        textarea.style.borderRadius = '10px';
      }

      const arr = Array.from(nuevoSet)
        .map(t => t.value.trim())
        .filter(v => v);
      const nuevaCausaStr = Array.from(new Set(arr)).join('; ');

      setFormData(fd => ({ ...fd, causa: nuevaCausaStr }));
      onCausaChange(nuevaCausaStr);

      return nuevoSet;
    });

    textarea.select();
  };

  // Cuando cambie de registro (ID o diagrama), re-inicializamos desde el nuevo diagrama
  useEffect(() => {
    const record = diagrama?.[0];
    if (!record) return;

    if (ID !== currentId) {
      setCurrentId(ID);

      // Solo guardamos las causas no vacías de cada espina
      const init = spineKeys.map(keys =>
        keys
          .map(key => (record[key] || '').trim())
          .filter(v => v.length > 0)
      );
      setCauses(init);

      // Y problema
      setFormData({ problema: record.problema || '', causa: '' });
      // Limpiar selección al cambiar de registro
      setSelectedTextareas(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagrama, ID, currentId]);

  // Si cambia la prop problema, actualizamos campo local
  useEffect(() => {
    setFormData(fd => ({ ...fd, problema: problema || '' }));
  }, [problema]);

  // Ajusta el font-size dinámicamente para cajas fijas
  useEffect(() => {
    if (!wrapperRef.current) return;
    wrapperRef.current.querySelectorAll('textarea.cause-input').forEach(el => {
      const parent = el.closest('.spine-group');
      const count = parent.querySelectorAll('.cause-input').length;
      if (count > 1) {
        let size = parseFloat(window.getComputedStyle(el).fontSize);
        while (el.scrollHeight > el.clientHeight && size > 8) {
          size -= 1;
          el.style.fontSize = `${size}px`;
        }
      }
    });
  }, [causes]);

  // Aplica siempre el array completo de causas de la espina i al diagrama padre
  function syncSpineToDiagrama(spineIdx, newCauses) {
    if (!diagrama?.[0]) return;
    const updated = { ...diagrama[0] };
    spineKeys[spineIdx].forEach((key, ci) => {
      updated[key] = newCauses[ci] || '';
    });
    setDiagrama([updated]);
  }

  // Handlers de añadir / quitar
  const handleAddCause = i => {
    setCauses(prev => {
      if (prev[i].length >= MAX_CAUSES) return prev;
      const next = [...prev];
      next[i] = [...next[i], ''];
      syncSpineToDiagrama(i, next[i]);
      return next;
    });
  };

  const handleRemoveCause = (i, j) => {
    setCauses(prev => {
      const next = [...prev];
      next[i] = next[i].filter((_, idx) => idx !== j);
      syncSpineToDiagrama(i, next[i]);
      return next;
    });
  };

  // Dibujo
  const spinePositions = [
    { position: 'bottom', angle: -65, left: '30%' },
    { position: 'bottom', angle: -65, left: '70%' },
    { position: 'top',    angle:  65, left: '25%' },
    { position: 'top',    angle:  65, left: '50%' },
    { position: 'top',    angle:  65, left: '75%' },
  ];
  const spineNames = ['Medio ambiente','Métodos','Materiales','Mano de obra','Maquinaria'];

  return (
    <div className="ishikawa-wrapper" ref={wrapperRef}>
      <div className="fishbone-container">
        <div className="fish-tail" />
        <div className="central-line" />
        <div className="fish-head">
        <div className="problema-display spine-end-label" style={{ fontSize: '25px' }}>
          Problema
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
                            
                            transform: `translateY(-50%) rotate(${-pos.angle}deg)`,
                            right: `${(ci + 1) * spacing}%`
                          }}
                      >
                        <IconButton size="small" color="error" onClick={() => handleRemoveCause(i, ci)}>
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                        <AutoGrowTextarea
                          className="cause-input editable-textarea"
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
                          onDoubleClick={handleDoubleClick}
                          // Ajustamos props para shrinkable y expandable según conteo
                          shrinkable={count > 1}
                          expandable={count === 1}
                          maxHeight={count === 1 ? null : 45}
                          minFontSize={8}
                          baseFontIncrement={1}
                          style={{ height: count === 1 ? 'auto' : '45px' }}
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

                  {count < MAX_CAUSES && (
                    <IconButton
                      className="add-cause-fixed"
                      size="small"
                      onClick={() => handleAddCause(i)}
                      style={{
                        position: 'absolute',
                        left: '-10%',
                        top: '50%',
                        transform: `translate(-120%, -50%) rotate(${-pos.angle}deg)`,
                        pointerEvents: 'auto'
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}