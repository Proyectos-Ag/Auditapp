import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AuditTable.css';

const AuditTable = () => {
  const [audits, setAudits] = useState([]);
  const [newAudit, setNewAudit] = useState({
    cliente: '',
    fecha: '',
    modalidad: 'Presencial',
    status: 'Realizada',
    realizada: false,
    programada: false,
  });

  // Para controlar edición en la tabla
  // { auditId: { editing: boolean, newStatus: string } }
  const [editStatus, setEditStatus] = useState({});
  const [loading, setLoading] = useState(false); // Estado para el indicador de carga
  const [show2024, setShow2024] = useState(false); // Estado para mostrar/ocultar 2024
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`);
      setAudits(response.data);
    } catch (error) {
      console.error("Error al obtener las auditorías:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAudit({
      ...newAudit,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const addAudit = async () => {
    if (newAudit.cliente && newAudit.fecha && newAudit.modalidad && newAudit.status) {
      setLoading(true); // Activar el indicador de carga
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`,
          newAudit
        );
        setAudits([...audits, response.data]);
        setNewAudit({
          cliente: '',
          fecha: '',
          modalidad: 'Presencial',
          status: 'Realizada',
          realizada: false,
          programada: false,
        });
      } catch (error) {
        console.error("Error al agregar la auditoría:", error);
      } finally {
        setLoading(false); // Desactivar el indicador de carga
      }
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  // Iniciar edición del status de una fila
  const handleEditClick = (auditId, currentStatus) => {
    setEditStatus({
      ...editStatus,
      [auditId]: { editing: true, newStatus: currentStatus }
    });
  };

  // Manejar cambio en el <select> de status
  const handleStatusChange = (auditId, newValue) => {
    setEditStatus(prev => ({
      ...prev,
      [auditId]: {
        ...prev[auditId],
        newStatus: newValue
      }
    }));
  };

  // Cancelar edición
  const handleCancelEdit = (auditId) => {
    const copy = { ...editStatus };
    delete copy[auditId];
    setEditStatus(copy);
  };

  // Guardar nueva status en BD
  const handleSaveStatus = async (auditId) => {
    const confirmChange = window.confirm("¿Seguro que deseas cambiar el status?");
    if (!confirmChange) return;

    try {
      const newValue = editStatus[auditId].newStatus;
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits/${auditId}`, {
        field: 'status',
        value: newValue
      });
      setAudits(prev =>
        prev.map(audit =>
          audit._id === auditId ? { ...audit, status: newValue } : audit
        )
      );
      handleCancelEdit(auditId);
    } catch (error) {
      console.error("Error al actualizar el status:", error);
    }
  };

  const audits2024 = audits.filter((audit) => new Date(audit.fecha).getFullYear() === 2024);
  const audits2025 = audits.filter((audit) => new Date(audit.fecha).getFullYear() === 2025);

  return (
    <div className="audit-table-container">
      {loading && (
        <div className="loading-overlay">
          <p>Enviando correo, por favor espera...</p>
        </div>
      )}
      <h1>Programa Anual de Auditorías</h1>

      {currentYear === 2025 && (
        <>
          <button
            className="toggle-2024-button"
            onClick={() => setShow2024(!show2024)}
          >
            {show2024 ? 'Ocultar Auditorías 2024' : 'Consultar Auditorías 2024'}
          </button>

          {show2024 && (
            <div className="audit-2024-section">
              <h2>Auditorías 2024</h2>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Cliente / Casa Auditora</th>
                    <th>Fecha</th>
                    <th>Modalidad</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audits2024.map((audit) => (
                    <tr key={audit._id}>
                      <td>{audit.cliente}</td>
                      <td>{audit.fecha}</td>
                      <td>{audit.modalidad}</td>
                      <td className={`status ${audit.status.toLowerCase().replace(/ /g, '-')}`}>
                        {audit.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <h2>Auditorías {currentYear}</h2>
      <table className="audit-table">
        <thead>
          <tr>
            <th>Cliente / Casa Auditora</th>
            <th>Fecha</th>
            <th>Modalidad</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {audits2025.map((audit) => (
            <tr key={audit._id}>
              <td>{audit.cliente}</td>
              <td>{audit.fecha}</td>
              <td>{audit.modalidad}</td>
              <td className={`status ${audit.status.toLowerCase().replace(/ /g, '-')}`}>
                {editStatus[audit._id]?.editing ? (
                  <select
                    value={editStatus[audit._id].newStatus}
                    onChange={(e) => handleStatusChange(audit._id, e.target.value)}
                  >
                    <option value="Realizada">Realizada</option>
                    <option value="Programada">Programada</option>
                    <option value="Por Confirmar">Por Confirmar</option>
                    <option value="En Curso">En Curso</option>
                    <option value="No ejecutada">No ejecutada</option>
                  </select>
                ) : (
                  audit.status
                )}
              </td>
              <td>
                {editStatus[audit._id]?.editing ? (
                  <>
                    <button onClick={() => handleSaveStatus(audit._id)}>Guardar</button>
                    <button onClick={() => handleCancelEdit(audit._id)}>Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => handleEditClick(audit._id, audit.status)}>
                    Editar
                  </button>
                )}
              </td>
            </tr>
          ))}

          {/* Fila para agregar una nueva auditoría */}
          <tr>
            <td>
              <input
                type="text"
                name="cliente"
                value={newAudit.cliente}
                onChange={handleInputChange}
                placeholder="Cliente / Casa Auditora"
              />
            </td>
            <td>
              <input
                type="date"
                name="fecha"
                value={newAudit.fecha}
                onChange={handleInputChange}
              />
            </td>
            <td>
              <select
                name="modalidad"
                value={newAudit.modalidad}
                onChange={handleInputChange}
              >
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
                <option value="Mixta">Mixta</option>
              </select>
            </td>
            <td>
              <select
                name="status"
                value={newAudit.status}
                onChange={handleInputChange}
              >
                <option value="Realizada">Realizada</option>
                <option value="Programada">Programada</option>
                <option value="Por Confirmar">Por Confirmar</option>
                <option value="En Curso">En Curso</option>
                <option value="No ejecutada">No ejecutada</option>
              </select>
            </td>
            <td>
              <button onClick={addAudit} disabled={loading}>
                {loading ? "Cargando..." : "Agregar Auditoría"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;