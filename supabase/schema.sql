-- ============================================================
-- FitGym – Supabase Schema
-- Run this entire file in the Supabase SQL Editor (once).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null,
  email          text not null,
  phone          text,
  role           text not null check (role in ('admin','trainer','trainee')),
  account_status text not null default 'active'
                   check (account_status in ('active','inactive')),
  avatar_url     text,
  created_at     timestamptz default now()
);

create table if not exists trainers (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  specialization  text,
  joining_date    date,
  created_at      timestamptz default now()
);

create table if not exists trainees (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  trainer_id    uuid references trainers(id) on delete set null,
  date_of_birth date,
  created_at    timestamptz default now()
);

create table if not exists memberships (
  id          uuid primary key default gen_random_uuid(),
  trainee_id  uuid not null references trainees(id) on delete cascade,
  plan        text not null,
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'active'
                check (status in ('active','expired','cancelled')),
  created_at  timestamptz default now()
);

create table if not exists payments (
  id             uuid primary key default gen_random_uuid(),
  trainee_id     uuid not null references trainees(id) on delete cascade,
  membership_id  uuid references memberships(id) on delete set null,
  amount         numeric(10,2) not null,
  payment_date   date not null default current_date,
  payment_status text not null default 'pending'
                   check (payment_status in ('paid','pending','failed')),
  created_at     timestamptz default now()
);

create table if not exists workouts (
  id               uuid primary key default gen_random_uuid(),
  trainer_id       uuid not null references trainers(id) on delete cascade,
  trainee_id       uuid not null references trainees(id) on delete cascade,
  name             text not null,
  exercises        jsonb not null default '[]',
  duration_minutes int,
  notes            text,
  created_at       timestamptz default now()
);

create table if not exists attendance (
  id             uuid primary key default gen_random_uuid(),
  trainee_id     uuid not null references trainees(id) on delete cascade,
  date           date not null default current_date,
  status         text not null check (status in ('present','absent')),
  check_in_time  timestamptz,
  created_at     timestamptz default now(),
  unique (trainee_id, date)
);

create table if not exists progress (
  id            uuid primary key default gen_random_uuid(),
  trainee_id    uuid not null references trainees(id) on delete cascade,
  weight        numeric(5,2),
  measurements  jsonb,
  notes         text,
  photo_url     text,
  recorded_date date not null default current_date,
  created_at    timestamptz default now()
);

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ON AUTH SIGNUP (trigger)
-- ────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Unknown'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'trainee')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 3. SECURITY-DEFINER ROLE HELPER (avoids recursive RLS)
-- ────────────────────────────────────────────────────────────

create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: get the trainers.id for the currently-logged-in trainer profile
create or replace function get_my_trainer_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.trainers where profile_id = auth.uid();
$$;

-- Helper: get the trainees.id for the currently-logged-in trainee profile
create or replace function get_my_trainee_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.trainees where profile_id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- 4. ROW-LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table profiles      enable row level security;
alter table trainers      enable row level security;
alter table trainees      enable row level security;
alter table memberships   enable row level security;
alter table payments      enable row level security;
alter table workouts      enable row level security;
alter table attendance    enable row level security;
alter table progress      enable row level security;
alter table notifications enable row level security;

-- ── profiles ────────────────────────────────────────────────
drop policy if exists "profiles: admin full access"   on profiles;
drop policy if exists "profiles: self read"           on profiles;
drop policy if exists "profiles: self update"         on profiles;
drop policy if exists "profiles: trainer read trainees" on profiles;

create policy "profiles: admin full access"
  on profiles for all
  using (get_my_role() = 'admin');

create policy "profiles: self read"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: self update"
  on profiles for update
  using (id = auth.uid());

-- Trainer needs to read profiles of their assigned trainees
create policy "profiles: trainer read trainees"
  on profiles for select
  using (
    get_my_role() = 'trainer'
    and id in (
      select te.profile_id from trainees te
      where te.trainer_id = get_my_trainer_id()
    )
  );

-- ── trainers ────────────────────────────────────────────────
drop policy if exists "trainers: admin full access" on trainers;
drop policy if exists "trainers: trainer reads self" on trainers;
drop policy if exists "trainers: trainee reads own trainer" on trainers;

create policy "trainers: admin full access"
  on trainers for all
  using (get_my_role() = 'admin');

create policy "trainers: trainer reads self"
  on trainers for select
  using (get_my_role() = 'trainer' and profile_id = auth.uid());

create policy "trainers: trainee reads own trainer"
  on trainers for select
  using (
    get_my_role() = 'trainee'
    and id = (select trainer_id from trainees where profile_id = auth.uid())
  );

-- ── trainees ────────────────────────────────────────────────
drop policy if exists "trainees: admin full access"          on trainees;
drop policy if exists "trainees: trainer reads own trainees" on trainees;
drop policy if exists "trainees: trainee reads self"         on trainees;

create policy "trainees: admin full access"
  on trainees for all
  using (get_my_role() = 'admin');

create policy "trainees: trainer reads own trainees"
  on trainees for select
  using (get_my_role() = 'trainer' and trainer_id = get_my_trainer_id());

create policy "trainees: trainee reads self"
  on trainees for select
  using (get_my_role() = 'trainee' and profile_id = auth.uid());

-- ── memberships ─────────────────────────────────────────────
drop policy if exists "memberships: admin full access"          on memberships;
drop policy if exists "memberships: trainer reads own trainees" on memberships;
drop policy if exists "memberships: trainee reads self"         on memberships;

create policy "memberships: admin full access"
  on memberships for all
  using (get_my_role() = 'admin');

create policy "memberships: trainer reads own trainees"
  on memberships for select
  using (
    get_my_role() = 'trainer'
    and trainee_id in (
      select id from trainees where trainer_id = get_my_trainer_id()
    )
  );

create policy "memberships: trainee reads self"
  on memberships for select
  using (
    get_my_role() = 'trainee'
    and trainee_id = get_my_trainee_id()
  );

-- ── payments ────────────────────────────────────────────────
drop policy if exists "payments: admin full access"  on payments;
drop policy if exists "payments: trainee reads self" on payments;

create policy "payments: admin full access"
  on payments for all
  using (get_my_role() = 'admin');

create policy "payments: trainee reads self"
  on payments for select
  using (
    get_my_role() = 'trainee'
    and trainee_id = get_my_trainee_id()
  );

-- ── workouts ────────────────────────────────────────────────
drop policy if exists "workouts: admin full access"          on workouts;
drop policy if exists "workouts: trainer manages own"        on workouts;
drop policy if exists "workouts: trainee reads self"         on workouts;

create policy "workouts: admin full access"
  on workouts for all
  using (get_my_role() = 'admin');

create policy "workouts: trainer manages own"
  on workouts for all
  using (
    get_my_role() = 'trainer'
    and trainer_id = get_my_trainer_id()
  );

create policy "workouts: trainee reads self"
  on workouts for select
  using (
    get_my_role() = 'trainee'
    and trainee_id = get_my_trainee_id()
  );

-- ── attendance ──────────────────────────────────────────────
drop policy if exists "attendance: admin full access"          on attendance;
drop policy if exists "attendance: trainer manages own"        on attendance;
drop policy if exists "attendance: trainee reads self"         on attendance;

create policy "attendance: admin full access"
  on attendance for all
  using (get_my_role() = 'admin');

create policy "attendance: trainer manages own"
  on attendance for all
  using (
    get_my_role() = 'trainer'
    and trainee_id in (
      select id from trainees where trainer_id = get_my_trainer_id()
    )
  );

create policy "attendance: trainee reads self"
  on attendance for select
  using (
    get_my_role() = 'trainee'
    and trainee_id = get_my_trainee_id()
  );

-- ── progress ────────────────────────────────────────────────
drop policy if exists "progress: admin full access"          on progress;
drop policy if exists "progress: trainer manages own"        on progress;
drop policy if exists "progress: trainee reads self"         on progress;

create policy "progress: admin full access"
  on progress for all
  using (get_my_role() = 'admin');

create policy "progress: trainer manages own"
  on progress for all
  using (
    get_my_role() = 'trainer'
    and trainee_id in (
      select id from trainees where trainer_id = get_my_trainer_id()
    )
  );

create policy "progress: trainee reads self"
  on progress for select
  using (
    get_my_role() = 'trainee'
    and trainee_id = get_my_trainee_id()
  );

-- ── notifications ───────────────────────────────────────────
drop policy if exists "notifications: admin full access" on notifications;
drop policy if exists "notifications: self read/update"  on notifications;

create policy "notifications: admin full access"
  on notifications for all
  using (get_my_role() = 'admin');

create policy "notifications: self read"
  on notifications for select
  using (profile_id = auth.uid());

create policy "notifications: self update"
  on notifications for update
  using (profile_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 5. STORAGE BUCKETS
-- (Run in SQL Editor — Supabase Storage uses the storage schema)
-- ────────────────────────────────────────────────────────────

-- avatars bucket: public read, write only by owner
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: public read"  on storage.objects;
drop policy if exists "avatars: owner write"  on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- progress-photos bucket: private, signed-URL access only
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "progress-photos: owner read"    on storage.objects;
drop policy if exists "progress-photos: trainer read"  on storage.objects;
drop policy if exists "progress-photos: admin read"    on storage.objects;
drop policy if exists "progress-photos: owner write"   on storage.objects;
drop policy if exists "progress-photos: owner delete"  on storage.objects;

create policy "progress-photos: owner read"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "progress-photos: trainer read"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and get_my_role() = 'trainer'
    and (storage.foldername(name))[1] in (
      select te.profile_id::text
      from trainees te
      where te.trainer_id = get_my_trainer_id()
    )
  );

create policy "progress-photos: admin read"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and get_my_role() = 'admin'
  );

create policy "progress-photos: owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "progress-photos: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ────────────────────────────────────────────────────────────
-- 6. RLS SMOKE TESTS  (run as a quick sanity check)
-- Each block is a comment-annotated assertion you can verify
-- manually by switching to the relevant user's JWT in the
-- Supabase API Tester or by running the seed + selecting rows.
-- ────────────────────────────────────────────────────────────

/*
-- TEST PLAN (manual, via Supabase Table Editor / REST with user JWTs)

TABLE: profiles
  Admin  SELECT  → should return all rows         ✓ expected: all
  Admin  INSERT  → should succeed                 ✓
  Trainer SELECT → should return own row + trainees ✓
  Trainer INSERT → should be denied               ✓ expected: RLS block
  Trainee SELECT → should return only own row     ✓
  Trainee INSERT → should be denied               ✓ expected: RLS block

TABLE: trainees
  Admin  SELECT  → all rows                       ✓
  Trainer SELECT → only their assigned trainees   ✓
  Trainee SELECT → only own row                   ✓
  Trainee INSERT → denied                         ✓

TABLE: memberships
  Admin  SELECT  → all rows                       ✓
  Admin  INSERT  → should succeed                 ✓
  Trainer SELECT → trainees they manage only      ✓
  Trainee SELECT → own membership only            ✓
  Trainee INSERT → denied                         ✓

TABLE: payments
  Admin  SELECT/INSERT/UPDATE → all              ✓
  Trainee SELECT → own payments only             ✓
  Trainee INSERT → denied                        ✓

TABLE: workouts
  Admin  SELECT/INSERT → all                     ✓
  Trainer SELECT/INSERT → own trainer_id only    ✓
  Trainer INSERT with different trainer_id → denied ✓
  Trainee SELECT → own trainee_id only           ✓
  Trainee INSERT → denied                        ✓

TABLE: attendance
  Admin  SELECT/INSERT/UPDATE → all             ✓
  Trainer INSERT for own trainee → success      ✓
  Trainer INSERT for other trainee → denied     ✓
  Trainee SELECT → own rows only                ✓

TABLE: progress
  Same pattern as attendance                    ✓

TABLE: notifications
  Admin  SELECT/INSERT → all                   ✓
  User   SELECT → own profile_id only          ✓
  User   UPDATE (mark read) → own rows only    ✓
  User   INSERT → denied (admin-only write)    ✓
*/
