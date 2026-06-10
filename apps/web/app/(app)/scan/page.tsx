"use client";

import { Suspense, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { ScannerView } from "@/features/scanner/components/ScannerView";
import { SplashLoader } from "@/shared/components/SplashLoader";

export default function ScanPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(
      ({ data }: { data: { user: { id: string } | null } }) => {
        setUserId(data?.user?.id ?? "");
      }
    );
  }, []);

  return (
    <Box sx={{ height: "calc(100dvh - 56px)", display: "flex", flexDirection: "column" }}>
      <Suspense fallback={<SplashLoader />}>
        <ScannerView userId={userId} />
      </Suspense>
    </Box>
  );
}