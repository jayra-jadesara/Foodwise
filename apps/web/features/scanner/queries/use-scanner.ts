// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Mobile-Ready Hooks
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client"; // Use Browser Client
import type {
  ScanResult,
  ScanHistoryItem,
} from "../types";

const scannerKeys = {
  all: ["scanner"] as const,
  product: (barcode: string) => ["scanner", "product", barcode] as const,
  history: (userId: string) => ["scanner", "history", userId] as const,
};

export { scannerKeys };

// ── Barcode lookup function ────────────────────
// NOTE: For mobile, we call the Supabase Edge Function directly 
// to keep the lookup logic (OpenFoodFacts) secure and off the client.
async function lookupBarcode(barcode: string): Promise<ScanResult> {
  const supabase = getSupabaseBrowserClient();
  
  // We invoke the Supabase Edge Function we created earlier
  // This works on Web, Android, and iOS.
  const { data, error } = await supabase.functions.invoke('barcode-lookup', {
    body: { barcode },
  });

  if (error || !data?.success) {
    throw Object.assign(new Error(error?.message || data?.error), { 
      code: error?.status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR" 
    });
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
      queryClient.setQueryData(scannerKeys.product(barcode), data);
      // Invalidate history so the new scan appears in the list
      queryClient.invalidateQueries({ queryKey: scannerKeys.all });
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
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// ── Query: scan history for current user ──────
export function useScanHistory(userId: string | undefined) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<ScanHistoryItem[]>({
    queryKey: scannerKeys.history(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_history")
        .select("*")
        .eq("user_id", userId)
        .order("scanned_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ScanHistoryItem[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ── Mutation: clear scan history ──────────────
export function useClearHistory(userId: string) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("user_id", userId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scannerKeys.history(userId) });
    },
  });
}