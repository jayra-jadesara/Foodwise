"use client";

import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";

// Import your browser client
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { SplashLoader } from "@/shared/components/SplashLoader";
import TopNavbar from "@/shared/components/TopNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  // ── Loading State (Prevents "Flicker") ─────────
  if (isLoading) {
    return (
      <SplashLoader />
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
      {/* ── LOGO NAVBAR ── */}
      <TopNavbar />

      {children}
    </Box>
  );
}