"use client";

import React from "react";
import {
  Container, Typography, Box, Stack, Avatar,
  Paper, Chip, Grid, ButtonBase,
} from "@mui/material";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Icons
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const GRADE_COLOR: Record<string, { main: string; bg: string; text: string }> = {
  A: { main: "#006d37", bg: "#6bfe9c", text: "#ffffff" },
  B: { main: "#84cc16", bg: "#f0fdf4", text: "#00210c" },
  C: { main: "#eab308", bg: "#fefce8", text: "#422006" },
  D: { main: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  F: { main: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
};

interface ScanRow {
  id: string;
  product_name: string;
  product_image?: string;
  health_score_total?: number;
  health_score_grade?: string;
  scanned_at: string;
}

interface Props {
  user: User | null;
  recentScans: ScanRow[];
  weeklyCount: number;
  weeklyTrend: number;
  avgScore: number | null;
}

export function DashboardView({ user, recentScans, weeklyCount, weeklyTrend, avgScore }: Props) {
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] ?? "User";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isPositive = weeklyTrend >= 0;

  const router = useRouter();

  return (
    <Container maxWidth="xs" sx={{ pt: 5, pb: 10 }}>
      {/* ── HEADER ── */}
      <Stack direction="row" sx={{ mb: 4, justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#0b1c30', fontWeight: 800 }}>
            {greeting}, {displayName} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: "#42474d", mt: 0.5 }}>
            What are you eating today?
          </Typography>
        </Box>
        <Avatar
          src={user?.user_metadata?.avatar_url}
          onClick={() => router.push('/profile')}
          sx={{ width: 52, height: 52, border: '2px solid #d3e4fe', backgroundColor: "#001629", margin: "0 auto", boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          {displayName[0]?.toUpperCase()}
        </Avatar>
      </Stack>

      {/* ── QUICK ACTION BENTO GRID ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={6}>
          <ButtonBase
            component={Link}
            href="/scan"
            sx={{ width: '100%', textAlign: 'left', borderRadius: 4 }}
          >
            <Paper sx={{
              p: 2, height: 120, width: '100%', bgcolor: '#001629', color: '#ffffff',
              borderRadius: 1, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <QrCodeScannerIcon sx={{ fontSize: 32 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Scan Barcode</Typography>
            </Paper>
          </ButtonBase>
        </Grid>
        <Grid size={6}>
          <ButtonBase
            component={Link}
            href="/scan?tab=ocr"
            sx={{ width: '100%', textAlign: 'left', borderRadius: 4 }}
          >
            <Paper variant="outlined" sx={{
              p: 2, height: 120, width: '100%', bgcolor: '#ffffff', color: '#0b1c30',
              borderRadius: 1, borderColor: '#c3c7ce',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <DocumentScannerIcon sx={{ fontSize: 32, color: '#001629' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} >Scan Ingredients</Typography>
            </Paper>
          </ButtonBase>
        </Grid>
      </Grid>

      {/* ── STATS GRID ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={6}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: '#ffffff', border: '1px solid #eff4ff', boxShadow: '0 4px 20px rgba(0,22,41,0.03)' }}>
            <Typography variant="caption" sx={{ color: '#73777e', textTransform: 'uppercase', fontSize: '10px', letterSpacing: 1, fontWeight: 700 }}>
              Scans this week
            </Typography>
            <Stack direction="row" sx={{ mt: 0.5, alignItems: "baseline", spacing: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{weeklyCount}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#006d37', paddingLeft: "0.3rem" }}>
                <TrendingUpIcon sx={{ fontSize: 14, mr: 0.2 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>  {isPositive ? '+' : '-'}{Math.abs(weeklyTrend)}%</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={6}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: '#ffffff', border: '1px solid #eff4ff', boxShadow: '0 4px 20px rgba(0,22,41,0.03)' }}>
            <Typography variant="caption" sx={{ color: '#73777e', textTransform: 'uppercase', fontSize: '10px', letterSpacing: 1, fontWeight: 700 }}>
              Avg Health Score
            </Typography>
            <Stack direction="row" sx={{ mt: 0.5, alignItems: "baseline", spacing: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#006d37" }} >{avgScore || "—"}</Typography>
              <Typography variant="caption" sx={{ color: "text.disabled", paddingTop: "0.5rem", paddingLeft: "0.2rem" }}>/100</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ── RECENT SCANS LIST ── */}
      <Box>
        <Stack
          direction="row"
          sx={{
            mb: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Scans</Typography>
          <ButtonBase component={Link} href="/scan?tab=history" sx={{ paddingLeft: "2rem", alignItems: "end" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "primary" }}>View All</Typography>
          </ButtonBase>
        </Stack>

        <Stack spacing={1.5}>
          {recentScans?.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No scans yet today.</Typography>
          ) : (
            recentScans?.map((scan) => {
              const grade = scan.health_score_grade || "C";
              const colors = GRADE_COLOR[grade];
              return (
                <Paper
                  key={scan.id}
                  elevation={0}
                  component={Link}
                  href={`/scan`} // Link to detail later
                  sx={{
                    p: 1.5, borderRadius: 1, display: 'flex', alignItems: 'center',
                    bgcolor: '#ffffff', border: '1px solid #eff4ff', textDecoration: 'none',
                    transition: 'transform 0.2s', '&:active': { transform: 'scale(0.98)' }
                  }}
                >
                  <Avatar
                    src={scan.product_image}
                    variant="rounded"
                    sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#f8f9ff', mr: 2 }}
                  >
                    🛒
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ color: '#0b1c30', fontWeight: 700 }}>
                      {scan.product_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#73777e' }}>
                      {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', pl: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#0b1c30', mb: 0.2, fontWeight: 800 }}>
                      {scan?.health_score_total}
                    </Typography>
                    <Chip
                      label={grade}
                      size="small"
                      sx={{
                        height: 18, fontSize: '10px', fontWeight: 900,
                        bgcolor: colors.bg, color: colors.main, border: `1px solid ${colors.main}33`
                      }}
                    />
                  </Box>
                </Paper>
              );
            })
          )}
        </Stack>
      </Box>
    </Container>
  );
}