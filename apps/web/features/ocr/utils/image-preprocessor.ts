// ─────────────────────────────────────────────
// FoodWise · OCR Module · Image Preprocessor
// Client-side canvas ops before sending to API
// ─────────────────────────────────────────────

export interface ProcessedImage {
  base64: string;           // raw base64, no data: prefix
  mimeType: "image/jpeg";
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  sizeKb: number;
}

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.90;


/**
 * The Secret: Adaptive Binarization. 
 * Turns any colored food packet into a clean black-on-white document.
 */
function applyBinaryThreshold(imageData: ImageData): void {
  const data = imageData.data;
  // Threshold 120-130 is perfect for Balaji Wafers (removes the orange bag)
  const threshold = 125;

  for (let i = 0; i < data.length; i += 4) {
    // 1. Get brightness using the human eye weight formula (Luminance)
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // 2. Force pixel to be either Pure Black (0) or Pure White (255)
    const val = brightness < threshold ? 0 : 255;

    data[i] = data[i + 1] = data[i + 2] = val;
    // data[i+3] is Alpha, keep it at 255
  }
}

/**
 * Takes a Blob/File or a video element frame and returns a
 * preprocessed, resized, contrast-enhanced JPEG as base64.
 */
export async function preprocessImage(
  source: Blob | HTMLVideoElement | HTMLCanvasElement
): Promise<ProcessedImage> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  let srcW = 0;
  let srcH = 0;

  // ── 1. Prepare Source ─────────────────────────
  if (source instanceof HTMLVideoElement) {
    srcW = source.videoWidth;
    srcH = source.videoHeight;
  } else if (source instanceof HTMLCanvasElement) {
    srcW = source.width;
    srcH = source.height;
  } else {
    const url = URL.createObjectURL(source);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    srcW = img.naturalWidth;
    srcH = img.naturalHeight;
  }

  if (!srcW || !srcH) throw new Error("Invalid source dimensions");

  // ── 2. Smart Crop & Resize ────────────────────
  // Focus on the center 65% of the frame (ignores background noise)
  const zoom = 0.65;
  const cropW = srcW * zoom;
  const cropH = srcH * zoom;
  const sx = (srcW - cropW) / 2;
  const sy = (srcH - cropH) / 2;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(cropW, cropH));
  const targetW = Math.round(cropW * scale);
  const targetH = Math.round(cropH * scale);

  canvas.width = targetW;
  canvas.height = targetH;

  // ── 3. Draw and Process ───────────────────────
  if (source instanceof HTMLVideoElement) {
    ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
  } else {
    ctx.drawImage(source as any, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
  }

  // ── 4. Apply Black & White Filter ─────────────
  const imageData = ctx.getImageData(0, 0, targetW, targetH);
  applyBinaryThreshold(imageData);
  ctx.putImageData(imageData, 0, 0);

  // ── 5. Export as JPEG Base64 ──────────────────
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1]!;
  const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

  return {
    base64,
    mimeType: "image/jpeg",
    width: targetW,
    height: targetH,
    originalWidth: srcW,
    originalHeight: srcH,
    sizeKb,
  };
}

// ── Capture a still frame from a <video> element ─
export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Video not ready yet");
  }
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  ctx.drawImage(video, 0, 0);
  return canvas;
}

// ── Load an Image from URL ─────────────────────
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        await img.decode();
      } catch { }

      resolve(img);
    };

    img.onerror = reject;

    img.src = url;
  });
}

/**
 * Converts a dataURL (from file input) to a ProcessedImage
 */
export async function processDataUrl(dataUrl: string): Promise<ProcessedImage> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  // Reuse main pipeline
  return preprocessImage(canvas);
}
