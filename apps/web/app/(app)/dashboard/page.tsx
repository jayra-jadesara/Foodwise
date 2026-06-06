"use client";

import { Suspense, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { Box, CircularProgress } from "@mui/material";
import { DashboardView } from "@/features/dashboard/components/DashboardView";

export default function DashboardPage() {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = await getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      const userId = user?.id ?? "";

      // Recent scans — server-side for instant render
      const { data: recentScans } = await supabase
        .from("scan_history")
        .select("id, barcode, product_name, product_image, health_score_total, health_score_grade, scanned_at")
        .eq("user_id", userId)
        .order("scanned_at", { ascending: false })
        .limit(5);

      // Weekly count
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: weeklyCount } = await supabase
        .from("scan_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("scanned_at", weekStart);

      // Avg score from last 20
      const { data: scoreRows } = await supabase
        .from("scan_history")
        .select("health_score_total")
        .eq("user_id", userId)
        .not("health_score_total", "is", null)
        .order("scanned_at", { ascending: false })
        .limit(20);

      const avgScore =
        scoreRows && scoreRows.length > 0
          ? Math.round(
            scoreRows.reduce((s, r) => s + (r.health_score_total ?? 0), 0) /
            scoreRows.length
          )
          : null;

      setState({ user, recentScans: recentScans || [], weeklyCount, avgScore });
    }

    loadData();
  }, []);


  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <DashboardView {...state} />
    </Suspense>
  );
}
