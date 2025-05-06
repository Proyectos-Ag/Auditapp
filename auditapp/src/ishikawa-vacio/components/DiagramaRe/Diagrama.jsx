import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Diagrama.css'
import Logo from "../assets/img/logoAguida.png";
import Ishikawa from '../assets/img/Ishikawa-transformed.png';

const Diagrama = ({ recordId }) =>  {
    const [ishikawa, setIshikawa] = useState([]);
    const [showPart, setShowPart] = useState(true);

    useEffect(() => {
        if (!recordId) return;
    
        const fetchData = async () => {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/ishikawa/vac/por/${recordId}`
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
                        <div>
                            <img src={Ishikawa} alt="Diagrama de Ishikawa" className="responsive-image" />
                            {ishikawa.diagrama && ishikawa.diagrama.map((item, i) => (
                                <div key={i}>
                                    <textarea className="text-area" style={{ top: '19.1rem', left: '8.7rem' }} disabled>{item.text1}</textarea>
                                    <textarea className="text-area" style={{ top: '19.1rem', left: '25.4rem' }} disabled>{item.text2}</textarea>
                                    <textarea className="text-area" style={{ top: '19.1rem', left: '41.2rem' }} disabled>{item.text3}</textarea>
                                    <textarea className="text-area" style={{ top: '23.2rem', left: '12.2rem' }} disabled>{item.text4}</textarea>
                                    <textarea className="text-area" style={{ top: '23.2rem', left: '28.8rem' }} disabled>{item.text5}</textarea>
                                    <textarea className="text-area" style={{ top: '23.2rem', left: '45rem' }} disabled>{item.text6}</textarea>
                                    <textarea className="text-area" style={{ top: '27.2rem', left: '15.5rem' }} disabled>{item.text7}</textarea>
                                    <textarea className="text-area" style={{ top: '27.2rem', left: '32.3rem' }} disabled>{item.text8}</textarea>
                                    <textarea className="text-area" style={{ top: '27.2rem', left: '48.1rem' }} disabled>{item.text9}</textarea>
                                    <textarea className="text-area" value={item.text10} style={{ top: '31rem', left: '23rem' }} disabled></textarea>
                                    <textarea className="text-area" name='text11' value={item.text11} style={{ top: '31rem', left: '39.4rem' }} disabled></textarea>
                                    <textarea className="text-area" value={item.text12} style={{ top: '35rem', left: '19.7rem' }} disabled></textarea>
                                    <textarea className="text-area" name='text13' value={item.text13} style={{ top: '35rem', left: '36rem' }} disabled></textarea>
                                    <textarea className="text-area" name='text14' value={item.text14} style={{ top: '39rem', left: '16.6rem' }} disabled></textarea>
                                    <textarea className="text-area" name='text15' value={item.text15} style={{ top: '39rem', left: '32.8rem' }} disabled></textarea>
                                    <textarea className="text-area" style={{ top: '27rem', left: '67.5rem', width: '8.5rem', height: '8rem' }} value={ishikawa.problema} disabled></textarea>
                                </div>
                            ))}
                        </div>
                        <div className='button-pasti-dia'>
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