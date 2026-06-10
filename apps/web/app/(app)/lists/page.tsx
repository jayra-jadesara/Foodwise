"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { GroceryListsView } from "@/features/lists/components/GroceryListsView";
import { SplashLoader } from "@/shared/components/SplashLoader";

export default function ListsPage() {
  const [lists, setLists] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadLists() {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // 2. Fetch Lists directly from Supabase (Mobile-ready)
      const { data, error } = await supabase
        .from("grocery_lists")
        .select(`
          id, title, is_archived, created_at, created_by,
          grocery_list_items (id, is_completed)
        `)
        .eq("created_by", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (!error) {
        setLists(data || []);
      }
      setLoading(false);
    }

    loadLists();
  }, [supabase]);

  // Prevent rendering the view until we have at least checked for the user
  if (loading) {
    return (
      <SplashLoader />
    );
  }

  return <GroceryListsView userId={userId} initialLists={lists} />;
}