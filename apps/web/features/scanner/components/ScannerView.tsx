'use client';

import React, { useState, useCallback } from 'react';
import { Box, Tab, Tabs, Typography, Snackbar, Alert, Paper } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HistoryIcon from '@mui/icons-material/History';
import CameraIcon from '@mui/icons-material/Camera';

// Hooks & Queries
import { useCamera } from '../hooks/use-camera';
import { useBarcodeScan, useScanHistory } from '../queries/use-scanner';

// Components
import { ScanResultSheet } from './ScanResultSheet';
import { ManualEntryForm } from './ManualEntryForm';
import { ScanHistoryList } from './ScanHistoryList';
import { OcrScanner } from './OcrScanner';

import type { ScanResult } from '../types';

type TabValue = 'barcode' | 'ocr' | 'manual' | 'history';

export function ScannerView({ userId }: { userId?: string }) {
  const [tab, setTab] = useState<TabValue>('barcode');
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);

  const [errorSnackbar, setErrorSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // 1. Barcode Mutation
  const { mutate: scanBarcode, isPending: scanning } = useBarcodeScan({
    onSuccess: (data) => {
      setCurrentResult(data);
      setResultSheetOpen(true);
    },
    onError: (err: any) => {
      setErrorSnackbar({
        open: true,
        message: err.error || 'Product not found. Try again.'
      });
    },
  });

  // 2. Camera Logic for Barcode
  const handleBarcodeDetected = useCallback((result: { rawValue: string }) => {
    if (scanning || resultSheetOpen) return;
    scanBarcode(result.rawValue);
  }, [scanBarcode, scanning, resultSheetOpen]);

  const { videoRef, status: cameraStatus } = useCamera({
    onDetected: handleBarcodeDetected,
    enabled: tab === 'barcode',
  });

  // 3. Fetch History
  const { data: history, isLoading: historyLoading } = useScanHistory(userId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', bgcolor: 'background.default' }}>

      {/* ── Tabs ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabValue)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}
      >
        <Tab value="barcode" icon={<QrCodeScannerIcon />} label="Barcode" />
        <Tab value="ocr" icon={<CameraIcon />} label="Ingredients" />
        <Tab value="manual" icon={<KeyboardIcon />} label="Manual" />
        <Tab value="history" icon={<HistoryIcon />} label="Recent" />
      </Tabs>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* TAB 1: Barcode Camera */}
        {tab === 'barcode' && (
          <Box sx={{ height: '100%', bgcolor: '#000', position: 'relative' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              muted
            />
            {/* Viewfinder Overlay */}
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <Box sx={{
                width: '70%', height: '30%', border: '2px solid white',
                borderRadius: 4, boxShadow: '0 0 0 1000px rgba(0,0,0,0.4)'
              }} />
            </Box>
            <Typography variant="caption" sx={{
              position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', color: 'white'
            }}>
              Align barcode inside the frame
            </Typography>
          </Box>
        )}

        {/* TAB 2: OCR Scanner */}
        {tab === 'ocr' && <OcrScanner />}

        {/* TAB 3: Manual Entry */}
        {tab === 'manual' && (
          <Box sx={{ p: 4 }}>
            <ManualEntryForm onSubmit={(b) => scanBarcode(b)} loading={scanning} />
          </Box>
        )}

        {/* TAB 4: History */}
        {tab === 'history' && (
          <ScanHistoryList
            items={history || []}
            loading={historyLoading}
            onSelect={(barcode) => scanBarcode(barcode)}
          />
        )}
      </Box>

      {/* ── Result Sheet ── */}
      <ScanResultSheet
        open={resultSheetOpen}
        onClose={() => setResultSheetOpen(false)}
        result={currentResult}
        loading={scanning}
      />

      {/* ── Error Notification ── */}
      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setErrorSnackbar({ ...errorSnackbar, open: false })}
      >
        <Alert severity="error" variant="filled">{errorSnackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}