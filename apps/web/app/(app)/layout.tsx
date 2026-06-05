'use client';

import React from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Fixed import
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Main Content Area */}
      {children}

      {/* Persistent Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={pathname}
          onChange={(_, newValue) => router.push(newValue)}
        >
          <BottomNavigationAction
            label="Home"
            value="/dashboard"
            icon={<DashboardIcon />}
          />
          <BottomNavigationAction
            label="Scan"
            value="/scan"
            icon={<QrCodeScannerIcon />}
          />
          <BottomNavigationAction
            label="History"
            value="/scan" // Temporary until history page is built
            icon={<HistoryIcon />}
          />
          <BottomNavigationAction
            label="Profile"
            value="/profile"
            icon={<PersonIcon />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}