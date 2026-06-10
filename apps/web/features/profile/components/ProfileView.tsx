"use client";

import React, { useState } from "react";
import {
  Container, Typography, Box, Button, Avatar, Paper,
  Stack, Chip, CircularProgress,
  Snackbar, Alert, Grid
} from "@mui/material";

// Icons
import LogoutIcon from "@mui/icons-material/Logout";
import CheckIcon from "@mui/icons-material/Check";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AdsClickIcon from "@mui/icons-material/AdsClick";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";

const ALLERGEN_OPTIONS = [
  "gluten", "dairy", "eggs", "nuts", "peanuts",
  "soy", "shellfish", "fish", "sesame",
];

const GOAL_OPTIONS = [
  "low sugar", "low sodium", "high protein",
  "low fat", "high fibre", "no additives",
];

// ... (Interface definitions remain the same as your code)

export function ProfileView({ user, profile }: any) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  const prefs = profile?.dietary_preferences ?? {
    allergens: [], goals: [], is_vegan: false, is_vegetarian: false,
  };

  const [allergens, setAllergens] = useState<string[]>(prefs.allergens ?? []);
  const [goals, setGoals] = useState<string[]>(prefs.goals ?? []);
  const [isVegan, setIsVegan] = useState(prefs.is_vegan ?? false);
  const [isVegetarian, setIsVegetarian] = useState(prefs.is_vegetarian ?? false);
  const supabase = getSupabaseBrowserClient();

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const toggleAllergen = (a: string) => {
    triggerHaptic();
    setAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const toggleGoal = (g: string) => {
    triggerHaptic();
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("users")
      .update({
        dietary_preferences: { allergens, goals, is_vegan: isVegan, is_vegetarian: isVegetarian },
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    setSnackbar({
      open: true,
      message: error ? error.message : "Preferences updated successfully!",
      severity: error ? "error" : "success",
    });
  };

  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? "Health Seeker";

  return (
    <Box sx={{ bgcolor: "#f8f9ff", minHeight: "100vh", pb: 10 }}>
      {/* ── HEADER SECTION ── */}
      <Box sx={{
        bgcolor: "#d4f67a", // Lime Green accent from Login
        pt: 2, pb: 2, textAlign: 'center',
        borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px'
      }}>
        <Avatar
          src={profile?.avatar_url ?? user?.user_metadata?.avatar_url}
          sx={{
            width: 60, height: 60, mx: "auto", mb: 1,
            border: '4px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            bgcolor: '#001629', fontSize: '2rem', fontWeight: 900
          }}
        >
          {displayName[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#001629' }}>
          {displayName}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0,22,41,0.6)', fontWeight: 600, mb: 1 }}>
          {user?.email}
        </Typography>
      </Box>

      <Container maxWidth="xs" sx={{ mt: -2 }}>
        <Stack spacing={3}>


          {/* ── ALLERGENS BENTO ── */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #d3e4fe", boxShadow: '0 4px 20px rgba(0,22,41,0.03)' }}>
            <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
              <SettingsSuggestIcon fontSize="small" /> Lifestyle Choices
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box
                  onClick={() => { triggerHaptic(); setIsVegan(!isVegan); }}
                  sx={{
                    p: 1, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                    border: '2px solid', borderColor: isVegan ? '#006d37' : '#eee',
                    bgcolor: isVegan ? '#f0fdf4' : 'transparent', transition: '0.2s'
                  }}
                >
                  <Typography variant="h4" sx={{ fontSize: '20px', mb: 1 }}>🌱</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isVegan ? '#006d37' : 'text.secondary' }}>VEGAN</Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box
                  onClick={() => { triggerHaptic(); setIsVegetarian(!isVegetarian); }}
                  sx={{
                    p: 1, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                    border: '2px solid', borderColor: isVegetarian ? '#006d37' : '#eee',
                    bgcolor: isVegetarian ? '#f0fdf4' : 'transparent', transition: '0.2s'
                  }}
                >
                  <Typography variant="h4" sx={{ fontSize: '20px', mb: 1 }}>🥦</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isVegetarian ? '#006d37' : 'text.secondary' }}>VEGETARIAN</Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', paddingTop: "1rem", letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningAmberIcon fontSize="small" /> My Allergens
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }} >
              {ALLERGEN_OPTIONS.map((a) => {
                const active = allergens.includes(a);
                return (
                  <Chip
                    key={a} label={a} size="medium" onClick={() => toggleAllergen(a)}
                    sx={{
                      textTransform: "capitalize", fontWeight: 700, borderRadius: 1,
                      bgcolor: active ? "#ef4444" : "white",
                      color: active ? "white" : "text.primary",
                      border: "1px solid", borderColor: active ? "#ef4444" : "#e5eeff",
                      "&:hover": { bgcolor: active ? "#dc2626" : "#f1f5f9" }
                    }}
                  />
                );
              })}
            </Stack>

            <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', paddingTop: "1rem", letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AdsClickIcon fontSize="small" /> Health Goals
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {GOAL_OPTIONS.map((g) => {
                const active = goals.includes(g);
                return (
                  <Chip
                    key={g} label={g} size="medium" onClick={() => toggleGoal(g)}
                    icon={active ? <CheckIcon sx={{ color: "white !important", fontSize: 16 }} /> : undefined}
                    sx={{
                      textTransform: "capitalize", fontWeight: 700, borderRadius: 1,
                      bgcolor: active ? "#001629" : "white",
                      color: active ? "white" : "text.primary",
                      border: "1px solid", borderColor: active ? "#001629" : "#e5eeff",
                      "&:hover": { bgcolor: active ? "#001629" : "#f1f5f9" }
                    }}
                  />
                );
              })}
            </Stack>
          </Paper>

          {/* ── ACTIONS ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained" fullWidth size="large"
              onClick={handleSave} disabled={saving}
              sx={{
                py: 2, borderRadius: 4, bgcolor: '#006d37', fontWeight: 900,
                fontSize: '1rem', textTransform: 'none', boxShadow: '0 8px 24px rgba(0, 109, 55, 0.2)'
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : "Update My Profile"}
            </Button>

            <Button
              variant="text" fullWidth color="error"
              startIcon={<LogoutIcon />} onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              sx={{ fontWeight: 800, textTransform: 'none', opacity: 0.6 }}
            >
              Sign out of account
            </Button>
          </Box>
        </Stack>
      </Container>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}