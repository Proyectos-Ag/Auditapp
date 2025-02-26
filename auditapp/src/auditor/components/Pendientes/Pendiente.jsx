import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../../App';
import logo from "../assets/img/logoAguida.png";
import './css/pendiente.css';
import './css/Modal.css';
import Fotos from './Foto'; 
import Swal from 'sweetalert2';
import { storage } from '../../../firebase';
import {ref, uploadBytes, getDownloadURL, deleteObject} from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const Pendientes = () => {
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [hiddenDurations, setHiddenDurations] = useState([]);
    const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
    const [percentages, setPercentages] = useState({});
    const [modalOpen, setModalOpen] = useState(false); 
    const [selectedField, setSelectedField] = useState(null); 
    const [capturedPhotos, setCapturedPhotos] = useState({}); 
    const [open, setOpen] = React.useState(false);

    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [selectedImageDocId, setSelectedImageDocId] = useState(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);


    const handleClose = () => {
        setOpen(false);
      };
    
        const handleOpen = () => {
        setOpen(true);
      };

    const checkboxValues = {
        'Conforme': 1,
        'm': 0.7,
        'M': 0.3,
        'C': 0,
        'NA': null
    };

    useEffect(() => {
        const obtenerFechaInicio = (duracion) => {
            const partes = duracion.split(" ");

            let diaInicio = 1;
            let mesInicio = 0;
            let anoInicio = new Date().getFullYear();

            for (const parte of partes) {
                const numero = parseInt(parte);
                if (!isNaN(numero)) {
                    diaInicio = numero;
                } else if (parte.length === 4 && !isNaN(parseInt(parte))) {
                    anoInicio = parseInt(parte);
                } else {
                    mesInicio = obtenerNumeroMes(parte);
                    if (mesInicio !== -1) break;
                }
            }

            return new Date(anoInicio, mesInicio, diaInicio);
        };

    const obtenerDatos = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
            if (userData && userData.Correo) {
                const datosFiltrados = response.data.filter((dato) => 
                    (dato.AuditorLiderEmail === userData.Correo || 
                    (dato.EquipoAuditor.length > 0 && dato.EquipoAuditor.some(auditor => auditor.Correo === userData.Correo))) &&
                    (dato.Estado === "pendiente" || dato.Estado === "Devuelto")
                );
        
                    datosFiltrados.sort((a, b) => {
                        const fechaInicioA = obtenerFechaInicio(a.Duracion);
                        const fechaInicioB = obtenerFechaInicio(b.Duracion);
                        if (fechaInicioA < fechaInicioB) return -1;
                        if (fechaInicioA > fechaInicioB) return 1;
                        return 0;
                    });
        
                    setDatos(datosFiltrados);
                    
                    // Set initial state for checkboxes and percentages
                    const initialCheckboxes = {};
                const initialPercentages = {};
                const checkboxValues = {
                    'Conforme': 1,
                    'm': 0.7,
                    'M': 0.3,
                    'C': 0,
                    'NA': null
                };

        datosFiltrados.forEach((dato, periodIdx) => {
            dato.Programa.forEach((programa, programIdx) => {
                const programKey = `${periodIdx}_${programIdx}`;

                let totalValue = 0;
                let validPrograms = 0;

        programa.Descripcion.forEach((desc, descIdx) => {
            const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
            initialCheckboxes[fieldKey] = desc.Criterio;

            const value = checkboxValues[desc.Criterio];
            if (value !== null) {
                totalValue += value;
                validPrograms++;
            }
        });

        // Calcula el porcentaje para el programa
        const percentage = validPrograms > 0 ? (totalValue / validPrograms) * 100 : 0;
        console.log('Esto de qui',validPrograms);
        console.log('Esto otro de aqui',totalValue);
        initialPercentages[programKey] = percentage;
    });
});

setSelectedCheckboxes(initialCheckboxes);
setPercentages(initialPercentages);
        
                } else {
                    console.log('userData o userData.Correo no definidos:', userData);
                }
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        };        

        obtenerDatos();
    }, [userData]);

    // Función para obtener el número del mes a partir de su nombre
    const obtenerNumeroMes = (nombreMes) => {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return meses.indexOf(nombreMes.toLowerCase());
    };

    const handleImageClick = (imageSrc, index, docId) => {
        setSelectedImage(imageSrc);
        setSelectedImageIndex(index);
        setSelectedImageDocId(docId);
        setImageModalOpen(true);
        console.log('Imagen seleccionada:', imageSrc, index, docId);
    };    

    const closeModal = () => {
        setImageModalOpen(false);
        setSelectedImage(null);
    };

    const toggleDuration = (duration) => {
        setHiddenDurations(hiddenDurations.includes(duration) ?
            hiddenDurations.filter((dur) => dur !== duration) :
            [...hiddenDurations, duration]
        );
    };   
    
    const handleCheckboxChange = (periodIdx, programIdx, descIdx, checkboxName) => {
        const key = `${periodIdx}_${programIdx}_${descIdx}`;
        setSelectedCheckboxes(prevState => {
            const updated = { ...prevState, [key]: checkboxName };
    
            // Actualizar el porcentaje
            const programKey = `${periodIdx}_${programIdx}`;
            const relevantCheckboxes = Object.keys(updated).filter(k => k.startsWith(`${periodIdx}_${programIdx}_`));
            let totalValue = 0;
            let validPrograms = 0;
    
            relevantCheckboxes.forEach(k => {
                const value = checkboxValues[updated[k]];
                if (value !== null) {
                    totalValue += value;
                    validPrograms++;
                }
            });
    
            const percentage = validPrograms > 0 ? (totalValue / validPrograms) * 100 : 0;
    
            setPercentages(prevPercentages => ({
                ...prevPercentages,
                [programKey]: percentage
            }));
    
            return updated;
        });
    };    
        
    const handleOpenModal = (fieldKey) => {
        setSelectedField(fieldKey);
        setModalOpen(true);
    };

    const handleCapture = (file) => {
        if (selectedField) {
          // Generar el identificador para la fila basado en el `selectedField`
          const rowIdentifier = selectedField; // Ejemplo: "0_0", "0_1", etc.
          
          setCapturedPhotos((prev) => {
            const updatedPhotos = { ...prev };
      
            if (updatedPhotos[rowIdentifier]) {
              // Si ya tiene 4 fotos, mostramos una alerta y no actualizamos el estado
              if (updatedPhotos[rowIdentifier].length < 4) {
                updatedPhotos[rowIdentifier] = [...updatedPhotos[rowIdentifier], file];
              } else {
                alert("Ya hay 4 fotos, no se puede agregar más.");
                return prev; // Retornamos el estado anterior sin modificaciones
              }
            } else {
              // Si no hay fotos en la fila, la inicializamos con la nueva foto
              updatedPhotos[rowIdentifier] = [file];
            }
      
            return updatedPhotos;
          });
        }
        setModalOpen(false); // Cierra el modal
        console.log("Foto Seleccionada", selectedField);
      };       

    const navigate = useNavigate();

    const handleUpdatePeriod = async (periodIdx, id) => {
        if (!areAllCheckboxesFilled(periodIdx)) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Todos los checkboxes deben estar llenos antes de generar el reporte.',
            });
            return;
        }
    
        try {
            let totalPorcentage = 0;
            const numPrograms = datos[periodIdx].Programa.length;
    
            for (let programIdx = 0; programIdx < numPrograms; programIdx++) {
                const programa = datos[periodIdx].Programa[programIdx];
    
                const observaciones = await Promise.all(
                    programa.Descripcion.map(async (desc, descIdx) => {
                        const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                        const updatedObservation = { ...desc };
                        const files = capturedPhotos[fieldKey] || [];
                
                        if (files.length > 0) {
                            try {
                                // Subir todas las imágenes asociadas al fieldKey
                                const fileUrls = await Promise.all(
                                    files.map(async (file, index) => {
                                        const fileName = `evidencia_${id}_${periodIdx}_${programIdx}_${descIdx}_${index}`;
                                        return await uploadImageToFirebase(file, fileName);
                                    })
                                );
                
                                // Asignar las URLs al campo Hallazgo como un array
                                updatedObservation.Hallazgo = fileUrls;
                            } catch (error) {
                                console.error(`Error al subir las imágenes para ${fieldKey}:`, error);
                            }
                        } else {
                            // Mantener el hallazgo existente si no hay imágenes nuevas
                            updatedObservation.Hallazgo = Array.isArray(desc.Hallazgo) ? desc.Hallazgo : [];
                        }
                
                        return {
                            ID: desc.ID,
                            Criterio: selectedCheckboxes[fieldKey] || '',
                            Observacion: document.querySelector(`textarea[name=Observaciones_${periodIdx}_${programIdx}_${descIdx}]`).value,
                            Problema: document.querySelector(`textarea[name=Problemas_${periodIdx}_${programIdx}_${descIdx}]`).value || desc.Problema,
                            Hallazgo: updatedObservation.Hallazgo,
                        };
                    })
                );                
    
                const percentage = percentages[`${periodIdx}_${programIdx}`] || 0;
                totalPorcentage += percentage;
    
                try {
                    // Enviar los datos actualizados para el programa específico
                    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
                        programIdx,
                        observaciones,
                        percentage,
                    });
                } catch (error) {
                    console.error('Error al actualizar los datos:', error);
                    alert('Error al actualizar los datos');
                    
                    return;
                }
            }
    
            const totalPorcentageAvg = (totalPorcentage / numPrograms).toFixed(2);
            try {
                // Actualizar porcentaje total
                await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
                    PorcentajeTotal: totalPorcentageAvg,
                    Estado: 'Realizado',
                    usuario: userData.Nombre
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Reporte generado',
                    text: 'El reporte se generó exitosamente',
                });
                navigate('/reporte');
            } catch (error) {
                console.error('Error al actualizar el porcentaje total:', error);
                alert('Error al actualizar el porcentaje total');
            }
        } catch (error) {
            console.error('Error en handleUpdatePeriod:', error);
        }
    };      
    
    const handleGuardarCamb = async (periodIdx, id) => {
        handleOpen();
        try {
            let totalPorcentage = 0;
            const numPrograms = datos[periodIdx].Programa.length;
    
            for (let programIdx = 0; programIdx < numPrograms; programIdx++) {
                const programa = datos[periodIdx].Programa[programIdx];
    
                const observaciones = await Promise.all(
                    programa.Descripcion.map(async (desc, descIdx) => {
                        const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                        const updatedObservation = { ...desc };
                        const files = capturedPhotos[fieldKey] || [];
                
                        if (files.length > 0) {
                            try {
                                // Subir todas las imágenes asociadas al fieldKey
                                const fileUrls = await Promise.all(
                                    files.map(async (file, index) => {
                                        const fileName = `evidencia_${id}_${periodIdx}_${programIdx}_${descIdx}_${index}`;
                                        return await uploadImageToFirebase(file, fileName);
                                    })
                                );
                
                                // Asignar las URLs al campo Hallazgo como un array
                                updatedObservation.Hallazgo = fileUrls;
                            } catch (error) {
                                console.error(`Error al subir las imágenes para ${fieldKey}:`, error);
                            }
                        } else {
                            // Mantener el hallazgo existente si no hay imágenes nuevas
                            updatedObservation.Hallazgo = Array.isArray(desc.Hallazgo) ? desc.Hallazgo : [];
                        }
                
                        return {
                            ID: desc.ID,
                            Criterio: selectedCheckboxes[fieldKey] || '',
                            Observacion: document.querySelector(`textarea[name=Observaciones_${periodIdx}_${programIdx}_${descIdx}]`).value,
                            Problema: document.querySelector(`textarea[name=Problemas_${periodIdx}_${programIdx}_${descIdx}]`).value || desc.Problema,
                            Hallazgo: updatedObservation.Hallazgo,
                        };
                    })
                );                
    
                const percentage = percentages[`${periodIdx}_${programIdx}`] || 0;
                totalPorcentage += percentage;
    
                try {
                    // Enviar los datos actualizados para el programa específico
                    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
                        programIdx,
                        observaciones,
                        percentage,
                    });
                } catch (error) {
                    console.error('Error al actualizar los datos:', error);
                    alert('Error al actualizar los datos');
                    
                    return;
                }
            }
    
            const totalPorcentageAvg = (totalPorcentage / numPrograms).toFixed(2);
            try {
                // Actualizar porcentaje total
                await axios.put(`${process.env.REACT_APP_BACKEND_URL}/datos/${datos[periodIdx]._id}`, {
                    PorcentajeTotal: totalPorcentageAvg,
                    Estado: 'pendiente',
                });
                handleClose();
                Swal.fire({
                    icon: 'success',
                    title: 'Cambios Guardados',
                    text: 'El checklist se ha guardado',
                });
            } catch (error) {
                handleClose();
                console.error('Error al actualizar el porcentaje total:', error);
                alert('Error al actualizar el porcentaje total');
            }
        } catch (error) {
            console.error('Error en handleGuardarCamb:', error);
        }
    };
    
    // Función para subir imágenes a Firebase
    const uploadImageToFirebase = async (file, fileName) => {
        try {
            if (!(file instanceof File)) {
                throw new Error('El objeto recibido no es un archivo válido');
            }
    
            const storageRef = ref(storage, `files/${fileName}`);
            await uploadBytes(storageRef, file); // Subir archivo
            return await getDownloadURL(storageRef); // Obtener URL
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            throw new Error('No se pudo subir la imagen');
        }
    };     
    
    const areAllCheckboxesFilled = (periodIdx) => {
        const numPrograms = datos[periodIdx].Programa.length;
    
        for (let programIdx = 0; programIdx < numPrograms; programIdx++) {
            const programa = datos[periodIdx].Programa[programIdx];
            for (let descIdx = 0; descIdx < programa.Descripcion.length; descIdx++) {
                const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                if (!selectedCheckboxes[fieldKey]) {
                    return false;
                }
            }
        }
        return true;
    };
    
    const getTdClass = (periodIdx, programIdx, descIdx, checkboxName) => {
        const key = `${periodIdx}_${programIdx}_${descIdx}`;
        if (selectedCheckboxes[key] === checkboxName) {
            switch (checkboxName) {
                case 'Conforme':
                    return 'selected-conforme';
                case 'm':
                    return 'selected-m';
                case 'M':
                    return 'selected-M';
                case 'C':
                    return 'selected-C';
                case 'NA':
                    return 'selected-NA';
                default:
                    return '';
            }
        }
        return '';
    };    
    
    const getPercentageClass = (percentage) => {
        if (percentage >= 90) {
            return 'percentage-green';
        } else if (percentage >= 80) {
            return 'percentage-orange';
        } else if (percentage >= 60) {
            return 'percentage-yellow';
        } else if (percentage < 60) {
            return 'percentage-red';
        } else {
            return '';
        }
    };

    const handleDeleteImage = async (docId, imageIndex, imageUrl) => {
        // Si la imagen es temporal (vista previa), no se realiza la eliminación en la base de datos ni en Firebase.
        console.log('imagen a borrar: ', imageUrl);
        if (imageUrl.startsWith("blob:")) {
          // Actualiza el estado para eliminar la imagen de la vista previa.
          // Suponiendo que 'capturedPhotos' es parte del estado y 'fieldKey' es la clave asociada.
          setCapturedPhotos(prevState => {
            return {
              ...prevState,
              [selectedField]: prevState[selectedField].filter((_, idx) => idx !== imageIndex)
            };
          });
          return; // Sale de la función sin hacer nada más.
        }
      
        // Si la imagen no es temporal, se ejecutan las operaciones de eliminación reales.
        try {
          // 1. Eliminar la URL del arreglo en la base de datos.
          await fetch(`${process.env.REACT_APP_BACKEND_URL}/datos/eliminarImagen`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              docId,      // ID del documento
              imageUrl    // URL de la imagen
            })
          });
          console.log("Imagen eliminada de la base de datos");
      
          // 2. Eliminar la imagen de Firebase Storage.
          const fileName = imageUrl.split('/').pop().split('?')[0];
          const decodedFileName = decodeURIComponent(fileName);
          const imageRef = ref(storage, decodedFileName);
          await deleteObject(imageRef);
          console.log("Imagen eliminada de Firebase Storage");

          setCapturedPhotos(prev => {
            const updatedPhotos = { ...prev };
            delete updatedPhotos[selectedField]; // Elimina la imagen del objeto
            return updatedPhotos;
        });
      
        } catch (error) {
          console.error("Error al eliminar la imagen:", error);
        }
      };      


return (
        <div>
            <div className="datos-container2">
                {/*Carga*/}
                <Backdrop
                sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
                open={open}
                onClick={handleClose}
                >
                <CircularProgress color="inherit" />
                </Backdrop>
                    <div className="form-group-datos">
                    {datos.length === 0 ? (
                        <p>Sin auditorías pendientes</p>
                    ) : (   
                        datos.map((dato, periodIdx) => (
                            <div key={periodIdx}>
                                <div className="duracion-bloque">
                                    <h2 onClick={() => toggleDuration(dato.Duracion)}>
                                        Período: {dato.Duracion}
                                    </h2>
                                </div>
                                <div className={`update-button-container ${hiddenDurations.includes(dato.Duracion) ? 'hidden' : ''}`}>
                                    <div className="header-container-datos">
                                        <img src={logo} alt="Logo Empresa" className="logo-empresa" />
                                        <div className='posicion-button'>
                                        <button className="update-button-camb" onClick={() => handleGuardarCamb(periodIdx, dato._id)}>
                                            Guardar Cambios
                                        </button>
                                        </div>
                                        <button className="update-button" onClick={() => handleUpdatePeriod(periodIdx, dato._id)}>
                                            Generar Reporte
                                        </button>
                                    </div>
                                    {dato.Comentario && (
                                        <th className='th-comentario-auditor'>
                                            <div>{dato.Comentario}</div>
                                        </th>
                                    )}
                                    {hiddenDurations.includes(dato.Duracion) ? null :
                                        dato.Programa.map((programa, programIdx) => (
                                            <div key={programIdx}>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th colSpan="2">{programa.Nombre}</th>
                                                            <th colSpan="5" className="conformity-header">Conformidad</th>
                                                            <th colSpan="2" className={getPercentageClass(percentages[`${periodIdx}_${programIdx}`])}>
                                                                Porcentaje: {percentages[`${periodIdx}_${programIdx}`] ? percentages[`${periodIdx}_${programIdx}`].toFixed(2) : 0}%
                                                            </th>
                                                        </tr>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Requisitos</th>
                                                            <th><div className='conforme-fuente'>Cf</div></th>
                                                            <th>m</th>
                                                            <th>M</th>
                                                            <th>C</th>
                                                            <th>NA</th>
                                                            <th className='padingH'>Problema/Hallazgos</th>
                                                            <th>Evidencia</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {programa.Descripcion.map((desc, descIdx) => {
                                                        const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                                                        

                                                        const imageSrcs = (capturedPhotos[fieldKey] || []).map((file) =>
                                                            typeof file === "object" && file instanceof File ? URL.createObjectURL(file) : file
                                                        ).concat(Array.isArray(desc.Hallazgo) ? desc.Hallazgo : []);

                                                        return (
                                                        <tr key={descIdx}>
                                                            <td>{desc.ID}</td>
                                                            <td className='alingR'>{desc.Requisito}</td>
                                                            {['Conforme', 'm', 'M', 'C', 'NA'].map((checkboxName) => (
                                                            <td key={checkboxName} className={getTdClass(periodIdx, programIdx, descIdx, checkboxName)}>
                                                                <input
                                                                type="checkbox"
                                                                name={`${checkboxName}_${periodIdx}_${programIdx}_${descIdx}`}
                                                                checked={selectedCheckboxes[fieldKey] === checkboxName}
                                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, checkboxName)}
                                                                />
                                                            </td>
                                                            ))}
                                                            <td className='espacio-test flex-column'>
                                                            <textarea 
                                                                name={`Problemas_${periodIdx}_${programIdx}_${descIdx}`} 
                                                                defaultValue={desc.Problema}
                                                                className="textarea-custom"
                                                                style={{height:"40px", marginBottom: "10px"}}
                                                                placeholder='Problema...'
                                                            ></textarea>
                                                            <textarea
                                                                name={`Observaciones_${periodIdx}_${programIdx}_${descIdx}`}
                                                                defaultValue={desc.Observacion}
                                                                className="textarea-custom"
                                                                placeholder='Hallazgo...'
                                                            ></textarea>
                                                            </td>
                                                            <td>
                                                            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                                                            <div className="button-foto" onClick={() => handleOpenModal(fieldKey)}>
                                                                <span className="material-symbols-outlined">
                                                                add_a_photo
                                                                </span>
                                                            </div>
                                                            
                                                            <div
                                                                className={`image-collage image-collage-${Math.min(
                                                                    imageSrcs.length,
                                                                    4
                                                                )}`} 
                                                            >
                                                                {imageSrcs.map((src, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={src}
                                                                        alt={`Evidencia ${idx + 1}`}
                                                                        className="hallazgo-imagen"
                                                                        onClick={() => handleImageClick(src, idx, dato._id)}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <button onClick={() => handleOpenModal(fieldKey)}>Agregar Imagen</button>
                                                            </td>
                                                        </tr>
                                                        );
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Fotos open={modalOpen} onClose={() => setModalOpen(false)} onCapture={handleCapture} />
            {imageModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} alt="Ampliada" className="modal-image" />
                        {/* Botón para eliminar la imagen */}
                        <button
                            className="delete-button"
                            onClick={() => {
                                // Puedes utilizar selectedImageIndex y selectedImageDocId para eliminar la imagen
                                handleDeleteImage(selectedImageDocId, selectedImageIndex, selectedImage);
                                closeModal(); // Cierra el modal después de eliminar
                            }}
                        >
                            Eliminar Imagen
                        </button>
                    </div>
                </div>
            )}


        </div> 
    ); 

};

export default Pendientes;