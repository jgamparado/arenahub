with inserted_courts as (
  insert into public.courts (name, sport_type, active)
  values
    ('Quadra 1', 'beach_tennis', true),
    ('Quadra 2', 'futevolei', true),
    ('Quadra 3', 'volei_praia', true)
  on conflict do nothing
  returning id
),
all_courts as (
  select id from inserted_courts
  union
  select id from public.courts where name in ('Quadra 1', 'Quadra 2', 'Quadra 3')
),
default_slots(start_time, end_time) as (
  values
    ('07:00'::time, '08:00'::time),
    ('08:00'::time, '09:00'::time),
    ('09:00'::time, '10:00'::time),
    ('10:00'::time, '11:00'::time),
    ('14:00'::time, '15:00'::time),
    ('15:00'::time, '16:00'::time),
    ('16:00'::time, '17:00'::time),
    ('17:00'::time, '18:00'::time),
    ('18:00'::time, '19:00'::time),
    ('19:00'::time, '20:00'::time),
    ('20:00'::time, '21:00'::time)
)
insert into public.time_slots (court_id, weekday, start_time, end_time, price)
select c.id, weekday, s.start_time, s.end_time, 50.00
from all_courts c
cross join generate_series(0, 6) as weekday
cross join default_slots s
where not exists (
  select 1
  from public.time_slots existing
  where existing.court_id = c.id
    and existing.weekday = weekday
    and existing.start_time = s.start_time
);
