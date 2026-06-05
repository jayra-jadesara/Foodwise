// ─────────────────────────────────────────────
// FoodWise · Scanner · ScanResultSheet
// Bottom sheet that slides up with scan results
// ─────────────────────────────────────────────

"use client";

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
  Alert,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { HealthScoreDial } from "./HealthScoreDial";
import { NutritionPanel } from "./NutritionPanel";
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
  result,
  loading = false,
  onAddToList,
  onCompare,
}: Props) {
  const highRisks = result?.health_score.ingredient_risks.filter(
    (r) => r.risk === "high"
  ) ?? [];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "20px 20px 0 0",
          maxHeight: "90dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ── Drag handle ── */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "divider" }} />
      </Box>

      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          px: 2.5,
          pt: 1,
          pb: 1.5,
        }}
      >
        {loading ? (
          <>
            <Skeleton variant="rounded" width={56} height={56} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="70%" height={22} />
              <Skeleton width="40%" height={18} sx={{ mt: 0.5 }} />
            </Box>
          </>
        ) : result ? (
          <>
            <Avatar
              src={result.product.image_url}
              variant="rounded"
              alt={result.product.name}
              sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: "action.selected" }}
            >
              🛒
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {result.product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                {result.product.brand}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {result.product.categories?.slice(0, 2).map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, fontSize: "0.62rem", height: 20, textTransform: "capitalize" }}
                  />
                ))}
              </Box>
            </Box>
          </>
        ) : null}

        <IconButton size="small" onClick={onClose} sx={{ ml: "auto", mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Scrollable content ── */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, pb: 4 }}>
        {loading && (
          <Box>
            <Skeleton variant="circular" width={160} height={160} sx={{ mx: "auto", mb: 2 }} />
            <Skeleton height={120} sx={{ borderRadius: 2 }} />
          </Box>
        )}

        {!loading && result && (
          <Stack spacing={2.5}>
            {/* ── High risk alert ── */}
            {highRisks.length > 0 && (
              <Alert
                severity="warning"
                icon={<WarningAmberIcon fontSize="small" />}
                sx={{ borderRadius: 2, py: 0.5, "& .MuiAlert-message": { fontSize: "0.78rem" } }}
              >
                Contains {highRisks.length} flagged ingredient{highRisks.length > 1 ? "s" : ""}:{" "}
                <strong>{highRisks.map((r) => r.name).join(", ")}</strong>
              </Alert>
            )}

            {/* ── Health Score Dial ── */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: 200 }}>
                <HealthScoreDial score={result.health_score} size={200} />
              </Box>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: result.health_score.total < 50 ? 'error.50' : 'success.50',
                border: '1px solid',
                borderColor: result.health_score.total < 50 ? 'error.light' : 'success.light'
              }}
            >
              <Typography variant="body2" fontWeight={700} color={result.health_score.total < 50 ? 'error.main' : 'success.main'}>
                {result.health_score.verdict || "Analysis Complete"}
              </Typography>
            </Paper>

            {/* ── Action buttons ── */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddShoppingCartIcon />}
                onClick={() => onAddToList?.(result)}
                sx={{ borderRadius: 3, textTransform: "none", fontWeight: 600 }}
              >
                Add to list
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CompareArrowsIcon />}
                onClick={() => onCompare?.(result)}
                sx={{ borderRadius: 3, textTransform: "none" }}
              >
                Compare
              </Button>
            </Stack>

            {/* ── Nutrition accordion ── */}
            <Accordion
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "12px !important",
                "&:before": { display: "none" },
                overflow: "hidden",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Typography fontWeight={600} fontSize="0.88rem">
                  Nutrition & Ingredients
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <NutritionPanel product={result.product} />
              </AccordionDetails>
            </Accordion>

            {/* ── Ingredient risks accordion ── */}
            {result.health_score.ingredient_risks.length > 0 && (
              <Accordion
                disableGutters
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "12px !important",
                  "&:before": { display: "none" },
                  overflow: "hidden",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                  <Typography fontWeight={600} fontSize="0.88rem">
                    Ingredient Risks ({result.health_score.ingredient_risks.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                  <Stack spacing={1}>
                    {result.health_score.ingredient_risks.map((risk, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: risk.risk === "high" ? "error.50" : "warning.50",
                          border: "1px solid",
                          borderColor: risk.risk === "high" ? "error.light" : "warning.light",
                        }}
                      >
                        <Chip
                          label={risk.risk}
                          size="small"
                          sx={{
                            bgcolor: risk.risk === "high" ? "error.main" : "warning.main",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.62rem",
                            height: 20,
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize", fontSize: "0.8rem" }}>
                            {risk.name}
                          </Typography>
                          {risk.reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                              {risk.reason}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Source ── */}
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ textAlign: "center", display: "block", fontSize: "0.65rem" }}
            >
              Data source: {result.product.source} · Barcode {result.product.barcode}
            </Typography>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
