import React, { useEffect, useState, useContext } from 'react';
import './css/Ishikawa.css';
import ishikawa from '../../assets/img/Ishikawa-transformed.png';
import Navigation from "../Navigation/navbar";
import Logo from "../../assets/img/logoAguida.png";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../App';
import Swal from 'sweetalert2';

const Ishikawa = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState(null);
  const [programa, setPrograma] = useState(null);
  const [descripcion, setDescripcion] = useState(null);
  const [requisito, setRequisito] = useState('');
  const [hallazgo, setHallazgo] = useState('');
  const [auditado, setAuditados] = useState('');
  const [proceso,  setEnProceso] = useState([]);
  const [aprobado,  setAprobado] = useState([]);
  const [rechazo,  setRechazo] = useState([]);
  const [nota,  setNota] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
 

  const [formData,setData] = useState({
    problema: '',
    afectacion: '',
    correccion: '',
    causa: ''
  });
  const [diagrama,setDiagrama] = useState([{
    problema:'',
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
  const [actividades, setActividades] = useState([{ actividad: '', responsable: '', fechaCompromiso: '' }]);
  

  const { _id, id } = useParams();
  const idRep = useState({idRepo:_id});
  const {Observacion}= useParams();
  const fechaActual = new Date().toISOString().slice(0, 10);

  console.log('ID recibido 1:', _id);
  console.log('ID recibido:', id);
  console.log(' recibido:', Observacion);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
        if (userData && userData.Correo) {
          const datosFiltrados = response.data.find(dato => dato._id === _id);
          if (datosFiltrados) {
            const programaEncontrado = datosFiltrados.Programa.find(prog => 
              prog.Descripcion.some(desc => desc.ID === id)
            );
            if (programaEncontrado) {
              const descripcionEncontrada = programaEncontrado.Descripcion.find(desc => desc.ID === id);
              setDatos(datosFiltrados);
              setPrograma(programaEncontrado);
              setDescripcion(descripcionEncontrada);
              setRequisito(descripcionEncontrada.Requisito);
              setHallazgo(descripcionEncontrada.Observacion);
              setAuditados(descripcionEncontrada.Auditados);
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };
  
    obtenerDatos();
  }, [userData, _id, id]);  

  useEffect(() => {
    verificarRegistro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_id, id]);

  const verificarRegistro = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
      const dataFiltrada = response.data.filter(item => item.idRep === _id && item.idReq === id && (item.estado === 'rechazado' || item.estado === 'revisado'));
      const registroRechazado = dataFiltrada.find(item => item.idRep === _id && item.idReq === id);
      const registroExistente = response.data.some(item => item.idRep === _id && item.idReq === id && item.estado === 'En revisión');
      const registroAprobado = response.data.some(item => item.idRep === _id && item.idReq === id && item.estado === 'revisado');
      setAprobado(registroAprobado);
      setEnProceso(registroExistente);
      setRechazo(dataFiltrada);

      if (registroRechazado) {
        setData({
          problema: registroRechazado.problema,
          afectacion: registroRechazado.afectacion,
          correccion: registroRechazado.correccion,
          causa: registroRechazado.causa,
          notaRechazo: registroRechazado.notaRechazo
          
        });
        setDiagrama(registroRechazado.diagrama);
        setActividades(registroRechazado.actividades);
        setIsEditing(true);  // Establecer en modo edición
      }
      setNota(registroRechazado.notaRechazo);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
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
        fecha: fechaActual,
        auditado,
        problema: formData.problema,
        requisito,
        hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        afectacion: formData.afectacion,
        actividades,
        estado: 'En revisión'
      };
  
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${_id}`, data);
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
      title: '¿Esta seguro de querer reenviar el diagrama?',
      text: '¡El diagrama sera mandado a revisión!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reenviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdate();
      }
    });
  };

  const handleDiagrama = (e) => {
    const { name, value } = e.target;
    setDiagrama((prevState) => [{
      ...prevState[0],
      [name]: value
    }]);
  };

  const handleDatos = (e) => {
    const { name, value } = e.target;
    setData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Verificar si todos los campos requeridos están rellenados
    if (
      !formData.problema ||
      !formData.afectacion ||
      !formData.correccion ||
      !formData.causa ||
      diagrama.some(dia => !dia.problema || !dia.text1 || !dia.text2 || !dia.text3 
      || !dia.text10 || !dia.text11) ||
      actividades.some(act => !act.actividad || !act.responsable || !act.fechaCompromiso)
    
    ) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor, complete todos los campos requeridos antes de guardar.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return; // Salir de la función si algún campo requerido no está completo
    }
  
    try {
      const data = {
        idRep:_id,
        idReq: id,
        fecha: fechaActual,
        auditado,
        problema: formData.problema,
        requisito,
        hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        afectacion: formData.afectacion,
        actividades,
        estado: 'En revisión'
      };
  
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, data);
      console.log('Datos guardados:', response.data);
      Swal.fire({
        title: 'Guardado',
        text: 'El diagrama se ha guardado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      verificarRegistro();
    } catch (error) {
      console.error('Error al guardar los datos:', error);
    }
  };

  const Guardar = async () => {
    Swal.fire({
      title: '¿Esta seguro de querer guardar?',
      text: '¡El diagrama sera mandado a revisión!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3ccc37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleSave();
      }
    });
  };
  

  const handleActividadChange = (index, field, value) => {
    const nuevasActividades = [...actividades];
    nuevasActividades[index][field] = value;
    setActividades(nuevasActividades);
  };

  const eliminarFilaActividad = (index) => {
    const nuevasActividades = actividades.filter((_, i) => i !== index);
    setActividades(nuevasActividades);
  };

  const agregarFilaActividad = () => {
    setActividades([...actividades, { actividad: '', responsable: '', fechaCompromiso: '' }]);
  };

  if (!datos || !programa || !descripcion) {
    return <div>Cargando...</div>;
  }
  
 
  if (proceso) {
    return (
      <div>
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <Navigation />
        </div>
        <div className='mss-proceso'>
          <div style={{display:'flex', justifyContent:'center'}}>En proceso de revisión.</div>
          <div style={{display:'flex',fontSize:'70px', justifyContent:'center'}}>📝</div>
        </div>
      </div>
    );
  } else if (rechazo || aprobado) {
    return (  
      <div>
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <Navigation />
        </div>

        {aprobado && (
          <>
            <div className='cont-aprob'>
            <div className='rep-aprob' style={{display:'flex', justifyContent:'center'}}>¡El diagrama fue aprobado.!</div>
            <div style={{display:'flex',fontSize:'70px', justifyContent:'center'}}>🎉</div>
            </div>
          </>
        )}
        
        {(formData.notaRechazo && !aprobado) &&(
          <div className='th-comentario'>
                     <div style={{padding:'15px'}}>{nota}</div>
          </div>
         )}
          
        <div className="image-container">
        
          <img src={Logo} alt="Logo Aguida" className='logo-empresa' />
          <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
          <div className='posicion-en'>
            <h2>Problema:
              <input type="text" className="problema-input" name='problema' value={formData.problema} onChange={handleDatos}
              style={{marginTop:'0.4rem'}} placeholder="Agregar problema. . ." required></input>
            </h2>
            <h2>Afectación:
              <input type="text" className="problema-input"  name='afectacion' value={formData.afectacion} onChange={handleDatos}
              style={{marginTop:'0.4rem'}} placeholder="Agregar afectación. . ."></input>
            </h2>
          </div>
          <div className='posicion-en-2'>
            <h3>Fecha: {fechaActual}</h3>
          </div>
        
          <div >
            <img src={ishikawa} alt="Diagrama de Ishikawa" className="responsive-image" />
            {diagrama.map((dia, index) => (
            <div key={index}>
            <textarea maxlength="63" className="text-area" name='text1' value={dia.text1} onChange={handleDiagrama}
             style={{ top: '19.1rem', left: '8.7rem' }} placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text2' value={dia.text2} onChange={handleDiagrama}
             style={{ top: '19.1rem', left: '25.4rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text3' value={dia.text3} onChange={handleDiagrama}
             style={{ top: '19.1rem', left: '41.2rem' }}placeholder="Texto..."></textarea>
  
            <textarea className="text-area" name='text4' value={dia.text4} onChange={handleDiagrama}
             style={{ top: '23.2rem', left: '12.2rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text5' value={dia.text5} onChange={handleDiagrama}
             style={{ top: '23.2rem', left: '28.8rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text6' value={dia.text6} onChange={handleDiagrama}
             style={{ top: '23.2rem', left: '45rem' }}placeholder="Texto..."></textarea>
    
            <textarea className="text-area" name='text7' value={dia.text7} onChange={handleDiagrama}
             style={{ top: '27.2rem', left: '15.5rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text8' value={dia.text8} onChange={handleDiagrama}
             style={{ top: '27.2rem', left: '32.3rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text9' value={dia.text9} onChange={handleDiagrama}
             style={{ top: '27.2rem', left: '48.1rem' }}placeholder="Texto..."></textarea>
  
            <textarea className="text-area" name='text10' value={dia.text10} onChange={handleDiagrama}
             style={{ top: '31rem', left: '23rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text11' value={dia.text11} onChange={handleDiagrama}
             style={{ top: '31rem', left: '39.4rem' }}placeholder="Texto..."></textarea>
  
            <textarea className="text-area" name='text12' value={dia.text12} onChange={handleDiagrama}
             style={{ top: '35rem', left: '19.7rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text13' value={dia.text13} onChange={handleDiagrama}
             style={{ top: '35rem', left: '36rem' }}placeholder="Texto..."></textarea>
  
            <textarea className="text-area" name='text14' value={dia.text14} onChange={handleDiagrama}
             style={{ top: '39rem', left: '16.6rem' }}placeholder="Texto..."></textarea>
            <textarea className="text-area" name='text15' value={dia.text15} onChange={handleDiagrama}
             style={{ top: '39rem', left: '32.8rem' }}placeholder="Texto..."></textarea>
  
            <textarea maxlength="105" className="text-area" name='problema' value={dia.problema} onChange={handleDiagrama}
             style={{ top: '27rem', left: '67.5rem',width:'8.5rem', height:'8rem' }}placeholder="Problema..."></textarea>
            </div>
          ))}
  
          </div>
          
          {programa.Descripcion
            .filter(desc => desc.ID === id)
            .map((desc, index) => {
  
              return (
                <div key={index}>
                  <div className='posicion-bo'>
                    <h3>No conformidad:</h3>
                       <div style={{fontSize:'20px',width:'55em', textAlign:'justify'}}>{desc.Requisito}</div>
                    <h3>Hallazgo:</h3>
                    <div className='hallazgo-container'> {/*aqui va la observacion*/}
                      <div  >{desc.Observacion}</div>
                    </div>
                    <h3>Acción inmediata o corrección: </h3>
                    <textarea type="text" className="textarea-acc" name='correccion' value={formData.correccion} onChange={handleDatos}
                      style={{ width:'64rem'}} placeholder="Agregar Acción. . ."></textarea>
                    <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                    <textarea type="text" className="textarea-acc" name='causa' value={formData.causa} onChange={handleDatos}
                      style={{ width:'64rem', marginBottom:'20px'}} placeholder="Agregar Causa. . ."></textarea>
                  </div>
                  
                </div>
              );
            })}
          <div className='table-ish'>
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
                      />
                    </td>
                    <td>
                      <textarea
                        className='table-input'
                        type="text"
                        value={actividad.responsable}
                        onChange={(e) => handleActividadChange(index, 'responsable', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={actividad.fechaCompromiso}
                        onChange={(e) => handleActividadChange(index, 'fechaCompromiso', e.target.value)}
                      />
                    </td>
                    <td className='cancel-acc'>
                    {index !== 0 && (
                      <button onClick={() => eliminarFilaActividad(index)}>Eliminar</button>
                    )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
              <button onClick={agregarFilaActividad} className='button-agregar'>Agregar Fila</button>
            </div>
            <button onClick={isEditing ? Actualizar : Guardar} className='button-guar-ish'>
              {isEditing ? 'Reenviar' : 'Guardar'}
            </button>
          </div>
        </div>
    );
  } else {
    return <div>Error al cargar los datos</div>;
  };
  
  };

export default Ishikawa;