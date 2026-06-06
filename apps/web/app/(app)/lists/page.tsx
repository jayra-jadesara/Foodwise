"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { GroceryListsView } from "@/features/lists/components/GroceryListsView";

export default async function ListsPage() {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = await getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: lists } = await supabase
        .from("grocery_lists")
        .select(`
      id, title, is_archived, created_at, created_by,
      grocery_list_items (id, is_completed)
    `)
        .eq("created_by", user?.id ?? "")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      setState({ user, initialLists: lists ?? [], userId: user?.id });
    }
    loadData();
  }, []);


  return <GroceryListsView {...state} />;
}
