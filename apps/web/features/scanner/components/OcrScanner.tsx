// apps/web/features/scanner/components/OcrScanner.tsx
'use client';

import React, { useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Paper, Chip, Stack } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useOcrScan } from '../hooks/useOcrScan';

export const OcrScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { mutate: analyze, isPending, data: results } = useOcrScan();

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(imageData);
      analyze(imageData);
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!preview ? (
        <Paper elevation={3} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', display: 'block' }}
            onCanPlay={() => videoRef.current?.play()}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<CameraAltIcon />}
            onClick={captureImage}
            sx={{ position: 'absolute', bottom: 16, width: 'calc(100% - 32px)', mx: 2 }}
          >
            Scan Ingredients
          </Button>
        </Paper>
      ) : (
        <Button onClick={() => setPreview(null)}>Scan Another</Button>
      )}

      {isPending && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>Analyzing ingredients with AI...</Typography>
        </Box>
      )}

      {results && (
        <Stack spacing={2}>
          <Typography variant="h6">Risk Analysis</Typography>
          {results.risks.map((risk, i) => (
            <Paper key={i} sx={{ p: 2, borderLeft: 6, borderColor: 
              risk.risk_level === 'high' ? 'error.main' : 
              risk.risk_level === 'medium' ? 'warning.main' : 'success.main' 
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="bold">{risk.ingredient}</Typography>
                <Chip label={risk.category} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">{risk.reason}</Typography>
            </Paper>
          ))}
          <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="subtitle2">Summary</Typography>
            <Typography variant="body2">{results.health_summary}</Typography>
          </Paper>
        </Stack>
      )}
    </Box>
  );
};