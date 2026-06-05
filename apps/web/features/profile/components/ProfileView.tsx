// ─────────────────────────────────────────────
// FoodWise · ProfileView (Client Component)
// ─────────────────────────────────────────────

"use client";

import {
  Container, Typography, Box, Button, Avatar, Paper,
  Stack, Divider, Chip, Switch, FormControlLabel,
  CircularProgress, Snackbar, Alert,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const ALLERGEN_OPTIONS = [
  "gluten", "dairy", "eggs", "nuts", "peanuts",
  "soy", "shellfish", "fish", "sesame",
];

const GOAL_OPTIONS = [
  "low sugar", "low sodium", "high protein",
  "low fat", "high fibre", "no additives",
];

interface Profile {
  full_name?: string;
  avatar_url?: string;
  email?: string;
  dietary_preferences?: {
    allergens: string[];
    goals: string[];
    is_vegan: boolean;
    is_vegetarian: boolean;
  };
  created_at?: string;
}

interface Props {
  user: User | null;
  profile: Profile | null;
}

export function ProfileView({ user, profile }: Props) {
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

  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  const toggleAllergen = (a: string) =>
    setAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const toggleGoal = (g: string) =>
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const handleSave = async (user: any) => {
    if (!user?.id) return;

    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("users")
      .update({
        dietary_preferences: { allergens, goals, is_vegan: isVegan, is_vegetarian: isVegetarian },
        updated_at: new Date().toISOString(),
      })
      .eq("id", user?.id ?? "");

    setSaving(false);
    setSnackbar({
      open: true,
      message: error ? error.message : "Preferences saved!",
      severity: error ? "error" : "success",
    });
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 4 }}>
      {/* ── Avatar + name ── */}
      <Paper
        variant="outlined"
        sx={{ p: 3, borderRadius: 3, mb: 3, textAlign: "center" }}
      >
        <Avatar
          src={profile?.avatar_url ?? user?.user_metadata?.avatar_url}
          sx={{ width: 72, height: 72, mx: "auto", mb: 1.5, bgcolor: "primary.main", fontSize: "1.8rem", fontWeight: 700 }}
        >
          {displayName[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
        <Typography variant="body2" color="text.secondary">
          {profile?.email ?? user?.email}
        </Typography>
        {profile?.created_at && (
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
            Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Typography>
        )}
      </Paper>

      {/* ── Dietary preferences ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: "action.selected" }}>
          <Typography fontWeight={700} fontSize="0.88rem">Dietary preferences</Typography>
          <Typography variant="caption" color="text.secondary">
            Used to personalise your health scores
          </Typography>
        </Box>
        <Divider />

        <Box sx={{ p: 2.5 }}>
          {/* Vegan / Vegetarian */}
          <Stack spacing={0.5} sx={{ mb: 2.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isVegan}
                  onChange={(e) => setIsVegan(e.target.checked)}
                  color="success"
                  size="small"
                />
              }
              label={<Typography variant="body2">Vegan</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isVegetarian}
                  onChange={(e) => setIsVegetarian(e.target.checked)}
                  color="success"
                  size="small"
                />
              }
              label={<Typography variant="body2">Vegetarian</Typography>}
            />
          </Stack>

          {/* Allergens */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700, letterSpacing: "0.06em", color: "text.secondary",
              fontSize: "0.65rem", textTransform: "uppercase", display: "block", mb: 1
            }}
          >
            Allergens to avoid
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2.5 }} useFlexGap>
            {ALLERGEN_OPTIONS.map((a) => {
              const active = allergens.includes(a);
              return (
                <Chip
                  key={a}
                  label={a}
                  size="small"
                  onClick={() => toggleAllergen(a)}
                  icon={active ? <CheckIcon sx={{ fontSize: "0.8rem !important" }} /> : undefined}
                  sx={{
                    textTransform: "capitalize",
                    fontSize: "0.72rem",
                    fontWeight: active ? 700 : 500,
                    bgcolor: active ? "error.100" : "action.hover",
                    color: active ? "error.dark" : "text.secondary",
                    border: "1px solid",
                    borderColor: active ? "error.light" : "divider",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </Stack>

          {/* Goals */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700, letterSpacing: "0.06em", color: "text.secondary",
              fontSize: "0.65rem", textTransform: "uppercase", display: "block", mb: 1
            }}
          >
            Health goals
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
            {GOAL_OPTIONS.map((g) => {
              const active = goals.includes(g);
              return (
                <Chip
                  key={g}
                  label={g}
                  size="small"
                  onClick={() => toggleGoal(g)}
                  icon={active ? <CheckIcon sx={{ fontSize: "0.8rem !important" }} /> : undefined}
                  sx={{
                    textTransform: "capitalize",
                    fontSize: "0.72rem",
                    fontWeight: active ? 700 : 500,
                    bgcolor: active ? "success.50" : "action.hover",
                    color: active ? "success.dark" : "text.secondary",
                    border: "1px solid",
                    borderColor: active ? "success.light" : "divider",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            size="medium"
            onClick={() => { handleSave(user) }}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </Box>
      </Paper>

      {/* ── Sign out ── */}
      <Button
        variant="outlined"
        fullWidth
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleSignOut}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.25 }}
      >
        Sign out
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
