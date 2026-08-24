// ============================================================
// FitGym — Fix trigger + create users + seed all data
// Run: node scripts/fix-and-seed.js
// ============================================================
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

async function step2_createUsers() {
  console.log('Creating auth users...');
  const created = [];

  for (const u of USERS) {
    // First insert a temporary profile placeholder so NOT NULL constraints pass
    // We'll update it properly after user creation
    const tempId = crypto.randomUUID();

    const { data, error } = await supabase.auth.admin.createUser({
      email:         u.email,
      password:      u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (error) {
      console.error(`  ✗ ${u.email}: ${error.message} (status: ${error.status})`);
    } else {
      console.log(`  ✓ ${u.email} → ${data.user.id}`);
      created.push({ ...u, id: data.user.id });

      // Immediately insert profile to satisfy FK constraints
      const { error: profErr } = await supabase.from('profiles').upsert({
        id:             data.user.id,
        name:           u.name,
        email:          u.email,
        role:           u.role,
        account_status: 'active',
      });
      if (profErr) console.error(`    profile insert error: ${profErr.message}`);
      else console.log(`    profile inserted`);
    }
  }
  return created;
}

async function step3_upsertProfiles(users) {
  console.log('\nUpserting profiles...');
  for (const u of users) {
    const { error } = await supabase.from('profiles').upsert({
      id:             u.id,
      name:           u.name,
      email:          u.email,
      role:           u.role,
      account_status: 'active',
    });
    if (error) console.error(`  ✗ profile ${u.email}: ${error.message}`);
    else console.log(`  ✓ profile: ${u.email}`);
  }
}

async function step4_seedData(users) {
  console.log('\nSeeding app data...');

  const byEmail = {};
  users.forEach(u => { byEmail[u.email] = u.id; });

  const t1id = crypto.randomUUID();
  const t2id = crypto.randomUUID();

  const { error: trErr } = await supabase.from('trainers').upsert([
    { id: t1id, profile_id: byEmail['trainer1@fitgym.com'], specialization: 'Strength & Conditioning', joining_date: '2023-01-15' },
    { id: t2id, profile_id: byEmail['trainer2@fitgym.com'], specialization: 'Yoga & Flexibility',      joining_date: '2023-03-01' },
  ]);
  if (trErr) { console.error('  ✗ trainers:', trErr.message); return; }
  console.log('  ✓ trainers');

  const tnIds = {};
  const traineeEmails = [
    ['trainee1@fitgym.com', t1id, '1995-04-12'],
    ['trainee2@fitgym.com', t1id, '1998-07-22'],
    ['trainee3@fitgym.com', t1id, '1992-11-03'],
    ['trainee4@fitgym.com', t2id, '2000-02-14'],
    ['trainee5@fitgym.com', t2id, '1997-09-30'],
    ['trainee6@fitgym.com', t2id, '1990-06-18'],
  ];
  const traineeRows = traineeEmails.map(([email, tid, dob]) => {
    const id = crypto.randomUUID();
    tnIds[email] = id;
    return { id, profile_id: byEmail[email], trainer_id: tid, date_of_birth: dob };
  });
  const { error: tnErr } = await supabase.from('trainees').upsert(traineeRows);
  if (tnErr) { console.error('  ✗ trainees:', tnErr.message); return; }
  console.log('  ✓ trainees');

  const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
  const today = new Date().toISOString().slice(0,10);

  const memRows = [
    { trainee_id: tnIds['trainee1@fitgym.com'], plan: 'Monthly',     start_date: addDays(today,-10), end_date: addDays(today,20),  status: 'active'  },
    { trainee_id: tnIds['trainee2@fitgym.com'], plan: 'Quarterly',   start_date: addDays(today,-30), end_date: addDays(today,60),  status: 'active'  },
    { trainee_id: tnIds['trainee3@fitgym.com'], plan: 'Annual',      start_date: addDays(today,-60), end_date: addDays(today,305), status: 'active'  },
    { trainee_id: tnIds['trainee4@fitgym.com'], plan: 'Monthly',     start_date: addDays(today,-5),  end_date: addDays(today,25),  status: 'active'  },
    { trainee_id: tnIds['trainee5@fitgym.com'], plan: 'Semi-Annual', start_date: addDays(today,-90), end_date: addDays(today,90),  status: 'active'  },
    { trainee_id: tnIds['trainee6@fitgym.com'], plan: 'Monthly',     start_date: addDays(today,-35), end_date: addDays(today,-5),  status: 'expired' },
  ];
  const { error: memErr } = await supabase.from('memberships').insert(memRows);
  if (memErr) { console.error('  ✗ memberships:', memErr.message); return; }
  console.log('  ✓ memberships');

  const payRows = [
    { trainee_id: tnIds['trainee1@fitgym.com'], amount: 50,  payment_date: addDays(today,-10), payment_status: 'paid'    },
    { trainee_id: tnIds['trainee2@fitgym.com'], amount: 120, payment_date: addDays(today,-30), payment_status: 'paid'    },
    { trainee_id: tnIds['trainee3@fitgym.com'], amount: 480, payment_date: addDays(today,-60), payment_status: 'paid'    },
    { trainee_id: tnIds['trainee4@fitgym.com'], amount: 50,  payment_date: addDays(today,-5),  payment_status: 'pending' },
    { trainee_id: tnIds['trainee5@fitgym.com'], amount: 240, payment_date: addDays(today,-90), payment_status: 'paid'    },
    { trainee_id: tnIds['trainee6@fitgym.com'], amount: 50,  payment_date: addDays(today,-35), payment_status: 'paid'    },
  ];
  const { error: payErr } = await supabase.from('payments').insert(payRows);
  if (payErr) { console.error('  ✗ payments:', payErr.message); return; }
  console.log('  ✓ payments');

  const workoutRows = [
    { trainer_id: t1id, trainee_id: tnIds['trainee1@fitgym.com'], name: 'Full Body Strength A', duration_minutes: 60,
      exercises: [{name:'Squat',sets:'4',reps:'8',weight:'60',notes:'Keep chest up'},{name:'Bench Press',sets:'4',reps:'8',weight:'50',notes:''},{name:'Deadlift',sets:'3',reps:'5',weight:'80',notes:'Brace core'},{name:'Pull-up',sets:'3',reps:'8',weight:'',notes:''},{name:'Plank',sets:'3',reps:'60s',weight:'',notes:''}],
      notes: 'Focus on form over weight.' },
    { trainer_id: t1id, trainee_id: tnIds['trainee2@fitgym.com'], name: 'Upper Body Power', duration_minutes: 45,
      exercises: [{name:'Overhead Press',sets:'4',reps:'6',weight:'40',notes:''},{name:'Barbell Row',sets:'4',reps:'8',weight:'50',notes:''},{name:'Dips',sets:'3',reps:'10',weight:'',notes:''},{name:'Bicep Curl',sets:'3',reps:'12',weight:'15',notes:''}],
      notes: null },
    { trainer_id: t2id, trainee_id: tnIds['trainee4@fitgym.com'], name: 'Morning Yoga Flow', duration_minutes: 50,
      exercises: [{name:'Sun Salutation',sets:'3',reps:'5',weight:'',notes:'Slow'},{name:'Warrior I',sets:'2',reps:'30s',weight:'',notes:'Each side'},{name:'Warrior II',sets:'2',reps:'30s',weight:'',notes:'Each side'},{name:'Pigeon Pose',sets:'2',reps:'60s',weight:'',notes:''}],
      notes: 'Breathe deeply.' },
  ];
  const { error: wkErr } = await supabase.from('workouts').insert(workoutRows);
  if (wkErr) { console.error('  ✗ workouts:', wkErr.message); return; }
  console.log('  ✓ workouts');

  const attRows = [];
  for (const email of Object.keys(tnIds)) {
    for (let d = 0; d < 14; d++) {
      const date = addDays(today, -d);
      const dow  = new Date(date).getDay();
      attRows.push({ trainee_id: tnIds[email], date, status: (dow===0||dow===6)?'absent':'present' });
    }
  }
  const { error: attErr } = await supabase.from('attendance').upsert(attRows, { onConflict: 'trainee_id,date' });
  if (attErr) { console.error('  ✗ attendance:', attErr.message); return; }
  console.log('  ✓ attendance');

  const progRows = [];
  for (const email of Object.keys(tnIds)) {
    for (let w = 0; w < 4; w++) {
      progRows.push({ trainee_id: tnIds[email], weight: (70 + w*0.5).toFixed(1), notes: `Week ${w+1} check-in`, recorded_date: addDays(today,-(w*7)) });
    }
  }
  const { error: progErr } = await supabase.from('progress').insert(progRows);
  if (progErr) { console.error('  ✗ progress:', progErr.message); return; }
  console.log('  ✓ progress');

  const notifRows = [
    { profile_id: byEmail['trainee1@fitgym.com'], message: 'Welcome to FitGym! Your membership is now active.', is_read: true  },
    { profile_id: byEmail['trainee2@fitgym.com'], message: 'Your trainer has assigned a new workout plan.',     is_read: false },
    { profile_id: byEmail['trainer1@fitgym.com'], message: '3 new trainees have been assigned to you.',         is_read: true  },
  ];
  const { error: notifErr } = await supabase.from('notifications').insert(notifRows);
  if (notifErr) { console.error('  ✗ notifications:', notifErr.message); return; }
  console.log('  ✓ notifications');

  console.log('\n🎉 All done!');
  console.log('  Admin:   admin@fitgym.com    / Admin@123');
  console.log('  Trainer: trainer1@fitgym.com / Trainer@123');
  console.log('  Trainee: trainee1@fitgym.com / Trainee@123');
}

async function main() {
  const users = await step2_createUsers();
  if (!users.length) {
    console.error('\nNo users created. Check errors above.');
    process.exit(1);
  }
  await step3_upsertProfiles(users);
  await step4_seedData(users);
}

main().catch(console.error);
