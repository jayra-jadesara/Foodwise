"use client";

import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Container,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BackspaceIcon from "@mui/icons-material/Backspace";

import { ManualEntrySchema, type ManualEntryInput } from "../schemas";

interface Props {
  onSubmit: (barcode: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function BarcodeIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
    >
      <rect x="5" y="15" width="4" height="50" />
      <rect x="12" y="15" width="2" height="50" />
      <rect x="18" y="15" width="6" height="50" />
      <rect x="28" y="15" width="3" height="50" />
      <rect x="35" y="15" width="7" height="50" />
      <rect x="46" y="15" width="2" height="50" />
      <rect x="52" y="15" width="5" height="50" />
      <rect x="61" y="15" width="3" height="50" />
      <rect x="68" y="15" width="6" height="50" />
      <rect x="78" y="15" width="2" height="50" />
      <rect x="84" y="15" width="5" height="50" />
      <rect x="93" y="15" width="2" height="50" />
    </svg>
  );
}

export function ManualEntryForm({ onSubmit, onCancel, loading = false }: Props) {
  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(ManualEntrySchema),
    defaultValues: { barcode: "" },
  });

  const barcodeValue = watch("barcode");
  const MAX_LENGTH = 13;

  const triggerHaptic = (strength: number = 15) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(strength);
    }
  };

  const handleKeyPress = useCallback((digit: string) => {
    if (barcodeValue.length < MAX_LENGTH) {
      triggerHaptic();
      setValue("barcode", barcodeValue + digit, { shouldValidate: true });
    }
  }, [barcodeValue, setValue]);

  const handleDelete = useCallback(() => {
    triggerHaptic(10);
    setValue("barcode", barcodeValue.slice(0, -1), { shouldValidate: true });
  }, [barcodeValue, setValue]);

  const onValid = (data: ManualEntryInput) => {
    onSubmit(data.barcode);
  };

  const formattedBarcode = barcodeValue.replace(/(.{4})/g, "$1 ").trim();

  const KeyButton = ({ value, icon }: { value: string; icon?: React.ReactNode }) => (
    <Button
      fullWidth
      onClick={() => (value === "back" ? handleDelete() : handleKeyPress(value))}
      sx={{
        height: { xs: 60, sm: 72 },
        borderRadius: 4,
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "white",
        bgcolor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        transition: "all 0.2s",
        "&:active": { transform: "scale(0.92)", bgcolor: "rgba(255,255,255,0.15)" },
        "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
      }}
    >
      {icon || value}
    </Button>
  );

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "radial-gradient(circle at 50% 0%, #1a2b40 0%, #050a10 100%)",
      }}
    >
      {/* ── HEADER ── */}
      <Box sx={{ p: 2, display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(0,22,41,0.4)", backdropFilter: "blur(10px)" }}>
        <IconButton onClick={onCancel} sx={{ color: "white" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flex: 1, textAlign: "center", color: "white", fontWeight: 700, pr: 5 }}>
          Manual Entry
        </Typography>
      </Box>

      {/* ── SCROLLABLE CONTENT ── */}
      <Box sx={{ flex: 1, overflowY: "auto", display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="xs" sx={{ py: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* ── READOUT SECTION ── */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ opacity: 0.6, display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
              <BarcodeIcon size={64} color={"#a8caef"} />
              <Typography variant="caption" sx={{ color: "#a8caef", letterSpacing: 4, mt: 1, fontWeight: 700 }}>
                SCANNER READOUT
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}>
              Enter Barcode Number
            </Typography>

            <Paper
              elevation={0}
              sx={{
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.05)",
                border: "2px solid",
                borderColor: errors.barcode ? "error.main" : barcodeValue ? "#6bfe9c" : "rgba(255,255,255,0.1)",
                borderRadius: 4,
                boxShadow: barcodeValue ? "0 0 20px rgba(107, 254, 156, 0.15)" : "none",
                position: "relative"
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: barcodeValue ? "white" : "rgba(255,255,255,0.15)",
                  fontFamily: "monospace",
                  letterSpacing: 4,
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}
              >
                {barcodeValue ? formattedBarcode : "0000 0000 0000"}
              </Typography>
              <Box sx={{
                width: 3, height: 30, bgcolor: "#6bfe9c", ml: 1,
                display: barcodeValue.length === MAX_LENGTH ? "none" : "block",
                animation: "pulse 1s infinite",
                "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0 } }
              }} />
            </Paper>
            {errors.barcode && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.barcode.message}
              </Typography>
            )}
          </Box>

          {/* ── KEYPAD ── */}
          <Box sx={{ width: "100%", mb: 4 }}>
            <Grid container spacing={1.5}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                <Grid size={4} key={n}><KeyButton value={n} /></Grid>
              ))}
              <Grid size={4} />
              <Grid size={4}><KeyButton value="0" /></Grid>
              <Grid size={4}><KeyButton value="back" icon={<BackspaceIcon />} /></Grid>
            </Grid>
          </Box>

          {/* ── ACTION BUTTONS (mt: auto ensures they are at bottom of Container) ── */}
          <Box sx={{ mt: "auto", pt: 2, pb: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || barcodeValue.length < 8}
              onClick={handleSubmit(onValid)}
              sx={{
                height: 64,
                borderRadius: 4,
                bgcolor: "#fff",
                color: "#001629",
                fontWeight: 900,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 10px 40px rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "#cfe5ff" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Search Product"}
            </Button>

            <Button
              onClick={onCancel}
              fullWidth
              sx={{
                color: "white",
                opacity: 0.6,
                textTransform: "none",
                py: 1.5,
                fontWeight: 600,
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              Scan Instead
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}