import React, { useEffect, useState,useCallback,useContext } from 'react';
import Logo from "../assets/img/logoAguida.png";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import IshikawaImg from '../assets/img/Ishikawa-transformed.png';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import withReactContent from 'sweetalert2-react-content';
import Fotos from './Foto'; 
import './css/Modal.css';
import './css/IshikawaRev.css';
const IshikawaRev = () => {
    const { userData } = useContext(UserContext);
    const [ishikawas, setIshikawas] = useState([]);
    const [programa, setPrograma] = useState(null);
    const [filteredIshikawas, setFilteredIshikawas] = useState([]);
    const { _id, id, nombre} = useParams();
    const [valorSeleccionado, setValorSeleccionado] = useState('');
    const [, setDatos] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');
    const [selectedField, setSelectedField] = useState(null); 
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [capturedPhotos, setCapturedPhotos] = useState({}); 
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalOpen, setModalOpen] = useState(false); 
    const [mensaje, setMensaje] = useState('');
    const [notaRechazo, setNotaRechazo] = useState('');
    const [rechazo,  setRechazo] = useState([]);
    const [revisado, setRevisado] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [aprobado,  setAprobado] = useState([]);
    const [showPart, setShowPart] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [showReprogramar, setShowReprogramar] = useState(false);
    const [showNotaRechazo, setShowNotaRechazo] = useState(false);
    const [tempFechaCompromiso, setTempFechaCompromiso] = useState('');
    const [actividades] = useState([{ actividad: '', responsable: '', fechaCompromiso: [] }]);
    const [correcciones, setCorrecciones] = useState([{ actividad: '', responsable: '', fechaCompromiso: null, cerrada: '', evidencia: ''}]);
    const [nuevaCorreccion, setNuevaCorreccion] = useState({actividad: '', responsable: '', fechaCompromiso: '', cerrada: '' });
    const MySwal = withReactContent(Swal);
    const [diagrama] = useState([{
        problema: '',
        text1: '',
        text2: '',
        text3: '',
        text4: '',
        text5: '',
        text6: '',
        text7: '',
        text8: '',
        text9: '',
        text10: '',
        text11: '',
        text12: '',
        text13: '',
        text14: '',
        text15: ''
       }]);

    console.log(id);
    console.log(_id);

    const fetchData = useCallback(async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
            params: {
                idRep: _id,
                idReq: id,
                proName: nombre
            }
        });        

          setIshikawas(response.data);
      } catch (error) {
          console.error('Error fetching data:', error);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
      fetchData();
  }, [fetchData]);

  useEffect(() => {
    const obtenerDatos = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/datos-filtrados`, {
                params: {
                    _id: _id,
                    id: id,
                    nombre: nombre
                }
            });

            if (response.data) {
                setDatos(response.data.datosFiltrados);
                setPrograma(response.data.programaEncontrado);
            }
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };
    obtenerDatos();
}, [userData, _id, id, nombre]);

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
    
}, [filteredIshikawas]);

    useEffect(() => {
        if (filteredIshikawas.length > 0) {
            const correccionesIniciales = filteredIshikawas[0].correcciones.map(correccion => {
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
    }, [filteredIshikawas]);  
      
useEffect(() => {
    const fetchUsuarios = async () => {
        try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios`);
        setUsuarios(response.data);
        } catch (error) {
        console.error("Error al obtener los usuarios", error);
        }
    };
      
    fetchUsuarios();
}, []);


useEffect(() => {
    const fetchData = async () => {
        try {
            mostrarCargando(); // Mostrar el pop-up de carga
            await verificarRegistro();
            ocultarCargando(); // Ocultar el pop-up de carga después de recibir los datos
        } catch (error) {
            console.error('Error fetching data:', error);
            ocultarCargando(); // Ocultar el pop-up de carga en caso de error
          }
    };
    fetchData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
    if (ishikawas.length > 0) {
        const nuevosFiltrados = ishikawas.filter(({ idRep, idReq, proName }) => idRep === _id && idReq === id && proName === nombre);
        setFilteredIshikawas(nuevosFiltrados);
        if (nuevosFiltrados.length === 0) {
            setMensaje('No hay nada por aquí.');
        } else {
            setMensaje('');
        }
    } else {
        setMensaje('Cargando datos...');
    }
}, [ishikawas, _id, id, nombre]);


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

    const handleGuardarCambios2 = async (selectedIndex) => {
        try {
            if (filteredIshikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            }
    
            const formData = new FormData();
    
            // Agregamos todas las correcciones y asociamos las imágenes a sus índices
            correcciones.forEach((correccion, index) => {
                formData.append(`correcciones[${index}].actividad`, correccion.actividad || '');
                formData.append(`correcciones[${index}].responsable`, correccion.responsable || '');
                formData.append(`correcciones[${index}].fechaCompromiso`, correccion.fechaCompromiso || null);
                formData.append(`correcciones[${index}].cerrada`, correccion.cerrada || '');
            
                // Genera una clave única para cada fila con el índice
                const fieldKey = `${id}_${index}`;
                const photo = capturedPhotos[fieldKey]; // Obtén la foto para este índice
            
                // Verifica si hay una foto válida y la añade
                if (photo && typeof photo === 'string' && photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo); // Convierte el data URL a Blob
                    formData.append(`imageSub`, blob, `image_${index}.png`); // Asigna la imagen al índice correcto
                }
            });            
    
            const { _id } = filteredIshikawas[0]; // Usamos la ID del primer registro
    
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
            
    const handleGuardarCambios = async (selectedIndex) => {
        try {
            if (filteredIshikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            }

            const correccionesActualizadas = correcciones.map((correccion, i) => {
                const fieldKey = `${id}_${i}`;
            
                // Captura la imagen en base64 si existe en capturedPhotos, o usa la evidencia existente
                let imagenBase64 = capturedPhotos[fieldKey] || correccion.evidencia;
            
            
                return {
                    ...correccion,
                    evidencia: imagenBase64  // Asigna la imagen base64 con el prefijo adecuado
                };
            });            
    
            const { _id } = filteredIshikawas[0];
            const updatedIshikawa = {
                correcciones: correccionesActualizadas
            };
    
            console.log('Enviando datos a actualizar:', updatedIshikawa);
    
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, {
                estado: 'Revisado',
                ...updatedIshikawa
            });
            console.log('Respuesta del servidor:', response.data);
            Swal.fire({
                title: 'Éxito!',
                text: 'El diagrama se ha finalizado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                verificarRegistro();
            });
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Hubo un error al actualizar la información');
        }
    }; 


  const handleSelectChangeEstado = (event) => {
    setSelectedOption(event.target.value);
  };

  // Función para cambiar el estado
  const CambiarEstado = async (_id) => {
    try {
      if (filteredIshikawas.length === 0) {
        alert('No hay datos para actualizar');
        return;
      }

      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/estado/${_id}`, {
        estado: selectedOption // Usamos la opción seleccionada
      });

      console.log('Respuesta del servidor:', response.data);
      Swal.fire({
        title: '¡Éxito!',
        text: 'El diagrama ha cambiado su estado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        verificarRegistro();
      });
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Hubo un error al actualizar la información');
    }
  };


    const Finalizar = async (event,selectedIndex) => {
        event.preventDefault();
        Swal.fire({
          title: '¿Está seguro de querer finalizar este diagrama?',
          text: '¡Esta acción no se puede revertir!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, finalizar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            handleGuardarCambios(selectedIndex);
          }
        });
      };

      const handleGuardarAprobacion = async () => {
        try {
            const { _id } = filteredIshikawas[0];
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, {
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
              title: '¿Está seguro de querer aprobar este diagrama?',
              text: '¡Esta acción no se puede revertir!',
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
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, {
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
            handleGuardarRechazo ();
          }
        });
      };
      
const handleEliminarFila = (index) => {
    const nuevasCorrecciones = [...correcciones];
    nuevasCorrecciones.splice(index, 1);
    setCorrecciones(nuevasCorrecciones);
    console.log('Correcciones después de eliminar:', nuevasCorrecciones);
};

useEffect(() => {
    verificarRegistro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [_id, id]);

const verificarRegistro = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
                params: {
                    idRep: _id,
                    idReq: id,
                    proName: nombre
                }
            });
          const dataFiltrada = response.data.filter(item => item.idRep === _id && item.idReq === id && item.proName === nombre && 
            (item.estado === 'Rechazado' || item.estado === 'Revisado' || item.estado === 'Aprobado'|| item.estado === 'Asignado'));
          const registroAprobado = response.data.some(item => item.idRep === _id && item.idReq === id && item.proName === nombre && item.estado === 'Aprobado');
          const registroRevisado= response.data.some(item => item.idRep === _id && item.idReq === id && item.proName === nombre && item.estado === 'Revisado');
          setAprobado(registroAprobado);
          setRechazo(dataFiltrada);
          setRevisado(registroRevisado);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

    const handleTempFechaChange = (value) => {
        setTempFechaCompromiso(value);
};

const handleSave = async () => {
        try {
            const data = {
                idRep: _id,
                idReq: id,
                proName: nombre,
                fecha: '',
                auditado: valorSeleccionado,
                problema: '',
                requisito:'',
                hallazgo:'',
                correccion: '',
                causa: '',
                diagrama: diagrama,
                participantes: '',
                afectacion: '',
                actividades: [[]],
                estado: 'Asignado'
            };
    
            if (rechazo.length > 0) {
                // Actualizar registro existente
                const { _id: registroId } = rechazo[0];
                await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${registroId}`, data);
                Swal.fire('Reasignado', 'El diagrama ha sido reasignado.', 'success');
                verificarRegistro();
            } else {
                // Crear nuevo registro
                await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, data);
                Swal.fire('Asignado', 'La asignación se realizó exitosamente.', 'success');
                verificarRegistro();
            }
    
            fetchData(); // Para refrescar la lista de registros
        } catch (error) {
            console.error('Error al guardar los datos:', error);
            Swal.fire('Error', 'Hubo un problema al guardar los datos.', 'error');
        }
};  
    
const Asignar = async () => {
        Swal.fire({
          title: '¿Está seguro de querer asignar este diagrama?',
          text: '¡Se le notificará al auditado!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3ccc37',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, asignar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            handleSave();
          }
        });
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

const handleInputChange = (e) => {
        const { value } = e.target;
      
        // Define el tamaño de fuente según el rango de caracteres
        let fontSize;
        if (value.length > 125) {
          fontSize = '10.3px';
        } else if (value.length > 100) {
          fontSize = '11px'; 
        } else if (value.length > 88) {
          fontSize = '12px'; 
        } else if (value.length > 78) {
          fontSize = '13px'; 
        } else if (value.length > 65) {
          fontSize = '14px';
        } else {
          fontSize = '15px'; // Por defecto
        }

        e.target.style.fontSize = fontSize;
};
    
const colores = ['black', 'blue', 'green', 'yellow','orange', 'red'];

const handleSelectChange = (event, index) => {
    event.target.style.color = colores[index % colores.length];
};

const handleSelectChangeAud = (event) => {
    setValorSeleccionado(event.target.value);
};

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

const obtenerEstiloTextarea = (texto, causa) => {
    return verificarCoincidencia(texto, causa) 
    ? { backgroundColor: '#f1fc5e9f', borderRadius: '10px' } 
    : {};
};

const mostrarCargando = () => {
    MySwal.fire({
      title: 'Cargando...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
};
  
const ocultarCargando = () => {
    Swal.close();
};

    return (
        <div>
            <div>

            {/*Mensaje de generacion*/}
            <div id="loading-overlay" style={{display:'none'}}>
            <div class="loading-content">
                Generando archivo PDF...
            </div>
            </div>
                {filteredIshikawas.map((ishikawa, index) => (
                <div key={index}>
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
                    
                    <div className='opciones'>
                    <select name="estado" id="estado-select" onChange={handleSelectChangeEstado}>
                        <option value="">Selecciona una opción</option>
                        <option value="Rechazado">Regresar al Auditado</option>
                        <option value="Aprobado">Aprobar</option>
                        <option value="Revisado">Terminar</option>
                    </select>

                    {/* Solo mostramos el botón si se ha seleccionado una opción */}
                    {selectedOption && (
                        <button onClick={() =>CambiarEstado(ishikawa._id)}>Cambiar Estado</button>
                    )}
                    
                    </div>
                    <button className='button-pdf-imp' onClick={handlePrintPDF}>Guardar en PDF</button>
                    <div id='pdf-content-part1' className="image-container">
                    <img src={Logo} alt="Logo Aguida" className='logo-empresa-ish' />
                    <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
                    <div className='posicion-en'>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ marginLeft: '45rem', marginRight: '10px' }}>Problema: </h2>
                        <div style={{ width: '700px', fontSize: '20px' }}>{ishikawa.problema}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ marginLeft: '45rem', marginRight: '10px' }}>Afectación: </h2>
                        <h3>{id} {programa?.Nombre}</h3>
                    </div>
                    </div>
                    <div className='posicion-en-3'>
                    GCF015
                    </div>
                    <div className='posicion-en-2'>
                    <h3>Fecha: {ishikawa.fecha}</h3>
                    </div>
                    <div>
                    <img src={IshikawaImg} alt="Diagrama de Ishikawa" className="responsive-image" />
                    {ishikawa.diagrama.map((item, i) => (
                        <div key={i}>
                        <textarea className="text-area" 
                            style={{ top: '19.1rem', left: '8.7rem', ...obtenerEstiloTextarea(item.text1, ishikawa.causa) }} disabled>{item.text1}</textarea>
                        <textarea className="text-area"
                            style={{ top: '19.1rem', left: '25.4rem', ...obtenerEstiloTextarea(item.text2, ishikawa.causa)  }} disabled>{item.text2}</textarea>
                        <textarea className="text-area"
                            style={{ top: '19.1rem', left: '41.2rem', ...obtenerEstiloTextarea(item.text3, ishikawa.causa)  }} disabled>{item.text3}</textarea>
                        <textarea className="text-area"
                            style={{ top: '23.2rem', left: '12.2rem', ...obtenerEstiloTextarea(item.text4, ishikawa.causa)  }} disabled>{item.text4}</textarea>
                        <textarea className="text-area"
                            style={{ top: '23.2rem', left: '28.8rem', ...obtenerEstiloTextarea(item.text5, ishikawa.causa) }} disabled>{item.text5}</textarea>
                        <textarea className="text-area"
                            style={{ top: '23.2rem', left: '45rem', ...obtenerEstiloTextarea(item.text6, ishikawa.causa)  }} disabled>{item.text6}</textarea>
                        <textarea className="text-area"
                            style={{ top: '27.2rem', left: '15.5rem', ...obtenerEstiloTextarea(item.text7, ishikawa.causa)  }} disabled>{item.text7}</textarea>
                        <textarea className="text-area"
                            style={{ top: '27.2rem', left: '32.3rem', ...obtenerEstiloTextarea(item.text8, ishikawa.causa)  }} disabled>{item.text8}</textarea>
                        <textarea className="text-area"
                            style={{ top: '27.2rem', left: '48.1rem', ...obtenerEstiloTextarea(item.text9, ishikawa.causa)  }} disabled>{item.text9}</textarea>
                        <textarea className="text-area" value={item.text10}
                            style={{ top: '31rem', left: '23rem', ...obtenerEstiloTextarea(item.text10, ishikawa.causa)  }} disabled></textarea>
                        <textarea className="text-area" name='text11' value={item.text11}
                            style={{ top: '31rem', left: '39.4rem', ...obtenerEstiloTextarea(item.text11, ishikawa.causa)  }} disabled></textarea>
                        <textarea className="text-area" value={item.text12}
                            style={{ top: '35rem', left: '19.7rem', ...obtenerEstiloTextarea(item.text12, ishikawa.causa)  }} disabled></textarea>
                        <textarea className="text-area" name='text13' value={item.text13}
                            style={{ top: '35rem', left: '36rem', ...obtenerEstiloTextarea(item.text13, ishikawa.causa)  }} disabled></textarea>
                        <textarea className="text-area" name='text14' value={item.text14}
                            style={{ top: '39rem', left: '16.6rem', ...obtenerEstiloTextarea(item.text14, ishikawa.causa)  }} disabled></textarea>
                        <textarea className="text-area" name='text15' value={item.text15}
                            style={{ top: '39rem', left: '32.8rem', ...obtenerEstiloTextarea(item.text15, ishikawa.causa)  }} disabled></textarea>
                        <textarea className="text-area"
                            style={{ top: '27rem', left: '67.5rem', width: '7.9rem', height: '8rem' }} value={ishikawa.problema? ishikawa.problema : item.problema}></textarea>
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
                  <div id='pdf-content-part2' className="image-container2">
                  <div className='posicion-bo'>
                    <h3>No conformidad:</h3>
                    <div style={{ width: '70em', textAlign: 'justify' }}>{ishikawa.requisito}</div>
                    <h3>Hallazgo:</h3>
                    <div style={{ width: '70em', textAlign: 'justify' }}>
                        <div>{ishikawa.hallazgo}</div>
                    </div>
                    <h3>Acción inmediata o corrección: </h3>
                    {ishikawa.correccion}
                    <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                    <div style={{ marginBottom: '50px', width:'72em' }}>{ishikawa.causa}</div>
                    </div>
                    </div>
                    <div className='image-container3' id='pdf-content-part3'>
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
                        {ishikawa.actividades.map((actividad, i) => (
                            <tr key={i}>
                            <td style={{fontSize:'12px',width: '34em', height: 'auto', textAlign:'justify'}}>
                            {actividad.actividad}
                            </td>
                            <td style={{fontSize:'12px',width: '34em', height: 'auto', textAlign:'justify'}}>
                            {actividad.responsable}
                            </td>
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

                    <form onSubmit={(event) => Finalizar(event, selectedIndex)}>
                    {
                    (!aprobado && !revisado) ? null : (
                        <>
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
                        const fieldKey = `${id}_${index}`;

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
                            {aprobado && (
                                <div className="button-foto" onClick={(e) => {
                                e.preventDefault();
                                handleOpenModal(fieldKey);
                                }}>
                                <span className="material-symbols-outlined">add_a_photo</span>
                                </div>
                            )}
                            {correccion.evidencia && (
                                <>
                                <img
                                    src={correccion.evidencia}  // Usa la imagen con el prefijo adecuado
                                    alt="Evidencia"
                                    style={{ width: '100%', height: 'auto' }}
                                    className="hallazgo-imagen"
                                    onClick={() => handleImageClick(correccion.evidencia)}
                                />
                                </>
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
                            {aprobado && index > 0 && (
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
                    </>
                    )}
                    {/* Botón "Agregar Fila" */}
                    {aprobado && (
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
                    {aprobado && selectedIndex !== null && (
                            <button className='button-agregar'
                            onClick={(e) => {e.preventDefault(); handleGuardarCambios2(selectedIndex);}}>
                                Guardar Cambios
                            </button>
                    )}

                    <div className='button-final'>
                        {/* Botón "Finalizar" */}
                        {aprobado && (
                            <button type='submit'>Finalizar</button>
                        )}
                    </div>
                    </form>
                    <Fotos open={modalOpen} onClose={() => setModalOpen(false)} onCapture={handleCapture} />
                    </div>
                    </div> 
                </div>
                ))}
            </div>
            {(ishikawas.length === 0 || mensaje) && <div className="mensaje-error">
                <div className='select-ish'>
                {rechazo.map((ishikawa, asig) => (
                    <div key={asig}>
                         <div className='asignado-ishi'>Asignado: {ishikawa.auditado}</div>
                    </div>
                ))}
                <select onChange={handleSelectChangeAud} value={valorSeleccionado}>
                <option value="">Seleccione...</option>
                {usuarios && usuarios.map(usuario => (
            <option key={usuario._id} value={usuario.Nombre}>{usuario.Nombre}</option>
                ))}
                </select>
                <button onClick={Asignar}>Asignar</button>
            </div>
                <div className='mens-error'>
                <div style={{display:'flex', justifyContent:'center'}}>{mensaje}</div>
                <div style={{display:'flex',fontSize:'100px', justifyContent:'center'}}>🏝️</div></div>
                </div>}
                
         </div>
    );
};

export default IshikawaRev;