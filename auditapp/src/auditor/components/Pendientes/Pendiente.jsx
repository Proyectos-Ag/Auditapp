import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Backdrop,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
  useMediaQuery
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { UserContext } from '../../../App';
import api from '../../../services/api';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { theme } from './pendientesTheme';
import PhotoModal from './PhotoModal';
import ImagePreviewModal from './ImagePreviewModal';
import PendientesMobileView from './PendientesMobileView';
import PendientesDesktopView from './PendientesDesktopView';

// mismos valores
const checkboxValues = {
  Conforme: 1,
  m: 0.7,
  M: 0.3,
  C: 0,
  NA: null
};

const Pendientes = () => {
  const { userData } = useContext(UserContext);
  const [datos, setDatos] = useState([]);
  const [expandedPeriods, setExpandedPeriods] = useState([]);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [percentages, setPercentages] = useState({});
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedImageDocId, setSelectedImageDocId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [mobileNavValue, setMobileNavValue] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // se conserva aunque no se use

  const isMobile = useMediaQuery('(max-width:768px)');
  const navigate = useNavigate();

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const obtenerNumeroMes = (nombreMes) => {
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];
    return meses.indexOf(nombreMes.toLowerCase());
  };

  useEffect(() => {
    const obtenerFechaInicio = (duracion) => {
      const partes = duracion.split(' ');
      let diaInicio = 1;
      let mesInicio = 0;
      let anoInicio = new Date().getFullYear();

      for (const parte of partes) {
        const numero = parseInt(parte);
        if (!isNaN(numero)) {
          diaInicio = numero;
        } else if (
          parte.length === 4 &&
          !isNaN(parseInt(parte))
        ) {
          anoInicio = parseInt(parte);
        } else {
          const mesNum = obtenerNumeroMes(parte);
          if (mesNum !== -1) mesInicio = mesNum;
        }
      }
      return new Date(anoInicio, mesInicio, diaInicio);
    };

    const obtenerDatos = async () => {
      try {
        const response = await api.get('/datos');
        if (userData && userData.Correo) {
          const datosFiltrados = response.data.filter(
            (dato) =>
              (dato.AuditorLiderEmail === userData.Correo ||
                (dato.EquipoAuditor.length > 0 &&
                  dato.EquipoAuditor.some(
                    (auditor) =>
                      auditor.Correo === userData.Correo
                  ))) &&
              (dato.Estado === 'pendiente' ||
                dato.Estado === 'Devuelto')
          );

          datosFiltrados.sort((a, b) => {
            const fechaInicioA = obtenerFechaInicio(
              a.Duracion
            );
            const fechaInicioB = obtenerFechaInicio(
              b.Duracion
            );
            return fechaInicioA - fechaInicioB;
          });

          setDatos(datosFiltrados);

          const initialCheckboxes = {};
          const initialPercentages = {};

          datosFiltrados.forEach((dato, periodIdx) => {
            dato.Programa.forEach(
              (programa, programIdx) => {
                const programKey = `${periodIdx}_${programIdx}`;
                let totalValue = 0;
                let validPrograms = 0;

                programa.Descripcion.forEach(
                  (desc, descIdx) => {
                    const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
                    initialCheckboxes[fieldKey] =
                      desc.Criterio;
                    const value =
                      checkboxValues[desc.Criterio];
                    if (value !== null) {
                      totalValue += value;
                      validPrograms++;
                    }
                  }
                );

                const percentage =
                  validPrograms > 0
                    ? (totalValue / validPrograms) *
                      100
                    : 0;
                initialPercentages[programKey] =
                  percentage;
              }
            );
          });

          setSelectedCheckboxes(initialCheckboxes);
          setPercentages(initialPercentages);
        }
      } catch (error) {
        console.error(
          'Error al obtener los datos:',
          error
        );
        showSnackbar(
          'Error al cargar las auditorías',
          'error'
        );
      }
    };

    obtenerDatos();
  }, [userData]);

  const handlePeriodToggle = (periodId) => {
    setExpandedPeriods((prev) =>
      prev.includes(periodId)
        ? prev.filter((id) => id !== periodId)
        : [...prev, periodId]
    );
  };

  const handleCheckboxChange = (
    periodIdx,
    programIdx,
    descIdx,
    checkboxName
  ) => {
    const key = `${periodIdx}_${programIdx}_${descIdx}`;
    setSelectedCheckboxes((prevState) => {
      const updated = {
        ...prevState,
        [key]: checkboxName
      };
      const programKey = `${periodIdx}_${programIdx}`;
      const relevantCheckboxes = Object.keys(
        updated
      ).filter((k) =>
        k.startsWith(`${periodIdx}_${programIdx}_`)
      );

      let totalValue = 0;
      let validPrograms = 0;

      relevantCheckboxes.forEach((k) => {
        const value = checkboxValues[updated[k]];
        if (value !== null) {
          totalValue += value;
          validPrograms++;
        }
      });

      const percentage =
        validPrograms > 0
          ? (totalValue / validPrograms) * 100
          : 0;

      setPercentages((prevPercentages) => ({
        ...prevPercentages,
        [programKey]: percentage
      }));

      return updated;
    });
  };

  const handleOpenPhotoModal = (fieldKey) => {
    setSelectedField(fieldKey);
    setPhotoModalOpen(true);
  };

  const handleCapture = (file) => {
    if (selectedField) {
      const rowIdentifier = selectedField;
      setCapturedPhotos((prev) => {
        const updatedPhotos = { ...prev };
        if (updatedPhotos[rowIdentifier]) {
          if (
            updatedPhotos[rowIdentifier].length < 4
          ) {
            updatedPhotos[rowIdentifier] = [
              ...updatedPhotos[rowIdentifier],
              file
            ];
          } else {
            showSnackbar(
              'Máximo 4 fotos permitidas por requisito',
              'warning'
            );
            return prev;
          }
        } else {
          updatedPhotos[rowIdentifier] = [file];
        }
        return updatedPhotos;
      });
    }
    setPhotoModalOpen(false);
  };

  const handleImagePreview = (
    imageSrc,
    index,
    docId
  ) => {
    setSelectedImage(imageSrc);
    setSelectedImageIndex(index);
    setSelectedImageDocId(docId);
    setImagePreviewOpen(true);
  };

  const handleDeleteImage = async (
    docId,
    imageIndex,
    imageUrl
  ) => {
    // mantiene la lógica original basada en selectedField
    if (imageUrl.startsWith('blob:')) {
      setCapturedPhotos((prevState) => ({
        ...prevState,
        [selectedField]:
          prevState[selectedField]?.filter(
            (_, idx) => idx !== imageIndex
          ) || []
      }));
      return;
    }

    try {
      await fetch(`/datos/eliminarImagen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ docId, imageUrl })
      });

      const fileName = imageUrl
        .split('/')
        .pop()
        .split('?')[0];
      const decodedFileName =
        decodeURIComponent(fileName);
      const imageRef = ref(storage, decodedFileName);
      await deleteObject(imageRef);

      setCapturedPhotos((prev) => {
        const updatedPhotos = { ...prev };
        delete updatedPhotos[selectedField];
        return updatedPhotos;
      });

      showSnackbar(
        'Imagen eliminada correctamente',
        'success'
      );
      setImagePreviewOpen(false);
    } catch (error) {
      console.error(
        'Error al eliminar la imagen:',
        error
      );
      showSnackbar(
        'Error al eliminar la imagen',
        'error'
      );
    }
  };

  const uploadImageToFirebase = async (
    file,
    fileName
  ) => {
    try {
      if (!(file instanceof File)) {
        throw new Error(
          'El objeto recibido no es un archivo válido'
        );
      }
      const storageRef = ref(
        storage,
        `files/${fileName}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error(
        'Error al subir la imagen:',
        error
      );
      throw new Error(
        'No se pudo subir la imagen'
      );
    }
  };

  const areAllCheckboxesFilled = (periodIdx) => {
    const numPrograms =
      datos[periodIdx].Programa.length;
    for (
      let programIdx = 0;
      programIdx < numPrograms;
      programIdx++
    ) {
      const programa =
        datos[periodIdx].Programa[programIdx];
      for (
        let descIdx = 0;
        descIdx < programa.Descripcion.length;
        descIdx++
      ) {
        const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
        if (!selectedCheckboxes[fieldKey]) {
          return false;
        }
      }
    }
    return true;
  };

  const buildObservacionesPayload = async (
    periodIdx,
    id,
    programIdx,
    programa
  ) => {
    return Promise.all(
      programa.Descripcion.map(
        async (desc, descIdx) => {
          const fieldKey = `${periodIdx}_${programIdx}_${descIdx}`;
          const updatedObservation = {
            ...desc
          };
          const files =
            capturedPhotos[fieldKey] || [];

          if (files.length > 0) {
            const fileUrls = await Promise.all(
              files.map(
                async (file, index) => {
                  const fileName = `evidencia_${id}_${periodIdx}_${programIdx}_${descIdx}_${index}`;
                  return await uploadImageToFirebase(
                    file,
                    fileName
                  );
                }
              )
            );
            updatedObservation.Hallazgo =
              fileUrls;
          } else {
            updatedObservation.Hallazgo =
              Array.isArray(desc.Hallazgo)
                ? desc.Hallazgo
                : [];
          }

          return {
            ID: desc.ID,
            Criterio:
              selectedCheckboxes[fieldKey] ||
              '',
            Observacion:
              document.querySelector(
                `textarea[name=Observaciones_${periodIdx}_${programIdx}_${descIdx}]`
              )?.value ||
              desc.Observacion,
            Problema:
              document.querySelector(
                `textarea[name=Problemas_${periodIdx}_${programIdx}_${descIdx}]`
              )?.value ||
              desc.Problema,
            Hallazgo:
              updatedObservation.Hallazgo
          };
        }
      )
    );
  };

  const handleUpdatePeriod = async (
    periodIdx,
    id
  ) => {
    if (!areAllCheckboxesFilled(periodIdx)) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Todos los checkboxes deben estar llenos antes de generar el reporte.'
      });
      return;
    }

    setLoading(true);
    try {
      let totalPorcentage = 0;
      const numPrograms =
        datos[periodIdx].Programa.length;

      for (
        let programIdx = 0;
        programIdx < numPrograms;
        programIdx++
      ) {
        const programa =
          datos[periodIdx].Programa[programIdx];

        const observaciones =
          await buildObservacionesPayload(
            periodIdx,
            id,
            programIdx,
            programa
          );

        const percentage =
          percentages[
            `${periodIdx}_${programIdx}`
          ] || 0;
        totalPorcentage += percentage;

        await api.put(
          `/datos/${datos[periodIdx]._id}`,
          {
            programIdx,
            observaciones,
            percentage
          }
        );
      }

      const totalPorcentageAvg =
        (
          totalPorcentage / numPrograms
        ).toFixed(2);

      await api.put(
        `/datos/${datos[periodIdx]._id}`,
        {
          PorcentajeTotal: totalPorcentageAvg,
          Estado: 'Realizado',
          usuario: userData.Nombre
        }
      );

      showSnackbar(
        'Reporte generado exitosamente',
        'success'
      );
      navigate('/reporte');
    } catch (error) {
      console.error(
        'Error en handleUpdatePeriod:',
        error
      );
      showSnackbar(
        'Error al generar el reporte',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCamb = async (
    periodIdx,
    id
  ) => {
    setLoading(true);
    try {
      let totalPorcentage = 0;
      const numPrograms =
        datos[periodIdx].Programa.length;

      for (
        let programIdx = 0;
        programIdx < numPrograms;
        programIdx++
      ) {
        const programa =
          datos[periodIdx].Programa[programIdx];

        const observaciones =
          await buildObservacionesPayload(
            periodIdx,
            id,
            programIdx,
            programa
          );

        const percentage =
          percentages[
            `${periodIdx}_${programIdx}`
          ] || 0;
        totalPorcentage += percentage;

        await api.put(
          `/datos/${datos[periodIdx]._id}`,
          {
            programIdx,
            observaciones,
            percentage
          }
        );
      }

      const totalPorcentageAvg =
        (
          totalPorcentage / numPrograms
        ).toFixed(2);
      await api.put(
        `/datos/${datos[periodIdx]._id}`,
        {
          PorcentajeTotal: totalPorcentageAvg,
          Estado: 'pendiente'
        }
      );

      showSnackbar(
        'Cambios guardados exitosamente',
        'success'
      );
    } catch (error) {
      console.error(
        'Error en handleGuardarCamb:',
        error
      );
      showSnackbar(
        'Error al guardar los cambios',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTempPhoto = (fieldKey, index) => {
    setCapturedPhotos((prev) => ({
      ...prev,
      [fieldKey]:
        prev[fieldKey]?.filter(
          (_, idx) => idx !== index
        ) || []
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      {isMobile ? (
        <PendientesMobileView
          datos={datos}
          expandedPeriods={expandedPeriods}
          onTogglePeriod={handlePeriodToggle}
          onGuardarCamb={handleGuardarCamb}
          onUpdatePeriod={handleUpdatePeriod}
          percentages={percentages}
          selectedCheckboxes={selectedCheckboxes}
          capturedPhotos={capturedPhotos}
          onOpenPhotoModal={handleOpenPhotoModal}
          onPreviewImage={handleImagePreview}
          onDeleteTempPhoto={handleDeleteTempPhoto}
          onDeletePersistedPhoto={handleDeleteImage}
          mobileNavValue={mobileNavValue}
          onChangeNav={setMobileNavValue}
          onOpenMenu={() =>
            setMobileDrawerOpen(true)
          }
        />
      ) : (
        <PendientesDesktopView
          datos={datos}
          expandedPeriods={expandedPeriods}
          onTogglePeriod={handlePeriodToggle}
          onGuardarCamb={handleGuardarCamb}
          onUpdatePeriod={handleUpdatePeriod}
          percentages={percentages}
          selectedCheckboxes={selectedCheckboxes}
          onCheckboxChange={handleCheckboxChange}
          capturedPhotos={capturedPhotos}
          onOpenPhotoModal={handleOpenPhotoModal}
          onPreviewImage={handleImagePreview}
          onDeleteImage={handleDeleteImage}
        />
      )}

      {/* Modal fotos */}
      <PhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onCapture={handleCapture}
        isMobile={isMobile}
      />

      {/* Modal preview */}
      <ImagePreviewModal
        open={imagePreviewOpen}
        image={selectedImage}
        onClose={() => setImagePreviewOpen(false)}
        onDelete={() =>
          handleDeleteImage(
            selectedImageDocId,
            selectedImageIndex,
            selectedImage
          )
        }
        isMobile={isMobile}
      />

      {/* Loading */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (t) =>
            t.zIndex.drawer + 1
        }}
        open={loading}
      >
        <Box textAlign="center">
          <CircularProgress color="inherit" />
          <Typography
            variant="h6"
            sx={{ mt: 2 }}
          >
            Procesando...
          </Typography>
        </Box>
      </Backdrop>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false
          }))
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default Pendientes;