"use client";

import React, { useEffect, useState } from "react";
import { Box, BottomNavigation, BottomNavigationAction, Paper, CircularProgress } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonIcon from "@mui/icons-material/Person";

// Import your browser client
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Home", value: "/dashboard", icon: <DashboardIcon /> },
  { label: "Scan", value: "/scan", icon: <QrCodeScannerIcon /> },
  { label: "Lists", value: "/lists", icon: <ListAltIcon /> },
  { label: "Profile", value: "/profile", icon: <PersonIcon /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();

  const [isLoading, setIsLoading] = useState(true);

  // ── Auth Guard for Mobile & Web ────────────────
  useEffect(() => {
    const checkUser = async () => {
      // 1. Check current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // 2. Not logged in? Send to login
        router.replace("/login");
      } else {
        // 3. Logged in? Reveal the app
        setIsLoading(false);
      }
    };

    checkUser();

    // 4. Listen for Logout (Auto-redirect if session expires)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // Determine active tab
  const activeValue =
    NAV_ITEMS.find((item) => pathname.startsWith(item.value))?.value ?? "/dashboard";

  // ── Loading State (Prevents "Flicker") ─────────
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        // Add padding at bottom to respect Safe Areas on iPhone/Android
        pb: "calc(56px + env(safe-area-inset-bottom, 16px))",
        minHeight: "100dvh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}

      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderTop: "1px solid",
          borderColor: "divider",
          // Extra padding for mobile "Home Bar"
          pb: "env(safe-area-inset-bottom, 0px)",
        }}
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={activeValue}
          onChange={(_, newValue: string) => router.push(newValue)}
          sx={{ height: 56 }}
        >
          {NAV_ITEMS.map(({ label, value, icon }) => (
            <BottomNavigationAction
              key={value}
              label={label}
              value={value}
              icon={icon}
              sx={{
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.65rem",
                  fontWeight: 600,
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}