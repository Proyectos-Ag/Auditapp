import React from 'react';
import './css/Nota.css';  // Asegúrate de tener estilos CSS adecuados

const ModalNota = ({ notaEmergente, setNotaEmergente, guardarNotaTemporal, cerrarModal }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={cerrarModal}>&times;</span>
                <h2>Agregar Nota</h2>
                <textarea 
                    value={notaEmergente} 
                    onChange={(e) => setNotaEmergente(e.target.value)} 
                />
                <button onClick={guardarNotaTemporal}>Guardar Nota</button>
            </div>
        </div>
    );
};

export default ModalNota;