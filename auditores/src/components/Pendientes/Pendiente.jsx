import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../App';
import logo from "../../assets/img/logoAguida.png";
import './css/pendiente.css';
import Navigation from '../Navigation/narbar';
import Fotos from './Foto'; // Importa el componente Fotos

const Pendientes = () => {
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [hiddenDurations, setHiddenDurations] = useState([]);
    const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
    const [percentages, setPercentages] = useState({});

    const checkboxValues = {
        'Conforme': 1,
        'm': 0.75,
        'M': 0.5,
        'C': 0,
        'NA': null
    };

    useEffect(() => {
    const obtenerFechaInicio = (duracion) => {
        const partes = duracion.split(" ");

        let diaInicio = 1; 
        let mesInicio = 0; 
        let anoInicio = new Date().getFullYear(); 

        for (const parte of partes) {
            const numero = parseInt(parte);
            if (!isNaN(numero)) {
                diaInicio = numero;
            } else if (parte.length === 4 && !isNaN(parseInt(parte))) {
                anoInicio = parseInt(parte);
            } else {
                mesInicio = obtenerNumeroMes(parte);
                if (mesInicio !== -1) break; 
            }
        }

        return new Date(anoInicio, mesInicio, diaInicio);
    };

    const obtenerDatos = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
            const datosFiltrados = response.data.filter((dato) => dato.AuditorLiderEmail === userData.Correo);
            
            // Ordena los datos por duración de manera ascendente
            datosFiltrados.sort((a, b) => {
                const fechaInicioA = obtenerFechaInicio(a.Duracion);
                const fechaInicioB = obtenerFechaInicio(b.Duracion);
            
                // Primero, comparamos las fechas de inicio
                if (fechaInicioA < fechaInicioB) return -1;
                if (fechaInicioA > fechaInicioB) return 1;
                return 0; // Si ambas fechas de inicio y fin son iguales
            });
            
            setDatos(datosFiltrados);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    obtenerDatos();
}, [userData]);

    
    // Función para obtener el número del mes a partir de su nombre
    const obtenerNumeroMes = (nombreMes) => {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return meses.indexOf(nombreMes.toLowerCase());
    };    

    const toggleDuration = (duration) => {
        setHiddenDurations(hiddenDurations.includes(duration) ?
            hiddenDurations.filter((dur) => dur !== duration) :
            [...hiddenDurations, duration]
        );
    };

    const handleCheckboxChange = (periodIdx, programIdx, descIdx, checkboxName) => {
        const key = `${periodIdx}_${programIdx}_${descIdx}`;
        setSelectedCheckboxes(prevState => {
            const updated = { ...prevState, [key]: checkboxName };

            // Update percentage
            const programKey = `${periodIdx}_${programIdx}`;
            const relevantCheckboxes = Object.keys(updated).filter(k => k.startsWith(`${periodIdx}_${programIdx}_`));
            let totalValue = 0;
            let validPrograms = 0;

            relevantCheckboxes.forEach(k => {
                const value = checkboxValues[updated[k]];
                if (value !== null) {
                    totalValue += value;
                    validPrograms++;
                }
            });

            const percentage = validPrograms > 0 ? (totalValue / validPrograms) * 100 : 0;

            setPercentages(prevPercentages => ({
                ...prevPercentages,
                [programKey]: percentage
            }));

            return updated;
        });
    };

    return (
        <div>
            <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <Navigation />
            </div>
            <div className="datos-container2">
                <div className="form-group-datos">
                    {datos.map((dato, periodIdx) => (
                        <div key={periodIdx}>
                            <div className="duracion-bloque">
                                <h2 onClick={() => toggleDuration(dato.Duracion)}>
                                    Período: {dato.Duracion}
                                </h2>
                            </div>
                            {hiddenDurations.includes(dato.Duracion) ? null :
                                dato.Programa.map((programa, programIdx) => (
                                    <div key={programIdx}>
                                        <div className="header-container-datos">
                                            <img src={logo} alt="Logo Empresa" className="logo-empresa" />
                                        </div>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colSpan="2">{programa.Nombre}</th>
                                                    <th colSpan="5" className="conformity-header">Conformidad</th>
                                                    <th colSpan="1">
                                                        Porcentaje: {percentages[`${periodIdx}_${programIdx}`] ? percentages[`${periodIdx}_${programIdx}`].toFixed(2) : 0}%
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Requisitos</th>
                                                    <th>Conforme</th>
                                                    <th>m</th>
                                                    <th>M</th>
                                                    <th>C</th>
                                                    <th>NA</th>
                                                    <th>Hallazgos/Observaciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {programa.Descripcion.map((desc, descIdx) => (
                                                    <tr key={descIdx}>
                                                        <td>{desc.ID}</td>
                                                        <td>{desc.Requisito}</td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                name={`Conforme_${periodIdx}_${programIdx}_${descIdx}`}
                                                                checked={selectedCheckboxes[`${periodIdx}_${programIdx}_${descIdx}`] === 'Conforme'}
                                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, 'Conforme')}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                name={`m_${periodIdx}_${programIdx}_${descIdx}`}
                                                                checked={selectedCheckboxes[`${periodIdx}_${programIdx}_${descIdx}`] === 'm'}
                                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, 'm')}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                name={`M_${periodIdx}_${programIdx}_${descIdx}`}
                                                                checked={selectedCheckboxes[`${periodIdx}_${programIdx}_${descIdx}`] === 'M'}
                                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, 'M')}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                name={`C_${periodIdx}_${programIdx}_${descIdx}`}
                                                                checked={selectedCheckboxes[`${periodIdx}_${programIdx}_${descIdx}`] === 'C'}
                                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, 'C')}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                name={`NA_${periodIdx}_${programIdx}_${descIdx}`}
                                                                checked={selectedCheckboxes[`${periodIdx}_${programIdx}_${descIdx}`] === 'NA'}
                                                                onChange={() => handleCheckboxChange(periodIdx, programIdx, descIdx, 'NA')}
                                                            />
                                                        </td>
                                                        <td>
                                                            <textarea name={`Observaciones_${periodIdx}_${programIdx}_${descIdx}`} />
                                                            <Fotos /> {/* Inserta el componente Fotos aquí */}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pendientes;
