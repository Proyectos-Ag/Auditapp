import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Diagrama.css'
import Logo from "../assets/img/logoAguida.png";
import Ishikawa from '../assets/img/Ishikawa-transformed.png';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import Fotos from '../IshikawaRev/Foto'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Diagrama = () => {
    const {_id} = useParams();
    const [ishikawas, setIshikawas] = useState([]);
    const [visibleIndex, setVisibleIndex] = useState(0);
    const [showPart, setShowPart] = useState(true);
    const [showNotaRechazo, setShowNotaRechazo] = useState(false);
    const [notaRechazo, setNotaRechazo] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [modalOpen, setModalOpen] = useState(false); 
    const [capturedPhotos, setCapturedPhotos] = useState({}); 
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [correcciones, setCorrecciones] = useState([{ actividad: '', responsable: '', fechaCompromiso: null, cerrada: '', evidencia: ''}]);

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_id]);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/vac/por/${_id}`);
            const ishikawasRecibidos = Array.isArray(response.data) ? response.data : [response.data];
            setIshikawas(ishikawasRecibidos);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

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

    const handleAprobar = async (id) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, {
                estado: 'Aprobado'
            });
            Swal.fire({
                title: 'Éxito!',
                text: 'El diagrama se ha aprobado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              }).then(async () => {
                await fetchData(); // Asegúrate de que la verificación ocurra después de aprobar
              });
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Hubo un error al actualizar la información');
        }
        };
    
        const Aprobar = async (id) => {
            Swal.fire({
              title: '¿Está seguro de querer aprobar este diagrama?',
              text: '¡Esta acción no se puede revertir!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3ccc37',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, aprobar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                handleAprobar (id);
              }
            });
          };

          const handleFinalizar = async (id) => {
            try {
                await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, {
                    estado: 'Finalizado'
                });
                Swal.fire({
                    title: 'Éxito!',
                    text: 'El diagrama se ha finalizado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                  }).then(async () => {
                    await fetchData(); // Asegúrate de que la verificación ocurra después de aprobar
                  });
            } catch (error) {
                console.error('Error updating data:', error);
                alert('Hubo un error al actualizar la información');
            }
            };
        
            const Finalizar = async (id) => {
                Swal.fire({
                  title: '¿Está seguro de querer finalizar este diagrama?',
                  text: 'El diagrama se dara por terminado',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#3ccc37',
                  cancelButtonColor: '#d33',
                  confirmButtonText: 'Sí, finalizar',
                  cancelButtonText: 'Cancelar'
                }).then((result) => {
                  if (result.isConfirmed) {
                    handleFinalizar (id);
                  }
                });
              };

    const handleGuardarRechazo = async (id) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, {
                estado: 'Rechazado',
                notaRechazo 
            });

            Swal.fire({
                title: 'Éxito!',
                text: 'El diagrama se ha rechazado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                fetchData();
            });
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Hubo un error al actualizar la información');
        }
        };
    
        const Rechazar = async (id) => {
            Swal.fire({
              title: '¿Está seguro de querer rechazar este diagrama?',
              text: '¡El diagrama será devuelto!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3ccc37',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, rechazar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                handleGuardarRechazo (id);
              }
            });
          };

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

          useEffect(() => {
            if (ishikawas.length > 0) {
                const correccionesIniciales = ishikawas[0].correcciones.map(correccion => {
                    let fechaCompromiso = null; // Valor predeterminado
                    
                    if (correccion.fechaCompromiso && correccion.fechaCompromiso !== '') {
                        const fecha = new Date(correccion.fechaCompromiso);
                        
                        // Verificar si la fecha es válida
                        if (!isNaN(fecha.getTime())) {
                            fechaCompromiso = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
                        }
                    }
        
                    return {
                        ...correccion,
                        fechaCompromiso
                    };
                });
        
                if (correccionesIniciales.length === 0) {
                    correccionesIniciales.push({ actividad: '', responsable: '', fechaCompromiso: null, cerrada: '' });
                }
        
                setCorrecciones(correccionesIniciales);
            }
        }, [ishikawas]);
          

        function verificarCoincidencia(textAreaValue, causa) {
            // Verificar que los valores no sean undefined o null
            if (typeof textAreaValue !== 'string' || typeof causa !== 'string') {
                return false;
            }
          
            const trimmedTextAreaValue = textAreaValue.trim();
            const trimmedCausaParts = causa.trim().split(';').map(part => part.trim());
          
            if (trimmedTextAreaValue === '') {
                return false;
            }
          
            return trimmedCausaParts.some(part => part === trimmedTextAreaValue);
        }

    const obtenerEstiloTextarea = (texto, causa) => {
        return verificarCoincidencia(texto, causa) 
        ? { backgroundColor: '#f1fc5e9f', borderRadius: '10px' } 
        : {};
    };

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
    
    const handleCapture = (dataUrl) => {
        if (selectedField) {
            const prefijosBase64 = ['data:image/png;base64,', 'data:image/jpeg;base64,'];
    
            setCapturedPhotos(prev => ({
                ...prev,
                [selectedField]: prefijosBase64.some(prefijo => dataUrl.startsWith(prefijo))
                    ? dataUrl  // Si ya tiene un prefijo válido, usa el dataUrl tal como está
                    : `data:image/png;base64,${dataUrl}`  // Si no tiene prefijo, agrega uno por defecto (png)
            }));
        }
        setModalOpen(false);
    };

    const handleOpenModal = (fieldKey) => {
        setSelectedField(fieldKey);
        setModalOpen(true);
    };
    
    const handleImageClick = (imageSrc) => {
        setSelectedImage(imageSrc);
        setImageModalOpen(true);
    };  
    
    const closeModal = () => {
        setImageModalOpen(false);
        setSelectedImage(null);
    };

    const handleEliminarFila = (index) => {
        const nuevasCorrecciones = [...correcciones];
        nuevasCorrecciones.splice(index, 1);
        setCorrecciones(nuevasCorrecciones);
        console.log('Correcciones después de eliminar:', nuevasCorrecciones);
    };

    const handleEliminarEvidencia = async (index, idIsh, idCorr ) => {
        try {
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/eliminar-evidencia/${index}/${idIsh}/${idCorr}`);
            
            if (response.status === 200) {
                // Actualizar el estado local después de eliminar la evidencia en la base de datos
                const nuevasCorrecciones = [...correcciones];
                nuevasCorrecciones[index].evidencia = ''; // O null
                setCorrecciones(nuevasCorrecciones);
                closeModal();
                alert('Evidencia eliminada exitosamente');
            }
        } catch (error) {
            console.error('Error al eliminar la evidencia:', error);
            alert('Hubo un error al eliminar la evidencia');
        }
    };
    
    const EliminarEv = async (index, idIsh, idCorr) => {
        Swal.fire({
          title: '¿Está seguro de querer eliminar la evidencia?',
          text: '¡Esta acción es irreversible!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            handleEliminarEvidencia(index, idIsh, idCorr);
          }
        });
    };

    const handleGuardarCambios2 = async (selectedIndex) => {
        try {
            if (ishikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            }
    
            const formData = new FormData();
            const { _id } = ishikawas[0];
    
            // Agregamos todas las correcciones y asociamos las imágenes a sus índices
            correcciones.forEach((correccion, index) => {
                formData.append(`correcciones[${index}].actividad`, correccion.actividad || '');
                formData.append(`correcciones[${index}].responsable`, correccion.responsable || '');
                formData.append(`correcciones[${index}].fechaCompromiso`, correccion.fechaCompromiso || null);
                formData.append(`correcciones[${index}].cerrada`, correccion.cerrada || '');
            
                // Genera una clave única para cada fila con el índice
                const fieldKey = `${_id}_${index}`;
                const photo = capturedPhotos[fieldKey]; // Obtén la foto para este índice
            
                // Verifica si hay una foto válida y la añade
                if (photo && typeof photo === 'string' && photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo); // Convierte el data URL a Blob
                    formData.append(`imageSub`, blob, `image_${index}.png`); // Asigna la imagen al índice correcto
                }
            });            
    
            
    
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, formData, {
                headers: {
                    // No es necesario establecer el content-type manualmente, axios lo hace automáticamente
                },
            });
    
            console.log('Respuesta del servidor:', response.data);
            Swal.fire({
                title: 'Éxito!',
                text: 'Información guardada correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        } catch (error) {
            console.error('Error al actualizar la información:', error);
            alert('Hubo un error al actualizar la información');
        }
    };
    
    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1]; // Aquí se obtiene el tipo MIME
        const bstr = atob(arr[1]); // Decodifica el Base64
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
    
        for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
    
        return new Blob([u8arr], { type: mime }); // Devuelve un Blob con el tipo MIME adecuado
    } 
    

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
        const part3 = document.getElementById('pdf-content-part3');
    
        const convertTextAreasToDivs = (element) => {
            const textareas = element.querySelectorAll('textarea');
            textareas.forEach((textarea) => {
                const div = document.createElement('div');
                div.innerHTML = textarea.value.replace(/\n/g, '<br>');
                div.className = textarea.className;
                div.style.cssText = textarea.style.cssText;
                textarea.parentNode.replaceChild(div, textarea);
            });
        };
    
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
    
            return yOffset;
        };
    
        const processTableWithRowControl = async (tableElement, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            const rows = tableElement.querySelectorAll('tr');
    
            for (const row of rows) {
                // Procesar cada fila y sus imágenes
                yOffset = await processRowAndImages(row, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
            }
    
            return yOffset;
        };
    
        const processPart3WithTableRows = async (element, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin) => {
            convertTextAreasToDivs(element); // Convertir textareas a divs
            await ensureImagesLoaded(element); // Asegurar que las imágenes estén completamente cargadas
    
            const tables = element.querySelectorAll('table'); // Obtener todas las tablas en part3
            if (tables.length > 0) {
                for (const table of tables) {
                    yOffset = await processTableWithRowControl(table, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
                }
            }
    
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
    
        convertTextAreasToDivs(part1); // Convertir textareas a divs
    
        html2canvas(part1, { scale: 2.5, useCORS: true }).then((canvas) => {
            yOffset = processCanvas(canvas, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
    
            return html2canvas(part2, { scale: 2.5, useCORS: true });
        }).then((canvas) => {
            yOffset = processCanvas(canvas, pdf, yOffset, pageWidth, pageHeight, marginLeft, marginRight, bottomMargin);
    
            // Procesar la parte 3 con tablas y manejo de filas
            return processPart3WithTableRows(part3, pdf, yOffset, pageWidth, pageHeight, marginLeft3, marginRight3, bottomMargin);
        }).then(() => {
            pdf.save("diagrama_ishikawa.pdf");
            hideLoading();
        }).catch((error) => {
            console.error('Error generating PDF:', error);
            hideLoading();
        });
    }; 
    
    const handleAgregarFila = () => {
        setCorrecciones([...correcciones, { actividad: '', responsable: '', fechaCompromiso: null, cerrada: '', evidencia: '' }]);
      };

    return (
        <div>
            <button className='button-pdf-imp' style={{top:'20px'}} onClick={handlePrintPDF}>Guardar en PDF</button>
            {/*Mensaje de generacion*/}
            <div id="loading-overlay" style={{display:'none'}}>
            <div class="loading-content">
                Generando archivo PDF...
            </div>
            </div>
            <div className='content-diagrama'>
                {ishikawas.map((ishikawa, index) => (
                    <div key={index}>
                    <div className="duracion-bloque-repo-dia">
                    <h2 onClick={() => toggleVisibility(index)}>
                           {formatDate(ishikawa.fechaElaboracion)} : {ishikawa.auditado}
                    </h2>
                    </div>
                    {visibleIndex === index && (
                    <div >
                        <div id='pdf-content-part1' className="image-container-dia" >

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

                        {
                        (ishikawa.estado === 'Aprobado'|| 'Finalizado') ? null : (
                        <div className='buttons-g'>
                                <button onClick={() => setShowNotaRechazo(!showNotaRechazo)}>
                                    {showNotaRechazo ? 'Ocultar Nota' : 'Nota'}
                                </button>
                                <button onClick={() => Rechazar(ishikawa._id)} className='boton-rechazar' >Rechazar</button>
                                <button onClick={() => Aprobar(ishikawa._id)} >Aprobar</button>
                                
                            </div>
                            )}

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
                                    <textarea className="text-area" style={{ top: '19.1rem', left: '8.7rem', ...obtenerEstiloTextarea(item.text1, ishikawa.causa) }} disabled>{item.text1}</textarea>
                                    <textarea className="text-area" style={{ top: '19.1rem', left: '25.4rem', ...obtenerEstiloTextarea(item.text2, ishikawa.causa) }} disabled>{item.text2}</textarea>
                                    <textarea className="text-area" style={{ top: '19.1rem', left: '41.2rem', ...obtenerEstiloTextarea(item.text3, ishikawa.causa) }} disabled>{item.text3}</textarea>
                                    <textarea className="text-area" style={{ top: '23.2rem', left: '12.2rem', ...obtenerEstiloTextarea(item.text4, ishikawa.causa) }} disabled>{item.text4}</textarea>
                                    <textarea className="text-area" style={{ top: '23.2rem', left: '28.8rem', ...obtenerEstiloTextarea(item.text5, ishikawa.causa) }} disabled>{item.text5}</textarea>
                                    <textarea className="text-area" style={{ top: '23.2rem', left: '45rem', ...obtenerEstiloTextarea(item.text6, ishikawa.causa) }} disabled>{item.text6}</textarea>
                                    <textarea className="text-area" style={{ top: '27.2rem', left: '15.5rem', ...obtenerEstiloTextarea(item.text7, ishikawa.causa) }} disabled>{item.text7}</textarea>
                                    <textarea className="text-area" style={{ top: '27.2rem', left: '32.3rem', ...obtenerEstiloTextarea(item.text8, ishikawa.causa) }} disabled>{item.text8}</textarea>
                                    <textarea className="text-area" style={{ top: '27.2rem', left: '48.1rem', ...obtenerEstiloTextarea(item.text9, ishikawa.causa) }} disabled>{item.text9}</textarea>
                                    <textarea className="text-area" value={item.text10} style={{ top: '31rem', left: '23rem', ...obtenerEstiloTextarea(item.text10, ishikawa.causa) }} disabled></textarea>
                                    <textarea className="text-area" name='text11' value={item.text11} style={{ top: '31rem', left: '39.4rem', ...obtenerEstiloTextarea(item.text11, ishikawa.causa) }} disabled></textarea>
                                    <textarea className="text-area" value={item.text12} style={{ top: '35rem', left: '19.7rem', ...obtenerEstiloTextarea(item.text12, ishikawa.causa) }} disabled></textarea>
                                    <textarea className="text-area" name='text13' value={item.text13} style={{ top: '35rem', left: '36rem', ...obtenerEstiloTextarea(item.text13, ishikawa.causa) }} disabled></textarea>
                                    <textarea className="text-area" name='text14' value={item.text14} style={{ top: '39rem', left: '16.6rem', ...obtenerEstiloTextarea(item.text14, ishikawa.causa) }} disabled></textarea>
                                    <textarea className="text-area" name='text15' value={item.text15} style={{ top: '39rem', left: '32.8rem', ...obtenerEstiloTextarea(item.text15, ishikawa.causa) }} disabled></textarea>
                                    <textarea className="text-area" style={{ top: '27rem', left: '67.5rem', width: '8.5rem', height: '8rem'}} value={ishikawa.problema} disabled></textarea>
                                </div>
                            ))}
                        </div>
                        <div className='button-pasti'>
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
                         
                        <div className="image-container2-dia" id='pdf-content-part2'>
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
                                <div style={{ marginBottom: '20px', width:'72rem', overflowWrap: 'break-word' }}>{ishikawa.causa}</div>
                            </div>
                        </div>
                        </div>
                        <div className='image-container3-dia' id='pdf-content-part3'>
                        <div className='table-ish'>
                        <table style={{ border: 'none' }}>
                            <thead>
                            <tr><h3>SOLUCIÓN</h3></tr>
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
                                        <td>{actividad.responsable}</td>
                                        <td>{new Date(actividad.fechaCompromiso + 'T00:00:00').toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {
                        (ishikawa.estado !== 'Aprobado' && ishikawa.estado !== 'Finalizado') ? null : (
                        <table style={{ border: 'none' }}>
                        <thead>
                            <tr><h3>EFECTIVIDAD</h3></tr>
                            <tr>
                                <th className="conformity-header">Actividad</th>
                                <th className="conformity-header">Responsable</th>
                                <th className="conformity-header">Fecha Verificación</th>
                                <th colSpan="2" className="conformity-header">
                                    Acción Correctiva Cerrada
                                    <div style={{ display: 'flex' }}>
                                        <div className="left">Sí</div>
                                        <div className="right">No</div>
                                    </div>
                                </th>
                                <th className="conformity-header"  style={{ width: '10em'}}>Evidencia</th>
                            </tr>
                        </thead>
                        <tbody>
                    {correcciones.map((correccion, index) => {
                        const fieldKey = `${_id}_${index}`;

                        return (
                        <tr key={index} onClick={() => setSelectedIndex(index)}>
                            <td>
                            <textarea
                                type="text"
                                value={correccion.actividad}
                                onChange={(e) => handleCorreccionChange(index, 'actividad', e.target.value)}
                                className="no-border" required
                            />
                            </td>
                            <td>
                            <textarea
                                type="text"
                                value={correccion.responsable}
                                onChange={(e) => handleCorreccionChange(index, 'responsable', e.target.value)}
                                className="no-border" required
                            />
                            </td>
                            <td>
                            <input
                                type="date"
                                value={correccion.fechaCompromiso}
                                onChange={(e) => handleCorreccionChange(index, 'fechaCompromiso', e.target.value)}
                                className="no-border" required
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
                            <td>
                            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                            {(ishikawa.estado === 'Aprobado') && (
                                <div className="button-foto" onClick={(e) => {
                                e.preventDefault();
                                handleOpenModal(fieldKey);
                                }}>
                                <span className="material-symbols-outlined">add_a_photo</span>
                                </div>
                            )}
                            {correccion.evidencia && (
                                <div>
                                <img
                                    src={correccion.evidencia}
                                    alt="Evidencia"
                                    style={{ width: '100%', height: '10rem' }}
                                    onClick={() => handleImageClick(correccion.evidencia)}
                                />
                                </div>
                            )}
                            {capturedPhotos[fieldKey] && (
                                <img
                                src={capturedPhotos[fieldKey]}
                                alt="Captura"
                                style={{ width: '100%', height: 'auto' }}
                                onClick={() => handleImageClick(capturedPhotos[fieldKey])}
                                />
                            )}
                            </td>
                            <td className='cancel-acc'>
                            {(ishikawa.estado === 'Aprobado') && index > 0 && (
                                <button 
                                className='eliminar-ev'
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleEliminarFila(index);
                                }}>
                                Eliminar
                                </button>
                            )}
                            </td>
                            {imageModalOpen && (
                            <div className="modal-overlay" onClick={closeModal}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <img src={selectedImage} alt="Ampliada" className="modal-image" />
                                <button 
                                    className='eliminar-ev'
                                    onClick={(e) => {
                                    e.preventDefault();
                                    EliminarEv(index,ishikawa._id, correccion._id)
                                    }}>
                                    Eliminar Evidencia
                                </button>
                                </div>
                            </div>
                            )}
                        </tr>
                        );
                    })}
                    </tbody>
                    </table>
                        )}
                        </div>

                    {/* Botón "Agregar Fila" */}
                    {(ishikawa.estado === 'Aprobado') && (
                        <div>
                            <button onClick={(e) => {
                                e.preventDefault();
                                handleAgregarFila();
                            }} className='button-agregar'>
                                Agregar Fila
                            </button>
                        </div>
                    )}

                    {/* Botón "Guardar Cambios" */}
                    {(ishikawa.estado === 'Aprobado') && selectedIndex !== null && (
                            <button className='button-agregar'
                            onClick={(e) => {e.preventDefault(); handleGuardarCambios2(selectedIndex);}}>
                                Guardar Cambios
                            </button>
                    )}

                    {/* Botón "Finalizar" */}
                    {(ishikawa.estado === 'Aprobado') && (
                        <div>
                            <button onClick={(e) => {
                                e.preventDefault();
                                Finalizar();
                            }} className='button-agregar'>
                                Finalizar
                            </button>
                        </div>
                    )}
                    </div>
                    
                    <Fotos open={modalOpen} onClose={() => setModalOpen(false)} onCapture={handleCapture} />
                    </div>
                      )}
                    </div>
                ))}
            </div>
        </div>
    );  
};

export default Diagrama;