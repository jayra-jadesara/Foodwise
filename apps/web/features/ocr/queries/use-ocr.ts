// ─────────────────────────────────────────────
// FoodWise · OCR Module · React Query Hooks
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  OcrAnalysisResult,
  OcrApiResponse,
  OcrHistoryItem,
} from "../types";

// ── Query key factory ──────────────────────────
export const ocrKeys = {
  all: ["ocr"] as const,
  result: (id: string) => ["ocr", "result", id] as const,
  history: (userId: string) => ["ocr", "history", userId] as const,
};

// ── Analyze image via Next.js route handler ────
// Always goes through /api/scan/ocr — never direct to edge function from client
async function analyzeImage(payload: {
  imageBase64: string;       // raw base64, no "data:" prefix
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<OcrAnalysisResult> {
  const res = await fetch("/api/scan/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: payload.imageBase64,
      mime_type: payload.mimeType,
    }),
  });

  const data: OcrApiResponse = await res.json();

  if (!data.success) {
    throw Object.assign(new Error(data.error), { code: data.code });
  }

  return data.data;
}

// ── Mutation: analyze an ingredient label ──────
export function useOcrAnalyze(
  options?: UseMutationOptions<
    OcrAnalysisResult,
    Error,
    { imageBase64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeImage,
    onSuccess: (data) => {
      // Cache by ID so the result page can load instantly
      queryClient.setQueryData(ocrKeys.result(data.id), data);
    },
    ...options,
  });
}

// ── Query: get a saved OCR result by ID ────────
export function useOcrResult(id: string | null) {
  return useQuery<OcrAnalysisResult>({
    queryKey: ocrKeys.result(id ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/scan/ocr/${id}`);
      if (!res.ok) throw new Error("Failed to load OCR result");
      const data: OcrApiResponse = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: !!id,
    staleTime: Infinity, // OCR results never change
  });
}

// ── Query: OCR history for a user ──────────────
async function fetchOcrHistory(userId: string): Promise<OcrHistoryItem[]> {
  const res = await fetch(`/api/scan/ocr/history?user_id=${userId}&limit=30`);
  if (!res.ok) throw new Error("Failed to load OCR history");
  return res.json();
}

export function useOcrHistory(userId: string | undefined) {
  return useQuery<OcrHistoryItem[]>({
    queryKey: ocrKeys.history(userId ?? ""),
    queryFn: () => fetchOcrHistory(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
