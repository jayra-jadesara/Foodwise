// ─────────────────────────────────────────────
// FoodWise · OCR Module · Types
// ─────────────────────────────────────────────

// ── Capture states ─────────────────────────────
export type CaptureStatus =
  | "idle"
  | "requesting_camera"
  | "previewing"        // live viewfinder before capture
  | "captured"          // still image taken, ready to upload
  | "uploading"
  | "analyzing"
  | "complete"
  | "error";

// ── Ingredient risk levels ─────────────────────
export type RiskLevel = "safe" | "low" | "moderate" | "high" | "unknown";

export interface IngredientAnnotation {
  name: string;               // Normalised ingredient name
  raw: string;                // As extracted from OCR text
  risk: RiskLevel;
  category: IngredientCategory;
  reason: string;             // Human-readable explanation
  sources?: string[];         // Reference tags e.g. ["EFSA", "WHO"]
  alternatives?: string[];    // Healthier swap suggestions
}

export type IngredientCategory =
  | "additive"
  | "preservative"
  | "colorant"
  | "sweetener"
  | "emulsifier"
  | "flavoring"
  | "natural"
  | "allergen"
  | "fat"
  | "sugar"
  | "thickener"
  | "antioxidant"
  | "unknown";

// ── OCR raw output ─────────────────────────────
export interface OcrRawResult {
  full_text: string;            // Complete OCR text from Google Vision
  confidence: number;           // 0–1 overall confidence
  ingredient_section: string;   // Extracted ingredient block
  language_hint?: string;
}

// ── AI analysis output ─────────────────────────
export interface RiskSummary {
  overall_risk: RiskLevel;
  high_risk_count: number;
  moderate_risk_count: number;
  safe_count: number;
  unknown_count: number;
  top_concerns: string[];       // Short bullet points for quick scan
}

export interface OcrAnalysisResult {
  id: string;                          // Supabase row UUID
  user_id?: string;
  image_url?: string;                  // Stored in Supabase Storage
  ocr: OcrRawResult;
  ingredients: IngredientAnnotation[];
  risk_summary: RiskSummary;
  ai_verdict: string;                  // One-paragraph plain-English verdict
  ai_model: string;                    // e.g. "gpt-4o-mini"
  processing_ms: number;
  created_at: string;
  detected_natural?: string[];          // Detected natural ingredients (for positive reinforcement)
}

// ── Capture image payload ──────────────────────
export interface CapturePayload {
  dataUrl: string;     // base64 data URL from canvas
  blob: Blob;          // for upload
  width: number;
  height: number;
}

// ── API shapes ─────────────────────────────────
export interface OcrAnalyzeRequest {
  image_base64: string;   // base64 WITHOUT data: prefix
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  user_id?: string;
}

export interface OcrAnalyzeResponse {
  success: true;
  data: OcrAnalysisResult;
}

export interface OcrAnalyzeError {
  success: false;
  error: string;
  code:
  | "NO_TEXT_FOUND"
  | "NO_INGREDIENTS_FOUND"
  | "IMAGE_TOO_LARGE"
  | "OCR_FAILED"
  | "AI_FAILED"
  | "INTERNAL_ERROR";
}

export type OcrApiResponse = OcrAnalyzeResponse | OcrAnalyzeError;

// ── Saved report (history row) ─────────────────
export interface OcrHistoryItem {
  id: string;
  user_id: string;
  image_url?: string;
  overall_risk: RiskLevel;
  ingredient_count: number;
  high_risk_count: number;
  ai_verdict_preview: string;   // First 120 chars
  created_at: string;
}
