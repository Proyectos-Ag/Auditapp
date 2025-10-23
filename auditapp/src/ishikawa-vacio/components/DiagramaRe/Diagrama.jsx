import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import './css/Diagrama.css'
import Logo from "../assets/img/logoAguida.png";
import NewIshikawaFin from '../Ishikawa/NewIshikawaFin';

const Diagrama = ({ recordId }) =>  {
    const [ishikawa, setIshikawa] = useState([]);
    const [showPart, setShowPart] = useState(true);

    useEffect(() => {
        if (!recordId) return;
    
        const fetchData = async () => {
          try {
            const response = await api.get(
              `/ishikawa/vac/por/${recordId}`
            );
            setIshikawa(response.data);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
    
        fetchData();
      }, [recordId]);
    

    useEffect(() => {
        const simulateInputChange = () => {
          const textareas = document.querySelectorAll('textarea');
          textareas.forEach((textarea) => {
            const event = {
              target: textarea,
              name: textarea.name,
              value: textarea.value
            };
            handleInputChange(event);
          });
        };
    
        simulateInputChange(); // Ejecutar la función al cargar el componente
    
      }, [ishikawa]);   

    const handleInputChange = (e) => {
        const { value } = e.target;
      
        // Define el tamaño de fuente según el rango de caracteres
        let fontSize;
        if (value.length > 125) {
          fontSize = '10.3px'; // Menos de 78 caracteres
        } else if (value.length > 100) {
          fontSize = '11px'; // Menos de 62 caracteres
        } else if (value.length > 88) {
          fontSize = '12px'; // Menos de 62 caracteres
        } else if (value.length > 78) {
          fontSize = '13px'; // Menos de 62 caracteres
        } else if (value.length > 65) {
          fontSize = '14px'; // Menos de 62 caracteres
        } else {
          fontSize = '15px'; // Por defecto
        }

        e.target.style.fontSize = fontSize;
      };

    return (
        <div>
            <div >
                    <div >
                        <div id='pdf-content-part1' className="image-container-dia" >
                        <img src={Logo} alt="Logo Aguida" className='logo-empresa-ish' />
                        <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
                        <div className='posicion-en'>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <h2 style={{ marginLeft: '50rem', marginRight: '10px' }}>Problema: </h2>
                                <div style={{ width: '50rem', fontSize: '20px' }}>{ishikawa.problema}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <h2 style={{ marginLeft: '50rem', marginRight: '10px' }}>Afectación: </h2>
                                <div style={{ width: '50rem', fontSize: '20px' }}>{ishikawa.afectacion}</div>
                            </div>
                        </div>
                        <div className='posicion-en-3'>
                            GCF015
                        </div>
                        <div className='posicion-en-2'>
                            <h3>Fecha: {ishikawa.fecha}</h3>
                        </div>
                        <div className='new-ishikawa'>
                        {/* en tu Diagrama.jsx */}
                            <NewIshikawaFin
                            key={recordId}
                            diagrama={ishikawa.diagrama}
                            problema={ishikawa.problema}
                            causa={ishikawa.causa}
                            ID={recordId}
                            />

                         </div> 
                        <div className='button-parti-dia'>
                            <div className='cont-part'>
                        <button className='button-part' onClick={(e) => {
                            e.preventDefault();
                            setShowPart(!showPart)
                            }}>
                            ⚇
                        </button>
                        {showPart && (
                        <div className='part-div'>{ishikawa.participantes}</div>
                            )}
                        </div>
                        </div>
                        </div>
                         
                        <div id='pdf-content-part2' className="image-container2-dia">
                        <div >
                            <div className='posicion-bo'>
                                <h3>No conformidad:</h3>
                                <div style={{width: '70rem', textAlign: 'justify', overflowWrap: 'break-word' }}> {ishikawa.requisito}</div>
                                <h3>Hallazgo:</h3>
                                <div className='hallazgo-container'>
                                    <div style={{width:'70rem', overflowWrap: 'break-word'}}>{ishikawa.hallazgo}</div>
                                </div>
                                <h3>Acción inmediata o corrección: </h3>
                                <div style={{width:'70rem', overflowWrap: 'break-word'}}>
                                {ishikawa.correccion}</div>
                                <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                                <div style={{ marginBottom: '20px', width:'70rem', overflowWrap: 'break-word' }}>{ishikawa.causa}</div>
                            </div>
                        </div>
                        </div>
                        <div className='image-container3-dia' id='pdf-content-part3'>
                        <div className='table-ish'>
                        <h3>SOLUCIÓN</h3>
                        <table style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th className="conformity-header">Actividad</th>
                                    <th className="conformity-header">Responsable</th>
                                    <th className="conformity-header">Fecha Compromiso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ishikawa.actividades && ishikawa.actividades.map((actividad, i) => (
                                    <tr key={i}>
                                        <td>{actividad.actividad}</td>
                                        <td>{
                                Array.isArray(actividad.responsable)
                                    ? actividad.responsable.flat().map((r, i, arr) => (
                                        <span key={i}>
                                        {typeof r === 'object'
                                            ? (r.nombre 
                                                ? r.nombre 
                                                : Object.keys(r)
                                                    .filter(key => !isNaN(key))
                                                    .sort((a, b) => a - b)
                                                    .map(key => r[key])
                                                    .join('')
                                            )
                                            : r
                                        }
                                        {i < arr.length - 1 ? ', ' : ''}
                                        </span>
                                    ))
                                    : (
                                    // Caso en que "actividad.responsable" es un objeto
                                    typeof actividad.responsable === 'object' &&
                                    actividad.responsable !== null &&
                                    (actividad.responsable.nombre 
                                        ? <span>{actividad.responsable.nombre}</span>
                                        : <span>{
                                            Object.keys(actividad.responsable)
                                                .filter(key => !isNaN(key))
                                                .sort((a, b) => a - b)
                                                .map(key => actividad.responsable[key])
                                                .join('')
                                            }</span>
                                    )
                                    )
                                }</td>
                                        <td>{new Date(actividad.fechaCompromiso + 'T00:00:00').toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3>EFECTIVIDAD</h3>
                        <table style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th className="conformity-header">Actividad</th>
                                    <th className="conformity-header">Responsable</th>
                                    <th className="conformity-header">Fecha Compromiso</th>
                                    <th colSpan="2" className="conformity-header">
                                        Acción Correctiva Cerrada
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ishikawa.correcciones && ishikawa.correcciones.map((accion, i) => (
                                    <tr key={i}>
                                        <td>{accion.actividad}</td>
                                        <td>{accion.responsable}</td>
                                        <td>{new Date(accion.fechaCompromiso + 'T00:00:00').toLocaleDateString()}</td>
                                        <td>{accion.cerrada}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                        </div>
                      </div>
                    </div>
            </div>
        
    );
};

export default Diagrama;