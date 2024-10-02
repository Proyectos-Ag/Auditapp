import React, { useEffect,useContext, useState } from 'react';
import axios from 'axios';
import './css/Ishikawa.css'
import Logo from "../../assets/img/logoAguida.png";
import Navigation from "../Navigation/navbar";
import Ishikawa from '../../assets/img/Ishikawa-transformed.png';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';

const CreacionIshikawa = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const [showPart, setShowPart] = useState(true);
  const [ishikawaRecords, setIshikawaRecords] = useState([]); // Almacena los registros filtrados
  const [selectedRecordId, setSelectedRecordId] = useState(null); // Almacena el ID del registro seleccionado
  const [, setSelectedTextareas] = useState(new Set());

  const [formData, setFormData] = useState({
    problema: '',
    afectacion: '',
    requisito: '',
    auditado: userData.Nombre,
    hallazgo: '',
    fecha: '',
    participantes: '',
    correccion: '',
    causa: ''
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

  const [actividades, setActividades] = useState([{ actividad: '', responsable: '', fechaCompromiso: '' }]);

  const fechaElaboracion = new Date().toISOString();

  useEffect(() => {
    const fetchIshikawaRecords = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`);
        const filteredRecords = response.data.filter(item =>
          item.estado === 'Rechazado' && item.auditado === userData.Nombre
        );
        setIshikawaRecords(filteredRecords);
      } catch (error) {
        console.error('Error fetching Ishikawa records:', error);
      }
    };
  
    fetchIshikawaRecords();
  }, [userData.Nombre]);

  const handleSelectRecord = (e) => {
    const selectedId = e.target.value;
  
    if (selectedId === "") {
      // Si selecciona "Nuevo...", limpiamos el formulario
      setSelectedRecordId(null); // Reseteamos el ID seleccionado
      setFormData({
        problema: '',
        afectacion: '',
        requisito: '',
        auditado: userData.Nombre,
        hallazgo: '',
        fecha: '',
        participantes: '',
        correccion: '',
        causa: ''
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
  
      setActividades([{ actividad: '', responsable: '', fechaCompromiso: '' }]);
      setIsEditing(false); // Cambiamos el modo a "creación"
    } else {
      const selectedRecord = ishikawaRecords.find(record => record._id === selectedId);
    
      if (selectedRecord) {
        setSelectedRecordId(selectedId);
        setFormData({
          problema: selectedRecord.problema || '',
          afectacion: selectedRecord.afectacion || '',
          requisito: selectedRecord.requisito || '',
          auditado: selectedRecord.auditado || '',
          hallazgo: selectedRecord.hallazgo || '',
          fecha: selectedRecord.fecha || '',
          participantes: selectedRecord.participantes || '',
          correccion: selectedRecord.correccion || '',
          causa: selectedRecord.causa || '',
          notaRechazo: selectedRecord.notaRechazo || ''
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
    
        setActividades(selectedRecord.actividades || [{ actividad: '', responsable: '', fechaCompromiso: '' }]);
        setIsEditing(true); // Modo edición activado
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
        hallazgo: formData.hallazgo,
        correccion: formData.correccion,
        causa: formData.causa,
        diagrama,
        participantes: formData.participantes,
        afectacion: formData.afectacion,
        actividades,
        estado: 'Hecho',
        fechaElaboracion
      };
  
      const result = await Swal.fire({
        title: '¿Estás seguro de querer guardar?',
        text: 'El diagrama será enviado a revisión.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3ccc37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      });
  
      // Solo procede si el usuario confirma
      if (result.isConfirmed) {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ishikawa`, data);
        Swal.fire('Guardado', 'El diagrama ha sido guardado.', 'success');
        navigate('/diagramas');
      }
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
        fechaElaboracion
      };
  
      const result = await Swal.fire({
        title: '¿Estás seguro de querer actualizar?',
        text: 'El diagrama será actualizado.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3ccc37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar'
      });
  
      // Solo procede si el usuario confirma
      if (result.isConfirmed) {
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ishikawa/${selectedRecordId}`, data);
        Swal.fire('Actualizado', 'El diagrama ha sido actualizado.', 'success');
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
      setFormData((prevState) => ({
        ...prevState,
        causa: Array.from(newSelected).map(t => t.value).join('; ')
      }));
  
      return newSelected;
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
    setActividades([...actividades, { actividad: '', responsable: '', fechaCompromiso: '' }]);
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

  return (
    <div>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>

      <form onSubmit={(e) => {
          e.preventDefault(); // Prevenir el envío automático del formulario
          if (isEditing) {
            Actualizar();
          } else {
            Guardar();
          }
        }}>
          
      <div>
      
      <div style={{textAlign:'center'}}>
      <h2>Seleccionar un Registro de Ishikawa:</h2>
        <select className='selector-ish' onChange={handleSelectRecord} value={selectedRecordId || ''}>
          <option value="">Nuevo...</option>
          {ishikawaRecords.map(record => (
            <option key={record._id} value={record._id}>
              Corregir: {record.problema}
            </option>
          ))}
        </select>
        </div>

        {formData.notaRechazo ? (
          <div className='th-comentario'>
             <div style={{padding:'15px'}}>{formData.notaRechazo}</div>
          </div>
         ): ''}

        <div className="image-container">
        <img src={Logo} alt="Logo Aguida" className='logo-empresa-ish' />
        <h1 style={{position:'absolute', fontSize:'40px'}}>Ishikawa</h1>
          <div className='posicion-en'>
            <h2>Problema:
              <input type="text" className="problema-input" name='problema'
                style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar problema. . ." required 
                value={formData.problema} onChange={handleFormDataChange} />
            </h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2>Afectación:
                <input type="text" className="problema-input" name='afectacion'
                  style={{ marginTop: '0.4rem', color: '#000000' }} placeholder="Agregar afectación. . ." required 
                  value={formData.afectacion} onChange={handleFormDataChange} />
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
                   onChange={handleFormDataChange} />
            </h3>
          </div>
          <div>
            <img src={Ishikawa} alt="Diagrama de Ishikawa" className="responsive-image" />
            {diagrama.map((dia, index) => (
              <div key={index}>
              <textarea maxLength={145} className="text-area" name="text1" value={dia.text1} onChange={handleInputChange} 
              style={{ top: '19.1rem', left: '8.7rem'}} placeholder="Texto..." required  onDoubleClick={handleDoubleClick}
               />
               <textarea maxLength={145} className="text-area" name='text2' value={dia.text2} onChange={handleInputChange}
               style={{ top: '19.1rem', left: '25.4rem'}} placeholder="Texto..." required  onDoubleClick={handleDoubleClick}
               />
               <textarea className="text-area" name='text3' value={dia.text3} onChange={handleInputChange}
                style={{ top: '19.1rem', left: '41.2rem'}}placeholder="Texto..." required  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
   
               <textarea className="text-area" name='text4' value={dia.text4} onChange={handleInputChange}
                style={{ top: '23.2rem', left: '12.2rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text5' value={dia.text5} onChange={handleInputChange}
                style={{ top: '23.2rem', left: '28.8rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text6' value={dia.text6} onChange={handleInputChange}
                style={{ top: '23.2rem', left: '45rem' }}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
       
               <textarea className="text-area" name='text7' value={dia.text7} onChange={handleInputChange}
                style={{ top: '27.2rem', left: '15.5rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text8' value={dia.text8} onChange={handleInputChange}
                style={{ top: '27.2rem', left: '32.3rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text9' value={dia.text9} onChange={handleInputChange}
                style={{ top: '27.2rem', left: '48.1rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
     
               <textarea className="text-area" name='text10' value={dia.text10} onChange={handleInputChange}
                style={{ top: '31rem', left: '23rem'}}placeholder="Texto..." required  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text11' value={dia.text11} onChange={handleInputChange}
                style={{ top: '31rem', left: '39.4rem'}}placeholder="Texto..." required  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
     
               <textarea className="text-area" name='text12' value={dia.text12} onChange={handleInputChange}
                style={{ top: '35rem', left: '19.7rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text13' value={dia.text13} onChange={handleInputChange}
                style={{ top: '35rem', left: '36rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
     
               <textarea className="text-area" name='text14' value={dia.text14} onChange={handleInputChange}
                style={{ top: '39rem', left: '16.6rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
               <textarea className="text-area" name='text15' value={dia.text15} onChange={handleInputChange}
                style={{ top: '39rem', left: '32.8rem'}}placeholder="Texto..."  onClick={handleDiagrama}
                onDoubleClick={handleDoubleClick} maxLength={145}></textarea>
                <textarea maxLength={145} className="text-area" name='problema' value={formData.problema} onChange={handleDiagrama}
                  style={{ top: '27rem', left: '67.5rem', width: '8.5rem', height: '8rem' }} placeholder="Problema..." />
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
                  <textarea type="text" name='participantes' value={formData.participantes} onChange={handleFormDataChange}
                      style={{ width:'64rem', color:'#000000', border:'none', backgroundColor:'#ffffff'}} 
                      placeholder="Agregar Participantes. . ." required></textarea>
                    )}
                  </div>
                  </div>

          <div>
            <div className='posicion-bo' style={{ marginRight: '5rem' }}>
              <h3>No conformidad:</h3>
              <textarea type="text" className="textarea-acc" name='requisito'
                style={{ width: '72em', textAlign: 'justify' }} placeholder="Agregar Acción. . ." value={formData.requisito} onChange={handleFormDataChange} />
              <h3>Hallazgo:</h3>
              <textarea type="text" className="textarea-acc" name='hallazgo'
                style={{ width: '72em', color: '#000000' }} placeholder="Agregar Hallazgo. . ." value={formData.hallazgo} onChange={handleFormDataChange} />
              <h3>Acción inmediata o corrección:</h3>
              <textarea type="text" className="textarea-acc" name='correccion'
                style={{ width: '72em', color: '#000000' }} placeholder="Agregar Acción. . ." value={formData.correccion} onChange={handleFormDataChange} />
              <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
              <textarea type="text" className="textarea-acc" name='causa'
                 style={{ marginBottom: '20px', width:'72em', overflowWrap: 'break-word' }} placeholder="Agregar Causa. . ." value={formData.causa} onChange={handleFormDataChange} />
            </div>
          </div>

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
                      />
                    </td>
                    <td>
                      <textarea
                        className='table-input'
                        type="text"
                        placeholder='Agregar responsable. . .'
                        value={actividad.responsable}
                        onChange={(e) => {
                          const newActividades = [...actividades];
                          newActividades[index].responsable = e.target.value;
                          setActividades(newActividades);
                        }}
                        required
                      />
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
                        />
                      </div>
                    </td>
                    <td className='cancel-acc'>
                      <button type='button' onClick={() => eliminarFilaActividad(index)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type='button' onClick={(e) => {
              e.preventDefault();
              agregarFilaActividad();
            }} className='button-agregar'>Agregar Fila</button>
          </div>
          <button type='submit'className='button-generar-ish'  onClick={Guardar}>Guardar</button>
        </div>
      </div>
    </form>
    </div>
  );
};

export default CreacionIshikawa;