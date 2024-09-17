import React, {  useMemo,useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../App';
import logo from "../../assets/img/logoAguida.png";
import './css/ReporteF.css'; 
import Navigation from '../Navigation/navbar';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const ReporteF = () => {
    const {_id} = useParams();
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [ishikawas, setIshikawas] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const obtenerDatos = async () => {
          try {
            // Obtener datos principales
            const responseDatos = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/datos-filtrados-aud/${_id}`, {
              params: { correo: userData.Correo }
            });
            setDatos([responseDatos.data]);

            console.log("Datos",[responseDatos.data]);
      
            // Obtener datos de Ishikawa
            const responseIshikawa = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/por/${_id}`);
            setIshikawas([responseIshikawa.data]);

            console.log("datos recibidos",[responseIshikawa.data]);

          } catch (error) {
            console.error('Error al obtener los datos:', error);
          }
        };
      
        obtenerDatos();
      }, [userData, _id]);          

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

    const getButtonBackgroundColor = (estado) => {
        let backgroundColor;
        if (estado === 'Asignado') {
            backgroundColor = '#055e99'; 
        } else if (estado === 'En revisión') {
            backgroundColor = '#ffe817'; 
        } else if (estado === 'Rechazado') {
            backgroundColor = '#ff1515'; 
        } else if (estado === 'Aprobado') {
            backgroundColor = '#25d1dd'; 
        } else if (estado === 'Revisado') {
            backgroundColor = '#25f71e'; 
        } else {
            backgroundColor = '#585858'; // Por defecto
        }
        return backgroundColor;
    };

    const navIshikawa = (_id, id, nombre) => {
        navigate(`/ishikawa/${_id}/${id}/${nombre}`);
    };  
    
    const ishikawasMap = useMemo(() => {
        return ishikawas.reduce((acc, ish) => {
            acc[`${ish.idReq}-${ish.idRep}-${ish.proName}`] = ish;
            return acc;
        }, {});
    }, [ishikawas]);

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
                            (ishikawa.estado === 'En revisión' || ishikawa.estado === 'Aprobado'|| 
                            ishikawa.estado === 'Revisado' || ishikawa.estado === 'Rechazado')
                        );
    
                        ishikawasFiltradas.forEach(ishikawa => {
                            if (ishikawa.estado === 'Revisado') estadosRevisados++;
                        });
    
                        const porcentaje = (estadosRevisados > 0 && sumaNC > 0) ? (estadosRevisados * 100) / sumaNC : 0;

                        return (
                            <div key={periodIdx}>
                                <div className="duracion-bloque-repo">
                                    <h2>
                                        Fecha de Elaboración: {formatDate(dato.FechaElaboracion)}
                                    </h2>
                                </div>

                                <div className="update-button-container">
                                    <div className='contenedor-repo'>
                                        <div className="header-container-datos-repo">
                                            <img src={logo} alt="Logo Empresa" className="logo-empresa-repo" />
                                            <div className='encabezado'>
                                            <h1>REPORTE DE AUDITORÍA</h1>
                                            </div>
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
                                                        <div style={{marginLeft:'3px'}}>{dato.PuntuacionConf ?  dato.PuntuacionConf : ''}</div>
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
                                                <div className="horizontal-item">Puntuación máxima: { dato.PuntuacionMaxima ? dato.PuntuacionMaxima : total}</div>
                                                <div className="horizontal-item">Puntuación Obtenida: {dato.PuntuacionObten ? dato.PuntuacionObten: puntosObtenidos}</div>
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
                                                        <td>{dato.Objetivo ? dato.Objetivo : 'Garantizar que el Sistema cumpla continuamente con los requisitos internacionales, lo que da como resultado una certificación que asegura el suministro de productos seguros a los consumidores en todo el mundo.'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colSpan="2" className="conformity-header-repo">Alcance</th>
                                                </tr>
                                                <tr>
                                                    <th className="table-header">Programas</th>
                                                    <th className="table-header">Áreas auditadas</th>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        {dato.Programa.map((programa, programIdx) => (
                                                            <div key={programIdx}>
                                                                {programa.Nombre}
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td><div>{dato.AreasAudi}</div></td>
                                                </tr>
                                                <tr>
                                                    <th className="table-header">Equipo auditor</th>
                                                    <th className="table-header">Participantes en el área del recorrido</th>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div>Auditor líder: {dato.AuditorLider}</div>
                                                        <div>
                                                        {dato.EquipoAuditor.map((equipo, equipoIdx) => (
                                                            <div key={equipoIdx}>
                                                              Equipo auditor: {equipo.Nombre}
                                                            </div>
                                                        ))}</div>
                                                        {dato.NombresObservadores && (
                                                            <div>Observador(es): {dato.NombresObservadores}</div>
                                                            )}
                                                    </td>
                                                    <td>
                                                    <div>
                                                        {dato.Auditados.map((audita, audIdx) => (
                                                            <div key={audIdx}>
                                                            {audita.Nombre}
                                                            </div>
                                                        ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </thead>
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
                                                        const base64Prefix = 'data:image/png;base64,';
                                                        const isBase64Image = desc.Hallazgo.includes(base64Prefix);

                                                        const ajustarFecha = (fechaString) => {
                                                            const fecha = new Date(fechaString);
                                                            fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
                                                            return fecha.toLocaleDateString('es-ES');
                                                        };

                                                        // Evita renderizar filas no necesarias
                                                        if (desc.Criterio !== 'NA' && desc.Criterio !== 'Conforme') {
                                                            const ishikawaKey = `${desc.ID}-${dato._id}-${programa.Nombre}`;
                                                            const ishikawa = ishikawasMap[ishikawaKey];
                                                            console.log("A ver", ishikawa);

                                                        return (
                                                            <tr key={descIdx}>
                                                            <td>{desc.ID}</td>
                                                            <td className='alingR2'>{programa.Nombre}</td>
                                                            <td className='alingR'>{desc.Requisito}</td>
                                                            <td>{desc.Criterio}</td>
                                                            <td>{desc.Observacion}</td>
                                                            <td key={descIdx} className='alingR'>
                                                                {desc.Hallazgo ? (
                                                                isBase64Image ? (
                                                                    <img
                                                                    src={desc.Hallazgo}
                                                                    alt="Evidencia"
                                                                    className="hallazgo-imagen"
                                                                    />
                                                                ) : (
                                                                    <span>{desc.Hallazgo}</span>
                                                                )
                                                                ) : null}
                                                            </td>
                                                            <td>{ishikawa ? (ishikawa.actividades.length > 0 ? ishikawa.actividades[0].actividad : '') : ''}</td>
                                                            <td>
                                                                {ishikawa ? (
                                                                ishikawa.actividades.length > 0 && ishikawa.actividades[0].fechaCompromiso.length > 0 ? 
                                                                    ajustarFecha(ishikawa.actividades[0].fechaCompromiso.slice(-1)[0]) : 
                                                                    ''
                                                                ) : ''}
                                                            </td>
                                                            <td>{ishikawa ? (ishikawa.actividades.length > 0 ? ishikawa.actividades[0].responsable : '') : ''}</td>
                                                            <td>
                                                                {ishikawa && userData.Nombre === ishikawa.auditado ? (
                                                                <button className="button-estado" 
                                                                style={{ backgroundColor: ishikawa ? getButtonBackgroundColor(ishikawa.estado) : '#6e6e6e' }}
                                                                onClick={() => navIshikawa(dato._id, desc.ID, programa.Nombre)}>
                                                                    {ishikawa.estado || 'Pendiente'}
                                                                </button>
                                                                ) : null}
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

export default ReporteF;