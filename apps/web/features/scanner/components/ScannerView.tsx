"use client";

import { useState, useCallback } from "react";
import {
  Box, Typography, IconButton, Snackbar, Alert, Paper, BottomNavigation, BottomNavigationAction
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Design Icons
import HelpOutlineIcon from "@mui/icons-material/Help";
import FlashlightOnIcon from "@mui/icons-material/FlashlightOn";
import FlashlightOffIcon from "@mui/icons-material/FlashlightOff";
import ImageIcon from "@mui/icons-material/Image";
import KeyboardAltIcon from "@mui/icons-material/KeyboardAlt";
import BarcodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";
import GroupIcon from "@mui/icons-material/Group";

// Logic Hooks
import { useCamera } from "../hooks/use-camera";
import { useBarcodeScan, useScanHistory } from "../queries/use-scanner";
import { ScanResultSheet } from "./ScanResultSheet";
import { ManualEntryForm } from "./ManualEntryForm";
import { ScanHistoryList } from "./ScanHistoryList";
import { OcrScanner } from "@/features/ocr/components/OcrScanner";

import type { ScanResult, BarcodeResult } from "../types";
import { PhotoPicker } from "./PhotoPicker";
import { useOcrAnalyze } from "@/features/ocr";

type TabValue = "barcode" | "ocr" | "manual" | "history";

export function ScannerView({ userId }: { userId?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>("barcode");
  const [torchOn, setTorchOn] = useState(false);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "info";
  }>({ open: false, message: "", severity: "error" });

  const { mutate: scanBarcode, isPending: scanning } = useBarcodeScan({
    onSuccess: (data) => {
      setCurrentResult(data);
      setResultSheetOpen(true);
    },
    onError: () => {
      setSnackbar({ open: true, message: "Product not found.", severity: "error" });
    },
  });

  const { mutate: analyzeIngredients, isPending: analyzingOcr } = useOcrAnalyze({
    onSuccess: (data) => {
      // When gallery photo is analyzed, show the result sheet
      setCurrentResult(data as any);
      setResultSheetOpen(true);
    },
    onError: () => {
      setSnackbar({ open: true, message: "Could not read ingredients from photo.", severity: "error" });
    }
  });

  const handleOpenGallery = async () => {
    if (Capacitor.isNativePlatform()) {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      if (image.base64String) {
        // ✅ Now "analyzeIngredients" is defined!
        setTab("ocr"); // Switch to ingredients tab view
        analyzeIngredients({ imageBase64: image.base64String });
      }
    } else {
      setGalleryOpen(true);
    }
  };

  const handleDetected = useCallback((result: BarcodeResult) => {
    if (scanning) return;
    scanBarcode(result.rawValue);
  }, [scanBarcode, scanning]);

  const { videoRef, status: cameraStatus } = useCamera({
    onDetected: handleDetected,
    enabled: tab === "barcode",
  });

  // ── REFINED FLASHLIGHT LOGIC ──────────────────
  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const track = stream?.getVideoTracks()?.[0];

    if (!track) return;

    // Check for torch capability
    const capabilities = track.getCapabilities() as any;

    if (!capabilities.torch) {
      setSnackbar({
        open: true,
        message: "Flashlight not supported on this device/browser.",
        severity: "info"
      });
      return;
    }

    try {
      const newState = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: newState } as any]
      });
      setTorchOn(newState);
    } catch (e) {
      console.error("Torch control failed", e);
    }
  };

  return (
    <Box sx={{ position: "relative", height: "100vh", bgcolor: "#000", overflow: "hidden" }}>

      {/* ── TOP ACTION BAR ── */}
      <Box sx={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        p: 3, pt: 4, display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(to bottom, rgba(0,22,41,0.8), transparent)"
      }}>
        <IconButton
          onClick={() => router.push("/scan/help")}
          sx={{ bgcolor: "rgba(0,43,73,0.6)", backdropFilter: "blur(10px)", color: "white" }}
        >
          <HelpOutlineIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "white",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {tab === "barcode"
            ? "Scan Barcode"
            : tab === "ocr"
              ? "Scan Ingredients"
              : tab.toUpperCase()}
        </Typography>

        <IconButton
          onClick={toggleTorch}
          sx={{
            // Design: Changes color to green when ON
            bgcolor: torchOn ? "#6bfe9c" : "rgba(0,43,73,0.6)",
            color: torchOn ? "#00210c" : "white",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)"
          }}
        >
          {torchOn ? <FlashlightOffIcon /> : <FlashlightOnIcon />}
        </IconButton>
      </Box>

      {/* ── MAIN VIEWPORT ── */}
      <Box sx={{ position: "absolute", inset: 0 }}>
        {tab === "barcode" && (
          <>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />

            {/* ── PULSING FLASH INDICATOR ── */}
            {torchOn && (
              <Box sx={{
                position: "absolute", bottom: "250px", left: "50%", transform: "translateX(-50%)",
                zIndex: 30, bgcolor: "#6bfe9c", color: "#00210c", px: 2, py: 0.5, borderRadius: 10,
                display: "flex", alignItems: "center", gap: 1, boxShadow: "0 4px 20px rgba(107, 254, 156, 0.4)",
                animation: "pulse 2s infinite",
                "@keyframes pulse": { "0%": { opacity: 0.7 }, "50%": { opacity: 1 }, "100%": { opacity: 0.7 } }
              }}>
                <FlashlightOnIcon sx={{ fontSize: 16 }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 900 }}
                >
                  FLASHLIGHT: ON
                </Typography>
              </Box>
            )}

            {/* Viewfinder Overlay */}
            <Box sx={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", boxShadow: "0 0 0 9999px rgba(0,22,41,0.65)"
            }}>
              <Box sx={{ position: "relative", width: 360, height: 260, borderRadius: 4, border: "2px solid rgba(107, 254, 156, 0.3)" }}>
                <Box sx={{ position: "absolute", top: -4, left: -4, width: 40, height: 40, borderTop: "4px solid #6bfe9c", borderLeft: "4px solid #6bfe9c", borderRadius: "12px 0 0 0" }} />
                <Box sx={{ position: "absolute", top: -4, right: -4, width: 40, height: 40, borderTop: "4px solid #6bfe9c", borderRight: "4px solid #6bfe9c", borderRadius: "0 12px 0 0" }} />
                <Box sx={{ position: "absolute", bottom: -4, left: -4, width: 40, height: 40, borderBottom: "4px solid #6bfe9c", borderLeft: "4px solid #6bfe9c", borderRadius: "0 0 0 12px" }} />
                <Box sx={{ position: "absolute", bottom: -4, right: -4, width: 40, height: 40, borderBottom: "4px solid #6bfe9c", borderRight: "4px solid #6bfe9c", borderRadius: "0 0 12px 0" }} />
                <div className="scan-line" />
              </Box>
              <Typography sx={{ position: "absolute", bottom: "25%", color: "white", opacity: 0.8, fontSize: "0.8rem" }}>
                Align barcode within frame
              </Typography>
            </Box>
          </>
        )}

        {tab === "ocr" && <OcrScanner userId={userId} />}
        {tab === "manual" && <Box sx={{ height: "100%", bgcolor: "background.default", pt: 15, px: 3 }}><ManualEntryForm onSubmit={scanBarcode} onCancel={() => setTab("barcode")} loading={scanning} /></Box>}
        {tab === "history" && <Box sx={{ height: "100%", bgcolor: "background.default", pt: 15 }}><ScanHistoryList items={[]} onSelect={scanBarcode} /></Box>}
      </Box>

      {/* ── FLOATING ACTION BUTTONS ── */}
      {tab === "barcode" && (
        <Box sx={{
          position: "absolute", bottom: 25, left: 0, right: 0, zIndex: 30,
          px: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end"
        }}>
          <IconButton
            onClick={handleOpenGallery}
            sx={{ flexDirection: "column", color: "white", pointerEvents: 'auto' }}
          >
            <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
              <ImageIcon />
            </Box>
            <Typography variant="caption" sx={{ mt: 1, fontWeight: 700 }}>Gallery</Typography>
          </IconButton>

          {/* The Custom Gallery Overlay (Web Fallback) */}
          {galleryOpen && (
            <PhotoPicker
              onCancel={() => setGalleryOpen(false)}
              onSelect={(base64) => {
                setGalleryOpen(false);
                setTab("ocr");
                analyzeIngredients({ imageBase64: base64 });
              }}
            />
          )}

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box className="pulse-element" sx={{
              position: "relative", width: 64, height: 64, borderRadius: "50%",
              bgcolor: "#6bfe9c", display: "flex", alignItems: "center", justifyContent: "center", color: "#00210c"
            }}>
              <BarcodeScannerIcon fontSize="large" />
            </Box>
            <Typography variant="caption" sx={{ color: "#6bfe9c", fontWeight: 700, letterSpacing: 1 }}>
              {scanning ? "PROCCESSING..." : "SCANNING..."}
            </Typography>
          </Box>

          <IconButton onClick={() => setTab("manual")} sx={{ flexDirection: "column", color: "white" }}>
            <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <KeyboardAltIcon />
            </Box>
            <Typography variant="caption" sx={{ mt: 1, fontWeight: 600 }}>Type</Typography>
          </IconButton>
        </Box>
      )}

      {/* ── CUSTOM BOTTOM NAVIGATION ── */}
      <Paper sx={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        bgcolor: "rgba(0,22,41,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.1)"
      }} elevation={0}>
        <BottomNavigation
          showLabels
          value={tab === "barcode" ? "/scan" : `/${tab}`}
          onChange={(_, newValue) => {
            if (newValue === "/scan") setTab("barcode");
            else if (newValue === "/ocr") setTab("ocr");
            else router.push(newValue);
          }}
          sx={{ height: 60, bgcolor: "transparent" }}
        >
          <BottomNavigationAction label="Home" value="/dashboard" icon={<HomeIcon />} sx={{ color: "rgba(255,255,255,0.6)", "&.Mui-selected": { color: "white" } }} />
          <BottomNavigationAction label="Scan" value="/scan" icon={<BarcodeScannerIcon />} sx={{ color: "rgba(255,255,255,0.6)", "&.Mui-selected": { color: "#6bfe9c" } }} />
          <BottomNavigationAction label="Lists" value="/lists" icon={<ListAltIcon />} sx={{ color: "rgba(255,255,255,0.6)", "&.Mui-selected": { color: "white" } }} />
          <BottomNavigationAction label="Family" value="/family" icon={<GroupIcon />} sx={{ color: "rgba(255,255,255,0.6)", "&.Mui-selected": { color: "white" } }} />
        </BottomNavigation>
      </Paper>

      {/* ── MODALS & ALERTS ── */}
      <ScanResultSheet
        open={resultSheetOpen}
        onClose={() => setResultSheetOpen(false)}
        result={currentResult}
        loading={scanning}
        onAddToList={() => alert("Added!")}
        onCompare={() => alert("Comparing...")}
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}