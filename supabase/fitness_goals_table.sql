-- ============================================================
-- FitGym – Fitness Goals Table Migration
-- Run this in the Supabase SQL Editor to add fitness goals.
-- ============================================================

create table if not exists fitness_goals (
  id            uuid primary key default gen_random_uuid(),
  trainee_id    uuid not null references trainees(id) on delete cascade,
  title         text not null,
  target_value  numeric(10,2) not null,
  current_value numeric(10,2) not null default 0,
  unit          text not null,
  target_date   date,
  status        text not null default 'in_progress' check (status in ('in_progress','completed')),
  created_at    timestamptz default now()
);

alter table fitness_goals enable row level security;

drop policy if exists "fitness_goals: admin full access" on fitness_goals;
drop policy if exists "fitness_goals: trainer manages own trainees" on fitness_goals;
drop policy if exists "fitness_goals: trainee manages self" on fitness_goals;

create policy "fitness_goals: admin full access"
  on fitness_goals for all
  using (get_my_role() = 'admin');

create policy "fitness_goals: trainer manages own trainees"
  on fitness_goals for all
  using (
    get_my_role() = 'trainer'
    and trainee_id in (
      select id from trainees where trainer_id = get_my_trainer_id()
    )
  );

create policy "fitness_goals: trainee manages self"
  on fitness_goals for all
  using (
    get_my_role() = 'trainee'
    and trainee_id in (
      select id from trainees where profile_id = auth.uid()
    )
  );
