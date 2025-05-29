import React, { useEffect, useState,useCallback,useContext, useRef } from 'react';
import Logo from "../assets/img/logoAguida.png";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import withReactContent from 'sweetalert2-react-content';
import Fotos from './Foto'; 
import './css/Modal.css';
import './css/IshikawaRev.css';
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
  Button, Alert,AlertTitle
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
    const [activeReprogramarId, setActiveReprogramarId] = useState(null);
    const [showNotaRechazo] = useState(false);
    const [tempFechaCompromiso, setTempFechaCompromiso] = useState('');
    const [actividades] = useState([{ actividad: '', responsable: [], fechaCompromiso: [] }]);
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

    const [open, setOpen] = React.useState(false);
    const handleClose = () => {
    setOpen(false);
  };

    const handleOpen = () => {
    setOpen(true);
  };

    const fetchData = useCallback(async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
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
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos/datos-filtrados`, {
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
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => ajustarTamanoFuente(textarea));
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
            const dataToSend = correccionesActualizadas.map((correccion) => ({
                actividad: correccion.actividad || '',
                responsable: correccion.responsable || '',
                fechaCompromiso: correccion.fechaCompromiso || null,
                cerrada: correccion.cerrada || '',
                evidencia: correccion.evidencia || '', // Incluye la URL de la imagen
            }));
    
            // Realiza la solicitud PUT al backend con los datos optimizados
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, dataToSend, {
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
                    evidencia: correccion.evidencia || '',
                })),
                estado: 'Revisado',
            };
    
            // Realiza la solicitud PUT al backend con los datos optimizados
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/fin/${_id}`, dataToSend, {
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

    await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${registroId}`,
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
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
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
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/ishikawa/fecha/${ishikawaId}`,
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
};

const handleCapture = (file) => {
    if (selectedField) {
        setCapturedPhotos(prev => ({
            ...prev,
            [selectedField]: file
        }));
    }
    setModalOpen(false);
};

const handleUploadFile = (fieldKey) => {
    // Crear un input temporal para seleccionar archivos
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf'; // Limitar a archivos PDF
    input.style.display = 'none';

    // Escuchar el cambio en el input (cuando se selecciona un archivo)
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleCapture(file); // Llama a tu función `handleCapture` con el archivo
            setCapturedPhotos((prev) => ({
                ...prev,
                [fieldKey]: file, // Actualiza el estado con el archivo seleccionado
            }));
        }
    };

    // Simula el clic en el input
    document.body.appendChild(input);
    input.click();

    document.body.removeChild(input);
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
        <div className='content-diagrama'>
           
            <div>
            {/*Carga*/}
            <Backdrop
                sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
                open={open}
                onClick={handleClose}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

                {filteredIshikawas.map((ishikawa, index) => (
                <div key={index}>
                     {ishikawa.estado === 'Asignado' && (
                            <div className="en-proceso">
                                En proceso.....
                            </div>
                        )}

                    {ishikawa.estado === 'En revisión' && (
                        <>
                            {showNotaRechazo && (
                                <div className="nota-rechazo-container" style={{zIndex: "10"}}>
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
                        </> 
                    )}

                    <form onSubmit={(event) => Finalizar(event, selectedIndex)}>

                     <Stack
                        className="acciones-ish-container"
                        direction="row"
                        spacing={3}
                        alignItems="center"
                        width="96%"
                        >
                        {/* Zona de cambio de estado */}
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" color="white" gutterBottom>
                            Cambiar estado de Ishikawa:
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                            <FormControl variant="filled" size="small" sx={{ minWidth: 160,  bgcolor: 'background.paper'  }}>
                                <InputLabel id="estado-select-label"
                                >Seleccione</InputLabel>
                                <Select
                                labelId="estado-select-label"
                                id="estado-select"
                                name="estado"
                                value={selectedOption}
                                label="Seleccione"
                                onChange={handleSelectChangeEstado}
                                sx={{ bgcolor: 'background.paper' }}
                                >
                                <MenuItem value="Rechazado">Regresar al Auditado</MenuItem>
                                <MenuItem value="Aprobado">Marcar como “Aprobado”</MenuItem>
                                <MenuItem value="Revisado">Marcar como “Revisado”</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                color="primary"
                                disabled={!selectedOption}
                                onClick={() => CambiarEstado(ishikawa._id)}
                            >
                                Cambiar
                            </Button>
                           
                            </Stack>
                        </Box>

                        {/* Separador */}
                        <Divider orientation="vertical" flexItem sx={{ borderColor: 'grey.700' }} />

                        {/* Botones de acción */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* Siempre muestro el botón de PDF */}
                             <IshPDF
                                ref={pdfRef}    
                                ishikawa={ishikawa}
                                programa={programa}
                                id={id}
                                logo={Logo}
                                download={true}
                                participantesC={
                                    ishikawa.participantes
                                    .split('/')
                                    .map(p => p.trim())
                                }
                                />

                            {ishikawa.estado === 'En revisión' && (
                                <>
                                <Button
                                    variant="text"
                                    sx={{ color: 'white' }}
                                    startIcon={<ThumbDownIcon sx={{ color: theme => theme.palette.error.main }} />}
                                    onClick={Rechazar}
                                >
                                    Rechazar
                                </Button>

                                <Button
                                    variant="text"
                                    sx={{ color: 'white' }}
                                    startIcon={<ThumbUpIcon sx={{ color: theme => theme.palette.success.main }} />}
                                    onClick={Aprobar}
                                >
                                    Aprobar
                                </Button>
                                </>
                            )}

                            {ishikawa.estado === 'Aprobado' && (
                                <>
                                <Button
                                    variant="text"
                                    sx={{ color: 'white' }}
                                    startIcon={<SaveIcon />}
                                    onClick={(e) => {e.preventDefault(); handleGuardarCambios2(selectedIndex);} }
                                    >
                                    Guardar
                                </Button>

                                <Button
                                variant="text"
                                sx={{ color: 'white' }}
                                type="submit"
                                endIcon={<DoneIcon />}
                                >
                                Finalizar
                                </Button>
                                </>
                            )}

                            </Stack>

                        </Stack>

                        {ishikawa.estado === 'En revisión' && (
                            <Alert severity="info" icon={<span style={{ fontSize: 40 }}>📝</span>} sx={{ my: 2 }}>
                            <AlertTitle>En estado de revisión</AlertTitle>
                                Revise el diagrama enviado por <strong>{ishikawa.auditado}</strong> y haga clic en "Aprobar" o "Rechazar" según corresponda.
                            </Alert>
                        )}

                        {ishikawa.estado === 'Rechazado' && (
                            <Alert severity="error" sx={{ my: 2 }}>
                                <AlertTitle>Estado: Rechazado</AlertTitle>
                                Este diagrama ha sido rechazado debido a: <strong>{ishikawa.notaRechazo}</strong>
                            </Alert>
                        )}

                        {ishikawa.estado === 'Aprobado' && (
                            <Alert severity="success" icon={<span style={{ fontSize: 40 }}>🎉</span>} sx={{ my: 2 }}>
                                <AlertTitle>Estado: Aprobado</AlertTitle>
                                Ha marcado el diagrama como aprobado. Se ha notificado a los participantes mediante correo electrónico.
                            </Alert>
                        )}

                        {ishikawa.estado === 'Revisado' && (
                            <Alert severity="info" sx={{ my: 2 }}>
                                <AlertTitle>Estado: Finalizado</AlertTitle>
                                El proceso ha sido finalizado. Ya no se permiten modificaciones.
                            </Alert>
                        )}

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
                    <div style={{ marginTop: '-1em'}}>
                    <NewIshikawaFin
                        key={id}
                        diagrama={ishikawa.diagrama}
                        problema={ishikawa.problema}
                        causa={ishikawa.causa}
                        ID={id}
                    />
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
                            <td style={{ fontSize: '12px', width: '34em', height: 'auto', textAlign: 'justify' }}>
                            {
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
                                }
                            </td>
                            <td>
                <div className='td-fechas'>
                    <select
                    className="custom-select"
                    onChange={(e) =>
                        handleSelectChange(
                        e,
                        actividad.fechaCompromiso.length - 1 - actividad.fechaCompromiso
                            .slice()
                            .reverse()
                            .findIndex((fecha) => fecha === e.target.value)
                        )
                    }
                    style={{
                        color: colores[actividad.fechaCompromiso.length - 1]
                    }} // Inicializa con el color del primer elemento invertido
                    >
                    {actividad.fechaCompromiso.slice()
                        .reverse()
                        .map((fecha, index) => (
                        <option
                            key={index}
                            className={`option-${index}`}
                            style={{
                            color:
                                colores[(actividad.fechaCompromiso.length - 1 - index) % colores.length]
                            }}
                        >
                            {fecha}
                        </option>
                    ))}
                    </select>
                </div>

                <div className='button-cancel'>
                    {/* Renderiza el input y botón de reprogramación solo en la fila activa */}
                    {aprobado && activeReprogramarId === actividad._id && (
                    <>
                        <input
                        type="date"
                        onChange={(e) => handleTempFechaChange(e.target.value)}
                        required
                        />
                        <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Se pasan ambos id: el del documento Ishikawa y el de la actividad, si es necesario para el front
                                    handleUpdateFechaCompromiso(ishikawa._id, actividad._id, index);
                                }}
                                className='button-new-date'
                                >
                                Reprogramar Fecha
                                </button>

                            </>
                            )}
                            {/* Botón para activar o desactivar el modo de reprogramación en la fila */}
                            {aprobado && (
                            <button
                                className='button-repro'
                                onClick={(e) => {
                                    e.preventDefault();
                                setActiveReprogramarId(
                                    activeReprogramarId === actividad._id ? null : actividad._id
                                );
                                }}
                            >
                                {activeReprogramarId === actividad._id ? 'Cancelar' : 'Reprogramar'}
                            </button>
                            )}
                        </div>
                        </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

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
                        const fieldKey = `${ishikawa._id}_${index}`;

                        console.log('error: ', ishikawa._id)

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
                                <>
                                <div className="button-foto" onClick={(e) => {
                                e.preventDefault();
                                handleOpenModal(fieldKey);
                                }}>
                                <span className="material-symbols-outlined">add_a_photo</span>
                                </div>

                                <div  className="button-foto" onClick={(e) => {
                                    e.preventDefault();
                                    handleUploadFile(fieldKey);
                                    }}>
                                
                                    <UploadFileIcon/>
                                </div>
                                </>
                            )}
                            {correccion.evidencia && (
                                correccion.evidencia.endsWith(".pdf") ? (
                                    <a 
                                        href={correccion.evidencia.split(" || ")[0]} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                    >
                                        <PictureAsPdfIcon sx={{ color: 'red', fontSize: '40px', marginRight: '8px' }} />
                                        {correccion.evidencia.split(" || ")[1].replace(/"/g, '')}
                                    </a>
                                ) : (
                                    <img
                                        src={correccion.evidencia}
                                        alt="Evidencia"
                                        style={{ width: '100%', height: 'auto' }}
                                        className="hallazgo-imagen"
                                        onClick={() => handleImageClick(correccion.evidencia)}
                                    />
                                )
                            )}

                            {capturedPhotos[fieldKey] && (
                                capturedPhotos[fieldKey].type === "application/pdf" ? (
                                    <div>
                                        <a href={URL.createObjectURL(capturedPhotos[fieldKey])} target="_blank" rel="noopener noreferrer">
                                            {capturedPhotos[fieldKey].name || "Ver PDF"}
                                        </a>
                                    </div>
                                ) : (
                                    <div>
                                        <img
                                            src={URL.createObjectURL(capturedPhotos[fieldKey])} // Genera una URL temporal para vista previa
                                            alt="Captura"
                                            style={{ width: '100%', height: 'auto' }}
                                            onClick={() => handleImageClick(URL.createObjectURL(capturedPhotos[fieldKey]))}
                                        />
                                    </div>
                                )
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
                    
                    <Fotos open={modalOpen} onClose={() => setModalOpen(false)} onCapture={handleCapture} />
                    </div>
                    </div> 
                    </form>
                </div>
                ))}
            </div>
            {(ishikawas.length === 0 || mensaje) && <div className="mensaje-error">
                <div className='select-ish-rev'>
                {rechazo.map((ishikawa, asig) => (
                    <div key={asig}>
                         <div className='asignado-ishi'>Asignado: {ishikawa.auditado}</div>
                    </div>
                ))}
                <select onChange={handleSelectChangeAud} value={valorSeleccionado}>
                <option value="">Seleccione...</option>
                {usuarios && usuarios.map(usuario => (
                <option key={usuario._id}
                value={JSON.stringify({ nombre: usuario.Nombre, correo: usuario.Correo })}>{usuario.Nombre}</option>
                    ))}
                </select>
                {valorSeleccionado && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                        <h6>{valorSeleccionado}</h6>
                    </div>
                )}

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