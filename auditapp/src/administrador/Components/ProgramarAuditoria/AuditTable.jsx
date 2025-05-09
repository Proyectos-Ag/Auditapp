import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AuditTable.css';
import html2canvas from "html2canvas";
import { Backdrop, CircularProgress, Typography, Snackbar, Alert } from "@mui/material";

const AuditTable = () => {
  const [audits, setAudits] = useState([]);
  const [newAudit, setNewAudit] = useState({
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    modalidad: 'Presencial',
    status: 'Realizada',
    realizada: false,
    programada: false,
  });

  const [editStatus, setEditStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [show2024, setShow2024] = useState(false);
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
      [name]: type === 'checkbox' ? checked : (name.includes("fecha") ? value : value),
    });
  };

  const captureTableImage = async () => {
    const table = document.querySelector(".audit-table");
    if (!table) return null;
  
    const canvas = await html2canvas(table, { scale: 2 });
  
    const rowCount = table.rows.length;
    const colCount = table.rows[0]?.cells.length;
    if (rowCount === 0 || colCount === 0) return null; // Evitar errores
  
    // Calcular el ancho total sin la última columna
    let totalWidth = 0;
    for (let i = 0; i < colCount - 1; i++) {
      totalWidth += table.rows[0].cells[i].offsetWidth;
    }
  
    // Calcular la altura total sin la última fila
    let totalHeight = 0;
    for (let i = 0; i < rowCount - 1; i++) {
      totalHeight += table.rows[i].offsetHeight;
    }
  
    // Crear un nuevo canvas con las dimensiones ajustadas
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = totalWidth * 2; // Ajustado por la escala
    croppedCanvas.height = totalHeight * 2; // Ajustado por la escala
    const croppedCtx = croppedCanvas.getContext("2d");
  
    // Dibujar la imagen recortada correctamente
    croppedCtx.drawImage(canvas, 0, 0, croppedCanvas.width, croppedCanvas.height, 0, 0, croppedCanvas.width, croppedCanvas.height);
  
    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };  

  const sendAuditEmail = async (auditId) => {
    // Capturar la imagen de la tabla (asegúrate de tener definida la función captureTableImage)
    const tableImageBlob = await captureTableImage();
  
    if (!tableImageBlob) {
      console.warn("No se pudo capturar la imagen para el correo.");
      return;
    }
  
    // Preparar FormData para enviar el auditId y la imagen
    const formData = new FormData();
    formData.append("auditId", auditId);
    // El nombre "file" debe coincidir con el que se usa en el backend (por ejemplo, req.file)
    formData.append("tablaImagen", tableImageBlob, "tabla.png");
  
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits/send-email`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccessMessage(true);
      console.log("Correo enviado correctamente.");
    } catch (error) {
      console.error("Error al enviar el correo:", error);
    } finally {
      setLoading(false);
    }
  };  
  

  const registerAudit = async () => {
    // Validar que se hayan completado los campos requeridos
    if (
      !newAudit.cliente ||
      !newAudit.fechaInicio ||
      !newAudit.fechaFin ||
      !newAudit.modalidad ||
      !newAudit.status
    ) {
      alert("Por favor, completa todos los campos.");
      return null;
    }
  
    // Validar que la fecha de inicio no sea posterior a la fecha de fin
    if (new Date(newAudit.fechaInicio) > new Date(newAudit.fechaFin)) {
      alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return null;
    }
  
    // Crear un objeto temporal para la UI (optimistic update)
    const newAuditEntry = {
      ...newAudit,
      _id: Date.now().toString(), // ID temporal para la UI
    };
  
    // Actualizar la lista de auditorías en la UI
    setAudits([...audits, newAuditEntry]);
  
    // Reiniciar el formulario
    setNewAudit({
      cliente: "",
      fechaInicio: "",
      fechaFin: "",
      modalidad: "Presencial",
      status: "Realizada",
      realizada: false,
      programada: false,
    });     
  
    // Preparar los datos a enviar (sin archivo)
    const auditData = {
      cliente: newAuditEntry.cliente,
      fechaInicio: newAuditEntry.fechaInicio,
      fechaFin: newAuditEntry.fechaFin,
      modalidad: newAuditEntry.modalidad,
      status: newAuditEntry.status,
      realizada: newAuditEntry.realizada,
      programada: newAuditEntry.programada,
    };
  
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`,
        auditData
      );
      const savedAudit = response.data;
  
      // Reemplazar el registro temporal por el guardado en la BD
      setAudits((prevAudits) =>
        prevAudits.map((audit) =>
          audit._id === newAuditEntry._id ? savedAudit : audit
        )
      );
  
      // Devolver la auditoría guardada para usar su _id_ en el envío de correo
      return savedAudit;
    } catch (error) {
      console.error("Error al agregar la auditoría:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleEditClick = (auditId, currentStatus) => {
    setEditStatus({
      ...editStatus,
      [auditId]: { editing: true, newStatus: currentStatus }
    });
  };

  const handleStatusChange = (auditId, newValue) => {
    setEditStatus(prev => ({
      ...prev,
      [auditId]: {
        ...prev[auditId],
        newStatus: newValue
      }
    }));
  };

  const handleCancelEdit = (auditId) => {
    const copy = { ...editStatus };
    delete copy[auditId];
    setEditStatus(copy);
  };

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

  // Función para ordenar las auditorías por mes de forma ascendente
  const sortAuditsByMonth = (auditsArray) => {
    return auditsArray.sort((a, b) => {
      const dateA = new Date(a.fechaInicio);
      const dateB = new Date(b.fechaInicio);
      return dateA.getMonth() - dateB.getMonth() || dateA.getDate() - dateB.getDate();
    });
  };

  const audits2024 = sortAuditsByMonth(audits.filter((audit) => new Date(audit.fechaInicio).getFullYear() === 2024));
  const audits2025 = sortAuditsByMonth(audits.filter((audit) => new Date(audit.fechaInicio).getFullYear() === 2025));

  return (
    <div className="audit-table-container">
       {/* Cargando */}
        {loading && (
          <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
            <div style={{ textAlign: "center" }}>
              <CircularProgress color="inherit" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Enviando correo, por favor espere...
              </Typography>
            </div>
          </Backdrop>
        )}

        {/* Mensaje de éxito */}
        <Snackbar
          open={successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={() => setSuccessMessage(false)} severity="success" sx={{ width: "100%" }}>
            📩 Correos enviados exitosamente.
          </Alert>
        </Snackbar>
      
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
                    <th>Rango de Fechas</th>
                    <th>Modalidad</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audits2024.map((audit) => (
                    <tr key={audit._id}>
                      <td>{audit.cliente}</td>
                      <td>
                        {new Intl.DateTimeFormat("es-ES", {
                          timeZone: "UTC",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(audit.fechaInicio))}
                        {" - "}
                        {new Intl.DateTimeFormat("es-ES", {
                          timeZone: "UTC",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(audit.fechaFin))}
                      </td>
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
            <th>Rango de Fechas</th>
            <th>Modalidad</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {audits2025.map((audit) => (
            <tr key={audit._id}>
              <td>{audit.cliente}</td>
              <td>
                {new Intl.DateTimeFormat("es-ES", {
                  timeZone: "UTC",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(audit.fechaInicio))}
                {" - "}
                {new Intl.DateTimeFormat("es-ES", {
                  timeZone: "UTC",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(audit.fechaFin))}
              </td>
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
                name="fechaInicio"
                value={newAudit.fechaInicio}
                onChange={handleInputChange}
              />
              <input
                type="date"
                name="fechaFin"
                value={newAudit.fechaFin}
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
              <button onClick={registerAudit} disabled={loading}>
                {loading ? "Cargando..." : "Agregar Auditoría"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={sendAuditEmail} disabled={loading}>
                {loading ? "Cargando..." : "Enviar Correo"}
              </button>
    </div>
  );
};

export default AuditTable;
