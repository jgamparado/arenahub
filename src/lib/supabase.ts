import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // The UI keeps rendering so README/setup pages are still reachable during local setup.
  console.warn("Modo demo local ativo. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar o Supabase.");
}

export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "development-anon-key",
);
