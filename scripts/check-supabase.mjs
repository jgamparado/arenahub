import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key.trim()] ??= valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

const url = process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Supabase nao configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local ou na Vercel.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const checks = [
  ["courts", supabase.from("courts").select("id", { count: "exact", head: true })],
  ["time_slots", supabase.from("time_slots").select("id", { count: "exact", head: true })],
  ["reservations", supabase.from("reservations").select("id", { count: "exact", head: true })],
];

for (const [table, request] of checks) {
  const { error, count } = await request;
  if (error) {
    console.error(`Falha em ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`${table}: ok (${count ?? 0} registros visiveis)`);
}

console.log("Supabase respondeu corretamente com a chave publica configurada.");
