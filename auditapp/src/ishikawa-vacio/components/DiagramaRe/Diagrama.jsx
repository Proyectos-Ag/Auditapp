import React, { useContext,useState, useEffect } from 'react';
import axios from 'axios';
import './css/Diagrama.css'
import CircularProgress from '@mui/material/CircularProgress';
import Logo from "../assets/img/logoAguida.png";
import Ishikawa from '../assets/img/Ishikawa-transformed.png';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserContext } from '../../../App';

const Diagrama = () => {
    const [ishikawas, setIshikawas] = useState([]);
    const { userData } = useContext(UserContext);
    const [visibleIndex, setVisibleIndex] = useState(0);
    const [showPart, setShowPart] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
                const dataFiltrada = response.data.filter(item => (item.estado === 'Aprobado' || item.estado === 'Hecho') && 
                    item.auditado === userData.Nombre &&
                    item.tipo === 'vacio');
                
                // Ordenar por fechaElaboracion
                const dataOrdenada = dataFiltrada.sort((a, b) => new Date(a.fechaElaboracion) - new Date(b.fechaElaboracion));
                
                setIshikawas(dataOrdenada);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData();
    }, [userData]);
    

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
    
      }, [ishikawas]);

      const toggleVisibility = (index) => {
        setVisibleIndex(visibleIndex === index ? null : index);
    };    

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

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const originalInputs = [];
    const originalTextareas = [];

    const convertToDivs = (element) => {
        // Procesar inputs
        const inputs = element.querySelectorAll('input');
        inputs.forEach((input) => {
            const div = document.createElement('div');
            div.textContent = input.value;
            div.className = input.className;
            div.style.cssText = input.style.cssText;
            div.style.display = 'inline-block';
            div.style.padding = '0';
            div.style.border = 'none';
            div.setAttribute("data-replaced", "true"); // Agregar atributo identificador
    
            // Guardar el estado original
            originalInputs.push({ parent: input.parentNode, element: input, sibling: input.nextSibling });
    
            // Reemplazar el input con el div
            input.parentNode.replaceChild(div, input);
        });
    
        // Procesar textareas
        const textareas = element.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
            const div = document.createElement('div');
            div.innerHTML = textarea.value.replace(/\n/g, '<br>');
            div.className = textarea.className;
            div.style.cssText = textarea.style.cssText;
            div.setAttribute("data-replaced", "true"); // Agregar atributo identificador
    
            // Guardar el estado original
            originalTextareas.push({ parent: textarea.parentNode, element: textarea, sibling: textarea.nextSibling });
    
            // Reemplazar el textarea con el div
            textarea.parentNode.replaceChild(div, textarea);
        });
    };
    
    const restoreElements = () => {
        // Restaurar inputs y eliminar los divs generados
        originalInputs.forEach(({ parent, element, sibling }) => {
            // Buscar y eliminar todos los divs generados
            parent.querySelectorAll('div[data-replaced="true"]').forEach(div => div.remove());
    
            // Restaurar el input en su posición original
            if (sibling && sibling.parentNode === parent) {
                parent.insertBefore(element, sibling);
            } else {
                parent.appendChild(element);
            }
        });
        originalInputs.length = 0; // Limpiar el array
    
        // Restaurar textareas y eliminar los divs generados
        originalTextareas.forEach(({ parent, element, sibling }) => {
            parent.querySelectorAll('div[data-replaced="true"]').forEach(div => div.remove());
    
            if (sibling && sibling.parentNode === parent) {
                parent.insertBefore(element, sibling);
            } else {
                parent.appendChild(element);
            }
        });
        originalTextareas.length = 0; // Limpiar el array
    };

    const handlePrintPDF = () => {
        setIsLoading(true);
        setProgress(0);
        
        const updateProgress = (increment) => {
            setProgress((prevProgress) => Math.min(Math.ceil(prevProgress + increment), 100));
        };
    
        const part1 = document.getElementById('pdf-content-part1');
        const part2 = document.getElementById('pdf-content-part2');
        const part3 = document.getElementById('pdf-content-part3');
    
        // Convertir inputs y textareas a divs
        convertToDivs(part1);
        convertToDivs(part2);
        convertToDivs(part3);
      
    
        const ensureImagesLoaded = (element) => {
            const images = element.querySelectorAll('img');
            const promises = Array.from(images).map((img) => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve;
                    }
                });
            });
            return Promise.all(promises);
        };
    
        const processRowAndImages = async (row, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            // Captura cada fila, incluyendo imágenes en celdas
            const rowCanvas = await html2canvas(row, { scale: 2.5, useCORS: true });
            const rowHeight = (rowCanvas.height * (pageWidth - marginLeft - marginRight)) / rowCanvas.width;
    
            if (yOffset + rowHeight + bottomMargin > pageHeight) {
                pdf.addPage(); // Agregar nueva página si la fila no cabe
                yOffset = 0.5; // Reiniciar el offset en la nueva página
            }
    
            const rowImgData = rowCanvas.toDataURL('image/jpeg', 0.8); // Convertir a datos base64
            pdf.addImage(rowImgData, 'JPEG', marginLeft, yOffset, pageWidth - marginLeft - marginRight, rowHeight);
            yOffset += rowHeight;
    
            updateProgress(20);
            return yOffset;
        };
    
        const processTableWithRowControl = async (tableElement, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const rows = tableElement.querySelectorAll('tr');
    
            for (const row of rows) {
                // Procesar cada fila y sus imágenes
                yOffset = await processRowAndImages(row, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
            }
    
            updateProgress(20);
            return yOffset;
        };
    
        const processPart3WithTableRows = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            await ensureImagesLoaded(element); // Asegurar que las imágenes estén completamente cargadas
    
            const tables = element.querySelectorAll('table');
                    if (tables.length > 0) {
                for (const table of tables) {
                    yOffset = await processTableWithRowControl(table, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
                  }
            }
    
            updateProgress(20);
            return yOffset;
        };
    
        const processCanvas = (canvas, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
    
            const imgWidth = pageWidth - marginLeft - marginRight;
            const imgHeight = (canvasHeight * imgWidth) / canvasWidth;
    
            if (yOffset + imgHeight + bottomMargin > pageHeight) {
                pdf.addPage();
                yOffset = 0.5;
            }
    
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            pdf.addImage(imgData, 'JPEG', marginLeft, yOffset, imgWidth, imgHeight);
    
            updateProgress(20);
            return yOffset + imgHeight;
        };
    
        const pdf = new jsPDF('landscape', 'cm', 'letter');
    
        let yOffset = 0.5;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginLeft = 0;
        const marginRight = 0;
        const marginLeft3 = 2;
        const marginRight3 = 2;
        const bottomMargin = 1.0; // Establecer un margen inferior de 1 cm
    
        html2canvas(part1, { scale: 2.5, useCORS: true }).then((canvas) => {
            yOffset = processCanvas(canvas, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
    
            return html2canvas(part2, { scale: 2.5, useCORS: true });
        }).then((canvas) => {
            yOffset = processCanvas(canvas, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
    
            setProgress(100);
            setIsLoading(false);
            // Procesar la parte 3 con tablas y manejo de filas
            return processPart3WithTableRows(part3, pdf, yOffset, pageWidth, pageHeight, marginLeft3, marginRight3, bottomMargin);
            
          }).then(() => {
            pdf.save('diagrama_ishikawa.pdf'); //Descarga de PDF
    
                // **Preguntar si se desea enviar por correo**
                return Swal.fire({
                    title: '¿Enviar PDF por correo?',
                    text: 'Puede enviar el PDF a múltiples destinatarios.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, enviar',
                    cancelButtonText: 'No, solo descargar',
                });
            })
            .then((result) => {
                if (result.isConfirmed) {
                    // **Pedir correos electrónicos**
                    return Swal.fire({
                        title: 'Ingresa los correos',
                        input: 'text',
                        inputPlaceholder: 'ejemplo1@gmail.com, ejemplo2@gmail.com',
                        showCancelButton: true,
                        confirmButtonText: 'Enviar',
                        cancelButtonText: 'Cancelar',
                        inputValidator: (value) => {
                            if (!value) return 'Debes ingresar al menos un correo';
                        }
                    }).then((emailResult) => {
                        if (emailResult.isConfirmed) {
                            const emailArray = emailResult.value.split(',').map(e => e.trim());
                            const formData = new FormData();
                            formData.append('pdf', pdf.output('blob'), 'diagrama_ishikawa.pdf');
                            formData.append('emails', JSON.stringify(emailArray));
    
                            return fetch(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/enviar-pdf`, {
                                method: 'POST',
                                body: formData
                            });
                        }
                    });
                }
              }).then((response) => {
                  if (response?.ok) {
                      Swal.fire('Éxito', 'Correo enviado exitosamente', 'success');
                  } else if (response) {
                      Swal.fire('Error', 'No se pudo enviar el correo', 'error');
                  }
              })
              .catch((error) => {
                  console.error('Error generando o enviando PDF:', error);
                  Swal.fire('Error', 'Hubo un problema al generar el PDF', 'error');
              }).finally(() => {
                setIsLoading(false);
                restoreElements();
            });
    };

    return (
        <div>
            <button className='button-pdf-imp' style={{top:'6em'}} onClick={handlePrintPDF}>Guardar en PDF</button>
            {/*Mensaje de generacion*/}
                {isLoading && (
                    <div className="loading-overlay">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CircularProgress variant="determinate" value={progress} />
                            <p>{progress}%</p>
                            <p>Generando PDF</p> {/* Muestra el porcentaje debajo del spinner */}
                        </div>
                     </div>
                )}
            <div className='content-diagrama'>
                {ishikawas.map((ishikawa, index) => (
                    <div key={index}>
                    <div className="duracion-bloque-repo-dia">
                    <h2 onClick={() => toggleVisibility(index)}>
                           {formatDate(ishikawa.fechaElaboracion)}
                    </h2>
                    </div>
                    {visibleIndex === index && (
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
                        <div key={index} >
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
                      )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Diagrama;
