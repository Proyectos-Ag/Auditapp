import React, { useEffect, useMemo, useRef, useState } from "react";
import "./css/NewIsh.css";
import AutoGrowTextarea from "../../../resources/AutoGrowTextarea";

import { Box, Paper, Stack, Typography, Chip, ButtonBase, Collapse, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DoneIcon from "@mui/icons-material/Done";

export default function NewIshikawaFin({ diagrama, problema, ID, causa }) {
  // Memoiza las claves de cada espina (finalizados: 3 por rama)
  const spineKeys = useMemo(
    () => [
      ["text10", "text12", "text14"], // Materiales
      ["text11", "text13", "text15"], // Mano de obra
      ["text7", "text4", "text1"],    // Máquinas
      ["text8", "text5", "text2"],    // Medio ambiente
      ["text9", "text6", "text3"],    // Métodos
    ],
    []
  );

  const spineNames = useMemo(
    () => ["Medio ambiente", "Métodos", "Materiales", "Mano de obra", "Maquinaria"],
    []
  );

  const [causes, setCauses] = useState(spineKeys.map(() => []));
  const wrapperRef = useRef(null);

  // =================== SOLO UI MÓVIL (igual que tu anterior) ===================
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expandedSpine, setExpandedSpine] = useState(0);
  // ============================================================================

  // Normaliza para que el match sea estable (evita que falle por dobles espacios / saltos)
  const norm = (s) =>
    String(s || "")
      .replace(/\s+/g, " ")
      .trim();

  // Valores seleccionados según el string `causa`
  const selectedSet = useMemo(() => {
    const valores = String(causa || "")
      .split(";")
      .map((v) => norm(v))
      .filter(Boolean);
    return new Set(valores);
  }, [causa]);

  // Inicializa causas desde el diagrama (cada vez que cambia el registro)
  useEffect(() => {
    if (!diagrama?.length) {
      setCauses(spineKeys.map(() => []));
      return;
    }

    const record = diagrama[0];
    const init = spineKeys.map((keys) =>
      keys.map((key) => norm(record?.[key] || "")).filter(Boolean)
    );

    setCauses(init);
  }, [diagrama, spineKeys, ID]);

  // En móvil: abre por defecto la primera rama con contenido (si existe)
  useEffect(() => {
    if (!isMobile) return;

    const idx = (causes || []).findIndex((g) =>
      (g || []).some((t) => norm(t))
    );

    setExpandedSpine(idx >= 0 ? idx : 0);
  }, [isMobile, causes]);

  /**
   * ✅ Mantiene TU funcionalidad del amarillo, pero robusta:
   * - No guarda nodos en estado (porque en móvil se desmontan por Collapse).
   * - Re-aplica el pintado cada vez que:
   *   - cambia causa
   *   - cambia causes (cargaste diagrama)
   *   - cambia expandedSpine (se montan textareas en móvil)
   */
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    const nodes = root.querySelectorAll("textarea.cause-input");

    nodes.forEach((node) => {
      const v = norm(node.value);
      const isSelected = v && selectedSet.has(v);

      // Pinta / despinta SIN perder funcionalidad
      node.style.backgroundColor = isSelected ? "#f1fc5e9f" : "";
      node.style.borderRadius = isSelected ? "10px" : "";
    });
  }, [selectedSet, causes, isMobile, expandedSpine]);

  // =================== DESKTOP PEZ ===================
  const spinePositions = [
    { position: "bottom", angle: -60, left: "30%" },
    { position: "bottom", angle: -60, left: "70%" },
    { position: "top", angle: 60, left: "25%" },
    { position: "top", angle: 60, left: "50%" },
    { position: "top", angle: 60, left: "75%" },
  ];

  const problemaShown = problema || diagrama?.[0]?.problema || "";

  return (
    <div className="ishikawa-wrapper" ref={wrapperRef}>
      {/* ===================== DESKTOP (PEZ) ===================== */}
      {!isMobile && (
        <div className="fishbone-container">
          <div className="fish-tail" />
          <div className="central-line" />
          <div className="fish-head">
            <div className="problema-display" style={{ fontSize: "15px" }}>
              {problemaShown}
            </div>
          </div>

          {spinePositions.map((pos, i) => {
            const group = causes[i] || [];
            const count = group.length;
            const spacing = 100 / (Math.max(count, 1) + 1);

            return (
              <div key={i} className={`spine-group ${pos.position}`} style={{ left: pos.left }}>
                <div className="main-spine">
                  <div className="diagonal-line" style={{ transform: `rotate(${pos.angle}deg)` }}>
                    <div className="causes-wrapper">
                      {group.map((text, ci) => (
                        <div
                          key={ci}
                          className="cause-line"
                          style={{
                            transform: `translateY(-50%) rotate(${-pos.angle}deg)`,
                            right: `${(ci + 1) * spacing}%`,
                          }}
                        >
                          <AutoGrowTextarea
                            className="cause-input"
                            value={text}
                            readOnly
                            shrinkable={count > 1}
                            expandable={count === 1}
                            maxHeight={count === 1 ? null : 45}
                            minFontSize={8}
                            baseFontIncrement={1}
                            style={{
                              height: count === 1 ? "auto" : "45px",
                              outline: "none",
                              resize: "none",
                            }}
                          />
                          <div className="sub-line" />
                        </div>
                      ))}
                    </div>

                    <div
                      className="spine-end-label"
                      style={{
                        position: "absolute",
                        left: 0,
                        transform: `translate(-50%, -50%) rotate(${-pos.angle}deg)`,
                      }}
                    >
                      {spineNames[i]}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== MÓVIL (ACCORDION / LISTA) ===================== */}
      {isMobile && (
        <Box className="ishm-root">
          <Paper className="ishm-card" elevation={2}>
            <Stack spacing={1}>
              <Typography className="ishm-title" variant="subtitle1">
                Ishikawa (Finalizado)
              </Typography>

              {!!problemaShown && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <strong>Problema:</strong> {problemaShown}
                </Typography>
              )}

              <Divider />

              {spineNames.map((name, i) => {
                const group = causes[i] || [];
                const hasContent = group.some((t) => norm(t));
                const filled = group.filter((t) => norm(t)).length;
                const open = expandedSpine === i;

                return (
                  <Box key={i} className="ishm-spine">
                    <ButtonBase
                      className="ishm-header"
                      onClick={() => setExpandedSpine((prev) => (prev === i ? null : i))}
                    >
                      <Chip
                        label={name}
                        className="ishm-chip"
                        sx={{
                          bgcolor: hasContent ? "var(--central-line-color)" : "#9e9e9e",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      />

                      <Box sx={{ flex: 1 }} />

                      <Typography variant="caption" className="ishm-count">
                        {filled}/{spineKeys[i].length}
                      </Typography>

                      <ExpandMoreIcon
                        className="ishm-expand"
                        sx={{
                          transition: "transform .15s ease",
                          transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </ButtonBase>

                    <Collapse in={open} timeout={180} unmountOnExit>
                      <Box className="ishm-body">
                        {!hasContent && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Sin hallazgos en esta rama.
                          </Typography>
                        )}

                        {group.map((text, ci) => {
                          const val = norm(text);
                          const isSelected = val && selectedSet.has(val);

                          return (
                            <Box key={ci} className="ishm-cause-row">
                              <Stack className="ishm-actions">
                                <DoneIcon
                                  style={{
                                    fontSize: 20,
                                    opacity: isSelected ? 1 : 0.25,
                                    color: isSelected ? "var(--central-line-color)" : "#9e9e9e",
                                  }}
                                />
                              </Stack>

                              {/* IMPORTANTE:
                                  - Mantenemos className="cause-input" para que el useEffect DOM pinte amarillo
                                  - Aunque el Collapse monte/desmonte, al abrir se repinta (dep expandedSpine)
                               */}
                              <AutoGrowTextarea
                                className="cause-input"
                                value={text}
                                readOnly
                                style={{ width: "100%", outline: "none", resize: "none" }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Box>
      )}
    </div>
  );
}