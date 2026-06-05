// ─────────────────────────────────────────────
// FoodWise · OCR Module · Zod Schemas
// ─────────────────────────────────────────────

import { z } from "zod";

// ── Image upload constraints ───────────────────
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ImageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= IMAGE_MAX_BYTES, "Image must be under 4 MB")
    .refine(
      (f) => IMAGE_ALLOWED_TYPES.includes(f.type as (typeof IMAGE_ALLOWED_TYPES)[number]),
      "Unsupported format — use JPEG, PNG, or WebP"
    ),
});

export type ImageUploadInput = z.infer<typeof ImageUploadSchema>;

// ── Risk level enum ────────────────────────────
export const RiskLevelSchema = z.enum(["safe", "low", "moderate", "high", "unknown"]);

export const IngredientCategorySchema = z.enum([
  "additive", "preservative", "colorant", "sweetener", "emulsifier",
  "flavoring", "natural", "allergen", "fat", "sugar", "thickener",
  "antioxidant", "unknown",
]);

// ── AI response (strict schema for JSON parsing) ─
export const IngredientAnnotationSchema = z.object({
  name: z.string().min(1),
  raw: z.string(),
  risk: RiskLevelSchema,
  category: IngredientCategorySchema,
  reason: z.string(),
  sources: z.array(z.string()).optional(),
  alternatives: z.array(z.string()).optional(),
});

export const RiskSummarySchema = z.object({
  overall_risk: RiskLevelSchema,
  high_risk_count: z.number().int().min(0),
  moderate_risk_count: z.number().int().min(0),
  safe_count: z.number().int().min(0),
  unknown_count: z.number().int().min(0),
  top_concerns: z.array(z.string()).max(5),
});

// Full AI analysis payload (what GPT returns as JSON)
export const AiAnalysisPayloadSchema = z.object({
  ingredients: z.array(IngredientAnnotationSchema).min(1),
  risk_summary: RiskSummarySchema,
  ai_verdict: z.string().min(10),
});

export type AiAnalysisPayload = z.infer<typeof AiAnalysisPayloadSchema>;

// ── OCR request schema (API route validation) ──
export const OcrRequestSchema = z.object({
  image_base64: z
    .string()
    .min(100, "Image data too short")
    .refine((s) => !s.startsWith("data:"), "Send raw base64, not a data URL"),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  user_id: z.string().uuid().optional(),
});

export type OcrRequest = z.infer<typeof OcrRequestSchema>;

// ── History item schema ────────────────────────
export const OcrHistoryItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  image_url: z.string().url().optional().or(z.literal("")).optional(),
  overall_risk: RiskLevelSchema,
  ingredient_count: z.number().int().min(0),
  high_risk_count: z.number().int().min(0),
  ai_verdict_preview: z.string(),
  created_at: z.string(),
});
