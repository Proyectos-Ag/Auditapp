import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Divider } from '@mui/material';
import { Delete } from '@mui/icons-material';
import {
  Box, Button, Card,  Typography,
  Paper, LinearProgress, styled, 
} from '@mui/material';
import {
  UploadFile, CloudUpload, CheckCircle,
   ArrowBack
} from '@mui/icons-material';

// Estilos personalizados
const ElegantPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)',
  border: '1px solid rgba(255,255,255,0.3)'
}));

const HeaderTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px'
  }
}));

const DropZone = styled(Box)(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: '8px',
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main
  }
}));

const CargaMasiva = () => {
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no seleccionado',
        text: 'Por favor selecciona un archivo Excel',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    setIsLoading(true);
    setProgress(20);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setProgress(40);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setProgress(60);
        console.log('Datos extraídos del archivo Excel:', jsonData);

        // Validación de campos requeridos
        const requiredFields = [
          'TipoAuditoria', 'FechaInicio', 'FechaFin', 'Duracion', 'Departamento',
          'Auditados_Nombre', 'Auditados_Correo', 'AuditorLider', 'AuditorLiderEmail', 
          'EquipoAuditor_Nombre', 'EquipoAuditor_Correo', 'Observador', 'Alcance', 'Cliente'
        ];

        const mainData = jsonData[0];
        const missingFields = requiredFields.filter(field => !mainData[field]);

        if (missingFields.length > 0) {
          console.error('Faltan campos requeridos:', missingFields);
          setIsLoading(false);
          setProgress(0);
          await Swal.fire({
            icon: 'error',
            title: 'Campos requeridos faltantes',
            html: `<div>
              <p>Los siguientes campos son requeridos pero no se encontraron:</p>
              <ul style="text-align: left; margin-left: 20px;">
                ${missingFields.map(field => `<li>${field}</li>`).join('')}
              </ul>
            </div>`,
            confirmButtonColor: '#1976d2'
          });
          return;
        }

        // Función para convertir fechas de Excel a formato legible
        const convertExcelDateToJSDate = (serial) => {
          if (serial == null) {
            return null;
          }
          const utc_days = Math.floor(serial - 25569) + 1;
          const date_info = new Date(utc_days * 86400 * 1000);
          return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
        };

        // Obtener el año actual
        const currentYear = new Date().getFullYear();

        // Transformar datos del programa
        let currentAudit = {
          TipoAuditoria: mainData.TipoAuditoria,
          FechaInicio: convertExcelDateToJSDate(mainData.FechaInicio),
          FechaFin: convertExcelDateToJSDate(mainData.FechaFin),
          Duracion: mainData.Duracion,
          Cliente: mainData.Cliente,
          FechaEvaluacion: convertExcelDateToJSDate(mainData.FechaEvaluacion),
          Departamento: mainData.Departamento,
          Alcance: mainData.Alcance,
          Auditados: [],
          AuditorLider: mainData.AuditorLider,
          AuditorLiderEmail: mainData.AuditorLiderEmail,
          EquipoAuditor: [],
          Observador: mainData.Observador,
          NombresObservadores: mainData.NombresObservadores,
          Estado: mainData.Estado,
          PorcentajeTotal: mainData.PorcentajeTotal,
          FechaElaboracion: mainData.FechaElaboracion ? convertExcelDateToJSDate(mainData.FechaElaboracion) : new Date(currentYear, 0, 1),
          Comentario: mainData.Comentario,
          Estatus: mainData.Estatus,
          Objetivo: mainData.Objetivo,
          PuntuacionMaxima: mainData.PuntuacionMaxima,
          PuntuacionObten: '',
          PuntuacionConf: '',
          Programa: []
        };

        let programa = {
          Nombre: "", 
          Porcentaje: 0,
          Descripcion: []
        };

        const processedPrograms = new Set();

        jsonData.forEach(row => {
          if (row.Programa_Nombre && !processedPrograms.has(row.Programa_Nombre)) {
            if (programa.Nombre) {
              currentAudit.Programa.push(programa);
            }
            processedPrograms.add(row.Programa_Nombre);
            programa = {
              Nombre: row.Programa_Nombre,
              Porcentaje: row.Programa_Porcentaje || 0,
              Descripcion: []
            };
          }

          if (row.Programa_Nombre) {
            programa.Descripcion.push({
              ID: row.Programa_ID,
              Criterio: row.Programa_Criterio,
              Requisito: row.Programa_Descripcion_Requisito,
              Observacion: row.Programa_Observacion || row.Programa_problema || '',
              Hallazgo: row.Programa_Hallazgo || '',
            });
          }

          if (row.EquipoAuditor_Nombre && row.EquipoAuditor_Correo) {
            currentAudit.EquipoAuditor.push({
              Nombre: row.EquipoAuditor_Nombre,
              Correo: row.EquipoAuditor_Correo
            });
          }

          if (row.Auditados_Nombre) {
            currentAudit.Auditados.push({
              Nombre: row.Auditados_Nombre,
              Correo: row.Auditados_Correo
            });
          }
        });

        if (programa.Nombre) {
          currentAudit.Programa.push(programa);
        }

        const transformedData = [currentAudit];
        setProgress(80);

        try {
          const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/datos/carga-masiva`, transformedData, {
            headers: {
              'Content-Type': 'application/json',
            },
            params: {
              overwrite: false
            }
          });

          console.log('Response:', response.data);
          setProgress(100);
          
          await Swal.fire({
            icon: 'success',
            title: 'Carga exitosa',
            html: `
              <div>
                <p>Los datos han sido cargados correctamente</p>
                <p><strong>Tipo de Auditoría:</strong> ${currentAudit.TipoAuditoria}</p>
                <p><strong>Cliente:</strong> ${currentAudit.Cliente}</p>
                <p><strong>Programas cargados:</strong> ${currentAudit.Programa.length}</p>
              </div>
            `,
            confirmButtonColor: '#1976d2'
          });
          
          setFile(null);
          setIsLoading(false);
          setProgress(0);
          navigate('/ver-reali');
        } catch (error) {
          setIsLoading(false);
          setProgress(0);
          
          if (error.response && error.response.status === 409) {
            const result = await Swal.fire({
              icon: 'warning',
              title: 'Datos existentes',
              html: `
                <div>
                  <p>${error.response.data.message}</p>
                  <p>¿Deseas sobrescribir los datos existentes?</p>
                </div>
              `,
              showCancelButton: true,
              confirmButtonText: 'Sobrescribir',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#1976d2',
              cancelButtonColor: '#6c757d'
            });

            if (result.isConfirmed) {
              setIsLoading(true);
              setProgress(60);
              
              try {
                const overwriteResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/datos/carga-masiva`, transformedData, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  params: {
                    overwrite: true
                  }
                });

                console.log('Response:', overwriteResponse.data);
                setProgress(100);
                
                await Swal.fire({
                  icon: 'success',
                  title: 'Sobrescritura exitosa',
                  text: 'Los datos han sido actualizados correctamente',
                  confirmButtonColor: '#1976d2'
                });
                
                setFile(null);
                setIsLoading(false);
                setProgress(0);
                navigate('/ver-reali');
              } catch (overwriteError) {
                console.error('Error al sobrescribir:', overwriteError);
                setIsLoading(false);
                setProgress(0);
                
                await Swal.fire({
                  icon: 'error',
                  title: 'Error al sobrescribir',
                  text: 'Hubo un problema al actualizar los datos',
                  confirmButtonColor: '#1976d2'
                });
              }
            }
          } else {
            console.error('Error:', error);
            setIsLoading(false);
            setProgress(0);
            
            await Swal.fire({
              icon: 'error',
              title: 'Error en la carga',
              text: error.response?.data?.message || 'Hubo un problema al cargar los datos',
              confirmButtonColor: '#1976d2'
            });
          }
        }
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        setIsLoading(false);
        setProgress(0);
        
        await Swal.fire({
          icon: 'error',
          title: 'Error en el archivo',
          text: 'El archivo no pudo ser procesado. Verifica que sea un Excel válido.',
          confirmButtonColor: '#1976d2'
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Box sx={{ padding: '40px', marginTop: '3em'}}>
      <ElegantPaper elevation={3}>
        <HeaderTypography variant="h4" gutterBottom>
          <CloudUpload sx={{ verticalAlign: 'middle', mr: 1 }} />
          Carga Masiva de Datos
        </HeaderTypography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Importe datos de auditorías desde un archivo Excel
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        <Card sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Instrucciones para la carga
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            1. Prepare su archivo Excel con los campos requeridos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            2. Asegúrese de que las fechas estén en formato correcto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3. El archivo debe contener al menos una hoja con datos
          </Typography>
        </Card>

        <Box component="form" onSubmit={handleSubmit}>
          <Box 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{ mb: 3 }}
          >
            <DropZone isDragActive={isDragActive}>
              {file ? (
                <Box>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Archivo seleccionado
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {file.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setFile(null)}
                  >
                    Eliminar archivo
                  </Button>
                </Box>
              ) : (
                <Box>
                  <UploadFile color="action" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Arrastra y suelta tu archivo Excel aquí
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    O haz clic para seleccionar un archivo
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUpload />}
                  >
                    Seleccionar archivo
                    <input
                      type="file"
                      hidden
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Box>
              )}
            </DropZone>
          </Box>

          {isLoading && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="caption" display="block" textAlign="right">
                {progress}% completado
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<CloudUpload />}
              disabled={!file || isLoading}
            >
              {isLoading ? 'Procesando...' : 'Cargar Datos'}
            </Button>
          </Box>
        </Box>

        <Card sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Campos Requeridos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El archivo debe contener los siguientes campos: TipoAuditoria, FechaInicio, FechaFin, 
            Duracion, Departamento, Auditados_Nombre, Auditados_Correo, AuditorLider, 
            AuditorLiderEmail, EquipoAuditor_Nombre, EquipoAuditor_Correo, Observador, Alcance, Cliente
          </Typography>
        </Card>
      </ElegantPaper>
    </Box>
  );
};

export default CargaMasiva;