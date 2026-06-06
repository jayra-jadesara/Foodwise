export interface ProcessedImage {
  base64: string;
  width: number;
  height: number;
}

/**
 * Turns an image strictly Black & White based on a brightness threshold.
 * This is the secret to high OCR accuracy.
 */
function applyThreshold(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const threshold = 125; // 0 (black) to 255 (white)

  for (let i = 0; i < data.length; i += 4) {
    // 1. Get average brightness (Luminance formula)
    const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    
    // 2. Force pixel to be either pure black or pure white
    const val = avg >= threshold ? 255 : 0;
    
    data[i] = data[i+1] = data[i+2] = val; // Set RGB
    // data[i+3] is alpha (leave it alone)
  }
  ctx.putImageData(imageData, 0, 0);
}

export async function preprocessImage(video: HTMLVideoElement): Promise<ProcessedImage | null> {
  if (video.videoWidth === 0) return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // 1. DEFINE CROP AREA (Center 70% of the frame)
  // This removes background noise and fingers holding the packet
  const zoom = 0.7;
  const sw = video.videoWidth * zoom;
  const sh = video.videoHeight * zoom;
  const sx = (video.videoWidth - sw) / 2;
  const sy = (video.videoHeight - sh) / 2;

  // 2. SCALE OUTPUT (Target 1200px width for sharp text)
  canvas.width = 1200;
  canvas.height = (sh / sw) * 1200;

  // 3. DRAW TO CANVAS
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // 4. APPLY BINARIZATION FILTER
  applyThreshold(ctx, canvas.width, canvas.height);

  return {
    base64: canvas.toDataURL("image/jpeg", 0.8).split(",")[1],
    width: canvas.width,
    height: canvas.height,
  };
}