'use client';

import React from 'react';
import {
    Container,
    Typography,
    Grid2 as Grid,
    Paper,
    Box,
    Button,
    Stack,
    Avatar
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Hello, HealthWise! 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Ready to check your groceries today?
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>U</Avatar>
            </Stack>

            <Grid container spacing={3}>
                {/* Quick Action: Scan */}
                <Grid size={{ xs: 12 }}>
                    <Paper
                        sx={{
                            p: 3,
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700}>New Scan</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                                Analyze ingredients and health scores instantly.
                            </Typography>
                            <Button
                                component={Link}
                                href="/scan"
                                variant="contained"
                                color="inherit"
                                startIcon={<QrCodeScannerIcon />}
                                sx={{ color: 'primary.main', fontWeight: 700, bgcolor: 'white', '&:hover': { bgcolor: '#f0f0f0' } }}
                            >
                                Open Camera
                            </Button>
                        </Box>
                        <QrCodeScannerIcon sx={{ fontSize: 80, opacity: 0.2 }} />
                    </Paper>
                </Grid>

                {/* Stats Cards */}
                <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                        <HistoryIcon color="primary" sx={{ mb: 1 }} />
                        <Typography variant="h5" fontWeight={700}>12</Typography>
                        <Typography variant="caption" color="text.secondary">Scans this week</Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                        <TrendingUpIcon color="secondary" sx={{ mb: 1 }} />
                        <Typography variant="h5" fontWeight={700}>82</Typography>
                        <Typography variant="caption" color="text.secondary">Avg. Health Score</Typography>
                    </Paper>
                </Grid>

                {/* Placeholder for Recent Activity */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Recent Activity
                    </Typography>
                    <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
                        <Typography variant="body2" color="text.secondary">
                            Your scan history will appear here.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}