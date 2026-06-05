// ─────────────────────────────────────────────
// FoodWise · DashboardView (Client Component)
// ─────────────────────────────────────────────

"use client";

import {
  Container, Typography, Box, Button, Stack,
  Avatar, Paper, Chip, Divider, Grid,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HistoryIcon from "@mui/icons-material/History";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@supabase/supabase-js";

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", F: "#ef4444",
};

function RelativeTime({ dateStr }: { dateStr: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(formatDistanceToNow(new Date(dateStr), { addSuffix: true }));
  }, [dateStr]);
  return <span>{label}</span>;
}

interface ScanRow {
  id: string;
  barcode: string;
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
  avgScore: number | null;
}

export function DashboardView({ user, recentScans, weeklyCount, avgScore }: Props) {
  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 4 }}>
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {greeting}, {displayName} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            What are you eating today?
          </Typography>
        </Box>
        <Avatar
          src={user?.user_metadata?.avatar_url}
          sx={{ width: 48, height: 48, bgcolor: "primary.main", fontWeight: 700 }}
        >
          {displayName[0]?.toUpperCase()}
        </Avatar>
      </Stack>

      {/* ── Quick actions ── */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Paper
          component={Link}
          href="/scan"
          sx={{
            p: 2.5,
            bgcolor: "primary.main",
            color: "white",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            transition: "opacity 0.15s",
            "&:hover": { opacity: 0.92 },
          }}
        >
          <Box>
            <Typography fontWeight={700} fontSize="1rem">Scan Barcode</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Get instant health score
            </Typography>
          </Box>
          <QrCodeScannerIcon sx={{ fontSize: 40, opacity: 0.4 }} />
        </Paper>

        <Paper
          component={Link}
          href="/scan?tab=ocr"
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            textDecoration: "none",
            color: "text.primary",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: "secondary.50", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <CameraAltIcon color="secondary" fontSize="small" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600} fontSize="0.9rem">Scan Ingredients</Typography>
            <Typography variant="caption" color="text.secondary">
              AI-powered label analysis
            </Typography>
          </Box>
          <ChevronRightIcon fontSize="small" color="action" />
        </Paper>
      </Stack>

      {/* ── Stats ── */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, borderRadius: 3, textAlign: "center" }}>
            <HistoryIcon color="primary" sx={{ mb: 0.5, fontSize: 28 }} />
            <Typography variant="h5" fontWeight={800}>
              {weeklyCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              Scans this week
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, borderRadius: 3, textAlign: "center" }}>
            <TrendingUpIcon color="success" sx={{ mb: 0.5, fontSize: 28 }} />
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: avgScore ? GRADE_COLOR[avgScore >= 80 ? "A" : avgScore >= 65 ? "B" : avgScore >= 45 ? "C" : "D"] : "text.secondary" }}
            >
              {avgScore ?? "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              Avg health score
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Recent scans ── */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Recent scans
          </Typography>
          {recentScans.length > 0 && (
            <Button
              component={Link}
              href="/scan?tab=history"
              size="small"
              sx={{ textTransform: "none", fontSize: "0.78rem" }}
            >
              See all
            </Button>
          )}
        </Stack>

        {recentScans.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              borderStyle: "dashed",
              bgcolor: "transparent",
            }}
          >
            <Typography fontSize="2rem" sx={{ mb: 1 }}>🛒</Typography>
            <Typography variant="body2" color="text.secondary">
              Your recent scans will appear here.
            </Typography>
            <Button
              component={Link}
              href="/scan"
              variant="contained"
              size="small"
              sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}
            >
              Start scanning
            </Button>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            {recentScans.map((scan, idx) => {
              const color = GRADE_COLOR[scan.health_score_grade ?? ""] ?? "#888";
              return (
                <Box key={scan.id}>
                  <Box
                    component={Link}
                    href="/scan"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      textDecoration: "none",
                      color: "text.primary",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Avatar
                      src={scan.product_image}
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: "action.selected", fontSize: "1rem" }}
                    >
                      🛒
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.84rem" }}
                      >
                        {scan.product_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        <RelativeTime dateStr={scan.scanned_at} />
                      </Typography>
                    </Box>
                    {scan.health_score_total !== undefined && (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                        <Typography sx={{ fontSize: "1rem", fontWeight: 800, color, lineHeight: 1 }}>
                          {scan.health_score_total}
                        </Typography>
                        <Chip
                          label={scan.health_score_grade}
                          size="small"
                          sx={{
                            bgcolor: `${color}22`, color, fontWeight: 700,
                            fontSize: "0.58rem", height: 16,
                            border: `1px solid ${color}44`,
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  {idx < recentScans.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Paper>
        )}
      </Box>
    </Container>
  );
}
