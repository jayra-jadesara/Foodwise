// ─────────────────────────────────────────────
// FoodWise · use-scanner-engine
//
// Strategy:
//  • Capacitor (Android/iOS) → @capacitor-mlkit/barcode-scanning
//    Native ML Kit: <100ms detection, works in dim light
//  • Web browser → @zxing/library raw decode loop
//    Canvas snapshot at rAF, ~300-600ms typical
//
// Both paths fire the same onDetected callback.
// Component code never needs to know which engine ran.
// ─────────────────────────────────────────────

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BarcodeResult } from "../types";

type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

interface UseScannerOptions {
  onDetected: (result: BarcodeResult) => void;
  enabled?: boolean;
  dedupMs?: number;
}

// ── Detect Capacitor environment ──────────────
function isCapacitor(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.()
  );
}

// ── Module-level ZXing cache (avoid re-import) ─
let zxingCache: {
  MultiFormatReader: typeof import("@zxing/library").MultiFormatReader;
  RGBLuminanceSource: typeof import("@zxing/library").RGBLuminanceSource;
  HybridBinarizer: typeof import("@zxing/library").HybridBinarizer;
  BinaryBitmap: typeof import("@zxing/library").BinaryBitmap;
  BarcodeFormat: typeof import("@zxing/library").BarcodeFormat;
  DecodeHintType: typeof import("@zxing/library").DecodeHintType;
} | null = null;

async function getZXing() {
  if (zxingCache) return zxingCache;
  const lib = await import("@zxing/library");
  zxingCache = {
    MultiFormatReader: lib.MultiFormatReader,
    RGBLuminanceSource: lib.RGBLuminanceSource,
    HybridBinarizer: lib.HybridBinarizer,
    BinaryBitmap: lib.BinaryBitmap,
    BarcodeFormat: lib.BarcodeFormat,
    DecodeHintType: lib.DecodeHintType,
  };
  return zxingCache;
}

// ═══════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════
export function useScannerEngine({
  onDetected,
  enabled = true,
  dedupMs = 2000,
}: UseScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<import("@zxing/library").MultiFormatReader | null>(null);
  const zxRef = useRef<typeof zxingCache | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ value: string; ts: number } | null>(null);
  const activeRef = useRef(false);
  const nativeListenerRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  // ── Web: rAF decode loop ────────────────────
  const webLoop = useCallback(() => {
    if (!activeRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const reader = readerRef.current;
    const zx = zxRef.current;

    if (
      !video || !canvas || !reader || !zx ||
      video.readyState < 2 || video.paused ||
      !video.videoWidth
    ) {
      rafRef.current = requestAnimationFrame(webLoop);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { rafRef.current = requestAnimationFrame(webLoop); return; }

    ctx.drawImage(video, 0, 0, w, h);

    try {
      const imageData = ctx.getImageData(0, 0, w, h);
      const lum = new zx.RGBLuminanceSource(imageData.data, w, h);
      const bin = new zx.HybridBinarizer(lum);
      const bmp = new zx.BinaryBitmap(bin);
      const result = reader.decode(bmp);

      const value = result.getText();
      const now = Date.now();
      const last = lastRef.current;

      if (!last || last.value !== value || now - last.ts > dedupMs) {
        lastRef.current = { value, ts: now };
        onDetected({
          rawValue: value,
          format: String(result.getBarcodeFormat()),
          timestamp: now,
        });
      }
    } catch {
      // NotFoundException = no barcode in frame, keep looping
    }

    if (activeRef.current) {
      rafRef.current = requestAnimationFrame(webLoop);
    }
  }, [onDetected, dedupMs]);

  // ── Stop all engines ────────────────────────
  const stopCamera = useCallback(async () => {
    activeRef.current = false;

    // Stop rAF loop
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Stop native ML Kit scanner
    if (nativeListenerRef.current) {
      nativeListenerRef.current();
      nativeListenerRef.current = null;
    }

    // Stop web media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop Capacitor scanner (removes overlay)
    if (isNative) {
      try {
        const { BarcodeScanner } = await import(
          "@capacitor-mlkit/barcode-scanning"
        );
        await BarcodeScanner.stopScan();
        await BarcodeScanner.removeAllListeners();
        // Restore webview visibility
        document.querySelector("body")?.classList.remove("scanner-active");
      } catch { /* already stopped */ }
    }

    readerRef.current = null;
    setStatus("idle");
  }, [isNative]);

  // ── Start native ML Kit scanner ─────────────
  const startNativeScanner = useCallback(async () => {
    try {
      const { BarcodeScanner, BarcodeFormat } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );

      // Check / request permission
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera === "denied") {
        const req = await BarcodeScanner.requestPermissions();
        if (req.camera === "denied") {
          setStatus("denied");
          setError("Camera permission denied.");
          return;
        }
      }

      setStatus("active");
      setIsNative(true);

      // Make webview background transparent so native camera shows through
      document.querySelector("body")?.classList.add("scanner-active");

      // Listen for scan results
      const listener = await BarcodeScanner.addListener(
        "barcodeScanned",
        ({ barcode }) => {
          if (!activeRef.current) return;
          const value = barcode.rawValue;
          const now = Date.now();
          const last = lastRef.current;
          if (!last || last.value !== value || now - last.ts > dedupMs) {
            lastRef.current = { value, ts: now };
            onDetected({
              rawValue: value,
              format: barcode.format ?? "UNKNOWN",
              timestamp: now,
            });
          }
        }
      );

      nativeListenerRef.current = () => listener.remove();

      // Start scanning with multiple formats
      await BarcodeScanner.startScan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.QrCode,
          BarcodeFormat.DataMatrix,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.Itf,
        ],
      });
    } catch (err) {
      console.error("[native scanner]", err);
      // Fall back to web scanner if native fails
      setIsNative(false);
      await startWebScanner();
    }
  }, [onDetected, dedupMs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start web ZXing scanner ─────────────────
  const startWebScanner = useCallback(async () => {
    setStatus("requesting");
    setError(null);
    activeRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      });

      streamRef.current = stream;
      canvasRef.current = document.createElement("canvas");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      // Load ZXing (cached after first call)
      const zx = await getZXing();
      zxRef.current = zx;

      const reader = new zx.MultiFormatReader();
      const hints = new Map();
      hints.set(zx.DecodeHintType.POSSIBLE_FORMATS, [
        zx.BarcodeFormat.EAN_13,
        zx.BarcodeFormat.EAN_8,
        zx.BarcodeFormat.UPC_A,
        zx.BarcodeFormat.UPC_E,
        zx.BarcodeFormat.QR_CODE,
        zx.BarcodeFormat.DATA_MATRIX,
        zx.BarcodeFormat.CODE_128,
        zx.BarcodeFormat.CODE_39,
        zx.BarcodeFormat.ITF,
        zx.BarcodeFormat.CODABAR,
      ]);
      hints.set(zx.DecodeHintType.TRY_HARDER, true);
      reader.setHints(hints);
      readerRef.current = reader;

      setStatus("active");
      rafRef.current = requestAnimationFrame(webLoop);
    } catch (err) {
      activeRef.current = false;
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      if (denied) {
        setStatus("denied");
        setError("Camera permission denied.");
      } else {
        setStatus("error");
        setError("Could not start camera.");
      }
    }
  }, [webLoop]);

  // ── Main start ──────────────────────────────
  const startCamera = useCallback(async () => {
    if (activeRef.current) return;
    if (typeof window === "undefined") return;

    if (isCapacitor()) {
      await startNativeScanner();
    } else {
      await startWebScanner();
    }
  }, [startNativeScanner, startWebScanner]);

  // ── Torch toggle ────────────────────────────
  const toggleTorch = useCallback(async (on: boolean) => {
    if (isNative) {
      try {
        const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
        await BarcodeScanner.enableTorch({ enabled: on });
      } catch { /* ignore */ }
    } else {
      const track = streamRef.current?.getVideoTracks()?.[0];
      if (track) {
        try {
          await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
        } catch { /* torch not supported */ }
      }
    }
  }, [isNative]);

  useEffect(() => {
    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { videoRef, status, error, isNative, startCamera, stopCamera, toggleTorch };
}
