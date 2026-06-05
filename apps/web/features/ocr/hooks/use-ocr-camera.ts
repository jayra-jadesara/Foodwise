// ─────────────────────────────────────────────
// FoodWise · OCR Module · useOcrCamera Hook
// Still-capture camera — NOT a decode loop.
// Manages stream, captures frames, returns blob.
// ─────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preprocessImage } from "../utils/image-preprocessor";
import type { ProcessedImage } from "../utils/image-preprocessor";

type OcrCameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

interface UseOcrCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: OcrCameraStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => Promise<ProcessedImage | null>;
}

export function useOcrCamera(): UseOcrCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<OcrCameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },   // Higher res for OCR accuracy
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;

        video.srcObject = stream;

        // Wait for metadata
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }

          video.onloadedmetadata = () => resolve();
        });

        await video.play();

        // Extra safety for Android/WebView cameras
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setStatus("active");
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        setStatus("denied");
        setError("Camera permission denied. Please allow camera access in browser settings.");
      } else {
        setStatus("error");
        setError("Could not start camera.");
        console.error("[useOcrCamera]", err);
      }
    }
  }, []);

  // ── Capture current video frame ────────────────
  const captureFrame = useCallback(async (): Promise<ProcessedImage | null> => {
    const video = videoRef.current;

    if (!video || status !== "active") {
      return null;
    }

    if (
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      console.warn("[useOcrCamera] video not ready");
      return null;
    }

    try {
      return await preprocessImage(video);
    } catch (err) {
      console.error("[useOcrCamera] capture failed", err);
      return null;
    }
  }, [status]);

  // ── Cleanup on unmount ─────────────────────────
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return { videoRef, status, error, startCamera, stopCamera, captureFrame };
}
