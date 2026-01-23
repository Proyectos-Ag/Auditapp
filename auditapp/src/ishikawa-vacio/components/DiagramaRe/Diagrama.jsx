import React, { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import "../Ishikawa/css/Ishikawa.css";

import { Box, Chip, Typography, Stack, Alert, AlertTitle, Skeleton } from "@mui/material";

// Diagrama final (solo lectura)
import NewIshikawaFin from "../Ishikawa/NewIshikawaFin";

import AutoGrowTextarea from "../../../resources/AutoGrowTextarea";

const Diagrama = ({ recordId }) => {
  const [ishikawa, setIshikawa] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recordId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/ishikawa/vac/por/${recordId}`);
        setIshikawa(res.data || null);
      } catch (e) {
        console.error("Error fetching data:", e);
        setIshikawa(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recordId]);

  const participantesArray = useMemo(() => {
    const raw = String(ishikawa?.participantes || "").trim();
    if (!raw) return [];
    // soporta " / " o "/" o comas por si acaso
    return raw
      .split(/\s*\/\s*|,\s*/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }, [ishikawa?.participantes]);

  const formatDateInputValue = (value) => {
    // Para <input type="date"> se necesita YYYY-MM-DD
    // Si tu backend ya manda YYYY-MM-DD, se queda igual.
    const v = String(value || "").trim();
    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    // Si viene como DateString, intenta parsear
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateCell = (value) => {
    const v = String(value || "").trim();
    if (!v) return "--";
    const d = new Date(`${v}T00:00:00`);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString();
  };

  const formatResponsables = (responsable) => {
    if (!responsable) return "--";

    const pickName = (r) => {
      if (r == null) return "";
      if (typeof r === "string") return r;
      if (typeof r === "object") {
        if (r.nombre) return r.nombre;
        // Caso raro: objeto con keys numéricas
        const keys = Object.keys(r).filter((k) => !Number.isNaN(Number(k))).sort((a, b) => Number(a) - Number(b));
        if (keys.length) return keys.map((k) => r[k]).join("");
      }
      return String(r);
    };

    if (Array.isArray(responsable)) {
      const flat = responsable.flat(Infinity);
      return flat.map(pickName).map((s) => s.trim()).filter(Boolean).join(", ") || "--";
    }

    if (typeof responsable === "object") return pickName(responsable) || "--";
    return String(responsable);
  };

  if (loading) {
    return (
      <div className="ishn-content">
        <div className="ishn-edit">
          <div className="ishn-card">
            <Skeleton variant="text" height={44} width="40%" />
            <Skeleton variant="rounded" height={220} />
          </div>
          <div className="ishn-card">
            <Skeleton variant="rounded" height={260} />
          </div>
          <div className="ishn-card">
            <Skeleton variant="rounded" height={260} />
          </div>
        </div>
      </div>
    );
  }

  if (!ishikawa) {
    return (
      <div className="ishn-content">
        <Alert severity="warning">
          <AlertTitle>No se encontró el registro</AlertTitle>
          No hay datos para mostrar.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="ishn-edit">
        {/* =================== PART 1 =================== */}
        <div id="pdf-content-part1" className="ishn-card">
          <h1>Ishikawa</h1>

          <div className="ishn-info">
            <h2>
              Problema:
              <input className="ishn-input" value={ishikawa.problema || ""} disabled />
            </h2>

            <h2>
              Afectación:
              <input className="ishn-input" value={ishikawa.afectacion || ""} disabled />
            </h2>
          </div>

          <div className="ishn-code">GCF015</div>

          <div className="ishn-meta">
            <h3>
              Fecha:
              <input type="date" value={formatDateInputValue(ishikawa.fecha)} disabled />
            </h3>
            <h3>Folio: {ishikawa.folio || "--"}</h3>
          </div>

          <div className="ishn-diagramWrap">
            <NewIshikawaFin
              key={recordId}
              diagrama={ishikawa.diagrama}
              problema={ishikawa.problema}
              causa={ishikawa.causa}
              ID={recordId}
            />
          </div>

          <div className="ishn-people">
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {participantesArray.length ? (
                participantesArray.map((p, idx) => (
                  <Chip key={`${p}-${idx}`} label={p} size="small" variant="outlined" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sin participantes
                </Typography>
              )}
            </Stack>
          </div>
        </div>

        {/* =================== PART 2 =================== */}
        <div id="pdf-content-part2" className="ishn-card">
          <div className="ishn-textBlock">
            <h3>No conformidad:</h3>
            <AutoGrowTextarea className="ishn-textarea" value={ishikawa.requisito || ""} disabled />

            <h3>Hallazgo:</h3>
            <AutoGrowTextarea className="ishn-textarea" value={ishikawa.hallazgo || ""} disabled />

            <h3>Acción inmediata o corrección:</h3>
            <AutoGrowTextarea className="ishn-textarea" value={ishikawa.correccion || ""} disabled />

            <h3>Causa del problema (Ishikawa, TGN, W-W, DCR):</h3>
            <AutoGrowTextarea className="ishn-textarea" value={ishikawa.causa || ""} disabled />
          </div>
        </div>

        {/* =================== PART 3 =================== */}
        <div id="pdf-content-part3" className="ishn-card">
          <div className="ishn-tableWrap">
            <h3>SOLUCIÓN</h3>
            <table>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Responsable</th>
                  <th>Fecha Compromiso</th>
                </tr>
              </thead>
              <tbody>
                {(ishikawa.actividades || []).map((act, i) => (
                  <tr key={i}>
                    <td>{act?.actividad || "--"}</td>
                    <td>{formatResponsables(act?.responsable)}</td>
                    <td>{formatDateCell(act?.fechaCompromiso)}</td>
                  </tr>
                ))}
                {(!ishikawa.actividades || ishikawa.actividades.length === 0) && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center" }}>
                      Sin actividades
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <h3>EFECTIVIDAD</h3>
            <table>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Responsable</th>
                  <th>Fecha Compromiso</th>
                  <th>Acción Correctiva Cerrada</th>
                </tr>
              </thead>
              <tbody>
                {(ishikawa.correcciones || []).map((acc, i) => (
                  <tr key={i}>
                    <td>{acc?.actividad || "--"}</td>
                    <td>{String(acc?.responsable || "--")}</td>
                    <td>{formatDateCell(acc?.fechaCompromiso)}</td>
                    <td>{String(acc?.cerrada ?? "--")}</td>
                  </tr>
                ))}
                {(!ishikawa.correcciones || ishikawa.correcciones.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      Sin acciones de efectividad
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagrama;