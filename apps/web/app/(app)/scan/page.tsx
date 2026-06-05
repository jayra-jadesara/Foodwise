// ─────────────────────────────────────────────
// FoodWise · app/(app)/scan/page.tsx
// ─────────────────────────────────────────────

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ScannerView } from "@/features/scanner/components/ScannerView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan Product — FoodWise",
  description: "Scan a barcode to get instant health analysis",
};

export default async function ScanPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Box
      sx={{
        height: "calc(100dvh - 56px)", // subtract bottom nav height
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Suspense
        fallback={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <CircularProgress />
          </Box>
        }
      >
        <ScannerView userId={user?.id} />
      </Suspense>
    </Box>
  );
}
