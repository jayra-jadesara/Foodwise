// ─────────────────────────────────────────────
// FoodWise · OCR · OcrScanner
// Full ingredient label scanner: camera → capture
// → preprocessing → analysis → risk report
// ─────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Chip,
  Stack,
  Alert,
  Divider,
  IconButton,
  Collapse,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ReplayIcon from "@mui/icons-material/Replay";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { useOcrCamera } from "../hooks/use-ocr-camera";
import { useOcrAnalyze } from "../queries/use-ocr";
import { processDataUrl } from "../utils/image-preprocessor";
import type { OcrAnalysisResult, IngredientAnnotation, RiskLevel } from "../types";

// ── Risk styling map ───────────────────────────
const RISK_CONFIG: Record<
  RiskLevel,
  { color: string; bg: string; border: string; label: string }
> = {
  high:     { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", label: "High Risk" },
  moderate: { color: "#f97316", bg: "#fff7ed", border: "#fdba74", label: "Moderate" },
  low:      { color: "#eab308", bg: "#fefce8", border: "#fde047", label: "Low Risk" },
  safe:     { color: "#22c55e", bg: "#f0fdf4", border: "#86efac", label: "Safe" },
  unknown:  { color: "#94a3b8", bg: "#f8fafc", border: "#cbd5e1", label: "Unknown" },
};

const OVERALL_RISK_ICON: Record<RiskLevel, React.ReactNode> = {
  high:     <WarningAmberIcon sx={{ color: "#ef4444" }} />,
  moderate: <WarningAmberIcon sx={{ color: "#f97316" }} />,
  low:      <InfoOutlinedIcon sx={{ color: "#eab308" }} />,
  safe:     <CheckCircleOutlineIcon sx={{ color: "#22c55e" }} />,
  unknown:  <InfoOutlinedIcon sx={{ color: "#94a3b8" }} />,
};

// ── Sub-components ─────────────────────────────

function IngredientCard({ item }: { item: IngredientAnnotation }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[item.risk];

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: cfg.border,
        bgcolor: cfg.bg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          cursor: item.reason || item.alternatives?.length ? "pointer" : "default",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Risk pill */}
        <Chip
          label={cfg.label}
          size="small"
          sx={{
            bgcolor: cfg.color,
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.6rem",
            height: 18,
            flexShrink: 0,
            textTransform: "uppercase",
          }}
        />

        {/* Name */}
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ flex: 1, fontSize: "0.82rem", textTransform: "capitalize" }}
        >
          {item.name}
        </Typography>

        {/* Category tag */}
        <Chip
          label={item.category}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "0.6rem",
            height: 18,
            color: "text.secondary",
            borderColor: "divider",
            flexShrink: 0,
            textTransform: "capitalize",
          }}
        />

        {/* Expand toggle */}
        {(item.reason || (item.alternatives?.length ?? 0) > 0) && (
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ px: 1.5, py: 1 }}>
          {item.reason && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: item.alternatives?.length ? 1 : 0, lineHeight: 1.5 }}
            >
              {item.reason}
            </Typography>
          )}

          {item.alternatives && item.alternatives.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  color: "text.secondary",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Alternatives
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                {item.alternatives.map((alt) => (
                  <Chip
                    key={alt}
                    label={alt}
                    size="small"
                    sx={{
                      bgcolor: "#22c55e22",
                      color: "#16a34a",
                      border: "1px solid #86efac",
                      fontSize: "0.65rem",
                      height: 20,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

function RiskSummaryBanner({ result }: { result: OcrAnalysisResult }) {
  const cfg = RISK_CONFIG[result.risk_summary.overall_risk];
  const { high_risk_count, moderate_risk_count, safe_count } = result.risk_summary;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: cfg.border,
        bgcolor: cfg.bg,
        p: 2,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {OVERALL_RISK_ICON[result.risk_summary.overall_risk]}
        <Typography fontWeight={700} sx={{ fontSize: "0.95rem" }}>
          Overall:{" "}
          <span style={{ color: cfg.color }}>{cfg.label}</span>
        </Typography>
        <Chip
          label={`${result.ingredients.length} ingredients`}
          size="small"
          variant="outlined"
          sx={{ ml: "auto", fontSize: "0.65rem", height: 20 }}
        />
      </Box>

      {/* Count bars */}
      <Stack spacing={0.75}>
        {[
          { label: "High risk", count: high_risk_count, color: "#ef4444" },
          { label: "Moderate", count: moderate_risk_count, color: "#f97316" },
          { label: "Safe", count: safe_count, color: "#22c55e" },
        ].map(({ label, count, color }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{ width: 76, color: "text.secondary", fontSize: "0.68rem", flexShrink: 0 }}
            >
              {label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={result.ingredients.length > 0 ? (count / result.ingredients.length) * 100 : 0}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: "rgba(0,0,0,0.06)",
                "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
              }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ width: 20, textAlign: "right", color, fontSize: "0.72rem", flexShrink: 0 }}
            >
              {count}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* AI verdict */}
      {result.ai_verdict && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: cfg.border }}>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: "0.75rem" }}>
            {result.ai_verdict}
          </Typography>
        </Box>
      )}

      {/* Top concerns */}
      {result.risk_summary.top_concerns.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.25 }}>
          {result.risk_summary.top_concerns.map((concern) => (
            <Chip
              key={concern}
              label={concern}
              size="small"
              sx={{
                bgcolor: `${cfg.color}18`,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                fontSize: "0.65rem",
                height: 20,
              }}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ── Sort order for ingredients ─────────────────
const RISK_ORDER: Record<RiskLevel, number> = {
  high: 0, moderate: 1, low: 2, unknown: 3, safe: 4,
};

// ── Main component ─────────────────────────────
export function OcrScanner({ userId }: { userId?: string }) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // preview dataUrl
  const [analysisResult, setAnalysisResult] = useState<OcrAnalysisResult | null>(null);
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");

  const { videoRef, status: camStatus, error: camError, startCamera, captureFrame } =
    useOcrCamera();

  const { mutate: analyze, isPending: analyzing, error: analyzeError } = useOcrAnalyze({
    onSuccess: (data) => {
      setAnalysisResult(data);
    },
  });

  // ── Capture from camera ──────────────────────
  const handleCapture = useCallback(async () => {
    const processed = await captureFrame();
    if (!processed) return;

    const previewUrl = `data:image/jpeg;base64,${processed.base64}`;
    setCapturedImage(previewUrl);
    setAnalysisResult(null);

    analyze({
      imageBase64: processed.base64,   // ← raw base64, no data: prefix
      mimeType: "image/jpeg",
    });
  }, [captureFrame, analyze]);

  // ── Upload from file ─────────────────────────
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate client-side
      if (file.size > 4 * 1024 * 1024) {
        alert("Image must be under 4 MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        setCapturedImage(dataUrl);
        setAnalysisResult(null);

        try {
          const processed = await processDataUrl(dataUrl);
          analyze({
            imageBase64: processed.base64,
            mimeType: "image/jpeg",
          });
        } catch {
          console.error("Image processing failed");
        }
      };
      reader.readAsDataURL(file);

      // Reset input so the same file can be re-uploaded
      e.target.value = "";
    },
    [analyze]
  );

  // ── Reset all state ──────────────────────────
  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setFilterRisk("all");
  }, []);

  // ── Filtered & sorted ingredients ───────────
  const filteredIngredients = (analysisResult?.ingredients ?? [])
    .filter((i) => filterRisk === "all" || i.risk === filterRisk)
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);

  // ─────────────────────────────────────────────
  // RENDER: camera phase
  // ─────────────────────────────────────────────
  if (!capturedImage) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "#000",
          position: "relative",
        }}
      >
        {/* Camera feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: camStatus === "active" ? "block" : "none",
          }}
        />

        {/* Status overlays */}
        {camStatus !== "active" && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              color: "#fff",
              p: 3,
              textAlign: "center",
            }}
          >
            {camStatus === "idle" && (
              <>
                <Typography fontSize="3rem">🔬</Typography>
                <Typography variant="h6" fontWeight={700}>
                  Ingredient Scanner
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, maxWidth: 280 }}>
                  Point your camera at a product&apos;s ingredient list to get an AI-powered health analysis.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CameraAltIcon />}
                  onClick={startCamera}
                  sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700, mt: 1 }}
                >
                  Start Camera
                </Button>
              </>
            )}
            {camStatus === "requesting" && (
              <>
                <CircularProgress color="inherit" size={36} />
                <Typography variant="body2">Requesting camera…</Typography>
              </>
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

        {/* Live viewfinder guide overlay */}
        {camStatus === "active" && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {/* Vignette */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)",
              }}
            />
            {/* Guide box */}
            <Box
              sx={{
                position: "relative",
                width: "85%",
                maxWidth: 380,
                aspectRatio: "16/6",
                border: "2px solid rgba(255,255,255,0.8)",
                borderRadius: 2,
                "&::before, &::after": {
                  content: '""',
                  position: "absolute",
                  width: 18,
                  height: 18,
                  borderColor: "#fff",
                  borderStyle: "solid",
                },
                "&::before": { top: -2, left: -2, borderWidth: "3px 0 0 3px", borderRadius: "4px 0 0 0" },
                "&::after":  { bottom: -2, right: -2, borderWidth: "0 3px 3px 0", borderRadius: "0 0 4px 0" },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                mt: 2.5,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                fontSize: "0.78rem",
              }}
            >
              Frame the ingredient list — then tap Capture
            </Typography>
          </Box>
        )}

        {/* Bottom controls */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2.5,
            pb: 3,
            background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
            display: "flex",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          {/* Upload button */}
          <Tooltip title="Upload from gallery">
            <Box
              component="label"
              htmlFor="ocr-file-upload"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                cursor: "pointer",
                flexShrink: 0,
                backdropFilter: "blur(8px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              <UploadFileIcon fontSize="small" />
              <input
                id="ocr-file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </Box>
          </Tooltip>

          {/* Capture button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<CameraAltIcon />}
            onClick={handleCapture}
            disabled={camStatus !== "active"}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              py: 1.5,
              bgcolor: "rgba(255,255,255,0.92)",
              color: "#111",
              "&:hover": { bgcolor: "#fff" },
              "&:disabled": { bgcolor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.5)" },
            }}
          >
            Capture & Analyse
          </Button>
        </Box>
      </Box>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: analysis phase
  // ─────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
      {/* Captured image preview strip */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt="Captured ingredient label"
          style={{
            width: "100%",
            maxHeight: 180,
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Scan again overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<ReplayIcon fontSize="small" />}
            onClick={handleReset}
            sx={{
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
            }}
          >
            Scan again
          </Button>
        </Box>
      </Box>

      {/* Scrollable results area */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {/* Analyzing state */}
        {analyzing && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 5, gap: 2 }}>
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary">
              Reading ingredients with AI…
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center" }}>
              Google Vision is extracting text, then GPT-4o-mini is analysing each ingredient
            </Typography>
          </Box>
        )}

        {/* Error state */}
        {analyzeError && !analyzing && (
          <Alert
            severity="error"
            sx={{ borderRadius: 2, mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleReset}
                sx={{ textTransform: "none" }}
              >
                Try again
              </Button>
            }
          >
            {analyzeError.message.includes("NO_TEXT_FOUND")
              ? "No text detected — try better lighting or a clearer photo."
              : analyzeError.message.includes("NO_INGREDIENTS_FOUND")
              ? "Couldn't find an ingredient list — make sure the label is visible."
              : `Analysis failed: ${analyzeError.message}`}
          </Alert>
        )}

        {/* Results */}
        {analysisResult && !analyzing && (
          <Stack spacing={2}>
            {/* Risk summary */}
            <RiskSummaryBanner result={analysisResult} />

            {/* Filter chips */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "text.secondary",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  display: "block",
                  mb: 0.75,
                }}
              >
                Filter by risk
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {(["all", "high", "moderate", "low", "safe", "unknown"] as const).map((level) => {
                  const isActive = filterRisk === level;
                  const cfg = level !== "all" ? RISK_CONFIG[level] : null;
                  const count =
                    level === "all"
                      ? analysisResult.ingredients.length
                      : analysisResult.ingredients.filter((i) => i.risk === level).length;
                  if (count === 0 && level !== "all") return null;
                  return (
                    <Chip
                      key={level}
                      label={`${level === "all" ? "All" : RISK_CONFIG[level as RiskLevel].label} (${count})`}
                      size="small"
                      onClick={() => setFilterRisk(level)}
                      sx={{
                        fontSize: "0.68rem",
                        height: 24,
                        fontWeight: isActive ? 700 : 500,
                        bgcolor: isActive
                          ? cfg?.color ?? "primary.main"
                          : cfg
                          ? `${cfg.color}18`
                          : "action.selected",
                        color: isActive ? "#fff" : cfg?.color ?? "text.primary",
                        border: "1px solid",
                        borderColor: isActive
                          ? cfg?.color ?? "primary.main"
                          : cfg?.border ?? "divider",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* Ingredient cards */}
            <Stack spacing={0.75}>
              {filteredIngredients.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  No ingredients match this filter.
                </Typography>
              ) : (
                filteredIngredients.map((ingredient, i) => (
                  <IngredientCard key={`${ingredient.name}-${i}`} item={ingredient} />
                ))
              )}
            </Stack>

            {/* OCR raw text (collapsed) */}
            {analysisResult.ocr.ingredient_section && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "text.disabled",
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Raw OCR text · confidence {Math.round(analysisResult.ocr.confidence * 100)}%
                </Typography>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    fontSize: "0.68rem",
                    lineHeight: 1.5,
                    fontFamily: "monospace",
                    display: "block",
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                  }}
                >
                  {analysisResult.ocr.ingredient_section}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
