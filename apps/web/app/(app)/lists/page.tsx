// ─────────────────────────────────────────────
// FoodWise · Lists Page
// ─────────────────────────────────────────────

"use client";

import { getSupabaseServerClient } from "@/shared/lib/supabase/server";
import { GroceryListsView } from "@/features/lists/components/GroceryListsView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Grocery Lists — FoodWise" };

export default async function ListsPage() {
  const supabase = await getSupabaseServerClient();
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

  return <GroceryListsView userId={user?.id} initialLists={lists ?? []} />;
}
