// ─────────────────────────────────────────────
// FoodWise · OCR · Tesseract Worker
// Compatible with tesseract.js v5 AND v7
// Singleton — one worker for the whole session
// Runs off the main thread (non-blocking)
// ─────────────────────────────────────────────

"use client";

interface OcrResult {
  text: string;
  confidence: number; // 0–100
}

type Job = {
  dataUrl: string;
  resolve: (r: OcrResult) => void;
  reject: (e: Error) => void;
};

let workerInstance: import("tesseract.js").Worker | null = null;
let initPromise: Promise<void> | null = null;
const queue: Job[] = [];
let running = false;

async function init(): Promise<void> {
  const Tesseract = await import("tesseract.js");

  // v5: createWorker(lang, oem, options)
  // v7: createWorker(lang, oem, options) — same signature, different internals
  const worker = await Tesseract.createWorker("eng", 1, {
    // Load language data from CDN — avoids bundling 10MB lang file
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    logger: () => {}, // suppress verbose progress logs
    errorHandler: (e: unknown) => console.warn("[tesseract]", e),
  });

  // PSM 6 = single uniform text block — best for ingredient labels
  await worker.setParameters({
    tessedit_pageseg_mode: "6" as Parameters<typeof worker.setParameters>[0]["tessedit_pageseg_mode"],
    // Broad character set — food labels use all of these
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
      "0123456789()[].,;:%&/-' ",
    preserve_interword_spaces: "1",
  });

  workerInstance = worker;
}

async function processQueue(): Promise<void> {
  if (running || queue.length === 0) return;
  running = true;

  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      if (!workerInstance) await initPromise;
      const { data } = await workerInstance!.recognize(job.dataUrl);
      job.resolve({ text: data.text, confidence: data.confidence });
    } catch (err) {
      job.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  running = false;
}

export function runOcr(imageDataUrl: string): Promise<OcrResult> {
  // Ensure data URL format
  const dataUrl = imageDataUrl.startsWith("data:")
    ? imageDataUrl
    : `data:image/jpeg;base64,${imageDataUrl}`;

  return new Promise((resolve, reject) => {
    queue.push({ dataUrl, resolve, reject });
    processQueue();
  });
}

export function prewarmOcrWorker(): void {
  if (typeof window === "undefined") return;
  if (!initPromise) {
    initPromise = init().catch((e) => {
      console.warn("[tesseract] prewarm failed:", e);
      initPromise = null;
    });
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    initPromise = null;
  }
}
