"use client";

import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Button,
  Container,
} from "@mui/material";
import { useRouter } from "next/navigation";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import LightModeIcon from "@mui/icons-material/LightMode";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ScanHelpPage() {
  const router = useRouter();

  const handleBack = () => router.back();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 12 }}>
      {/* ── TOP APP BAR ── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton onClick={handleBack} sx={{ color: "primary.main" }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Help Guide
        </Typography>
        <Box sx={{ width: 40 }} /> {/* Spacer for centering */}
      </Box>

      <Container maxWidth="sm" sx={{ pt: 4, pb: 4 }}>
        {/* ── HEADER SECTION ── */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "surface-container-high", // custom color from your config
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              mx: "auto",
              mb: 2,
              backgroundColor: "#e5eeff",
            }}
          >
            <QrCodeScannerIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontFamily: "Plus Jakarta Sans", fontWeight: 800, color: "primary",
            }}
          >
            How to Scan Successfully
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Follow these simple steps to get accurate nutritional info every time
            you scan.
          </Typography>
        </Box>

        {/* ── INSTRUCTIONS LIST ── */}
        <Stack spacing={2}>
          {/* Step 1 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle background blob */}
            <Box sx={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, bgcolor: '#eff4ff', borderRadius: '50%', zIndex: 0 }} />

            <Stack direction="row" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#002b49", color: "white", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CenterFocusStrongIcon />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary" }}>Align the Barcode</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                  Hold your phone steady and ensure the entire barcode fits inside the white viewfinder frame.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Step 2 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: 'absolute', left: -20, bottom: -20, width: 80, height: 80, bgcolor: '#6bfe9c22', borderRadius: '50%', zIndex: 0 }} />

            <Stack direction="row" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#d3e4fe", color: "#001629", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LightModeIcon />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary" }}>Find Good Lighting</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                  Avoid harsh glare or deep shadows. If it's too dark, tap the flashlight icon on the scanner screen.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Step 3 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: 'absolute', right: '40%', top: '20%', width: 100, height: 100, bgcolor: '#ffdad633', borderRadius: '50%', zIndex: 0 }} />

            <Stack direction="row" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#e5eeff", color: "#001629", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ZoomInIcon />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary" }}>Check the Distance</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                  Hold the phone about 4-6 inches away. If it's blurry, pull back slightly to let the camera focus.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Troubleshooting */}
          <Box sx={{ p: 2.5, bgcolor: "#d3e4fe", borderRadius: 4, border: '1px solid #c3c7ce' }}>
            <Stack direction="row" sx={{ mb: 1, color: 'primary.main', spacing: 1, alignItems: "center" }}>
              <InfoIcon fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>If the scan fails...</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              Sometimes crinkled barcodes won't read. Try flattening the package or manually typing the product name on the Home tab.
            </Typography>
          </Box>
        </Stack>
      </Container>

      {/* ── FIXED ACTION AREA ── */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
          bgcolor: "rgba(248, 249, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid",
          borderColor: "divider",
          zIndex: 110,
        }}
      >
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<CheckCircleIcon />}
          onClick={handleBack}
          sx={{
            py: 1.5,
            borderRadius: 3,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "0 8px 16px rgba(0,22,41,0.2)",
          }}
        >
          Got it, return to Scanner
        </Button>
      </Box>
    </Box>
  );
}