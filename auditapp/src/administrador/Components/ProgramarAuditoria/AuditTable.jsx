import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AuditTable.css';

const AuditTable = () => {
    const [audits, setAudits] = useState([]);
    const [newAudit, setNewAudit] = useState({
        cliente: '',
        fecha: '',
        modalidad: 'Presencial', // Valor por defecto
        status: 'Realizada', // Valor por defecto
        realizada: false,
        programada: false,
    });

    // Obtener auditorías al cargar el componente
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

    // Manejar cambios en los campos de entrada para la nueva auditoría
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAudit({
            ...newAudit,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // Agregar una nueva auditoría
    const addAudit = async () => {
        if (newAudit.cliente && newAudit.fecha && newAudit.modalidad && newAudit.status) {
            try {
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/programas-anuales/audits`, newAudit);
                setAudits([...audits, response.data]);
                // Resetear el formulario
                setNewAudit({
                    cliente: '',
                    fecha: '',
                    modalidad: 'Presencial', // Restablecer a valor por defecto
                    status: 'Realizada', // Restablecer a valor por defecto
                    realizada: false,
                    programada: false,
                });
            } catch (error) {
                console.error("Error al agregar la auditoría:", error);
            }
        } else {
            alert("Por favor, completa todos los campos.");
        }
    };
    return (
        <>
            <div className="audit-table-container">
                <h2>Programa Anual de Auditorías Externo 2024</h2>
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
                        {audits.map((audit) => (
                            <tr key={audit._id}>
                                <td>{audit.cliente}</td>
                                <td>{audit.fecha}</td>
                                <td>{audit.modalidad}</td>
                                <td className={`status ${audit.status.toLowerCase().replace(/ /g, '-')}`}>
                                    {audit.status}
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
                            
                        </tr>
                    </tbody>
                </table>
                <button onClick={addAudit}>Agregar Auditoría</button>
            </div>
        </>
    );
};

export default AuditTable;
