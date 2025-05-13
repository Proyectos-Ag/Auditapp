import React, { useEffect,useContext, useState } from 'react';
import axios from 'axios';
import ShareIcon from '@mui/icons-material/Share';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import './css/Ishikawa.css'
import Logo from "../assets/img/logoAguida.png";
import Ishikawa from '../assets/img/Ishikawa-transformed.png';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CircularProgress from '@mui/material/CircularProgress';
import AccesoModal from './AccesoModal';
import GestorIsh from './GestorIsh';
import Busqueda from './Busqueda';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../App';
import { Stack, Button, Chip, TextField, Paper, List, ListItem, Box,
   Avatar, Tooltip, Typography } from '@mui/material';
import Diagrama from '../DiagramaRe/Diagrama';

const CreacionIshikawa = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  // const [showPart, setShowPart] = useState(true);
  const [ishikawaRecords, setIshikawaRecords] = useState([]); // Almacena los registros filtrados
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [, setSelectedTextareas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  //Acceso Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [showDiagrama, setShowDiagrama] = useState(false);

  const [formData, setFormData] = useState({
    problema: '',
    afectacion: '',
    folio: '',
    requisito: '',
    auditado: userData.Nombre,
    hallazgo: '',
    fecha: '',
    participantes: '',
    correccion: '',
    causa: '',
    estado: '',
    acceso: ishikawaRecords.acceso,
    nivelAcceso: ishikawaRecords.nivelAcceso
  });

  const [diagrama, setDiagrama] = useState([{
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

  const [actividades, setActividades] = useState([{ actividad: '', responsable: [], fechaCompromiso: '' }]);

  const fechaElaboracion = new Date().toISOString();

  const [openGestor, setOpenGestor] = useState(false);

  const handleOpen = () => setOpenGestor(true);
  const handleClose = () => setOpenGestor(false);

  //folio

  const CONNECTORS = [
    'de','del','la','las','los','y','e','o','u',
    'en','al','por','para','con','sin','sobre','entre','a'
  ];

  const getInitials = (text = '') =>
    text
      .split(/\s+/)
      .filter(w => w && !CONNECTORS.includes(w.toLowerCase()))
      .map(w => w[0].toUpperCase())
      .join('');

  const generateFolio = (userData = {}) => {
    const deptInitials = getInitials(userData.Departamento || 'DEP');
    const areaInitials = getInitials(userData.area         || 'AREA');
    return `${deptInitials}-${areaInitials}-`;
  };

  //Modo lectura 
  const isReadOnly =
  Array.isArray(formData.acceso) &&
  formData.acceso.some(
    (acc) =>
      acc.nombre?.toLowerCase() === userData.Nombre?.toLowerCase() &&
      Number(acc.nivelAcceso) === 1
  );


  const fetchIshikawaRecords = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
      const filtered = response.data.filter(item => {
        const auditadoMatch = item.auditado?.toLowerCase() === userData.Nombre?.toLowerCase();
        const accesoMatch = Array.isArray(item.acceso) &&
          item.acceso.some(acc => acc.nombre?.toLowerCase() === userData.Nombre?.toLowerCase());
        return (auditadoMatch || accesoMatch);
      });
      setIshikawaRecords(filtered);
    } catch (error) {
      console.error('Error fetching Ishikawa records:', error);
    }
  };

  // 2️⃣ Lo usamos en el useEffect como antes
  useEffect(() => {
    fetchIshikawaRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.Nombre]);
  

  const handleSelectRecord = (selectedId) => {
  
    if (selectedId === "") {
      // Si selecciona "Nuevo...", limpiamos el formulario
      setSelectedRecordId(null); // Reseteamos el ID seleccionado
      setFormData({
        problema: '',
        afectacion: '',
        folio: '',
        requisito: '',
        auditado: userData.Nombre,
        hallazgo: '',
        fecha: '',
        participantes: '',
        correccion: '',
        causa: '',
        estado: '',
      });
  
      setDiagrama([{
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
  
      setActividades([{ actividad: '', responsable: [], fechaCompromiso: '' }]);
      setIsEditing(false); // Cambiamos el modo a "creación"
    } else {
      const selectedRecord = ishikawaRecords.find(record => record._id === selectedId);

      console.log('Estado: ', selectedRecord.estado);
      if (selectedRecord) {
        if (selectedRecord.estado !== 'Incompleto'  && 
          selectedRecord.estado !== 'Rechazado') {
          setShowDiagrama(true);
        } else {
          setShowDiagrama(false);
        }
        setSelectedRecordId(selectedId);
        setFormData({
          problema: selectedRecord.problema || '',
          afectacion: selectedRecord.afectacion || '',
          folio: selectedRecord.folio || '',
          requisito: selectedRecord.requisito || '',
          auditado: selectedRecord.auditado || '',
          hallazgo: selectedRecord.hallazgo || '',
          fecha: selectedRecord.fecha || '',
          participantes: selectedRecord.participantes || '',
          correccion: selectedRecord.correccion || '',
          causa: selectedRecord.causa || '',
          estado: selectedRecord.estado || '',
          notaRechazo: selectedRecord.notaRechazo || '',
          acceso: selectedRecord.acceso || '',
          nivelAcceso: selectedRecord.nivelAcceso || ''
        });
    
        setDiagrama(selectedRecord.diagrama || [{
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
    
        setActividades(selectedRecord.actividades || [{ actividad: '', responsable: [], fechaCompromiso: '' }]);
        // Actualizar participantes seleccionados
      const participantesArray = selectedRecord.participantes
      ? selectedRecord.participantes.split(" / ").map((nombre) => ({ Nombre: nombre.trim() }))
      : [];

        setSelectedParticipants(participantesArray);
        setIsEditing(true); // Modo edición activado
        setOpenGestor(false);
      }
    }
  };

  const handleDiagrama = (e) => {
    const { name, value } = e.target;
    setDiagrama((prevState) => [{
      ...prevState[0],
      [name]: value
    }]);
  };

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const data = {
        fecha: formData.fecha,
        problema: formData.problema,
        requisito: formData.requisito,
        auditado: userData.Nombre,
        correo: userData.Correo,
        hallazgo: formData.hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'Hecho',
        tipo:'vacio',
        fechaElaboracion
      };
  
      const result = await Swal.fire({
        title: '¿Está seguro de querer enviar?',
        text: 'El diagrama será enviado para revisión.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3ccc37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
      });
  
      // Solo procede si el usuario confirma
      if (result.isConfirmed) {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/vac`, data);
        Swal.fire('Enviado', 'El diagrama ha sido enviado.', 'success');
        navigate('/diagramas');
      }
    } catch (error) {
      console.error('Error al guardar los datos:', error.response ? error.response.data : error.message);
    }
  };

  const handleSaveAdvance = async () => {
    try {
      // Se arma el objeto de datos con todos los campos inicialmente.
      const data = {
        fecha: formData.fecha,
        problema: formData.problema,
        requisito: formData.requisito,
        auditado: userData.Nombre,
        correo: userData.Correo,
        hallazgo: formData.hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'Incompleto',
        tipo:'vacio',
        fechaElaboracion
      };

      console.log('Acceso: ', formData.acceso)
  
      // Si el campo "acceso" es igual a userData.Nombre, se elimina auditado y correo
      if (formData.acceso === userData.Nombre) {
        delete data.auditado;
        delete data.correo;
      }
  
      if (selectedRecordId) {
        // Actualizando registro existente
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${selectedRecordId}`, data);
        Swal.fire('Cambios Actualizados', 'El registro ha sido actualizado.', 'success');
      } else {
        // Creando un nuevo registro
        data.folio = generateFolio(userData);
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/vac`, data);
        setSelectedRecordId(response.data._id);
        Swal.fire('Registro Guardado', 'El nuevo registro ha sido creado.', 'success');
      }

      await fetchIshikawaRecords();
    } catch (error) {
      console.error('Error al guardar los datos:', error.response ? error.response.data : error.message);
    }
  };  
  
  const handleUpdate = async () => {
    try {
      const data = {
        fecha: formData.fecha,
        problema: formData.problema,
        requisito: formData.requisito,
        auditado: userData.Nombre,
        hallazgo: formData.hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'Hecho',
        tipo:'vacio',
        fechaElaboracion
      };
  
      const result = await Swal.fire({
        title: '¿Está seguro de querer enviar?',
        text: 'El diagrama será enviado para revisión.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3ccc37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
      });
  
      // Solo procede si el usuario confirma
      if (result.isConfirmed) {
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${selectedRecordId}`, data);
        Swal.fire('Enviado', 'El diagrama ha sido enviado.', 'success');
        navigate('/diagramas');
      }
    } catch (error) {
      console.error('Error al actualizar los datos:', error.response ? error.response.data : error.message);
    }
  };

  const handleDoubleClick = (e) => {
    const textarea = e.target;
  
    setSelectedTextareas((prevSelected) => {
      const newSelected = new Set(prevSelected);
  
      if (newSelected.has(textarea)) {
        // Si el textarea ya está seleccionado, deseleccionarlo
        newSelected.delete(textarea);
        textarea.style.backgroundColor = '';
      } else {
        // Si el textarea no está seleccionado, seleccionarlo
        newSelected.add(textarea);
        textarea.style.backgroundColor = '#f1fc5e9f';
        textarea.style.borderRadius = '10px';
      }
  
      // Actualizar los textos seleccionados en el campo 'causa'
      setFormData((prevState) => {
        // Si ya existe un valor en causa, separamos sus partes
        const currentValues = prevState.causa 
          ? prevState.causa.split('; ').filter(v => v) 
          : [];
        
        // Obtenemos los valores de los textareas seleccionados
        const selectedValues = Array.from(newSelected).map(t => t.value);
        
        // Fusionamos ambos arrays, eliminando duplicados
        const mergedValues = [...new Set([...currentValues, ...selectedValues])];
        
        return {
          ...prevState,
          causa: mergedValues.join('; ')
        };
      });
      
    });
  
    textarea.select(); // Selecciona el texto dentro del textarea
  };

  const Guardar = async () => {
    if (
      !formData.hallazgo ||
      !formData.requisito||
      !formData.afectacion ||
      !formData.problema ||
      !formData.correccion ||
      !formData.fecha ||
      !formData.causa ||
      diagrama.some(dia => !dia.text1 || !dia.text2 || !dia.text3 || !dia.text10 || !dia.text11) ||
      actividades.some(act => !act.actividad || !act.responsable || !act.fechaCompromiso)
    ) {
      console.log('Por favor, complete todos los campos requeridos antes de guardar.');
      return;
    }
    await handleSave();
  };

  const Actualizar = async () => {
    if (
      !formData.hallazgo ||
      !formData.requisito||
      !formData.afectacion ||
      !formData.problema ||
      !formData.correccion ||
      !formData.fecha ||
      !formData.causa ||
      diagrama.some(dia => !dia.text1 || !dia.text2 || !dia.text3 || !dia.text10 || !dia.text11) ||
      actividades.some(act => !act.actividad || !act.responsable || !act.fechaCompromiso)
    ) {
      console.log('Por favor, complete todos los campos requeridos antes de guardar.');
      return;
    }
    await handleUpdate();
  };

  const agregarFilaActividad = () => {
    setActividades([...actividades, { actividad: '', responsable: [], fechaCompromiso: '' }]);
  };

  const eliminarFilaActividad = (index) => {
    const nuevasActividades = actividades.filter((_, i) => i !== index);
    setActividades(nuevasActividades);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
  
    // Actualiza el estado del diagrama
    setDiagrama(prevState => [{
      ...prevState[0],
      [name]: value
    }]);
  
    // Aplica el nuevo tamaño de fuente al textarea
    e.target.style.fontSize = fontSize;
  };

  // Mapas para guardar los elementos originales y sus valores
// Mapas para guardar los elementos originales y sus valores
const originalInputs = [];
const originalTextareas = [];

// Convierte inputs y textareas a divs
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

        if (yOffset + imgHeight > pageHeight) {
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

useEffect(() => {
  if (formData.participantes) {
    const participantesArray = formData.participantes.split(" / ").map((nombre) => ({ Nombre: nombre.trim() }));
    setSelectedParticipants(participantesArray);
  }
}, [formData.participantes]);

useEffect(() => {
  // Solo realiza la búsqueda si hay al menos 3 caracteres
  if (searchTerm.length < 3) {
    setSuggestions([]);
    return;
  }

  const delayDebounceFn = setTimeout(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios/search?search=${encodeURIComponent(searchTerm)}`)
      .then(response => {
        setSuggestions(response.data);
        
      })
      .catch(error => {
        console.error("Error al buscar participantes:", error);
      });
  }, 300); // 300ms de retraso

  return () => clearTimeout(delayDebounceFn);
}, [searchTerm]);

// Función para manejar la selección de un participante
const handleSelect = (participant) => {
  // Evitar duplicados
  if (selectedParticipants.some(p => p.Nombre === participant.Nombre)) return;

  const nuevosSeleccionados = [...selectedParticipants, participant];
  setSelectedParticipants(nuevosSeleccionados);

  // Actualiza el formData (los almacena como cadena separados por "/")
  const nuevosNombres = nuevosSeleccionados.map(p => p.Nombre).join(' / ');
  setFormData({ ...formData, participantes: nuevosNombres });
  console.log('usuarios: ',nuevosNombres);

  setSearchTerm('');
  setSuggestions([]);
};

// Función para eliminar un participante (si deseas permitir eliminar chips)
const handleDelete = (participantToDelete) => {
  const nuevosSeleccionados = selectedParticipants.filter(p => p.Nombre !== participantToDelete.Nombre);
  setSelectedParticipants(nuevosSeleccionados);

  const nuevosNombres = nuevosSeleccionados.map(p => p.Nombre).join(' / ');
  setFormData({ ...formData, participantes: nuevosNombres });
};

const ajustarTamanoFuente = (textarea) => {
  const maxFontSize = 15; // Tamaño máximo de fuente
  const minFontSize = 10; // Tamaño mínimo de fuente
  const lineHeight = 1.2; // Ajusta según el diseño

  let fontSize = maxFontSize;
  textarea.style.fontSize = `${fontSize}px`;

  while (
      (textarea.scrollHeight > textarea.offsetHeight ||
      textarea.scrollWidth > textarea.offsetWidth) &&
      fontSize > minFontSize
  ) {
      fontSize -= 0.5; // Reduce el tamaño en pequeños pasos
      textarea.style.fontSize = `${fontSize}px`;
      textarea.style.lineHeight = `${lineHeight}em`;
  }
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

const obtenerEstiloTextarea = (texto, causa) => {
  return verificarCoincidencia(texto, causa) 
  ? { backgroundColor: '#f1fc5e9f', borderRadius: '10px' } 
  : {};
};

const handleResponsableSelect = (index, user) => {
  const nuevasActividades = actividades.map((actividad, i) => {
    if (i === index) {
      // Validamos si el responsable ya está en el array (comparamos por nombre, por ejemplo)
      const yaExiste = actividad.responsable.some(
        (resp) => resp.nombre === user.Nombre
      );

      // Si no existe, lo agregamos
      if (!yaExiste) {
        return {
          ...actividad,
          responsable: [
            ...actividad.responsable,
            { nombre: user.Nombre, correo: user.Correo },
          ],
        };
      }
    }
    return actividad;
  });
  setActividades(nuevasActividades);
};

const handleDeleteResponsable = (index, responsableIndex) => {
  const nuevasActividades = actividades.map((actividad, i) => {
    if (i === index) {
      return {
        ...actividad,
        responsable: actividad.responsable.filter((_, idx) => idx !== responsableIndex)
      };
    }
    return actividad;
  });
  // Actualiza el estado, asumiendo que tienes una función setActividades o similar
  setActividades(nuevasActividades);
};

useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => ajustarTamanoFuente(textarea));
}, [selectedRecordId]);

const puedeEditar = (
  !formData.estado || 
  formData.estado === 'Incompleto' || 
  formData.estado === 'Rechazado'
) && !isReadOnly;

const handleCloseModal = async () => {
  setModalOpen(false);
  await fetchIshikawaRecords();
};

if (true) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} >
      <h1
        style={{
          fontSize: '3rem',
          color: '#ff5252',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
          fontFamily: "'Arial Black', sans-serif",
          animation: 'fadeIn 2s ease-in-out'
        }}
      >
        🚧 En mantenimiento 🚧
      </h1>
      <h2>
        Del 06/05/2025 al 08/05/2025
      </h2>
    </div>
  );
}

  return (
    <div className="content-diagrama">

      <form onSubmit={(e) => {
          e.preventDefault(); // Prevenir el envío automático del formulario
          if (isEditing) {
            Actualizar();
          } else {
            Guardar();
          }
        }}>
          
      <div>
        {console.log('estado seleccionado: ', formData.estado)}
      <Stack
        className="acciones-ish-container"
        direction="row"
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          variant="text"
          sx={{ color: 'white' }}
          startIcon={<AccountTreeIcon />}
          onClick={handleOpen}
        >
          Diagrama
        </Button>

        {!(Array.isArray(formData.acceso) &&
          formData.acceso.some(acc => acc.nombre?.toLowerCase() === userData.Nombre?.toLowerCase())) && (
          <Button
            variant="text"
            sx={{ color: 'white' }} 
            startIcon={<ShareIcon />}
            onClick={e => { e.preventDefault(); setModalOpen(true); }}
          >
            Compartir
          </Button>
        )}

        <Button
          variant="text"
          sx={{ color: 'white' }}
          startIcon={<PictureAsPdfIcon />}
          onClick={handlePrintPDF}
          disabled={formData.estado !== '' && 
            formData.estado !== 'Aprobado' &&
            formData.estado !== 'Finalizado'}
        >
          Generar PDF
        </Button>

        <Button
          variant="text"
          sx={{ color: 'white' }}
          startIcon={<SaveIcon />}
          onClick={e => { e.preventDefault(); handleSaveAdvance(); }}
          disabled={!puedeEditar}
        >
          Guardar
        </Button>

        <Button
          variant="text"
          sx={{ color: 'white' }}
          endIcon={<SendIcon />}
          type="submit"
          disabled={!puedeEditar}
        >
          Enviar
        </Button>

        {/* Modales y gestores */}
        <GestorIsh
          open={openGestor}
          onClose={handleClose}
          onSelect={handleSelectRecord}
        />

        <AccesoModal
          open={modalOpen}
          handleClose={handleCloseModal}
          idIshikawa={selectedRecordId}
          problemaIshikawa={formData.problema}
          estado={formData.estado}
        />
      </Stack>

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

        {formData.notaRechazo ? (
          <div className='th-comentario'>
             <div style={{padding:'15px'}}>{formData.notaRechazo}</div>
          </div>
         ): ''}


        {isReadOnly && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Modo lectura: no se permiten cambios.
        </div>
      )}
         <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            my: 2
          }}
        >
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            Acceso:
          </Typography>

          {Array.isArray(formData.acceso) && formData.acceso.length > 0 ? (
            formData.acceso.map((acc) => (
              <Tooltip
                key={acc.nombre}
                title={`Nivel de acceso: ${acc.nivelAcceso}`}
                arrow
              >
                <Chip
                  avatar={<Avatar>{acc.nombre.charAt(0).toUpperCase()}</Avatar>}
                  label={acc.nombre}
                  variant="outlined"
                  size="small"
                />
              </Tooltip>
            ))
          ) : (
            <Typography color="text.secondary" variant="body2">
              NA
            </Typography>
          )}
        </Box>

        {showDiagrama === true ? (
          <Diagrama recordId={selectedRecordId} />
        ) : (

        <div className="edit-container">

        <div id='pdf-content-part1' className="image-container-dia" >
        <img src={Logo} alt="Logo Aguida" className='logo-empresa-ish' />
        <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
          <div className='posicion-en'>
            <h2>Problema:
              <input type="text" className="problema-input" name='problema'
                style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar problema. . ." required 
                value={formData.problema} onChange={handleFormDataChange} disabled={isReadOnly} />
            </h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2>Afectación:
                <input type="text" className="problema-input" name='afectacion'
                  style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar afectación. . ." required 
                  value={formData.afectacion} onChange={handleFormDataChange} disabled={isReadOnly} />
              </h2>
            </div>
          </div>
          <div className='posicion-en-3'>
          GCF015
          </div>
          <div className='posicion-en-2'>
            <h3>Fecha: 
            <input type="date" name='fecha' value={formData.fecha}
                  style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar afectación. . ." required 
                   onChange={handleFormDataChange} disabled={isReadOnly} />
            </h3>
            <h3>Folio: {formData.folio}{console.log('folio: ', formData)}</h3>
          </div>
          <div>
            <img src={Ishikawa} alt="Diagrama de Ishikawa" className="responsive-image" />
            {diagrama.map((dia, index) => (
              <div key={index}>
              <textarea maxLength={145} className="text-area" name="text1" value={dia.text1} onChange={handleInputChange} 
              style={{ top: '19.1rem', left: '8.7rem', ...obtenerEstiloTextarea(dia.text1, formData.causa)}} placeholder="Texto..." required  onDoubleClick={handleDoubleClick}
              disabled={isReadOnly}/>
               <textarea maxLength={145} className="text-area" name='text2' value={dia.text2} onChange={handleInputChange}
               style={{ top: '19.1rem', left: '25.4rem', ...obtenerEstiloTextarea(dia.text2, formData.causa)}} placeholder="Texto..." required  onDoubleClick={handleDoubleClick}
               disabled={isReadOnly}/>
               <textarea className="text-area" name='text3' value={dia.text3} onChange={handleInputChange}
                style={{ top: '19.1rem', left: '41.2rem', ...obtenerEstiloTextarea(dia.text3, formData.causa)}}placeholder="Texto..." required  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
   
               <textarea className="text-area" name='text4' value={dia.text4} onChange={handleInputChange}
                style={{ top: '23.2rem', left: '12.2rem', ...obtenerEstiloTextarea(dia.text4, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text5' value={dia.text5} onChange={handleInputChange}
                style={{ top: '23.2rem', left: '28.8rem', ...obtenerEstiloTextarea(dia.text5, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text6' value={dia.text6} onChange={handleInputChange}
                style={{ top: '23.2rem', left: '45rem', ...obtenerEstiloTextarea(dia.text6, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
       
               <textarea className="text-area" name='text7' value={dia.text7} onChange={handleInputChange}
                style={{ top: '27.2rem', left: '15.5rem', ...obtenerEstiloTextarea(dia.text7, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text8' value={dia.text8} onChange={handleInputChange}
                style={{ top: '27.2rem', left: '32.3rem', ...obtenerEstiloTextarea(dia.text8, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text9' value={dia.text9} onChange={handleInputChange}
                style={{ top: '27.2rem', left: '48.1rem', ...obtenerEstiloTextarea(dia.text9, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
     
               <textarea className="text-area" name='text10' value={dia.text10} onChange={handleInputChange}
                style={{ top: '31rem', left: '23rem', ...obtenerEstiloTextarea(dia.text10, formData.causa)}}placeholder="Texto..." required  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text11' value={dia.text11} onChange={handleInputChange}
                style={{ top: '31rem', left: '39.4rem', ...obtenerEstiloTextarea(dia.text11, formData.causa)}}placeholder="Texto..." required  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
     
               <textarea className="text-area" name='text12' value={dia.text12} onChange={handleInputChange}
                style={{ top: '35rem', left: '19.7rem', ...obtenerEstiloTextarea(dia.text12, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text13' value={dia.text13} onChange={handleInputChange}
                style={{ top: '35rem', left: '36rem', ...obtenerEstiloTextarea(dia.text13, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
     
               <textarea className="text-area" name='text14' value={dia.text14} onChange={handleInputChange}
                style={{ top: '39rem', left: '16.6rem', ...obtenerEstiloTextarea(dia.text14, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
               <textarea className="text-area" name='text15' value={dia.text15} onChange={handleInputChange}
                style={{ top: '39rem', left: '32.8rem', ...obtenerEstiloTextarea(dia.text15, formData.causa)}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145} disabled={isReadOnly}></textarea>
                <textarea maxLength={145} className="text-area" name='problema' value={formData.problema} onChange={handleDiagrama}
                  style={{ top: '27rem', left: '67.5rem', width: '8.5rem', height: '8rem' }} placeholder="Problema..." disabled={isReadOnly}/>
               </div>
            ))}
          </div> 

          <div className='button-parti-ish'>
          <div style={{ width: '64rem' }}>
            {/* Contenedor de chips y campo de busqueda */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <button className='button-part'> ⚇</button>
                {selectedParticipants.map((participant, index) => (
                  <Chip
                    key={index}
                    label={participant.Nombre}
                    onDelete={() => handleDelete(participant)}
                    disabled={isReadOnly}
                  />
                ))}
                {/* Campo de busqueda */}
                <TextField
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar nombre..."
                  variant="outlined"
                  size="small"
                  style={{ minWidth: '200px' }}
                  disabled={isReadOnly}
                />
              </div>

              {/* Lista de sugerencias */}
              {suggestions.length > 0 && (
                <Paper style={{ maxHeight: '10rem', overflowY: 'auto', marginBottom: '1rem' }}>
                  <List>
                    {suggestions.map((participant, index) => (
                      <ListItem
                        button
                        key={index}
                        onClick={() => handleSelect(participant)}
                      >
                        {participant.Nombre}
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </div>
            </div>
          </div>

          <div className="image-container2-dia" id='pdf-content-part2'>
          <div>
            <div className='posicion-bo' style={{ marginRight: '5rem' }}>
              <h3>No conformidad:</h3>
              <textarea type="text" className="textarea-acc" name='requisito'
                style={{ width: '72em', textAlign: 'justify' }} placeholder="Agregar Acción. . ." 
                value={formData.requisito} onChange={handleFormDataChange} required disabled={isReadOnly} />
              <h3>Hallazgo:</h3>
              <textarea type="text" className="textarea-acc" name='hallazgo'
                style={{ width: '72em', color: '#000000' }} placeholder="Agregar Hallazgo. . ." 
                value={formData.hallazgo} onChange={handleFormDataChange} required disabled={isReadOnly}/>
              <h3>Acción inmediata o corrección:</h3>
              <textarea type="text" className="textarea-acc" name='correccion'
                style={{ width: '72em', color: '#000000' }} placeholder="Agregar Acción. . ." 
                value={formData.correccion} onChange={handleFormDataChange} required disabled={isReadOnly}/>
              <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
              <textarea type="text" className="textarea-acc" name='causa'
                 style={{ marginBottom: '20px', width:'72em', overflowWrap: 'break-word' }} 
                 placeholder="Seleccione la causa desde el diagrama"  onKeyDown={(e) => e.preventDefault()} 
                  value={formData.causa} onChange={handleFormDataChange} required disabled={isReadOnly}/>
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
                {actividades.map((actividad, index) => (
                  <tr key={index}>
                    <td>
                      <textarea
                        className='table-input'
                        type="text"
                        placeholder='Agregar actividad. . .'
                        value={actividad.actividad}
                        onChange={(e) => {
                          const newActividades = [...actividades];
                          newActividades[index].actividad = e.target.value;
                          setActividades(newActividades);
                        }}
                        required
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      {actividad?.responsable && actividad.responsable.map((resp, idx) => (
                        <Chip
                          key={idx}
                          label={`${resp.nombre}`}
                          onDelete={() => handleDeleteResponsable(index, idx)}
                          style={{ margin: '0.2rem' }}
                          variant="outlined"
                        />
                      ))}
              
                      <Busqueda onSelect={(user) => handleResponsableSelect(index, user)} />

                      </td>
                    <td>
                      <div>
                        <input
                          type="date"
                          value={actividad.fechaCompromiso}
                          onChange={(e) => {
                            const newActividades = [...actividades];
                            newActividades[index].fechaCompromiso = e.target.value;
                            setActividades(newActividades);
                          }}
                          required
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                    <td className='cancel-acc'>
                      <button type='button' onClick={() => eliminarFilaActividad(index)} disabled={isReadOnly}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type='button' onClick={(e) => {
              e.preventDefault();
              agregarFilaActividad();
            }} className='button-agregar' disabled={isReadOnly}>Agregar Fila</button>
          </div>
          </div>
          </div>
        )}
        </div>
    </form>
    </div>
  );
};

export default CreacionIshikawa;