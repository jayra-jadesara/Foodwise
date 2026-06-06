// ─────────────────────────────────────────────
// FoodWise · Profile Page
// ─────────────────────────────────────────────
"use client";

import { getSupabaseServerClient } from "@/shared/lib/supabase/server";
import { ProfileView } from "@/features/profile/components/ProfileView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile — FoodWise" };

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load extended profile from public.users
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url, email, dietary_preferences, created_at")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return <ProfileView user={user} profile={profile} />;
}
