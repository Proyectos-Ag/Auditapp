import React, { useEffect, useState, useContext } from 'react';
import './css/Ishikawa.css';
import Logo from "../assets/img/logoAguida.png";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2'; 
import withReactContent from 'sweetalert2-react-content';
import Busqueda from './Busqueda';
import { Stack, Button, Chip, TextField, Paper, List, ListItem } from '@mui/material';
import { Alert, AlertTitle } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import NewIshikawa from '../../../ishikawa-vacio/components/Ishikawa/NewIshikawa';

const Ishikawa = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState(null);
  const [programa, setPrograma] = useState(null);
  const [descripcion, setDescripcion] = useState(null);
  const [requisito, setRequisito] = useState('');
  const { _id, id, nombre} = useParams();
  const [hallazgo, setHallazgo] = useState('');
  const [auditado, setAuditados] = useState('');
  const [proceso,  setEnProceso] = useState([]);
  const [asignado,  setAsignado] = useState([]);
  const [revisado,  setRevisado] = useState([]);
  const [aprobado,  setAprobado] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [rechazo,  setRechazo] = useState([]);
  const [problema, setProblema] = useState(''); // Almacena el valor del problema
  const [nota,  setNota] = useState([]);
  const [ishikawaRegistro, setIshikawaRegistro] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fechaElaboracion, setFechaElaboracion] = useState('');
  const [tempFechaCompromiso, setTempFechaCompromiso] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const MySwal = withReactContent(Swal);
 
  const [formData,setData] = useState({
    problema: '',
    afectacion: '',
    fecha: '',
    participantes: '',
    correccion: '',
    causa: ''
  });
  
  const [diagrama,setDiagrama] = useState([{
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
   
  const [actividades, setActividades] = useState([]);

  const idRep = _id;

  console.log('ID recibido 1:', _id);
  console.log('ID recibido:', id);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
        if (userData && userData.Correo) {
          const datosFiltrados = response.data.find(dato => dato._id === _id);
          if (datosFiltrados) {
            const programaEncontrado = datosFiltrados.Programa.find(prog => 
              prog.Descripcion.some(desc => desc.ID === id && prog.Nombre === nombre)
            );
            if (programaEncontrado) {
              const descripcionEncontrada = programaEncontrado.Descripcion.find(desc => desc.ID === id);
              setDatos(datosFiltrados);
              setPrograma(programaEncontrado);
              setDescripcion(descripcionEncontrada);
              setRequisito(descripcionEncontrada.Requisito);
              setHallazgo(
                (descripcionEncontrada?.Observacion && datosFiltrados?.PuntuacionMaxima)
                  ? (Array.isArray(descripcionEncontrada.Hallazgo)
                       ? descripcionEncontrada.Hallazgo.join(', ')
                       : descripcionEncontrada.Hallazgo)
                  : descripcionEncontrada.Observacion
              );              
              setProblema((descripcionEncontrada?.Observacion && datosFiltrados?.PuntuacionMaxima) ?
                          descripcionEncontrada.Observacion : descripcionEncontrada.Problema);
              setAuditados(descripcionEncontrada.Auditados);
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
  
    obtenerDatos();
  }, [userData, _id, id, nombre]);  

  useEffect(() => {
    verificarRegistro();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_id, id]);

  useEffect(() => {
    if (datos) {
      const formattedDate = new Date(datos.FechaElaboracion).toLocaleDateString();
      setFechaElaboracion(formattedDate);
      
    }
  }, [datos]);

  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => ajustarTamanoFuente(textarea));
}, [proceso]);

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

const verificarRegistro = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
      params: {
        idRep: _id,
        idReq: id,
        proName: nombre
      }
    });

    const registro = response.data.find(item => item.idRep === _id && item.idReq === id && item.proName === nombre);

    if (registro) {
      console.log('Registro encontrado:', registro);
      setIshikawaRegistro(registro);
      setAsignado(registro.estado === 'Asignado');
      setAprobado(registro.estado === 'Aprobado');
      setRevisado(registro.estado === 'Revisado');
      setEnProceso(registro.estado === 'En revisión');
      setRechazo([registro]);

        setData({
          problema: registro.problema,
          afectacion: registro.afectacion,
          correccion: registro.correccion,
          causa: registro.causa,
          participantes: registro.participantes,
          notaRechazo: registro.notaRechazo
        });
        setActividades(registro.actividades);
        setIsEditing(true);

      setDiagrama(registro.diagrama);
        console.log('Diagrama:', registro.diagrama);

      setNota(registro.notaRechazo);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

const handleTempFechaChange = (value) => {
    setTempFechaCompromiso(value);
};

  const handleUpdate = async () => {
    try {
      // Verificar que `rechazo` no esté vacío
      if (rechazo.length === 0) {
        alert('No hay datos para actualizar');
        return;
      }
      // Obtener el `_id` del primer elemento de `rechazo`
      const { _id } = rechazo[0];
  
      const data = {
        idRep: idRep.idRepo,
        idReq: id,
        fecha: fechaElaboracion,
        auditado,
        problema: problema,
        requisito,
        hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'En revisión',
        usuario: userData.Nombre
      };
  
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, data);
      console.log('Datos actualizados:', response.data);
      Swal.fire({
        title: 'Actualizado',
        text: 'El diagrama se ha actualizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      verificarRegistro();
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
    }
  };  

  const Actualizar = async () => {
    Swal.fire({
      title: '¿Está seguro de querer enviar el diagrama?',
      text: '¡El diagrama sera mandado ha revisión!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdate();
      }
    });
  };

  const handleUpdateAdvance = async () => {
    try {
      // Verificar que `rechazo` no esté vacío
      if (rechazo.length === 0) { 
        alert('No hay datos para actualizar');
        return;
      }
  
      // Obtener el `_id` del primer elemento de `rechazo`
      const { _id } = rechazo[0];
  
      const data = {
        idRep: idRep.idRepo,
        idReq: id,
        fecha: fechaElaboracion,
        auditado,
        problema: descripcion.Problema,
        requisito,
        hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades
      };
  
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/completo/${_id}`, data);
      console.log('Datos actualizados:', response.data);
      Swal.fire({
        title: 'Actualizado',
        text: 'El diagrama se ha actualizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      verificarRegistro();
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
    }
  };

  const handleDatos = (e) => {
    const { name, value } = e.target;
    setData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSaveAdvance = async () => {
    try {
      const data = {
        idRep:_id,
        idReq: id,
        fecha: fechaElaboracion,
        auditado,
        problema: formData.problema,
        requisito,
        hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'Pendiente'
      };
      // Realizar la llamada a la API para guardar los datos
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, data);
      console.log('Datos guardados:', response.data);
      // Llamar a verificarRegistro después de confirmar
      verificarRegistro();

      Swal.fire({
        title: 'Cambios guardados',
        text: 'Los cambios se guardaron exitosamente.',
        icon: 'success',
      });
    
    } catch (error) {
      console.error('Error al guardar los datos:', error);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        idRep:_id,
        idReq: id,
        fecha: fechaElaboracion,
        auditado,
        problema: formData.problema,
        requisito,
        hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'En revisión'
      };
    // Mostrar SweetAlert con opción de confirmar o cancelar
    const result = await Swal.fire({
      title: '¿Está seguro de querer guardar?',
      text: 'El diagrama será enviado ha revisión.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    // Si el usuario confirma (presiona el botón de confirmación)
    if (result.isConfirmed) {
      // Realizar la llamada a la API para guardar los datos
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, data);
      console.log('Datos guardados:', response.data);
      // Llamar a verificarRegistro después de confirmar
      verificarRegistro();
    } else {
      // Mostrar un mensaje de cancelación si el usuario cancela
      Swal.fire('Cancelado', 'El diagrama no ha sido guardado.', 'info');
    }
    } catch (error) {
      console.error('Error al guardar los datos:', error);
    }
  };

  const Guardar = async () => {
    // Verificar si todos los campos requeridos están rellenados
    if (
      !formData.problema ||
      !formData.correccion ||
      !formData.causa ||
      !formData.participantes ||
      diagrama.some(dia => !dia.problema || !dia.text1 || !dia.text2 || !dia.text3 || !dia.text10 || !dia.text11) ||
      actividades.some(act => !act.actividad || !act.responsable || !act.fechaCompromiso)
    ) {
      console.log('Por favor, complete todos los campos requeridos antes de guardar.');
      return;
    }
    await handleSave();
  };


const handleSaveOrUpdate = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, {
      params: {
          idRep: _id,
          idReq: id,
          proName: nombre
      }
    }); 

    if (response.data) {
      handleUpdateAdvance();
    } else {
      handleSaveAdvance();
    }
  } catch (error) {
    console.error('Error al verificar el registro:', error);
  }
};

  const handleActividadChange = (index, field, value) => {
    const nuevasActividades = [...actividades];
  
    if (field === 'fechaCompromiso') {
      // Reemplazar la fecha en lugar de agregarla de nuevo
      nuevasActividades[index][field] = [value];
    } else {
      nuevasActividades[index][field] = value;
    }
  
    setActividades(nuevasActividades);
  };
  
  const eliminarFilaActividad = (index) => {
    const nuevasActividades = actividades.filter((_, i) => i !== index);
    setActividades(nuevasActividades);
  };

  const agregarFilaActividad = () => {
    setActividades([
      ...actividades, 
      { actividad: '', responsable: [], fechaCompromiso: [] }
    ]);
  };

  const ajustarFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString('es-ES');
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


  const handleUpdateFechaCompromiso = async (index) => {
    try {
      const nuevaFecha = tempFechaCompromiso;
      const actividadActualizada = {
        ...actividades[index],
        fechaCompromiso: [nuevaFecha]
      };
  
      const updatedActividades = [...actividades];
      updatedActividades[index] = actividadActualizada;
  
      const updatedData = {
        actividades: updatedActividades
      };
  
      const { _id } = rechazo[0];
  
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/fecha/${_id}`, updatedData);
      console.log('Datos actualizados:', response.data);
      verificarRegistro();
      Swal.fire('Fecha actualizada', `La nueva fecha de compromiso es: ${nuevaFecha}`, 'success');
    } catch (error) {
      console.error('Error al actualizar la fecha de compromiso:', error);
      Swal.fire('Error', 'No se pudo actualizar la fecha de compromiso', 'error');
    }
  };

  const colores = ['black', 'blue', 'green', 'yellow','orange', 'red'];

  const handleSelectChange = (event, index) => {
    event.target.style.color = colores[index % colores.length];
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

const handleDelete = (participantToDelete) => {
  const nuevosSeleccionados = selectedParticipants.filter(p => p.Nombre !== participantToDelete.Nombre);
  setSelectedParticipants(nuevosSeleccionados);

  const nuevosNombres = nuevosSeleccionados.map(p => p.Nombre).join(' / ');
  setData({ ...formData, participantes: nuevosNombres });
};

const handleSelect = (participant) => {
  // Evitar duplicados
  if (selectedParticipants.some(p => p.Nombre === participant.Nombre)) return;

  const nuevosSeleccionados = [...selectedParticipants, participant];
  setSelectedParticipants(nuevosSeleccionados);

  // Actualiza el formData (los almacena como cadena separados por "/")
  const nuevosNombres = nuevosSeleccionados.map(p => p.Nombre).join(' / ');
  setData({ ...formData, participantes: nuevosNombres });
  console.log('usuarios: ',nuevosNombres);

  setSearchTerm('');
  setSuggestions([]);
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

const handleCausaChange = nuevaCausa => {
  setData(fd => ({ ...fd, causa: nuevaCausa }));
};
 
 if (rechazo || aprobado || proceso) {
    return (  
      <div className='content-diagrama'>

        {proceso && (
        <Alert severity="info" icon={<span style={{ fontSize: 40 }}>📝</span>} sx={{ my: 2 }}>
          <AlertTitle>En proceso de revisión</AlertTitle>
          Tu diagrama está siendo evaluado por el administrador.
        </Alert>
      )}

      {/* — Aprobado — */}
      {aprobado && (
        <Alert severity="success" icon={<span style={{ fontSize: 40 }}>🎉</span>} sx={{ my: 2 }}>
          <AlertTitle>¡Aprobado!</AlertTitle>
          El diagrama ha sido aprobado. Ya puedes generar el PDF si lo necesitas.
        </Alert>
      )}

      {/* — Rechazado con nota — */}
      {formData.notaRechazo && !aprobado && !revisado && (
        <Alert severity="error" sx={{ my: 2 }}>
          <AlertTitle>Estado: Rechazado</AlertTitle>
          {nota}
        </Alert>
      )}

      {/* — Mensajes fallback según estado — */}
      {formData.estado === '' && !proceso && !aprobado && !formData.notaRechazo && (
        <Alert severity="warning" sx={{ my: 2 }}>
          <AlertTitle>Generación de PDF deshabilitada</AlertTitle>
          La generación de PDFs permanecerá desactivada hasta que el administrador apruebe el diagrama.
        </Alert>
      )}

      {formData.estado === 'Finalizado' && !proceso && !aprobado && (
        <Alert severity="info" sx={{ my: 2 }}>
          <AlertTitle>Estado: Finalizado</AlertTitle>
          El proceso ha sido finalizado. Ya no se permiten modificaciones.
        </Alert>
      )}

        <form onSubmit={(e) => {
          e.preventDefault(); // Prevenir el envío automático del formulario
          if (isEditing || asignado) {
            Actualizar();
          } else {
            Guardar();
          }
        }}>

          <Stack
            className="acciones-ish-container"
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            width="96%"
          >
    
            <Button
              variant="text"
              sx={{ color: 'white' }}
              startIcon={<SaveIcon />}
              onClick={e => { e.preventDefault(); handleSaveAdvance(); }}
              disabled={revisado}
            >
              Guardar
            </Button>
    
            <Button
              variant="text"
              sx={{ color: 'white' }}
              endIcon={<SendIcon />}
              type="submit"
              disabled={revisado}
            >
              Enviar
            </Button>
            
          </Stack>
        <div className="image-container-auditado">

          <img src={Logo} alt="Logo Aguida" className='logo-empresa' />
          <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
          <div className='posicion-en'>
          {programa?.Descripcion && programa.Descripcion
            .filter(desc => desc.ID === id && programa.Nombre === nombre)
            .map((desc, index) => {
              return(
                <h2 key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Problema:
                <div 
                  className="problema-input" 
                  style={{
                    marginLeft:'6em',
                    padding: '8px', 
                    borderRadius: '4px',
                    backgroundColor: revisado ? '#f5f5f5' : 'transparent',
                    display: 'inline-block'
                  }}
                >
                  {(descripcion?.Observacion && datos?.PuntuacionMaxima) ? descripcion.Observacion : descripcion.Problema}
                </div>
              </h2>
              
            )})}
            <div style={{ display: 'flex', position:'absolute' }}>
              <h2>Afectación: </h2> 
              <h3 style={{marginTop:'1.65rem', marginLeft:'0.5rem'}}>{id} {programa?.Nombre}</h3>
            </div>
          </div>
          <div className='posicion-en-3'>
          GCF015
          </div>
          <div className='posicion-en-2'>
            <h3>Fecha: {fechaElaboracion}</h3>
          </div>
          <div  style={{ marginTop:'3.5rem'}}>
           <NewIshikawa
              diagrama={diagrama}
              setDiagrama={setDiagrama}
              problema={formData.problema}
              causa={formData.causa}
              ID={ishikawaRegistro ? ishikawaRegistro._id : null}
              onCausaChange={handleCausaChange}
            />
          </div>

          <div className='button-parti-ish-asg'>
          <div style={{ width: '64rem' }}>
            {/* Contenedor de chips y campo de busqueda */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <button className='button-part'> ⚇</button>
                {selectedParticipants.map((participant, index) => (
                  <Chip
                    key={index}
                    label={participant.Nombre}
                    onDelete={() => handleDelete(participant)}
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
          
  
          {programa?.Descripcion && programa.Descripcion
            .filter(desc => desc.ID === id && programa.Nombre === nombre)
            .map((desc, index) => {
  
              return (
                <div key={index}>
                  <div className='posicion-bo-audi'>
                    <h3>No conformidad:</h3>
                       <div style={{width:'70em', textAlign:'justify'}}>{desc.Requisito}</div>
                    <h3>Hallazgo:</h3>
                    <div className='hallazgo-container'> {/*aqui va la observacion*/}
                      <div style={{width:'70em', textAlign:'justify'}}>{datos.PuntuacionMaxima ? desc.Hallazgo : desc.Observacion}</div>
                    </div>
                    <h3>Acción inmediata o corrección: </h3>
                    <textarea type="text" className="textarea-acc" name='correccion' value={formData.correccion} onChange={handleDatos}
                      style={{ width:'64rem', color:'#000000'}} placeholder="Agregar Acción. . ." required disabled={revisado} ></textarea>
                    <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                    <textarea type="text" className="textarea-acc" name='causa' value={formData.causa} onChange={handleDatos}
                      style={{ width:'64rem', marginBottom:'20px', color:'#000000'}} 
                      placeholder="Seleccione la causa desde el diagrama"  onKeyDown={(e) => e.preventDefault()} required ></textarea>
                  </div>
    
                </div>
              );
            })}
          <div className='table-ish'>
            <h3>SOLUCIÓN</h3>
            <table style={{border:'none'}}>
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
                          value={actividad.actividad}
                          onChange={(e) => handleActividadChange(index, 'actividad', e.target.value)}
                          placeholder='Agregar Actividad. . .'
                          required
                          disabled={revisado}
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
                      {
                      (revisado) ? null : (
                      <div>
                       <select
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
                          {aprobado ? (
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
                              <input
                                  type="date"
                                  onChange={(e) => handleActividadChange(index, 'fechaCompromiso', e.target.value)}
                                  required
                              />
                          )}
                      </div>
                      )}

                      {
                      (!revisado) ? null : (
                        <div >
                           {ajustarFecha(actividad.fechaCompromiso.slice(-1)[0])}
                        </div>
                        )}
                      </td>
                      {(revisado || aprobado) ? null : ( 
                      <td className='cancel-acc'>
                        {index !== 0 && (
                          <button onClick={() => eliminarFilaActividad(index)}>Eliminar</button>
                        )}
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {
              (revisado || aprobado || proceso) ? null : ( 
              <button  onClick={(e) => {
                e.preventDefault();
                agregarFilaActividad();
              }} className='button-agregar'>Agregar Fila</button>
            )}
            </div>
          </div>
          </form>
        </div>
    );
  } else {
    return <div>Error al cargar los datos</div>;
  };
  
  };

export default Ishikawa;