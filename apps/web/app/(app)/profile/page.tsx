"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { ProfileView } from "@/features/profile/components/ProfileView";

export default function ProfilePage() {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = await getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Load extended profile from public.users
      const { data: profile } = await supabase
        .from("users")
        .select("full_name, avatar_url, email, dietary_preferences, created_at")
        .eq("id", user?.id ?? "")
        .maybeSingle();

      setState({ user, profile });
    }
    loadData();
  }, []);


  return <ProfileView {...state} />;
}
