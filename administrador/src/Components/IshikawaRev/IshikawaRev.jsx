import React, { useEffect, useState } from 'react';
import './css/IshikawaRev.css';
import Navigation from "../Navigation/Navbar";
import Logo from "../../assets/img/logoAguida.png";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import IshikawaImg from '../../assets/img/Ishikawa-transformed.png';

const IshikawaRev = () => {
    const [ishikawas, setIshikawas] = useState([]);
    const [filteredIshikawas, setFilteredIshikawas] = useState([]);
    const { _id, id } = useParams();
    const [mensaje, setMensaje] = useState('');
    const [notaRechazo, setNotaRechazo] = useState('');
    const [showNotaRechazo, setShowNotaRechazo] = useState(false);
    const [accionesCorrectivas, setAccionesCorrectivas] = useState([{ actividad: '', responsable: '', fechaCompromiso: '', cerrada: '' }]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
                const dataFiltrada = response.data.filter(item => item.estado === 'En revisión' ||  item.estado === 'revisado');
                setIshikawas(dataFiltrada);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);
    

    useEffect(() => {
        if (ishikawas.length > 0) {
            const nuevosFiltrados = ishikawas.filter(({ idRep, idReq }) => idRep === _id && idReq === id);
            setFilteredIshikawas(nuevosFiltrados);
            if (nuevosFiltrados.length === 0) {
                setMensaje('No hay nada por aquí.');
            } else {
                setMensaje('');
            }
        }
    }, [ishikawas, _id, id]);

    const eliminarFilaAccionCorrectiva = (index) => {
        const nuevasAccionesCorrectivas = accionesCorrectivas.filter((_, i) => i !== index);
        setAccionesCorrectivas(nuevasAccionesCorrectivas);
    };  

    const handleAccionCorrectivaChange = (index, field, value) => {
        const nuevasAccionesCorrectivas = [...accionesCorrectivas];
        nuevasAccionesCorrectivas[index][field] = value;
        setAccionesCorrectivas(nuevasAccionesCorrectivas);
    };

    const agregarFilaAccionCorrectiva = () => {
        setAccionesCorrectivas([...accionesCorrectivas, { actividad: '', responsable: '', fechaCompromiso: '', cerrada: '' }]);
    };

    const handleGuardarCambios = async () => {
        try {
            if (filteredIshikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            }
    
            const { _id } = filteredIshikawas[0];
            const updatedIshikawa = {
                accionesCorrectivas
            };
    
            console.log('Enviando datos a actualizar:', updatedIshikawa);
    
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, {
                estado: 'revisado',
                ...updatedIshikawa
            });
    
            console.log('Respuesta del servidor:', response.data);
    
            alert('Información actualizada correctamente');
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Hubo un error al actualizar la información');
        }
    };

    const handleGuardarRechazo = async () => {
    try {
        const { _id } = filteredIshikawas[0];
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, {
            estado: 'rechazado',
            notaRechazo // Añade la nota de rechazo al objeto enviado
        });
        alert('Información actualizada correctamente');
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Hubo un error al actualizar la información');
    }
    };

    return (
        <div>
            <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <Navigation />
            </div>
            <div>
            {mensaje && <div className="mensaje-error"><div className='mens-error'>
                <div style={{display:'flex', justifyContent:'center'}}>{mensaje}</div> 
                <div style={{display:'flex',fontSize:'100px', justifyContent:'center'}}>🏝️</div></div>
                </div>}
                {filteredIshikawas.map((ishikawa, index) => (
                <div key={index} className="image-container">
                    {showNotaRechazo && (
                        <div className="nota-rechazo-container">
                            <textarea
                                value={notaRechazo}
                                onChange={(e) => setNotaRechazo(e.target.value)}
                                className='nota-rechazo'
                                rows="4"
                                cols="50"
                                placeholder="Escribe aquí la razón del rechazo"
                            />
                        </div>
                    )}
                    <div className='buttons-g'>
                    <button onClick={() => setShowNotaRechazo(!showNotaRechazo)}>
                        {showNotaRechazo ? 'Ocultar Nota' : 'Nota'}
                    </button>
                    <button onClick={handleGuardarRechazo} className='button-guardar'>Rechazar</button>
                    <button onClick={handleGuardarCambios} className='button-guardar'>Guardar Cambios</button>
                    </div>
                    <img src={Logo} alt="Logo Aguida" className='logo-empresa-ishi' />
                    <div className='posicion-en'>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ marginLeft: '30rem', marginRight: '10px' }}>Problema: </h2>
                        <div style={{ width: '30rem', fontSize: '20px' }}>{ishikawa.problema}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ marginLeft: '30rem', marginRight: '10px' }}>Afectación: </h2>
                        <div style={{ width: '30rem', fontSize: '20px' }}>{ishikawa.afectacion}</div>
                    </div>
                    </div>
                    <div className='posicion-en-2'>
                    <h3>Fecha: {ishikawa.fecha}</h3>
                    </div>
                    <div>
                    <img src={IshikawaImg} alt="Diagrama de Ishikawa" className="responsive-image" />
                    {ishikawa.diagrama.map((item, i) => (
                        <div key={i}>
                        <textarea className="text-area"
                            style={{ top: '19.1rem', left: '8.7rem' }} disabled>{item.text1}</textarea>
                        <textarea className="text-area"
                            style={{ top: '19.1rem', left: '25.4rem' }} disabled>{item.text2}</textarea>
                        <textarea className="text-area"
                            style={{ top: '19.1rem', left: '41.2rem' }} disabled>{item.text3}</textarea>
                        <textarea className="text-area"
                            style={{ top: '23.2rem', left: '12.2rem' }} disabled>{item.text4}</textarea>
                        <textarea className="text-area"
                            style={{ top: '23.2rem', left: '28.8rem' }} disabled>{item.text5}</textarea>
                        <textarea className="text-area"
                            style={{ top: '23.2rem', left: '45rem' }} disabled>{item.text6}</textarea>
                        <textarea className="text-area"
                            style={{ top: '27.2rem', left: '15.5rem' }} disabled>{item.text7}</textarea>
                        <textarea className="text-area"
                            style={{ top: '27.2rem', left: '32.3rem' }} disabled>{item.text8}</textarea>
                        <textarea className="text-area"
                            style={{ top: '27.2rem', left: '48.1rem' }} disabled>{item.text9}</textarea>
                        <textarea className="text-area" value={item.text10}
                            style={{ top: '31rem', left: '23rem' }} disabled></textarea>
                        <textarea className="text-area" name='text11' value={item.text11}
                            style={{ top: '31rem', left: '39.4rem' }} disabled></textarea>
                        <textarea className="text-area" value={item.text12}
                            style={{ top: '35rem', left: '19.7rem' }} disabled></textarea>
                        <textarea className="text-area" name='text13' value={item.text13}
                            style={{ top: '35rem', left: '36rem' }} disabled></textarea>
                        <textarea className="text-area" name='text14' value={item.text14}
                            style={{ top: '39rem', left: '16.6rem' }} disabled></textarea>
                        <textarea className="text-area" name='text15' value={item.text15}
                            style={{ top: '39rem', left: '32.8rem' }} disabled></textarea>
                        <textarea className="text-area"
                            style={{ top: '27rem', left: '67.5rem', width: '8.5rem', height: '8rem' }} value={item.problema}></textarea>
                        </div>
                    ))}
                    </div>
                    <div className='posicion-bo'>
                    <h3>No conformidad:</h3>
                    <div style={{ fontSize: '20px', width: '55em', textAlign: 'justify' }}>{ishikawa.requisito}</div>
                    <h3>Hallazgo:</h3>
                    <div className='hallazgo-container'>
                        <div>{ishikawa.hallazgo}</div>
                    </div>
                    <h3>Acción inmediata o corrección: </h3>
                    {ishikawa.correccion}
                    <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                    <div style={{ marginBottom: '20px' }}>{ishikawa.causa}</div>
                    </div>
                    <div className='table-ish'>
                    <table style={{ border: 'none' }}>
                        <thead>
                        <tr>
                            <th className="conformity-header">Actividad</th>
                            <th className="conformity-header">Responsable</th>
                            <th className="conformity-header">Fecha Compromiso</th>
                        </tr>
                        </thead>
                        <tbody>
                        {ishikawa.actividades.map((actividad, i) => (
                            <tr key={i}>
                            <td>{actividad.actividad}</td>
                            <td>{actividad.responsable}</td>
                            <td>{new Date(actividad.fechaCompromiso).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <table style={{border:'none'}}>
                    <thead>
                        <tr>
                        <th>Actividad</th>
                        <th>Responsable</th>
                        <th>Fecha Compromiso</th>
                        <th colSpan="2" className="sub-div">
                            <div>Acción Correctiva cerrada</div>
                            <div style={{ display: 'flex' }}>
                            <div className="left">Sí</div>
                            <div className="right">No</div>
                            </div>
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        {accionesCorrectivas.map((accion, index) => (
                        <tr key={index}>
                            <td>
                            <textarea
                                className='table-input'
                                type="text"
                                value={accion.actividad}
                                onChange={(e) => handleAccionCorrectivaChange(index, 'actividad', e.target.value)}
                            />
                            </td>
                            <td>
                            <textarea
                                className='table-input'
                                type="text"
                                value={accion.responsable}
                                onChange={(e) => handleAccionCorrectivaChange(index, 'responsable', e.target.value)}
                            />
                            </td>
                            <td>
                            <input
                                type="date"
                                value={accion.fechaCompromiso}
                                onChange={(e) => handleAccionCorrectivaChange(index, 'fechaCompromiso', e.target.value)}
                            />
                            </td>
                            <td>
                            <input
                                type="checkbox"
                                checked={accion.cerrada === 'Sí'}
                                onChange={(e) => handleAccionCorrectivaChange(index, 'cerrada', e.target.checked ? 'Sí' : 'No')}
                            />
                            </td>
                            <td>
                            <input
                                type="checkbox"
                                checked={accion.cerrada === 'No'}
                                onChange={(e) => handleAccionCorrectivaChange(index, 'cerrada', e.target.checked ? 'Sí' : 'No')}
                            />
                            </td>
                            <td className='cancel-acc'>
                            {index !== 0 && (
                                <button onClick={() => eliminarFilaAccionCorrectiva(index)}>Eliminar</button>
                            )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    <button onClick={agregarFilaAccionCorrectiva} className='button-agregar'>Agregar Acción Correctiva</button>
                    </div>
                </div>
                ))}
                
            </div>
            
        </div>
    );
};

export default IshikawaRev;