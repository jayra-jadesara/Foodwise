// ─────────────────────────────────────────────
// FoodWise · OCR Module · React Query Hooks
// Strategy:
//  1. Tesseract.js Web Worker for OCR (client-side, no API cost)
//  2. Local ingredient parser — 350+ ingredient DB
//  3. Background save to Supabase (fire-and-forget)
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { runOcr } from "../workers/tesseract-worker";
import { extractIngredientSection, analyzeIngredients } from "../lib/ingredient-parser";
import type { OcrAnalysisResult, OcrHistoryItem } from "../types";

export const ocrKeys = {
  all: ["ocr"] as const,
  result: (id: string) => ["ocr", "result", id] as const,
  history: (userId: string) => ["ocr", "history", userId] as const,
};

// ── Input / output types ───────────────────────
type AnalyzePayload = {
  imageBase64: string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
};

// Extended result includes detected_natural for UI
export type OcrAnalysisResultExtended = OcrAnalysisResult & {
  detected_natural: string[];
  raw_tokens: string[];
};

// ── Core analysis ──────────────────────────────
async function analyzeImage(
  payload: AnalyzePayload
): Promise<OcrAnalysisResultExtended> {
  const t0 = performance.now();

  // 1. Tesseract OCR (runs in Web Worker, non-blocking)
  const dataUrl = `data:${payload.mimeType};base64,${payload.imageBase64}`;
  const { text: rawText, confidence: tesseractConfidence } = await runOcr(dataUrl);

  if (!rawText.trim()) {
    throw Object.assign(
      new Error(
        "No text detected. Ensure good lighting and hold the camera steady."
      ),
      { code: "NO_TEXT_FOUND" }
    );
  }

  // 2. Extract ingredient section
  const ingredientSection = extractIngredientSection(rawText);

  if (ingredientSection.trim().length < 8) {
    throw Object.assign(
      new Error(
        "Could not find an ingredient list. Point the camera at the ingredients section of the label."
      ),
      { code: "NO_INGREDIENTS_FOUND" }
    );
  }

  // 3. Local analysis — 350+ ingredient DB, zero API calls
  const analysis = analyzeIngredients(ingredientSection);

  const result: OcrAnalysisResultExtended = {
    id: crypto.randomUUID(),
    ocr: {
      full_text: rawText,
      confidence: Math.round(tesseractConfidence) / 100, // 0–1
      ingredient_section: ingredientSection,
    },
    ingredients: analysis.ingredients,
    risk_summary: analysis.risk_summary,
    ai_verdict: analysis.ai_verdict,
    ai_model: "local-parser-v1",
    processing_ms: Math.round(performance.now() - t0),
    created_at: new Date().toISOString(),
    detected_natural: analysis.detected_natural,
    raw_tokens: analysis.raw_tokens,
  };

  // 4. Background save — fire and forget, never blocks UI
  void saveResult(result).catch((e) =>
    console.warn("[ocr] save failed (non-fatal):", e)
  );

  return result;
}

async function saveResult(result: OcrAnalysisResultExtended): Promise<void> {
  await fetch("/api/scan/ocr/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: result.id,
      ocr_full_text: result.ocr.full_text,
      ingredient_section: result.ocr.ingredient_section,
      ocr_confidence: result.ocr.confidence,
      ingredients: result.ingredients,
      risk_summary: result.risk_summary,
      ai_verdict: result.ai_verdict,
      ai_model: result.ai_model,
      processing_ms: result.processing_ms,
    }),
  });
}

// ── Mutation hook ──────────────────────────────
export function useOcrAnalyze(
  options?: Omit<
    UseMutationOptions<OcrAnalysisResultExtended, Error, AnalyzePayload>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation<OcrAnalysisResultExtended, Error, AnalyzePayload>({
    mutationFn: analyzeImage,

    onSuccess: (data, vars, onMutateResult, context) => {
      queryClient.setQueryData(ocrKeys.result(data.id), data);

      options?.onSuccess?.(
        data,
        vars,
        onMutateResult,
        context
      );
    },

    onError: options?.onError,
    onSettled: options?.onSettled,

    retry: false,
  });
}

// ── Query: saved result by ID ──────────────────
export function useOcrResult(id: string | null) {
  return useQuery<OcrAnalysisResult>({
    queryKey: ocrKeys.result(id ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/scan/ocr/${id}`);
      if (!res.ok) throw new Error("Failed to load OCR result");
      return res.json();
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}

// ── Query: OCR history ─────────────────────────
export function useOcrHistory(userId: string | undefined) {
  return useQuery<OcrHistoryItem[]>({
    queryKey: ocrKeys.history(userId ?? ""),
    queryFn: async () => {
      const res = await fetch("/api/scan/ocr/history?limit=30");
      if (!res.ok) throw new Error("Failed to load history");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
