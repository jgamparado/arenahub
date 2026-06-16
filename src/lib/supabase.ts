import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isLocalDemoEnabled = !isSupabaseConfigured && import.meta.env.DEV;
export const supabaseConfigErrorMessage =
  "Supabase nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY na Vercel e faca um novo deploy.";

if (isLocalDemoEnabled) {
  // The UI keeps rendering so README/setup pages are still reachable during local setup.
  console.warn("Modo demo local ativo. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar o Supabase.");
} else if (!isSupabaseConfigured) {
  console.error("Variaveis publicas do Supabase ausentes no ambiente de build.");
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured && !isLocalDemoEnabled) {
    throw new Error(supabaseConfigErrorMessage);
  }
}

export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "development-anon-key",
);
