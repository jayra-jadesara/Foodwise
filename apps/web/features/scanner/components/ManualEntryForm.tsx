// ─────────────────────────────────────────────
// FoodWise · Scanner · ManualEntryForm
// Fallback barcode input when camera unavailable
// ─────────────────────────────────────────────

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Typography,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { ManualEntrySchema, type ManualEntryInput } from "../schemas";

interface Props {
  onSubmit: (barcode: string) => void;
  loading?: boolean;
}

export function ManualEntryForm({ onSubmit, loading = false }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(ManualEntrySchema),
    defaultValues: { barcode: "" },
  });

  const onValid = (data: ManualEntryInput) => {
    onSubmit(data.barcode);
    reset();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onValid)}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      noValidate
    >
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Enter the barcode number printed on the product
      </Typography>

      <TextField
        {...register("barcode")}
        label="Barcode"
        type="tel"
        inputMode="numeric"
        placeholder="e.g. 5449000000996"
        error={!!errors.barcode}
        helperText={errors.barcode?.message}
        autoFocus
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <QrCodeScannerIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": { borderRadius: 3 },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={loading}
        sx={{
          borderRadius: 3,
          py: 1.5,
          fontWeight: 700,
          textTransform: "none",
          fontSize: "1rem",
        }}
      >
        {loading ? "Looking up…" : "Look up product"}
      </Button>
    </Box>
  );
}
