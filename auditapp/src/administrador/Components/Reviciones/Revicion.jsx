import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../../App';
import logo from "../assets/img/logoAguida.png";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './css/Revicion.css'; 
import Swal from 'sweetalert2';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams } from 'react-router-dom';

const Reporte = () => {
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [hiddenDurations, setHiddenDurations] = useState([]);
    const [notas, setNotas] = useState({});
    const [visibleTextAreas, setVisibleTextAreas] = useState({});
    const [hiddenRows, setHiddenRows] = useState({}); 
    const [conteoCriteriosOcultos, setConteoCriteriosOcultos] = useState({});
    const {_id} = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);


    console.log('Aquiiiiiiiii',conteoCriteriosOcultos);

    useEffect(() => {
        obtenerDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[userData]);

    useEffect(() => {
        const notasIniciales = {};
        datos.forEach(dato => {
            notasIniciales[dato._id] = dato.Comentario || '';
        });
        setNotas(notasIniciales);
    }, [datos]);    
    
    const obtenerDatos = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/por/${_id}`);
            const datosRecibidos = Array.isArray(response.data) ? response.data : [response.data];
    
            setDatos(datosRecibidos);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    const toggleDuration = (duration) => {
        setHiddenDurations(hiddenDurations.includes(duration) ?
            hiddenDurations.filter((dur) => dur !== duration) :
            [...hiddenDurations, duration]
        );
    };

    const toggleRowVisibility = (periodIdx, rowId, criterios) => {
        setHiddenRows((prevHiddenRows) => {
            const isHidden = !prevHiddenRows[rowId];
            const newHiddenRows = {
                ...prevHiddenRows,
                [rowId]: isHidden
            };
    
            const criteriosOcultos = Object.keys(newHiddenRows)
                .filter(id => newHiddenRows[id])
                .map(id => criterios[id])
                .flat()
                .filter(Boolean);
    
            actualizarConteoCriteriosOcultos(periodIdx, criteriosOcultos);
            return newHiddenRows;
        });
    };
    
    const actualizarConteoCriteriosOcultos = (periodIdx, criterios) => {
        let conteo = { m: 0, M: 0, C: 0 };
        for (const criterio of criterios) {
            if (criterio === 'm' || criterio === 'M' || criterio === 'C') {
                conteo[criterio]++;
            }
        }
        setConteoCriteriosOcultos((prevConteo) => ({
            ...prevConteo,
            [periodIdx]: conteo
        }));
    };
    
    
    const handleToggleRowVisibility = (periodIdx, programIdx, descIdx) => {
        const criterios = datos.reduce((acc, dato, pIdx) => {
            dato.Programa.forEach((programa, prgIdx) => {
                programa.Descripcion.forEach((desc, dscIdx) => {
                    const rowId = `${pIdx}-${prgIdx}-${dscIdx}`;
                    acc[rowId] = desc.Criterio;
                });
            });
            return acc;
        }, {});
        toggleRowVisibility(periodIdx, `${periodIdx}-${programIdx}-${descIdx}`, criterios);
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

    const actualizarEstadoADevuelto = async (id, AuditorLiderEmail) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/estado/${id}`, {
                Estado: 'Devuelto',
                Comentario: notas[id] || '' ,
                AuditorLiderEmail
            });
            obtenerDatos();
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };

    const actualizarEstadoTerminada = async (id, puntuacionObtenida, confExternas, estatus, porcentajeTotal, AuditorLiderEmail) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/estado/${id}`, {
                Estado: 'Terminada',
                PuntuacionObten: puntuacionObtenida,
                PuntuacionConf: confExternas,
                Estatus: estatus,
                PorcentajeTotal: porcentajeTotal,
                AuditorLiderEmail
            });
            obtenerDatos();
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };
    
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };
    
    const toggleTextAreaVisibility = debounce((id) => {
        setVisibleTextAreas(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    }, 100); 
    
     const notaCorreccion = (e, id) => {
        const newNotas = { ...notas, [id]: e.target.value };
        setNotas(newNotas);
    };
       
    const Rechazar = async (id, AuditorLiderEmail) => {
        Swal.fire({
          title: '¿Estás seguro de querer rechazar este reporte?',
          text: '¡El reporte será devuelto!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, rechazar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            actualizarEstadoADevuelto(id, AuditorLiderEmail);
          }
        });
      };

      const Aprobar = async (id, puntuacionObtenida, confExternas, estatus, porcentajeTotal, AuditorLiderEmail) => {
        Swal.fire({
          title: '¿Estás seguro de querer aprobar este reporte?',
          text: '¡Será enviado al auditado!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, aprobar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            actualizarEstadoTerminada(id, puntuacionObtenida,confExternas, estatus, porcentajeTotal, AuditorLiderEmail);
          }
        });
      };

      const eliminarReporte = async (id) => {
        Swal.fire({
            title: '¿Estás seguro de querer eliminar este reporte?',
            text: '¡El reporte será eliminado permanentemente!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/datos/${id}`);
                    obtenerDatos();
                    Swal.fire('Eliminado', 'El reporte ha sido eliminado.', 'success');
                } catch (error) {
                    console.error('Error al eliminar el reporte:', error);
                    Swal.fire('Error', 'No se pudo eliminar el reporte.', 'error');
                }
            }
        });
    };

    const handlePrintPDF = () => {
        setIsLoading(true);
        setProgress(0);
    
        const updateProgress = (increment) => {
            setProgress((prevProgress) => Math.min(Math.ceil(prevProgress + increment), 100));
        };
    
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
    
            updateProgress(20); // Incrementa el progreso de forma proporcional
            return yOffset;
        };
    
        const processElementRows = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const rows = Array.from(element.querySelectorAll('tr')).filter(row => {
                return row.style.display !== "none" && row.offsetParent !== null;
            });
    
            const progressIncrement = 30 / rows.length; // Progreso proporcional por fila
    
            for (const row of rows) {
                const rowCanvas = await html2canvas(row, { scale: 2.5, useCORS: true });
                const rowHeight = (rowCanvas.height * (pageWidth - marginLeft - marginRight)) / rowCanvas.width;
    
                if (yOffset + rowHeight + bottomMargin > pageHeight) {
                    pdf.addPage();
                    yOffset = 0.5;
                }
    
                const rowImgData = rowCanvas.toDataURL('image/jpeg', 0.8);
                pdf.addImage(rowImgData, 'JPEG', marginLeft, yOffset, pageWidth - marginLeft - marginRight, rowHeight);
                yOffset += rowHeight;
    
                updateProgress(progressIncrement); // Incrementa el progreso por cada fila
            }
    
            return yOffset;
        };
    
        const addPartWithRowControl = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const tables = element.querySelectorAll('table');
            const progressIncrement = tables.length > 0 ? 20 / tables.length : 0; // Progreso proporcional por tabla
    
            for (const table of tables) {
                yOffset = await processElementRows(table, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
                updateProgress(progressIncrement); // Incrementa el progreso por cada tabla
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
        const bottomMargin = 1.0;
        let yOffset = 0.5;
    
        addPartAsImage(part1, pdf, yOffset, pageWidth, pageHeight, marginLeftPart1, marginRightPart1, bottomMargin)
            .then((newYOffset) => {
                yOffset = newYOffset;
                return addPartWithRowControl(part2, pdf, yOffset, pageWidth, pageHeight, marginLeftPart2, marginRightPart2, bottomMargin);
            })
            .then(() => {
                pdf.save("auditoría.pdf");
                setProgress(100);
                setTimeout(() => setIsLoading(false), 500);
            })
            .catch((error) => {
                console.error('Error generating PDF:', error);
                setIsLoading(false);
            });
    };    


    return (
        <div className='espacio-repo'>
            {/*Mensaje de generacion*/}
            {isLoading && (
                <div className="loading-overlay">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress variant="determinate" value={progress} />
                        <p>{progress}%</p> {/* Muestra el porcentaje debajo del spinner */}
                    </div>
                </div>
            )}

            
            <div className="datos-container-repo">
            <h1 style={{fontSize:'3rem', display:'flex' ,justifyContent:'center', marginTop:'0'}}>Revisión de Reporte</h1>

              {datos.length === 0?(
                <div className='aviso'>No hay reportes por revisar... 🏜️</div>
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
                    const conteoCriteriosTabla = conteoCriteriosOcultos[periodIdx] || { m: 0, M: 0, C: 0 };
                    const confExternas = dato.PuntuacionMaxima - total;
                    const PuntuacionObtenida = dato.PuntuacionMaxima ? (confExternas + ((puntosObtenidos * 100 + ((conteoCriteriosTabla.m * 0.3) + (conteoCriteriosTabla.M * 0.7) + conteoCriteriosTabla.C) * 100) / 100)) : 
                        ((puntosObtenidos * 100 + ((conteoCriteriosTabla.m * 0.3) + (conteoCriteriosTabla.M * 0.7) + conteoCriteriosTabla.C) * 100) / 100).toFixed(2);

                    const resultado = dato.PuntuacionMaxima ? (((confExternas + ((puntosObtenidos * 100 + ((conteoCriteriosTabla.m * 0.3) + (conteoCriteriosTabla.M * 0.7) + conteoCriteriosTabla.C) * 100) / 100)) * 100)/ dato.PuntuacionMaxima) : 
                    (((puntosObtenidos * 100 + ((conteoCriteriosTabla.m * 0.3) + (conteoCriteriosTabla.M * 0.7) + conteoCriteriosTabla.C) * 100) / 100).toFixed(2)) * 100 / total;

                    const porcentajeTotal = dato.PuntuacionMaxima ? (((confExternas + ((puntosObtenidos * 100 + ((conteoCriteriosTabla.m * 0.3) + (conteoCriteriosTabla.M * 0.7) + conteoCriteriosTabla.C) * 100) / 100)) * 100)/ dato.PuntuacionMaxima).toFixed(2) :
                    (((puntosObtenidos * 100 + ((conteoCriteriosTabla.m * 0.3) + (conteoCriteriosTabla.M * 0.7) + conteoCriteriosTabla.C) * 100) / 100) * 100 / total).toFixed(2)

                    const estatus = resultado >= 90 ? "Bueno" :
                                    resultado >= 80 ? "Aceptable" :
                                    resultado >= 60 ? "No Aceptable" : "Crítico";

                        return (
                            <div key={periodIdx}>
                                <div className="duracion-bloque-repo">
                                    <h2 onClick={() => toggleDuration(dato.Duracion)}>
                                        Fecha de Elaboración: {formatDate(dato.FechaElaboracion)}
                                    </h2>
                                    <button onClick={handlePrintPDF}>Guardar como PDF</button>
                                </div>

                                <div className={`update-button-container ${hiddenDurations.includes(dato.Duracion) ? 'hidden' : ''}`}>
                                    <div className='contenedor-repo'>
                                    <div className='buttons-estado'>
                                    <button onClick={() => toggleTextAreaVisibility(dato._id)}>
                                            {visibleTextAreas[dato._id] ? 'Ocultar Nota' : 'Escribir Nota'}
                                        </button>
                                        <button className='boton-rechazar' onClick={() => Rechazar(dato._id, dato.AuditorLiderEmail)}>Rechazar</button>
                                        <button onClick={() => Aprobar(dato._id, PuntuacionObtenida, confExternas,estatus, porcentajeTotal, dato.AuditorLiderEmail)}>Aprobar</button>
                                        <button onClick={() => eliminarReporte(dato._id)} className='btn-eliminar'>
                                    Eliminar Reporte
                                    </button>
                                    </div> 
                                    </div>    
                                    {visibleTextAreas[dato._id] && (
                                        <textarea
                                            className='textarea-mod'
                                            value={notas[dato._id] || ''}
                                            onChange={(e) => notaCorreccion(e, dato._id)}
                                         placeholder='Razón del rechazo. . .'></textarea>
                                    )}

                                    <div id='pdf-content-part1' className='contenedor-repo-fin'>
                                        <div className="header-container-datos-repo-fin">
                                            <img src={logo} alt="Logo Empresa" className="logo-empresa-repo" />
                                            <div className='encabezado'>
                                            <h1>REPORTE DE AUDITORÍA</h1>
                                            </div>
                                        </div>
                                        <div className='mover'>
                                            <div className="dato"><span className="bold-text">Duración de la auditoría:</span> {dato.Duracion}</div>
                                            <div className="dato"><span className="bold-text">Tipo de auditoría:</span> {dato.TipoAuditoria}</div>
                                            <div className="dato"><span className="bold-text">Fecha de Elaboración de Reporte:</span> {formatDate(dato.FechaElaboracion)}</div>
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
                                                        <div>Conforme: </div>
                                                        <div style={{marginLeft:'3px'}}>{dato.PuntuacionMaxima ? confExternas : ''}</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'Conforme')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item">
                                                            {conteo[criterio] + (conteoCriteriosTabla.M + conteoCriteriosTabla.m + conteoCriteriosTabla.C)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="horizontal-item">
                                                <div className="horizontal-inline">
                                                    <div>NC Menor:</div>
                                                    {Object.keys(contarCriteriosPorTipo(conteo, 'm')).map(criterio => (
                                                        <div key={criterio} className="horizontal-inline-item">
                                                            {conteo[criterio] - conteoCriteriosTabla.m}
                                                        </div>
                                                    ))}
                                                </div>
                                                </div>
                                            </div>
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">
                                                    <div className="horizontal-inline"> 
                                                        <div>NC Mayor:</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'M')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item"> 
                                                            {conteo[criterio] - conteoCriteriosTabla.M}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="horizontal-item">
                                                    <div className="horizontal-inline"> 
                                                        <div>NC Crítica:</div>
                                                        {Object.keys(contarCriteriosPorTipo(conteo, 'C')).map(criterio => (
                                                            <div key={criterio} className="horizontal-inline-item"> 
                                                            {conteo[criterio] - conteoCriteriosTabla.C}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">Puntuación Máxima: {dato.PuntuacionMaxima ? dato.PuntuacionMaxima : total}</div>
                                                <div className="horizontal-item">
                                                    Puntuación Obtenida: {PuntuacionObtenida}
                                                </div>
                                            </div>
                                            <div className="horizontal-group">
                                                <div className="horizontal-item">Porcentaje: {porcentajeTotal}%</div>
                                                <div className="horizontal-item">Estatus: {estatus}</div>
                                            </div>
                                        </div>
                                        </table>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colSpan="1" className="conformity-header-repo">Objetivo</th>
                                                </tr>
                                            </thead>
                                            <div>{dato.Objetivo ? dato.Objetivo : 'Garantizar que el Sistema cumpla continuamente con los requisitos internacionales, lo que da como resultado una certificación que asegura el suministro de productos seguros a los consumidores en todo el mundo.'}</div>
                                        </table>

                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colSpan="2" className="conformity-header-repo">Alcance</th>
                                                </tr>
                                                <tr>
                                                    <th className="table-header">Programas</th>
                                                    <th className="table-header">Áreas Auditadas</th>
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
                                                    <th className="table-header">Equipo Auditor</th>
                                                    <th className="table-header">Participantes en el Área del Recorrido</th>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div>Auditor Líder: {dato.AuditorLider}</div>
                                                        <div>
                                                        {dato.EquipoAuditor.map((equipo, equipoIdx) => (
                                                            <div key={equipoIdx}>
                                                              Equipo Auditor: {equipo.Nombre}
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
                                                        ))}</div>
                                                    </td>
                                                </tr>
                                            </thead>
                                        </table>
                                        </div>
                                        </div>

                                        <div>
                                        <div id='pdf-content-part2' className='contenedor-repo-fin-2'>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th colSpan="10" className="conformity-header-repo">Resultados</th>
                                                    </tr>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Programa</th>
                                                        <th>Lineamiento</th>
                                                        <th>Criterio</th>
                                                        <th>Problema</th>
                                                        <th>Hallazgos</th>
                                                        <th>Acciones</th>
                                                        <th>Fecha</th>
                                                        <th>Responsable</th>
                                                        <th>Efectividad</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                {dato.Programa.map((programa, programIdx) => (
                                                    programa.Descripcion.map((desc, descIdx) => {
                                                        const firePrefix = 'https://firebasestorage';
                                                        const isFireImage = desc.Hallazgo.includes(firePrefix);

                                                        const rowId = `${periodIdx}-${programIdx}-${descIdx}`;
                                                        const isHidden = hiddenRows[rowId];

                                                        if (desc.Criterio !== 'NA' && desc.Criterio !== 'Conforme') {
                                                            return (
                                                                <React.Fragment key={descIdx}>
                                                                    <tr style={{ display: isHidden ? 'none' : 'table-row' }}>
                                                                        <td>{desc.ID}</td>
                                                                        <td className='alingR2'>{programa.Nombre}</td>
                                                                        <td className='alingR'>{desc.Requisito}</td>
                                                                        <td>{desc.Criterio}</td>
                                                                        <td style={{ textAlign: 'initial' }}>
                                                                        {desc.Problema && (
                                                                            <>
                                                                            Problema: {desc.Problema}
                                                                            <br />
                                                                            <br />
                                                                            </>
                                                                        )}
                                                                        {desc.Observacion}
                                                                        </td>
                                                                        <td className='alingR' key={descIdx}>
                                                                            {desc.Hallazgo ? (
                                                                                isFireImage ? (
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
                                                                        <td>
                                                                            <button className='button-oculto' onClick={() => handleToggleRowVisibility(periodIdx, programIdx, descIdx)}>
                                                                               Ocultar
                                                                            </button>
                                                                        </td>
                                                                        <td>{}</td>
                                                                        <td>{}</td>
                                                                        <td>{}</td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            );
                                                        } else {
                                                            return null;
                                                        }
                                                    })
                                                ))}
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

export default Reporte;