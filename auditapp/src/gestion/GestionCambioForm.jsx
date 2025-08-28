// ===================== IMPORTS Y CONTEXTOS =====================
import React, { useState, useEffect, useRef, useContext} from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import SignaturePopup from './SignaturePopup';
import { UserContext } from '../App';
import './css/GestionForm.css';
import Seccion1 from './secciones/Seccion1';
import Seccion2 from './secciones/Seccion2';
import Seccion3 from './secciones/Seccion3';
import Seccion4 from './secciones/Seccion4';
import Seccion5 from './secciones/Seccion5';
import Seccion6 from './secciones/Seccion6';
import Seccion7 from './secciones/Seccion7';
import Seccion8 from './secciones/Seccion8';
import Seccion9 from './secciones/Seccion9';

// ===================== COMPONENTE PRINCIPAL =====================
export default function GestionCambioForm() {
  // ===================== ESTADOS Y REFS PRINCIPALES =====================
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);



  const [userNames, setUserNames] = useState([]);

  const [formData, setFormData] = useState({
    solicitante: '',
    areaSolicitante: '',
    lugar: '',
    liderProyecto: '',
    fechaSolicitud: '',
    fechaPlaneada: '',
    tipoCambio: '',
    impactosSeleccionados: [],
    impactosData: {
      productos: '', sistemasEquipos: '', localesProduccion: '', programasLimpieza: '',
      sistemasEmbalaje: '', nivelesPersonal: '', requisitosLegales: '', conocimientosPeligros: '',
      requisitosCliente: '', consultasPartes: '', quejasPeligros: '', otrasCondiciones: ''
    },
    causa: {
      solicitudCliente: false, reparacionDefecto: false, accionPreventiva: false,
      actualizacionDocumento: false, accionCorrectiva: false, otros: ''
    },
    descripcionPropuesta: '',
    justificacion: '',
    implicaciones: { riesgos: false, recursos: false, documentacion: false, otros: false },
    consecuencias: '',
    riesgosCards: [],
    firmadoPor: {
      solicitado: [{ nombre: '', cargo: '', firma: '', email: '' }],
      evaluado: [],
      aprobado: [],
      implementado: [],
      validado: []
    },
    estado: 'pendiente'
  });

  // errores por campo (keys: 'solicitante', 'tipoCambio', 'firma_solicitado', etc.)
  const [errors, setErrors] = useState({});
  // mapa de faltantes por sección {1: ['Solicitante','Fecha'], 9: ['Firma: solicitado (nombre)']}
  const [missingMap, setMissingMap] = useState({});
  const [alertBanner, setAlertBanner] = useState(null); // texto HTML o string simple para mostrar arriba
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [sigRole, setSigRole] = useState(null);
  const sectionRefs = useRef([]);

  // ===================== EFECTOS: CARGA DE DATOS Y NORMALIZACIÓN =====================
  useEffect(() => {
  const loadNames = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/usuarios/nombres`);
if (!res || !res.data) return;

// Si viene un array de strings, mantenemos compatibilidad.
// Si viene array de objetos {Nombre, Puesto, Correo} lo almacenamos tal cual.
if (Array.isArray(res.data) && res.data.length && typeof res.data[0] === 'string') {
  setUserNames(res.data.map(n => ({ Nombre: n })));
} else if (Array.isArray(res.data)) {
  // normalizar keys a mayúsculas esperadas si fuera necesario
  const users = res.data.map(u => ({
    Nombre: u.Nombre || u.nombre || (typeof u === 'string' ? u : ''),
    Puesto: u.Puesto || u.puesto || u.cargo || '',
    Correo: u.Correo || u.correo || u.email || ''
  })).filter(u => u.Nombre);
  setUserNames(users);
}

    } catch (err) {
      // si no existe el endpoint exacto, no romperá la app
      console.warn('No se pudieron cargar los nombres para Autocomplete', err);
    }
  };
  loadNames();
}, []);

  // Cargar si hay routeId
  useEffect(() => {
    if (!routeId) return;
    const load = async () => {
      try {
        const userName = encodeURIComponent(userData?.Nombre || userData?.nombre || '');
        const userEmail = encodeURIComponent(userData?.Correo || userData?.email || userData?.correo || '');

        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${routeId}?userName=${userName}&userEmail=${userEmail}`
        );
        const data = res.data || {};
        const toInputDate = (d) => {
          if (!d) return '';
          const date = new Date(d);
          if (isNaN(date)) return '';
          const pad = (n) => String(n).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        };
        const normalized = {
          ...data,
          fechaSolicitud: toInputDate(data.fechaSolicitud),
          fechaPlaneada: toInputDate(data.fechaPlaneada),
        };
        // después de obtener `data` desde backend y normalizar fechas:
const normalizedFirmado = normalizeFirmadoPorFront(data.firmadoPor);
setFormData(prev => ({
  ...prev,
  ...normalized, // tu objeto con fechas normalizadas, etc.
  firmadoPor: {
    // mantén prev.firmadoPor si existen datos locales (ej. while editando)
    ...prev.firmadoPor,
    ...normalizedFirmado
  }
}));

      } catch (err) {
        console.error('No se pudo cargar el registro:', err);
      }
    };
    load();
  }, [routeId]);

useEffect(() => {
  if (routeId) return;
  if (!userData) return;

  const nombre = userData.Nombre || '';
  const puesto = userData.Puesto || '';
  const area = userData.area || userData.Area || '';

  setFormData(prev => ({
    ...prev,
    solicitante: prev.solicitante || nombre,
    areaSolicitante: prev.areaSolicitante || area,
    firmadoPor: {
      ...prev.firmadoPor,
      // aseguramos un array con 1 objeto solo para solicitante cuando estamos creando
      solicitado: [{
        nombre: (prev.firmadoPor?.solicitado?.[0]?.nombre) || nombre,
        cargo: (prev.firmadoPor?.solicitado?.[0]?.cargo) || puesto,
        firma: (prev.firmadoPor?.solicitado?.[0]?.firma) || '',
        email: (prev.firmadoPor?.solicitado?.[0]?.email) || (userData.Correo || userData.email || '')
      }]
    }
  }));
}, [userData, routeId]);

useEffect(() => {
  if (!routeId) return; // <- sólo en edición/edición cargada desde backend
  setFormData(prev => {
    const fp = { ...(prev.firmadoPor || {}) };
    ['solicitado','evaluado','aprobado','implementado','validado'].forEach(role => {
      if (!Array.isArray(fp[role]) || fp[role].length === 0) {
        fp[role] = [{ nombre: '', cargo: '', firma: '' }];
      } else {
        fp[role] = fp[role].map(it => ({ nombre: it?.nombre || '', cargo: it?.cargo || '', firma: it?.firma || '' }));
      }
    });
    return { ...prev, firmadoPor: fp };
  });
}, [routeId]);

  // ===================== HANDLERS GENERALES =====================
  const openSignature = (role, idx = 0) => setSigRole({ role, idx });

  const handleSaveSig = (role, dataURL, idx = 0) => {

    setFormData(prev => {
      const fp = { ...(prev.firmadoPor || {}) };
      const arr = Array.isArray(fp[role]) ? [...fp[role]] : [];
      while (arr.length <= idx) arr.push({ nombre: '', cargo: '', firma: '' });
      arr[idx] = { ...arr[idx], firma: dataURL };
      fp[role] = arr;
      return { ...prev, firmadoPor: fp };
    });
    setSigRole(null);
  };

  const handleChange = (e) => {
    const { name, value, type, options } = e.target;
    if (type === 'select-multiple') {
      const selected = [];
      for (let i = 0; i < options.length; i++) if (options[i].selected) selected.push(options[i].value);
      setFormData(prev => ({ ...prev, impactosSeleccionados: selected }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleNestedChange = (section, name, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    if (errors[`${section}.${name}`]) setErrors(prev => ({ ...prev, [`${section}.${name}`]: null }));
  };

  const handleImpactoTextareaChange = (key, value) => {
    setFormData(prev => ({ ...prev, impactosData: { ...prev.impactosData, [key]: value } }));
  };

  // ----------------- Estados para añadir entradas de forma práctica -----------------
const [addMode, setAddMode] = useState({
  evaluado: false,
  implementado: false,
  validado: false,
  aprobado: false
});
const [addTemp, setAddTemp] = useState({
  evaluado: { nombre: '', cargo: '' },
  implementado: { nombre: '', cargo: '' },
  validado: { nombre: '', cargo: '' },
  aprobado: { nombre: '', cargo: '' }
});

// Helpers para añadir/cancelar/confirmar entradas (inline)
const startAdd = (role) => setAddMode(prev => ({ ...prev, [role]: true }));
const cancelAdd = (role) => setAddMode(prev => ({ ...prev, [role]: false }));
const confirmAdd = (role) => {
  setFormData(prev => {
    const cur = prev.firmadoPor && Array.isArray(prev.firmadoPor[role]) ? prev.firmadoPor[role] : [];
    const nextArr = [...cur, { nombre: (addTemp[role].nombre || ''), cargo: (addTemp[role].cargo || ''), firma: '', email: (addTemp[role].email || '') }];
    return { ...prev, firmadoPor: { ...prev.firmadoPor, [role]: nextArr } };
  });
  setAddTemp(prev => ({ ...prev, [role]: { nombre: '', cargo: '' } }));
  setAddMode(prev => ({ ...prev, [role]: false }));
};

// Si quieres eliminar entradas (no aplicable a solicitante)
const removeFirmaRole = (role, idx) => {
  setFormData(prev => ({
    ...prev,
    firmadoPor: {
      ...prev.firmadoPor,
      [role]: (prev.firmadoPor[role] || []).filter((_, i) => i !== idx)
    }
  }));
  setErrors(prev => {
    const next = { ...prev };
    delete next[`firma_${role}_${idx}_nombre`];
    delete next[`firma_${role}_${idx}_cargo`];
    return next;
  });
};

  // ===================== HANDLERS DE IMPLICACIONES Y RIESGOS =====================
  /* ---------- Helpers de estado y cambios ---------- */
// ===================== HELPERS PARA CARDS (RIESGOS / RECURSOS / DOCUMENTOS / OTRAS) =====================

// Asegura que exista *al menos una* card del tipo indicado (se usa al marcar checkbox en Sección 6)
const ensureCardForImplicacion = (tipoKey, extra = null) => {
  setFormData(prev => {
    const list = prev.riesgosCards || [];
    // si ya existe al menos una card de ese tipo, no hacemos nada
    const exists = list.some(c => c.tipoImplicacion === tipoKey && (extra ? c.otherLabel === extra : true));
    if (exists) return prev;

    const baseCard = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tipoImplicacion: tipoKey, // fijado desde el origen (Sección 6) o al agregar nuevo
      // campos para riesgos
      tipoPeligro: '', descripcionPeligro: '', probabilidad: '', severidad: '', nivelRiesgo: '', medidasControl: '', responsable: '', fechaCompromiso: '',
      // campos para recursos
      tipoRecursos: '', origenRecursos: '', costos: '', tiempoDisponible: '', fechaCompromisoRec: '', responsableRec: '',
      // documentos
      tipoDocumento: '', nombreDocumento: '', cambioRealizar: '', fechaCompromisoDoc: '', responsableDoc: '',
      // comunes/otras
      involucradosSelected: [], involucradosData: { SOCIOS: null, PROVEEDORES: null, AUTORIDADES: null, CLIENTES: null, OTROS: null },
      otherLabel: extra || null
    };

    return { ...prev, riesgosCards: [...list, baseCard] };
  });
};

// Remueve todas las cards de un tipo (se usa al desmarcar checkbox en Sección 6)
const removeCardsByTipo = (tipoKey, extra = null) => {
  setFormData(prev => ({
    ...prev,
    riesgosCards: (prev.riesgosCards || []).filter(c => {
      if (c.tipoImplicacion !== tipoKey) return true;
      if (extra && c.otherLabel !== extra) return true;
      return false;
    })
  }));
};

// Agregar una nueva card del tipo indicado (llamado desde Sección 8 "Agregar otro recurso/riesgo")
const addNewCard = (tipoKey, extra = null) => {
  const newId = Date.now() + Math.floor(Math.random() * 1000);
  const baseCard = {
    id: newId,
    tipoImplicacion: tipoKey,
    tipoPeligro: '', descripcionPeligro: '', probabilidad: '', severidad: '', nivelRiesgo: '', medidasControl: '', responsable: '', fechaCompromiso: '',
    tipoRecursos: '', origenRecursos: '', costos: '', tiempoDisponible: '', fechaCompromisoRec: '', responsableRec: '',
    tipoDocumento: '', nombreDocumento: '', cambioRealizar: '', fechaCompromisoDoc: '', responsableDoc: '',
    involucradosSelected: [], involucradosData: { SOCIOS: null, PROVEEDORES: null, AUTORIDADES: null, CLIENTES: null, OTROS: null },
    otherLabel: extra || null
  };
  setFormData(prev => ({ ...prev, riesgosCards: [...(prev.riesgosCards || []), baseCard] }));
  return newId;
};

// Eliminar una card por id, pero **proteger** que si la implicación está marcada no quede 0 cards
const removeCardById = (id) => {
  setFormData(prev => {
    const list = prev.riesgosCards || [];
    const card = list.find(c => c.id === id);
    if (!card) return prev;

    // si la card es de RIESGOS y la implicación está marcada, impedir eliminar la última
    if (card.tipoImplicacion === 'IMPLICACION_DE_RIESGOS' && prev.implicaciones?.riesgos) {
      const count = list.filter(c => c.tipoImplicacion === 'IMPLICACION_DE_RIESGOS').length;
      if (count <= 1) {
        alert('No puede eliminar la última card de Riesgos mientras la implicación "Riesgos" esté marcada en la Sección 6. Primero desmarque la implicación o agregue otra card.');
        return prev;
      }
    }

    // lo mismo para RECURSOS
    if (card.tipoImplicacion === 'RECURSOS' && prev.implicaciones?.recursos) {
      const count = list.filter(c => c.tipoImplicacion === 'RECURSOS').length;
      if (count <= 1) {
        alert('No puede eliminar la última card de Recursos mientras la implicación "Recursos" esté marcada en la Sección 6. Primero desmarque la implicación o agregue otra card.');
        return prev;
      }
    }

    // si todo bien, filtramos la card
    return { ...prev, riesgosCards: list.filter(c => c.id !== id) };
  });
};


  const handleImplicacionToggle = (name, checked) => {
    handleNestedChange('implicaciones', name, checked);
    if (checked) {
      if (name === 'riesgos') ensureCardForImplicacion('IMPLICACION_DE_RIESGOS');
      if (name === 'documentacion') ensureCardForImplicacion('DOCUMENTOS');
      if (name === 'recursos') ensureCardForImplicacion('RECURSOS');
      else if (name === 'otros') {ensureCardForImplicacion('OTRAS');}
    } else {
      if (name === 'riesgos') removeCardsByTipo('IMPLICACION_DE_RIESGOS');
      if (name === 'documentacion') removeCardsByTipo('DOCUMENTOS');
      if (name === 'recursos') removeCardsByTipo('RECURSOS');
      else if (name === 'otros') removeCardsByTipo('OTRAS');
    }
  };

  const handleImplicacionesOtrosChange = (value) => {
    handleNestedChange('implicaciones', 'otros', value);
    const trimmed = (value || '').trim();
    if (trimmed) {
      setFormData(prev => {
        const exists = prev.riesgosCards.some(c => c.tipoImplicacion === 'OTRAS' && c.otherLabel === trimmed);
        if (exists) return prev;
        const newCard = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          tipoImplicacion: 'OTRAS',
          otherLabel: trimmed,
          involucradosSelected: [], involucradosData: { SOCIOS: null, PROVEEDORES: null, AUTORIDADES: null, CLIENTES: null, OTROS: null }
        };
        return { ...prev, riesgosCards: [...prev.riesgosCards, newCard] };
      });
    } else {
      removeCardsByTipo('OTRAS');
    }
  };

  const updateRiesgoCardField = (id, field, value) => {
    setFormData(prev => ({ ...prev, riesgosCards: prev.riesgosCards.map(c => c.id === id ? { ...c, [field]: value } : c) }));
  };

  const toggleInvolucrado = (cardId, involucrado, checked) => {
    setFormData(prev => ({
      ...prev,
      riesgosCards: prev.riesgosCards.map(c => {
        if (c.id !== cardId) return c;
        const selected = new Set(c.involucradosSelected || []);
        const data = { ...c.involucradosData };
        if (checked) {
          selected.add(involucrado);
          if (!data[involucrado]) data[involucrado] = { tipoAfectacion: '', generaCostos: false, medidasControl: '', fechaCompromiso: '', responsable: '' };
        } else {
          selected.delete(involucrado);
          data[involucrado] = null;
        }
        return { ...c, involucradosSelected: Array.from(selected), involucradosData: data };
      })
    }));
  };

  const updateInvolucradoField = (cardId, involucrado, field, value) => {
    setFormData(prev => ({
      ...prev,
      riesgosCards: prev.riesgosCards.map(c => {
        if (c.id !== cardId) return c;
        const data = { ...(c.involucradosData || {}) };
        data[involucrado] = { ...(data[involucrado] || {}), [field]: value };
        return { ...c, involucradosData: data };
      })
    }));
  };

  // ===================== VALIDACIONES =====================
  // label helpers para mensajes legibles
  const labelFor = {
    solicitante: 'Solicitante', areaSolicitante: 'Área solicitante', lugar: 'Lugar',
    fechaSolicitud: 'Fecha de solicitud', fechaPlaneada: 'Fecha planeada', tipoCambio: 'Tipo de cambio',
    descripcionPropuesta: 'Descripción propuesta', justificacion: 'Justificación',
    implicaciones: 'Implicaciones', consecuencias: 'Consecuencias'
  };

  // valida sección y devuelve array de mensajes legibles; también actualiza `errors` para marcar inputs
  const validateSection = (section) => {
    const newErrors = {};
    const missing = [];

    switch (section) {
      case 1:
        if (!formData.solicitante) { newErrors.solicitante = 'Requerido'; missing.push(labelFor.solicitante); }
        if (!formData.areaSolicitante) { newErrors.areaSolicitante = 'Requerido'; missing.push(labelFor.areaSolicitante); }
        if (!formData.lugar) { newErrors.lugar = 'Requerido'; missing.push(labelFor.lugar); }
        if (!formData.fechaSolicitud) { newErrors.fechaSolicitud = 'Requerido'; missing.push(labelFor.fechaSolicitud); }
        if (!formData.fechaPlaneada) { newErrors.fechaPlaneada = 'Requerido'; missing.push(labelFor.fechaPlaneada); }
        break;
      case 2:
        if (!formData.tipoCambio) { newErrors.tipoCambio = 'Seleccione un tipo'; missing.push(labelFor.tipoCambio); }
        break;
      case 3:
        {
          const causasSeleccionadas = Object.values(formData.causa).filter(v => typeof v === 'boolean').some(v => v === true);
          if (!causasSeleccionadas && !formData.causa.otros) {
            newErrors['causa'] = 'Seleccione al menos una causa';
            missing.push('Causa / Origen del cambio');
          }
        }
        break;
      case 4:
        if (!formData.descripcionPropuesta) { newErrors.descripcionPropuesta = 'Requerido'; missing.push(labelFor.descripcionPropuesta); }
        break;
      case 5:
        if (!formData.justificacion) { newErrors.justificacion = 'Requerido'; missing.push(labelFor.justificacion); }
        break;
      case 6:
        {
          const implicacionesSeleccionadas = Object.values(formData.implicaciones).filter(v => typeof v === 'boolean').some(v => v === true);
          if (!implicacionesSeleccionadas && !formData.implicaciones.otros) {
            newErrors['implicaciones'] = 'Seleccione al menos una implicación';
            missing.push(labelFor.implicaciones);
          }
        }
        break;
      case 7:
        if (!formData.consecuencias) { newErrors.consecuencias = 'Requerido'; missing.push(labelFor.consecuencias); }
        break;
      case 8: {
            const faltantes = [];
            (formData.riesgosCards || []).forEach((c, i) => {
              if (c.tipoImplicacion === 'IMPLICACION_DE_RIESGOS' && (!c.tipoPeligro || !c.tipoPeligro.trim())) {
                faltantes.push(`Riesgo #${i+1}: Tipo de peligro`);
              }
              if (c.tipoImplicacion === 'RECURSOS' && (!c.tipoRecursos || !c.tipoRecursos.trim())) {
                faltantes.push(`Recurso #${i+1}: Tipo de recurso`);
              }
            });
            if (faltantes.length) {
              setErrors(prev => ({ ...prev, 'riesgosCards_tipo': 'Faltan tipos en cards' }));
              setMissingMap(prev => ({ ...prev, [section]: (prev[section] || []).concat(faltantes) }));
              return faltantes;
            }
            break;
          }

case 9: {
  const newErrorsLocal = {};
  const missingLocal = [];

  // SOLICITANTE: ahora es objeto
const s = (formData.firmadoPor && Array.isArray(formData.firmadoPor.solicitado) && formData.firmadoPor.solicitado[0]) || { nombre: '', cargo: '', firma: '' };

  if (!s.nombre || String(s.nombre).trim() === '') {
    newErrorsLocal['firma_solicitado_nombre'] = 'Falta nombre solicitante';
    missingLocal.push('Solicitante - Nombre');
  }
  if (!s.cargo || String(s.cargo).trim() === '') {
    newErrorsLocal['firma_solicitado_cargo'] = 'Falta cargo solicitante';
    missingLocal.push('Solicitante - Cargo');
  }
  if (!s.firma || String(s.firma).trim() === '') {
    newErrorsLocal['firma_solicitado_firma'] = 'Falta firma solicitante';
    missingLocal.push('Solicitante - Firma');
  }

  // EVALUADO (array)
  const evaluados = (formData.firmadoPor?.evaluado) || [];
  if (evaluados.length === 0) {
    newErrorsLocal['firma_evaluado_empty'] = 'Agregar al menos un evaluado';
    missingLocal.push('Evaluado - (al menos 1)');
  } else {
    evaluados.forEach((ev, idx) => {
      if (!ev || !ev.nombre || String(ev.nombre).trim() === '') {
        newErrorsLocal[`firma_evaluado_${idx}_nombre`] = 'Falta nombre evaluado';
        missingLocal.push(`Evaluado #${idx + 1} - Nombre`);
      }
      if (!ev || !ev.cargo || String(ev.cargo).trim() === '') {
        newErrorsLocal[`firma_evaluado_${idx}_cargo`] = 'Falta cargo evaluado';
        missingLocal.push(`Evaluado #${idx + 1} - Cargo`);
      }
    });
  }

  // IMPLEMENTADO
  const implementados = (formData.firmadoPor?.implementado) || [];
  if (implementados.length === 0) {
    newErrorsLocal['firma_implementado_empty'] = 'Agregar al menos un implementado';
    missingLocal.push('Implementado - (al menos 1)');
  } else {
    implementados.forEach((it, idx) => {
      if (!it || !it.nombre || String(it.nombre).trim() === '') {
        newErrorsLocal[`firma_implementado_${idx}_nombre`] = 'Falta nombre implementado';
        missingLocal.push(`Implementado #${idx + 1} - Nombre`);
      }
      if (!it || !it.cargo || String(it.cargo).trim() === '') {
        newErrorsLocal[`firma_implementado_${idx}_cargo`] = 'Falta cargo implementado';
        missingLocal.push(`Implementado #${idx + 1} - Cargo`);
      }
    });
  }

  // VALIDADO
  const validados = (formData.firmadoPor?.validado) || [];
  if (validados.length === 0) {
    newErrorsLocal['firma_validado_empty'] = 'Agregar al menos un validado';
    missingLocal.push('Validado - (al menos 1)');
  } else {
    validados.forEach((v, idx) => {
      if (!v || !v.nombre || String(v.nombre).trim() === '') {
        newErrorsLocal[`firma_validado_${idx}_nombre`] = 'Falta nombre validado';
        missingLocal.push(`Validado #${idx + 1} - Nombre`);
      }
      if (!v || !v.cargo || String(v.cargo).trim() === '') {
        newErrorsLocal[`firma_validado_${idx}_cargo`] = 'Falta cargo validado';
        missingLocal.push(`Validado #${idx + 1} - Cargo`);
      }
    });
  }

  // APROBADOS
  const aprobados = (formData.firmadoPor?.aprobado) || [];
  
  aprobados.forEach((a, idx) => {
    if (!a || !a.nombre || String(a.nombre).trim() === '') {
      newErrorsLocal[`firma_aprobado_${idx}_nombre`] = 'Falta nombre aprobado';
      missingLocal.push(`Aprobado #${idx + 1} - Nombre`);
    }
    if (!a || !a.cargo || String(a.cargo).trim() === '') {
      newErrorsLocal[`firma_aprobado_${idx}_cargo`] = 'Falta cargo aprobado';
      missingLocal.push(`Aprobado #${idx + 1} - Cargo`);
    }
  });


  setErrors(prev => ({ ...prev, ...newErrorsLocal }));
  setMissingMap(prev => ({ ...prev, [section]: missingLocal }));
  return missingLocal;
}


      default:
        break;
    }

    // actualizar estado de errores y missingMap local
    setErrors(prev => ({ ...prev, ...newErrors }));
    setMissingMap(prev => ({ ...prev, [section]: missing }));
    return missing;
  };

  // valida todas las secciones y devuelve mapa completo
  const validateAllSections = () => {
    const fullMissing = {};
    for (let s = 1; s <= 9; s++) {
      const m = validateSection(s);
      if (m && m.length) fullMissing[s] = m;
    }
    setMissingMap(fullMissing);
    return fullMissing;
  };

  // ===================== SAVE / SEND =====================
  const saveDraft = async () => {
    try {
      setIsSubmitting(true);
      // justo antes de construir payload para enviar
console.log('>>> firmadoPor antes de enviar:', JSON.stringify(formData.firmadoPor, null, 2));

      const payload = {
        ...formData,
        fechaSolicitud: formData.fechaSolicitud ? new Date(formData.fechaSolicitud).toISOString() : null,
        fechaPlaneada: formData.fechaPlaneada ? new Date(formData.fechaPlaneada).toISOString() : null,
        estado: 'pendiente'
      };

      if (routeId || formData._id) {
        const target = routeId || formData._id;
        const res = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${target}`, payload);

        setAlertBanner({ type: 'success', text: 'Borrador guardado correctamente.' });
        if (!routeId && res.data._id) navigate(`/gestion-cambio/${res.data._id}`, { replace: true });
      } else {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio`, payload);

        setAlertBanner({ type: 'success', text: 'Borrador creado correctamente.' });
        if (res.data._id) navigate(`/gestion-cambio/${res.data._id}`, { replace: true });
      }
      // limpiar banner en 4s
      setTimeout(() => setAlertBanner(null), 4000);
    } catch (err) {
      console.error('Error guardando borrador:', err);
      setAlertBanner({ type: 'error', text: 'Ocurrió un error al guardar el borrador. Revisa la consola.' });
      setTimeout(() => setAlertBanner(null), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendRequest = async () => {
    // validar todo
    const fullMissing = validateAllSections();
    const missingSections = Object.keys(fullMissing).filter(k => fullMissing[k] && fullMissing[k].length);
    if (missingSections.length > 0) {
      // construir mensaje legible
      const summaryLines = missingSections.map(s => `Sección ${s}: ${fullMissing[s].slice(0,5).join(', ')}${fullMissing[s].length > 5 ? '...' : ''}`);
      const bannerText = `No se puede enviar: faltan campos en ${missingSections.length} sección(es). Revise: ${summaryLines.join(' • ')}`;
      setAlertBanner({ type: 'error', text: bannerText, details: fullMissing });

      // navegar a primera sección con error y hacer scroll
      const first = parseInt(missingSections[0], 10);
      setActiveSection(first);
      setTimeout(() => {
        sectionRefs.current[first - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
      return;
    }

    // todas las validaciones pasaron -> enviar
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        fechaSolicitud: formData.fechaSolicitud ? new Date(formData.fechaSolicitud).toISOString() : null,
        fechaPlaneada: formData.fechaPlaneada ? new Date(formData.fechaPlaneada).toISOString() : null
      };

      if (routeId || formData._id) {
        const target = routeId || formData._id;
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${target}`, payload);
        // endpoint enviar (server debe cambiar estado y devolver doc)
        const resEnviar = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${target}/enviar`);
        setFormData(prev => ({ ...prev, ...resEnviar.data }));
        setSubmitted(true);
        setAlertBanner({ type: 'success', text: 'Solicitud enviada con éxito.' });
      } else {
        // create then send
        const resCreate = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio`, { ...payload, estado: 'pendiente' });
        const newId = resCreate.data._id;
        if (!newId) {
          setAlertBanner({ type: 'error', text: 'Error inesperado al crear el registro.' });
          return;
        }
        const resEnviar = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${newId}/enviar`);
        setFormData(prev => ({ ...prev, ...resEnviar.data }));
        setSubmitted(true);
        setAlertBanner({ type: 'success', text: 'Solicitud enviada con éxito.' });
        navigate(`/gestion-cambio/${newId}`, { replace: true });
      }
      setTimeout(() => setAlertBanner(null), 4000);
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      const serverFaltantes = err.response?.data?.faltantes;
      if (serverFaltantes && serverFaltantes.length) {
        setAlertBanner({ type: 'error', text: `El servidor indicó faltantes: ${serverFaltantes.join(', ')}` });
      } else {
        setAlertBanner({ type: 'error', text: 'Ocurrió un error al enviar la solicitud. Revisa la consola.' });
      }
      setTimeout(() => setAlertBanner(null), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================== HELPERS DE RENDER Y UTILIDADES =====================
  const inputClass = (key) => (errors[key] ? 'error' : '');

  // Normaliza cualquier forma de firmadoPor que venga del servidor
  function normalizeFirmadoPorFront(fp) {
  const empty = (o = {}) => ({ nombre: o.nombre || '', cargo: o.cargo || '', firma: o.firma || '' });

  if (!fp || typeof fp !== 'object') {
  return { solicitado: [], evaluado: [], aprobado: [], implementado: [], validado: [] };
}

  const toArray = (val) => {
    if (Array.isArray(val)) return val.map(v => empty(v));
    if (val && typeof val === 'object' && ('self' in val || 'others' in val)) {
      const out = [];
      if (val.self) out.push(empty(val.self));
      if (Array.isArray(val.others)) val.others.forEach(o => out.push(empty(o)));
      return out.length ? out : [{ nombre: '', cargo: '', firma: '' }];
    }
    if (val && typeof val === 'object') return [ empty(val) ];
    return [{ nombre: '', cargo: '', firma: '' }];
  };

  return {
    solicitado: toArray(fp.solicitado).slice(0,1), // solo el primer elemento para solicitante
    evaluado: toArray(fp.evaluado),
    aprobado: toArray(fp.aprobado),
    implementado: toArray(fp.implementado),
    validado: toArray(fp.validado)
  };
}

  // ===================== SECCIONES DEL FORMULARIO =====================
  // Cada sección puede moverse a su propio archivo SeccionX.jsx y recibir props necesarias

  // ----------- SECCIÓN 1: Datos de la solicitud del cambio -----------
  // ----------- SECCIÓN 2: Notificación de Solicitud de Cambio --------
  // ----------- SECCIÓN 3: Causa/Origen del cambio -------------------
  // ----------- SECCIÓN 4: Descripción de la propuesta de cambio -----
  // ----------- SECCIÓN 5: Justificación de la propuesta de cambio ----
  // ----------- SECCIÓN 6: Implicaciones del cambio ------------------
  // ----------- SECCIÓN 7: Consecuencias de no realizar el cambio ----
  // ----------- SECCIÓN 8: RIESGOS (auto-generados) ------------------
  // ----------- SECCIÓN 9: Firmas ------------------------------------

  const renderSection = () => {
    switch (activeSection) {
      // ========== SECCIÓN 1 ==========
      case 1:
        return (
        <Seccion1
          formData={formData}
          handleChange={handleChange}
          errors={errors}
          inputClass={inputClass}
          sectionRef={el => sectionRefs.current[0] = el}
        />
      );

      // ========== SECCIÓN 2 ==========
case 2:
  return (
    <Seccion2
      formData={formData}
      handleChange={handleChange}
      errors={errors}
      inputClass={inputClass}
      sectionRef={el => sectionRefs.current[1] = el}
      impactoOptions={impactoOptions}
      handleImpactoTextareaChange={handleImpactoTextareaChange}
    />
  );

// ========== SECCIÓN 3 ==========
case 3:
  return (
    <Seccion3
      formData={formData}
      errors={errors}
      handleNestedChange={handleNestedChange}
      sectionRef={el => sectionRefs.current[2] = el}
    />
  );

// ========== SECCIÓN 4 ==========
case 4:
  return (
    <Seccion4
      formData={formData}
      handleChange={handleChange}
      errors={errors}
      inputClass={inputClass}
      sectionRef={el => sectionRefs.current[3] = el}
    />
  );

// ========== SECCIÓN 5 ==========
case 5:
  return (
    <Seccion5
      formData={formData}
      handleChange={handleChange}
      errors={errors}
      inputClass={inputClass}
      sectionRef={el => sectionRefs.current[4] = el}
    />
  );

// ========== SECCIÓN 6 ==========
case 6:
  return (
    <Seccion6
      formData={formData}
      errors={errors}
      handleImplicacionToggle={handleImplicacionToggle}
      handleImplicacionesOtrosChange={handleImplicacionesOtrosChange}
      sectionRef={el => sectionRefs.current[5] = el}
    />
  );

// ========== SECCIÓN 7 ==========
case 7:
  return (
    <Seccion7
      formData={formData}
      handleChange={handleChange}
      errors={errors}
      inputClass={inputClass}
      sectionRef={el => sectionRefs.current[6] = el}
    />
  );

// ========== SECCIÓN 8 ==========
case 8:
  return (
<Seccion8
  formData={formData}
  updateRiesgoCardField={updateRiesgoCardField}
  toggleInvolucrado={toggleInvolucrado}
  updateInvolucradoField={updateInvolucradoField}
  addNewCard={addNewCard}
  removeCardById={removeCardById}
  sectionRef={el => sectionRefs.current[7] = el}
/>
  );

// ========== SECCIÓN 9 ==========
case 9:
  return (
    <Seccion9
      formData={formData}
      setFormData={setFormData}
      setAddTemp={setAddTemp}
      errors={errors}
      inputClass={inputClass}
      openSignature={openSignature}
      userNames={userNames}
      addMode={addMode}
      addTemp={addTemp}
      startAdd={startAdd}
      cancelAdd={cancelAdd}
      confirmAdd={confirmAdd}
      removeFirmaRole={removeFirmaRole}
      sectionRefs={sectionRefs}
    />
  );  
      default:
        return null;
    }
  };

  // ===================== RENDER PRINCIPAL =====================
  if (submitted) {
    return (
      <div className="confirmation">
        <h2>¡Solicitud Enviada con Éxito!</h2>
        <div className="checkmark">✓</div>
        <p>Su solicitud de cambio ha sido registrada correctamente.</p>
        <button onClick={() => { setActiveSection(1); setSubmitted(false); window.location.reload(); }} className="btn-primary">Crear Nueva Solicitud</button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>Formulario de Gestión de Cambios</h1>
        <p>{routeId ? 'Editando solicitud' : 'Crear nueva solicitud (borrador)'}</p>
      </div>

      {/* ALERT BANNER */}
      {alertBanner && (
        <div className={`form-alert ${alertBanner.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <div className="alert-top">
            <div className="alert-left">
              <div className="alert-icon">{alertBanner.type === 'error' ? '⚠️' : '✅'}</div>
              <div>
                <strong>{alertBanner.type === 'error' ? 'Atención:' : 'Éxito:'}</strong>
                <div className="alert-summary">{alertBanner.text}</div>
              </div>
            </div>

            <div className="alert-actions">
              {alertBanner.details && <button className="small-link" onClick={() => {
                const firstSec = Math.min(...Object.keys(alertBanner.details).map(n => parseInt(n,10)));
                setActiveSection(firstSec);
                sectionRefs.current[firstSec - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>Ir a primer faltante</button>}
              <button className="small-link" onClick={() => setAlertBanner(null)} style={{ marginLeft: 8 }}>Cerrar</button>
            </div>
          </div>

          {alertBanner.details && (
            <div className="alert-details">
              {Object.entries(alertBanner.details).map(([sec, arr]) => (
                <div key={sec} className="alert-section">
                  <div className="alert-section-header">
                    <button className="link-to-section" onClick={() => {
                      const s = parseInt(sec, 10);
                      setActiveSection(s);
                      sectionRefs.current[s - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}>
                      Sección {sec}
                    </button>
                    <span className="badge">{arr.length}</span>
                  </div>
                  <ul className="alert-missing-list">
                    {arr.map((label, i) => (
                      <li key={i}><small>{label}</small></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

<div className="progress-bar">
  {[
    { num: 1, label: "Datos" },
    { num: 2, label: "Notificación" },
    { num: 3, label: "Causa" },
    { num: 4, label: "Descripción" },
    { num: 5, label: "Justificación" },
    { num: 6, label: "Implicaciones" },
    { num: 7, label: "Consecuencias" },
    { num: 8, label: "Riesgos" },
    { num: 9, label: "Firmas" }
  ].map(({ num, label }) => (
    <div
      key={num}
      className={
        "progress-step" +
        (activeSection === num ? " active" : "") +
        (missingMap[num] && missingMap[num].length ? " error" : "")
      }
      onClick={() => setActiveSection(num)}
    >
      <div className="step-number">{num}</div>
      <div className="step-label">{label}</div>
    </div>
  ))}
</div>

      <form onSubmit={activeSection === 9 ? (e) => { e.preventDefault(); sendRequest(); } : (e) => { e.preventDefault(); const missing = validateSection(activeSection); if (missing.length === 0) setActiveSection(s => Math.min(9, s + 1)); }}>
        {renderSection()}

        <div className="form-navigation">
          {activeSection > 1 && <button type="button" className="btn-secondary" onClick={() => setActiveSection(activeSection - 1)}>Anterior</button>}
          <button type="button" className="btn-secondary" onClick={saveDraft} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar borrador'}</button>

          {activeSection < 9 ? (
            <button type="submit" className="btn-primary">Siguiente</button>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={sendRequest} disabled={isSubmitting} style={{ marginLeft: 8 }}>{isSubmitting ? 'Procesando...' : 'Enviar Solicitud'}</button>
            </>
          )}
        </div>
      </form>

        <SignaturePopup
          open={!!sigRole}
          role={sigRole?.role}
          index={sigRole?.idx}
          onSave={(maybeRoleOrDataUrl, maybeDataUrl) => {
            // Si SignaturePopup llamó onSave(role, dataURL), entonces maybeDataUrl será la dataURL.
            // Si SignaturePopup llamó onSave(dataURL) (otro formato), maybeDataUrl será undefined.
            const roleFromPopup = (typeof maybeDataUrl === 'string') ? maybeRoleOrDataUrl : sigRole?.role;
            const dataURL = (typeof maybeDataUrl === 'string') ? maybeDataUrl : maybeRoleOrDataUrl;
            const idx = sigRole?.idx ?? 0;
            handleSaveSig(roleFromPopup, dataURL, idx);
          }}
          onClose={() => setSigRole(null)}
        />

    </div>
  );
}

const impactoOptions = [
  { key: 'productos', label: 'Productos nuevos, MP´S, ingredientes y servicios' },
  { key: 'sistemasEquipos', label: 'Sistemas y equipos de producción' },
  { key: 'localesProduccion', label: 'Locales de producción, ubicación de los equipos, entorno circundante' },
  { key: 'programasLimpieza', label: 'Programas de limpieza y desinfección' },
  { key: 'sistemasEmbalaje', label: 'Sistemas de embalaje, almacenamiento y distribución' },
  { key: 'nivelesPersonal', label: 'Niveles de calificación del personal y/o asignación de responsabilidades  y autorizaciones' },
  { key: 'requisitosLegales', label: 'Requisitos legales y reglamentarios' },
  { key: 'conocimientosPeligros', label: 'Conocimientos relativos a los peligros para la inocuidad de los alimentos y medidas de control' },
  { key: 'requisitosCliente', label: 'Requisitos del cliente, del sector y otros requisitos que la organización tiene en cuenta' },
  { key: 'consultasPartes', label: 'Consultas pertinentes de las partes interesadas externas' },
  { key: 'quejasPeligros', label: 'Quejas indicando peligros relacionados con la inocuidad de los alimentos, asociados al producto' },
  { key: 'otrasCondiciones', label: 'Otras condiciones que tenga impacto en la inocuidad de los alimentos' }
];