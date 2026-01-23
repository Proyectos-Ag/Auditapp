import React, { useEffect, useState,useCallback,useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import withReactContent from 'sweetalert2-react-content';
import Fotos from './Foto'; 
import './css/Modal.css';
import './css/IshikawaRev.css';
import "../../../ishikawa-vacio/components/Ishikawa/css/Ishikawa.css";
import AutoGrowTextarea from "../../../resources/AutoGrowTextarea";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { storage } from '../../../firebase';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {
  Stack,
  Box,
  Typography,
  Divider,
  Button, Alert,AlertTitle, TextField, Autocomplete,Chip
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import SaveIcon from '@mui/icons-material/Save';
import CircularProgress from '@mui/material/CircularProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DoneIcon from '@mui/icons-material/Done';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import NewIshikawaFin from '../../../ishikawa-vacio/components/Ishikawa/NewIshikawaFin';
import IshPDF from './IshPDF';

const IshikawaRev = () => {
    const { userData } = useContext(UserContext);
    const [ishikawas, setIshikawas] = useState([]);
    const [programa, setPrograma] = useState(null);
    const [descripcion, setDescripcion] = useState(null);
    const [filteredIshikawas, setFilteredIshikawas] = useState([]);
    const { _id, id, nombre} = useParams();
    const [valorSeleccionado, setValorSeleccionado] = useState('');
    const [CorreoSeleccionado, setCorreoSeleccionado] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [selectedField, setSelectedField] = useState(null); 
    const [imageModalOpen, setImageModalOpen] = useState(false);
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
    const [activeReprogramarId, setActiveReprogramarId] = useState(null);
    const [showNotaRechazo] = useState(false);
    const [tempFechaCompromiso, setTempFechaCompromiso] = useState('');
    const [actividades] = useState([{ actividad: '', responsable: [], fechaCompromiso: [] }]);
    const [capturedPhotos, setCapturedPhotos] = useState({});
    const [correcciones, setCorrecciones] = useState([
    { actividad: "", responsable: "", fechaCompromiso: null, cerrada: "", evidencia: [] }
    ]);
    const [nuevaCorreccion, setNuevaCorreccion] = useState({
    actividad: "", responsable: "", fechaCompromiso: "", cerrada: "", evidencia: []
    });

    // ✅ para borrar desde el modal una evidencia específica
    const [selectedEvMeta, setSelectedEvMeta] = useState(null);
    // selectedEvMeta = { kind: "saved"|"pending", rowIndex, evIndex, fieldKey }

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

    const [open, setOpen] = React.useState(false);
    const handleClose = () => {
    setOpen(false);
  };

    const handleOpen = () => {
    setOpen(true);
  };

    const fetchData = useCallback(async () => {
      try {
        const response = await api.get(`/ishikawa`, {
            params: {
                idRep: _id,
                idReq: id,
                proName: nombre
            }
        });  
        
        console.log('Aver 2:',response.data)

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
            const response = await api.get(`/datos/datos-filtrados`, {
                params: {
                    _id: _id,
                    id: id,
                    nombre: nombre
                }
            });

            console.log("Datos usados:", _id, id, nombre);

            if (response.data) {
                setPrograma(response.data.programaEncontrado);
                setDescripcion(response.data.descripcionEncontrada);
                console.log("Datos encontrados: ", response.data.descripcionEncontrada)
            }
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };
    obtenerDatos();
}, [userData, _id, id, nombre]);

useEffect(() => {
  const textareas = document.querySelectorAll("textarea.ishn-tableInput");
  textareas.forEach((ta) => ajustarTamanoFuente(ta));
}, [filteredIshikawas, correcciones]);

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
                    fechaCompromiso,
                    evidencia: normalizeEvidenciaArr(correccion.evidencia),
                };
            });
    
            if (correccionesIniciales.length === 0) {
            correccionesIniciales.push({ actividad: "", responsable: "", fechaCompromiso: null, cerrada: "", evidencia: [] });
            }
    
            setCorrecciones(correccionesIniciales);
        }
    }, [filteredIshikawas]);  
      
useEffect(() => {
    const fetchUsuarios = async () => {
        try {
        const response = await api.get(`/usuarios`);
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
        console.log('Ishikawa: ',nuevosFiltrados)
        if (nuevosFiltrados.length === 0) {
            setMensaje('No hay nada por aquí.');
        } else {
            setMensaje('');
        }
    } else {
        setMensaje('Cargando datos...');
    }
}, [ishikawas, _id, id, nombre]);

    const pdfRef = useRef();

// 2) Función para imprimir/enviar PDF
 const handlePrintPDF2 = async ({ download = true, participantes }) => {
    if (pdfRef.current) {
      await pdfRef.current.generatePDF({ download, participantes });
    }
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

    const handleGuardarCambios2 = async () => {
        try {
            handleOpen();
            if (filteredIshikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            }
    
            const { _id } = filteredIshikawas[0]; // ID del registro a actualizar
    
            // Manejamos la subida de imágenes || pdf y la asignación de URLs
            const correccionesActualizadas = await Promise.all(
                correcciones.map(async (correccion, index) => {
                    const updatedCorreccion = { ...correccion };
                    console.log("Captured Files:", capturedPhotos);
                    console.log("Index:", index);
    
                    // Construir la clave dinámica
                    const key = `${_id}_${index}`;
                    console.log('a ver:', _id, index);
                    const pendingFiles = capturedPhotos[key] || []; 
                    if (!pendingFiles.length) {
                    // asegúrate de que evidencia sea array aunque venga raro
                    updatedCorreccion.evidencia = normalizeEvidenciaArr(updatedCorreccion.evidencia);
                    return updatedCorreccion;
                    }

                    // Evidencia ya guardada (del backend) + nuevas subidas
                    const existing = normalizeEvidenciaArr(updatedCorreccion.evidencia);

                    const uploaded = await Promise.all(
                    pendingFiles.map(async (file, evIndex) => {
                        const fileName = buildFileName(_id, index, evIndex, file);
                        const fileUrl = await uploadImageToFirebase(file, fileName);

                        return file.type === "application/pdf"
                        ? `${fileUrl} || ${file.name}`
                        : fileUrl;
                    })
                    );

                    updatedCorreccion.evidencia = [...existing, ...uploaded];
                    return updatedCorreccion;

                })
            );
    
            // Filtra los campos vacíos o no modificados
            const dataToSend = correccionesActualizadas.map((correccion) => ({
                actividad: correccion.actividad || '',
                responsable: correccion.responsable || '',
                fechaCompromiso: correccion.fechaCompromiso || null,
                cerrada: correccion.cerrada || '',
                evidencia: normalizeEvidenciaArr(correccion.evidencia),
            }));
    
            // Realiza la solicitud PUT al backend con los datos optimizados
            const response = await api.put(`/ishikawa/${_id}`, dataToSend, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            handleClose();
    
            console.log('Respuesta del servidor:', response.data);
            Swal.fire({
                title: '¡Éxito!',
                text: 'Información guardada correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
            });
        } catch (error) {
            handleClose();
            console.error('Error al actualizar la información:', error);
            alert('Hubo un error al actualizar la información');
        }
    };    
    
    
    const uploadImageToFirebase = async (file, fileName) => {
        try {
            if (!(file instanceof File)) {
                throw new Error("El objeto recibido no es un archivo válido");
            }
    
            const storageRef = ref(storage, `files/${fileName}`);
            await uploadBytes(storageRef, file); // Sube el archivo al almacenamiento
            return await getDownloadURL(storageRef); // Obtiene la URL del archivo subido
        } catch (error) {
            console.error("Error al subir la imagen:", error);
            throw new Error("No se pudo subir la imagen");
        }
    };      
         
    const handleGuardarCambios = async () => {
        try {
            handleOpen();
            if (filteredIshikawas.length === 0) {
                alert('No hay datos para actualizar');
                return;
            } 
    
            const { _id } = filteredIshikawas[0]; // ID del registro a actualizar
    
            // Manejamos la subida de imágenes || pdf y la asignación de URLs
            const correccionesActualizadas = await Promise.all(
                correcciones.map(async (correccion, index) => {
                    const updatedCorreccion = { ...correccion };
                    console.log("Captured Files:", capturedPhotos);
                    console.log("Index:", index);
    
                    // Construir la clave dinámica
                    const key = `${_id}_${index}`;
                    console.log('a ver:', _id, index);
                    const file = capturedPhotos[key]; // Acceder al archivo correspondiente
    
                    // Validar si existe el archivo
                    if (!file) {
                        console.warn(`No se encontró archivo para la clave: ${key}`);
                        return updatedCorreccion; // Retorna sin modificar
                    }
    
                    // Determinar el nombre del archivo según su tipo
                    const fileType = file.type; // Obtener el tipo MIME del archivo
                    const fileName = fileType === 'application/pdf' 
                        ? `pdf_${_id}_${index}` 
                        : `image_${_id}_${index}`;
    
                    // Subir el archivo a Firebase y obtener la URL
                    const fileUrl = await uploadImageToFirebase(file, fileName);
    
                    // Concatenar el nombre del archivo si es PDF
                    updatedCorreccion.evidencia = fileType === 'application/pdf' 
                        ? `${fileUrl} || ${file.name}`
                        : fileUrl;
    
                    return updatedCorreccion;
                })
            );
    
            // Filtra los campos vacíos o no modificados
            const dataToSend = {
                correcciones: correccionesActualizadas.map((correccion) => ({
                    actividad: correccion.actividad || '',
                    responsable: correccion.responsable || '',
                    fechaCompromiso: correccion.fechaCompromiso || null,
                    cerrada: correccion.cerrada || '',
                    evidencia: normalizeEvidenciaArr(correccion.evidencia),
                })),
                estado: 'Revisado',
            };
    
            // Realiza la solicitud PUT al backend con los datos optimizados
            const response = await api.put(`/ishikawa/fin/${_id}`, dataToSend, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            handleClose();
    
            console.log('Respuesta del servidor:', response.data);
            Swal.fire({
                title: '¡Éxito!',
                text: 'Información guardada correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
            }).then(() => {
                fetchData();
                verificarRegistro();
              });
            } catch (error) {
              console.error('Error al actualizar:', error);
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

      const response = await api.put(`/ishikawa/estado/${_id}`, {
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
                await api.put(`/ishikawa/completo/${_id}`, {
                    estado: 'Aprobado',
                    usuario: ishikawas[0].auditado,
                    programa: ishikawas[0].proName,
                    correo: ishikawas[0].correo
                });

                // Mostrar alerta de éxito
                Swal.fire({
                    icon: 'success',
                    title: 'Operación exitosa',
                    text: 'El ishicawa fue aprobado correctamente.',
                    confirmButtonText: 'Aceptar',
                    timer: 3000, // Cierra el alert automáticamente después de 3 segundos
                    timerProgressBar: true
                });

                await handlePrintPDF2({ download: false, id, participantes: ishikawas[0].participantes});
                await fetchData();
                await verificarRegistro();
        
            } catch (error) {
                console.error('Error updating data:', error);
        
                // Mostrar alerta de error
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un error al actualizar la información.',
                    confirmButtonText: 'Aceptar'
                });
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

const handleGuardarRechazo = async (nota) => {
  try {
    const { _id: registroId, auditado, proName, correo } = filteredIshikawas[0];

    await api.put(
      `/ishikawa/completo/${registroId}`,
      {
        estado: 'Rechazado',
        notaRechazo: nota,       // aquí uso la nota recibida por parámetro
        usuario: auditado,
        programa: proName,
        correo
      }
    );

    fetchData();

    MySwal.fire({
      icon: 'success',
      title: 'Rechazo registrado',
      text: 'El diagrama fue rechazado correctamente.',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Error updating data:', error);
    MySwal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al registrar el rechazo.',
      confirmButtonText: 'Aceptar'
    });
  }
};

const Rechazar = () => {
  MySwal.fire({
    title: 'Rechazar diagrama',
    input: 'textarea',
    inputLabel: 'Escriba la nota de rechazo',
    inputPlaceholder: 'Comentario…',
    inputAttributes: {
      'aria-label': 'Nota de rechazo'
    },
    showCancelButton: true,
    confirmButtonText: 'Rechazar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    inputValidator: (value) => {
      if (!value) {
        return 'La nota de rechazo es obligatoria';
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Llamamos a guardar pasando directamente el contenido del textarea
      handleGuardarRechazo(result.value);
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
            const response = await api.get(`/ishikawa`, {
                params: {
                    idRep: _id,
                    idReq: id,
                    proName: nombre
                }
            });
            console.log('respuesta: ', response.data);
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
    const hallazgoAplanado = descripcion.Hallazgo.flat();
    const hallazgoString = hallazgoAplanado.join(' ');
    console.log('Hallazgo:', hallazgoString);
        try {
            const data = {
                idRep: _id,
                idReq: id,
                proName: nombre,
                fecha: '',
                auditado: valorSeleccionado,
                correo: CorreoSeleccionado,
                problema: descripcion.Observacion,
                requisito:descripcion.Requisito,
                hallazgo:hallazgoString,
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
                await api.put(`/ishikawa/${registroId}`, data);
                Swal.fire('Reasignado', 'El diagrama ha sido reasignado.', 'success');
                verificarRegistro();
            } else {
                // Crear nuevo registro
                await api.post(`/ishikawa`, data);
                Swal.fire('Asignado', 'La asignación se realizó exitosamente.', 'success');
                verificarRegistro();
            }
    
            fetchData(); // Para refrescar la lista de registros
        } catch (error) {
            console.error('Error al guardar los datos:', error);
            Swal.fire('Error', 'Hubo un problema al guardar los datos.', 'error');
        }
};  

const handleReasignar = async (registroId) => {
  try {
    await api.patch(
      `/ishikawa/asig/${registroId}`,
      {
        auditado: valorSeleccionado,
        correo: CorreoSeleccionado,
      }
    );
    Swal.fire('Reasignado', 'El diagrama ha sido reasignado.', 'success');
    verificarRegistro();
    fetchData();
  } catch (error) {
    console.error('Error al reasignar:', error);
    Swal.fire('Error', 'No se pudo reasignar el diagrama.', 'error');
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
            if (rechazo.length > 0) {
                // reasignación parcial
                const { _id: registroId } = rechazo[0];
                handleReasignar(registroId);
            } else {
                handleSave();
            }
          }
        });
};

const handleUpdateFechaCompromiso = async (ishikawaId, actividadId, index) => {
    try {
      const nuevaFecha = tempFechaCompromiso;
      const actividadActualizada = {
        ...actividades[index],
        fechaCompromiso: [...actividades[index].fechaCompromiso, nuevaFecha] // Se agrega la nueva fecha
      };
  
      const updatedActividades = [...actividades];
      updatedActividades[index] = actividadActualizada;
  
      const updatedData = {
        actividades: [{
          _id: actividadId,
          fechaCompromiso: [nuevaFecha]
        }]
      };      
  
      // Aquí se usa el id del documento Ishikawa, no el id de la actividad
      const response = await api.put(
        `/ishikawa/fecha/${ishikawaId}`,
        updatedData
      );
      console.log('Datos actualizados:', response.data);
      fetchData();
      Swal.fire('Fecha actualizada', `La nueva fecha de compromiso es: ${nuevaFecha}`, 'success');
      setActiveReprogramarId(null);
    } catch (error) {
      console.error('Error al actualizar la fecha de compromiso:', error);
      Swal.fire('Error', 'No se pudo actualizar la fecha de compromiso', 'error');
    }
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
    
const colores = ['black', 'blue', 'green', 'yellow','orange', 'red'];

const handleSelectChange = (event, index) => {
    event.target.style.color = colores[index % colores.length];
};

const handleSelectChangeAud = (event) => {
    const { value } = event.target;
  
    if (value) {
      const { nombre, correo } = JSON.parse(value); // Extrae nombre y correo
      setValorSeleccionado(nombre); // Guarda el nombre en un estado
      setCorreoSeleccionado(correo); // Guarda el correo en otro estado
    } else {
      setValorSeleccionado('');
      setCorreoSeleccionado('');
    }
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
  setSelectedEvMeta(null);
};

const handleCapture = (file) => {
  if (!selectedField) return;

  setCapturedPhotos((prev) => ({
    ...prev,
    [selectedField]: [...(prev[selectedField] || []), file],
  }));

  setModalOpen(false);
};

const handleUploadFile = (fieldKey) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf";
  input.style.display = "none";

  input.onchange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCapturedPhotos((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || []), file], 
    }));
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
};

const handleEliminarEvidencia = async (rowIndex, idIsh, idCorr, evIndex) => {
  try {
    const resp = await api.put(`/ishikawa/eliminar-evidencia/${rowIndex}/${idIsh}/${idCorr}/${evIndex}`);

    if (resp.status === 200) {
      // ✅ actualiza local: quita solo esa evidencia
      setCorrecciones((prev) => {
        const next = [...prev];
        const evArr = normalizeEvidenciaArr(next[rowIndex]?.evidencia);
        evArr.splice(evIndex, 1);
        next[rowIndex] = { ...next[rowIndex], evidencia: evArr };
        return next;
      });

      closeModal();
      Swal.fire("Listo", "Evidencia eliminada.", "success");
    }
  } catch (error) {
    console.error("Error al eliminar la evidencia:", error);
    Swal.fire("Error", "No se pudo eliminar la evidencia.", "error");
  }
};

const EliminarEv = (rowIndex, idIsh, idCorr, evIndex) => {
  Swal.fire({
    title: "¿Está seguro de querer eliminar la evidencia?",
    text: "¡Esta acción es irreversible!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3ccc37",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      handleEliminarEvidencia(rowIndex, idIsh, idCorr, evIndex);
    }
  });
};

const opcionesUsuarios = React.useMemo(() => {
  if (!usuarios) return [];
  return [...usuarios]
    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es'))
    .map(u => ({
      label: u.Nombre,
      correo: u.Correo,
      id: u._id,
    }));
}, [usuarios]);

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

const canEditEfectividad = Boolean(aprobado);

const formatDateInputValue = (value) => {
  const v = String(value || "").trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateCell = (value) => {
  const v = String(value || "").trim();
  if (!v) return "--";
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString();
};

const formatResponsables = (responsable) => {
  if (!responsable) return "--";

  const pickName = (r) => {
    if (r == null) return "";
    if (typeof r === "string") return r;
    if (typeof r === "object") {
      if (r.nombre) return r.nombre;
      const keys = Object.keys(r)
        .filter((k) => !Number.isNaN(Number(k)))
        .sort((a, b) => Number(a) - Number(b));
      if (keys.length) return keys.map((k) => r[k]).join("");
    }
    return String(r);
  };

  if (Array.isArray(responsable)) {
    return responsable
      .flat(Infinity)
      .map(pickName)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ") || "--";
  }

  if (typeof responsable === "object") return pickName(responsable) || "--";
    return String(responsable);
    };

    const parseParticipantes = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return [];
    return s
        .split(/\s*\/\s*|,\s*/g)
        .map((x) => x.trim())
        .filter(Boolean);
    };

    const normalizeEvidenciaArr = (e) => {
  if (e == null) return [];
  if (Array.isArray(e)) return e.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
  const s = String(e).trim();
  return s ? [s] : [];
};

// ✅ nombre único para evitar overwrite en Firebase
const buildFileName = (docId, rowIndex, evIndex, file) => {
  const isPdf = file?.type === "application/pdf";
  const extFromName = (file?.name || "").split(".").pop();
  const ext = isPdf ? "pdf" : (extFromName || "jpg");
  return `${isPdf ? "pdf" : "img"}_${docId}_${rowIndex}_${Date.now()}_${evIndex}.${ext}`;
};

    const parseEvidencia = (evidencia) => {
    const raw = String(evidencia || "").trim();
    if (!raw) return { kind: "none" };

    // Caso: "URL || nombre.pdf"
    if (raw.includes("||")) {
        const [url, name] = raw.split("||").map((x) => x.trim());
        const isPdf = (name || "").toLowerCase().endsWith(".pdf");
        return { kind: isPdf ? "pdf" : "link", url, name: name || "Archivo" };
    }

    // Caso: URL directa
    const isPdf = raw.toLowerCase().endsWith(".pdf");
    return { kind: isPdf ? "pdf" : "img", url: raw, name: isPdf ? "PDF" : "" };
    };

    const pickValue = (eOrValue) => {
    if (eOrValue && typeof eOrValue === "object" && eOrValue.target) {
        return eOrValue.target.value;
    }
    return eOrValue ?? "";
    };

    const safeText = (v) => {
    if (v === 0) return "0";
    const s = String(v ?? "").trim();
    return s || "--";
    };

    return (
  <div className="ishn-content">
    {/* Carga */}
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      open={open}
      onClick={handleClose}
    >
      <CircularProgress color="inherit" />
    </Backdrop>

    {filteredIshikawas.map((ishikawa, idx) => {
      const participantes = parseParticipantes(ishikawa.participantes);

      return (
        <div key={ishikawa._id || idx} className="ishn-edit">
          {/* Badge estado */}
          {ishikawa.estado === "Asignado" && (
            <div className="ishr-statusBadge">En proceso...</div>
          )}

          <form onSubmit={(event) => Finalizar(event, selectedIndex)}>
            {/* =================== ACTION BAR =================== */}
            <Stack
              className="ishn-actions"
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              {/* Estado */}
              <Box sx={{ flexGrow: 1, minWidth: 280 }}>
                <Typography variant="subtitle2" color="white" sx={{ mb: 0.5 }}>
                  Cambiar estado de Ishikawa:
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <FormControl
                    variant="filled"
                    size="small"
                    sx={{ minWidth: 190, bgcolor: "background.paper", borderRadius: 1 }}
                  >
                    <InputLabel id="estado-select-label">Seleccione</InputLabel>
                    <Select
                      labelId="estado-select-label"
                      id="estado-select"
                      value={selectedOption}
                      onChange={handleSelectChangeEstado}
                      sx={{ bgcolor: "background.paper" }}
                    >
                      <MenuItem value="Rechazado">Regresar al Auditado</MenuItem>
                      <MenuItem value="Aprobado">Marcar como “Aprobado”</MenuItem>
                      <MenuItem value="Revisado">Marcar como “Revisado”</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    disabled={!selectedOption}
                    onClick={() => CambiarEstado(ishikawa._id)}
                  >
                    Cambiar
                  </Button>
                </Stack>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,.25)" }} />

              {/* Reasignación + PDF + acciones */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Autocomplete
                    sx={{ minWidth: 240, bgcolor: "background.paper", borderRadius: 1 }}
                    options={opcionesUsuarios}
                    getOptionLabel={(opt) => opt.label}
                    value={valorSeleccionado ? { label: valorSeleccionado, correo: CorreoSeleccionado } : null}
                    onChange={(e, option) => {
                      if (option) {
                        setValorSeleccionado(option.label);
                        setCorreoSeleccionado(option.correo);
                      } else {
                        setValorSeleccionado("");
                        setCorreoSeleccionado("");
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Reasignar a" variant="filled" size="small" />
                    )}
                  />

                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ color: "white", borderColor: "rgba(255,255,255,.45)" }}
                    disabled={!valorSeleccionado}
                    onClick={() => {
                      const { _id: registroId } = rechazo[0] || {};
                      if (registroId) handleReasignar(registroId);
                      else Asignar();
                    }}
                  >
                    Reasignar
                  </Button>
                </Box>

                {/* PDF siempre visible */}
                <IshPDF
                  ref={pdfRef}
                  ishikawa={ishikawa}
                  programa={programa}
                  id={id}
                  download={true}
                  participantesC={participantes}
                />

                {ishikawa.estado === "En revisión" && (
                  <>
                    <Button
                      variant="text"
                      sx={{ color: "white" }}
                      startIcon={<ThumbDownIcon sx={{ color: (t) => t.palette.error.main }} />}
                      onClick={Rechazar}
                    >
                      Rechazar
                    </Button>

                    <Button
                      variant="text"
                      sx={{ color: "white" }}
                      startIcon={<ThumbUpIcon sx={{ color: (t) => t.palette.success.main }} />}
                      onClick={Aprobar}
                    >
                      Aprobar
                    </Button>
                  </>
                )}

                {ishikawa.estado === "Aprobado" && (
                  <>
                    <Button
                      variant="text"
                      sx={{ color: "white" }}
                      startIcon={<SaveIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        handleGuardarCambios2(selectedIndex);
                      }}
                    >
                      Guardar
                    </Button>

                    <Button
                      variant="text"
                      sx={{ color: "white" }}
                      type="submit"
                      endIcon={<DoneIcon />}
                    >
                      Finalizar
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>

            {/* =================== ALERTS =================== */}
            {ishikawa.estado === "En revisión" && (
              <Alert severity="info" sx={{ my: 2 }}>
                <AlertTitle>En estado de revisión</AlertTitle>
                Revise el diagrama enviado por <strong>{ishikawa.auditado}</strong> y haga clic en “Aprobar” o “Rechazar”.
              </Alert>
            )}

            {ishikawa.estado === "Rechazado" && (
              <Alert severity="error" sx={{ my: 2 }}>
                <AlertTitle>Estado: Rechazado</AlertTitle>
                Motivo: <strong>{ishikawa.notaRechazo}</strong>
              </Alert>
            )}

            {ishikawa.estado === "Aprobado" && (
              <Alert severity="success" sx={{ my: 2 }}>
                <AlertTitle>Estado: Aprobado</AlertTitle>
                Puede cargar evidencias y finalizar.
              </Alert>
            )}

            {ishikawa.estado === "Revisado" && (
              <Alert severity="info" sx={{ my: 2 }}>
                <AlertTitle>Estado: Finalizado</AlertTitle>
                El proceso ha sido finalizado. Ya no se permiten modificaciones.
              </Alert>
            )}

            {/* =================== PART 1 =================== */}
            <div id="pdf-content-part1" className="ishn-card">
              <h1>Ishikawa</h1>

              <div className="ishn-info">
                <h2>
                    Problema:
                </h2>
                    <span className="ishr-readonlyBlock">
                    {safeText(ishikawa.problema)}
                    </span>
                <h2>
                    Afectación:
                </h2>
                    <span className="ishr-readonlyBlock">
                    {safeText(`${id || ""} ${programa?.Nombre || ""}`.trim())}
                    </span>
                
                </div>

                <div className="ishn-meta">
                <h3>GCF015</h3>
                <h3>
                    Fecha: <span className="ishr-metaValue">{formatDateCell(ishikawa.fecha)}</span>
                </h3>
                </div>


              <div className="ishn-diagramWrap">
                <NewIshikawaFin
                  key={id}
                  diagrama={ishikawa.diagrama}
                  problema={ishikawa.problema}
                  causa={ishikawa.causa}
                  ID={id}
                />
              </div>

              <div className="ishn-people">
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {participantes.length ? (
                    participantes.map((p, i) => (
                      <Chip key={`${p}-${i}`} label={p} size="small" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin participantes
                    </Typography>
                  )}
                </Stack>
              </div>
            </div>

            {/* =================== PART 2 =================== */}
            <div id="pdf-content-part2" className="ishn-card">
                <div className="ishn-textBlock">
                    <h3>No conformidad:</h3>
                    <div className="ishr-readonlyBlock">
                        {safeText(ishikawa.requisito)}
                    </div>

                    <h3>Hallazgo:</h3>
                    <div className="ishr-readonlyBlock">
                        {safeText(ishikawa.hallazgo)}
                    </div>

                    <h3>Acción inmediata o corrección:</h3>
                    <div className="ishr-readonlyBlock">
                        {safeText(ishikawa.correccion)}
                    </div>

                    <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                    <div className="ishr-readonlyBlock">
                        {safeText(ishikawa.causa)}
                    </div>
                    </div>
            </div>

            {/* =================== PART 3 =================== */}
            <div id="pdf-content-part3" className="ishn-card">
              <div className="ishn-tableWrap ishr-tableWide">
                <h3>SOLUCIÓN</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Responsable</th>
                      <th>Fecha Compromiso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ishikawa.actividades || []).map((actividad, i) => (
                      <tr key={actividad._id || i}>
                        <td style={{ textAlign: "left" }}>{actividad.actividad || "--"}</td>

                        <td style={{ textAlign: "left" }}>
                          {formatResponsables(actividad.responsable)}
                        </td>

                        <td>
                          <div className="ishr-fechaCell">
                            <select
                              className="ishr-select"
                              onChange={(e) => handleSelectChange(e, i)}
                              style={{ color: colores[i % colores.length] }}
                            >
                              {(actividad.fechaCompromiso || [])
                                .slice()
                                .reverse()
                                .map((fecha, index) => (
                                  <option
                                    key={index}
                                    style={{
                                      color: colores[(actividad.fechaCompromiso.length - 1 - index) % colores.length],
                                    }}
                                  >
                                    {fecha}
                                  </option>
                                ))}
                            </select>

                            {/* Reprogramación */}
                            <div className="ishr-reproWrap">
                              {aprobado && activeReprogramarId === actividad._id && (
                                <>
                                  <input
                                    type="date"
                                    onChange={(e) => handleTempFechaChange(e.target.value)}
                                    className="ishr-dateInput"
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="ishr-smallBtn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleUpdateFechaCompromiso(ishikawa._id, actividad._id, i); // ✅ i
                                    }}
                                  >
                                    Reprogramar
                                  </button>
                                </>
                              )}

                              {aprobado && (
                                <button
                                  type="button"
                                  className="ishr-smallBtn ishr-smallBtnOutline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setActiveReprogramarId(activeReprogramarId === actividad._id ? null : actividad._id);
                                  }}
                                >
                                  {activeReprogramarId === actividad._id ? "Cancelar" : "Reprogramar"}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* EFECTIVIDAD */}
                {(!aprobado && !revisado) ? null : (
                  <>
                    <h3 style={{ marginTop: 14 }}>EFECTIVIDAD</h3>

                    <table className="ishr-efectividadTable">
                      <thead>
                        <tr>
                          <th>Actividad</th>
                          <th>Responsable</th>
                          <th>Fecha Verificación</th>
                          <th>Sí</th>
                          <th>No</th>
                          <th style={{ minWidth: 220 }}>Evidencia</th>
                        </tr>
                      </thead>

                      <tbody>
                        {correcciones.map((correccion, index) => {
                          const fieldKey = `${ishikawa._id}_${index}`;
                          const evidenciasGuardadas = normalizeEvidenciaArr(correccion.evidencia);
                          const evidenciasPendientes = capturedPhotos[fieldKey] || [];


                          return (
                            <tr key={correccion._id || index} onClick={() => setSelectedIndex(index)}>
                              <td>
                                <AutoGrowTextarea
                                value={correccion.actividad}
                                onChange={(e) => handleCorreccionChange(index, "actividad", pickValue(e))}
                                className="ishn-tableInput ishr-autogrowCell"
                                disabled={!canEditEfectividad}
                                placeholder="Actividad…"
                                required
                                />
                              </td>

                              <td>
                                <AutoGrowTextarea
                                value={correccion.responsable}
                                onChange={(e) => handleCorreccionChange(index, "responsable", pickValue(e))}
                                className="ishn-tableInput ishr-autogrowCell"
                                disabled={!canEditEfectividad}
                                placeholder="Responsable…"
                                required
                                />

                              </td>

                              <td>
                                <input
                                  type="date"
                                  value={correccion.fechaCompromiso || ""}
                                  onChange={(e) => handleCorreccionChange(index, "fechaCompromiso", e.target.value)}
                                  className="ishr-dateInput"
                                  disabled={!canEditEfectividad}
                                  required
                                />
                              </td>

                              <td>
                                <input
                                  type="checkbox"
                                  checked={correccion.cerrada === "Sí"}
                                  onChange={(e) => handleCorreccionChange(index, "cerrada", e.target.checked)}
                                  disabled={!canEditEfectividad}
                                />
                              </td>

                              <td>
                                <input
                                  type="checkbox"
                                  checked={correccion.cerrada === "No"}
                                  onChange={(e) => handleCorreccionChange(index, "cerradaNo", e.target.checked)}
                                  disabled={!canEditEfectividad}
                                />
                              </td>

                              <td>
                                <div className="ishr-evidenceCell">
                                    {aprobado && (
                                    <div className="ishr-evidenceActions">
                                        <button
                                        type="button"
                                        className="ishr-iconBtn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleOpenModal(fieldKey);
                                        }}
                                        title="Tomar foto"
                                        >
                                        📷
                                        </button>

                                        <button
                                        type="button"
                                        className="ishr-iconBtn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleUploadFile(fieldKey);
                                        }}
                                        title="Subir PDF"
                                        >
                                        <UploadFileIcon fontSize="small" />
                                        </button>
                                    </div>
                                    )}

                                    {/* ✅ Evidencias ya guardadas */}
                                    <div className="ishr-evidenceList">
                                    {evidenciasGuardadas.map((evStr, evIndex) => {
                                        const ev = parseEvidencia(evStr);
                                        if (ev.kind === "none") return null;

                                        const openZoom = (url) => {
                                        setSelectedEvMeta({ kind: "saved", rowIndex: index, evIndex, fieldKey });
                                        setSelectedImage(url);
                                        setImageModalOpen(true);
                                        };

                                        return (
                                        <div key={`saved-${evIndex}`} className="ishr-evidenceItem">
                                            {ev.kind === "pdf" ? (
                                            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="ishr-pdfLink" title={ev.name}>
                                                <PictureAsPdfIcon sx={{ color: "red" }} />
                                                <span>{ev.name}</span>
                                            </a>
                                            ) : (
                                            <img
                                                src={ev.url}
                                                alt="Evidencia"
                                                className="ishr-evidenceImg"
                                                onClick={() => openZoom(ev.url)}
                                            />
                                            )}

                                            {aprobado && (
                                            <button
                                                type="button"
                                                className="ishr-miniDanger"
                                                onClick={(e) => {
                                                e.preventDefault();
                                                EliminarEv(index, ishikawa._id, correccion._id, evIndex); // ✅ ahora con evIndex
                                                }}
                                                title="Eliminar evidencia"
                                            >
                                                ✕
                                            </button>
                                            )}
                                        </div>
                                        );
                                    })}
                                    </div>

                                    {/* ✅ Evidencias pendientes (aún no subidas) */}
                                    <div className="ishr-evidenceList">
                                    {evidenciasPendientes.map((file, pIndex) => {
                                        const isPdf = file.type === "application/pdf";
                                        const previewUrl = URL.createObjectURL(file);

                                        const openZoom = () => {
                                        setSelectedEvMeta({ kind: "pending", rowIndex: index, evIndex: pIndex, fieldKey });
                                        setSelectedImage(previewUrl);
                                        setImageModalOpen(true);
                                        };

                                        return (
                                        <div key={`pending-${pIndex}`} className="ishr-evidenceItem">
                                            {isPdf ? (
                                            <a className="ishr-pdfLink" href={previewUrl} target="_blank" rel="noopener noreferrer">
                                                <PictureAsPdfIcon sx={{ color: "red" }} />
                                                <span>{file.name || "Ver PDF"}</span>
                                            </a>
                                            ) : (
                                            <img className="ishr-evidenceImg" src={previewUrl} alt="Pendiente" onClick={openZoom} />
                                            )}

                                            {aprobado && (
                                            <button
                                                type="button"
                                                className="ishr-miniDanger"
                                                onClick={(e) => {
                                                e.preventDefault();
                                                // quitar pendiente local
                                                setCapturedPhotos((prev) => {
                                                    const arr = [...(prev[fieldKey] || [])];
                                                    arr.splice(pIndex, 1);
                                                    return { ...prev, [fieldKey]: arr };
                                                });
                                                }}
                                                title="Quitar evidencia pendiente"
                                            >
                                                ✕
                                            </button>
                                            )}
                                        </div>
                                        );
                                    })}
                                    </div>
                                </div>
                                </td>

                              
                                {aprobado && index > 0 && (
                                  <button
                                    type="button"
                                    className="ishr-dangerBtn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleEliminarFila(index);
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {aprobado && (
                      <button
                        type="button"
                        className="ishn-addRowBtn"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAgregarFila();
                        }}
                      >
                        Agregar Fila
                      </button>
                    )}

                    <Fotos open={modalOpen} onClose={() => setModalOpen(false)} onCapture={handleCapture} />

                    {/* Modal zoom */}
                    {imageModalOpen && (
                      <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                          <img src={selectedImage} alt="Ampliada" className="modal-image" />
                          <button
                            className="ishr-dangerBtn"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!selectedEvMeta) return;

                                if (selectedEvMeta.kind === "saved") {
                                EliminarEv(
                                    selectedEvMeta.rowIndex,
                                    ishikawa._id,
                                    correcciones[selectedEvMeta.rowIndex]?._id,
                                    selectedEvMeta.evIndex
                                );
                                } else {
                                // pending local
                                const fk = selectedEvMeta.fieldKey;
                                const pIndex = selectedEvMeta.evIndex;
                                setCapturedPhotos((prev) => {
                                    const arr = [...(prev[fk] || [])];
                                    arr.splice(pIndex, 1);
                                    return { ...prev, [fk]: arr };
                                });
                                closeModal();
                                }
                            }}
                            >
                            Eliminar Evidencia
                            </button>

                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      );
    })}

    {/* =================== EMPTY / ASSIGN =================== */}
    {(ishikawas.length === 0 || mensaje) && (
      <div className="ishn-card">
        <div className="ishr-emptyState">
          <div className="ishr-assignBox">
            {rechazo.map((ish, i) => (
              <div key={ish._id || i} className="ishr-assignHint">
                Asignado: <strong>{ish.auditado}</strong>
              </div>
            ))}

            <select onChange={handleSelectChangeAud} value={valorSeleccionado} className="ishr-select">
              <option value="">Seleccione...</option>
              {usuarios?.map((u) => (
                <option
                  key={u._id}
                  value={JSON.stringify({ nombre: u.Nombre, correo: u.Correo })}
                >
                  {u.Nombre}
                </option>
              ))}
            </select>

            {valorSeleccionado && (
              <div className="ishr-picked">
                {valorSeleccionado}
              </div>
            )}

            <button type="button" className="ishr-smallBtn" onClick={Asignar}>
              Asignar
            </button>
          </div>

          <div className="ishr-emptyMsg">
            <div>{mensaje}</div>
            <div style={{ fontSize: 56 }}>🏝️</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

};

export default IshikawaRev;