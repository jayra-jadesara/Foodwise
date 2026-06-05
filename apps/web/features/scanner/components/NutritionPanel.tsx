// ─────────────────────────────────────────────
// FoodWise · Scanner · NutritionPanel
// Nutrient table + badges + allergen chips
// ─────────────────────────────────────────────

"use client";

import {
  Box,
  Typography,
  Chip,
  Divider,
  Stack,
  Paper,
} from "@mui/material";
import type { Product } from "../types";

const NOVA_LABEL: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: "NOVA 1", color: "#22c55e", desc: "Unprocessed / natural" },
  2: { label: "NOVA 2", color: "#84cc16", desc: "Processed ingredients" },
  3: { label: "NOVA 3", color: "#f97316", desc: "Processed food" },
  4: { label: "NOVA 4", color: "#ef4444", desc: "Ultra-processed" },
};

const NUTRISCORE_COLOR: Record<string, string> = {
  a: "#22c55e",
  b: "#84cc16",
  c: "#eab308",
  d: "#f97316",
  e: "#ef4444",
};

interface NutrientRowProps {
  label: string;
  value: number | undefined;
  unit: string;
  highlight?: "warn" | "good" | "neutral";
}

function NutrientRow({ label, value, unit, highlight = "neutral" }: NutrientRowProps) {
  const highlightColor =
    highlight === "warn" ? "warning.main" : highlight === "good" ? "success.main" : "text.primary";

  if (value === undefined) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.75,
        px: 1,
        borderRadius: 1,
        "&:nth-of-type(odd)": { bgcolor: "action.hover" },
      }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: highlightColor, fontSize: "0.8rem" }}>
        {value.toFixed(value >= 10 ? 1 : 2)}
        <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.3 }}>
          {unit}
        </Typography>
      </Typography>
    </Box>
  );
}

interface Props {
  product: Product;
}

export function NutritionPanel({ product }: Props) {
  const n = product.nutriments;
  const nova = product.nova_group ? NOVA_LABEL[product.nova_group] : null;
  const nutriscore = product.nutriscore_grade?.toLowerCase();

  return (
    <Box>
      {/* ── Badges row ── */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {nova && (
          <Chip
            label={nova.label}
            size="small"
            title={nova.desc}
            sx={{
              bgcolor: `${nova.color}22`,
              color: nova.color,
              border: `1px solid ${nova.color}55`,
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        )}
        {nutriscore && NUTRISCORE_COLOR[nutriscore] && (
          <Chip
            label={`Nutri-Score ${nutriscore.toUpperCase()}`}
            size="small"
            sx={{
              bgcolor: `${NUTRISCORE_COLOR[nutriscore]}22`,
              color: NUTRISCORE_COLOR[nutriscore],
              border: `1px solid ${NUTRISCORE_COLOR[nutriscore]}55`,
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        )}
        {product.labels?.slice(0, 3).map((label) => (
          <Chip
            key={label}
            label={label}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.68rem", textTransform: "capitalize" }}
          />
        ))}
      </Stack>

      {/* ── Nutrients per 100g ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 1.5, py: 1, bgcolor: "action.selected" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.06em", color: "text.secondary", fontSize: "0.68rem" }}>
            NUTRITION PER 100G
          </Typography>
        </Box>
        <Box sx={{ px: 0.5 }}>
          <NutrientRow label="Energy" value={n.energy_kcal_100g} unit="kcal" />
          <NutrientRow label="Fat" value={n.fat_100g} unit="g" highlight={n.fat_100g !== undefined && n.fat_100g > 20 ? "warn" : "neutral"} />
          <NutrientRow label="of which saturated" value={n.saturated_fat_100g} unit="g" highlight={n.saturated_fat_100g !== undefined && n.saturated_fat_100g > 5 ? "warn" : "neutral"} />
          <NutrientRow label="Carbohydrates" value={n.carbohydrates_100g} unit="g" />
          <NutrientRow label="of which sugars" value={n.sugars_100g} unit="g" highlight={n.sugars_100g !== undefined && n.sugars_100g > 15 ? "warn" : "neutral"} />
          <NutrientRow label="Fibre" value={n.fiber_100g} unit="g" highlight={n.fiber_100g !== undefined && n.fiber_100g > 3 ? "good" : "neutral"} />
          <NutrientRow label="Protein" value={n.nutriments?.proteins_100g ?? n.proteins_100g} unit="g" highlight={n.proteins_100g !== undefined && n.proteins_100g > 10 ? "good" : "neutral"} />
          <NutrientRow label="Salt" value={n.salt_100g} unit="g" highlight={n.salt_100g !== undefined && n.salt_100g > 1.5 ? "warn" : "neutral"} />
        </Box>
      </Paper>

      {/* ── Allergens ── */}
      {product.allergens && product.allergens.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.06em", color: "text.secondary", fontSize: "0.68rem", display: "block", mb: 0.75 }}>
            ALLERGENS
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {product.allergens.map((a) => (
              <Chip
                key={a}
                label={a}
                size="small"
                sx={{
                  bgcolor: "error.main",
                  color: "error.contrastText",
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  textTransform: "capitalize",
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* ── Ingredients text ── */}
      {product.ingredients_text && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.06em", color: "text.secondary", fontSize: "0.68rem", display: "block", mb: 0.5 }}>
            INGREDIENTS
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: "0.72rem" }}>
            {product.ingredients_text}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
