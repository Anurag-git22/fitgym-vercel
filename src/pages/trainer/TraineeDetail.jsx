import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card  from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import GoalCard from '../../components/ui/GoalCard';
import EmptyState from '../../components/ui/EmptyState';
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { Plus } from 'lucide-react';

export default function TrainerTraineeDetail() {
  const { id } = useParams();

  const { data: trainee, loading } = useSupabaseQuery(() =>
    supabase
      .from('trainees')
      .select('*, profiles(name,email,phone,avatar_url,account_status), memberships(*), trainers(profiles(name))')
      .eq('id', id)
      .single(),
  [id]);

  const { data: attendance } = useSupabaseQuery(() =>
    supabase.from('attendance').select('*').eq('trainee_id', id).order('date', { ascending: false }).limit(30),
  [id]);

  const { data: workouts } = useSupabaseQuery(() =>
    supabase.from('workouts').select('*').eq('trainee_id', id).order('created_at', { ascending: false }),
  [id]);

  const { data: progress } = useSupabaseQuery(() =>
    supabase.from('progress').select('*').eq('trainee_id', id).order('recorded_date', { ascending: false }).limit(10),
  [id]);

  const { data: goals, loading: goalsLoading, refetch: refetchGoals } = useSupabaseQuery(() =>
    supabase.from('fitness_goals').select('*').eq('trainee_id', id).order('created_at', { ascending: false }),
  [id]);

  const [goalModal, setGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', target_value: '', current_value: '0', unit: 'kg', target_date: '' });
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalError, setGoalError] = useState('');

  async function submitGoal(e) {
    e.preventDefault(); setGoalBusy(true); setGoalError('');
    const { error: err } = await supabase.from('fitness_goals').insert({
      trainee_id: id,
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

  async function updateGoal(goalId, updates) {
    await supabase.from('fitness_goals').update(updates).eq('id', goalId);
    refetchGoals();
  }

  async function deleteGoal(goalId) {
    await supabase.from('fitness_goals').delete().eq('id', goalId);
    refetchGoals();
  }

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;
  if (!trainee) return <div className="banner banner--error">Trainee not found or access denied.</div>;

  const p = trainee.profiles;
  const activeMembership = trainee.memberships?.find(m => m.status === 'active');

  const presentCount = (attendance ?? []).filter(a => a.status === 'present').length;
  const totalCount   = (attendance ?? []).length;
  const attendancePct = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;

  const attendanceCols = [
    { key: 'date',          label: 'Date' },
    { key: 'status',        label: 'Status',   render: v => <Badge status={v} /> },
    { key: 'check_in_time', label: 'Check-in', render: v => v ? new Date(v).toLocaleTimeString() : '—', hideOnMobile: true },
  ];

  const workoutCols = [
    { key: 'name',             label: 'Name' },
    { key: 'duration_minutes', label: 'Duration',  render: v => v ? `${v} min` : '—' },
    { key: 'created_at',       label: 'Created',   render: v => new Date(v).toLocaleDateString(), hideOnMobile: true },
    { key: 'notes',            label: 'Notes',     render: v => v ?? '—', hideOnMobile: true },
  ];

  const progressCols = [
    { key: 'recorded_date', label: 'Date' },
    { key: 'weight',        label: 'Weight', render: v => v ? `${v} kg` : '—' },
    { key: 'notes',         label: 'Notes',  render: v => v ?? '—', hideOnMobile: true },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/trainer/trainees" className="btn btn-secondary btn-sm">← Back</Link>
          <h2 style={{ margin: 0 }}>{p?.name}</h2>
          <Badge status={p?.account_status} />
        </div>
      </div>

      {/* Profile summary */}
      <div className="detail-grid">
        <Card title="Profile">
          <dl className="detail-dl">
            <dt>Email</dt>    <dd>{p?.email}</dd>
            <dt>Phone</dt>    <dd>{p?.phone ?? '—'}</dd>
            <dt>DOB</dt>      <dd>{trainee.date_of_birth ?? '—'}</dd>
          </dl>
        </Card>

        <Card title="Membership">
          {activeMembership ? (
            <dl className="detail-dl">
              <dt>Plan</dt>   <dd>{activeMembership.plan}</dd>
              <dt>Start</dt>  <dd>{activeMembership.start_date}</dd>
              <dt>End</dt>    <dd>{activeMembership.end_date}</dd>
              <dt>Status</dt> <dd><Badge status={activeMembership.status} /></dd>
            </dl>
          ) : <p style={{ color: '#94a3b8', margin: 0 }}>No active membership.</p>}
        </Card>

        <Card title="Attendance">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1' }}>{attendancePct}%</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Attendance rate</div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#374151' }}>
              <div>{presentCount} present</div>
              <div>{totalCount - presentCount} absent</div>
              <div>{totalCount} total sessions</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Workouts */}
      <Card title="Workout Plans" style={{ marginTop: '1.25rem' }}>
        <Table columns={workoutCols} data={workouts ?? []} emptyMsg="No workouts assigned." />
      </Card>

      {/* Attendance log */}
      <Card title="Attendance Log (last 30)" style={{ marginTop: '1.25rem' }} padding={false}>
        <Table columns={attendanceCols} data={attendance ?? []} emptyMsg="No attendance records." />
      </Card>

      {/* Progress */}
      <Card title="Progress (last 10)" style={{ marginTop: '1.25rem' }} padding={false}>
        <Table columns={progressCols} data={progress ?? []} emptyMsg="No progress entries." />
      </Card>

      {/* Fitness Goals */}
      <Card
        title="Fitness Goals"
        style={{ marginTop: '1.25rem' }}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setGoalModal(true)}>
            <Plus size={14} />
            <span>Add Goal</span>
          </button>
        }
      >
        {goalsLoading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : (goals ?? []).length === 0 ? (
          <EmptyState icon="🎯" title="No fitness goals yet" message="Add a goal to start tracking progress." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {(goals ?? []).map(goal => (
              <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} editable={true} />
            ))}
          </div>
        )}
      </Card>

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
    </div>
  );
}
