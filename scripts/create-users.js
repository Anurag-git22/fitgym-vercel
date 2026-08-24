// ============================================================
// FitGym — Create seed users via Supabase Admin API
// Run: node scripts/create-users.js
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://alojoxgkhyplthdzjmiv.supabase.co';
const SERVICE_ROLE_KEY  = process.env.SERVICE_ROLE_KEY; // pass via env

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SERVICE_ROLE_KEY env variable before running.');
  console.error('  Example: $env:SERVICE_ROLE_KEY="your-key"; node scripts/create-users.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { email: 'admin@fitgym.com',    password: 'Admin@123',   name: 'Alex Admin',     role: 'admin'   },
  { email: 'trainer1@fitgym.com', password: 'Trainer@123', name: 'Sam Trainer',    role: 'trainer' },
  { email: 'trainer2@fitgym.com', password: 'Trainer@123', name: 'Jordan Trainer', role: 'trainer' },
  { email: 'trainee1@fitgym.com', password: 'Trainee@123', name: 'Alice Trainee',  role: 'trainee' },
  { email: 'trainee2@fitgym.com', password: 'Trainee@123', name: 'Bob Trainee',    role: 'trainee' },
  { email: 'trainee3@fitgym.com', password: 'Trainee@123', name: 'Carol Trainee',  role: 'trainee' },
  { email: 'trainee4@fitgym.com', password: 'Trainee@123', name: 'Dan Trainee',    role: 'trainee' },
  { email: 'trainee5@fitgym.com', password: 'Trainee@123', name: 'Eva Trainee',    role: 'trainee' },
  { email: 'trainee6@fitgym.com', password: 'Trainee@123', name: 'Frank Trainee',  role: 'trainee' },
];

async function main() {
  console.log('Creating users...\n');
  const created = [];

  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email:             u.email,
      password:          u.password,
      email_confirm:     true,
      user_metadata:     { name: u.name, role: u.role },
    });

    if (error) {
      console.error(`✗ ${u.email}: ${error.message}`);
    } else {
      console.log(`✓ ${u.email}  →  ${data.user.id}`);
      created.push({ ...u, id: data.user.id });
    }
  }

  console.log('\n✅ Done. Now run the data seed SQL in Supabase SQL editor.');
  console.log('\nUser IDs for reference:');
  created.forEach(u => console.log(`  ${u.role.padEnd(8)} ${u.email.padEnd(28)} ${u.id}`));
}

main().catch(console.error);
