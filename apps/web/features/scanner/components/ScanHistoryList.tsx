// ─────────────────────────────────────────────
// FoodWise · Scanner · ScanHistoryList
// Recent scans — hydration-safe relative timestamps
// ─────────────────────────────────────────────

"use client";

import {
  List, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, Typography, Box, Skeleton, Chip, Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { ScanHistoryItem } from "../types";

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", F: "#ef4444",
};

// ── Hydration-safe relative time ──────────────
// Renders nothing on server, fills in on client after mount.
function RelativeTime({ dateStr }: { dateStr: string }) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    setLabel(formatDistanceToNow(new Date(dateStr), { addSuffix: true }));
    // Update every 60s so it stays fresh
    const id = setInterval(() => {
      setLabel(formatDistanceToNow(new Date(dateStr), { addSuffix: true }));
    }, 60_000);
    return () => clearInterval(id);
  }, [dateStr]);

  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
      {label}
    </Typography>
  );
}

interface Props {
  items: ScanHistoryItem[];
  loading?: boolean;
  onSelect: (barcode: string) => void;
}

export function ScanHistoryList({ items, loading = false, onSelect }: Props) {
  if (loading) {
    return (
      <Box>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1.5, px: 2, py: 1.5 }}>
            <Skeleton variant="rounded" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="65%" height={18} />
              <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="circular" width={36} height={36} />
          </Box>
        ))}
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography fontSize="2rem">📦</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No scans yet. Scan a product to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {items.map((item, idx) => {
        const color = GRADE_COLOR[item.health_score_grade] ?? "#888";
        return (
          <Box key={item.id}>
            <ListItemButton onClick={() => onSelect(item.barcode)} sx={{ px: 2, py: 1.25, gap: 1.5 }}>
              <ListItemAvatar sx={{ minWidth: "auto" }}>
                <Avatar
                  src={item.product_image}
                  variant="rounded"
                  alt={item.product_name}
                  sx={{ width: 44, height: 44, bgcolor: "action.selected", fontSize: "1.2rem" }}
                >
                  🛒
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600}
                    sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                    {item.product_name}
                  </Typography>
                }
                secondary={<RelativeTime dateStr={item.scanned_at} />}
                sx={{ my: 0, overflow: "hidden" }}
              />

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color, lineHeight: 1 }}>
                  {item.health_score_total}
                </Typography>
                <Chip
                  label={item.health_score_grade}
                  size="small"
                  sx={{
                    bgcolor: `${color}22`, color, fontWeight: 700,
                    fontSize: "0.6rem", height: 18, border: `1px solid ${color}55`, px: 0.5,
                  }}
                />
              </Box>
            </ListItemButton>
            {idx < items.length - 1 && <Divider component="li" variant="inset" />}
          </Box>
        );
      })}
    </List>
  );
}
