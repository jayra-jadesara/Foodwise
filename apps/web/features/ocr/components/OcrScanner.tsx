// ─────────────────────────────────────────────
// FoodWise · OCR · OcrScanner (Production)
// Local OCR: Tesseract.js Web Worker + 350-entry DB
// Zero API cost · Works offline · No AI needed
// ─────────────────────────────────────────────

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box, Button, CircularProgress, Typography, Paper,
  Chip, Stack, Alert, Divider, IconButton, Collapse,
  Tooltip, LinearProgress,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ReplayIcon from "@mui/icons-material/Replay";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SpeedIcon from "@mui/icons-material/Speed";

import { useOcrCamera } from "../hooks/use-ocr-camera";
import { useOcrAnalyze, type OcrAnalysisResultExtended } from "../queries/use-ocr";
import { processDataUrl } from "../utils/image-preprocessor";
import { prewarmOcrWorker } from "../workers/tesseract-worker";
import type { IngredientAnnotation, RiskLevel } from "../types";

// ── Risk config ────────────────────────────────
const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; border: string; label: string }> = {
  high: { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", label: "High Risk" },
  moderate: { color: "#f97316", bg: "#fff7ed", border: "#fdba74", label: "Moderate" },
  low: { color: "#eab308", bg: "#fefce8", border: "#fde047", label: "Low Risk" },
  safe: { color: "#22c55e", bg: "#f0fdf4", border: "#86efac", label: "Safe" },
  unknown: { color: "#94a3b8", bg: "#f8fafc", border: "#cbd5e1", label: "Unknown" },
};

const RISK_ORDER: Record<RiskLevel, number> = { high: 0, moderate: 1, low: 2, unknown: 3, safe: 4 };

const RISK_ICON: Record<RiskLevel, React.ReactNode> = {
  high: <WarningAmberIcon sx={{ color: "#ef4444" }} />,
  moderate: <WarningAmberIcon sx={{ color: "#f97316" }} />,
  low: <InfoOutlinedIcon sx={{ color: "#eab308" }} />,
  safe: <CheckCircleOutlineIcon sx={{ color: "#22c55e" }} />,
  unknown: <InfoOutlinedIcon sx={{ color: "#94a3b8" }} />,
};

// ── IngredientCard ─────────────────────────────
function IngredientCard({ item }: { item: IngredientAnnotation }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[item.risk];
  const hasDetail = !!(item.reason || (item.alternatives?.length ?? 0) > 0);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: cfg.border, bgcolor: cfg.bg, overflow: "hidden" }}>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, cursor: hasDetail ? "pointer" : "default" }}
        onClick={() => hasDetail && setExpanded((v) => !v)}
      >
        <Chip
          label={cfg.label} size="small"
          sx={{ bgcolor: cfg.color, color: "#fff", fontWeight: 700, fontSize: "0.6rem", height: 18, flexShrink: 0, textTransform: "uppercase" }}
        />
        <Typography variant="body2" fontWeight={600}
          sx={{ flex: 1, fontSize: "0.82rem", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.name}
        </Typography>
        <Chip
          label={item.category} size="small" variant="outlined"
          sx={{ fontSize: "0.58rem", height: 18, color: "text.secondary", borderColor: "divider", flexShrink: 0, textTransform: "capitalize" }}
        />
        {hasDetail && (
          <IconButton size="small" sx={{ p: 0.25, flexShrink: 0 }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ px: 1.5, py: 1 }}>
          {item.reason && (
            <Typography variant="caption" color="text.secondary"
              sx={{ display: "block", mb: item.alternatives?.length ? 1 : 0, lineHeight: 1.5 }}>
              {item.reason}
            </Typography>
          )}
          {item.alternatives && item.alternatives.length > 0 && (
            <Box>
              <Typography variant="caption"
                sx={{ fontWeight: 700, fontSize: "0.62rem", color: "text.secondary", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Healthier alternatives
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }} useFlexGap>
                {item.alternatives.map((alt) => (
                  <Chip key={alt} label={alt} size="small"
                    sx={{ bgcolor: "#22c55e22", color: "#16a34a", border: "1px solid #86efac", fontSize: "0.65rem", height: 20 }} />
                ))}
              </Stack>
            </Box>
          )}
          {item.sources && item.sources.length > 0 && (
            <Typography variant="caption" color="text.disabled"
              sx={{ display: "block", mt: 0.5, fontSize: "0.62rem" }}>
              {item.sources.join(" · ")}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

// ── RiskBanner ─────────────────────────────────
function RiskBanner({ result }: { result: OcrAnalysisResultExtended }) {
  const cfg = RISK_CONFIG[result.risk_summary.overall_risk];
  const { high_risk_count, moderate_risk_count, safe_count } = result.risk_summary;
  const total = result.ingredients.length;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, borderColor: cfg.border, bgcolor: cfg.bg, p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {RISK_ICON[result.risk_summary.overall_risk]}
        <Typography fontWeight={700} sx={{ fontSize: "0.95rem" }}>
          Overall: <span style={{ color: cfg.color }}>{cfg.label}</span>
        </Typography>
        <Chip label={`${total} identified`} size="small" variant="outlined"
          sx={{ ml: "auto", fontSize: "0.62rem", height: 20 }} />
        <Tooltip title={`Scanned in ${result.processing_ms}ms on your device`}>
          <Chip
            icon={<SpeedIcon sx={{ fontSize: "0.75rem !important" }} />}
            label={`${result.processing_ms}ms`} size="small"
            sx={{ fontSize: "0.6rem", height: 20, bgcolor: "action.hover" }} />
        </Tooltip>
      </Box>

      {/* Progress bars */}
      <Stack spacing={0.75}>
        {[
          { label: "High risk", count: high_risk_count, color: "#ef4444" },
          { label: "Moderate", count: moderate_risk_count, color: "#f97316" },
          { label: "Safe", count: safe_count, color: "#22c55e" },
        ].map(({ label, count, color }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption"
              sx={{ width: 72, color: "text.secondary", fontSize: "0.68rem", flexShrink: 0 }}>
              {label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={total > 0 ? (count / total) * 100 : 0}
              sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.06)", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }}
            />
            <Typography variant="caption" fontWeight={700}
              sx={{ width: 20, textAlign: "right", color, fontSize: "0.72rem", flexShrink: 0 }}>
              {count}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* Verdict */}
      {result.ai_verdict && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: cfg.border }}>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: "0.75rem" }}>
            {result.ai_verdict}
          </Typography>
        </Box>
      )}

      {/* Top concerns */}
      {result.risk_summary.top_concerns.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.25 }} useFlexGap>
          {result.risk_summary.top_concerns.map((c) => (
            <Chip key={c} label={c} size="small"
              sx={{ bgcolor: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: "0.65rem", height: 20 }} />
          ))}
        </Stack>
      )}

      {/* Natural ingredients */}
      {result.detected_natural.length > 0 && (
        <Box sx={{ mt: 1.25, pt: 1.25, borderTop: "1px solid", borderColor: cfg.border }}>
          <Typography variant="caption"
            sx={{ fontWeight: 700, fontSize: "0.62rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
            Natural ingredients detected
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
            {result.detected_natural.map((n) => (
              <Chip key={n} label={n} size="small"
                sx={{ bgcolor: "#22c55e22", color: "#16a34a", border: "1px solid #86efac", fontSize: "0.62rem", height: 18 }} />
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

// ── Main OcrScanner ────────────────────────────
export function OcrScanner({ userId }: { userId?: string }) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<OcrAnalysisResultExtended | null>(null);
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");
  const [workerReady, setWorkerReady] = useState(false);

  const { videoRef, status: camStatus, error: camError, startCamera, captureFrame } = useOcrCamera();

  const { mutate: analyze, isPending: analyzing, error: analyzeError } = useOcrAnalyze({
    onSuccess: (data) => setResult(data),
  });

  // Pre-warm Tesseract the moment component mounts
  useEffect(() => {
    prewarmOcrWorker();
    startCamera();
    const t = setTimeout(() => setWorkerReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Capture from camera ──────────────────────
  const handleCapture = useCallback(async () => {
    const processed = await captureFrame();
    if (!processed) return;
    setCapturedImage(`data:image/jpeg;base64,${processed.base64}`);
    setResult(null);
    analyze({ imageBase64: processed?.base64, mimeType: "image/jpeg" });
  }, [captureFrame, analyze]);

  // ── Upload from file ─────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Image must be under 4 MB"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setResult(null);
      try {
        const processed = await processDataUrl(dataUrl);
        analyze({ imageBase64: processed.base64, mimeType: "image/jpeg" });
      } catch { /* silent */ }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [analyze]);

  // ── Reset ────────────────────────────────────
  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setFilterRisk("all");
  }, []);

  const filteredIngredients = (result?.ingredients ?? [])
    .filter((i) => filterRisk === "all" || i.risk === filterRisk)
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);

  // ─────────────────────────────────────────────
  // RENDER A: Camera / capture phase
  // ─────────────────────────────────────────────
  if (!capturedImage) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#000", position: "relative" }}>
        {/* Video */}
        <video ref={videoRef} playsInline muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: camStatus === "active" ? "block" : "none" }} />

        {/* Status overlays */}
        {camStatus !== "active" && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "#fff", p: 3, textAlign: "center" }}>
            {camStatus === "idle" && (
              <>
                <Typography fontSize="3rem">🔬</Typography>
                <Typography variant="h6" fontWeight={700}>Ingredient Scanner</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, maxWidth: 280 }}>
                  Point at any ingredient label. Analysis runs entirely on your device — no data sent anywhere.
                </Typography>
                <Button variant="contained" size="large" startIcon={<CameraAltIcon />}
                  onClick={startCamera}
                  sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700, mt: 1 }}>
                  Start Camera
                </Button>
                <Typography variant="caption" sx={{ opacity: workerReady ? 0.5 : 0.8, transition: "opacity 0.5s" }}>
                  {workerReady ? "✓ Scanner ready" : "Preparing scanner engine…"}
                </Typography>
              </>
            )}
            {camStatus === "requesting" && (
              <><CircularProgress color="inherit" size={36} /><Typography variant="body2">Requesting camera…</Typography></>
            )}
            {(camStatus === "denied" || camStatus === "error" || camStatus === "unsupported") && (
              <>
                <Typography fontSize="2.5rem">📷</Typography>
                <Typography variant="body1" fontWeight={700}>Camera unavailable</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 280 }}>
                  {camError ?? "Use the upload button below to analyse a photo from your gallery."}
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Viewfinder overlay */}
        {camStatus === "active" && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)" }} />
            <Box sx={{
              position: "relative", width: "85%", maxWidth: 380, aspectRatio: "16/5",
              border: "2px solid rgba(255,255,255,0.8)", borderRadius: 2,
              "&::before": { content: '""', position: "absolute", top: -2, left: -2, width: 20, height: 20, borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "4px 0 0 0" },
              "&::after": { content: '""', position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 0 4px 0" },
            }} />
            <Typography variant="caption" sx={{ mt: 2.5, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.7)", fontSize: "0.78rem" }}>
              Frame the ingredient list — then tap Capture
            </Typography>
          </Box>
        )}

        {/* Bottom controls */}
        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 2.5, pb: 3, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)", display: "flex", gap: 1.5, alignItems: "center" }}>
          <Tooltip title="Upload from gallery">
            <Box component="label" htmlFor="ocr-file-upload"
              sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(8px)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
              <UploadFileIcon fontSize="small" />
              <input id="ocr-file-upload" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFileUpload} />
            </Box>
          </Tooltip>

          <Button variant="contained" size="large" fullWidth startIcon={<CameraAltIcon />}
            onClick={handleCapture} disabled={camStatus !== "active"}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: "none", fontSize: "1rem", py: 1.5, bgcolor: "rgba(255,255,255,0.92)", color: "#111", "&:hover": { bgcolor: "#fff" }, "&:disabled": { bgcolor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.5)" } }}>
            Capture & Analyse
          </Button>
        </Box>
      </Box>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER B: Results phase
  // ─────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
      {/* Preview strip */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={capturedImage} alt="Captured ingredient label"
          style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <Button variant="contained" size="small" startIcon={<ReplayIcon fontSize="small" />}
            onClick={handleReset}
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 600, fontSize: "0.75rem", bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", "&:hover": { bgcolor: "rgba(0,0,0,0.75)" } }}>
            Scan again
          </Button>
        </Box>
      </Box>

      {/* Scrollable results */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>

        {/* Analyzing */}
        {analyzing && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 5, gap: 2 }}>
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary">Reading ingredients…</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", maxWidth: 260 }}>
              Tesseract OCR running on your device — completely private, zero network requests
            </Typography>
          </Box>
        )}

        {/* Error */}
        {analyzeError && !analyzing && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}
            action={<Button color="inherit" size="small" onClick={handleReset} sx={{ textTransform: "none" }}>Try again</Button>}>
            {(analyzeError as Error & { code?: string }).code === "NO_TEXT_FOUND"
              ? "No text detected — try better lighting or hold the camera steady."
              : (analyzeError as Error & { code?: string }).code === "NO_INGREDIENTS_FOUND"
                ? "Couldn't find an ingredient list. Point at the ingredients section of the label."
                : `Analysis failed: ${analyzeError.message}`}
          </Alert>
        )}

        {/* Results */}
        {result && !analyzing && (
          <Stack spacing={2}>
            <RiskBanner result={result} />

            {/* Filter chips */}
            <Box>
              <Typography variant="caption"
                sx={{ fontWeight: 700, letterSpacing: "0.06em", color: "text.secondary", fontSize: "0.65rem", textTransform: "uppercase", display: "block", mb: 0.75 }}>
                Filter by risk
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {(["all", "high", "moderate", "low", "safe"] as const).map((level) => {
                  const isActive = filterRisk === level;
                  const cfg = level !== "all" ? RISK_CONFIG[level] : null;
                  const count = level === "all"
                    ? result.ingredients.length
                    : result.ingredients.filter((i) => i.risk === level).length;
                  if (count === 0 && level !== "all") return null;
                  return (
                    <Chip key={level}
                      label={`${level === "all" ? "All" : cfg!.label} (${count})`}
                      size="small" onClick={() => setFilterRisk(level)}
                      sx={{
                        fontSize: "0.68rem", height: 24, cursor: "pointer", transition: "all 0.15s",
                        fontWeight: isActive ? 700 : 500,
                        bgcolor: isActive ? (cfg?.color ?? "primary.main") : (cfg ? `${cfg.color}18` : "action.selected"),
                        color: isActive ? "#fff" : (cfg?.color ?? "text.primary"),
                        border: "1px solid",
                        borderColor: isActive ? (cfg?.color ?? "primary.main") : (cfg?.border ?? "divider"),
                      }} />
                  );
                })}
              </Stack>
            </Box>

            {/* Ingredient cards */}
            <Stack spacing={0.75}>
              {filteredIngredients.length === 0
                ? <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  No ingredients match this filter.
                </Typography>
                : filteredIngredients.map((item, i) => (
                  <IngredientCard key={`${item.name}-${i}`} item={item} />
                ))
              }
            </Stack>

            {/* Raw OCR debug */}
            {result?.ocr?.ingredient_section && (
              <Box>
                <Typography variant="caption"
                  sx={{ fontWeight: 700, letterSpacing: "0.06em", color: "text.disabled", fontSize: "0.62rem", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                  Raw OCR · confidence {Math.round(result.ocr.confidence * 100)}% · {result.raw_tokens.length} tokens parsed
                </Typography>
                <Typography variant="caption" color="text.disabled"
                  sx={{ fontSize: "0.68rem", lineHeight: 1.5, fontFamily: "monospace", display: "block", p: 1, bgcolor: "action.hover", borderRadius: 1, whiteSpace: "pre-wrap" }}>
                  {result.ocr.ingredient_section}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
