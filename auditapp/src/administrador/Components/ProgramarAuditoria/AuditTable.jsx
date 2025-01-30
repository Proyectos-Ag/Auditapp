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
      [name]: type === 'checkbox' ? checked : value,
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
  

  const addAudit = async () => {
    if (
      newAudit.cliente &&
      newAudit.fechaInicio &&
      newAudit.fechaFin &&
      newAudit.modalidad &&
      newAudit.status
    ) {
      if (new Date(newAudit.fechaInicio) > new Date(newAudit.fechaFin)) {
        alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
        return;
      }
  
      console.log("Datos de la auditoría que se insertan visualmente:", newAudit);
  
      // Insertar visualmente la nueva auditoría en la tabla
      const newAuditEntry = {
        ...newAudit,
        _id: Date.now().toString(), // Genera un ID temporal para evitar conflictos
      };
      setAudits([...audits, newAuditEntry]);
  
      // Restablecer el formulario inmediatamente
      setNewAudit({
        cliente: "",
        fechaInicio: "",
        fechaFin: "",
        modalidad: "Presencial",
        status: "Realizada",
        realizada: false,
        programada: false,
      });
  
      // Esperar que la UI se actualice antes de capturar la imagen
      setTimeout(async () => {
        const tableImageBlob = await captureTableImage();
  
        if (tableImageBlob) {
          console.log("Imagen capturada correctamente.");
        } else {
          console.warn("No se pudo capturar la imagen.");
        }
  
        // Enviar los datos al servidor SIN ESPERAR LA RESPUESTA para capturar la imagen antes
        const formData = new FormData();
        formData.append("cliente", newAuditEntry.cliente);
        formData.append("fechaInicio", newAuditEntry.fechaInicio);
        formData.append("fechaFin", newAuditEntry.fechaFin);
        formData.append("modalidad", newAuditEntry.modalidad);
        formData.append("status", newAuditEntry.status);
        if (tableImageBlob) {
          formData.append("tablaImagen", tableImageBlob, "tabla.png");
        }
  
        setLoading(true);
        try {
          await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          setSuccessMessage(true);
        } catch (error) {
          console.error("Error al agregar la auditoría:", error);
        } finally {
          setLoading(false);
        }
      }, 300); // Pequeño retraso para asegurar la actualización del DOM
    } else {
      alert("Por favor, completa todos los campos.");
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

  const audits2024 = audits.filter((audit) => new Date(audit.fechaInicio).getFullYear() === 2024);
  const audits2025 = audits.filter((audit) => new Date(audit.fechaInicio).getFullYear() === 2025);

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
                      <td>{audit.fechaInicio} - {audit.fechaFin}</td>
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
              <td>{audit.fechaInicio} - {audit.fechaFin}</td>
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