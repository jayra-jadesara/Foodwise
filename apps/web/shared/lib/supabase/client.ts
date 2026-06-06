// ─────────────────────────────────────────────
// FoodWise · Shared · Supabase Browser Client
// Singleton — safe to call in any Client Component
// ─────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {} as any; 
  }
  
  if (!_client) {
    _client = createBrowserClient(
      url!,
      anonKey!
    );
  }
  return _client;
}
