const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || 'https://alojoxgkhyplthdzjmiv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

const sql = `
  drop trigger if exists on_auth_user_created on auth.users;
  drop function if exists handle_new_user() cascade;
`;

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ sql }),
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Response:', text);
