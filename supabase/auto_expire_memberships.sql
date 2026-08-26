-- ============================================================
-- FitGym — Auto-expire memberships via pg_cron
-- Run this ONCE in the Supabase SQL Editor
-- Requires pg_cron extension (enabled by default on Supabase)
-- ============================================================

-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Schedule: runs every day at midnight UTC
-- Sets status = 'expired' for any active membership whose end_date has passed
select cron.schedule(
  'expire-memberships',          -- job name (unique)
  '0 0 * * *',                   -- every day at 00:00 UTC
  $$
    update public.memberships
    set status = 'expired'
    where end_date < current_date
      and status = 'active';
  $$
);

-- To verify the job was created:
-- select * from cron.job;

-- To remove the job if needed:
-- select cron.unschedule('expire-memberships');
