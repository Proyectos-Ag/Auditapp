import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../../App';
import logo from "../assets/img/logoAguida.png";
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './css/Final.css'
import { useParams } from 'react-router-dom';

const Finalizada = () => {
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [ishikawas, setIshikawas] = useState([]);
    const [hiddenDurations, setHiddenDurations] = useState([]);
    const navigate = useNavigate();
    const {_id} = useParams();

    useEffect(() => {
        const fetchDataAndObtainData = async () => {
            try {
                // Fetch both data
                await Promise.all([fetchData(), obtenerDatos()]);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            } 
        };
    
        if (userData && userData.Correo) {
            fetchDataAndObtainData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData]);

    const obtenerDatos = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/por/${_id}`);
            const datosRecibidos = Array.isArray(response.data) ? response.data : [response.data];
    
            setDatos(datosRecibidos);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/por/${_id}`);
            setIshikawas(Array.isArray(response.data) ? response.data : [response.data]); 
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            
        }
    };

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

    const navIshikawa = (_id, id, nombre) => {
        navigate(`/ishikawa/${_id}/${id}/${nombre}`);
    }; 
    
    const handlePrintPDF = () => {
        const showLoading = () => {
            document.getElementById('loading-overlay').style.display = 'flex';
        };
    
        const hideLoading = () => {
            document.getElementById('loading-overlay').style.display = 'none';
        };
    
        showLoading();
    
        const part1 = document.getElementById('pdf-content-part1');
        const part2 = document.getElementById('pdf-content-part2');
    
        const addPartAsImage = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const canvas = await html2canvas(element, { scale: 2.5, useCORS: true });
            const imgWidth = pageWidth - marginLeft - marginRight;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
            if (yOffset + imgHeight + bottomMargin > pageHeight) {
                pdf.addPage();
                yOffset = 0.5;
            }
    
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            pdf.addImage(imgData, 'JPEG', marginLeft, yOffset, imgWidth, imgHeight);
            yOffset += imgHeight;
    
            return yOffset;
        };
    
        const processElementRows = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const rows = element.querySelectorAll('tr');
            for (const row of rows) {
                const rowCanvas = await html2canvas(row, { scale: 2.5, useCORS: true });
                const rowHeight = (rowCanvas.height * (pageWidth - marginLeft - marginRight)) / rowCanvas.width;
    
                if (yOffset + rowHeight + bottomMargin > pageHeight) {
                    pdf.addPage();
                    yOffset = 0.5; // Reiniciar el offset en la nueva página
                }
    
                const rowImgData = rowCanvas.toDataURL('image/jpeg', 0.8);
                pdf.addImage(rowImgData, 'JPEG', marginLeft, yOffset, pageWidth - marginLeft - marginRight, rowHeight);
                yOffset += rowHeight;
            }
    
            return yOffset;
        };
    
        const addPartWithRowControl = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const tables = element.querySelectorAll('table');
    
            if (tables.length > 0) {
                for (const table of tables) {
                    yOffset = await processElementRows(table, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
                }
            }
    
            return yOffset;
        };
    
        const pdf = new jsPDF('portrait', 'cm', 'letter');
    
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginLeftPart1 = 0.7;
        const marginRightPart1 = 0.7;
        const marginLeftPart2 = 1;
        const marginRightPart2 = 1;
        const bottomMargin = 1.0; // Margen inferior de 1 cm
        let yOffset = 0.5;
    
        addPartAsImage(part1, pdf, yOffset, pageWidth, pageHeight, marginLeftPart1, marginRightPart1, bottomMargin)
            .then((newYOffset) => {
                yOffset = newYOffset;
                return addPartWithRowControl(part2, pdf, yOffset, pageWidth, pageHeight, marginLeftPart2, marginRightPart2, bottomMargin);
            })
            .then(() => {
                pdf.save("auditoría.pdf");
                hideLoading();
            })
            .catch((error) => {
                console.error('Error generating PDF:', error);
                hideLoading();
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

    return (
        <div className='espacio-repo'>
            {/*Mensaje de generacion*/}
            <div id="loading-overlay" style={{display:'none'}}>
            <div className="loading-content">
                Generando archivo PDF...
            </div>
            </div>

            <div className="datos-container-repo">
            <h1 style={{fontSize:'3rem', display:'flex' ,justifyContent:'center', marginTop:'0'}}>Reportes Finalizados</h1>

            {datos.length === 0?(
                <div className='aviso'>No hay reportes finalizados...</div>
              ):('')}

                <div className="form-group-datos">
                {datos.map((dato, periodIdx) => {
                        let conteo = {};
                        let total = 0;

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

                        const puntosObtenidos = calcularPuntosTotales(conteo);

                        return (
                            <div key={periodIdx}>
                                <div className="duracion-bloque-repo">
                                    <h2 onClick={() => toggleDuration(dato.Duracion)}>
                                        Fecha de Elaboración: {formatDate(dato.FechaElaboracion)}
                                    </h2>
                                    <button onClick={handlePrintPDF}>Guardar como PDF</button>
                                </div>

                                <div className={`update-button-container ${hiddenDurations.includes(dato.Duracion) ? 'hidden' : ''}`}>
                                    <div id='pdf-content-part1' className='contenedor-repo-fin'>
                                        <div className="header-container-datos-repo-fin">
                                            <img src={logo} alt="Logo Empresa" className="logo-empresa-repo" />
                                            <div className='encabezado'>
                                            <h1>REPORTE DE AUDITORÍA</h1>
                                            </div>
                                        </div>
                                        <div className="mover">
                                        <div className={`grupo-izquierda ${!dato.Cliente ? 'sin-cliente' : ''}`}>
                                        <div className="dato">
                                            <span className="bold-text">Duración de la auditoría:</span> {dato.Duracion}
                                        </div>
                                        <div className="dato">
                                            <span className="bold-text">Tipo de auditoría:</span> {dato.TipoAuditoria}
                                        </div>
                                        {dato.Cliente && (
                                            <div className="dato">
                                                <span className="bold-text">Cliente:</span> {dato.Cliente}
                                            </div>
                                        )}
                                    </div>

                                        <div className="grupo-derecha">
                                        {dato.Cliente && (
                                            <div className="dato-right">
                                                <span className="bold-text">Fecha de evaluación de auditoría:</span> {(dato.FechaEvaluacion)}
                                            </div>
                                            )}
                                            <div className="dato-right">
                                                <span className="bold-text">Fecha de elaboración de reporte:</span> {formatDate(dato.FechaElaboracion)}
                                            </div>
                                        </div>


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
                                                        <td>{dato.Objetivo ? dato.Objetivo : 'Objetivo de ejemplo'}</td>
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
                                                        <td style={{backgroundColor:'#bdfdbd', fontWeight: 'bold', width:'50%'}}>Documento de Referencia</td>
                                                        <td style={{backgroundColor:'#bdfdbd', fontWeight: 'bold'}}>Alcance de Auditoría</td>
                                                    </tr>
                                                    <tr>
                                                    <td> 
                                                        {dato.Referencia ? (
                                                            <div>{dato.Referencia}</div>
                                                        ) : (
                                                            dato.Programa.map((programa, programIdx) => (
                                                                <div key={programIdx}>{programa.Nombre}</div>
                                                            ))
                                                        )}
                                                    </td>
                                                        <td>{dato.Alcance? dato.Alcance: dato.AreasAudi}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{backgroundColor:'#bdfdbd', fontWeight: 'bold'}}>Equipo auditor</td>
                                                        <td style={{backgroundColor:'#bdfdbd', fontWeight: 'bold'}}>Participantes en el área del recorrido</td>
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
                                                        {dato.Auditados.map((audita, audIdx) => (
                                                            <div key={audIdx}>
                                                            {audita.Nombre}
                                                            </div>
                                                        ))}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            </div>
                                            </div>
                                            <div>
                                                <div id='pdf-content-part2' className='contenedor-repo-fin-2'>
                                                <table>
                                                    <thead >
                                                        <tr>
                                                            <th colSpan="6" className="conformity-header-repo">Resultados</th>
                                                            <th colSpan="4" className="conformity-header-repo">Porcentaje de Cumplimiento: <span>
                                                                    {dato.PorcentajeCump != null ? Number(dato.PorcentajeCump).toFixed(2) : '0.00'}
                                                                </span>%</th>
                                                        </tr>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Programa</th>
                                                            <th>Lineamiento</th>
                                                            <th>Criterio</th>
                                                            <th>Problema</th>
                                                            <th>{dato.PuntuacionMaxima ? 'Hallazgo' : 'Evidencia'}</th>
                                                            <th>Acciones</th>
                                                            <th>Fecha</th>
                                                            <th>Responsable</th>
                                                            <th>Efectividad</th>
                                                            
                                                        </tr>
                                                    </thead>
                                                    
                                                    <tbody>
                                                        {dato.Programa.map((programa, programIdx) =>
                                                            programa.Descripcion.map((desc, descIdx) => {
                                                                const firePrefix = 'https://firebasestorage';
                                                             
                                                                if ((desc.Criterio !== 'NA' && desc.Criterio !== 'Conforme')) {
                                                                    const ishikawa = ishikawas.find(ish => {
                                                                        return ish.idReq === desc.ID && ish.idRep === dato._id;
                                                                    });

                                                                    const ajustarFecha = (fechaString) => {
                                                                        const fecha = new Date(fechaString);
                                                                        fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
                                                                        return fecha.toLocaleDateString('es-ES');
                                                                    };

                                                                    return (
                                                                        <tr key={descIdx}>
                                                                            <td>{desc.ID}</td>
                                                                            <td className='alingR2'>{programa.Nombre}</td>
                                                                            <td className='alingR'>{desc.Requisito}</td>
                                                                            <td>{desc.Criterio}</td>
                                                                            <td className='alingR' >
                                                                            {desc.Problema && (
                                                                                <>
                                                                                Problema: {desc.Problema}
                                                                                <br />
                                                                                <br />
                                                                                </>
                                                                            )}
                                                                            {desc.Observacion}
                                                                            </td>
                                                                            <td className="alingR" key={descIdx}>
                                                                            {Array.isArray(desc.Hallazgo) && desc.Hallazgo.length > 0 ? (
                                                                                desc.Hallazgo.map((url, idx) => {
                                                                                    const isFireImage = url.includes(firePrefix);
                                                                                    return isFireImage ? (
                                                                                        <img
                                                                                            key={idx}
                                                                                            src={url}
                                                                                            alt={`Evidencia ${idx + 1}`}
                                                                                            className="hallazgo-imagen"
                                                                                        />
                                                                                    ) : (
                                                                                        <span key={idx}>{url}</span>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <span>No hay evidencia</span>
                                                                            )}
                                                                        </td>
                                                                            <td>{ishikawa ? (ishikawa.actividades.length > 0 ? ishikawa.actividades[0].actividad : '') : ''}</td>
                                                                            <td>
                                                                            {ishikawa && 
                                                                            ishikawa.actividades.length > 0 && 
                                                                            ishikawa.actividades[0].responsable.length > 0 
                                                                                ? ishikawa.actividades[0].responsable[0].nombre 
                                                                                : ''}
                                                                            </td>
                                                                            <td>
                                                                                {ishikawa ? (
                                                                                    ishikawa.actividades.length > 0 ? ajustarFecha(ishikawa.actividades[0].fechaCompromiso) : ''
                                                                                ) : ''}
                                                                            </td>
                                                                            <td>
                                                                                <button 
                                                                                    className='button-estado'
                                                                                    style={{ backgroundColor: ishikawa ? getButtonBackgroundColor(ishikawa.estado) : '#6e6e6e' }}
                                                                                    onClick={() => navIshikawa(dato._id, desc.ID, programa.Nombre)}
                                                                                >
                                                                                    {ishikawa ? ishikawa.estado : 'Pendiente'}
                                                                                </button>
                                                                                <div>{ishikawa ? ishikawa.auditado : ''}</div>
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
                        );
                    })}
                </div>
            </div>
        </div>
    );    
};

export default Finalizada;