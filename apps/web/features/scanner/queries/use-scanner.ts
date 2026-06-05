// ─────────────────────────────────────────────
// FoodWise · Scanner Module · React Query Hooks
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  BarcodeLookupApiResponse,
  ScanResult,
  ScanHistoryItem,
} from "../types";

// ── Query key factory ──────────────────────────
export const scannerKeys = {
  all: ["scanner"] as const,
  product: (barcode: string) => ["scanner", "product", barcode] as const,
  history: (userId: string) => ["scanner", "history", userId] as const,
};

// ── Barcode lookup function ────────────────────
async function lookupBarcode(barcode: string): Promise<ScanResult> {
  const res = await fetch("/api/scan/barcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode }),
  });

  const data: BarcodeLookupApiResponse = await res.json();

  if (!data.success) {
    throw Object.assign(new Error(data.error), { code: data.code });
  }

  return data.data;
}

// ── Mutation: scan a barcode ───────────────────
export function useBarcodeScan(
  options?: UseMutationOptions<ScanResult, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation<ScanResult, Error, string>({
    mutationFn: lookupBarcode,
    onSuccess: (data, barcode) => {
      // Cache the product so subsequent lookups are instant
      queryClient.setQueryData(scannerKeys.product(barcode), data);
    },
    ...options,
  });
}

// ── Query: get cached product by barcode ──────
export function useProduct(barcode: string | null) {
  return useQuery<ScanResult>({
    queryKey: scannerKeys.product(barcode ?? ""),
    queryFn: () => lookupBarcode(barcode!),
    enabled: !!barcode && /^\d{8,14}$/.test(barcode),
    staleTime: 1000 * 60 * 60 * 24, // 24h — product data doesn't change often
    gcTime: 1000 * 60 * 60 * 48,
    retry: (failureCount, error) => {
      const code = (error as Error & { code?: string }).code;
      // Don't retry if the product simply doesn't exist
      if (code === "NOT_FOUND" || code === "INVALID_BARCODE") return false;
      return failureCount < 2;
    },
  });
}

// ── Query: scan history for current user ──────
async function fetchScanHistory(userId: string): Promise<ScanHistoryItem[]> {
  const res = await fetch(`/api/scan/history?user_id=${userId}&limit=50`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export function useScanHistory(userId: string | undefined) {
  return useQuery<ScanHistoryItem[]>({
    queryKey: scannerKeys.history(userId ?? ""),
    queryFn: () => fetchScanHistory(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Mutation: clear scan history ──────────────
export function useClearHistory(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/scan/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error("Failed to clear history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scannerKeys.history(userId) });
    },
  });
}
