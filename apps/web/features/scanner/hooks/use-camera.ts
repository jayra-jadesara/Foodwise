// ─────────────────────────────────────────────
// FoodWise · Scanner · use-camera v3
//
// Core insight: @zxing/library MultiFormatReader
// .decode(BinaryBitmap) is SYNCHRONOUS and takes ~1-3ms.
// We run it on every requestAnimationFrame at 60fps.
// This gives <500ms typical detection.
//
// Previous bugs:
//  1. BarcodeFormat/DecodeHintType imported from @zxing/browser
//     — they don't exist there, silently returns undefined
//  2. decodeFromCanvas returns a Promise, bad in tight loops
//  3. hints constructor wrong for 0.1.x (needs setHints not constructor arg)
// ─────────────────────────────────────────────

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BarcodeResult } from "../types";

type CameraStatus = "idle" | "requesting" | "active" | "denied" | "unsupported" | "error";

// Hold initialised ZXing state in module scope after first load
// so subsequent mounts are instant (no re-import)
let zxingState: {
  MultiFormatReader: typeof import("@zxing/library").MultiFormatReader;
  RGBLuminanceSource: typeof import("@zxing/library").RGBLuminanceSource;
  HybridBinarizer: typeof import("@zxing/library").HybridBinarizer;
  BinaryBitmap: typeof import("@zxing/library").BinaryBitmap;
  BarcodeFormat: typeof import("@zxing/library").BarcodeFormat;
  DecodeHintType: typeof import("@zxing/library").DecodeHintType;
} | null = null;

async function loadZXing() {
  if (zxingState) return zxingState;
  const lib = await import("@zxing/library");
  zxingState = {
    MultiFormatReader: lib.MultiFormatReader,
    RGBLuminanceSource: lib.RGBLuminanceSource,
    HybridBinarizer: lib.HybridBinarizer,
    BinaryBitmap: lib.BinaryBitmap,
    BarcodeFormat: lib.BarcodeFormat,
    DecodeHintType: lib.DecodeHintType,
  };
  return zxingState;
}

interface UseCameraOptions {
  onDetected: (result: BarcodeResult) => void;
  enabled?: boolean;
  dedupMs?: number;
}

export function useCamera({
  onDetected,
  enabled = true,
  dedupMs = 2000,
}: UseCameraOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<import("@zxing/library").MultiFormatReader | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ value: string; ts: number } | null>(null);
  const activeRef = useRef(false);
  const zxingRef = useRef<typeof zxingState | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // ── Decode loop — runs at requestAnimationFrame rate ──
  const loop = useCallback(() => {
    if (!activeRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const reader = readerRef.current;
    const zx = zxingRef.current;

    if (!video || !canvas || !reader || !zx ||
        video.readyState < 2 || video.paused ||
        !video.videoWidth || !video.videoHeight) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, w, h);

    try {
      // Get raw RGBA pixel array
      const imageData = ctx.getImageData(0, 0, w, h);

      // ZXing decode pipeline (all synchronous, ~1-3ms)
      const luminanceSource = new zx.RGBLuminanceSource(imageData.data, w, h);
      const binarizer = new zx.HybridBinarizer(luminanceSource);
      const bitmap = new zx.BinaryBitmap(binarizer);
      const result = reader.decode(bitmap);

      // Barcode found!
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
      // NotFoundException every frame when no barcode visible — expected, ignore
    }

    if (activeRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [onDetected, dedupMs]);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    readerRef.current = null;
    setStatus("idle");
  }, []);

  const startCamera = useCallback(async () => {
    if (activeRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("Camera not supported on this device.");
      return;
    }

    setStatus("requesting");
    setError(null);
    activeRef.current = true;

    try {
      // ── Start camera stream ────────────────────
      // 1280×720 decodes faster than 1920×1080 — sweet spot for barcodes
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

      // ── Load ZXing from @zxing/library ─────────
      // CRITICAL: import from "@zxing/library" NOT "@zxing/browser"
      // BarcodeFormat and DecodeHintType only exist in @zxing/library
      const zx = await loadZXing();
      zxingRef.current = zx;

      // ── Configure reader ───────────────────────
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
      // TRY_HARDER searches entire image, not just center — essential for
      // labels held at an angle or partially in frame
      hints.set(zx.DecodeHintType.TRY_HARDER, true);
      reader.setHints(hints);
      readerRef.current = reader;

      setStatus("active");

      // ── Start decode loop ──────────────────────
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      activeRef.current = false;
      const isPermission =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      if (isPermission) {
        setStatus("denied");
        setError("Camera permission denied. Allow access in browser settings.");
      } else {
        setStatus("error");
        setError("Could not start camera. Try manual entry.");
        console.error("[useCamera]", err);
      }
    }
  }, [loop]);

  useEffect(() => {
    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { videoRef, status, error, startCamera, stopCamera };
}
