create extension if not exists "pgcrypto";

create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport_type text not null check (sport_type in ('beach_tennis', 'futevolei', 'volei_praia')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  price numeric(10, 2) not null check (price >= 0),
  check (start_time < end_time)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  slot_id uuid not null references public.time_slots(id) on delete restrict,
  date date not null,
  client_name text not null,
  client_phone text not null,
  status text not null check (status in ('confirmed', 'cancelled')) default 'confirmed',
  created_at timestamptz not null default now(),
  check (client_phone ~ '^55[0-9]{10,11}$')
);

create unique index if not exists reservations_unique_confirmed_slot
  on public.reservations (court_id, date, slot_id)
  where status = 'confirmed';

create unique index if not exists time_slots_unique_court_weekday_start
  on public.time_slots (court_id, weekday, start_time);

create index if not exists time_slots_court_weekday_idx on public.time_slots(court_id, weekday, start_time);
create index if not exists reservations_date_status_idx on public.reservations(date, status);
create index if not exists reservations_court_date_idx on public.reservations(court_id, date);

alter table public.courts enable row level security;
alter table public.time_slots enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "Public can read active courts" on public.courts;
create policy "Public can read active courts"
  on public.courts for select
  using (active = true or auth.role() = 'authenticated');

drop policy if exists "Managers can manage courts" on public.courts;
create policy "Managers can manage courts"
  on public.courts for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read slots for active courts" on public.time_slots;
create policy "Public can read slots for active courts"
  on public.time_slots for select
  using (
    exists (
      select 1 from public.courts
      where courts.id = time_slots.court_id
      and (courts.active = true or auth.role() = 'authenticated')
    )
  );

drop policy if exists "Managers can manage slots" on public.time_slots;
create policy "Managers can manage slots"
  on public.time_slots for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can see confirmed reservations for availability" on public.reservations;
create policy "Public can see confirmed reservations for availability"
  on public.reservations for select
  using (status = 'confirmed' or auth.role() = 'authenticated');

drop policy if exists "Public can create confirmed future reservations" on public.reservations;
create policy "Public can create confirmed future reservations"
  on public.reservations for insert
  with check (status = 'confirmed' and date >= current_date);

drop policy if exists "Managers can update reservations" on public.reservations;
create policy "Managers can update reservations"
  on public.reservations for update
  to authenticated
  using (true)
  with check (true);
