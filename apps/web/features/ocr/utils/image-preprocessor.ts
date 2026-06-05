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

const MAX_DIMENSION = 2048;   // Google Vision handles up to 4096, but 2048 is plenty
const JPEG_QUALITY = 0.88;

/**
 * Takes a Blob/File or a video element frame and returns a
 * preprocessed, resized, contrast-enhanced JPEG as base64.
 */
export async function preprocessImage(
  source: Blob | HTMLVideoElement | HTMLCanvasElement
): Promise<ProcessedImage> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // ── Draw source onto a scratch canvas ─────────
  let srcCanvas: HTMLCanvasElement;

  if (source instanceof HTMLVideoElement) {
    srcCanvas = document.createElement("canvas");
    const vw = source.videoWidth;
    const vh = source.videoHeight;

    if (!vw || !vh) {
      throw new Error("Video frame dimensions are invalid");
    }

    srcCanvas.width = vw;
    srcCanvas.height = vh;
    const sctx = srcCanvas.getContext("2d")!;
    sctx.drawImage(source, 0, 0);
  } else if (source instanceof HTMLCanvasElement) {
    if (!source.width || !source.height) {
      throw new Error("Canvas has invalid dimensions");
    }
    srcCanvas = source;
  } else {
    // Blob / File
    const url = URL.createObjectURL(source);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    srcCanvas = document.createElement("canvas");
    srcCanvas.width = img.naturalWidth;
    srcCanvas.height = img.naturalHeight;
    const sctx = srcCanvas.getContext("2d")!;
    sctx.drawImage(img, 0, 0);
  }

  const { width: origW, height: origH } = srcCanvas;

  // ── Resize to max dimension ────────────────────
  const scale = Math.min(1, MAX_DIMENSION / Math.max(origW, origH));
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  canvas.width = w;
  canvas.height = h;

  // ── Enhance contrast for OCR ───────────────────
  // Step 1: draw scaled
  ctx.drawImage(srcCanvas, 0, 0, w, h);

  // Step 2: apply sharpening convolution (helps OCR on blurry labels)
  const imageData = ctx.getImageData(0, 0, w, h);
  sharpen(imageData, w, h);
  ctx.putImageData(imageData, 0, 0);

  // ── Export as JPEG ─────────────────────────────
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1]!;
  const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

  return {
    base64,
    mimeType: "image/jpeg",
    width: w,
    height: h,
    originalWidth: origW,
    originalHeight: origH,
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

// ── 3×3 unsharp mask (sharpening) ─────────────
function sharpen(imageData: ImageData, w: number, h: number): void {
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // Kernel: centre +5, cardinal neighbours -1
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        let val = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const si = ((y + ky) * w + (x + kx)) * 4 + c;
            val += src[si]! * kernel[ki]!;
            ki++;
          }
        }
        dst[i + c] = Math.max(0, Math.min(255, val));
      }
      dst[i + 3] = src[i + 3]!; // alpha pass-through
    }
  }
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
