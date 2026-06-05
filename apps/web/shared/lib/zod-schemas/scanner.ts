// apps/web/shared/lib/zod-schemas/scanner.ts
import { z } from 'zod';

export const IngredientRiskSchema = z.object({
  ingredient: z.string(),
  risk_level: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
  category: z.enum(['additive', 'preservative', 'allergen', 'sugar', 'natural']),
});

export const OcrAnalysisResponseSchema = z.object({
  raw_text: z.string(),
  refined_ingredients: z.array(z.string()),
  risks: z.array(IngredientRiskSchema),
  health_summary: z.string(),
  detected_allergens: z.array(z.string()),
});

export type OcrAnalysisResponse = z.infer<typeof OcrAnalysisResponseSchema>;