import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || 'https://alojoxgkhyplthdzjmiv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: Please provide SERVICE_ROLE_KEY environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const today = new Date().toISOString().slice(0,10);

const USERS = [
  { email: 'admin@fitgym.net',    password: 'Admin@123',   name: 'Alex Admin',     role: 'admin'   },
  { email: 'trainer1@fitgym.net', password: 'Trainer@123', name: 'Sam Trainer',    role: 'trainer' },
  { email: 'trainer2@fitgym.net', password: 'Trainer@123', name: 'Jordan Trainer', role: 'trainer' },
  { email: 'trainee1@fitgym.net', password: 'Trainee@123', name: 'Alice Trainee',  role: 'trainee' },
  { email: 'trainee2@fitgym.net', password: 'Trainee@123', name: 'Bob Trainee',    role: 'trainee' },
  { email: 'trainee3@fitgym.net', password: 'Trainee@123', name: 'Carol Trainee',  role: 'trainee' },
  { email: 'trainee4@fitgym.net', password: 'Trainee@123', name: 'Dan Trainee',    role: 'trainee' },
  { email: 'trainee5@fitgym.net', password: 'Trainee@123', name: 'Eva Trainee',    role: 'trainee' },
  { email: 'trainee6@fitgym.net', password: 'Trainee@123', name: 'Frank Trainee',  role: 'trainee' },
];

// Step 1: List and delete any existing broken users
console.log('=== Step 1: Cleaning up existing users ===');
const { data: existing } = await supabase.auth.admin.listUsers();
console.log(`Found ${existing.users.length} existing users`);
for (const u of existing.users) {
  console.log(`  Deleting: ${u.email} (${u.id})`);
  await supabase.auth.admin.deleteUser(u.id);
}

// Step 2: Create users one at a time
console.log('\n=== Step 2: Creating users ===');
const created = [];
for (const u of USERS) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email, password: u.password,
    email_confirm: true,
    user_metadata: { name: u.name, role: u.role },
  });
  if (error) {
    console.error(`  ✗ ${u.email}: ${error.message}`);
  } else {
    console.log(`  ✓ ${u.email} → ${data.user.id}`);
    created.push({ ...u, id: data.user.id });
  }
}

if (!created.length) { console.error('No users created!'); process.exit(1); }

// Step 3: Insert profiles
console.log('\n=== Step 3: Inserting profiles ===');
const { error: profErr } = await supabase.from('profiles').upsert(
  created.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, account_status: 'active' }))
);
if (profErr) { console.error('profiles error:', profErr.message); process.exit(1); }
console.log(`  ✓ ${created.length} profiles`);

// Step 4: Trainers
console.log('\n=== Step 4: Seeding data ===');
const byEmail = Object.fromEntries(created.map(u => [u.email, u.id]));
const t1id = crypto.randomUUID(), t2id = crypto.randomUUID();

const { error: trErr } = await supabase.from('trainers').upsert([
  { id: t1id, profile_id: byEmail['trainer1@fitgym.net'], specialization: 'Strength & Conditioning', joining_date: '2023-01-15' },
  { id: t2id, profile_id: byEmail['trainer2@fitgym.net'], specialization: 'Yoga & Flexibility',      joining_date: '2023-03-01' },
]);
if (trErr) { console.error('trainers:', trErr.message); process.exit(1); }
console.log('  ✓ trainers');

// Step 5: Trainees
const tnIds = {};
const traineeRows = [
  ['trainee1@fitgym.net', t1id, '1995-04-12'],
  ['trainee2@fitgym.net', t1id, '1998-07-22'],
  ['trainee3@fitgym.net', t1id, '1992-11-03'],
  ['trainee4@fitgym.net', t2id, '2000-02-14'],
  ['trainee5@fitgym.net', t2id, '1997-09-30'],
  ['trainee6@fitgym.net', t2id, '1990-06-18'],
].map(([email, tid, dob]) => {
  const id = crypto.randomUUID();
  tnIds[email] = id;
  return { id, profile_id: byEmail[email], trainer_id: tid, date_of_birth: dob };
});
const { error: tnErr } = await supabase.from('trainees').upsert(traineeRows);
if (tnErr) { console.error('trainees:', tnErr.message); process.exit(1); }
console.log('  ✓ trainees');

// Step 6: Memberships
const { error: memErr } = await supabase.from('memberships').insert([
  { trainee_id: tnIds['trainee1@fitgym.net'], plan: 'Monthly',     start_date: addDays(today,-10), end_date: addDays(today, 20), status: 'active'  },
  { trainee_id: tnIds['trainee2@fitgym.net'], plan: 'Quarterly',   start_date: addDays(today,-30), end_date: addDays(today, 60), status: 'active'  },
  { trainee_id: tnIds['trainee3@fitgym.net'], plan: 'Annual',      start_date: addDays(today,-60), end_date: addDays(today,305), status: 'active'  },
  { trainee_id: tnIds['trainee4@fitgym.net'], plan: 'Monthly',     start_date: addDays(today, -5), end_date: addDays(today, 25), status: 'active'  },
  { trainee_id: tnIds['trainee5@fitgym.net'], plan: 'Semi-Annual', start_date: addDays(today,-90), end_date: addDays(today, 90), status: 'active'  },
  { trainee_id: tnIds['trainee6@fitgym.net'], plan: 'Monthly',     start_date: addDays(today,-35), end_date: addDays(today, -5), status: 'expired' },
]);
if (memErr) { console.error('memberships:', memErr.message); process.exit(1); }
console.log('  ✓ memberships');

// Step 7: Payments
const { error: payErr } = await supabase.from('payments').insert([
  { trainee_id: tnIds['trainee1@fitgym.net'], amount: 50,  payment_date: addDays(today,-10), payment_status: 'paid'    },
  { trainee_id: tnIds['trainee2@fitgym.net'], amount: 120, payment_date: addDays(today,-30), payment_status: 'paid'    },
  { trainee_id: tnIds['trainee3@fitgym.net'], amount: 480, payment_date: addDays(today,-60), payment_status: 'paid'    },
  { trainee_id: tnIds['trainee4@fitgym.net'], amount: 50,  payment_date: addDays(today, -5), payment_status: 'pending' },
  { trainee_id: tnIds['trainee5@fitgym.net'], amount: 240, payment_date: addDays(today,-90), payment_status: 'paid'    },
  { trainee_id: tnIds['trainee6@fitgym.net'], amount: 50,  payment_date: addDays(today,-35), payment_status: 'paid'    },
]);
if (payErr) { console.error('payments:', payErr.message); process.exit(1); }
console.log('  ✓ payments');

// Step 8: Workouts
const { error: wkErr } = await supabase.from('workouts').insert([
  { trainer_id: t1id, trainee_id: tnIds['trainee1@fitgym.net'], name: 'Full Body Strength A', duration_minutes: 60, notes: 'Focus on form.',
    exercises: [{name:'Squat',sets:'4',reps:'8',weight:'60',notes:'Keep chest up'},{name:'Bench Press',sets:'4',reps:'8',weight:'50',notes:''},{name:'Deadlift',sets:'3',reps:'5',weight:'80',notes:'Brace core'},{name:'Pull-up',sets:'3',reps:'8',weight:'',notes:''},{name:'Plank',sets:'3',reps:'60s',weight:'',notes:''}] },
  { trainer_id: t1id, trainee_id: tnIds['trainee2@fitgym.net'], name: 'Upper Body Power',     duration_minutes: 45, notes: null,
    exercises: [{name:'Overhead Press',sets:'4',reps:'6',weight:'40',notes:''},{name:'Barbell Row',sets:'4',reps:'8',weight:'50',notes:''},{name:'Dips',sets:'3',reps:'10',weight:'',notes:''},{name:'Bicep Curl',sets:'3',reps:'12',weight:'15',notes:''}] },
  { trainer_id: t2id, trainee_id: tnIds['trainee4@fitgym.net'], name: 'Morning Yoga Flow',    duration_minutes: 50, notes: 'Breathe deeply.',
    exercises: [{name:'Sun Salutation',sets:'3',reps:'5',weight:'',notes:'Slow'},{name:'Warrior I',sets:'2',reps:'30s',weight:'',notes:'Each side'},{name:'Warrior II',sets:'2',reps:'30s',weight:'',notes:'Each side'},{name:'Pigeon Pose',sets:'2',reps:'60s',weight:'',notes:''}] },
]);
if (wkErr) { console.error('workouts:', wkErr.message); process.exit(1); }
console.log('  ✓ workouts');

// Step 9: Attendance (14 days)
const attRows = [];
for (const email of Object.keys(tnIds)) {
  for (let d = 0; d < 14; d++) {
    const date = addDays(today, -d);
    const dow = new Date(date).getDay();
    attRows.push({ trainee_id: tnIds[email], date, status: (dow===0||dow===6)?'absent':'present' });
  }
}
const { error: attErr } = await supabase.from('attendance').upsert(attRows, { onConflict: 'trainee_id,date' });
if (attErr) { console.error('attendance:', attErr.message); process.exit(1); }
console.log('  ✓ attendance (14 days × 6 trainees)');

// Step 10: Progress
const progRows = [];
for (const email of Object.keys(tnIds)) {
  for (let w = 0; w < 4; w++) {
    progRows.push({ trainee_id: tnIds[email], weight: (70 + w*0.5).toFixed(1), notes: `Week ${w+1} check-in`, recorded_date: addDays(today,-(w*7)) });
  }
}
const { error: progErr } = await supabase.from('progress').insert(progRows);
if (progErr) { console.error('progress:', progErr.message); process.exit(1); }
console.log('  ✓ progress entries');

// Step 11: Notifications
const { error: notifErr } = await supabase.from('notifications').insert([
  { profile_id: byEmail['trainee1@fitgym.net'], message: 'Welcome to FitGym! Your membership is now active.', is_read: true  },
  { profile_id: byEmail['trainee2@fitgym.net'], message: 'Your trainer has assigned a new workout plan.',     is_read: false },
  { profile_id: byEmail['trainer1@fitgym.net'], message: '3 new trainees have been assigned to you.',         is_read: true  },
]);
if (notifErr) { console.error('notifications:', notifErr.message); process.exit(1); }
console.log('  ✓ notifications');

console.log('\n🎉 All done! Open http://localhost:5173 and log in:');
console.log('  Admin:   admin@fitgym.net    / Admin@123');
console.log('  Trainer: trainer1@fitgym.net / Trainer@123');
console.log('  Trainee: trainee1@fitgym.net / Trainee@123');
