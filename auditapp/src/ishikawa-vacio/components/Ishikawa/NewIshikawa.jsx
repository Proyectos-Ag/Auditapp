import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import './css/NewIsh.css';

export default function NewIshikawa({ diagrama, setDiagrama, problema, ID }) {
  const MAX_CAUSES = 3;

  // Las claves de cada espina en el objeto diagrama[0]
  const spineKeys = [
    ['text10','text12','text14'],   // Materiales
    ['text11','text13','text15'],   // Mano de obra
    ['text7','text4','text1'],      // Máquinas
    ['text8','text5','text2'],      // Medio ambiente
    ['text9','text6','text3'],      // Métodos
  ];

  // Estado local de listados de causas por espina
  const [causes, setCauses] = useState(spineKeys.map(() => []));
  const [formData, setFormData] = useState({ problema: problema || '', causa: '' });
  const [currentId, setCurrentId] = useState(null);

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
    }
  }, [diagrama, ID, currentId, spineKeys]);

  // Si cambia la prop problema, actualizamos campo local
  useEffect(() => {
    setFormData(fd => ({ ...fd, problema: problema || '' }));
  }, [problema]);

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

  // Para ajustar el tamaño de fuente según longitud
  const computeFontSize = v => {
    if (v.length > 125) return '10.3px';
    if (v.length > 100) return '11px';
    if (v.length > 88) return '12px';
    if (v.length > 78) return '13px';
    if (v.length > 65) return '14px';
    return '15px';
  };

  // Dibujo
  const spinePositions = [
    { position: 'bottom', angle: -60, left: '30%' },
    { position: 'bottom', angle: -60, left: '70%' },
    { position: 'top',    angle:  60, left: '25%' },
    { position: 'top',    angle:  60, left: '50%' },
    { position: 'top',    angle:  60, left: '75%' },
  ];
  const spineNames = ['Materiales','Mano de obra','Máquinas','Medio ambiente','Métodos'];

  return (
    <div className="ishikawa-wrapper">
      <div className="fishbone-container">
        <div className="fish-tail" />
        <div className="central-line" />
        <div className="fish-head">
          <textarea
            className="text-area problema-input"
            name="problema"
            placeholder="Problema..."
            maxLength={145}
            value={formData.problema}
            onChange={e => {
              const p = e.target.value;
              setFormData(fd => ({ ...fd, problema: p }));
              setDiagrama([{ ...diagrama[0], problema: p }]);
            }}
          />
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
                          transform: `rotate(${-pos.angle}deg)`,
                          right: `${(ci + 1) * spacing}%`
                        }}
                      >
                        <IconButton size="small" color="error" onClick={() => handleRemoveCause(i, ci)}>
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                        <textarea
                          className="cause-input"
                          placeholder={`Causa ${ci + 1}`}
                          maxLength={145}
                          value={text}
                          style={{ fontSize: computeFontSize(text) }}
                          onChange={e => {
                            const v = e.target.value;
                            setCauses(prev => {
                              const next = [...prev];
                              next[i][ci] = v;
                              syncSpineToDiagrama(i, next[i]);
                              return next;
                            });
                          }}
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