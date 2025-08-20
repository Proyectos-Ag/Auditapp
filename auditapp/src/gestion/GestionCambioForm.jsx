import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import SignaturePopup from './SignaturePopup';
import { UserContext } from '../App';
import './css/GestionForm.css';

export default function GestionCambioForm() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);

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
    implicaciones: { riesgos: false, recursos: false, documentacion: false, otros: '' },
    consecuencias: '',
    riesgosCards: [],
    firmadoPor: {
      solicitado: { nombre: '', cargo: '', firma: '' },
      evaluado: { nombre: '', cargo: '', firma: '' },
      aprobado: [],
      implementado: { nombre: '', cargo: '', firma: '' },
      validado: { nombre: '', cargo: '', firma: '' },
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
  const sectionRefs = useRef([]); // refs para scroll

  // Cargar si hay routeId
  useEffect(() => {
    if (!routeId) return;
    const load = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${routeId}`);
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
        setFormData(prev => ({ ...prev, ...normalized }));
      } catch (err) {
        console.error('No se pudo cargar el registro:', err);
      }
    };
    load();
  }, [routeId]);

  // Prefill desde UserContext cuando se crea nuevo (no cuando estamos editando)
useEffect(() => {
  if (routeId) return; // si estamos editando, no sobreescribir
  if (!userData) return;

  // helper para distintos nombres de campo en userData
  const pick = (keys) => {
    for (const k of keys) {
      if (userData[k] !== undefined && userData[k] !== null && String(userData[k]).trim() !== '') return userData[k];
    }
    return '';
  };

  const nombre = pick(['Nombre','name','fullName','displayName','username']);
  const puesto = pick(['Puesto', 'cargo', 'role', 'position']);
  const area = pick(['area', 'departamento', 'department', 'areaSolicitante']);

  setFormData(prev => ({
  ...prev,
  solicitante: prev.solicitante || String(nombre || ''),
  areaSolicitante: prev.areaSolicitante || String(area || ''),
  firmadoPor: {
    ...prev.firmadoPor,
    solicitado: {
      nombre: prev.firmadoPor?.solicitado?.nombre || String(nombre || ''),
      cargo: prev.firmadoPor?.solicitado?.cargo || String(puesto || ''),
      firma: prev.firmadoPor?.solicitado?.firma || ''
    }
    // no asignar firma a evaluado/aprobado/implementado/validado
  }
}));
}, [userData, routeId]);


  const openSignature = (role) => setSigRole(role);
  const handleSaveSig = (role, dataURL) => {
    if (role !== 'solicitado') return;
  setFormData(prev => ({
    ...prev,
    firmadoPor: {
      ...prev.firmadoPor,
      solicitado: { ...prev.firmadoPor.solicitado, firma: dataURL }
    }
  }));
  setSigRole(null);
  };

  /* ---------- Helpers de estado y cambios ---------- */
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

  /* ------------------ Sección 6 <-> Sección 8 binding ------------------ */
  const ensureCardForImplicacion = (tipoKey, extra = null) => {
    setFormData(prev => {
      const exists = prev.riesgosCards.some(c => c.tipoImplicacion === tipoKey && (extra ? c.otherLabel === extra : true));
      if (exists) return prev;
      const baseCard = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        tipoImplicacion: tipoKey,
        tipoPeligro: '', descripcionPeligro: '', consecuencias: '', probabilidad: '', severidad: '', nivelRiesgo: '', medidasControl: '', responsable: '', fechaCompromiso: '',
        tipoDocumento: '', nombreDocumento: '', cambioRealizar: '', fechaCompromisoDoc: '', responsableDoc: '',
        tipoRecursos: '', origenRecursos: '', costos: '', tiempoDisponible: '', fechaCompromisoRec: '', responsableRec: '',
        involucradosSelected: [], involucradosData: { SOCIOS: null, PROVEEDORES: null, AUTORIDADES: null, CLIENTES: null, OTROS: null },
        otherLabel: extra || null
      };
      return { ...prev, riesgosCards: [...prev.riesgosCards, baseCard] };
    });
  };

  const removeCardsByTipo = (tipoKey, extra = null) => {
    setFormData(prev => ({ ...prev, riesgosCards: prev.riesgosCards.filter(c => {
      if (c.tipoImplicacion !== tipoKey) return true;
      if (extra && c.otherLabel !== extra) return true;
      return false;
    }) }));
  };

  const handleImplicacionToggle = (name, checked) => {
    handleNestedChange('implicaciones', name, checked);
    if (checked) {
      if (name === 'riesgos') ensureCardForImplicacion('IMPLICACION_DE_RIESGOS');
      if (name === 'documentacion') ensureCardForImplicacion('DOCUMENTOS');
      if (name === 'recursos') ensureCardForImplicacion('RECURSOS');
    } else {
      if (name === 'riesgos') removeCardsByTipo('IMPLICACION_DE_RIESGOS');
      if (name === 'documentacion') removeCardsByTipo('DOCUMENTOS');
      if (name === 'recursos') removeCardsByTipo('RECURSOS');
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

  // helpers para aprobadores
const addAprobado = () => {
  setFormData(prev => ({ 
    ...prev, 
    firmadoPor: { 
      ...prev.firmadoPor, 
      aprobado: [...(prev.firmadoPor.aprobado || []), { nombre: '', cargo: '' }] 
    } 
  }));
};

const removeAprobado = (idx) => {
  setFormData(prev => ({ 
    ...prev, 
    firmadoPor: { 
      ...prev.firmadoPor, 
      aprobado: prev.firmadoPor.aprobado.filter((_, i) => i !== idx) 
    } 
  }));
  // limpiar errores específicos si existen
  setErrors(prev => {
    const next = { ...prev };
    delete next[`firma_aprobado_${idx}_nombre`];
    delete next[`firma_aprobado_${idx}_cargo`];
    return next;
  });
};

const handleAprobadoChange = (idx, field, value) => {
  setFormData(prev => ({ 
    ...prev, 
    firmadoPor: { 
      ...prev.firmadoPor, 
      aprobado: prev.firmadoPor.aprobado.map((a, i) => i === idx ? { ...a, [field]: value } : a) 
    } 
  }));
};

  /* ------------------ VALIDATION helpers ------------------ */
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
      case 8:
        // opcional: si quieres validar cards específica hazlo aquí y añade mensajes a `missing`
        break;
      case 9:
  {
    // validar solicitante obligatorio (nombre, cargo, firma)
    const p = formData.firmadoPor?.solicitado || {};
    if (!p.nombre) { newErrors['firma_solicitado_nombre'] = 'Falta nombre solicitante'; missing.push('Solicitante - Nombre'); }
    if (!p.cargo)  { newErrors['firma_solicitado_cargo'] = 'Falta cargo solicitante'; missing.push('Solicitante - Cargo'); }
    if (!p.firma)  { newErrors['firma_solicitado_firma'] = 'Falta firma solicitante'; missing.push('Solicitante - Firma'); }

    // evaluado (solo nombre/cargo)
    const ev = formData.firmadoPor?.evaluado || {};
    if (!ev.nombre) { newErrors['firma_evaluado_nombre'] = 'Falta nombre evaluado'; missing.push('Evaluado - Nombre'); }
    if (!ev.cargo)  { newErrors['firma_evaluado_cargo'] = 'Falta cargo evaluado'; missing.push('Evaluado - Cargo'); }

    // implementado
    const imp = formData.firmadoPor?.implementado || {};
    if (!imp.nombre) { newErrors['firma_implementado_nombre'] = 'Falta nombre implementado'; missing.push('Implementado - Nombre'); }
    if (!imp.cargo)  { newErrors['firma_implementado_cargo'] = 'Falta cargo implementado'; missing.push('Implementado - Cargo'); }

    // validado
    const val = formData.firmadoPor?.validado || {};
    if (!val.nombre) { newErrors['firma_validado_nombre'] = 'Falta nombre validado'; missing.push('Validado - Nombre'); }
    if (!val.cargo)  { newErrors['firma_validado_cargo'] = 'Falta cargo validado'; missing.push('Validado - Cargo'); }

    // aprobados: si existen, validar cada uno
    const aprob = formData.firmadoPor?.aprobado || [];
    if (Array.isArray(aprob)) {
      aprob.forEach((a, idx) => {
        if (!a.nombre) { newErrors[`firma_aprobado_${idx}_nombre`] = 'Falta nombre aprobado'; missing.push(`Aprobado #${idx + 1} - Nombre`); }
        if (!a.cargo)  { newErrors[`firma_aprobado_${idx}_cargo`] = 'Falta cargo aprobado'; missing.push(`Aprobado #${idx + 1} - Cargo`); }
      });
    }
  }
  break;


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

  /* ------------------ SAVE / SEND ------------------ */
  const saveDraft = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        fechaSolicitud: formData.fechaSolicitud ? new Date(formData.fechaSolicitud).toISOString() : null,
        fechaPlaneada: formData.fechaPlaneada ? new Date(formData.fechaPlaneada).toISOString() : null,
        estado: 'pendiente'
      };

      if (routeId || formData._id) {
        const target = routeId || formData._id;
        const res = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio/${target}`, payload);
        setFormData(prev => ({ ...prev, ...res.data }));
        setAlertBanner({ type: 'success', text: 'Borrador guardado correctamente.' });
        if (!routeId && res.data._id) navigate(`/gestion-cambio/${res.data._id}`, { replace: true });
      } else {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gestion-cambio`, payload);
        setFormData(prev => ({ ...prev, ...res.data }));
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

  /* ------------------ Render helpers ------------------ */
  const impactoOptions = [
    { key: 'productos', label: "Productos nuevos, MP´S, ingredientes y servicios" },
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
    { key: 'otrasCondiciones', label: 'Otras condiciones que tenga impacto en la inocuidad de los alimentos' },
  ];

  const renderProgressStep = (section) => {
    const hasMissing = Array.isArray(missingMap[section]) && missingMap[section].length > 0;
    const badge = hasMissing ? (<span className="progress-badge">{missingMap[section].length}</span>) : null;
    return (
      <div
        key={section}
        className={`progress-step ${section <= activeSection ? 'active' : ''} ${hasMissing ? 'has-missing' : ''}`}
        onClick={() => { setActiveSection(section); sectionRefs.current[section - 1]?.scrollIntoView({ behavior: 'smooth' }); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveSection(section); sectionRefs.current[section - 1]?.scrollIntoView({ behavior: 'smooth' }); } }}
      >
        <div className="step-number">{section}</div>
        <div className="step-label">
          {section === 1 ? 'Datos' : section === 2 ? 'Notificación' : section === 3 ? 'Causa' : section === 4 ? 'Descripción' : section === 5 ? 'Justificación' : section === 6 ? 'Implicaciones' : section === 7 ? 'Consecuencias' : section === 8 ? 'Riesgos' : 'Firmas'}
        </div>
        {badge}
      </div>
    );
  };

  const inputClass = (key) => (errors[key] ? 'error' : '');
  const signatureErrorFor = (role) => errors[`firma_${role}`];

  /* ------------------ Render sections (igual que antes, con refs y clases) ------------------ */
  const renderSection = () => {
    switch (activeSection) {
      case 1:
        return (
          <div className="form-section" ref={el => sectionRefs.current[0] = el}>
            <h2>Sección 1: Datos de la solicitud del cambio</h2>
            <div className="form-group">
              <label>Solicitante del cambio*</label>
              <input type="text" name="solicitante" value={formData.solicitante} onChange={handleChange} className={inputClass('solicitante')} />
              {errors.solicitante && <span className="error-message">{errors.solicitante}</span>}
            </div>

            <div className="form-group">
              <label>Área del solicitante*</label>
              <input type="text" name="areaSolicitante" value={formData.areaSolicitante} onChange={handleChange} className={inputClass('areaSolicitante')} />
              {errors.areaSolicitante && <span className="error-message">{errors.areaSolicitante}</span>}
            </div>

            <div className="form-group">
              <label>Lugar*</label>
              <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} className={inputClass('lugar')} />
              {errors.lugar && <span className="error-message">{errors.lugar}</span>}
            </div>

            <div className="form-group">
              <label>Líder del proyecto</label>
              <input type="text" name="liderProyecto" value={formData.liderProyecto} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Fecha de solicitud del cambio*</label>
              <input type="date" name="fechaSolicitud" value={formData.fechaSolicitud} onChange={handleChange} className={inputClass('fechaSolicitud')} />
              {errors.fechaSolicitud && <span className="error-message">{errors.fechaSolicitud}</span>}
            </div>

            <div className="form-group">
              <label>Fecha planeada para realizar el cambio*</label>
              <input type="date" name="fechaPlaneada" value={formData.fechaPlaneada} onChange={handleChange} className={inputClass('fechaPlaneada')} />
              {errors.fechaPlaneada && <span className="error-message">{errors.fechaPlaneada}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-section" ref={el => sectionRefs.current[1] = el}>
            <h2>Sección 2: Notificación de Solicitud de Cambio</h2>
            <div className="form-group">
              <label>Tipo de cambio*</label>
              <select name="tipoCambio" value={formData.tipoCambio} onChange={handleChange} className={inputClass('tipoCambio')}>
                <option value="">-- Seleccione --</option>
                <option value="Permanente">Permanente</option>
                <option value="De emergencia">De emergencia</option>
                <option value="Temporal">Temporal</option>
              </select>
              {errors.tipoCambio && <span className="error-message">{errors.tipoCambio}</span>}
            </div>

            <div className="form-group">
              <label>Impactos (seleccione uno o varios):</label>
              <select multiple value={formData.impactosSeleccionados} onChange={handleChange} style={{ minHeight: 120 }}>
                {impactoOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
              <small>Puede mantener Ctrl/Cmd para seleccionar varios.</small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {formData.impactosSeleccionados.map(key => {
                const opt = impactoOptions.find(o => o.key === key);
                return (
                  <div className="form-group" key={key}>
                    <label style={{ fontSize: 14 }}>{opt ? opt.label : key}</label>
                    <textarea rows={3} value={formData.impactosData[key] || ''} onChange={(e) => handleImpactoTextareaChange(key, e.target.value)} />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-section" ref={el => sectionRefs.current[2] = el}>
            <h2>Sección 3: Causa/Origen del cambio</h2>
            {errors.causa && <div className="error-message">{errors.causa}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { key: 'solicitudCliente', label: 'Solicitud Cliente' },
                { key: 'reparacionDefecto', label: 'Reparación de defecto' },
                { key: 'accionPreventiva', label: 'Acción preventiva' },
                { key: 'actualizacionDocumento', label: 'Actualización / modificación de documento' },
                { key: 'accionCorrectiva', label: 'Acción correctiva' },
              ].map(({ key, label }) => (
                <label key={key} className="checkbox-inline">
                  <input type="checkbox" name={key} checked={formData.causa[key]} onChange={(e) => handleNestedChange('causa', key, e.target.checked)} /> {label}
                </label>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Otros:</label>
              <input type="text" value={formData.causa.otros} onChange={(e) => handleNestedChange('causa', 'otros', e.target.value)} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-section" ref={el => sectionRefs.current[3] = el}>
            <h2>Sección 4: Descripción de la propuesta de cambio</h2>
            <div className="form-group">
              <textarea name="descripcionPropuesta" value={formData.descripcionPropuesta} onChange={handleChange} rows={6} className={inputClass('descripcionPropuesta')} placeholder="Describa detalladamente la propuesta de cambio..." />
              {errors.descripcionPropuesta && <span className="error-message">{errors.descripcionPropuesta}</span>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="form-section" ref={el => sectionRefs.current[4] = el}>
            <h2>Sección 5: Justificación de la propuesta de cambio</h2>
            <div className="form-group">
              <textarea name="justificacion" value={formData.justificacion} onChange={handleChange} rows={6} className={inputClass('justificacion')} placeholder="Explique por qué se propone este cambio..." />
              {errors.justificacion && <span className="error-message">{errors.justificacion}</span>}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="form-section" ref={el => sectionRefs.current[5] = el}>
            <h2>Sección 6: Implicaciones del cambio</h2>
            {errors.implicaciones && <div className="error-message">{errors.implicaciones}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { key: 'riesgos', label: 'Riesgos' },
                { key: 'recursos', label: 'Recursos' },
                { key: 'documentacion', label: 'Documentación' },
              ].map(({ key, label }) => (
                <label key={key} className="checkbox-inline">
                  <input type="checkbox" name={key} checked={formData.implicaciones[key]} onChange={(e) => handleImplicacionToggle(key, e.target.checked)} /> {label}
                </label>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Otros (si aplica) — texto libre que generará una card en Sección 8:</label>
              <input type="text" value={formData.implicaciones.otros} onChange={(e) => handleImplicacionesOtrosChange(e.target.value)} placeholder="Ej: Cambio en proveedores, cambio normativo X, ..." />
            </div>

            <p style={{ marginTop: 12, fontStyle: 'italic' }}>Nota: Las implicaciones seleccionadas en esta sección generan automáticamente cards en la Sección 8. No se pueden agregar cards manualmente en la Sección 8.</p>
          </div>
        );

      case 7:
        return (
          <div className="form-section" ref={el => sectionRefs.current[6] = el}>
            <h2>Sección 7: Consecuencias de no realizar el cambio</h2>
            <div className="form-group">
              <textarea name="consecuencias" value={formData.consecuencias} onChange={handleChange} rows={6} className={inputClass('consecuencias')} placeholder="Describa las consecuencias de no implementar este cambio..." />
              {errors.consecuencias && <span className="error-message">{errors.consecuencias}</span>}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="form-section" ref={el => sectionRefs.current[7] = el}>
            <h2>Sección 8: RIESGOS (auto-generados desde Sección 6)</h2>
            <p>Las cards en esta sección se generan automáticamente según las opciones marcadas en la Sección 6. Para añadir o quitar cards, regrese a la Sección 6 y modifique las implicaciones seleccionadas.</p>

            {formData.riesgosCards.length === 0 && <div className="info">No hay cards aún. Seleccione implicaciones en la Sección 6 para generar cards aquí.</div>}

            {formData.riesgosCards.map((card, idx) => (
              <div key={card.id} className="riesgo-card form-section-card" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>{card.tipoImplicacion === 'OTRAS' ? `OTRAS: ${card.otherLabel}` : (card.tipoImplicacion || '').replaceAll('_', ' ')} #{idx + 1}</h4>
                </div>

                {card.tipoImplicacion === 'IMPLICACION_DE_RIESGOS' && (
                  <>
                    <div className="form-group">
                      <label>TIPO DE PELIGRO</label>
                      <select value={card.tipoPeligro} onChange={(e) => updateRiesgoCardField(card.id, 'tipoPeligro', e.target.value)}>
                        <option value="">-- Seleccione --</option>
                        <option value="FISICO">FÍSICO</option>
                        <option value="QUIMICO">QUÍMICO</option>
                        <option value="BIOLOGICO">BIOLÓGICO</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>DESCRIPCIÓN DEL PELIGRO</label>
                      <textarea value={card.descripcionPeligro} onChange={(e) => updateRiesgoCardField(card.id, 'descripcionPeligro', e.target.value)} rows={3} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                      <div className="form-group"><label>PROBABILIDAD</label><input type="text" value={card.probabilidad} onChange={(e) => updateRiesgoCardField(card.id, 'probabilidad', e.target.value)} /></div>
                      <div className="form-group"><label>SEVERIDAD</label><input type="text" value={card.severidad} onChange={(e) => updateRiesgoCardField(card.id, 'severidad', e.target.value)} /></div>
                      <div className="form-group"><label>NIVEL DE RIESGO</label><input type="text" value={card.nivelRiesgo} onChange={(e) => updateRiesgoCardField(card.id, 'nivelRiesgo', e.target.value)} /></div>
                    </div>

                    <div className="form-group"><label>MEDIDAS DE CONTROL</label><textarea value={card.medidasControl} onChange={(e) => updateRiesgoCardField(card.id, 'medidasControl', e.target.value)} rows={2} /></div>
                    <div className="form-group"><label>RESPONSABLE</label><input type="text" value={card.responsable} onChange={(e) => updateRiesgoCardField(card.id, 'responsable', e.target.value)} /></div>
                    <div className="form-group"><label>FECHA COMPROMISO</label><input type="date" value={card.fechaCompromiso ? card.fechaCompromiso : ''} onChange={(e) => updateRiesgoCardField(card.id, 'fechaCompromiso', e.target.value)} /></div>
                  </>
                )}

                {card.tipoImplicacion === 'DOCUMENTOS' && (
                  <>
                    <div className="form-group"><label>TIPO DE DOCUMENTO</label><input type="text" value={card.tipoDocumento} onChange={(e) => updateRiesgoCardField(card.id, 'tipoDocumento', e.target.value)} /></div>
                    <div className="form-group"><label>NOMBRE DEL DOCUMENTO</label><input type="text" value={card.nombreDocumento} onChange={(e) => updateRiesgoCardField(card.id, 'nombreDocumento', e.target.value)} /></div>
                    <div className="form-group"><label>CAMBIO A REALIZAR</label><textarea value={card.cambioRealizar} onChange={(e) => updateRiesgoCardField(card.id, 'cambioRealizar', e.target.value)} rows={2} /></div>
                    <div className="form-group"><label>FECHA COMPROMISO</label><input type="date" value={card.fechaCompromisoDoc ? card.fechaCompromisoDoc : ''} onChange={(e) => updateRiesgoCardField(card.id, 'fechaCompromisoDoc', e.target.value)} /></div>
                    <div className="form-group"><label>RESPONSABLE</label><input type="text" value={card.responsableDoc} onChange={(e) => updateRiesgoCardField(card.id, 'responsableDoc', e.target.value)} /></div>
                  </>
                )}

                {card.tipoImplicacion === 'RECURSOS' && (
                  <>
                    <div className="form-group"><label>TIPO DE RECURSOS</label>
                      <select value={card.tipoRecursos} onChange={(e) => updateRiesgoCardField(card.id, 'tipoRecursos', e.target.value)}>
                        <option value="">-- Seleccione --</option>
                        <option value="ECONOMICOS">ECONÓMICOS</option>
                        <option value="MANO_DE_OBRA">MANO DE OBRA</option>
                        <option value="MATERIALES">MATERIALES</option>
                      </select>
                    </div>

                    <div className="form-group"><label>ORIGEN DE LOS RECURSOS</label>
                      <select value={card.origenRecursos} onChange={(e) => updateRiesgoCardField(card.id, 'origenRecursos', e.target.value)}>
                        <option value="">-- Seleccione --</option>
                        <option value="INTERNO">INTERNO</option>
                        <option value="EXTERNO">EXTERNO</option>
                      </select>
                    </div>

                    <div className="form-group"><label>COSTOS</label><input type="text" value={card.costos} onChange={(e) => updateRiesgoCardField(card.id, 'costos', e.target.value)} /></div>
                    <div className="form-group"><label>TIEMPO EN QUE ESTARÁN DISPONIBLES</label><input type="text" value={card.tiempoDisponible} onChange={(e) => updateRiesgoCardField(card.id, 'tiempoDisponible', e.target.value)} /></div>
                    <div className="form-group"><label>FECHA COMPROMISO</label><input type="date" value={card.fechaCompromisoRec ? card.fechaCompromisoRec : ''} onChange={(e) => updateRiesgoCardField(card.id, 'fechaCompromisoRec', e.target.value)} /></div>
                    <div className="form-group"><label>RESPONSABLE</label><input type="text" value={card.responsableRec} onChange={(e) => updateRiesgoCardField(card.id, 'responsableRec', e.target.value)} /></div>
                  </>
                )}

                {card.tipoImplicacion === 'OTRAS' && (
                  <>
                    <div className="form-group"><label>INVOLUCRADOS (puede seleccionar varios)</label>
                      <div className="checkbox-group">
                        {['SOCIOS', 'PROVEEDORES', 'AUTORIDADES', 'CLIENTES', 'OTROS'].map(inv => (
                          <label key={inv} style={{ display: 'block' }}>
                            <input type="checkbox" checked={(card.involucradosSelected || []).includes(inv)} onChange={(e) => toggleInvolucrado(card.id, inv, e.target.checked)} /> {inv}
                          </label>
                        ))}
                      </div>
                    </div>

                    {(card.involucradosSelected || []).map(inv => (
                      <div key={inv} className="involucrado-block" style={{ borderLeft: '3px solid #ccc', paddingLeft: 8, marginTop: 8 }}>
                        <h5>{inv}</h5>
                        <div className="form-group"><label>TIPO DE AFECTACIÓN O BENEFICIO</label>
                          <input type="text" value={card.involucradosData && card.involucradosData[inv] ? card.involucradosData[inv].tipoAfectacion : ''} onChange={(e) => updateInvolucradoField(card.id, inv, 'tipoAfectacion', e.target.value)} />
                        </div>

                        <div className="form-group"><label>GENERA COSTOS</label>
                          <select value={card.involucradosData && card.involucradosData[inv] ? (card.involucradosData[inv].generaCostos ? 'SI' : 'NO') : ''} onChange={(e) => updateInvolucradoField(card.id, inv, 'generaCostos', e.target.value === 'SI')}>
                            <option value="">-- Seleccione --</option>
                            <option value="SI">SI</option>
                            <option value="NO">NO</option>
                          </select>
                        </div>

                        <div className="form-group"><label>MEDIDAS DE CONTROL</label>
                          <textarea rows={2} value={card.involucradosData && card.involucradosData[inv] ? card.involucradosData[inv].medidasControl : ''} onChange={(e) => updateInvolucradoField(card.id, inv, 'medidasControl', e.target.value)} />
                        </div>

                        <div className="form-group"><label>FECHA COMPROMISO</label>
                          <input type="date" value={card.involucradosData && card.involucradosData[inv] ? card.involucradosData[inv].fechaCompromiso : ''} onChange={(e) => updateInvolucradoField(card.id, inv, 'fechaCompromiso', e.target.value)} />
                        </div>

                        <div className="form-group"><label>RESPONSABLE</label>
                          <input type="text" value={card.involucradosData && card.involucradosData[inv] ? card.involucradosData[inv].responsable : ''} onChange={(e) => updateInvolucradoField(card.id, inv, 'responsable', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        );

      case 9:
  return (
    <div className="form-section" ref={el => sectionRefs.current[8] = el}>
      <h2>Firmas</h2>

      {/* SOLICITANTE */}
      <fieldset className={`signature-group ${(errors['firma_solicitado_nombre'] || errors['firma_solicitado_cargo'] || errors['firma_solicitado_firma']) ? 'field-error' : ''}`}>
        <legend>Solicitado por:</legend>
        <div className="form-group">
          <label>Nombre*</label>
          <input type="text"
                 value={formData.firmadoPor.solicitado.nombre}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, solicitado: { ...prev.firmadoPor.solicitado, nombre: e.target.value } } }))}
                 className={errors['firma_solicitado_nombre'] ? 'error' : ''} />
        </div>
        <div className="form-group">
          <label>Cargo*</label>
          <input type="text"
                 value={formData.firmadoPor.solicitado.cargo}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, solicitado: { ...prev.firmadoPor.solicitado, cargo: e.target.value } } }))}
                 className={errors['firma_solicitado_cargo'] ? 'error' : ''} />
        </div>
        <div className="form-group">
          <label>Firma*</label>
          <button type="button" onClick={() => openSignature('solicitado')} className="signature-btn">
            {formData.firmadoPor.solicitado.firma ? 'Re-firmar' : 'Firmar'}
          </button>
          {formData.firmadoPor.solicitado.firma && (
            <div className="signature-preview">
              <img src={formData.firmadoPor.solicitado.firma} alt="Firma solicitante" height="50" />
              <span>Firma capturada</span>
            </div>
          )}
        </div>
        {(errors['firma_solicitado_nombre'] || errors['firma_solicitado_cargo'] || errors['firma_solicitado_firma']) && <div className="error-message">Faltan datos del solicitante.</div>}
      </fieldset>

      {/* EVALUADO (solo nombre y cargo) */}
      <fieldset className={`signature-group ${(errors['firma_evaluado_nombre'] || errors['firma_evaluado_cargo']) ? 'field-error' : ''}`}>
        <legend>Evaluado por:</legend>
        <div className="form-group">
          <label>Nombre*</label>
          <input type="text"
                 value={formData.firmadoPor.evaluado.nombre}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, evaluado: { ...prev.firmadoPor.evaluado, nombre: e.target.value } } }))}
                 className={errors['firma_evaluado_nombre'] ? 'error' : ''} />
        </div>
        <div className="form-group">
          <label>Cargo*</label>
          <input type="text"
                 value={formData.firmadoPor.evaluado.cargo}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, evaluado: { ...prev.firmadoPor.evaluado, cargo: e.target.value } } }))}
                 className={errors['firma_evaluado_cargo'] ? 'error' : ''} />
        </div>
      </fieldset>

      {/* APROBADO - lista dinámica (solo nombre y cargo) */}
      <fieldset className="signature-group">
        <legend>Aprobado por:</legend>

        {(formData.firmadoPor.aprobado || []).map((a, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
            <div className="form-group">
              <label>Nombre*</label>
              <input type="text"
                     value={a.nombre}
                     onChange={(e) => handleAprobadoChange(idx, 'nombre', e.target.value)}
                     className={errors[`firma_aprobado_${idx}_nombre`] ? 'error' : ''} />
            </div>
            <div className="form-group">
              <label>Cargo*</label>
              <input type="text"
                     value={a.cargo}
                     onChange={(e) => handleAprobadoChange(idx, 'cargo', e.target.value)}
                     className={errors[`firma_aprobado_${idx}_cargo`] ? 'error' : ''} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => removeAprobado(idx)}>Eliminar</button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <button type="button" className="btn-primary" onClick={addAprobado}>Agregar aprobador</button>
        </div>
      </fieldset>

      {/* IMPLEMENTADO */}
      <fieldset className={`signature-group ${(errors['firma_implementado_nombre'] || errors['firma_implementado_cargo']) ? 'field-error' : ''}`}>
        <legend>Implementado por:</legend>
        <div className="form-group">
          <label>Nombre*</label>
          <input type="text"
                 value={formData.firmadoPor.implementado.nombre}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, implementado: { ...prev.firmadoPor.implementado, nombre: e.target.value } } }))}
                 className={errors['firma_implementado_nombre'] ? 'error' : ''} />
        </div>
        <div className="form-group">
          <label>Cargo*</label>
          <input type="text"
                 value={formData.firmadoPor.implementado.cargo}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, implementado: { ...prev.firmadoPor.implementado, cargo: e.target.value } } }))}
                 className={errors['firma_implementado_cargo'] ? 'error' : ''} />
        </div>
      </fieldset>

      {/* VALIDADO */}
      <fieldset className={`signature-group ${(errors['firma_validado_nombre'] || errors['firma_validado_cargo']) ? 'field-error' : ''}`}>
        <legend>Validado por:</legend>
        <div className="form-group">
          <label>Nombre*</label>
          <input type="text"
                 value={formData.firmadoPor.validado.nombre}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, validado: { ...prev.firmadoPor.validado, nombre: e.target.value } } }))}
                 className={errors['firma_validado_nombre'] ? 'error' : ''} />
        </div>
        <div className="form-group">
          <label>Cargo*</label>
          <input type="text"
                 value={formData.firmadoPor.validado.cargo}
                 onChange={(e) => setFormData(prev => ({ ...prev, firmadoPor: { ...prev.firmadoPor, validado: { ...prev.firmadoPor.validado, cargo: e.target.value } } }))}
                 className={errors['firma_validado_cargo'] ? 'error' : ''} />
        </div>
      </fieldset>
    </div>
  );


      default:
        return null;
    }
  };

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
        {[1,2,3,4,5,6,7,8,9].map(renderProgressStep)}
      </div>

      <form onSubmit={activeSection === 9 ? (e) => { e.preventDefault(); sendRequest(); } : (e) => { e.preventDefault(); const missing = validateSection(activeSection); if (missing.length === 0) setActiveSection(s => Math.min(9, s + 1)); }}>
        {renderSection()}

        <div className="form-navigation">
          {activeSection > 1 && <button type="button" className="btn-secondary" onClick={() => setActiveSection(activeSection - 1)}>Anterior</button>}

          {activeSection < 9 ? (
            <button type="submit" className="btn-primary">Siguiente</button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={saveDraft} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar borrador'}</button>
              <button type="button" className="btn-primary" onClick={sendRequest} disabled={isSubmitting} style={{ marginLeft: 8 }}>{isSubmitting ? 'Procesando...' : 'Enviar Solicitud'}</button>
            </>
          )}
        </div>
      </form>

      <SignaturePopup open={!!sigRole} role={sigRole} onSave={handleSaveSig} onClose={() => setSigRole(null)} />
    </div>
  );
}