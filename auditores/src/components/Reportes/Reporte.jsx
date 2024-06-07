import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../App';
import logo from "../../assets/img/logoAguida.png";
import './css/Reporte.css'; // Crea un archivo CSS específico si es necesario
import Navigation from '../Navigation/narbar';

const Reporte = () => {
    const { userData } = useContext(UserContext);
    const [datos, setDatos] = useState([]);
    const [hiddenDurations, setHiddenDurations] = useState([]);

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
                if (userData && userData.Correo) {
                    const datosFiltrados = response.data.filter((dato) => 
                        dato.AuditorLiderEmail === userData.Correo && dato.Estado === "Realizada"
                    );

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
            } else {
                console.log('userData o userData.Correo no definidos:', userData);
            }
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

    return (
        <div className='espacio-repo'>
            <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <Navigation />
            </div>
            <div className="datos-container-repo">
                <div className="form-group-datos">
                {datos.map((dato, periodIdx) => (
                    <div key={periodIdx}>
                        <div className="duracion-bloque-repo">
                            <h2 onClick={() => toggleDuration(dato.Duracion)}>
                                Período: {dato.Duracion}
                            </h2>
                        </div>
                        <table>
                        <div>{dato.TipoAuditoria}</div>
                        <div>{dato.Duracion}</div>
                        <div>{dato.Departamento}</div>
                        <div>{dato.AreasAudi}</div>
                        <div>{dato.Auditados}</div>
                        <div>{dato.NombresObservadores}</div>
                        <div>{dato.PorcentajeTotal}%</div>
                        <div>{dato.AuditorLider}</div>
                        </table>
                        <div className={`update-button-container ${hiddenDurations.includes(dato.Duracion) ? 'hidden' : ''}`}>
                            <div className="header-container-datos">
                                <img src={logo} alt="Logo Empresa" className="logo-empresa" />
                            </div>
                            {hiddenDurations.includes(dato.Duracion) ? null :
                                dato.Programa.map((programa, programIdx) => (
                                    <div key={programIdx}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colSpan="10" className="conformity-header">Resultados</th>
                                                </tr>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Programa</th>
                                                    <th>Lineamiento</th>
                                                    <th>Criterio</th>
                                                    <th>Observaciones</th>
                                                    <th>Hallazgos</th>
                                                    <th>Acciones</th>
                                                    <th>Fecha</th>
                                                    <th>Responsable</th>
                                                    <th>Efectividad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {programa.Descripcion.map((desc, descIdx) => {
                                                    // Verifica si desc.Hallazgo ya contiene el prefijo "data:image/png;base64,"
                                                    const base64String = desc.Hallazgo.startsWith('data:image/png;base64,')
                                                        ? desc.Hallazgo
                                                        : `data:image/png;base64,${desc.Hallazgo}`;

                                                    return (
                                                        <tr key={descIdx}>
                                                            <td>{desc.ID}</td>
                                                            <td>{programa.Nombre}</td>
                                                            <td>{desc.Requisito}</td>
                                                            <td>{}</td>
                                                            <td>{desc.Observacion}</td>
                                                            <td>
                                                                {desc.Hallazgo ? (
                                                                    <img 
                                                                        src={base64String} 
                                                                        alt="Hallazgo" 
                                                                        className="hallazgo-imagen" 
                                                                    />
                                                                ) : null}
                                                            </td>
                                                            <td>{}</td>
                                                            <td>{}</td>
                                                            <td>{}</td>
                                                            <td>{}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                        </table>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};

export default Reporte;