import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FiCalendar, FiUser, FiMail, FiEdit2, FiCheck, FiX } from "react-icons/fi";

// Animaciones
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Estilos premium
const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 2.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
    margin-top: 96px; /* Bajado una pulgada (96px) */
  align-items: center;
  margin-bottom: 2.5rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    width: 3rem;
    height: 0.1875rem;
    background: linear-gradient(90deg, #4361ee, #3a0ca3);
    border-radius: 0.1875rem;
  }
`;

const AreaTag = styled.span`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 1.25rem;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
`;

const TableWrapper = styled.div`
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 0.25rem 1.5rem rgba(0, 0, 0, 0.04);
  animation: ${fadeIn} 0.8s ease-out;
  border: 1px solid #e9ecef;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
`;

const TableHead = styled.thead`
  background: #f8f9fa;
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
  border-bottom: 1px solid #e9ecef;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1.25rem 1.5rem;
  font-size: 0.875rem;
  color: #212529;
  vertical-align: middle;
`;

const StatusIndicator = styled.span`
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 1.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ status }) => {
    switch(status) {
      case '0%': return '#fff5f5';
      case '25%': return '#fff8e6';
      case '50%': return '#f0fff4';
      case '75%': return '#ebf8ff';
      case '100%': return '#f0fdf4';
      default: return '#f8f9fa';
    }
  }};
  color: ${({ status }) => {
    switch(status) {
      case '0%': return '#dc2626';
      case '25%': return '#d97706';
      case '50%': return '#16a34a';
      case '75%': return '#0284c7';
      case '100%': return '#065f46';
      default: return '#6c757d';
    }
  }};
  border: 1px solid ${({ status }) => {
    switch(status) {
      case '0%': return '#fecaca';
      case '25%': return '#fed7aa';
      case '50%': return '#bbf7d0';
      case '75%': return '#bae6fd';
      case '100%': return '#a7f3d0';
      default: return '#e9ecef';
    }
  }};
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: #4361ee;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(67, 97, 238, 0.1);
  }
`;

const DateInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CurrentDate = styled.span`
  font-weight: 500;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const PreviousDate = styled.span`
  font-size: 0.75rem;
  color: #adb5bd;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const FloatingRescheduleForm = styled.div`
  position: absolute;
  right: 1.5rem;
  bottom: -6rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.1);
  z-index: 10;
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid #e9ecef;
`;

const DateInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
  }
`;

const PrimaryButton = styled.button`
  background: #4361ee;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a56d4;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #6c757d;
  border: 1px solid #e9ecef;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const LoadingState = styled.div`
  padding: 2.5rem;
  text-align: center;
  color: #6c757d;
`;

const ResponsibleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ResponsibleName = styled.span`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const ResponsibleEmail = styled.span`
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Si ya está en formato dd/mm/yyyy, devolverlo tal cual
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateString;
  }
  
  // Si es una fecha ISO (2025-04-24T00:00:00.000Z)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Función para convertir abreviación de mes a nombre completo
const getFullMonthName = (abbreviation) => {
  const months = {
    ENE: 'Enero',
    FEB: 'Febrero',
    MAR: 'Marzo',
    ABR: 'Abril',
    MAY: 'Mayo',
    JUN: 'Junio',
    JUL: 'Julio',
    AGO: 'Agosto',
    SEP: 'Septiembre',
    OCT: 'Octubre',
    NOV: 'Noviembre',
    DIC: 'Diciembre'
  };
  
  // Eliminar "indicador" si está presente
  const cleanAbbr = abbreviation.replace('indicador', '').trim();
  return months[cleanAbbr] || cleanAbbr;
};

const ListaAccionFrecu = () => {
  const { label } = useParams();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReprogramar, setShowReprogramar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const fetchAcciones = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos/acciones`,
        { params: { area: label } }
      );
      
      // Formatear todas las fechas en los datos recibidos
      const accionesFormateadas = response.data.map(accion => ({
        ...accion,
        fecha: formatDate(accion.fecha),
        fichaCompromiso: formatDate(accion.fichaCompromiso),
        historialFechas: accion.historialFechas?.map(formatDate) || [],
        periodo: getFullMonthName(accion.periodo)
      }));
      
      setAcciones(accionesFormateadas);
    } catch (error) {
      console.error("Error al cargar ListaAccionFrecu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReprogramar = async (accionId) => {
    if (!nuevaFecha) {
      alert("Por favor selecciona una fecha válida");
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/objetivos/acciones/${accionId}/reprogramar`,
        { nuevaFecha: new Date(nuevaFecha).toISOString() }
      );
      await fetchAcciones();
      setShowReprogramar(null);
      setNuevaFecha("");
    } catch (error) {
      console.error("Error al actualizar fecha:", error);
    }
  };

  useEffect(() => {
    fetchAcciones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  return (
    <Container>
      <Header>
        <Title>Listado de Acciònes</Title>
        <AreaTag>{label}</AreaTag>
      </Header>

      <TableWrapper>
        <StyledTable>
          <TableHead>
            <tr>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>No. Objetivo</TableHeaderCell>
              <TableHeaderCell>Periodo</TableHeaderCell>
              <TableHeaderCell>Acciones</TableHeaderCell>
              <TableHeaderCell>Compromiso</TableHeaderCell>
              <TableHeaderCell>Responsable</TableHeaderCell>
              <TableHeaderCell>Efectividad</TableHeaderCell>
              <TableHeaderCell>Observaciones</TableHeaderCell>
              <TableHeaderCell>Acciones</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <tr>
                <TableCell colSpan="9">
                  <LoadingState>Cargando ListaAccionFrecu...</LoadingState>
                </TableCell>
              </tr>
            ) : (
              acciones.map((accion) => (
                <TableRow key={accion._id}>
                  <TableCell>{accion.fecha}</TableCell>
                  <TableCell>#{accion.noObjetivo}</TableCell>
                  <TableCell>{accion.periodo}</TableCell>
                  <TableCell>{accion.acciones}</TableCell>
                  <TableCell>
                    <DateInfo>
                      <CurrentDate>
                        <FiCalendar size={14} />
                        {accion.fichaCompromiso}
                      </CurrentDate>
                      {accion.historialFechas?.map((fecha, idx) => (
                        <PreviousDate key={idx}>
                          <FiCalendar size={12} />
                          Anterior: {fecha}
                        </PreviousDate>
                      ))}
                    </DateInfo>
                  </TableCell>
                  <TableCell>
                    <ResponsibleInfo>
                      <ResponsibleName>
                        <FiUser size={14} />
                        {accion.responsable.nombre}
                      </ResponsibleName>
                      <ResponsibleEmail>
                        <FiMail size={12} />
                        {accion.responsable.email}
                      </ResponsibleEmail>
                    </ResponsibleInfo>
                  </TableCell>
                  <TableCell>
                    <StatusIndicator status={accion.efectividad}>
                      {accion.efectividad.replace('indicador', '')}
                    </StatusIndicator>
                  </TableCell>
                  <TableCell>{accion.observaciones}</TableCell>
                  <TableCell style={{ position: 'relative' }}>
                    <ActionButton onClick={() => setShowReprogramar(accion._id)}>
                      <FiEdit2 size={16} />
                      Reprogramar
                    </ActionButton>
                    
                    {showReprogramar === accion._id && (
                      <FloatingRescheduleForm>
                        <DateInput
                          type="date"
                          value={nuevaFecha}
                          onChange={(e) => setNuevaFecha(e.target.value)}
                        />
                        <PrimaryButton onClick={() => handleReprogramar(accion._id)}>
                          <FiCheck size={16} />
                          Guardar
                        </PrimaryButton>
                        <SecondaryButton onClick={() => setShowReprogramar(null)}>
                          <FiX size={16} />
                          Cancelar
                        </SecondaryButton>
                      </FloatingRescheduleForm>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </StyledTable>
      </TableWrapper>
    </Container>
  );
};

export default ListaAccionFrecu;