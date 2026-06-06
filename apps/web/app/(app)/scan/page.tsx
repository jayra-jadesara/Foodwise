// ─────────────────────────────────────────────
// FoodWise · app/(app)/scan/page.tsx
// ─────────────────────────────────────────────

"use client";

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { getSupabaseServerClient } from "@/shared/lib/supabase/server";
import { ScannerView } from "@/features/scanner/components/ScannerView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan — FoodWise",
  description: "Scan a barcode or ingredient label for instant health analysis",
};

export default async function ScanPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Box
      sx={{
        // Full remaining height after bottom nav (56px)
        height: "calc(100dvh - 56px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <ScannerView userId={user?.id} />
      </Suspense>
    </Box>
  );
}
