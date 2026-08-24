import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || 'https://alojoxgkhyplthdzjmiv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SERVICE_ROLE_KEY env variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Test 1: list existing users
console.log('Listing existing users...');
const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) {
  console.error('listUsers error:', listErr);
} else {
  console.log('Existing users:', list.users.length);
  list.users.forEach(u => console.log(' -', u.email, u.id));
}

// Test 2: create one minimal user
console.log('\nCreating test user...');
const { data, error } = await supabase.auth.admin.createUser({
  email: 'test@fitgym.com',
  password: 'Test@12345',
  email_confirm: true,
});
if (error) {
  console.error('Create error:', JSON.stringify(error, null, 2));
} else {
  console.log('Created:', data.user.id);
  // Clean up
  await supabase.auth.admin.deleteUser(data.user.id);
  console.log('Deleted test user.');
}
