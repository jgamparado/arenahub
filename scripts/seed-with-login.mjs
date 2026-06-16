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
const email = process.env.ADMIN_EMAIL ?? "joaoamparado0605@gmail.com";
const password = process.env.ADMIN_PASSWORD ?? "Sunset123";

if (!url || !key) {
  console.error("Defina as variaveis publicas do Supabase em .env.local.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

if (loginError) {
  console.error(`Login falhou para ${email}: ${loginError.message}`);
  console.error("Confirme este usuario no Supabase Auth antes de rodar este seed.");
  process.exit(1);
}

const courts = [
  { name: "Quadra 1", sport_type: "beach_tennis", active: true },
  { name: "Quadra 2", sport_type: "futevolei", active: true },
  { name: "Quadra 3", sport_type: "volei_praia", active: true },
];

const defaultSlots = [
  ["07:00", "08:00"],
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["10:00", "11:00"],
  ["14:00", "15:00"],
  ["15:00", "16:00"],
  ["16:00", "17:00"],
  ["17:00", "18:00"],
  ["18:00", "19:00"],
  ["19:00", "20:00"],
  ["20:00", "21:00"],
];

for (const court of courts) {
  const { data: existing, error: lookupError } = await supabase
    .from("courts")
    .select("*")
    .eq("name", court.name)
    .maybeSingle();

  if (lookupError) {
    console.error(`Erro ao buscar ${court.name}: ${lookupError.message}`);
    process.exit(1);
  }

  const currentCourt =
    existing ?? (await supabase.from("courts").insert(court).select("*").single()).data;

  if (!currentCourt) {
    console.error(`Nao foi possivel criar ${court.name}.`);
    process.exit(1);
  }

  const rows = [];
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    for (const [start_time, end_time] of defaultSlots) {
      rows.push({
        court_id: currentCourt.id,
        weekday,
        start_time,
        end_time,
        price: 50,
      });
    }
  }

  const { error } = await supabase.from("time_slots").upsert(rows, {
    onConflict: "court_id,weekday,start_time",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error(`Erro ao criar horarios de ${court.name}: ${error.message}`);
    process.exit(1);
  }
}

console.log("Seed via login concluido: quadras e horarios criados.");
