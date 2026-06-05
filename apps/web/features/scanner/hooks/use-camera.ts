// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Camera Hook
// Uses @zxing/browser decodeFromVideoDevice API
// correctly — async callback pattern, no .reset()
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
  const readerRef = useRef<import("@zxing/browser").BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<{ value: string; ts: number } | null>(null);
  const activeRef = useRef(false); // guard against stale callbacks
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    activeRef.current = false;

    // stopAsyncDecode() is the correct method on BrowserMultiFormatReader
    if (readerRef.current) {
      try { readerRef.current.stopAsyncDecode(); } catch { /* ignore */ }
      readerRef.current = null;
    }

    // Also stop any raw media tracks attached to the video element
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
  }, []);

  const startCamera = useCallback(async () => {
    if (activeRef.current) return; // already running

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("Camera not supported on this device.");
      return;
    }

    setStatus("requesting");
    setError(null);
    activeRef.current = true;

    try {
      // ── Lazy-load ZXing (browser-only bundle) ──
      const { BrowserMultiFormatReader } = await import("@zxing/browser");

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // ── Get rear-camera device ID ──────────────
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const rearDevice =
        devices.find((d) =>
          /back|rear|environment/i.test(d.label)
        ) ?? devices[0];

      const deviceId = rearDevice?.deviceId ?? undefined;

      if (!videoRef.current) {
        setStatus("error");
        setError("Video element not ready.");
        return;
      }

      setStatus("active");

      // ── decodeFromVideoDevice: async, callback-based ──
      // This is the CORRECT public API. decodeFromVideoElement(el) alone
      // throws "callbackFn is required". We must pass a callback as 3rd arg.
      await reader.decodeFromVideoDevice(
        deviceId ?? null,
        videoRef.current,
        (result, err) => {
          if (!activeRef.current) return; // stop propagating after unmount

          if (result) {
            const value = result.getText();
            const format = result.getBarcodeFormat();
            const now = Date.now();

            const last = lastScannedRef.current;
            const isDuplicate =
              last && last.value === value && now - last.ts < dedupMs;

            if (!isDuplicate) {
              lastScannedRef.current = { value, ts: now };
              onDetected({ rawValue: value, format: String(format), timestamp: now });
            }
          }

          // err is a NotFoundException when no barcode is in frame — totally normal.
          // Only log unexpected errors.
          if (err && !(err.name === "NotFoundException")) {
            console.warn("[useCamera] decode error:", err.name, err.message);
          }
        }
      );
    } catch (err) {
      if (!activeRef.current) return; // unmounted while starting

      const isPermission =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      if (isPermission) {
        setStatus("denied");
        setError("Camera permission denied. Please allow camera access.");
      } else {
        setStatus("error");
        setError("Could not start camera. Try manual entry instead.");
        console.error("[useCamera] start error:", err);
      }
    }
  }, [onDetected, dedupMs]);

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
