-- ============================================================
-- FitGym – Events Table Migration
-- Run this in the Supabase SQL Editor to add gym calendar events.
-- ============================================================

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  event_time time,
  description text,
  event_type text not null default 'gym_event' check (event_type in ('gym_event','holiday','special_session','maintenance')),
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table events enable row level security;

drop policy if exists "events: admin full access" on events;
drop policy if exists "events: authenticated read" on events;

create policy "events: admin full access"
  on events for all
  using (get_my_role() = 'admin');

create policy "events: authenticated read"
  on events for select
  using (auth.role() = 'authenticated');
