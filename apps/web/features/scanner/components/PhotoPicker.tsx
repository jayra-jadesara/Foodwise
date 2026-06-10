"use client";

import React, { useState, useRef } from "react";
import {
    Box, Typography, Button, Stack
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

// Capacitor Imports
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { SplashLoader } from "@/shared/components/SplashLoader";

interface Props {
    onSelect: (base64: string) => void;
    onCancel: () => void;
}

export function PhotoPicker({ onSelect, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── NATIVE PICKER LOGIC ──────────────────────
    const handleOpenSystemGallery = async () => {
        if (Capacitor.isNativePlatform()) {
            // 1. MOBILE NATIVE (Android/iOS)
            try {
                const image = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.Base64,
                    source: CameraSource.Photos // Force Gallery
                });

                if (image.base64String) {
                    onSelect(image.base64String);
                }
            } catch (error) {
                console.log('User cancelled selection');
            }
        } else {
            // 2. WEB FALLBACK (PWA/Browser)
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            onSelect(base64);
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <Box sx={{
            position: "fixed", inset: 0, zIndex: 4000, bgcolor: "background.default",
            display: "flex", flexDirection: "column"
        }}>
            {/* Hidden Input for Web */}
            <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* ── HEADER ── */}
            <Box sx={{
                p: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid", borderColor: "divider", bgcolor: "white"
            }}>
                <Button
                    startIcon={<CloseIcon />}
                    onClick={onCancel}
                    sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Choose Photo</Typography>
                <Box sx={{ width: 64 }} /> {/* Balance Spacer */}
            </Box>

            {/* ── MAIN CONTENT ── */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
                {loading ? (
                    <SplashLoader />
                ) : (
                    <Stack sx={{ spacing: 3, alignItems: "center" }} >
                        {/* Immersive Icon Design */}
                        <Box sx={{
                            width: 120, height: 120, borderRadius: '50%',
                            bgcolor: 'surface-container-highest', // or #e5eeff
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#eff4ff', color: 'primary.main'
                        }}>
                            <AddPhotoAlternateIcon sx={{ fontSize: 60 }} />
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                Select from Gallery
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
                                Choose a high-quality photo of the ingredient label for the most accurate results.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handleOpenSystemGallery}
                            sx={{
                                py: 2, px: 8, borderRadius: 4, bgcolor: '#00A651',
                                fontWeight: 800, textTransform: 'none', fontSize: '1.1rem',
                                boxShadow: '0 8px 24px rgba(0, 166, 81, 0.25)'
                            }}
                        >
                            Open Phone Gallery
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* ── FOOTER HINT ── */}
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled">
                    Supports JPG, PNG, and HEIC formats.
                </Typography>
            </Box>
        </Box>
    );
}