import React, { useEffect,useContext, useState, useRef } from 'react';
import api from '../../../services/api';
import ShareIcon from '@mui/icons-material/Share';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import './css/Ishikawa.css'
import { Alert, AlertTitle } from '@mui/material';
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
   Avatar, Tooltip, Typography, IconButton, Dialog, DialogTitle, DialogContent,
   DialogActions, } from '@mui/material';
import Diagrama from '../DiagramaRe/Diagrama';
import NewIshikawa from './NewIshikawa';
import { useLocation } from 'react-router-dom';
import AutoGrowTextarea from '../../../resources/AutoGrowTextarea';
import IshPDF from '../../../administrador/Components/IshikawaRev/IshPDF';

const CreacionIshikawa2 = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { state } = useLocation();
  const ishikawaId = state?.ishikawaId;
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // const [showPart, setShowPart] = useState(true);
  const [ishikawaRecords, setIshikawaRecords] = useState([]); // Almacena los registros filtrados
  const [selectedRecordId, setSelectedRecordId] = useState(null);
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
    return deptInitials;
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
      const response = await api.get(`/ishikawa`);
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

  useEffect(() => {
    fetchIshikawaRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.Nombre]);

  useEffect(() => {
  if (ishikawaId && ishikawaRecords.length > 0) {
    handleSelectRecord(ishikawaId);

    // reemplazo la entrada en el historial sin state
    navigate('.', { replace: true, state: {} });
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [ishikawaId, ishikawaRecords, navigate]);
  

  const handleSelectRecord = (selectedId) => {
  
    if (selectedId === null) {
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
      setIsEditing(false);
      setShowDiagrama(false);
      setSelectedParticipants([]);
      setOpenGestor(false);
    return;
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

  const selectedRecord = ishikawaRecords.find(record => record._id === selectedRecordId);

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
        await api.post(`/ishikawa`, data);
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
        await api.put(`/ishikawa/completo/${selectedRecordId}`, data);
        Swal.fire('Cambios Actualizados', 'El registro ha sido actualizado.', 'success');
      } else {
        // Creando un nuevo registro
        data.folio = generateFolio(userData);
        const response = await api.post(`/ishikawa`, data);
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
        await api.put(`/ishikawa/completo/${selectedRecordId}`, data);
        Swal.fire('Enviado', 'El diagrama ha sido enviado.', 'success');
        navigate('/diagramas');
      }
    } catch (error) {
      console.error('Error al actualizar los datos:', error.response ? error.response.data : error.message);
    }
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

  const handlePrintPDF = () => {
    setIsLoading(true);
    setProgress(0);
    
    const updateProgress = (increment) => {
        setProgress((prevProgress) => Math.min(Math.ceil(prevProgress + increment), 100));
    };

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

    const processPart3WithTableRows = async (
      element,
      pdf,
      yOffset,
      pageWidth,
      pageHeight,
      marginLeft,
      marginRight,
      bottomMargin
    ) => {
      await ensureImagesLoaded(element);

      // Selecciona tablas, pero las procesaremos en dos grupos:
      const tables = Array.from(element.querySelectorAll('table'));

      if (tables.length > 0) {
        // 1) Renderizar encabezado “SOLUCIÓN”
        const header1 = element.querySelector('h3:nth-of-type(1)');
        if (header1) {
          const canvasH1 = await html2canvas(header1, { scale: 2.5, useCORS: true });
          yOffset = processCanvas(
            canvasH1,
            pdf,
            yOffset,
            pageWidth,
            pageHeight,
            marginLeft,
            marginRight,
            bottomMargin
          );
        }

        // 2) Procesar sólo la primera tabla (SOLUCIÓN)
        const tableSolucion = tables[0];
        yOffset = await processTableWithRowControl(
          tableSolucion,
          pdf,
          yOffset,
          pageWidth,
          pageHeight,
          marginLeft,
          marginRight,
          bottomMargin
        );

        // 3) Renderizar encabezado “EFECTIVIDAD”
        const header2 = element.querySelector('h3:nth-of-type(2)');
        if (header2) {
          const canvasH2 = await html2canvas(header2, { scale: 2.5, useCORS: true });
          yOffset = processCanvas(
            canvasH2,
            pdf,
            yOffset,
            pageWidth,
            pageHeight,
            marginLeft,
            marginRight,
            bottomMargin
          );
        }

        // 4) Procesar la(s) tabla(s) restantes (EFECTIVIDAD)
        //    Empieza desde el índice 1 para saltar la primera tabla ya procesada
        for (let i = 1; i < tables.length; i++) {
          yOffset = await processTableWithRowControl(
            tables[i],
            pdf,
            yOffset,
            pageWidth,
            pageHeight,
            marginLeft,
            marginRight,
            bottomMargin
          );
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

        convertTextAreasToDivs(part3);
    return ensureImagesLoaded(part3)
      .then(() => processPart3WithTableRows(part3, pdf, yOffset, pageWidth, pageHeight, marginLeft3, marginRight3, bottomMargin));
        
      }).then(() => {
        setProgress(100);
        setIsLoading(false);
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
                      const emailArray = emailResult.value.split(',').map(e => e.trim()).filter(Boolean);

                      const formData = new FormData();
                      formData.append('pdf', pdf.output('blob'), 'diagrama_ishikawa.pdf');
                      formData.append('emails', JSON.stringify(emailArray));

                      return api.post('/ishikawa/enviar-pdf', formData);
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
    api.get(`/usuarios/search?search=${encodeURIComponent(searchTerm)}`)
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

const handleCausaChange = nuevaCausa => {
  setFormData(fd => ({ ...fd, causa: nuevaCausa }));
};

const pdfRef = useRef();

  return (
    <div className="ishn-content">

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
        className="ishn-actions"
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

        <IshPDF
          ref={pdfRef}    
          ishikawa={selectedRecord }
          programa={formData.afectacion}
          id={formData._id}
          download={true}
          participantesC={
            typeof selectedParticipants.participantes === "string"
              ? selectedParticipants.participantes.split('/').map(p => p.trim())
              : []
          }
        />

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

      {Array.isArray(formData.acceso) &&
          formData.acceso.some(acc => acc.nombre?.toLowerCase() === userData.Nombre?.toLowerCase()) && (
            <Alert severity="info" sx={{ my: 2 }}>
              <AlertTitle>Acceso Compartido</AlertTitle>
              Este diagrama ha sido compartido contigo. 
              {formData.acceso.find(acc => acc.nombre?.toLowerCase() === userData.Nombre?.toLowerCase())?.nivelAcceso === 1
                ? 'Tiene acceso de Solo Lectura (no se permiten cambios).'
                : 'Tiene acceso como Editor.'}
              <br />
              <strong>Nivel de acceso:</strong> {
                formData.acceso.find(acc => acc.nombre?.toLowerCase() === userData.Nombre?.toLowerCase())?.nivelAcceso
              }
            </Alert>
              )}

      {formData.estado === '' && (
        <Alert severity="warning" sx={{ my: 2 }}>
          <AlertTitle>Generación de PDF deshabilitada</AlertTitle>
          La generación de PDFs permanecerá desactivada hasta que el administrador apruebe el diagrama.
        </Alert>
      )}        

      {formData.estado === 'Rechazado' && (
        <Alert severity="error" sx={{ my: 2 }}>
          <AlertTitle>Estado: Rechazado</AlertTitle>
          Este diagrama ha sido rechazado. Por favor, revise la nota de rechazo y realize los ajustes necesarios.
          Nota: {formData.notaRechazo}
        </Alert>
      )}

      {formData.estado === 'Aprobado' && (
        <Alert severity="success" sx={{ my: 2 }}>
          <AlertTitle>Estado: Aprobado</AlertTitle>
          Este diagrama ha sido aprobado. Puede generar el PDF si es necesario.
        </Alert>
      )}

      {formData.estado === 'Hecho' && (
        <Alert severity="warning" sx={{ my: 2 }}>
          <AlertTitle>En revisión</AlertTitle>
          El diagrama está siendo revisado. Espere a que el administrador dé su veredicto.
          Se le notificará por correo electrónico.
        </Alert>
      )}

      {formData.estado === 'Finalizado' && (
        <Alert severity="info" sx={{ my: 2 }}>
          <AlertTitle>Estado: Finalizado</AlertTitle>
          El proceso ha sido finalizado. Ya no se permiten modificaciones.
        </Alert>
      )}


      {/*Mensaje de generacion*/}
        {isLoading && (
            <div className="ishn-loadingOverlay">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress variant="determinate" value={progress} />
                    <p>{progress}%</p>
                    <p>Generando PDF</p> {/* Muestra el porcentaje debajo del spinner */}
                </div>
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

        <div className="ishn-edit">

        <div id='pdf-content-part1' className="ishn-card" >
        <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
          <div className='ishn-info'>
            <h2>Problema:
              <input type="text" className="ishn-input" name='problema'
                style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar problema. . ." required 
                value={formData.problema} onChange={handleFormDataChange} disabled={isReadOnly} />
            </h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2>Afectación:
                <input type="text" className="ishn-input" name='afectacion'
                  style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar afectación. . ." required 
                  value={formData.afectacion} onChange={handleFormDataChange} disabled={isReadOnly} />
              </h2>
            </div>
          </div>
          <div className='ishn-code'>
          GCF015
          </div>
          <div className='ishn-meta'>
            <h3>Fecha: 
            <input type="date" name='fecha' value={formData.fecha}
                  style={{ marginTop: '0.4rem', color: '#000000', padding: '6px 32px 6px 8px' }} placeholder="Agregar afectación. . ." required 
                   onChange={handleFormDataChange} disabled={isReadOnly} />
            </h3>
            <h3>Folio: {formData.folio}{console.log('folio: ', formData)}</h3>
          </div>

          <div className='ishn-diagramWrap'>
          <NewIshikawa
            diagrama={diagrama}
            setDiagrama={setDiagrama}
            problema={formData.problema}
            causa={formData.causa}
            ID={selectedRecordId}
            onCausaChange={handleCausaChange}
          />
          </div> 

          <div className='ishn-people'>
          <div style={{ width: '64rem' }}>
            {/* Contenedor de chips y campo de busqueda */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <button className='ishn-peopleBtn'>⚇</button>
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

          <div className="ishn-card" id='pdf-content-part2'>
          <div>
            <div className='ishn-textBlock' style={{ marginRight: '5rem' }}>
              <h3>No conformidad:</h3>
              <AutoGrowTextarea type="text" className="ishn-textarea" name='requisito'
                style={{textAlign: 'justify' }} placeholder="Agregar Acción. . ." 
                value={formData.requisito} onChange={handleFormDataChange} required disabled={isReadOnly} />
              <h3>Hallazgo:</h3>
              <AutoGrowTextarea type="text" className="ishn-textarea" name='hallazgo'
                style={{color: '#000000' }} placeholder="Agregar Hallazgo. . ." 
                value={formData.hallazgo} onChange={handleFormDataChange} required disabled={isReadOnly}/>
              <h3>Acción inmediata o corrección:</h3>
              <AutoGrowTextarea type="text" className="ishn-textarea" name='correccion'
                style={{color: '#000000' }} placeholder="Agregar Acción. . ." 
                value={formData.correccion} onChange={handleFormDataChange} required disabled={isReadOnly}/>
              <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
              <AutoGrowTextarea type="text" className="ishn-textarea" name='causa'
                 style={{ marginBottom: '20px', overflowWrap: 'break-word' }} 
                 placeholder="Seleccione la causa desde el diagrama"  onKeyDown={(e) => e.preventDefault()} 
                  value={formData.causa} onChange={handleFormDataChange} required disabled={isReadOnly}/>
            </div>
          </div>
          </div>

          <div className='ishn-card' id='pdf-content-part3'>
          <div className='ishn-tableWrap'>
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
                    <AutoGrowTextarea
                      key={index}
                      className="ishn-tableInput"
                      placeholder="Agregar actividad..."
                      value={actividad.actividad}
                      onChange={e => {
                        const newActividades = [...actividades];
                        newActividades[index].actividad = e.target.value;
                        setActividades(newActividades);
                        }}
                        required
                        disabled={isReadOnly}
                      />
                      </td>
                      <td>
                        <Box sx={{
                          gap: 0.5,
                          m: '-4px -4em',
                        }}>
                        {actividad.responsable.map((resp, idx) => (
                          <Chip
                          key={idx}
                          size="medium"
                          label={resp.nombre}
                          onDelete={() => handleDeleteResponsable(index, idx)}
                          sx={{ mr: 0.5, mb: 0.5 }}    // margen *solo* en chips
                            variant="outlined"
                          />
                        ))}

                        <IconButton
                          size="small"
                          onClick={() => setOpen(true)}
                          aria-label="Agregar responsable"
                          sx={{
                            color: '#2979FF',
                            '&:hover': {
                              backgroundColor: 'rgba(41, 121, 255, 0.1)',
                            }
                          }}
                        >
                          <AddCircleOutlineIcon fontSize="medium" />
                        </IconButton>

                      </Box>

                      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                        <DialogTitle>Seleccionar responsable</DialogTitle>
                        <DialogContent>
                          <Busqueda
                            onSelect={(user) => {
                              handleResponsableSelect(index, user);
                              setOpen(false);
                            }}
                          />
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        </DialogActions>
                      </Dialog>
                    </td>

                    <td>
                      <div
                      >
                        <input
                          type="date"
                          value={actividad.fechaCompromiso}
                          onChange={e => {
                            const newActividades = [...actividades];
                            newActividades[index].fechaCompromiso = e.target.value;
                            setActividades(newActividades);
                          }}
                          required
                          disabled={isReadOnly}
                          style={{
                            padding: '6px 32px 6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            appearance: 'none'
                          }}
                        />
                       </div>
                    </td>

                    <td className='ishn-tableDangerCell'>
                      <button type='button' onClick={() => eliminarFilaActividad(index)} disabled={isReadOnly}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type='button' onClick={(e) => {
              e.preventDefault();
              agregarFilaActividad();
            }} className='ishn-addRowBtn' disabled={isReadOnly}>Agregar Fila</button>
          </div>
          </div>
          </div>
        )}
        </div>
    </form>
    </div>
  );
};

export default CreacionIshikawa2;