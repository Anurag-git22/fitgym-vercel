-- ============================================================
-- FitGym — Seed Data
-- ============================================================
-- Run AFTER schema.sql.
-- Creates:
--   1 admin  (admin@fitgym.com      / Admin@123)
--   2 trainers (trainer1/2@fitgym.com / Trainer@123)
--   6 trainees (trainee1-6@fitgym.com / Trainee@123)
--   memberships, payments, workouts, attendance (30 days),
--   progress entries, and notifications.
--
-- HOW TO RUN
--   Option A — Supabase Dashboard SQL Editor:
--     Paste and execute this entire file.
--
--   Option B — Supabase CLI:
--     supabase db seed --file supabase/seed.sql
--
-- NOTE: auth.users rows must be created FIRST because the
--       handle_new_user trigger writes to public.profiles.
--       Supabase lets you insert into auth.users directly
--       in the SQL editor (service-role context).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Helpers
-- ────────────────────────────────────────────────────────────

-- Use deterministic UUIDs so re-runs are idempotent
-- (delete existing seed data first if you need a fresh run).

do $$ begin

-- ────────────────────────────────────────────────────────────
-- 1. Auth users  (inserts into auth.users directly)
--    Passwords are bcrypt hashes of the values shown above.
--    generated with: select crypt('Admin@123', gen_salt('bf'))
-- ────────────────────────────────────────────────────────────

-- Admin
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  aud, role, confirmation_token, recovery_token
)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'admin@fitgym.com',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  '{"name":"A","role":"admin"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', '', ''
)
on conflict (id) do nothing;

-- Trainer 1
insert into auth.users (id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at,aud,role,confirmation_token,recovery_token)
values ('bbbbbbbb-0000-0000-0000-000000000001','trainer1@fitgym.com',crypt('Trainer@123',gen_salt('bf')),now(),'{"name":"B","role":"trainer"}'::jsonb,now(),now(),'authenticated','authenticated','','')
on conflict (id) do nothing;

-- Trainer 2
insert into auth.users (id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at,aud,role,confirmation_token,recovery_token)
values ('bbbbbbbb-0000-0000-0000-000000000002','trainer2@fitgym.com',crypt('Trainer@123',gen_salt('bf')),now(),'{"name":"C","role":"trainer"}'::jsonb,now(),now(),'authenticated','authenticated','','')
on conflict (id) do nothing;

-- Trainee 1–6
insert into auth.users (id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at,aud,role,confirmation_token,recovery_token) values
('cccccccc-0000-0000-0000-000000000001','trainee1@fitgym.com',crypt('Trainee@123',gen_salt('bf')),now(),'{"name":"D","role":"trainee"}'::jsonb,now(),now(),'authenticated','authenticated','',''),
('cccccccc-0000-0000-0000-000000000002','trainee2@fitgym.com',crypt('Trainee@123',gen_salt('bf')),now(),'{"name":"E","role":"trainee"}'::jsonb,now(),now(),'authenticated','authenticated','',''),
('cccccccc-0000-0000-0000-000000000003','trainee3@fitgym.com',crypt('Trainee@123',gen_salt('bf')),now(),'{"name":"F","role":"trainee"}'::jsonb,now(),now(),'authenticated','authenticated','',''),
('cccccccc-0000-0000-0000-000000000004','trainee4@fitgym.com',crypt('Trainee@123',gen_salt('bf')),now(),'{"name":"G","role":"trainee"}'::jsonb,now(),now(),'authenticated','authenticated','',''),
('cccccccc-0000-0000-0000-000000000005','trainee5@fitgym.com',crypt('Trainee@123',gen_salt('bf')),now(),'{"name":"H","role":"trainee"}'::jsonb,now(),now(),'authenticated','authenticated','',''),
('cccccccc-0000-0000-0000-000000000006','trainee6@fitgym.com',crypt('Trainee@123',gen_salt('bf')),now(),'{"name":"I","role":"trainee"}'::jsonb,now(),now(),'authenticated','authenticated','','')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 2. Profiles (trigger should have created these; upsert to be safe)
-- ────────────────────────────────────────────────────────────
insert into public.profiles (id, name, email, role) values
('aaaaaaaa-0000-0000-0000-000000000001','A',    'admin@fitgym.com',    'admin'),
('bbbbbbbb-0000-0000-0000-000000000001','B',   'trainer1@fitgym.com', 'trainer'),
('bbbbbbbb-0000-0000-0000-000000000002','C','trainer2@fitgym.com', 'trainer'),
('cccccccc-0000-0000-0000-000000000001','D', 'trainee1@fitgym.com', 'trainee'),
('cccccccc-0000-0000-0000-000000000002','E',   'trainee2@fitgym.com', 'trainee'),
('cccccccc-0000-0000-0000-000000000003','F', 'trainee3@fitgym.com', 'trainee'),
('cccccccc-0000-0000-0000-000000000004','G',   'trainee4@fitgym.com', 'trainee'),
('cccccccc-0000-0000-0000-000000000005','H',   'trainee5@fitgym.com', 'trainee'),
('cccccccc-0000-0000-0000-000000000006','I', 'trainee6@fitgym.com', 'trainee')
on conflict (id) do update set name=excluded.name, email=excluded.email, role=excluded.role;

-- ────────────────────────────────────────────────────────────
-- 3. Trainers
-- ────────────────────────────────────────────────────────────
insert into public.trainers (id, profile_id, specialization, joining_date) values
('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Strength & Conditioning', '2023-01-15'),
('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Yoga & Flexibility',      '2023-03-01')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 4. Trainees (3 per trainer)
-- ────────────────────────────────────────────────────────────
insert into public.trainees (id, profile_id, trainer_id, date_of_birth) values
('eeeeeeee-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001','1995-04-12'),
('eeeeeeee-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000002','dddddddd-0000-0000-0000-000000000001','1998-07-22'),
('eeeeeeee-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000003','dddddddd-0000-0000-0000-000000000001','1992-11-03'),
('eeeeeeee-0000-0000-0000-000000000004','cccccccc-0000-0000-0000-000000000004','dddddddd-0000-0000-0000-000000000002','2000-02-14'),
('eeeeeeee-0000-0000-0000-000000000005','cccccccc-0000-0000-0000-000000000005','dddddddd-0000-0000-0000-000000000002','1997-09-30'),
('eeeeeeee-0000-0000-0000-000000000006','cccccccc-0000-0000-0000-000000000006','dddddddd-0000-0000-0000-000000000002','1990-06-18')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 5. Memberships
-- ────────────────────────────────────────────────────────────
insert into public.memberships (id, trainee_id, plan, start_date, end_date, status) values
('ffffffff-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','Monthly',      current_date - 10, current_date + 20, 'active'),
('ffffffff-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000002','Quarterly',    current_date - 30, current_date + 60, 'active'),
('ffffffff-0000-0000-0000-000000000003','eeeeeeee-0000-0000-0000-000000000003','Annual',       current_date - 60, current_date + 305,'active'),
('ffffffff-0000-0000-0000-000000000004','eeeeeeee-0000-0000-0000-000000000004','Monthly',      current_date - 5,  current_date + 25, 'active'),
('ffffffff-0000-0000-0000-000000000005','eeeeeeee-0000-0000-0000-000000000005','Semi-Annual',  current_date - 90, current_date + 90, 'active'),
('ffffffff-0000-0000-0000-000000000006','eeeeeeee-0000-0000-0000-000000000006','Monthly',      current_date - 35, current_date - 5,  'expired'),
-- past membership for trainee 1
('ffffffff-0000-0000-0000-000000000007','eeeeeeee-0000-0000-0000-000000000001','Monthly',      current_date - 70, current_date - 40, 'expired')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 6. Payments
-- ────────────────────────────────────────────────────────────
insert into public.payments (id, trainee_id, membership_id, amount, payment_date, payment_status) values
('11111111-aaaa-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000001', 50.00, current_date - 10, 'paid'),
('11111111-aaaa-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000002','ffffffff-0000-0000-0000-000000000002',120.00, current_date - 30, 'paid'),
('11111111-aaaa-0000-0000-000000000003','eeeeeeee-0000-0000-0000-000000000003','ffffffff-0000-0000-0000-000000000003',480.00, current_date - 60, 'paid'),
('11111111-aaaa-0000-0000-000000000004','eeeeeeee-0000-0000-0000-000000000004','ffffffff-0000-0000-0000-000000000004', 50.00, current_date -  5, 'pending'),
('11111111-aaaa-0000-0000-000000000005','eeeeeeee-0000-0000-0000-000000000005','ffffffff-0000-0000-0000-000000000005',240.00, current_date - 90, 'paid'),
('11111111-aaaa-0000-0000-000000000006','eeeeeeee-0000-0000-0000-000000000006','ffffffff-0000-0000-0000-000000000006', 50.00, current_date - 35, 'paid'),
('11111111-aaaa-0000-0000-000000000007','eeeeeeee-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000007', 50.00, current_date - 70, 'paid'),
('11111111-aaaa-0000-0000-000000000008','eeeeeeee-0000-0000-0000-000000000002',null,                                   50.00, current_date -  2, 'pending'),
('11111111-aaaa-0000-0000-000000000009','eeeeeeee-0000-0000-0000-000000000003',null,                                   60.00, current_date - 15, 'failed')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 7. Workouts
-- ────────────────────────────────────────────────────────────
insert into public.workouts (id, trainer_id, trainee_id, name, exercises, duration_minutes, notes) values
(
  '22222222-bbbb-0000-0000-000000000001',
  'dddddddd-0000-0000-0000-000000000001',
  'eeeeeeee-0000-0000-0000-000000000001',
  'Full Body Strength A',
  '[{"name":"Squat","sets":"4","reps":"8","weight":"60","notes":"Keep chest up"},{"name":"Bench Press","sets":"4","reps":"8","weight":"50","notes":""},{"name":"Deadlift","sets":"3","reps":"5","weight":"80","notes":"Brace core"},{"name":"Pull-up","sets":"3","reps":"8","weight":"","notes":"Assisted if needed"},{"name":"Plank","sets":"3","reps":"60s","weight":"","notes":""}]'::jsonb,
  60, 'Focus on form over weight this week.'
),
(
  '22222222-bbbb-0000-0000-000000000002',
  'dddddddd-0000-0000-0000-000000000001',
  'eeeeeeee-0000-0000-0000-000000000002',
  'Upper Body Power',
  '[{"name":"Overhead Press","sets":"4","reps":"6","weight":"40","notes":""},{"name":"Barbell Row","sets":"4","reps":"8","weight":"50","notes":""},{"name":"Dips","sets":"3","reps":"10","weight":"","notes":""},{"name":"Bicep Curl","sets":"3","reps":"12","weight":"15","notes":""}]'::jsonb,
  45, null
),
(
  '22222222-bbbb-0000-0000-000000000003',
  'dddddddd-0000-0000-0000-000000000001',
  'eeeeeeee-0000-0000-0000-000000000003',
  'Beginner Cardio + Core',
  '[{"name":"Treadmill Jog","sets":"1","reps":"20min","weight":"","notes":"70% max HR"},{"name":"Crunch","sets":"3","reps":"20","weight":"","notes":""},{"name":"Leg Raise","sets":"3","reps":"15","weight":"","notes":""},{"name":"Mountain Climber","sets":"3","reps":"30s","weight":"","notes":""}]'::jsonb,
  40, 'Heart rate should stay between 130–150 bpm.'
),
(
  '22222222-bbbb-0000-0000-000000000004',
  'dddddddd-0000-0000-0000-000000000002',
  'eeeeeeee-0000-0000-0000-000000000004',
  'Morning Yoga Flow',
  '[{"name":"Sun Salutation","sets":"3","reps":"5","weight":"","notes":"Slow and controlled"},{"name":"Warrior I","sets":"2","reps":"30s","weight":"","notes":"Each side"},{"name":"Warrior II","sets":"2","reps":"30s","weight":"","notes":"Each side"},{"name":"Pigeon Pose","sets":"2","reps":"60s","weight":"","notes":""}]'::jsonb,
  50, 'Breathe deeply throughout.'
),
(
  '22222222-bbbb-0000-0000-000000000005',
  'dddddddd-0000-0000-0000-000000000002',
  'eeeeeeee-0000-0000-0000-000000000005',
  'Flexibility & Mobility',
  '[{"name":"Hip Flexor Stretch","sets":"2","reps":"45s","weight":"","notes":""},{"name":"Hamstring Stretch","sets":"2","reps":"45s","weight":"","notes":""},{"name":"Shoulder Mobility","sets":"3","reps":"10","weight":"","notes":""},{"name":"Cat-Cow","sets":"3","reps":"10","weight":"","notes":""}]'::jsonb,
  35, null
)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 8. Attendance — last 30 days for all 6 trainees
-- ────────────────────────────────────────────────────────────
insert into public.attendance (trainee_id, date, status)
select
  t.id as trainee_id,
  (current_date - s.day)::date as date,
  -- simple pattern: weekdays = present, weekends = absent
  case when extract(dow from (current_date - s.day)) in (0,6) then 'absent' else 'present' end as status
from
  public.trainees t,
  generate_series(0, 29) as s(day)
on conflict (trainee_id, date) do nothing;

-- ────────────────────────────────────────────────────────────
-- 9. Progress entries — one per week for each trainee (last 8 weeks)
-- ────────────────────────────────────────────────────────────
insert into public.progress (trainee_id, weight, measurements, notes, recorded_date)
select
  t.id,
  (70 + (row_number() over (partition by t.id order by w.week) * 0.5 - 2))::numeric(5,2),
  json_build_object('chest', (95 + w.week)::text || 'cm', 'waist', (80 - w.week)::text || 'cm')::jsonb,
  'Week ' || w.week || ' check-in',
  (current_date - (w.week * 7))::date
from
  public.trainees t,
  generate_series(0, 7) as w(week)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- 10. Notifications
-- ────────────────────────────────────────────────────────────
insert into public.notifications (profile_id, message, is_read) values
('cccccccc-0000-0000-0000-000000000001', 'Welcome to FitGym! Your membership is now active.', true),
('cccccccc-0000-0000-0000-000000000002', 'Your trainer has assigned a new workout plan.', false),
('cccccccc-0000-0000-0000-000000000004', 'Payment reminder: your monthly fee is due soon.', false),
('cccccccc-0000-0000-0000-000000000006', 'Your membership has expired. Please contact admin to renew.', false),
('bbbbbbbb-0000-0000-0000-000000000001', '3 new trainees have been assigned to you.', true),
('bbbbbbbb-0000-0000-0000-000000000002', 'Please log this week''s progress for your trainees.', false)
on conflict do nothing;

end $$;
