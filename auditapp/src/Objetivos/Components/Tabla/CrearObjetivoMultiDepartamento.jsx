import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { UserContext } from '../../../App';
import Swal from 'sweetalert2';
import './CrearObjetivoMultiDepto.css';

const CrearObjetivoMultiDepartamento = () => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  const [pasoActual, setPasoActual] = useState(1);
  const [departamentosConAreas, setDepartamentosConAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paso 1: Datos del objetivo general
  const [nombreObjetivoGeneral, setNombreObjetivoGeneral] = useState('');
  
  // Paso 2: Departamentos y áreas seleccionadas
  const [departamentosSeleccionados, setDepartamentosSeleccionados] = useState([]);
  
  // Paso 3: Nueva estructura jerárquica
  const [objetivosEspecificos, setObjetivosEspecificos] = useState([]);
  const [objetivosPorModulo, setObjetivosPorModulo] = useState([]); // Objetivos detallados dentro de cada módulo
  
  // Cargar departamentos con sus áreas
  useEffect(() => {
    const cargarDepartamentosConAreas = async () => {
      try {
        const response = await api.get('/areas');
        const data = response.data;
        
        // Estructurar datos: cada departamento con sus áreas
        const deptosConAreas = data.map(item => ({
          departamento: item.departamento,
          areas: item.areas || []
        }));
        
        setDepartamentosConAreas(deptosConAreas);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los departamentos y áreas',
          confirmButtonColor: '#4a6fa5'
        });
      }
    };
    
    cargarDepartamentosConAreas();
  }, []);
  
  // Manejar selección de departamento y área
  const handleSeleccionDepartamentoArea = (departamento, area) => {
    // Convertir área a mayúsculas
    const areaMayusculas = area.toUpperCase().trim();
    
    const existe = departamentosSeleccionados.find(
      item => item.departamento === departamento && item.area === areaMayusculas
    );
    
    if (existe) {
      // Si ya está seleccionado, lo quitamos
      const nuevosSeleccionados = departamentosSeleccionados.filter(item => 
        !(item.departamento === departamento && item.area === areaMayusculas)
      );
      setDepartamentosSeleccionados(nuevosSeleccionados);
      
      // También quitamos todos los objetivos específicos asociados a esta área
      const nuevosObjetivosEspecificos = objetivosEspecificos.filter(obj => 
        !(obj.departamento === departamento && obj.area === areaMayusculas)
      );
      setObjetivosEspecificos(nuevosObjetivosEspecificos);
      
      // También quitamos todos los objetivos detallados asociados a esta área
      const nuevosObjetivosPorModulo = objetivosPorModulo.filter(obj => 
        !(obj.departamento === departamento && obj.area === areaMayusculas)
      );
      setObjetivosPorModulo(nuevosObjetivosPorModulo);
    } else {
      // Si no está, lo agregamos con área en mayúsculas
      setDepartamentosSeleccionados([
        ...departamentosSeleccionados,
        { departamento, area: areaMayusculas }
      ]);
    }
  };
  
  // Agregar nuevo objetivo específico (módulo)
  const agregarNuevoObjetivoEspecifico = () => {
    if (departamentosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin áreas seleccionadas',
        text: 'Primero selecciona al menos un área en el Paso 2',
        confirmButtonColor: '#4a6fa5'
      });
      return;
    }
    
    // Mostrar selector de área
    Swal.fire({
      title: 'Agregar Nuevo Objetivo Específico',
      html: `
        <p>Selecciona el área para el nuevo objetivo específico:</p>
        <select id="area-select" class="swal2-select">
          ${departamentosSeleccionados.map((item, index) => 
            `<option value="${index}">${item.departamento} - ${item.area}</option>`
          ).join('')}
        </select>
        <br/><br/>
        <p>Nombre del Objetivo Específico:</p>
        <input type="text" id="nombre-objetivo" class="swal2-input" placeholder="Ej: Optimizar procesos de compras">
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a6fa5',
      preConfirm: () => {
        const select = document.getElementById('area-select');
        const nombreInput = document.getElementById('nombre-objetivo');
        const selectedIndex = select.value;
        const nombre = nombreInput.value.trim();
        
        if (!nombre) {
          Swal.showValidationMessage('El nombre del objetivo específico es requerido');
          return false;
        }
        
        return {
          selectedIndex: parseInt(selectedIndex),
          nombre: nombre
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { selectedIndex, nombre } = result.value;
        const selectedArea = departamentosSeleccionados[selectedIndex];
        
        const nuevoObjetivoEspecifico = {
          id: Date.now() + Math.random(), // ID único temporal
          departamento: selectedArea.departamento,
          area: selectedArea.area,
          nombre: nombre, // Nombre del objetivo específico (módulo)
          descripcion: '', // Descripción opcional
          objetivosDetallados: [] // Objetivos detallados dentro de este módulo
        };
        
        setObjetivosEspecificos(prev => [...prev, nuevoObjetivoEspecifico]);
        
        Swal.fire({
          icon: 'success',
          title: 'Objetivo específico creado',
          text: `Se agregó "${nombre}" para ${selectedArea.area}`,
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Agregar objetivo detallado dentro de un objetivo específico
  const agregarObjetivoDetallado = (objetivoEspecificoId) => {
    const objetivoEspecifico = objetivosEspecificos.find(obj => obj.id === objetivoEspecificoId);
    
    if (!objetivoEspecifico) return;
    
    Swal.fire({
      title: 'Agregar Objetivo Detallado',
      html: `
        <p>Área: <strong>${objetivoEspecifico.area}</strong></p>
        <p>Objetivo Específico: <strong>${objetivoEspecifico.nombre}</strong></p>
        <br/>
        <p>Descripción del Objetivo Detallado:</p>
        <textarea id="descripcion-objetivo" class="swal2-textarea" rows="3" placeholder="Describe el objetivo detallado"></textarea>
        <br/><br/>
        <p>Recursos:</p>
        <textarea id="recursos-objetivo" class="swal2-textarea" rows="2" placeholder="Recursos necesarios"></textarea>
        <br/><br/>
        <p>Meta / Frecuencia:</p>
        <input type="text" id="meta-objetivo" class="swal2-input" placeholder="Ej: 95% mensual">
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a6fa5',
      preConfirm: () => {
        const descripcion = document.getElementById('descripcion-objetivo').value.trim();
        const recursos = document.getElementById('recursos-objetivo').value.trim();
        const meta = document.getElementById('meta-objetivo').value.trim();
        
        if (!descripcion) {
          Swal.showValidationMessage('La descripción del objetivo es requerida');
          return false;
        }
        
        return {
          descripcion: descripcion,
          recursos: recursos,
          meta: meta
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { descripcion, recursos, meta } = result.value;
        
        const nuevoObjetivoDetallado = {
          id: Date.now() + Math.random(),
          objetivoEspecificoId: objetivoEspecificoId,
          departamento: objetivoEspecifico.departamento,
          area: objetivoEspecifico.area,
          objetivoEspecificoNombre: objetivoEspecifico.nombre,
          descripcion: descripcion,
          recursos: recursos,
          metaFrecuencia: meta
        };
        
        setObjetivosPorModulo(prev => [...prev, nuevoObjetivoDetallado]);
        
        Swal.fire({
          icon: 'success',
          title: 'Objetivo agregado',
          text: 'El objetivo detallado ha sido agregado correctamente',
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Eliminar objetivo específico (módulo)
  const eliminarObjetivoEspecifico = (id) => {
    Swal.fire({
      title: '¿Eliminar este objetivo específico?',
      text: 'Se eliminarán todos los objetivos detallados asociados. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#4a6fa5',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Eliminar el objetivo específico
        const nuevosObjetivosEspecificos = objetivosEspecificos.filter(obj => obj.id !== id);
        setObjetivosEspecificos(nuevosObjetivosEspecificos);
        
        // Eliminar todos los objetivos detallados asociados
        const nuevosObjetivosDetallados = objetivosPorModulo.filter(obj => obj.objetivoEspecificoId !== id);
        setObjetivosPorModulo(nuevosObjetivosDetallados);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Objetivo específico y sus objetivos detallados han sido eliminados',
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Eliminar objetivo detallado
  const eliminarObjetivoDetallado = (id) => {
    Swal.fire({
      title: '¿Eliminar este objetivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#4a6fa5',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevosObjetivos = objetivosPorModulo.filter(obj => obj.id !== id);
        setObjetivosPorModulo(nuevosObjetivos);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Objetivo eliminado correctamente',
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Editar objetivo específico (módulo)
  const editarObjetivoEspecifico = (id) => {
    const objetivoEspecifico = objetivosEspecificos.find(obj => obj.id === id);
    
    if (!objetivoEspecifico) return;
    
    Swal.fire({
      title: 'Editar Objetivo Específico',
      html: `
        <p>Área: <strong>${objetivoEspecifico.area}</strong></p>
        <br/>
        <p>Nombre del Objetivo Específico:</p>
        <input type="text" id="nombre-edit" class="swal2-input" value="${objetivoEspecifico.nombre}" placeholder="Nombre del objetivo específico">
        <br/><br/>
        <p>Descripción (opcional):</p>
        <textarea id="descripcion-edit" class="swal2-textarea" rows="3" placeholder="Descripción adicional">${objetivoEspecifico.descripcion || ''}</textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a6fa5',
      preConfirm: () => {
        const nombre = document.getElementById('nombre-edit').value.trim();
        const descripcion = document.getElementById('descripcion-edit').value.trim();
        
        if (!nombre) {
          Swal.showValidationMessage('El nombre del objetivo específico es requerido');
          return false;
        }
        
        return { nombre, descripcion };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { nombre, descripcion } = result.value;
        
        const nuevosObjetivos = objetivosEspecificos.map(obj => 
          obj.id === id ? { ...obj, nombre, descripcion } : obj
        );
        
        setObjetivosEspecificos(nuevosObjetivos);
        
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Objetivo específico actualizado correctamente',
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Editar objetivo detallado
  const editarObjetivoDetallado = (id) => {
    const objetivoDetallado = objetivosPorModulo.find(obj => obj.id === id);
    
    if (!objetivoDetallado) return;
    
    Swal.fire({
      title: 'Editar Objetivo Detallado',
      html: `
        <p>Área: <strong>${objetivoDetallado.area}</strong></p>
        <p>Objetivo Específico: <strong>${objetivoDetallado.objetivoEspecificoNombre}</strong></p>
        <br/>
        <p>Descripción del Objetivo:</p>
        <textarea id="descripcion-edit-detalle" class="swal2-textarea" rows="3">${objetivoDetallado.descripcion}</textarea>
        <br/><br/>
        <p>Recursos:</p>
        <textarea id="recursos-edit-detalle" class="swal2-textarea" rows="2">${objetivoDetallado.recursos}</textarea>
        <br/><br/>
        <p>Meta / Frecuencia:</p>
        <input type="text" id="meta-edit-detalle" class="swal2-input" value="${objetivoDetallado.metaFrecuencia}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a6fa5',
      preConfirm: () => {
        const descripcion = document.getElementById('descripcion-edit-detalle').value.trim();
        const recursos = document.getElementById('recursos-edit-detalle').value.trim();
        const meta = document.getElementById('meta-edit-detalle').value.trim();
        
        if (!descripcion) {
          Swal.showValidationMessage('La descripción del objetivo es requerida');
          return false;
        }
        
        return { descripcion, recursos, meta };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { descripcion, recursos, meta } = result.value;
        
        const nuevosObjetivos = objetivosPorModulo.map(obj => 
          obj.id === id ? { ...obj, descripcion, recursos, metaFrecuencia: meta } : obj
        );
        
        setObjetivosPorModulo(nuevosObjetivos);
        
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Objetivo actualizado correctamente',
          confirmButtonColor: '#4a6fa5',
          timer: 1500
        });
      }
    });
  };
  
  // Validar paso actual
  const validarPaso = () => {
    switch(pasoActual) {
      case 1:
        if (!nombreObjetivoGeneral.trim()) {
          Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Debes ingresar un nombre para el objetivo general',
            confirmButtonColor: '#4a6fa5'
          });
          return false;
        }
        return true;
        
      case 2:
        if (departamentosSeleccionados.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Selección requerida',
            text: 'Debes seleccionar al menos un departamento y área',
            confirmButtonColor: '#4a6fa5'
          });
          return false;
        }
        return true;
        
      case 3:
        if (objetivosEspecificos.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin objetivos específicos',
            text: 'Debes agregar al menos un objetivo específico (módulo)',
            confirmButtonColor: '#4a6fa5'
          });
          return false;
        }
        
        // Verificar que cada objetivo específico tenga al menos un objetivo detallado
        for (const objetivoEspecifico of objetivosEspecificos) {
          const objetivosDetallados = objetivosPorModulo.filter(
            obj => obj.objetivoEspecificoId === objetivoEspecifico.id
          );
          
          if (objetivosDetallados.length === 0) {
            Swal.fire({
              icon: 'warning',
              title: 'Objetivos incompletos',
              text: `El objetivo específico "${objetivoEspecifico.nombre}" no tiene objetivos detallados. Agrega al menos uno.`,
              confirmButtonColor: '#4a6fa5'
            });
            return false;
          }
        }
        
        return true;
        
      default:
        return true;
    }
  };
  
  // Avanzar al siguiente paso
  const siguientePaso = () => {
    if (validarPaso()) {
      if (pasoActual < 3) {
        setPasoActual(pasoActual + 1);
      }
    }
  };
  
  // Regresar al paso anterior
  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };
  
// Guardar objetivo completo - VERSIÓN CORREGIDA
const guardarObjetivo = async () => {
  if (!validarPaso()) return;
  
  try {
    const usuarioInfo = {
      id: userData?._id,
      nombre: userData?.Nombre || userData?.nombre || 'Administrador'
    };
    
    // ✅ CORRECCIÓN: Preparar estructura jerárquica antes de transformar objetivos
    const estructuraJerarquica = {
      objetivosEspecificos: objetivosEspecificos.map(objEsp => {
        const objetivosDetalladosDeEsteModulo = objetivosPorModulo.filter(
          obj => obj.objetivoEspecificoId === objEsp.id
        );
        
        return {
          nombre: objEsp.nombre,
          descripcion: objEsp.descripcion || '',
          departamento: objEsp.departamento,
          area: objEsp.area,
          objetivosDetallados: objetivosDetalladosDeEsteModulo.map(objDet => ({
            descripcion: objDet.descripcion,
            recursos: objDet.recursos || '',
            metaFrecuencia: objDet.metaFrecuencia || ''
          }))
        };
      }),
      objetivosDetalladosPorModulo: objetivosEspecificos.map(objEsp => {
        const objetivosDetalladosDeEsteModulo = objetivosPorModulo.filter(
          obj => obj.objetivoEspecificoId === objEsp.id
        );
        
        return {
          objetivoEspecificoId: objEsp.id.toString(), // ✅ IMPORTANTE: Convertir a string
          objetivoEspecificoNombre: objEsp.nombre,
          cantidadObjetivosDetallados: objetivosDetalladosDeEsteModulo.length
        };
      })
    };
    
    // Transformar la estructura jerárquica para la API
    const objetivosTransformados = [];
    
    objetivosEspecificos.forEach(objetivoEspecifico => {
      const objetivosDetalladosDeEsteModulo = objetivosPorModulo.filter(
        obj => obj.objetivoEspecificoId === objetivoEspecifico.id
      );
      
      // Para cada objetivo detallado, crear un registro en objetivosEspecificos del modelo
      objetivosDetalladosDeEsteModulo.forEach(objetivoDetallado => {
        objetivosTransformados.push({
          departamento: objetivoDetallado.departamento,
          area: objetivoDetallado.area.toUpperCase().trim(),
          objetivoEspecifico: objetivoEspecifico.nombre, // Guardamos el nombre del módulo
          objetivo: objetivoDetallado.descripcion, // El objetivo detallado
          recursos: objetivoDetallado.recursos || "",
          metaFrecuencia: objetivoDetallado.metaFrecuencia || "",
          observaciones: "",
          indicadorENEABR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorFEB: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorMAR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorABR: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorMAYOAGO: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorJUN: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorJUL: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorAGO: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorSEPDIC: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorOCT: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorNOV: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          indicadorDIC: { S1: "", S2: "", S3: "", S4: "", S5: "" },
          accionesCorrectivas: [],
          historialAnual: []
        });
      });
    });
    
    // Extraer departamentos únicos
    const departamentosUnicos = [...new Set(objetivosTransformados.map(item => item.departamento))];
    
    // Extraer áreas únicas
    const areasUnicas = [...new Set(objetivosTransformados.map(item => item.area))];
    
    const objetivoData = {
      nombreObjetivoGeneral,
      departamentosAsignados: departamentosUnicos,
      objetivosEspecificos: objetivosTransformados,
      estructuraJerarquica, // ✅ Añadimos la estructura jerárquica limpia
      usuario: usuarioInfo,
      activo: true,
      añoActual: new Date().getFullYear()
    };
    
    console.log('📤 Datos a enviar:');
    console.log('Nombre objetivo general:', nombreObjetivoGeneral);
    console.log('Total objetivos específicos (módulos):', objetivosEspecificos.length);
    console.log('Total objetivos detallados:', objetivosPorModulo.length);
    console.log('Departamentos involucrados:', departamentosUnicos);
    console.log('Áreas involucradas:', areasUnicas);
    console.log('Estructura jerárquica a enviar:', JSON.stringify(estructuraJerarquica, null, 2));
    
    const response = await api.post('/api/objetivos/multi-departamento', objetivoData);
    
    Swal.fire({
      icon: 'success',
      title: '¡Objetivo creado!',
      html: `
        <p>Se ha creado el objetivo: <strong>${nombreObjetivoGeneral}</strong></p>
        <p>Objetivos específicos (módulos): <strong>${objetivosEspecificos.length}</strong></p>
        <p>Objetivos detallados: <strong>${objetivosPorModulo.length}</strong></p>
        <p>Áreas involucradas: <strong>${areasUnicas.length}</strong></p>
      `,
      confirmButtonColor: '#4a6fa5'
    }).then(() => {
      navigate('/objetivos');
    });
    
  } catch (error) {
    console.error('Error al crear objetivo:', error);
    console.error('Detalles del error:', error.response?.data);
    
    Swal.fire({
      icon: 'error',
      title: 'Error',
      html: `
        <p>${error.response?.data?.error || 'No se pudo crear el objetivo.'}</p>
        ${error.response?.data?.validationErrors ? 
          `<p><small>Detalles: ${JSON.stringify(error.response.data.validationErrors)}</small></p>` : 
          ''}
      `,
      confirmButtonColor: '#4a6fa5'
    });
  }
};
  
  // Función para verificar si un departamento/área está seleccionado
  const estaSeleccionado = (departamento, area) => {
    // Convertir área a mayúsculas para la comparación
    const areaMayusculas = area.toUpperCase().trim();
    
    return departamentosSeleccionados.some(
      item => item.departamento === departamento && item.area === areaMayusculas
    );
  };
  
  // Contar objetivos específicos por área
  const contarObjetivosEspecificosPorArea = (departamento, area) => {
    return objetivosEspecificos.filter(obj => 
      obj.departamento === departamento && obj.area === area.toUpperCase().trim()
    ).length;
  };
  
  // Contar objetivos detallados por área
  const contarObjetivosDetalladosPorArea = (departamento, area) => {
    return objetivosPorModulo.filter(obj => 
      obj.departamento === departamento && obj.area === area.toUpperCase().trim()
    ).length;
  };
  
  // Renderizar paso actual
  const renderPaso = () => {
    switch(pasoActual) {
      case 1:
        return (
          <div className="paso-container">
            <h3>Paso 1: Nombre del Objetivo General</h3>
            <div className="form-group">
              <label htmlFor="nombreObjetivo">Nombre del Objetivo General *</label>
              <input
                type="text"
                id="nombreObjetivo"
                value={nombreObjetivoGeneral}
                onChange={(e) => setNombreObjetivoGeneral(e.target.value)}
                placeholder="Ej: Mejorar la eficiencia operativa"
                className="form-input"
              />
              <p className="helper-text">Este nombre será visible para todos los departamentos y áreas asignados</p>
            </div>
            
            <div className="ejemplo-container">
              <h4>Ejemplos:</h4>
              <ul>
                <li>Optimizar procesos administrativos</li>
                <li>Incrementar la satisfacción del cliente</li>
                <li>Reducir costos operativos</li>
                <li>Mejorar la calidad de productos/servicios</li>
              </ul>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="paso-container">
            <h3>Paso 2: Seleccionar Departamentos y Áreas</h3>
            <p className="instrucciones">Selecciona las áreas específicas que podrán ver y gestionar este objetivo:</p>
            
            {loading ? (
              <div className="loading-departamentos">
                <div className="spinner"></div>
                <p>Cargando departamentos y áreas...</p>
              </div>
            ) : (
              <div className="departamentos-areas-container">
                {departamentosConAreas.map((depto, deptoIndex) => (
                  <div key={deptoIndex} className="departamento-section">
                    <h4 className="departamento-titulo">{depto.departamento}</h4>
                    
                    {depto.areas.length === 0 ? (
                      <div className="sin-areas">
                        <p>Este departamento no tiene áreas definidas</p>
                      </div>
                    ) : (
                      <div className="areas-grid">
                        {depto.areas.map((area, areaIndex) => {
                          const seleccionada = estaSeleccionado(depto.departamento, area);
                          const cantidadObjetivosEspecificos = contarObjetivosEspecificosPorArea(depto.departamento, area);
                          const cantidadObjetivosDetallados = contarObjetivosDetalladosPorArea(depto.departamento, area);
                          
                          return (
                            <div 
                              key={areaIndex}
                              className={`area-card ${seleccionada ? 'seleccionada' : ''}`}
                              onClick={() => handleSeleccionDepartamentoArea(depto.departamento, area)}
                            >
                              <div className="area-checkbox">
                                {seleccionada ? '✓' : ''}
                              </div>
                              <div className="area-info">
                                <div className="area-nombre">{area}</div>
                                <div className="area-departamento">{depto.departamento}</div>
                                {seleccionada && (
                                  <div className="area-contadores">
                                    {cantidadObjetivosEspecificos > 0 && (
                                      <div className="area-contador">
                                        {cantidadObjetivosEspecificos} módulo{cantidadObjetivosEspecificos !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                    {cantidadObjetivosDetallados > 0 && (
                                      <div className="area-contador">
                                        {cantidadObjetivosDetallados} objetivo{cantidadObjetivosDetallados !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="seleccionados-info">
              <h4>Áreas seleccionadas:</h4>
              {departamentosSeleccionados.length === 0 ? (
                <p className="no-seleccionados">No hay áreas seleccionadas</p>
              ) : (
                <div className="seleccionados-lista">
                  {departamentosSeleccionados.map((item, index) => {
                    const cantidadObjetivosEspecificos = contarObjetivosEspecificosPorArea(item.departamento, item.area);
                    const cantidadObjetivosDetallados = contarObjetivosDetalladosPorArea(item.departamento, item.area);
                    return (
                      <span key={index} className="badge-area">
                        {item.departamento} - {item.area}
                        {cantidadObjetivosEspecificos > 0 && (
                          <span className="badge-contador">{cantidadObjetivosEspecificos}M</span>
                        )}
                        {cantidadObjetivosDetallados > 0 && (
                          <span className="badge-contador">{cantidadObjetivosDetallados}O</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="paso-container">
            <div className="paso-header">
              <h3>Paso 3: Definir Estructura Jerárquica de Objetivos</h3>
              <button 
                className="btn-agregar-objetivo"
                onClick={agregarNuevoObjetivoEspecifico}
                disabled={departamentosSeleccionados.length === 0}
              >
                <span>+</span> Agregar Nuevo Objetivo Específico
              </button>
            </div>
            
            <div className="instrucciones-container">
              <div className="estructura-explicacion">
                <h4>Estructura Jerárquica:</h4>
                <ol className="estructura-lista">
                  <li><strong>Objetivo General:</strong> {nombreObjetivoGeneral || 'No definido'}</li>
                  <li><strong>Objetivos Específicos (Módulos):</strong> Subcategorías o áreas focales dentro del objetivo general</li>
                  <li><strong>Objetivos Detallados:</strong> Objetivos específicos y medibles dentro de cada módulo</li>
                </ol>
              </div>
              
              <div className="estadisticas-objetivos">
                <div className="estadistica">
                  <span className="estadistica-valor">{objetivosEspecificos.length}</span>
                  <span className="estadistica-label">Objetivos Específicos</span>
                </div>
                <div className="estadistica">
                  <span className="estadistica-valor">{objetivosPorModulo.length}</span>
                  <span className="estadistica-label">Objetivos Detallados</span>
                </div>
                <div className="estadistica">
                  <span className="estadistica-valor">{departamentosSeleccionados.length}</span>
                  <span className="estadistica-label">Áreas</span>
                </div>
              </div>
            </div>
            
            {objetivosEspecificos.length === 0 ? (
              <div className="sin-objetivos">
                <div className="sin-objetivos-icon">📋</div>
                <h4>No hay objetivos específicos definidos</h4>
                <p>Crea un objetivo específico (módulo) para comenzar a definir la estructura jerárquica</p>
                <button 
                  className="btn-agregar-primer"
                  onClick={agregarNuevoObjetivoEspecifico}
                  disabled={departamentosSeleccionados.length === 0}
                >
                  + Crear Primer Objetivo Específico
                </button>
              </div>
            ) : (
              <div className="objetivos-jerarquicos-container">
                {objetivosEspecificos.map((objetivoEspecifico, index) => {
                  const objetivosDetallados = objetivosPorModulo.filter(
                    obj => obj.objetivoEspecificoId === objetivoEspecifico.id
                  );
                  
                  return (
                    <div key={objetivoEspecifico.id} className="modulo-objetivo-container">
                      <div className="modulo-header">
                        <div className="modulo-header-left">
                          <div className="modulo-indice">
                            <span className="modulo-numero">3.{index + 1}</span>
                            <div className="modulo-titulo-container">
                              <h4 className="modulo-titulo">{objetivoEspecifico.nombre}</h4>
                              <div className="modulo-subtitulo">
                                <span className="badge-area-card">{objetivoEspecifico.area}</span>
                                <span className="badge-depto-card">{objetivoEspecifico.departamento}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modulo-header-right">
                          <button
                            className="btn-editar-modulo"
                            onClick={() => editarObjetivoEspecifico(objetivoEspecifico.id)}
                            title="Editar objetivo específico"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-agregar-objetivo-modulo"
                            onClick={() => agregarObjetivoDetallado(objetivoEspecifico.id)}
                            title="Agregar objetivo detallado"
                          >
                            + Agregar Objetivo
                          </button>
                          <button
                            className="btn-eliminar-modulo"
                            onClick={() => eliminarObjetivoEspecifico(objetivoEspecifico.id)}
                            title="Eliminar objetivo específico y todos sus objetivos"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      {objetivoEspecifico.descripcion && (
                        <div className="modulo-descripcion">
                          <p>{objetivoEspecifico.descripcion}</p>
                        </div>
                      )}
                      
                      {objetivosDetallados.length === 0 ? (
                        <div className="sin-objetivos-detallados">
                          <div className="sin-detallados-icon">📝</div>
                          <p>Este objetivo específico no tiene objetivos detallados</p>
                          <button
                            className="btn-agregar-primer-detallado"
                            onClick={() => agregarObjetivoDetallado(objetivoEspecifico.id)}
                          >
                            + Agregar Primer Objetivo Detallado
                          </button>
                        </div>
                      ) : (
                        <div className="objetivos-detallados-container">
                          <h5 className="titulo-objetivos-detallados">
                            Objetivos Detallados ({objetivosDetallados.length})
                          </h5>
                          
                          {objetivosDetallados.map((objetivoDetallado, detalleIndex) => (
                            <div key={objetivoDetallado.id} className="objetivo-detallado-card">
                              <div className="detallado-header">
                                <div className="detallado-header-left">
                                  <h6>Objetivo {index + 1}.{detalleIndex + 1}</h6>
                                </div>
                                <div className="detallado-header-right">
                                  <button
                                    className="btn-editar-detallado"
                                    onClick={() => editarObjetivoDetallado(objetivoDetallado.id)}
                                    title="Editar objetivo"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className="btn-eliminar-detallado"
                                    onClick={() => eliminarObjetivoDetallado(objetivoDetallado.id)}
                                    title="Eliminar objetivo"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                              
                              <div className="detallado-contenido">
                                <div className="detallado-descripcion">
                                  <strong>Descripción:</strong>
                                  <p>{objetivoDetallado.descripcion}</p>
                                </div>
                                
                                <div className="detallado-metadatos">
                                  {objetivoDetallado.recursos && (
                                    <div className="detallado-metadato">
                                      <strong>Recursos:</strong>
                                      <span>{objetivoDetallado.recursos}</span>
                                    </div>
                                  )}
                                  
                                  {objetivoDetallado.metaFrecuencia && (
                                    <div className="detallado-metadato">
                                      <strong>Meta/Frecuencia:</strong>
                                      <span>{objetivoDetallado.metaFrecuencia}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {objetivosEspecificos.length > 0 && (
              <div className="botones-inferiores">
                <button 
                  className="btn-agregar-mas"
                  onClick={agregarNuevoObjetivoEspecifico}
                  disabled={departamentosSeleccionados.length === 0}
                >
                  + Agregar Otro Objetivo Específico
                </button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="crear-objetivo-container">
      <div className="header-creacion">
        <h2>Crear Nuevo Objetivo Multi-Departamento/Área</h2>
        <p>Sigue los 3 pasos para crear un objetivo jerárquico con estructura de módulos y objetivos detallados</p>
      </div>
      
      {/* Barra de progreso */}
      <div className="progress-bar">
        <div className="progress-steps">
          <div className={`step ${pasoActual >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Objetivo General</div>
          </div>
          <div className={`step ${pasoActual >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Seleccionar Áreas</div>
          </div>
          <div className={`step ${pasoActual >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Estructura Jerárquica</div>
          </div>
        </div>
      </div>
      
      {/* Contenido del paso actual */}
      <div className="paso-content">
        {renderPaso()}
      </div>
      
      {/* Controles de navegación */}
      <div className="navegacion-pasos">
        <div className="navegacion-izquierda">
          {pasoActual > 1 && (
            <button 
              className="btn-paso-anterior"
              onClick={pasoAnterior}
            >
              ← Paso Anterior
            </button>
          )}
        </div>
        
        <div className="navegacion-derecha">
          {pasoActual < 3 ? (
            <button 
              className="btn-siguiente"
              onClick={siguientePaso}
            >
              Siguiente Paso →
            </button>
          ) : (
            <button 
              className="btn-guardar"
              onClick={guardarObjetivo}
            >
              Guardar Objetivo Completo
            </button>
          )}
        </div>
      </div>
      
      {/* Resumen */}
      <div className="resumen-creacion">
        <h4>Resumen de la creación:</h4>
        <div className="resumen-grid">
          <div className="resumen-item">
            <span className="resumen-label">Objetivo General:</span>
            <span className="resumen-valor">{nombreObjetivoGeneral || 'No definido'}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Áreas seleccionadas:</span>
            <span className="resumen-valor">
              {departamentosSeleccionados.length > 0 
                ? `${departamentosSeleccionados.length} área(s)` 
                : 'No seleccionadas'}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Objetivos Específicos:</span>
            <span className="resumen-valor">
              {objetivosEspecificos.length > 0 
                ? `${objetivosEspecificos.length} módulo(s)` 
                : 'Por definir'}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Objetivos Detallados:</span>
            <span className="resumen-valor">
              {objetivosPorModulo.length > 0 
                ? `${objetivosPorModulo.length} objetivo(s)` 
                : 'Por definir'}
            </span>
          </div>
        </div>
        
        {/* Detalle de estructura jerárquica */}
        {(objetivosEspecificos.length > 0) && (
          <div className="detalle-estructura">
            <h5>Estructura Jerárquica:</h5>
            <div className="arbol-estructura">
              <div className="nivel-1">
                <div className="nodo nodo-general">
                  <span className="nodo-titulo">1. Objetivo General</span>
                  <span className="nodo-contenido">{nombreObjetivoGeneral}</span>
                </div>
              </div>
              
              <div className="conector"></div>
              
              <div className="nivel-2">
                {objetivosEspecificos.map((objEspecifico, idx) => {
                  const objetivosDetallados = objetivosPorModulo.filter(
                    obj => obj.objetivoEspecificoId === objEspecifico.id
                  );
                  
                  return (
                    <div key={idx} className="subarbol">
                      <div className="nodo nodo-especifico">
                        <span className="nodo-titulo">2.{idx + 1} {objEspecifico.area}</span>
                        <span className="nodo-contenido">{objEspecifico.nombre}</span>
                        <span className="nodo-meta">
                          {objetivosDetallados.length} objetivo{objetivosDetallados.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {objetivosDetallados.length > 0 && (
                        <>
                          <div className="conector-hijo"></div>
                          <div className="nivel-3">
                            {objetivosDetallados.slice(0, 3).map((objDetallado, detIdx) => (
                              <div key={detIdx} className="nodo nodo-detallado">
                                <span className="nodo-titulo">3.{idx + 1}.{detIdx + 1}</span>
                                <span className="nodo-contenido">
                                  {objDetallado.descripcion.substring(0, 40)}...
                                </span>
                              </div>
                            ))}
                            {objetivosDetallados.length > 3 && (
                              <div className="nodo nodo-mas">
                                <span className="nodo-contenido">
                                  +{objetivosDetallados.length - 3} más...
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Detalle por área */}
        {(departamentosSeleccionados.length > 0) && (
          <div className="detalle-areas-completo">
            <h5>Distribución por área:</h5>
            <div className="areas-distribucion">
              {departamentosSeleccionados.map((area, index) => {
                const objetivosEspecificosArea = objetivosEspecificos.filter(obj => 
                  obj.departamento === area.departamento && 
                  obj.area === area.area
                );
                
                const objetivosDetalladosArea = objetivosPorModulo.filter(obj => 
                  obj.departamento === area.departamento && 
                  obj.area === area.area
                );
                
                return (
                  <div key={index} className="area-distribucion">
                    <div className="area-distribucion-header">
                      <span className="area-distribucion-nombre">{area.area}</span>
                      <span className="area-distribucion-depto">{area.departamento}</span>
                      <span className="area-distribucion-contadores">
                        {objetivosEspecificosArea.length} módulo{objetivosEspecificosArea.length !== 1 ? 's' : ''}
                        , {objetivosDetalladosArea.length} objetivo{objetivosDetalladosArea.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {objetivosEspecificosArea.length > 0 && (
                      <div className="modulos-area-lista">
                        {objetivosEspecificosArea.map((objEsp, espIdx) => {
                          const detallados = objetivosDetalladosArea.filter(
                            obj => obj.objetivoEspecificoId === objEsp.id
                          );
                          
                          return (
                            <div key={espIdx} className="modulo-resumen">
                              <span className="modulo-resumen-nombre">{objEsp.nombre}</span>
                              <span className="modulo-resumen-contador">
                                {detallados.length} objetivo{detallados.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrearObjetivoMultiDepartamento;