"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Skeleton,
  Paper,
  Grid,
  Divider,
} from "@mui/material";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { ScanResult } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  result: ScanResult | null;
  loading?: boolean;
  onAddToList?: (result: ScanResult) => void;
  onCompare?: (result: ScanResult) => void;
}

export function ScanResultSheet({
  open,
  onClose,
  result = null,
  loading = false,
  onAddToList,
  onCompare,
}: Props) {
  // Logic: Identify high risks for the alert box
  const highRisks = result?.health_score.ingredient_risks.filter(
    (r) => r.risk === "high"
  ) ?? [];

  // Helper: Health Score Dial Logic
  const getDialColor = (score: number) => {
    if (score >= 70) return "#6bfe9c"; // Vibrant Green
    if (score >= 40) return "#fde047"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(20, 20, 20, 0.4)',
          },
        },
        paper: {
          sx: {
            borderRadius: '24px 24px 0 0',
            maxHeight: '90dvh',
            bgcolor: '#ffffff',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* ── DRAG HANDLE ── */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 2, pb: 1 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: "2px", bgcolor: "#c3c7ce" }} />
      </Box>

      {/* ── CONTENT AREA ── */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 6 }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="circular" width={120} height={120} sx={{ mx: "auto" }} />
          </Box>
        ) : result ? (
          <Stack spacing={3}>
            {/* ── HEADER ── */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h5" sx={{ fontFamily: "Plus Jakarta Sans", fontWeight: 700 }}>
                Scan Result
              </Typography>
              <IconButton onClick={onClose} sx={{ bgcolor: "#eff4ff" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* ── PRODUCT INFO ── */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Avatar
                src={result?.product?.image_url}
                variant="rounded"
                sx={{ width: 96, height: 96, borderRadius: 2, bgcolor: "#eff4ff" }}
              >
                🛒
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
                  {result?.product?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result?.product?.brand}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {result?.product?.categories?.slice(0, 2).map((cat) => (
                    <Chip key={cat} label={cat} size="small" sx={{ bgcolor: "#d3e4fe", fontWeight: 600, fontSize: "0.65rem" }} />
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* ── HIGH RISK ALERT BOX ── */}
            {highRisks.length > 0 && (
              <Box sx={{
                p: 2, borderRadius: 2, border: "1px solid #ffdad6", bgcolor: "rgba(255, 218, 214, 0.3)",
                display: "flex", alignItems: "center", gap: 2
              }}>
                <WarningAmberIcon sx={{ color: "#ba1a1a" }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="#ba1a1a">High Risk Alert</Typography>
                  <Typography variant="caption" color="#ba1a1a">
                    Contains {highRisks.length} flagged ingredient{highRisks.length > 1 ? 's' : ''}: {highRisks[0].name}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── HEALTH SCORE DIAL ── */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ position: "relative", width: 128, height: 128, mb: 2 }}>
                <svg width="128" height="128" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5eeff" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={getDialColor(result?.health_score.total)}
                    strokeWidth="8"
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 - (282.7 * result?.health_score.total) / 100}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>
                <Box sx={{
                  position: "absolute", inset: 0, display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 900 }}
                  >
                    {result?.health_score.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">/100</Typography>
                </Box>
              </Box>

              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: "18px !important", color: "inherit" }} />}
                label={result?.health_score.verdict || "Healthy Choice"}
                sx={{
                  bgcolor: "rgba(107, 254, 156, 0.2)", color: "#006d37",
                  fontWeight: 700, px: 1, height: 36, borderRadius: 10
                }}
              />
            </Box>

            {/* ── ACTION BUTTONS ── */}
            <Stack direction="row" spacing={2}>
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => onAddToList?.(result)}
                sx={{ bgcolor: "#001629", borderRadius: 2, fontWeight: 700, textTransform: "none", height: 48 }}
              >
                Add to List
              </Button>
              <Button
                fullWidth variant="outlined" size="large"
                onClick={() => onCompare?.(result)}
                sx={{ borderColor: "#001629", color: "#001629", borderRadius: 2, fontWeight: 700, textTransform: "none", height: 48, borderWidth: 2 }}
              >
                Compare
              </Button>
            </Stack>

            {/* ── NUTRITION ACCORDION ── */}
            <Accordion elevation={0} sx={{ border: "1px solid #c3c7ce", borderRadius: "12px !important", overflow: "hidden" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  Nutrition & Ingredients
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* MACROS GRID */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {[
                    { label: "Cals", val: result?.product?.nutriments?.energy_kcal_100g || 0 },
                    { label: "Protein", val: `${result?.product?.nutriments?.proteins_100g || 0}g` },
                    { label: "Fat", val: `${result?.product?.nutriments?.fat_100g || 0}g` },
                    { label: "Carbs", val: `${result?.product?.nutriments?.carbohydrates_100g || 0}g` },
                  ].map((item) => (
                    <Grid size={3} key={item.label}>
                      <Box sx={{ bgcolor: "#e5eeff", p: 1, borderRadius: 2, textAlign: "center" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {item.label}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700 }}
                        >
                          {item.val}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {result?.product?.ingredients_text}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* ── INGREDIENT INSIGHTS ── */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Ingredient Insights
              </Typography>
              <Stack spacing={1.5}>
                {result?.health_score.ingredient_risks.map((risk, i) => (
                  <Paper key={i} variant="outlined" sx={{
                    p: 1.5, borderRadius: 3, display: "flex", gap: 2, alignItems: "flex-start",
                    bgcolor: risk.risk === 'high' ? "rgba(255, 218, 214, 0.2)" : "#f8f9ff"
                  }}>
                    <Chip
                      label={risk.risk}
                      size="small"
                      sx={{
                        bgcolor: risk.risk === 'high' ? "#ef4444" : "#73777e",
                        color: "#fff", fontWeight: 800, fontSize: '10px', textTransform: 'uppercase'
                      }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                      >
                        {risk.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{risk.reason}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* ── FOOTER ── */}
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.disabled">Data source: {result?.product?.source}</Typography>
              <Typography variant="caption" color="text.disabled">Barcode: {result?.product?.barcode}</Typography>
            </Box>
          </Stack>
        ) : null}
      </Box>
    </Drawer >
  );
}