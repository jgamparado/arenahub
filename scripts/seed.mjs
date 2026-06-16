import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar npm run seed.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

const adminEmail = "joaoamparado0605@gmail.com";
const adminPassword = "Sunset123";

await ensureAdminUser(adminEmail, adminPassword);

for (const court of courts) {
  const { data: existing } = await supabase.from("courts").select("*").eq("name", court.name).maybeSingle();
  const currentCourt = existing ?? (await supabase.from("courts").insert(court).select("*").single()).data;

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
    console.error(`Erro ao criar horarios de ${court.name}:`, error.message);
    process.exit(1);
  }
}

console.log(`Seed concluido: quadras, horarios e gestor ${adminEmail} criados/atualizados.`);

async function ensureAdminUser(email, password) {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Erro ao verificar gestor:", listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Erro ao atualizar gestor:", error.message);
      process.exit(1);
    }

    return;
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Erro ao criar gestor:", error.message);
    process.exit(1);
  }
}
