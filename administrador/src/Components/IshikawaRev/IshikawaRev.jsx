import React, { useEffect, useState } from 'react';
import './css/IshikawaRev.css';
import Navigation from "../Navigation/Navbar";
import Logo from "../../assets/img/logoAguida.png";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import IshikawaImg from '../../assets/img/Ishikawa-transformed.png';
import Swal from 'sweetalert2';

const IshikawaRev = () => {
    const [ishikawas, setIshikawas] = useState([]);
    const [filteredIshikawas, setFilteredIshikawas] = useState([]);
    const { _id, id } = useParams();
    const [mensaje, setMensaje] = useState('');
    const [notaRechazo, setNotaRechazo] = useState('');
    const [rechazo,  setRechazo] = useState([]);
    const [aprobado,  setAprobado] = useState([]);
    const [showPart, setShowPart] = useState(false);
    const [showReprogramar, setShowReprogramar] = useState(false);
    const [showNotaRechazo, setShowNotaRechazo] = useState(false);
    const [tempFechaCompromiso, setTempFechaCompromiso] = useState('');
    const [actividades, setActividades] = useState([{ actividad: '', responsable: '', fechaCompromiso: [] }]);
    const [correcciones, setCorrecciones] = useState([{ actividad: '', responsable: '', fechaCompromiso: [], cerrada: '' }]);
    const [nuevaCorreccion, setNuevaCorreccion] = useState({ actividad: '', responsable: '', fechaCompromiso: '', cerrada: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
            const dataFiltrada = response.data.filter(item => item.estado === 'En revisión' ||  item.estado === 'Revisado' || item.estado === 'Aprobado');
            setIshikawas(dataFiltrada);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        verificarRegistro();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [_id, id]);

   useEffect(() => {
    if (filteredIshikawas.length > 0) {
        const correccionesIniciales = filteredIshikawas[0].correcciones.map(correccion => ({
            ...correccion,
            fechaCompromiso: new Date(correccion.fechaCompromiso).toISOString().split('T')[0]  // Formato YYYY-MM-DD
        }));
        setCorrecciones(correccionesIniciales);
    }
    }, [filteredIshikawas]);

    
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


    const handleCorreccionChange = (index, field, value) => {
        const nuevasCorrecciones = [...correcciones];
        
        if (field === 'cerrada') {
            nuevasCorrecciones[index][field] = value ? 'Sí' : 'No';
        } else if (field === 'cerradaNo') {
            nuevasCorrecciones[index]['cerrada'] = value ? 'No' : 'Sí';
        } else if (field === 'fechaCompromiso') {
            nuevasCorrecciones[index][field] = new Date(value).toISOString().split('T')[0]; 
        } else {
            nuevasCorrecciones[index][field] = value;
        }
    
        setCorrecciones(nuevasCorrecciones);
    };   
    
    const handleAgregarFila = () => {
        setCorrecciones([...correcciones, nuevaCorreccion]);
        setNuevaCorreccion({ actividad: '', responsable: '', fechaCompromiso: '', cerrada: '' });
    };
            
    const handleGuardarCambios = async () => {
        try {
            if (filteredIshikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            }
    
            const { _id } = filteredIshikawas[0];
            const updatedIshikawa = {
                correcciones
            };
    
            console.log('Enviando datos a actualizar:', updatedIshikawa);
    
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, {
                estado: 'Revisado',
                ...updatedIshikawa
            });
    
            console.log('Respuesta del servidor:', response.data);
    
            alert('Información actualizada correctamente');
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Hubo un error al actualizar la información');
        }
    };    

    const Finalizar = async (id, porcentaje) => {
        Swal.fire({
          title: '¿Estás seguro de querer finalizar este diagrama?',
          text: '¡Está acción no se puede revertir!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, Aprobar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            handleGuardarCambios ();
          }
        });
      };

      const handleGuardarAprobacion = async () => {
        try {
            const { _id } = filteredIshikawas[0];
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, {
                estado: 'Aprobado'
            });
            fetchData();
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Hubo un error al actualizar la información');
        }
        };

        const Aprobar = async (id, porcentaje) => {
            Swal.fire({
              title: '¿Estás seguro de querer aprobar este diagrama?',
              text: '¡Está acción no se puede revertir!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3ccc37',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, Aprobar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                handleGuardarAprobacion();
              }
            });
          };

    const handleGuardarRechazo = async () => {
    try {
        const { _id } = filteredIshikawas[0];
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, {
            estado: 'Rechazado',
            notaRechazo 
        });
        fetchData();
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Hubo un error al actualizar la información');
    }
    };

    const Rechazar = async (id, porcentaje) => {
        Swal.fire({
          title: '¿Estás seguro de querer rechazar este diagrama?',
          text: '¡El diagrama será devuelto!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, rechazar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            handleGuardarRechazo ();
          }
        });
      };
      

    const handleEliminarFila = (index) => {
    const nuevasCorrecciones = [...correcciones];
    nuevasCorrecciones.splice(index, 1);
    setCorrecciones(nuevasCorrecciones);
    };

    const verificarRegistro = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
          const dataFiltrada = response.data.filter(item => item.idRep === _id && item.idReq === id && (item.estado === 'Rechazado' || item.estado === 'Revisado' || item.estado === 'Aprobado'));
          const registroAprobado = response.data.some(item => item.idRep === _id && item.idReq === id && item.estado === 'Aprobado');
          setAprobado(registroAprobado);
          setRechazo(dataFiltrada);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

    const handleTempFechaChange = (value) => {
        setTempFechaCompromiso(value);
    };

    const handleActividadChange = (index, field, value) => {
        const nuevasActividades = [...actividades];
    
        if (field === 'fechaCompromiso') {
            nuevasActividades[index][field] = [...nuevasActividades[index][field], value];
        } else {
            nuevasActividades[index][field] = value;
        }
    
        setActividades(nuevasActividades);
    };

    const handleUpdateFechaCompromiso = async (index) => {
        try {
            const nuevaFecha = tempFechaCompromiso;
            const actividadActualizada = {
                ...actividades[index],
                fechaCompromiso: [...actividades[index].fechaCompromiso, nuevaFecha] // Asegúrate de agregar la nueva fecha al array existente
            };
    
            const updatedActividades = [...actividades];
            updatedActividades[index] = actividadActualizada;
    
            const updatedData = {
                actividades: updatedActividades
            };
    
            const { _id } = rechazo[0];
    
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/fecha/${_id}`, updatedData);
            console.log('Datos actualizados:', response.data);
            fetchData();
            Swal.fire('Fecha actualizada', `La nueva fecha de compromiso es: ${nuevaFecha}`, 'success');
        } catch (error) {
            console.error('Error al actualizar la fecha de compromiso:', error);
            Swal.fire('Error', 'No se pudo actualizar la fecha de compromiso', 'error');
        }
    };
    
    const colores = ['black', 'blue', 'green', 'yellow','orange', 'red'];

    const handleSelectChange = (event, index) => {
        event.target.style.color = colores[index % colores.length];
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
                    {ishikawa.estado === 'En revisión' && (
                        <>
                            {showNotaRechazo && (
                                <div className="nota-rechazo-container">
                                    <textarea
                                        value={notaRechazo}
                                        onChange={(e) => setNotaRechazo(e.target.value)}
                                        className='textarea-ishi'
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
                                <button onClick={Rechazar} className='boton-rechazar' >Rechazar</button>
                                <button onClick={Aprobar} >Aprobar</button>
                            </div>
                        </>
                    )}
                    <div className='button-final'>
                    {
                    (!aprobado) ? null : (
                    <button onClick={Finalizar} >Finalizar</button>
                    )}
                    </div>

                    <img src={Logo} alt="Logo Aguida" className='logo-empresa-ish' />
                    <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
                    <div className='posicion-en'>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ marginLeft: '30rem', marginRight: '10px' }}>Problema: </h2>
                        <div style={{ width: '30rem', fontSize: '20px' }}>{ishikawa.problema}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ marginLeft: '30rem', marginRight: '10px' }}>Afectación: </h2>
                        <h2>{id}</h2>
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
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
                
                    <div className='posicion-bo'>
                    <div className='cont-part'>
                  <button className='button-part' onClick={(e) => {
                      e.preventDefault();
                      setShowPart(!showPart)
                    }}>
                    <span class="material-symbols-outlined" style={{color:'#ffffff', fontSize:'33px'}}>
                      attribution
                      </span>
                  </button>
                  {showPart && (
                  <div className='part-div'>{ishikawa.participantes}</div>
                    )}
                  </div>
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
                            <td>
                            <textarea
                            className='table-input'
                            type="text"
                            value={actividad.actividad}
                            onChange={(e) => handleActividadChange(index, 'actividad', e.target.value)}
                            required
                            />
                            </td>
                            <td><textarea
                            className='table-input'
                            type="text"
                            value={actividad.responsable}
                            onChange={(e) => handleActividadChange(index, 'responsable', e.target.value)}
                            required
                        /></td>
                            <td >
                                <div className='td-fechas'>
                                <select
                                    className="custom-select"
                                    onChange={(e) => handleSelectChange(e, actividad.fechaCompromiso.length - 1 - actividad.fechaCompromiso.slice().reverse().findIndex(fecha => fecha === e.target.value))}
                                    style={{ color: colores[actividad.fechaCompromiso.length - 1]} } // Inicializa con el color del primer elemento invertido
                                >
                                    {actividad.fechaCompromiso.slice().reverse().map((fecha, index) => (
                                        <option 
                                            key={index}
                                            className={`option-${index}`}
                                            style={{ color: colores[(actividad.fechaCompromiso.length - 1 - index) % colores.length] }}
                                        >
                                            {fecha}
                                        </option>
                                    ))}
                                </select>
                                </div>

                                <div className='button-cancel'>
                          {aprobado && showReprogramar ? (
                              <>
                                  <input
                                      type="date"
                                      onChange={(e) => handleTempFechaChange(e.target.value)}
                                      required
                                  />
                                  <button onClick={(e) => { e.preventDefault();handleUpdateFechaCompromiso(index)
                                   }} className='button-new-date'>
                                      Reprogramar Fecha
                                  </button>
                              </>
                          ) : (
                              <></>
                          )}
                          {
                        (!aprobado) ? null : (
                          <button className='button-repro' onClick={() => setShowReprogramar(!showReprogramar)}>
                                {showReprogramar ? 'Cancelar' : 'Reprogramar'}
                          </button>
                          )}
                        </div>
                                
                      </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <table style={{ border: 'none' }}>
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
                        {correcciones.map((correccion, index) => (
                            <tr key={index}>
                                <td>
                                    <textarea
                                        type="text"
                                        value={correccion.actividad}
                                        onChange={(e) => handleCorreccionChange(index, 'actividad', e.target.value)}
                                        className="no-border"
                                    />
                                </td>
                                <td>
                                    <textarea
                                        type="text"
                                        value={correccion.responsable}
                                        onChange={(e) => handleCorreccionChange(index, 'responsable', e.target.value)}
                                        className="no-border"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        value={correccion.fechaCompromiso}
                                        onChange={(e) => handleCorreccionChange(index, 'fechaCompromiso', e.target.value)}
                                        className="no-border"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={correccion.cerrada === 'Sí'}
                                        onChange={(e) => handleCorreccionChange(index, 'cerrada', e.target.checked)}
                                        className="no-border"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={correccion.cerrada === 'No'}
                                        onChange={(e) => handleCorreccionChange(index, 'cerradaNo', e.target.checked)}
                                        className="no-border"
                                    />
                                </td>
                                <td className='cancel-acc'>
                                    {index > 0 && (
                                        <button onClick={() => handleEliminarFila(index)}>Eliminar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                    <div>
                        <button onClick={handleAgregarFila} className='button-agregar'>Agregar Fila</button>
                    </div>

                    </div>
                </div>
                ))}
            </div>
            
        </div>
    );
};

export default IshikawaRev;