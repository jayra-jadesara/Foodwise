// ─────────────────────────────────────────────
// FoodWise · OCR Module · Public API
// ─────────────────────────────────────────────

// Components
export { OcrScanner } from "./components/OcrScanner";

// Hooks
export { useOcrCamera } from "./hooks/use-ocr-camera";

// Queries
export {
  useOcrAnalyze,
  useOcrResult,
  useOcrHistory,
  ocrKeys,
} from "./queries/use-ocr";

// Schemas
export {
  ImageUploadSchema,
  OcrRequestSchema,
  AiAnalysisPayloadSchema,
  RiskLevelSchema,
  IngredientCategorySchema,
  IMAGE_MAX_BYTES,
  IMAGE_ALLOWED_TYPES,
} from "./schemas";

// Types
export type {
  CaptureStatus,
  RiskLevel,
  IngredientAnnotation,
  IngredientCategory,
  OcrRawResult,
  RiskSummary,
  OcrAnalysisResult,
  CapturePayload,
  OcrAnalyzeRequest,
  OcrApiResponse,
  OcrHistoryItem,
} from "./types";

// Utils (exposed for testing + other modules)
export { preprocessImage, captureVideoFrame, processDataUrl } from "./utils/image-preprocessor";
