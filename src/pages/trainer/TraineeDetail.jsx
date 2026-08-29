import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card  from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

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
    </div>
  );
}
