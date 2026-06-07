// ─────────────────────────────────────────────
// FoodWise · OCR · Tesseract Web Worker Manager
// Runs Tesseract.js in a Web Worker so it never
// blocks the main thread / UI.
// Singleton: one worker instance for the session.
// ─────────────────────────────────────────────

"use client";

import type { Worker as TesseractWorker } from "tesseract.js";

interface OcrWorkerResult {
  text: string;
  confidence: number; // 0–100 from Tesseract
}

type OcrJob = {
  imageDataUrl: string;
  resolve: (result: OcrWorkerResult) => void;
  reject: (err: Error) => void;
};

// ── Singleton state ─────────────────────────────
let workerInstance: TesseractWorker | null = null;
let workerReady = false;
let initPromise: Promise<void> | null = null;
const jobQueue: OcrJob[] = [];
let processing = false;

async function getWorker(): Promise<TesseractWorker> {
  if (workerInstance && workerReady) return workerInstance;

  if (!initPromise) {
    initPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const w = await createWorker("eng", 1, {
        // Load from CDN — no bundling needed
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
        logger: () => { }, // suppress progress logs in production
      });

      // Optimized parameters for food labels:
      // - PSM 6: Assume a single uniform block of text
      // - Whitelist chars to reduce noise from symbols/barcodes
      await w.setParameters({
        tessedit_pageseg_mode: "6" as unknown as Parameters<typeof w.setParameters>[0]["tessedit_pageseg_mode"],
        // Broad whitelist — includes E-numbers, percentages, brackets
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" +
          "()[].,;:%&/-' ",
        preserve_interword_spaces: "1",
      });

      workerInstance = w;
      workerReady = true;
    })();
  }

  await initPromise;
  return workerInstance!;
}

async function processQueue() {
  if (processing || jobQueue.length === 0) return;
  processing = true;

  while (jobQueue.length > 0) {
    const job = jobQueue.shift()!;
    try {
      const worker = await getWorker();
      const { data } = await worker.recognize(job.imageDataUrl);
      job.resolve({
        text: data.text,
        confidence: data.confidence, // 0–100
      });
    } catch (err) {
      job.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  processing = false;
}

/**
 * Run OCR on an image.
 * @param imageDataUrl  Full data URL (data:image/jpeg;base64,...)
 *                      OR raw base64 — we handle both.
 */
export function runOcr(imageDataUrl: string): Promise<OcrWorkerResult> {
  // Ensure data URL format
  const dataUrl = imageDataUrl.startsWith("data:")
    ? imageDataUrl
    : `data:image/jpeg;base64,${imageDataUrl}`;

  return new Promise((resolve, reject) => {
    jobQueue.push({ imageDataUrl: dataUrl, resolve, reject });
    processQueue();
  });
}

/** Pre-warm the Tesseract worker (call on app mount for faster first scan) */
export function prewarmOcrWorker(): void {
  if (typeof window === "undefined") return;
  getWorker().catch(() => { }); // fire and forget
}

/** Terminate worker (call on app unmount to free memory) */
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    workerReady = false;
    initPromise = null;
  }
}
