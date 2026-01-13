import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../../../services/api";
import "./css/Diagrama.css";

// ✅ Reutiliza estilos de IshikawaRev (barra superior + contenedores)
import "../IshikawaRev/css/IshikawaRev.css";

import Logo from "../assets/img/logoAguida.png";

import Fotos from "../IshikawaRev/Foto";
import IshPDF from "../IshikawaRev/IshPDF";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import {
  Stack,
  Box,
  Typography,
  Divider,
  Button,
  Alert,
  AlertTitle,
} from "@mui/material";

import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import DoneIcon from "@mui/icons-material/Done";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import NewIshikawaFin from "../../../ishikawa-vacio/components/Ishikawa/NewIshikawaFin";

const Diagrama = () => {
  const { _id } = useParams(); // parámetro de ruta (no siempre es el id del ishikawa)
  const navigate = useNavigate();

  const [ishikawas, setIshikawas] = useState([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const [showPart, setShowPart] = useState(true);

  // Nota rechazo
  const [showNotaRechazo, setShowNotaRechazo] = useState(false);
  const [notaRechazo, setNotaRechazo] = useState("");

  // Correcciones del diagrama visible
  const [correcciones, setCorrecciones] = useState([
    { actividad: "", responsable: "", fechaCompromiso: null, cerrada: "", evidencia: "" },
  ]);

  // UI / Evidencias
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState({});

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Loading
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  // === PDF con IshPDF ===
  // mantenemos refs por id para poder "enviar pdf" automáticamente al aprobar
  const pdfRefs = useRef({});

  const participantesToArray = (p) => {
    if (typeof p === "string") {
      return p.split("/").map((x) => x.trim()).filter(Boolean);
    }
    if (Array.isArray(p)) return p;
    return [];
  };

  // Si tu "afectacion" viene como "ID Programa Nombre", intentamos separarlo
  const parseAfectacion = (afectacion) => {
    const txt = String(afectacion || "").trim();
    if (!txt) return { idAfect: "", programaNombre: "" };
    const parts = txt.split(" ").filter(Boolean);
    const idAfect = parts[0] || "";
    const programaNombre = parts.slice(1).join(" ").trim();
    return { idAfect, programaNombre };
  };

  const enviarPdfPorAprobacion = async (ishId) => {
    const inst = pdfRefs.current[ishId];
    if (!inst?.generatePDF) return;

    const ish = ishikawas.find((x) => x?._id === ishId);
    const participantes = ish ? participantesToArray(ish.participantes) : undefined;

    await inst.generatePDF({ download: false, participantes });
  };

  // === Data ===
  const fetchData = async () => {
    try {
      const response = await api.get(`/ishikawa/vac/por/${_id}`);
      const recibidos = Array.isArray(response.data) ? response.data : [response.data];
      setIshikawas(recibidos.filter(Boolean));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_id]);

  // Cada vez que cambie el diagrama visible, cargamos sus correcciones al state
  useEffect(() => {
    const current = ishikawas[visibleIndex ?? 0];
    setSelectedIndex(null);
    setShowNotaRechazo(false);
    setNotaRechazo("");

    if (!current?.correcciones || !Array.isArray(current.correcciones)) {
      setCorrecciones([
        { actividad: "", responsable: "", fechaCompromiso: null, cerrada: "", evidencia: "" },
      ]);
      return;
    }

    const correccionesIniciales = current.correcciones.map((c) => {
      let fechaCompromiso = null;
      if (c.fechaCompromiso && c.fechaCompromiso !== "") {
        const d = new Date(c.fechaCompromiso);
        if (!Number.isNaN(d.getTime())) {
          fechaCompromiso = d.toISOString().split("T")[0];
        }
      }
      return { ...c, fechaCompromiso };
    });

    if (correccionesIniciales.length === 0) {
      correccionesIniciales.push({
        actividad: "",
        responsable: "",
        fechaCompromiso: null,
        cerrada: "",
        evidencia: "",
      });
    }

    setCorrecciones(correccionesIniciales);
  }, [ishikawas, visibleIndex]);

  // === Aprobación / Rechazo ===
  const handleAprobar = async (ishId) => {
    try {
      await api.put(`/ishikawa/completo/${ishId}`, { estado: "Aprobado" });

      await Swal.fire({
        title: "¡Éxito!",
        text: "El diagrama se aprobó correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      await enviarPdfPorAprobacion(ishId);
      await fetchData();
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Hubo un error al actualizar la información");
    }
  };

  const Aprobar = (ishId) => {
    Swal.fire({
      title: "¿Está seguro de querer aprobar este diagrama?",
      text: "¡Esta acción no se puede revertir!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3ccc37",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) handleAprobar(ishId);
    });
  };

  const handleGuardarRechazo = async (ishId, nota) => {
  try {
    // ✅ Traemos el ishikawa real desde el state usando el id
    const ish = ishikawas.find((x) => x?._id === ishId);
    const { programaNombre } = parseAfectacion(ish?.afectacion);

    await api.put(`/ishikawa/completo/${ishId}`, {
      estado: "Rechazado",
      notaRechazo: nota,

      // ✅ Si tu backend los requiere (como en IshikawaRev)
      usuario: ish?.auditado || "",
      programa: ish?.proName || programaNombre || "",
      correo: ish?.correo || "",
    });

    await fetchData();
  } catch (error) {
    console.error("Error al registrar rechazo:", error);
    Swal.fire("Error", "No se pudo registrar el rechazo.", "error");
  }
};

    const Rechazar = (ishId) => {
    Swal.fire({
        title: "Rechazar diagrama",
        input: "textarea",
        inputLabel: "Escriba la nota de rechazo",
        inputPlaceholder: "Comentario…",
        showCancelButton: true,
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
        inputValidator: (value) => {
        if (!value) return "La nota de rechazo es obligatoria";
        },
    }).then((result) => {
        if (result.isConfirmed) {
        handleGuardarRechazo(ishId, result.value);
        }
    });
    };


  // === Eliminar diagrama ===
  const handleEliminarDiagrama = async (ishId) => {
    try {
      await api.delete(`/ishikawa/delete/${ishId}`);

      await Swal.fire({
        title: "Éxito",
        text: "El diagrama se eliminó correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      navigate("/ishikawasesp");
    } catch (error) {
      console.error("Error al eliminar el diagrama:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al eliminar el diagrama.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const EliminarDiagrama = (ishId) => {
    Swal.fire({
      title: "¿Está seguro de querer eliminar este diagrama?",
      text: "¡Esta acción no se puede deshacer!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3ccc37",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) handleEliminarDiagrama(ishId);
    });
  };

  // === Correcciones ===
  const handleCorreccionChange = (index, field, value) => {
    const nuevas = [...correcciones];

    if (field === "cerrada") {
      nuevas[index][field] = value ? "Sí" : "No";
    } else if (field === "cerradaNo") {
      nuevas[index]["cerrada"] = value ? "No" : "Sí";
    } else if (field === "fechaCompromiso") {
      nuevas[index][field] = new Date(value).toISOString().split("T")[0];
    } else {
      nuevas[index][field] = value;
    }

    setCorrecciones(nuevas);
  };

  const handleAgregarFila = () => {
    setCorrecciones((prev) => [
      ...prev,
      { actividad: "", responsable: "", fechaCompromiso: null, cerrada: "", evidencia: "" },
    ]);
  };

  const handleEliminarFila = (index) => {
    const nuevas = [...correcciones];
    nuevas.splice(index, 1);
    setCorrecciones(nuevas);
  };

  // === Evidencias ===
  const handleCapture = (file) => {
    if (selectedField) {
      setCapturedPhotos((prev) => ({ ...prev, [selectedField]: file }));
    }
    setModalOpen(false);
  };

  const handleOpenModal = (fieldKey) => {
    setSelectedField(fieldKey);
    setModalOpen(true);
  };

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setImageModalOpen(true);
  };

  const closeModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  const uploadImageToFirebase = async (file, fileName) => {
    if (!(file instanceof File)) throw new Error("El objeto recibido no es un archivo válido");

    const storageRef = ref(storage, `files/${fileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleUploadFile = (fieldKey) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.style.display = "none";

    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        setCapturedPhotos((prev) => ({ ...prev, [fieldKey]: file }));
      }
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const handleEliminarEvidencia = async (index, idIsh, idCorr) => {
    try {
      const response = await api.put(`/ishikawa/eliminar-evidencia/${index}/${idIsh}/${idCorr}`);
      if (response.status === 200) {
        const nuevas = [...correcciones];
        nuevas[index].evidencia = "";
        setCorrecciones(nuevas);
        closeModal();
        alert("Evidencia eliminada exitosamente");
      }
    } catch (error) {
      console.error("Error al eliminar la evidencia:", error);
      alert("Hubo un error al eliminar la evidencia");
    }
  };

  const EliminarEv = (index, idIsh, idCorr) => {
    Swal.fire({
      title: "¿Está seguro de querer eliminar la evidencia?",
      text: "¡Esta acción es irreversible!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3ccc37",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) handleEliminarEvidencia(index, idIsh, idCorr);
    });
  };

  // === Guardar / Finalizar ===
  const handleGuardarCambios = async (ishId) => {
    try {
      handleOpen();

      const correccionesActualizadas = await Promise.all(
        correcciones.map(async (c, index) => {
          const updated = { ...c };

          const key = `${ishId}_${index}`;
          const file = capturedPhotos[key];

          if (!file) return updated;

          const fileType = file.type;
          const fileName = fileType === "application/pdf" ? `pdf_${ishId}_${index}` : `image_${ishId}_${index}`;

          const fileUrl = await uploadImageToFirebase(file, fileName);

          updated.evidencia = fileType === "application/pdf" ? `${fileUrl} || ${file.name}` : fileUrl;
          return updated;
        })
      );

      const dataToSend = correccionesActualizadas.map((c) => ({
        actividad: c.actividad || "",
        responsable: c.responsable || "",
        fechaCompromiso: c.fechaCompromiso || null,
        cerrada: c.cerrada || "",
        evidencia: c.evidencia || "",
      }));

      await api.put(`/ishikawa/${ishId}`, dataToSend, {
        headers: { "Content-Type": "application/json" },
      });

      handleClose();

      Swal.fire({
        title: "¡Éxito!",
        text: "Información guardada correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      handleClose();
      console.error("Error al actualizar la información:", error);
      alert("Hubo un error al actualizar la información");
    }
  };

  const handleFinalizar = async (ishId) => {
    try {
      handleOpen();

      const correccionesActualizadas = await Promise.all(
        correcciones.map(async (c, index) => {
          const updated = { ...c };

          const key = `${ishId}_${index}`;
          const file = capturedPhotos[key];

          if (!file) return updated;

          const fileType = file.type;
          const fileName = fileType === "application/pdf" ? `pdf_${ishId}_${index}` : `image_${ishId}_${index}`;
          const fileUrl = await uploadImageToFirebase(file, fileName);

          updated.evidencia = fileType === "application/pdf" ? `${fileUrl} || ${file.name}` : fileUrl;
          return updated;
        })
      );

      const dataToSend = {
        correcciones: correccionesActualizadas.map((c) => ({
          actividad: c.actividad || "",
          responsable: c.responsable || "",
          fechaCompromiso: c.fechaCompromiso || null,
          cerrada: c.cerrada || "",
          evidencia: c.evidencia || "",
        })),
        estado: "Finalizado",
      };

      await api.put(`/ishikawa/fin/${ishId}`, dataToSend, {
        headers: { "Content-Type": "application/json" },
      });

      handleClose();

      Swal.fire({
        title: "¡Éxito!",
        text: "Información guardada correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      }).then(() => fetchData());
    } catch (error) {
      handleClose();
      console.error("Error al actualizar:", error);
      alert("Hubo un error al actualizar la información");
    }
  };

  const Finalizar = (ishId) => {
    Swal.fire({
      title: "¿Está seguro de querer finalizar este diagrama?",
      text: "El diagrama se dará por terminado",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3ccc37",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) handleFinalizar(ishId);
    });
  };

  return (
    <div className="top-diagrama">
      {/* Carga */}
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={open}
        onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <div className="content-diagrama">
        {ishikawas.map((ishikawa, index) => {
          const { idAfect, programaNombre } = parseAfectacion(ishikawa.afectacion);

          const estado = String(ishikawa.estado || "");
          const estadoLower = estado.toLowerCase();
          const isEnRevision = estadoLower.includes("hecho");
          const isRechazado = estadoLower.includes("rechaz");
          const isAprobado = estadoLower.includes("aprob");
          const isFinalizado = estadoLower.includes("finaliz");

          return (
            <div key={ishikawa._id || index}>
              {visibleIndex === index && (
                <div>
                  {/* ✅ Barra superior estilo IshikawaRev */}
                  <Stack
                    className="acciones-ish-container"
                    direction="row"
                    spacing={3}
                    alignItems="center"
                    width="96%"
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" color="white" gutterBottom>
                        Acciones del diagrama
                      </Typography>
                      <Typography variant="body2" sx={{ color: "grey.300" }}>
                        Estado actual: <strong>{ishikawa.estado}</strong>
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ borderColor: "grey.700" }} />

                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      
                      {/* PDF siempre visible */}
                      <IshPDF
                        ref={(el) => {
                          if (el) pdfRefs.current[ishikawa._id] = el;
                        }}
                        ishikawa={ishikawa}
                        programa={{ Nombre: programaNombre }}
                        id={idAfect}
                        download={true}
                        participantesC={participantesToArray(ishikawa.participantes)}
                      />

                      {/* Acciones de revisión */}
                      {isEnRevision && (
                        <>
                          <Button
                            variant="text"
                            sx={{ color: "white" }}
                            startIcon={<ThumbDownIcon sx={{ color: (t) => t.palette.error.main }} />}
                            onClick={() => Rechazar(ishikawa._id)}
                          >
                            Rechazar
                          </Button>

                          <Button
                            variant="text"
                            sx={{ color: "white" }}
                            startIcon={<ThumbUpIcon sx={{ color: (t) => t.palette.success.main }} />}
                            onClick={() => Aprobar(ishikawa._id)}
                          >
                            Aprobar
                          </Button>
                        </>
                      )}

                      {/* Acciones cuando está aprobado (efectividad) */}
                      {isAprobado && (
                        <>
                          
                          <Button
                            variant="text"
                            sx={{ color: "white" }}
                            startIcon={<SaveIcon />}
                            disabled={selectedIndex === null}
                            onClick={(e) => {
                              e.preventDefault();
                              handleGuardarCambios(ishikawa._id);
                            }}
                          >
                            Guardar
                          </Button>

                          <Button
                            variant="text"
                            sx={{ color: "white" }}
                            endIcon={<DoneIcon />}
                            onClick={(e) => {
                              e.preventDefault();
                              Finalizar(ishikawa._id);
                            }}
                          >
                            Finalizar
                          </Button>
                        </>
                      )}

                      {/* Eliminar (centralizado arriba) */}
                      <Button
                        variant="text"
                        sx={{ color: "white" }}
                        startIcon={<DeleteForeverIcon sx={{ color: (t) => t.palette.error.light }} />}
                        onClick={() => EliminarDiagrama(ishikawa._id)}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>

                  {/* Mensajes/alertas como en IshikawaRev */}
                  {isEnRevision && (
                    <Alert severity="info" icon={<span style={{ fontSize: 40 }}>📝</span>} sx={{ my: 2, width: "96%", mx: "auto" }}>
                      <AlertTitle>En estado de revisión</AlertTitle>
                      Revise el diagrama enviado por <strong>{ishikawa.auditado}</strong> y haga clic en "Aprobar" o "Rechazar".
                    </Alert>
                  )}

                  {isRechazado && (
                    <Alert severity="error" sx={{ my: 2, width: "96%", mx: "auto" }}>
                      <AlertTitle>Estado: Rechazado</AlertTitle>
                      Este diagrama fue rechazado debido a: <strong>{ishikawa.notaRechazo}</strong>
                    </Alert>
                  )}

                  {isAprobado && (
                    <Alert severity="success" icon={<span style={{ fontSize: 40 }}>🎉</span>} sx={{ my: 2, width: "96%", mx: "auto" }}>
                      <AlertTitle>Estado: Aprobado</AlertTitle>
                      Ha marcado el diagrama como aprobado. Se ha notificado según el flujo configurado.
                    </Alert>
                  )}

                  {isFinalizado && (
                    <Alert severity="info" sx={{ my: 2, width: "96%", mx: "auto" }}>
                      <AlertTitle>Estado: Finalizado</AlertTitle>
                      El proceso ha sido finalizado.
                    </Alert>
                  )}

                  {/* Nota de rechazo (misma clase que IshikawaRev) */}
                  {showNotaRechazo && (
                    <div className="nota-rechazo-container" style={{ zIndex: 10 }}>
                      <textarea
                        value={notaRechazo}
                        onChange={(e) => setNotaRechazo(e.target.value)}
                        className="textarea-ishi"
                        rows="4"
                        cols="50"
                        placeholder="Escribe aquí la razón del rechazo"
                      />
                    </div>
                  )}

                  {/* ====== CONTENIDO ====== */}
                  <div id="pdf-content-part1" className="image-container">
                    <img src={Logo} alt="Logo Aguida" className="logo-empresa-ish" />
                    <h1 style={{ position: "absolute", fontSize: "40px" }}>Ishikawa</h1>

                    <div className="posicion-en">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <h2 style={{ marginLeft: "50rem", marginRight: "10px" }}>Problema: </h2>
                        <div style={{ width: "50rem", fontSize: "20px" }}>{ishikawa.problema}</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <h2 style={{ marginLeft: "50rem", marginRight: "10px" }}>Afectación: </h2>
                        <div style={{ width: "50rem", fontSize: "20px" }}>{ishikawa.afectacion}</div>
                      </div>
                    </div>

                    <div className="posicion-en-3">GCF015</div>

                    <div className="posicion-en-2">
                      <h3>Fecha: {ishikawa.fecha}</h3>
                      <h3>Folio: {ishikawa.folio}</h3>
                    </div>

                    <div style={{ marginTop: "-1em" }}>
                      <NewIshikawaFin
                        key={ishikawa._id}
                        diagrama={ishikawa.diagrama}
                        problema={ishikawa.problema}
                        causa={ishikawa.causa}
                        ID={ishikawa._id}
                      />
                    </div>

                    <div className="button-pasti">
                      <div className="cont-part">
                        <button
                          className="button-part"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPart((p) => !p);
                          }}
                        >
                          ⚇
                        </button>

                        {showPart && <div className="part-div">{ishikawa.participantes}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="image-container2" id="pdf-content-part2">
                    <div className="posicion-bo">
                      <h3>No conformidad:</h3>
                      <div style={{ width: "70rem", textAlign: "justify", overflowWrap: "break-word" }}>
                        {ishikawa.requisito}
                      </div>

                      <h3>Hallazgo:</h3>
                      <div style={{ width: "70rem", overflowWrap: "break-word" }}>{ishikawa.hallazgo}</div>

                      <h3>Acción inmediata o corrección: </h3>
                      <div style={{ width: "70rem", overflowWrap: "break-word" }}>{ishikawa.correccion}</div>

                      <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
                      <div style={{ marginBottom: "20px", width: "72rem", overflowWrap: "break-word" }}>
                        {ishikawa.causa}
                      </div>
                    </div>
                  </div>

                  <div className="image-container3" id="pdf-content-part3">
                    <div className="table-ish">
                      <table style={{ border: "none" }}>
                        <thead>
                          <tr><h3>SOLUCIÓN</h3></tr>
                          <tr>
                            <th className="conformity-header">Actividad</th>
                            <th className="conformity-header">Responsable</th>
                            <th className="conformity-header">Fecha Compromiso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ishikawa.actividades?.map((actividad, i) => (
                            <tr key={i}>
                              <td>{actividad.actividad}</td>
                              <td>
                                {Array.isArray(actividad.responsable)
                                  ? actividad.responsable.flat().map((r, idx, arr) => (
                                      <span key={idx}>
                                        {typeof r === "object"
                                          ? (r?.nombre
                                              ? r.nombre
                                              : Object.keys(r || {})
                                                  .filter((k) => !isNaN(k))
                                                  .sort((a, b) => a - b)
                                                  .map((k) => r[k])
                                                  .join(""))
                                          : r}
                                        {idx < arr.length - 1 ? ", " : ""}
                                      </span>
                                    ))
                                  : typeof actividad.responsable === "object" && actividad.responsable !== null
                                  ? (actividad.responsable.nombre
                                      ? <span>{actividad.responsable.nombre}</span>
                                      : <span>{
                                          Object.keys(actividad.responsable || {})
                                            .filter((k) => !isNaN(k))
                                            .sort((a, b) => a - b)
                                            .map((k) => actividad.responsable[k])
                                            .join("")
                                        }</span>)
                                  : actividad.responsable}
                              </td>
                              <td>
                                {actividad.fechaCompromiso
                                  ? new Date(actividad.fechaCompromiso + "T00:00:00").toLocaleDateString()
                                  : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* EFECTIVIDAD (igual lógica que ya tenías) */}
                      {(isAprobado || isFinalizado) ? (
                        <>
                        <table style={{ border: "none" }}>
                          <thead>
                            <tr><h3>EFECTIVIDAD</h3></tr>
                            <tr>
                              <th className="conformity-header">Actividad</th>
                              <th className="conformity-header">Responsable</th>
                              <th className="conformity-header">Fecha Verificación</th>
                              <th colSpan="2" className="conformity-header">
                                Acción Correctiva Cerrada
                                <div style={{ display: "flex" }}>
                                  <div className="left">Sí</div>
                                  <div className="right">No</div>
                                </div>
                              </th>
                              <th className="conformity-header" style={{ width: "10em" }}>Evidencia</th>
                            </tr>
                          </thead>

                          <tbody>
                            {correcciones.map((correccion, idx) => {
                              const fieldKey = `${ishikawa._id}_${idx}`;

                              return (
                                <tr key={idx} onClick={() => setSelectedIndex(idx)}>
                                  <td>
                                    <textarea
                                      value={correccion.actividad}
                                      onChange={(e) => handleCorreccionChange(idx, "actividad", e.target.value)}
                                      className="no-border"
                                      required
                                    />
                                  </td>

                                  <td>
                                    <textarea
                                      value={correccion.responsable}
                                      onChange={(e) => handleCorreccionChange(idx, "responsable", e.target.value)}
                                      className="no-border"
                                      required
                                    />
                                  </td>

                                  <td>
                                    <input
                                      type="date"
                                      value={correccion.fechaCompromiso || ""}
                                      onChange={(e) => handleCorreccionChange(idx, "fechaCompromiso", e.target.value)}
                                      className="no-border"
                                      required
                                    />
                                  </td>

                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={correccion.cerrada === "Sí"}
                                      onChange={(e) => handleCorreccionChange(idx, "cerrada", e.target.checked)}
                                      className="no-border"
                                    />
                                  </td>

                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={correccion.cerrada === "No"}
                                      onChange={(e) => handleCorreccionChange(idx, "cerradaNo", e.target.checked)}
                                      className="no-border"
                                    />
                                  </td>

                                  <td>
                                    <link
                                      rel="stylesheet"
                                      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                                    />

                                    {isAprobado && (
                                      <>
                                        <div
                                          className="button-foto"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleOpenModal(fieldKey);
                                          }}
                                        >
                                          <span className="material-symbols-outlined">add_a_photo</span>
                                        </div>

                                        <div
                                          className="button-foto"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleUploadFile(fieldKey);
                                          }}
                                        >
                                          <UploadFileIcon />
                                        </div>
                                      </>
                                    )}

                                    {correccion.evidencia &&
                                      (correccion.evidencia.endsWith(".pdf") ? (
                                        <a
                                          href={correccion.evidencia.split(" || ")[0]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
                                        >
                                          <PictureAsPdfIcon sx={{ color: "red", fontSize: "40px", marginRight: "8px" }} />
                                          {correccion.evidencia.split(" || ")[1]?.replace(/"/g, "")}
                                        </a>
                                      ) : (
                                        <img
                                          src={correccion.evidencia}
                                          alt="Evidencia"
                                          style={{ width: "100%", height: "auto" }}
                                          className="hallazgo-imagen"
                                          onClick={() => handleImageClick(correccion.evidencia)}
                                        />
                                      ))}

                                    {capturedPhotos[fieldKey] &&
                                      (capturedPhotos[fieldKey].type === "application/pdf" ? (
                                        <div>
                                          <a
                                            href={URL.createObjectURL(capturedPhotos[fieldKey])}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {capturedPhotos[fieldKey].name || "Ver PDF"}
                                          </a>
                                        </div>
                                      ) : (
                                        <div>
                                          <img
                                            src={URL.createObjectURL(capturedPhotos[fieldKey])}
                                            alt="Captura"
                                            style={{ width: "100%", height: "auto" }}
                                            onClick={() => handleImageClick(URL.createObjectURL(capturedPhotos[fieldKey]))}
                                          />
                                        </div>
                                      ))}
                                  </td>

                                  <td className="cancel-acc">
                                    {isAprobado && idx > 0 && (
                                      <button
                                        className="eliminar-ev"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleEliminarFila(idx);
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </td>

                                  {imageModalOpen && (
                                    <div className="modal-overlay" onClick={closeModal}>
                                      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                        <img src={selectedImage} alt="Ampliada" className="modal-image" />
                                        <button
                                          className="eliminar-ev"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            EliminarEv(idx, ishikawa._id, correccion._id);
                                          }}
                                        >
                                          Eliminar Evidencia
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                            <Button
                            variant="variant"
                            size="small"
                            startIcon={<AddCircleOutlineIcon />}
                            sx={{ color: "green", borderColor: "rgba(255,255,255,0.35)" }}
                            onClick={(e) => {
                                e.preventDefault();
                                handleAgregarFila();
                            }}
                            >
                            Agregar fila
                            </Button>
                        </div>
                        </>
                      ) : null}

                    </div>

                    <Fotos open={modalOpen} onClose={() => setModalOpen(false)} onCapture={handleCapture} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Diagrama;