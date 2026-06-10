"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { DashboardView } from "@/features/dashboard/components/DashboardView";
import { SplashLoader } from "@/shared/components/SplashLoader";

export default function DashboardPage() {
  const [state, setState] = useState<any>({
    user: null,
    recentScans: [],
    weeklyCount: 0,
    weeklyTrend: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase.auth) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user.id;

      // ─── 1. TIME RANGES ───
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // ─── 2. PARALLEL FETCHING ───
      const [historyRes, thisWeekRes, lastWeekRes, scoreRes] = await Promise.all([
        // Recent scans list
        supabase.from("scan_history").select("*").eq("user_id", userId).order("scanned_at", { ascending: false }).limit(5),

        // Count for current week (0-7 days ago)
        supabase.from("scan_history").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("scanned_at", sevenDaysAgo),

        // Count for previous week (7-14 days ago)
        supabase.from("scan_history").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("scanned_at", fourteenDaysAgo).lt("scanned_at", sevenDaysAgo),

        // Last 20 scores for average
        supabase.from("scan_history").select("health_score_total").eq("user_id", userId).not("health_score_total", "is", null).order("scanned_at", { ascending: false }).limit(20)
      ]);

      // ─── 3. CALCULATE TREND % ───
      const thisWeekCount = thisWeekRes.count || 0;
      const lastWeekCount = lastWeekRes.count || 0;

      let trendPercentage = 0;
      if (lastWeekCount > 0) {
        // Formula: ((Current - Previous) / Previous) * 100
        trendPercentage = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
      } else if (thisWeekCount > 0) {
        trendPercentage = 100; // Growth from zero
      }

      // ─── 4. CALCULATE AVG SCORE ───
      const scoreRows = scoreRes.data || [];
      const avgScore = scoreRows.length > 0
        ? Math.round(scoreRows.reduce((acc: any, row: any) => acc + (row.health_score_total || 0), 0) / scoreRows.length)
        : 0;

      setState({
        user,
        recentScans: historyRes.data || [],
        weeklyCount: thisWeekCount,
        weeklyTrend: trendPercentage,
        avgScore
      });
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <SplashLoader />
    );
  }

  return (
    <>
      <DashboardView {...state} />
    </>);
}