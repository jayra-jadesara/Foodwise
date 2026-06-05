// ─────────────────────────────────────────────
// FoodWise · Scanner · ScannerView
// Four-tab scanner: barcode | ingredients | manual | history
// ─────────────────────────────────────────────

"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Fade,
  Tooltip,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import HistoryIcon from "@mui/icons-material/History";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import CameraIcon from "@mui/icons-material/Camera";

import { useCamera } from "../hooks/use-camera";
import { useBarcodeScan, useScanHistory } from "../queries/use-scanner";
import { ScanResultSheet } from "./ScanResultSheet";
import { ManualEntryForm } from "./ManualEntryForm";
import { ScanHistoryList } from "./ScanHistoryList";

// OCR module — cross-feature import via barrel
import { OcrScanner } from "@/features/ocr/components/OcrScanner";

import type { ScanResult, BarcodeResult } from "../types";

type TabValue = "barcode" | "ocr" | "manual" | "history";

interface Props {
  userId?: string;
  onAddToList?: (result: ScanResult) => void;
  onCompare?: (result: ScanResult) => void;
}

export function ScannerView({ userId, onAddToList, onCompare }: Props) {
  const [tab, setTab] = useState<TabValue>("barcode");
  const [torchOn, setTorchOn] = useState(false);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "info";
  }>({ open: false, message: "", severity: "error" });

  // ── Barcode scan mutation ──────────────────
  const { mutate: scanBarcode, isPending: scanning } = useBarcodeScan({
    onSuccess: (data) => {
      setCurrentResult(data);
      setResultSheetOpen(true);
    },
    onError: (err) => {
      const code = (err as Error & { code?: string }).code;
      const message =
        code === "NOT_FOUND"
          ? "Product not found in database."
          : code === "INVALID_BARCODE"
            ? "Invalid barcode. Try scanning again."
            : "Something went wrong. Please try again.";
      setSnackbar({ open: true, message, severity: "error" });
    },
  });

  // ── Camera hook (barcode tab only) ────────
  const handleBarcodeDetected = useCallback(
    (result: BarcodeResult) => {
      if (scanning) return;
      scanBarcode(result.rawValue);
    },
    [scanBarcode, scanning]
  );

  const { videoRef, status: cameraStatus, startCamera } = useCamera({
    onDetected: handleBarcodeDetected,
    enabled: tab === "barcode",
  });

  // ── Scan history ──────────────────────────
  const { data: history, isLoading: historyLoading } = useScanHistory(userId);

  // ── Torch toggle ──────────────────────────
  const toggleTorch = async () => {
    const track = (
      videoRef.current?.srcObject as MediaStream
    )?.getVideoTracks()?.[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn((v) => !v);
    } catch {
      // Torch not supported — silently ignore
    }
  };

  const handleAddToList = (result: ScanResult) => {
    // We will build the full Grocery List module next, 
    // but for now, let's show a success message.
    setSnackbar({
      open: true,
      message: `Added ${result.product.name} to your Grocery List!`,
      severity: "info"
    });
    setResultSheetOpen(false);
  };

  const handleCompare = (result: ScanResult) => {
    // This will eventually open the Compare screen
    setSnackbar({
      open: true,
      message: "Added to comparison. Scan another product to compare!",
      severity: "info"
    });
    setResultSheetOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      {/* ── Tab bar ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabValue)}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          flexShrink: 0,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            minHeight: 48,
            fontSize: "0.78rem",
          },
        }}
      >
        <Tab
          value="barcode"
          icon={<QrCodeScannerIcon fontSize="small" />}
          iconPosition="start"
          label="Barcode"
        />
        <Tab
          value="ocr"
          icon={<CameraIcon fontSize="small" />}
          iconPosition="start"
          label="Ingredients"
        />
        <Tab
          value="manual"
          icon={<KeyboardIcon fontSize="small" />}
          iconPosition="start"
          label="Manual"
        />
        <Tab
          value="history"
          icon={<HistoryIcon fontSize="small" />}
          iconPosition="start"
          label={history?.length ? `History (${history.length})` : "History"}
        />
      </Tabs>

      {/* ── Content area ── */}
      <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* ── TAB: Barcode camera ── */}
        {tab === "barcode" && (
          <Box
            sx={{
              height: "100%",
              bgcolor: "#000",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: cameraStatus === "active" ? "block" : "none",
              }}
            />

            {/* Camera status overlays */}
            {cameraStatus !== "active" && (
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
                {cameraStatus === "requesting" && (
                  <>
                    <CircularProgress color="inherit" size={40} />
                    <Typography variant="body2">Requesting camera access…</Typography>
                  </>
                )}
                {cameraStatus === "denied" && (
                  <>
                    <Typography fontSize="2.5rem">🚫</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      Camera access denied
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Enable camera in browser settings or use Manual entry.
                    </Typography>
                  </>
                )}
                {(cameraStatus === "unsupported" || cameraStatus === "error") && (
                  <>
                    <Typography fontSize="2.5rem">📷</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      Camera unavailable
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Use Manual barcode entry instead.
                    </Typography>
                  </>
                )}
                {cameraStatus === "idle" && (
                  <>
                    <QrCodeScannerIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Starting camera…
                    </Typography>
                  </>
                )}
              </Box>
            )}

            {/* Viewfinder overlay */}
            {cameraStatus === "active" && (
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
                      "radial-gradient(ellipse 60% 40% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)",
                  }}
                />

                {/* Scan frame */}
                <Box
                  sx={{
                    position: "relative",
                    width: "72%",
                    maxWidth: 320,
                    aspectRatio: "3/2",
                    borderRadius: 3,
                    border: scanning
                      ? "2px solid rgba(34,197,94,0.9)"
                      : "2px solid rgba(255,255,255,0.7)",
                    transition: "border-color 0.3s",
                    boxShadow: scanning
                      ? "0 0 0 2px rgba(34,197,94,0.25), 0 0 24px rgba(34,197,94,0.3)"
                      : "none",
                    overflow: "hidden",
                  }}
                >
                  {/* Corner accents */}
                  {[
                    { top: -1, left: -1, borderTop: "3px solid", borderLeft: "3px solid" },
                    { top: -1, right: -1, borderTop: "3px solid", borderRight: "3px solid" },
                    { bottom: -1, left: -1, borderBottom: "3px solid", borderLeft: "3px solid" },
                    { bottom: -1, right: -1, borderBottom: "3px solid", borderRight: "3px solid" },
                  ].map((style, i) => (
                    <Box
                      key={i}
                      sx={{
                        position: "absolute",
                        width: 20,
                        height: 20,
                        borderColor: scanning
                          ? "rgba(34,197,94,1)"
                          : "rgba(255,255,255,1)",
                        borderRadius: 0.5,
                        transition: "border-color 0.3s",
                        ...style,
                      }}
                    />
                  ))}

                  {/* Laser sweep */}
                  {!scanning && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: "10%",
                        right: "10%",
                        height: 2,
                        bgcolor: "rgba(255,80,80,0.85)",
                        borderRadius: 1,
                        boxShadow: "0 0 6px rgba(255,80,80,0.8)",
                        animation: "laserSweep 2s ease-in-out infinite",
                        "@keyframes laserSweep": {
                          "0%": { top: "15%", opacity: 0.4 },
                          "50%": { opacity: 1 },
                          "100%": { top: "82%", opacity: 0.4 },
                        },
                      }}
                    />
                  )}

                  {/* Processing spinner */}
                  {scanning && (
                    <Fade in>
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(0,0,0,0.2)",
                        }}
                      >
                        <CircularProgress
                          size={32}
                          sx={{ color: "rgba(34,197,94,0.9)" }}
                        />
                      </Box>
                    </Fade>
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    mt: 2.5,
                    color: "rgba(255,255,255,0.85)",
                    textAlign: "center",
                    fontSize: "0.78rem",
                    letterSpacing: "0.02em",
                    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                  }}
                >
                  {scanning
                    ? "Looking up product…"
                    : "Align barcode inside the frame"}
                </Typography>
              </Box>
            )}

            {/* Torch button */}
            {cameraStatus === "active" && (
              <Box sx={{ position: "absolute", bottom: 24, right: 20 }}>
                <Tooltip title={torchOn ? "Torch off" : "Torch on"}>
                  <IconButton
                    onClick={toggleTorch}
                    sx={{
                      bgcolor: torchOn
                        ? "rgba(255,220,50,0.9)"
                        : "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                      color: torchOn ? "#000" : "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                    }}
                  >
                    {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        )}

        {/* ── TAB: OCR ingredient scanner ── */}
        {tab === "ocr" && (
          <Box sx={{ height: "100%", overflow: "hidden" }}>
            <OcrScanner userId={userId} />
          </Box>
        )}

        {/* ── TAB: Manual entry ── */}
        {tab === "manual" && (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 3,
            }}
          >
            <ManualEntryForm
              onSubmit={(b) => scanBarcode(b)}
              loading={scanning}
            />
          </Box>
        )}

        {/* ── TAB: Scan history ── */}
        {tab === "history" && (
          <Box sx={{ height: "100%", overflowY: "auto" }}>
            <ScanHistoryList
              items={history ?? []}
              loading={historyLoading}
              onSelect={(barcode) => {
                setTab("barcode");
                scanBarcode(barcode);
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Result sheet ── */}
      <ScanResultSheet
        open={resultSheetOpen}
        onClose={() => setResultSheetOpen(false)}
        result={currentResult}
        loading={scanning}
        // onAddToList={onAddToList}
        // onCompare={onCompare}
        onAddToList={handleAddToList}
        onCompare={handleCompare}
      />

      {/* ── Error snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
