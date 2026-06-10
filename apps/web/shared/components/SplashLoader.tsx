"use client";

import React from "react";
import { Box, Typography, Stack, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";

export function SplashLoader() {
    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#001629", // The deep primary navy
            }}
        >
            <Stack sx={{ width: "100%", maxWidth: 240, spacing: 3, alignItems: "center" }}>

                {/* ── MINIMALIST LINE-ART LOGO ── */}
                <Box sx={{ position: "relative", width: 80, height: 80 }}>

                    {/* Subtle Background Glow */}
                    <motion.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{
                            position: "absolute",
                            inset: -40,
                            background: "radial-gradient(circle, rgba(212,246,122,0.15) 0%, transparent 70%)",
                            borderRadius: "50%",
                        }}
                    />

                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* The Apple Outline - "Drawing" Animation */}
                        <motion.path
                            d="M12 21C15.5 21 18.5 19 20 15C21.5 11 20.5 6 17 4C15.5 3 13.5 3 12 4C10.5 3 8.5 3 7 4C3.5 6 2.5 11 4 15C5.5 19 8.5 21 12 21Z"
                            stroke="#006d37"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* The Leaf */}
                        <motion.path
                            d="M12 4C12 2 14 1 16 1"
                            stroke="#006d37"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </svg>

                    {/* Elegant Scan Bar (Contained within the logo) */}
                    <motion.div
                        animate={{ top: ["20%", "80%", "20%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            left: "15%",
                            right: "15%",
                            height: "1px",
                            background: "linear-gradient(90deg, transparent, #006d37, transparent)",
                            boxShadow: "0 0 10px #006d37",
                            zIndex: 5,
                        }}
                    />
                </Box>

                {/* ── TYPOGRAPHY & PROGRESS ── */}
                <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography
                        sx={{
                            fontSize: "1.2rem",
                            fontWeight: 900,
                            letterSpacing: "0.1em",
                            mb: 1.5,
                        }}
                    >
                        <span style={{ color: '#ffffff' }}>
                            Food
                        </span>
                        <span style={{ color: '#008a41' }}>
                            Wise
                        </span>
                    </Typography>

                    {/* Professional Minimalist Progress Bar */}
                    <Box sx={{ width: "60%", mx: "auto", overflow: "hidden", borderRadius: 1 }}>
                        <LinearProgress
                            sx={{
                                height: 2,
                                bgcolor: "rgba(255,255,255,0.1)",
                                "& .MuiLinearProgress-bar": { bgcolor: "#006d37" }
                            }}
                        />
                    </Box>

                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            mt: 2,
                            color: "rgba(255,255,255,0.4)",
                            fontWeight: 600,
                            letterSpacing: 1
                        }}
                    >
                        Loading...
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}