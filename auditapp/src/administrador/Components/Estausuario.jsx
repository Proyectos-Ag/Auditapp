import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Paper,
  Container,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  List,
  Tooltip as MuiTooltip,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CardHeader,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  BarChart,
  PieChart,
  ShowChart,
  TrendingUp,
  People,
  Assignment,
  Task,
  Download,
  Person,
  CheckCircle,
  Pending,
  Cancel,
  DateRange,
  BusinessCenter,
  CalendarToday,
  Refresh,
  Timeline,
  Analytics,
  Speed,
  Assessment,
  FilterList,
  ExpandMore,
  ExpandLess,
  Warning,
  Error
} from '@mui/icons-material';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { UserContext } from '../../App';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Componente para pestañas
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Componente para métricas avanzadas
const MetricCard = ({ title, value, subtitle, icon, color, progress }) => (
  <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: color, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
      {progress !== undefined && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            backgroundColor: 'grey.100',
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
            }
          }}
        />
      )}
    </CardContent>
  </Card>
);

// Componente para diagnóstico de datos
const DataDiagnostic = ({ userStats, detailedIshikawas, isOpen, onClose }) => {
  if (!userStats) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Warning sx={{ mr: 1, color: 'warning.main' }} />
          Diagnóstico de Datos
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Auditorías</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Como líder" secondary={userStats.auditorias.totalLider} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Como miembro" secondary={userStats.auditorias.totalMiembro} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Eficiencia" secondary={`${userStats.auditorias.eficiencia.toFixed(1)}%`} />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Ishikawas</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Totales" secondary={userStats.ishikawas.total} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Completados" secondary={userStats.ishikawas.aprobados + userStats.ishikawas.revisados + userStats.ishikawas.finalizados} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Eficiencia" secondary={`${userStats.ishikawas.eficiencia.toFixed(1)}%`} />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        
        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Problemas Detectados</Typography>
        <List>
          {userStats.ishikawas.total > 0 && userStats.ishikawas.eficiencia < 80 && (
            <ListItem>
              <ListItemIcon>
                <Error color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Baja eficiencia en Ishikawas" 
                secondary={`Solo el ${userStats.ishikawas.eficiencia.toFixed(1)}% están completados`} 
              />
            </ListItem>
          )}
          
          {userStats.auditorias.totalParticipadas < 5 && (
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Volumen bajo de trabajo" 
                secondary={`Solo ${userStats.auditorias.totalParticipadas} actividades registradas`} 
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

const EstadisticasPersonasMejoradas = () => {
  const { userData } = useContext(UserContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [usuarios, setUsuarios] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [ishikawas, setIshikawas] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [detailedIshikawas, setDetailedIshikawas] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [years, setYears] = useState([]);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [dataDebug, setDataDebug] = useState(null);

  const isAdmin = userData?.TipoUsuario === 'administrador';
  const currentUserId = userData?._id || userData?.ID;

  // Función mejorada para normalizar estados de ishikawas
  const normalizeIshikawaStates = (ishikawasData) => {
    return ishikawasData.map(ishikawa => {
      // Si no tiene estado, asignar uno por defecto basado en otros campos
      if (!ishikawa.estado || ishikawa.estado === '') {
        // Intentar inferir el estado basado en otros campos
        if (ishikawa.fechaAprobacion || ishikawa.aprobado) {
          return { ...ishikawa, estado: 'Aprobado' };
        } else if (ishikawa.fechaRevision || ishikawa.revisado) {
          return { ...ishikawa, estado: 'Revisado' };
        } else if (ishikawa.fechaFinalizacion || ishikawa.finalizado) {
          return { ...ishikawa, estado: 'Finalizado' };
        } else {
          return { ...ishikawa, estado: 'Pendiente' };
        }
      }
      
      // Normalizar estados existentes
      const estado = ishikawa.estado.toLowerCase().trim();
      if (estado.includes('aprob') || estado === 'approved') {
        return { ...ishikawa, estado: 'Aprobado' };
      } else if (estado.includes('revis') || estado === 'reviewed') {
        return { ...ishikawa, estado: 'Revisado' };
      } else if (estado.includes('final') || estado === 'completed' || estado === 'finished') {
        return { ...ishikawa, estado: 'Finalizado' };
      } else if (estado.includes('pend') || estado === 'pending') {
        return { ...ishikawa, estado: 'Pendiente' };
      } else if (estado.includes('rechaz') || estado === 'rejected') {
        return { ...ishikawa, estado: 'Rechazados' };
      } else if (estado.includes('observ') || estado === 'observation') {
        return { ...ishikawa, estado: 'Observacion' };
      }
      
      return ishikawa;
    });
  };

  // Función mejorada para extraer años
  const extractYearsFromData = (auditoriasData, ishikawasData) => {
    const allYears = new Set();
    const currentYear = new Date().getFullYear();
    
    // Agregar años recientes por defecto
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      allYears.add(year);
    }

    // Años de auditorías
    auditoriasData.forEach(audit => {
      try {
        const fecha = audit.FechaInicio || audit.FechaElaboracion || audit.fecha;
        if (fecha) {
          const year = new Date(fecha).getFullYear();
          if (!isNaN(year)) allYears.add(year);
        }
      } catch (error) {
        console.warn('Error procesando fecha de auditoría:', error);
      }
    });

    // Años de ishikawas
    ishikawasData.forEach(ishikawa => {
      try {
        const fecha = ishikawa.fechaCreacion || ishikawa.createdAt || ishikawa.fechaCompromiso || ishikawa.fecha;
        if (fecha) {
          const year = new Date(fecha).getFullYear();
          if (!isNaN(year)) allYears.add(year);
        }
      } catch (error) {
        console.warn('Error procesando fecha de ishikawa:', error);
      }
    });

    const sortedYears = Array.from(allYears).sort((a, b) => b - a);
    return sortedYears;
  };

  // Efecto para establecer el usuario seleccionado
  useEffect(() => {
    if (userData) {
      if (!isAdmin) {
        setSelectedUser(currentUserId);
      } else if (usuarios.length > 0 && !selectedUser) {
        setSelectedUser(usuarios[0]?._id || '');
      }
    }
  }, [userData, isAdmin, usuarios, currentUserId, selectedUser]);

  // Cargar datos principales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Obtener usuarios (solo si es admin)
        if (isAdmin) {
          try {
            const usuariosResponse = await api.get(`/usuarios`);
            setUsuarios(usuariosResponse.data);
          } catch (error) {
            console.error('Error cargando usuarios:', error);
          }
        }

        // Obtener auditorías
        try {
          const auditoriasResponse = await api.get(`/datos`);
          const filteredAudits = auditoriasResponse.data.filter(audit => 
            audit.Estado && ['Finalizado', 'Terminada', 'Realizada', 'Devuelto', 'Completado'].includes(audit.Estado)
          );
          setAuditorias(filteredAudits);
        } catch (error) {
          console.error('Error cargando auditorías:', error);
        }

        // Obtener ishikawas con normalización de estados
        try {
          const ishikawaResponse = await api.get(`/ishikawa`);
          const normalizedIshikawas = normalizeIshikawaStates(ishikawaResponse.data);
          setIshikawas(normalizedIshikawas);
        } catch (error) {
          console.error('Error cargando ishikawas:', error);
        }

      } catch (error) {
        console.error('Error general fetching data:', error);
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Extraer años disponibles
  useEffect(() => {
    if (auditorias.length > 0 || ishikawas.length > 0) {
      const extractedYears = extractYearsFromData(auditorias, ishikawas);
      setYears(extractedYears);
      
      // Establecer el año actual por defecto si está disponible
      const currentYear = new Date().getFullYear();
      if (extractedYears.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else if (extractedYears.length > 0) {
        setSelectedYear(extractedYears[0]);
      }
    }
  }, [auditorias, ishikawas]);

  // Función mejorada para diagnosticar problemas de datos
  const diagnoseDataIssues = (userStatsData) => {
    const issues = [];
    
    if (userStatsData.ishikawas.eficiencia < 50) {
      issues.push({
        type: 'error',
        message: `Baja eficiencia en Ishikawas: ${userStatsData.ishikawas.eficiencia.toFixed(1)}%`,
        description: 'Menos de la mitad de tus ishikawas están completados'
      });
    }
    
    if (userStatsData.auditorias.totalParticipadas + userStatsData.ishikawas.total < 5) {
      issues.push({
        type: 'warning',
        message: 'Volumen bajo de actividades',
        description: `Solo ${userStatsData.auditorias.totalParticipadas + userStatsData.ishikawas.total} actividades registradas`
      });
    }
    
    if (userStatsData.avanzadas.performanceMetrics.consistencia < 60) {
      issues.push({
        type: 'warning',
        message: 'Baja consistencia en resultados',
        description: 'Mucha variabilidad en tus porcentajes de auditoría'
      });
    }
    
    return issues;
  };

  // Calcular estadísticas detalladas
  useEffect(() => {
    if (!selectedUser || !userData) {
      setUserStats(null);
      return;
    }

    const calculateUserStats = async () => {
      try {
        setDataLoading(true);
        
        const targetUser = isAdmin 
          ? usuarios.find(u => u._id === selectedUser)
          : userData;

        if (!targetUser) {
          setUserStats(null);
          return;
        }

        const userEmail = targetUser.Correo;
        const userName = targetUser.Nombre;

        // Función mejorada para filtrar por año
        const filterByYear = (data, dateFields) => {
          if (selectedYear === 'all') return data;
          return data.filter(item => {
            try {
              for (let field of dateFields) {
                const fecha = item[field];
                if (fecha) {
                  const itemYear = new Date(fecha).getFullYear();
                  if (itemYear === selectedYear) return true;
                }
              }
              return false;
            } catch {
              return false;
            }
          });
        };

        // === AUDITORÍAS ===
        const auditoriasFiltradas = filterByYear(auditorias, ['FechaInicio', 'FechaElaboracion', 'fecha']);
        const auditoriasComoLider = auditoriasFiltradas.filter(audit => 
          audit.AuditorLiderEmail === userEmail || 
          audit.AuditorLider === userName ||
          (audit.AuditorLider && audit.AuditorLider.includes(userName))
        );

        const auditoriasComoMiembro = auditoriasFiltradas.filter(audit => 
          audit.EquipoAuditor?.some(miembro => 
            miembro.Correo === userEmail || 
            miembro.Nombre === userName ||
            (miembro.Nombre && miembro.Nombre.includes(userName))
          )
        );

        const auditoriasComoAuditado = auditoriasFiltradas.filter(audit => 
          audit.Auditados?.some(auditado => 
            auditado.Correo === userEmail || 
            auditado.Nombre === userName ||
            (auditado.Nombre && auditado.Nombre.includes(userName))
          )
        );

        // === ISHIKAWAS DETALLADOS ===
        const ishikawasFiltrados = filterByYear(ishikawas, ['fechaCreacion', 'createdAt', 'fechaCompromiso', 'fecha']);
        const userIshikawas = ishikawasFiltrados.filter(ishikawa => {
          if (!ishikawa.participantes) return false;
          
          try {
            const participantGroups = ishikawa.participantes.split("/");
            return participantGroups.some(group => {
              const individualParticipants = group.split(",");
              return individualParticipants.some(participant => {
                const trimmedParticipant = participant.trim().toLowerCase();
                const searchName = userName.toLowerCase();
                const searchEmail = userEmail ? userEmail.toLowerCase() : '';
                
                return trimmedParticipant.includes(searchName) ||
                       (searchEmail && trimmedParticipant.includes(searchEmail)) ||
                       trimmedParticipant.includes(searchName.split(' ')[0]) || // Solo primer nombre
                       trimmedParticipant.includes(searchName.split(' ')[1] || ''); // Solo apellido
              });
            });
          } catch (error) {
            console.warn('Error procesando participantes de ishikawa:', error);
            return false;
          }
        });

        setDetailedIshikawas(userIshikawas);

        // Debug information
        setDataDebug({
          auditoriasFiltradas: auditoriasFiltradas.length,
          auditoriasComoLider: auditoriasComoLider.length,
          auditoriasComoMiembro: auditoriasComoMiembro.length,
          ishikawasFiltrados: ishikawasFiltrados.length,
          userIshikawas: userIshikawas.length,
          selectedYear,
          userEmail,
          userName
        });

        // Ishikawas por tipo
        const ishikawasVacios = userIshikawas.filter(i => i.tipo === "vacio");
        const ishikawasNormales = userIshikawas.filter(i => !i.tipo || i.tipo !== "vacio");

        // Ishikawas por estado - CORREGIDO
        const ishikawasAprobados = userIshikawas.filter(i => i.estado === 'Aprobado');
        const ishikawasRevisados = userIshikawas.filter(i => i.estado === 'Revisado');
        const ishikawasPendientes = userIshikawas.filter(i => i.estado === 'Pendiente');
        const ishikawasRechazados = userIshikawas.filter(i => i.estado === 'Rechazados');
        const ishikawasFinalizados = userIshikawas.filter(i => i.estado === 'Finalizado');
        const ishikawasIncompletos = userIshikawas.filter(i => i.estado === 'Observacion');

        // Problemas más comunes en ishikawas
        const problemasCount = {};
        userIshikawas.forEach(ishikawa => {
          const problema = ishikawa.problema || "No especificado";
          problemasCount[problema] = (problemasCount[problema] || 0) + 1;
        });

        const topProblemas = Object.entries(problemasCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([problema, count]) => ({ problema, count }));

        // === CÁLCULOS DE EFICIENCIA MEJORADOS ===
        const totalAuditoriasParticipadas = auditoriasComoLider.length + auditoriasComoMiembro.length;
        const auditoriasCompletadas = [
          ...auditoriasComoLider.filter(a => a.Estado && ['Finalizado', 'Terminada', 'Completado'].includes(a.Estado)),
          ...auditoriasComoMiembro.filter(a => a.Estado && ['Finalizado', 'Terminada', 'Completado'].includes(a.Estado))
        ].length;

        const eficienciaAuditorias = totalAuditoriasParticipadas > 0 ? 
          (auditoriasCompletadas / totalAuditoriasParticipadas) * 100 : 0;

        // Eficiencia de ishikawas CORREGIDA
        const ishikawasCompletados = ishikawasAprobados.length + ishikawasRevisados.length + ishikawasFinalizados.length;
        const eficienciaIshikawas = userIshikawas.length > 0 ? 
          (ishikawasCompletados / userIshikawas.length) * 100 : 0;

        // Promedio de porcentaje en auditorías
        const porcentajesAuditorias = auditoriasComoLider
          .map(a => {
            if (!a.PorcentajeTotal) return 0;
            const porcentaje = parseFloat(a.PorcentajeTotal);
            return isNaN(porcentaje) ? 0 : porcentaje;
          })
          .filter(p => p > 0);
        
        const promedioPorcentaje = porcentajesAuditorias.length > 0 ? 
          porcentajesAuditorias.reduce((a, b) => a + b, 0) / porcentajesAuditorias.length : 0;

        // Tiempo de respuesta promedio en ishikawas
        const tiemposRespuesta = userIshikawas
          .filter(i => i.createdAt && i.updatedAt)
          .map(i => {
            try {
              const creado = new Date(i.createdAt);
              const actualizado = new Date(i.updatedAt);
              return (actualizado - creado) / (1000 * 60 * 60 * 24); // Días
            } catch {
              return 0;
            }
          })
          .filter(t => t > 0 && t < 365); // Filtrar valores extremos

        const tiempoRespuestaPromedio = tiemposRespuesta.length > 0 ? 
          tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length : 0;

        // === ESTADÍSTICAS POR TIEMPO ===
        const statsByTime = calculateTimeBasedStats(auditoriasComoLider, userIshikawas);

        // === ESTADÍSTICAS AVANZADAS ===
        const statsByYear = calculateYearlyStats(auditorias, ishikawas, userEmail, userName);
        const monthlyTrends = calculateMonthlyTrends(auditoriasComoLider, userIshikawas);
        const performanceMetrics = calculatePerformanceMetrics(
          auditoriasComoLider, 
          userIshikawas, 
          eficienciaAuditorias, 
          eficienciaIshikawas,
          promedioPorcentaje,
          tiempoRespuestaPromedio
        );

        // === PREPARAR DATOS PARA GRÁFICAS ===
        const chartData = prepareChartData(
          auditoriasComoLider,
          userIshikawas,
          eficienciaAuditorias,
          eficienciaIshikawas,
          promedioPorcentaje,
          auditoriasComoLider.length,
          auditoriasComoMiembro.length,
          auditoriasComoAuditado.length,
          ishikawasVacios.length,
          ishikawasNormales.length,
          ishikawasAprobados.length,
          ishikawasRevisados.length,
          ishikawasPendientes.length,
          ishikawasRechazados.length,
          ishikawasFinalizados.length,
          ishikawasIncompletos.length,
          topProblemas,
          monthlyTrends,
          statsByYear
        );

        // === SCORE GENERAL MEJORADO ===
        const scoreGeneral = calculateOverallScore(
          eficienciaAuditorias,
          eficienciaIshikawas,
          promedioPorcentaje,
          auditoriasComoLider.length,
          userIshikawas.length,
          tiempoRespuestaPromedio
        );

        const userStatsData = {
          userInfo: targetUser,
          auditorias: {
            comoLider: auditoriasComoLider,
            comoMiembro: auditoriasComoMiembro,
            comoAuditado: auditoriasComoAuditado,
            totalLider: auditoriasComoLider.length,
            totalMiembro: auditoriasComoMiembro.length,
            totalAuditado: auditoriasComoAuditado.length,
            totalParticipadas: totalAuditoriasParticipadas,
            completadas: auditoriasCompletadas,
            eficiencia: eficienciaAuditorias,
            promedioPorcentaje: promedioPorcentaje,
            porEstado: {
              finalizado: auditoriasComoLider.filter(a => a.Estado === 'Finalizado').length,
              terminada: auditoriasComoLider.filter(a => a.Estado === 'Terminada').length,
              realizada: auditoriasComoLider.filter(a => a.Estado === 'Realizada').length,
              devuelto: auditoriasComoLider.filter(a => a.Estado === 'Devuelto').length
            }
          },
          ishikawas: {
            total: userIshikawas.length,
            vacios: ishikawasVacios.length,
            normales: ishikawasNormales.length,
            aprobados: ishikawasAprobados.length,
            revisados: ishikawasRevisados.length,
            pendientes: ishikawasPendientes.length,
            rechazados: ishikawasRechazados.length,
            finalizados: ishikawasFinalizados.length,
            incompletos: ishikawasIncompletos.length,
            eficiencia: eficienciaIshikawas,
            tiempoRespuestaPromedio: tiempoRespuestaPromedio,
            topProblemas: topProblemas
          },
          tiempo: statsByTime,
          avanzadas: {
            statsByYear,
            monthlyTrends,
            performanceMetrics
          },
          scoreGeneral: scoreGeneral,
          chartData: chartData,
          dataIssues: diagnoseDataIssues({
            auditorias: { totalParticipadas: totalAuditoriasParticipadas },
            ishikawas: { eficiencia: eficienciaIshikawas, total: userIshikawas.length },
            avanzadas: { performanceMetrics }
          })
        };

        setUserStats(userStatsData);

      } catch (error) {
        console.error('Error calculando estadísticas:', error);
        setError('Error al calcular las estadísticas.');
      } finally {
        setDataLoading(false);
      }
    };

    // Solo calcular si tenemos datos básicos
    if (auditorias.length > 0 || ishikawas.length > 0) {
      calculateUserStats();
    }
  }, [selectedUser, usuarios, auditorias, ishikawas, isAdmin, userData, selectedYear]);

  const calculateTimeBasedStats = (auditoriasLider, userIshikawas) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const auditoriasEsteAnio = auditoriasLider.filter(audit => {
      try {
        const fecha = audit.FechaInicio || audit.FechaElaboracion || audit.fecha;
        if (!fecha) return false;
        const auditDate = new Date(fecha);
        return auditDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });

    const auditoriasEsteMes = auditoriasEsteAnio.filter(audit => {
      try {
        const fecha = audit.FechaInicio || audit.FechaElaboracion || audit.fecha;
        if (!fecha) return false;
        const auditDate = new Date(fecha);
        return auditDate.getMonth() === currentMonth;
      } catch {
        return false;
      }
    });

    const ishikawasEsteAnio = userIshikawas.filter(ishikawa => {
      try {
        const fecha = ishikawa.fechaCreacion || ishikawa.createdAt || ishikawa.fechaCompromiso || ishikawa.fecha;
        if (!fecha) return false;
        const ishikawaDate = new Date(fecha);
        return ishikawaDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });

    const ishikawasEsteMes = ishikawasEsteAnio.filter(ishikawa => {
      try {
        const fecha = ishikawa.fechaCreacion || ishikawa.createdAt || ishikawa.fechaCompromiso || ishikawa.fecha;
        if (!fecha) return false;
        const ishikawaDate = new Date(fecha);
        return ishikawaDate.getMonth() === currentMonth;
      } catch {
        return false;
      }
    });

    return {
      auditoriasEsteAnio: auditoriasEsteAnio.length,
      auditoriasEsteMes: auditoriasEsteMes.length,
      ishikawasEsteAnio: ishikawasEsteAnio.length,
      ishikawasEsteMes: ishikawasEsteMes.length
    };
  };

  const calculateYearlyStats = (allAuditorias, allIshikawas, userEmail, userName) => {
    const yearlyStats = {};
    
    years.forEach(year => {
      // Auditorías del año
      const auditoriasAnio = allAuditorias.filter(audit => {
        try {
          const fecha = audit.FechaInicio || audit.FechaElaboracion || audit.fecha;
          if (!fecha) return false;
          return new Date(fecha).getFullYear() === year;
        } catch {
          return false;
        }
      });

      const auditoriasLiderAnio = auditoriasAnio.filter(audit => 
        audit.AuditorLiderEmail === userEmail || 
        audit.AuditorLider === userName ||
        (audit.AuditorLider && audit.AuditorLider.includes(userName))
      );

      // Ishikawas del año
      const ishikawasAnio = allIshikawas.filter(ishikawa => {
        try {
          const fecha = ishikawa.fechaCreacion || ishikawa.createdAt || ishikawa.fechaCompromiso || ishikawa.fecha;
          if (!fecha) return false;
          return new Date(fecha).getFullYear() === year;
        } catch {
          return false;
        }
      });

      const userIshikawasAnio = ishikawasAnio.filter(ishikawa => {
        if (!ishikawa.participantes) return false;
        try {
          const participantGroups = ishikawa.participantes.split("/");
          return participantGroups.some(group => {
            const individualParticipants = group.split(",");
            return individualParticipants.some(participant => {
              const trimmedParticipant = participant.trim().toLowerCase();
              const searchName = userName.toLowerCase();
              const searchEmail = userEmail ? userEmail.toLowerCase() : '';
              return trimmedParticipant.includes(searchName) ||
                     (searchEmail && trimmedParticipant.includes(searchEmail)) ||
                     trimmedParticipant.includes(searchName.split(' ')[0]) ||
                     trimmedParticipant.includes(searchName.split(' ')[1] || '');
            });
          });
        } catch {
          return false;
        }
      });

      yearlyStats[year] = {
        auditorias: auditoriasLiderAnio.length,
        ishikawas: userIshikawasAnio.length,
        promedioAuditorias: auditoriasLiderAnio.length > 0 ? 
          auditoriasLiderAnio.reduce((sum, audit) => sum + (parseFloat(audit.PorcentajeTotal) || 0), 0) / auditoriasLiderAnio.length : 0,
        completados: userIshikawasAnio.filter(i => 
          ['Aprobado', 'Revisado', 'Finalizado'].includes(i.estado)
        ).length
      };
    });

    return yearlyStats;
  };

  const calculateMonthlyTrends = (auditoriasLider, userIshikawas) => {
    const monthlyData = {};
    
    // Inicializar todos los meses
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    months.forEach(month => {
      monthlyData[month] = { auditorias: 0, ishikawas: 0 };
    });

    // Contar auditorías por mes
    auditoriasLider.forEach(audit => {
      try {
        const fecha = audit.FechaInicio || audit.FechaElaboracion || audit.fecha;
        if (!fecha) return;
        const auditDate = new Date(fecha);
        const month = months[auditDate.getMonth()];
        monthlyData[month].auditorias++;
      } catch (error) {
        console.warn('Error procesando fecha de auditoría:', error);
      }
    });

    // Contar ishikawas por mes
    userIshikawas.forEach(ishikawa => {
      try {
        const fecha = ishikawa.fechaCreacion || ishikawa.createdAt || ishikawa.fechaCompromiso || ishikawa.fecha;
        if (!fecha) return;
        const ishikawaDate = new Date(fecha);
        const month = months[ishikawaDate.getMonth()];
        monthlyData[month].ishikawas++;
      } catch (error) {
        console.warn('Error procesando fecha de ishikawa:', error);
      }
    });

    return monthlyData;
  };

  const calculatePerformanceMetrics = (auditoriasLider, userIshikawas, eficienciaAud, eficienciaIsh, promedioCumplimiento, tiempoRespuesta) => {
    const metrics = {};
    
    // Velocidad de respuesta (inversa del tiempo de respuesta)
    metrics.velocidadRespuesta = tiempoRespuesta > 0 ? Math.max(0, 100 - (tiempoRespuesta * 2)) : 100; // Suavizado
    
    // Consistencia (variación en porcentajes de auditoría)
    const porcentajes = auditoriasLider
      .map(a => parseFloat(a.PorcentajeTotal) || 0)
      .filter(p => p > 0);
    
    if (porcentajes.length > 1) {
      const promedio = porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length;
      const varianza = porcentajes.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / porcentajes.length;
      metrics.consistencia = Math.max(0, 100 - (varianza * 1.2)); // Suavizado
    } else {
      metrics.consistencia = porcentajes.length === 1 ? 100 : 0;
    }
    
    // Productividad (combinación de volumen y eficiencia)
    const volumenTotal = auditoriasLider.length + userIshikawas.length;
    const baseProductividad = Math.min(80, volumenTotal * 3); // Ajustado
    const bonusEficiencia = (eficienciaAud + eficienciaIsh) / 8; // Ajustado
    metrics.productividad = Math.min(100, baseProductividad + bonusEficiencia);
    
    // Calidad general
    metrics.calidad = (eficienciaAud * 0.4) + (eficienciaIsh * 0.3) + (promedioCumplimiento * 0.3);
    
    return metrics;
  };

  const calculateOverallScore = (eficienciaAud, eficienciaIsh, promedioCumplimiento, totalAuditorias, totalIshikawas, tiempoRespuesta) => {
    let score = 0;
    let factors = 0;

    // Eficiencia en auditorías (30%)
    if (totalAuditorias > 0) {
      score += (eficienciaAud / 100) * 30;
      factors++;
    }

    // Eficiencia en ishikawas (30%)
    if (totalIshikawas > 0) {
      score += (eficienciaIsh / 100) * 30;
      factors++;
    }

    // Promedio de cumplimiento (25%)
    if (promedioCumplimiento > 0) {
      score += (promedioCumplimiento / 100) * 25;
      factors++;
    }

    // Tiempo de respuesta (15%) - mejor si es menor
    if (tiempoRespuesta > 0) {
      const tiempoScore = Math.max(0, 100 - (tiempoRespuesta * 1.5)); // Suavizado
      score += (tiempoScore / 100) * 15;
      factors++;
    }

    // Bonus por volumen de trabajo
    const volumenTotal = totalAuditorias + totalIshikawas;
    if (volumenTotal > 10) {
      score += Math.min(10, (volumenTotal - 10) * 0.5);
    }

    return factors > 0 ? Math.min(100, score) : 0;
  };

  const prepareChartData = (auditoriasLider, userIshikawas, eficienciaAuditorias, eficienciaIshikawas, promedioPorcentaje, liderCount, miembroCount, auditadoCount, vaciosCount, normalesCount, aprobadosCount, revisadosCount, pendientesCount, rechazadosCount, finalizadosCount, incompletosCount, topProblemas, monthlyTrends, statsByYear) => {
    // Timeline mejorada
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const timelineData = {
      labels: months,
      datasets: [
        {
          label: 'Auditorías',
          data: months.map(month => monthlyTrends[month]?.auditorias || 0),
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Ishikawas',
          data: months.map(month => monthlyTrends[month]?.ishikawas || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y1',
        }
      ],
    };

    // Gráfica de eficiencia
    const efficiencyData = {
      labels: ['Eficiencia Auditorías', 'Eficiencia Ishikawas', 'Promedio Cumplimiento'],
      datasets: [
        {
          label: 'Porcentaje (%)',
          data: [
            Math.round(eficienciaAuditorias) || 0,
            Math.round(eficienciaIshikawas) || 0,
            Math.round(promedioPorcentaje) || 0
          ],
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(76, 175, 80, 0.8)'
          ],
          borderColor: [
            'rgb(102, 126, 234)',
            'rgb(118, 75, 162)',
            'rgb(76, 175, 80)'
          ],
          borderWidth: 2,
        },
      ],
    };

    // Gráfica de roles
    const rolesData = {
      labels: ['Auditor Líder', 'Equipo Auditor', 'Auditado'],
      datasets: [
        {
          data: [liderCount || 0, miembroCount || 0, auditadoCount || 0],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)'
          ],
          borderWidth: 2,
        },
      ],
    };

    // Gráfica de tipos de ishikawas
    const ishikawaTypesData = {
      labels: ['Ishikawas Vacíos', 'Ishikawas Normales'],
      datasets: [
        {
          data: [vaciosCount || 0, normalesCount || 0],
          backgroundColor: [
            'rgba(156, 39, 176, 0.8)',
            'rgba(33, 150, 243, 0.8)'
          ],
          borderColor: [
            'rgb(156, 39, 176)',
            'rgb(33, 150, 243)'
          ],
          borderWidth: 2,
        },
      ],
    };

    // Gráfica de estados de ishikawas CORREGIDA
    const ishikawaStatusData = {
      labels: ['Aprobados', 'Revisados', 'Finalizados', 'Pendientes', 'Observación', 'Rechazados'],
      datasets: [
        {
          label: 'Cantidad',
          data: [
            aprobadosCount || 0, 
            revisadosCount || 0, 
            finalizadosCount || 0,
            pendientesCount || 0, 
            incompletosCount || 0,
            rechazadosCount || 0
          ],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',   // Aprobados - Verde
            'rgba(33, 150, 243, 0.8)',  // Revisados - Azul
            'rgba(139, 69, 19, 0.8)',   // Finalizados - Café
            'rgba(255, 193, 7, 0.8)',   // Pendientes - Amarillo
            'rgba(255, 152, 0, 0.8)',   // Observación - Naranja
            'rgba(244, 67, 54, 0.8)'    // Rechazados - Rojo
          ],
          borderColor: [
            'rgb(76, 175, 80)',
            'rgb(33, 150, 243)',
            'rgb(139, 69, 19)',
            'rgb(255, 193, 7)',
            'rgb(255, 152, 0)',
            'rgb(244, 67, 54)'
          ],
          borderWidth: 2,
        },
      ],
    };

    // Top problemas
    const problemasData = {
      labels: topProblemas.map(p => p.problema.length > 25 ? p.problema.substring(0, 25) + '...' : p.problema),
      datasets: [
        {
          label: 'Frecuencia',
          data: topProblemas.map(p => p.count),
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 2,
        },
      ],
    };

    // Evolución anual
    const yearlyEvolutionData = {
      labels: Object.keys(statsByYear),
      datasets: [
        {
          label: 'Auditorías',
          data: Object.values(statsByYear).map(stats => stats.auditorias),
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Ishikawas',
          data: Object.values(statsByYear).map(stats => stats.ishikawas),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ],
    };

    return {
      efficiency: efficiencyData,
      roles: rolesData,
      ishikawaTypes: ishikawaTypesData,
      ishikawaStatus: ishikawaStatusData,
      timeline: timelineData,
      problemas: problemasData,
      yearlyEvolution: yearlyEvolutionData,
      monthlyTrends
    };
  };

  const handlePrint = () => {
    if (!userStats) return;
    
    const printContent = document.getElementById('print-content-personas');
    html2canvas(printContent, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`estadisticas-detalladas-${userStats.userInfo.Nombre}.pdf`);
    });
  };

  const getEfficiencyColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderScoreStars = (score) => {
    const filledStars = Math.floor(score / 20);
    const emptyStars = 5 - filledStars;

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {[...Array(filledStars)].map((_, i) => (
          <Box key={`filled-${i}`} sx={{ color: '#FFD700', fontSize: '1.5rem' }}>★</Box>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <Box key={`empty-${i}`} sx={{ color: '#ccc', fontSize: '1.5rem' }}>☆</Box>
        ))}
      </Box>
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRunDiagnostic = () => {
    setDiagnosticOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando datos...
        </Typography>
      </Box>
    );
  }

  if (!userData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Principal */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center'
          }}
        >
          🚀 Dashboard de Desempeño Individual
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
          {isAdmin ? 'Análisis completo del desempeño de cada usuario' : 'Tu rendimiento y métricas detalladas'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Panel de Control */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {isAdmin && (
            <Grid item xs={12} md={2}>
              <FormControl fullWidth sx={{ 
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiOutlinedInput-root': { 
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                }
              }}>
                <InputLabel>Seleccionar Usuario</InputLabel>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="Seleccionar Usuario"
                  disabled={dataLoading}
                >
                  {usuarios.map(usuario => (
                    <MenuItem key={usuario._id} value={usuario._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1 }} />
                        {usuario.Nombre} - {usuario.Puesto}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth sx={{ 
              '& .MuiInputLabel-root': { color: 'white' },
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              }
            }}>
              <InputLabel>Rango de Tiempo</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Rango de Tiempo"
                disabled={dataLoading}
              >
                <MenuItem value="all">Todo el tiempo</MenuItem>
                <MenuItem value="year">Este año</MenuItem>
                <MenuItem value="month">Este mes</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth sx={{ 
              '& .MuiInputLabel-root': { color: 'white' },
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              }
            }}>
              <InputLabel>Filtrar por Año</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Filtrar por Año"
                disabled={dataLoading}
              >
                <MenuItem value="all">Todos los años</MenuItem>
                {years.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handlePrint}
              disabled={!userStats || dataLoading}
              fullWidth
              sx={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                py: 1.5,
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              {dataLoading ? <CircularProgress size={24} color="inherit" /> : 'Exportar Reporte'}
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              fullWidth
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                py: 1.5,
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Actualizar Datos
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<Warning />}
              onClick={handleRunDiagnostic}
              disabled={!userStats}
              fullWidth
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                py: 1.5,
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Diagnóstico
            </Button>
          </Grid>
        </Grid>

        {/* Información de Debug */}
        {dataDebug && (
          <Box sx={{ mt: 2, p: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
              Debug: Año {selectedYear} | Auditorías: {dataDebug.auditoriasComoLider} líder, {dataDebug.auditoriasComoMiembro} miembro | Ishikawas: {dataDebug.userIshikawas}
            </Typography>
          </Box>
        )}
      </Paper>

      {dataLoading && (
        <Box display="flex" justifyContent="center" sx={{ mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!selectedUser && isAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Selecciona un usuario para ver sus estadísticas detalladas
        </Alert>
      )}

      {userStats ? (
        <Box id="print-content-personas">
          {/* Header del Usuario con Score */}
          <Paper 
            sx={{ 
              p: 4, 
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mr: 3,
                        border: '3px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <Person sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {userStats.userInfo.Nombre}
                      </Typography>
                      <Typography variant="h6" gutterBottom sx={{ opacity: 0.9 }}>
                        {userStats.userInfo.Puesto}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Chip 
                          label={`Correo: ${userStats.userInfo.Correo}`} 
                          variant="outlined" 
                          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} 
                        />
                        <Chip 
                          label={`Área: ${userStats.userInfo.area || 'No especificado'}`} 
                          variant="outlined" 
                          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} 
                        />
                        {userStats.userInfo.Departamento && (
                          <Chip 
                            label={`Departamento: ${userStats.userInfo.Departamento}`} 
                            variant="outlined" 
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} 
                          />
                        )}
                        <Chip 
                          label={`Año: ${selectedYear === 'all' ? 'Todos' : selectedYear}`} 
                          variant="outlined" 
                          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} 
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 3,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" gutterBottom>
                      Score General
                    </Typography>
                    {renderScoreStars(userStats.scoreGeneral)}
                    <Chip 
                      label={`${userStats.scoreGeneral.toFixed(1)}%`}
                      color={getScoreColor(userStats.scoreGeneral)}
                      sx={{ 
                        fontSize: '1.5rem',
                        py: 2,
                        px: 3,
                        fontWeight: 'bold',
                        background: `linear-gradient(45deg, ${
                          userStats.scoreGeneral >= 80 ? '#4CAF50' : 
                          userStats.scoreGeneral >= 60 ? '#FF9800' : '#F44336'
                        } 30%, ${
                          userStats.scoreGeneral >= 80 ? '#45a049' : 
                          userStats.scoreGeneral >= 60 ? '#f57c00' : '#d32f2f'
                        } 90%)`
                      }}
                    />
                    <LinearProgress 
                      variant="determinate" 
                      value={userStats.scoreGeneral} 
                      sx={{ 
                        mt: 2, 
                        height: 8, 
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(45deg, ${
                            userStats.scoreGeneral >= 80 ? '#4CAF50' : 
                            userStats.scoreGeneral >= 60 ? '#FF9800' : '#F44336'
                          } 30%, ${
                            userStats.scoreGeneral >= 80 ? '#45a049' : 
                            userStats.scoreGeneral >= 60 ? '#f57c00' : '#d32f2f'
                          } 90%)`
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Alertas de Problemas de Datos */}
          {userStats.dataIssues && userStats.dataIssues.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {userStats.dataIssues.map((issue, index) => (
                <Alert 
                  key={index}
                  severity={issue.type}
                  sx={{ mb: 1 }}
                >
                  <strong>{issue.message}</strong> - {issue.description}
                </Alert>
              ))}
            </Box>
          )}

          {/* Pestañas de Navegación */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }
              }}
            >
              <Tab icon={<BarChart />} label="Resumen General" />
              <Tab icon={<Assignment />} label="Auditorías" />
              <Tab icon={<Task />} label="Ishikawas" />
              <Tab icon={<Timeline />} label="Línea de Tiempo" />
              <Tab icon={<Analytics />} label="Métricas Avanzadas" />
            </Tabs>
          </Paper>

          {/* Contenido de Pestañas */}
          <TabPanel value={tabValue} index={0}>
            {/* Resumen General */}
            <Grid container spacing={3}>
              {/* Tarjetas de Resumen */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 28px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Assignment sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {userStats.auditorias.totalParticipadas}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      Auditorías Totales
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Líder: ${userStats.auditorias.totalLider}`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', mb: 0.5 }}
                      />
                      <Chip 
                        label={`Miembro: ${userStats.auditorias.totalMiembro}`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', mb: 0.5 }}
                      />
                      <Chip 
                        label={`Auditado: ${userStats.auditorias.totalAuditado}`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 28px rgba(255, 107, 107, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Task sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {userStats.ishikawas.total}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      Ishikawas Totales
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Completados: ${userStats.ishikawas.aprobados + userStats.ishikawas.revisados + userStats.ishikawas.finalizados}`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', mb: 0.5 }}
                      />
                      <Chip 
                        label={`Eficiencia: ${userStats.ishikawas.eficiencia.toFixed(1)}%`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 28px rgba(78, 205, 196, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <TrendingUp sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {userStats.auditorias.eficiencia.toFixed(1)}%
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      Eficiencia General
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={userStats.auditorias.eficiencia} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            background: 'white'
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 28px rgba(253, 187, 45, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <CalendarToday sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {userStats.tiempo.auditoriasEsteAnio + userStats.tiempo.ishikawasEsteAnio}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      Este Año
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Auditorías: ${userStats.tiempo.auditoriasEsteAnio}`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', mb: 0.5 }}
                      />
                      <Chip 
                        label={`Ishikawas: ${userStats.tiempo.ishikawasEsteAnio}`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráficas de Resumen */}
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <BarChart sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Métricas de Eficiencia
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={userStats.chartData.efficiency}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PieChart sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Distribución de Roles
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Pie 
                      data={userStats.chartData.roles}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Auditorías Detalladas */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Auditorías como Líder ({userStats.auditorias.totalLider})
                    </Typography>
                    <Chip 
                      label={`Año: ${selectedYear === 'all' ? 'Todos' : selectedYear}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Tipo Auditoría</strong></TableCell>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell><strong>Estado</strong></TableCell>
                          <TableCell><strong>Porcentaje</strong></TableCell>
                          <TableCell><strong>Cliente</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userStats.auditorias.comoLider.map((audit, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BusinessCenter sx={{ mr: 1, color: 'primary.main' }} />
                                {audit.TipoAuditoria}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={<DateRange />}
                                label={new Date(audit.FechaInicio || audit.FechaElaboracion).toLocaleDateString()}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={audit.Estado} 
                                size="small"
                                color={
                                  audit.Estado === 'Finalizado' ? 'success' :
                                  audit.Estado === 'Terminada' ? 'primary' :
                                  audit.Estado === 'Realizada' ? 'warning' :
                                  'error'
                                }
                                icon={
                                  audit.Estado === 'Finalizado' ? <CheckCircle /> :
                                  audit.Estado === 'Terminada' ? <CheckCircle /> :
                                  audit.Estado === 'Realizada' ? <Pending /> :
                                  <Cancel />
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={parseFloat(audit.PorcentajeTotal) || 0} 
                                  sx={{ 
                                    flexGrow: 1, 
                                    mr: 1,
                                    height: 8,
                                    borderRadius: 4
                                  }}
                                />
                                <Typography variant="body2">
                                  {audit.PorcentajeTotal || '0'}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{audit.Cliente || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Estados de Auditorías
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Finalizadas" 
                        secondary={userStats.auditorias.porEstado.finalizado} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Terminadas" 
                        secondary={userStats.auditorias.porEstado.terminada} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Pending color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Realizadas" 
                        secondary={userStats.auditorias.porEstado.realizada} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Cancel color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Devueltas" 
                        secondary={userStats.auditorias.porEstado.devuelto} 
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Ishikawas Detallados */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Estados de Ishikawas
                    </Typography>
                    <Chip 
                      label={`Eficiencia: ${userStats.ishikawas.eficiencia.toFixed(1)}%`}
                      color={getEfficiencyColor(userStats.ishikawas.eficiencia)}
                    />
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={userStats.chartData.ishikawaStatus}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Tipos de Ishikawas
                    </Typography>
                    <Chip 
                      label={`Año: ${selectedYear === 'all' ? 'Todos' : selectedYear}`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Doughnut 
                      data={userStats.chartData.ishikawaTypes}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Top 5 Problemas Más Frecuentes
                    </Typography>
                    <Chip 
                      label={`Año: ${selectedYear === 'all' ? 'Todos' : selectedYear}`}
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={userStats.chartData.problemas}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Ishikawas del {selectedYear === 'all' ? 'Todos los años' : selectedYear}
                    </Typography>
                    <Chip 
                      label={`Mostrando: ${detailedIshikawas.length}`}
                      color="primary"
                    />
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Problema</strong></TableCell>
                          <TableCell><strong>Estado</strong></TableCell>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell><strong>Responsable</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
  {detailedIshikawas.map((ishikawa, index) => (
    <TableRow key={index} hover>
      <TableCell>
        <MuiTooltip title={ishikawa.problema}>                
          <Typography variant="body2">
            {ishikawa.problema?.length > 50 ? 
              ishikawa.problema.substring(0, 50) + '...' : 
              ishikawa.problema || 'No especificado'}
          </Typography>
        </MuiTooltip>
      </TableCell>
      <TableCell>
        <Chip 
          label={ishikawa.estado || 'No definido'} 
          size="small"
          color={
            ishikawa.estado === 'Aprobado' ? 'success' :
            ishikawa.estado === 'Revisado' ? 'primary' :
            ishikawa.estado === 'Finalizado' ? 'secondary' :
            ishikawa.estado === 'Pendiente' ? 'warning' :
            ishikawa.estado === 'Observacion' ? 'warning' :
            ishikawa.estado === 'Rechazados' ? 'error' :
            'default'
          }
        />
      </TableCell>
      <TableCell>
        {ishikawa.fecha ? new Date(ishikawa.fecha).toLocaleDateString() : 
         ishikawa.createdAt ? new Date(ishikawa.createdAt).toLocaleDateString() : 
         ishikawa.fechaCreacion ? new Date(ishikawa.fechaCreacion).toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell>
        {ishikawa.auditado || ishikawa.creadoPor || 'N/A'}
      </TableCell>
    </TableRow>
  ))}
</TableBody>
                    </Table>
                  </TableContainer>
                  {detailedIshikawas.length > 10 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Mostrando {detailedIshikawas.length} ishikawas
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* Línea de Tiempo Mejorada */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Evolución Mensual - {selectedYear === 'all' ? 'Todos los años' : selectedYear}
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Line 
                      data={userStats.chartData.timeline}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            mode: 'index',
                            intersect: false
                          }
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Auditorías'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Ishikawas'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Evolución Anual Comparativa
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Line 
                      data={userStats.chartData.yearlyEvolution}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Cantidad'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Resumen por Año
                    </Typography>
                    <Chip 
                      label="Comparativa histórica"
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                  <Grid container spacing={2}>
                    {Object.entries(userStats.avanzadas.statsByYear).map(([year, stats]) => (
                      <Grid item xs={12} sm={6} md={3} key={year}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                              {year}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Auditorías:</Typography>
                              <Typography variant="body2" fontWeight="bold">{stats.auditorias}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Ishikawas:</Typography>
                              <Typography variant="body2" fontWeight="bold">{stats.ishikawas}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Completados:</Typography>
                              <Typography variant="body2" fontWeight="bold">{stats.completados}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Promedio:</Typography>
                              <Typography variant="body2" fontWeight="bold">{stats.promedioAuditorias.toFixed(1)}%</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {/* Métricas Avanzadas Mejoradas */}
            <Grid container spacing={3}>
              {/* Tarjetas de Métricas Principales */}
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Velocidad de Respuesta"
                  value={`${userStats.avanzadas.performanceMetrics.velocidadRespuesta.toFixed(1)}%`}
                  subtitle="Eficiencia en tiempos"
                  icon={<Speed sx={{ fontSize: 40 }} />}
                  color="#FF6B6B"
                  progress={userStats.avanzadas.performanceMetrics.velocidadRespuesta}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Consistencia"
                  value={`${userStats.avanzadas.performanceMetrics.consistencia.toFixed(1)}%`}
                  subtitle="Estabilidad en resultados"
                  icon={<TrendingUp sx={{ fontSize: 40 }} />}
                  color="#4ECDC4"
                  progress={userStats.avanzadas.performanceMetrics.consistencia}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Productividad"
                  value={`${userStats.avanzadas.performanceMetrics.productividad.toFixed(1)}%`}
                  subtitle="Volumen y eficiencia"
                  icon={<Assessment sx={{ fontSize: 40 }} />}
                  color="#45B7D1"
                  progress={userStats.avanzadas.performanceMetrics.productividad}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Calidad General"
                  value={`${userStats.avanzadas.performanceMetrics.calidad.toFixed(1)}%`}
                  subtitle="Excelencia en trabajo"
                  icon={<BarChart sx={{ fontSize: 40 }} />}
                  color="#96CEB4"
                  progress={userStats.avanzadas.performanceMetrics.calidad}
                />
              </Grid>

              {/* Gráficas de Métricas Avanzadas */}
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Comparativa de Métricas de Rendimiento
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Bar 
                      data={{
                        labels: ['Velocidad', 'Consistencia', 'Productividad', 'Calidad'],
                        datasets: [
                          {
                            label: 'Puntuación (%)',
                            data: [
                              userStats.avanzadas.performanceMetrics.velocidadRespuesta,
                              userStats.avanzadas.performanceMetrics.consistencia,
                              userStats.avanzadas.performanceMetrics.productividad,
                              userStats.avanzadas.performanceMetrics.calidad
                            ],
                            backgroundColor: [
                              'rgba(255, 107, 107, 0.8)',
                              'rgba(78, 205, 196, 0.8)',
                              'rgba(69, 183, 209, 0.8)',
                              'rgba(150, 206, 180, 0.8)'
                            ],
                            borderColor: [
                              'rgb(255, 107, 107)',
                              'rgb(78, 205, 196)',
                              'rgb(69, 183, 209)',
                              'rgb(150, 206, 180)'
                            ],
                            borderWidth: 2,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Distribución de Esfuerzo
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Doughnut 
                      data={{
                        labels: ['Auditorías', 'Ishikawas'],
                        datasets: [
                          {
                            data: [userStats.auditorias.totalParticipadas, userStats.ishikawas.total],
                            backgroundColor: [
                              'rgba(102, 126, 234, 0.8)',
                              'rgba(255, 99, 132, 0.8)'
                            ],
                            borderColor: [
                              'rgb(102, 126, 234)',
                              'rgb(255, 99, 132)'
                            ],
                            borderWidth: 2,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Secciones Expandibles */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('analisisDetallado')}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Análisis Detallado por Año
                    </Typography>
                    <IconButton>
                      {expandedSections.analisisDetallado ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  {expandedSections.analisisDetallado && (
                    <Box sx={{ mt: 3 }}>
                      <Grid container spacing={3}>
                        {Object.entries(userStats.avanzadas.statsByYear).map(([year, stats]) => (
                          <Grid item xs={12} md={6} lg={3} key={year}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                              <CardHeader
                                title={`Año ${year}`}
                                subheader={`${stats.auditorias + stats.ishikawas} actividades totales`}
                                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                              />
                              <CardContent>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Auditorías como Líder
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={(stats.auditorias / Math.max(1, stats.auditorias + stats.ishikawas)) * 100} 
                                    sx={{ height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="body2" align="right">
                                    {stats.auditorias}
                                  </Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Ishikawas Participados
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={(stats.ishikawas / Math.max(1, stats.auditorias + stats.ishikawas)) * 100} 
                                    sx={{ height: 8, borderRadius: 4 }}
                                    color="secondary"
                                  />
                                  <Typography variant="body2" align="right">
                                    {stats.ishikawas}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Tasa de Completación
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={stats.ishikawas > 0 ? (stats.completados / stats.ishikawas) * 100 : 0} 
                                    sx={{ height: 8, borderRadius: 4 }}
                                    color="success"
                                  />
                                  <Typography variant="body2" align="right">
                                    {stats.completados}/{stats.ishikawas} ({stats.ishikawas > 0 ? ((stats.completados / stats.ishikawas) * 100).toFixed(1) : 0}%)
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('tendenciasMensuales')}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Tendencias Mensuales Detalladas
                    </Typography>
                    <IconButton>
                      {expandedSections.tendenciasMensuales ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  {expandedSections.tendenciasMensuales && (
                    <Box sx={{ mt: 3 }}>
                      <Grid container spacing={2}>
                        {Object.entries(userStats.chartData.monthlyTrends).map(([month, data]) => (
                          <Grid item xs={6} sm={4} md={2} key={month}>
                            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {month}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <Box>
                                  <Assignment sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2">{data.auditorias}</Typography>
                                </Box>
                                <Box>
                                  <Task sx={{ fontSize: 16, color: 'secondary.main' }} />
                                  <Typography variant="body2">{data.ishikawas}</Typography>
                                </Box>
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      ) : (
        !dataLoading && (
          <Alert severity="info">
            {isAdmin ? 'Selecciona un usuario para ver sus estadísticas detalladas' : 'No se pudieron cargar tus estadísticas'}
          </Alert>
        )
      )}

      {/* Diálogo de Diagnóstico */}
      <DataDiagnostic 
        userStats={userStats}
        detailedIshikawas={detailedIshikawas}
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
      />
    </Container>
  );
};

export default EstadisticasPersonasMejoradas;