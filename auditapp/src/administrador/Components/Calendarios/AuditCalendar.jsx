import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import './css/AuditCalendar.css';

const AuditCalendar = () => {
  // Estados de auditorías finalizadas
  const [auditorias, setAuditorias] = useState([]);
  const [selectedAudits, setSelectedAudits] = useState([]);
  const [filters, setFilters] = useState({
    auditorLider: '',
    tipoAuditoria: '',
    departamento: '',
    aceptibilidad: '',
    year: ''
  });

  // Estados de auditorías pendientes
  const [pendingAudits, setPendingAudits] = useState([]);
  const [filterAuditorLider, setFilterAuditorLider] = useState('');
  const [filterTipoAuditoria, setFilterTipoAuditoria] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');

  useEffect(() => {
    const fetchAuditorias = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/datos`);
        setAuditorias(response.data);

        // Filtrar y ordenar auditorías pendientes
        const pendingAudits = response.data.filter(audit => audit.Estado === 'pendiente' || audit.Estado === 'Terminada' || audit.Estado === 'Devuelto');
        const sortedAudits = pendingAudits.sort((a, b) => new Date(b.FechaInicio) - new Date(a.FechaInicio));
        setPendingAudits(sortedAudits);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAuditorias();
  }, []);

  useEffect(() => {
    const filteredAudits = auditorias.filter(audit => audit.Estado === 'Finalizado');
    setSelectedAudits(filteredAudits);
  }, [auditorias]);

  // Filtros para auditorías finalizadas
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const getFilteredAudits = () => {
    return selectedAudits.filter(audit => {
      const acceptability = getAcceptability(audit.PorcentajeTotal);
      const year = new Date(audit.FechaInicio).getFullYear().toString();
      return (
        (filters.auditorLider === '' || audit.AuditorLider === filters.auditorLider) &&
        (filters.tipoAuditoria === '' || audit.TipoAuditoria === filters.tipoAuditoria) &&
        (filters.departamento === '' || audit.Departamento === filters.departamento) &&
        (filters.aceptibilidad === '' || acceptability === filters.aceptibilidad) &&
        (filters.year === '' || year === filters.year)
      );
    });
  };

  const getAcceptability = (percentage) => {
    if (percentage < 61) {
      return 'Critico';
    } else if (percentage < 80) {
      return 'No aceptable';
    } else if (percentage < 90) {
      return 'Aceptable';
    } else {
      return 'Bueno';
    }
  };

  // Filtros para auditorías pendientes
  const applyFilters = () => {
    return pendingAudits.filter(audit => {
      if (filterAuditorLider && !audit.AuditorLider.toLowerCase().includes(filterAuditorLider.toLowerCase())) {
        return false;
      }
      if (filterTipoAuditoria && audit.TipoAuditoria !== filterTipoAuditoria) {
        return false;
      }
      if (filterFechaInicio && new Date(audit.FechaInicio) < new Date(filterFechaInicio)) {
        return false;
      }
      if (filterFechaFin && new Date(audit.FechaFin) > new Date(filterFechaFin)) {
        return false;
      }
      return true;
    });
  };

  return (
    <Container className="audit-calendar-container">
      <br /><br /><br /><br />
      
      {/* Tabla de Auditorías Finalizadas */}
      <Box className="audit-details-container">
        <Typography variant="h4" className="section-title" gutterBottom>
          Detalles de Auditorías Realizadas
        </Typography>

        {/* Filtros para auditorías finalizadas */}
        <Box className="filters-container">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormControl variant="outlined" fullWidth className="filter-control">
                <InputLabel>Año</InputLabel>
                <Select
                  value={filters.year}
                  onChange={handleFilterChange}
                  label="Año"
                  name="year"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...new Set(auditorias.map(audit => new Date(audit.FechaInicio).getFullYear()))].map((year, index) => (
                    <MenuItem key={index} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl variant="outlined" fullWidth className="filter-control">
                <InputLabel>Auditor Líder</InputLabel>
                <Select
                  value={filters.auditorLider}
                  onChange={handleFilterChange}
                  label="Auditor Líder"
                  name="auditorLider"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...new Set(auditorias.map(audit => audit.AuditorLider))].map((auditorLider, index) => (
                    <MenuItem key={index} value={auditorLider}>
                      {auditorLider}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl variant="outlined" fullWidth className="filter-control">
                <InputLabel>Tipo de Auditoría</InputLabel>
                <Select
                  value={filters.tipoAuditoria}
                  onChange={handleFilterChange}
                  label="Tipo de Auditoría"
                  name="tipoAuditoria"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...new Set(auditorias.map(audit => audit.TipoAuditoria))].map((tipoAuditoria, index) => (
                    <MenuItem key={index} value={tipoAuditoria}>
                      {tipoAuditoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl variant="outlined" fullWidth className="filter-control">
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={filters.departamento}
                  onChange={handleFilterChange}
                  label="Departamento"
                  name="departamento"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...new Set(auditorias.map(audit => audit.Departamento))].map((departamento, index) => (
                    <MenuItem key={index} value={departamento}>
                      {departamento}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl variant="outlined" fullWidth className="filter-control">
                <InputLabel>Aceptibilidad</InputLabel>
                <Select
                  value={filters.aceptibilidad}
                  onChange={handleFilterChange}
                  label="Aceptibilidad"
                  name="aceptibilidad"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Critico">Crítico</MenuItem>
                  <MenuItem value="No aceptable">No aceptable</MenuItem>
                  <MenuItem value="Aceptable">Aceptable</MenuItem>
                  <MenuItem value="Bueno">Bueno</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Table className="audit-table">
          <TableHead>
            <TableRow>
              <TableCell>Tipo de Auditoría</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Área Auditada</TableCell>
              <TableCell>Auditado por</TableCell>
              <TableCell>Equipo Auditor</TableCell>
              <TableCell>Observador</TableCell>
              <TableCell>Porcentaje Obtenido</TableCell>
              <TableCell>Aceptabilidad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredAudits().map((audit, index) => (
              <TableRow key={index}>
                <TableCell>{audit.TipoAuditoria}</TableCell>
                <TableCell>{audit.Duracion}</TableCell>
                <TableCell>{audit.Departamento}</TableCell>
                <TableCell>{audit.AreasAudi}</TableCell>
                <TableCell>{audit.AuditorLider}</TableCell>
                <TableCell>
                  {Array.isArray(audit.EquipoAuditor) 
                    ? audit.EquipoAuditor.map(e => e.Nombre).join(', ') 
                    : 'N/A'}
                </TableCell>
                <TableCell>{audit.Observador ? audit.Observador.Nombre : 'N/A'}</TableCell>
                <TableCell>{audit.PorcentajeTotal}%</TableCell>
                <TableCell>{getAcceptability(audit.PorcentajeTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Tabla de Auditorías Pendientes */}
      <Box className="audit-details-container">
        <Typography variant="h4" className="section-title" gutterBottom>
          Auditorías Pendientes
        </Typography>

        {/* Filtros para auditorías pendientes */}
        <Box className="filters-container">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth className="filter-control">
                <InputLabel>Auditor Líder</InputLabel>
                <Select
                  value={filterAuditorLider}
                  onChange={(e) => setFilterAuditorLider(e.target.value)}
                  label="Auditor Líder"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...new Set(pendingAudits.map(audit => audit.AuditorLider))].map((auditorLider, index) => (
                    <MenuItem key={index} value={auditorLider}>
                      {auditorLider}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth className="filter-control">
                <InputLabel>Tipo de Auditoría</InputLabel>
                <Select
                  value={filterTipoAuditoria}
                  onChange={(e) => setFilterTipoAuditoria(e.target.value)}
                  label="Tipo de Auditoría"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...new Set(pendingAudits.map(audit => audit.TipoAuditoria))].map((tipoAuditoria, index) => (
                    <MenuItem key={index} value={tipoAuditoria}>
                      {tipoAuditoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth className="filter-control">
                <InputLabel>Fecha Inicio</InputLabel>
                <input
                  type="date"
                  value={filterFechaInicio}
                  onChange={(e) => setFilterFechaInicio(e.target.value)}
                  className="filter-date-input"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth className="filter-control">
                <InputLabel>Fecha Fin</InputLabel>
                <input
                  type="date"
                  value={filterFechaFin}
                  onChange={(e) => setFilterFechaFin(e.target.value)}
                  className="filter-date-input"
                />
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Table className="audit-table">
          <TableHead>
            <TableRow>
              <TableCell>Tipo de Auditoría</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Área Auditada</TableCell>
              <TableCell>Auditado por</TableCell>
              <TableCell>Equipo Auditor</TableCell>
              <TableCell>Observador</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applyFilters().map((audit, index) => (
              <TableRow key={index}>
                <TableCell>{audit.TipoAuditoria}</TableCell>
                <TableCell>{audit.Duracion}</TableCell>
                <TableCell>{audit.Departamento}</TableCell>
                <TableCell>{audit.AreasAudi}</TableCell>
                <TableCell>{audit.AuditorLider}</TableCell>
                <TableCell>
                  {Array.isArray(audit.EquipoAuditor) 
                    ? audit.EquipoAuditor.map(e => e.Nombre).join(', ') 
                    : 'N/A'}
                </TableCell>
                <TableCell>{audit.Observador ? audit.Observador.Nombre : 'N/A'}</TableCell>
                <TableCell>{new Date(audit.FechaInicio).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(audit.FechaFin).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Container>
  );
};

export default AuditCalendar;