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

// Extended result type (includes detected_natural, raw_tokens)
export type { OcrAnalysisResultExtended } from "./queries/use-ocr";

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

// Utils
export { preprocessImage, captureVideoFrame, processDataUrl } from "./utils/image-preprocessor";

// Worker control
export { prewarmOcrWorker, terminateOcrWorker } from "./workers/tesseract-worker";

// Ingredient library (for other modules e.g. health-score)
export { INGREDIENT_DATABASE } from "./lib/ingredient-database";
export { analyzeIngredients, extractIngredientSection } from "./lib/ingredient-parser";
