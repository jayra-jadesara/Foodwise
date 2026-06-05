// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Camera Hook
// Wraps ZXing barcode detection with React lifecycle
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

interface UseCameraOptions {
  onDetected: (result: BarcodeResult) => void;
  enabled?: boolean;
  /** Debounce — ignore re-scans of the same barcode within this ms window */
  dedupMs?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera({
  onDetected,
  enabled = true,
  dedupMs = 2500,
}: UseCameraOptions): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<InstanceType<typeof import("@zxing/browser").BrowserMultiFormatReader> | null>(null);
  const lastScannedRef = useRef<{ value: string; ts: number } | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("Camera not supported on this device.");
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      // ── Request rear camera ─────────────────
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("active");

      // ── Lazy-load ZXing ─────────────────────
      const { BrowserMultiFormatReader, NotFoundException } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // ── Decode loop ─────────────────────────
      const decodeLoop = () => {
        if (!videoRef.current || !readerRef.current) return;

        try {
          const result = reader.decodeFromVideoElement(videoRef.current);
          // decodeFromVideoElement is synchronous in ZXing
          const value = result.getText();
          const format = result.getBarcodeFormat().toString();
          const now = Date.now();

          const last = lastScannedRef.current;
          const isDuplicate =
            last && last.value === value && now - last.ts < dedupMs;

          if (!isDuplicate) {
            lastScannedRef.current = { value, ts: now };
            onDetected({ rawValue: value, format, timestamp: now });
          }
        } catch (e) {
          // NotFoundException is expected when no barcode in frame
          if (!(e instanceof NotFoundException)) {
            console.warn("[useCamera] decode error", e);
          }
        }

        if (streamRef.current) {
          requestAnimationFrame(decodeLoop);
        }
      };

      requestAnimationFrame(decodeLoop);
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        setStatus("denied");
        setError("Camera permission denied. Please allow camera access.");
      } else {
        setStatus("error");
        setError("Could not start camera. Try again or use manual entry.");
        console.error("[useCamera] start error", err);
      }
    }
  }, [onDetected, dedupMs]);

  
  // ── Auto-start when enabled changes ──────────
  useEffect(() => {
    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { videoRef, status, error, startCamera, stopCamera };
}
