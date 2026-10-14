import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured = Boolean(url && key);
let client: SupabaseClient | null = null;
export function getSupabase() {
  if (!cloudConfigured) return null;
  if (!client) client = createClient(url!, key!);
  return client;
}
