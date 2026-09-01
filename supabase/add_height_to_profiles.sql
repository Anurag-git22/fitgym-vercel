-- Add height_cm to profiles for BMI calculation
alter table profiles add column if not exists height_cm numeric(5,2);

-- The existing "profiles: self update" policy already allows users to update their own profile,
-- so height_cm updates are covered automatically for authenticated users.
