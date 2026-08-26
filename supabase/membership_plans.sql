-- ============================================================
-- FitGym — Membership Plans Table
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists public.membership_plans (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  duration_months int not null,
  price      numeric(10,2) not null,
  is_active  boolean not null default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.membership_plans enable row level security;

-- Admin full access
create policy "membership_plans: admin full access"
  on public.membership_plans for all
  using (get_my_role() = 'admin');

-- Everyone can read active plans
create policy "membership_plans: all read active"
  on public.membership_plans for select
  using (is_active = true);

-- Seed default plans
insert into public.membership_plans (name, duration_months, price, is_active) values
  ('Monthly',     1,  999.00, true),
  ('Quarterly',   3, 2499.00, true),
  ('Semi-Annual', 6, 4499.00, true),
  ('Annual',     12, 7999.00, true)
on conflict (name) do nothing;
