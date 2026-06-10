"use client";

import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function LoginPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white", position: "relative", overflow: "hidden" }}>

      {/* ── YELLOW HEADER SECTION ── */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45vh",
          bgcolor: "#cff576", // Vibrant FoodWise Yellow
          borderBottomLeftRadius: "50% 20%",
          borderBottomRightRadius: "50% 20%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 4,
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            color: '#001629',
            letterSpacing: 2,
          }}
        >
          FoodWise
        </Typography>

        {/* ── APPLE ILLUSTRATION RECREATION ── */}
        <Box sx={{ position: 'relative', mt: 1 }}>
          {/* White Circle Background */}
          <Box sx={{
            width: 220, height: 220, bgcolor: 'white', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
          }}>
            {/* The "FoodWise Apple" Character */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h1" sx={{ fontSize: '80px', lineHeight: 1 }}>🍎</Typography>
              <Box sx={{
                mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #ddd',
                transform: 'rotate(-5deg)', boxShadow: '5px 5px 0px #001629'
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 900,
                    color: '#001629'
                  }}
                >
                  JOIN THE FAMILY!
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── FORM SECTION ── */}
      <Container
        maxWidth="sm"
        sx={{
          position: "relative",
          zIndex: 10,
          mt: "40vh", // Pushes form down to start near the curve
          pb: 4
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: '#001629'
            }}
          >
            Create Account
          </Typography>
        </Box>

        <SignupForm />
      </Container>
    </Box>
  );
}