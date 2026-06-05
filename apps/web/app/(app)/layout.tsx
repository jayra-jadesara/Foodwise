// ─────────────────────────────────────────────
// FoodWise · App Layout
// app/(app)/layout.tsx
// Bottom navigation + auth-gated shell
// ─────────────────────────────────────────────

"use client";

import { Box, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonIcon from "@mui/icons-material/Person";

const NAV_ITEMS = [
  { label: "Home",   value: "/dashboard", icon: <DashboardIcon /> },
  { label: "Scan",   value: "/scan",      icon: <QrCodeScannerIcon /> },
  { label: "Lists",  value: "/lists",     icon: <ListAltIcon /> },
  { label: "Profile",value: "/profile",   icon: <PersonIcon /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab — match by prefix so /scan/* stays active
  const activeValue =
    NAV_ITEMS.find((item) => pathname.startsWith(item.value))?.value ?? "/dashboard";

  return (
    <Box
      sx={{
        pb: "56px",         // height of bottom nav
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
