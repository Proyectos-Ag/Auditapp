import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../App';
import logo from "../../assets/img/logoAguida.png";
import './css/Terminada.css'; 
import Navigation from '../Navigation/Navbar';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Terminada = () => {
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [ishikawas, setIshikawas] = useState([]);
    const [hiddenDurations, setHiddenDurations] = useState([]);
    const [, setCriteriosConteo] = useState({});
    const [, setTotalCriterios] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[userData]);

    const obtenerDatos = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
            if (userData && userData.Correo) {
                const datosFiltrados = response.data.filter((dato) => 
                    dato.Estado === "Terminada"
                );
    
                // Ordenar por FechaElaboracion del más reciente al más antiguo
                datosFiltrados.sort((a, b) => {
                    const fechaElaboracionA = new Date(a.FechaElaboracion);
                    const fechaElaboracionB = new Date(b.FechaElaboracion);
                    return fechaElaboracionB - fechaElaboracionA;
                });
    
                let conteo = {};
                let total = 0;
                datosFiltrados.forEach(dato => {
                    dato.Programa.forEach(programa => {
                        programa.Descripcion.forEach(desc => {
                            if (desc.Criterio && desc.Criterio !== 'NA') {
                                if (!conteo[desc.Criterio]) {
                                    conteo[desc.Criterio] = 0;
                                }
                                conteo[desc.Criterio]++;
                                total++;
                            }
                        });
                    });
                });
    
                setDatos(datosFiltrados);
                setCriteriosConteo(conteo);
                setTotalCriterios(total);
    
                // Ocultar todas las duraciones excepto la más reciente por defecto
                const duracionesOcultas = datosFiltrados.slice(1).map(dato => dato.Duracion);
                setHiddenDurations(duracionesOcultas);
            } else {
                console.log('userData o userData.Correo no definidos:', userData);
            }
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
                const dataFiltrada = response.data.filter(item => 
                item.estado === 'En revisión' ||  item.estado === 'revisado' ||  item.estado === 'rechazado' ) ;
                setIshikawas(dataFiltrada);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const toggleDuration = (duration) => {
        setHiddenDurations(hiddenDurations.includes(duration) ?
            hiddenDurations.filter((dur) => dur !== duration) :
            [...hiddenDurations, duration]
        );
    };

    const contarCriteriosPorTipo = (criterios, tipo) => {
        return Object.keys(criterios).filter(criterio => criterio === tipo).reduce((acc, criterio) => {
            acc[criterio] = criterios[criterio];
            return acc;
        }, {});
    };

    const checkboxValues = {
        'Conforme': 1,
        'm': 0.7,
        'M': 0.3,
        'C': 0
    };

    const calcularPuntosTotales = (conteo) => {
        let puntosTotales = 0;
        for (const [criterio, valor] of Object.entries(conteo)) {
            if (checkboxValues[criterio] !== undefined) {
                puntosTotales += valor * checkboxValues[criterio];
            }
        }
        return puntosTotales.toFixed(2);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const actualizarEstadoFinalizado = async (id) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/estado/${id}`, {
                Estado: 'Finalizado'
            });
            obtenerDatos();
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };

    const Finalizar = async (id) => {
        Swal.fire({
          title: '¿Estás seguro de querer finalizar este reporte?',
          text: '¡El reporte se dara por terminado!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, finalizar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            actualizarEstadoFinalizado(id);
          }
        });
      };


    const navIshikawa = (_id, id) => {
        navigate(`/ishikawa/${_id}/${id}`);
    }; 
    

    return (
        <div className='espacio-repo'>
            <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <Navigation />
            </div>
            <div className="datos-container-repo">
                <div className="form-group-datos">
                    {datos.map((dato, periodIdx) => {
                        let conteo = {};
                        let total = 0;
                        let totalNC = { menor: 0, mayor: 0, critica: 0 };
    
                        dato.Programa.forEach(programa => {
                            programa.Descripcion.forEach(desc => {
                                if (desc.Criterio && desc.Criterio !== 'NA') {
                                    if (!conteo[desc.Criterio]) {
                                        conteo[desc.Criterio] = 0;
                                    }
                                    conteo[desc.Criterio]++;
                                    total++;
    
                                    // Sumar cantidades de NC Menor, NC Mayor y NC Crítica
                                    if (desc.Criterio === 'm') totalNC.menor++;
                                    if (desc.Criterio === 'M') totalNC.mayor++;
                                    if (desc.Criterio === 'C') totalNC.critica++;
                                }
                            });
                        });
    
                        const sumaNC = totalNC.menor + totalNC.mayor + totalNC.critica;
                        const puntosObtenidos = calcularPuntosTotales(conteo);
    
                        // Calcular estadosRevisados independientemente para cada tabla
                        let estadosRevisados = 0;
                        const ishikawasFiltradas = ishikawas.filter(ishikawa =>
                            ishikawa.idRep === dato._id && 
                            (ishikawa.estado === 'En revisión' || ishikawa.estado === 'revisado' || ishikawa.estado === 'rechazado')
                        );
    
                        ishikawasFiltradas.forEach(ishikawa => {
                            if (ishikawa.estado === 'revisado') estadosRevisados++;
                        });
    
                        const porcentaje = (estadosRevisados > 0 && sumaNC > 0) ? (estadosRevisados * 100) / sumaNC : 0;
    
                        return (
                            <div key={periodIdx}>
                                <div className="duracion-bloque-repo">
                                    <h2 onClick={() => toggleDuration(dato.Duracion)}>
                                        Fecha de Elaboración: {formatDate(dato.FechaElaboracion)}
                                    </h2>
                                </div>
    
                                <div className={`update-button-container ${hiddenDurations.includes(dato.Duracion) ? 'hidden' : ''}`}>
                                    <div className='contenedor-repo'>
                                    <div className='buttons-estado'>
                                    <button  onClick={() => Finalizar(dato._id)}>Finalizar</button>
                                    </div>
                                        <div className="header-container-datos-repo">
                                            <img src={logo} alt="Logo Empresa" className="logo-empresa-repo" />
                                            <h1>REPORTE DE AUDITORÍA</h1>
                                        </div>
                                        <div className='mover'>
                                            <div className="dato"><span className="bold-text">Duración de la auditoría:</span> {dato.Duracion}</div>
                                            <div className="dato"><span className="bold-text">Tipo de auditoría:</span> {dato.TipoAuditoria}</div>
                                            <div className="dato"><span className="bold-text">Fecha de elaboración de reporte:</span> {formatDate(dato.FechaElaboracion)}</div>
                                        </div>
                                        <div className='tabla-reporte'>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colSpan="1" className="conformity-header-repo">Puntos Obtenidos</th>
                                                </tr>
                                            </thead>
                                        
                                        <div className="horizontal-container">
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">
                                                    <div className="horizontal-inline">
                                                        <div>Conforme:</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'Conforme')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item">  {conteo[criterio]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="horizontal-item">
                                                    <div className="horizontal-inline">
                                                        <div>NC Menor:</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'm')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item"> {conteo[criterio]}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">
                                                    <div className="horizontal-inline"> 
                                                        <div>NC Mayor:</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'M')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item"> {conteo[criterio]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="horizontal-item">
                                                    <div className="horizontal-inline"> 
                                                        <div>NC Crítica:</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'C')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item"> {conteo[criterio]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">Puntuación máxima: {total}</div>
                                                <div className="horizontal-item">Puntuación Obtenida: {puntosObtenidos}</div>
                                            </div>
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">Porcentaje: {dato.PorcentajeTotal}%</div>
                                                <div className="horizontal-item">Estatus: {dato.Estatus}</div>
                                            </div>
                                        </div>
                                        </table>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th colSpan="1" className="conformity-header-repo">Objetivo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>Objetivo de ejemplo</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th colSpan="2" className="conformity-header-repo">Alcance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>Programas</td>
                                                        <td>Áreas auditadas</td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            {dato.Programa.map((programa, programIdx) => (
                                                                <div key={programIdx}>
                                                                    {programa.Nombre}
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td>{dato.AreasAudi}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Equipo auditor</td>
                                                        <td>Participantes en el área del recorrido</td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <div>Auditor líder: {dato.AuditorLider}</div>
                                                            <div>
                                                                {dato.EquipoAuditor.map((equipo, equipoIdx) => (
                                                                    <div key={equipoIdx}>
                                                                        Equipo auditor: {equipo.Nombre}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {dato.NombresObservadores && (
                                                                <div>Observador(es): {dato.NombresObservadores}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div>{dato.Auditados}</div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th colSpan="6" className="conformity-header-repo">Resultados</th>
                                                            <th colSpan="4" className="conformity-header-repo">Porcentaje de Cumplimiento: {porcentaje.toFixed(2)}%</th>
                                                        </tr>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Programa</th>
                                                            <th>Lineamiento</th>
                                                            <th>Criterio</th>
                                                            <th>Hallazgos</th>
                                                            <th>Evidencia</th>
                                                            <th>Acciones</th>
                                                            <th>Fecha</th>
                                                            <th>Responsable</th>
                                                            <th>Efectividad</th>
                                                            
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dato.Programa.map((programa, programIdx) =>
                                                            programa.Descripcion.map((desc, descIdx) => {
                                                                const base64String = desc.Hallazgo.startsWith('data:image/png;base64,')
                                                                    ? desc.Hallazgo
                                                                    : `data:image/png;base64,${desc.Hallazgo}`;
    
                                                                if (desc.Criterio !== 'NA' && desc.Criterio !== 'Conforme') {
                                                                    const ishikawa = ishikawas.find(ish => {
                                                                        return ish.idReq === desc.ID && ish.idRep === dato._id;
                                                                    });
    
                                                                    return (
                                                                        <tr key={descIdx}>
                                                                            <td>{desc.ID}</td>
                                                                            <td className='alingR2'>{programa.Nombre}</td>
                                                                            <td className='alingR'>{desc.Requisito}</td>
                                                                            <td>{desc.Criterio}</td>
                                                                            <td>{desc.Observacion}</td>
                                                                            <td>
                                                                                {desc.Hallazgo ? (
                                                                                    <img
                                                                                        src={base64String}
                                                                                        alt="Evidencia"
                                                                                        className="hallazgo-imagen"
                                                                                    />
                                                                                ) : null}
                                                                            </td>
                                                                            <td>{ishikawa ? (ishikawa.actividades.length > 0 ? ishikawa.actividades[0].actividad : '') : ''}</td>
                                                                            <td>{ishikawa ? (ishikawa.actividades.length > 0 ? ishikawa.actividades[0].responsable : '') : ''}</td>
                                                                            <td>{ishikawa ? (ishikawa.actividades.length > 0 ? new Date(ishikawa.actividades[0].fechaCompromiso).toLocaleDateString('es-ES') : '') : ''}</td>
                                                                            <td>
                                                                                <button onClick={() => navIshikawa(dato._id, desc.ID)}>{ishikawa ? ishikawa.estado : 'Pendiente'}</button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                } else {
                                                                    return null;
                                                                }
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );    
};

export default Terminada;