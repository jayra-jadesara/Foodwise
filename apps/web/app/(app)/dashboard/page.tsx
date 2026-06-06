"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { Box, CircularProgress } from "@mui/material";
import { DashboardView } from "@/features/dashboard/components/DashboardView";

export default function DashboardPage() {
  const [state, setState] = useState<any>({
    user: null,
    recentScans: [],
    weeklyCount: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase.auth) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

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
        scoreRows && scoreRows?.length > 0
          ? Math.round(
            scoreRows.reduce((s: number, r: { health_score_total: number }) => s + (r?.health_score_total ?? 0), 0) /
            scoreRows?.length || 0
          )
          : 0;

      setState({ user, recentScans: recentScans || [], weeklyCount: weeklyCount || 0, avgScore });
      setLoading(false);
    }

    loadData();
  }, []);


  if (loading || !state) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardView {...state} />
  );
}
