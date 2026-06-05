// ─────────────────────────────────────────────
// FoodWise · Scanner · HealthScoreDial
// Animated SVG arc gauge, grade label, breakdown
// ─────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import type { HealthScore } from "../types";

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

const GRADE_LABEL: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Poor",
  F: "Avoid",
};

interface Props {
  score: HealthScore;
  size?: number;
  animate?: boolean;
}

export function HealthScoreDial({ score, size = 160, animate = true }: Props) {
  const arcRef = useRef<SVGCircleElement | null>(null);
  const color = GRADE_COLOR[score.grade] ?? "#888";

  const r = (size / 2) * 0.72;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // Arc covers 270° (¾ of circle), start top-left
  const arcLength = circumference * 0.75;
  const targetDash = (score.total / 100) * arcLength;

  useEffect(() => {
    if (!arcRef.current || !animate) return;
    arcRef.current.style.strokeDashoffset = String(arcLength);
    const id = requestAnimationFrame(() => {
      if (!arcRef.current) return;
      arcRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
      arcRef.current.style.strokeDashoffset = String(arcLength - targetDash);
    });
    return () => cancelAnimationFrame(id);
  }, [score.total, arcLength, targetDash, animate]);

  const breakdown = [
    { label: "Nutrition", value: score.breakdown.nutrition, max: 40 },
    { label: "Ingredients", value: score.breakdown.ingredients, max: 30 },
    { label: "Processing", value: score.breakdown.processing, max: 20 },
    { label: "Profile", value: score.breakdown.profile_match, max: 10 },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {/* ── Dial ── */}
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(128,128,128,0.15)"
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(135 ${cx} ${cy})`}
          />
          {/* Filled arc */}
          <circle
            ref={arcRef}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={animate ? arcLength : arcLength - targetDash}
            transform={`rotate(135 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 ${size * 0.04}px ${color}66)` }}
          />
        </svg>

        {/* ── Center text ── */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mt: "-4px",
          }}
        >
          <Typography
            sx={{
              fontSize: size * 0.26,
              fontWeight: 700,
              lineHeight: 1,
              color,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score.total}
          </Typography>
          <Typography
            sx={{
              fontSize: size * 0.13,
              fontWeight: 600,
              color,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              mt: "2px",
            }}
          >
            {score.grade}
          </Typography>
          <Typography
            sx={{
              fontSize: size * 0.085,
              color: "text.secondary",
              mt: "2px",
            }}
          >
            {GRADE_LABEL[score.grade]}
          </Typography>
        </Box>
      </Box>

      {/* ── Breakdown bars ── */}
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.75 }}>
        {breakdown.map(({ label, value, max }) => {
          const pct = (value / max) * 100;
          return (
            <Tooltip
              key={label}
              title={`${value} / ${max} pts`}
              placement="left"
              arrow
            >
              <Box sx={{ cursor: "default" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                    {label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                    {value}/{max}
                  </Typography>
                </Box>
                <Box sx={{ height: 4, borderRadius: 2, bgcolor: "rgba(128,128,128,0.15)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      width: `${pct}%`,
                      bgcolor: color,
                      borderRadius: 2,
                      opacity: 0.75,
                      transition: "width 1s ease",
                    }}
                  />
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
