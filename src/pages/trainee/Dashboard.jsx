import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import StatCard  from '../../components/ui/StatCard';
import Card      from '../../components/ui/Card';
import Chart     from '../../components/ui/Chart';
import Badge     from '../../components/ui/Badge';
import Modal     from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Plus } from 'lucide-react';
import GoalCard from '../../components/ui/GoalCard';

function calcBMI(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return weight / (h * h);
}

function bmiLabel(bmi) {
  if (bmi == null) return '—';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function bmiColor(bmi) {
  if (bmi == null) return 'var(--text-muted)';
  if (bmi < 18.5) return 'var(--cyan)';
  if (bmi < 25) return 'var(--emerald)';
  if (bmi < 30) return 'var(--amber)';
  return 'var(--rose)';
}

const INIT_FORM = { recorded_date: new Date().toISOString().slice(0,10), weight: '', notes: '' };

export default function TraineeDashboard() {
  const { profile } = useAuth();

  /* Get own trainee row */
  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, trainer_id, trainers(profiles(name))').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  /* Active membership */
  const { data: membership, loading: memLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('memberships')
      .select('*')
      .eq('trainee_id', traineeId)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Attendance summary */
  const { data: attendanceSummary, loading: attLoading } = useSupabaseQuery(async () => {
    if (!traineeId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('trainee_id', traineeId);
    if (error) return { data: null, error };
    const present = data.filter(a => a.status === 'present').length;
    const total   = data.length;
    return { data: { present, total, pct: total ? Math.round((present / total) * 100) : 0 }, error: null };
  }, [traineeId]);

  /* Latest payment */
  const { data: latestPayment, loading: payLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('payments')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Latest workout */
  const { data: latestWorkout, loading: wkLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('workouts')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Progress records */
  const { data: progressRecords, loading: progLoading, refetch: refetchProgress } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('progress')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('recorded_date', { ascending: true });
  }, [traineeId]);

  const latestProgress = (progressRecords ?? []).slice(-1)[0] ?? null;

  /* Fitness goals */
  const { data: goals, loading: goalsLoading, refetch: refetchGoals } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('fitness_goals')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('created_at', { ascending: false });
  }, [traineeId]);

  const [goalModal, setGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', target_value: '', current_value: '0', unit: 'kg', target_date: '' });
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalError, setGoalError] = useState('');

  async function submitGoal(e) {
    e.preventDefault(); setGoalBusy(true); setGoalError('');
    const { error: err } = await supabase.from('fitness_goals').insert({
      trainee_id: traineeId,
      title: goalForm.title,
      target_value: Number(goalForm.target_value),
      current_value: Number(goalForm.current_value),
      unit: goalForm.unit,
      target_date: goalForm.target_date || null,
    });
    setGoalBusy(false);
    if (err) { setGoalError(err.message); return; }
    setGoalModal(false);
    setGoalForm({ title: '', target_value: '', current_value: '0', unit: 'kg', target_date: '' });
    refetchGoals();
  }

  async function updateGoal(id, updates) {
    await supabase.from('fitness_goals').update(updates).eq('id', id);
    refetchGoals();
  }

  async function deleteGoal(id) {
    await supabase.from('fitness_goals').delete().eq('id', id);
    refetchGoals();
  }

  /* Height from profile for BMI */
  const heightCm = profile?.height_cm ?? null;

  /* Days until membership expires */
  const daysLeft = membership?.end_date
    ? Math.max(0, Math.ceil((new Date(membership.end_date) - new Date()) / 86400000))
    : null;

  /* Progress modal */
  const [progressModal, setProgressModal] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function submitProgress(e) {
    e.preventDefault(); setBusy(true); setError(''); setSuccessMsg('');
    const { error: err } = await supabase.from('progress').insert({
      trainee_id: traineeId,
      weight: form.weight ? Number(form.weight) : null,
      notes: form.notes || null,
      recorded_date: form.recorded_date,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    const savedWeight = form.weight ? Number(form.weight) : null;
    const savedBMI = savedWeight && heightCm ? calcBMI(savedWeight, heightCm) : null;
    setSuccessMsg(savedBMI ? `Entry saved! Your BMI is ${Math.round(savedBMI * 10) / 10} (${bmiLabel(savedBMI)})` : 'Entry saved!');
    setProgressModal(false);
    setForm(INIT_FORM);
    refetchProgress();
  }

  /* Charts */
  const weightChart = (progressRecords ?? [])
    .filter(r => r.weight)
    .map(r => ({ name: r.recorded_date, Weight: Number(r.weight) }));

  const bmiChart = (progressRecords ?? [])
    .filter(r => r.weight && heightCm)
    .map(r => ({ name: r.recorded_date, BMI: Math.round(calcBMI(Number(r.weight), heightCm) * 10) / 10 }));

  const latestBMI = latestProgress?.weight ? calcBMI(Number(latestProgress.weight), heightCm) : null;

  const measurements = latestProgress?.measurements ?? {};

  return (
    <div>
      <div className="stat-grid stat-grid--2">
        <StatCard
          label="Membership"
          value={membership ? membership.plan : 'None'}
          icon="🪪"
          color={membership ? 'green' : 'red'}
          loading={memLoading}
        />
        <StatCard
          label="Days Until Expiry"
          value={daysLeft !== null ? daysLeft : '—'}
          icon="📅"
          color={daysLeft !== null && daysLeft < 7 ? 'red' : 'blue'}
          loading={memLoading}
        />
        <StatCard
          label="Attendance Rate"
          value={attendanceSummary ? `${attendanceSummary.pct}%` : '—'}
          icon="📋"
          color="purple"
          loading={attLoading}
        />
        <StatCard
          label="Last Payment"
          value={latestPayment ? `₹${Number(latestPayment.amount).toFixed(2)}` : '—'}
          icon="💳"
          color={latestPayment?.payment_status === 'paid' ? 'green' : 'orange'}
          loading={payLoading}
        />
      </div>

      {/* Body Progress Tracker */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Body Progress Tracker</h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: 0 }}>Track weight, BMI, and body measurements</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setProgressModal(true)}>
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>

        <div className="dashboard-charts">
          {/* Weight Trend */}
          <Card title="Weight Trend" subtitle="Weight over time (kg)" className="chart-card">
            <Chart type="area" data={weightChart} series={[{ key: 'Weight', label: 'Weight (kg)', color: '#6366f1' }]} xKey="name" height={220} loading={progLoading} />
          </Card>

          {/* BMI Trend + Latest Stats */}
          <Card title="BMI & Measurements" subtitle={latestBMI ? `Current BMI: ${latestBMI}` : 'Add weight and height to see BMI'} className="chart-card">
            {bmiChart.length > 0 ? (
              <Chart type="line" data={bmiChart} series={[{ key: 'BMI', label: 'BMI', color: '#06b6d4' }]} xKey="name" height={220} loading={false} />
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {heightCm ? 'Add weight entries to see BMI trend' : 'Set your height in Profile to enable BMI tracking'}
              </div>
            )}

            {latestProgress && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Weight</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{latestProgress.weight ? `${latestProgress.weight} kg` : '—'}</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>BMI</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: latestBMI ? bmiColor(latestBMI) : 'var(--text-primary)' }}>
                    {latestBMI ? `${Math.round(latestBMI * 10) / 10} · ${bmiLabel(latestBMI)}` : '—'}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fitness Goals */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Fitness Goals</h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: 0 }}>Track your fitness targets and milestones</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setGoalModal(true)}>
            <Plus size={14} />
            <span>Add Goal</span>
          </button>
        </div>

        {goalsLoading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : (goals ?? []).length === 0 ? (
          <EmptyState icon="🎯" title="No fitness goals yet" message="Set your first goal to start tracking your progress." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {(goals ?? []).map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={updateGoal}
                onDelete={deleteGoal}
                editable={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <Modal open={goalModal} onClose={() => { setGoalModal(false); setGoalError(''); }} title="Add Fitness Goal" size="sm">
        <form onSubmit={submitGoal} className="auth-form">
          <div className="form-group">
            <label>Goal Title *</label>
            <input required value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Lose 5 kg" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Value *</label>
              <input type="number" step="0.1" required value={goalForm.target_value} onChange={e => setGoalForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Current Progress *</label>
              <input type="number" step="0.1" required value={goalForm.current_value} onChange={e => setGoalForm(f => ({ ...f, current_value: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Unit *</label>
              <select value={goalForm.unit} onChange={e => setGoalForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="kg">kg</option>
                <option value="km">km</option>
                <option value="days">days</option>
                <option value="reps">reps</option>
                <option value="minutes">minutes</option>
                <option value="sessions">sessions</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Date</label>
              <input type="date" value={goalForm.target_date} onChange={e => setGoalForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>
          </div>
          {goalError && <div className="auth-error">{goalError}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setGoalModal(false); setGoalError(''); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={goalBusy}>{goalBusy ? 'Saving…' : 'Add Goal'}</button>
          </div>
        </form>
      </Modal>

      <div className="dashboard-charts" style={{ marginTop: '1.5rem' }}>
        {/* Current workout plan */}
        <Card
          title="Current Workout Plan"
          actions={<Link to="/trainee/workout" className="btn btn-secondary btn-sm">View full</Link>}
        >
          {wkLoading ? (
            <div className="spinner" style={{ margin: '1.5rem auto' }} />
          ) : !latestWorkout ? (
            <EmptyState icon="💪" title="No workout assigned yet" message="Your trainer will assign a plan soon." />
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.4rem' }}>{latestWorkout.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {latestWorkout.duration_minutes ? `${latestWorkout.duration_minutes} min` : ''} · {(latestWorkout.exercises ?? []).length} exercises
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {(latestWorkout.exercises ?? []).slice(0, 4).map((ex, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: '#374151', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#6366f1', fontWeight: 700 }}>{i + 1}.</span>
                    <span>{ex.name}</span>
                    {ex.sets && <span style={{ color: '#94a3b8' }}>{ex.sets}×{ex.reps}</span>}
                  </li>
                ))}
                {(latestWorkout.exercises ?? []).length > 4 && (
                  <li style={{ fontSize: '0.8rem', color: '#94a3b8' }}>+{latestWorkout.exercises.length - 4} more…</li>
                )}
              </ul>
            </div>
          )}
        </Card>

        {/* Trainer info */}
        <Card title="My Trainer">
          {trainee?.trainers?.profiles?.name ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="sidebar-user-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                {trainee.trainers.profiles.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{trainee.trainers.profiles.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Your assigned trainer</div>
              </div>
            </div>
          ) : (
            <EmptyState icon="🏋️" title="No trainer assigned" message="Contact admin to assign a trainer." />
          )}
        </Card>
      </div>

      {/* Add Progress Modal */}
      <Modal open={progressModal} onClose={() => { setProgressModal(false); setSuccessMsg(''); }} title="Log Body Progress" size="md">
        <form onSubmit={submitProgress} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" required value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Weight (kg) *</label>
              <input type="number" step="0.1" required value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="70.5" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setProgressModal(false); setSuccessMsg(''); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Entry'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
