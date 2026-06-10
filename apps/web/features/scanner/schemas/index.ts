// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Zod Schemas
// ─────────────────────────────────────────────

import { z } from "zod";

// ── Barcode input ──────────────────────────────
// Accepts: EAN-8/13, UPC-A/E (digits), QR codes (printable ASCII), URLs
export const BarcodeInputSchema = z.object({
  barcode: z
    .string()
    .min(4, "Barcode too short")
    .max(200, "Barcode too long")
    // Allow printable ASCII — covers QR codes, URLs, alphanumeric codes
    .regex(/^[\x20-\x7E]+$/, "Invalid barcode format"),
});

export type BarcodeInput = z.infer<typeof BarcodeInputSchema>;

// ── Manual entry form (numeric only — user types it) ──
export const ManualEntrySchema = z.object({
  barcode: z
    .string()
    .min(6, "Enter at least 6 digits")
    .max(14, "Barcode too long")
    .regex(/^\d+$/, "Digits only"),
});

export type ManualEntryInput = z.infer<typeof ManualEntrySchema>;

// ── OpenFoodFacts API response (subset we use) ─
export const OFFProductSchema = z.object({
  code: z.string(),
  status: z.number(), // 1 = found, 0 = not found
  product: z
    .object({
      product_name: z.string().optional(),
      product_name_en: z.string().optional(),
      brands: z.string().optional(),
      image_front_url: z.string().url().optional().or(z.literal("")),
      categories_tags: z.array(z.string()).optional(),
      labels_tags: z.array(z.string()).optional(),
      allergens_tags: z.array(z.string()).optional(),
      ingredients_text: z.string().optional(),
      nutriments: z
        .object({
          "energy-kcal_100g": z.number().optional(),
          fat_100g: z.number().optional(),
          "saturated-fat_100g": z.number().optional(),
          carbohydrates_100g: z.number().optional(),
          sugars_100g: z.number().optional(),
          fiber_100g: z.number().optional(),
          proteins_100g: z.number().optional(),
          salt_100g: z.number().optional(),
          sodium_100g: z.number().optional(),
        })
        .optional(),
      nova_group: z.number().int().min(1).max(4).optional(),
      nutriscore_grade: z
        .enum(["a", "b", "c", "d", "e"])
        .optional()
        .or(z.string().optional()),
      countries_tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type OFFProduct = z.infer<typeof OFFProductSchema>;

// ── Health score sub-schema ────────────────────
export const HealthScoreSchema = z.object({
  total: z.number().int().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  breakdown: z.object({
    nutrition: z.number().min(0).max(40),
    ingredients: z.number().min(0).max(30),
    processing: z.number().min(0).max(20),
    profile_match: z.number().min(0).max(10),
  }),
  ingredient_risks: z.array(
    z.object({
      name: z.string(),
      risk: z.enum(["safe", "moderate", "high", "unknown"]),
      reason: z.string().optional(),
    })
  ),
  computed_at: z.string(),
});

// ── Scan history schema ────────────────────────
export const ScanHistoryItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  barcode: z.string(),
  product_name: z.string(),
  product_image: z.string().url().optional().or(z.literal("")).optional(),
  health_score_total: z.number().int().min(0).max(100),
  health_score_grade: z.string(),
  scanned_at: z.string(),
});
